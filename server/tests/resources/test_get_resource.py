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



class TestGetResource:
    """Tests for GET /api/resources/{id} endpoint."""
    
    async def test_get_resource_valid(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test getting a valid resource."""
        response = await client.get(f"/api/resources/{sample_resource.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(sample_resource.id)
        assert data["title"] == sample_resource.title
    
    async def test_get_resource_invalid_uuid(self, client: AsyncClient):
        """Test getting resource with invalid UUID format."""
        response = await client.get("/api/resources/not-a-uuid")
        
        assert response.status_code == 422
    
    async def test_get_resource_nonexistent(self, client: AsyncClient):
        """Test getting a non-existent resource."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/resources/{fake_id}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    async def test_get_resource_another_user(
        self, client: AsyncClient, test_session, test_user_id
    ):
        """Test getting another user's resource (should return 404)."""
        import os
        from uuid import uuid4, UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        # Create resource with different user_id
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
        
        # Current user (from fixture) is different
        response = await client.get(f"/api/resources/{resource.id}")
        
        # Should return 404 (not found) for security
        assert response.status_code == 404


