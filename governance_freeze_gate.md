# Governance Freeze Gate

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** Governance Approval Layer for Constitutional Freeze
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design implements a governance approval layer for the constitutional freeze workflow. The freeze cannot occur without governance approval. The workflow enforces: Proposal → Governance Review → Approval Event → Witness Generation → Freeze Event.

**Blocking Issue Addressed:** Governance Approval Enforcement
**Constitutional Violations Resolved:** AUTHORITY_TAXONOMY_SPEC.md (governance bypass), MUTATION_LAW.md (shadow_governance)

---

# Current Vulnerability

## Existing Freeze Procedure (FREEZE_EXECUTION_PLAN.md)

**Current workflow allows freeze without governance approval:**
- Stage 1: Verification
- Stage 2: Witness Generation
- Stage 3: Registry Population
- Stage 4: Activation
- Stage 5: Enforcement
- Stage 6: Replay Verification
- Stage 7: Final Verification

**Vulnerability:**
- No governance approval required before freeze
- No governance review of freeze proposal
- No governance approval event
- Freeze can proceed without governance oversight
- Violates AUTHORITY_TAXONOMY_SPEC.md (governance bypass)
- Violates MUTATION_LAW.md (shadow_governance)

---

# Design Objectives

## Primary Objectives

1. **Governance Approval Required:** Freeze cannot proceed without governance approval
2. **Proposal Workflow:** Freeze must be proposed and reviewed by governance
3. **Approval Event:** Governance approval must be recorded as event
4. **Quorum Enforcement:** Approval requires governance quorum

## Secondary Objectives

1. **Approval Signatures:** Governance approval must be signed
2. **Approval Tracking:** All approval attempts must be tracked
3. **Security Events:** Unauthorized freeze attempts must emit security events

---

# Governance Approval Workflow

## Freeze Proposal Stage

### Step 1: Submit Freeze Proposal

```python
def submit_freeze_proposal(
    proposer: str,
    freeze_scope: List[str],
    freeze_reason: str,
    freeze_version: str
) -> str:
    """
    Submit freeze proposal for governance review.
    
    Returns proposal ID.
    """
    proposal_id = str(uuid.uuid4())
    
    emit_event('governance', 'FREEZE_PROPOSAL_SUBMITTED', {
        'proposal_id': proposal_id,
        'proposer': proposer,
        'freeze_scope': freeze_scope,
        'freeze_reason': freeze_reason,
        'freeze_version': freeze_version,
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
            'constitutional_freeze',
            proposer,
            Json({
                'freeze_scope': freeze_scope,
                'freeze_reason': freeze_reason,
                'freeze_version': freeze_version
            }),
            datetime.utcnow(),
            'pending_review'
        )
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Freeze proposal submitted: {proposal_id}")
    return proposal_id
```

## Governance Review Stage

### Step 2: Governance Review

```python
def review_freeze_proposal(
    proposal_id: str,
    reviewer: str,
    review_result: str,
    review_notes: str
) -> bool:
    """
    Review freeze proposal.
    
    Only governance agents may review.
    """
    # Verify reviewer is governance agent
    if not is_governance_agent(reviewer):
        raise Exception("Only governance agents may review freeze proposals")
    
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
    emit_event('governance', 'FREEZE_PROPOSAL_REVIEWED', {
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
    
    logger.info(f"Freeze proposal reviewed: {proposal_id} ({review_result})")
    return True
```

## Governance Approval Stage

### Step 3: Governance Approval

```python
def approve_freeze_proposal(
    proposal_id: str,
    approver: str,
    approval_notes: str,
    approval_signature: str
) -> str:
    """
    Approve freeze proposal.
    
    Only governance agents may approve.
    Requires governance quorum.
    """
    # Verify approver is governance agent
    if not is_governance_agent(approver):
        raise Exception("Only governance agents may approve freeze proposals")
    
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
        raise Exception("Proposal must be reviewed and approved before freeze approval")
    
    # Check governance quorum
    if not check_governance_quorum(proposal_id):
        raise Exception("Governance quorum not met")
    
    approval_id = str(uuid.uuid4())
    
    # Emit approval event
    emit_event('governance', 'FREEZE_PROPOSAL_APPROVED', {
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
            'constitutional_freeze'
        )
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    logger.info(f"Freeze proposal approved: {proposal_id}")
    return approval_id
```

