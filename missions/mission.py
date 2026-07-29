"""Mission Primitive

Constitutional mission primitive for Hermes.

Architecture:
Mission
  ↓
Lease
  ↓
Scheduler
  ↓
Edge
  ↓
Evidence
  ↓
Reducer
  ↓
Artifacts

Everything Hermes ever does becomes a Mission.

Examples:
- Research Customer
- Generate Newsletter
- Summarize PR
- Review Architecture
- Sync CRM
- Watch GitHub
- Monitor Discord
- Improve Landing Page
- Generate Blog
- SEO Audit
- Documentation Pass

Same runtime. Different mission.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, List, Dict
from enum import Enum
from uuid import UUID, uuid4


class MissionType(Enum):
    """Types of missions"""
    RESEARCH = "research"
    GENERATION = "generation"
    ANALYSIS = "analysis"
    AUDIT = "audit"
    SYNC = "sync"
    MONITOR = "monitor"
    REVIEW = "review"
    IMPROVEMENT = "improvement"


class MissionState(Enum):
    """States of a mission"""
    PENDING = "pending"
    LEASED = "leased"
    EXECUTING = "executing"
    HEARTBEATING = "heartbeating"
    EVIDENCING = "evidencing"
    REDUCING = "reducing"
    DONE = "done"
    FAILED = "failed"
    EXPIRED = "expired"


class MissionPriority(Enum):
    """Priority levels for missions"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MissionCapability(Enum):
    """Capabilities required for missions"""
    WEB_RESEARCH = "web_research"
    CODE_ANALYSIS = "code_analysis"
    CONTENT_GENERATION = "content_generation"
    SEO_AUDIT = "seo_audit"
    CRM_SYNC = "crm_sync"
    GITHUB_MONITORING = "github_monitoring"
    DISCORD_MONITORING = "discord_monitoring"
    EMAIL_GENERATION = "email_generation"
    LANDING_PAGE_ANALYSIS = "landing_page_analysis"
    DOCUMENTATION_REVIEW = "documentation_review"


@dataclass(frozen=True)
class MissionId:
    """
    Constitutional mission identifier.
    
    Frozen value object for mission identification.
    """
    value: UUID
    
    def __str__(self) -> str:
        return str(self.value)
    
    @classmethod
    def generate(cls) -> "MissionId":
        """Generate a new mission ID"""
        return cls(value=uuid4())
    
    @classmethod
    def from_string(cls, value: str) -> "MissionId":
        """Create mission ID from string"""
        return cls(value=UUID(value))


@dataclass(frozen=True)
class MissionInputs:
    """
    Mission inputs.
    
    Contains the data required to execute a mission.
    """
    data: Dict[str, Any]
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get input value by key"""
        return self.data.get(key, default)
    
    def has(self, key: str) -> bool:
        """Check if input has key"""
        return key in self.data


@dataclass(frozen=True)
class MissionOutputs:
    """
    Mission outputs.
    
    Contains the results produced by a mission.
    """
    data: Dict[str, Any]
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get output value by key"""
        return self.data.get(key, default)
    
    def has(self, key: str) -> bool:
        """Check if output has key"""
        return key in self.data


@dataclass(frozen=True)
class MissionArtifacts:
    """
    Mission artifacts.
    
    Contains the artifact IDs produced by a mission.
    """
    artifact_ids: List[str]
    
    def add(self, artifact_id: str) -> "MissionArtifacts":
        """Add an artifact ID"""
        return MissionArtifacts(artifact_ids=self.artifact_ids + [artifact_id])
    
    def count(self) -> int:
        """Get number of artifacts"""
        return len(self.artifact_ids)


