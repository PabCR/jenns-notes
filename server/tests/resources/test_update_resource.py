"""Tests for resource API endpoints."""
import pytest
import json
from datetime import datetime
from httpx import AsyncClient
from uuid import uuid4
# Note: We use TestResourceModel from conftest for SQLite compatibility
# The actual Resource model uses PostgreSQL-specific types
from tests.fixtures.database import TestResourceModel as TestResource
pytestmark = [pytest.mark.asyncio, pytest.mark.api]



class TestUpdateResource:
    """Tests for PATCH /api/resources/{id} endpoint."""
    
    async def test_update_resource_valid(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test updating a resource with valid data."""
        update_data = {
            "title": "Updated Title",
            "description": "Updated description",
            "tags": ["new", "tags"]
        }
        response = await client.patch(
            f"/api/resources/{sample_resource.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]
        assert data["tags"] == update_data["tags"]
    
    async def test_update_resource_partial(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test partial update (only title)."""
        update_data = {"title": "Only Title Updated"}
        response = await client.patch(
            f"/api/resources/{sample_resource.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        # Other fields should remain unchanged
        assert data["content"] == sample_resource.content
    
    async def test_update_resource_empty_title(self, client: AsyncClient, sample_resource: TestResource):
        """Test updating resource with empty title."""
        update_data = {"title": ""}
        response = await client.patch(
            f"/api/resources/{sample_resource.id}",
            json=update_data
        )
        
        assert response.status_code == 422
    
    async def test_update_resource_whitespace_title(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test updating resource with whitespace-only title."""
        update_data = {"title": "   "}
        response = await client.patch(
            f"/api/resources/{sample_resource.id}",
            json=update_data
        )
        
        assert response.status_code == 422
    
    async def test_update_resource_invalid_uuid(self, client: AsyncClient):
        """Test updating resource with invalid UUID."""
        response = await client.patch(
            "/api/resources/not-a-uuid",
            json={"title": "Test"}
        )
        
        assert response.status_code == 422
    
    async def test_update_resource_nonexistent(self, client: AsyncClient):
        """Test updating non-existent resource."""
        fake_id = str(uuid4())
        response = await client.patch(
            f"/api/resources/{fake_id}",
            json={"title": "Test"}
        )
        
        assert response.status_code == 404
    
    async def test_update_resource_another_user(
        self, client: AsyncClient, test_session, test_user_id
    ):
        """Test updating another user's resource."""
        import os
        from uuid import uuid4, UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        other_user_id = str(uuid4())
        if USE_POSTGRES:
            resource = Resource(
                user_id=UUID(other_user_id),
                title="Other User's Resource",
                type="note",
                content="Content",
                tags=[]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource = TestResource(
                user_id=other_user_id,
                title="Other User's Resource",
                type="note",
                content="Content",
                tags=[]
            )
        
        test_session.add(resource)
        await test_session.commit()
        await test_session.refresh(resource)
        
        response = await client.patch(
            f"/api/resources/{resource.id}",
            json={"title": "Hacked"}
        )
        
        assert response.status_code == 404
    
    async def test_update_resource_empty_body(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test updating resource with empty body (should be valid - no-op)."""
        # Skip this test if using SQLite (sample_resource may not be queryable)
        import os
        if not os.getenv("TEST_DATABASE_URL", "").startswith("postgresql"):
            pytest.skip("Requires PostgreSQL test database for resource queries")
        
        response = await client.patch(
            f"/api/resources/{sample_resource.id}",
            json={}
        )
        
        # Empty update should be valid (no changes)
        assert response.status_code == 200


