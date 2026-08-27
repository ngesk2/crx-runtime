# REPLAY SEMANTICS CONTRACT

**Status:** ACTIVE CONSTITUTIONAL CONTRACT
**Scope:** What replay IS, what it verifies, what it does NOT verify, what it produces.
**Bridges:** constitution/replay_law.md → gateway/replay/kernel/* → ping-runtime/workers/canonical_workers.js
**Date:** 2026-08-26

---

## 1. What Replay IS

Replay is **verification of event chain integrity through deterministic re-execution**. It answers one question:

> Given this exact event stream, does the reconstructed state satisfy all declared invariants?

Replay is NOT:
- State reconstruction (that is a projection)
- Truth production (that is the immutable verified event in Postgres — TRUTH_LAW.md)
- Authorization re-derivation (policy decisions are recorded facts, not recomputable)
- Runtime monitoring (replay is offline, not live)

```yaml
replay:
  classification: DERIVED_TRUTH_VERIFICATION
  produces: verification_status + witness + fingerprint
  does_not_produce: authoritative_state, constitutional_truth
  authority: ReplayAuthority (orchestrator) → KernelReplayExecutionProvider (executor) → DeterministicReplayEngine (kernel)
```

---

## 2. What Replay Verifies (Kernel Invariants)

The deterministic kernel engine (`gateway/replay/kernel/deterministic_replay_engine.js`) verifies 4 invariants:

### INV-1: ARTIFACT_HASH_VALID
Every artifact in the reconstructed state must have a non-empty string `artifact_hash`.
```yaml
invariant_id: ARTIFACT_HASH_VALID
invariant_type: VALIDATION
violation_type: INVALID_HASH
trigger: artifact.artifact_hash is missing or not a string
```

### INV-2: LINEAGE_ACYCLIC
The artifact lineage graph must contain no cycles. DFS cycle detection across all artifact lineage edges.
```yaml
invariant_id: LINEAGE_ACYCLIC
invariant_type: VALIDATION
violation_type: CYCLE_DETECTED
trigger: artifact A → ... → artifact A (cycle)
```

### INV-3: LINEAGE_PARENT_EXISTS
Every parent referenced in an artifact's `artifact_lineage` array must exist in the state's artifact map.
```yaml
invariant_id: LINEAGE_PARENT_EXISTS
invariant_type: VALIDATION
violation_type: MISSING_PARENT
trigger: artifact references parent_id not in state.artifacts
```

### INV-4: STATE_VERSION_CONSISTENT
The `state_version` field must be a non-empty string.
```yaml
invariant_id: STATE_VERSION_CONSISTENT
invariant_type: VALIDATION
violation_type: INVALID_VERSION
trigger: state.state_version is missing or not a string
```

---

## 3. What Replay Verifies (State Machine Guards)

The kernel state machine (`gateway/replay/kernel/replay_state_machine.js`) enforces 7 guards on each event:

| Guard | Failure Code | Phase |
|-------|-------------|-------|
| Payload structure (object, not null) | INVALID_PAYLOAD_STRUCTURE | STATE_TRANSITION |
| Lineage structure (array) | INVALID_LINEAGE_STRUCTURE | LINEAGE_VALIDATION |
| Lineage parent type (strings only) | INVALID_LINEAGE_PARENT_TYPE | LINEAGE_VALIDATION |
| Duplicate event_id detection | DUPLICATE_EVENT_ID | STATE_TRANSITION |
| Lineage namespace consistency (no evt-*/non-evt-* mixing) | LINEAGE_NAMESPACE_VIOLATION | LINEAGE_VALIDATION |
| Parent existence (all parents in state) | PARENT_NOT_FOUND / PARENT_EVENT_NOT_FOUND | STATE_TRANSITION |
| Duplicate artifact_id detection | DUPLICATE_ARTIFACT_ID | STATE_TRANSITION |

---

## 4. What Replay Does NOT Verify

The following are **out of scope** for the kernel replay engine. They are NOT verified by replay:

