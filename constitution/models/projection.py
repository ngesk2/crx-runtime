from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class Snapshot(BaseModel):
    """Immutable snapshot primitive"""
    
    snapshot_id: str = Field(..., description="SHA256 of projection state")
    projection_name: str = Field(..., description="Name of projection")
    projection_version: int = Field(..., description="Version of projection schema")
    state: dict[str, Any] = Field(..., description="Projection state")
    last_event_id: str = Field(..., description="Last event ID included in snapshot")
    last_global_sequence: int = Field(..., description="Last global sequence included in snapshot")
    
    created_at: datetime = Field(..., description="When snapshot was created")
    
    class Config:
        frozen = True  # Immutable


class ProjectionVersion(BaseModel):
    """Projection version metadata"""
    
    projection_name: str = Field(..., description="Name of projection")
    current_version: int = Field(..., description="Current version number")
    schema_hash: str = Field(..., description="SHA256 of projection schema")
    
    created_at: datetime = Field(..., description="When projection version was created")
    updated_at: datetime = Field(..., description="When projection version was last updated")
    
    class Config:
        frozen = True
