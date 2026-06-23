# CONSTITUTIONAL CI

**Status:** AUDIT IN PROGRESS
**Purpose:** Build CI checks for replay, layer, authority, mutation integrity
**Goal:** Architecture becomes durable through automated verification

---

# CI CHECK CATEGORIES

## Replay Integrity

### Check 1: Deterministic Replay

**Purpose:** Verify replay produces identical state for identical inputs

**Implementation:**
- Run replay on test event stream
- Capture state output
- Run replay again on same event stream
- Compare state outputs
- Fail if outputs differ

**Failure Code:** REPLAY_DETERMINISM_VIOLATION

**Severity:** CRITICAL

---

### Check 2: Witness Stability

**Purpose:** Verify witness is stable for identical replay

**Implementation:**
- Run replay on test event stream
- Generate witness root
- Run replay again on same event stream
- Generate witness root again
- Compare witness roots
- Fail if witness roots differ

**Failure Code:** WITNESS_STABILITY_VIOLATION

**Severity:** CRITICAL

---

### Check 3: Invariant Stability

**Purpose:** Verify invariants produce identical results for identical state

**Implementation:**
- Run invariants on test state
- Capture invariant results
- Run invariants again on same state
- Compare invariant results
- Fail if results differ

**Failure Code:** INVARIANT_STABILITY_VIOLATION

**Severity:** CRITICAL

---

## Layer Integrity

### Check 4: Forbidden Imports

**Purpose:** Verify Layer 0 has no forbidden imports

**Implementation:**
- Scan Layer 0 files for forbidden imports
- Forbidden imports: agents, embeddings, vector DBs, planners, orchestration, Redis, OpenTelemetry, UI, prompts, LLM APIs, HTTP, Express, pg, Docker, SDKs, providers
- Fail if forbidden imports detected

**Failure Code:** LAYER_0_FORBIDDEN_IMPORT

**Severity:** CRITICAL

---

### Check 5: Layer 0 Purity

**Purpose:** Verify Layer 0 remains pure and deterministic

**Implementation:**
- Scan Layer 0 files for nondeterministic patterns
- Nondeterministic patterns: Date.now, new Date, Math.random, uuid, process.env, Buffer, performance.now, setTimeout, setInterval, fs.writeFile, network access
- Fail if nondeterministic patterns detected

**Failure Code:** LAYER_0_PURITY_VIOLATION

**Severity:** CRITICAL

---

### Check 6: Dependency Boundaries

**Purpose:** Verify no cross-layer violations

**Implementation:**
- Scan Layer 0 files for imports from higher layers
- Scan Layer 1 files for direct infrastructure dependencies
- Scan Layer 2 files for direct Layer 0 dependencies (except adapters)
- Fail if cross-layer violations detected

**Failure Code:** DEPENDENCY_BOUNDARY_VIOLATION

**Severity:** CRITICAL

---

## Authority Integrity

### Check 7: Duplicate Authorities

**Purpose:** Verify no duplicate authorities exist

**Implementation:**
- Scan authority_registry.ts for duplicate registrations
- Scan codebase for shadow authorities
- Fail if duplicate authorities detected

**Failure Code:** DUPLICATE_AUTHORITY_DETECTED

**Severity:** HIGH

---

### Check 8: Shadow Truth

**Purpose:** Verify no shadow copies of canonical state

**Implementation:**
- Scan codebase for mutable caches of canonical state
- Scan codebase for duplicated YAML configurations
- Scan codebase for runtime patches to invariant definitions
- Scan codebase for shadow databases
- Fail if shadow copies detected

**Failure Code:** SHADOW_TRUTH_DETECTED

**Severity:** HIGH

---

### Check 9: Mutable Canonical State

**Purpose:** Verify canonical state is not mutable

**Implementation:**
- Scan codebase for direct mutations to canonical state
- Scan codebase for mutations bypassing replay
- Fail if mutable canonical state detected

**Failure Code:** MUTABLE_CANONICAL_STATE_DETECTED

**Severity:** CRITICAL

---

