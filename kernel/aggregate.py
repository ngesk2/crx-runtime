from typing import Any, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from storage.postgres.models import Aggregate as AggregateModel, Event as EventModel
from constitution.models.event import EventEnvelope
from constitution.authority import CanonicalAuthority
from constitution.authority.encoding_authority import EncodingAuthority


class AggregateRoot:
    """
    Base class for all aggregate roots.
    
    Aggregate roots are the only way state changes should occur.
    They enforce invariants, apply events, and manage versioning.
    """
    
    def __init__(self, aggregate_id: str, aggregate_type: str):
        self.aggregate_id = aggregate_id
        self.aggregate_type = aggregate_type
        self.aggregate_version = 0
        self._uncommitted_events: list[EventEnvelope] = []
        self._state: dict[str, Any] = {}
    
    def apply_event(self, event: EventEnvelope) -> None:
        """
        Apply an event to the aggregate state.
        
        This is the only way state should change within an aggregate.
        """
        # Update aggregate version
        self.aggregate_version += 1
        
        # Apply event to state (should be overridden by subclasses)
        self._apply_event_to_state(event)
        
        # Add to uncommitted events
        self._uncommitted_events.append(event)
    
    def _apply_event_to_state(self, event: EventEnvelope) -> None:
        """
        Apply event to aggregate state.
        
        Override this method in subclasses to implement specific event handling.
        """
        # Default implementation: merge event payload into state (immutable)
        self._state = {**self._state, **event.payload}
    
    def get_uncommitted_events(self) -> list[EventEnvelope]:
        """Get uncommitted events (events not yet persisted)"""
        return self._uncommitted_events.copy()
    
    def mark_events_as_committed(self) -> None:
        """Mark all uncommitted events as committed"""
        self._uncommitted_events.clear()
    
    def get_state(self) -> dict[str, Any]:
        """Get current aggregate state"""
        return self._state.copy()
    
    def get_version(self) -> int:
        """Get current aggregate version"""
        return self.aggregate_version
    
    def get_id(self) -> str:
        """Get aggregate ID"""
        return self.aggregate_id
    
    def get_type(self) -> str:
        """Get aggregate type"""
        return self.aggregate_type


