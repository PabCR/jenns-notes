"""User fixtures for authenticated requests."""
import pytest
from uuid import uuid4


@pytest.fixture
def test_user_id() -> str:
    """Return a test user ID."""
    return str(uuid4())


@pytest.fixture
def test_user_dict(test_user_id: str) -> dict:
    """Return a test user dictionary."""
    return {
        "id": test_user_id,
        "email": "test@example.com",
    }
