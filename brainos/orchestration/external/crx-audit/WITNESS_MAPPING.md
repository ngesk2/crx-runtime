# Witness Mapping

**Phase 8:** Every CRX artifact must generate witnesses

---

## Overview

Witness Mapping ensures every CRX artifact generates object witness, lineage witness, relationship witness, and protocol witness. Replay verification required.

---

## Witness Types

### 1. Object Witness
**Purpose:** Prove object correctness
**Generation:**
```python
def generate_object_witness(artifact: Artifact) -> ObjectWitness:
    """
    Generate object witness.
    
    Args:
        artifact: Artifact to witness
    
    Returns:
        Object witness
    """
    witness = ObjectWitness(
        witness_id=uuid4(),
        artifact_id=artifact.artifact_id,
        artifact_type=artifact.artifact_type,
        content_hash=artifact.content_hash,
        lineage_id=artifact.lineage_id,
        timestamp=datetime.utcnow()
    )
    
    return witness
```

### 2. Lineage Witness
**Purpose:** Prove lineage correctness
**Generation:**
```python
def generate_lineage_witness(lineage: Lineage) -> LineageWitness:
    """
    Generate lineage witness.
    
    Args:
        lineage: Lineage to witness
    
    Returns:
        Lineage witness
    """
    witness = LineageWitness(
        witness_id=uuid4(),
        lineage_id=lineage.lineage_id,
        root_artifact_id=lineage.root_artifact_id,
        artifact_chain=lineage.artifact_chain,
        processor_chain=lineage.processor_chain,
        timestamp=datetime.utcnow()
    )
    
    return witness
```

### 3. Relationship Witness
**Purpose:** Prove relationship correctness
**Generation:**
```python
def generate_relationship_witness(relationship: RelationshipArtifact) -> RelationshipWitness:
    """
    Generate relationship witness.
    
    Args:
        relationship: Relationship to witness
    
    Returns:
        Relationship witness
    """
    witness = RelationshipWitness(
        witness_id=uuid4(),
        relationship_id=relationship.relationship_id,
        source_entity_id=relationship.source_entity_id,
        target_entity_id=relationship.target_entity_id,
        relationship_type=relationship.relationship_type,
        timestamp=datetime.utcnow()
    )
    
    return witness
```

### 4. Protocol Witness
**Purpose:** Prove protocol correctness
**Generation:**
```python
def generate_protocol_witness(protocol_id: UUID, events: List[Event]) -> ProtocolWitness:
    """
    Generate protocol witness.
    
    Args:
        protocol_id: Protocol ID
        events: Events to witness
    
    Returns:
        Protocol witness
    """
    witness = ProtocolWitness(
        witness_id=uuid4(),
        protocol_id=protocol_id,
        event_ids=[e.event_id for e in events],
        state_hash=compute_protocol_state_hash(events),
        timestamp=datetime.utcnow()
    )
    
    return witness
```

---

## Witness Generation for CRX Artifacts

### Post Witness
```python
def generate_post_witness(post: PostArtifact) -> ObjectWitness:
    """Generate witness for post."""
    return generate_object_witness(post)
```

### Reply Witness
```python
def generate_reply_witness(reply: ReplyArtifact) -> ObjectWitness:
    """Generate witness for reply."""
    return generate_object_witness(reply)
```

### Identity Witness
```python
def generate_identity_witness(identity: IdentityArtifact) -> ObjectWitness:
    """Generate witness for identity."""
    return generate_object_witness(identity)
```

### Trust Witness
```python
def generate_trust_witness(trust: TrustEdge) -> RelationshipWitness:
    """Generate witness for trust edge."""
    return generate_relationship_witness(trust)
```

### Community Witness
```python
def generate_community_witness(community: CommunityArtifact) -> ObjectWitness:
    """Generate witness for community."""
    return generate_object_witness(community)
```

---

## Replay Verification

### Verification Procedure
```python
def verify_witness_replay(witness: Witness, artifact: Artifact) -> bool:
    """
    Verify witness replay correctness.
    
    Args:
        witness: Witness to verify
        artifact: Artifact to verify against
    
    Returns:
        True if witness is correct
    
    Requirement:
        Replay verification required
    """
    # Regenerate witness
    regenerated_witness = generate_object_witness(artifact)
    
    # Compare witnesses
    return witness == regenerated_witness
```

---

## Witness Best Practices

### 1. Complete Witnessing
- Every artifact generates object witness
- Every lineage generates lineage witness
- Every relationship generates relationship witness
- Every protocol generates protocol witness

### 2. Replay Verification
- All witnesses replayable
- All witnesses verifiable
- All witnesses deterministic
- All witnesses consistent

### 3. Witness Storage
- Witnesses stored as constitutional objects
- Witnesses are event-sourced
- Witnesses are replayable
- Witnesses are verifiable

### 4. Witness Verification
- Verify witness correctness
- Verify witness replay
- Verify witness determinism
- Verify witness consistency

### 5. Witness Documentation
- Document witness generation
- Document witness verification
- Document witness storage
- Document witness replay
