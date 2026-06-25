# Verification Worker Specification

**Document Type:** Architecture Specification
**Status:** DRAFT (not yet implemented)
**Date:** 2026-06-24
**Runtime:** brain-constitution-runner or independent worker

---

## 1. Purpose

Eliminate the architectural violation where a worker verifies itself. Currently, `claim_worker` both produces and verifies `CLAIM_CREATED` events. This is unsafe.

A dedicated `verification_worker` handles all mechanical verification independently.

---

## 2. Current Violation

```text
candidate_claim_worker
    │
    ▼
claim_worker          ← verifies AND emits CLAIM_CREATED
    │
    ▼
event_store
```

**Problem:** claim_worker verifies its own output. This is a constitutional violation (authority must trace to single root; verification must be independent of production).

---

## 3. Correct Architecture

```text
candidate_claim_worker
    │
    ▼
verification_worker    ← independent verification
    │
    ▼
claim_worker           ← emits CLAIM_CREATED only after verification ACK
    │
    ▼
event_store
```

---

## 4. Worker Responsibilities

### 4.1 verification_worker

```yaml
verification_worker:
  identity:
    class: GOVERNANCE_AGENT
    authority: derived from CONSTITUTIONAL_LAW
    independence: fully independent from claim_worker and candidate_claim_worker

  responsibilities:
    artifact_hash_check:
      input: artifact_content, claimed_hash
      rule: SHA256(artifact_content) == claimed_hash
      failure: verification_rejected(reason="hash_mismatch")
    
    event_hash_check:
      input: event_payload, claimed_event_id
      rule: UUIDv5(event_payload) == claimed_event_id
      failure: verification_rejected(reason="event_id_mismatch")
    
    lineage_check:
      input: causation_id, event_store
      rule: causation_id exists in event_store as a verified event
      failure: verification_rejected(reason="lineage_break")
    
    witness_check:
      input: artifact_id, witness_store
      rule: witness_count > 0 for artifact_id
      failure: verification_rejected(reason="no_witness")
    
    authority_check:
      input: authority_class, authority_graph
      rule: authority_class is declared in authority_graph.json
      failure: verification_rejected(reason="undeclared_authority")
    
    truth_check:
      input: event_class, truth_registry
      rule: event_class may produce truth per truth_registry.json
      failure: verification_rejected(reason="non_truth_event_class")

  output:
    on_all_passed: verification_ack
      - event_id: string
      - verified_at: timestamptz
      - verification_id: uuid
      - checks_passed: string[]
    
    on_any_failed: verification_rejected
      - event_id: string
      - rejected_at: timestamptz
      - rejection_reason: string
      - failed_checks: string[]
```

### 4.2 claim_worker (Modified)

```yaml
claim_worker:
  identity:
    class: TASK_AGENT
    authority: derived from verification_worker ACK

  modified_behavior:
    - Accept CANDIDATE_CLAIM_CREATED from candidate_claim_worker
    - Submit to verification_worker
    - Wait for verification_ack before emitting CLAIM_CREATED
    - On verification_rejected: log failure, do NOT emit CLAIM_CREATED
    - May NOT verify itself
    - May NOT bypass verification_worker
```

### 4.3 candidate_claim_worker (Unchanged)

```yaml
candidate_claim_worker:
  identity:
    class: TASK_AGENT
    authority: none (produces unverified claims)

  behavior:
    - Produces CANDIDATE_CLAIM_CREATED events
    - Does NOT submit to verification directly
    - Has no verification authority
```

---

## 5. Worker Communication Protocol

### 5.1 Message Format

```yaml
verification_request:
  request_id: uuid
  event_id: uuid
  event_type: CANDIDATE_CLAIM_CREATED
  payload: jsonb                 # Full event data
  causation_id: uuid
  correlation_id: uuid
  submitted_by: string           # claim_worker identity
  submitted_at: timestamptz

verification_ack:
  request_id: uuid
  event_id: uuid
  verified_by: string            # verification_worker identity
  verified_at: timestamptz
  verification_id: uuid          # Unique verification record
  checks_passed:
    - artifact_hash_check
    - event_hash_check
    - lineage_check
    - witness_check
    - authority_check
    - truth_check

verification_rejected:
  request_id: uuid
  event_id: uuid
  rejected_by: string            # verification_worker identity
  rejected_at: timestamptz
  rejection_reason: string
  failed_checks: string[]
```

### 5.2 Communication Channels

