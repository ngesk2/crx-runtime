# FORENSIC PHASE 4: WITNESS AUTHORITY TRACE

## READ-ONLY AUDIT
NO PATCHES
NO REFACTORING
NO NEW AUTHORITIES
NO HASH REDESIGN

---

## EXECUTIVE SUMMARY

**Finding**: The runtime does **NOT** possess a single replay identity authority.

**Evidence**: Three independent identity systems with no cryptographic binding:
- Fingerprint = Event Stream Identity (hash of input only)
- Witness Root = Replay Output Identity (Merkle root of 14 leaves)
- Lineage Graph = Derivation Identity (artifact lineage edges)

**Critical Constitutional Gap**: Witness root includes fingerprint as a leaf, but fingerprint does NOT include witness root. No bidirectional cryptographic binding exists.

**Severity**: P0 - Authority fracture prevents constitutional replay identity verification.

---

## 1. WITNESS AUTHORITY EXECUTION TRACE

### Entry Point: WitnessAuthority.generateWitness()

**File**: `runtime/replay/witness_authority.ts` lines 44-62

**Execution Flow**:
```
generateWitness(eventStream, state, violations)
    ↓
Step 1: canonicalizeEventStream(eventStream)
    ↓ hashAuthority.canonicalize(eventStream.toJSON())
    ↓ returns CanonicalBytes
    ↓
Step 2: computeFingerprint(canonicalBytes)
    ↓ hashAuthority.computeFingerprint(canonicalBytes)
    ↓ returns Fingerprint
    ↓
Step 3: buildLineageGraph(state)
    ↓ sorts artifact IDs deterministically
    ↓ builds lineage edges from artifact_lineage
    ↓ returns LineageGraph
    ↓
Step 4: computeWitnessRoot(canonicalBytes, fingerprint, lineage, state, violations)
    ↓ builds 14 Merkle leaves
    ↓ constructs Merkle tree
    ↓ returns WitnessRoot
```

### Step 1: Canonicalization

**File**: `witness_authority.ts` lines 67-70

```typescript
private canonicalizeEventStream(eventStream: ReplayEventStream): CanonicalBytes {
  const json = eventStream.toJSON();
  return this.hashAuthority.canonicalize(json);
}
```

**Input**: `ReplayEventStream` (array of `CanonicalEventEnvelope`)
**Output**: `CanonicalBytes` (base64url-encoded canonical JSON)
**Authority**: Delegates to `CanonicalHashAuthority.canonicalize()`

### Step 2: Fingerprint

**File**: `witness_authority.ts` lines 52-53

```typescript
const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
```

**Input**: `CanonicalBytes` (from Step 1)
**Output**: `Fingerprint` (sha256:hex)
**Authority**: Delegates to `CanonicalHashAuthority.computeFingerprint()`

### Step 3: Lineage Graph

**File**: `witness_authority.ts` lines 76-103

```typescript
public buildLineageGraph(state: ReplayState): LineageGraph {
  const edges: any[] = [];
  
  // Constitutional rule: sort artifact IDs deterministically for lineage derivation
  const sortedArtifactIds = Array.from(state.artifacts.keys()).sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  
  for (const artifactId of sortedArtifactIds) {
    const artifactState = state.artifacts.get(artifactId);
    if (artifactState) {
      for (const parentId of artifactState.artifact_lineage) {
        edges.push({
          parent_id: parentId,
          child_id: artifactId,
          edge_type: 'derivation'
        });
      }
    }
  }
  
  return {
    edges,
    graph_version: '1.0'
  };
}
```

**Input**: `ReplayState` (from replay state machine)
**Output**: `LineageGraph` (array of lineage edges)
**Ordering Guarantee**: Deterministic sort by artifact ID
**Authority**: Direct construction (no delegation)

### Step 4: Witness Root

**File**: `witness_authority.ts` lines 108-208

**Input**: `canonicalBytes`, `fingerprint`, `lineage`, `state`, `violations`
**Output**: `WitnessRoot` (Merkle root hash)
**Authority**: Delegates to `MerkleTree` constructor

---

## 2. WITNESS LEAF SCHEMA INVENTORY

### Complete Leaf List (14 leaves)

**File**: `witness_authority.ts` lines 116-195

