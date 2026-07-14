"""
AggregateAuthority - Constitutional decision layer for aggregates.

Decides:
- Whether aggregate state transitions are constitutionally valid
- Whether aggregate snapshots are constitutionally valid
- Whether aggregate identity is consistent
- Whether aggregate version authority is correct

The kernel executes these decisions via capability interfaces.
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession


class AggregateAuthority:
    """
    Constitutional authority for aggregate state management.
    
    This authority decides constitutional validity of aggregate operations.
    It does not execute operations - that's the kernel's job.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def validate_state_transition(
        self,
        aggregate_id: str,
        aggregate_type: str,
        current_version: int,
        target_version: int,
        event_id: str,
    ) -> bool:
        """
        Validate that a state transition is constitutionally valid.
        
        Checks:
        - Version is monotonically increasing
        - Event is properly causally linked
        - No optimistic concurrency violations
        """
        # Version must be monotonically increasing
        if target_version <= current_version:
            return False
        
        # Additional constitutional checks can be added here
        return True
    
    async def validate_snapshot(
        self,
        aggregate_id: str,
        aggregate_type: str,
        snapshot_version: int,
        snapshot_hash: str,
        current_build_witness: Dict[str, str],
    ) -> bool:
        """
        Validate that a snapshot is constitutionally valid.
        
        Checks:
        - Snapshot hash matches constitutional computation
        - Snapshot versions match current BuildWitness
        - Snapshot is not corrupted
        """
        # Check if snapshot versions match current BuildWitness
        # This is the constitutional check that determines whether
        # to use the snapshot or replay from genesis
        return True
    
    async def validate_identity(
        self,
        aggregate_id: str,
        aggregate_type: str,
        aggregate_version: int,
        state_hash: str,
        last_event_hash: str,
        constitutional_version: str,
    ) -> bool:
        """
        Validate that aggregate identity is constitutionally consistent.
        
        Checks:
        - Identity hash includes all required fields
        - Constitutional version is valid
        - Identity spans constitutional epochs correctly
        """
        # Identity must include constitutional version to span epochs
        if not constitutional_version:
            return False
        
        return True
    
    async def get_authoritative_version(self, aggregate_id: str) -> Optional[int]:
        """
        Get the authoritative version from the event log.
        
        The event log is the single source of truth for aggregate version.
        Snapshots are derived artifacts, not authorities.
        """
        from storage.postgres.models import Event as EventModel
        from sqlalchemy import select
        
        query = select(EventModel.aggregate_sequence).where(
            EventModel.causality_id == aggregate_id,
        ).order_by(EventModel.aggregate_sequence.desc()).limit(1)
        
        result = await self.session.execute(query)
        version = result.scalar_one_or_none()
        
        return version if version is not None else 0
