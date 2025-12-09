"""Resource fixtures used across API tests."""
import pytest
from uuid import UUID

from app.models.resource import Resource
from tests.fixtures.database import TestResourceModel, USE_POSTGRES


@pytest.fixture
async def sample_resource(test_session, test_user_id: str):
    """Create a sample resource for testing."""
    if USE_POSTGRES:
        resource = Resource(
            user_id=UUID(test_user_id),
            title="Test Resource",
            description="Test description",
            type="note",
            content="Test content",
            tags=["tag1", "tag2"],
        )
    else:
        resource = TestResourceModel(
            user_id=test_user_id,
            title="Test Resource",
            description="Test description",
            type="note",
            content="Test content",
            tags=["tag1", "tag2"],
        )

    test_session.add(resource)
    await test_session.commit()
    await test_session.refresh(resource)
    return resource


@pytest.fixture
def valid_resource_data() -> dict:
    """Return valid resource creation data."""
    return {
        "title": "Test Note",
        "description": "A test note description",
        "type": "note",
        "content": "This is the note content",
        "tags": ["test", "note"],
    }
