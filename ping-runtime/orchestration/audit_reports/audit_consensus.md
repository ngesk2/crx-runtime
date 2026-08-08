# Audit Report: orchestration/execution/consensus_engine.js

**File**: C:\Users\nolan\PING\orchestration\execution\consensus_engine.js (164 lines)
**Audit date**: 2026-07-04
**Previous audit status**: STALE — previous version of this file (now overwritten) was audited against a pre-Phase-39 build containing 	his._events.emit(), 	his._decisions.push(), and 
ew Date().toISOString(). Those calls have all been removed. This is the fresh, accurate audit of the current file.

---

## Summary

| Invariant | Verdict |
|-----------|---------|
| 1. Pure computation — zero side effects | PASS |
| 2. Deterministic decisionId — no Date.now() | PASS |
| 3. Deterministic ordering — stable computation | PASS |
| 4. Confidence weighting — consistent thresholds | WARN |
| 5. Conflict resolution — sharedFindings correctness | PASS |
| 6. Artifact compatibility — ConsensusArtifact fields | WARN |
| 7. Historical replay — deterministic across repeats | PASS |
| 8. Edge cases — empty/single/zero/contradictory | PASS |

**2 WARNS, 6 PASSES. No FAILS.** Both WARNS are non-blocking.

---

## Invariant 1: Pure computation — zero side effects

**Requirement**: No fs.write, .emit(), or any external mutation in any method.

**Examination of all 9 methods**:

| Method | Lines | Side effects? | Evidence |
|--------|-------|--------------|----------|
| constructor() | 4-7 | None | this._events stored but never read. this._decisions initialized but never written (dead storage). |
| evaluate() | 9-19 | None | Conditional dispatch, returns decision object. |
| _singleWorkerDecision() | 21-39 | None | Pure construction of decision object. |
| _multiWorkerConsensus() | 41-105 | None | Pure local Map, Set, array operations. Returns decision. |
| _computeAgreement() | 107-120 | None | Pure math. |
| _outputsAgree() | 122-128 | None | Pure Set operations. |
| _mergeFindings() | 130-141 | None | Local Map, returns Array.from(seen.values()). |
| _findingKey() | 143-145 | None | Template literal concatenation. |
| _noConsensus() | 147-161 | None | Pure construction of decision object. |

**Key evidence**:
- Zero this._events.emit() calls anywhere. Phase 39 removal confirmed.
- Zero this._decisions.push() calls. That array is dead storage.
- No require('fs'), require('child_process'), require('net').
- No Math.random(), no Date.now(), no performance.now().

All 9 methods are pure computations. They take inputs and return a decision object.

**Verdict: PASS** — Zero side effects.

---

## Invariant 2: Deterministic decisionId — no Date.now()

**Requirement**: decisionId must be purely a function of deterministic inputs, not wall-clock time.

### _noConsensus — Line 157
sha256(mission.id + reason).substring(0, 12)
- Inputs: mission.id (deterministic) + reason (deterministic string).
- No Date.now(), no Math.random().
- **PASS**

### _singleWorkerDecision — Line 35
sha256(mission.id + JSON.stringify(output)).substring(0, 12)
- Inputs: mission.id + JSON.stringify(output).
- JSON.stringify is deterministic for same object. Outputs are programmatically constructed.
- No Date.now(), no Math.random().
- **PASS**

### _multiWorkerConsensus — Line 101
sha256(mission.id + sortedWorkerIds + JSON.stringify(confidences)).substring(0, 12)
- Inputs: mission.id + sorted worker ID array + JSON confidence array.
- .sort() on strings is deterministic (lexicographic, stable).
- No Date.now(), no Math.random().
- **PASS**

**Design observation**: multi-worker decisionId does not include findings content. Two replays with same mission, workers, and confidences but different findings produce the same decisionId. For replay determinism (same inputs -> same outputs) this is fine. For artifact deduplication, consider adding a findings hash.

**Verdict: PASS** — No Date.now() or Math.random() anywhere. All three decisionId formulas are deterministic.

---

## Invariant 3: Deterministic ordering — stable computation

**Requirement**: Given identical inputs (same mission, same workerOutputs array in same order), all computations must produce identical results.

| Component | Lines | Determinism analysis |
|-----------|-------|---------------------|
| confidence / avgConfidence | 22, 42 | Arithmetic on numbers. Deterministic. |
| variance, stdDev | 44-45 | sum((c-avg)^2)/n, Math.sqrt. IEEE 754, cross-platform identical. |
| findingsMap (Map) | 47-57 | Insertion order = outputs array order. Same array -> same map. Deterministic. |
| sharedFindings array | 59-68 | Iterates findingsMap. Only .length used. Deterministic. |
| _computeAgreement() | 107-120 | Set of finding keys. Only .size used. Deterministic. |
| _outputsAgree() | 122-128 | Set intersection/union. Only .size used. Deterministic. |
| _mergeFindings() | 130-141 | Map dedup; equal confidence keeps first. Deterministic for same array order. |
| _findingKey() | 143-145 | String from specific properties. Deterministic. |

