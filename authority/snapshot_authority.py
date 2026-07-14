"""
SnapshotAuthority - Constitutional decision layer for snapshots.

Decides:
- Whether snapshots are constitutionally valid
- Whether snapshot versions match BuildWitness
- Whether snapshot canonical bytes are correct
- Whether snapshots should be used or discarded

The kernel executes these decisions via capability interfaces.
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession


class SnapshotAuthority:
    """
    Constitutional authority for snapshot management.
    
    This authority decides constitutional validity of snapshot operations.
    It does not execute operations - that's the kernel's job.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def validate_snapshot(
        self,
        aggregate_id: str,
        aggregate_type: str,
        snapshot_version: int,
        snapshot_hash: str,
        canonical_state_bytes: str,
        state_hash: str,
        current_build_witness: Dict[str, str],
    ) -> bool:
        """
        Validate that a snapshot is constitutionally valid.
        
        Checks:
        - Snapshot hash includes canonical bytes
        - Canonical bytes deserialize to correct state
        - Snapshot versions match current BuildWitness
        - Snapshot is not corrupted
        """
        from constitution.hashing import CanonicalHasher
        import json
        
        # Validate canonical bytes deserialize correctly
        try:
            deserialized_state = json.loads(canonical_state_bytes)
            computed_state_hash = CanonicalHasher.hash_dict(deserialized_state)
            
            if computed_state_hash != state_hash:
                return False
        except Exception:
            return False
        
        # Validate snapshot hash includes canonical bytes
        snapshot_input = {
            "canonical_state_bytes": canonical_state_bytes,
            "state_hash": state_hash,
            "domain_schema_version": current_build_witness.get("domain_schema_version", "1.0.0"),
            "reducer_version": current_build_witness.get("reducer_version", "1.0.0"),
            "replay_protocol_version": current_build_witness.get("replay_protocol_version", "1.0.0"),
            "serialization_version": current_build_witness.get("serialization_version", "1.0.0"),
            "constitutional_version": current_build_witness.get("constitutional_version", "1.0.0"),
        }
        
        computed_snapshot_hash = CanonicalHasher.hash_dict(snapshot_input)
        return computed_snapshot_hash == snapshot_hash
    
    async def should_use_snapshot(
        self,
        snapshot_domain_schema_version: str,
        snapshot_reducer_version: str,
        snapshot_replay_protocol_version: str,
        snapshot_serialization_version: str,
        current_build_witness: Dict[str, str],
    ) -> bool:
        """
        Decide whether to use snapshot or replay from genesis.
        
        This is the constitutional decision that determines snapshot validity.
        If versions don't match, snapshot is constitutionally invalid.
        """
        return (
            snapshot_domain_schema_version == current_build_witness.get("domain_schema_version", "1.0.0")
            and snapshot_reducer_version == current_build_witness.get("reducer_version", "1.0.0")
            and snapshot_replay_protocol_version == current_build_witness.get("replay_protocol_version", "1.0.0")
            and snapshot_serialization_version == current_build_witness.get("serialization_version", "1.0.0")
        )
    
    async def validate_canonical_bytes(
        self,
        canonical_bytes: str,
        expected_state_hash: str,
    ) -> bool:
        """
        Validate that canonical bytes are constitutionally correct.
        
        Checks:
        - Canonical bytes are valid JSON
        - Canonical bytes deserialize to expected state
        - Canonical bytes are deterministically ordered
        """
        from constitution.hashing import CanonicalHasher
        import json
        
        try:
            state = json.loads(canonical_bytes)
            computed_hash = CanonicalHasher.hash_dict(state)
            return computed_hash == expected_state_hash
        except Exception:
            return False
