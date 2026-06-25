# Witness Determinism

## Constitutional Definition

**Witness roots must be deterministic** - identical event lineages must produce identical witness roots.

## Determinism Invariant

```
identical event lineage → identical witness root
```

This is a non-negotiable constitutional requirement for replay verification.

## Witness Generation Formula

### Current Implementation (Constitutional)

```python
def generate_witness_root(aggregate_id: str, replay_fingerprint: str) -> str:
    witness_data = f"{aggregate_id}:{replay_fingerprint}"
    witness_root = hashlib.sha256(witness_data.encode()).hexdigest()
    return witness_root
```

**Components:**
- `aggregate_id`: Canonical UUID identity
- `replay_fingerprint`: SHA256 hash of all events in order

**NOT Included:**
- Timestamps
- Random values
- System state
- External factors

## Why Determinism Matters

### Constitutional Verification
- Replay verification requires witness root comparison
- If witnesses are non-deterministic, verification fails
- Same events must always produce same witness

### State Reconstruction
- Delete all projections → replay events → identical witness root
- Delete all databases → replay events → identical witness root
- Different machines → same events → identical witness root

### Audit Trail Integrity
- Witness roots must be reproducible
- Historical verification must work
- Cross-machine verification must work

## Anti-Patterns

### ❌ INCORRECT: Timestamp-Based Witness

```python
# WRONG - produces different witness every run
witness_data = f"{aggregate_id}:{replay_fingerprint}:{datetime.utcnow().isoformat()}"
```

**Problem:** Same replay produces different witness on each run.

### ❌ INCORRECT: Random-Based Witness

```python
# WRONG - non-deterministic
witness_data = f"{aggregate_id}:{replay_fingerprint}:{uuid.uuid4()}"
```

**Problem:** Impossible to verify historical witnesses.

### ❌ INCORRECT: System State-Based Witness

```python
# WRONG - varies by machine
witness_data = f"{aggregate_id}:{replay_fingerprint}:{os.uname()}"
```

**Problem:** Cross-machine verification fails.

## Correct Patterns

### ✅ CORRECT: Deterministic Witness

```python
# CORRECT - same events always produce same witness
witness_data = f"{aggregate_id}:{replay_fingerprint}"
witness_root = hashlib.sha256(witness_data.encode()).hexdigest()
```

**Properties:**
- Pure function of inputs
- No external dependencies
- Reproducible across time
- Reproducible across machines

## Constitutional Tests

### Test A: Time Invariance
```
1. Generate witness at T1
2. Wait 1 hour
3. Generate witness at T2
4. Result: witness_root(T1) == witness_root(T2)
```

### Test B: Machine Invariance
```
1. Generate witness on Machine A
2. Generate witness on Machine B
3. Result: witness_root(A) == witness_root(B)
```

### Test C: Replay Invariance
```
1. Generate witness from events
2. Delete all projections
3. Replay events
4. Generate witness again
5. Result: witness_root(original) == witness_root(replayed)
```

## Witness Root Properties

### Property 1: Uniqueness
- Different event lineages produce different witness roots
- SHA256 collision resistance guarantees this

### Property 2: Determinism
- Same event lineage always produces same witness root
- No randomness, no timestamps, no external state

### Property 3: Verifiability
- Witness roots can be independently verified
- No secret information required for verification

### Property 4: Immutability
- Witness roots never change for a given event lineage
- Historical witnesses remain valid forever

## Implementation Verification

### Check Witness Generation
```python
def test_witness_determinism():
    aggregate_id = "550e8400-e29b-41d4-a716-446655440000"
    replay_fingerprint = "abc123..."
    
    # Generate witness twice
    witness1 = generate_witness_root(aggregate_id, replay_fingerprint)
    witness2 = generate_witness_root(aggregate_id, replay_fingerprint)
    
    # Must be identical
    assert witness1 == witness2
```

### Check Time Invariance
```python
def test_time_invariance():
    aggregate_id = "550e8400-e29b-41d4-a716-446655440000"
    replay_fingerprint = "abc123..."
    
    # Generate witness at different times
    witness1 = generate_witness_root(aggregate_id, replay_fingerprint)
    time.sleep(1)
    witness2 = generate_witness_root(aggregate_id, replay_fingerprint)
    
    # Must be identical
    assert witness1 == witness2
```

## Status

**FROZEN** - Witness determinism is constitutional and cannot be changed without breaking verification.

**Date:** 2026-06-25
**Version:** 1.0
**Implementation:** SHA256(aggregate_id + replay_fingerprint)

## Future Considerations

### Merkle Tree Witnesses
Future implementations may use Merkle trees for hierarchical witnesses:
```
witness_root = merkle_root([event_1_hash, event_2_hash, ...])
```
This remains deterministic if the tree construction is deterministic.

### Multi-Aggregate Witnesses
For cross-aggregate witnesses:
```
witness_root = SHA256(sorted([aggregate_1_witness, aggregate_2_witness]))
```
Sorting ensures determinism across different processing orders.

## Violation Consequences

Any violation of witness determinism results in:
- Replay verification failure
- Constitutional runtime failure
- Audit trail corruption
- State reconstruction impossibility

This is a critical constitutional invariant.
