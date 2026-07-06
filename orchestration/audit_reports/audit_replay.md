# Orchestration Replay Report

**Files:** `orchestration/execution/engine.js` (719 lines) + orchestration execution subsystem
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** Verify that Mission→Worker→Artifact→Consensus→Merge→Replay→Witness pipeline reconstructs identical state.

---

## Pipeline Trace

### 1. Mission Compilation

**File:** `orchestration/execution/mission_compiler.js`

**Trace:**
- `compileMissionFromGitDiff()` (L140-180)
- `compileMissions()` (L182-220)
- Mission ID generation: `msn_${Date.now()}_${crypto.createHash('sha256')...}` (L180)

**Determinism: FAIL**
- Mission ID includes `Date.now()` — non-deterministic
- Same git diff produces different mission IDs at different times
- Replay cannot reconstruct identical mission state

**Impact:** Replay cannot start with identical mission state.

---

### 2. Worker Assignment

**File:** `orchestration/execution/scheduler.js`

**Trace:**
- `schedule()` (L26-56)
- `scheduleForConsensus()` (L58-90)
- Worker selection via consistent hashing (L86-108)

**Determinism: FAIL** (per audit_scheduler.md)
- `_getRecentLoad()` uses `Date.now()` — non-deterministic
- `_recentAssignments` accumulates across lifetime — state-dependent
- Mission ID non-determinism affects hash seed

**Impact:** Replay cannot assign identical workers to identical missions.

---

### 3. Artifact Production

**File:** `orchestration/execution/artifact_authorities.js`

**Trace:**
- `produce()` (L29-77)
- Artifact ID generation: `art_${crypto.createHash('sha256')...}` (L18-21)
- Witness hash computation (L79-89)

**Determinism: FAIL** (per audit_artifact_graph.md)
- Witness computation uses `Date.now()` — non-deterministic
- Artifact `created_at` uses `new Date().toISOString()` — non-deterministic
- No duplicate artifact ID detection

**Impact:** Replay cannot produce identical artifact state.

---

### 4. Consensus Evaluation

**File:** `orchestration/execution/consensus_engine.js`

**Trace:**
- `evaluate()` (L7-176)
- Decision ID generation (L36, L105, L164)
- `evaluatedAt` timestamp (L35, L104, L163)

**Determinism: FAIL** (per audit_consensus.md)
- `_multiWorkerConsensus` uses `Date.now()` in decision ID — non-deterministic
- All paths use `new Date().toISOString()` for `evaluatedAt` — non-deterministic
- `_noConsensus` emits event (side effect)

**Impact:** Replay cannot produce identical consensus decisions.

---

### 5. Merge Gate Validation

**File:** `orchestration/merge_gate.js`

**Trace:**
- `validateFile()` (called from engine.js L358)
- `summary()` (called from engine.js L361)

**Determinism: UNKNOWN**
- Merge gate validation depends on file system state
- File system state may change between executions
- No replay mechanism for file system state

**Impact:** Replay cannot guarantee identical merge gate results.

---

### 6. Replay Proof Generation

**File:** `orchestration/execution/artifact_authorities.js` + `engine.js`

**Trace:**
- `ReplayArtifact` class exists (L228-246)
- `engine.js` instantiates replay authority (L81)
- **But**: `ReplayArtifact.produce()` is never called

**Determinism: FAIL**
- Replay proof generation is not implemented
- No mechanism to verify replay determinism
- No execution trace capture

**Impact:** Replay cannot be verified against replay proof.

---

### 7. Witness Generation

**File:** `orchestration/execution/artifact_authorities.js` + `engine.js`

**Trace:**
- `WitnessArtifact` class exists (L248-264)
- `engine.js` instantiates witness authority (L82)
- **But**: `WitnessArtifact.produce()` is never called

**Determinism: FAIL** (per audit_witness.md)
- Witness generation is not implemented
- No witness chain for artifacts, events, merges, or replays
- Cannot verify integrity via witness chain

**Impact:** Replay cannot be verified against witness chain.

---

## Replay Determinism Analysis

### State Reconstruction Test

**Test:** Replay the same mission with identical inputs.

**Expected:** Identical state reconstruction at every pipeline stage.

**Actual:**

| Pipeline Stage | Determinism? | Failure Reason |
|---------------|-------------|----------------|
| Mission compilation | ❌ | `Date.now()` in mission ID |
| Worker assignment | ❌ | `Date.now()` in load tracking, accumulating state |
| Artifact production | ❌ | `Date.now()` in witness, `created_at` |
| Consensus evaluation | ❌ | `Date.now()` in decision ID, `evaluatedAt` |
| Merge gate validation | ❓ | File system state dependency |
| Replay proof generation | ❌ | Not implemented |
| Witness generation | ❌ | Not implemented |

