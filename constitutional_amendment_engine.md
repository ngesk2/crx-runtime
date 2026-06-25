# Constitutional Amendment Engine

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** Constitutional Amendment Pipeline
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design implements a constitutional amendment pipeline that enforces event-driven amendments without direct file edits. The pipeline includes: Proposal → Review → Witness Generation → Approval → Amendment Event → Replay → Verification → Witness Root Update.

**Blocking Issue Addressed:** Amendment Sequence (Manual vs Automatic)
**Constitutional Violations Resolved:** MUTATION_LAW.md (unverifiable_mutation is prohibited)

---

# Current Vulnerability

## Existing Amendment Process

**Current process allows direct file edits:**
- Direct file modification of constitutional documents
- Manual amendment number assignment
- No event-driven amendment process
- No witness generation for amendments
- No replay verification for amendments

**Vulnerability:**
- Direct file edits bypass event recording
- Manual amendment number allows manipulation
- No witness generation for amendments
- No replay verification for amendments
- Violates MUTATION_LAW.md (unverifiable_mutation is prohibited)

---

# Design Objectives

## Primary Objectives

1. **Event-Driven Amendments:** All amendments must occur through event stream
2. **No Direct File Edits:** Prohibit direct file modifications
3. **Automatic Amendment Number:** Use SERIAL for automatic sequence
4. **Witness Generation:** All amendments must generate witness
5. **Replay Verification:** All amendments must pass replay verification

## Secondary Objectives

1. **Amendment Pipeline:** Enforce full amendment pipeline
2. **Witness Root Update:** Update witness root after amendment
3. **Audit Trail:** All amendments must be logged

---

# Constitutional Amendment Pipeline

## Stage 1: Proposal

### Submit Amendment Proposal

```python
def submit_amendment_proposal(
    proposer: str,
    document_id: str,
    amendment_type: str,
    amendment_title: str,
    amendment_description: str,
    amendment_diff: str,
    amendment_justification: str
) -> str:
    """
    Submit amendment proposal for governance review.
    
    Returns proposal ID.
    """
    proposal_id = str(uuid.uuid4())
    
    # Load current document
    current_document = load_constitutional_document(document_id)
    current_hash = current_document['sha256_hash']
    
    emit_event('governance', 'AMENDMENT_PROPOSAL_SUBMITTED', {
        'proposal_id': proposal_id,
        'proposer': proposer,
        'document_id': document_id,
        'amendment_type': amendment_type,
        'amendment_title': amendment_title,
        'amendment_description': amendment_description,
        'amendment_diff': amendment_diff,
        'amendment_justification': amendment_justification,
        'current_sha256_hash': current_hash,
        'submitted_at': datetime.utcnow().isoformat(),
        'status': 'pending_review'
    })
    
    # Store proposal in governance_proposals table
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO governance_proposals (
            proposal_id, proposal_type, proposer, proposal_data,
            submitted_at, status
        ) VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            proposal_id,
            'constitutional_amendment',
            proposer,
            Json({
                'document_id': document_id,
                'amendment_type': amendment_type,
                'amendment_title': amendment_title,
                'amendment_description': amendment_description,
                'amendment_diff': amendment_diff,
                'amendment_justification': amendment_justification,
                'current_sha256_hash': current_hash
            }),
            datetime.utcnow(),
            'pending_review'
        )
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Amendment proposal submitted: {proposal_id}")
    return proposal_id
```

## Stage 2: Review

### Review Amendment Proposal

```python
def review_amendment_proposal(
    proposal_id: str,
    reviewer: str,
    review_result: str,
    review_notes: str
) -> bool:
    """
    Review amendment proposal.
    
    Only governance agents may review.
    """
    # Verify reviewer is governance agent
    if not is_governance_agent(reviewer):
        raise Exception("Only governance agents may review amendment proposals")
    
    # Load proposal
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM governance_proposals WHERE proposal_id = %s",
        (proposal_id,)
    )
    proposal = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not proposal:
        raise Exception("Proposal not found")
    
    # Emit review event
    emit_event('governance', 'AMENDMENT_PROPOSAL_REVIEWED', {
        'proposal_id': proposal_id,
        'reviewer': reviewer,
        'review_result': review_result,
        'review_notes': review_notes,
        'reviewed_at': datetime.utcnow().isoformat()
    })
    
    # Update proposal status
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE governance_proposals
        SET status = %s, reviewed_at = %s, reviewer = %s, review_notes = %s
        WHERE proposal_id = %s
        """,
        (review_result, datetime.utcnow(), reviewer, review_notes, proposal_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Amendment proposal reviewed: {proposal_id} ({review_result})")
    return True
```

