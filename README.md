# NexMarga

NexMarga is an AI-powered career companion that helps candidates understand and improve their job readiness. Upload a PDF resume to receive ATS-focused feedback, compare it against a job description, and generate a focused interview-preparation plan.

## Features

- **Resume analysis** — assesses a PDF resume for ATS readiness, strengths, weaknesses, missing skills, and practical improvements.
- **Skill-gap analysis** — compares a resume with a job description and identifies matching skills, gaps, missing ATS keywords, and recommended learning areas.
- **Interview preparation** — creates tailored technical, project, HR, behavioural, and system-design preparation guidance, plus a seven-day study plan.
- **Polished dashboard** — responsive Next.js interface built with TypeScript, Tailwind CSS, Radix UI, and Framer Motion.
- **Reliable AI integration** — FastAPI service layer with input validation, typed responses, CORS configuration, and retry handling for temporary Gemini API failures.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic, Uvicorn |
| AI | Google Gemini API (`google-genai`) |
| Resume parsing | PyPDF |

## Project structure

```text
NexMarga/
├── backend/                 # FastAPI API and AI agents
│   ├── app/
│   │   ├── agents/          # Resume, skill-gap, and interview agents
│   │   ├── routes/          # API endpoints
│   │   └── services/        # Gemini and application services
│   ├── .env.example         # Backend environment template
│   └── requirements.txt
├── frontend/                # Next.js application
│   ├── app/                 # Pages and layouts
│   ├── components/          # UI and feature components
│   ├── .env.example         # Frontend environment template
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18.18+ (or Node.js 20+ recommended)
- Python 3.10+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/Spandana2012/NexMarga.git
cd NexMarga
```

### 2. Start the backend

In one terminal:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source venv/bin/activate
```

Install dependencies and create your local configuration:

```bash
pip install -r requirements.txt
copy .env.example .env        # Windows Command Prompt
# cp .env.example .env        # macOS/Linux
```

Set `GEMINI_API_KEY` in `backend/.env`, then start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will run at `http://127.0.0.1:8000`. Check it at `http://127.0.0.1:8000/health` and explore interactive API documentation at `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
copy .env.example .env.local  # Windows Command Prompt
# cp .env.example .env.local  # macOS/Linux
npm run dev
```

Open `http://localhost:3000` in your browser.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `POST` | `/analyze-resume` | Analyze one PDF resume (`file`) |
| `POST` | `/skill-gap-analysis` | Compare resume (`resume_file`) with a job description (`job_description`) |
| `POST` | `/interview-preparation` | Generate interview prep from resume, job description, and experience level |

## Configuration

`backend/.env` is intentionally excluded from Git because it contains private configuration. Copy `backend/.env.example` to `backend/.env` and set your own Gemini API key. The frontend uses `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://127.0.0.1:8000`.

## Useful commands

```bash
# Frontend production build
cd frontend && npm run build

# Run the backend without reload mode
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Security note

Never commit API keys, `.env` files, uploaded resumes, virtual environments, or `node_modules`. This repository’s `.gitignore` excludes them by default.
