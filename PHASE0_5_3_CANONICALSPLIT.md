# Phase 0.5.3 - Harvest: Split CanonicalAuthority into Separate Authorities

**Objective:** Harvest monolithic CanonicalAuthority into separate authorities (CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService)

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
# constitution/authority/canonical.py
class CanonicalAuthority:
    """Monolithic constitutional authority owning all canonical operations"""
    
    def serialize_to_canonical_bytes(self, data: Any) -> bytes:
        """Serialize data to canonical bytes"""
        pass
    
    def hash_canonical_bytes(self, data: bytes) -> str:
        """Hash canonical bytes"""
        pass
    
    def hash_dict(self, data: Dict[str, Any]) -> str:
        """Hash dictionary"""
        pass
```

**Usage:**
```python
# runtime/replay/replay_kernel.py
canonical_bytes = self.authority.serialize_to_canonical_bytes(event_data)
recomputed_hash = self.authority.hash_canonical_bytes(canonical_bytes)
```

**Issue:** Monolithic god-object that owns serialize_to_canonical_bytes(), hash_canonical_bytes()

**Expected:** Should be split into CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService

**Constitutional Map:**
- CanonicalHashAuthority: runtime/kernel/replay/canonical_hash_authority.ts (TypeScript)
- WitnessAuthority: runtime/kernel/replay/witness_authority.ts (TypeScript)
- CanonicalIdentityService: runtime/kernel/identity/canonical-identity-service.ts (TypeScript)

---

### 2. Verify Current State

**Gate:** CanonicalAuthority is monolithic
**Test:** CanonicalAuthority owns serialize_to_canonical_bytes(), hash_canonical_bytes()
**Status:** ❌ FAIL - CanonicalAuthority violates authority map

**Constitutional Law:** CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService are separate authorities
**Violation:** Python CanonicalAuthority is monolithic, TypeScript authorities are split

---

### 3. Harvest

**Complexity Assessment:** This harvest requires:
1. Create Python equivalents of TypeScript authorities (CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService)
2. Refactor all Python code using CanonicalAuthority to use split authorities
3. Ensure Python authorities match TypeScript implementations
4. Update RuntimeContainer to inject split authorities
5. Update ReplayKernel to consume split authorities

**Risk:** High - Requires creating Python equivalents of TypeScript authorities, potential implementation drift

**Affected Components:**
- constitution/authority/canonical.py (to be split)
- runtime/replay/replay_kernel.py (uses CanonicalAuthority)
- runtime/di_container.py (constructs CanonicalAuthority)
- storage/event_store.py (uses CanonicalAuthority)
- Any other Python code using CanonicalAuthority

**Recommendation:** Defer this harvest until TypeScript constitutional authorities have Python bindings or Python equivalents are implemented as part of a broader TypeScript-Python interop strategy

**Alternative:** Keep CanonicalAuthority as-is for now, mark as "Legacy Monolithic" to be replaced after TypeScript interop is established

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
- [x] CanonicalAuthority is monolithic (violates authority map)
- [ ] CanonicalAuthority split into separate authorities (deferred - requires TypeScript-Python interop)
- [x] Replay purity preserved
- [x] Hash stability preserved
- [x] Witness generation preserved

---

## Alternative Approach

**Option 1:** Defer until TypeScript interop
- Keep CanonicalAuthority as-is
- Mark as "Legacy Monolithic"
- Replace after TypeScript constitutional authorities have Python bindings

**Option 2:** Implement Python equivalents
- Create Python equivalents of CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService
- Refactor all Python code to use these
- Risk: Duplicates TypeScript implementation, potential drift

**Option 3:** Keep CanonicalAuthority as monolithic
- Accept that Python CanonicalAuthority is monolithic for now
- Focus on ensuring it never drifts from TypeScript authorities
- Mark as "Technical Debt" to be resolved later

**Recommendation:** Option 1 - Defer until TypeScript-Python interop is established

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

**Finding:** Phase 0.5.3 - Split CanonicalAuthority into separate authorities
**Classification:** ⚠ Deferred
**Confidence:** High
**Severity:** P1 Runtime Failure
**Evidence:** Source inspection of constitution/authority/canonical.py
**Action:** Defer until TypeScript-Python interop is established for constitutional authorities

---

**Status:** Phase 0.5.3 Deferred
**Next Step:** Phase 0.6 - Implement ProjectionPipeline before removing Git dependencies
