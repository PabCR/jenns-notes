"""Minimal authentication regression tests."""
import pytest
from fastapi import HTTPException, status
from httpx import AsyncClient

from app.main import app
from app.utils.auth import get_current_user

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


def _set_no_auth_override():
    """Override auth dependency to simulate missing credentials."""

    def no_auth():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    app.dependency_overrides[get_current_user] = no_auth


def _clear_overrides():
    app.dependency_overrides.pop(get_current_user, None)


async def test_create_resource_requires_auth(client: AsyncClient):
    """POST /api/resources responds with 401 when auth is missing."""
    _set_no_auth_override()
    try:
        response = await client.post(
            "/api/resources",
            json={"title": "Test", "type": "note", "content": "Body"},
        )
        assert response.status_code == 401
    finally:
        _clear_overrides()


async def test_list_resources_requires_auth(client: AsyncClient):
    """GET /api/resources responds with 401 when auth is missing."""
    _set_no_auth_override()
    try:
        response = await client.get("/api/resources")
        assert response.status_code == 401
    finally:
        _clear_overrides()
