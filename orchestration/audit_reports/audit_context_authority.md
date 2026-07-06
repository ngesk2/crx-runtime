# Context Authority Report

**File:** `orchestration/execution/context_authority.js` (300 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** 9 invariants covering dependency graph, authority graph, replay graph, historical artifacts, constitutional laws, ADR inclusion, anti-pattern inclusion, duplicate context, and token efficiency.

---

## 1. Dependency Graph

**Verdict: PASS**

**Evidence:**
- Line 40-47: Dependency graph construction
```js
const depGraph = {};
for (const node of fileNodes) {
  depGraph[node.path] = {
    imports: node.requires,
    dependents: node.dependent_modules,
    allDependents: this._collectAllDependents(node, production)
  };
}
```

**Dependency tracking:**
- `imports`: direct imports from node.requires
- `dependents`: direct dependents from node.dependent_modules
- `allDependents`: transitive dependents via BFS (L283-296)

**Determinism:**
- BFS traversal is deterministic (queue order from array)
- Same node set → same dependency graph
- No randomness or external state

**Verdict:** Dependency graph is correctly constructed and deterministic.

---

## 2. Authority Graph

**Verdict: PASS**

**Evidence:**
- Line 49-58: Authority slice construction
```js
const relevantAuthorities = authorities.filter(a =>
  fileNodes.some(n => n.path.includes(a.name.replace('.js', '')))
);

const authSlice = relevantAuthorities.map(a => ({
  name: a.name,
  exports: a.exports,
  path: a.path,
  className: a.classification || 'unknown'
}));
```

**Authority tracking:**
- Filters authorities relevant to target files
- Includes name, exports, path, classification
- Deterministic filtering (string matching)

**Verdict:** Authority graph is correctly constructed and deterministic.

---

## 3. Replay Graph

**Verdict: PASS**

**Evidence:**
- Line 60-66: Replay slice construction
```js
const replaySlice = fileNodes.map(n => ({
  path: n.path,
  replayVisibility: n.replay_visibility,
  witnessScore: n.witness_score,
  entropyScore: n.entropy_score,
  hasAuthority: !!n.authority_owner
}));
```

**Replay tracking:**
- Includes replay visibility, witness score, entropy score
- Authority ownership flag
- Deterministic mapping from file nodes

**Verdict:** Replay graph is correctly constructed and deterministic.

---

## 4. Historical Artifacts

**Verdict: FAIL — wall clock dependency**

**Evidence:**
- Line 237-257: `_findPriorArtifacts()` implementation
```js
_findPriorArtifacts(files, missionType) {
  if (!this._store) return [];
  const artifacts = [];
  for (const file of files) {
    const byFile = this._store.findByFile ? this._store.findByFile(file) : [];
    for (const a of byFile) {
      if (a.type === 'proposal' || a.type === 'analysis' || a.type === 'consensus_proof') {
        artifacts.push({
          id: a.id,
          type: a.type,
          worker_id: a.workerId || a.worker_id,
          mission_id: a.missionId || a.missionId,
          confidence: a.confidence,
          hash: a.hash,
          created_at: a.createdAt || a.created_at
        });
      }
    }
  }
  return artifacts.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 20);
}
```

**Problem:**
- Line 256: Sorts by `created_at` (wall clock timestamp)
- Same artifacts queried at different times produce different order
- Non-deterministic context construction

**Impact:**
- Historical artifact ordering is non-replayable
- Context depends on wall-clock ordering
- Breaks constitutional context determinism

**Remediation:**
- Sort by deterministic field (e.g., artifact ID, sequence number)
- Or remove sorting (order doesn't matter for context)

---

## 5. Constitutional Laws

**Verdict: PASS**

**Evidence:**
- Line 100-109: Canonical laws inclusion
```js
canonical_laws: [
  'Truth = immutable verified event',
  'Authority flows from declared class, not inference',
  'All replay-visible operations must be deterministic',
  'No module creates its own authorities',
  'Every wall-clock access must route through ConstitutionalTimeAuthority',
  'Every hash must route through CanonicalAuthority',
  'Every identity must route through RuntimeIdentityAuthority',
  'Dormant code is constitutional debt until archived'
]
```

**Law inclusion:**
- Hardcoded constitutional laws
- Included in every context
- Deterministic (constant array)

**Verdict:** Constitutional laws are correctly included.

---

## 6. ADR Inclusion

**Verdict: PASS**

**Evidence:**
- Line 259-270: `_findRelevantADRs()` implementation
```js
_findRelevantADRs(files) {
  const relevant = [];
  for (const [adr, patterns] of Object.entries(this._adrIndex)) {
    for (const file of files) {
      if (patterns.some(p => file.includes(p))) {
        relevant.push(adr);
        break;
      }
    }
  }
  return relevant;
}
```

**ADR index:**
- Line 272-281: `_buildADRIndex()` defines pattern mappings
- String matching against file paths
- Deterministic filtering

**Verdict:** ADR inclusion is correct and deterministic.

---

## 7. Anti-Pattern Inclusion

**Verdict: PASS**

**Evidence:**
- Line 68-79: Violation detection
```js
const violations = [];
for (const node of fileNodes) {
  if (node.entropy_score > 0.3) {
    violations.push({ path: node.path, type: 'high_entropy', score: node.entropy_score });
  }
  if (node.witness_score < 0.3 && node.replay_visibility !== 'none') {
    violations.push({ path: node.path, type: 'low_witness', score: node.witness_score });
  }
  if (node.serialization_score < 0.5) {
    violations.push({ path: node.path, type: 'serialization_risk', score: node.serialization_score });
  }
}
```

**Anti-pattern detection:**
- High entropy (>0.3)
- Low witness score (<0.3) with replay visibility
- Low serialization score (<0.5)
- Deterministic threshold checks

**Verdict:** Anti-pattern inclusion is correct and deterministic.

---

## 8. Duplicate Context

**Verdict: PASS**

**Evidence:**
- Line 115-118: Context hash computation
```js
context.context_hash = crypto.createHash('sha256')
  .update(JSON.stringify(context))
  .digest('hex')
  .substring(0, 16);
```

**Duplicate detection:**
- SHA-256 hash of entire context object
- Same context → same hash
- Can detect duplicate context construction

**WARN: Non-deterministic context hash**
- Context includes `generated_at: new Date().toISOString()` (L112)
- Same logical context produces different hash at different times
- Duplicate detection fails across replays

**Impact:**
- Context hash is non-replayable
- Cannot verify context identity across replays

**Remediation:**
- Remove `generated_at` from context before hashing
- Or use deterministic timestamp

---

## 9. Token Efficiency

**Verdict: WARN**

**Evidence:**
- Line 133-235: `buildPrompt()` constructs prompt from context
- Line 224: `const prompt = parts.join('\n');`

**Token analysis:**
- Includes all file slices (unbounded)
- Includes all relevant authorities (unbounded)
- Includes up to 20 prior artifacts (bounded)
- Includes all relevant ADRs (unbounded)
- Includes all violations (unbounded)

**WARN: No token limit enforcement**
- No maximum token count
- No truncation for large contexts
- Could exceed model context window

**Impact:**
- Context could be too large for model
- Token usage is uncontrolled
- May cause model failures or truncation

**Remediation:**
- Add token counting and truncation
- Prioritize context by relevance
- Add max token limit configuration

---

## 10. Additional Constitutional Violations

### 10a. Wall Clock in generated_at

**Verdict: FAIL**

**Evidence:**
- Line 112: `generated_at: new Date().toISOString()`

**Problem:**
- Wall clock timestamp in context
- Same context at different times has different `generated_at`
- Makes context non-deterministic

**Impact:**
- Context is non-replayable
- Context hash includes timestamp (non-deterministic)
- Breaks constitutional context determinism

**Remediation:**
- Remove `generated_at` field
- Or use deterministic timestamp (e.g., mission timestamp)

---

### 10b. Non-Deterministic Context Hash

**Verdict: FAIL**

**Evidence:**
- Line 115-118: Context hash includes entire context object
- Context includes `generated_at` (wall clock)

**Problem:**
- Same logical context produces different hash at different times
- Context hash cannot be used for replay verification

**Impact:**
- Context identity verification fails
- Cannot detect context drift across replays

**Remediation:**
- Remove `generated_at` from context before hashing
- Or use canonical serialization excluding timestamp

---

### 10c. Event Emission Side Effects

**Verdict: WARN**

**Evidence:**
- Line 120-128: `context_built` event emission
- Line 226-232: `prompt_generated` event emission

**Concern:**
- ContextAuthority directly emits events
- Creates side effects in pure context construction
- Replay must replay event emissions

**Impact:**
- Context construction depends on event queue state
- Not pure function

**Remediation:**
- Move event emission to caller (orchestration engine)
- Make context construction pure

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Dependency graph | **PASS** | — | Correct BFS traversal |
| 2. Authority graph | **PASS** | — | Correct filtering and mapping |
| 3. Replay graph | **PASS** | — | Correct replay metadata inclusion |
| 4. Historical artifacts | **FAIL** | CRITICAL | Sorts by `created_at` (wall clock) |
| 5. Constitutional laws | **PASS** | — | Hardcoded laws included |
| 6. ADR inclusion | **PASS** | — | Pattern matching deterministic |
| 7. Anti-pattern inclusion | **PASS** | — | Threshold checks deterministic |
| 8. Duplicate context | **PASS** (WARN) | MEDIUM | Hash includes wall clock |
| 9. Token efficiency | **WARN** | LOW | No token limit enforcement |
| 10. Wall clock violations | **FAIL** | CRITICAL | `new Date().toISOString()` in generated_at |
| 11. Event side effects | **WARN** | MEDIUM | Direct event emission in pure function |

**Overall: FAIL** — 2 CRITICAL violations prevent constitutional context guarantees.

## Immediate Remediation Required

1. **Remove wall clock sort from prior artifacts** (L256)
   - Sort by deterministic field (artifact ID, sequence)
   - Or remove sorting entirely

2. **Remove `new Date().toISOString()` from context** (L112)
   - Remove `generated_at` field
   - Or use deterministic timestamp

3. **Fix context hash determinism** (L115-118)
   - Exclude `generated_at` from hash computation
   - Or use canonical serialization excluding timestamp

4. **Add token limit enforcement** (optional but recommended)
   - Count tokens in prompt
   - Truncate context if exceeds limit
   - Prioritize by relevance
