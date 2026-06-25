# STATE TRANSITION LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** State transition semantics only. No implementation details.
**Root Law:** TRUTH_LAW.md (truth = immutable verified event), EVENT_LAW.md (event ontology)
**Date:** 2026-06-24

---

# CONSTITUTIONAL STATE MACHINE

## Axiom 1 — State Transitions are Constitutional

**AXIOM:** All state transitions must be formally defined. Illegal transitions are constitutional violations.

**RATIONALE:** Without formal state transition definitions, event ordering can drift, replay determinism can fail, and state integrity cannot be guaranteed.

**VIOLATION CONSEQUENCE:** Illegal transition is a constitutional incident. Event ordering drift. Replay divergence.

---

# STATE DEFINITIONS

## Claim State Machine

### candidate_claim

**Definition:** Initial state for unverified claim

**Allowed Transitions:**
- verification_pending

**Prohibited Transitions:**
- Direct to claim_created (bypasses verification)
- Direct to archived (bypasses verification)

**Entry Condition:**
- CANDIDATE_CLAIM_CREATED event emitted
- Claim submitted to verification queue

**Exit Condition:**
- Transition to verification_pending

---

### verification_pending

**Definition:** Claim awaiting verification

**Allowed Transitions:**
- verification_approved
- verification_rejected

**Prohibited Transitions:**
- Direct to claim_created (bypasses verification)
- Direct to archived (bypasses verification)
- Back to candidate_claim (state regression)

**Entry Condition:**
- Claim dequeued from verification queue
- Verification worker begins checks

**Exit Condition:**
- All verification checks complete (pass or fail)

---

### verification_approved

**Definition:** Claim passed all verification checks

**Allowed Transitions:**
- claim_created

**Prohibited Transitions:**
- Back to verification_pending (state regression)
- Direct to archived (bypasses claim creation)

**Entry Condition:**
- All 6 verification checks pass
- VERIFICATION_ACK event emitted

**Exit Condition:**
- Transition to claim_created

---

### verification_rejected

**Definition:** Claim failed one or more verification checks

**Allowed Transitions:**
- archived

**Prohibited Transitions:**
- Back to verification_pending (retry without fix)
- Back to candidate_claim (state regression)
- Direct to claim_created (bypasses verification)

**Entry Condition:**
- One or more verification checks fail
- VERIFICATION_REJECTED event emitted

**Exit Condition:**
- Transition to archived

---

### claim_created

**Definition:** Verified claim recorded as constitutional truth

**Allowed Transitions:**
- archived

**Prohibited Transitions:**
- Back to verification_pending (state regression)
- Back to candidate_claim (state regression)
- Back to verification_approved (state regression)

**Entry Condition:**
- CLAIM_CREATED event emitted
- Claim recorded in event store

**Exit Condition:**
- Transition to archived

---

### archived

**Definition:** Claim archived (terminal state)

**Allowed Transitions:**
- None (terminal state)

**Prohibited Transitions:**
- Any transition from archived (terminal state)

**Entry Condition:**
- Claim archived after rejection or after claim creation
- ARCHIVED event emitted

**Exit Condition:**
- None (terminal state)

---

## Verification State Machine

### verification_idle

**Definition:** Verification worker idle

**Allowed Transitions:**
- verification_in_progress

**Prohibited Transitions:**
- Direct to verification_complete (bypasses verification)

**Entry Condition:**
- Verification worker ready
- No pending verification requests

**Exit Condition:**
- Verification request received

---

### verification_in_progress

**Definition:** Verification worker executing checks

**Allowed Transitions:**
- verification_complete

**Prohibited Transitions:**
- Back to verification_idle (abandon verification)
- Direct to verification_error (must complete first)

**Entry Condition:**
- Verification request dequeued
- Verification checks begin

**Exit Condition:**
- All verification checks complete

---

### verification_complete

**Definition:** Verification worker completed checks

**Allowed Transitions:**
- verification_idle

**Prohibited Transitions:**
- Back to verification_in_progress (state regression)

**Entry Condition:**
- All verification checks complete
- Verification result recorded

**Exit Condition:**
- Transition to verification_idle

---

## Event State Machine

### event_created

**Definition:** Event created and stored

**Allowed Transitions:**
- event_verified
- event_rejected

**Prohibited Transitions:**
- Direct to event_projected (bypasses verification)

**Entry Condition:**
- Event emitted
- Event stored in event store

**Exit Condition:**
- Verification begins

---

### event_verified

**Definition:** Event verified and accepted

**Allowed Transitions:**
- event_projected

**Prohibited Transitions:**
- Back to event_created (state regression)

**Entry Condition:**
- Event passes verification
- VERIFICATION_COMPLETED event emitted

**Exit Condition:**
- Transition to event_projected

---

### event_rejected

**Definition:** Event rejected by verification

**Allowed Transitions:**
- event_archived

**Prohibited Transitions:**
- Back to event_created (retry without fix)

**Entry Condition:**
- Event fails verification
- VERIFICATION_REJECTED event emitted

**Exit Condition:**
- Transition to event_archived

---

### event_projected

**Definition:** Event projected to memory stores

**Allowed Transitions:**
- event_archived

**Prohibited Transitions:**
- Back to event_verified (state regression)

