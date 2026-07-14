"""
Verification Stamp Module

Owns the verification stamp invariant:
- Verification stamp provides final cryptographic proof of replay identity
- Verification stamp aggregates state, transcript, and Merkle hashes
"""

from .canonical_hash import hash_dict


def compute_verification_stamp(state_hash: str, transcript_hash: str, root_hash: str) -> str:
    """
    Compute verification stamp.
    
    Invariant: Verification stamp provides final cryptographic proof of replay identity.
    """
    stamp_data = {
        'state_hash': state_hash,
        'transcript_hash': transcript_hash,
        'root_hash': root_hash,
    }
    return hash_dict(stamp_data)
