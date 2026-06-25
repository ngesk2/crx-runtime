# Verification Gate Design

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** claim_worker.py Verification Gate
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design eliminates the verification bypass vulnerability in claim_worker.py by implementing a mandatory verification gate that cannot be bypassed in production. The design introduces VerificationRequiredException, removes the `--force` flag, and enforces witness generation for all claims.

**Blocking Issue Addressed:** claim_worker.py Verification Bypass
**Constitutional Violations Resolved:** MUTATION_LAW.md, TRUTH_LAW.md, AGENT_CONSTITUTION.md

---

# Current Vulnerability

## Existing Implementation (claim_worker.py)

```python
if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--candidate_event_id', required=True, help='Event ID of CANDIDATE_CLAIM_CREATED to verify')
    p.add_argument('--force', action='store_true', help='Bypass verification gate (emergency only)')
    args = p.parse_args()

    if args.force:
        print("WARNING: Verification gate bypassed. Claim may not be constitutionally valid.")

    elif not verify_candidate(args.candidate_event_id):
        print(f"Verification gate FAILED for candidate {args.candidate_event_id}. Claim not emitted.")
        print("Requirements: artifact_hash match + event_chain integrity + lineage depth > 0")
        exit(1)
```

**Vulnerability:**
- `--force` flag allows bypass of verification gate
- No governance approval required for bypass
- Unverified claims can become constitutional truth
- Violates MUTATION_LAW.md (bypass_verification is prohibited)
- Violates TRUTH_LAW.md (unverified event treated as truth)
- Violates AGENT_CONSTITUTION.md (agents must never bypass verification gate)

---

# Design Objectives

## Primary Objectives

1. **Eliminate Verification Bypass:** Remove `--force` flag entirely from production code
2. **Mandatory Verification:** All claims must pass verification gate before emission
3. **Witness Generation:** All verified claims must generate witness
4. **Exception Handling:** Introduce VerificationRequiredException for failed verification

## Secondary Objectives

1. **Governance Approval:** Emergency bypass requires governance approval (if needed at all)
2. **Audit Trail:** All verification attempts must be logged
3. **Security Events:** Verification failures must emit security events

---

# Verification Gate Architecture

## VerificationRequiredException

```python
class VerificationRequiredException(Exception):
    """
    Raised when verification is required but fails or is bypassed.
    
    Constitutional: This exception enforces that verification cannot be bypassed.
    Any attempt to bypass verification must raise this exception.
    """
    def __init__(self, candidate_event_id: str, reason: str, verification_details: dict):
        self.candidate_event_id = candidate_event_id
        self.reason = reason
        self.verification_details = verification_details
        super().__init__(f"Verification required for candidate {candidate_event_id}: {reason}")
```

## Verification Gate Implementation

```python
def verify_candidate(candidate_event_id: str) -> dict:
    """
    Deterministic verification gate for candidate claims.
    Returns verification result with details.
    
    Raises VerificationRequiredException if verification fails.
    
    Checks: artifact hash match + event chain integrity + lineage depth > 0.
    """
    try:
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()

        # Load candidate event
        cur.execute("SELECT id, stream, event_type, payload, payload_hash FROM events WHERE id = %s", (candidate_event_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            raise VerificationRequiredException(
                candidate_event_id,
                "Candidate event not found",
                {"candidate_event_id": candidate_event_id}
            )

        event_id, stream, event_type, payload_raw, stored_hash = row
        payload = payload_raw if isinstance(payload_raw, dict) else json.loads(payload_raw) if isinstance(payload_raw, str) else {}

        # Verify payload hash
        canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        computed_hash = hashlib.sha256(canonical.encode()).hexdigest()
        if stored_hash and computed_hash != stored_hash:
            conn.close()
            raise VerificationRequiredException(
                candidate_event_id,
                "Payload hash mismatch",
                {
                    "candidate_event_id": candidate_event_id,
                    "stored_hash": stored_hash,
                    "computed_hash": computed_hash
                }
            )

        artifact_id = payload.get('artifact_id')
        if not artifact_id:
            conn.close()
            raise VerificationRequiredException(
                candidate_event_id,
                "Artifact ID not found in payload",
                {"candidate_event_id": candidate_event_id}
            )

        # Verify source artifact exists
        cur.execute("SELECT id FROM events WHERE stream = %s AND event_type = 'DOCUMENT_IMPORTED' AND payload->>'artifact_id' = %s LIMIT 1", (stream, artifact_id))
        if not cur.fetchone():
            conn.close()
            raise VerificationRequiredException(
                candidate_event_id,
                "Source artifact not found",
                {
                    "candidate_event_id": candidate_event_id,
                    "artifact_id": artifact_id
                }
            )

        # Verify lineage — at least one related event
        cur.execute("SELECT COUNT(*) FROM lineage WHERE root_object_id = %s OR current_version = %s", (artifact_id, artifact_id))
        lineage_count = cur.fetchone()[0] or 0

        conn.close()
        
        if lineage_count == 0:
            raise VerificationRequiredException(
                candidate_event_id,
                "Lineage depth is zero",
                {
                    "candidate_event_id": candidate_event_id,
                    "artifact_id": artifact_id,
                    "lineage_count": lineage_count
                }
            )

        # Verification successful
        return {
            "candidate_event_id": candidate_event_id,
            "artifact_id": artifact_id,
            "artifact_hash_verified": True,
            "event_chain_verified": True,
            "lineage_verified": True,
            "lineage_count": lineage_count,
            "verification_method": "mechanical"
        }

    except VerificationRequiredException:
        raise
    except Exception as e:
        raise VerificationRequiredException(
            candidate_event_id,
            f"Verification gate error: {e}",
            {"candidate_event_id": candidate_event_id, "error": str(e)}
        )
```

