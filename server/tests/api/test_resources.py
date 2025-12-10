"""Minimal regression coverage for resource endpoints."""
from uuid import UUID

import pytest
from httpx import AsyncClient

from app.models.resource import Resource

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


async def test_create_note_resource_success(client: AsyncClient, valid_resource_data: dict):
    response = await client.post("/api/resources", json=valid_resource_data)

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == valid_resource_data["title"]
    assert payload["type"] == "note"
    assert payload["tags"] == valid_resource_data["tags"]


async def test_create_note_requires_title(client: AsyncClient):
    response = await client.post(
        "/api/resources",
        json={"type": "note", "content": "Test"},
    )
    assert response.status_code == 422


async def test_list_resources_with_existing_data(
    client: AsyncClient,
    sample_resource,
):
    response = await client.get("/api/resources")

    assert response.status_code == 200
    payload = response.json()
    assert any(r["id"] == str(sample_resource.id) for r in payload)


async def test_get_resource_returns_owned_record(
    client: AsyncClient,
    sample_resource,
):
    response = await client.get(f"/api/resources/{sample_resource.id}")
    assert response.status_code == 200
    assert response.json()["id"] == str(sample_resource.id)


async def test_update_resource_allows_metadata_changes(
    client: AsyncClient,
    sample_resource,
):
    response = await client.patch(
        f"/api/resources/{sample_resource.id}",
        json={"title": "Updated", "description": "Changed", "tags": ["a"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["description"] == "Changed"
    assert data["tags"] == ["a"]


async def test_delete_resource_removes_record(
    client: AsyncClient,
    sample_resource,
):
    response = await client.delete(f"/api/resources/{sample_resource.id}")
    assert response.status_code == 204

    get_response = await client.get(f"/api/resources/{sample_resource.id}")
    assert get_response.status_code == 404


async def test_search_matches_title_description_and_tags(
    client: AsyncClient,
    test_session,
    test_user_id: str,
):
    oncology = Resource(
        user_id=UUID(test_user_id),
        title="Oncology Treatment Guide",
        description="Helpful oncology summary",
        type="note",
        content="Body",
        tags=["oncology"],
    )
    card = Resource(
        user_id=UUID(test_user_id),
        title="Cardiology Reference",
        description="Heart health",
        type="note",
        content="Body",
        tags=["cardio"],
    )
    test_session.add_all([oncology, card])
    await test_session.commit()

    response = await client.get("/api/resources?search=oncology")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["title"] == "Oncology Treatment Guide"


async def test_type_filter_returns_requested_resource_type(
    client: AsyncClient,
    test_session,
    test_user_id: str,
):
    note = Resource(
        user_id=UUID(test_user_id),
        title="Plain Note",
        type="note",
        content="Content",
        tags=[],
    )
    link = Resource(
        user_id=UUID(test_user_id),
        title="My Link",
        type="link",
        content="https://example.com",
        tags=["link"],
    )
    test_session.add_all([note, link])
    await test_session.commit()

    response = await client.get("/api/resources?type=link")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["type"] == "link"


async def test_create_link_resource_success(client: AsyncClient):
    response = await client.post(
        "/api/resources",
        json={
            "title": "Example Link",
            "type": "link",
            "content": "https://example.com/path",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["type"] == "link"
    assert payload["content"] == "https://example.com/path"


async def test_create_link_resource_validates_url(client: AsyncClient):
    response = await client.post(
        "/api/resources",
        json={
            "title": "Bad Link",
            "type": "link",
            "content": "not-a-url",
        },
    )
    assert response.status_code == 422


async def test_create_pdf_resource_success(client: AsyncClient):
    response = await client.post(
        "/api/resources",
        json={
            "title": "Test PDF",
            "type": "pdf",
            "content": "uploads/sample-file.pdf",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["type"] == "pdf"
    assert payload["content"].startswith("uploads/")
    assert payload["content"].endswith(".pdf")


async def test_create_pdf_resource_validates_storage_path(client: AsyncClient):
    response = await client.post(
        "/api/resources",
        json={
            "title": "Bad PDF",
            "type": "pdf",
            "content": "bad/path.doc",
        },
    )
    assert response.status_code == 422
