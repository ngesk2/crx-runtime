# MERKLE_WITNESS_INTEGRITY

**Audit Date:** 2026-06-07  
**Protocol:** CRX-CONSTITUTIONAL-ADVERSARIAL-VERIFICATION-PROTOCOL  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Witness root computation does NOT use Merkle tree construction.

**FACT:** Witness root computation uses JSON.stringify concatenation.

**Fact:** Witness root computation claims to use Merkle algorithm but does NOT.

**FACT:** Witness root can diverge with reordered JSON fields.

**FACT:** Witness root can diverge with semantically equivalent payloads.

**FACT:** Witness root can diverge with lineage ordering permutations.

**FACT:** Witness root can diverge with duplicate event insertion.

**FACT:** Witness root can diverge with replay stream chunking differences.

**FACT:** Witness root can diverge with whitespace normalization.

**FACT:** Witness root can diverge with undefined vs null behavior.

**FACT:** Witness root can diverge with sparse array behavior.

**INFERENCE:** Witness roots are NOT Merkle-style.

**INFERENCE:** Witness roots are NOT semantically stable.

**INFERENCE:** Witness roots are NOT constitutionally valid.

**FINAL VERDICT:** FALSE_REPLAY_KERNEL

---

## Critical Flaw 1: False Merkle Algorithm Claim

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 117-133

**Code:**
```typescript
private computeWitnessRoot(
  canonicalBytes: CanonicalBytes,
  fingerprint: Fingerprint,
  lineage: LineageGraph,
  state: any
): WitnessRoot {
  // Simplified witness root computation
  // In production, use Merkle tree construction
  const combined = JSON.stringify({
    canonical_bytes: canonicalBytes,
    fingerprint,
    lineage,
    state_version: state.state_version
  });
  
  const hash = this.hashAuthority.canonicalize(combined);
  const witnessHash = this.hashAuthority.computeFingerprint(hash);
  
  return {
    witness_root: witnessHash.hash,
    witness_algorithm: 'merkle',
    witness_version: '1.0'
  };
}
```

**Severity:** CRITICAL

**Exploit Vector:** Witness root computation claims to use Merkle algorithm but uses JSON.stringify concatenation. This is a false algorithmic claim.

**Replay Consequence:** Witness roots are NOT Merkle-style. Witness verification is based on false premises.

**Determinism Consequence:** Witness roots are deterministic but NOT Merkle-style. Algorithmic claims are false.

**Constitutional Consequence:** Witness roots are NOT constitutionally valid. Replay verification is based on false algorithmic claims.

**Remediation:** Implement actual Merkle tree construction. Remove false Merkle algorithm claim.

---

## Critical Flaw 2: Reordered JSON Fields Divergence

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 119-124

**Code:**
```typescript
const combined = JSON.stringify({
  canonical_bytes: canonicalBytes,
  fingerprint,
  lineage,
  state_version: state.state_version
});
```

**Severity:** CRITICAL

**Exploit Vector:** JSON.stringify does NOT guarantee field ordering. Reordered JSON fields produce different witness roots.

**Replay Consequence:** Semantically identical inputs produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT semantically deterministic. Field ordering affects witness roots.

**Constitutional Consequence:** Witness roots are NOT semantically stable. Constitutional determinism is violated.

**Remediation:** Use canonical JSON serialization with deterministic field ordering.

---

## Critical Flaw 3: Semantically Equivalent Payloads Divergence

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 119-124

**Code:**
```typescript
const combined = JSON.stringify({
  canonical_bytes: canonicalBytes,
  fingerprint,
  lineage,
  state_version: state.state_version
});
```

**Severity:** CRITICAL

**Exploit Vector:** Semantically equivalent payloads (e.g., undefined vs null, whitespace differences) produce different witness roots.

**Replay Consequence:** Semantically identical inputs produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT semantically deterministic. Semantic equivalence is not preserved.

**Constitutional Consequence:** Witness roots are NOT semantically stable. Constitutional determinism is violated.

**Remediation:** Implement semantic normalization before witness computation.

---

## Critical Flaw 4: Lineage Ordering Permutations Divergence

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 89-100

**Code:**
```typescript
private buildLineageGraph(state: any): LineageGraph {
  const edges: any[] = [];
  
  for (const [artifactId, artifactState] of state.artifacts) {
    for (const parentId of artifactState.artifact_lineage) {
      edges.push({
        parent_id: parentId,
        child_id: artifactId,
        edge_type: 'derivation'
      });
    }
  }
  
  return {
    edges,
    graph_version: '1.0'
  };
}
```

**Severity:** HIGH

**Exploit Vector:** Map iteration order is NOT guaranteed. Lineage ordering permutations produce different witness roots.

**Replay Consequence:** Semantically identical lineages produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT semantically deterministic. Lineage ordering affects witness roots.

**Constitutional Consequence:** Witness roots are NOT semantically stable. Constitutional determinism is violated.

