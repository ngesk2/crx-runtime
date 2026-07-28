# FORENSIC PHASE 3: AUTHORITY BINDING AUDIT

## READ-ONLY AUDIT
NO PATCHES
NO PORTS
NO REFACTORING

---

## EXECUTIVE SUMMARY

**Primary Finding**: The replay kernel currently has **no cryptographic binding** between ReplayState, LineageGraph, WitnessRoot, and Fingerprint.

**Evidence**: Fingerprint is computed from event stream ONLY, while state, violations, and witness generation occur AFTER fingerprint generation.

**Constitutional Consequence**: Three independent identity systems with no proof they describe the same replay:
- Fingerprint = Event Stream Identity
- Witness Root = Replay Output Identity
- Lineage Graph = Derivation Identity

**Severity**: P0 - Authority fracture is more serious than missing archive features.

---

## FINDING 1: FINGERPRINT AUTHORITY ONLY COVERS INPUT

### Evidence

**deterministic_replay_engine.ts lines 59-60**:
```typescript
const canonicalBytes = this.hashAuthority.canonicalize(eventStream.toJSON());
const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
```

**deterministic_replay_engine.ts lines 46-47**:
```typescript
const state = stateMachine.getState();
```

**deterministic_replay_engine.ts lines 62-63**:
```typescript
const violations = this.invariantRunner.runInvariants(state);
```

**deterministic_replay_engine.ts lines 65-69**:
```typescript
const { witnessRoot, lineageGraph } = this.witnessAuthority.generateWitness(
  eventStream,
  state,
  violations
);
```

### Execution Order

1. `stateMachine.getState()` - compute state
2. `hashAuthority.canonicalize(eventStream.toJSON())` - canonicalize INPUT
3. `hashAuthority.computeFingerprint(canonicalBytes)` - fingerprint INPUT
4. `invariantRunner.runInvariants(state)` - compute violations
5. `witnessAuthority.generateWitness(...)` - compute witness from state + violations

### Constitutional Consequence

**Fingerprint attests**:
- INPUT STREAM (eventStream.toJSON())

**Fingerprint does NOT attest**:
- REPLAY RESULT (state)
- STATE (ReplayState)
- LINEAGE GRAPH (lineageGraph)
- WITNESS ROOT (witnessRoot)
- VIOLATIONS (violations)

### Authority Classification

**Current authority**:
- Fingerprint = Event Stream Identity

**NOT**:
- Replay Identity

### Severity

**P0 Constitutional Gap**

Not because implementation is wrong.
Because authority ownership is undefined.

---

## FINDING 2: WITNESS AUTHORITY IS STRONGER THAN FINGERPRINT AUTHORITY

### Evidence

**Witness generation consumes**:
- eventStream (input)
- state (output)
- violations (output)

**Fingerprint consumes**:
- eventStream (input only)

### Constitutional Consequence

**Witness root potentially commits to**:
- Inputs
- State
- Lineage
- Violations

**Fingerprint commits only to**:
- Inputs

### Constitutional Result

**WitnessRoot is currently the stronger identity artifact.**
**Fingerprint is weaker.**

This reverses the authority hierarchy assumed in Phase 2.

### Severity

**P0** - Authority hierarchy inversion.

---

## FINDING 3: REPLAYRESULT HAS TWO INDEPENDENT TRUTH SYSTEMS

### Evidence

**replay_types.ts ReplayResult interface**:
```typescript
export interface ReplayResult {
  state: ReplayState;
  fingerprint: Fingerprint;
  witness_root: WitnessRoot;
  lineage_graph: LineageGraph;
  canonical_bytes: CanonicalBytes;
  violations: InvariantViolation[];
  state_version: string;
  artifact_count: number;
}
```

### Constitutional Consequence

**ReplayResult contains**:
- fingerprint
- witness_root

**Nothing binds them**:
- No cross-check exists
- No inclusion proof exists
- No recomputation exists
- No authority reconciliation exists

### Theoretical Attack

A replay result can theoretically contain:
- Fingerprint A
- WitnessRoot B

And the type system accepts it.

### Constitutional Classification

**Authority Split-Brain.**

### Severity

**P0** - Two independent truth systems with no binding.

---

## FINDING 4: MERKLE TREE IS MORE CONSTITUTIONAL THAN CANONICALHASHAUTHORITY

### Evidence

**MerkleTree has**:
- Domain separation (HASH_DOMAIN_LEAF, HASH_DOMAIN_PARENT)
- Explicit topology (left, right)
- Proof system (generateProof(), verifyProof())
- Deterministic ordering (sort(...))
- Duplicate protection (duplicateLeafId())
- Execution limits (MAX_MERKLE_LEAVES)

