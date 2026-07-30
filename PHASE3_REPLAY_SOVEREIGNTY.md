# Phase 3 - Replay Sovereignty

**Objective:** Inventory every replay implementation and build ownership table

**Ownership Table:**
- Component
- Role
- Owner
- Action

**Acceptance Criteria:** Replay becomes evidence-driven only

---

## Replay Implementation Inventory

### Ownership Table

| Component | Role | Owner | Action |
|-----------|------|-------|--------|
| ReplayAuthority | Metadata generation | Constitutional Authority | Preserve |
| ReplayKernel | Event loading, canonical serialization, hash verification | Python Runtime | Harvest |
| DeterministicReplayEngine | Deterministic replay execution | TypeScript Runtime | Preserve |
| ReplayVerification | Replay determinism verification | TypeScript Runtime | Preserve |
| ReplayHook | Replay event generation and transcript recording | Hook Mechanism | Harvest |
| ReplayEventStream | Constitutional event stream authority | Constitutional Authority | Preserve |
| ReplayTranscriptBuilder | Transcript generation | TypeScript Runtime | Preserve |
| ReplayStateMachine | State machine for replay | TypeScript Runtime | Preserve |
| ReplayInvariants | Replay invariants | TypeScript Runtime | Preserve |
| ReplayLimits | Replay limits | TypeScript Runtime | Preserve |
| CanonicalHashAuthority | Canonical hash authority | Constitutional Authority | Preserve |
| WitnessAuthority | Witness generation | Constitutional Authority | Preserve |
| CanonicalJson | Canonical JSON serialization | Constitutional Authority | Preserve |
| StateSerializer | State serialization | TypeScript Runtime | Preserve |
| InMemoryEventStore | In-memory event storage for replay | Hook Mechanism | Harvest |
| ReplayService | Business replay operations | Business Service | Harvest |

---

## Detailed Component Analysis

### 1. ReplayAuthority

**Location:** `runtime/kernel/replay/replay-authority.ts`
**Role:** Metadata generation (ReplayID, ReplayHash, ReplaySequence, TranscriptID, CheckpointID)
**Owner:** Constitutional Authority
**Current Dependencies:** CanonicalIdentityService, CanonicalClock
**Evidence Dependency:** ❌ NO - Does not depend on evidence
**Action:** ✅ **Preserve** - This is the intended constitutional replay authority

**Constitutional Status:** ✅ Correct ownership

---

### 2. ReplayKernel

**Location:** `runtime/replay/replay_kernel.py`
**Role:** Event loading, canonical serialization, hash verification, witness generation, fingerprint computation
**Owner:** Python Runtime (Duplicate Authority)
**Current Dependencies:** CanonicalAuthority, PostgreSQL, SQLAlchemy
**Evidence Dependency:** ❌ NO - Loads events from PostgreSQL directly
**Action:** ❌ **Harvest** - Duplicate replay authority, should use TypeScript implementation

**Constitutional Violation:** Duplicate replay authority creates replay divergence

---

### 3. DeterministicReplayEngine

**Location:** `runtime/kernel/replay/deterministic_replay_engine.ts`
**Role:** Pure functional deterministic replay execution
**Owner:** TypeScript Runtime
**Current Dependencies:** ReplayEventStream, ReplayStateMachine, CanonicalHashAuthority, WitnessAuthority
**Evidence Dependency:** ✅ YES - Consumes ReplayEventStream
**Action:** ✅ **Preserve** - Core replay execution engine

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 4. ReplayVerification

**Location:** `runtime/kernel/replay/replay_verification.ts`
**Role:** Replay determinism verification
**Owner:** TypeScript Runtime
**Current Dependencies:** DeterministicReplayEngine, StateSerializer, CanonicalJson
**Evidence Dependency:** ✅ YES - Verifies replay results
**Action:** ✅ **Preserve** - Verification logic

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 5. ReplayHook

**Location:** `runtime/kernel/execution/replay-hook.ts`
**Role:** Hook for replay event generation and transcript recording
**Owner:** Hook Mechanism (Not Authority)
**Current Dependencies:** ReplayEventEnvelopeBuilder, ReplayTranscriptBuilder, InMemoryEventStore
**Evidence Dependency:** ❌ NO - Hook mechanism, not evidence-driven
**Action:** ❌ **Harvest** - Should use evidence-based replay

**Constitutional Violation:** Hook-based replay not evidence-driven

---

### 6. ReplayEventStream

**Location:** `runtime/kernel/replay/replay_event_stream.ts`
**Role:** Constitutional event stream authority
**Owner:** Constitutional Authority
**Current Dependencies:** CanonicalEventEnvelope, AdmissionPolicy
**Evidence Dependency:** ✅ YES - Creates and manages event stream
**Action:** ✅ **Preserve** - Constitutional event stream authority

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 7. ReplayTranscriptBuilder

**Location:** `runtime/kernel/replay/replay-transcript.ts` (referenced)
**Role:** Transcript generation
**Owner:** TypeScript Runtime
**Current Dependencies:** ReplayAuthority
**Evidence Dependency:** ✅ YES - Generates transcripts from replay metadata
**Action:** ✅ **Preserve** - Transcript generation

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 8. ReplayStateMachine

**Location:** `runtime/kernel/replay/replay_state_machine.ts` (referenced)
**Role:** State machine for replay
**Owner:** TypeScript Runtime
**Current Dependencies:** None (pure functional)
**Evidence Dependency:** ✅ YES - Processes event stream
**Action:** ✅ **Preserve** - State machine logic

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 9. ReplayInvariants

**Location:** `runtime/kernel/replay/replay_invariants.ts` (referenced)
**Role:** Replay invariants
**Owner:** TypeScript Runtime
**Current Dependencies:** None (pure functional)
**Evidence Dependency:** ✅ YES - Validates replay state
**Action:** ✅ **Preserve** - Invariant definitions

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 10. ReplayLimits