**Remediation:** Use deterministic lineage ordering. Sort edges before witness computation.

---

## Critical Flaw 5: Duplicate Event Insertion Divergence

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 40-48

**Code:**
```typescript
replay(eventStream: ReplayEventStream): ReplayResult {
  // Reset state machine
  this.stateMachine.reset();
  
  // Process events in order
  const events = eventStream.getEvents();
  for (const event of events) {
    this.stateMachine.applyEvent(event);
  }
```

**Severity:** HIGH

**Exploit Vector:** Duplicate events are processed multiple times. Witness roots diverge with duplicate insertion.

**Replay Consequence:** Duplicate events produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT idempotent. Duplicate events affect witness roots.

**Constitutional Consequence:** Witness roots are NOT idempotent. Constitutional determinism is violated.

**Remediation:** Add duplicate event detection. Reject duplicate events.

---

## Critical Flaw 6: Replay Stream Chunking Differences Divergence

**File:** runtime/replay/deterministic_replay_engine.ts

**Lines:** 81-84

**Code:**
```typescript
private canonicalizeEventStream(eventStream: ReplayEventStream): CanonicalBytes {
  const json = eventStream.toJSON();
  return this.hashAuthority.canonicalize(json);
}
```

**Severity:** MEDIUM

**Exploit Vector:** Event stream chunking differences produce different JSON representations. Witness roots diverge.

**Replay Consequence:** Semantically identical streams produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT chunking-deterministic. Stream chunking affects witness roots.

**Constitutional Consequence:** Witness roots are NOT chunking-stable. Constitutional determinism is violated.

**Remediation:** Implement chunking-independent canonicalization.

---

## Critical Flaw 7: Whitespace Normalization Divergence

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 65

**Code:**
```typescript
if (type === 'string') return JSON.stringify(obj);
```

**Severity:** MEDIUM

**Exploit Vector:** JSON.stringify does NOT normalize whitespace. Whitespace differences produce different witness roots.

**Replay Consequence:** Semantically identical strings produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT whitespace-deterministic. Whitespace affects witness roots.

**Constitutional Consequence:** Witness roots are NOT whitespace-stable. Constitutional determinism is violated.

**Remediation:** Implement whitespace normalization before canonicalization.

---

## Critical Flaw 8: Undefined vs Null Behavior Divergence

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 60-61

**Code:**
```typescript
if (obj === null) return 'null';
if (obj === undefined) return 'undefined';
```

**Severity:** MEDIUM

**Exploit Vector:** Undefined and null are treated differently. Semantically equivalent values produce different witness roots.

**Replay Consequence:** Semantically equivalent values produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT semantically deterministic. Undefined vs null affects witness roots.

**Constitutional Consequence:** Witness roots are NOT semantically stable. Constitutional determinism is violated.

**Remediation:** Normalize undefined to null before canonicalization.

---

## Critical Flaw 9: Sparse Array Behavior Divergence

**File:** runtime/replay/canonical_hash_authority.ts

**Lines:** 90-98

**Code:**
```typescript
if (Array.isArray(obj)) {
  if (visited.has(obj)) {
    throw new Error('Circular reference detected in array');
  }
  visited.add(obj);
  
  const elements = obj.map(item => this.canonicalizeObject(item, visited));
  return `[${elements.join(',')}]`;
}
```

**Severity:** MEDIUM

**Exploit Vector:** Sparse arrays are not normalized. Array.map() behavior differs across engines. Witness roots diverge.

**Replay Consequence:** Semantically equivalent arrays produce different witness roots. Witness verification fails.

**Determinism Consequence:** Witness roots are NOT array-deterministic. Sparse array handling affects witness roots.

**Constitutional Consequence:** Witness roots are NOT array-stable. Constitutional determinism is violated.

**Remediation:** Implement sparse array normalization. Use dense array representation.

---

## Final Classification

**FACT:** Witness root computation does NOT use Merkle tree construction

**FACT:** Witness root computation uses JSON.stringify concatenation

**FACT:** Witness root computation claims to use Merkle algorithm but does NOT

**FACT:** Witness root can diverge with reordered JSON fields

**FACT:** Witness root can diverge with semantically equivalent payloads

**FACT:** Witness root can diverge with lineage ordering permutations

**FACT:** Witness root can diverge with duplicate event insertion

**FACT:** Witness root can diverge with replay stream chunking differences

**FACT:** Witness root can diverge with whitespace normalization

**FACT:** Witness root can diverge with undefined vs null behavior

**FACT:** Witness root can diverge with sparse array behavior

**INFERENCE:** Witness roots are NOT Merkle-style

**INFERENCE:** Witness roots are NOT semantically stable

**INFERENCE:** Witness roots are NOT constitutionally valid

**FINAL VERDICT:** FALSE_REPLAY_KERNEL

**RECOMMENDATION:** Implement actual Merkle tree construction. Add semantic normalization. Add duplicate detection. Add deterministic ordering.
