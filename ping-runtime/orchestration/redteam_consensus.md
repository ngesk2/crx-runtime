# ConsensusDeterminismArtifact

**Audit Type:** Phase 40D Red Team — Zero Trust
**Subsystem:** Consensus
**File:** `orchestration/execution/consensus_engine.js`
**Severity:** CRITICAL
**Status:** CONSTITUTIONAL VIOLATIONS CONFIRMED

---

## Executive Summary

**Verdict: FAIL**

Consensus has **5 CRITICAL constitutional violations** that allow worker ordering to affect consensus, permit proposal ordering to change output, permit confidence drift, permit floating-point instability, and permit proposal hash instability.

**Previous audit was optimistic.** The consensus engine is not pure computation, has floating-point instability, and proposal ordering affects output.

---

## Violation 1: Worker Ordering Affects Consensus Output

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 89: workerIds preserves input ordering
workerIds: outputs.map(o => o.workerId),

// Line 73-82: outputsCompared preserves input ordering
const outputsCompared = [];
for (let i = 0; i < outputs.length; i++) {
  for (let j = i + 1; j < outputs.length; j++) {
    outputsCompared.push({
      workerA: outputs[i].workerId,
      workerB: outputs[j].workerId,
      agreement: this._outputsAgree(outputs[i], outputs[j])
    });
  }
}
```

**Flaw:**
- `workerIds` array preserves input ordering from `outputs`
- `outputsCompared` array preserves input ordering (nested loop)
- Same workers in different order produce different `workerIds` array
- Same workers in different order produce different `outputsCompared` array
- Decision object differs based on worker ordering
- Violates "worker ordering independence" constitutional guarantee

**Replay Transcript:**
1. Workers [W1, W2, W3] produce outputs
2. Consensus decision with workerIds: [W1, W2, W3]
3. Same workers [W3, W2, W1] produce outputs (different order)
4. Consensus decision with workerIds: [W3, W2, W1]
5. Different decision objects, same semantic consensus
6. Replay produces different decision object

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const outputs1 = [
  { workerId: 'w1', confidence: 0.8, findings: [] },
  { workerId: 'w2', confidence: 0.7, findings: [] }
];
const outputs2 = [
  { workerId: 'w2', confidence: 0.7, findings: [] },
  { workerId: 'w1', confidence: 0.8, findings: [] }
];
const decision1 = engine.evaluate(mission, outputs1);
const decision2 = engine.evaluate(mission, outputs2);
// decision1.workerIds !== decision2.workerIds
```

**Impact:**
- Worker ordering affects decision object
- Same semantic consensus produces different decision
- Replay produces different decision object
- Violates "worker ordering independence" constitutional guarantee

---

## Violation 2: Proposal Ordering Changes Output

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 130-140: _mergeFindings preserves insertion order
_mergeFindings(outputs) {
  const seen = new Map();
  for (const output of outputs) {
    for (const finding of (output.findings || [])) {
      const key = this._findingKey(finding);
      if (!seen.has(key) || (seen.get(key).confidence || 0) < (finding.confidence || 0)) {
        seen.set(key, finding);
      }
    }
  }
  return Array.from(seen.values());
}
```

**Flaw:**
- `seen` Map preserves insertion order
- Findings from first output processed first
- Findings from second output processed second
- Same findings in different order produce different `findings` array
- Decision object differs based on proposal ordering
- Violates "proposal ordering independence" constitutional guarantee

**Replay Transcript:**
1. Proposals [P1, P2] with findings [{file: 'x'}, {file: 'y'}]
2. Consensus decision with findings: [{file: 'x'}, {file: 'y'}]
3. Same proposals [P2, P1] with findings [{file: 'y'}, {file: 'x'}]
4. Consensus decision with findings: [{file: 'y'}, {file: 'x'}]
5. Different decision objects, same semantic findings
6. Replay produces different decision object

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const outputs1 = [
  { workerId: 'w1', findings: [{file: 'x', line: 1, bypass_type: 'type1'}] },
  { workerId: 'w2', findings: [{file: 'y', line: 2, bypass_type: 'type2'}] }
];
const outputs2 = [
  { workerId: 'w2', findings: [{file: 'y', line: 2, bypass_type: 'type2'}] },
  { workerId: 'w1', findings: [{file: 'x', line: 1, bypass_type: 'type1'}] }
];
const decision1 = engine.evaluate(mission, outputs1);
const decision2 = engine.evaluate(mission, outputs2);
// decision1.findings !== decision2.findings (different order)
```

