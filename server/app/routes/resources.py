"""API routes for resource management."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, Form
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Optional

from app.db import get_db
from app.utils.auth import get_current_user
from app.utils.supabase import delete_file_from_storage
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.schemas.gemini import ResourceMetadata
from app.utils.content_extraction import (
    extract_webpage_content,
    extract_note_content,
    extract_pdf_content,
)
from app.utils.gemini import generate_resource_metadata
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resources", tags=["resources"])


class GenerateTagsRequest(BaseModel):
    """Request schema for generate-tags endpoint."""
    type: str  # 'pdf', 'link', or 'note'
    content: str  # Raw content: PDF storage path, URL, or note text


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_data: ResourceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new resource."""
    # Validation is handled in ResourceCreate schema:
    # - Notes: content is required
    # - Links: content must be valid URL
    # - PDFs: content must be valid storage path (uploads/...pdf)
    
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
    
    # If resource is a PDF, delete the file from storage before deleting from DB
    if resource.type == "pdf":
        file_path = resource.content
        # Validate path format (must start with "uploads/" and end with ".pdf", no "..")
        if (
            file_path
            and file_path.startswith("uploads/")
            and file_path.endswith(".pdf")
            and ".." not in file_path
        ):
            # Attempt to delete from storage (best-effort, don't fail if it doesn't work)
            delete_file_from_storage(file_path)
        else:
            logger.warning(
                f"Invalid file path format for PDF resource {resource_id}: {file_path}"
            )
    
    # Delete the resource using delete statement
    await db.execute(
        delete(Resource).where(Resource.id == resource_id)
    )
    await db.commit()
    
    return None


@router.post("/generate-tags", response_model=ResourceMetadata, status_code=status.HTTP_200_OK)
async def generate_tags(
    type: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    """Generate tags and metadata for a resource using AI.
    
    Accepts either:
    - multipart/form-data with file upload (for PDFs) or content (for links/notes)
    - JSON with GenerateTagsRequest (backward compatibility)
    
    Returns structured metadata including tags, description, condition, audience, and topic.
    """
    # Validate resource type
    if type not in ["pdf", "link", "note"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid resource type: {type}. Must be one of: pdf, link, note",
        )
    
    # Extract content based on type
    try:
        if type == "pdf":
            # For PDFs, prefer file upload over storage path
            if file:
                # Read PDF bytes from uploaded file
                pdf_bytes = await file.read()
                if not pdf_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Uploaded file is empty",
                    )
            elif content:
                # Fallback: download PDF bytes from storage (backward compatibility)
                pdf_bytes = extract_pdf_content(content)
            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Either file upload or content (storage path) must be provided for PDFs",
                )
            
            # Generate metadata using Gemini API with PDF bytes
            try:
                metadata = generate_resource_metadata(pdf_bytes=pdf_bytes)
                return metadata
            except ValueError as e:
                logger.error(f"Validation error generating metadata: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(e),
                )
            except Exception as e:
                logger.error(f"Error generating metadata with Gemini API: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate metadata: {str(e)}",
                )
        else:
            # Extract text content for links and notes
            if not content:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Content must be provided for links and notes",
                )
            
            extracted_content = ""
            if type == "link":
                extracted_content = extract_webpage_content(content)
            else:  # note
                extracted_content = extract_note_content(content)
            
            # Check if content extraction succeeded
            if not extracted_content or not extracted_content.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Unable to extract content from this URL. The website may block automated access. Please add tags and description manually.",
                )
            
            # Generate metadata using Gemini API
            try:
                metadata = generate_resource_metadata(content=extracted_content)
                return metadata
            except ValueError as e:
                logger.error(f"Validation error generating metadata: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(e),
                )
            except Exception as e:
                logger.error(f"Error generating metadata with Gemini API: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate metadata: {str(e)}",
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting content for {type}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract content: {str(e)}",
        )

