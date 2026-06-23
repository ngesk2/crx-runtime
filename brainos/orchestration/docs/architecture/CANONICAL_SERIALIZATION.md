# Canonical Serialization Authority

**Phase 2:** Design ONE serialization authority

---

## Overview

Canonical Serialization Authority establishes the single source of truth for all serialization in the system. No duplicate serializers, no JSON.stringify authority fragmentation.

---

## Authority Requirements

### Single Authority
- ONE serializer for all objects
- ONE serializer for all events
- ONE serializer for all state
- No serializer fragmentation

### Canonical Definition
- Canonical JSON
- Canonical UTF-8
- Canonical byte encoding
- Canonical object traversal
- Canonical key ordering
- Canonical null handling
- Canonical number handling
- Canonical timestamp handling

---

## Canonical JSON

### Key Ordering
```python
def canonical_json_keys(obj: Dict) -> Dict:
    """
    Sort dictionary keys canonically.
    
    Args:
        obj: Dictionary to canonicalize
    
    Returns:
        Dictionary with canonically sorted keys
    """
    if isinstance(obj, dict):
        return {k: canonical_json_keys(v) for k, v in sorted(obj.items())}
    elif isinstance(obj, list):
        return [canonical_json_keys(item) for item in obj]
    else:
        return obj
```

### Null Handling
```python
def canonical_json_nulls(obj: Any) -> Any:
    """
    Handle null values canonically.
    
    Args:
        obj: Object to canonicalize
    
    Returns:
        Object with canonical null handling
    """
    if obj is None:
        return None
    elif isinstance(obj, dict):
        return {k: canonical_json_nulls(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [canonical_json_nulls(item) for item in obj]
    else:
        return obj
```

### Number Handling
```python
def canonical_json_numbers(obj: Any) -> Any:
    """
    Handle numbers canonically.
    
    Args:
        obj: Object to canonicalize
    
    Returns:
        Object with canonical number handling
    """
    if isinstance(obj, float):
        # Ensure consistent float representation
        return float(f"{obj:.15g}")
    elif isinstance(obj, int):
        return obj
    elif isinstance(obj, dict):
        return {k: canonical_json_numbers(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [canonical_json_numbers(item) for item in obj]
    else:
        return obj
```

### Timestamp Handling
```python
def canonical_json_timestamps(obj: Any) -> Any:
    """
    Handle timestamps canonically.
    
    Args:
        obj: Object to canonicalize
    
    Returns:
        Object with canonical timestamp handling
    """
    if isinstance(obj, str):
        # Check if string is ISO 8601 timestamp
        try:
            datetime.fromisoformat(obj.replace('Z', '+00:00'))
            # Normalize to UTC
            return obj.replace('+00:00', 'Z')
        except ValueError:
            return obj
    elif isinstance(obj, dict):
        return {k: canonical_json_timestamps(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [canonical_json_timestamps(item) for item in obj]
    else:
        return obj
```

---

## Canonical UTF-8

### Encoding Rules
```python
def canonical_utf8_encode(text: str) -> bytes:
    """
    Encode text to canonical UTF-8.
    
    Args:
        text: Text to encode
    
    Returns:
        UTF-8 encoded bytes
    """
    # Normalize Unicode
    normalized = unicodedata.normalize('NFC', text)
    
    # Encode to UTF-8
    return normalized.encode('utf-8')
```

### Decoding Rules
```python
def canonical_utf8_decode(data: bytes) -> str:
    """
    Decode UTF-8 bytes canonically.
    
    Args:
        data: UTF-8 encoded bytes
    
    Returns:
        Decoded text
    """
    # Decode from UTF-8
    text = data.decode('utf-8')
    
    # Normalize Unicode
    return unicodedata.normalize('NFC', text)
```

---

## Canonical Byte Encoding

### Binary Encoding
```python
def canonical_bytes_encode(obj: Any) -> bytes:
    """
    Encode object to canonical bytes.
    
    Args:
        obj: Object to encode
    
    Returns:
        Canonical bytes
    """
    # Canonicalize JSON
    canonical = canonical_json_serialize(obj)
    
    # Encode to UTF-8
    return canonical_utf8_encode(canonical)
```

### Binary Decoding
```python
def canonical_bytes_decode(data: bytes) -> Any:
    """
    Decode canonical bytes to object.
    
    Args:
        data: Canonical bytes
    
    Returns:
        Decoded object
    """
    # Decode from UTF-8
    text = canonical_utf8_decode(data)
    
    # Parse JSON
    return json.loads(text)
```

---

## Canonical Object Traversal

### Traversal Order
```python
def canonical_traverse(obj: Any) -> Generator:
    """
    Traverse object in canonical order.
    
    Args:
        obj: Object to traverse
    
    Yields:
        Path, value pairs in canonical order
    """
    if isinstance(obj, dict):
        for key in sorted(obj.keys()):
            yield (key,), obj[key]
            for sub_path, sub_value in canonical_traverse(obj[key]):
                yield (key,) + sub_path, sub_value
    elif isinstance(obj, list):
        for index, item in enumerate(obj):
            yield (index,), item
            for sub_path, sub_value in canonical_traverse(item):
                yield (index,) + sub_path, sub_value
    else:
        yield (), obj
```

