"""API routes for object storage operations."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from uuid import uuid4
import os
from io import BytesIO

from app.utils.auth import get_current_user
from app.utils.supabase import get_supabase_storage_client, get_storage_bucket_name

router = APIRouter(tags=["objects"])


class PresignedUrlRequest(BaseModel):
    """Request schema for presigned URL generation."""
    filename: str
    
    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        """Validate filename has PDF extension."""
        if not v.lower().endswith(".pdf"):
            raise ValueError("filename must have .pdf extension")
        return v


class PresignedUrlResponse(BaseModel):
    """Response schema for presigned URL."""
    uploadUrl: str
    filePath: str


@router.post("/upload", response_model=PresignedUrlResponse, status_code=status.HTTP_200_OK)
async def create_presigned_url(
    request: PresignedUrlRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a presigned URL for uploading a PDF file."""
    # Generate unique file path
    file_id = str(uuid4())
    file_path = f"uploads/{file_id}.pdf"
    
    # Get storage client and bucket
    supabase = get_supabase_storage_client()
    bucket_name = get_storage_bucket_name()
    
    try:
        # Create presigned upload URL
        # Note: Supabase create_signed_upload_url doesn't take file_size_limit parameter
        # File size validation should be done on frontend and during upload
        response = supabase.storage.from_(bucket_name).create_signed_upload_url(file_path)
        
        # Extract signed URL and token
        signed_url = response.get("signed_url") or response.get("url")
        token = response.get("token")
        
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate presigned URL"
            )
        
        # Return both the signed URL and the file path
        return PresignedUrlResponse(
            uploadUrl=signed_url,
            filePath=file_path
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )


async def serve_file(
    path: str,
    current_user: dict,
):
    """Serve a PDF file from storage."""
    # Security: Validate path to prevent directory traversal
    if not path.startswith("uploads/") or ".." in path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get storage client and bucket
    supabase = get_supabase_storage_client()
    bucket_name = get_storage_bucket_name()
    
    try:
        # Download file from storage
        file_data = supabase.storage.from_(bucket_name).download(path)
        
        if file_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Extract filename from path
        filename = os.path.basename(path)
        
        # Create streaming response
        return StreamingResponse(
            BytesIO(file_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "public, max-age=3600"
            }
        )
    except Exception as e:
        # Check if it's a 404 error
        error_str = str(e).lower()
        if "not found" in error_str or "404" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to serve file: {str(e)}"
        )