## Witness Generation

```python
def generate_witness(candidate_event_id: str, verification_result: dict) -> dict:
    """
    Generate witness for verified claim.
    
    Constitutional: All verified claims must generate witness.
    """
    try:
        # Load candidate event
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()
        cur.execute("SELECT payload FROM events WHERE id = %s", (candidate_event_id,))
        row = cur.fetchone()
        conn.close()
        
        if not row:
            raise Exception("Candidate event not found")
        
        payload = row[0] if isinstance(row[0], dict) else json.loads(row[0]) if isinstance(row[0], str) else {}
        
        # Compute witness hash
        canonical = json.dumps({
            "candidate_event_id": candidate_event_id,
            "verification_result": verification_result,
            "payload": payload
        }, sort_keys=True, separators=(',', ':'))
        witness_hash = hashlib.sha256(canonical.encode()).hexdigest()
        
        return {
            "witness_hash": witness_hash,
            "witness_type": "claim_verification",
            "generated_at": datetime.utcnow().isoformat(),
            "verification_result": verification_result
        }
        
    except Exception as e:
        raise Exception(f"Witness generation failed: {e}")
```

---

# Production Runtime Enforcement

## Modified claim_worker.py

```python
if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--candidate_event_id', required=True, help='Event ID of CANDIDATE_CLAIM_CREATED to verify')
    # REMOVED: --force flag
    args = p.parse_args()

    try:
        # Verify candidate (raises VerificationRequiredException if fails)
        verification_result = verify_candidate(args.candidate_event_id)
        
        # Generate witness
        witness = generate_witness(args.candidate_event_id, verification_result)
        
        # Load candidate and promote to CLAIM_CREATED
        conn = psycopg2.connect(**POSTGRES_DSN)
        cur = conn.cursor()
        cur.execute("SELECT payload FROM events WHERE id = %s AND event_type = 'CANDIDATE_CLAIM_CREATED'", (args.candidate_event_id,))
        row = cur.fetchone()
        conn.close()

        if not row:
            print(f"Candidate event {args.candidate_event_id} not found or wrong type")
            exit(1)

        candidate_payload = row[0] if isinstance(row[0], dict) else json.loads(row[0]) if isinstance(row[0], str) else {}
        claims = candidate_payload.get('candidate_claims', [])

        payload = {
            'artifact_id': candidate_payload.get('artifact_id'),
            'claims': claims,
            '_source_classification': 'CLAIM',
            '_generated_by': 'claim_worker',
            '_verified': True,
            '_verification_evidence': {
                'candidate_event_id': args.candidate_event_id,
                'artifact_hash_verified': True,
                'event_chain_verified': True,
                'lineage_verified': True,
                'lineage_count': verification_result['lineage_count'],
                'method': 'mechanical',
                'witness_hash': witness['witness_hash']
            }
        }
        emit_event('digestion', 'CLAIM_CREATED', payload)
        print(f'Emitted CLAIM_CREATED with {len(claims)} claims (verified)')
        
    except VerificationRequiredException as e:
        # Emit security event
        emit_event('security', 'VERIFICATION_FAILED', {
            'candidate_event_id': e.candidate_event_id,
            'reason': e.reason,
            'verification_details': e.verification_details,
            'failed_at': datetime.utcnow().isoformat()
        })
        print(f"Verification gate FAILED for candidate {args.candidate_event_id}: {e.reason}")
        print("Requirements: artifact_hash match + event_chain integrity + lineage depth > 0")
        exit(1)
        
    except Exception as e:
        # Emit security event
        emit_event('security', 'VERIFICATION_ERROR', {
            'candidate_event_id': args.candidate_event_id,
            'error': str(e),
            'failed_at': datetime.utcnow().isoformat()
        })
        print(f"Verification gate ERROR for candidate {args.candidate_event_id}: {e}")
        exit(1)
```

---

# Security Event Emission

## VERIFICATION_FAILED Event

```json
{
  "stream": "security",
  "event_type": "VERIFICATION_FAILED",
  "payload": {
    "candidate_event_id": "uuid",
    "reason": "Payload hash mismatch",
    "verification_details": {
      "candidate_event_id": "uuid",
      "stored_hash": "abc123...",
      "computed_hash": "def456..."
    },
    "failed_at": "2026-06-24T00:00:00Z"
  }
}
```

