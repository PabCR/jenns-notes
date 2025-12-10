"""Regression tests for the Gemini auto-tagging endpoint."""
from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.schemas.gemini import ResourceMetadata

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


async def test_generate_tags_for_note_success(client: AsyncClient):
    with patch("app.services.resource_metadata_service.generate_resource_metadata") as mock_generate:
        mock_generate.return_value = ResourceMetadata(
            tags=["oncology", "care"],
            description="Helpful summary",
            condition="oncology",
            audience="patients",
            topic="education",
        )

        response = await client.post(
            "/api/resources/generate-tags",
            data={"type": "note", "content": "Cancer care notes"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["tags"]
    assert payload["description"]


async def test_generate_tags_invalid_type(client: AsyncClient):
    response = await client.post(
        "/api/resources/generate-tags",
        json={"type": "invalid", "content": "whatever"},
    )

    assert response.status_code == 422
