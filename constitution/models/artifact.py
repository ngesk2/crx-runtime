from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from constitution.hashing import CanonicalHasher


class Artifact(BaseModel):
    """Immutable artifact primitive (content-addressed)"""
    
    artifact_id: str = Field(..., description="SHA256 of content")
    content_type: str = Field(..., description="MIME type of content")
    content_hash: str = Field(..., description="SHA256 of content (same as artifact_id)")
    size: int = Field(..., description="Size in bytes")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Artifact metadata")
    storage_location: str = Field(..., description="Storage location (e.g., MinIO path)")
    
    class Config:
        frozen = True  # Immutable
    
    @classmethod
    def create(
        cls,
        content: bytes,
        content_type: str,
        storage_location: str,
        metadata: dict[str, Any] | None = None,
    ) -> "Artifact":
        """Factory method to create Artifact with computed hash"""
        content_hash = CanonicalHasher.hash_bytes(content)
        size = len(content)
        
        return cls(
            artifact_id=content_hash,
            content_type=content_type,
            content_hash=content_hash,
            size=size,
            metadata=metadata or {},
            storage_location=storage_location,
        )
