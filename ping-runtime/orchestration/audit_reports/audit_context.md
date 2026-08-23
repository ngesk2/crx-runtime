# Audit: context_authority.js — Constitutional Context Authority

**File**: C:\Users\nolan\PING\orchestration\execution\context_authority.js
**Lines**: 298 (excluding blank/comments)
**Class**: ContextAuthority
**Exports**: { ContextAuthority }
**Dependencies**: crypto (Node.js built-in)
**Audit date**: 2026-07-04

---

## Verification Summary

| # | Check | Verdict | Severity |
|---|-------|---------|----------|
| 1 | Deterministic context bundles | **PASS** (but method is **NEVER CALLED**) | 🔴 CRITICAL |
| 2 | 8-layer context present | **PASS** (9 layers, all populated) | ✅ OK |
| 3 | ADR index populated | **PARTIAL** (hardcoded, not file-based) | 🟡 MEDIUM |
| 4 | Anti-pattern inclusion | **FAIL** (hardcoded thresholds, no historical data) | 🟡 MEDIUM |
| 5 | Token efficiency | **FAIL** (no truncation, no token budget) | 🟡 MEDIUM |
| 6 | Duplicate context across slices | **FAIL** (overlapping data in 4 slices) | 🟡 MEDIUM |
| 7 | Deterministic context hash | **BROKEN** (hash includes its own 
ull field) | 🟠 HIGH |
| 8 | Usage in engine.js | **DORMANT** (instantiated but method never called) | 🔴 CRITICAL |
| 9 | Event emission | **PASS** (events emitted correctly) | ✅ OK |
| 10 | Error handling | **FAIL** (no error isolation between slices) | 🟠 HIGH |

---

## 1. Deterministic Context Bundles

### Method: uildContext(mission, workerId) (lines 11-130)

**Verdict: DETERMINISTIC — but NEVER CALLED**

- No Math.random() calls ✓
- No Date.now() calls ✓
- All inputs are from:
  - mission.files — deterministic array
  - 	his._graph.getNode() — read-only, deterministic
  - 	his._graph.getProductionNodes() — read-only, deterministic
  - 	his._graph.getDormantNodes() — read-only, deterministic
  - 	his._graph.getAuthorities() — read-only, deterministic
  - 	his._graph._edges — read-only, deterministic (but accesses private member — see below)
  - workerId — deterministic input
  - 	his._adrIndex — hardcoded static map
  - 	his._store.findByFile() — deterministic (artifact store with deterministic IDs)
  - 	his._findPriorArtifacts() — deterministic sorting, capped at 20
  - crypto.createHash('sha256') — deterministic by definition

**Non-determinism risk**: The method itself has no non-deterministic sources. However, it accesses 	his._graph._edges (line 23) which is a **private property** (_edges). This is fragile — if the graph implementation ever changes the internal storage format, this access breaks silently.

### Method: uildPrompt(mission, context, workerMemory) (lines 132-233)

**Verdict: DETERMINISTIC**

- All inputs are deterministic objects
- No Math.random() or Date.now() ✓
- Uses crypto.createHash('sha256') for hash ✓

### Critical Finding: uildContext is NEVER CALLED

In engine.js, line 204:
`javascript
const context = this._artifactRouter.buildWorkerContext(mission, workerId);
`

The ContextAuthority.buildContext() method is **never invoked from anywhere**. The ArtifactRouter.buildWorkerContext() (in rtifact_router.js) is used instead. The ContextAuthority is instantiated at engine.js:76 but only its existence is checked as a boolean flag at line 628:

`javascript
if (this._contextAuth && this._eventQueue) {
    // emits worker_progress - does NOT call contextAuth.buildContext()
`

This means:
- ContextAuthority.buildContext = dead code (298 lines of dead code unless independently tested)
- ContextAuthority.buildPrompt = dead code (same class, never instantiated for its methods)
- The actual context building is done by ArtifactRouter.buildWorkerContext() (213 lines in rtifact_router.js)

