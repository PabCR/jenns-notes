"""Minimal packet endpoint coverage."""
from uuid import UUID

import pytest
from httpx import AsyncClient

from app.models.resource import Resource

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


async def _create_additional_resource(test_session, test_user_id: str, title: str) -> Resource:
    resource = Resource(
        user_id=UUID(test_user_id),
        title=title,
        type="note",
        content="Body",
        tags=[],
    )
    test_session.add(resource)
    await test_session.commit()
    await test_session.refresh(resource)
    return resource


async def _create_packet(client: AsyncClient, resource_id: str):
    response = await client.post(
        "/api/packets",
        json={"name": "Packet", "description": "Desc", "resourceIds": [resource_id]},
    )
    assert response.status_code == 201
    return response.json()


async def test_create_packet_with_resources(client: AsyncClient, sample_resource):
    payload = await _create_packet(client, str(sample_resource.id))
    assert payload["resourceCount"] == 1
    assert payload["resources"][0]["id"] == str(sample_resource.id)


async def test_list_packets_includes_resource_counts(client: AsyncClient, sample_resource):
    await _create_packet(client, str(sample_resource.id))

    response = await client.get("/api/packets")
    assert response.status_code == 200
    packets = response.json()
    assert packets
    assert packets[0]["resourceCount"] >= 1


async def test_get_packet_returns_owned_packet(client: AsyncClient, sample_resource):
    packet = await _create_packet(client, str(sample_resource.id))

    response = await client.get(f"/api/packets/{packet['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == packet["id"]


async def test_update_packet_can_swap_resources(
    client: AsyncClient,
    sample_resource,
    test_session,
    test_user_id: str,
):
    packet = await _create_packet(client, str(sample_resource.id))
    replacement = await _create_additional_resource(test_session, test_user_id, "Replacement")

    response = await client.patch(
        f"/api/packets/{packet['id']}",
        json={"resourceIds": [str(replacement.id)]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["resources"]) == 1
    assert payload["resources"][0]["id"] == str(replacement.id)


async def test_delete_packet_removes_packet_only(client: AsyncClient, sample_resource):
    packet = await _create_packet(client, str(sample_resource.id))

    response = await client.delete(f"/api/packets/{packet['id']}")
    assert response.status_code == 204

    packet_response = await client.get(f"/api/packets/{packet['id']}")
    assert packet_response.status_code == 404

    resource_response = await client.get(f"/api/resources/{sample_resource.id}")
    assert resource_response.status_code == 200
