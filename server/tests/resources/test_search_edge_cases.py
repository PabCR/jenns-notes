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




class TestSearchEdgeCases:
    """Search handling for empty, whitespace, and special inputs."""

    async def test_search_no_results(self, client: AsyncClient, test_session, test_user_id):
        """Test search with no matching resources."""
        import os
        from uuid import UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        if USE_POSTGRES:
            resource = Resource(
                user_id=UUID(test_user_id),
                title="Test Resource",
                type="note",
                content="Content",
                tags=[]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource = TestResource(
                user_id=test_user_id,
                title="Test Resource",
                type="note",
                content="Content",
                tags=[]
            )
        
        test_session.add(resource)
        await test_session.commit()
        
        response = await client.get("/api/resources?search=nonexistent")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
    

    async def test_search_empty_string(self, client: AsyncClient, sample_resource):
        """Test search with empty string (should return all resources)."""
        response = await client.get("/api/resources?search=")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    

    async def test_search_whitespace_only(self, client: AsyncClient, sample_resource):
        """Test search with whitespace-only string (should return all resources)."""
        response = await client.get("/api/resources?search=   ")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    

    async def test_search_special_characters(self, client: AsyncClient, test_session, test_user_id):
        """Test search with special characters (SQL injection safety)."""
        import os
        from uuid import UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        if USE_POSTGRES:
            resource = Resource(
                user_id=UUID(test_user_id),
                title="Test Resource",
                type="note",
                content="Content",
                tags=[]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource = TestResource(
                user_id=test_user_id,
                title="Test Resource",
                type="note",
                content="Content",
                tags=[]
            )
        
        test_session.add(resource)
        await test_session.commit()
        
        # Test SQL injection attempt
        response = await client.get("/api/resources?search=' OR '1'='1")
        assert response.status_code == 200
        # Should not crash, may return 0 results or handle safely
        data = response.json()
        assert isinstance(data, list)
    

    async def test_search_multiple_tags(self, client: AsyncClient, test_session, test_user_id):
        """Test search matches when any tag contains search term."""
        import os
        from uuid import UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        if USE_POSTGRES:
            resource1 = Resource(
                user_id=UUID(test_user_id),
                title="Resource 1",
                type="note",
                content="Content",
                tags=["cancer", "treatment"]
            )
            resource2 = Resource(
                user_id=UUID(test_user_id),
                title="Resource 2",
                type="note",
                content="Content",
                tags=["diabetes"]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource1 = TestResource(
                user_id=test_user_id,
                title="Resource 1",
                type="note",
                content="Content",
                tags=["cancer", "treatment"]
            )
            resource2 = TestResource(
                user_id=test_user_id,
                title="Resource 2",
                type="note",
                content="Content",
                tags=["diabetes"]
            )
        
        test_session.add(resource1)
        test_session.add(resource2)
        await test_session.commit()
        
        response = await client.get("/api/resources?search=cancer")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "cancer" in data[0]["tags"]