**Both classes have near-identical code** — ArtifactRouter.buildWorkerContext (lines 9-113) and ContextAuthority.buildContext (lines 11-130) share the same algorithm, same data access patterns, same violation detection thresholds, same canonical laws. Code duplication of ~100 lines.

---

## 2. 8-Layer Context (Actually 9)

The uildContext method returns a context object with the following layers:

| Layer | Field | Populated? | Contents |
|-------|-------|------------|----------|
| Mission | mission | ✅ | id, type, target, description, priority |
| Repository | epository_slice | ✅ | Counts: production, dormant, total nodes, authorities, edges |
| Files | ile_slice | ✅ | Per-file: path, lines, exports, requires, classification, owner, scores |
| Dependency Graph | dependency_graph | ✅ | Per-file: imports, dependents, allDependents (recursive BFS) |
| Authority | uthority_slice | ✅ | Relevant authorities (filtered by file path match) |
| Replay | eplay_slice | ✅ | Per-file: replayVisibility, witnessScore, entropyScore, hasAuthority |
| Prior Artifacts | prior_artifacts | ✅ | Past artifacts from artifact store (sorted, capped at 20) |
| ADRs | elevant_adrs | ⚠️ | String array of matched ADR topic names (see Section 3) |
| Violations | known_violations | ✅ | Computed from entropy/witness/serialization thresholds |
| Canonical Laws | canonical_laws | ✅ | 8 hardcoded constitutional law strings |

All 8+1 layers are present. Every field on the context object is populated.

However, the ArtifactRouter.buildWorkerContext() (the one actually used in production) omits THREE layers:
- prior_artifacts ❌
- elevant_adrs ❌
- canonical_laws (has it, but identical set) ⚠️

So the production pipeline is **missing prior artifacts, ADR references, and separate canonical_laws** — the ContextAuthority has them but is never called.

---

## 3. ADR Index

### _buildADRIndex() (lines 271-280)

The ADR index is a **hardcoded static map** of 6 topic-to-keyword mappings:

`javascript
{
  'constitutional-time-enforcement': ['time', 'clock', 'timestamp', 'Date'],
  'hash-authority-collapse': ['hash', 'sha256', 'crypto', 'digest'],
  'replay-determinism': ['replay', 'deterministic', 'reproducible'],
  'event-sourcing': ['event', 'event_id', 'causation', 'correlation'],
  'authority-registry': ['authority', 'adapter', 'constitutional'],
  'worker-port': ['worker', 'orchestration', 'schedule']
}
`

### _findRelevantADRs(files) (lines 258-269)

- Iterates over hardcoded ADR index entries
- For each file path in the mission, checks if any keyword pattern is a substring
- Returns **string topic names** (e.g., 'constitutional-time-enforcement')

### ⚠️ Bug: ADR objects expected but strings returned

In uildPrompt (lines 165-173):
`javascript
for (const adr of context.relevant_adrs) {
    parts.push(  );        // undefined — adr is a string!
    parts.push(    Decision: ); // undefined
    parts.push(    Status: );     // undefined
}
`

Since _findRelevantADRs returns an Array<string> (topic name strings), accessing .title, .decision, .status on a string yields undefined. JavaScript does not throw (primitive wrapping), but the output will be:
`
--- RELEVANT ADRs ---
  undefined
    Decision: undefined
    Status: undefined
`

This makes the ADR section in the prompt **useless**.

### ADR Index vs. Actual ADR Files

The repo contains 12 ADR files:
- C:\Users\nolan\PING\docs\adr_001_execution_plan_authority.md (528 lines)
- C:\Users\nolan\PING\docs\adr_002_replay_authority.md (562 lines)
- C:\Users\nolan\PING\docs\adr_003_policy_authority.md
- C:\Users\nolan\PING\docs\adr_004_capability_abstraction.md
- C:\Users\nolan\PING\docs\adr\ADR-000X-REPLAY-IDENTITY-CONSTITUTIONAL-FREEZE.md (392 lines)
- C:\Users\nolan\PING\docs\adr\ADR-000Y-REPLAY-COMMITMENT-CERTIFICATION-PROTOCOL.md
- C:\Users\nolan\PING\constitutional-compiler\adr\ADR-0001-*.md through ADR-0005-*.md