| Leaf ID | Source | Encoding | Constitutional Meaning |
|---------|--------|----------|------------------------|
| canonical_bytes | canonicalBytes.bytes | base64url → Buffer | Input stream canonicalization |
| fingerprint | fingerprint.hash (strip sha256:) | hex → Buffer | Fingerprint of input stream |
| lineage | lineage (LineageGraph) | CanonicalJson.toBuffer → Buffer | Artifact derivation graph |
| state_version | state.state_version | utf8 → Buffer | Replay state version |
| schema_version | '1.0' (literal) | utf8 → Buffer | Schema version constant |
| replay_version | '1.0' (literal) | utf8 → Buffer | Replay version constant |
| policy_version | '1.0' (literal) | utf8 → Buffer | Policy version constant |
| canonicalization_version | '1.0' (literal) | utf8 → Buffer | Canonicalization version constant |
| hash_version | 'sha256' (literal) | utf8 → Buffer | Hash algorithm identifier |
| artifact_count | state.artifacts.size | utf8 → Buffer | Number of artifacts in state |
| state_contents | state (ReplayState) | StateSerializer.serializeState → Buffer | Full replay state |
| violations_canonical | violations (array) | StateSerializer.serializeViolations → Buffer | Invariant violations |
| leaf_count | baseLeaves.length + 2 | utf8 → Buffer | Number of leaves in tree |
| tree_height | Math.ceil(Math.log2(leafCount)) | utf8 → Buffer | Height of Merkle tree |

### Leaf Ordering Guarantee

**File**: `witness_authority.ts` lines 116-195

**Ordering**: Explicit array order (deterministic by construction)
**No sorting**: Leaves are added in fixed order
**Determinism**: Guaranteed by array literal order

### Excluded from Witness

**NOT included in witness leaves**:
- Event stream (only canonical_bytes included)
- Individual events (only aggregated canonicalization)
- Event IDs (only lineage edges)
- Actor IDs
- Timestamps
- Payloads
- Schema/policy/replay versions from events (only literal constants)

---

## 3. ANSWERS TO PRIMARY INVESTIGATION QUESTIONS

### Q1: What becomes witness leaves?

**Answer**: 14 fixed leaves covering:
- Input canonicalization (canonical_bytes)
- Fingerprint (fingerprint)
- Lineage graph (lineage)
- State (state_contents)
- Violations (violations_canonical)
- Metadata (state_version, schema_version, replay_version, policy_version, canonicalization_version, hash_version, artifact_count, leaf_count, tree_height)

### Q2: What ordering guarantees exist?

**Answer**:
- Leaf ordering: Fixed array literal order (deterministic)
- Lineage edges: Sorted by artifact ID (deterministic)
- Merkle tree: Sorted by leaf_id (deterministic per MerkleTree constructor)

### Q3: What is hashed?

**Answer**:
- canonical_bytes: base64url-decoded bytes
- fingerprint: hex-decoded bytes (sha256: prefix stripped)
- lineage: CanonicalJson-canonicalized bytes
- state_contents: StateSerializer-serialized bytes
- violations_canonical: StateSerializer-serialized bytes
- Metadata: utf8-encoded literal strings
- All leaves: SHA-256 with domain separation (HASH_DOMAIN_LEAF/HASH_DOMAIN_PARENT)

### Q4: What is excluded?

**Answer**:
- Raw event stream (only canonicalization included)
- Individual event fields (IDs, types, actors, timestamps, payloads)
- Event-level schema/policy/replay versions (only literal constants included)
- Actor identities
- Temporal information (timestamps)
- Payload contents

### Q5: Whether fingerprint is included anywhere?

**Answer**: **YES** - fingerprint is included as witness leaf #2

**File**: `witness_authority.ts` lines 122-125

```typescript
{
  leaf_id: toWitnessLeafId('fingerprint'),
  leaf_bytes: Buffer.from(fingerprint.hash.replace(/^sha256:/, ''), 'hex'),
  leaf_hash: ''
}
```

**Constitutional Implication**: Witness root commits to fingerprint, but fingerprint does NOT commit to witness root. Unidirectional binding only.

### Q6: Whether lineage is directly committed or reconstructed?

**Answer**: **Directly committed**

**File**: `witness_authority.ts` lines 127-130

```typescript
{
  leaf_id: toWitnessLeafId('lineage'),
  leaf_bytes: CanonicalJson.toBuffer(lineage),
  leaf_hash: ''
}
```

