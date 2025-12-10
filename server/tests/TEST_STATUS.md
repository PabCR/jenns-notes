# Test Status

## Current Snapshot

- **16 backend API tests** grouped under `tests/api/`.
- Suites execute against **PostgreSQL only**. Export `TEST_DATABASE_URL` (e.g. `postgresql+asyncpg://postgres:password@localhost:5432/test_db`) before running pytest.
- Scope mirrors implementation-plan phases **0‑6** only (auth, resources, search, link/PDF, Gemini tagging, packets).

## Test Matrix

| File | Scenarios |
| --- | --- |
| `tests/api/test_auth.py` | create/list resources reject unauthenticated requests |
| `tests/api/test_resources.py` | note CRUD (5), validation (2), search/filter (2), link create, link validation, pdf create, pdf validation |
| `tests/api/test_gemini.py` | generate-tags success, invalid type failure |
| `tests/api/test_packets.py` | packet create, list, get, update (swap resources), delete |

## Expectations

- Failures should map 1:1 to feature regressions. No duplicate or future-phase coverage remains.
- When a new phase is implemented, add **one** representative test in the appropriate file (or a new short file) and document it here.

## Running Locally

```bash
cd server
source venv/bin/activate
export TEST_DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/test_db"
pytest
```
