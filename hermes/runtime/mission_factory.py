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
    Immutable execution mission primitive.
    
    Mission never changes.
    Only MissionState changes.
    
    Mission ID is a UUID (unique per submission).
    Mission Hash represents semantic equivalence (same capability + inputs = same hash).
    
    Constitutional authority (purpose, governance, priority) is referenced via constitutional_mission_id.
    This model owns only execution concerns: capability invocation, inputs, lifecycle.
    """
    mission_id: str  # UUID - unique per submission
    mission_hash: str  # Semantic hash - same for equivalent missions
    constitutional_mission_id: str  # Reference to constitutional Mission (purpose, governance)
    capability: str
    inputs: Dict[str, Any]
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
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
        constitutional_mission_id: str,
        capability: str,
        inputs: Dict[str, Any]
    ) -> Mission:
        """
        Create new execution mission.
        
        Args:
            constitutional_mission_id: Reference to constitutional Mission (owns purpose, governance, priority)
            capability: Capability identifier (e.g., "github.acquire_repository")
            inputs: Capability inputs
        
        Returns:
            Mission instance
        """
        # Generate UUID for mission_id (unique per submission)
        mission_id = str(uuid.uuid4())
        
        # Generate semantic hash for mission_hash (same for equivalent missions)
        mission_data = {
            "constitutional_mission_id": constitutional_mission_id,
            "capability": capability,
            "inputs": inputs,
        }
        
        mission_hash = hash_dict(mission_data)
        
        return Mission(
            mission_id=mission_id,
            mission_hash=mission_hash,
            constitutional_mission_id=constitutional_mission_id,
            capability=capability,
            inputs=inputs,
            created_at=datetime.utcnow()
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
            constitutional_mission_id=data.get("constitutional_mission_id", data.get("goal_id", "")),  # Migration path
            capability=data["capability"],
            inputs=data["inputs"],
            created_at=created_at
        )
    
    def from_dict(self, data: Dict[str, Any]) -> Mission:
        """Alias for reconstruct."""
        return self.reconstruct(data)
