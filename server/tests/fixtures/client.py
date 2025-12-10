"""HTTP client fixture with FastAPI dependency overrides."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import get_db
from app.main import app
from app.utils.auth import get_current_user


@pytest.fixture(scope="function")
async def client(test_session, test_user_dict):
    """Create a test client with database and auth overrides."""

    async def override_get_db():
        yield test_session

    def override_get_current_user():
        return test_user_dict

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
