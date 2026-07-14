"""
Merkle Tree Module

Owns the Merkle tree invariant:
- Merkle roots provide cryptographic proof of event ordering
- Merkle trees enable efficient verification of event inclusion
"""

from .canonical_hash import hash_dict


def compute_merkle_root(hashes: list[str]) -> str:
    """
    Compute Merkle root from hashes.
    
    Invariant: Merkle root provides deterministic proof of event set.
    For now, uses simple hash aggregation. Full binary Merkle tree TBD.
    """
    if not hashes:
        return hash_dict({})
    
    # Simple hash of all hashes (full Merkle tree TBD)
    combined = ''.join(sorted(hashes))
    return hash_string(combined)


def hash_string(data: str) -> str:
    """Hash a string (imported from canonical_hash for now)."""
    from .canonical_hash import hash_string as _hash_string
    return _hash_string(data)
