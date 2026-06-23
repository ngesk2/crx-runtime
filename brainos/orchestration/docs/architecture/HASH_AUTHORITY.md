# Hash Authority

**Phase 3:** Design constitutional hashing layer

---

## Overview

Hash Authority establishes the constitutional hashing layer. All hashes derived from canonical bytes. Never hash runtime objects, never hash DB rows, never hash serializer outputs from arbitrary libraries.

---

## Hash Requirements

### SHA256 Only
- SHA256 algorithm only
- No other hash algorithms
- No hash algorithm switching
- No hash algorithm versioning

### Domain Separated Hashes
- Object hashes
- Event hashes
- Replay hashes
- Transcript hashes
- Witness hashes

### Canonical Bytes Only
- Hash canonical bytes only
- Never hash runtime objects
- Never hash DB rows
- Never hash serializer outputs from arbitrary libraries

---

## Hash Authority Interface

### Interface Definition
```python
class HashAuthority:
    """Hash authority interface."""
    
    @abstractmethod
    def hash_object(self, obj: Any) -> str:
        """Hash object using canonical serialization."""
        pass
    
    @abstractmethod
    def hash_bytes(self, data: bytes) -> str:
        """Hash bytes directly."""
        pass
    
    @abstractmethod
    def hash_string(self, text: str) -> str:
        """Hash string using canonical UTF-8."""
        pass
    
    @abstractmethod
    def hash_domain(self, domain: str, data: bytes) -> str:
        """Hash with domain separation."""
        pass
```

---

## Constitutional Hash Authority

### Implementation
```python
import hashlib
from typing import Any

class ConstitutionalHashAuthority(HashAuthority):
    """Constitutional hash authority implementation."""
    
    def __init__(self, serialization_authority: SerializationAuthority):
        """
        Initialize hash authority.
        
        Args:
            serialization_authority: Serialization authority
        """
        self.serialization_authority = serialization_authority
    
    def hash_object(self, obj: Any) -> str:
        """
        Hash object using canonical serialization.
        
        Args:
            obj: Object to hash
        
        Returns:
            SHA256 hex digest
        """
        # Serialize to canonical bytes
        bytes_data = self.serialization_authority.serialize_bytes(obj)
        
        # Hash bytes
        return self.hash_bytes(bytes_data)
    
    def hash_bytes(self, data: bytes) -> str:
        """
        Hash bytes directly.
        
        Args:
            data: Bytes to hash
        
        Returns:
            SHA256 hex digest
        """
        return hashlib.sha256(data).hexdigest()
    
    def hash_string(self, text: str) -> str:
        """
        Hash string using canonical UTF-8.
        
        Args:
            text: Text to hash
        
        Returns:
            SHA256 hex digest
        """
        # Encode to canonical UTF-8
        bytes_data = canonical_utf8_encode(text)
        
        # Hash bytes
        return self.hash_bytes(bytes_data)
    
    def hash_domain(self, domain: str, data: bytes) -> str:
        """
        Hash with domain separation.
        
        Args:
            domain: Domain string
            data: Data to hash
        
        Returns:
            SHA256 hex digest
        """
        # Prepend domain
        domain_bytes = canonical_utf8_encode(domain)
        combined = domain_bytes + data
        
        # Hash combined
        return self.hash_bytes(combined)
```

---

## Domain Separated Hashes

### Object Hash
```python
def hash_object(hash_authority: HashAuthority, obj: Any) -> str:
    """
    Hash object with domain separation.
    
    Args:
        hash_authority: Hash authority
        obj: Object to hash
    
    Returns:
        Domain-separated hash
    """
    bytes_data = hash_authority.serialization_authority.serialize_bytes(obj)
    return hash_authority.hash_domain("OBJECT", bytes_data)
```

### Event Hash
```python
def hash_event(hash_authority: HashAuthority, event: Dict) -> str:
    """
    Hash event with domain separation.
    
    Args:
        hash_authority: Hash authority
        event: Event to hash
    
    Returns:
        Domain-separated hash
    """
    bytes_data = hash_authority.serialization_authority.serialize_bytes(event)
    return hash_authority.hash_domain("EVENT", bytes_data)
```

