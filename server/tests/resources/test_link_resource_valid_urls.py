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




class TestLinkResourceValidUrls:
    """Valid link URL permutations."""

    async def test_create_link_with_valid_http_url(self, client: AsyncClient):
        """Test creating link resource with valid HTTP URL."""
        data = {
            "title": "Example Site",
            "type": "link",
            "content": "http://example.com"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["type"] == "link"
        assert data_response["content"] == "http://example.com"
    

    async def test_create_link_with_valid_https_url(self, client: AsyncClient):
        """Test creating link resource with valid HTTPS URL."""
        data = {
            "title": "Secure Site",
            "type": "link",
            "content": "https://example.com"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["content"] == "https://example.com"
    

    async def test_create_link_with_url_path(self, client: AsyncClient):
        """Test creating link resource with URL containing path."""
        data = {
            "title": "Page with Path",
            "type": "link",
            "content": "https://example.com/path/to/page"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["content"] == "https://example.com/path/to/page"
    

    async def test_create_link_with_url_query_params(self, client: AsyncClient):
        """Test creating link resource with URL containing query parameters."""
        data = {
            "title": "Page with Query",
            "type": "link",
            "content": "https://example.com?param=value&other=test"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["content"] == "https://example.com?param=value&other=test"
    

    async def test_create_link_with_url_fragment(self, client: AsyncClient):
        """Test creating link resource with URL containing fragment."""
        data = {
            "title": "Page with Fragment",
            "type": "link",
            "content": "https://example.com#section"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["content"] == "https://example.com#section"