**Result:** Replay cannot reconstruct identical state at any pipeline stage.

---

## Replay Verification Mechanisms

### 1. Event Replay

**Status:** Event queue exists but no replay verification.

**Evidence:**
- `event_queue.js` stores events to disk (L187-190)
- Events can be loaded on startup (L192-210)
- But no replay verification mechanism exists
- No comparison between original and replayed event sequence

**Gap:** Event replay is possible but not verified.

---

### 2. Artifact Replay

**Status:** Artifact store exists but no replay verification.

**Evidence:**
- `artifact_store.js` stores artifacts
- Artifacts can be retrieved by ID, file, type
- But no replay verification mechanism exists
- No comparison between original and replayed artifact state

**Gap:** Artifact replay is possible but not verified.

---

### 3. State Machine Replay

**Status:** Worker state machine exists but no replay verification.

**Evidence:**
- `worker_state_machine.js` tracks worker states
- State transitions are recorded
- But no replay verification mechanism exists
- No comparison between original and replayed state machine state

**Gap:** State machine replay is possible but not verified.

---

## Additional Constitutional Violations

### 1. Wall Clock Dependencies

**Verdict: FAIL — 7 violations**

| Location | Violation | Impact |
|----------|-----------|--------|
| mission_compiler.js L180 | `Date.now()` in mission ID | Mission non-determinism |
| scheduler.js L128 | `Date.now()` in `_getRecentLoad` | Worker selection non-determinism |
| artifact_authorities.js L86 | `Date.now()` in witness | Witness non-determinism |
| artifact_authorities.js L62 | `new Date().toISOString()` in `created_at` | Artifact non-determinism |
| consensus_engine.js L105 | `Date.now()` in decision ID | Decision non-determinism |
| consensus_engine.js L35, L104, L163 | `new Date().toISOString()` in `evaluatedAt` | Decision non-determinism |
| engine.js L256, L415 | `new Date().toISOString()` in timestamps | State non-determinism |

**Impact:** Every pipeline stage has wall clock dependency, making replay impossible.

---

### 2. State Accumulation

**Verdict: FAIL**

**Evidence:**
- `scheduler.js` `_recentAssignments` accumulates across lifetime (L6)
- Same inputs at different times produce different outputs
- No mechanism to reset state for replay

**Impact:** Replay cannot start from clean state.

---

### 3. No Replay Entry Point

**Verdict: FAIL**

**Evidence:**
- No `replay()` method in engine.js
- No replay API in orchestration layer
- No mechanism to trigger replay from historical state

**Impact:** Replay cannot be initiated.

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| Mission compilation deterministic | **FAIL** | CRITICAL | `Date.now()` in mission ID |
| Worker assignment deterministic | **FAIL** | CRITICAL | `Date.now()` in load tracking, accumulating state |
| Artifact production deterministic | **FAIL** | CRITICAL | `Date.now()` in witness, `created_at` |
| Consensus evaluation deterministic | **FAIL** | CRITICAL | `Date.now()` in decision ID, `evaluatedAt` |
| Merge gate validation deterministic | **FAIL** | CRITICAL | File system state dependency |
| Replay proof generation | **FAIL** | CRITICAL | Not implemented |
| Witness generation | **FAIL** | CRITICAL | Not implemented |
| Event replay verification | **FAIL** | CRITICAL | No verification mechanism |
| Artifact replay verification | **FAIL** | CRITICAL | No verification mechanism |
| State machine replay verification | **FAIL** | CRITICAL | No verification mechanism |

**Overall: FAIL** — 10 CRITICAL violations prevent constitutional replay guarantees.

## Immediate Remediation Required

1. **Remove all wall clock dependencies**
   - Replace `Date.now()` with deterministic time source
   - Remove `new Date().toISOString()` from all metadata
   - Use mission timestamp or sequence number

2. **Implement state reset for replay**
   - Add `reset()` method to scheduler
   - Clear accumulating state before replay
   - Ensure clean state initialization

3. **Implement replay proof generation**
   - Call `ReplayArtifact.produce()` after mission resolution
   - Capture execution trace
   - Verify determinism

4. **Implement witness generation**
   - Call `WitnessArtifact.produce()` for all artifacts/events/merges
   - Build complete witness chain
   - Verify integrity

5. **Implement replay verification**
   - Add `replay()` method to engine
   - Compare replayed state against original
   - Verify event sequence, artifact state, witness chain

6. **Add replay entry point**
   - Expose replay API
   - Allow replay from historical state
   - Support replay verification
