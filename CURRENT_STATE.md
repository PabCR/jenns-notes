## File Organization
- Frontend pages are split into feature folders (`pages/home`, `pages/upload`) with dedicated hooks and components; legacy entrypoints remain for routing.
- API calls now live in `lib/api/{client,resources,objects,metadata}` with a barrel at `lib/api.ts`.
- Backend routes delegate to `app/services/resource_service.py` and `app/services/resource_metadata_service.py`.
- Tests are organized by concern under `tests/resources/`, `tests/gemini/`, and shared fixtures in `tests/fixtures/`; `tests/conftest.py` only loads plugins.
- Directory trees before/after refactor are captured in `FILE_ORGANIZATION.md` for quick reference.
