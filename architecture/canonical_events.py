"""
Canonical Event Types for Event Sourcing.

All mutable state becomes projections.
Events become canonical truth.

Canonical event types:
- MissionCreated
- MissionCompiled
- MissionOptimized
- CapabilityRequested
- CapabilityGranted
- LeaseIssued
- NodeScheduled
- NodeStarted
- NodeCompleted
- ArtifactProduced
- ArtifactVerified
- VerificationSucceeded
- MissionArchived
- IntentCreated
- StrategyCreated
- ObjectiveCreated
- CIRGenerated
- ExecutionGraphGenerated
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import json
import uuid
from pathlib import Path


class EventType(Enum):
    """Types of canonical events."""
    # Intent/Strategy events
    INTENT_CREATED = "intent_created"
    STRATEGY_CREATED = "strategy_created"
    OBJECTIVE_CREATED = "objective_created"
    
    # Mission lifecycle events
    MISSION_CREATED = "mission_created"
    MISSION_COMPILED = "mission_compiled"
    MISSION_OPTIMIZED = "mission_optimized"
    MISSION_SCHEDULED = "mission_scheduled"
    MISSION_STARTED = "mission_started"
    MISSION_COMPLETED = "mission_completed"
    MISSION_FAILED = "mission_failed"
    MISSION_CANCELLED = "mission_cancelled"
    MISSION_ARCHIVED = "mission_archived"
    
    # Capability events
    CAPABILITY_REQUESTED = "capability_requested"
    CAPABILITY_GRANTED = "capability_granted"
    CAPABILITY_REVOKED = "capability_revoked"
    CAPABILITY_DENIED = "capability_denied"
    
    # Lease events
    LEASE_ISSUED = "lease_issued"
    LEASE_REVOKED = "lease_revoked"
    LEASE_EXPIRED = "lease_expired"
    
    # IR events
    PLANNING_IR_GENERATED = "planning_ir_generated"
    CIR_GENERATED = "cir_generated"
    EXECUTION_GRAPH_GENERATED = "execution_graph_generated"
    
    # Node execution events
    NODE_SCHEDULED = "node_scheduled"
    NODE_STARTED = "node_started"
    NODE_COMPLETED = "node_completed"
    NODE_FAILED = "node_failed"
    NODE_PREEMPTED = "node_preempted"
    
    # Artifact events
    ARTIFACT_PRODUCED = "artifact_produced"
    ARTIFACT_VERIFIED = "artifact_verified"
    ARTIFACT_SIGNED = "artifact_signed"
    ARTIFACT_ARCHIVED = "artifact_archived"
    
    # Verification events
    VERIFICATION_STARTED = "verification_started"
    VERIFICATION_SUCCEEDED = "verification_succeeded"
    VERIFICATION_FAILED = "verification_failed"
    
    # Evidence events
    EVIDENCE_COLLECTED = "evidence_collected"
    EVIDENCE_VERIFIED = "evidence_verified"
    
    # State machine events
    STATE_TRANSITION = "state_transition"


@dataclass
class CanonicalEvent:
    """
    A canonical event in the event sourcing system.
    
    Events are immutable and append-only.
    They become the source of truth for all projections.
    """
    event_id: str
    event_type: EventType
    aggregate_id: str  # ID of the aggregate (mission, artifact, etc.)
    aggregate_type: str  # Type of aggregate (mission, artifact, etc.)
    event_version: str  # Event schema version
    occurred_at: str
    occurred_by: str  # Who/what caused the event
    
    # Event data
    data: Dict[str, Any]
    
    # Metadata
    metadata: Dict[str, Any]
    
    # Causality
    causation_id: Optional[str]  # ID of event that caused this event
    correlation_id: Optional[str]  # ID for correlating related events
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "aggregate_id": self.aggregate_id,
            "aggregate_type": self.aggregate_type,
            "event_version": self.event_version,
            "occurred_at": self.occurred_at,
            "occurred_by": self.occurred_by,
            "data": self.data,
            "metadata": self.metadata,
            "causation_id": self.causation_id,
            "correlation_id": self.correlation_id
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=2)


class EventFactory:
    """
    Factory for creating canonical events.
    
    Provides fluent interface for creating events of different types.
    """
    
    @staticmethod
    def create_mission_created(
        mission_id: str,
        intent_id: str,
        strategy_id: Optional[str],
        objective_id: Optional[str],
        created_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create MissionCreated event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.MISSION_CREATED,
            aggregate_id=mission_id,
            aggregate_type="mission",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=created_by,
            data={
                "intent_id": intent_id,
                "strategy_id": strategy_id,
                "objective_id": objective_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_mission_compiled(
        mission_id: str,
        planning_ir_id: str,
        compiled_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create MissionCompiled event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.MISSION_COMPILED,
            aggregate_id=mission_id,
            aggregate_type="mission",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=compiled_by,
            data={
                "planning_ir_id": planning_ir_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_cir_generated(
        cir_id: str,
        planning_ir_id: str,
        generated_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create CIRGenerated event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.CIR_GENERATED,
            aggregate_id=cir_id,
            aggregate_type="cir",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=generated_by,
            data={
                "planning_ir_id": planning_ir_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_capability_requested(
        mission_id: str,
        capability_name: str,
        operation: str,
        requested_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create CapabilityRequested event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.CAPABILITY_REQUESTED,
            aggregate_id=mission_id,
            aggregate_type="mission",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=requested_by,
            data={
                "capability_name": capability_name,
                "operation": operation
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_capability_granted(
        mission_id: str,
        capability_name: str,
        lease_id: str,
        granted_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create CapabilityGranted event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.CAPABILITY_GRANTED,
            aggregate_id=mission_id,
            aggregate_type="mission",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=granted_by,
            data={
                "capability_name": capability_name,
                "lease_id": lease_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_lease_issued(
        lease_id: str,
        mission_id: str,
        hermes_id: str,
        capabilities: List[str],
        issued_by: str,
        expires_at: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create LeaseIssued event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.LEASE_ISSUED,
            aggregate_id=lease_id,
            aggregate_type="lease",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=issued_by,
            data={
                "mission_id": mission_id,
                "hermes_id": hermes_id,
                "capabilities": capabilities,
                "expires_at": expires_at
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_node_scheduled(
        mission_id: str,
        node_id: str,
        scheduled_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create NodeScheduled event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.NODE_SCHEDULED,
            aggregate_id=node_id,
            aggregate_type="node",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=scheduled_by,
            data={
                "mission_id": mission_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_node_started(
        mission_id: str,
        node_id: str,
        started_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create NodeStarted event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.NODE_STARTED,
            aggregate_id=node_id,
            aggregate_type="node",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=started_by,
            data={
                "mission_id": mission_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_node_completed(
        mission_id: str,
        node_id: str,
        completed_by: str,
        outputs: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create NodeCompleted event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.NODE_COMPLETED,
            aggregate_id=node_id,
            aggregate_type="node",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=completed_by,
            data={
                "mission_id": mission_id,
                "outputs": outputs
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_artifact_produced(
        artifact_id: str,
        mission_id: str,
        node_id: str,
        artifact_type: str,
        produced_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create ArtifactProduced event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.ARTIFACT_PRODUCED,
            aggregate_id=artifact_id,
            aggregate_type="artifact",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=produced_by,
            data={
                "mission_id": mission_id,
                "node_id": node_id,
                "artifact_type": artifact_type
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_artifact_verified(
        artifact_id: str,
        verification_method: str,
        verified_by: str,
        verification_result: bool,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create ArtifactVerified event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.ARTIFACT_VERIFIED,
            aggregate_id=artifact_id,
            aggregate_type="artifact",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=verified_by,
            data={
                "verification_method": verification_method,
                "verification_result": verification_result
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_verification_succeeded(
        mission_id: str,
        verification_id: str,
        verified_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create VerificationSucceeded event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.VERIFICATION_SUCCEEDED,
            aggregate_id=verification_id,
            aggregate_type="verification",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=verified_by,
            data={
                "mission_id": mission_id
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_mission_archived(
        mission_id: str,
        archived_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create MissionArchived event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.MISSION_ARCHIVED,
            aggregate_id=mission_id,
            aggregate_type="mission",
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=archived_by,
            data={},
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )
    
    @staticmethod
    def create_state_transition(
        aggregate_id: str,
        aggregate_type: str,
        from_state: str,
        to_state: str,
        transitioned_by: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> CanonicalEvent:
        """Create StateTransition event."""
        return CanonicalEvent(
            event_id=str(uuid.uuid4()),
            event_type=EventType.STATE_TRANSITION,
            aggregate_id=aggregate_id,
            aggregate_type=aggregate_type,
            event_version="v1",
            occurred_at=datetime.now(timezone.utc).isoformat(),
            occurred_by=transitioned_by,
            data={
                "from_state": from_state,
                "to_state": to_state
            },
            metadata=metadata or {},
            causation_id=None,
            correlation_id=None
        )


class EventStream:
    """
    A stream of events for an aggregate.
    
    Events are append-only and immutable.
    """
    
    def __init__(self, aggregate_id: str, aggregate_type: str):
        self.aggregate_id = aggregate_id
        self.aggregate_type = aggregate_type
        self._events: List[CanonicalEvent] = []
        self._version: int = 0
    
    def append(self, event: CanonicalEvent) -> None:
        """Append an event to the stream."""
        if event.aggregate_id != self.aggregate_id:
            raise ValueError(f"Event aggregate_id {event.aggregate_id} does not match stream aggregate_id {self.aggregate_id}")
        
        if event.aggregate_type != self.aggregate_type:
            raise ValueError(f"Event aggregate_type {event.aggregate_type} does not match stream aggregate_type {self.aggregate_type}")
        
        self._events.append(event)
        self._version += 1
    
    def get_events(self) -> List[CanonicalEvent]:
        """Get all events in the stream."""
        return self._events.copy()
    
    def get_events_by_type(self, event_type: EventType) -> List[CanonicalEvent]:
        """Get events of a specific type."""
        return [event for event in self._events if event.event_type == event_type]
    
    def get_version(self) -> int:
        """Get the current version of the stream."""
        return self._version
    
    def get_latest_event(self) -> Optional[CanonicalEvent]:
        """Get the latest event in the stream."""
        if not self._events:
            return None
        return self._events[-1]