**Source**: Lineage is constructed from `state.artifacts` in `buildLineageGraph()` (lines 76-103)
**Method**: Direct canonicalization via `CanonicalJson.toBuffer()`
**No reconstruction**: Lineage is not reconstructed from witness leaves

### Q7: Whether violations affect witness deterministically?

**Answer**: **YES** - violations are included as witness leaf #12

**File**: `witness_authority.ts` lines 172-175

```typescript
{
  leaf_id: toWitnessLeafId('violations_canonical'),
  leaf_bytes: this.stateSerializer.serializeViolations(violations),
  leaf_hash: ''
}
```

**Determinism**: `StateSerializer.serializeViolations()` sorts violations deterministically (confirmed in state_serializer.ts)
**Impact**: Different violations produce different witness roots

### Q8: Whether witness generation is replay-stable?

**Answer**: **YES** - witness generation is deterministic

**Evidence**:
- Leaf ordering: Fixed array literal
- Lineage edges: Sorted by artifact ID
- State serialization: Sorted artifact IDs
- Violations serialization: Sorted violations
- Merkle tree: Sorted by leaf_id
- No runtime entropy: No Date.now(), no random, no external input

### Q9: Whether leaf namespaces/domain separation exist?

**Answer**: **NO domain separation, weak namespace**

**Leaf IDs**:
- String literals: 'canonical_bytes', 'fingerprint', 'lineage', etc.
- No domain prefix (unlike archive FINGERPRINT_DOMAINS)
- No namespace validation (unlike ArtifactId 'artifact-', EventId 'evt-')
- Only validation: `id !== ''` (from toWitnessLeafId)

**Merkle domain separation**:
- HASH_DOMAIN_LEAF (0x00) for leaf hashes
- HASH_DOMAIN_PARENT (0x01) for parent hashes
- This is Merkle topology domain separation, NOT semantic domain separation

### Q10: Whether witness identity can diverge from replay identity?

**Answer**: **YES** - witness identity can diverge from fingerprint identity

**Divergence Points**:
1. Fingerprint = hash(event_stream) only
2. Witness root = merkle(canonical_bytes, fingerprint, lineage, state, violations)
3. Same event stream + different state = same fingerprint, different witness root
4. Same event stream + different violations = same fingerprint, different witness root
5. Same event stream + different lineage = same fingerprint, different witness root

**No Binding**: No cryptographic proof that fingerprint and witness root describe the same replay.

---

## 4. MERKLE COMMITMENT MAP

### Merkle Tree Commitments

**File**: `merkle_tree.ts` lines 249-270

**Leaf Hashing**:
```typescript
private hashBytes(bytes: Buffer, isLeaf: boolean = true): string {
  const prefix = isLeaf ? Buffer.from([HASH_DOMAIN_LEAF]) : Buffer.from([HASH_DOMAIN_PARENT]);
  const combined = Buffer.concat([prefix, bytes]);
  return crypto.createHash('sha256').update(combined).digest('hex');
}
```

**Commitments**:
- HASH_DOMAIN_LEAF (0x00) prefix for all 14 leaves
- SHA-256 hashing of leaf bytes
- HASH_DOMAIN_PARENT (0x01) prefix for all parent nodes
- SHA-256 hashing of concatenated child hashes

**Witness Root Commits To**:
- Input stream (via canonical_bytes)
- Fingerprint (via fingerprint leaf)
- Lineage (via lineage leaf)
- State (via state_contents leaf)
- Violations (via violations_canonical leaf)
- Metadata (via version/count leaves)

**Witness Root Does NOT Commit To**:
- Event stream directly (only canonicalization)
- Individual events
- Event IDs
- Actor identities
- Timestamps
- Payloads

---

## 5. REPLAY IDENTITY DEPENDENCY GRAPH

### Current Identity Systems

```
Event Stream
    ↓
CanonicalHashAuthority.canonicalize()
    ↓
CanonicalBytes
    ↓
CanonicalHashAuthority.computeFingerprint()
    ↓
Fingerprint (Identity System 1: Input Identity)

Event Stream
    ↓
ReplayStateMachine.applyEvent()
    ↓
ReplayState
    ↓
WitnessAuthority.buildLineageGraph()
    ↓
LineageGraph (Identity System 3: Derivation Identity)

CanonicalBytes
    ↓
Fingerprint
    ↓
ReplayState
    ↓
LineageGraph
    ↓
Violations
    ↓
WitnessAuthority.computeWitnessRoot()
    ↓
MerkleTree
    ↓
WitnessRoot (Identity System 2: Output Identity)
```

