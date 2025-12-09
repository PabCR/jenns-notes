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



class TestDeleteResource:
    """Tests for DELETE /api/resources/{id} endpoint."""
    
    async def test_delete_resource_valid(
        self, client: AsyncClient, sample_resource: TestResource
    ):
        """Test deleting a valid resource."""
        response = await client.delete(f"/api/resources/{sample_resource.id}")
        
        assert response.status_code == 204
        
        # Verify it's actually deleted
        get_response = await client.get(f"/api/resources/{sample_resource.id}")
        assert get_response.status_code == 404
    
    async def test_delete_resource_invalid_uuid(self, client: AsyncClient):
        """Test deleting resource with invalid UUID."""
        response = await client.delete("/api/resources/not-a-uuid")
        
        assert response.status_code == 422
    
    async def test_delete_resource_nonexistent(self, client: AsyncClient):
        """Test deleting non-existent resource."""
        fake_id = str(uuid4())
        response = await client.delete(f"/api/resources/{fake_id}")
        
        assert response.status_code == 404
    
    async def test_delete_resource_another_user(
        self, client: AsyncClient, test_session, test_user_id
    ):
        """Test deleting another user's resource."""
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
        
        response = await client.delete(f"/api/resources/{resource.id}")
        
        assert response.status_code == 404


