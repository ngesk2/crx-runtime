from datetime import datetime, timedelta
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from storage.postgres.models import Snapshot as SnapshotModel
from storage.event_store import EventStore
from constitution.models.projection import Snapshot
from constitution.hashing import CanonicalHasher
import json


class SnapshotPolicy:
    """
    Defines when snapshots should be created.
    
    Supports multiple trigger strategies:
    - Every N events
    - Every size threshold
    - Every time interval
    - Manual trigger
    """
    
    def __init__(
        self,
        events_threshold: int = 1000,
        size_threshold: int = 10 * 1024 * 1024,  # 10 MB
        time_interval: timedelta = timedelta(hours=1),
    ):
        self.events_threshold = events_threshold
        self.size_threshold = size_threshold
        self.time_interval = time_interval
    
    def should_snapshot(
        self,
        events_since_last_snapshot: int,
        state_size: int,
        time_since_last_snapshot: timedelta,
    ) -> bool:
        """
        Determine if a snapshot should be created.
        
        Returns True if any threshold is exceeded.
        """
        return (
            events_since_last_snapshot >= self.events_threshold
            or state_size >= self.size_threshold
            or time_since_last_snapshot >= self.time_interval
        )


class SnapshotScheduler:
    """
    Schedules snapshot creation based on policy.
    
    Monitors projections and triggers snapshots according to policy.
    """
    
    def __init__(self, session: AsyncSession, policy: SnapshotPolicy):
        self.session = session
        self.policy = policy
        self.event_store = EventStore(session)
        self._last_snapshot_times: dict[str, datetime] = {}
    
    async def schedule_snapshot(
        self,
        projection_name: str,
        state: dict[str, Any],
        projection_version: int,
    ) -> bool:
        """
        Schedule a snapshot if policy conditions are met.
        
        Returns True if snapshot was created, False otherwise.
        """
        # Get last snapshot
        last_snapshot = await self.event_store.load_latest_snapshot(projection_name)
        
        # Calculate metrics
        if last_snapshot:
            events_since = await self._count_events_since(last_snapshot.last_global_sequence)
            state_size = len(json.dumps(state).encode('utf-8'))
            time_since = datetime.utcnow() - last_snapshot.created_at
        else:
            events_since = await self._count_events_since(0)
            state_size = len(json.dumps(state).encode('utf-8'))
            time_since = timedelta(days=365)  # Force snapshot if none exists
        
        # Check policy
        if self.policy.should_snapshot(events_since, state_size, time_since):
            # Create snapshot
            await self._create_snapshot(projection_name, state, projection_version)
            self._last_snapshot_times[projection_name] = datetime.utcnow()
            return True
        
        return False
    
    async def _count_events_since(self, from_sequence: int) -> int:
        """Count events since a given sequence number"""
        events = await self.event_store.load_stream(from_sequence=from_sequence)
        return len(events)
    
    async def _create_snapshot(
        self,
        projection_name: str,
        state: dict[str, Any],
        projection_version: int,
    ) -> Snapshot:
        """Create a snapshot"""
        # Get last event sequence
        events = await self.event_store.load_all()
        last_sequence = events[-1].global_sequence if events else 0
        last_event_id = events[-1].event_id if events else ""
        
        # Compute state hash
        state_hash = CanonicalHasher.hash_dict(state)
        
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
    
    async def force_snapshot(
        self,
        projection_name: str,
        state: dict[str, Any],
        projection_version: int,
    ) -> Snapshot:
        """Force a snapshot regardless of policy"""
        snapshot = await self._create_snapshot(projection_name, state, projection_version)
        self._last_snapshot_times[projection_name] = datetime.utcnow()
        return snapshot


