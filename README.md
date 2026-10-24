<<<<<<< HEAD
# NOVA AI

NOVA AI is a React/Vite chat interface backed by FastAPI and the Groq Cloud Chat Completions API. It streams answers as they are generated and keeps each browser chat in its own in-memory server session.

## Requirements

- Node.js 20+ and npm
- Python 3.11+
- A Groq API key

## Local development on Windows PowerShell

Start the backend in one PowerShell window:

```powershell
cd backend
Copy-Item .env.example .env
# Open .env and replace gsk_your_groq_key_here with your new key.
python -m pip install -r requirements.txt
python main.py
```

Start the frontend in a second PowerShell window:

```powershell
cd frontend
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`. API documentation is at `http://127.0.0.1:8000/docs`; the health check is at `http://127.0.0.1:8000/health`.

## Environment variables

Backend variables belong in Render's Environment settings or the process environment, never in the frontend:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Groq Cloud credential. |
| `GROQ_MODEL` | No | Defaults to `qwen/qwen3.8-27b` (or other models enabled on your Groq account). |
| `CORS_ORIGINS` | No | Comma-separated frontend origins. |
| `PORT` | Render only | Supplied by Render automatically. |

The frontend only receives `VITE_API_URL`, the public backend URL. Copy `frontend/.env.example` to `frontend/.env` locally. Do not put `GROQ_API_KEY` in a Vite variable.

## Deployment

The backend includes `backend/render.yaml`; create a Render Web Service with `backend` as its root directory or use the blueprint from that folder. Set `GROQ_API_KEY` in Render and add the GitHub Pages domain to `CORS_ORIGINS`.

For GitHub Pages, build with `VITE_API_URL` set to the Render URL and `VITE_BASE_PATH` set to the repository path, such as `/nova-ai/`. Upload `frontend/dist` via your GitHub Pages workflow. This repository does not automatically publish deployments.

## Multimodal vision, file/folder analysis, and voice features

- **Image Analysis**: Full multimodal visual understanding is enabled out of the box using Groq (`qwen/qwen3.8-27b`). Upload screenshots, photos, diagrams, and documents (PNG, JPG, WEBP, GIF) directly in chat.
- **File & Folder Upload**: Upload any individual files (PDFs, code, Markdown, JSON, CSV, text) or entire project folders. NOVA AI parses file hierarchies, extracts PDF and code contents, and answers questions about them.
- **Drag & Drop**: Drag files and folders directly onto the chat interface.
- **Voice Input**: Web Speech API input is available in supported browsers (Chrome, Edge, Safari).

## Troubleshooting

- “Backend is offline”: confirm `python main.py` is running and `VITE_API_URL` points to it.
- “Missing GROQ_API_KEY”: set the key in the backend terminal or Render environment, then restart the backend.
- CORS failure: add the exact frontend origin to `CORS_ORIGINS`, restart the API, and refresh the browser.
- Conversations are kept in memory and are cleared when the server restarts. Use Redis or a database before relying on history in production.
=======
# NOVA-AI
Full-stack NOVA AI application built with React, Vite, FastAPI, and Groq
>>>>>>> 54ce28b7b56e089717238d62115ad8d973076a96