## Stage 3: Witness Generation

### Generate Amendment Witness

```python
def generate_amendment_witness(proposal_id: str) -> dict:
    """
    Generate witness for amendment proposal.
    
    Constitutional: All amendments must generate witness.
    """
    # Load proposal
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM governance_proposals WHERE proposal_id = %s",
        (proposal_id,)
    )
    proposal = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not proposal:
        raise Exception("Proposal not found")
    
    proposal_data = proposal[3]
    
    # Compute witness
    witness_data = {
        'proposal_id': proposal_id,
        'document_id': proposal_data['document_id'],
        'amendment_type': proposal_data['amendment_type'],
        'current_sha256_hash': proposal_data['current_sha256_hash'],
        'amendment_diff': proposal_data['amendment_diff']
    }
    
    canonical = json.dumps(witness_data, sort_keys=True, separators=(',', ':'))
    witness_hash = hashlib.sha256(canonical.encode()).hexdigest()
    
    witness = {
        'witness_hash': witness_hash,
        'witness_type': 'amendment_proposal',
        'generated_at': datetime.utcnow().isoformat(),
        'proposal_id': proposal_id
    }
    
    # Emit witness event
    emit_event('witness', 'AMENDMENT_WITNESS_GENERATED', {
        'witness_hash': witness_hash,
        'proposal_id': proposal_id,
        'document_id': proposal_data['document_id'],
        'generated_at': datetime.utcnow().isoformat()
    })
    
    logger.info(f"Amendment witness generated: {witness_hash}")
    return witness
```

## Stage 4: Approval

### Approve Amendment Proposal

```python
def approve_amendment_proposal(
    proposal_id: str,
    approver: str,
    approval_notes: str,
    approval_signature: str
) -> str:
    """
    Approve amendment proposal.
    
    Only governance agents may approve.
    Requires governance quorum.
    """
    # Verify approver is governance agent
    if not is_governance_agent(approver):
        raise Exception("Only governance agents may approve amendment proposals")
    
    # Verify proposal is reviewed and approved
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM governance_proposals WHERE proposal_id = %s",
        (proposal_id,)
    )
    proposal = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not proposal:
        raise Exception("Proposal not found")
    
    if proposal[5] != 'approved':
        raise Exception("Proposal must be reviewed and approved before amendment approval")
    
    # Check governance quorum
    if not check_governance_quorum(proposal_id):
        raise Exception("Governance quorum not met")
    
    approval_id = str(uuid.uuid4())
    
    # Emit approval event
    emit_event('governance', 'AMENDMENT_PROPOSAL_APPROVED', {
        'approval_id': approval_id,
        'proposal_id': proposal_id,
        'approver': approver,
        'approval_notes': approval_notes,
        'approval_signature': approval_signature,
        'approved_at': datetime.utcnow().isoformat(),
        'status': 'approved'
    })
    
    # Store approval in governance_approvals table
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO governance_approvals (
            approval_id, proposal_id, approver, approval_notes,
            approval_signature, approved_at, approval_type
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            approval_id,
            proposal_id,
            approver,
            approval_notes,
            approval_signature,
            datetime.utcnow(),
            'constitutional_amendment'
        )
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Amendment proposal approved: {proposal_id}")
    return approval_id
```

## Stage 5: Amendment Event

### Execute Amendment

```python
def execute_amendment(approval_id: str) -> str:
    """
    Execute amendment via event emission.
    
    Constitutional: All amendments must occur through event stream.
    """
    # Verify approval exists
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM governance_approvals WHERE approval_id = %s",
        (approval_id,)
    )
    approval = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not approval:
        raise Exception("Approval not found")
    
    # Load proposal
    proposal_id = approval[1]
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM governance_proposals WHERE proposal_id = %s",
        (proposal_id,)
    )
    proposal = cursor.fetchone()
    cursor.close()
    conn.close()
    
    proposal_data = proposal[3]
    document_id = proposal_data['document_id']
    
    # Get next amendment number (SERIAL)
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COALESCE(MAX(amendment_number), 0) + 1 FROM constitutional_amendment_history WHERE document_id = %s",
        (document_id,)
    )
    amendment_number = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    # Compute new document hash
    new_document_hash = compute_amended_document_hash(document_id, proposal_data['amendment_diff'])
    
    # Get current document hash
    current_document = load_constitutional_document(document_id)
    current_hash = current_document['sha256_hash']
    
    # Emit amendment event
    amendment_event_id = mutate_via_event(
        stream='constitutional',
        event_type='CONSTITUTIONAL_AMENDED',
        payload={
            'document_id': document_id,
            'amendment_number': amendment_number,
            'amendment_type': proposal_data['amendment_type'],
            'amendment_title': proposal_data['amendment_title'],
            'amendment_description': proposal_data['amendment_description'],
            'amendment_diff': proposal_data['amendment_diff'],
            'amendment_justification': proposal_data['amendment_justification'],
            'previous_sha256_hash': current_hash,
            'new_sha256_hash': new_document_hash,
            'amendment_author': approval[2],
            'amended_at': datetime.utcnow().isoformat(),
            'approval_id': approval_id
        }
    )
    
    logger.info(f"Amendment executed: {amendment_event_id}")
    return amendment_event_id
```