class AggregateRepository:
    """
    Repository for managing aggregates.
    
    Provides loading, saving, and optimistic concurrency control.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def load(self, aggregate_id: str, aggregate_type: str) -> AggregateRoot:
        """
        Load an aggregate from the event log.
        
        Uses snapshot for efficient loading with constitutional verification.
        If snapshot hashes don't match current BuildWitness, replays from genesis.
        """
        from storage.postgres.models import Aggregate as AggregateModel
        from constitution.authority import CanonicalAuthority
        from kernel.build_witness import BuildWitness
        
        # Try to load snapshot first
        query = select(AggregateModel).where(
            AggregateModel.aggregate_id == aggregate_id,
            AggregateModel.aggregate_type == aggregate_type,
        )
        result = await self.session.execute(query)
        snapshot = result.scalar_one_or_none()
        
        # Create aggregate instance
        aggregate = AggregateRoot(aggregate_id, aggregate_type)
        
        # Load current BuildWitness (constitutional root)
        build_witness = await BuildWitness.load_current(self.session)
        
        if build_witness is None:
            # No BuildWitness exists (bootstrap), use defaults
            current_schema_version = "1.0.0"
            current_reducer_version = "1.0.0"
            current_replay_protocol_version = "1.0.0"
            current_serialization_version = "1.0.0"
        else:
            # Derive versions from BuildWitness
            current_schema_version = build_witness.get_domain_schema_version()
            current_reducer_version = build_witness.get_reducer_version()
            current_replay_protocol_version = build_witness.get_replay_protocol_version()
            current_serialization_version = build_witness.get_serialization_version()
        
        if snapshot:
            # Verify snapshot constitutional versions against BuildWitness
            if (
                snapshot.domain_schema_version == current_schema_version
                and snapshot.reducer_version == current_reducer_version
                and snapshot.replay_protocol_version == current_replay_protocol_version
                and snapshot.serialization_version == current_serialization_version
            ):
                # Versions match, load from snapshot
                aggregate._state = snapshot.state
                aggregate.aggregate_version = snapshot.aggregate_version
                from_sequence = snapshot.aggregate_version
            else:
                # Versions mismatch, replay from genesis
                from_sequence = 0
        else:
            # No snapshot, start from zero
            from_sequence = 0
        
        # Load events since snapshot (without relying on SQL ordering)
        event_query = select(EventModel).where(
            EventModel.causality_id == aggregate_id,
            EventModel.aggregate_sequence > from_sequence,
        )
        
        event_result = await self.session.execute(event_query)
        events = event_result.scalars().all()
        
        # Canonicalize by aggregate_sequence (constitutional ordering authority)
        events = sorted(events, key=lambda e: e.aggregate_sequence or 0)
        
        # Replay events since snapshot
        for event in events:
            event_envelope = EventEnvelope(
                event_id=event.event_id,
                event_type=event.event_type,
                event_category=event.event_category,  # type: ignore
                payload=event.payload,
                occurred_at=event.occurred_at,
                recorded_at=event.recorded_at,
                processed_at=event.processed_at,
                correlation_id=event.correlation_id,
                causality_id=event.causality_id,
                producer_id=event.producer_id,
                caused_by_command_id=event.caused_by_command_id,
                schema_version=event.schema_version,
                global_sequence=event.global_sequence,
                aggregate_sequence=event.aggregate_sequence,
            )
            aggregate._apply_event_to_state(event_envelope)
        
        # Aggregate version is derived from the last event's aggregate_sequence
        if events:
            aggregate.aggregate_version = events[-1].aggregate_sequence
        
        return aggregate
    
    async def save(self, aggregate: AggregateRoot) -> list[EventEnvelope]:
        """
        Save an aggregate to the event log.
        
        Persists uncommitted events, commits, then derives aggregate snapshot.
        Events remain authoritative, snapshot is derived artifact.
        """
        uncommitted_events = aggregate.get_uncommitted_events()
        
        if not uncommitted_events:
            return []
        
        # Check for optimistic concurrency using event log as source of truth
        # Get current version from the last event's aggregate_sequence
        current_version_query = select(EventModel.aggregate_sequence).where(
            EventModel.causality_id == aggregate.get_id(),
        ).order_by(EventModel.aggregate_sequence.desc()).limit(1)
        
        current_version_result = await self.session.execute(current_version_query)
        current_version = current_version_result.scalar_one_or_none()
        
        expected_version = current_version if current_version is not None else 0
        
        if expected_version != aggregate.get_version() - len(uncommitted_events):
            raise OptimisticConcurrencyError(
                f"Optimistic concurrency conflict: expected version {expected_version}, "
                f"got {aggregate.get_version() - len(uncommitted_events)}"
            )
        
        # Persist events (event log is the single source of truth)
        from storage.event_store import EventStore
        event_store = EventStore(self.session)
        
        for event in uncommitted_events:
            await event_store.append_event(event)
        
        # Commit events first (events are authoritative)
        await self.session.commit()
        
        # Derive aggregate snapshot after commit (snapshot is derived artifact)
        await self._save_snapshot(aggregate)
        
        # Mark events as committed
        aggregate.mark_events_as_committed()
        
        return uncommitted_events
    
    async def _save_snapshot(self, aggregate: AggregateRoot) -> None:
        """
        Save aggregate snapshot for efficient loading.
        
        Computes constitutional witness including version fields, identity hash, and canonical bytes.
        """
        from storage.postgres.models import Aggregate as AggregateModel
        from constitution.authority import CanonicalAuthority
        from constitution.authority.encoding_authority import EncodingAuthority
        
        authority = CanonicalAuthority()
        encoding_authority = EncodingAuthority()
        
        # Compute state hash
        state_hash = authority.hash_dict(aggregate.get_state())
        
        # Compute canonical bytes (constitutional storage)
        canonical_state_bytes = encoding_authority.canonicalize(aggregate.get_state())
        
        # Get last event hash for identity
        from storage.postgres.models import Event as EventModel
        query = select(EventModel.event_hash).where(
            EventModel.causality_id == aggregate.get_id(),
        ).order_by(EventModel.aggregate_sequence.desc()).limit(1)
        result = await self.session.execute(query)
        last_event_hash = result.scalar_one_or_none() or ""
        
        # Load constitutional versions from BuildWitness
        from kernel.build_witness import BuildWitness
        build_witness = await BuildWitness.load_current(self.session)
        
        if build_witness is None:
            # No BuildWitness exists (bootstrap), use defaults
            constitutional_version = "1.0.0"
            domain_schema_version = "1.0.0"
            reducer_version = "1.0.0"
            replay_protocol_version = "1.0.0"
            serialization_version = "1.0.0"
        else:
            # Derive versions from BuildWitness
            constitutional_version = build_witness.constitutional_version
            domain_schema_version = build_witness.get_domain_schema_version()
            reducer_version = build_witness.get_reducer_version()
            replay_protocol_version = build_witness.get_replay_protocol_version()
            serialization_version = build_witness.get_serialization_version()
        
        # Compute aggregate identity hash (historical identity with constitutional version)
        identity_input = {
            "aggregate_id": aggregate.get_id(),
            "aggregate_type": aggregate.get_type(),
            "aggregate_version": aggregate.get_version(),
            "state_hash": state_hash,
            "last_event_hash": last_event_hash,
            "constitutional_version": constitutional_version,
        }
        aggregate_identity_hash = authority.hash_dict(identity_input)
        
        # Compute snapshot hash (full witness including canonical bytes)
        snapshot_input = {
            "canonical_state_bytes": canonical_state_bytes,
            "state_hash": state_hash,
            "last_event_hash": last_event_hash,
            "domain_schema_version": domain_schema_version,
            "reducer_version": reducer_version,
            "replay_protocol_version": replay_protocol_version,
            "serialization_version": serialization_version,
            "constitutional_version": constitutional_version,
        }
        snapshot_hash = authority.hash_dict(snapshot_input)
        
        # Check if snapshot exists
        query = select(AggregateModel).where(
            AggregateModel.aggregate_id == aggregate.get_id(),
            AggregateModel.aggregate_type == aggregate.get_type(),
        )
        result = await self.session.execute(query)
        snapshot = result.scalar_one_or_none()
        
        if snapshot:
            # Update snapshot with constitutional fields
            snapshot.aggregate_version = aggregate.get_version()
            snapshot.state_hash = state_hash
            snapshot.state = aggregate.get_state()
            snapshot.canonical_state_bytes = canonical_state_bytes
            snapshot.domain_schema_version = "1.0.0"
            snapshot.reducer_version = "1.0.0"
            snapshot.replay_protocol_version = "1.0.0"
            snapshot.serialization_version = "1.0.0"
            snapshot.snapshot_hash = snapshot_hash
            snapshot.last_event_hash = last_event_hash
            snapshot.aggregate_identity_hash = aggregate_identity_hash
        else:
            # Create snapshot with constitutional fields
            new_snapshot = AggregateModel(
                aggregate_id=aggregate.get_id(),
                aggregate_type=aggregate.get_type(),
                aggregate_version=aggregate.get_version(),
                state_hash=state_hash,
                state=aggregate.get_state(),
                canonical_state_bytes=canonical_state_bytes,
                domain_schema_version="1.0.0",
                reducer_version="1.0.0",
                replay_protocol_version="1.0.0",
                serialization_version="1.0.0",
                snapshot_hash=snapshot_hash,
                last_event_hash=last_event_hash,
                aggregate_identity_hash=aggregate_identity_hash,
            )
            self.session.add(new_snapshot)
    
    async def get_version(self, aggregate_id: str) -> int:
        """
        Get the current version of an aggregate.
        
        Version is derived from the event log (single source of truth).
        """
        # Get version from the last event's aggregate_sequence
        query = select(EventModel.aggregate_sequence).where(
            EventModel.causality_id == aggregate_id,
        ).order_by(EventModel.aggregate_sequence.desc()).limit(1)
        
        result = await self.session.execute(query)
        version = result.scalar_one_or_none()
        
        return version if version is not None else 0


class OptimisticConcurrencyError(Exception):
    """Raised when optimistic concurrency check fails"""
    pass


def check_optimistic_concurrency(
    expected_version: int,
    actual_version: int,
) -> None:
    """
    Check optimistic concurrency.
    
    Raises OptimisticConcurrencyError if versions don't match.
    """
    if expected_version != actual_version:
        raise OptimisticConcurrencyError(
            f"Optimistic concurrency conflict: expected version {expected_version}, "
            f"got {actual_version}"
        )