**Key concerns checked and resolved**:
- Object.keys() iteration order: NOT USED anywhere. All iteration via for...of on arrays/Map/Set.
- JSON.parse+JSON.stringify round-trips: NOT USED for comparison logic.
- Map/Set iteration stability: Both preserve insertion order (ES2015+). Deterministic.
- Set spread [...aFindings] (line 125): Only used in .filter() for existence checking. Order-independent.

**Caveat**: _mergeFindings selects the higher-confidence finding. For equal-confidence duplicates, keeps the first in array order. Replay requires same worker output order.

**Verdict: PASS** — All computations deterministic for same input array order.

---

## Invariant 4: Confidence weighting — consistent thresholds

### Single-worker path (lines 22, 31)
confidence = output.confidence || 0
accepted = confidence >= (mission.metadata?.confidenceThreshold || 0.7)
- Default threshold: 0.7. Operator: >=.

### Multi-worker path (lines 71, 99)
strongConsensus = variance < 0.1 && avgConfidence > 0.7
accepted = strongConsensus || agreement.score > 0.6
- strongConsensus: variance < 0.1 AND avgConfidence > 0.7 (both use >)
- Fallback: agreement.score > 0.6

### Inconsistency found: >= vs > for same 0.7 threshold
- Single-worker: confidence >= 0.7. At exactly 0.7: ACCEPTED.
- Multi-worker strongConsensus: avgConfidence > 0.7. At exactly 0.7: NOT strongConsensus.

A lone worker at exactly 0.7 is accepted. Two workers both at 0.7 with identical findings (variance=0) do NOT achieve strongConsensus (needs >0.7). They would only be accepted via agreement.score > 0.6.

The agreement.score > 0.6 measures finding overlap (Jaccard-like ratio), not confidence. Different threshold for different metric is semantically correct but undocumented.

**Verdict: WARN** — Operator inconsistency: >= (single) vs > (multi) for the same 0.7 threshold. Recommend aligning operators and documenting the relationship between the 0.7 confidence threshold and the 0.6 agreement threshold.

---

## Invariant 5: Conflict resolution — sharedFindings correctness

### sharedFindings detection (lines 47-68)
- findingsMap deduplicates by _findingKey().
- sharedFindings includes entries with workerCount >= 2.
- For 2 workers: both must agree. For 3+: any finding found by 2+ is shared.
- Correct — standard definition.

### strongConsensus formula (line 71)
variance < 0.1 && avgConfidence > 0.7
- Both conditions must be true. Variance < 0.1 means stdDev < ~0.316.
- Correct.

### Acceptance logic (line 99)
accepted = strongConsensus || agreement.score > 0.6
- Two independent paths: (1) high confidence + low variance, (2) high finding overlap.
- Correct design.

### Edge: contradictory findings with high confidence agreement
Workers with completely different findings but both at confidence 0.9, variance 0:
- strongConsensus = true, accepted = true.
- Zero shared findings but still accepted because confidence is high and consistent.
- Defensible design choice — treat confidence agreement as independent signal.

### NaN/Infinity resilience
- NaN || 0 = 0. Infinity leads to variance=NaN, strongConsensus=false (NaN comparisons always false).
- All degrade gracefully.

**Verdict: PASS** — Logic correct. All edge cases handled.

---

## Invariant 6: Artifact compatibility — ConsensusArtifact field alignment

Cross-reference: ConsensusArtifact.produce(decision, missionId) at artifact_authorities.js:198-218, called from engine.js:323.

### Field mapping: ConsensusEngine -> ConsensusArtifact.produce()

| ConsensusEngine field | Set by | Artifact.produce() usage (L199-213) | Status |
|---|---|---|---|
| decisionId | all 3 paths | decision.decisionId || decision.id | PASS |
| accepted | all 3 paths | agreed: decision.accepted | PASS |
| averageConfidence | multi(L90), none(L153) | confidence: decision.averageConfidence || decision.confidence | WARN |
| confidence | single(L29) | fallback when averageConfidence undefined | PASS |
| confidenceVariance | multi(L91) | variance: decision.confidenceVariance || 0 | PASS (fallback) |
| strongConsensus | multi(L94) | strongConsensus: decision.strongConsensus || false | PASS (fallback) |
| sharedFindings (count) | multi(L96) | sharedFindings: decision.sharedFindings || 0 | PASS (fallback) |
| workerCount | all 3 paths | workerCount: decision.workerCount || 0 | PASS |
| workerDetails | NOT SET by any path | (decision.workerDetails || []).map(...) | WARN |
| agreementLevel | all 3 paths | NOT USED by artifact (used in events) | N/A |

### Issue 1: _noConsensus confidence resolves to undefined

_noConsensus (line 147-161) sets averageConfidence: 0 but NOT confidence.

