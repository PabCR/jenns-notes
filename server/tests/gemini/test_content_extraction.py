"""Content extraction utility tests for Gemini tagging."""
import pytest
from unittest.mock import Mock, patch

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


class TestContentExtraction:
    """Tests for content extraction utilities."""

    @patch('app.utils.content_extraction.httpx')
    def test_extract_webpage_content_success(self, mock_httpx):
        """Test successful webpage content extraction."""
        from app.utils.content_extraction import extract_webpage_content

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
