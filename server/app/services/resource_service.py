"""Resource CRUD service helpers to keep route handlers lean."""
import logging
from typing import List, Optional, Literal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Resource, UserResourceFavorite
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
    ownership_filter: Optional[Literal['mine', 'others', 'all']] = 'all',
    favorites_only: bool = False,
) -> List[Resource]:
    """Return resources with optional search, type, ownership, and favorites filters."""
    # Start with base query - show all resources by default
    query = select(Resource)

    # Apply ownership filter
    if ownership_filter == 'mine':
        query = query.where(Resource.user_id == user_id)
    elif ownership_filter == 'others':
        query = query.where(Resource.user_id != user_id)

    # Apply search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.where(
          or_(
              Resource.title.ilike(search_term),
              Resource.description.ilike(search_term),
              func.array_to_string(Resource.tags, ',').ilike(search_term),
          )
        )

    # Apply type filter
    if type_filter:
        query = query.where(Resource.type == type_filter)

    # Apply favorites filter - INNER JOIN with favorites table
    if favorites_only:
        from sqlalchemy import and_
        query = query.join(
            UserResourceFavorite,
            and_(
                UserResourceFavorite.resource_id == Resource.id,
                UserResourceFavorite.user_id == user_id
            )
        )

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


async def get_favorite_status(
    user_id: UUID,
    resource_ids: List[UUID],
    db: AsyncSession,
) -> set[UUID]:
    """Get set of resource IDs that are favorited by the user."""
    if not resource_ids:
        return set()
    
    result = await db.execute(
        select(UserResourceFavorite.resource_id).where(
            UserResourceFavorite.user_id == user_id,
            UserResourceFavorite.resource_id.in_(resource_ids)
        )
    )
    return set(result.scalars().all())


async def toggle_favorite(
    user_id: UUID,
    resource_id: UUID,
    db: AsyncSession,
) -> bool:
    """Toggle favorite status for a resource. Returns True if favorited, False if unfavorited."""
    # Check if resource exists
    resource = await db.scalar(
        select(Resource).where(Resource.id == resource_id)
    )
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    
    # Check if favorite already exists
    existing = await db.scalar(
        select(UserResourceFavorite).where(
            UserResourceFavorite.user_id == user_id,
            UserResourceFavorite.resource_id == resource_id
        )
    )
    
    if existing:
        # Remove favorite
        await db.execute(
            delete(UserResourceFavorite).where(
                UserResourceFavorite.user_id == user_id,
                UserResourceFavorite.resource_id == resource_id
            )
        )
        await db.commit()
        return False
    else:
        # Add favorite
        favorite = UserResourceFavorite(
            user_id=user_id,
            resource_id=resource_id
        )
        db.add(favorite)
        await db.commit()
        return True
