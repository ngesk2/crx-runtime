# CONSTITUTIONAL BLOCKERS — ADR-000Y Freeze

## Status

**P0 BLOCKERS IDENTIFIED**

ADR-000Y cannot be frozen until these constitutional issues are resolved.

---

## BLOCKER #1: DeterministicFailure Timestamp

### Current State

```typescript
export interface DeterministicFailure {
  code: FailureCode;
  replay_phase: ReplayPhase;
  context: FailureContext;
  timestamp: string;  // CONSTITUTIONAL SMELL
}
```

Even with fixed value like `'1970-01-01T00:00:00.000Z'`, the field implies temporal semantics.

### Constitutional Issue

Failure should be a logical replay artifact, not a runtime event.

### Required Fix

```typescript
export interface DeterministicFailure {
  code: FailureCode;
  replay_phase: ReplayPhase;
  context: FailureContext;
}
```

Remove every timestamp reference from:
- `deterministic_failure.ts`
- `deterministic_replay_engine.ts`
- `replay_state_machine.ts`
- Any failure serialization

### Classification

**P0** - Constitutional smell in failure model

---

## BLOCKER #2: Raw Error Construction Not Eliminated

### Audit Command

```bash
rg -n "new Error\(" runtime/replay
```

### Audit Results

**P0 FAIL** - "new Error(" exists in multiple files beyond deterministic_failure.ts:

- `constitutional_self_check.ts` (16 occurrences)
- `deterministic_failure.ts` (line 334 - acceptable runtime adapter)
- `merkle_tree.ts` (line 160)
- `replay_event_stream.ts` (lines 103, 108)
- `replay_types.ts` (lines 39, 46, 53)

### Constitutional Issue

User requirement: "ACCEPTABLE RUNTIME ADAPTER only if: new Error(...) exists nowhere else."

Current state: **FAIL** - Raw Error construction exists throughout codebase.

### Required Fix

Replace all `new Error(...)` with `DeterministicFailureFactory.toError(...)` or equivalent constitutional failure mechanism.

Files requiring fixes:
1. `constitutional_self_check.ts` - Replace 16 Error throws with DeterministicFailure
2. `merkle_tree.ts` - Replace Error throw with DeterministicFailure
3. `replay_event_stream.ts` - Replace 2 Error throws with DeterministicFailure
4. `replay_types.ts` - Replace 3 Error throws with DeterministicFailure

### Classification

**P0 FAIL** - Raw Error construction violates constitutional failure model

---

## BLOCKER #3: ReplayStateMachine Purity Claim

### Current Documentation

```typescript
/**
 * REPLAY STATE MACHINE
 * 
 * Pure TypeScript implementation of replay state machine.
 * 
 * Requirements:
 * - deterministic state transitions
 * - immutable state
 * - no side effects
 * - pure functional execution
 * - deterministic failure envelopes
 */
```

### Constitutional Issue

Documentation claims "immutable state" and "pure functional execution" but code contains:
```typescript
this.state = newState;
this.state.seen_event_ids.add(eventId);
this.state.event_to_artifact_map.set(eventId, artifactId);
```

This is internally stateful, not pure functional.

### Required Fix

Replace documentation with:

```typescript
/**
 * REPLAY STATE MACHINE
 * 
 * Deterministic TypeScript implementation of replay state machine.
 * 
 * Requirements:
 * - deterministic state transitions
 * - internally stateful
 * - externally replay-stable
 * - deterministic failure envelopes
 */
```

### Classification

**Documentation debt** - Not freeze blocking, but misleading documentation

---

## BLOCKER #4: FCA-12 Harness

### Current Test Pattern

```typescript
const engine = new DeterministicReplayEngine();

for (...) {
    engine.replay(...)
}
```

### Constitutional Issue

This tests **repeatability** (same engine, multiple replays) not **replay independence** (new engine per replay).

### Required Fix

```typescript
const results = [];

for (let i = 0; i < 1000; i++) {
    const engine = new DeterministicReplayEngine();
    results.push(engine.replay(stream));
}

// Additional constitutional test
assert(allWitnessesEqual(results));
```

### Classification

**P0** - Test must verify replay independence, not just repeatability

---

## BLOCKER #5: ReplayCertificate Duplication

### Current ADR-000Y

```typescript
type ReplayCertificate = {
  replay_identity: ReplayCommitment;
  replay_commitment: ReplayCommitment;
  // ...
};
```