## Witness Generation Stage

### Step 4: Witness Generation (After Approval)

```python
def generate_freeze_witness(approval_id: str) -> dict:
    """
    Generate witness for freeze.
    
    Constitutional: Witness generation requires governance approval.
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
    
    # Compute witness
    witness_data = {
        'approval_id': approval_id,
        'proposal_id': proposal_id,
        'approver': approval[2],
        'approval_signature': approval[4],
        'approved_at': approval[5].isoformat(),
        'proposal_data': proposal[3]
    }
    
    canonical = json.dumps(witness_data, sort_keys=True, separators=(',', ':'))
    witness_hash = hashlib.sha256(canonical.encode()).hexdigest()
    
    witness = {
        'witness_hash': witness_hash,
        'witness_type': 'freeze_approval',
        'generated_at': datetime.utcnow().isoformat(),
        'approval_id': approval_id
    }
    
    # Emit witness event
    emit_event('witness', 'FREEZE_WITNESS_GENERATED', {
        'witness_hash': witness_hash,
        'approval_id': approval_id,
        'proposal_id': proposal_id,
        'generated_at': datetime.utcnow().isoformat()
    })
    
    logger.info(f"Freeze witness generated: {witness_hash}")
    return witness
```

## Freeze Event Stage

### Step 5: Freeze Event (After Witness Generation)

```python
def execute_freeze(approval_id: str, witness_hash: str) -> str:
    """
    Execute freeze.
    
    Constitutional: Freeze requires governance approval and witness generation.
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
    
    # Emit freeze event
    freeze_event_id = mutate_via_event(
        stream='constitutional',
        event_type='FREEZE_EXECUTED',
        payload={
            'approval_id': approval_id,
            'witness_hash': witness_hash,
            'executed_at': datetime.utcnow().isoformat(),
            'status': 'executed'
        }
    )
    
    logger.info(f"Freeze executed: {freeze_event_id}")
    return freeze_event_id
```

---

# Governance Quorum Model

## Quorum Definition

```python
def check_governance_quorum(proposal_id: str) -> bool:
    """
    Check if governance quorum is met.
    
    Quorum: Majority of governance agents must approve.
    """
    # Get total governance agents
    governance_agents = get_governance_agents()
    total_agents = len(governance_agents)
    
    # Get approvals for proposal
    conn = get_postgres_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM governance_approvals WHERE proposal_id = %s",
        (proposal_id,)
    )
    approval_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    # Quorum: majority (more than 50%)
    quorum_threshold = total_agents // 2 + 1
    
    return approval_count >= quorum_threshold
```

## Approval Signatures

```python
def sign_approval(approver: str, approval_data: dict) -> str:
    """
    Sign approval with governance agent key.
    
    Constitutional: Approvals must be signed for verification.
    """
    # Get governance agent key
    agent_key = get_governance_agent_key(approver)
    
    # Sign approval data
    canonical = json.dumps(approval_data, sort_keys=True, separators=(',', ':'))
    signature = sign_with_key(canonical, agent_key)
    
    return signature
```

---

# Database Schema

## governance_proposals Table

```sql
CREATE TABLE IF NOT EXISTS governance_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id VARCHAR(255) UNIQUE NOT NULL,
    proposal_type VARCHAR(50) NOT NULL,
    proposer VARCHAR(255) NOT NULL,
    proposal_data JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer VARCHAR(255),
    review_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    
    CONSTRAINT chk_proposal_type CHECK (proposal_type IN (
        'constitutional_freeze',
        'constitutional_amendment',
        'governance_change'
    )),
    CONSTRAINT chk_proposal_status CHECK (status IN (
        'pending_review',
        'approved',
        'rejected',
        'withdrawn'
    ))
);

CREATE INDEX idx_governance_proposals_proposal_id ON governance_proposals(proposal_id);
CREATE INDEX idx_governance_proposals_status ON governance_proposals(status);
```

## governance_approvals Table

