"""Hash Authority

Constitutional hash authority separate from serialization.

Architecture:
CanonicalSerializer
  ↓
  CanonicalBytes
  ↓
  HashAuthority
  ↓
  CanonicalHash

Serialization should not know hashing exists.
"""

from dataclasses import dataclass
import hashlib
import hmac
from typing import Any
from enum import Enum


class HashAlgorithm(Enum):
    """Constitutional hash algorithms (immutable versions)"""
    SHA256_V1 = "sha256_v1"


@dataclass(frozen=True)
class CanonicalHash:
    """Immutable canonical hash"""
    value: str
    
    def __str__(self) -> str:
        return self.value


class HashAuthority:
    """
    Authority for computing canonical hashes.
    
    Separated from CanonicalSerializer - serialization should not know hashing exists.
    
    Owns:
    - Hash algorithm selection (constitutional, not runtime-configurable)
    - Hash computation
    - Hash verification
    """
    
    def __init__(self, algorithm: HashAlgorithm = HashAlgorithm.SHA256_V1):
        self.algorithm = algorithm
    
    def hash_bytes(self, data: bytes) -> CanonicalHash:
        """
        Hash bytes to canonical hash.
        
        CanonicalBytes → HashAuthority → CanonicalHash
        """
        if self.algorithm == HashAlgorithm.SHA256_V1:
            hash_obj = hashlib.sha256(data)
        else:
            raise ValueError(f"Unsupported hash algorithm: {self.algorithm}")
        
        return CanonicalHash(value=hash_obj.hexdigest())
    
    def hash_string(self, data: str) -> CanonicalHash:
        """Hash string to canonical hash"""
        return self.hash_bytes(data.encode("utf-8"))
    
    def verify_hash(self, data: bytes, hash_value: str) -> bool:
        """
        Verify that data hashes to the expected value.
        
        Uses constant-time comparison (hmac.compare_digest) for security.
        """
        computed_hash = self.hash_bytes(data)
        return hmac.compare_digest(computed_hash.value, hash_value)
    
    def verify_hash_string(self, data: str, hash_value: str) -> bool:
        """Verify that string hashes to the expected value"""
        return self.verify_hash(data.encode("utf-8"), hash_value)