### Dependency Analysis

**Fingerprint depends on**:
- Event stream only

**Witness Root depends on**:
- Event stream (via canonical_bytes)
- Fingerprint (via fingerprint leaf)
- State (via state_contents leaf)
- Lineage (via lineage leaf)
- Violations (via violations_canonical leaf)

**Lineage Graph depends on**:
- State only

**No Bidirectional Binding**:
- Fingerprint does NOT depend on witness root
- Fingerprint does NOT depend on state
- Fingerprint does NOT depend on lineage
- Fingerprint does NOT depend on violations
- Witness root depends on fingerprint (unidirectional)

---

## 6. ALL LOCATIONS WHERE REPLAY IDENTITY CAN DIVERGE

### Divergence Point 1: State Divergence

**Location**: `deterministic_replay_engine.ts` lines 46-47

**Scenario**: Same event stream, different state machine implementation
**Result**: Same fingerprint, different witness root
**Detection**: No detection mechanism exists

### Divergence Point 2: Lineage Divergence

**Location**: `witness_authority.ts` lines 76-103

**Scenario**: Same event stream + state, different lineage construction
**Result**: Same fingerprint, different witness root
**Detection**: No detection mechanism exists

### Divergence Point 3: Violations Divergence

**Location**: `witness_authority.ts` lines 172-175

**Scenario**: Same event stream + state + lineage, different invariant runner
**Result**: Same fingerprint, different witness root
**Detection**: No detection mechanism exists

### Divergence Point 4: Canonicalization Divergence

**Location**: `canonical_hash_authority.ts` lines 45-51

**Scenario**: Same event stream, different canonicalization
**Result**: Different fingerprint, different witness root
**Detection**: No detection mechanism exists

### Divergence Point 5: Merkle Construction Divergence

**Location**: `merkle_tree.ts` lines 158-200

**Scenario**: Same leaves, different Merkle construction
**Result**: Same fingerprint, different witness root
**Detection**: No detection mechanism exists

---

## 7. DUPLICATE AUTHORITY IMPLEMENTATIONS

### Hashing Authorities

**Location 1**: `canonical_hash_authority.ts` line 71
```typescript
const hash = crypto.createHash('sha256').update(buffer).digest('hex');
```
**Purpose**: Fingerprint computation
**Algorithm**: SHA-256
**Encoding**: hex

**Location 2**: `merkle_tree.ts` lines 252, 269
```typescript
return crypto.createHash('sha256').update(combined).digest('hex');
```
**Purpose**: Merkle node hashing
**Algorithm**: SHA-256
**Encoding**: hex
**Domain separation**: HASH_DOMAIN_LEAF/HASH_DOMAIN_PARENT

**Location 3**: `constitutional_self_check.ts` line 83
```typescript
const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
```
**Purpose**: Corpus file verification
**Algorithm**: SHA-256
**Encoding**: hex (uppercase)

**Finding**: Three independent SHA-256 implementations with no central authority.

### Canonicalization Authorities

**Location 1**: `canonical_json.ts` - RFC-8785 canonicalization
**Purpose**: JSON canonicalization
**Used by**: CanonicalHashAuthority, CanonicalEventEnvelope, StateSerializer

**Location 2**: `canonical_hash_authority.ts` - Delegates to CanonicalJson
**Purpose**: Fingerprint canonicalization
**Used by**: WitnessAuthority, DeterministicReplayEngine

**Finding**: Single canonicalization authority (constitutional).

### Byte Encoding Authorities

**Location 1**: `canonical_json.ts` line 171
```typescript
return Buffer.from(canonical, 'utf8');
```
**Purpose**: Canonical JSON to Buffer
**Runtime**: Node-only

**Location 2**: `canonical_hash_authority.ts` lines 47, 70
```typescript
const bytes = Buffer.from(canonical, 'utf8').toString('base64url');
const buffer = Buffer.from(bytes, 'base64url');
```
**Purpose**: Canonical bytes encoding/decoding
**Runtime**: Node-only

**Location 3**: `witness_authority.ts` lines 119-194
```typescript
Buffer.from(canonicalBytes.bytes, 'base64url')
Buffer.from(fingerprint.hash.replace(/^sha256:/, ''), 'hex')
Buffer.from(state.state_version, 'utf8')
// ... 11 more Buffer.from calls
```
**Purpose**: Witness leaf byte encoding
**Runtime**: Node-only

