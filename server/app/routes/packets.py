"""API routes for packet management."""
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.packet import PacketCreate, PacketResponse, PacketUpdate
from app.schemas.resource import ResourceResponse
from app.services.packet_service import (
    create_packet,
    delete_packet,
    get_packet_owned,
    list_packets,
    update_packet,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/packets", tags=["packets"])


@router.post("", response_model=PacketResponse, status_code=status.HTTP_201_CREATED)
async def create_packet_endpoint(
    packet_data: PacketCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new packet."""
    if not packet_data.resourceIds or len(packet_data.resourceIds) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one resource ID is required",
        )
    
    user_id = UUID(current_user["id"])
    packet = await create_packet(user_id, packet_data, db)
    
    # Build response with resources
    response = PacketResponse.model_validate(packet)
    response.resources = [ResourceResponse.model_validate(r) for r in packet.resources]
    response.resource_count = len(packet.resources)
    return response


@router.get("", response_model=List[PacketResponse])
async def list_packets_endpoint(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all packets for the current user with resource counts."""
    user_id = UUID(current_user["id"])
    packets = await list_packets(user_id, db)
    
    # Build responses with resources and counts
    responses = []
    for packet in packets:
        response = PacketResponse.model_validate(packet)
        response.resources = [ResourceResponse.model_validate(r) for r in packet.resources]
        # Use resource_count if available, otherwise len(resources)
        response.resource_count = getattr(packet, 'resource_count', len(packet.resources))
        responses.append(response)
    
    return responses


@router.get("/{packet_id}", response_model=PacketResponse)
async def get_packet_endpoint(
    packet_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single packet by ID."""
    user_id = UUID(current_user["id"])
    packet = await get_packet_owned(packet_id, user_id, db)
    if not packet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packet not found",
        )
    
    # Build response with resources
    response = PacketResponse.model_validate(packet)
    response.resources = [ResourceResponse.model_validate(r) for r in packet.resources]
    response.resource_count = len(packet.resources)
    return response


@router.patch("/{packet_id}", response_model=PacketResponse)
async def update_packet_endpoint(
    packet_id: UUID,
    packet_data: PacketUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update packet metadata."""
    user_id = UUID(current_user["id"])
    packet = await get_packet_owned(packet_id, user_id, db)
    if not packet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packet not found",
        )
    
    updated_packet = await update_packet(packet, packet_data, db)
    
    # Build response with resources
    response = PacketResponse.model_validate(updated_packet)
    response.resources = [ResourceResponse.model_validate(r) for r in updated_packet.resources]
    response.resource_count = len(updated_packet.resources)
    return response


@router.delete("/{packet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_packet_endpoint(
    packet_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a packet."""
    user_id = UUID(current_user["id"])
    packet = await get_packet_owned(packet_id, user_id, db)
    if not packet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packet not found",
        )
    
    await delete_packet(packet, db)
    return None