**CanonicalHashAuthority has**:
- canonicalize()
- computeFingerprint()

Only.

### Constitutional Consequence

**The Merkle authority is actually more complete than the replay hash authority.**

### Severity

**P1** - Authority completeness inversion.

---

## FINDING 5: MERKLE VERSION IS DEAD METADATA

### Evidence

**merkle_tree.ts lines 54-55**:
```typescript
constructor(leaves, merkleVersion = 'v1') {
  this.merkleVersion = merkleVersion;
```

**Search for `this.merkleVersion` usage**:
- No use in hashBytes()
- No use in hashParent()
- No use in buildTree()
- No use in generateProof()
- No use in verifyProof()

### Constitutional Consequence

**v1, v2, v999 produce identical trees.**

Version field currently has:
- 0 cryptographic meaning
- 0 structural meaning
- 0 verification meaning

### Classification

**Dead authority metadata.**

### Severity

**P2** - Metadata without constitutional meaning.

---

## FINDING 6: PROOF VERIFICATION LACKS STRUCTURAL VALIDATION

### Evidence

**merkle_tree.ts lines 132-152**:
```typescript
static verifyProof(proof: MerkleProof): boolean {
  let currentHash = proof.leaf_hash;
  
  for (let i = 0; i < proof.sibling_hashes.length; i++) {
    const siblingHash = proof.sibling_hashes[i];
    const position = proof.sibling_positions[i];
    
    if (position === 'LEFT') {
      currentHash = MerkleTree.hashParent(
        Buffer.from(siblingHash, 'hex'),
        Buffer.from(currentHash, 'hex')
      );
    } else {
      currentHash = MerkleTree.hashParent(
        Buffer.from(currentHash, 'hex'),
        Buffer.from(siblingHash, 'hex')
      );
    }
  }
  
  return currentHash === proof.root_hash;
}
```

### Missing Validation

**Current check**:
- `recomputedHash === root_hash` only

**Missing check**:
- `sibling_hashes.length === sibling_positions.length`

### Example Attack

```typescript
hashes = [A]
positions = [LEFT, RIGHT]
```

Verification behavior becomes partially undefined.

### Constitutional Consequence

This is not cryptographic failure.
This is malformed proof acceptance.

### Severity

**P1** - Missing structural validation allows malformed proofs.

---

## FINDING 7: WITNESSLEAFID BRANDING IS MOSTLY COSMETIC

### Evidence

**replay_types.ts WitnessLeafId type**:
```typescript
export type WitnessLeafId = string & { brand: 'WitnessLeafId' };
```

**Validation** (inferred from usage):
- `id !== ''` only

### Constitutional Consequence

**Valid examples**:
- "dog" - valid
- "xyz" - valid
- "123" - valid

**Brand only exists after constructor call.**
**Runtime identity rules are nearly absent.**

### Comparison

**ArtifactId enforces**:
- `artifact-` prefix

**EventId enforces**:
- `evt-` prefix

**WitnessLeafId has no equivalent constitutional namespace.**

### Severity

**P1** - Weak authority branding allows invalid identities.

---

## FINDING 8: REPLAY TYPES REVEAL IDENTITY CONFUSION

### Evidence

**replay_types.ts LineageGraph interface**:
```typescript
export interface LineageGraph {
  parent_event_ids: ArtifactId[];
  // ...
}
```

**Field name**: `parent_event_ids`
**Type**: `ArtifactId[]`

**Sample data** (from corpus):
```json
"parent_event_ids": [
  "artifact-001"
]
```

### Constitutional Contradiction

**Field says**: event ids
**Type says**: artifact ids
**Data contains**: artifact ids

### Constitutional Consequence

**The type system and schema disagree.**

Lineage authority becomes ambiguous:
- Are these event IDs?
- Are these artifact IDs?
- Can they be mixed?

### Severity

**P0** - Lineage authority ambiguity.

---

## FINDING 9: CYCLE DETECTION TEST REVEALS AUTHORITY LEAK

### Evidence

**Cycle example** (from corpus):
```
artifact-001 <- artifact-003
artifact-002 <- artifact-001
artifact-003 <- artifact-002
```

**deterministic_replay_engine.ts execution order**:
1. Compute fingerprint (from event stream)
2. Compute state
3. Compute violations (cycle detection)
4. Compute witness

### Constitutional Consequence

**Invalid replay receives valid fingerprint.**

Fingerprint therefore means:
- identity

NOT:
- validity

### Constitutional Implication

This is not necessarily wrong.
But constitutional documentation must choose.

**Current code never states this.**

### Severity

