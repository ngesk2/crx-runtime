# Witness System

**Phase 9:** Design replay witness generation

---

## Overview

Witness System generates replay witnesses to prove replay correctness years later. Witness includes canonical version, ordered event IDs, state hash, transcript hash, reducer hashes, and lineage proof.

---

## Witness Structure

### Witness Definition
```python
class Witness:
    """Replay witness."""
    
    def __init__(self):
        self.canonical_version = "2.0"
        self.ordered_event_ids = []
        self.state_hash = None
        self.transcript_hash = None
        self.reducer_hashes = {}
        self.lineage_proof = {}
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        """
        Convert witness to dictionary.
        
        Returns:
            Witness dictionary
        """
        return {
            'canonical_version': self.canonical_version,
            'ordered_event_ids': [str(eid) for eid in self.ordered_event_ids],
            'state_hash': self.state_hash,
            'transcript_hash': self.transcript_hash,
            'reducer_hashes': self.reducer_hashes,
            'lineage_proof': self.lineage_proof,
            'timestamp': self.timestamp.isoformat()
        }
```

---

## Witness Generation

### Generation Procedure
```python
def generate_witness(events: List[Dict], state: Dict) -> Witness:
    """
    Generate replay witness.
    
    Args:
        events: Events replayed
        state: Resulting state
    
    Returns:
        Replay witness
    """
    witness = Witness()
    
    # Set canonical version
    witness.canonical_version = get_canonical_version()
    
    # Set ordered event IDs
    witness.ordered_event_ids = [event['event_id'] for event in events]
    
    # Set state hash
    witness.state_hash = hash_object(hash_authority, state)
    
    # Set transcript hash
    witness.transcript_hash = hash_transcript(hash_authority, events)
    
    # Set reducer hashes
    for event_type in get_event_types(events):
        reducer = REDUCERS.get(event_type)
        if reducer:
            witness.reducer_hashes[event_type] = hash_function(hash_authority, reducer)
    
    # Set lineage proof
    witness.lineage_proof = generate_lineage_proof(events)
    
    return witness
```

### Canonical Version
```python
def get_canonical_version() -> str:
    """
    Get canonical version.
    
    Returns:
        Canonical version string
    """
    return "2.0"
```

### Lineage Proof
```python
def generate_lineage_proof(events: List[Dict]) -> Dict:
    """
    Generate lineage proof from events.
    
    Args:
        events: Events to generate proof from
    
    Returns:
        Lineage proof
    """
    lineage_proof = {}
    
    for event in events:
        if 'lineage_id' in event.get('event_data', {}):
            lineage_id = event['event_data']['lineage_id']
            if lineage_id not in lineage_proof:
                lineage_proof[lineage_id] = []
            lineage_proof[lineage_id].append(event['event_id'])
    
    return lineage_proof
```

---

## Witness Verification

### Verification Procedure
```python
def verify_witness(witness: Witness, events: List[Dict], state: Dict) -> bool:
    """
    Verify replay witness.
    
    Args:
        witness: Witness to verify
        events: Events replayed
        state: Resulting state
    
    Returns:
        True if witness is valid
    """
    # Verify canonical version
    if witness.canonical_version != get_canonical_version():
        return False
    
    # Verify ordered event IDs
    if witness.ordered_event_ids != [str(e['event_id']) for e in events]:
        return False
    
    # Verify state hash
    state_hash = hash_object(hash_authority, state)
    if witness.state_hash != state_hash:
        return False
    
    # Verify transcript hash
    transcript_hash = hash_transcript(hash_authority, events)
    if witness.transcript_hash != transcript_hash:
        return False
    
    # Verify reducer hashes
    for event_type, reducer_hash in witness.reducer_hashes.items():
        reducer = REDUCERS.get(event_type)
        if reducer:
            computed_hash = hash_function(hash_authority, reducer)
            if reducer_hash != computed_hash:
                return False
    
    # Verify lineage proof
    lineage_proof = generate_lineage_proof(events)
    if witness.lineage_proof != lineage_proof:
        return False
    
    return True
```

