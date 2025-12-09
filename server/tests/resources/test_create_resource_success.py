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




class TestCreateResourceSuccess:
    """Successful resource creation scenarios."""

    async def test_create_resource_valid(self, client: AsyncClient, valid_resource_data: dict):
        """Test creating a resource with valid data."""
        response = await client.post("/api/resources", json=valid_resource_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == valid_resource_data["title"]
        assert data["type"] == "note"
        assert data["content"] == valid_resource_data["content"]
        assert data["tags"] == valid_resource_data["tags"]
        assert "id" in data
        assert "userId" in data
        assert "createdAt" in data
    

    async def test_create_resource_without_tags(self, client: AsyncClient):
        """Test creating resource without tags (should work)."""
        data = {
            "title": "Test",
            "type": "note",
            "content": "Test content"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["tags"] == []