| Not Verified | Why | Where It Is Verified Instead |
|-------------|-----|------------------------------|
| Policy authorization | Policy decisions are recorded facts | Event governance (event_governance.js) |
| Actor identity validity | Actor identity is a recorded field | Identity authority (identity_authority.js) |
| Witness attestation correctness | Witness is a derived artifact | Witness authority (witness_authority.js) |
| Content truth | Replay verifies structure, not meaning | Constitutional verification (constitutional_verification_authority.js) |
| Event ordering against business rules | Replay preserves recorded order | Event governance (event_governance.js) |
| Namespace privacy boundaries | Namespace is a metadata field | Event governance (event_governance.js) |
| Confidence accuracy | Confidence is a recorded value | Evidence authority (evidence_authority.js) |

**Constitutional Principle:**
```
Replay verifies structural integrity.
Replay does not verify semantic correctness.
Structural integrity is necessary but not sufficient for truth.
```

---

## 5. Determinism Contract

Replay MUST be deterministic. Same input → identical output.

```yaml
determinism:
  requirement: ABSOLUTE
  scope:
    - fingerprint: SHA-256 of canonical bytes (identical across runs)
    - witness_root: Merkle tree root (identical across runs)
    - violations: invariant check results (identical across runs)
    - state_version: state version string (identical across runs)
    - artifact_count: number of artifacts (identical across runs)
  no_side_effects: true
  no_network_io: true
  no_clock_dependence: true
  no_mutable_state: true
```

**Verification:** `test_kernel_replay.js` proves determinism across 10 runs with identical input.

---

## 6. Failure Semantics

Replay failures MUST be deterministic. Every failure produces a `DeterministicFailureEnvelope`:

```yaml
failure_envelope:
  code: string           # One of 14 FailureCode values
  replay_phase: string   # One of 6 ReplayPhase values
  context: object        # Structured failure context
  timestamp: string      # Always 'REPLAY_DETERMINISTIC_TIMESTAMP' (never Date.now())
```

### Failure Codes (14 total)

| Code | Phase | Meaning |
|------|-------|---------|
| PARENT_NOT_FOUND | STATE_TRANSITION | Referenced parent artifact not in state |
| PARENT_EVENT_NOT_FOUND | STATE_TRANSITION | Referenced parent event not in event→artifact map |
| DUPLICATE_EVENT_ID | STATE_TRANSITION | Event ID already seen |
| DUPLICATE_ARTIFACT_ID | STATE_TRANSITION | Artifact ID already in state |
| INVALID_LINEAGE_STRUCTURE | LINEAGE_VALIDATION | Lineage is not an array |
| INVALID_LINEAGE_PARENT_TYPE | LINEAGE_VALIDATION | Lineage parent is not a string |
| LINEAGE_NAMESPACE_VIOLATION | LINEAGE_VALIDATION | Mixed evt-*/non-evt-* IDs in lineage |
| INVALID_PAYLOAD_STRUCTURE | STATE_TRANSITION | Payload is null or not an object |
| UNKNOWN_EVENT_TYPE | STATE_TRANSITION | Event type is not artifact_commit or artifact_update |
| DUPLICATE_LEAF_ID | MERKLE_CONSTRUCTION | Merkle leaf ID already used |
| EXECUTION_LIMIT_EXCEEDED | MERKLE_CONSTRUCTION | Merkle tree exceeds size limit |
| CANONICALIZATION_ERROR | CANONICALIZATION | Canonical serialization failed |
| INVARIANT_VIOLATION | INVARIANT_CHECK | Post-replay invariant check failed |
| CYCLE_DETECTED | INVARIANT_CHECK | Cycle detected in lineage graph |

### Status Codes

| Status | Meaning |
|--------|---------|
| `ok` | Replay completed, violations array may be non-empty |
| `no_events` | Transcript contains no replay events |
| `conversion_failed` | All events failed conversion to kernel envelopes |
| `kernel_error` | Kernel engine threw an exception |

---

## 7. Output Contract

Replay produces a deterministic verification result:

