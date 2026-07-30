"""
Event Application Service

Handles event creation, persistence, and orchestration.
Owns canonical serialization, hashing, and duplicate detection.
"""

from typing import Optional
from datetime import datetime
from sqlalchemy import select

from constitution.models.event import EventEnvelope
from storage.postgres.database import get_session
from storage.postgres.models import Event as EventModel
from api.dto import EventRequestDTO, EventResponseDTO
from runtime.di_container import RuntimeContainer


class EventApplicationService:
    """Application service for event operations."""
    
    def __init__(self, container: RuntimeContainer):
        self.container = container
        self.authority = container.canonical_authority
    
    async def create_event(self, request: EventRequestDTO) -> EventResponseDTO:
        """
        Create an event with constitutional hashing and persistence.
        
        This method owns:
        - Canonical serialization
        - Canonical hashing
        - Duplicate detection
        - Persistence coordination
        """
        # Create event envelope with constitutional hash-derived event_id.
        # Deterministic: NO uuid4 / random — replay must regenerate identical IDs.
        # Reuses the canonical /events path (EventEnvelope.create -> persist -> publish).
        event = EventEnvelope.create(
            event_type=request.event_type,
            event_category=request.event_category,
            payload=request.payload,
            occurred_at=request.occurred_at,
            recorded_at=datetime.utcnow(),
            schema_version="1.0.0",
            correlation_id=request.correlation_id,
            causality_id=request.causality_id,
            producer_id=request.producer_id,
            caused_by_command_id=request.caused_by_command_id,
            aggregate_sequence=request.aggregate_sequence,
        )
        
        # Persist to PostgreSQL with constitutional hashing
        async with get_session() as session:
            # Check for duplicates
            existing = await session.execute(
                select(EventModel).where(EventModel.event_id == event.event_id)
            )
            if existing.scalar_one_or_none():
                raise ValueError(f"Event {event.event_id} already exists")
            
            # Serialize payload to canonical bytes
            canonical_payload_bytes = self.authority.serialize_to_canonical_bytes(event.payload)
            canonical_payload_hash = self.authority.hash_canonical_bytes(canonical_payload_bytes)
            
            # Serialize event to canonical bytes for event hash
            event_data = {
                'event_id': event.event_id,
                'event_type': event.event_type,
                'event_category': event.event_category,
                'schema_version': event.schema_version,
                'aggregate_sequence': event.aggregate_sequence,
                'aggregate_version': event.aggregate_version,
                'stream_version': event.stream_version,
                'payload': event.payload,
            }
            
            canonical_event_bytes = self.authority.serialize_to_canonical_bytes(event_data)
            event_hash = self.authority.hash_canonical_bytes(canonical_event_bytes)
            
            # Create event record with constitutional hashing
            event_record = EventModel(
                event_id=event.event_id,
                event_type=event.event_type,
                event_category=event.event_category,
                decoded_payload_cache=event.payload,
                canonical_payload_bytes=canonical_payload_bytes,
                canonical_payload_hash=canonical_payload_hash,
                occurred_at=event.occurred_at,
                recorded_at=datetime.utcnow(),
                processed_at=None,
                correlation_id=event.correlation_id,
                causality_id=event.causality_id,
                producer_id=event.producer_id,
                caused_by_command_id=event.caused_by_command_id,
                schema_version=event.schema_version,
                global_sequence=None,
                aggregate_sequence=event.aggregate_sequence,
                aggregate_version=event.aggregate_version,
                stream_version=event.stream_version,
                event_hash=event_hash,
                build_witness_hash=None,
            )
            
            session.add(event_record)
            await session.commit()
            await session.refresh(event_record)
        
        # PostHog mirror (projection, not source of truth)
        try:
            from integrations.posthog import PostHogMirror
            mirror = PostHogMirror()
            await mirror.deliver({
                "event_id": event.event_id,
                "event_type": event.event_type,
                "payload": event.payload,
                "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
                "recorded_at": event_record.recorded_at.isoformat() if event_record.recorded_at else None,
            })
        except Exception:
            # PostHog delivery failure should not block event persistence
            pass
        
        return EventResponseDTO(
            event_id=event_record.event_id,
            event_type=event_record.event_type,
            event_category=event_record.event_category,
            payload=event_record.decoded_payload_cache,
            occurred_at=event_record.occurred_at,
            recorded_at=event_record.recorded_at,
            global_sequence=event_record.global_sequence or 0,
        )
