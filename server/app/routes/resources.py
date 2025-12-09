"""API routes for resource management."""
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.gemini import ResourceMetadata
from app.schemas.resource import ResourceCreate, ResourceResponse, ResourceUpdate
from app.services.resource_metadata_service import generate_metadata_response
from app.services.resource_service import (
    apply_resource_updates,
    create_resource_entry,
    delete_resource_entry,
    get_owned_resource,
    list_resources_for_user,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_data: ResourceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new resource."""
    user_id = UUID(current_user["id"])
    return await create_resource_entry(resource_data, user_id, db)


@router.get("", response_model=List[ResourceResponse])
async def list_resources(
    search: Optional[str] = Query(
        None, description="Search term for title, description, or tags"
    ),
    type: Optional[str] = Query(None, description="Filter by resource type"),  # noqa: A002
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all resources for the current user with optional search and type filtering."""
    user_id = UUID(current_user["id"])
    return await list_resources_for_user(user_id, search, type, db)


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single resource by ID."""
    user_id = UUID(current_user["id"])
    resource = await get_owned_resource(resource_id, user_id, db)
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
    resource = await get_owned_resource(resource_id, user_id, db)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return await apply_resource_updates(resource, resource_data, db)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a resource and its backing PDF when applicable."""
    user_id = UUID(current_user["id"])
    resource = await get_owned_resource(resource_id, user_id, db)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    await delete_resource_entry(resource, db)
    return None


@router.post("/generate-tags", response_model=ResourceMetadata, status_code=status.HTTP_200_OK)
async def generate_tags(
    type: str = Form(...),  # noqa: A002
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """Generate tags and metadata for a resource using AI."""
    logger.debug("Generating metadata for type=%s user=%s", type, current_user.get("id"))
    return await generate_metadata_response(type, content, file)
