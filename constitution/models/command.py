from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from constitution.hashing import CanonicalHasher


class Command(BaseModel):
    """Immutable command primitive"""
    
    command_id: str = Field(..., description="SHA256 of canonical serialization")
    command_type: str = Field(..., description="Command type name")
    parameters: dict[str, Any] = Field(..., description="Command parameters")
    aggregate_id: str | None = Field(None, description="Aggregate this command targets")
    aggregate_version: int | None = Field(None, description="Expected aggregate version for optimistic concurrency")
    
    created_at: datetime = Field(..., description="When command was created")
    
    class Config:
        frozen = True  # Immutable
    
    @classmethod
    def create(
        cls,
        command_type: str,
        parameters: dict[str, Any],
        created_at: datetime,
        aggregate_id: str | None = None,
        aggregate_version: int | None = None,
    ) -> "Command":
        """Factory method to create Command with computed hash"""
        data = {
            'command_type': command_type,
            'parameters': parameters,
            'aggregate_id': aggregate_id,
            'aggregate_version': aggregate_version,
            'created_at': created_at.isoformat(),
        }
        
        # Use CanonicalHasher
        command_id = CanonicalHasher.hash_dict(data)
        
        return cls(
            command_id=command_id,
            command_type=command_type,
            parameters=parameters,
            aggregate_id=aggregate_id,
            aggregate_version=aggregate_version,
            created_at=created_at,
        )
