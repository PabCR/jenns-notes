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



class TestLinkResourceCreation:
    """Tests for link resource creation and CRUD operations."""
    
    async def test_create_link_resource_with_valid_url(self, client: AsyncClient):
        """Test creating link resource with valid URL."""
        data = {
            "title": "Example Website",
            "type": "link",
            "content": "https://example.com"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["type"] == "link"
        assert data_response["content"] == "https://example.com"
        assert data_response["title"] == "Example Website"
        assert "id" in data_response
        assert "userId" in data_response
        assert "createdAt" in data_response
    
    async def test_create_link_resource_stores_url_in_content(self, client: AsyncClient):
        """Test that link resource stores URL in content field."""
        url = "https://www.example.com/path?query=value#fragment"
        data = {
            "title": "Complex URL",
            "type": "link",
            "content": url
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["content"] == url
    
    async def test_create_link_resource_with_title_and_description(self, client: AsyncClient):
        """Test creating link resource with title and description."""
        data = {
            "title": "Medical Resource",
            "description": "A helpful medical website",
            "type": "link",
            "content": "https://medical.example.com"
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["title"] == "Medical Resource"
        assert data_response["description"] == "A helpful medical website"
        assert data_response["type"] == "link"
    
    async def test_create_link_resource_with_tags(self, client: AsyncClient):
        """Test creating link resource with tags."""
        data = {
            "title": "Tagged Link",
            "type": "link",
            "content": "https://example.com",
            "tags": ["medical", "oncology", "treatment"]
        }
        response = await client.post("/api/resources", json=data)
        
        assert response.status_code == 201
        data_response = response.json()
        assert data_response["tags"] == ["medical", "oncology", "treatment"]
    
    async def test_link_resource_appears_in_list(self, client: AsyncClient):
        """Test that link resource appears in list resources."""
        # Create a link resource
        link_data = {
            "title": "List Test Link",
            "type": "link",
            "content": "https://list-test.example.com"
        }
        create_response = await client.post("/api/resources", json=link_data)
        assert create_response.status_code == 201
        link_id = create_response.json()["id"]
        
        # List resources
        list_response = await client.get("/api/resources")
        assert list_response.status_code == 200
        resources = list_response.json()
        
        # Find our link resource
        link_resource = next((r for r in resources if r["id"] == link_id), None)
        assert link_resource is not None
        assert link_resource["type"] == "link"
        assert link_resource["content"] == "https://list-test.example.com"
    
    async def test_get_link_resource_by_id(self, client: AsyncClient):
        """Test retrieving link resource by ID."""
        # Create a link resource
        link_data = {
            "title": "Get Test Link",
            "type": "link",
            "content": "https://get-test.example.com"
        }
        create_response = await client.post("/api/resources", json=link_data)
        assert create_response.status_code == 201
        link_id = create_response.json()["id"]
        
        # Get the resource
        get_response = await client.get(f"/api/resources/{link_id}")
        assert get_response.status_code == 200
        resource = get_response.json()
        assert resource["id"] == link_id
        assert resource["type"] == "link"
        assert resource["content"] == "https://get-test.example.com"
    
    async def test_update_link_resource(self, client: AsyncClient):
        """Test updating link resource metadata."""
        # Create a link resource
        link_data = {
            "title": "Original Title",
            "type": "link",
            "content": "https://original.example.com"
        }
        create_response = await client.post("/api/resources", json=link_data)
        assert create_response.status_code == 201
        link_id = create_response.json()["id"]
        
        # Update the resource
        update_data = {
            "title": "Updated Title",
            "description": "Updated description",
            "tags": ["updated", "tags"]
        }
        update_response = await client.patch(
            f"/api/resources/{link_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        updated_resource = update_response.json()
        assert updated_resource["title"] == "Updated Title"
        assert updated_resource["description"] == "Updated description"
        assert updated_resource["tags"] == ["updated", "tags"]
        # Content should remain unchanged
        assert updated_resource["content"] == "https://original.example.com"
    
    async def test_delete_link_resource(self, client: AsyncClient):
        """Test deleting link resource."""
        # Create a link resource
        link_data = {
            "title": "Delete Test Link",
            "type": "link",
            "content": "https://delete-test.example.com"
        }
        create_response = await client.post("/api/resources", json=link_data)
        assert create_response.status_code == 201
        link_id = create_response.json()["id"]
        
        # Delete the resource
        delete_response = await client.delete(f"/api/resources/{link_id}")
        assert delete_response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(f"/api/resources/{link_id}")
        assert get_response.status_code == 404


