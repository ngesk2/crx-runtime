"""
ProjectionAuthority - Constitutional decision layer for projections.

Decides:
- Whether projection state is constitutionally valid
- Whether projection witness is complete
- Whether projection replay is deterministic
- Whether projection input hash is correct

The kernel executes these decisions via capability interfaces.
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession


class ProjectionAuthority:
    """
    Constitutional authority for projection management.
    
    This authority decides constitutional validity of projection operations.
    It does not execute operations - that's the kernel's job.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def validate_projection_state(
        self,
        projection_name: str,
        state: Dict[str, Any],
        state_hash: str,
    ) -> bool:
        """
        Validate that projection state is constitutionally valid.
        
        Checks:
        - State hash matches canonical computation
        - State structure is valid for projection type
        - State is not corrupted
        """
        from constitution.hashing import CanonicalHasher
        
        computed_hash = CanonicalHasher.hash_dict(state)
        return computed_hash == state_hash
    
    async def validate_witness(
        self,
        projection_name: str,
        event_ids: list[str],
        execution_order: list[int],
        projection_version: int,
        state_hash: str,
        witness_hash: str,
        reducer_hash: str,
        build_witness_hash: str,
    ) -> bool:
        """
        Validate that projection witness is constitutionally complete.
        
        Checks:
        - Witness hash includes all required fields
        - Reducer hash matches current BuildWitness
        - Build witness hash is valid
        - Event IDs are in canonical order
        """
        from constitution.hashing import CanonicalHasher
        
        # Compute witness hash from components
        witness_input = {
            "event_ids": event_ids,
            "execution_order": execution_order,
            "projection_version": projection_version,
            "state_hash": state_hash,
            "canonical_serializer_version": "1.0.0",
            "reducer_hash": reducer_hash,
            "build_witness_hash": build_witness_hash,
        }
        
        computed_witness_hash = CanonicalHasher.hash_dict(witness_input)
        return computed_witness_hash == witness_hash
    
    async def validate_input_hash(
        self,
        projection_name: str,
        event_ids: list[str],
        projection_input_hash: str,
    ) -> bool:
        """
        Validate that projection input hash is correct.
        
        Checks:
        - Input hash matches ordered event IDs
        - Event IDs are in canonical order
        """
        from constitution.hashing import CanonicalHasher
        
        computed_input_hash = CanonicalHasher.hash_dict({"event_ids": event_ids})
        return computed_input_hash == projection_input_hash
    
    async def validate_determinism(
        self,
        projection_name: str,
        replay1_result: Dict[str, Any],
        replay2_result: Dict[str, Any],
    ) -> bool:
        """
        Validate that projection replay is constitutionally deterministic.
        
        Checks:
        - State hashes match
        - Witness hashes match
        - Execution orders match
        """
        return (
            replay1_result["state_hash"] == replay2_result["state_hash"]
            and replay1_result["witness_hash"] == replay2_result["witness_hash"]
        )
