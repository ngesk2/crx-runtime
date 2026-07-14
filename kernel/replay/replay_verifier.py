"""
Replay Verifier

Constitutional replay verifier.
Verifies replay determinism via ReplayWitness.
"""

from typing import Any
from runtime.context import RuntimeContext
from constitution.transcript import ReplayTranscript
from constitution.value_objects import VerificationFailure, FailureCode
from constitution.authority.canonical_authority import ReplayWitness


class ReplayVerifier:
    """
    Constitutional replay verifier.
    
    Verifies replay determinism via ReplayWitness comparison.
    """
    
    def __init__(self, ctx: RuntimeContext):
        self.ctx = ctx
    
    async def verify(self, transcript: ReplayTranscript) -> bool:
        """Verify replay transcript."""
        # Verify transcript hash
        from constitution.authority import CanonicalAuthority
        
        authority = CanonicalAuthority()
        
        # Recompute transcript hash using decoded events
        event_ids = [event.event_id for event in transcript.decode()]
        transcript_data = {
            'event_ids': event_ids,
            'event_count': transcript.event_count.value,
            'from_sequence': transcript.from_sequence.value,
            'to_sequence': transcript.to_sequence.value,
        }
        computed_hash = authority.hash_dict(transcript_data)
        
        if transcript.transcript_hash.value != computed_hash:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Transcript hash mismatch",
                expected=transcript.transcript_hash.value,
                actual=computed_hash,
                evidence=[],
            )
        
        # Verify event ordering
        sequences = [event.global_sequence for event in transcript.decode()]
        if sequences != sorted(sequences):
            raise VerificationFailure(
                code=FailureCode.ORDERING_VIOLATION,
                message="Events not in global sequence order",
                expected=sorted(sequences),
                actual=sequences,
                evidence=[],
            )
        
        return True
    
    async def verify_witness(self, witness: ReplayWitness, transcript: ReplayTranscript) -> bool:
        """Verify ReplayWitness against transcript."""
        from constitution.authority import CanonicalAuthority
        
        authority = CanonicalAuthority()
        
        # Verify transcript hash matches witness
        if witness.transcript_hash.value != transcript.transcript_hash.value:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Witness transcript hash mismatch",
                expected=witness.transcript_hash.value,
                actual=transcript.transcript_hash.value,
                evidence=[],
            )
        
        # Verify event IDs match
        transcript_event_ids = [event.event_id for event in transcript.decode()]
        if witness.ordered_event_ids != transcript_event_ids:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Witness event IDs mismatch",
                expected=witness.ordered_event_ids,
                actual=transcript_event_ids,
                evidence=[],
            )
        
        # Verify event count
        if witness.event_count.value != transcript.event_count.value:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Witness event count mismatch",
                expected=witness.event_count.value,
                actual=transcript.event_count.value,
                evidence=[],
            )
        
        # Verify root hash
        computed_root = self._compute_merkle_root(transcript_event_ids)
        if witness.root_hash.value != computed_root:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Witness root hash mismatch",
                expected=witness.root_hash.value,
                actual=computed_root,
                evidence=[],
            )
        
        return True
    
    async def verify_determinism(self, witness1: ReplayWitness, witness2: ReplayWitness) -> bool:
        """Verify that two ReplayWitness objects are identical (deterministic)."""
        # Compare verification stamps (single source of truth)
        if witness1.verification_stamp != witness2.verification_stamp:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Replay verification stamp mismatch",
                expected=witness1.verification_stamp,
                actual=witness2.verification_stamp,
                evidence=[],
            )
        
        # Compare state hashes
        if witness1.state_hash.value != witness2.state_hash.value:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Replay state hash mismatch",
                expected=witness1.state_hash.value,
                actual=witness2.state_hash.value,
                evidence=[],
            )
        
        # Compare transcript hashes
        if witness1.transcript_hash.value != witness2.transcript_hash.value:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Replay transcript hash mismatch",
                expected=witness1.transcript_hash.value,
                actual=witness2.transcript_hash.value,
                evidence=[],
            )
        
        # Compare event counts
        if witness1.event_count.value != witness2.event_count.value:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Replay event count mismatch",
                expected=witness1.event_count.value,
                actual=witness2.event_count.value,
                evidence=[],
            )
        
        # Compare ordered event IDs
        if witness1.ordered_event_ids != witness2.ordered_event_ids:
            raise VerificationFailure(
                code=FailureCode.REPLAY_VERIFICATION_FAILURE,
                message="Replay event IDs mismatch",
                expected=witness1.ordered_event_ids,
                actual=witness2.ordered_event_ids,
                evidence=[],
            )
        
        return True
    
    def _compute_merkle_root(self, hashes: list[str]) -> str:
        """Compute Merkle root from hashes."""
        from constitution.authority import CanonicalAuthority
        
        authority = CanonicalAuthority()
        
        if not hashes:
            return authority.hash_dict({})
        
        # Simple hash of all hashes (full Merkle tree TBD)
        combined = ''.join(sorted(hashes))
        return authority.hash_string(combined)