```yaml
channels:
  primary: event_store (verification_worker reads CANDIDATE_CLAIM_CREATED events)
  fallback: message_queue (for low-latency requirements)
  
  flow:
    1. candidate_claim_worker writes CANDIDATE_CLAIM_CREATED to event_store
    2. verification_worker polls/subscribes to CANDIDATE_CLAIM_CREATED events
    3. verification_worker runs all 6 checks
    4. verification_worker writes VERIFICATION_COMPLETED event (ack or reject)
    5. claim_worker polls/subscribes to VERIFICATION_COMPLETED events
    6. On ack: claim_worker emits CLAIM_CREATED
    7. On reject: claim_worker logs, does not emit
```

---

## 6. Check Specifications

### 6.1 Artifact Hash Check

```yaml
check:
  id: artifact_hash_check
  input:
    - artifact_content: string      # Original content being claimed
    - claimed_hash: string          # Hash in the event payload
  
  rule: SHA256(artifact_content) == claimed_hash
  
  failure_reason: hash_mismatch
  severity: CRITICAL
  
  purpose: Ensure the artifact content matches its claimed hash
```

### 6.2 Event Hash Check

```yaml
check:
  id: event_hash_check
  input:
    - event_payload: jsonb          # Full event payload
    - claimed_event_id: uuid        # Event ID in the event
  
  rule: UUIDv5(event_payload) == claimed_event_id
  
  failure_reason: event_id_mismatch
  severity: CRITICAL
  
  purpose: Ensure the event ID is deterministic from its content
```

### 6.3 Lineage Check

```yaml
check:
  id: lineage_check
  input:
    - causation_id: uuid            # What caused this event
    - event_store: EventStore       # To look up causation
  
  rule: causation_id exists in event_store as a verified event
  
  failure_reason: lineage_break
  severity: HIGH
  
  purpose: Ensure every claim traces to a verified ancestor
```

### 6.4 Witness Check

```yaml
check:
  id: witness_check
  input:
    - artifact_id: uuid             # Artifact being claimed
    - witness_store: WitnessStore   # To count witnesses
  
  rule: witness_count(artifact_id) > 0
  
  failure_reason: no_witness
  severity: MEDIUM
  
  purpose: Ensure the artifact has at least one witness
```

### 6.5 Authority Check

```yaml
check:
  id: authority_check
  input:
    - authority_class: string       # Declared authority class
    - authority_graph: json         # From constitutional compiler
  
  rule: authority_class is declared in authority_graph.json
  
  failure_reason: undeclared_authority
  severity: HIGH
  
  purpose: Ensure the event's claimed authority is constitutionally valid
```

### 6.6 Truth Check

```yaml
check:
  id: truth_check
  input:
    - event_class: string           # Event classification
    - truth_registry: json          # From constitutional compiler
  
  rule: event_class may produce truth per truth_registry.json
  
  failure_reason: non_truth_event_class
  severity: CRITICAL
  
  purpose: Prevent non-truth event classes from producing constitutional truth
```

---

## 7. Verification Event Types

```yaml
event_registrations:
  VERIFICATION_REQUESTED:
    event_class: governance_event
    description: Verification worker received a verification request
    
  VERIFICATION_ACK:
    event_class: governance_event
    description: All 6 checks passed, event is verified
    
  VERIFICATION_REJECTED:
    event_class: governance_event
    description: One or more checks failed
    
  VERIFICATION_ERROR:
    event_class: system_event
    description: Verification worker encountered an error (not a rejection)
```

---

## 8. Safety Guarantees

```yaml
safety:
  independence:
    - verification_worker runs in its own process/container
    - verification_worker has no shared state with claim_worker
    - verification_worker has read-only access to event_store
    
  determinism:
    - All 6 checks are deterministic
    - Same input → same verification result
    - No external dependencies during verification
    
  audit:
    - Every verification request and result is recorded in event_store
    - Verification history is immutable
    - Verification can be replayed and re-verified
    
  failure_mode:
    - If verification_worker is unavailable: claim_worker MUST NOT emit CLAIM_CREATED
    - If verification_worker returns error: claim_worker MUST retry, not bypass
    - No emergency bypass for verification
```

---

## 9. Implementation Order

1. **Communication protocol** — Define verification_request/ack/reject event types
2. **Check implementations** — Implement each check as a pure function
3. **Worker process** — verification_worker main loop (poll/subscribe + check + emit)
4. **claim_worker modification** — Remove self-verification, delegate to verification_worker
5. **Integration test** — End-to-end: candidate → verify → claim cycle
6. **Error handling** — Timeout, retry, escalation paths

---

**Document ID:** VERIFICATION-WORKER-SPEC-1.0
**Status:** DRAFT
**Next Step:** Implement communication protocol (event types + message format)