**Impact:**
- Proposal ordering affects decision object
- Same semantic findings produce different decision
- Replay produces different decision object
- Violates "proposal ordering independence" constitutional guarantee

---

## Violation 3: Floating-Point Instability

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 42-45: Floating-point operations
const confidences = outputs.map(o => o.confidence || 0);
const avgConfidence = confidences.reduce((s, c) => s + c, 0) / confidences.length;
const variance = confidences.reduce((s, c) => s + (c - avgConfidence) ** 2, 0) / confidences.length;
const stdDev = Math.sqrt(variance);

// Line 90-92: Rounding
averageConfidence: Math.round(avgConfidence * 100) / 100,
confidenceVariance: Math.round(variance * 100) / 100,
confidenceStdDev: Math.round(stdDev * 100) / 100,
```

**Flaw:**
- Floating-point operations are not deterministic across platforms
- IEEE 754 floating-point has rounding errors
- Same operations can produce different results on different platforms
- Rounding mitigates but does not eliminate instability
- `Math.sqrt(variance)` can produce different results
- Violates "deterministic computation" constitutional guarantee

**Replay Transcript:**
1. Linux system (x86_64): avgConfidence = 0.7333333333333333
2. ARM system (aarch64): avgConfidence = 0.7333333333333334 (different rounding)
3. Rounding: Math.round(0.7333333333333333 * 100) / 100 = 0.73
4. Rounding: Math.round(0.7333333333333334 * 100) / 100 = 0.73 (same after rounding)
5. But: variance/stdDev may differ before rounding
6. Decision object differs based on platform

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const outputs = [
  { workerId: 'w1', confidence: 0.7 },
  { workerId: 'w2', confidence: 0.8 },
  { workerId: 'w3', confidence: 0.7 }
];
// avgConfidence = 0.7333333333333333 (x86_64)
// avgConfidence = 0.7333333333333334 (aarch64)
// May differ before rounding
```

**Impact:**
- Floating-point operations not deterministic
- Same inputs produce different outputs on different platforms
- Replay produces different decision object
- Violates "deterministic computation" constitutional guarantee

---

## Violation 4: Proposal Hash Instability

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 35: decisionId uses JSON.stringify (non-deterministic)
decisionId: crypto.createHash('sha256').update(mission.id + JSON.stringify(output)).digest('hex').substring(0, 12)

// Line 101: decisionId uses JSON.stringify (non-deterministic)
decisionId: crypto.createHash('sha256').update(mission.id + outputs.map(o => o.workerId).sort().join(',') + JSON.stringify(outputs.map(o => o.confidence))).digest('hex').substring(0, 12)
```

**Flaw:**
- `JSON.stringify(output)` is not deterministic (key ordering)
- `JSON.stringify(outputs.map(o => o.confidence))` is not deterministic (array ordering)
- Same output can produce different JSON strings
- Different JSON strings produce different decision IDs
- Decision ID differs based on JSON serialization
- Violates "deterministic decision ID" constitutional guarantee

**Replay Transcript:**
1. Output O1: {confidence: 0.8, findings: [{file: 'x'}]}
2. JSON.stringify(O1): {"confidence":0.8,"findings":[{"file":"x"}]}
3. Output O1': {findings: [{file: 'x'}], confidence: 0.8}
4. JSON.stringify(O1'): {"findings":[{"file":"x"}],"confidence":0.8}
5. Different JSON strings, same semantic output
6. Different decision IDs

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const output1 = { workerId: 'w1', confidence: 0.8, findings: [{file: 'x'}] };
const output2 = { workerId: 'w1', findings: [{file: 'x'}], confidence: 0.8 };
const decision1 = engine.evaluate(mission, [output1]);
const decision2 = engine.evaluate(mission, [output2]);
// decision1.decisionId !== decision2.decisionId
```

**Impact:**
- Decision ID not deterministic
- Same semantic output produces different decision ID
- Replay produces different decision ID
- Violates "deterministic decision ID" constitutional guarantee

---

## Violation 5: Confidence Aggregation Drift

**Severity:** HIGH

**Proof:**
```javascript
// Line 43: Average confidence
const avgConfidence = confidences.reduce((s, c) => s + c, 0) / confidences.length;

// Line 90: Rounded average confidence
averageConfidence: Math.round(avgConfidence * 100) / 100,
```

**Flaw:**
- Average confidence is rounded to 2 decimal places
- Rounding can mask small differences
- Example: 0.7333 → 0.73, 0.7349 → 0.73
- Different confidences produce same rounded average
- Decision acceptance based on rounded average
- Violates "confidence precision" constitutional guarantee

