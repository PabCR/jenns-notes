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




class TestLinkResourceInvalidUrls:
    """Invalid link inputs and non-link resource handling."""

    async def test_create_link_with_invalid_url_missing_protocol(self, client: AsyncClient):
        """Test creating link resource with invalid URL (missing protocol)."""
        data = {
            "title": "Invalid URL",
            "type": "link",
            "content": "example.com"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        error_str = str(errors).lower()
        assert "url" in error_str or "invalid" in error_str or "protocol" in error_str
    

    async def test_create_link_with_invalid_url_not_a_url(self, client: AsyncClient):
        """Test creating link resource with invalid URL (not a URL)."""
        data = {
            "title": "Not a URL",
            "type": "link",
            "content": "not-a-url"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_link_with_empty_url(self, client: AsyncClient):
        """Test creating link resource with empty URL."""
        data = {
            "title": "Empty URL",
            "type": "link",
            "content": ""
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_link_with_whitespace_only_url(self, client: AsyncClient):
        """Test creating link resource with whitespace-only URL."""
        data = {
            "title": "Whitespace URL",
            "type": "link",
            "content": "   "
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 422
    

    async def test_create_note_does_not_validate_url(self, client: AsyncClient):
        """Test that note type resources do not validate URL format."""
        data = {
            "title": "Note with text",
            "type": "note",
            "content": "This is not a URL and should be fine for notes"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["type"] == "note"
        assert data_response["content"] == "This is not a URL and should be fine for notes"
