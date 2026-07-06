# Artifact Authority Report

**File:** `orchestration/execution/artifact_authorities.js` (318 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** 8 invariants covering canonical serialization, hashing, lineage, witness, replay proof, authority routing, and artifact references.

---

## 1. Canonical Serialization

**Verdict: PASS**

**Evidence:**
- Line 9-12: `canonicalBytes()` implementation
```js
function canonicalBytes(obj) {
  const sorted = JSON.stringify(obj, Object.keys(obj).sort());
  return Buffer.from(sorted, 'utf8');
}
```

**Canonicalization factors:**
- `Object.keys(obj).sort()` sorts keys lexicographically
- `JSON.stringify()` with sorted keys produces deterministic output
- Buffer conversion preserves byte-level determinism

**Verdict:** Serialization is canonical and deterministic.

---

## 2. Canonical Bytes

**Verdict: PASS**

**Evidence:**
- Line 45: `const bytes = canonicalBytes(payload);`
- Line 54: `bytes: bytes.toString('hex')` (stored in artifact)

**Mechanism:**
- Canonicalization applied before hashing
- Bytes stored as hex string for persistence
- Same object → same bytes → same hex representation

**Verdict:** Canonical bytes are correctly computed and stored.

---

## 3. Canonical Hashing

**Verdict: PASS**

**Evidence:**
- Line 14-16: `canonicalHash()` implementation
```js
function canonicalHash(obj) {
  return crypto.createHash('sha256').update(canonicalBytes(obj)).digest('hex');
}
```

**Hashing factors:**
- SHA-256 cryptographic hash
- Input is canonical bytes (deterministic)
- Output is hex string (deterministic)

**Usage:**
- Line 46: `const hash = canonicalHash(payload);`
- Line 84: `contentHash: canonicalHash(payload.content)` (in witness computation)

**Verdict:** Hashing is canonical and deterministic.

---

## 4. Immutable Lineage

**Verdict: PASS (with WARN)**

**Evidence:**
- Line 39: `parentArtifactId: meta.parentArtifactId || null`
- Line 57: `parent_artifact_id: meta.parentArtifactId || null`
- Line 97: `parentArtifactId: artifact.parent_artifact_id` (in verify)

**Lineage tracking:**
- Parent artifact ID is stored in artifact metadata
- Passed through `produce()` and `verify()`
- Lineage is immutable once artifact is created

**WARN: No lineage validation**
- No cycle detection (artifact could reference itself as parent)
- No orphan detection (parent may not exist)
- No depth enforcement (unlimited lineage depth)

**Impact:**
- Lineage is tracked but not validated
- Could create circular references or broken lineage chains

**Remediation:**
- Add cycle detection in `produce()`
- Validate parent artifact exists in store
- Enforce maximum lineage depth

---

## 5. Witness Generation

**Verdict: FAIL — wall clock dependency**

**Evidence:**
- Line 79-89: `_computeWitness()` implementation
```js
_computeWitness(payload) {
  const witnessPayload = {
    artifactType: payload.type,
    workerId: payload.workerId,
    missionId: payload.missionId,
    contentHash: canonicalHash(payload.content),
    parentArtifactId: payload.parentArtifactId,
    timestamp: Date.now()  // NON-DETERMINISTIC
  };
  return canonicalHash(witnessPayload);
}
```

**Problem:**
- Line 86: `timestamp: Date.now()` uses wall clock
- Same artifact produced at different times produces different witness hash
- Witness verification will fail across replays

**Impact:**
- Witness is non-replayable
- Cannot verify historical artifact integrity
- Breaks constitutional witness guarantees

**Remediation:**
- Remove `timestamp` field from witness payload
- Or use deterministic timestamp (e.g., from mission or sequence number)

---

## 6. Replay Proof Generation

**Verdict: PASS (with WARN)**

**Evidence:**
- Line 228-246: `ReplayArtifact` implementation
```js
class ReplayArtifact extends ArtifactAuthority {
  produce(workerId, missionId, proof) {
    return super.produce('replay_proof', {
      workerId,
      missionId,
      functions: proof.functions || [],
      events: proof.events || [],
      hash: proof.hash || '',
      deterministic: proof.deterministic || false,
      duration: proof.duration || 0,
      result: proof.result || 'unknown'
    }, {
      workerId,
      missionId,
      confidence: proof.confidence || 0,
      metadata: { functions: proof.functions || [] }
    });
  }
}
```

**Replay proof fields:**
- `functions`: list of functions executed
- `events`: event sequence
- `hash`: state hash
- `deterministic`: determinism flag
- `duration`: execution duration
- `result`: execution result

**WARN: No replay proof validation**
- No verification that `proof.deterministic` is accurate
- No validation that `proof.hash` matches actual state
- No validation that `proof.events` is complete
- Trust-based: accepts whatever proof is provided

**Impact:**
- Replay proof is stored but not validated
- Could store false replay claims

**Remediation:**
- Add validation in `produce()` to verify proof fields
- Cross-check `proof.hash` against actual state hash
- Validate `deterministic` flag against execution trace

---

## 7. Authority Routing

**Verdict: PASS**

**Evidence:**
- Line 24-26: Constructor
```js
constructor(artifactStore, eventQueue) {
  this._store = artifactStore;
  this._events = eventQueue;
}
```

**Routing:**
- Delegates to `artifactStore` for persistence (L65)
- Emits events via `eventQueue` (L66-75)
- No direct file I/O or database access

**Verdict:** Authority routing is correctly abstracted through dependencies.

---

## 8. Artifact References Only

**Verdict: PASS**

**Evidence:**
- Line 49-63: Artifact structure
```js
const artifact = {
  id,
  type,
  content,
  hash,
  bytes: bytes.toString('hex'),
  worker_id: meta.workerId || null,
  mission_id: meta.missionId || null,
  parent_artifact_id: meta.parentArtifactId || null,
  files: meta.files || [],
  confidence: meta.confidence || null,
  metadata: meta.metadata || {},
  witness_hash: this._computeWitness(payload),
  created_at: new Date().toISOString()
};
```

**Reference types:**
- `parent_artifact_id`: artifact ID reference (not object)
- `files`: file path strings (not file objects)
- `worker_id`: worker ID reference (not worker object)
- `mission_id`: mission ID reference (not mission object)

**Verdict:** Artifacts use ID references only, no embedded objects.

---

## 9. Additional Constitutional Violations

### 9a. Wall Clock in created_at

**Verdict: FAIL**

**Evidence:**
- Line 62: `created_at: new Date().toISOString()`

**Problem:**
- Wall clock timestamp in artifact metadata
- Same artifact produced at different times has different `created_at`
- Artifact hash excludes `created_at` (computed before timestamp)
- But artifact object includes timestamp, making object non-deterministic

**Impact:**
- Artifact objects are non-replayable
- Cannot reconstruct exact artifact state from replay
- Breaks constitutional artifact immutability

**Remediation:**
- Remove `created_at` field
- Or use deterministic timestamp (e.g., from mission or sequence)

---

### 9b. No Duplicate Artifact ID Detection

**Verdict: FAIL**

**Evidence:**
- Line 47: `const id = deterministicId(type, payload);`
- Line 65: `const record = this._store.storeRecord(artifact);`

**Problem:**
- `deterministicId()` is deterministic: same content → same ID
- But no check if artifact with same ID already exists
- Could produce duplicate artifacts with same ID
- Store may overwrite or reject (depends on implementation)

**Impact:**
- Potential artifact ID collisions
- Loss of artifact history if overwritten
- Violates artifact uniqueness invariant

**Remediation:**
- Check if artifact ID exists before producing
- Reject duplicate production or version artifacts

---

### 9c. Raw JSON Exchange Risk

**Verdict: WARN**

**Evidence:**
- Line 10: `JSON.stringify(obj, Object.keys(obj).sort())`
- Line 11: `Buffer.from(sorted, 'utf8')`

**Concern:**
- Custom canonicalization instead of using constitutional `CanonicalAuthority`
- If constitutional canonicalization changes, this diverges
- Potential inconsistency with replay kernel canonicalization

**Impact:**
- Dual canonicalization implementations
- Risk of divergence between orchestration and replay kernel

**Remediation:**
- Delegate to constitutional `CanonicalAuthority.canonicalize()`
- Or ensure this implementation matches constitutional spec exactly

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Canonical serialization | **PASS** | — | Lexicographic key sorting |
| 2. Canonical bytes | **PASS** | — | Correct computation and storage |
| 3. Canonical hashing | **PASS** | — | SHA-256 of canonical bytes |
| 4. Immutable lineage | **PASS** (WARN) | MEDIUM | No cycle/orphan validation |
| 5. Witness generation | **FAIL** | CRITICAL | `Date.now()` in witness payload |
| 6. Replay proof generation | **PASS** (WARN) | MEDIUM | No proof validation |
| 7. Authority routing | **PASS** | — | Correct abstraction through dependencies |
| 8. Artifact references only | **PASS** | — | ID references only, no embedded objects |
| 9. Wall clock violations | **FAIL** | CRITICAL | `new Date().toISOString()` in created_at |
| 10. Duplicate detection | **FAIL** | CRITICAL | No duplicate ID check |
| 11. Dual canonicalization | **WARN** | LOW | Custom implementation vs constitutional |

**Overall: FAIL** — 3 CRITICAL violations prevent constitutional artifact guarantees.

## Immediate Remediation Required

1. **Remove `Date.now()` from witness computation** (L86)
   - Remove `timestamp` field from witness payload
   - Or use deterministic timestamp from mission/sequence

2. **Remove `new Date().toISOString()` from artifact** (L62)
   - Remove `created_at` field
   - Or use deterministic timestamp

3. **Add duplicate artifact ID detection** (before L65)
   - Check if artifact ID exists in store
   - Reject or version duplicate artifacts

4. **Add lineage validation** (optional but recommended)
   - Cycle detection in `produce()`
   - Parent existence validation
   - Maximum lineage depth enforcement

5. **Add replay proof validation** (optional but recommended)
   - Verify `proof.deterministic` flag
   - Cross-check `proof.hash` against state
   - Validate `proof.events` completeness
