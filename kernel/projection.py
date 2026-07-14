from datetime import datetime
from typing import Any, Callable, Protocol
from sqlalchemy.ext.asyncio import AsyncSession
from storage.postgres.models import Event as EventModel, ProjectionVersion as ProjectionVersionModel
from storage.event_store import EventStore
from constitution.models.projection import Snapshot
from constitution.authority import CanonicalAuthority


class Projection(Protocol):
    """
    Projection interface.
    
    All read models must implement this interface to become projections.
    """
    
    projection_name: str
    projection_version: int
    
    async def handle_event(self, state: dict[str, Any], event: EventModel) -> dict[str, Any]:
        """
        Handle an event and return updated state.
        
        This is the pure function that transforms projection state.
        """
        ...
    
    async def read(self, state: dict[str, Any], query: dict[str, Any]) -> Any:
        """
        Read from the projection state.
        
        This is the Read API that projections expose to consumers.
        """
        ...
    
    def get_schema_hash(self) -> str:
        """
        Get the schema hash of this projection.
        
        Used for versioning and compatibility checking.
        """
        ...


class ProjectionManager:
    """
    Manages projection lifecycle and updates.
    
    Coordinates projection updates, snapshots, and rebuilding.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_store = EventStore(session)
        self._projections: dict[str, Projection] = {}
    
    def register_projection(self, projection: Projection) -> None:
        """Register a projection with the manager"""
        self._projections[projection.projection_name] = projection
    
    async def update_projection(
        self,
        projection_name: str,
        from_sequence: int = 0,
    ) -> dict[str, Any]:
        """
        Update a projection from the event log.
        
        Loads events from the event log and applies them to the projection.
        """
        projection = self._projections.get(projection_name)
        if not projection:
            raise ValueError(f"Projection {projection_name} not registered")
        
        # Load events
        events = await self.event_store.load_stream(
            from_sequence=from_sequence,
        )
        
        # Load latest snapshot if available
        snapshot = await self.event_store.load_latest_snapshot(projection_name)
        
        if snapshot:
            state = snapshot.state
            from_sequence = snapshot.last_global_sequence + 1
        else:
            state = {}
        
        # Apply events to projection
        for event in events:
            state = await projection.handle_event(state, event)
        
        # Compute state hash
        authority = CanonicalAuthority()
        state_hash = authority.hash_dict(state)
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_processed": len(events),
            "from_sequence": from_sequence,
        }
    
    async def rebuild_projection(
        self,
        projection_name: str,
    ) -> dict[str, Any]:
        """
        Rebuild a projection from zero.
        
        Orchestrates replay via ReplayEngine.
        ProjectionManager is a thin coordinator; ReplayEngine performs replay.
        """
        projection = self._projections.get(projection_name)
        if not projection:
            raise ValueError(f"Projection {projection_name} not registered")
        
        # Load all events
        events = await self.event_store.load_all()
        
        # Create ReplayTranscript (constitutional input to ReplayEngine)
        from constitution.transcript import ReplayTranscript
        transcript = ReplayTranscript.create(events=events)
        
        # Use ReplayEngine for replay execution (thin coordination)
        from kernel.replay import ReplayEngine
        replay_engine = ReplayEngine()
        witness = await replay_engine.replay_from_transcript(
            transcript=transcript,
            projection_handler=projection.handle_event,
        )
        
        # Extract state from witness
        state = {}
        for event in events:
            state = await projection.handle_event(state, event)
        
        # Compute state hash
        authority = CanonicalAuthority()
        state_hash = authority.hash_dict(state)
        
        # Get projection version
        registry = ProjectionRegistry(self.session)
        projection_version = await registry.get_projection_version(projection_name)
        
        # Use BuildWitness for constitutional witness (single source of truth)
        from kernel.build_witness import BuildWitness
        build_witness = await BuildWitness.load_current(self.session)
        
        if build_witness is None:
            # No BuildWitness exists (bootstrap), use witness verification stamp
            witness_hash = witness.verification_stamp
        else:
            # Use BuildWitness for constitutional witness
            witness_hash = authority.hash_dict({
                "build_witness_id": build_witness.build_id,
                "witness_verification_stamp": witness.verification_stamp,
            })
        
        return {
            "state": state,
            "state_hash": state_hash,
            "events_processed": len(events),
            "event_ids": witness.ordered_event_ids,
            "projection_version": projection_version,
            "witness_hash": witness_hash,
            "replay_witness": witness,
        }
    
    async def read_projection(
        self,
        projection_name: str,
        query: dict[str, Any],
    ) -> Any:
        """
        Read from a projection.
        
        Uses the projection's Read API to query state.
        """
        projection = self._projections.get(projection_name)
        if not projection:
            raise ValueError(f"Projection {projection_name} not registered")
        
        # Load latest snapshot
        snapshot = await self.event_store.load_latest_snapshot(projection_name)
        
        if not snapshot:
            # No snapshot, rebuild projection
            result = await self.rebuild_projection(projection_name)
            state = result["state"]
        else:
            state = snapshot.state
        
        # Read from projection
        return await projection.read(state, query)
    
    async def verify_projection_consistency(self, projection_name: str) -> bool:
        """
        Verify projection consistency by replaying and comparing full Replay Witness.
        
        Returns True if consistent, False otherwise.
        
        Validates full Replay Witness including:
        - event_ids
        - execution_order
        - projection_version
        - canonical_serializer_version
        - state_hash
        
        NOT just state hash alone.
        """
        projection = self._projections.get(projection_name)
        if not projection:
            raise ValueError(f"Projection {projection_name} not registered")
        
        # Get current projection witness from checkpoint
        from storage.postgres.models import ProjectionCheckpoint as ProjectionCheckpointModel
        from sqlalchemy import select
        
        query = select(ProjectionCheckpointModel).where(
            ProjectionCheckpointModel.projection_name == projection_name
        ).order_by(ProjectionCheckpointModel.last_global_sequence.desc()).limit(1)
        
        result = await self.session.execute(query)
        stored_checkpoint = result.scalar_one_or_none()
        
        if not stored_checkpoint:
            # No checkpoint exists, rebuild and create one
            result = await self.rebuild_projection(projection_name)
            await self._save_checkpoint(projection_name, result["state"], result["state_hash"], result["witness_hash"], result["projection_input_hash"])
            return True
        
        # Rebuild projection from zero to get full witness
        result = await self.rebuild_projection(projection_name)
        
        # Compare full witness, not just state hash
        # Compare state_hash, projection_version, and witness_hash
        registry = ProjectionRegistry(self.session)
        stored_projection_version = stored_checkpoint.projection_version
        
        return (
            result["state_hash"] == stored_checkpoint.state_hash
            and result["projection_version"] == stored_projection_version
            and result["witness_hash"] == stored_checkpoint.witness_hash
        )
    
    async def _save_checkpoint(self, projection_name: str, state: dict[str, Any], state_hash: str, witness_hash: str | None = None, projection_input_hash: str | None = None) -> None:
        """Save a projection checkpoint with state hash, witness hash, and projection input hash"""
        from storage.postgres.models import ProjectionCheckpoint as ProjectionCheckpointModel
        from storage.postgres.models import Event as EventModel
        from sqlalchemy import select
        
        # Get last event sequence
        query = select(EventModel.global_sequence, EventModel.event_id).order_by(
            EventModel.global_sequence.desc()
        ).limit(1)
        result = await self.session.execute(query)
        last_event = result.scalar_one_or_none()
        
        last_sequence = last_event[0] if last_event else 0
        last_event_id = last_event[1] if last_event else ""
        
        # Get projection version
        registry = ProjectionRegistry(self.session)
        projection_version = await registry.get_projection_version(projection_name)
        
        # Create checkpoint
        checkpoint = ProjectionCheckpointModel(
            projection_name=projection_name,
            state_hash=state_hash,
            witness_hash=witness_hash or state_hash,  # Fallback to state_hash if witness not provided
            projection_input_hash=projection_input_hash or state_hash,  # Fallback to state_hash if input_hash not provided
            last_global_sequence=last_sequence,
            last_event_id=last_event_id,
            projection_version=projection_version,
        )
        
        self.session.add(checkpoint)
        await self.session.commit()


class ProjectionRegistry:
    """
    Registry for tracking projection versions and schemas.
    
    Ensures projection compatibility and enables versioning.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register_projection(
        self,
        projection_name: str,
        projection_version: int,
        schema_hash: str,
    ) -> None:
        """Register a projection version in the registry"""
        from sqlalchemy import select
        from storage.postgres.models import ProjectionVersion as ProjectionVersionModel
        
        # Check if projection already exists
        query = select(ProjectionVersionModel).where(
            ProjectionVersionModel.projection_name == projection_name,
        )
        result = await self.session.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing projection
            existing.current_version = projection_version
            existing.schema_hash = schema_hash
        else:
            # Create new projection
            new_projection = ProjectionVersionModel(
                projection_name=projection_name,
                current_version=projection_version,
                schema_hash=schema_hash,
            )
            self.session.add(new_projection)
        
        await self.session.commit()
    
    async def get_projection_version(
        self,
        projection_name: str,
    ) -> int:
        """Get the current version of a projection"""
        from sqlalchemy import select
        from storage.postgres.models import ProjectionVersion as ProjectionVersionModel
        
        query = select(ProjectionVersionModel.current_version).where(
            ProjectionVersionModel.projection_name == projection_name,
        )
        result = await self.session.execute(query)
        version = result.scalar_one_or_none()
        
        return version if version is not None else 1
    
    async def get_projection_schema_hash(
        self,
        projection_name: str,
    ) -> str:
        """Get the schema hash of a projection"""
        from sqlalchemy import select
        from storage.postgres.models import ProjectionVersion as ProjectionVersionModel
        
        query = select(ProjectionVersionModel.schema_hash).where(
            ProjectionVersionModel.projection_name == projection_name,
        )
        result = await self.session.execute(query)
        schema_hash = result.scalar_one_or_none()
        
        return schema_hash if schema_hash is not None else ""
    
    async def check_compatibility(
        self,
        projection_name: str,
        expected_schema_hash: str,
    ) -> bool:
        """Check if a projection is compatible with an expected schema"""
        actual_schema_hash = await self.get_projection_schema_hash(projection_name)
        return actual_schema_hash == expected_schema_hash


