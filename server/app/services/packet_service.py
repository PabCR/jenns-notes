"""Packet CRUD service helpers to keep route handlers lean."""
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from nanoid import generate
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.packet import Packet, PacketResource
from app.models.resource import Resource
from app.schemas.packet import PacketCreate, PacketUpdate

logger = logging.getLogger(__name__)


async def create_packet(
    user_id: UUID, data: PacketCreate, db: AsyncSession
) -> Packet:
    """Create a new packet with resources for the current user."""
    # Generate 10-character nanoid for share_link
    share_link = generate(size=10)
    
    # Create packet
    packet = Packet(
        user_id=user_id,
        name=data.name,
        description=data.description,
        share_link=share_link,
    )
    db.add(packet)
    await db.flush()  # Flush to get packet.id
    
    # Bulk insert packet_resources with position
    packet_resources = [
        PacketResource(
            packet_id=packet.id,
            resource_id=resource_id,
            position=idx
        )
        for idx, resource_id in enumerate(data.resourceIds)
    ]
    db.add_all(packet_resources)
    
    await db.commit()
    await db.refresh(packet)
    return packet


async def list_packets(
    user_id: UUID, db: AsyncSession
) -> List[Packet]:
    """Return user packets with resource counts."""
    # Query packets with resource counts
    query = (
        select(
            Packet,
            func.count(PacketResource.resource_id).label("resource_count")
        )
        .outerjoin(PacketResource, Packet.id == PacketResource.packet_id)
        .where(Packet.user_id == user_id)
        .group_by(Packet.id)
        .order_by(Packet.created_at.desc())
    )
    
    result = await db.execute(query)
    packets = []
    for row in result.all():
        packet = row[0]
        # Attach resource_count as a temporary attribute
        packet.resource_count = row[1] if row[1] else 0
        packets.append(packet)
    
    return packets


async def get_packet_owned(
    packet_id: UUID, user_id: UUID, db: AsyncSession
) -> Optional[Packet]:
    """Fetch a packet with resources and ensure it belongs to the current user."""
    result = await db.execute(
        select(Packet).where(
            Packet.id == packet_id,
            Packet.user_id == user_id,
        )
    )
    packet = result.scalar_one_or_none()
    if packet:
        # Eager load resources
        await db.refresh(packet, ["resources"])
    return packet


async def update_packet(
    packet: Packet, data: PacketUpdate, db: AsyncSession
) -> Packet:
    """Apply partial updates and persist."""
    update_data = data.model_dump(exclude_unset=True, exclude={"resourceIds"})
    
    # Update name/description
    for field, value in update_data.items():
        setattr(packet, field, value)
    
    # If resourceIds provided, replace packet_resources
    if "resourceIds" in data.model_dump(exclude_unset=True):
        resource_ids = data.resourceIds
        if resource_ids is not None:
            # Delete existing packet_resources
            await db.execute(
                delete(PacketResource).where(PacketResource.packet_id == packet.id)
            )
            
            # Insert new packet_resources with position
            packet_resources = [
                PacketResource(
                    packet_id=packet.id,
                    resource_id=resource_id,
                    position=idx
                )
                for idx, resource_id in enumerate(resource_ids)
            ]
            db.add_all(packet_resources)
    
    await db.commit()
    await db.refresh(packet)
    return packet


async def delete_packet(packet: Packet, db: AsyncSession) -> None:
    """Remove a packet and its packet_resources."""
    # Delete packet_resources first
    await db.execute(
        delete(PacketResource).where(PacketResource.packet_id == packet.id)
    )
    # Then delete the packet
    await db.execute(delete(Packet).where(Packet.id == packet.id))
    await db.commit()
