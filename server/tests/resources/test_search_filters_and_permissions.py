"""Tests for resource API endpoints."""
import pytest
from httpx import AsyncClient
from uuid import UUID, uuid4
from tests.fixtures.database import TestResourceModel as TestResource, USE_POSTGRES

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


def _resource_for_user(user_id: str, title: str):
    if USE_POSTGRES:
        from app.models.resource import Resource

        return Resource(
            user_id=UUID(user_id),
            title=title,
            type="note",
            content="Content",
            tags=[],
        )

    return TestResource(
        user_id=user_id,
        title=title,
        type="note",
        content="Content",
        tags=[],
    )

class TestSearchFiltersAndPermissions:
    """Filtering by resource type and user scoping."""

    async def test_filter_by_type_note(self, client: AsyncClient, sample_resource):
        """Test filtering resources by type='note'."""
        response = await client.get("/api/resources?type=note")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(r["type"] == "note" for r in data)
    

    async def test_filter_by_type_pdf(self, client: AsyncClient, sample_resource):
        """Test filtering resources by type='pdf' (should return empty for Phase 1)."""
        response = await client.get("/api/resources?type=pdf")
        assert response.status_code == 200
        data = response.json()
        # In Phase 1, only notes exist, so should return empty
        assert len(data) == 0
    

    async def test_filter_by_type_link(self, client: AsyncClient, sample_resource):
        """Test filtering resources by type='link' (should return empty for Phase 1)."""
        response = await client.get("/api/resources?type=link")
        assert response.status_code == 200
        data = response.json()
        # In Phase 1, only notes exist, so should return empty
        assert len(data) == 0
    

    async def test_filter_by_invalid_type(self, client: AsyncClient):
        """Test filter with invalid type value."""
        # Invalid type should still work (just return empty results)
        # Or could return 422 if we validate it
        response = await client.get("/api/resources?type=invalid")
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)
    

    async def test_filter_combined_with_search(self, client: AsyncClient, test_session, test_user_id):
        """Test combining type filter with search parameter."""
        resource = _resource_for_user(test_user_id, "Test Note")

        test_session.add(resource)
        await test_session.commit()
        
        response = await client.get("/api/resources?search=test&type=note")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(r["type"] == "note" for r in data)
        assert all("test" in r["title"].lower() for r in data)
    

    async def test_search_another_user_resources(self, client: AsyncClient, test_session, test_user_id):
        """Test search should only return current user's resources."""
        other_user_id = str(uuid4())
        other_resource = _resource_for_user(other_user_id, "Other User's Resource")
        user_resource = _resource_for_user(test_user_id, "My Resource")

        test_session.add_all([other_resource, user_resource])
        await test_session.commit()
        
        response = await client.get("/api/resources?search=resource")
        assert response.status_code == 200
        data = response.json()
        # Should only return current user's resource
        assert len(data) == 1
        assert data[0]["title"] == "My Resource"
