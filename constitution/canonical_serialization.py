"""
Canonical Serialization - Deterministic serialization across languages.

This module provides canonical serialization using CBOR and MessagePack.
These formats provide deterministic serialization for constitutional hashing.
"""

from typing import Any, Dict, Optional
import hashlib


class CanonicalSerializer:
    """
    Canonical serializer for deterministic serialization.
    
    Supports JSON, CBOR, and MessagePack for cross-language compatibility.
    Defaults to CBOR for stronger determinism (canonical mode).
    """
    
    def __init__(self, format: str = "cbor"):
        """
        Initialize canonical serializer.
        
        Args:
            format: Serialization format (cbor, json, msgpack)
                  Defaults to CBOR for stronger determinism
        """
        self.format = format.lower()
    
    def serialize(self, data: Any) -> bytes:
        """
        Serialize data to bytes using canonical format.
        
        Args:
            data: Data to serialize
        
        Returns:
            Serialized bytes
        """
        if self.format == "json":
            return self._serialize_json(data)
        elif self.format == "cbor":
            return self._serialize_cbor(data)
        elif self.format == "msgpack":
            return self._serialize_msgpack(data)
        else:
            raise ValueError(f"Unsupported format: {self.format}")
    
    def deserialize(self, data: bytes) -> Any:
        """
        Deserialize bytes to data.
        
        Args:
            data: Serialized bytes
        
        Returns:
            Deserialized data
        """
        if self.format == "json":
            return self._deserialize_json(data)
        elif self.format == "cbor":
            return self._deserialize_cbor(data)
        elif self.format == "msgpack":
            return self._deserialize_msgpack(data)
        else:
            raise ValueError(f"Unsupported format: {self.format}")
    
    def hash(self, data: Any) -> str:
        """
        Hash data using canonical serialization.
        
        Args:
            data: Data to hash
        
        Returns:
            SHA256 hash hex string
        """
        serialized = self.serialize(data)
        return hashlib.sha256(serialized).hexdigest()
    
    def _serialize_json(self, data: Any) -> bytes:
        """Serialize using canonical JSON."""
        import json
        return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
    
    def _deserialize_json(self, data: bytes) -> Any:
        """Deserialize using JSON."""
        import json
        return json.loads(data.decode('utf-8'))
    
    def _serialize_cbor(self, data: Any) -> bytes:
        """Serialize using CBOR."""
        try:
            import cbor2
            return cbor2.dumps(data, canonical=True)
        except ImportError:
            raise ImportError("cbor2 package required for CBOR serialization. Install with: pip install cbor2")
    
    def _deserialize_cbor(self, data: bytes) -> Any:
        """Deserialize using CBOR."""
        try:
            import cbor2
            return cbor2.loads(data)
        except ImportError:
            raise ImportError("cbor2 package required for CBOR serialization. Install with: pip install cbor2")
    
    def _serialize_msgpack(self, data: Any) -> bytes:
        """Serialize using MessagePack."""
        try:
            import msgpack
            return msgpack.packb(data, use_bin_type=True)
        except ImportError:
            raise ImportError("msgpack package required for MessagePack serialization. Install with: pip install msgpack")
    
    def _deserialize_msgpack(self, data: bytes) -> Any:
        """Deserialize using MessagePack."""
        try:
            import msgpack
            return msgpack.unpackb(data, raw=False)
        except ImportError:
            raise ImportError("msgpack package required for MessagePack serialization. Install with: pip install msgpack")


class CanonicalHasher:
    """
    Canonical hasher for deterministic hashing.
    
    Uses canonical serialization for consistent hashes across languages.
    """
    
    def __init__(self, format: str = "json"):
        """
        Initialize canonical hasher.
        
        Args:
            format: Serialization format (json, cbor, msgpack)
        """
        self.serializer = CanonicalSerializer(format)
    
    def hash_dict(self, data: Dict[str, Any]) -> str:
        """
        Hash dictionary using canonical serialization.
        
        Args:
            data: Dictionary to hash
        
        Returns:
            SHA256 hash hex string
        """
        return self.serializer.hash(data)
    
    def hash_string(self, data: str) -> str:
        """
        Hash string.
        
        Args:
            data: String to hash
        
        Returns:
            SHA256 hash hex string
        """
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def hash_bytes(self, data: bytes) -> str:
        """
        Hash bytes.
        
        Args:
            data: Bytes to hash
        
        Returns:
            SHA256 hash hex string
        """
        return hashlib.sha256(data).hexdigest()
    
    def hash_any(self, data: Any) -> str:
        """
        Hash any data using canonical serialization.
        
        Args:
            data: Data to hash
        
        Returns:
            SHA256 hash hex string
        """
        return self.serializer.hash(data)


# Re-export for backward compatibility
def hash_dict(data: Dict[str, Any], format: str = "json") -> str:
    """
    Hash dictionary using canonical serialization.
    
    Args:
        data: Dictionary to hash
        format: Serialization format (json, cbor, msgpack)
    
    Returns:
        SHA256 hash hex string
    """
    hasher = CanonicalHasher(format)
    return hasher.hash_dict(data)


def hash_string(data: str, format: str = "json") -> str:
    """
    Hash string.
    
    Args:
        data: String to hash
        format: Serialization format (json, cbor, msgpack)
    
    Returns:
        SHA256 hash hex string
    """
    hasher = CanonicalHasher(format)
    return hasher.hash_string(data)


def hash_bytes(data: bytes, format: str = "json") -> str:
    """
    Hash bytes.
    
    Args:
        data: Bytes to hash
        format: Serialization format (json, cbor, msgpack)
    
    Returns:
        SHA256 hash hex string
    """
    hasher = CanonicalHasher(format)
    return hasher.hash_bytes(data)
