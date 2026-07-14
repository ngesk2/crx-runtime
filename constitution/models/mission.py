from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from constitution.hashing import hash_dict as CanonicalHasher


class Mission(BaseModel):
    """Immutable mission primitive (aggregate root)"""
    
    mission_id: str = Field(..., description="SHA256 of canonical serialization")
    goal_id: str = Field(..., description="Goal this mission fulfills")
    description: str = Field(..., description="Mission description")
    priority: int = Field(..., description="Mission priority (higher = more important")
    constraints: list[str] = Field(default_factory=list, description="Constraint IDs governing this mission")
    
    aggregate_version: int = Field(default=1, description="Monotonically increasing per aggregate")
    
    created_at: datetime = Field(..., description="When mission was created")
    created_by: str = Field(..., description="Identity that created this mission")
    
    class Config:
        frozen = True  # Immutable
    
    @classmethod
    def create(
        cls,
        goal_id: str,
        description: str,
        priority: int,
        created_at: datetime,
        created_by: str,
        constraints: list[str] | None = None,
        aggregate_version: int = 1,
    ) -> "Mission":
        """Factory method to create Mission with computed hash"""
        data = {
            'goal_id': goal_id,
            'description': description,
            'priority': priority,
            'constraints': sorted(constraints) if constraints else [],
            'aggregate_version': aggregate_version,
            'created_at': created_at.isoformat(),
            'created_by': created_by,
        }
        
        # Use CanonicalHasher
        mission_id = CanonicalHasher.hash_dict(data)
        
        return cls(
            mission_id=mission_id,
            goal_id=goal_id,
            description=description,
            priority=priority,
            constraints=constraints or [],
            aggregate_version=aggregate_version,
            created_at=created_at,
            created_by=created_by,
        )


class Goal(BaseModel):
    """Immutable goal primitive"""
    
    goal_id: str = Field(..., description="SHA256 of canonical serialization")
    description: str = Field(..., description="Goal description")
    success_criteria: list[str] = Field(..., description="Criteria for goal completion")
    deadline: datetime | None = Field(None, description="Goal deadline")
    priority: int = Field(..., description="Goal priority")
    
    created_at: datetime = Field(..., description="When goal was created")
    
    class Config:
        frozen = True  # Immutable
    
    @classmethod
    def create(
        cls,
        description: str,
        success_criteria: list[str],
        priority: int,
        created_at: datetime,
        deadline: datetime | None = None,
    ) -> "Goal":
        """Factory method to create Goal with computed hash"""
        data = {
            'description': description,
            'success_criteria': sorted(success_criteria),
            'deadline': deadline.isoformat() if deadline else None,
            'priority': priority,
            'created_at': created_at.isoformat(),
        }
        
        # Use CanonicalHasher
        goal_id = CanonicalHasher.hash_dict(data)
        
        return cls(
            goal_id=goal_id,
            description=description,
            success_criteria=success_criteria,
            deadline=deadline,
            priority=priority,
            created_at=created_at,
        )