**Entry Condition:**
- Event projected to Qdrant or other stores
- PROJECTION_COMPLETED event emitted

**Exit Condition:**
- Transition to event_archived

---

### event_archived

**Definition:** Event archived (terminal state)

**Allowed Transitions:**
- None (terminal state)

**Prohibited Transitions:**
- Any transition from archived (terminal state)

**Entry Condition:**
- Event archived
- ARCHIVED event emitted

**Exit Condition:**
- None (terminal state)

---

# STATE TRANSITION RULES

## Rule 1 — Transition Validity

**Rule:** Every state transition must be declared in this law.

**Validation:**
- Check if transition is in allowed_transitions list
- Check if transition is not in prohibited_transitions list

**Failure:**
- Illegal transition
- Constitutional incident
- Event ordering drift

---

## Rule 2 — State Regression Prohibition

**Rule:** State regression is prohibited.

**Definition:** Transition from higher state to lower state in same state machine.

**Examples:**
- verification_approved → verification_pending (regression)
- claim_created → verification_pending (regression)
- event_verified → event_created (regression)

**Failure:**
- State regression
- Constitutional incident
- Replay divergence

---

## Rule 3 — Terminal State Immutability

**Rule:** Terminal states may not transition.

**Definition:** Terminal states have no allowed transitions.

**Examples:**
- archived (terminal)
- event_archived (terminal)

**Failure:**
- Terminal state transition
- Constitutional incident
- State corruption

---

## Rule 4 — Bypass Prohibition

**Rule:** Verification bypass is prohibited.

**Definition:** Transition that skips required verification states.

**Examples:**
- candidate_claim → claim_created (bypasses verification)
- event_created → event_projected (bypasses verification)

**Failure:**
- Verification bypass
- Constitutional incident
- Truth corruption

---

# STATE TRANSITION VALIDATION

## Validation Gate

**Purpose:** Validate state transitions before execution

**Input:**
- current_state
- next_state
- state_machine_type

**Validation:**
1. Check if state_machine_type is defined
2. Check if current_state is valid for state_machine_type
3. Check if next_state is valid for state_machine_type
4. Check if transition is in allowed_transitions list
5. Check if transition is not in prohibited_transitions list
6. Check for state regression
7. Check for terminal state violation

**Output:**
- validation_result: PASS | FAIL
- rejection_reason: string (if FAIL)

**Failure:**
- Reject transition
- Open constitutional incident
- Record rejection reason

---

# ILLEGAL TRANSITIONS

## Illegal Transition 1 — Verification Bypass

**Transition:** candidate_claim → claim_created

**Reason:** Bypasses verification

**Consequence:** Constitutional incident

**Severity:** CRITICAL

---

## Illegal Transition 2 — State Regression

**Transition:** verification_approved → verification_pending

**Reason:** State regression

**Consequence:** Constitutional incident

**Severity:** CRITICAL

---

## Illegal Transition 3 — Terminal State Transition

**Transition:** archived → claim_created

**Reason:** Terminal state transition

**Consequence:** Constitutional incident

**Severity:** CRITICAL

---

## Illegal Transition 4 — Event Verification Bypass

**Transition:** event_created → event_projected

**Reason:** Bypasses event verification

**Consequence:** Constitutional incident

**Severity:** CRITICAL

---

# STATE TRANSITION EVENTS

## Transition Events

Every state transition must emit a transition event:

```yaml
state_transition_event:
  event_type: STATE_TRANSITION
  state_machine_type: string
  current_state: string
  next_state: string
  transition_allowed: boolean
  transition_verified: boolean
  timestamp: timestamptz
```

**Verification Required:** YES

**Verification Method:** Transition validation gate

---

# CONSTITUTIONAL INVARIANTS

## Invariant 1 — Transitions are Declared

**Statement:** Every state transition must be declared in STATE_TRANSITION_LAW.md

**Violation:** Undeclared transition

**Consequence:** Constitutional incident

---

## Invariant 2 — No State Regression

**Statement:** State regression is prohibited

**Violation:** State regression transition

**Consequence:** Constitutional incident

---

## Invariant 3 — No Terminal State Transition

**Statement:** Terminal states may not transition

**Violation:** Terminal state transition

**Consequence:** Constitutional incident

---

## Invariant 4 — No Verification Bypass

**Statement:** Verification bypass is prohibited

**Violation:** Transition that skips verification

**Consequence:** Constitutional incident

---

# FAILURE SEMANTICS

## Illegal Transition Detection

**Detection:** State transition validation gate

**Severity:** CRITICAL

**Action:** Reject transition, open constitutional incident

**Remediation:** Fix transition logic, re-run validation

## State Regression Detection

**Detection:** State transition validation gate

**Severity:** CRITICAL

**Action:** Reject transition, open constitutional incident

**Remediation:** Fix transition logic, re-run validation

## Terminal State Transition Detection

**Detection:** State transition validation gate

**Severity:** CRITICAL

**Action:** Reject transition, open constitutional incident

**Remediation:** Fix transition logic, re-run validation

---

# CONSTITUTIONAL PRINCIPLE

**State transitions must be formally defined. Illegal transitions are constitutional violations.**

---

**Document ID:** CONSTITUTION-STATE-TRANSITION-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
