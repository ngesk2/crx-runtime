"""
Witness Builder Module

Owns the witness assembly invariant:
- ReplayWitness is the constitutional cryptographic proof object
- Witness builder orchestrates assembly of witness components
"""

from typing import Any
from constitution.models.event import EventEnvelope
from constitution.value_objects import Hash
from .canonical_hash import hash_dict
from .merkle import compute_merkle_root
from .lineage import compute_lineage_proof, compute_aggregate_roots
from .verification_stamp import compute_verification_stamp
from .failure_proof import compute_failure_proof


def build_witness(
    state: dict[str, Any],
    events: list[EventEnvelope],
    canonical_version: str,
    encoding_version: str,
    authority_version: str,
) -> dict[str, Any]:
    """
    Build witness by orchestrating internal modules.
    
    Invariant: Witness builder only assembles components from other modules.
    """
    # Compute state hash
    state_hash = Hash(value=hash_dict(state))
    
    # Compute ordered event IDs
    ordered_event_ids = [event.event_id for event in events]
    
    # Compute ordered reducer hashes (for now, same as event IDs)
    ordered_reducer_hashes = [Hash(value=event.event_id) for event in events]
    
    # Compute transcript hash
    transcript_data = {
        'event_ids': ordered_event_ids,
        'state_hash': state_hash.value,
    }
    transcript_hash = Hash(value=hash_dict(transcript_data))
    
    # Compute root hash (Merkle root)
    root_hash = Hash(value=compute_merkle_root(ordered_event_ids))
    
    # Compute lineage proof
    lineage_proof = compute_lineage_proof(events)
    
    # Compute failure proof
    failure_proof = compute_failure_proof(events)
    
    # Compute aggregate roots
    aggregate_roots = compute_aggregate_roots(events)
    
    # Compute verification stamp
    verification_stamp = compute_verification_stamp(
        state_hash.value,
        transcript_hash.value,
        root_hash.value,
    )
    
    return {
        'canonical_version': canonical_version,
        'encoding_version': encoding_version,
        'authority_version': authority_version,
        'ordered_event_ids': ordered_event_ids,
        'ordered_reducer_hashes': ordered_reducer_hashes,
        'state_hash': state_hash,
        'transcript_hash': transcript_hash,
        'root_hash': root_hash,
        'lineage_proof': lineage_proof,
        'failure_proof': failure_proof,
        'event_count': len(events),
        'aggregate_roots': aggregate_roots,
        'verification_stamp': verification_stamp,
    }
