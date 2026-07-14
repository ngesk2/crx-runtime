"""
Mission Factory - Mission construction.

This service owns all mission reconstruction.
Runtime should never know field names.
"""

from typing import Any, Dict, Optional
from datetime import datetime
from dataclasses import dataclass
import uuid
from constitution.hashing import hash_dict


@dataclass(frozen=True)
class Mission:
    """
    Immutable mission primitive.
    
    Mission never changes.
    Only MissionState changes.
    
    Mission ID is a UUID (unique per submission).
    Mission Hash represents semantic equivalence (same capability + inputs = same hash).
    """
    mission_id: str  # UUID - unique per submission
    mission_hash: str  # Semantic hash - same for equivalent missions
    capability: str
    inputs: Dict[str, Any]
    goal_id: Optional[str] = None
    description: Optional[str] = None
    priority: int = 0
    constraints: list[str] = None
    created_at: Optional[datetime] = None
    created_by: Optional[str] = None
    
    def __post_init__(self):
        if self.constraints is None:
            object.__setattr__(self, 'constraints', [])
        if self.created_at is None:
            object.__setattr__(self, 'created_at', datetime.utcnow())


class MissionFactory:
    """
    Factory for creating and reconstructing missions.
    
    Runtime should never know field names.
    All mission construction goes through this factory.
    """
    
    def create(
        self,
        capability: str,
        inputs: Dict[str, Any],
        goal_id: Optional[str] = None,
        description: Optional[str] = None,
        priority: int = 0,
        constraints: Optional[list[str]] = None,
        created_by: Optional[str] = None
    ) -> Mission:
        """
        Create new mission.
        
        Args:
            capability: Capability identifier (e.g., "github.acquire_repository")
            inputs: Capability inputs
            goal_id: Optional goal ID
            description: Optional description
            priority: Mission priority
            constraints: Optional constraint IDs
            created_by: Optional creator identity
        
        Returns:
            Mission instance
        """
        # Generate UUID for mission_id (unique per submission)
        mission_id = str(uuid.uuid4())
        
        # Generate semantic hash for mission_hash (same for equivalent missions)
        mission_data = {
            "capability": capability,
            "inputs": inputs,
            "goal_id": goal_id,
            "description": description,
            "priority": priority,
            "constraints": sorted(constraints) if constraints else [],
        }
        
        mission_hash = hash_dict(mission_data)
        
        return Mission(
            mission_id=mission_id,
            mission_hash=mission_hash,
            capability=capability,
            inputs=inputs,
            goal_id=goal_id,
            description=description,
            priority=priority,
            constraints=constraints or [],
            created_at=datetime.utcnow(),
            created_by=created_by
        )
    
    def reconstruct(self, data: Dict[str, Any]) -> Mission:
        """
        Reconstruct mission from serialized data.
        
        Args:
            data: Serialized mission data
        
        Returns:
            Mission instance
        """
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        return Mission(
            mission_id=data["mission_id"],
            mission_hash=data.get("mission_hash", data["mission_id"]),  # Fallback for old data
            capability=data["capability"],
            inputs=data["inputs"],
            goal_id=data.get("goal_id"),
            description=data.get("description"),
            priority=data.get("priority", 0),
            constraints=data.get("constraints", []),
            created_at=created_at,
            created_by=data.get("created_by")
        )
    
    def from_dict(self, data: Dict[str, Any]) -> Mission:
        """Alias for reconstruct."""
        return self.reconstruct(data)
