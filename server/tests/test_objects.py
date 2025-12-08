"""Tests for object storage API endpoints."""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from uuid import uuid4


@pytest.mark.asyncio
@pytest.mark.api
class TestPresignedUrlEndpoint:
    """Tests for POST /api/objects/upload endpoint."""
    
    async def test_create_presigned_url_valid(self, client: AsyncClient):
        """Test creating a presigned URL with valid filename."""
        with patch('app.routes.objects.get_supabase_storage_client') as mock_storage:
            # Mock the storage client response
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_storage_obj = MagicMock()
            mock_response = {
                'signed_url': 'https://storage.supabase.co/object/sign/upload/path?token=abc123',
                'token': 'abc123',
                'path': 'uploads/test-uuid.pdf'
            }
            mock_bucket.create_signed_upload_url.return_value = mock_response
            mock_storage_obj.from_.return_value = mock_bucket
            mock_client.storage = mock_storage_obj
            mock_storage.return_value = mock_client
            
            response = await client.post(
                "/api/objects/upload",
                json={"filename": "test.pdf"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "uploadUrl" in data
            assert "filePath" in data
            assert data["filePath"].startswith("uploads/")
            assert data["filePath"].endswith(".pdf")
            assert "test-uuid" in data["filePath"] or len(data["filePath"]) > 15  # UUID in path
    
    async def test_create_presigned_url_requires_auth(self, client: AsyncClient):
        """Test that presigned URL endpoint requires authentication."""
        # Create a client without auth override
        from app.main import app
        from app.utils.auth import get_current_user
        from fastapi import HTTPException
        
        # Temporarily remove auth override
        original_override = app.dependency_overrides.get(get_current_user)
        if get_current_user in app.dependency_overrides:
            del app.dependency_overrides[get_current_user]
        
        # Override to raise 401
        def raise_401():
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        app.dependency_overrides[get_current_user] = raise_401
        
        try:
            response = await client.post(
                "/api/objects/upload",
                json={"filename": "test.pdf"}
            )
            assert response.status_code == 401
        finally:
            # Restore original override
            if original_override:
                app.dependency_overrides[get_current_user] = original_override
            elif get_current_user in app.dependency_overrides:
                del app.dependency_overrides[get_current_user]
    
    async def test_create_presigned_url_validates_extension(self, client: AsyncClient):
        """Test that presigned URL endpoint validates file extension."""
        with patch('app.routes.objects.get_supabase_storage_client'):
            # Test with non-PDF extension
            response = await client.post(
                "/api/objects/upload",
                json={"filename": "test.jpg"}
            )
            
            assert response.status_code == 422
            errors = response.json()["detail"]
            error_str = str(errors).lower()
            assert "pdf" in error_str or "extension" in error_str
    
    async def test_create_presigned_url_generates_unique_paths(self, client: AsyncClient):
        """Test that multiple requests generate different file paths."""
        with patch('app.routes.objects.get_supabase_storage_client') as mock_storage:
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_storage_obj = MagicMock()
            mock_storage_obj.from_.return_value = mock_bucket
            mock_client.storage = mock_storage_obj
            mock_storage.return_value = mock_client
            
            # Generate multiple presigned URLs
            paths = []
            for i in range(3):
                mock_response = {
                    'signed_url': f'https://storage.supabase.co/object/sign/upload/path?token=abc{i}',
                    'token': f'abc{i}',
                    'path': f'uploads/test-uuid-{i}.pdf'
                }
                mock_bucket.create_signed_upload_url.return_value = mock_response
                
                response = await client.post(
                    "/api/objects/upload",
                    json={"filename": "test.pdf"}
                )
                
                assert response.status_code == 200
                data = response.json()
                paths.append(data["filePath"])
            
            # All paths should be different (or at least have different UUIDs)
            # Since we're mocking, we'll just verify the endpoint works multiple times
            assert len(set(paths)) == 3  # All should be unique in our mock


@pytest.mark.asyncio
@pytest.mark.api
class TestFileServingEndpoint:
    """Tests for GET /objects/{path} endpoint."""
    
    async def test_serve_pdf_file_valid(self, client: AsyncClient):
        """Test serving a PDF file with correct headers."""
        with patch('app.routes.objects.get_supabase_storage_client') as mock_storage:
            # Mock file download
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_storage_obj = MagicMock()
            mock_file_data = b"%PDF-1.4 fake pdf content"
            mock_bucket.download.return_value = mock_file_data
            mock_storage_obj.from_.return_value = mock_bucket
            mock_client.storage = mock_storage_obj
            mock_storage.return_value = mock_client
            
            response = await client.get("/objects/uploads/test-file.pdf")
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "application/pdf"
            assert "inline" in response.headers.get("content-disposition", "").lower()
            assert response.content == mock_file_data
    
    async def test_serve_file_missing(self, client: AsyncClient):
        """Test serving a non-existent file returns 404."""
        with patch('app.routes.objects.get_supabase_storage_client') as mock_storage:
            # Mock file not found
            mock_client = MagicMock()
            mock_bucket = MagicMock()
            mock_storage_obj = MagicMock()
            mock_bucket.download.side_effect = Exception("File not found")
            mock_storage_obj.from_.return_value = mock_bucket
            mock_client.storage = mock_storage_obj
            mock_storage.return_value = mock_client
            
            response = await client.get("/objects/uploads/nonexistent.pdf")
            
            assert response.status_code == 404
    
    async def test_serve_file_validates_path_traversal(self, client: AsyncClient):
        """Test that path traversal attacks are prevented."""
        with patch('app.routes.objects.get_supabase_storage_client'):
            # Try to access files outside uploads directory
            response = await client.get("/objects/../../../etc/passwd")
            
            # Should either return 404 or 422
            assert response.status_code in [404, 422]