## Mutation Integrity

### Check 10: Illegal State Writes

**Purpose:** Verify no illegal state writes

**Implementation:**
- Scan codebase for direct DB writes
- Scan codebase for direct file writes to canonical state
- Fail if illegal state writes detected

**Failure Code:** ILLEGAL_STATE_WRITE_DETECTED

**Severity:** CRITICAL

---

### Check 11: Replay Bypasses

**Purpose:** Verify no mutations bypass replay

**Implementation:**
- Scan codebase for mutations not going through replay
- Scan codebase for state mutations not verified by invariants
- Scan codebase for state mutations not verified by witness
- Fail if replay bypasses detected

**Failure Code:** REPLAY_BYPASS_DETECTED

**Severity:** CRITICAL

---

### Check 12: Hidden Mutation Paths

**Purpose:** Verify no hidden mutation paths

**Implementation:**
- Scan codebase for singleton mutations
- Scan codebase for implicit runtime state mutations
- Scan codebase for in-memory authority mutations
- Fail if hidden mutation paths detected

**Failure Code:** HIDDEN_MUTATION_PATH_DETECTED

**Severity:** HIGH

---

# CI CHECK IMPLEMENTATION STATUS

## Implemented Checks

| Check | Status | Implementation | Notes |
|-------|--------|----------------|-------|
| Deterministic Replay | NOT IMPLEMENTED | - | Requires test event stream |
| Witness Stability | NOT IMPLEMENTED | - | Requires test event stream |
| Invariant Stability | NOT IMPLEMENTED | - | Requires test state |
| Forbidden Imports | NOT IMPLEMENTED | - | Requires AST parser |
| Layer 0 Purity | NOT IMPLEMENTED | - | Requires AST parser |
| Dependency Boundaries | NOT IMPLEMENTED | - | Requires AST parser |
| Duplicate Authorities | NOT IMPLEMENTED | - | Requires authority registry scan |
| Shadow Truth | NOT IMPLEMENTED | - | Requires codebase scan |
| Mutable Canonical State | NOT IMPLEMENTED | - | Requires codebase scan |
| Illegal State Writes | NOT IMPLEMENTED | - | Requires codebase scan |
| Replay Bypasses | NOT IMPLEMENTED | - | Requires codebase scan |
| Hidden Mutation Paths | NOT IMPLEMENTED | - | Requires codebase scan |

---

# CI CHECK IMPLEMENTATION PLAN

## Priority 1: AST-Based Checks

Implement AST-based checks for:
- Forbidden imports (Check 4)
- Layer 0 purity (Check 5)
- Dependency boundaries (Check 6)

**Tools:** TypeScript Compiler API, ESLint custom rules

**Implementation:**
1. Create TypeScript AST parser
2. Scan Layer 0 files for forbidden imports
3. Scan Layer 0 files for nondeterministic patterns
4. Scan all files for cross-layer violations
5. Fail CI if violations detected

---

## Priority 2: Authority-Based Checks

Implement authority-based checks for:
- Duplicate authorities (Check 7)
- Shadow truth (Check 8)
- Mutable canonical state (Check 9)

**Tools:** Custom scanner, authority registry

**Implementation:**
1. Scan authority_registry.ts for duplicates
2. Scan codebase for shadow copies
3. Scan codebase for mutable canonical state
4. Fail CI if violations detected

---

## Priority 3: Mutation-Based Checks

Implement mutation-based checks for:
- Illegal state writes (Check 10)
- Replay bypasses (Check 11)
- Hidden mutation paths (Check 12)

**Tools:** Custom scanner, AST parser

**Implementation:**
1. Scan codebase for direct DB writes
2. Scan codebase for replay bypasses
3. Scan codebase for hidden mutation paths
4. Fail CI if violations detected

---

## Priority 4: Replay-Based Checks

Implement replay-based checks for:
- Deterministic replay (Check 1)
- Witness stability (Check 2)
- Invariant stability (Check 3)

**Tools:** Test event stream, test state

