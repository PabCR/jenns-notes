## File Organization Patterns
- **Feature folders for pages**: keep page entrypoints thin (`pages/Home.tsx`, `pages/Upload.tsx`) and place real logic under `pages/<feature>/{components,hooks,actions,state}` to separate rendering from orchestration.
- **API modules by responsibility**: place shared fetch helpers in `lib/api/client.ts` and split domain calls into `lib/api/resources.ts`, `objects.ts`, `metadata.ts`, then re-export via a barrel for ergonomic imports.
- **Service layer for routes**: keep FastAPI routers focused on validation and dependency wiring; move DB/AI logic into `app/services/*` to simplify testing and reuse.
- **Fixture plugins**: organize pytest fixtures into `tests/fixtures/*` and load them through `tests/conftest.py` to avoid bloated configuration files.
- **Tests by concern**: group endpoint tests by CRUD/search/validation topic under `tests/resources/` (and `tests/gemini/` for AI helpers) so each file stays short and focused.