---

## Canonical Serializer

### Main Serializer
```python
class CanonicalSerializer:
    """Canonical serialization authority."""
    
    @staticmethod
    def serialize(obj: Any) -> str:
        """
        Serialize object to canonical JSON.
        
        Args:
            obj: Object to serialize
        
        Returns:
            Canonical JSON string
        """
        # Apply all canonical transformations
        obj = canonical_json_keys(obj)
        obj = canonical_json_nulls(obj)
        obj = canonical_json_numbers(obj)
        obj = canonical_json_timestamps(obj)
        
        # Serialize to JSON
        return json.dumps(obj, separators=(',', ':'), ensure_ascii=False)
    
    @staticmethod
    def deserialize(json_str: str) -> Any:
        """
        Deserialize canonical JSON to object.
        
        Args:
            json_str: Canonical JSON string
        
        Returns:
            Deserialized object
        """
        return json.loads(json_str)
    
    @staticmethod
    def serialize_bytes(obj: Any) -> bytes:
        """
        Serialize object to canonical bytes.
        
        Args:
            obj: Object to serialize
        
        Returns:
            Canonical bytes
        """
        json_str = CanonicalSerializer.serialize(obj)
        return canonical_utf8_encode(json_str)
    
    @staticmethod
    def deserialize_bytes(data: bytes) -> Any:
        """
        Deserialize canonical bytes to object.
        
        Args:
            data: Canonical bytes
        
        Returns:
            Deserialized object
        """
        json_str = canonical_utf8_decode(data)
        return CanonicalSerializer.deserialize(json_str)
```

---

## Serialization Authority Interface

### Interface Definition
```python
class SerializationAuthority:
    """Serialization authority interface."""
    
    @abstractmethod
    def serialize(self, obj: Any) -> str:
        """Serialize object to canonical JSON."""
        pass
    
    @abstractmethod
    def deserialize(self, json_str: str) -> Any:
        """Deserialize canonical JSON to object."""
        pass
    
    @abstractmethod
    def serialize_bytes(self, obj: Any) -> bytes:
        """Serialize object to canonical bytes."""
        pass
    
    @abstractmethod
    def deserialize_bytes(self, data: bytes) -> Any:
        """Deserialize canonical bytes to object."""
        pass
```

### Implementation
```python
class ConstitutionalSerializationAuthority(SerializationAuthority):
    """Constitutional serialization authority implementation."""
    
    def serialize(self, obj: Any) -> str:
        """Serialize object to canonical JSON."""
        return CanonicalSerializer.serialize(obj)
    
    def deserialize(self, json_str: str) -> Any:
        """Deserialize canonical JSON to object."""
        return CanonicalSerializer.deserialize(json_str)
    
    def serialize_bytes(self, obj: Any) -> bytes:
        """Serialize object to canonical bytes."""
        return CanonicalSerializer.serialize_bytes(obj)
    
    def deserialize_bytes(self, data: bytes) -> Any:
        """Deserialize canonical bytes to object."""
        return CanonicalSerializer.deserialize_bytes(data)
```

---

## Serialization Testing

### Determinism Test
```python
def test_serialization_determinism():
    """
    Test serialization determinism.
    """
    obj = {
        'z': 1,
        'a': 2,
        'm': {
            'y': 3,
            'x': 4
        }
    }
    
    # Serialize multiple times
    results = []
    for _ in range(10):
        result = CanonicalSerializer.serialize(obj)
        results.append(result)
    
    # Verify all results identical
    assert all(results[0] == r for r in results)
```

### Cross-Platform Test
```python
def test_cross_platform_serialization():
    """
    Test serialization across platforms.
    """
    obj = {
        'timestamp': '2026-06-14T18:00:00Z',
        'number': 1.5,
        'null': None
    }
    
    # Serialize
    serialized = CanonicalSerializer.serialize(obj)
    
    # Deserialize
    deserialized = CanonicalSerializer.deserialize(serialized)
    
    # Verify round-trip
    assert deserialized == obj
```

---

## Serialization Best Practices

### 1. Single Authority
- Use only CanonicalSerializer
- Never use json.dumps directly
- Never use other serializers
- Never fragment serialization logic

### 2. Canonical Ordering
- Always sort dictionary keys
- Always use consistent separators
- Always use consistent encoding
- Never rely on insertion order

### 3. Canonical Values
- Normalize Unicode
- Normalize numbers
- Normalize timestamps
- Normalize nulls

### 4. Verification
- Test serialization determinism
- Test cross-platform compatibility
- Test round-trip serialization
- Test edge cases

### 5. Documentation
- Document serialization rules
- Document canonical transformations
- Document testing procedures
- Document edge cases