**Finding**: Multiple byte encoding authorities, all Node-only (constitutional violation).

---

## 8. HIDDEN SCHEMA/RUNTIME AUTHORITY COLLISIONS

### Artifact 1: CanonicalEventEnvelope Authority Collision

**File**: `canonical_event_envelope.ts` lines 10, 15

```typescript
import { CanonicalEventEnvelope } from './replay_types';

export class CanonicalEventEnvelope {
  private readonly envelope: CanonicalEventEnvelope;
```

**Collision**: Interface and runtime class share same name
**Consequence**: Schema authority and runtime authority conflated
**Classification**: P1 authority-boundary leak

### Artifact 2: parent_event_ids Semantic Drift

**Schema**: `replay_types.ts` line 65
```typescript
parent_event_ids: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only
```

**Field Name**: "parent_event_ids"
**Type**: `ArtifactId[]`
**Comment**: "lineage uses artifact IDs only"

**Runtime Usage**: `replay_state_machine.ts` lines 66, 101-132
```typescript
const lineage = event.getLineage().parent_event_ids;

// Constitutional rule: lineage namespace consistency
// Lineage must use only event IDs or only artifact IDs, never both
const hasEventIds = lineage.some(id => id.startsWith('evt-'));
const hasArtifactIds = lineage.some(id => !id.startsWith('evt-'));
if (hasEventIds && hasArtifactIds) {
  throw DeterministicFailureFactory.toError(
    DeterministicFailureFactory.lineageNamespaceViolation('mixed')
  );
}

// Convert event IDs to artifact IDs using event_to_artifact_map
for (const parentId of lineage) {
  let parentArtifactId: string;
  if (parentId.startsWith('evt-')) {
    parentArtifactId = this.state.event_to_artifact_map.get(parentId);
  } else {
    parentArtifactId = parentId;
  }
}
```

**Finding**: Runtime accepts BOTH event IDs and artifact IDs, converts event IDs to artifact IDs
**Schema Meaning**: Effectively `parent_artifact_ids` masquerading as `parent_event_ids`
**Classification**: P0 constitutional ambiguity

**Investigation Result**: Runtime path assumes event lineage semantics (conversion from event IDs to artifact IDs). Schema evolved to artifact lineage but field name and runtime conversion logic retain event lineage semantics.

### Artifact 3: WitnessLeafId Namespace Vacuum

**Validation**: `replay_types.ts` lines 32-34
```typescript
export function isWitnessLeafId(id: string): id is WitnessLeafId {
  return id !== '';
}
```

**Usage**: `witness_authority.ts` lines 118-191
```typescript
toWitnessLeafId('canonical_bytes')
toWitnessLeafId('fingerprint')
toWitnessLeafId('lineage')
// ... 11 more string literals
```

**Finding**: No namespace enforcement (unlike ArtifactId 'artifact-', EventId 'evt-')
**Consequence**: Ungoverned witness namespaces
**Classification**: P1 weak authority branding

### Artifact 4: CanonicalHashAuthority Responsibility Drift

**Current Authority Owns**:
- canonicalization() (delegates to CanonicalJson)
- computeFingerprint() (includes encoding + hashing)
- hashBytes() (internal hashing)

**Comment**: `canonical_hash_authority.ts` line 19
```typescript
// CONSTITUTIONAL RULE: Delegates canonicalization to CanonicalJson (sole canonicalization authority)
```

**Finding**: Authority named "HashAuthority" but behaves as "FingerprintAuthority"
**Actual Authority Graph**: CanonicalJson → CanonicalHashAuthority
**Classification**: P0 incorrect authority naming

---

## 9. EXACT CONSTITUTIONAL MEANING

### Current Fingerprint

**Definition**: `sha256:hash(base64url(canonical_json(event_stream)))`

**Constitutional Meaning**: Input stream identity only
**Commits To**: Event stream canonicalization
**Does NOT Commit To**: State, lineage, violations, witness root

### Current Witness Root

**Definition**: `merkle_sha256_v1(14_leaves_with_domain_separation)`

**Constitutional Meaning**: Replay output identity
**Commits To**: 
- Input stream (via canonical_bytes)
- Fingerprint (via fingerprint leaf)
- State (via state_contents leaf)
- Lineage (via lineage leaf)
- Violations (via violations_canonical leaf)
- Metadata (via version/count leaves)

