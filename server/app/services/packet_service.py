"""Packet CRUD service helpers to keep route handlers lean."""
import logging
from typing import List, Optional, Sequence
from uuid import UUID

from fastapi import HTTPException, status
from nanoid import generate
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.packet import Packet
from app.models.resource import Resource
from app.schemas.packet import PacketCreate, PacketUpdate

logger = logging.getLogger(__name__)


async def _validate_resource_ids(
    resource_ids: Sequence[UUID], db: AsyncSession
) -> List[UUID]:
    """Ensure IDs are unique, non-empty, and exist."""
    if not resource_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one resource ID is required",
        )

    if len(set(resource_ids)) != len(resource_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resourceIds must be unique",
        )

    result = await db.execute(
        select(Resource.id).where(Resource.id.in_(resource_ids))
    )
    found_ids = {row[0] for row in result.all()}
    missing = set(resource_ids) - found_ids

    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing or unauthorized resource IDs: {', '.join(str(m) for m in missing)}",
        )

    return list(resource_ids)


async def _load_resources(resource_ids: Sequence[UUID], db: AsyncSession) -> List[Resource]:
    """Fetch resources in the order of the provided IDs."""
    if not resource_ids:
        return []

    result = await db.execute(
        select(Resource).where(Resource.id.in_(resource_ids))
    )
    resources = list(result.scalars().all())
    order = {rid: idx for idx, rid in enumerate(resource_ids)}
    resources.sort(key=lambda r: order.get(r.id, len(order)))
    return resources


async def create_packet(
    user_id: UUID, data: PacketCreate, db: AsyncSession
) -> Packet:
    """Create a new packet with resources for the current user."""
    resource_ids = await _validate_resource_ids(data.resourceIds, db)

    # Generate 10-character nanoid for share_link
    share_link = generate(size=10)
    
    # Create packet
    packet = Packet(
        user_id=user_id,
        name=data.name,
        description=data.description,
        share_link=share_link,
        resource_ids=resource_ids,
    )
    db.add(packet)
    await db.commit()
    await db.refresh(packet)

    # Attach ordered resources for downstream consumers
    packet.resources = await _load_resources(resource_ids, db)
    return packet


async def list_packets(
    user_id: UUID, db: AsyncSession
) -> List[Packet]:
    """Return user packets with resource counts."""
    query = (
        select(
            Packet,
            func.coalesce(func.cardinality(Packet.resource_ids), 0).label("resource_count"),
        )
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
        packet.resources = await _load_resources(packet.resource_ids or [], db)
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
            packet.resource_ids = await _validate_resource_ids(resource_ids, db)
    
    await db.commit()
    await db.refresh(packet)
    packet.resources = await _load_resources(packet.resource_ids or [], db)
    return packet


async def delete_packet(packet: Packet, db: AsyncSession) -> None:
    """Remove a packet."""
    await db.execute(delete(Packet).where(Packet.id == packet.id))
    await db.commit()
