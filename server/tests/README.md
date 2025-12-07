# Phase 1 Resource Management Tests

## Overview

This test suite covers all Phase 1 resource management API endpoints, including:
- Creating resources (POST /api/resources)
- Listing resources (GET /api/resources)
- Getting a single resource (GET /api/resources/{id})
- Updating resources (PATCH /api/resources/{id})
- Deleting resources (DELETE /api/resources/{id})

## Test Coverage

### Valid Input Tests
- ✅ Create resource with valid data
- ✅ List resources (empty and with data)
- ✅ Get single resource
- ✅ Update resource (full and partial)
- ✅ Delete resource

### Invalid Input Tests
- ✅ Missing required fields (title, type, content)
- ✅ Empty strings (title, content)
- ✅ Whitespace-only strings
- ✅ Invalid type values
- ✅ Wrong type for Phase 1 (pdf, link)
- ✅ Invalid data types (numbers instead of strings)
- ✅ Invalid UUID formats
- ✅ Non-existent resources
- ✅ Accessing another user's resources
- ✅ Malformed JSON

### Authentication Tests
- ✅ Missing authentication
- ✅ Invalid authentication tokens

## Running Tests

### Install Dependencies

```bash
cd server
source venv/bin/activate
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run with Verbose Output

```bash
pytest -v
```

### Run Specific Test File

```bash
pytest tests/test_resources.py
```

### Run Specific Test Class

```bash
pytest tests/test_resources.py::TestCreateResource
```

### Run Specific Test

```bash
pytest tests/test_resources.py::TestCreateResource::test_create_resource_valid
```

### Run Tests by Marker

```bash
# Run only API tests
pytest -m api

# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit
```

### Run Tests with Coverage

```bash
# Install coverage first
pip install pytest-cov

# Run with coverage
pytest --cov=app --cov-report=html
```

## Test Database

**Important**: The Resource model uses PostgreSQL-specific types (UUID, ARRAY, TIMESTAMP WITH TIME ZONE). For tests to work properly, you need a PostgreSQL test database.

### Option 1: Use Test Database (Recommended)

Set a test database URL in your environment:
```bash
export TEST_DATABASE_URL="postgresql+asyncpg://user:pass@localhost/test_db"
```

Then update `conftest.py` to use `TEST_DATABASE_URL` if set, otherwise fall back to SQLite.

### Option 2: Use SQLite (Limited - Work in Progress)

The current test setup attempts to use SQLite with compatibility layers, but there are known issues with UUID and ARRAY type conversions. For now, use a PostgreSQL test database for reliable testing.

### Setting Up Test Database

1. Create a test database in Supabase (or local PostgreSQL):
   ```sql
   CREATE DATABASE test_nurse_resource_binder;
   ```

2. Set environment variable:
   ```bash
   export TEST_DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/test_nurse_resource_binder"
   ```

3. Run migrations on test database:
   ```bash
   DATABASE_URL=$TEST_DATABASE_URL alembic upgrade head
   ```

## Test Structure

- `conftest.py`: Test fixtures and configuration
- `test_resources.py`: All resource API endpoint tests
- Tests are organized by endpoint in test classes
- Each test is independent and can run in isolation

## Writing New Tests

When adding new tests:

1. Use the existing fixtures from `conftest.py`
2. Follow the naming convention: `test_<functionality>`
3. Use appropriate pytest markers (`@pytest.mark.api`, etc.)
4. Test both valid and invalid inputs
5. Test edge cases and error conditions

## Example Test

```python
@pytest.mark.asyncio
@pytest.mark.api
async def test_create_resource_valid(client: AsyncClient, valid_resource_data: dict):
    """Test creating a resource with valid data."""
    response = await client.post("/api/resources", json=valid_resource_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == valid_resource_data["title"]
```