**P1** - Documentation/Authority ambiguity.

---

## FINDING 10: CANONICALHASHAUTHORITY IS NOT ACTUALLY A HASH AUTHORITY

### Evidence

**canonical_hash_authority.ts**:
```typescript
export class CanonicalHashAuthority {
  canonicalize(obj: unknown): CanonicalBytes {
    const canonical = CanonicalJson.canonicalize(obj);
    const bytes = Buffer.from(canonical, 'utf8').toString('base64url');
    return {
      bytes,
      canonicalization_version: this.canonicalizationVersion
    };
  }

  computeFingerprint(canonicalBytes: CanonicalBytes): Fingerprint {
    const hash = this.hashBytes(canonicalBytes.bytes);
    return {
      hash,
      hash_algorithm: this.hashAlgorithm,
      hash_version: this.hashVersion
    };
  }
}
```

**Comment line 19**:
```typescript
// CONSTITUTIONAL RULE: Delegates canonicalization to CanonicalJson (sole canonicalization authority)
```

### Constitutional Consequence

**Current authority owns**:
- Canonicalization
- Encoding
- Hashing
- Fingerprint construction

**Actual authority graph**:
```
CanonicalJson
    ↓
CanonicalHashAuthority
```

### Constitutional Result

**CanonicalHashAuthority is not a pure hash authority.**
**It is a Fingerprint Authority.**

### Constitutional Severity

**P0** - Incorrect authority naming leads to architectural confusion.

---

## CONSTITUTIONAL SEVERITY RANKING

### P0 (Critical Constitutional Gaps)

1. **Fingerprint only attests input stream** - No cryptographic binding to replay result
2. **WitnessRoot and Fingerprint unbound** - Two independent truth systems
3. **Lineage field name/type contradiction** - parent_event_ids vs ArtifactId[]
4. **Split-brain replay identity model** - Three independent identity systems
5. **CanonicalHashAuthority naming incorrect** - It's a Fingerprint Authority, not Hash Authority

### P1 (High Constitutional Issues)

1. **Missing proof structural validation** - Allows malformed proofs
2. **Weak WitnessLeafId authority** - No namespace enforcement
3. **Validity vs identity ambiguity** - Fingerprint doesn't attest validity
4. **Missing cryptographic verification authority** - No verifyFingerprint with hash format validation

### P2 (Medium Constitutional Issues)

1. **Dead merkleVersion metadata** - Version field has no cryptographic meaning
2. **Buffer/TextEncoder portability concerns** - Node-only Buffer violates runtime neutrality
3. **Missing archive capabilities** - Domains, schema version, algorithm specification

---

## BRUTALLY HONEST CONCLUSION

The Phase 2 audit correctly identified that `canonical_fingerprint_service.js` is the ancestral authority.

However, the deeper constitutional problem is **not** that the current system lacks domain separation.

The deeper problem is that the runtime currently has **three separate identity systems**:

```
Fingerprint
    = Event Stream Identity

Witness Root
    = Replay Output Identity

Lineage Graph
    = Derivation Identity
```

**And there is no constitutional rule proving they describe the same replay.**

That authority fracture is more serious than the missing archive features because even if you port every missing function from `canonical_fingerprint_service.js`, the system still has no cryptographic statement connecting:

```
INPUT STREAM
        ↓
REPLAY
        ↓
STATE
        ↓
LINEAGE
        ↓
WITNESS ROOT
```

---

## REQUIRED CONSTITUTIONAL BINDING

### Missing Binding

**Current state**:
- Fingerprint = hash(event_stream)
- WitnessRoot = merkle(state, lineage, violations)
- No cryptographic relationship between them

**Required state**:
- Fingerprint = hash(event_stream, state, lineage, witness_root)
- OR: WitnessRoot includes fingerprint as leaf
- OR: ReplayResult includes inclusion proof

### Constitutional Options

**Option A: Fingerprint covers full replay**
```typescript
const fingerprint = this.hashAuthority.computeFingerprint({
  event_stream: eventStream.toJSON(),
  state: state,
  lineage: lineageGraph,
  witness_root: witnessRoot
});
```

**Option B: WitnessRoot includes fingerprint**
```typescript
const witnessRoot = this.witnessAuthority.generateWitness(
  eventStream,
  state,
  violations,
  fingerprint  // Include fingerprint as witness leaf
);
```

**Option C: ReplayResult includes inclusion proof**
```typescript
const result: ReplayResult = {
  fingerprint,
  witness_root,
  inclusion_proof: proof  // Proof that fingerprint is in witness
};
```

### Severity

**P0** - Without cryptographic binding, replay identity is constitutionally undefined.
