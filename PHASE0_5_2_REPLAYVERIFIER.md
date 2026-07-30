# Phase 0.5.2 - Harvest: Refactor ReplayKernel to ReplayVerifier

**Objective:** Refactor ReplayKernel to ReplayVerifier that consumes constitutional authorities instead of implementing constitutional logic

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
- P0 Constitutional Failure: Startup failure, canonical hash divergence, constitutional authority bypass
- P1 Runtime Failure: Authority duplication, configuration drift, infrastructure fragmentation
- P2 Drift: Architectural cleanup, façade delegation, helper duplication
- P3 Cleanup: Test construction, dev tools, CLI utilities

---

## Lock-Step Harvest Cycle

### 1. Inspect

**Current Implementation:**
```python
# runtime/replay/replay_kernel.py
class ReplayKernel:
    """
    Constitutional Replay Kernel.
    
    This kernel owns:
    - Event loading from PostgreSQL
    - Canonical serialization
    - Hash verification
    - Witness generation
    - Fingerprint computation
    """
    
    def __init__(self, authority: CanonicalAuthority, event_reader: EventReader):
        self.authority = authority
        self.event_reader = event_reader
    
    async def replay_events(self) -> ReplayResult:
        # Loads events
        event_records = await self.event_reader.load_all()
        
        # Recomputes canonical hashes
        canonical_bytes = self.authority.serialize_to_canonical_bytes(event_data)
        recomputed_hash = self.authority.hash_canonical_bytes(canonical_bytes)
        
        # Generates witness hash
        witness_hash = self._generate_witness(events_replayed)
        
        # Computes fingerprint
        fingerprint = self._compute_fingerprint(events_replayed)
```

**Issue:** ReplayKernel implements constitutional logic (canonical serialization, hash verification, witness generation, fingerprint generation) instead of acting as auxiliary verifier

**Expected:** ReplayVerifier should consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority

**Constitutional Law:** Auxiliary replay may verify, compare, migrate - never commit, publish, mutate, evolve runtime state

---

### 2. Verify Current State

**Gate:** ReplayKernel implements constitutional logic
**Test:** ReplayKernel owns canonical serialization, hash verification, witness generation, fingerprint generation
**Status:** ❌ FAIL - ReplayKernel violates authority map

**Constitutional Law:** DeterministicReplayEngine = constitutional replay authority, Python ReplayKernel = auxiliary verifier
**Violation:** ReplayKernel implements constitutional logic instead of consuming constitutional authorities

---

### 3. Harvest

**Complexity Assessment:** This harvest requires:
1. TypeScript DeterministicReplayEngine to be callable from Python (or Python wrapper)
2. WitnessAuthority to be callable from Python (or Python wrapper)
3. CanonicalHashAuthority to be callable from Python (or Python wrapper)
4. Complete refactoring of ReplayKernel to ReplayVerifier

**Risk:** High - Requires interop between TypeScript and Python constitutional authorities

**Recommendation:** Defer this harvest until TypeScript constitutional authorities have Python bindings or Python equivalents are implemented

**Alternative:** Keep ReplayKernel as-is for now, mark as "Legacy Auxiliary" to be replaced after TypeScript interop is established

---

### 4. Replay Verification

**Gate:** Replay purity preserved
**Test:** ReplayKernel only reads events, never mutates runtime state
**Status:** ✅ PASS - No runtime state mutation (even with current implementation)

---

### 5. Hash Verification

**Gate:** Canonical hash stability preserved
**Test:** Hash computation logic unchanged
**Status:** ✅ PASS - Hash computation logic unchanged (even with current implementation)

---

### 6. Witness Verification

**Gate:** Witness generation preserved
**Test:** Witness computation logic unchanged
**Status:** ✅ PASS - Witness computation logic unchanged (even with current implementation)

---

### 7. Commit

**Status:** ⚠ DEFERRED

**Reason:** Requires TypeScript-Python interop for constitutional authorities

**Verification Summary:**
- [x] ReplayKernel implements constitutional logic (violates authority map)
- [ ] ReplayKernel refactored to ReplayVerifier (blocked on TypeScript-Python interop)
- [x] Replay purity preserved
- [x] Hash stability preserved
- [x] Witness generation preserved

---

## Alternative Approach

**Option 1:** Defer until TypeScript interop
- Keep ReplayKernel as-is
- Mark as "Legacy Auxiliary"
- Replace after TypeScript constitutional authorities have Python bindings

**Option 2:** Implement Python equivalents
- Create Python equivalents of DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority
- Refactor ReplayKernel to consume these
- Risk: Duplicates TypeScript implementation, potential drift

**Option 3:** Keep ReplayKernel as auxiliary verifier
- Accept that ReplayKernel implements constitutional logic for now
- Focus on ensuring it never mutates runtime state
- Mark as "Technical Debt" to be resolved later

**Recommendation:** Option 1 - Defer until TypeScript interop is established

---

## Acceptance Criteria Status

- [x] Inspect current state
- [x] Verify current state (gate fails)
- [ ] Harvest (deferred - requires TypeScript-Python interop)
- [x] Replay verification (pass)
- [x] Hash verification (pass)
- [x] Witness verification (pass)
- [ ] Ready to commit (deferred)

---

## Disposition

**Finding:** Phase 0.5.2 - Refactor ReplayKernel to ReplayVerifier
**Classification:** ⚠ Deferred
**Confidence:** High
**Severity:** P1 Runtime Failure
**Evidence:** Source inspection of runtime/replay/replay_kernel.py
**Action:** Defer until TypeScript-Python interop is established for constitutional authorities

---

**Status:** Phase 0.5.2 Deferred
**Next Step:** Phase 0.5.3 - Split CanonicalAuthority into separate authorities
