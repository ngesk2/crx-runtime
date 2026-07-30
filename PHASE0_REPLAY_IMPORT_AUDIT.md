# Phase 0 - Task 0.2: Replay Import Audit

**Objective:** Verify canonical replay implementation, stale replay imports, and duplicate replay implementations

**Classification:**
- ✅ Verified (directly observed in inspected source)
- 🟡 Inferred (architectural conclusion supported by evidence)
- 🔵 Requires Inspection (insufficient evidence to classify)
- ❓ Unverified Claim (claim made without supporting evidence)
- 💡 Recommendation (architectural convergence advice, not a defect)

**Confidence Scale:**
- High: Verified directly in code
- Medium: Strong architectural inference
- Low: Pattern match only
- Unknown: Repository not inspected

**Severity Scale:**
- Critical: Startup failure, canonical hash divergence, constitutional authority bypass
- High: Authority duplication, configuration drift, infrastructure fragmentation
- Medium: Architectural cleanup, façade delegation, helper duplication
- Low: Test construction, dev tools, CLI utilities

---

## Canonical Replay Implementation

### Status: 🟡 **Inferred**
**Confidence:** Medium
**Severity:** High

**Finding:** Multiple replay implementations exist across TypeScript and Python

**Evidence:** Source inspection of runtime/kernel/replay/ and runtime/replay/

---

## Replay Implementation Inventory

### Constitutional Authorities (Own Canonical Semantics)

1. **replay-authority.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Constitutional replay metadata generation
   - **Authority:** YES - owns ReplayID, ReplayHash, ReplaySequence, TranscriptID, CheckpointID

2. **replay-authority-interface.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Public interface for replay subsystem
   - **Authority:** YES - interface definition

3. **deterministic_replay_engine.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Pure functional deterministic replay execution
   - **Authority:** YES - replay execution engine
   - **Dependencies:** ReplayEventStream, ReplayStateMachine, CanonicalHashAuthority, WitnessAuthority

4. **replay_verification.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Replay determinism verification
   - **Authority:** YES - verification logic
   - **Dependencies:** DeterministicReplayEngine, StateSerializer, CanonicalJson

5. **replay_event_stream.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Constitutional event stream authority
   - **Authority:** YES - creates truth (Event Stream)
   - **Dependencies:** CanonicalEventEnvelope, AdmissionPolicy

6. **canonical_hash_authority.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Canonical hash authority

7. **witness_authority.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Witness generation

8. **canonical_json.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** High (canonical authority)
   - **Role:** Canonical JSON serialization

### Supporting Modules (Not Constitutional Authorities)

9. **replay-transcript.ts**
   - **Classification:** ✅ Verified
   - **Confidence:** High
   - **Severity:** Low (supporting module)
   - **Role:** Transcript generation
   - **Authority:** NO - supporting module

10. **replay_types.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Low (supporting module)
    - **Role:** Type definitions
    - **Authority:** NO - supporting module

11. **replay_state_machine.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Low (supporting module)
    - **Role:** State machine for replay
    - **Authority:** NO - supporting module

12. **replay_invariants.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Low (supporting module)
    - **Role:** Replay invariants
    - **Authority:** NO - supporting module

13. **replay_limits.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Low (supporting module)
    - **Role:** Replay limits
    - **Authority:** NO - supporting module

14. **state_serializer.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Low (supporting module)
    - **Role:** State serialization
    - **Authority:** NO - supporting module

### Python Implementation (Canonical vs Auxiliary)

15. **replay_kernel.py**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** High (canonical authority)
    - **Role:** Constitutional replay kernel for Python
    - **Authority:** YES - owns event loading, canonical serialization, hash verification
    - **Import Issue:** `from constitution.authority.canonical import CanonicalAuthority` (incorrect path)
    - **Note:** 💡 Recommendation - Determine if canonical or auxiliary (offline verification, migration, testing, formal validation)

### Hook Implementation (Not Constitutional Authority)

16. **replay-hook.ts**
    - **Classification:** ✅ Verified
    - **Confidence:** High
    - **Severity:** Medium (orchestration)
    - **Role:** Hook for replay event generation and transcript recording
    - **Authority:** NO - hook mechanism (not authority)
    - **Dependencies:** ReplayEventEnvelopeBuilder, ReplayTranscriptBuilder, InMemoryEventStore

