"""
Canonical Encoder Module

Owns the canonical encoding invariant:
- All data structures are normalized before serialization
- Dictionaries use stable key ordering
- Lists preserve order
- Types are converted to canonical string representations
"""

import json
import math
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Any
from .unicode import normalize_string, UnicodeNormalizationError
from constitution.value_objects import CanonicalBytes


class CanonicalEncodingError(Exception):
    """Canonical encoding error."""
    pass


def normalize(data: Any) -> Any:
    """
    Normalize data for canonical serialization.
    
    Invariant: All data must be normalized before canonical encoding.
    """
    if isinstance(data, dict):
        return normalize_dict(data)
    elif isinstance(data, list):
        return normalize_list(data)
    elif isinstance(data, tuple):
        return normalize_list(list(data))
    elif isinstance(data, str):
        return normalize_string(data)
    elif isinstance(data, float):
        return normalize_float(data)
    elif isinstance(data, int):
        return normalize_int(data)
    elif isinstance(data, bool):
        return data
    elif isinstance(data, datetime):
        return normalize_datetime(data)
    elif isinstance(data, Decimal):
        return normalize_decimal(data)
    elif isinstance(data, UUID):
        return normalize_uuid(data)
    elif isinstance(data, bytes):
        return normalize_bytes(data)
    elif data is None:
        return None
    else:
        raise CanonicalEncodingError(f"Unsupported type for canonical serialization: {type(data)}")


def normalize_dict(data: dict[str, Any]) -> dict[str, Any]:
    """
    Normalize dictionary with stable key ordering.
    
    Invariant: Dictionary keys are sorted for deterministic serialization.
    """
    normalized = {}
    for key in sorted(data.keys()):
        normalized_key = normalize_string(key)
        normalized[normalized_key] = normalize(data[key])
    return normalized


def normalize_list(data: list[Any]) -> list[Any]:
    """
    Normalize list with stable ordering.
    
    Invariant: List order is preserved.
    """
    return [normalize(item) for item in data]


def normalize_float(data: float) -> float:
    """
    Normalize float with NaN and Infinity rejection.
    
    Invariant: NaN and Infinity are rejected as they break determinism.
    """
    if math.isnan(data):
        raise CanonicalEncodingError("NaN rejected in canonical serialization")
    if math.isinf(data):
        raise CanonicalEncodingError("Infinity rejected in canonical serialization")
    
    # Normalize to avoid -0.0
    if data == 0.0:
        return 0.0
    
    return data


def normalize_int(data: int) -> int:
    """
    Normalize integer.
    
    Invariant: Integers are passed through unchanged.
    """
    return data


def normalize_datetime(data: datetime) -> str:
    """
    Normalize datetime to ISO format.
    
    Invariant: All datetimes are serialized as ISO 8601 strings.
    """
    return data.isoformat()


def normalize_decimal(data: Decimal) -> str:
    """
    Normalize decimal to string representation.
    
    Invariant: Decimals are serialized as strings to preserve precision.
    """
    return str(data)


def normalize_uuid(data: UUID) -> str:
    """
    Normalize UUID to string representation.
    
    Invariant: UUIDs are serialized as canonical string format.
    """
    return str(data)


def normalize_bytes(data: bytes) -> str:
    """
    Normalize bytes to hex string.
    
    Invariant: Bytes are serialized as hex strings for canonical representation.
    """
    return data.hex()


def encode(data: dict[str, Any]) -> CanonicalBytes:
    """
    Encode data canonically to CanonicalBytes.
    
    Invariant: All encoding goes through normalization then JSON serialization.
    """
    normalized = normalize(data)
    canonical = json.dumps(normalized, sort_keys=True, separators=(',', ':'))
    return CanonicalBytes(value=canonical.encode('utf-8'))


def decode(data: bytes | CanonicalBytes) -> dict[str, Any]:
    """
    Decode data from canonical encoding.
    
    Invariant: Decoding reverses encode() operation.
    """
    if isinstance(data, CanonicalBytes):
        return json.loads(data.value.decode('utf-8'))
    return json.loads(data.decode('utf-8'))
