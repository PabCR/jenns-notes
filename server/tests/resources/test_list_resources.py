"""Tests for resource API endpoints."""
import os
from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from uuid import uuid4
from tests.fixtures.database import TestResourceModel as TestResource, USE_POSTGRES

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


def _make_resource(test_user_id: str, title: str, created_at: datetime):
    """Create a Resource/TestResource with deterministic timestamps."""
    if USE_POSTGRES:
        from uuid import UUID
        from app.models.resource import Resource

        resource = Resource(
            user_id=UUID(test_user_id),
            title=title,
            type="note",
            content=f"{title} content",
            tags=[],
        )
        resource.created_at = created_at
        resource.updated_at = created_at
        return resource

    return TestResource(
        user_id=test_user_id,
        title=title,
        type="note",
        content=f"{title} content",
        tags=[],
        created_at=created_at.isoformat(),
        updated_at=created_at.isoformat(),
    )


class TestListResources:
    """Tests for GET /api/resources endpoint."""

    async def test_list_resources_empty(self, client: AsyncClient):
        """Test listing resources when user has none."""
        response = await client.get("/api/resources")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_list_resources_with_data(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test listing resources when user has resources."""
        response = await client.get("/api/resources")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(r["id"] == str(sample_resource.id) for r in data)

    async def test_list_resources_ordered_by_created_at(
        self, client: AsyncClient, test_session, test_user_id
    ):
        """Test that resources are ordered by created_at DESC."""
        now = datetime.now()
        older = _make_resource(test_user_id, "First", now - timedelta(seconds=10))
        newer = _make_resource(test_user_id, "Second", now)

        test_session.add_all([older, newer])
        await test_session.commit()
        await test_session.refresh(newer)

        response = await client.get("/api/resources")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        assert data[0]["id"] == str(newer.id)