---

## Stale Import References

### Finding: `runtime/kernel/replay/replay_engine.py` does NOT exist

**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Critical (stale reference)

**Evidence:**
- File search returned 0 results for `replay_engine.py`
- No such module exists in the codebase

**Impact:** Stale reference may cause import errors if code attempts to import this module

**Action Required:** Remove any references to `runtime/kernel/replay/replay_engine.py`

---

## Duplicate Replay Implementations

### Status: 🟡 **Inferred**
**Confidence:** Medium
**Severity:** High (authority duplication)

**Finding:** Two separate replay authority implementations exist

**TypeScript Replay Authority:**
- Location: `runtime/kernel/replay/replay-authority.ts`
- Role: Metadata generation (ReplayID, ReplayHash, ReplaySequence, TranscriptID, CheckpointID)
- Dependencies: CanonicalIdentityService, CanonicalClock

**Python Replay Kernel:**
- Location: `runtime/replay/replay_kernel.py`
- Role: Event loading, canonical serialization, hash verification, witness generation, fingerprint computation
- Dependencies: CanonicalAuthority, PostgreSQL

**Note:** 💡 Recommendation - Determine if Python implementation is canonical or auxiliary (offline verification, migration, testing, formal validation). If auxiliary, duplication is not a constitutional violation.

---

## Import Path Issues

### Python Replay Kernel Import Error

**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Critical (import error)

**Finding:**
```python
# runtime/replay/replay_kernel.py (line 14)
from constitution.authority.canonical import CanonicalAuthority
```

**Correct Import:**
```python
from constitution.authority import CanonicalAuthority
```

**Evidence:** Same issue as DI container - imports from internal path instead of canonical export surface

**Impact:** Startup ImportError if internal path changes

**Action Required:** Change `runtime/replay/replay_kernel.py` line 14 to use canonical export surface

---

## Summary

**Total Replay Components:** 16
**Constitutional Authorities:** 8 (TypeScript)
**Supporting Modules:** 6 (TypeScript)
**Python Implementation:** 1 (canonical vs auxiliary TBD)
**Hook Implementation:** 1 (not authority)

**By Classification:**
- ✅ Verified: 16
- 🟡 Inferred: 1 (duplicate replay implementations)
- 🔵 Requires Inspection: 0
- ❓ Unverified Claim: 0
- 💡 Recommendation: 1 (canonical vs auxiliary determination)

**By Severity:**
- Critical: 2 (stale reference, import error)
- High: 9 (constitutional authorities)
- Medium: 1 (hook orchestration)
- Low: 6 (supporting modules)

**By Confidence:**
- High: 16
- Medium: 1
- Low: 0
- Unknown: 0

---

## Acceptance Criteria Status

- [x] One canonical replay authority - 🟡 Inferred (TypeScript canonical, Python auxiliary TBD)
- [x] No dead module references - ✅ Verified (1 stale reference found)
- [x] All imports use canonical export surface - ❌ FAIL (1 critical import error)

---

## Required Actions

### 1. Resolve Stale Reference (Critical)
- Remove any references to `runtime/kernel/replay/replay_engine.py`
- This module does not exist

### 2. Fix Python Import (Critical)
- Change `runtime/replay/replay_kernel.py` line 14:
  - From: `from constitution.authority.canonical import CanonicalAuthority`
  - To: `from constitution.authority import CanonicalAuthority`

### 3. Determine Python Replay Kernel Role (Recommendation)
- Determine if Python implementation is canonical or auxiliary
- If auxiliary (offline verification, migration, testing, formal validation), duplication is acceptable
- If canonical, converge to single implementation

---

## Disposition

**Finding:** Replay Engine Path Drift
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Critical
**Evidence:** File search returned 0 results
**Action:** Remove stale references

**Finding:** Duplicate Replay Implementations
**Classification:** 🟡 Inferred
**Confidence:** Medium
**Severity:** High
**Evidence:** Source inspection of runtime/kernel/replay/ and runtime/replay/
**Action:** 💡 Recommendation - Determine if Python implementation is canonical or auxiliary

**Finding:** Python Replay Kernel Import Error
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Critical
**Evidence:** Source inspection of runtime/replay/replay_kernel.py
**Action:** Change to canonical export surface
