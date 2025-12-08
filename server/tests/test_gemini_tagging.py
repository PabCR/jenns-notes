"""Tests for Gemini AI tagging functionality."""
import pytest
from unittest.mock import Mock, patch
from httpx import AsyncClient
from app.schemas.gemini import ResourceMetadata


@pytest.mark.asyncio
@pytest.mark.api
class TestContentExtraction:
    """Tests for content extraction utilities."""
    
    @patch('app.utils.content_extraction.httpx')
    def test_extract_webpage_content_success(self, mock_httpx):
        """Test successful webpage content extraction."""
        from app.utils.content_extraction import extract_webpage_content
        
        # Mock HTTP response
        mock_response = Mock()
        mock_response.text = "<html><body><p>Sample webpage content</p></body></html>"
        mock_response.raise_for_status = Mock()
        
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=False)
        mock_client.get.return_value = mock_response
        mock_httpx.Client.return_value = mock_client
        
        result = extract_webpage_content("https://example.com")
        assert "Sample webpage content" in result
    
    @patch('app.utils.content_extraction.httpx')
    def test_extract_webpage_content_invalid_url(self, mock_httpx):
        """Test invalid URL handling."""
        from app.utils.content_extraction import extract_webpage_content
        
        # Mock HTTP error
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=False)
        mock_client.get.side_effect = Exception("Invalid URL")
        mock_httpx.Client.return_value = mock_client
        
        result = extract_webpage_content("https://invalid-url")
        assert result == ""
    
    @patch('app.utils.content_extraction.httpx')
    def test_extract_webpage_content_timeout(self, mock_httpx):
        """Test network timeout handling."""
        from app.utils.content_extraction import extract_webpage_content
        from httpx import TimeoutException
        
        # Mock timeout exception
        mock_client = Mock()
        mock_client.__enter__ = Mock(return_value=mock_client)
        mock_client.__exit__ = Mock(return_value=False)
        mock_client.get.side_effect = TimeoutException("Request timed out")
        mock_httpx.Client.return_value = mock_client
        
        result = extract_webpage_content("https://slow-site.com")
        assert result == ""
    
    def test_extract_note_content_direct(self):
        """Test note content direct pass-through."""
        from app.utils.content_extraction import extract_note_content
        
        content = "This is a sample note content."
        result = extract_note_content(content)
        assert result == content
    
    def test_extract_note_content_truncation(self):
        """Test note content truncation."""
        from app.utils.content_extraction import extract_note_content
        
        long_content = "A" * 10000
        result = extract_note_content(long_content, max_chars=8000)
        assert len(result) == 8000


@pytest.mark.asyncio
@pytest.mark.api
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
                topic="patient education"
            )
            
            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "This is a note about cancer treatment options."
                }
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
                topic="treatment options"
            )
            
            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "link",
                    "content": "https://example.com/cancer-info"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "tags" in data
    
    async def test_generate_tags_invalid_type(self, client: AsyncClient):
        """Test invalid resource type handling."""
        response = await client.post(
            "/api/resources/generate-tags",
            json={
                "type": "invalid",
                "content": "some content"
            }
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
                    "content": ""
                }
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
                    "content": "Sample note"
                }
            )
            
            assert response.status_code == 500
            data = response.json()
            assert "Failed to generate metadata" in data["detail"]
    
    async def test_generate_tags_invalid_response(self, client: AsyncClient):
        """Test invalid JSON response from Gemini."""
        with patch('app.routes.resources.extract_note_content') as mock_extract, \
             patch('app.routes.resources.generate_resource_metadata') as mock_generate:
            
            mock_extract.return_value = "Sample content"
            # Simulate validation error
            from pydantic import ValidationError
            mock_generate.side_effect = ValueError("Invalid response format")
            
            response = await client.post(
                "/api/resources/generate-tags",
                json={
                    "type": "note",
                    "content": "Sample note"
                }
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
        topic="test topic"
    )