## VERIFICATION_ERROR Event

```json
{
  "stream": "security",
  "event_type": "VERIFICATION_ERROR",
  "payload": {
    "candidate_event_id": "uuid",
    "error": "Verification gate error: ...",
    "failed_at": "2026-06-24T00:00:00Z"
  }
}
```

---

# Governance Approval (Emergency Only)

## Emergency Bypass Workflow (If Required)

**NOTE:** Emergency bypass should be eliminated entirely. If absolutely required, implement the following governance approval workflow.

### Step 1: Emergency Proposal

```python
def propose_emergency_bypass(candidate_event_id: str, reason: str, proposer: str) -> str:
    """
    Propose emergency verification bypass.
    
    Requires governance approval before execution.
    """
    proposal_id = str(uuid.uuid4())
    
    emit_event('governance', 'EMERGENCY_BYPASS_PROPOSED', {
        'proposal_id': proposal_id,
        'candidate_event_id': candidate_event_id,
        'reason': reason,
        'proposer': proposer,
        'proposed_at': datetime.utcnow().isoformat(),
        'status': 'pending_approval'
    })
    
    return proposal_id
```

### Step 2: Governance Approval

```python
def approve_emergency_bypass(proposal_id: str, approver: str, approval_notes: str) -> bool:
    """
    Approve emergency verification bypass.
    
    Only governance agents may approve.
    """
    # Verify approver is governance agent
    if not is_governance_agent(approver):
        raise Exception("Only governance agents may approve emergency bypass")
    
    emit_event('governance', 'EMERGENCY_BYPASS_APPROVED', {
        'proposal_id': proposal_id,
        'approver': approver,
        'approval_notes': approval_notes,
        'approved_at': datetime.utcnow().isoformat(),
        'status': 'approved'
    })
    
    return True
```

### Step 3: Execute Emergency Bypass

```python
def execute_emergency_bypass(proposal_id: str, executor: str) -> bool:
    """
    Execute emergency verification bypass.
    
    Requires approved proposal.
    """
    # Verify proposal is approved
    if not is_proposal_approved(proposal_id):
        raise Exception("Proposal not approved")
    
    # Execute bypass with governance approval
    emit_event('security', 'EMERGENCY_BYPASS_EXECUTED', {
        'proposal_id': proposal_id,
        'executor': executor,
        'executed_at': datetime.utcnow().isoformat(),
        'status': 'executed'
    })
    
    return True
```

---

# Implementation Requirements

## Required Changes

1. **Remove `--force` flag** from claim_worker.py
2. **Implement VerificationRequiredException** in verification_gate.py
3. **Implement verify_candidate()** to raise VerificationRequiredException on failure
4. **Implement generate_witness()** for all verified claims
5. **Emit security events** for verification failures
6. **Update claim_worker.py** to use new verification gate

## Optional Changes (Emergency Bypass)

1. **Implement emergency bypass workflow** (if absolutely required)
2. **Implement governance approval** for emergency bypass
3. **Implement proposal tracking** for emergency bypass

---

# Testing Strategy

## Unit Tests

1. **VerificationRequiredException Test:** Test exception is raised on verification failure
2. **verify_candidate() Test:** Test verification passes with valid candidate
3. **verify_candidate() Test:** Test verification fails with invalid candidate
4. **generate_witness() Test:** Test witness generation for verified claim
5. **Security Event Test:** Test security event emission on verification failure

## Integration Tests

1. **End-to-End Verification Test:** Test full verification gate flow
2. **Emergency Bypass Test:** Test emergency bypass workflow (if implemented)
3. **Governance Approval Test:** Test governance approval for emergency bypass

## Regression Tests

1. **No Bypass Test:** Verify `--force` flag is removed
2. **Mandatory Verification Test:** Verify verification cannot be bypassed
3. **Witness Generation Test:** Verify witness is generated for all verified claims

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| No verification bypass | `--force` flag exists | No bypass flag | Remove `--force` flag |
| Mandatory verification | Bypass possible | Verification required | VerificationRequiredException |
| Witness generation | Optional witness | Mandatory witness | generate_witness() |
| Security events | No security events | Security events emitted | Emit VERIFICATION_FAILED |
| Governance approval | No approval | Approval required (if emergency) | Emergency bypass workflow |

---

# Migration Path

## Phase 1: Remove Bypass Flag

1. Remove `--force` flag from claim_worker.py
2. Implement VerificationRequiredException
3. Update verify_candidate() to raise exception on failure
4. Deploy to staging

## Phase 2: Witness Generation

1. Implement generate_witness()
2. Update claim_worker.py to generate witness
3. Deploy to staging
4. Test witness generation

## Phase 3: Security Events

1. Implement security event emission
2. Update claim_worker.py to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 4: Production Deployment

1. Deploy to production
2. Monitor verification failures
3. Monitor security events
4. Verify no bypass attempts

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 2 - Source-Type Spoofing
