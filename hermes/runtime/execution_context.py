"""
Execution Context - Typed context for pipeline stages.

This module defines the ExecutionContext dataclass for pipeline execution.
Provides type-safe context passing between stages instead of untyped dicts.
"""

from dataclasses import dataclass, field, replace
from typing import Any, Dict, Optional
from datetime import datetime


@dataclass
class ExecutionContext:
    """
    Typed execution context for pipeline stages.
    
    Replaces untyped dict context with type-safe dataclass.
    Each stage has access to specific fields instead of string lookups.
    """
    mission_id: str
    mission: Any
    mission_state: Optional[Any] = None
    lease: Optional[Any] = None
    capability: Optional[Any] = None
    result: Optional[Dict[str, Any]] = None
    artifact: Optional[Any] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.started_at is None:
            object.__setattr__(self, 'started_at', datetime.utcnow())
    
    def with_lease(self, lease: Any) -> 'ExecutionContext':
        """Return new context with lease."""
        return replace(self, lease=lease)
    
    def with_mission_state(self, mission_state: Any) -> 'ExecutionContext':
        """Return new context with mission state."""
        return replace(self, mission_state=mission_state)
    
    def with_capability(self, capability: Any) -> 'ExecutionContext':
        """Return new context with capability."""
        return replace(self, capability=capability)
    
    def with_result(self, result: Dict[str, Any]) -> 'ExecutionContext':
        """Return new context with result."""
        return replace(self, result=result)
    
    def with_artifact(self, artifact: Any) -> 'ExecutionContext':
        """Return new context with artifact."""
        return replace(self, artifact=artifact)
    
    def with_error(self, error: str) -> 'ExecutionContext':
        """Return new context with error."""
        return replace(self, error=error, completed_at=datetime.utcnow())
    
    def with_metadata(self, key: str, value: Any) -> 'ExecutionContext':
        """Return new context with additional metadata."""
        new_metadata = self.metadata.copy()
        new_metadata[key] = value
        return replace(self, metadata=new_metadata)
    
    def mark_completed(self) -> 'ExecutionContext':
        """Mark context as completed."""
        return replace(self, completed_at=datetime.utcnow())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary for backward compatibility."""
        return {
            "mission_id": self.mission_id,
            "mission": self.mission,
            "mission_state": self.mission_state,
            "lease": self.lease,
            "capability": self.capability,
            "result": self.result,
            "artifact": self.artifact,
            "error": self.error,
            "metadata": self.metadata,
            "started_at": self.started_at,
            "completed_at": self.completed_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExecutionContext':
        """Create context from dictionary for backward compatibility."""
        return cls(
            mission_id=data.get("mission_id"),
            mission=data.get("mission"),
            mission_state=data.get("mission_state"),
            lease=data.get("lease"),
            capability=data.get("capability"),
            result=data.get("result"),
            artifact=data.get("artifact"),
            error=data.get("error"),
            metadata=data.get("metadata", {}),
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at")
        )
