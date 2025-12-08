"""API routes for resource management."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional

from app.db import get_db
from app.utils.auth import get_current_user
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_data: ResourceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new resource."""
    # Validate content is provided for notes
    # URL validation for links is handled in the ResourceCreate schema
    if resource_data.type == "note" and not resource_data.content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="content is required for note type resources",
        )
    
    # Create resource
    resource = Resource(
        user_id=UUID(current_user["id"]),
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


@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    search: Optional[str] = Query(None, description="Search term for title, description, or tags"),
    type: Optional[str] = Query(None, description="Filter by resource type (note, pdf, link)"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all resources for the current user with optional search and type filtering."""
    user_id = UUID(current_user["id"])
    
    # Start with base query
    query = select(Resource).where(Resource.user_id == user_id)
    
    # Add search filter (matches title, description, or tags)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        # For PostgreSQL, convert tags array to text for ILIKE matching
        # Using array_to_string to convert array to comma-separated string
        # Note: ILIKE on NULL returns NULL (not true), which is fine for OR conditions
        query = query.where(
            or_(
                Resource.title.ilike(search_term),
                Resource.description.ilike(search_term),
                func.array_to_string(Resource.tags, ',').ilike(search_term)
            )
        )
    
    # Add type filter
    if type:
        query = query.where(Resource.type == type)
    
    # Maintain existing ordering
    query = query.order_by(Resource.created_at.desc())
    
    result = await db.execute(query)
    resources = result.scalars().all()
    
    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single resource by ID."""
    user_id = UUID(current_user["id"])
    
    result = await db.execute(
        select(Resource).where(
            Resource.id == resource_id,
            Resource.user_id == user_id,
        )
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    
    return resource


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: UUID,
    resource_data: ResourceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update resource metadata."""
    user_id = UUID(current_user["id"])
    
    # Get resource and verify ownership
    result = await db.execute(
        select(Resource).where(
            Resource.id == resource_id,
            Resource.user_id == user_id,
        )
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    
    # Update fields (partial update)
    update_data = resource_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)
    
    await db.commit()
    await db.refresh(resource)
    
    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resource."""
    user_id = UUID(current_user["id"])
    
    # Get resource and verify ownership
    result = await db.execute(
        select(Resource).where(
            Resource.id == resource_id,
            Resource.user_id == user_id,
        )
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )
    
    # Delete the resource using delete statement
    await db.execute(
        delete(Resource).where(Resource.id == resource_id)
    )
    await db.commit()
    
    return None

