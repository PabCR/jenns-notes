# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jenns Notes - a web app for oncology nurses to manage and share patient educational resources (notes, PDFs, links). Separate frontend (client/) and backend (server/) directories with PostgreSQL via Supabase.

## Commands

### Frontend (client/)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint validation
```

### Backend (server/)
```bash
# Setup
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload  # http://localhost:8000

# Migrations
alembic upgrade head           # Apply all migrations
alembic revision -m "desc"     # Create new migration
```

## Architecture

```
Client (React + Vite + TypeScript)
  └── src/
      ├── pages/         # Feature-organized pages (auth/, home/, upload/, packets/)
      ├── components/    # Shared UI (ui/ = shadcn, PDFViewer, etc.)
      ├── contexts/      # AuthContext for Supabase session
      ├── hooks/         # Custom hooks (useDebouncedValue)
      └── lib/api/       # API client functions by domain (resources.ts, packets.ts, objects.ts)

Backend (FastAPI + SQLAlchemy)
  └── app/
      ├── routes/        # Thin route handlers (resources.py, objects.py, packets.py)
      ├── services/      # Business logic layer (resource_service.py, packet_service.py)
      ├── models/        # SQLAlchemy ORM models
      ├── schemas/       # Pydantic request/response validation
      └── utils/         # auth.py (JWT), supabase.py, gemini.py
```

**Key patterns:**
- Routes are thin - validation + wiring only; business logic lives in services/
- Frontend uses feature folders: each page has its own components/, hooks, and state helpers
- API client split by domain in `lib/api/` with shared auth helpers in `client.ts`

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router DOM
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy (async), Alembic migrations
- **Database:** PostgreSQL via Supabase with Row-Level Security
- **Auth:** Supabase Auth (JWT) - frontend via AuthContext, backend validates in `utils/auth.py`
- **Storage:** Supabase Storage for PDFs
- **AI:** Google Gemini API for auto-tagging resources

## Key Conventions

From `.cursor/rules/rules.mdc`:

1. **Reference official docs** - Check `docs/tech-stack.md` for technologies, use official documentation patterns over custom abstractions
2. **Minimal-code discipline** - Favor smallest implementation, avoid unnecessary abstractions/helpers/types
3. **Keep docs in sync** - Update `docs/implementation-plan.md` when implementation changes

## Database

Main tables: `resources` (PDF/link/note with tags, condition, audience, topic), `packets` (resource collections with sharing), `user_resource_favorites` (favorites join table).

Migrations in `server/alembic/versions/`.

## Environment Variables

Templates provided at `client/.env.example` and `server/.env.example`. Key vars:
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`

## Deployment

- Frontend: Vercel (auto-deploy from Git)
- Backend: Fly.io (Docker, `fly.toml` config)
