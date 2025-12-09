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



class TestAuthentication:
    """Tests for authentication requirements."""
    
    async def test_create_resource_no_auth(self, client: AsyncClient):
        """Test creating resource without authentication."""
        # Clear the auth override to simulate no auth
        from app.main import app
        from app.utils.auth import get_current_user
        from fastapi import HTTPException, status
        
        def no_auth():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication credentials"
            )
        
        app.dependency_overrides[get_current_user] = no_auth
        
        data = {
            "title": "Test",
            "type": "note",
            "content": "Test content"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 401
        
        app.dependency_overrides.clear()
    
    async def test_list_resources_no_auth(self, client: AsyncClient):
        """Test listing resources without authentication."""
        from app.main import app
        from app.utils.auth import get_current_user
        from fastapi import HTTPException, status
        
        def no_auth():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication credentials"
            )
        
        app.dependency_overrides[get_current_user] = no_auth
        
        response = await client.get("/api/resources")
        
        assert response.status_code == 401
        
        app.dependency_overrides.clear()


