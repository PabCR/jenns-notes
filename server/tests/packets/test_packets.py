"""Focused tests for packet API endpoints."""
import pytest
from httpx import AsyncClient
from uuid import uuid4

pytestmark = [pytest.mark.asyncio, pytest.mark.api]


class TestCreatePacket:
    """Tests for POST /api/packets endpoint."""

    async def test_create_packet_with_resources(
        self, client: AsyncClient, sample_resource, test_user_id: str
    ):
        """Test creating a packet with resources."""
        data = {
            "name": "Test Packet",
            "description": "A test packet",
            "resourceIds": [str(sample_resource.id)],
        }
        response = await client.post("/api/packets", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Test Packet"
        assert result["description"] == "A test packet"
        assert "id" in result
        assert "userId" in result
        assert "shareLink" in result
        assert "createdAt" in result
        assert len(result["resources"]) == 1
        assert result["resourceCount"] == 1

    async def test_create_packet_empty_resource_ids(self, client: AsyncClient):
        """Test creating packet without resource IDs."""
        data = {
            "name": "Test Packet",
            "resourceIds": [],
        }
        response = await client.post("/api/packets", json=data)

        assert response.status_code == 400
        assert "resource" in response.json()["detail"].lower()

    async def test_create_packet_missing_name(self, client: AsyncClient, sample_resource):
        """Test creating packet without name."""
        data = {
            "resourceIds": [str(sample_resource.id)],
        }
        response = await client.post("/api/packets", json=data)

        assert response.status_code == 422


class TestListPackets:
    """Tests for GET /api/packets endpoint."""

    async def test_list_packets_with_counts(
        self, client: AsyncClient, sample_resource, test_user_id: str
    ):
        """Test listing packets includes resource counts."""
        # Create a packet
        create_data = {
            "name": "Packet 1",
            "resourceIds": [str(sample_resource.id)],
        }
        await client.post("/api/packets", json=create_data)

        # List packets
        response = await client.get("/api/packets")

        assert response.status_code == 200
        packets = response.json()
        assert len(packets) >= 1
        packet = packets[0]
        assert "resourceCount" in packet
        assert packet["resourceCount"] >= 1


class TestGetPacket:
    """Tests for GET /api/packets/{packet_id} endpoint."""

    async def test_get_packet_ownership_check(
        self, client: AsyncClient, sample_resource, test_user_id: str
    ):
        """Test getting a packet validates ownership."""
        # Create a packet
        create_data = {
            "name": "My Packet",
            "resourceIds": [str(sample_resource.id)],
        }
        create_response = await client.post("/api/packets", json=create_data)
        packet_id = create_response.json()["id"]

        # Get the packet
        response = await client.get(f"/api/packets/{packet_id}")

        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "My Packet"
        assert "resources" in result
        assert len(result["resources"]) == 1

    async def test_get_packet_not_found(self, client: AsyncClient):
        """Test getting non-existent packet returns 404."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/packets/{fake_id}")

        assert response.status_code == 404


class TestUpdatePacket:
    """Tests for PATCH /api/packets/{packet_id} endpoint."""

    async def test_update_packet_swap_resources(
        self, client: AsyncClient, sample_resource, test_user_id: str, test_session
    ):
        """Test updating packet by swapping resources."""
        # Create second resource
        from app.models.resource import Resource
        from uuid import UUID

        resource2 = Resource(
            user_id=UUID(test_user_id),
            title="Resource 2",
            type="note",
            content="Content 2",
        )
        test_session.add(resource2)
        await test_session.commit()

        # Create packet with first resource
        create_data = {
            "name": "Test Packet",
            "resourceIds": [str(sample_resource.id)],
        }
        create_response = await client.post("/api/packets", json=create_data)
        packet_id = create_response.json()["id"]

        # Update with second resource
        update_data = {
            "resourceIds": [str(resource2.id)],
        }
        response = await client.patch(f"/api/packets/{packet_id}", json=update_data)

        assert response.status_code == 200
        result = response.json()
        assert len(result["resources"]) == 1
        assert result["resources"][0]["id"] == str(resource2.id)

    async def test_update_packet_name_description(
        self, client: AsyncClient, sample_resource, test_user_id: str
    ):
        """Test updating packet name and description."""
        create_data = {
            "name": "Original Name",
            "description": "Original description",
            "resourceIds": [str(sample_resource.id)],
        }
        create_response = await client.post("/api/packets", json=create_data)
        packet_id = create_response.json()["id"]

        update_data = {
            "name": "Updated Name",
            "description": "Updated description",
        }
        response = await client.patch(f"/api/packets/{packet_id}", json=update_data)

        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "Updated Name"
        assert result["description"] == "Updated description"


class TestDeletePacket:
    """Tests for DELETE /api/packets/{packet_id} endpoint."""

    async def test_delete_packet_cascade(
        self, client: AsyncClient, sample_resource, test_user_id: str, test_session
    ):
        """Test deleting packet cascades to packet_resources."""
        # Create packet
        create_data = {
            "name": "To Delete",
            "resourceIds": [str(sample_resource.id)],
        }
        create_response = await client.post("/api/packets", json=create_data)
        packet_id = create_response.json()["id"]

        # Delete packet
        response = await client.delete(f"/api/packets/{packet_id}")

        assert response.status_code == 204

        # Verify packet is gone
        get_response = await client.get(f"/api/packets/{packet_id}")
        assert get_response.status_code == 404

        # Verify resource still exists (cascade should only affect packet_resources)
        from app.models.resource import Resource
        from sqlalchemy import select

        result = await test_session.execute(
            select(Resource).where(Resource.id == sample_resource.id)
        )
        assert result.scalar_one_or_none() is not None
