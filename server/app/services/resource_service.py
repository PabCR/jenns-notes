"""Resource CRUD service helpers to keep route handlers lean."""
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Resource
from app.models.packet import Packet
from app.schemas.resource import ResourceCreate, ResourceUpdate
from app.utils.supabase import delete_file_from_storage

logger = logging.getLogger(__name__)


async def create_resource_entry(
    resource_data: ResourceCreate, user_id: UUID, db: AsyncSession
) -> Resource:
    """Persist a new resource for the current user."""
    resource = Resource(
        user_id=user_id,
        title=resource_data.title,
        description=resource_data.description,
        type=resource_data.type,
        content=resource_data.content,
        tags=resource_data.tags or [],
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


async def list_resources_for_user(
    user_id: UUID,
    search: Optional[str],
    type_filter: Optional[str],
    db: AsyncSession,
) -> List[Resource]:
    """Return user resources with optional search and type filter."""
    query = select(Resource).where(Resource.user_id == user_id)

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.where(
          or_(
              Resource.title.ilike(search_term),
              Resource.description.ilike(search_term),
              func.array_to_string(Resource.tags, ',').ilike(search_term),
          )
        )

    if type_filter:
        query = query.where(Resource.type == type_filter)

    query = query.order_by(Resource.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_owned_resource(
    resource_id: UUID, user_id: UUID, db: AsyncSession
) -> Optional[Resource]:
    """Fetch a resource and ensure it belongs to the current user."""
    result = await db.execute(
        select(Resource).where(
            Resource.id == resource_id,
            Resource.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def apply_resource_updates(
    resource: Resource, updates: ResourceUpdate, db: AsyncSession
) -> Resource:
    """Apply partial updates and persist."""
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)

    await db.commit()
    await db.refresh(resource)
    return resource


async def delete_resource_entry(resource: Resource, db: AsyncSession) -> None:
    """Remove a resource and its backing PDF when applicable."""
    # Prevent deleting resources that are still referenced in packets
    in_packet = await db.scalar(
        select(func.count())
        .select_from(Packet)
        .where(Packet.resource_ids.contains([resource.id]))
    )
    if in_packet and in_packet > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource is referenced by a packet and cannot be deleted",
        )

    if resource.type == "pdf":
        file_path = resource.content
        if (
            file_path
            and file_path.startswith("uploads/")
            and file_path.endswith(".pdf")
            and ".." not in file_path
        ):
            delete_file_from_storage(file_path)
        else:
            logger.warning(
                "Invalid file path format for PDF resource %s: %s",
                resource.id,
                file_path,
            )

    await db.execute(delete(Resource).where(Resource.id == resource.id))
    await db.commit()
