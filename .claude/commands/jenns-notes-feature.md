Implement the feature described below following the Jenns Notes development pattern. Build it as a complete vertical slice: database → backend → frontend.

Feature to implement: $ARGUMENTS

---

## Development Pattern

### 1. Update the Documentattion

Before writing any code, add the new feature to `changes/{change-name-date}.md`:
- Define the goal and deliverable
- List the database schema changes (if any)
- List backend and frontend tasks with checkboxes

### 2. Database Layer (if schema changes needed)

Create a new Alembic migration:
```bash
cd server && alembic revision -m "describe_change"
```
- Write raw SQL in `upgrade()` / `downgrade()`
- Follow existing migration style in `server/alembic/versions/`
- Run: `alembic upgrade head`

### 3. Backend Layer

Follow this order: **Model → Schema → Service → Route**

**Model** (`server/app/models/`):
- Add to existing model file or create a new one
- SQLAlchemy declarative style with async support

**Schema** (`server/app/schemas/`):
- Pydantic v2 models for request/response validation
- Use `model_config = ConfigDict(populate_by_name=True)` with `serialization_alias` for camelCase output

**Service** (`server/app/services/`):
- All business logic goes here - routes stay thin
- Use `async` SQLAlchemy session: `async with get_session() as db`
- Raise `HTTPException` for domain errors

**Route** (`server/app/routes/`):
- Inject `current_user = Depends(get_current_user)` for protected endpoints
- Delegate immediately to service layer
- Register in `server/app/main.py` if adding a new router

### 4. Frontend Layer

Follow this order: **API client → Page/hook → UI components**

**API client** (`client/src/lib/api/`):
- Add new functions to the relevant domain file (resources.ts, packets.ts, etc.)
- Use `apiFetch` from `client.ts` for authenticated requests

**Page logic** (`client/src/pages/<feature>/`):
- Create feature folder with its own components/ subdirectory
- Extract state and handlers into a `use<Feature>.ts` custom hook
- Keep page component focused on rendering

**UI components**:
- Use shadcn/ui primitives from `components/ui/`
- Use `lucide-react` for icons
- Style with Tailwind CSS utility classes

### 5. Verify End-to-End

- Run `npm run build` (frontend) - must pass TypeScript + Vite
- Run `npm run lint` (frontend) - must pass ESLint
- Start both servers and manually test the full user flow

### 6. Sync the Documentation

Document changes made in `changes/{change-name-date}.md`
And also update Claude.md after code has been updated

---

## Key Constraints

- **Minimal code**: No abstractions unless required. Three similar lines > premature helper.
- **Official APIs only**: Check `docs/tech-stack.md` for the tech in use, follow its official docs.
- **Thin routes**: Business logic belongs in services/, never in route handlers.
- **No test suites required**: Rely on `build` + `lint` + manual end-to-end verification.

