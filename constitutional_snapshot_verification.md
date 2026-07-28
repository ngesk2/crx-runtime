# Constitutional Snapshot Verification

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** Snapshot → Witness Root → Replay → Witness Root Verification
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design implements constitutional snapshot verification that ensures witness roots match between snapshot, replay, and witness root computation. The verification flow: Snapshot → Witness Root → Replay → Witness Root (roots must match).

**Additional Hardening:** Constitutional Snapshot Verification
**Constitutional Violations Resolved:** WITNESS_LAW.md (witness verification), REPLAY_LAW.md (replay verification)

---

# Current Vulnerability

## Existing Snapshot Process

**Current snapshot process has no verification:**
- Snapshot created without witness root verification
- Replay not verified against snapshot
- Witness root not verified against replay
- No cross-verification between snapshot, replay, and witness root

**Vulnerability:**
- No verification of snapshot integrity
- No verification of replay correctness
- No verification of witness root consistency
- No detection of snapshot corruption
- Partial violation of WITNESS_LAW.md (witness verification)
- Partial violation of REPLAY_LAW.md (replay verification)

---

# Design Objectives

## Primary Objectives

1. **Snapshot Witness Root:** Compute witness root from snapshot
2. **Replay Witness Root:** Compute witness root from replay
3. **Root Matching:** Verify snapshot witness root matches replay witness root
4. **Verification Failure Handling:** Handle verification failures

## Secondary Objectives

1. **Automated Verification:** Automate snapshot verification
2. **Periodic Verification:** Run periodic verification checks
3. **Security Events:** Emit security events on verification failures

---

# Constitutional Snapshot Verification Architecture

## Snapshot Creation

```python
def create_constitutional_snapshot() -> dict:
    """
    Create constitutional snapshot.
    
    Constitutional: Snapshot includes all constitutional documents.
    """
    # Load constitutional documents
    documents = load_constitutional_documents_canonical()
    
    # Compute snapshot witness root
    snapshot_witness_root = compute_witness_root_deterministic(documents)
    
    # Store snapshot
    snapshot = {
        'snapshot_id': str(uuid.uuid4()),
        'created_at': datetime.utcnow().isoformat(),
        'documents': documents,
        'witness_root': snapshot_witness_root,
        'document_count': len(documents)
    }
    
    # Store snapshot in database
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO constitutional_snapshots (
            snapshot_id, created_at, witness_root, document_count
        ) VALUES (%s, %s, %s, %s)
        """,
        (snapshot['snapshot_id'], snapshot['created_at'], snapshot['witness_root'], snapshot['document_count'])
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Constitutional snapshot created: {snapshot['snapshot_id']}")
    return snapshot
```

## Replay Verification

```python
def verify_snapshot_replay(snapshot_id: str) -> bool:
    """
    Verify snapshot by replaying event stream.
    
    Constitutional: Replay must produce identical witness root.
    """
    # Load snapshot
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM constitutional_snapshots WHERE snapshot_id = %s",
        (snapshot_id,)
    )
    snapshot = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not snapshot:
        raise Exception("Snapshot not found")
    
    snapshot_witness_root = snapshot[2]
    
    # Replay event stream
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT MAX(event_order_index) FROM events"
    )
    max_event_order = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    # Replay events
    replay_state = replay_events_with_order(0, max_event_order)
    
    # Compute replay witness root
    replay_witness_root = compute_witness_root_from_replay_state(replay_state)
    
    # Compare witness roots
    if snapshot_witness_root != replay_witness_root:
        logger.error(f"Witness root mismatch: snapshot={snapshot_witness_root}, replay={replay_witness_root}")
        emit_event('security', 'SNAPSHOT_REPLAY_MISMATCH', {
            'snapshot_id': snapshot_id,
            'snapshot_witness_root': snapshot_witness_root,
            'replay_witness_root': replay_witness_root,
            'detected_at': datetime.utcnow().isoformat()
        })
        return False
    
    logger.info(f"Snapshot replay verification successful: {snapshot_id}")
    return True
```

## Witness Root Verification

```python
def verify_witness_root_consistency(snapshot_id: str) -> bool:
    """
    Verify witness root consistency across snapshot, replay, and computation.
    
    Constitutional: Witness roots must match across all sources.
    """
    # Load snapshot
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM constitutional_snapshots WHERE snapshot_id = %s",
        (snapshot_id,)
    )
    snapshot = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not snapshot:
        raise Exception("Snapshot not found")
    
    snapshot_witness_root = snapshot[2]
    
    # Compute current witness root from documents
    documents = load_constitutional_documents_canonical()
    current_witness_root = compute_witness_root_deterministic(documents)
    
    # Compute replay witness root
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT MAX(event_order_index) FROM events"
    )
    max_event_order = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    replay_state = replay_events_with_order(0, max_event_order)
    replay_witness_root = compute_witness_root_from_replay_state(replay_state)
    
    # Compare all witness roots
    witness_roots = {
        'snapshot': snapshot_witness_root,
        'current': current_witness_root,
        'replay': replay_witness_root
    }
    
    all_match = len(set(witness_roots.values())) == 1
    
    if not all_match:
        logger.error(f"Witness root inconsistency: {witness_roots}")
        emit_event('security', 'WITNESS_ROOT_INCONSISTENCY', {
            'snapshot_id': snapshot_id,
            'witness_roots': witness_roots,
            'detected_at': datetime.utcnow().isoformat()
        })
        return False
    
    logger.info(f"Witness root consistency verified: {snapshot_id}")
    return True
```