```yaml
replay_result:
  replay_id: string           # Transcript ID or deterministic hash
  status: ok | no_events | conversion_failed | kernel_error
  event_count: integer        # Number of events replayed
  event_types: string[]       # Unique event types in the stream
  artifact_count: integer     # Number of artifacts in reconstructed state
  fingerprint: string         # SHA-256 hash of canonical bytes ("sha256:<hex>")
  witness_root: string        # Merkle tree root hex string
  leaf_count: integer         # Number of Merkle leaves
  tree_height: integer        # Height of Merkle tree
  state_version: string       # State version string
  violations: object[]        # Array of invariant violations (empty = all pass)
  canonical_bytes: object     # Canonical serialization of event stream
  lineage_graph: object       # Artifact lineage graph
```

### Verified Result

When `status === 'ok'` AND `violations.length === 0`:
- All 4 invariants pass
- All 7 state machine guards pass
- Fingerprint is deterministic
- Witness root is deterministic
- Replay is CONSTITUTIONALLY VERIFIED for structural integrity

When `status === 'ok'` AND `violations.length > 0`:
- Specific invariants failed
- Violations contain structured failure codes
- Replay is CONSTITUTIONALLY FAILED for structural integrity
- **NOT** `verified: true` — the old stub was wrong

---

## 8. Authority Chain

```
ReplayWorker (canonical_workers.js:220-248)
    │
    │  builds transcript from PROJECTION_CREATED event
    │
    ▼
ReplayAuthority (gateway/replay_authority.js)
    │
    │  orchestrates: load transcript → serialize → execute → certify
    │
    ▼
KernelReplayExecutionProvider (gateway/kernel_replay_execution_provider.js)
    │
    │  converts PING events → kernel CanonicalEventEnvelope format
    │
    ▼
DeterministicReplayEngine (gateway/replay/kernel/deterministic_replay_engine.js)
    │
    │  runs: state machine → invariant runner → witness authority
    │
    ▼
ReplayStateMachine + ReplayInvariants + WitnessAuthority + CanonicalHashAuthority
```

### Authority Responsibilities

| Layer | Owns | Does NOT Own |
|-------|------|-------------|
| ReplayWorker | Building transcript, emitting result | Verification logic |
| ReplayAuthority | Orchestration, certificate creation | Execution details |
| KernelReplayExecutionProvider | PING→kernel conversion, error handling | Kernel internals |
| DeterministicReplayEngine | Deterministic replay, invariant checking | Persistence |
| ReplayStateMachine | State transitions, guard enforcement | Witness generation |
| ReplayInvariants | Post-replay invariant verification | State transitions |
| WitnessAuthority | Merkle tree construction | Invariant checking |

---

## 9. Trace Field Preservation

Replay preserves trace fields from the input event chain:

| Field | Source | Preserved In |
|-------|--------|-------------|
| event_id | Event | Envelope event_id (with evt- prefix) |
| correlation_id | Event.metadata | Envelope payload.metadata.correlation_id |
| causation_id | Event | Lineage parent_event_ids |
| namespace | Event.metadata | Envelope payload.metadata.namespace |
| confidence | Event.metadata | Envelope payload.metadata.confidence |
| confidence_source | Event.metadata | Envelope payload.metadata.confidence_provenance |
| worker | Event.metadata | Envelope actor_id |

---

## 10. Constitutional Compliance

| Law | Requirement | Status |
|-----|------------|--------|
| TRUTH_LAW.md | Replay produces derived truth, not constitutional truth | ✅ Contract §1 |
| TRUTH_LAW.md | Truth = immutable verified event in Postgres | ✅ Replay does not touch Postgres |
| replay_law.md | Replay must be deterministic | ✅ Contract §5 |
| replay_law.md | Replay may be partial for verification only | ✅ Contract §1 |
| replay_law.md | Replay must verify lineage acyclicity | ✅ INV-2 |
| replay_law.md | Replay must detect divergence | ✅ Violations array |
| replay_law.md | Replay must fail deterministically | ✅ Contract §6 |
| witness_law.md | Witness must be deterministic | ✅ Merkle tree is deterministic |
| witness_law.md | Witness must be pure (no side effects) | ✅ Engine has no side effects |
| witness_law.md | Witness must be infrastructure-independent | ✅ No network/clock dependencies |

---

**Document ID:** REPLAY-SEMANTICS-CONTRACT-1.0
**Status:** ACTIVE
**Amendment:** Requires constitutional amendment process
