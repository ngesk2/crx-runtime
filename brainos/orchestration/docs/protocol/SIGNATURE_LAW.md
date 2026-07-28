# Signature Law

**Phase 26:** Objects must support signing

---

## Overview

Signature Law establishes that objects must support signing. Required support: object signatures, event signatures, witness signatures, lineage signatures. Verification must be replayable. Verification must be deterministic. Future protocol systems must trust signatures rather than platforms.

---

## Signature Support

### Object Signatures
```python
class SignedObject:
    """Signed object."""
    
    def __init__(
        self,
        object_id: UUID,
        content_hash: str,
        signature: str,
        signer_identity_id: UUID,
        signature_timestamp: datetime
    ):
        self.object_id = object_id
        self.content_hash = content_hash
        self.signature = signature
        self.signer_identity_id = signer_identity_id
        self.signature_timestamp = signature_timestamp
```

### Object Signing
```python
def sign_object(
    object_id: UUID,
    signer_identity_id: UUID,
    private_key: str
) -> SignedObject:
    """
    Sign object.
    
    Args:
        object_id: Object ID to sign
        signer_identity_id: Signer identity ID
        private_key: Private key for signing
    
    Returns:
        Signed object
    
    Requirement:
        Verification must be replayable
        Verification must be deterministic
    """
    # Get object
    obj = get_object(object_id)
    
    # Compute signature
    signature = compute_signature(
        data=obj.content_hash,
        private_key=private_key
    )
    
    # Create signed object
    signed_object = SignedObject(
        object_id=object_id,
        content_hash=obj.content_hash,
        signature=signature,
        signer_identity_id=signer_identity_id,
        signature_timestamp=datetime.utcnow()
    )
    
    # Store signature
    store_object_signature(signed_object)
    
    # Emit object signed event
    emit_object_signed_event(signed_object)
    
    return signed_object
```

### Object Signature Verification
```python
def verify_object_signature(
    object_id: UUID,
    signature: str,
    signer_identity_id: UUID
) -> bool:
    """
    Verify object signature.
    
    Args:
        object_id: Object ID
        signature: Signature to verify
        signer_identity_id: Signer identity ID
    
    Returns:
        True if signature is valid
    
    Guarantee:
        Verification is replayable
        Verification is deterministic
    """
    # Get object
    obj = get_object(object_id)
    
    # Get signer identity
    identity = get_identity(signer_identity_id)
    
    # Verify signature
    is_valid = verify_signature(
        data=obj.content_hash,
        signature=signature,
        public_key=identity.public_key
    )
    
    return is_valid
```

---

## Event Signatures

### Event Signing
```python
def sign_event(
    event_id: UUID,
    signer_identity_id: UUID,
    private_key: str
) -> SignedEvent:
    """
    Sign event.
    
    Args:
        event_id: Event ID to sign
        signer_identity_id: Signer identity ID
        private_key: Private key for signing
    
    Returns:
        Signed event
    
    Requirement:
        Verification must be replayable
        Verification must be deterministic
    """
    # Get event
    event = get_event(event_id)
    
    # Compute event hash
    event_bytes = hash_authority.serialization_authority.serialize_bytes(event.to_dict())
    event_hash = hash_authority.hash_bytes(event_bytes)
    
    # Compute signature
    signature = compute_signature(
        data=event_hash,
        private_key=private_key
    )
    
    # Create signed event
    signed_event = SignedEvent(
        event_id=event_id,
        event_hash=event_hash,
        signature=signature,
        signer_identity_id=signer_identity_id,
        signature_timestamp=datetime.utcnow()
    )
    
    # Store signature
    store_event_signature(signed_event)
    
    # Emit event signed event
    emit_event_signed_event(signed_event)
    
    return signed_event
```

### Event Signature Verification
```python
def verify_event_signature(
    event_id: UUID,
    signature: str,
    signer_identity_id: UUID
) -> bool:
    """
    Verify event signature.
    
    Args:
        event_id: Event ID
        signature: Signature to verify
        signer_identity_id: Signer identity ID
    
    Returns:
        True if signature is valid
    
    Guarantee:
        Verification is replayable
        Verification is deterministic
    """
    # Get event
    event = get_event(event_id)
    
    # Compute event hash
    event_bytes = hash_authority.serialization_authority.serialize_bytes(event.to_dict())
    event_hash = hash_authority.hash_bytes(event_bytes)
    
    # Get signer identity
    identity = get_identity(signer_identity_id)
    
    # Verify signature
    is_valid = verify_signature(
        data=event_hash,
        signature=signature,
        public_key=identity.public_key
    )
    
    return is_valid
```

---

## Witness Signatures