@dataclass(frozen=True)
class Mission:
    """
    Constitutional mission primitive.
    
    Everything Hermes ever does becomes a Mission.
    
    Contains:
    - mission_id (unique identifier)
    - mission_type (type of mission)
    - state (current state of mission)
    - priority (priority level)
    - capability (required capability)
    - deadline (deadline for completion)
    - owner (who owns the mission)
    - inputs (mission inputs)
    - outputs (mission outputs)
    - artifacts (produced artifacts)
    - created_at (creation timestamp)
    - updated_at (last update timestamp)
    """
    mission_id: MissionId
    mission_type: MissionType
    state: MissionState
    priority: MissionPriority
    capability: MissionCapability
    deadline: datetime | None
    owner: str | None
    inputs: MissionInputs
    outputs: MissionOutputs | None
    artifacts: MissionArtifacts
    created_at: datetime
    updated_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "mission_id": str(self.mission_id),
            "mission_type": self.mission_type.value,
            "state": self.state.value,
            "priority": self.priority.value,
            "capability": self.capability.value,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "owner": self.owner,
            "inputs": self.inputs.data,
            "outputs": self.outputs.data if self.outputs else None,
            "artifacts": self.artifacts.artifact_ids,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
    
    def with_state(self, new_state: MissionState) -> "Mission":
        """Create a new mission with updated state"""
        return Mission(
            mission_id=self.mission_id,
            mission_type=self.mission_type,
            state=new_state,
            priority=self.priority,
            capability=self.capability,
            deadline=self.deadline,
            owner=self.owner,
            inputs=self.inputs,
            outputs=self.outputs,
            artifacts=self.artifacts,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_outputs(self, outputs: MissionOutputs) -> "Mission":
        """Create a new mission with outputs"""
        return Mission(
            mission_id=self.mission_id,
            mission_type=self.mission_type,
            state=self.state,
            priority=self.priority,
            capability=self.capability,
            deadline=self.deadline,
            owner=self.owner,
            inputs=self.inputs,
            outputs=outputs,
            artifacts=self.artifacts,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def with_artifacts(self, artifacts: MissionArtifacts) -> "Mission":
        """Create a new mission with artifacts"""
        return Mission(
            mission_id=self.mission_id,
            mission_type=self.mission_type,
            state=self.state,
            priority=self.priority,
            capability=self.capability,
            deadline=self.deadline,
            owner=self.owner,
            inputs=self.inputs,
            outputs=self.outputs,
            artifacts=artifacts,
            created_at=self.created_at,
            updated_at=datetime.utcnow(),
        )
    
    def is_expired(self) -> bool:
        """Check if mission is expired"""
        if self.deadline is None:
            return False
        return datetime.utcnow() > self.deadline
    
    def is_terminal(self) -> bool:
        """Check if mission is in terminal state"""
        return self.state in {
            MissionState.DONE,
            MissionState.FAILED,
            MissionState.EXPIRED,
        }


class MissionBuilder:
    """
    Builder for creating missions.
    
    Provides a fluent interface for building missions.
    """
    
    def __init__(self):
        self._mission_id: MissionId | None = None
        self._mission_type: MissionType = MissionType.RESEARCH
        self._priority: MissionPriority = MissionPriority.MEDIUM
        self._capability: MissionCapability = MissionCapability.WEB_RESEARCH
        self._deadline: datetime | None = None
        self._owner: str | None = None
        self._inputs: Dict[str, Any] = {}
    
    def with_id(self, mission_id: MissionId) -> "MissionBuilder":
        """Set mission ID"""
        self._mission_id = mission_id
        return self
    
    def with_type(self, mission_type: MissionType) -> "MissionBuilder":
        """Set mission type"""
        self._mission_type = mission_type
        return self
    
    def with_priority(self, priority: MissionPriority) -> "MissionBuilder":
        """Set mission priority"""
        self._priority = priority
        return self
    
    def with_capability(self, capability: MissionCapability) -> "MissionBuilder":
        """Set mission capability"""
        self._capability = capability
        return self
    
    def with_deadline(self, deadline: datetime) -> "MissionBuilder":
        """Set mission deadline"""
        self._deadline = deadline
        return self
    
    def with_owner(self, owner: str) -> "MissionBuilder":
        """Set mission owner"""
        self._owner = owner
        return self
    
    def with_input(self, key: str, value: Any) -> "MissionBuilder":
        """Add mission input"""
        self._inputs[key] = value
        return self
    
    def with_inputs(self, inputs: Dict[str, Any]) -> "MissionBuilder":
        """Set mission inputs"""
        self._inputs = inputs
        return self
    
    def build(self) -> Mission:
        """Build the mission"""
        now = datetime.utcnow()
        mission_id = self._mission_id or MissionId.generate()
        
        return Mission(
            mission_id=mission_id,
            mission_type=self._mission_type,
            state=MissionState.PENDING,
            priority=self._priority,
            capability=self._capability,
            deadline=self._deadline,
            owner=self._owner,
            inputs=MissionInputs(data=self._inputs),
            outputs=None,
            artifacts=MissionArtifacts(artifact_ids=[]),
            created_at=now,
            updated_at=now,
        )