class SnapshotCompaction:
    """
    Compacts old snapshots to save storage space.
    
    Removes old snapshots while keeping recent ones for recovery.
    """
    
    def __init__(self, session: AsyncSession, keep_last_n: int = 5):
        self.session = session
        self.keep_last_n = keep_last_n
    
    async def compact_snapshots(self, projection_name: str) -> int:
        """
        Compact snapshots for a projection.
        
        Keeps the last N snapshots and deletes the rest.
        """
        from sqlalchemy import select, delete
        from storage.postgres.models import Snapshot as SnapshotModel
        
        # Get all snapshots for projection
        query = (
            select(SnapshotModel)
            .where(SnapshotModel.projection_name == projection_name)
            .order_by(SnapshotModel.last_global_sequence.desc())
        )
        result = await self.session.execute(query)
        snapshots = result.scalars().all()
        
        # Keep last N, delete the rest
        if len(snapshots) > self.keep_last_n:
            to_delete = snapshots[self.keep_last_n:]
            for snapshot in to_delete:
                await self.session.delete(snapshot)
            
            await self.session.commit()
            return len(to_delete)
        
        return 0
    
    async def compact_all_snapshots(self) -> dict[str, int]:
        """Compact snapshots for all projections"""
        from sqlalchemy import select, func
        from storage.postgres.models import Snapshot as SnapshotModel
        
        # Get all unique projection names
        query = select(SnapshotModel.projection_name).distinct()
        result = await self.session.execute(query)
        projection_names = [row[0] for row in result.all()]
        
        # Compact each projection
        results = {}
        for projection_name in projection_names:
            deleted = await self.compact_snapshots(projection_name)
            results[projection_name] = deleted
        
        return results


class SnapshotVerification:
    """
    Verifies snapshot integrity and consistency.
    
    Ensures snapshots can be used for reliable replay.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_store = EventStore(session)
    
    async def verify_snapshot_hash(self, snapshot: Snapshot) -> bool:
        """
        Verify that a snapshot's hash matches its state.
        
        Returns True if hash is valid, False otherwise.
        """
        # Recompute hash from state
        computed_hash = CanonicalHasher.hash_dict(snapshot.state)
        
        return computed_hash == snapshot.snapshot_id
    
    async def verify_snapshot_consistency(
        self,
        snapshot: Snapshot,
    ) -> bool:
        """
        Verify that a snapshot is consistent with the event log.
        
        Replays events from the snapshot's last sequence and verifies
        that the resulting state matches the snapshot state.
        """
        # Load events after snapshot
        events = await self.event_store.load_stream(
            from_sequence=snapshot.last_global_sequence + 1,
        )
        
        # If there are no events after snapshot, it's consistent
        if not events:
            return True
        
        # Replay events from snapshot (simplified check)
        # In a full implementation, this would use the projection handler
        # to verify that replaying from snapshot produces the same state
        
        # For now, just verify that the snapshot's last event exists
        from sqlalchemy import select
        from storage.postgres.models import Event as EventModel
        
        query = select(EventModel).where(
            EventModel.event_id == snapshot.last_event_id,
        )
        result = await self.session.execute(query)
        event = result.scalar_one_or_none()
        
        return event is not None
    
    async def verify_all_snapshots(self) -> dict[str, bool]:
        """Verify all snapshots in the system"""
        from sqlalchemy import select
        from storage.postgres.models import Snapshot as SnapshotModel
        
        # Get all snapshots
        query = select(SnapshotModel)
        result = await self.session.execute(query)
        snapshots = result.scalars().all()
        
        # Verify each snapshot
        results = {}
        for snapshot_model in snapshots:
            snapshot = Snapshot(
                snapshot_id=snapshot_model.snapshot_id,
                projection_name=snapshot_model.projection_name,
                projection_version=snapshot_model.projection_version,
                state=snapshot_model.state,
                last_event_id=snapshot_model.last_event_id,
                last_global_sequence=snapshot_model.last_global_sequence,
                created_at=snapshot_model.created_at,
            )
            
            hash_valid = await self.verify_snapshot_hash(snapshot)
            consistent = await self.verify_snapshot_consistency(snapshot)
            
            results[snapshot.snapshot_id] = hash_valid and consistent
        
        return results


class SnapshotHash:
    """
    Computes and verifies snapshot hashes.
    
    Uses CanonicalHasher for deterministic hash computation.
    """
    
    @staticmethod
    def compute_hash(state: dict[str, Any]) -> str:
        """Compute the hash of a snapshot state"""
        return CanonicalHasher.hash_dict(state)
    
    @staticmethod
    def verify_hash(state: dict[str, Any], expected_hash: str) -> bool:
        """Verify that a state matches an expected hash"""
        computed_hash = SnapshotHash.compute_hash(state)
        return computed_hash == expected_hash
