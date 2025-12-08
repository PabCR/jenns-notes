# Technology Stack Reference
## Nurse Resource Binder
## Development Principles

**Optimize For:**
- Maintainability over cleverness
- Explicit over implicit
- Type safety over flexibility
- Official patterns over custom solutions

**When In Doubt:**
- Follow framework conventions (FastAPI/React defaults)
- Use official examples from documentation
- Prefer library features over custom code
- Ask for clarification rather than assume
---

## Frontend Deployment

### Vercel
**What it is:** Cloud platform for deploying web applications with global CDN

**How it's used:** Hosts and serves the React application to users worldwide

**Implementation reference:**
- Vercel Documentation: https://vercel.com/docs
- Automatic deployments from Git repositories
- Zero-configuration React/Vite builds
- Environment variable management in dashboard

---

## Frontend Application

### React
**What it is:** JavaScript library for building user interfaces using components

**How it's used:** Creates all UI components (pages, forms, cards, navigation)

**Implementation reference:**
- Official React Documentation: https://react.dev
- Component patterns and hooks
- Client-side routing for navigation

### TypeScript
**What it is:** JavaScript with static type checking

**How it's used:** Defines types for all data structures, catches errors during development

**Implementation reference:**
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Type definitions for props, state, API responses
- Integration with React components

### Vite
**What it is:** Build tool and development server

**How it's used:** Compiles TypeScript and React into optimized production files

**Implementation reference:**
- Vite Documentation: https://vitejs.dev
- Configuration for React + TypeScript
- Build commands for production deployment

### Tailwind CSS
**What it is:** Utility-first CSS framework

**How it's used:** Styles all UI components using utility classes

**Implementation reference:**
- Tailwind Documentation: https://tailwindcss.com/docs
- Configuration file for custom theme
- Responsive design utilities

### shadcn/ui
**What it is:** Collection of pre-built, accessible React components

**How it's used:** Provides buttons, forms, dialogs, cards, and other UI primitives

**Implementation reference:**
- shadcn/ui Documentation: https://ui.shadcn.com
- Component installation via CLI
- Built on Radix UI primitives

---

## Backend Deployment

### Fly.io
**What it is:** Platform for running containerized applications

**How it's used:** Hosts and runs the FastAPI backend application

**Implementation reference:**
- Fly.io Documentation: https://fly.io/docs
- Docker container deployment
- Configuration via fly.toml file
- Environment secrets management

### Docker
**What it is:** Containerization platform

**How it's used:** Packages FastAPI application with dependencies into deployable container

**Implementation reference:**
- Docker Documentation: https://docs.docker.com
- Dockerfile for Python applications
- Multi-stage builds for optimization

---

## Backend Application

### FastAPI
**What it is:** Modern Python web framework for building APIs

**How it's used:** Defines all API endpoints, handles requests, executes business logic

**Implementation reference:**
- FastAPI Documentation: https://fastapi.tiangolo.com
- Route decorators for endpoints
- Dependency injection system
- Automatic OpenAPI documentation

### Pydantic
**What it is:** Data validation library using Python type hints

**How it's used:** Validates all API request and response data structures

**Implementation reference:**
- Pydantic Documentation: https://docs.pydantic.dev
- BaseModel for schema definitions
- Automatic validation and serialization

### SQLAlchemy
**What it is:** SQL toolkit and Object-Relational Mapper (ORM) for Python

**How it's used:** Defines database models, executes queries, manages relationships

**Implementation reference:**
- SQLAlchemy Documentation: https://docs.sqlalchemy.org
- Declarative models
- Async support with asyncpg

### Alembic
**What it is:** Database migration tool for SQLAlchemy

**How it's used:** Manages database schema changes and versioning

**Implementation reference:**
- Alembic Documentation: https://alembic.sqlalchemy.org
- Auto-generate migrations from model changes
- Upgrade and downgrade commands

---

## Database, Authentication & Storage

### Supabase
**What it is:** Open-source Firebase alternative providing database, auth, and storage

**How it's used:** Provides all backend data services in one platform

**Implementation reference:**
- Supabase Documentation: https://supabase.com/docs
- Three separate projects (dev and production environments)

### PostgreSQL (via Supabase)
**What it is:** Relational database management system

**How it's used:** Stores all application data (resources, packets, users, history)

**Implementation reference:**
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Supabase-specific features: Row Level Security (RLS)
- Connection via Supabase connection string

### Supabase Auth
**What it is:** Authentication service with JWT token management

**How it's used:** Handles user registration, login, token generation and validation

**Implementation reference:**
- Supabase Auth Documentation: https://supabase.com/docs/guides/auth
- Email/password authentication
- JWT token validation in FastAPI
- Role-based access control

