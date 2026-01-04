"""Pydantic schemas for resource request/response validation."""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from urllib.parse import urlparse


class ResourceCreate(BaseModel):
    """Schema for creating a new resource."""
    title: str = Field(..., min_length=1, description="Resource title")
    description: Optional[str] = Field(None, description="Optional description")
    type: str = Field(..., description="Resource type")
    content: str = Field(..., min_length=1, description="Resource content (text for notes, URL for links, path for PDFs)")
    tags: Optional[List[str]] = Field(default_factory=list, description="Optional tags")
    
    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Ensure title is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("title must not be empty or whitespace-only")
        return v.strip()
    
    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str, info) -> str:
        """Validate content is provided and not whitespace-only.
        
        For link type resources, validates URL format.
        For PDF type resources, validates storage path format.
        """
        if not v or not v.strip():
            raise ValueError("content must not be empty or whitespace-only")
        
        content = v.strip()
        resource_type = info.data.get("type")
        
        if resource_type == "note" and not content:
            raise ValueError("content is required for note type")
        
        # Validate URL format for link type
        if resource_type == "link":
            try:
                parsed = urlparse(content)
                # Check that URL has a scheme (http/https) and netloc (domain)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError("content must be a valid URL with protocol (http:// or https://)")
                # Only allow http and https schemes
                if parsed.scheme not in ["http", "https"]:
                    raise ValueError("URL must use http:// or https:// protocol")
            except Exception as e:
                if isinstance(e, ValueError) and ("URL" in str(e) or "protocol" in str(e)):
                    raise
                raise ValueError("content must be a valid URL")
        
        # Validate storage path format for PDF type
        if resource_type == "pdf":
            if not content.startswith("uploads/"):
                raise ValueError("content must be a storage path starting with 'uploads/' for PDF type")
            if not content.endswith(".pdf"):
                raise ValueError("content must have .pdf extension for PDF type")
            # Prevent path traversal
            if ".." in content:
                raise ValueError("content must be a valid storage path")
        
        return content
    
    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Ensure type is one of the allowed values."""
        if v not in ["pdf", "link", "note"]:
            raise ValueError("type must be one of: pdf, link, note")
        return v


class ResourceUpdate(BaseModel):
    """Schema for updating resource metadata (partial update)."""
    title: Optional[str] = Field(None, min_length=1, description="Resource title")
    description: Optional[str] = Field(None, description="Optional description")
    tags: Optional[List[str]] = Field(None, description="Tags array")
    
    @field_validator("title")
    @classmethod
    def validate_title_if_provided(cls, v: Optional[str]) -> Optional[str]:
        """Ensure title is at least 1 character and not whitespace-only if provided."""
        if v is not None:
            if len(v) < 1 or not v.strip():
                raise ValueError("title must be at least 1 character and not whitespace-only")
            return v.strip()
        return v


class ResourceResponse(BaseModel):
    """Schema for resource response."""
    id: UUID
    user_id: UUID = Field(serialization_alias="userId")
    title: str
    description: Optional[str]
    type: str
    content: str
    tags: List[str]
    auto_tagged: bool = Field(serialization_alias="autoTagged")
    condition: Optional[str]
    audience: Optional[str]
    topic: Optional[str]
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    is_favorite: Optional[bool] = Field(default=False, serialization_alias="isFavorite")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