## Full Verification Pipeline

```python
def verify_constitutional_snapshot(snapshot_id: str) -> dict:
    """
    Run full constitutional snapshot verification.
    
    Constitutional: Full verification includes snapshot, replay, and witness root.
    """
    verification_result = {
        'snapshot_id': snapshot_id,
        'verified_at': datetime.utcnow().isoformat(),
        'checks': {}
    }
    
    # Check 1: Replay verification
    verification_result['checks']['replay_verification'] = verify_snapshot_replay(snapshot_id)
    
    # Check 2: Witness root consistency
    verification_result['checks']['witness_root_consistency'] = verify_witness_root_consistency(snapshot_id)
    
    # Overall result
    verification_result['overall_result'] = all(verification_result['checks'].values())
    
    # Emit verification event
    emit_event('verification', 'CONSTITUTIONAL_SNAPSHOT_VERIFIED', {
        'snapshot_id': snapshot_id,
        'verification_result': verification_result,
        'verified_at': datetime.utcnow().isoformat()
    })
    
    return verification_result
```

---

# Database Schema

## constitutional_snapshots Table

```sql
CREATE TABLE IF NOT EXISTS constitutional_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    witness_root CHAR(64) NOT NULL,
    document_count INTEGER NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_verification_status CHECK (verification_status IN (
        'pending',
        'verified',
        'failed'
    ))
);

CREATE INDEX idx_constitutional_snapshots_snapshot_id ON constitutional_snapshots(snapshot_id);
CREATE INDEX idx_constitutional_snapshots_created_at ON constitutional_snapshots(created_at);
```

---

# Security Event Emission

## SNAPSHOT_REPLAY_MISMATCH Event

```json
{
  "stream": "security",
  "event_type": "SNAPSHOT_REPLAY_MISMATCH",
  "payload": {
    "snapshot_id": "uuid",
    "snapshot_witness_root": "abc123...",
    "replay_witness_root": "def456...",
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

## WITNESS_ROOT_INCONSISTENCY Event

```json
{
  "stream": "security",
  "event_type": "WITNESS_ROOT_INCONSISTENCY",
  "payload": {
    "snapshot_id": "uuid",
    "witness_roots": {
      "snapshot": "abc123...",
      "current": "def456...",
      "replay": "ghi789..."
    },
    "detected_at": "2026-06-24T00:00:00Z"
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement create_constitutional_snapshot()** function
2. **Implement verify_snapshot_replay()** function
3. **Implement verify_witness_root_consistency()** function
4. **Implement verify_constitutional_snapshot()** function
5. **Create constitutional_snapshots table**
6. **Emit security events** for verification failures

## Optional Changes

1. **Implement periodic verification** for automated checks
2. **Implement verification dashboard** for monitoring
3. **Implement verification notification system** for alerts

---

# Testing Strategy

## Unit Tests

1. **create_constitutional_snapshot() Test:** Test snapshot creation
2. **verify_snapshot_replay() Test:** Test replay verification
3. **verify_witness_root_consistency() Test:** Test witness root consistency
4. **verify_constitutional_snapshot() Test:** Test full verification pipeline

## Integration Tests

1. **End-to-End Snapshot Verification Test:** Test full snapshot verification flow
2. **Replay Mismatch Detection Test:** Test replay mismatch is detected
3. **Witness Root Inconsistency Detection Test:** Test witness root inconsistency is detected

## Regression Tests

1. **Snapshot Verification Required Test:** Verify snapshot verification is required
2. **Root Matching Test:** Verify roots must match
3. **Security Event Test:** Verify security events are emitted

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Snapshot witness root | No witness root | Witness root required | create_constitutional_snapshot() |
| Replay verification | No verification | Verification required | verify_snapshot_replay() |
| Root matching | No matching | Matching required | verify_witness_root_consistency() |
| Verification failure handling | No handling | Handling required | verify_constitutional_snapshot() |
| Security events | No security events | Security events emitted | Emit SNAPSHOT_REPLAY_MISMATCH |

---

# Migration Path

## Phase 1: Database Schema

1. Create constitutional_snapshots table
2. Deploy schema to staging
3. Test schema

## Phase 2: Snapshot Functions

1. Implement create_constitutional_snapshot()
2. Implement verify_snapshot_replay()
3. Implement verify_witness_root_consistency()
4. Implement verify_constitutional_snapshot()
5. Deploy to staging
6. Test functions

## Phase 3: Security Events

1. Implement security event emission
2. Update verification to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 4: Production Deployment

1. Deploy schema to production
2. Deploy snapshot functions to production
3. Deploy security events to production
4. Monitor snapshot verification
5. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** Final Deliverable - CONSTITUTIONAL_ENFORCEMENT_READINESS_REPORT.md
