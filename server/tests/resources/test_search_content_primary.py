"""Tests for resource API endpoints."""
import os
import pytest
from httpx import AsyncClient
from uuid import UUID
from tests.fixtures.database import TestResourceModel as TestResource, USE_POSTGRES

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


def _resource_for_user(
    test_user_id: str,
    title: str,
    description: str = "",
    tags: list[str] | None = None,
):
    tags = tags or []
    if USE_POSTGRES:
        from app.models.resource import Resource

        return Resource(
            user_id=UUID(test_user_id),
            title=title,
            description=description or None,
            type="note",
            content="Content",
            tags=tags,
        )

    return TestResource(
        user_id=test_user_id,
        title=title,
        description=description or None,
        type="note",
        content="Content",
        tags=tags,
    )


class TestSearchContentPrimary:
    """Search across titles, descriptions, tags, and combined fields."""

    async def test_search_by_title(self, client: AsyncClient, test_session, test_user_id):
        """Test searching resources by title (case-insensitive)."""
        resource1 = _resource_for_user(test_user_id, "Oncology Treatment Guide")
        resource2 = _resource_for_user(test_user_id, "Cardiology Notes")

        test_session.add_all([resource1, resource2])
        await test_session.commit()

        response = await client.get("/api/resources?search=oncology")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Oncology Treatment Guide"

        response = await client.get("/api/resources?search=ONCOLOGY")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
    


    async def test_search_by_description(self, client: AsyncClient, test_session, test_user_id):
        """Test searching resources by description."""
        resource = _resource_for_user(
            test_user_id,
            "Test Resource",
            description="This is about chemotherapy treatment",
        )

        test_session.add(resource)
        await test_session.commit()
        
        response = await client.get("/api/resources?search=chemotherapy")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "chemotherapy" in data[0]["description"].lower()
    


    async def test_search_by_tags(self, client: AsyncClient, test_session, test_user_id):
        """Test searching resources by tag content."""
        resource1 = _resource_for_user(
            test_user_id,
            "Resource 1",
            tags=["cancer", "treatment"],
        )
        resource2 = _resource_for_user(
            test_user_id,
            "Resource 2",
            tags=["diabetes", "medication"],
        )

        test_session.add_all([resource1, resource2])
        await test_session.commit()
        
        response = await client.get("/api/resources?search=cancer")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "cancer" in data[0]["tags"]
    


    async def test_search_multiple_fields(self, client: AsyncClient, test_session, test_user_id):
        """Test search matches across title, description, and tags."""
        resource1 = _resource_for_user(
            test_user_id,
            "Radiation Therapy",
            description="Notes about treatment",
            tags=["therapy"],
        )
        resource2 = _resource_for_user(
            test_user_id,
            "Other Topic",
            description="Radiation safety guidelines",
        )
        resource3 = _resource_for_user(
            test_user_id,
            "Unrelated",
            description="Other content",
        )

        test_session.add_all([resource1, resource2, resource3])
        await test_session.commit()
        
        response = await client.get("/api/resources?search=radiation")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        titles = [r["title"] for r in data]
        assert "Radiation Therapy" in titles
        assert "Other Topic" in titles
