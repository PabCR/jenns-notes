"""HTTP client fixture with FastAPI dependency overrides."""
import json
from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event

from app.db import get_db
from app.main import app
from app.models.resource import Resource
from app.utils.auth import get_current_user
from tests.fixtures.database import JSONListType, StringUUIDType, TestResourceModel, USE_POSTGRES


def _patch_sqlite_resource_table():
    """Patch Resource to use SQLite-friendly schema and return the original table."""
    from uuid import UUID as UUIDType

    @event.listens_for(Resource, "before_insert", propagate=True)
    def prepare_resource_for_sqlite(mapper, connection, target):  # noqa: ANN001
        if hasattr(target, "tags") and isinstance(target.tags, list):
            target.tags = json.dumps(target.tags)
        if hasattr(target, "id") and target.id and isinstance(target.id, UUIDType):
            target.id = str(target.id)
        if hasattr(target, "user_id") and target.user_id and isinstance(target.user_id, UUIDType):
            target.user_id = str(target.user_id)

        if not getattr(target, "created_at", None):
            target.created_at = datetime.now().isoformat()
        elif hasattr(target.created_at, "isoformat"):
            target.created_at = target.created_at.isoformat()
        if not getattr(target, "updated_at", None):
            target.updated_at = datetime.now().isoformat()
        elif hasattr(target.updated_at, "isoformat"):
            target.updated_at = target.updated_at.isoformat()

    original_table = Resource.__table__
    Resource.__table__ = TestResourceModel.__table__
    for col in list(Resource.__table__.columns):
        if col.name == "tags":
            col.type = JSONListType()
        elif col.name in ("id", "user_id"):
            col.type = StringUUIDType()
    return original_table


@pytest.fixture(scope="function")
async def client(test_session, test_user_dict):
    """Create a test client with database and auth overrides."""

    async def override_get_db():
        yield test_session

    def override_get_current_user():
        return test_user_dict

    original_table = _patch_sqlite_resource_table() if not USE_POSTGRES else None

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    if not USE_POSTGRES and original_table is not None:
        Resource.__table__ = original_table
    app.dependency_overrides.clear()
