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





class TestSearchContentMatching:
    """Case-insensitive and partial match search behavior."""

    async def test_search_case_insensitive(self, client: AsyncClient, test_session, test_user_id):
        """Test search is case-insensitive."""
        import os
        from uuid import UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        if USE_POSTGRES:
            resource = Resource(
                user_id=UUID(test_user_id),
                title="Oncology Treatment",
                type="note",
                content="Content",
                tags=[]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource = TestResource(
                user_id=test_user_id,
                title="Oncology Treatment",
                type="note",
                content="Content",
                tags=[]
            )
        
        test_session.add(resource)
        await test_session.commit()
        
        # Test different case variations
        for search_term in ["oncology", "ONCOLOGY", "Oncology", "OnCoLoGy"]:
            response = await client.get(f"/api/resources?search={search_term}")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
    


    async def test_search_partial_match(self, client: AsyncClient, test_session, test_user_id):
        """Test search matches partial words."""
        import os
        from uuid import UUID
        from app.models.resource import Resource
        
        USE_POSTGRES = os.getenv("TEST_DATABASE_URL", "").startswith("postgresql")
        
        if USE_POSTGRES:
            resource = Resource(
                user_id=UUID(test_user_id),
                title="Chemotherapy Guidelines",
                type="note",
                content="Content",
                tags=[]
            )
        else:
            from tests.fixtures.database import TestResourceModel as TestResource
            resource = TestResource(
                user_id=test_user_id,
                title="Chemotherapy Guidelines",
                type="note",
                content="Content",
                tags=[]
            )
        
        test_session.add(resource)
        await test_session.commit()
        
        # Partial match
        response = await client.get("/api/resources?search=chemo")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
