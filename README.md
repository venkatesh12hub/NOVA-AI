# NOVA AI 🤖

NOVA AI is a full-stack AI chat application built using React, Vite, FastAPI, and the Groq Cloud API. It provides streaming AI responses through a web-based chat interface, along with image analysis, file uploads, and voice input features.

## Features

- **AI Chat:** Interact with an AI assistant powered by Groq Cloud.
- **Streaming Responses:** Display AI responses as they are generated.
- **Image Analysis:** Upload supported images for AI-powered analysis.
- **File and Folder Upload:** Upload supported documents, code files, and project folders for analysis.
- **Voice Input:** Use browser-supported speech recognition.
- **Chat History:** Maintain chat sessions in server memory.
- **REST API:** FastAPI endpoints for chat and related operations.
- **Responsive Interface:** React and Vite-based frontend.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- HTML and CSS

### Backend
- Python
- FastAPI
- Uvicorn
- Groq Cloud API

## Project Structure

```text
NOVA-AI/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── render.yaml
├── .gitignore
└── README.md
```

*Note: This is an illustrative structure. Your actual folders and files may differ.*

## Requirements

Install the following before running the project:

- Node.js 20 or later
- npm
- Python 3.11 or later
- A Groq API key

## Installation and Setup

### 1. Clone the Repository

```powershell
git clone https://github.com/venkatesh12hub/NOVA-AI.git
cd NOVA-AI
```

### 2. Configure the Backend

Open a PowerShell terminal:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=your_actual_groq_api_key
```

Install the backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the backend:

```powershell
python main.py
```

Keep this terminal running.

### 3. Configure the Frontend

Open a second PowerShell terminal from the project root:

```powershell
cd frontend
Copy-Item .env.example .env
```

Configure `VITE_API_URL` in `frontend/.env` to match your backend API address. For local development, this may be:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Install the frontend dependencies and start the development server:

```powershell
npm.cmd install
npm.cmd run dev
```

### 4. Open the Application

Open the frontend in your browser:

http://localhost:5173

FastAPI documentation, if enabled:

http://127.0.0.1:8000/docs

Backend health endpoint, if implemented:

http://127.0.0.1:8000/health

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Backend | Authenticates requests to Groq Cloud. |
| `GROQ_MODEL` | Backend, if supported | Selects the configured AI model. |
| `CORS_ORIGINS` | Backend, if supported | Configures allowed frontend origins. |
| `VITE_API_URL` | Frontend | Specifies the backend API URL. |
| `PORT` | Deployment environment, if supported | Configures the server port. |

**Security:** Never expose your Groq API key in frontend code or commit your real `.env` files to GitHub. Keep only placeholder values in `.env.example`.

## API Testing

You can test available backend endpoints using the FastAPI Swagger interface or Postman.

If implemented in your backend, endpoints may include:

- `GET /health` — check backend health.
- `POST /chat` — send a chat message.
- `GET /chat/history` — retrieve chat history.
- `DELETE /chat/clear` — clear a chat session.
- `POST /chat/upload` — upload supported files.
- `POST /chat/image` — submit an image for analysis.

Check your actual FastAPI routes for the supported request formats and endpoint behavior.

## Deployment

### Backend

Deploy the FastAPI application to a Python-compatible hosting service, such as Render. Configure the required environment variables in the hosting dashboard and use the appropriate start command for your application.

### Frontend

Build the React application:

```powershell
npm.cmd run build
```

Deploy the generated `dist` directory to a static hosting provider, such as GitHub Pages, if your project is configured for it.

Set `VITE_API_URL` to the deployed backend URL when building the frontend. Configure backend CORS settings to allow requests from the deployed frontend origin.

Deployment requires the relevant hosting configuration and workflow; pushing code to GitHub does not automatically deploy the application.

## Troubleshooting

**Backend is not responding**
- Confirm that the backend server is running.
- Check that `VITE_API_URL` points to the correct backend URL.

**Groq API authentication error**
- Verify that `GROQ_API_KEY` is valid.
- Check the backend environment configuration.
- Restart the backend after changing environment variables.

**CORS error**
- Configure the backend to allow the exact frontend origin.
- Restart the backend after updating CORS settings.

**Frontend dependency errors**
- Run `npm.cmd install` from the `frontend` directory.

**AI model or rate-limit errors**
- Check the configured Groq model and your account's current API limits.

## Important Notes

- Chat history stored only in server memory may be lost when the backend restarts.
- Image and file analysis depend on the backend implementation and the capabilities of the configured model.
- Supported file types, API routes, and deployment settings depend on the actual project configuration.

## Author

**Venkatesh**

GitHub: https://github.com/venkatesh12hub

---

⭐ If you find this project useful, consider giving the repository a star.