**Implementation:**
1. Create test event stream
2. Run replay twice on same event stream
3. Compare state outputs
4. Generate witness twice on same replay
5. Compare witness roots
6. Run invariants twice on same state
7. Compare invariant results
8. Fail CI if violations detected

---

# CI CHECK FAILURE HANDLING

## Failure Severity Levels

**CRITICAL:** Build fails immediately, blocks deployment

**HIGH:** Build fails immediately, blocks deployment

**MEDIUM:** Build fails with warning, may block deployment

**LOW:** Build succeeds with warning, does not block deployment

---

## Failure Reporting

All CI failures MUST:
- Fail deterministically with structured failure codes
- Provide sufficient context for diagnosis
- Include file location and line number
- Include remediation suggestions
- Be recorded in CI logs

---

# CI CHECK INTEGRATION

## GitHub Actions Integration

Create GitHub Actions workflow for constitutional CI:

```yaml
name: Constitutional CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  constitutional-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run constitutional CI
        run: npm run constitutional-ci
```

---

## NPM Script Integration

Add constitutional CI script to package.json:

```json
{
  "scripts": {
    "constitutional-ci": "node scripts/constitutional-ci.js"
  }
}
```

---

# CI CHECK SUMMARY

## Current Status

**Finding:** No CI checks implemented

**Status:** NOT IMPLEMENTED

**Impact:** HIGH - No automated constitutional verification

**Remediation:** Implement CI checks per priority plan

---

## Required Checks

All 12 CI checks are required for constitutional compliance:
1. Deterministic Replay
2. Witness Stability
3. Invariant Stability
4. Forbidden Imports
5. Layer 0 Purity
6. Dependency Boundaries
7. Duplicate Authorities
8. Shadow Truth
9. Mutable Canonical State
10. Illegal State Writes
11. Replay Bypasses
12. Hidden Mutation Paths

---

# REMEDIATION PLAN

## Priority 1: Implement AST-Based Checks

1. **Create TypeScript AST parser**
   - Install TypeScript Compiler API
   - Create AST scanner script
   - Implement forbidden import check
   - Implement Layer 0 purity check
   - Implement dependency boundary check

2. **Integrate into CI**
   - Add npm script for AST checks
   - Add GitHub Actions workflow
   - Test on current codebase
   - Fix any violations detected

---

## Priority 2: Implement Authority-Based Checks

1. **Create authority scanner**
   - Scan authority_registry.ts
   - Scan codebase for shadow copies
   - Scan codebase for mutable canonical state
   - Implement duplicate authority check
   - Implement shadow truth check
   - Implement mutable canonical state check

2. **Integrate into CI**
   - Add npm script for authority checks
   - Add to GitHub Actions workflow
   - Test on current codebase
   - Fix any violations detected

---

## Priority 3: Implement Mutation-Based Checks

1. **Create mutation scanner**
   - Scan codebase for direct DB writes
   - Scan codebase for replay bypasses
   - Scan codebase for hidden mutation paths
   - Implement illegal state write check
   - Implement replay bypass check
   - Implement hidden mutation path check

2. **Integrate into CI**
   - Add npm script for mutation checks
   - Add to GitHub Actions workflow
   - Test on current codebase
   - Fix any violations detected

---

## Priority 4: Implement Replay-Based Checks

1. **Create test event stream**
   - Create sample event stream
   - Create sample state
   - Implement deterministic replay check
   - Implement witness stability check
   - Implement invariant stability check

2. **Integrate into CI**
   - Add npm script for replay checks
   - Add to GitHub Actions workflow
   - Test on current codebase
   - Fix any violations detected

---

# VERIFICATION CHECKLIST

After implementation, verify:
- [ ] All 12 CI checks implemented
- [ ] CI checks run on every push
- [ ] CI checks run on every pull request
- [ ] CI checks fail deterministically
- [ ] CI checks provide sufficient context
- [ ] CI checks include remediation suggestions
- [ ] CI checks are documented
- [ ] CI checks are tested

---

**Document ID:** AUDIT-CONSTITUTIONAL-CI-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
