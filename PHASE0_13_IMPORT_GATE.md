# Phase 0.13 - Import Graph Regression Gate

**Objective:** Add import graph regression gate using madge to catch architectural drift

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

## Import Graph Regression Gate

### Purpose

Import graph regression gate catches architectural drift surprisingly early by detecting:
- Circular dependencies (constitutional law violation)
- Unexpected dependency changes
- Layer violations (infrastructure depending on constitutional)
- Authority bypass (direct imports to internal paths)

### Tool: madge

**Installation:**
```bash
npm install -g madge
```

**Circular Dependency Check:**
```bash
madge --circular runtime/
madge --circular storage/
madge --circular constitution/
```

**Import Graph Visualization:**
```bash
madge --image import-graph.svg runtime/
madge --image import-graph.svg storage/
madge --image import-graph.svg constitution/
```

**Text Output:**
```bash
madge runtime/
madge storage/
madge constitution/
```

---

## Constitutional Laws Enforced

### 1. No Circular Dependencies

**Constitutional Law:** Authorities depend downward only, no upward/sideways/cyclic dependencies

**Gate:** `madge --circular` must return exit code 0 (no circular dependencies)

**Violation:** Any circular dependency detected

**Severity:** P0 Constitutional Failure

---

### 2. Canonical Import Paths

**Constitutional Law:** Constitutional authorities must use canonical export surfaces

**Gate:** `madge runtime/` must not show imports to internal paths like `constitution.authority.canonical`

**Violation:** Direct imports to internal paths detected

**Severity:** P0 Constitutional Failure

---

### 3. Infrastructure Never Depends on Constitutional

**Constitutional Law:** Infrastructure never defines constitutional state

**Gate:** `madge storage/` must not show imports to constitutional authorities

**Violation:** Infrastructure depending on constitutional authorities detected

**Severity:** P1 Runtime Failure

---

### 4. Authority Ownership

**Constitutional Law:** Single ownership per authority

**Gate:** Import graph must show clear ownership hierarchy

**Violation:** Multiple authorities depending on same internal module

**Severity:** P1 Runtime Failure

---

## Regression Gate Procedure

### After Every Harvest

1. **Run circular dependency check:**
   ```bash
   madge --circular runtime/
   madge --circular storage/
   madge --circular constitution/
   ```

2. **Generate import graph:**
   ```bash
   madge --image import-graph-before.svg runtime/
   ```

3. **Apply harvest changes**

4. **Generate new import graph:**
   ```bash
   madge --image import-graph-after.svg runtime/
   ```

5. **Compare graphs:**
   - Visual diff of import-graph-before.svg vs import-graph-after.svg
   - Text diff of `madge runtime/` output

6. **Verify no unexpected changes:**
   - No new circular dependencies
   - No new layer violations
   - No new authority bypass

---

## Acceptance Criteria

- [x] Document import graph regression gate
- [ ] Install madge (requires manual setup due to PowerShell execution policy)
- [ ] Run circular dependency check (manual step)
- [ ] Generate baseline import graph (manual step)
- [ ] Integrate into CI/CD (future)

---

## Disposition

**Finding:** Phase 0.13 - Import graph regression gate
**Classification:** ⚠ Requires Manual Setup
**Confidence:** High
**Severity:** P0 (constitutional law enforcement)
**Evidence:** Madge documentation and constitutional laws
**Action:** Document gate, requires manual installation and execution due to PowerShell execution policy

---

**Status:** Phase 0.13 Documented (requires manual setup)
**Next Step:** Phase 1 - Harvest execution ingress (Inspect→Verify→Harvest→Replay→Hash→Witness→Commit)
