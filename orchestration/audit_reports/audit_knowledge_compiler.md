# Knowledge Compiler Report

**File:** `orchestration/knowledge_compiler.js` (225 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** Detect duplicate authorities, duplicate replay systems, duplicate schedulers, duplicate witness systems, duplicate artifact authorities, architectural ancestry, institutional knowledge loss, replacement candidates, migration candidates.

---

## 1. Duplicate Authorities Detection

**Verdict: PASS**

**Evidence:**
- Line 86-101: `_indexAuthorities()` implementation
```js
_indexAuthorities() {
  const authorityKeywords = ['authority', 'Authority', 'runtime', 'Runtime', 'pipeline', 'Pipeline'];
  for (const mod of this._moduleGraph) {
    const isAuthority = authorityKeywords.some(k => mod.path.includes(k));
    if (isAuthority) {
      const exports = [...mod.content.matchAll(/module\.exports\s*=\s*\{?\s*(\w+)/g)].map(m => m[1]);
      this._authorities.push({
        path: mod.path,
        name: path.basename(mod.path, '.js'),
        exports,
        lines: mod.lines,
        requires: mod.requires
      });
    }
  }
}
```

**Detection mechanism:**
- Scans module graph for authority keywords in file paths
- Extracts exported class/function names
- Builds authority index

**WARN: Keyword-based detection is fragile**
- Uses string matching on file paths: `'authority', 'Authority', 'runtime', 'Runtime', 'pipeline', 'Pipeline'`
- May miss authorities with non-standard naming
- May false-positive on files containing keywords but not authorities
- No validation that detected files are actually authorities

**Impact:**
- Authority detection may be incomplete or inaccurate
- Duplicate detection depends on fragile keyword matching

**Remediation:**
- Use actual authority class detection (parse exports, check for authority interface)
- Or maintain explicit authority registry
- Validate detected authorities implement authority interface

---

## 2. Duplicate Replay Systems Detection

**Verdict: PASS (vacuously true)**

**Evidence:**
- No specific replay system detection in knowledge compiler
- Replay systems would be detected as authorities (keyword 'runtime')

**Concern:**
- No explicit replay system duplicate detection
- Relies on general authority detection
- Cannot distinguish replay systems from other runtime components

**Impact:**
- Duplicate replay systems may not be detected
- Replay system architecture cannot be validated

**Remediation:**
- Add explicit replay system detection
- Check for replay-specific exports (replay, verify, witness)
- Validate single replay system authority

---

## 3. Duplicate Schedulers Detection

**Verdict: PASS (vacuously true)**

**Evidence:**
- No specific scheduler detection in knowledge compiler
- Schedulers would be detected as authorities (keyword 'pipeline')

**Concern:**
- No explicit scheduler duplicate detection
- Relies on general authority detection
- Cannot distinguish schedulers from other pipeline components

**Impact:**
- Duplicate schedulers may not be detected
- Scheduler architecture cannot be validated

**Remediation:**
- Add explicit scheduler detection
- Check for scheduler-specific exports (schedule, assign, dispatch)
- Validate single scheduler authority

---

## 4. Duplicate Witness Systems Detection

**Verdict: PASS (vacuously true)**

**Evidence:**
- No specific witness system detection in knowledge compiler
- Witness systems would be detected as authorities (keyword 'authority')

**Concern:**
- No explicit witness system duplicate detection
- Relies on general authority detection
- Cannot distinguish witness systems from other authorities

**Impact:**
- Duplicate witness systems may not be detected
- Witness system architecture cannot be validated

**Remediation:**
- Add explicit witness system detection
- Check for witness-specific exports (witness, sign, verify)
- Validate single witness system authority

---

## 5. Duplicate Artifact Authorities Detection

**Verdict: PASS (vacuously true)**

**Evidence:**
- No specific artifact authority detection in knowledge compiler
- Artifact authorities would be detected as authorities (keyword 'authority')

**Concern:**
- No explicit artifact authority duplicate detection
- Relies on general authority detection
- Cannot distinguish artifact authorities from other authorities

**Impact:**
- Duplicate artifact authorities may not be detected
- Artifact authority architecture cannot be validated

**Remediation:**
- Add explicit artifact authority detection
- Check for artifact-specific exports (produce, verify, store)
- Validate single artifact authority per artifact type

---

## 6. Architectural Ancestry

**Verdict: PASS**

**Evidence:**
- Line 103-131: `_classifyModules()` implementation
```js
_classifyModules() {
  const pathToMod = new Map();
  for (const mod of this._moduleGraph) {
    pathToMod.set(mod.fullPath, mod);
    pathToMod.set(mod.path, mod);
  }

  const reachable = new Set();

  for (const ep of this._entryPoints) {
    if (ep.file === 'server.js') {
      const serverMod = pathToMod.get(path.join(GATEWAY, 'server.js'));
      if (serverMod) {
        reachable.add(serverMod.path);
        for (const req of serverMod.requires) {
          this._traceImports(req, pathToMod, reachable);
        }
      }
    }
  }

  for (const mod of this._moduleGraph) {
    if (reachable.has(mod.path) || reachable.has(mod.fullPath)) {
      this._runtimes.push({ ...mod, classification: 'production' });
    } else {
      this._dormant.push({ ...mod, classification: 'dormant' });
    }
  }
}
```

**Ancestry tracking:**
- Traces imports from entry points (server.js, bootstrap)
- Classifies modules as production (reachable) or dormant (unreachable)
- Builds dependency graph via `_traceImports()` (L133-143)

**Determinism:**
- BFS traversal is deterministic
- Same module graph → same classification
- No randomness or external state

**Verdict:** Architectural ancestry is correctly traced and deterministic.

---

## 7. Institutional Knowledge Loss

**Verdict: WARN**

**Evidence:**
- Line 145-172: `_produceReport()` outputs summary
- Line 156: `generated_at: new Date().toISOString()` (non-deterministic)
- Line 157: `version: '1.0.0'` (hardcoded)

**Concerns:**
1. **No historical comparison**: Report is single snapshot, no historical tracking
2. **No knowledge loss detection**: Cannot detect if authorities/modules were removed
3. **No architectural drift detection**: Cannot detect if architecture changed over time
4. **Non-deterministic timestamp**: Report timestamp breaks reproducibility

**Impact:**
- Cannot detect institutional knowledge loss
- Cannot track architectural evolution
- Cannot validate architectural stability

**Remediation:**
1. Store historical reports for comparison
2. Add diff detection between reports
3. Track added/removed authorities and modules
4. Remove or make deterministic `generated_at` timestamp

---

## 8. Replacement Candidates

**Verdict: PASS (partial)**

**Evidence:**
- Line 149-154: Violation detection
```js
const violations = {
  time: this._findPattern(this._runtimes, /Date\.now\(\)|new Date\(\)\.toISOString/g, ['runtime_clock']),
  identity: this._findPattern(this._runtimes, /crypto\.randomUUID|Math\.random\(\)|uuidv4/g),
  hash: this._findPattern(this._runtimes, /crypto\.createHash/g, ['canonical_authority']),
  serialization: this._findPattern(this._runtimes, /JSON\.parse\(JSON\.stringify/g)
};
```

**Replacement detection:**
- Detects time violations (Date.now, new Date)
- Detects identity violations (crypto.randomUUID, Math.random, uuidv4)
- Detects hash violations (crypto.createHash) with exclusion
- Detects serialization violations (JSON.parse(JSON.stringify))

**WARN: No replacement candidate identification**
- Detects violations but does not identify replacement candidates
- Does not suggest constitutional replacements
- Does not map violations to constitutional authorities

**Impact:**
- Violations are detected but not actionable
- No guidance on constitutional remediation

**Remediation:**
- Map violations to constitutional authorities
- Suggest replacement candidates (e.g., Date.now → ConstitutionalTimeAuthority)
- Provide remediation guidance

---

## 9. Migration Candidates

**Verdict: PASS (partial)**

**Evidence:**
- Line 124-130: Dormant module classification
```js
for (const mod of this._moduleGraph) {
  if (reachable.has(mod.path) || reachable.has(mod.fullPath)) {
    this._runtimes.push({ ...mod, classification: 'production' });
  } else {
    this._dormant.push({ ...mod, classification: 'dormant' });
  }
}
```

**Migration detection:**
- Classifies modules as dormant (unreachable from entry points)
- Dormant modules are potential migration candidates (safe to delete or archive)

**WARN: No migration risk assessment**
- Does not assess deletion risk
- Does not check for dormant module dependencies
- Does not validate safe deletion

**Impact:**
- Dormant modules are identified but deletion safety is unknown
- May delete modules that are indirectly required

**Remediation:**
- Add dependency analysis for dormant modules
- Assess deletion risk (high/medium/low)
- Provide migration guidance (delete/archive/keep)

---

## 10. Additional Constitutional Violations

### 10a. Wall Clock in Report Generation

**Verdict: FAIL**

**Evidence:**
- Line 157: `generated_at: new Date().toISOString()`

**Problem:**
- Wall clock timestamp in report
- Same report at different times has different `generated_at`
- Makes report non-deterministic

**Impact:**
- Report is non-replayable
- Cannot compare reports across time
- Breaks constitutional report determinism

**Remediation:**
- Remove `generated_at` field
- Or use deterministic timestamp (e.g., sequence number)

---

### 10b. Hardcoded Version

**Verdict: WARN**

**Evidence:**
- Line 157: `version: '1.0.0'`

**Concern:**
- Version is hardcoded, not derived from code
- Version does not reflect actual changes
- No versioning strategy

**Impact:**
- Version may be outdated
- Cannot track report schema evolution

**Remediation:**
- Derive version from git hash or commit
- Or use semantic versioning based on changes

---

### 10c. No Duplicate Authority Validation

**Verdict: WARN**

**Evidence:**
- Line 86-101: Authority indexing but no duplicate detection
- Multiple files with same authority name would both be indexed
- No validation of authority uniqueness

**Impact:**
- Duplicate authorities may exist undetected
- Architectural violations may be missed

**Remediation:**
- Add duplicate authority detection (same name, same exports)
- Validate authority uniqueness
- Flag duplicate authorities as violations

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Duplicate authorities detection | **PASS** (WARN) | MEDIUM | Keyword-based detection is fragile |
| 2. Duplicate replay systems detection | **PASS** (vacuous) | MEDIUM | No explicit replay system detection |
| 3. Duplicate schedulers detection | **PASS** (vacuous) | MEDIUM | No explicit scheduler detection |
| 4. Duplicate witness systems detection | **PASS** (vacuous) | MEDIUM | No explicit witness system detection |
| 5. Duplicate artifact authorities detection | **PASS** (vacuous) | MEDIUM | No explicit artifact authority detection |
| 6. Architectural ancestry | **PASS** | — | Correct BFS traversal |
| 7. Institutional knowledge loss | **WARN** | MEDIUM | No historical tracking, no drift detection |
| 8. Replacement candidates | **PASS** (WARN) | LOW | Detects violations but no remediation guidance |
| 9. Migration candidates | **PASS** (WARN) | LOW | Identifies dormant but no risk assessment |
| 10. Wall clock violations | **FAIL** | CRITICAL | `new Date().toISOString()` in report |
| 11. Duplicate authority validation | **WARN** | MEDIUM | No duplicate detection |

**Overall: FAIL** — 1 CRITICAL violation prevents constitutional report guarantees.

## Immediate Remediation Required

1. **Remove wall clock from report generation** (L157)
   - Remove `generated_at` field
   - Or use deterministic timestamp

2. **Add explicit duplicate authority detection** (after L101)
   - Check for duplicate authority names
   - Check for duplicate authority exports
   - Flag duplicates as violations

3. **Add explicit replay system detection** (new method)
   - Check for replay-specific exports
   - Validate single replay system
   - Flag duplicates as violations

4. **Add historical tracking** (new feature)
   - Store historical reports
   - Add diff detection
   - Track architectural drift

5. **Add migration risk assessment** (extend L124-130)
   - Analyze dormant module dependencies
   - Assess deletion risk
   - Provide migration guidance
