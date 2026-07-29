from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, model_validator
from constitution.authority import CanonicalAuthority


class EventEnvelope(BaseModel):
    """Immutable event envelope containing infrastructure metadata"""
    
    # Envelope fields (infrastructure metadata)
    event_id: str = Field(..., description="SHA256 of constitutional event identity")
    event_type: str = Field(..., description="Event type name")
    event_category: Literal["DomainEvent", "InfrastructureEvent"] = Field(
        ..., description="DomainEvent or InfrastructureEvent"
    )
    
    # Three timestamps
    occurred_at: datetime = Field(..., description="When the event happened in domain time")
    recorded_at: datetime = Field(..., description="When the event was recorded in system time")
    processed_at: datetime | None = Field(None, description="When the event was processed in replay time")
    
    # Causality and correlation
    correlation_id: str | None = Field(None, description="Correlates related events")
    causality_id: str | None = Field(None, description="Parent event for causality graph")
    producer_id: str | None = Field(None, description="Component that produced the event")
    caused_by_command_id: str | None = Field(None, description="Command that produced this event")
    
    # Schema and ordering
    schema_version: str = Field(..., description="Schema version of payload")
    global_sequence: int | None = Field(None, description="Monotonically increasing global sequence number (assigned by database)")
    aggregate_sequence: int | None = Field(None, description="Monotonically increasing per-aggregate sequence number")

    # Optimistic concurrency control
    aggregate_version: int = Field(1, description="Version for optimistic concurrency")
    stream_version: int = Field(1, description="Stream version for ordering")
    
    # Payload (domain data)
    payload: dict[str, Any] = Field(..., description="Event-specific data")
    
    class Config:
        frozen = True  # Immutable
    
    @model_validator(mode='after')
    def verify_event_id(self) -> "EventEnvelope":
        """Verify that event_id matches constitutional hash (excludes infrastructure timestamps)"""
        # Constitutional hash excludes recorded_at and processed_at (infrastructure timestamps)
        # Only includes domain-identity fields
        data = {
            'event_type': self.event_type,
            'event_category': self.event_category,
            'occurred_at': self.occurred_at.isoformat(),
            'correlation_id': self.correlation_id,
            'causality_id': self.causality_id,
            'producer_id': self.producer_id,
            'caused_by_command_id': self.caused_by_command_id,
            'schema_version': self.schema_version,
            'global_sequence': self.global_sequence,
            'aggregate_sequence': self.aggregate_sequence,
            'aggregate_version': self.aggregate_version,
            'stream_version': self.stream_version,
            'payload': self.payload,
        }

        # Use CanonicalAuthority
        authority = CanonicalAuthority()
        computed_hash = authority.hash_dict(data)

        if self.event_id != computed_hash:
            raise ValueError(f"Event ID hash mismatch: expected {computed_hash}, got {self.event_id}")

        return self
    
    def verify_hash(self) -> bool:
        """Explicit hash verification method"""
        data = {
            'event_type': self.event_type,
            'event_category': self.event_category,
            'occurred_at': self.occurred_at.isoformat(),
            'correlation_id': self.correlation_id,
            'causality_id': self.causality_id,
            'producer_id': self.producer_id,
            'caused_by_command_id': self.caused_by_command_id,
            'schema_version': self.schema_version,
            'global_sequence': self.global_sequence,
            'aggregate_sequence': self.aggregate_sequence,
            'payload': self.payload,
        }
        
        authority = CanonicalAuthority()
        computed_hash = authority.hash_dict(data)
        return self.event_id == computed_hash
    
    @classmethod
    def create(
        cls,
        event_type: str,
        event_category: Literal["DomainEvent", "InfrastructureEvent"],
        payload: dict[str, Any],
        occurred_at: datetime,
        recorded_at: datetime,
        schema_version: str,
        global_sequence: int | None = None,
        correlation_id: str | None = None,
        causality_id: str | None = None,
        producer_id: str | None = None,
        caused_by_command_id: str | None = None,
        aggregate_sequence: int | None = None,
        aggregate_version: int = 1,
        stream_version: int = 1,
    ) -> "EventEnvelope":
        """Factory method to create EventEnvelope with computed constitutional hash"""
        # Constitutional hash excludes infrastructure timestamps
        data = {
            'event_type': event_type,
            'event_category': event_category,
            'occurred_at': occurred_at.isoformat(),
            'correlation_id': correlation_id,
            'causality_id': causality_id,
            'producer_id': producer_id,
            'caused_by_command_id': caused_by_command_id,
            'schema_version': schema_version,
            'global_sequence': global_sequence,
            'aggregate_sequence': aggregate_sequence,
            'aggregate_version': aggregate_version,
            'stream_version': stream_version,
            'payload': payload,
        }

        # Use CanonicalAuthority
        authority = CanonicalAuthority()
        event_id = authority.hash_dict(data)

        return cls(
            event_id=event_id,
            event_type=event_type,
            event_category=event_category,
            occurred_at=occurred_at,
            recorded_at=recorded_at,
            processed_at=None,
            correlation_id=correlation_id,
            causality_id=causality_id,
            producer_id=producer_id,
            caused_by_command_id=caused_by_command_id,
            schema_version=schema_version,
            global_sequence=global_sequence,
            aggregate_sequence=aggregate_sequence,
            aggregate_version=aggregate_version,
            stream_version=stream_version,
            payload=payload,
        )


class DomainEvent(EventEnvelope):
    """Domain event (business logic)"""
    
    event_category: Literal["DomainEvent"] = Field(default="DomainEvent", description="Domain event")


class InfrastructureEvent(EventEnvelope):
    """Infrastructure event (system operations)"""
    
    event_category: Literal["InfrastructureEvent"] = Field(default="InfrastructureEvent", description="Infrastructure event")


class ArtifactCreated(DomainEvent):
    """Artifact created event"""
    
    event_type: str = Field(default="ArtifactCreated", description="Artifact created")


class ArtifactSuperseded(DomainEvent):
    """Artifact superseded event (tombstone - artifact replaced by new version)"""
    
    event_type: str = Field(default="ArtifactSuperseded", description="Artifact superseded")


class ArtifactDeprecated(DomainEvent):
    """Artifact deprecated event (tombstone - artifact marked as deprecated)"""
    
    event_type: str = Field(default="ArtifactDeprecated", description="Artifact deprecated")


class ArtifactArchived(DomainEvent):
    """Artifact archived event (tombstone - artifact archived, binary may be deleted)"""
    
    event_type: str = Field(default="ArtifactArchived", description="Artifact archived")
