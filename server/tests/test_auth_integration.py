"""Integration tests for authentication flow."""
import pytest
from unittest.mock import patch, Mock
from fastapi import status


class TestAuthIntegration:
    """Integration tests for complete authentication flows."""

    def test_complete_signup_flow(self, test_client, mock_supabase_client, valid_jwt_token):
        """Test complete signup flow: signup → can access protected endpoint."""
        # Step 1: User signs up (this would be done via frontend, but we test the backend accepts the token)
        # In a real scenario, Supabase would create the user and return a token
        # Here we test that once we have a token, the protected endpoint works

        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "id" in data
            assert "email" in data

    def test_complete_login_flow(self, test_client, mock_supabase_client, valid_jwt_token):
        """Test complete login flow: login → can access protected endpoint."""
        # Step 1: User logs in (frontend handles this)
        # Step 2: User accesses protected endpoint with token
        with patch("app.utils.auth.get_supabase_client", return_value=mock_supabase_client):
            response = test_client.get(
                "/api/me",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            assert response.status_code == status.HTTP_200_OK
            # Verify CORS headers are present
            assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers

    def test_authentication_required_for_protected_endpoints(self, test_client):
        """Test that protected endpoints require authentication."""
        response = test_client.get("/api/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        # Verify CORS headers are present even on error
        assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers

    def test_cors_preflight_works(self, test_client):
        """Test that CORS preflight requests work for protected endpoints."""
        response = test_client.options(
            "/api/me",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        # Verify CORS headers
        assert "access-control-allow-origin" in response.headers or "Access-Control-Allow-Origin" in response.headers