**Does NOT Commit To**: Event stream directly, individual events, event IDs, actors, timestamps, payloads

### Current Lineage Graph

**Definition**: Array of `{parent_id: ArtifactId, child_id: ArtifactId, edge_type: string}`

**Constitutional Meaning**: Artifact derivation identity
**Commits To**: Artifact lineage edges
**Does NOT Commit To**: Event lineage (despite field name), witness root, fingerprint

---

## 10. FINAL DETERMINATION

### Question: Does the runtime currently possess a single replay identity authority?

**Answer**: **NO**

### Evidence

**Three Independent Identity Systems**:
1. **Fingerprint** = Input Identity (hash of event stream only)
2. **Witness Root** = Output Identity (Merkle root of replay outputs)
3. **Lineage Graph** = Derivation Identity (artifact lineage edges)

**No Cryptographic Binding**:
- Fingerprint does NOT commit to witness root
- Fingerprint does NOT commit to state
- Fingerprint does NOT commit to lineage
- Fingerprint does NOT commit to violations
- Witness root commits to fingerprint (unidirectional only)
- No bidirectional cryptographic proof

**Divergence Points**:
- Same event stream + different state = same fingerprint, different witness root
- Same event stream + different violations = same fingerprint, different witness root
- Same event stream + different lineage = same fingerprint, different witness root

**No Detection Mechanism**:
- No inclusion proof between fingerprint and witness root
- No cross-validation between identity systems
- No constitutional rule defining which identity is authoritative

### Smallest Possible Constitutional Binding Surface

**Option A: Fingerprint covers full replay**
```typescript
const fingerprint = this.hashAuthority.computeFingerprint({
  event_stream: canonicalBytes,
  state: stateContents,
  lineage: lineage,
  witness_root: witnessRoot
});
```
**Binding Surface**: Fingerprint computation
**Impact**: Breaking change (fingerprint changes)
**Advantage**: Single identity authority

**Option B: Witness root includes fingerprint (current)**
```typescript
// Current implementation - fingerprint is leaf #2
```
**Binding Surface**: Witness leaf construction
**Impact**: No breaking change
**Disadvantage**: Unidirectional binding only

**Option C: ReplayResult includes inclusion proof**
```typescript
const result: ReplayResult = {
  fingerprint,
  witness_root,
  inclusion_proof: proof  // Proof that fingerprint is in witness
};
```
**Binding Surface**: Proof generation
**Impact**: Breaking change (new field)
**Advantage**: Bidirectional cryptographic binding

**Option D: Fingerprint includes witness root**
```typescript
// Compute witness first, then fingerprint includes witness root
const { witnessRoot } = this.witnessAuthority.generateWitness(...);
const fingerprint = this.hashAuthority.computeFingerprint({
  event_stream: canonicalBytes,
  witness_root: witnessRoot
});
```
**Binding Surface**: Execution order + fingerprint computation
**Impact**: Breaking change (execution order changes)
**Advantage**: Single identity authority

### Constitutional Recommendation

**Smallest Binding Surface**: Option C (inclusion proof)

**Rationale**:
- Minimal change (add proof field to ReplayResult)
- No breaking change to fingerprint computation
- No breaking change to witness generation
- Provides bidirectional cryptographic binding
- Allows verification that fingerprint is included in witness

**Alternative**: Option D (fingerprint includes witness root)

**Rationale**:
- Single identity authority (fingerprint)
- Constitutional clarity (fingerprint = replay identity)
- Breaking change but architecturally correct
- Aligns with roadmap (fingerprint as primary identity)

---

## CONCLUSION

The runtime currently has **no single replay identity authority**. Three independent identity systems (fingerprint, witness root, lineage) operate with no cryptographic binding. The witness root includes the fingerprint as a leaf, but the fingerprint does not include the witness root. This unidirectional binding allows replay identity to diverge between input and output.

The smallest constitutional binding surface is to add an inclusion proof to ReplayResult (Option C), providing bidirectional cryptographic binding without breaking existing fingerprint or witness computation. Alternatively, restructure execution order so fingerprint includes witness root (Option D), establishing fingerprint as the single replay identity authority.

**Constitutional Severity**: P0 - Authority fracture prevents constitutional replay identity verification.
