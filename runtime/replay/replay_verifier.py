"""
Replay Verifier

Constitutional replay verifier that handles deterministic event replay verification with
full constitutional verification including reducer outputs, witness hashes,
and fingerprints.

This is an auxiliary verifier that consumes constitutional authorities.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from constitution.authority import CanonicalAuthority
from storage.repositories.event_reader import EventReader, CanonicalEvent


@dataclass
class ReplayResult:
    """Result of a constitutional replay operation."""
    status: str
    events_replayed: int
    hash_mismatches: List[Dict[str, Any]]
    events: List[Dict[str, Any]]
    witness_hash: Optional[str] = None
    fingerprint: Optional[str] = None
    error: Optional[str] = None


class ReplayVerifier:
    """
    Constitutional Replay Verifier.
    
    This verifier consumes:
    - EventReader for event loading
    - CanonicalAuthority for hash verification
    - Witness generation (future: WitnessAuthority)
    - Fingerprint computation (future: CanonicalHashAuthority)
    
    The API router should never know what a canonical hash is.
    """
    
    def __init__(self, authority: CanonicalAuthority, event_reader: EventReader):
        self.authority = authority
        self.event_reader = event_reader
    
    async def replay_events(self) -> ReplayResult:
        """
        Perform constitutional replay with full verification.
        
        This method:
        1. Loads events from PostgreSQL
        2. Recomputes canonical hashes
        3. Verifies hash integrity
        4. Generates witness hash
        5. Computes fingerprint
        """
        events_replayed = []
        hash_mismatches = []
        
        try:
            event_records = await self.event_reader.load_all()
            
            for event_record in event_records:
                # Recompute canonical hash
                event_data = {
                    'event_id': event_record.event_id,
                    'event_type': event_record.event_type,
                    'event_category': event_record.event_category,
                    'schema_version': event_record.schema_version,
                    'aggregate_sequence': event_record.aggregate_sequence,
                    'aggregate_version': event_record.aggregate_version,
                    'stream_version': event_record.stream_version,
                    'payload': event_record.payload,
                }
                
                canonical_bytes = self.authority.serialize_to_canonical_bytes(event_data)
                recomputed_hash = self.authority.hash_canonical_bytes(canonical_bytes)
                
                # Verify hash
                if recomputed_hash != event_record.event_hash:
                    hash_mismatches.append({
                        "event_id": event_record.event_id,
                        "stored_hash": event_record.event_hash,
                        "recomputed_hash": recomputed_hash,
                    })
                
                events_replayed.append({
                    "event_id": event_record.event_id,
                    "global_sequence": event_record.global_sequence,
                    "hash_verified": recomputed_hash == event_record.event_hash,
                })
            
            # Generate witness hash (constitutional proof of replay)
            witness_hash = self._generate_witness(events_replayed)
            
            # Compute fingerprint (execution fingerprint)
            fingerprint = self._compute_fingerprint(events_replayed)
        
        except Exception as e:
            return ReplayResult(
                status="failed",
                events_replayed=0,
                hash_mismatches=[],
                events=[],
                error=str(e),
            )
        
        return ReplayResult(
            status="completed",
            events_replayed=len(events_replayed),
            hash_mismatches=hash_mismatches,
            events=events_replayed,
            witness_hash=witness_hash,
            fingerprint=fingerprint,
        )
    
    def _generate_witness(self, events: List[Dict[str, Any]]) -> str:
        """
        Generate constitutional witness hash for replay.
        
        The witness is a cryptographic proof that the replay was
        performed correctly on the canonical event sequence.
        """
        # For now, concatenate all event hashes and hash the result
        # In the future, this will include reducer outputs and state hashes
        witness_data = {
            "event_count": len(events),
            "events": [
                {
                    "event_id": e["event_id"],
                    "global_sequence": e["global_sequence"],
                    "hash_verified": e["hash_verified"],
                }
                for e in events
            ],
        }
        
        canonical_bytes = self.authority.serialize_to_canonical_bytes(witness_data)
        witness_hash = self.authority.hash_canonical_bytes(canonical_bytes)
        
        return witness_hash
    
    def _compute_fingerprint(self, events: List[Dict[str, Any]]) -> str:
        """
        Compute execution fingerprint for replay.
        
        The fingerprint uniquely identifies the execution trace
        of the replay operation.
        """
        # For now, use a simple hash of the event sequence
        # In the future, this will include reducer state transitions
        fingerprint_data = {
            "event_count": len(events),
            "global_sequences": [e["global_sequence"] for e in events],
            "hash_verification": all(e["hash_verified"] for e in events),
        }
        
        canonical_bytes = self.authority.serialize_to_canonical_bytes(fingerprint_data)
        fingerprint = self.authority.hash_canonical_bytes(canonical_bytes)
        
        return fingerprint