**Location:** `runtime/kernel/replay/replay_limits.ts` (referenced)
**Role:** Replay limits
**Owner:** TypeScript Runtime
**Current Dependencies:** None (configuration)
**Evidence Dependency:** N/A (configuration)
**Action:** ✅ **Preserve** - Configuration limits

**Constitutional Status:** ✅ Correct ownership

---

### 11. CanonicalHashAuthority

**Location:** `runtime/kernel/replay/canonical_hash_authority.ts` (referenced)
**Role:** Canonical hash authority
**Owner:** Constitutional Authority
**Current Dependencies:** None (pure functional)
**Evidence Dependency:** ✅ YES - Generates canonical hashes
**Action:** ✅ **Preserve** - Constitutional hash authority

**Constitutional Status:** ✅ Correct ownership

---

### 12. WitnessAuthority

**Location:** `runtime/kernel/replay/witness_authority.ts` (referenced)
**Role:** Witness generation
**Owner:** Constitutional Authority
**Current Dependencies:** CanonicalHashAuthority
**Evidence Dependency:** ✅ YES - Generates witnesses from evidence
**Action:** ✅ **Preserve** - Constitutional witness authority

**Constitutional Status:** ✅ Correct ownership

---

### 13. CanonicalJson

**Location:** `runtime/kernel/replay/canonical_json.ts` (referenced)
**Role:** Canonical JSON serialization
**Owner:** Constitutional Authority
**Current Dependencies:** None (pure functional)
**Evidence Dependency:** ✅ YES - Serializes evidence canonically
**Action:** ✅ **Preserve** - Constitutional serialization authority

**Constitutional Status:** ✅ Correct ownership

---

### 14. StateSerializer

**Location:** `runtime/kernel/replay/state_serializer.ts` (referenced)
**Role:** State serialization
**Owner:** TypeScript Runtime
**Current Dependencies:** CanonicalJson
**Evidence Dependency:** ✅ YES - Serializes replay state
**Action:** ✅ **Preserve** - State serialization

**Constitutional Status:** ✅ Correct ownership, evidence-driven

---

### 15. InMemoryEventStore

**Location:** `runtime/kernel/replay/event-store.ts` (referenced in replay-hook.ts)
**Role:** In-memory event storage for replay
**Owner:** Hook Mechanism (Not Authority)
**Current Dependencies:** None
**Evidence Dependency:** ❌ NO - Independent event storage
**Action:** ❌ **Harvest** - Should use ReplayEventStream

**Constitutional Violation:** Independent event storage bypasses constitutional event stream

---

### 16. ReplayService

**Location:** `src/services/replay-service.ts`
**Role:** Business replay operations (aggregate, property, customer, artifact, timeline)
**Owner:** Business Service (Not Authority)
**Current Dependencies:** EventService, IdentityService, PropertyService, ArtifactService
**Evidence Dependency:** ❌ NO - Business logic, not evidence-driven
**Action:** ❌ **Harvest** - Should use evidence-based replay

**Constitutional Violation:** Business service performing constitutional replay work

---

## Replay Implementation Summary

**Total Replay Implementations:** 16
**✅ Constitutional:** 10 (Preserve)
**❌ Alternative:** 6 (Harvest)

---

## Evidence Dependency Analysis

### Evidence-Driven (✅ Correct)
- DeterministicReplayEngine
- ReplayVerification
- ReplayEventStream
- ReplayTranscriptBuilder
- ReplayStateMachine
- ReplayInvariants
- CanonicalHashAuthority
- WitnessAuthority
- CanonicalJson
- StateSerializer

### Not Evidence-Driven (❌ Constitutional Violation)
- ReplayKernel (loads from PostgreSQL directly)
- ReplayHook (hook mechanism)
- InMemoryEventStore (independent storage)
- ReplayService (business logic)
- ReplayAuthority (metadata generation, not evidence-driven)

---

## Acceptance Criteria Status

- [x] Complete inventory of replay implementations - ✅ 16 implementations identified
- [x] Build ownership table - ✅ Complete ownership table created
- [ ] Replay becomes evidence-driven only - ❌ 6 implementations not evidence-driven

---

## Required Actions

### 1. Harvest Duplicate Replay Authority
**Target:** ReplayKernel (Python)
**Action:** Eliminate Python replay authority, use TypeScript implementation
**Disposition:** Remove duplicate authority

### 2. Harvest Hook-Based Replay
**Target:** ReplayHook
**Action:** Replace hook mechanism with evidence-based replay
**Disposition:** Use DeterministicReplayEngine

### 3. Harvest Independent Event Storage
**Target:** InMemoryEventStore
**Action:** Use ReplayEventStream for all event storage
**Disposition:** Eliminate independent storage

### 4. Harvest Business Replay Service
**Target:** ReplayService
**Action:** Route all replay operations through evidence-based replay
**Disposition:** Service becomes replay authority client

### 5. Update ReplayAuthority
**Target:** ReplayAuthority
**Action:** Make ReplayAuthority evidence-driven
**Disposition:** Consume evidence for metadata generation

---

## Disposition

**Finding:** Replay Constitutional Drift
**Status:** ❌ **Confirmed** - 6 alternative replay implementations exist
**Evidence:** Repository scan and source inspection
**Action:** Harvest all non-evidence-driven replay implementations

**Constitutional Target:**
```
Evidence
    ↓
Canonical Transcript
    ↓
Reducer
    ↓
Canonical State
```

**Current State:**
```
16 replay implementations
    ↓
Multiple replay authorities
    ↓
Non-evidence-driven replay
    ↓
Replay divergence
```
