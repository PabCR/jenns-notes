"""Pydantic schemas for packet request/response validation."""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.resource import ResourceResponse


class PacketCreate(BaseModel):
    """Schema for creating a new packet."""
    name: str = Field(..., min_length=1, description="Packet name")
    description: Optional[str] = Field(None, description="Optional description")
    resourceIds: List[UUID] = Field(..., min_length=1, description="List of resource IDs")
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is not empty or whitespace-only."""
        if not v or not v.strip():
            raise ValueError("name must not be empty or whitespace-only")
        return v.strip()
    
    @field_validator("resourceIds")
    @classmethod
    def validate_resource_ids(cls, v: List[UUID]) -> List[UUID]:
        """Ensure at least one resource ID is provided."""
        if not v or len(v) == 0:
            raise ValueError("resourceIds must contain at least one resource ID")
        if len(set(v)) != len(v):
            raise ValueError("resourceIds must be unique")
        return v


class PacketUpdate(BaseModel):
    """Schema for updating packet metadata (partial update)."""
    name: Optional[str] = Field(None, min_length=1, description="Packet name")
    description: Optional[str] = Field(None, description="Optional description")
    resourceIds: Optional[List[UUID]] = Field(None, description="List of resource IDs")
    
    @field_validator("name")
    @classmethod
    def validate_name_if_provided(cls, v: Optional[str]) -> Optional[str]:
        """Ensure name is at least 1 character and not whitespace-only if provided."""
        if v is not None:
            if len(v) < 1 or not v.strip():
                raise ValueError("name must be at least 1 character and not whitespace-only")
            return v.strip()
        return v

    @field_validator("resourceIds")
    @classmethod
    def validate_resource_ids_unique(cls, v: Optional[List[UUID]]) -> Optional[List[UUID]]:
        """Ensure resourceIds remain unique when provided."""
        if v is not None and len(set(v)) != len(v):
            raise ValueError("resourceIds must be unique")
        return v


class PacketResponse(BaseModel):
    """Schema for packet response."""
    id: UUID
    user_id: UUID = Field(serialization_alias="userId")
    name: str
    description: Optional[str]
    share_link: str = Field(serialization_alias="shareLink")
    created_at: datetime = Field(serialization_alias="createdAt")
    updated_at: datetime = Field(serialization_alias="updatedAt")
    resources: List[ResourceResponse] = Field(default_factory=list)
    resource_count: Optional[int] = Field(None, serialization_alias="resourceCount")
    resource_ids: List[UUID] = Field(default_factory=list, serialization_alias="resourceIds")
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