### Constitutional Issue

ADR-000X established: `ReplayIdentity = ReplayCommitment`

Having both fields creates authority duplication.

### Required Fix

```typescript
type ReplayCertificate = {
  replay_commitment: ReplayCommitment;
  // ...
};
```

Identity remains derived:
```
identity := replay_commitment
```

### Classification

**P0 ADR correction** - Remove authority duplication

---

## BLOCKER #6: Witness Root Missing

### Current ADR-000Y

```typescript
type ReplayCertificate = {
  replay_commitment: ReplayCommitment;
  event_commitment: EventStreamCommitment;
  // ...
};
```

### Constitutional Issue

Certificate cannot identify which witness generated it. Verifier requires external witness transmission.

### Required Fix

```typescript
type ReplayCertificate = {
  witness_root: Hash;
  replay_commitment: ReplayCommitment;
  event_commitment: EventStreamCommitment;
  // ...
};
```

Authority chain becomes:
```
witness_root
    ↓
replay_commitment
    ↓
replay_identity
```

### Classification

**P0** - Certificate must be self-identifying

---

## BLOCKER #7: Inclusion Proofs Missing Direction

### Current ADR-000Y

```typescript
type WitnessInclusionProof = {
  leaf_id: string;
  leaf_hash: string;
  sibling_hashes: string[];
  root_hash: string;
}
```

### Constitutional Issue

Merkle verification requires position information (left/right) to reconstruct path.

`sibling_hashes: string[]` is insufficient.

### Required Fix

```typescript
type WitnessInclusionProof = {
  leaf_id: string;
  leaf_hash: string;
  root_hash: string;
  path: Array<{
    sibling_hash: string;
    position: "left" | "right";
  }>;
}
```

### Classification

**P0** - Inclusion proofs require position information

---

## BLOCKER #8: Constitutional Law Commitment

### Current ADR-000Y

Commits to:
- hash version
- canonicalization version
- replay version

### Constitutional Issue

Does not commit to constitutional law itself.

This allows:
```
same witness
same state
different replay law
```

Which is constitutional ambiguity.

### Required Fix

Add to ReplayCertificate:
```typescript
constitutional_law_commitment: Hash;
```

Constructed from:
- Invariant definitions
- Replay rules
- Authority hierarchy
- Witness laws
- Failure laws

### Classification

**New constitutional gap** - Certificate must commit to constitutional law

---

## BLOCKER #9: Missing Certificate Commitment

### Current ADR-000Y

```typescript
type ReplayCertificate = {
  witness_root: Hash;
  replay_commitment: ReplayCommitment;
  // ...
};
```

### Constitutional Issue

Current witness: `Replay -> WitnessRoot`

Missing: `ReplayCertificate -> CertificateCommitment`

Without `certificate_commitment = sha256(canonical_certificate)`:
- Cannot sign certificates
- Cannot notarize certificates
- Cannot deduplicate certificates
- Cannot reference certificates

### Required Fix

Add to ReplayCertificate:
```typescript
certificate_commitment: Hash;
```

Constructed from:
```typescript
certificate_commitment = sha256(canonicalSerialize(certificate))
```

### Classification

**P0** - Certificate cannot be exchanged independently without certificate_commitment

---

## BLOCKER #10: State Serialization Constitutional Rules

### Current State

Witness includes:
- `state_contents` via `state_serializer.serializeState(state)`

### Audit Results

**Map ordering**: **CONSTITUTIONAL** (state_serializer.ts lines 28-32)
- Artifact IDs sorted deterministically using string comparison
- **Status**: Frozen

**Set ordering**: **CONSTITUTIONAL** (state_serializer.ts line 40)
- artifact_lineage sorted deterministically
- **Status**: Frozen

**undefined handling**: **CONSTITUTIONAL** (canonical_json.ts line 94)
- Returns undefined as-is (no transformation)
- **Status**: Frozen (RFC-8785 compliant)

**floating point formatting**: **CONSTITUTIONAL** (canonical_json.ts lines 101-130)
- -0 vs 0: Always returns positive zero (line 103-105)
- NaN: REJECTS with DeterministicFailure (line 108-116)
- Infinity: REJECTS with DeterministicFailure (line 108-116)
- Scientific notation: Handles for safe integers (line 118-127)
- **Status**: Frozen (RFC-8785 compliant with constitutional extensions)