### Replay Hash
```python
def hash_replay(hash_authority: HashAuthority, events: List[Dict]) -> str:
    """
    Hash replay with domain separation.
    
    Args:
        hash_authority: Hash authority
        events: Events to hash
    
    Returns:
        Domain-separated hash
    """
    # Serialize events in order
    events_bytes = b""
    for event in events:
        event_bytes = hash_authority.serialization_authority.serialize_bytes(event)
        events_bytes += event_bytes
    
    return hash_authority.hash_domain("REPLAY", events_bytes)
```

### Transcript Hash
```python
def hash_transcript(hash_authority: HashAuthority, transcript: List[Dict]) -> str:
    """
    Hash transcript with domain separation.
    
    Args:
        hash_authority: Hash authority
        transcript: Transcript to hash
    
    Returns:
        Domain-separated hash
    """
    # Serialize transcript in order
    transcript_bytes = b""
    for entry in transcript:
        entry_bytes = hash_authority.serialization_authority.serialize_bytes(entry)
        transcript_bytes += entry_bytes
    
    return hash_authority.hash_domain("TRANSCRIPT", transcript_bytes)
```

### Witness Hash
```python
def hash_witness(hash_authority: HashAuthority, witness: Dict) -> str:
    """
    Hash witness with domain separation.
    
    Args:
        hash_authority: Hash authority
        witness: Witness to hash
    
    Returns:
        Domain-separated hash
    """
    bytes_data = hash_authority.serialization_authority.serialize_bytes(witness)
    return hash_authority.hash_domain("WITNESS", bytes_data)
```

---

## Hash Verification

### Object Hash Verification
```python
def verify_object_hash(hash_authority: HashAuthority, obj: Any, expected_hash: str) -> bool:
    """
    Verify object hash.
    
    Args:
        hash_authority: Hash authority
        obj: Object to verify
        expected_hash: Expected hash
    
    Returns:
        True if hash matches
    """
    computed_hash = hash_object(hash_authority, obj)
    return computed_hash == expected_hash
```

### Event Hash Verification
```python
def verify_event_hash(hash_authority: HashAuthority, event: Dict, expected_hash: str) -> bool:
    """
    Verify event hash.
    
    Args:
        hash_authority: Hash authority
        event: Event to verify
        expected_hash: Expected hash
    
    Returns:
        True if hash matches
    """
    computed_hash = hash_event(hash_authority, event)
    return computed_hash == expected_hash
```

---

## Hash Authority Initialization

### Initialization
```python
# Initialize serialization authority
serialization_authority = ConstitutionalSerializationAuthority()

# Initialize hash authority
hash_authority = ConstitutionalHashAuthority(serialization_authority)

# Use hash authority for all hashing
object_hash = hash_object(hash_authority, obj)
event_hash = hash_event(hash_authority, event)
```

---

## Hash Testing

### Determinism Test
```python
def test_hash_determinism():
    """
    Test hash determinism.
    """
    serialization_authority = ConstitutionalSerializationAuthority()
    hash_authority = ConstitutionalHashAuthority(serialization_authority)
    
    obj = {'a': 1, 'b': 2}
    
    # Hash multiple times
    hashes = []
    for _ in range(10):
        h = hash_object(hash_authority, obj)
        hashes.append(h)
    
    # Verify all hashes identical
    assert all(hashes[0] == h for h in hashes)
```

### Cross-Platform Test
```python
def test_cross_platform_hash():
    """
    Test hash across platforms.
    """
    serialization_authority = ConstitutionalSerializationAuthority()
    hash_authority = ConstitutionalHashAuthority(serialization_authority)
    
    obj = {'a': 1, 'b': 2}
    
    # Hash on this platform
    hash1 = hash_object(hash_authority, obj)
    
    # Simulate hash on different platform
    hash2 = hash_object(hash_authority, obj)
    
    # Verify hashes identical
    assert hash1 == hash2
```

---

## Hash Best Practices

### 1. Single Authority
- Use only ConstitutionalHashAuthority
- Never use hashlib directly
- Never use other hash libraries
- Never fragment hash logic

### 2. Canonical Bytes Only
- Always hash canonical bytes
- Never hash runtime objects
- Never hash DB rows
- Never hash arbitrary serializer outputs

### 3. Domain Separation
- Always use domain separation
- Document domain meanings
- Maintain domain consistency
- Never reuse domains

### 4. Verification
- Test hash determinism
- Test cross-platform compatibility
- Test hash verification
- Test edge cases

### 5. Documentation
- Document hash algorithms
- Document domain separation
- Document testing procedures
- Document edge cases
