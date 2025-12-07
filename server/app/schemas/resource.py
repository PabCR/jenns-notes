"""Pydantic schemas for resource request/response validation."""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


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
        """Validate content is provided and not whitespace-only."""
        if not v or not v.strip():
            raise ValueError("content must not be empty or whitespace-only")
        if info.data.get("type") == "note" and not v.strip():
            raise ValueError("content is required for note type")
        return v.strip()
    
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
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