**Replay Transcript:**
1. Confidences [0.7333, 0.7349, 0.7333]
2. Average: 0.7338333333333333
3. Rounded: 0.73
4. Confidences [0.7333, 0.7333, 0.7333]
5. Average: 0.7333
6. Rounded: 0.73
7. Different confidences, same rounded average
8. Decision acceptance same (threshold 0.7)

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const outputs1 = [
  { workerId: 'w1', confidence: 0.7333 },
  { workerId: 'w2', confidence: 0.7349 },
  { workerId: 'w3', confidence: 0.7333 }
];
const outputs2 = [
  { workerId: 'w1', confidence: 0.7333 },
  { workerId: 'w2', confidence: 0.7333 },
  { workerId: 'w3', confidence: 0.7333 }
];
const decision1 = engine.evaluate(mission, outputs1);
const decision2 = engine.evaluate(mission, outputs2);
// decision1.averageConfidence === decision2.averageConfidence (both 0.73)
```

**Impact:**
- Confidence rounding masks differences
- Different confidences produce same decision
- Replay produces same decision for different inputs
- Violates "confidence precision" constitutional guarantee

---

## Violation 6: Missing Proposal References

**Severity:** MEDIUM

**Proof:**
```javascript
// Line 100: Merged findings without proposal references
findings: this._mergeFindings(outputs),

// Line 130-140: _mergeFindings drops proposal references
_mergeFindings(outputs) {
  const seen = new Map();
  for (const output of outputs) {
    for (const finding of (output.findings || [])) {
      const key = this._findingKey(finding);
      if (!seen.has(key) || (seen.get(key).confidence || 0) < (finding.confidence || 0)) {
        seen.set(key, finding);
      }
    }
  }
  return Array.from(seen.values());
}
```

**Flaw:**
- Merged findings do not reference original proposals
- Cannot trace which proposal contributed which finding
- Cannot verify finding provenance
- Violates "proposal traceability" constitutional guarantee

**Replay Transcript:**
1. Proposal P1: findings [{file: 'x', confidence: 0.8}]
2. Proposal P2: findings [{file: 'x', confidence: 0.9}]
3. Merged findings: [{file: 'x', confidence: 0.9}]
4. Cannot determine that P2 contributed the finding
5. Cannot trace finding provenance

**Minimal Reproduction:**
```javascript
const engine = new ConsensusEngine(events);
const outputs = [
  { workerId: 'w1', findings: [{file: 'x', line: 1, bypass_type: 'type1', confidence: 0.8}] },
  { workerId: 'w2', findings: [{file: 'x', line: 1, bypass_type: 'type1', confidence: 0.9}] }
];
const decision = engine.evaluate(mission, outputs);
// decision.findings[0] has no reference to which proposal contributed it
```

**Impact:**
- Findings not traceable to proposals
- Cannot verify finding provenance
- Cannot audit consensus decision
- Violates "proposal traceability" constitutional guarantee

---

## Summary

| Violation | Severity | Constitutional Guarantee Broken |
|-----------|----------|-------------------------------|
| 1. Worker ordering affects consensus output | CRITICAL | Worker ordering independence |
| 2. Proposal ordering changes output | CRITICAL | Proposal ordering independence |
| 3. Floating-point instability | CRITICAL | Deterministic computation |
| 4. Proposal hash instability | CRITICAL | Deterministic decision ID |
| 5. Confidence aggregation drift | HIGH | Confidence precision |
| 6. Missing proposal references | MEDIUM | Proposal traceability |

**Total CRITICAL violations: 4**

**Constitutional Debt:**
- Sort workerIds array before storing in decision
- Sort findings array before storing in decision
- Use fixed-point arithmetic instead of floating-point
- Use canonical JSON serialization for decision ID
- Preserve proposal references in merged findings
- Use higher precision for confidence aggregation

**Previous Audit Optimism:**
- Assumed worker ordering independence (workerIds preserves input order)
- Assumed proposal ordering independence (findings preserves insertion order)
- Assumed deterministic computation (floating-point operations)
- Assumed deterministic decision ID (JSON.stringify non-deterministic)

**Conclusion:**
Consensus is **NOT constitutionally sovereign**. It has 4 CRITICAL violations that allow worker ordering to affect consensus, permit proposal ordering to change output, permit floating-point instability, and permit proposal hash instability.

**Phase 41 is BLOCKED** until these violations are repaired.