### Supabase Storage
**What it is:** Object storage service for files

**How it's used:** Stores uploaded PDF files with access control

**Implementation reference:**
- Supabase Storage Documentation: https://supabase.com/docs/guides/storage
- Presigned URLs for uploads
- Bucket policies for access control
- Integration with Supabase Auth

---

## AI Service

### Google Gemini
**What it is:** Google's large language model API

**How it's used:** Analyzes resource content and generates tags, descriptions, and metadata

**Implementation reference:**
- Google AI Documentation: https://ai.google.dev/docs
- Gemini API reference for structured output
- Python SDK: google-generativeai
- Model: gemini-1.5-flash

---

## Monitoring & Analytics

### PostHog
**What it is:** Product analytics and monitoring platform

**How it's used:** Tracks application usage, errors, and user behavior

**Implementation reference:**
- PostHog Documentation: https://posthog.com/docs
- JavaScript SDK for frontend tracking
- Python SDK for backend events
- Session replay and feature flags

---

## Environment Architecture

### Development Environment
**Components:**
- Local React dev server (Vite)
- Local FastAPI server (uvicorn)
- Supabase "dev" project (separate instance)
- Points to development API keys

**Purpose:** Active development, testing, breaking things safely

### Production Environment
**Components:**
- Vercel deployment (React build)
- Fly.io deployment (FastAPI container)
- Supabase "production" project (separate instance)
- Production API keys and secrets

**Purpose:** Real users, real data, stable releases

---

## Integration Patterns

### Frontend → Backend
**Protocol:** HTTPS REST API
**Authentication:** JWT Bearer token in Authorization header
**Data format:** JSON request/response bodies
**Error handling:** HTTP status codes + error messages

### Backend → Database
**Protocol:** PostgreSQL wire protocol via Supabase
**Connection:** Connection string with SSL
**Query method:** SQLAlchemy ORM
**Migrations:** Alembic version control

### Backend → Authentication
**Method:** JWT token validation
**Library:** Supabase Python client
**Flow:** Extract token from request header → validate with Supabase → extract user info

### Backend → Storage
**Method:** Presigned URLs
**Upload flow:** Backend generates URL → Frontend uploads directly → Backend stores metadata
**Download flow:** Backend generates presigned URL → Frontend fetches file

### Backend → AI Service
**Protocol:** HTTPS REST API
**Authentication:** API key in request headers
**Library:** google-generativeai Python SDK
**Request format:** JSON with prompt and parameters
**Response format:** Structured JSON output

---

## Data Flow Summary

```
User Browser
    ↓ (loads from)
Vercel CDN (React App)
    ↓ (API calls to)
Fly.io Container (FastAPI)
    ↓ (queries)
Supabase PostgreSQL (Data)
    ↓ (validates users via)
Supabase Auth (JWT tokens)
    ↓ (stores files in)
Supabase Storage (PDFs)
    ↓ (generates tags via)
Google Gemini API (AI)
    ↓ (tracks usage in)
PostHog (Analytics)
```

---

## Key References for Implementation

### Getting Started
1. **FastAPI:** https://fastapi.tiangolo.com/tutorial/
2. **React:** https://react.dev/learn
3. **Supabase:** https://supabase.com/docs/guides/getting-started
4. **Vercel:** https://vercel.com/docs/getting-started-with-vercel
5. **Fly.io:** https://fly.io/docs/hands-on/

### Advanced Topics
1. **SQLAlchemy Async:** https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
2. **Supabase Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
3. **Gemini Structured Output:** https://ai.google.dev/gemini-api/docs/json-mode
4. **Docker Multi-stage Builds:** https://docs.docker.com/build/building/multi-stage/
5. **TypeScript with React:** https://react-typescript-cheatsheet.netlify.app

### Integration Guides
1. **FastAPI + Supabase Auth:** https://supabase.com/docs/reference/python
2. **React + Supabase:** https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
3. **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
4. **Fly.io Secrets:** https://fly.io/docs/reference/secrets/

---

## Technology Selection Rationale

**FastAPI:** Best Python framework for APIs with automatic documentation
**React + TypeScript:** Industry standard with strong typing and component architecture  
**Supabase:** All-in-one backend services (database + auth + storage) with generous free tier
**Vercel:** Zero-config frontend deployment with global CDN
**Fly.io:** Container platform with free tier for backend hosting
**Gemini:** Cost-effective AI with free tier and structured output support
**PostHog:** Open-source analytics with comprehensive free tier

---

This document provides technology definitions and reference materials. Implementation details should be determined based on official documentation and framework best practices.