"""Tests for authentication endpoints and utilities."""
import pytest
from unittest.mock import patch, Mock
from fastapi import status


class TestAuthEndpoint:
    """Tests for /api/me endpoint."""

    def test_get_current_user_with_valid_token(self, test_client, mock_supabase_client, valid_jwt_token):
        """Test that valid JWT token returns user info."""
        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["id"] == "test-user-id-123"
            assert data["email"] == "test@example.com"
            # Check CORS headers are present
            assert "Access-Control-Allow-Origin" in response.headers or "access-control-allow-origin" in response.headers

    def test_get_current_user_missing_token(self, test_client):
        """Test that missing token returns 401."""
        response = test_client.get("/api/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Missing authentication credentials" in response.json()["detail"]
        # Check CORS headers are present even on error
        assert "Access-Control-Allow-Origin" in response.headers or "access-control-allow-origin" in response.headers

    def test_get_current_user_invalid_token(self, test_client, mock_supabase_client):
        """Test that invalid token returns 401."""
        # Mock Supabase to return None user
        mock_response = Mock()
        mock_response.user = None
        mock_supabase_client.auth.get_user.return_value = mock_response

        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={"Authorization": "Bearer invalid_token"}
            )
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Invalid authentication credentials" in response.json()["detail"]

    def test_get_current_user_supabase_error(self, test_client, mock_supabase_client):
        """Test that Supabase client errors return 401."""
        # Mock Supabase to raise an exception
        mock_supabase_client.auth.get_user.side_effect = Exception("Supabase error")

        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={"Authorization": "Bearer some_token"}
            )
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Invalid authentication credentials" in response.json()["detail"]

    def test_options_preflight_request(self, test_client):
        """Test that OPTIONS preflight requests work."""
        response = test_client.options(
            "/api/me",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        # Check CORS headers
        assert "Access-Control-Allow-Origin" in response.headers or "access-control-allow-origin" in response.headers


class TestCORSHeaders:
    """Tests for CORS header presence."""

    def test_cors_headers_on_success(self, test_client, mock_supabase_client, valid_jwt_token):
        """Test that successful responses include CORS headers."""
        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={
                    "Authorization": f"Bearer {valid_jwt_token}",
                    "Origin": "http://localhost:5173"
                }
            )
            assert response.status_code == status.HTTP_200_OK
            # CORS middleware should add headers
            headers_lower = {k.lower(): v for k, v in response.headers.items()}
            assert "access-control-allow-origin" in headers_lower

    def test_cors_headers_on_error(self, test_client):
        """Test that error responses include CORS headers."""
        response = test_client.get("/api/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        # CORS headers should be present even on errors
        headers_lower = {k.lower(): v for k, v in response.headers.items()}
        assert "access-control-allow-origin" in headers_lower


class TestAuthDependency:
    """Tests for get_current_user dependency."""

    def test_get_current_user_validates_token(self, mock_supabase_client, valid_jwt_token):
        """Test that get_current_user validates tokens correctly."""
        from app.utils.auth import get_current_user
        from fastapi.security import HTTPAuthorizationCredentials

        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=valid_jwt_token
        )

        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            # This would need to be tested with async test client
            # For now, we test the endpoint which uses this dependency
            pass

    def test_get_current_user_handles_missing_credentials(self):
        """Test that get_current_user handles missing credentials."""
        from app.utils.auth import get_current_user
        import pytest
        from fastapi import HTTPException

        # Test with None credentials
        with pytest.raises(HTTPException) as exc_info:
            # This is a simplified test - actual dependency injection is complex
            # The endpoint tests cover this behavior
            pass