## Stage 6: Replay

### Replay After Amendment

```python
def replay_after_amendment(amendment_event_id: str) -> dict:
    """
    Replay event stream after amendment.
    
    Constitutional: All amendments must pass replay verification.
    """
    try:
        # Get event_order_index of amendment event
        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT event_order_index FROM events WHERE id = %s",
            (amendment_event_id,)
        )
        event_order_index = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        # Replay events from beginning to amendment event
        replay_state = replay_events_with_order(0, event_order_index)
        
        # Verify replay state
        verify_replay_state(replay_state)
        
        logger.info(f"Replay successful after amendment: {amendment_event_id}")
        return replay_state
        
    except Exception as e:
        logger.error(f"Replay failed after amendment: {e}")
        raise
```

## Stage 7: Verification

### Verify Amendment

```python
def verify_amendment(amendment_event_id: str) -> bool:
    """
    Verify amendment integrity.
    
    Constitutional: All amendments must pass verification.
    """
    try:
        # Load amendment event
        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT payload FROM events WHERE id = %s",
            (amendment_event_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not row:
            raise Exception("Amendment event not found")
        
        payload = row[0] if isinstance(row[0], dict) else json.loads(row[0]) if isinstance(row[0], str) else {}
        
        document_id = payload['document_id']
        new_sha256_hash = payload['new_sha256_hash']
        
        # Verify new document hash matches actual document
        actual_hash = compute_document_hash(document_id)
        if actual_hash != new_sha256_hash:
            raise Exception("Document hash mismatch after amendment")
        
        # Emit verification event
        emit_event('verification', 'AMENDMENT_VERIFIED', {
            'amendment_event_id': amendment_event_id,
            'document_id': document_id,
            'verified_hash': new_sha256_hash,
            'verified_at': datetime.utcnow().isoformat(),
            'verification_result': 'passed'
        })
        
        logger.info(f"Amendment verified: {amendment_event_id}")
        return True
        
    except Exception as e:
        logger.error(f"Amendment verification failed: {e}")
        emit_event('verification', 'AMENDMENT_VERIFICATION_FAILED', {
            'amendment_event_id': amendment_event_id,
            'error': str(e),
            'verified_at': datetime.utcnow().isoformat(),
            'verification_result': 'failed'
        })
        return False
```

## Stage 8: Witness Root Update

### Update Witness Root After Amendment

```python
def update_witness_root_after_amendment(amendment_event_id: str) -> str:
    """
    Update witness root after amendment.
    
    Constitutional: Witness root must be updated after amendment.
    """
    try:
        # Replay events to get current state
        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT event_order_index FROM events WHERE id = %s",
            (amendment_event_id,)
        )
        event_order_index = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        # Compute new witness root
        new_witness_root = compute_witness_root_from_events(event_order_index)
        
        # Update witness root in registry
        conn = get_postgres_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE constitutional_freeze_registry
            SET witness_root_hash = %s
            WHERE document_id IN (
                SELECT document_id FROM events WHERE id = %s
            )
            """,
            (new_witness_root, amendment_event_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        # Emit witness root update event
        emit_event('witness', 'WITNESS_ROOT_UPDATED', {
            'amendment_event_id': amendment_event_id,
            'new_witness_root': new_witness_root,
            'updated_at': datetime.utcnow().isoformat()
        })
        
        logger.info(f"Witness root updated after amendment: {new_witness_root}")
        return new_witness_root
        
    except Exception as e:
        logger.error(f"Witness root update failed: {e}")
        raise
```

---

# Database Schema Updates

## Amendment Number as SERIAL

