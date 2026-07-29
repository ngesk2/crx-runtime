"""Canonical Byte Authority

Central authority for all canonical byte operations.

Every canonical byte sequence should originate from this single authority.
Nothing else should call CanonicalSerializer directly.

Architecture:
ConstitutionAuthority
  ↓
CanonicalByteAuthority
  ↓
CanonicalSerializer
  ↓
HashAuthority
  ↓
CanonicalBytes + CanonicalHash

This ensures:
- Single source of truth for canonical bytes
- No duplicate serialization logic
- Consistent hashing across all subsystems
"""

from dataclasses import dataclass
from typing import Any

from .canonical_serializer import CanonicalSerializer, CanonicalBytes
from .hash_authority import HashAuthority, CanonicalHash


@dataclass(frozen=True)
class CanonicalByteResult:
    """
    Result of canonical byte serialization.
    
    Contains both the canonical bytes and the canonical hash.
    """
    bytes: CanonicalBytes
    hash: CanonicalHash
    
    @property
    def bytes_value(self) -> bytes:
        """Get bytes value"""
        return self.bytes.value
    
    @property
    def hash_value(self) -> str:
        """Get hash value"""
        return self.hash.value


class CanonicalByteAuthority:
    """
    Central authority for all canonical byte operations.
    
    Owns:
    - Canonical serialization (delegates to CanonicalSerializer)
    - Canonical hashing (delegates to HashAuthority)
    - Canonical byte result generation
    
    Every canonical byte sequence should originate from this single authority.
    """
    
    def __init__(
        self,
        serializer: CanonicalSerializer,
        hash_authority: HashAuthority,
    ):
        self._serializer = serializer
        self._hash_authority = hash_authority
    
    def serialize(self, data: dict[str, Any]) -> CanonicalByteResult:
        """
        Serialize data to canonical bytes with hash.
        
        This is the single entry point for all canonical serialization.
        
        Data → CanonicalSerializer → CanonicalBytes → HashAuthority → CanonicalHash
        """
        canonical_bytes = self._serializer.serialize(data)
        canonical_hash = self._hash_authority.hash_bytes(canonical_bytes.value)
        
        return CanonicalByteResult(
            bytes=canonical_bytes,
            hash=canonical_hash,
        )
    
    def serialize_bytes(self, data: bytes) -> CanonicalByteResult:
        """
        Serialize raw bytes to canonical bytes with hash.
        """
        canonical_bytes = self._serializer.serialize_bytes(data)
        canonical_hash = self._hash_authority.hash_bytes(canonical_bytes.value)
        
        return CanonicalByteResult(
            bytes=canonical_bytes,
            hash=canonical_hash,
        )
    
    def serialize_string(self, data: str) -> CanonicalByteResult:
        """
        Serialize string to canonical bytes with hash.
        """
        canonical_bytes = self._serializer.serialize_string(data)
        canonical_hash = self._hash_authority.hash_bytes(canonical_bytes.value)
        
        return CanonicalByteResult(
            bytes=canonical_bytes,
            hash=canonical_hash,
        )
    
    def get_serializer(self) -> CanonicalSerializer:
        """Get the underlying canonical serializer (for advanced use)"""
        return self._serializer
    
    def get_hash_authority(self) -> HashAuthority:
        """Get the underlying hash authority (for advanced use)"""
        return self._hash_authority
