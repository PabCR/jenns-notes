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




class TestCreateResourceContentValidation:
    """Content and payload validation failures."""

    async def test_create_resource_missing_content(self, client: AsyncClient):
        """Test creating resource without content."""
        data = {
            "title": "Test",
            "type": "note"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("content" in str(error).lower() for error in errors)
    

    async def test_create_resource_empty_content(self, client: AsyncClient):
        """Test creating resource with empty content."""
        data = {
            "title": "Test",
            "type": "note",
            "content": ""
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_resource_whitespace_content(self, client: AsyncClient):
        """Test creating resource with whitespace-only content."""
        data = {
            "title": "Test",
            "type": "note",
            "content": "   "
        }
        response = await client.post("/api/resources", json=data)
        
        # Should fail validation
        assert response.status_code == 422
    

    async def test_create_resource_invalid_content_type(self, client: AsyncClient):
        """Test creating resource with content as number."""
        data = {
            "title": "Test",
            "type": "note",
            "content": 123
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_resource_invalid_tags_type(self, client: AsyncClient):
        """Test creating resource with tags as string instead of array."""
        data = {
            "title": "Test",
            "type": "note",
            "content": "Test content",
            "tags": "not-an-array"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_resource_malformed_json(self, client: AsyncClient):
        """Test creating resource with malformed JSON."""
        response = await client.post(
            "/api/resources",
            content='{"title": "Test", "type": "note"',  # Missing closing brace
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
