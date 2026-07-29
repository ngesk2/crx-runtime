"""Canonical Serializer

Root authority for all constitutional serialization operations.

Everything eventually becomes:
Domain Object → CanonicalSerializer → Canonical Bytes

Hashing is now handled by HashAuthority (separation of concerns).

This is the single source of truth for:
- Event serialization
- Notification evidence serialization
- Build witness serialization
- Provider response serialization
- Capability descriptor serialization
- All artifact serialization

No other serialization logic should exist in the system.
"""

from typing import Any
from dataclasses import dataclass
import json


@dataclass(frozen=True)
class CanonicalBytes:
    """Immutable canonical bytes representation"""
    value: bytes
    
    def __bytes__(self) -> bytes:
        return self.value
    
    def hex(self) -> str:
        return self.value.hex()


class CanonicalSerializer:
    """
    Root authority for all constitutional serialization.
    
    Single source of truth for converting domain objects to canonical bytes.
    
    Hashing is now handled by HashAuthority (separation of concerns).
    """
    
    def __init__(self, version: str = "1.0.0"):
        self.version = version
    
    def serialize(self, data: dict[str, Any]) -> CanonicalBytes:
        """
        Serialize data to canonical bytes.
        
        Uses canonical JSON encoding:
        - Sorted keys
        - No whitespace
        - UTF-8 encoding
        """
        canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        canonical_bytes = canonical_json.encode('utf-8')
        return CanonicalBytes(value=canonical_bytes)
    
    def serialize_bytes(self, data: bytes) -> CanonicalBytes:
        """
        Serialize raw bytes to canonical bytes.
        """
        return CanonicalBytes(value=data)
    
    def serialize_string(self, data: str) -> CanonicalBytes:
        """
        Serialize string to canonical bytes.
        """
        return CanonicalBytes(value=data.encode('utf-8'))
    
    def deserialize(self, canonical_bytes: CanonicalBytes) -> dict[str, Any]:
        """
        Deserialize canonical bytes back to dict.
        """
        return json.loads(canonical_bytes.value.decode('utf-8'))
