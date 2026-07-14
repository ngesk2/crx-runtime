"""
Canonical Hash Module

Owns the canonical hashing invariant:
- All hashes use SHA256
- All dictionary hashes use canonical JSON serialization (sorted keys, no whitespace)
- All string hashes use UTF-8 encoding
"""

import json
import hashlib


def hash_dict(data: dict) -> str:
    """
    Hash a dictionary using canonical serialization.
    
    Invariant: Dictionary hashing must be deterministic and order-independent.
    """
    canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def hash_string(data: str) -> str:
    """
    Hash a string using SHA256.
    
    Invariant: String hashing uses UTF-8 encoding.
    """
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def hash_bytes(data: bytes) -> str:
    """
    Hash bytes using SHA256.
    
    Invariant: Byte hashing is direct SHA256.
    """
    return hashlib.sha256(data).hexdigest()
