# Minimal API Regression Suite

This suite intentionally stays small and mirrors the vertical slices completed in `implementation-plan.md` through Phase 6. Each surviving test covers a distinct capability so failures point directly at the underlying feature.

## Covered Features

- **Authentication guard rails** – unauthenticated requests to `/api/resources` return `401`.
- **Resource CRUD + validation** – happy-path creation/list/get/update/delete for notes, plus title/content validation errors.
- **Search & filtering** – text queries across title/description/tags and type filtering for `note` vs `link`.
- **Additional resource types** – creation/validation for `link` and `pdf` payloads.
- **Gemini auto-tagging** – one success flow and one invalid-type failure for `/api/resources/generate-tags`.
- **Packet management** – create, list, get, update (resource swap), and delete packets while keeping resources intact.

## File Layout

```
tests/
├── api/
│   ├── test_auth.py
│   ├── test_gemini.py
│   ├── test_packets.py
│   └── test_resources.py
├── fixtures/
│   ├── client.py
│   ├── database.py
│   ├── resources.py
│   └── users.py
├── README.md
└── TEST_STATUS.md
```

## Prerequisites

1. Provision a PostgreSQL test database.
2. Run migrations against it:
   ```bash
   DATABASE_URL=$TEST_DATABASE_URL alembic upgrade head
   ```
3. Export the database URL before invoking pytest:
   ```bash
   export TEST_DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/test_db"
   ```
   The fixtures hard-require a PostgreSQL URL and will skip the suite otherwise.

## Running Tests

```bash
cd server
source venv/bin/activate
pytest
```

Useful subsets:

```bash
# Everything under tests/api
pytest tests/api
# Single capability
pytest tests/api/test_resources.py::test_create_note_resource_success
```

Mark-based filters still work (`-m api`).

## Adding New Tests

Only add coverage when a new implementation-plan phase ships. Prefer a single high-signal test per feature:

1. Create data via fixtures (avoid mocking HTTP if the real endpoint works).
2. Assert on public responses, not internals.
3. Keep files short and scenario-focused to maintain fast feedback.