---

## Witness Storage

### Storage Procedure
```python
def store_witness(witness: Witness, replay_id: UUID):
    """
    Store replay witness.
    
    Args:
        witness: Witness to store
        replay_id: Replay identifier
    """
    # Serialize witness
    witness_dict = witness.to_dict()
    witness_bytes = hash_authority.serialization_authority.serialize_bytes(witness_dict)
    
    # Store witness
    store_witness_data(replay_id, witness_bytes)
    
    # Store witness hash
    witness_hash = hash_bytes(hash_authority, witness_bytes)
    store_witness_hash(replay_id, witness_hash)
```

### Retrieval Procedure
```python
def retrieve_witness(replay_id: UUID) -> Witness:
    """
    Retrieve replay witness.
    
    Args:
        replay_id: Replay identifier
    
    Returns:
        Witness
    """
    # Retrieve witness data
    witness_bytes = retrieve_witness_data(replay_id)
    
    # Deserialize witness
    witness_dict = hash_authority.serialization_authority.deserialize_bytes(witness_bytes)
    
    # Create witness object
    witness = Witness()
    witness.canonical_version = witness_dict['canonical_version']
    witness.ordered_event_ids = [UUID(eid) for eid in witness_dict['ordered_event_ids']]
    witness.state_hash = witness_dict['state_hash']
    witness.transcript_hash = witness_dict['transcript_hash']
    witness.reducer_hashes = witness_dict['reducer_hashes']
    witness.lineage_proof = witness_dict['lineage_proof']
    witness.timestamp = datetime.fromisoformat(witness_dict['timestamp'])
    
    return witness
```

---

## Witness Longevity

### Long-Term Storage
```python
def archive_witness(witness: Witness, replay_id: UUID):
    """
    Archive witness for long-term storage.
    
    Args:
        witness: Witness to archive
        replay_id: Replay identifier
    """
    # Serialize witness
    witness_dict = witness.to_dict()
    witness_bytes = hash_authority.serialization_authority.serialize_bytes(witness_dict)
    
    # Encrypt witness
    encrypted_witness = encrypt_data(witness_bytes)
    
    # Archive to cold storage
    archive_to_cold_storage(replay_id, encrypted_witness)
```

### Long-Term Retrieval
```python
def retrieve_archived_witness(replay_id: UUID) -> Witness:
    """
    Retrieve archived witness.
    
    Args:
        replay_id: Replay identifier
    
    Returns:
        Witness
    """
    # Retrieve from cold storage
    encrypted_witness = retrieve_from_cold_storage(replay_id)
    
    # Decrypt witness
    witness_bytes = decrypt_data(encrypted_witness)
    
    # Deserialize witness
    witness_dict = hash_authority.serialization_authority.deserialize_bytes(witness_bytes)
    
    # Create witness object
    witness = Witness()
    witness.canonical_version = witness_dict['canonical_version']
    witness.ordered_event_ids = [UUID(eid) for eid in witness_dict['ordered_event_ids']]
    witness.state_hash = witness_dict['state_hash']
    witness.transcript_hash = witness_dict['transcript_hash']
    witness.reducer_hashes = witness_dict['reducer_hashes']
    witness.lineage_proof = witness_dict['lineage_proof']
    witness.timestamp = datetime.fromisoformat(witness_dict['timestamp'])
    
    return witness
```

---

## Witness Best Practices

### 1. Complete Witness
- Include all required fields
- Include canonical version
- Include ordered event IDs
- Include all hashes

### 2. Deterministic Generation
- Generate witness deterministically
- Use canonical serialization
- Use canonical hashing
- Use canonical ordering

### 3. Verifiable Witness
- Verify witness integrity
- Verify witness completeness
- Verify witness consistency
- Verify witness correctness

### 4. Long-Term Storage
- Archive witnesses for long-term storage
- Encrypt witnesses
- Store witness hashes
- Support retrieval

### 5. Documentation
- Document witness structure
- Document witness generation
- Document witness verification
- Document witness storage