In ConsensusArtifact.produce() line 203:
  confidence: decision.averageConfidence || decision.confidence
  -> 0 || undefined -> undefined

Since 0 is falsy, the artifact stores confidence: undefined.
Metadata fallback at line 216 handles this (0 || undefined || 0 = 0).

Fix: Either add confidence: 0 to _noConsensus output, or change artifact's || to ??.

### Issue 2: workerDetails permanently empty

None of the three consensus engine paths set decision.workerDetails.
ConsensusArtifact.produce() line 208: (decision.workerDetails || []).map(...) -> always [].

Engine.js builds workerDetails at line 375-383 AFTER the artifact is created at line 323.
The workerDetails only appears in the mission_accepted event, never in the artifact.

Fix: Inject workerDetails into decision before ConsensusArtifact.produce(), or remove from artifact schema.

**Verdict: WARN** — Two issues: (1) _noConsensus confidence resolves to undefined in artifact content; (2) workerDetails permanently empty due to architectural ordering gap.

---

## Invariant 7: Historical replay — deterministic across repeats

**Requirement**: Same mission + same workerOutputs must produce identical decision objects.

### _noConsensus replay (lines 147-161)
All fields are deterministic constants or derived from mission.id + reason. PASS.

### _singleWorkerDecision replay (lines 21-39)
All fields from mission (deterministic) or output (same input). decisionId from sha256(mission.id + JSON.stringify(output)). PASS.

### _multiWorkerConsensus replay (lines 41-105)
All computed fields (avgConfidence, variance, stdDev, strongConsensus, agreementScore, sharedFindings, accepted) are pure math on identical inputs. decisionId from sha256(mission.id + sortedWorkerIds + JSON.stringify(confidences)). PASS.

### Cross-cutting determinism checks
- No Math.random() anywhere. Confirmed.
- No Date.now() anywhere. Confirmed.
- No performance.now() anywhere. Not imported.
- No external state reads (files, network, env). Confirmed.
- No Object.keys() / for...in iteration. Confirmed.
- No prototype operations on generic objects. Uses Map for dictionaries. Confirmed.

**Verdict: PASS** — All three decision paths fully deterministic.

---

## Invariant 8: Edge cases

| Edge case | Lines | Handling | Verdict |
|---|---|---|---|
| Empty outputs (0 workers) | 10-12 | _noConsensus, accepted: false, reason: 'no_worker_outputs' | PASS |
| Single output (1 worker) | 14-16 | _singleWorkerDecision, threshold applied | PASS |
| Zero confidence | 22,42 | 0 -> accepted depends on threshold/findings | PASS |
| Identical findings (full overlap) | 47-68 | sharedFindings includes all, agreement=1.0 | PASS |
| Contradictory findings (zero overlap) | 47-68 | sharedFindings empty, depends on confidence | PASS |
| No findings at all | 109 | Default agreement 0.5 (<0.6 threshold) | PASS |
| Mixed (1 worker has findings, 1 doesn't) | 47-68 | Not shared (count=1), depends on confidence | PASS |
| null/undefined confidence | 22,42 | || 0 fallback | PASS |
| null/undefined findings | 33,49,123,133 | || [] fallback | PASS |
| NaN/Infinity confidence | 22,42 | Degrades to 0 or false in comparisons | PASS |
| Missing workerId | 28,55,89 | No crash; propagates undefined (caller responsibility) | PASS |
| Missing finding.file/line | 144 | Defaults to '' / 0 | PASS |

**Verdict: PASS** — All edge cases handled gracefully.

---

## Additional findings

### Dead field: this._decisions (line 6)
Initialized but never written to or read from. Previous audit noted this._decisions.push() calls at earlier lines; those have been removed. Dead storage.

### Dead field: this._events (line 5)
Constructor parameter stored but never read. Phase 39 removed all emit() calls. Dead storage.

### _findingKey collision potential (lines 143-145)
Two findings with same (file, line, type) are considered identical even if descriptions/recommendations differ. Should be documented.

### decisionId scope (line 101)
Multi-worker decisionId excludes findings content. Decisions with same mission/workers/confidences but different findings share a decisionId. Consider adding findings hash.

---

## Recommendations

| Priority | Area | Recommendation |
|---|---|---|
| HIGH | _noConsensus confidence | Add confidence: 0 to _noConsensus output (line 153 area). Currently 0 || undefined -> undefined in artifact. |
| HIGH | workerDetails gap | Inject workerDetails into decision before ConsensusArtifact.produce(), or remove from artifact schema. |
| MEDIUM | Dead fields | Remove this._decisions (line 6) and this._events (line 5). |
| MEDIUM | Threshold alignment | Align >= (single, line 31) and > (multi, line 71) for same 0.7 threshold. |
| LOW | Document _findingKey | Add comment near line 143 explaining dedup semantics. |
| LOW | decisionId content | Consider adding findings hash to multi-worker decisionId for dedup. |