### Constitutional Issue

State serialization is constitutionally frozen:
- Map/Set ordering: Deterministic sorting
- undefined: RFC-8785 compliant (passes through)
- floating point: RFC-8785 compliant with constitutional extensions (rejects NaN/Infinity, normalizes -0)

**Status**: **RESOLVED** - State serialization rules are frozen

---

## BLOCKER #11: Law Commitment Not Actually Committed

### Current ADR-000Y

Commits to:
- schema_version: "1.0"
- policy_version: "1.0"
- replay_version: "1.0"

### Constitutional Issue

These are labels, not law.

Current version strings allow:
```
same version
different implementation
```

Need single frozen digest of actual law:
- Invariant definitions
- Replay rules
- Witness rules
- Failure rules
- Authority hierarchy

### Required Fix

Add to ReplayCertificate:
```typescript
constitutional_law_commitment: Hash;
```

Constructed from canonical serialization of:
- Invariant definitions
- Replay rules
- Witness rules
- Failure rules
- Authority hierarchy

### Classification

**P0** - Version strings insufficient for implementation equivalence guarantee

---

## RECLASSIFIED BLOCKERS

### Downgraded to P2 (Portability Concerns)

**Buffer Usage** (was P0 in audit)
- **Rationale**: Constitutional identity is bytes/canonicalization/hash, not implementation object
- **Impact**: Verifier can implement Uint8Array, Rust Vec<u8>, Go []byte, Java ByteBuffer
- **Classification**: **P2** - Implementation coupling, not identity ambiguity

**crypto.createHash()** (was P0 in audit)
- **Rationale**: SHA-256 is normative, Node crypto is one implementation
- **Impact**: Any SHA-256 implementation produces same bytes
- **Classification**: **P2** - Implementation coupling, not identity ambiguity

**CPU / OS Concerns** (was P0 in audit)
- **Rationale**: No actual evidence of divergence
- **Impact**: canonical bytes + sha256 + merkle is architecture-independent
- **Classification**: **P2** - No divergence evidence

### Resolved in ADR-000Y Update

**ReplayCertificate duplication** (was P0)
- **Status**: RESOLVED - Removed replay_identity field
- **Classification**: **RESOLVED**

**Witness root missing** (was P0)
- **Status**: RESOLVED - Added witness_root to certificate
- **Classification**: **RESOLVED**

**Inclusion proofs missing direction** (was P0)
- **Status**: RESOLVED - Added position field to path
- **Classification**: **RESOLVED**

---

## SUMMARY

### P0 Blockers (Must Fix Before Freeze)

1. **Raw Error Escapes** - Replace all `throw new Error()` with `throw DeterministicFailureFactory.toError()` in MerkleTree, ReplayEventStream, replay_types guards
2. **Missing Certificate Commitment** - Add `certificate_commitment = sha256(canonical_certificate)` to ReplayCertificate
3. **Law Commitment Not Actually Committed** - Add `constitutional_law_commitment` derived from invariants, replay rules, witness rules, failure rules, authority hierarchy
4. **FCA Replay Independence** - Add independent replay certification test (fresh runtime A == fresh runtime B)
5. **DeterministicFailure timestamp** - Remove timestamp field

### Resolved Blockers

6. **State Serialization Constitutional Rules** - **RESOLVED** - Map/Set ordering, undefined handling, floating point formatting are frozen (RFC-8785 compliant with constitutional extensions)

### P2 Portability Concerns (Not Freeze Blocking)

7. **Buffer Usage** - Implementation coupling, not identity ambiguity
8. **crypto.createHash()** - SHA-256 is normative, Node crypto is one implementation
9. **CPU / OS Concerns** - No actual evidence of divergence

### Documentation Debt

10. **ReplayStateMachine purity claim** - Update documentation to reflect internal statefulness

### Future Work (Not Freeze Blocking)

11. **Runtime Abstraction Layer** - Abstract Buffer and crypto for multi-language support
12. **Multi-language Verifier SDKs** - Portable verifier implementations
13. **Cross-host Certification Suite** - Prove portability across different runtimes

### Constitutional Status

**ADR-000Y CANNOT BE FROZEN** until all P0 blockers are resolved.

Most critical: **Blocker #1 (Raw Error Escapes)** requires refactoring across 4 files (MerkleTree, ReplayEventStream, replay_types, constitutional_self_check).