**The ADR index does NOT read any of these files.** It is a hardcoded keyword map. Even if it did read them, the topic-to-keyword matching is file-name-based only — it matches context_authority.js against keyword 'authority' and returns topic 'authority-registry', but never loads the actual ADR content.

**Recommendation**: Either:
1. Remove ADR layer entirely (it's unused in production and broken)
2. Fix to actually load ADR file contents and match by topic metadata

---

## 4. Anti-Pattern / Violation Detection

### Source: lines 68-79

Violations are computed **on-the-fly** from per-node scores using hardcoded thresholds:

| Violation Type | Condition | Threshold |
|---------------|-----------|-----------|
| high_entropy | 
ode.entropy_score > 0.3 | 0.3 |
| low_witness | 
ode.witness_score < 0.3 && node.replay_visibility !== 'none' | 0.3 |
| serialization_risk | 
ode.serialization_score < 0.5 | 0.5 |

**Findings:**

1. **No historical anti-pattern data**: Violations are recomputed fresh each call. There is no tracking of which violations were previously identified, fixed, accepted, or rejected. No anti-pattern database.

2. **Hardcoded thresholds**: All three thresholds (0.3, 0.3, 0.5) are magic numbers. No configuration, no justification comments.

3. **Identical in rtifact_router.js**: The exact same violation detection logic with the exact same thresholds appears in rtifact_router.js lines 65-76. Duplicated code.

4. **Limited scope**: Only entropy, witness, and serialization risks are checked. No detection of:
   - Direct Date.now() usage
   - Direct crypto.createHash() bypasses
   - Direct Math.random() usage
   - Authority bypass patterns
   - Subprocess spawning
   - Non-constant-time operations

**Contrast with engine.js mission compiler**: The mission_compiler.js DOES scan for Date.now(), Math.random(), and crypto.createHash bypasses using regex (lines 200-202). The context authority does not use this richer violation data.

---

## 5. Token Efficiency

### uildPrompt output structure

The prompt is built by joining parts with \n. Estimated size:

| Section | Size estimate |
|---------|--------------|
| Mission header | ~4 lines |
| Target files | ~N × 1 line (N = file count, potentially 50+) |
| Applicable authorities | ~A × 1 line (A = authority count, potentially 20+) |
| Prior artifacts | ~5 × 1 line (capped at last 5) |
| Relevant ADRs | ~3 × R lines (R = matched ADRs, but outputs undefined) |
| Known violations | ~V × 1 line (V = violation count) |
| Constitutional constraints | 8 lines |
| Absolute prohibitions | 4 lines |
| Worker memory | ~M lines (variable, unbounded) |
| Required output schema | ~20-30 lines |

**No truncation or token budget**: The prompt has no maximum token limit. With 50 files, 20 authorities, 30 violations, and a large worker memory, the prompt could exceed 8K-16K tokens easily. The workerMemory parameter (line 195-198) is injected verbatim with no size cap.

**Comparison with rtifact_router.js**: The rtifact_router.buildPrompt() is shorter (omits ADRs and prior artifacts), but still has no truncation.

**Prior artifacts**: _findPriorArtifacts caps at 20, and uildPrompt shows only the last 5. This is good.

---

## 6. Duplicate Context Across Slices

The same data appears in multiple slices:

1. **ile_slice + dependency_graph**: Both contain per-file data with path as key. dependency_graph adds import/dependent relationships but also duplicates the file path.

2. **ile_slice + eplay_slice**: Both contain per-file path, entropy_score, witness_score, eplay_visibility data. For N files, these are N duplicate rows.

3. **dependency_graph + ile_slice.dependent_modules**: The dependent_modules field appears in both ile_slice (as a node property) and dependency_graph (as computed transitive closure). The transitive closure in dependency_graph (llDependents) does add new information via BFS, but the direct dependents are duplicated.

4. **uthority_slice overlaps with ile_slice.authority_owner**: Authority ownership is already encoded per-file in ile_slice, then repeated in uthority_slice as separate entries.

In a production context builder (like ArtifactRouter which IS used), the slices are separate but overlapping. In the dead ContextAuthority, it's the same. For a mission with 30 files, expect 60-90 lines of repeated data in the prompt.

---

## 7. Deterministic Context Hash

### uildContext hash computation (lines 114-117):

`javascript
context.context_hash = crypto.createHash('sha256')
    .update(JSON.stringify(context))
    .digest('hex')
    .substring(0, 16);
`

**Bug: Hash includes its own 
ull value.**

At line 111, context_hash is initialized to 
ull:
`javascript
context_hash: null
`

Then at line 114, JSON.stringify(context) is called — but context.context_hash is still 
ull at stringify time because the hash is computed **after** it's already in the object. So the hash input includes "context_hash":null. This means:
- The hash is deterministic (same input → same output) ✓
- But the hash wraps itself, creating a circular dependency in the hash chain
- The 16-char truncation (substring 0, 16) loses 50% of the hash entropy

**Compare with event_queue.js** (line 75): Event IDs use SHA-256 truncated to 16 chars, but the hash input does NOT include the hash itself.

**Compare with rtifact_router.js**: No hash is computed in uildWorkerContext — it has a generated_at: new Date().toISOString() timestamp instead (non-deterministic).

---

## 8. Usage in engine.js

### Instantiation (engine.js line 76):
`javascript
this._contextAuth = new ContextAuthority(this._graph, this._artifactStore, this._eventQueue);
`

This is the **only reference** to ContextAuthority in engine.js. The constructor takes:
- intelligenceGraph — shared graph instance
- rtifactStore — shared artifact store
- eventQueue — shared event queue

### Method invocations: **ZERO**

Searching engine.js for any call to uildContext or uildPrompt on _contextAuth:
`
grep result: 0 matches for _contextAuth.build
`

### Actual context building (engine.js line 204):
`javascript
const context = this._artifactRouter.buildWorkerContext(mission, workerId);
`

**ArtifactRouter is the real context builder**, not ContextAuthority. The ContextAuthority instance sits unused — it's only checked for truthiness at line 628 as a proxy for "is the engine initialized".

### Dead code classification

| Metric | Value |
|--------|-------|
| Lines in ContextAuthority | 298 |
| Lines in uildContext | 120 |
| Lines in uildPrompt | 102 |
| Lines in private helpers | 66 |
| Times uildContext is called | **0** |
| Times uildPrompt is called | **0** |
| Code path | **DORMANT / DEAD** |

### Duplicate effort

The ArtifactRouter.buildWorkerContext() (213 lines) is **structurally identical** to ContextAuthority.buildContext() (120 lines). Both:
- Read graph.getNode(), getProductionNodes(), getDormantNodes(), getAuthorities()
- Build epoSlice, ileSlice, depGraph, uthSlice, eplaySlice
- Collect known_violations with identical logic
- Include the same 8 canonical laws
- Emit context_built events

Differences:

| Feature | ArtifactRouter | ContextAuthority |
|---------|-----------------|-------------------|
| generated_at timestamp | 
ew Date().toISOString() (non-deterministic) | None |
| Context hash | None | SHA-256 (flawed, see §7) |
| prior_artifacts | Missing | Present |
| elevant_adrs | Missing | Present (broken, see §3) |
| canonical_laws | Same 8 laws | Same 8 laws |
| Event emission | context_built with 4 fields | context_built with 5 fields |
| Used in production | **YES** (engine.js:204) | **NO** |

---

## 9. Event Emission

### context_built (lines 119-127):
`javascript
this._events.emit('context_built', {
    missionId: mission.id,
    workerId,
    fileCount: fileNodes.length,
    violationCount: violations.length,
    contextHash: context.context_hash
});
`

**Verdict: CORRECT FORMAT**

- Event type 'context_built' is registered in event_queue.js valid types list (line 33) ✓
- Event Queue deduplicates by SHA-256 hash of event data ✓
- Emits 5 fields including context hash ✓
- Null-guarded: if (this._events) before emission ✓

### prompt_generated (lines 225-231):
`javascript
this._events.emit('prompt_generated', {
    missionId: mission.id,
    promptLength: prompt.length,
    promptHash: crypto.createHash('sha256').update(prompt).digest('hex')
});
`

**Verdict: CORRECT FORMAT**

- Event type 'prompt_generated' is registered ✓
- Null-guarded ✓
- Hash is the full SHA-256 digest (not truncated to 16 chars) ✓
- promptLength allows tracking prompt size growth ✓

### ⚠️ Event duplication risk

Since ContextAuthority and ArtifactRouter both emit context_built and prompt_generated events:
- If both classes ever ran for the same mission, events would be **deduplicated** by EventQueue's SHA-256 hash check (line 77-79 of event_queue.js), because the event data differs (different fields in context_built, different prompt content).
- Currently safe because ContextAuthority is never called.

---

## 10. Error Handling

### No error isolation between slices

The uildContext method (lines 11-130) performs 8 operations sequentially with **zero try-catch blocks**:

| Operation | Lines | Failure Risk |
|-----------|-------|-------------|
| iles.map(f => this._graph.getNode(f)) | 13 | LOW (graph read) |
| 	his._graph._edges (private property access) | 23 | **MEDIUM** — _edges is private; if removed, throws TypeError |
| ileNodes.map(n => {...}) for fileSlice | 26-38 | LOW (node property access) |
| _collectAllDependents(node, production) | 45 | LOW (node property access) |
| uthorities.filter(...) for authSlice | 49-58 | LOW |
| Violation detection loop | 68-79 | LOW |
| _findPriorArtifacts(files, mission.type) | 81 | LOW |
| _findRelevantADRs(files) | 82 | LOW |
| JSON.stringify(context) | 115 | LOW |
| crypto.createHash('sha256') | 114 | LOW (built-in) |
| 	his._events.emit(...) | 120 | LOW (null-guarded) |

**If ANY slice throws, the ENTIRE context build fails.** There is no partial context, no fallback, no slice isolation. A failure in dependency_graph (which uses recursive BFS — potential infinite loop on cyclic dependencies) would prevent the entire context from being built.

### Missing defenses:
- No try-catch around _collectAllDependents (line 45) — could throw if dependent_modules contains circular references (BFS uses a Set but queue could grow unbounded)
- No try-catch around graph private member access (line 23)
- No null-checks on node properties (e.g., 
ode.requires, 
ode.dependent_modules — could be undefined)
- No try-catch around _findPriorArtifacts which calls 	his._store.findByFile (could throw if store is corrupted)
- No sentinel/fallback values for any slice

### Contrast with rtifact_router.js:
Same problem — also no error handling anywhere.

---

## Overall Assessment

### State: DORMANT / REDUNDANT

ContextAuthority is a fully implemented context builder that **is never called**. The production path uses ArtifactRouter instead. The two classes share ~100 lines of identical code.

### Bugs Found

| # | Bug | Severity | Affects |
|---|-----|----------|---------|
| 1 | uildContext never called — 298 lines of dead code | 🔴 CRITICAL | All |
| 2 | ADR display prints undefined (strings expected as objects) | 🟠 HIGH | uildPrompt (if called) |
| 3 | Context hash includes its own 
ull field | 🟠 HIGH | uildContext hash |
| 4 | Private member _edges accessed directly | 🟡 MEDIUM | uildContext |
| 5 | No error isolation — single throw fails all slices | 🟠 HIGH | uildContext |
| 6 | No truncation/ token budget in prompt | 🟡 MEDIUM | uildPrompt |
| 7 | Duplicate data across 4 slices | 🟡 LOW | uildContext |
| 8 | Hardcoded magic thresholds for violation detection | 🟢 INFO | uildContext |

### Recommendations

1. **Either use it or remove it**: ContextAuthority should be either (a) wired into engine.js in place of ArtifactRouter.buildWorkerContext, or (b) removed to eliminate dead code and duplication. Current state (instantiated, never called) is the worst of both worlds.

2. **If kept, fix the ADR bug**: _findRelevantADRs returns strings; uildPrompt expects objects. Either change the method to return objects with .title, .decision, .status, or change the prompt to display strings directly.

3. **If kept, fix the hash**: Compute the hash before adding context_hash to the context object, or remove the context_hash field before stringification.

4. **If kept, add error isolation**: Wrap each slice computation in try-catch with fallback values (e.g., empty array for file_slice, zero for counts).

5. **If kept, add token budget**: Cap total prompt length at 32K or 64K characters, with a truncation strategy (e.g., keep file_slice + canonical_laws, drop verbose slices first).

6. **Resolve duplication**: Consolidate ContextAuthority.buildContext and ArtifactRouter.buildWorkerContext into a single method with all features (prior_artifacts, ADRs, hash, canonical_laws). Currently ArtifactRouter is the production path but lacks 3 layers that ContextAuthority has.

---

## Appendix A: File Metrics

| Metric | Value |
|--------|-------|
| Total lines | 298 |
| Blank lines | ~15 |
| Comment lines | 0 |
| Code lines | ~283 |
| Number of methods | 6 (buildContext, buildPrompt, _findPriorArtifacts, _findRelevantADRs, _buildADRIndex, _collectAllDependents) |
| Imports | 1 (crypto) |
| Export | { ContextAuthority } |

## Appendix B: Call Graph

`
engine.js
  constructor()
    → new ContextAuthority(graph, store, eventQueue)  [INSTANTIATED, NEVER USED]
    → new ArtifactRouter(graph, eventQueue)            [USED for context building]

  dispatchToAssignment()
    → this._artifactRouter.buildWorkerContext()        [ACTUAL CONTEXT]
    → this._artifactRouter.buildPrompt()               [ACTUAL PROMPT]
    → this._contextAuth                                 [CHECKED AS BOOLEAN FLAG ONLY]
`

## Appendix C: Duplication Analysis

Both ContextAuthority (CA) and ArtifactRouter (AR) implement the same context-building logic:

| Code Section | CA Lines | AR Lines | Identical? |
|-------------|----------|----------|------------|
| File node resolution | 12-13 | 10-11 | ✅ |
| repoSlice construction | 18-24 | 16-22 | ✅ |
| fileSlice construction | 26-38 | 24-36 | ✅ |
| depGraph construction | 40-47 | 38-45 | ✅ |
| authSlice construction | 49-58 | 47-55 | ✅ (CA adds className) |
| replaySlice construction | 60-66 | 57-63 | ✅ |
| Violation detection | 68-79 | 65-76 | ✅ |
| canonical_laws | 100-109 | 92-101 | ✅ identical 8 laws |
| context object assembly | 84-129 | 78-113 | ❌ CA adds prior_artifacts, ADRs, hash; AR adds generated_at |
| buildPrompt | 132-233 | 116-195 | ❌ CA adds ADR block (broken) + requires output JSON; AR simpler |
| _collectAllDependents | 282-295 | 197-210 | ✅ identical BFS |
| Event emission | 119-127, 225-231 | 106-111, 188-192 | ❌ CA adds contextHash, promptHash |

---

*End of audit. 298 lines reviewed, 8 findings (1 critical, 2 high, 3 medium, 1 low, 1 info).*
