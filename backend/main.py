"""NOVA AI cloud backend: FastAPI -> Groq Chat Completions API with Multimodal Vision & File/Folder Analysis."""
import base64
from collections import defaultdict
from collections.abc import AsyncIterator
import io
import json
import logging
import os
from pathlib import Path
import re
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import httpx
import pypdf
from pydantic import BaseModel, Field

# Load only backend/.env. Existing process environment values still take priority.
load_dotenv(Path(__file__).with_name(".env"))
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(levelname)s: %(message)s")
logger = logging.getLogger("nova-ai")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH = 24, 20_000
SESSION_PATTERN = re.compile(r"^[A-Za-z0-9_-]{8,128}$")

origins = [
    item.strip().rstrip("/")
    for item in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if item.strip()
]

app = FastAPI(title="NOVA AI API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

conversations: dict[str, list[dict[str, Any]]] = defaultdict(list)
SYSTEM_PROMPT = (
    "You are NOVA AI, a highly capable, intelligent, and articulate general-purpose AI assistant. "
    "You assist with science, mathematics, programming, technology, theory, analysis, creative and professional writing, and everyday inquiries.\n\n"
    "Core Principles:\n"
    "1. Direct & Concise: Answer the user's question directly first. Provide supporting explanations only when useful or requested. Avoid conversational filler, empty pleasantries, and unnecessary introductions or repetitive conclusions.\n"
    "2. Calibrated Depth: Adapt response length to question complexity. Give short, punchy answers to simple questions, and structured, thorough explanations to complex problems.\n"
    "3. Mathematics & Science: Present equations using standard LaTeX notation ($...$ for inline and $$...$$ for display blocks). Show essential calculation steps clearly followed by the final answer.\n"
    "4. Code & Technical: When writing code, provide clean, complete, runnable code in markdown code blocks with the exact language identifier, accompanied by concise notes explaining key decisions. Do not force everyday questions into technical formats.\n"
    "5. Documents & Vision: When analyzing attached files, folders, or images, provide precise, insightful observations referencing the user's data.\n"
    "6. Tone: Helpful, objective, knowledgeable, and efficient."
)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
BINARY_EXTENSIONS = {
    ".exe", ".dll", ".so", ".dylib", ".bin", ".iso", ".zip", ".tar",
    ".gz", ".7z", ".rar", ".mp3", ".wav", ".mp4", ".avi", ".mov",
    ".pyc", ".class", ".o", ".obj"
}

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)
    session_id: str = Field(min_length=8, max_length=128)

    def validated_session_id(self) -> str:
        if not SESSION_PATTERN.fullmatch(self.session_id):
            raise HTTPException(status_code=422, detail="Invalid session id.")
        return self.session_id

def sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

def public_error(status: int, detail: str = "") -> str:
    if status == 401:
        return "The AI service rejected the credentials. Check GROQ_API_KEY in backend/.env."
    if status == 404:
        return f"The model '{GROQ_MODEL}' is not available on this Groq account. Check GROQ_MODEL in backend/.env."
    if status == 429:
        return "Groq API rate limit reached. Please wait a few moments before trying again, or check your rate limits at console.groq.com."
    if status == 413 or "context" in detail.lower() or "too large" in detail.lower() or "maximum context length" in detail.lower():
        return "The request or conversation history exceeds the model context window. Please start a new chat."
    if 400 <= status < 500:
        return f"AI request error: {detail}" if detail else "The AI service could not process this request."
    return "The AI service is temporarily unavailable. Please try again shortly."

def extract_file_content(filename: str, data: bytes) -> dict[str, Any]:
    """Parse text, extract PDF pages, or base64 encode images for multimodal analysis."""
    ext = Path(filename).suffix.lower()
    size = len(data)

    if ext in IMAGE_EXTENSIONS:
        b64 = base64.b64encode(data).decode("utf-8")
        mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else f"image/{ext[1:]}"
        return {
            "type": "image",
            "filename": filename,
            "data_url": f"data:{mime};base64,{b64}",
            "size": size,
        }

    if ext == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(data))
            pages = []
            for i, page in enumerate(reader.pages[:60]):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages.append(f"--- Page {i+1} ---\n{txt}")
            content = "\n\n".join(pages) if pages else "[PDF contains no extractable text]"
            if len(content) > 40_000:
                content = content[:40_000] + "\n\n[... Truncated for token limit ...]"
            return {"type": "pdf", "filename": filename, "text": content, "size": size}
        except Exception as e:
            return {"type": "pdf", "filename": filename, "text": f"[Error reading PDF: {e}]", "size": size}

    if ext in BINARY_EXTENSIONS:
        return {"type": "binary", "filename": filename, "text": f"[Binary file: {filename} ({size} bytes)]", "size": size}

    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = data.decode("latin-1")
        except Exception:
            return {"type": "binary", "filename": filename, "text": f"[Binary file: {filename} ({size} bytes)]", "size": size}

    if len(text) > 40_000:
        text = text[:40_000] + "\n\n[... Content truncated to 40,000 characters ...]"
    return {"type": "text", "filename": filename, "text": text, "size": size}

@app.get("/health")
@app.get("/ping")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "provider": "groq",
        "model": GROQ_MODEL,
        "configured": bool(os.getenv("GROQ_API_KEY")),
        "supports_images": True,
        "supports_files": True,
    }

