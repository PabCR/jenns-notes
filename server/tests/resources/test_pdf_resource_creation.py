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



class TestPDFResourceCreation:
    """Tests for PDF resource creation via POST /api/resources."""
    
    async def test_create_pdf_resource_valid(self, client: AsyncClient):
        """Test creating a PDF resource with valid storage path."""
        pdf_data = {
            "title": "Test PDF Document",
            "type": "pdf",
            "content": "uploads/abc123-def456-ghi789.pdf",
            "description": "A test PDF document"
        }
        response = await client.post("/api/resources", json=pdf_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == pdf_data["title"]
        assert data["type"] == "pdf"
        assert data["content"] == pdf_data["content"]
        assert data["content"].startswith("uploads/")
        assert data["content"].endswith(".pdf")
        assert "id" in data
        assert "userId" in data
        assert "createdAt" in data
    
    async def test_create_pdf_resource_invalid_path(self, client: AsyncClient):
        """Test creating PDF resource with invalid storage path."""
        pdf_data = {
            "title": "Test PDF",
            "type": "pdf",
            "content": "invalid/path.pdf"  # Doesn't start with uploads/
        }
        response = await client.post("/api/resources", json=pdf_data)
        
        # Should return 422 for invalid path format
        assert response.status_code == 422
        errors = response.json()["detail"]
        error_str = str(errors).lower()
        assert "uploads" in error_str or "path" in error_str or "content" in error_str
    
    async def test_create_pdf_resource_not_pdf_extension(self, client: AsyncClient):
        """Test creating PDF resource with non-PDF file extension."""
        pdf_data = {
            "title": "Test PDF",
            "type": "pdf",
            "content": "uploads/test-file.jpg"  # Wrong extension
        }
        response = await client.post("/api/resources", json=pdf_data)
        
        # Should return 422 for non-PDF extension
        assert response.status_code == 422
        errors = response.json()["detail"]
        error_str = str(errors).lower()
        assert "pdf" in error_str or "extension" in error_str
    
    async def test_create_pdf_resource_missing_content(self, client: AsyncClient):
        """Test creating PDF resource without content."""
        pdf_data = {
            "title": "Test PDF",
            "type": "pdf"
            # Missing content
        }
        response = await client.post("/api/resources", json=pdf_data)
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("content" in str(error).lower() for error in errors)