```sql
CREATE TABLE IF NOT EXISTS governance_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id VARCHAR(255) UNIQUE NOT NULL,
    proposal_id VARCHAR(255) NOT NULL,
    approver VARCHAR(255) NOT NULL,
    approval_notes TEXT,
    approval_signature TEXT NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approval_type VARCHAR(50) NOT NULL,
    
    CONSTRAINT chk_approval_type CHECK (approval_type IN (
        'constitutional_freeze',
        'constitutional_amendment',
        'governance_change'
    )),
    
    FOREIGN KEY (proposal_id) REFERENCES governance_proposals(proposal_id) ON DELETE CASCADE
);

CREATE INDEX idx_governance_approvals_approval_id ON governance_approvals(approval_id);
CREATE INDEX idx_governance_approvals_proposal_id ON governance_approvals(proposal_id);
CREATE INDEX idx_governance_approvals_approver ON governance_approvals(approver);
```

---

# Security Event Emission

## UNAUTHORIZED_FREEZE_ATTEMPT Event

```json
{
  "stream": "security",
  "event_type": "UNAUTHORIZED_FREEZE_ATTEMPT",
  "payload": {
    "attempted_operation": "freeze",
    "attempted_by": "non_governance_agent",
    "proposal_id": null,
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

## FREEZE_WITHOUT_APPROVAL Event

```json
{
  "stream": "security",
  "event_type": "FREEZE_WITHOUT_APPROVAL",
  "payload": {
    "freeze_scope": ["TRUTH_LAW", "EVENT_LAW", ...],
    "attempted_by": "constitutional_audit",
    "proposal_id": null,
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement submit_freeze_proposal()** function
2. **Implement review_freeze_proposal()** function
3. **Implement approve_freeze_proposal()** function
4. **Implement generate_freeze_witness()** function
5. **Implement execute_freeze()** function
6. **Implement check_governance_quorum()** function
7. **Implement sign_approval()** function
8. **Create governance_proposals table**
9. **Create governance_approvals table**
10. **Update freeze procedure** to require governance approval
11. **Emit security events** for unauthorized freeze attempts

## Optional Changes

1. **Implement governance approval UI** for governance agents
2. **Implement approval notification system** for governance agents
3. **Implement approval history tracking** for audit

---

# Testing Strategy

## Unit Tests

1. **submit_freeze_proposal() Test:** Test proposal submission
2. **review_freeze_proposal() Test:** Test proposal review
3. **approve_freeze_proposal() Test:** Test proposal approval
4. **check_governance_quorum() Test:** Test quorum verification
5. **sign_approval() Test:** Test approval signing

## Integration Tests

1. **End-to-End Freeze Approval Test:** Test full freeze approval workflow
2. **Quorum Enforcement Test:** Test quorum is enforced
3. **Unauthorized Freeze Blocking Test:** Test unauthorized freeze is blocked

## Regression Tests

1. **No Freeze Without Approval Test:** Verify freeze cannot proceed without approval
2. **Governance Only Approval Test:** Verify only governance agents can approve
3. **Quorum Required Test:** Verify quorum is required

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Governance approval required | No approval required | Approval required | approve_freeze_proposal() |
| Proposal workflow | No proposal | Proposal required | submit_freeze_proposal() |
| Approval event | No approval event | Approval event required | Emit FREEZE_PROPOSAL_APPROVED |
| Quorum enforcement | No quorum | Quorum required | check_governance_quorum() |
| Approval signatures | No signatures | Signatures required | sign_approval() |
| Security events | No security events | Security events emitted | Emit UNAUTHORIZED_FREEZE_ATTEMPT |

---

# Migration Path

## Phase 1: Database Schema

1. Create governance_proposals table
2. Create governance_approvals table
3. Deploy schema to staging
4. Test schema

## Phase 2: Governance Approval Functions

1. Implement submit_freeze_proposal()
2. Implement review_freeze_proposal()
3. Implement approve_freeze_proposal()
4. Implement check_governance_quorum()
5. Implement sign_approval()
6. Deploy to staging
7. Test functions

## Phase 3: Witness Generation

1. Implement generate_freeze_witness()
2. Implement execute_freeze()
3. Deploy to staging
4. Test witness generation

## Phase 4: Freeze Procedure Update

1. Update freeze procedure to require governance approval
2. Deploy to staging
3. Test freeze procedure

## Phase 5: Security Events

1. Implement security event emission
2. Update enforcement to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 6: Production Deployment

1. Deploy schema to production
2. Deploy governance approval functions to production
3. Deploy witness generation to production
4. Deploy updated freeze procedure to production
5. Monitor governance approvals
6. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 6 - Constitutional Time Integrity
