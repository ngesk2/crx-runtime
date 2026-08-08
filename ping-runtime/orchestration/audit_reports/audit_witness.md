# Witness Integrity Report

**File:** `orchestration/execution/engine.js` (719 lines) + `orchestration/execution/artifact_authorities.js` (318 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** 5 invariants covering artifact witness, event witness, merge witness, replay witness, and lineage references.

---

## 1. Every Artifact Has Witness

**Verdict: FAIL — witness generation not implemented**

**Evidence:**
- `artifact_authorities.js` line 82: `WitnessArtifact` class exists
- `engine.js` line 82: `this._witnessAuthority = new WitnessArtifact(this._artifactStore, this._eventQueue);`
- **But**: `WitnessArtifact.produce()` is never called in engine.js

**Artifact production in engine.js:**
- Line 208-215: Prompt artifact stored (no witness)
- Line 261: Proposal artifact produced (no witness)
- Line 324: Consensus artifact produced (no witness)
- Line 363: Merge decision artifact produced (no witness)

**Witness generation in artifact_authorities.js:**
- Line 61: `witness_hash: this._computeWitness(payload)` (computed but not stored as separate witness artifact)
- Line 79-89: `_computeWitness()` method exists but only produces hash, not witness artifact
- Line 248-264: `WitnessArtifact` class exists but never instantiated in production path

**Impact:**
- Artifacts are produced without witness artifacts
- Witness hash is computed inline but not stored as separate witness
- Cannot verify artifact integrity via witness chain
- Breaks constitutional witness guarantees

**Remediation:**
1. Call `WitnessArtifact.produce()` after every artifact production
2. Store witness artifact ID in parent artifact metadata
3. Ensure witness chain is complete for all artifact types

---

## 2. Every Event Has Witness

**Verdict: FAIL — events have no witness artifacts**

**Evidence:**
- `event_queue.js` line 98: Events include `witness_id: data.witnessId || null`
- `engine.js` event emissions (L327, L366, L386, L404): No witness_id provided
- Events are emitted but no witness artifacts are created for events

**Event emissions in engine.js:**
- Line 327-338: `consensus_reached` / `consensus_failed` (no witness)
- Line 366-374: `merge_decision_created` (no witness)
- Line 386-401: `mission_accepted` (no witness)
- Line 404-412: `mission_rejected` (no witness)

**Impact:**
- Events have no witness artifacts
- Cannot verify event integrity via witness chain
- Event replay cannot be verified against witness

**Remediation:**
1. Create witness artifact for every event emission
2. Store witness artifact ID in event metadata
3. Link event witness to parent artifact witness

---

## 3. Every Merge Has Witness

**Verdict: FAIL — merge decision has no witness**

**Evidence:**
- Line 363: `const mergeArtifact = this._mergeDecisionAuthority.produce(mission.id, gateResult, consensusArtifactId);`
- Line 364: `mergeArtifactId = mergeArtifact.id || mergeArtifact;`
- No witness artifact created for merge decision

**Impact:**
- Merge decisions are not witnessed
- Cannot verify merge integrity via witness chain
- Merge replay cannot be verified against witness

**Remediation:**
1. Call `WitnessArtifact.produce()` after merge decision artifact
2. Store witness artifact ID in merge decision metadata
3. Link merge witness to consensus witness

---

## 4. Every Replay Has Witness

**Verdict: FAIL — replay proof has no witness**

**Evidence:**
- `artifact_authorities.js` line 228-246: `ReplayArtifact` class exists
- `engine.js` line 81: `this._replayAuthority = new ReplayArtifact(this._artifactStore, this._eventQueue);`
- **But**: `ReplayArtifact.produce()` is never called in engine.js

**Impact:**
- Replay proofs are not produced
- Cannot verify replay determinism via witness chain
- No replay verification mechanism in orchestration layer

**Remediation:**
1. Implement replay proof generation after mission resolution
2. Call `ReplayArtifact.produce()` with execution trace
3. Create witness artifact for replay proof

---

## 5. Every Certificate References Lineage

**Verdict: N/A — certificate system not in orchestration layer**

**Evidence:**
- Certificate system exists in gateway layer (`gateway/witness_authority.js`, `gateway/certificate_authority.js`)
- Orchestration layer does not produce certificates
- Orchestration layer produces artifacts, not certificates

**Impact:**
- No constitutional gap (orchestration produces artifacts, gateway produces certificates)
- But orchestration artifacts should link to gateway certificates when applicable

---

## 6. No Fragmented Witness Ownership

**Verdict: PASS (vacuously true)**

**Evidence:**
- No witness artifacts are produced in orchestration layer
- Therefore, no fragmented witness ownership exists

**Concern:**
- This is a pass due to absence, not correctness
- When witness generation is implemented, ownership must be centralized

**Remediation:**
- Ensure all witness generation goes through single authority
- Prevent duplicate witness ownership across subsystems

---

## 7. Additional Findings

### 7a. Witness Hash Computation Exists But Not Used

**Verdict: WARN**

**Evidence:**
- `artifact_authorities.js` line 61: `witness_hash: this._computeWitness(payload)`
- Line 79-89: `_computeWitness()` implementation exists
- Witness hash is computed and stored in artifact metadata
- But separate witness artifact is not created

**Concern:**
- Witness hash is computed but not stored as witness artifact
- Partial witness implementation (hash only, no artifact)
- Inconsistent with constitutional witness requirements

**Impact:**
- Witness hash exists but cannot be verified via witness chain
- Partial implementation creates false sense of witness coverage

**Remediation:**
- Either remove witness hash computation (if not using witness artifacts)
- Or complete witness artifact generation (if using witness chain)

---

### 7b. Witness Artifact Class Exists But Unused

**Verdict: WARN**

**Evidence:**
- `artifact_authorities.js` line 248-264: `WitnessArtifact` class defined
- `engine.js` line 82: `this._witnessAuthority = new WitnessArtifact(...)`
- Class is instantiated but never used

**Concern:**
- Dead code (witness authority instantiated but never called)
- Suggests incomplete implementation
- Wastes memory and initialization time

**Impact:**
- No functional impact (not used)
- But indicates incomplete witness implementation

**Remediation:**
- Either remove unused witness authority
- Or implement witness generation calls

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Every artifact has witness | **FAIL** | CRITICAL | Witness generation not implemented |
| 2. Every event has witness | **FAIL** | CRITICAL | Events have no witness artifacts |
| 3. Every merge has witness | **FAIL** | CRITICAL | Merge decision has no witness |
| 4. Every replay has witness | **FAIL** | CRITICAL | Replay proof not produced |
| 5. Certificate references lineage | N/A | — | Certificate system not in orchestration |
| 6. No fragmented witness ownership | **PASS** (vacuous) | — | No witnesses produced |
| 7. Witness hash unused | **WARN** | MEDIUM | Hash computed but artifact not created |
| 8. Witness authority unused | **WARN** | LOW | Class instantiated but never called |

**Overall: FAIL** — 4 CRITICAL violations prevent constitutional witness guarantees.

## Immediate Remediation Required

1. **Implement witness generation for all artifacts**
   - Call `WitnessArtifact.produce()` after every artifact production
   - Store witness artifact ID in parent artifact metadata
   - Ensure witness chain completeness

2. **Implement witness generation for all events**
   - Create witness artifact for every event emission
   - Store witness artifact ID in event metadata
   - Link event witness to parent artifact witness

3. **Implement witness generation for merge decisions**
   - Call `WitnessArtifact.produce()` after merge decision artifact
   - Store witness artifact ID in merge decision metadata

4. **Implement replay proof generation**
   - Call `ReplayArtifact.produce()` after mission resolution
   - Create witness artifact for replay proof
   - Verify replay determinism

5. **Remove or complete partial witness implementation**
   - Either remove witness hash computation
   - Or complete witness artifact generation