async def stream_groq_completion(session_id: str, groq_user_content: Any, history_user_summary: str) -> AsyncIterator[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        yield sse({"error": "The server is missing GROQ_API_KEY. Add it to backend/.env and restart the API.", "done": True})
        return

    history = conversations[session_id]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": groq_user_content},
    ]

    max_tokens = int(os.getenv("MAX_COMPLETION_TOKENS", "4096"))
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": 0.6,
        "max_tokens": max_tokens,
    }

    answer = ""
    try:
        timeout = httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    detail_str = ""
                    try:
                        err_json = await response.aread()
                        parsed = json.loads(err_json)
                        if "error" in parsed and "message" in parsed["error"]:
                            detail_str = parsed["error"]["message"]
                    except Exception:
                        pass
                    err_msg = public_error(response.status_code, detail_str)
                    logger.warning("Groq returned HTTP %s: %s", response.status_code, err_msg)
                    yield sse({"error": err_msg, "done": True})
                    return

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:]
                    if raw == "[DONE]":
                        break
                    try:
                        delta = json.loads(raw).get("choices", [{}])[0].get("delta", {})
                        chunk = delta.get("content")
                        if not chunk and delta.get("reasoning"):
                            # Handle reasoning tokens if present
                            chunk = delta.get("reasoning")
                    except (json.JSONDecodeError, IndexError, AttributeError, TypeError):
                        continue

                    if isinstance(chunk, str) and chunk:
                        answer += chunk
                        yield sse({"chunk": chunk, "done": False})

        if not answer:
            yield sse({"error": "The AI service returned an empty response. Please try again.", "done": True})
            return

        # Add to history
        history.append({"role": "user", "content": history_user_summary})
        history.append({"role": "assistant", "content": answer})
        if len(history) > MAX_HISTORY_MESSAGES:
            del history[:-MAX_HISTORY_MESSAGES]

        yield sse({"done": True})

    except (httpx.TimeoutException, httpx.NetworkError):
        logger.warning("Groq connection failed")
        yield sse({"error": "Could not reach the AI service. Check your connection and try again.", "done": True})
    except Exception:
        logger.exception("Unexpected chat error")
        yield sse({"error": "An unexpected server error occurred. Please try again.", "done": True})

@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    session_id = request.validated_session_id()
    msg = request.message.strip()
    return StreamingResponse(
        stream_groq_completion(session_id, msg, msg),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/chat/upload")
async def chat_upload(
    message: str = Form(""),
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
    paths: list[str] = Form([]),
) -> StreamingResponse:
    if not SESSION_PATTERN.fullmatch(session_id):
        raise HTTPException(status_code=422, detail="Invalid session id.")

    user_text = message.strip()
    if not user_text:
        user_text = "Please analyze the uploaded file(s) / folder, summarize their contents, and provide insights."

    images = []
    file_docs = []
    file_list = []

    for idx, uploaded in enumerate(files):
        filename = (paths[idx] if idx < len(paths) and paths[idx] else uploaded.filename) or f"file_{idx+1}"
        file_list.append(filename)
        data = await uploaded.read()
        res = extract_file_content(filename, data)

        if res["type"] == "image":
            images.append(res)
        else:
            file_docs.append(f"--- File: {filename} ---\n{res.get('text', '')}\n")

    # Build prompt
    prompt_parts = []
    if len(file_list) > 1:
        tree = "\n".join(f"  - {f}" for f in file_list)
        prompt_parts.append(f"Uploaded Files & Directory Structure ({len(file_list)} items):\n{tree}\n")

    if file_docs:
        total_len = 0
        prompt_parts.append("=== Uploaded File Contents ===")
        for doc in file_docs:
            if total_len + len(doc) > 90_000:
                prompt_parts.append("\n[Remaining file contents omitted to stay within context limits. File structure above lists all files.]")
                break
            prompt_parts.append(doc)
            total_len += len(doc)
        prompt_parts.append("=============================\n")

    prompt_parts.append(f"User Request / Question:\n{user_text}")
    full_text_prompt = "\n".join(prompt_parts)

    # Build Groq content
    if images:
        groq_user_content = [{"type": "text", "text": full_text_prompt}]
        for img in images:
            groq_user_content.append({"type": "image_url", "image_url": {"url": img["data_url"]}})
        summary_text = f"{user_text} [Attached: {len(images)} image(s), {len(file_docs)} file(s)]"
    else:
        groq_user_content = full_text_prompt
        summary_text = f"{user_text} [Attached: {len(file_docs)} file(s)]"

    return StreamingResponse(
        stream_groq_completion(session_id, groq_user_content, summary_text),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@app.post("/chat/image")
async def chat_image(
    message: str = Form(""),
    session_id: str = Form("default"),
    image: UploadFile = File(...),
) -> StreamingResponse:
    """Backward compatible endpoint for single image upload."""
    return await chat_upload(
        message=message,
        session_id=session_id if SESSION_PATTERN.fullmatch(session_id) else "nova_default_session",
        files=[image],
        paths=[image.filename or "image.png"],
    )

@app.delete("/chat/clear")
async def clear_chat(session_id: str) -> dict[str, str]:
    if not SESSION_PATTERN.fullmatch(session_id):
        raise HTTPException(status_code=422, detail="Invalid session id.")
    conversations.pop(session_id, None)
    return {"status": "cleared"}

@app.get("/chat/history")
async def get_history(session_id: str) -> dict[str, list[dict[str, str]]]:
    if not SESSION_PATTERN.fullmatch(session_id):
        raise HTTPException(status_code=422, detail="Invalid session id.")
    return {"history": conversations.get(session_id, [])}

@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