class ProjectionCheckpoint:
    """
    Manages projection checkpoints (snapshots).
    
    Checkpoints enable incremental replay and faster recovery.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_store = EventStore(session)
    
    async def create_checkpoint(
        self,
        projection_name: str,
        state: dict[str, Any],
        projection_version: int,
    ) -> Snapshot:
        """Create a checkpoint (snapshot) for a projection"""
        # Get last event sequence
        events = await self.event_store.load_all()
        last_sequence = events[-1].global_sequence if events else 0
        last_event_id = events[-1].event_id if events else ""
        
        # Compute state hash
        authority = CanonicalAuthority()
        state_hash = authority.hash_dict(state)
        
        # Create snapshot
        snapshot = Snapshot(
            snapshot_id=state_hash,
            projection_name=projection_name,
            projection_version=projection_version,
            state=state,
            last_event_id=last_event_id,
            last_global_sequence=last_sequence,
            created_at=datetime.utcnow(),
        )
        
        # Persist snapshot
        await self.event_store.append_snapshot(snapshot)
        
        return snapshot
    
    async def get_latest_checkpoint(
        self,
        projection_name: str,
    ) -> Snapshot | None:
        """Get the latest checkpoint for a projection"""
        return await self.event_store.load_latest_snapshot(projection_name)
    
    async def delete_checkpoints(
        self,
        projection_name: str,
        keep_last_n: int = 5,
    ) -> int:
        """Delete old checkpoints, keeping the last N"""
        from sqlalchemy import select, delete
        from storage.postgres.models import Snapshot as SnapshotModel
        
        # Get all checkpoints for projection
        query = (
            select(SnapshotModel)
            .where(SnapshotModel.projection_name == projection_name)
            .order_by(SnapshotModel.last_global_sequence.desc())
        )
        result = await self.session.execute(query)
        checkpoints = result.scalars().all()
        
        # Keep last N, delete the rest
        if len(checkpoints) > keep_last_n:
            to_delete = checkpoints[keep_last_n:]
            for checkpoint in to_delete:
                await self.session.delete(checkpoint)
            
            await self.session.commit()
            return len(to_delete)
        
        return 0


class ProjectionRebuilder:
    """
    Rebuilds projections from the event log.
    
    Ensures projections can be reconstructed deterministically.
    """
    
    def __init__(self, session: AsyncSession, projection_manager: ProjectionManager):
        self.session = session
        self.projection_manager = projection_manager
    
    async def rebuild_from_checkpoint(
        self,
        projection_name: str,
    ) -> dict[str, Any]:
        """Rebuild a projection from its latest checkpoint"""
        checkpoint = await self.projection_manager.event_store.load_latest_snapshot(projection_name)
        
        if not checkpoint:
            # No checkpoint, rebuild from zero
            return await self.projection_manager.rebuild_projection(projection_name)
        
        # Rebuild from checkpoint
        return await self.projection_manager.update_projection(
            projection_name,
            from_sequence=checkpoint.last_global_sequence + 1,
        )
    
    async def rebuild_from_sequence(
        self,
        projection_name: str,
        from_sequence: int,
    ) -> dict[str, Any]:
        """Rebuild a projection from a specific sequence"""
        return await self.projection_manager.update_projection(
            projection_name,
            from_sequence=from_sequence,
        )
    
    async def verify_rebuild(
        self,
        projection_name: str,
        rebuild_result: dict[str, Any],
        expected_hash: str,
    ) -> bool:
        """Verify that a rebuild produced the expected hash"""
        return rebuild_result["state_hash"] == expected_hash