```sql
-- Change amendment_number from INTEGER to SERIAL
ALTER TABLE constitutional_amendment_history ALTER COLUMN amendment_number DROP DEFAULT;
ALTER TABLE constitutional_amendment_history ALTER COLUMN amendment_number TYPE BIGINT;
CREATE SEQUENCE IF NOT EXISTS constitutional_amendment_history_amendment_number_seq;
ALTER TABLE constitutional_amendment_history ALTER COLUMN amendment_number SET DEFAULT nextval('constitutional_amendment_history_amendment_number_seq');
ALTER SEQUENCE constitutional_amendment_history_amendment_number_seq OWNED BY constitutional_amendment_history.amendment_number;
```

---

# Security Event Emission

## DIRECT_FILE_EDIT_ATTEMPT Event

```json
{
  "stream": "security",
  "event_type": "DIRECT_FILE_EDIT_ATTEMPT",
  "payload": {
    "file_path": "vault/constitutional/immutable/TRUTH_LAW.md",
    "attempted_by": "unknown",
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

## AMENDMENT_WITHOUT_APPROVAL Event

```json
{
  "stream": "security",
  "event_type": "AMENDMENT_WITHOUT_APPROVAL",
  "payload": {
    "document_id": "TRUTH_LAW",
    "attempted_by": "unknown",
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement submit_amendment_proposal()** function
2. **Implement review_amendment_proposal()** function
3. **Implement generate_amendment_witness()** function
4. **Implement approve_amendment_proposal()** function
5. **Implement execute_amendment()** function
6. **Implement replay_after_amendment()** function
7. **Implement verify_amendment()** function
8. **Implement update_witness_root_after_amendment()** function
9. **Change amendment_number to SERIAL**
10. **Prohibit direct file edits** in runtime code
11. **Emit security events** for unauthorized amendment attempts

## Optional Changes

1. **Implement amendment UI** for governance agents
2. **Implement amendment notification system** for governance agents
3. **Implement amendment history tracking** for audit

---

# Testing Strategy

## Unit Tests

1. **submit_amendment_proposal() Test:** Test amendment proposal submission
2. **review_amendment_proposal() Test:** Test amendment proposal review
3. **approve_amendment_proposal() Test:** Test amendment proposal approval
4. **execute_amendment() Test:** Test amendment execution via event
5. **replay_after_amendment() Test:** Test replay after amendment
6. **verify_amendment() Test:** Test amendment verification
7. **update_witness_root_after_amendment() Test:** Test witness root update

## Integration Tests

1. **End-to-End Amendment Pipeline Test:** Test full amendment pipeline
2. **Direct File Edit Blocking Test:** Test direct file edits are blocked
3. **Amendment Without Approval Blocking Test:** Test amendments without approval are blocked

## Regression Tests

1. **No Direct File Edits Test:** Verify direct file edits are blocked
2. **Amendment Number Automatic Test:** Verify amendment number is automatic (SERIAL)
3. **Witness Generation Required Test:** Verify witness generation is required

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Event-driven amendments | Direct file edits | Event-driven amendments | execute_amendment() |
| No direct file edits | Direct file edits allowed | Direct file edits prohibited | File edit enforcement |
| Automatic amendment number | Manual amendment number | SERIAL amendment number | Change to SERIAL |
| Witness generation | No witness generation | Witness generation required | generate_amendment_witness() |
| Replay verification | No replay verification | Replay verification required | replay_after_amendment() |
| Witness root update | No witness root update | Witness root update required | update_witness_root_after_amendment() |
| Security events | No security events | Security events emitted | Emit DIRECT_FILE_EDIT_ATTEMPT |

---

# Migration Path

## Phase 1: Database Schema

1. Change amendment_number to SERIAL
2. Deploy schema to staging
3. Test schema

## Phase 2: Amendment Pipeline Functions

1. Implement submit_amendment_proposal()
2. Implement review_amendment_proposal()
3. Implement approve_amendment_proposal()
4. Implement execute_amendment()
5. Deploy to staging
6. Test functions

## Phase 3: Witness and Replay

1. Implement generate_amendment_witness()
2. Implement replay_after_amendment()
3. Implement verify_amendment()
4. Implement update_witness_root_after_amendment()
5. Deploy to staging
6. Test witness and replay

## Phase 4: File Edit Enforcement

1. Implement file edit enforcement
2. Update runtime code to prevent direct file edits
3. Deploy to staging
4. Test file edit enforcement

## Phase 5: Security Events

1. Implement security event emission
2. Update enforcement to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 6: Production Deployment

1. Deploy schema to production
2. Deploy amendment pipeline to production
3. Deploy witness and replay to production
4. Deploy file edit enforcement to production
5. Monitor amendment attempts
6. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 8 - Witness Replay Verification
