"""Pytest configuration and shared fixtures."""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def test_client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_supabase_user():
    """Mock Supabase user object."""
    user = Mock()
    user.id = "test-user-id-123"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_supabase_response(mock_supabase_user):
    """Mock Supabase auth.get_user response."""
    response = Mock()
    response.user = mock_supabase_user
    return response


@pytest.fixture
def mock_supabase_client(mock_supabase_response):
    """Mock Supabase client."""
    client = Mock()
    client.auth = Mock()
    client.auth.get_user = Mock(return_value=mock_supabase_response)
    return client


@pytest.fixture
def valid_jwt_token():
    """Sample JWT token for testing."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQtMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.test_signature"


@pytest.fixture
def mock_user_data():
    """Mock user data dictionary."""
    return {
        "id": "test-user-id-123",
        "email": "test@example.com",
    }