### Witness Signing
```python
def sign_witness(
    witness_id: UUID,
    signer_identity_id: UUID,
    private_key: str
) -> SignedWitness:
    """
    Sign witness.
    
    Args:
        witness_id: Witness ID to sign
        signer_identity_id: Signer identity ID
        private_key: Private key for signing
    
    Returns:
        Signed witness
    
    Requirement:
        Verification must be replayable
        Verification must be deterministic
    """
    # Get witness
    witness = get_witness(witness_id)
    
    # Compute witness hash
    witness_bytes = hash_authority.serialization_authority.serialize_bytes(witness.to_dict())
    witness_hash = hash_authority.hash_bytes(witness_bytes)
    
    # Compute signature
    signature = compute_signature(
        data=witness_hash,
        private_key=private_key
    )
    
    # Create signed witness
    signed_witness = SignedWitness(
        witness_id=witness_id,
        witness_hash=witness_hash,
        signature=signature,
        signer_identity_id=signer_identity_id,
        signature_timestamp=datetime.utcnow()
    )
    
    # Store signature
    store_witness_signature(signed_witness)
    
    # Emit witness signed event
    emit_witness_signed_event(signed_witness)
    
    return signed_witness
```

### Witness Signature Verification
```python
def verify_witness_signature(
    witness_id: UUID,
    signature: str,
    signer_identity_id: UUID
) -> bool:
    """
    Verify witness signature.
    
    Args:
        witness_id: Witness ID
        signature: Signature to verify
        signer_identity_id: Signer identity ID
    
    Returns:
        True if signature is valid
    
    Guarantee:
        Verification is replayable
        Verification is deterministic
    """
    # Get witness
    witness = get_witness(witness_id)
    
    # Compute witness hash
    witness_bytes = hash_authority.serialization_authority.serialize_bytes(witness.to_dict())
    witness_hash = hash_authority.hash_bytes(witness_bytes)
    
    # Get signer identity
    identity = get_identity(signer_identity_id)
    
    # Verify signature
    is_valid = verify_signature(
        data=witness_hash,
        signature=signature,
        public_key=identity.public_key
    )
    
    return is_valid
```

---

## Lineage Signatures

### Lineage Signing
```python
def sign_lineage(
    lineage_id: UUID,
    signer_identity_id: UUID,
    private_key: str
) -> SignedLineage:
    """
    Sign lineage.
    
    Args:
        lineage_id: Lineage ID to sign
        signer_identity_id: Signer identity ID
        private_key: Private key for signing
    
    Returns:
        Signed lineage
    
    Requirement:
        Verification must be replayable
        Verification must be deterministic
    """
    # Get lineage
    lineage = get_lineage(lineage_id)
    
    # Compute lineage hash
    lineage_bytes = hash_authority.serialization_authority.serialize_bytes(lineage.to_dict())
    lineage_hash = hash_authority.hash_bytes(lineage_bytes)
    
    # Compute signature
    signature = compute_signature(
        data=lineage_hash,
        private_key=private_key
    )
    
    # Create signed lineage
    signed_lineage = SignedLineage(
        lineage_id=lineage_id,
        lineage_hash=lineage_hash,
        signature=signature,
        signer_identity_id=signer_identity_id,
        signature_timestamp=datetime.utcnow()
    )
    
    # Store signature
    store_lineage_signature(signed_lineage)
    
    # Emit lineage signed event
    emit_lineage_signed_event(signed_lineage)
    
    return signed_lineage
```

### Lineage Signature Verification
```python
def verify_lineage_signature(
    lineage_id: UUID,
    signature: str,
    signer_identity_id: UUID
) -> bool:
    """
    Verify lineage signature.
    
    Args:
        lineage_id: Lineage ID
        signature: Signature to verify
        signer_identity_id: Signer identity ID
    
    Returns:
        True if signature is valid
    
    Guarantee:
        Verification is replayable
        Verification is deterministic
    """
    # Get lineage
    lineage = get_lineage(lineage_id)
    
    # Compute lineage hash
    lineage_bytes = hash_authority.serialization_authority.serialize_bytes(lineage.to_dict())
    lineage_hash = hash_authority.hash_bytes(lineage_bytes)
    
    # Get signer identity
    identity = get_identity(signer_identity_id)
    
    # Verify signature
    is_valid = verify_signature(
        data=lineage_hash,
        signature=signature,
        public_key=identity.public_key
    )
    
    return is_valid
```

---

## Signature Determinism

### Replay Verification
```python
def verify_signature_replay(
    object_id: UUID,
    signature: str,
    signer_identity_id: UUID
) -> bool:
    """
    Verify signature replay correctness.
    
    Args:
        object_id: Object ID
        signature: Signature to verify
        signer_identity_id: Signer identity ID
    
    Returns:
        True if signature replay is correct
    
    Guarantee:
        Verification is replayable
        Verification is deterministic
    """
    # Verify signature multiple times
    results = []
    for _ in range(10):
        result = verify_object_signature(object_id, signature, signer_identity_id)
        results.append(result)
    
    # Verify all results identical
    return all(results)
```

---

## Signature Best Practices

### 1. Signature Support
- Objects must support signing
- Events must support signing
- Witnesses must support signing
- Lineage must support signing

### 2. Replayable Verification
- Verification must be replayable
- Verification must be deterministic
- Verification must be consistent
- Verification must be verifiable

### 3. Trust Signatures
- Future systems trust signatures rather than platforms
- Signatures are cryptographic proofs
- Signatures are identity-bound
- Signatures are verifiable

### 4. Signature Storage
- Signatures stored as constitutional objects
- Signatures are event-sourced
- Signatures are replayable
- Signatures are lineage-tracked

### 5. Signature Verification
- Verify signature correctness
- Verify signature replay
- Verify signature determinism
- Verify signature consistency
