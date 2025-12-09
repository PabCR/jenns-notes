"""Generate-tags endpoint tests for Gemini metadata."""
import pytest
from unittest.mock import patch
from httpx import AsyncClient
from app.schemas.gemini import ResourceMetadata

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


class TestGenerateTagsEndpoint:
    """Tests for generate-tags API endpoint."""

    async def test_generate_tags_note_success(self, client: AsyncClient, mock_gemini_response):
        """Test successful tag generation for note."""
        with patch('app.routes.resources.generate_resource_metadata') as mock_generate:
            mock_generate.return_value = ResourceMetadata(
                tags=["oncology", "patient education", "cancer"],
                description="A helpful resource about cancer care",
                condition="general oncology",
                audience="patients",
                topic="patient education",
            )

            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "This is a note about cancer treatment options.",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "tags" in data
            assert len(data["tags"]) > 0
            assert "description" in data

    async def test_generate_tags_link_success(self, client: AsyncClient):
        """Test successful tag generation for link."""
        with patch('app.routes.resources.extract_webpage_content') as mock_extract, \
             patch('app.routes.resources.generate_resource_metadata') as mock_generate:

            mock_extract.return_value = "Sample webpage content about breast cancer treatment"
            mock_generate.return_value = ResourceMetadata(
                tags=["breast cancer", "treatment", "oncology"],
                description="Information about breast cancer treatment options",
                condition="breast cancer",
                audience="patients",
                topic="treatment options",
            )

            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "link",
                    "content": "https://example.com/cancer-info",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "tags" in data

    async def test_generate_tags_invalid_type(self, client: AsyncClient):
        """Test invalid resource type handling."""
        response = await client.post(
            "/api/resources/generate-tags",
            json={"type": "invalid", "content": "some content"},
        )

        assert response.status_code == 422
        data = response.json()
        assert "Invalid resource type" in data["detail"]

    async def test_generate_tags_empty_content(self, client: AsyncClient):
        """Test empty content after extraction."""
        with patch('app.routes.resources.extract_note_content') as mock_extract:
            mock_extract.return_value = ""

            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "",
                },
            )

            assert response.status_code == 422
            data = response.json()
            assert "empty content" in data["detail"].lower()

    async def test_generate_tags_gemini_api_error(self, client: AsyncClient):
        """Test Gemini API failure handling."""
        with patch('app.routes.resources.extract_note_content') as mock_extract, \
             patch('app.routes.resources.generate_resource_metadata') as mock_generate:

            mock_extract.return_value = "Sample content"
            mock_generate.side_effect = Exception("Gemini API error")

            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "Sample note",
                },
            )

            assert response.status_code == 500
            data = response.json()
            assert "Failed to generate metadata" in data["detail"]

    async def test_generate_tags_invalid_response(self, client: AsyncClient):
        """Test invalid JSON response from Gemini."""
        with patch('app.routes.resources.extract_note_content') as mock_extract, \
             patch('app.routes.resources.generate_resource_metadata') as mock_generate:

            mock_extract.return_value = "Sample content"
            mock_generate.side_effect = ValueError("Invalid response format")

            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "Sample note",
                },
            )

            assert response.status_code == 422


@pytest.fixture
def mock_gemini_response():
    """Fixture for mocking Gemini API responses."""
    return ResourceMetadata(
        tags=["test", "tag"],
        description="Test description",
        condition="test condition",
        audience="test audience",
        topic="test topic",
    )
