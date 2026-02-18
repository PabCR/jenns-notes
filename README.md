# Jenns Notes

A web application for oncology nurses to manage and share patient educational resources.

## Project Structure

```
.
├── client/          # React + TypeScript + Vite frontend
├── server/          # FastAPI backend
├── shared/          # Shared TypeScript types
```

## Documentation

- Detailed references live under `docs/` (file organization, patterns, PRD, tech stack, implementation plan).
- Historical/stale notes are archived in `docs/archive/`.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- Supabase account
- Google Gemini API key

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend will run on http://localhost:5173

### Backend Setup

```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase and API keys
uvicorn app.main:app --reload
```

Backend will run on http://localhost:8000

### Environment Variables

Environment variable templates are provided:
- Root `.env.example` - Complete reference with all variables documented
- `client/.env.example` - Frontend-specific template (Vite variables)
- `server/.env.example` - Backend-specific template (FastAPI variables)

Copy the appropriate `.env.example` files to `.env` and fill in your actual values:
```bash
# Backend
cd server && cp .env.example .env

# Frontend  
cd client && cp .env.example .env
```

## Development

Follow the vertical implementation plan in `docs/implementation-plan.md` to build features incrementally. Automated test suites have been removed per project requirements; rely on build + lint for quick checks.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python, SQLAlchemy, Alembic
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **AI**: Google Gemini API

## License

[Your License Here]
