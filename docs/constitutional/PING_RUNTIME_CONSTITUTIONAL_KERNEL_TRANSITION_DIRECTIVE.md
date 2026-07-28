# PING Runtime Constitutional Kernel Transition Directive

**Transition Date:** 2026-06-18  
**Transition Mode:** CONSTITUTIONAL IDENTITY PRIMITIVE TRANSITION  
**Transition Principle:** Transition PING Runtime from Artifact-Centric to Claim-Centric constitution.

---

## CONSTITUTIONAL STATUS

ClaimIdentity has been adopted as constitutional identity.

This supersedes the previous Artifact-Centric constitutional model.

The runtime is now formally transitioning from:

```text
Artifact-Centric Constitution
```

to

```text
Claim-Centric Constitution
```

---

## CONSTITUTIONAL REWRITE SCOPE

The following components are now constitutionally invalid and must be redesigned.

### Invalid Constitutional Assumption

```text
ArtifactId == Identity
```

This assumption must be removed from:
- replay kernel
- lineage model
- witness model
- certificate model
- projection model
- continuity model

---

## NEW CONSTITUTIONAL IDENTITY STACK

```text
ClaimId
    ↓
ArtifactId
    ↓
EventId
```

### Definitions

**ClaimId**
= constitutional identity

**ArtifactId**
= constitutional representation

**EventId**
= constitutional causality witness

---

## CONSTITUTIONAL SOURCE OF TRUTH

### Previous

```text
Artifact
```

### New

```text
Claim
```

### Constitutional Truth

Constitutional truth is now:
```text
Claim Continuity
```

**not:**
```text
Artifact Continuity
```

---

## KERNEL REWRITE ORDER

Implementation SHALL occur in the following order.

Any deviation is a constitutional violation.

---

## STAGE 1 — CLAIM FOUNDATION

### Create

```text
ClaimId
ClaimAuthority
ClaimLineage
ClaimGraph
```

### Constitutional Rule

No other phase may begin before completion.

### Deliverables

```typescript
ClaimId

ClaimState

ClaimAuthority

ClaimGraphNode

ClaimGraphEdge
```

### File Locations

- `PING/runtime/claim/claim_id.ts` (new file)
- `PING/runtime/claim/claim_authority.ts` (new file)
- `PING/runtime/claim/claim_lineage.ts` (new file)
- `PING/runtime/claim/claim_graph.ts` (new file)

### Risk

**HIGH** - Foundation stage, all subsequent stages depend on this

---

## STAGE 2 — IDENTITY REWRITE

### Rewrite

```text
IdentityAuthority
```

### Into

```text
ClaimId ↔ ArtifactId mapping authority
```

### Remove

```text
identity derivation
canonical hashing
canonicalization
```

**from IdentityAuthority.**

### Required APIs

```typescript
bindArtifact(claimId: ClaimId, artifactId: ArtifactId): void
resolveClaim(artifactId: ArtifactId): ClaimId | null
resolveArtifact(claimId: ClaimId): ArtifactId | null
resolveCurrentArtifact(claimId: ClaimId): ArtifactId | null
```

### File Location

`PING/runtime/identity/identity_authority.ts`

### Risk

**HIGH** - IdentityAuthority redesign

---

## STAGE 3 — LINEAGE REWRITE

### Replace

```text
artifact lineage
```

**as constitutional graph.**

### Create

```text
Claim Graph
Artifact Graph
```

### Constitutional Rule

Claim Graph becomes authoritative.

Artifact Graph becomes derived.

### Required APIs

```typescript
buildClaimGraph(events: Event[]): ClaimGraph
buildArtifactGraph(events: Event[]): ArtifactGraph
validateClaimContinuity(claimId: ClaimId): boolean
validateArtifactContinuity(artifactId: ArtifactId): boolean
```

### File Location

`PING/runtime/lineage/lineage_authority.ts`

### Risk

**HIGH** - Lineage authority redesign

---

## STAGE 4 — REPLAY REWRITE

### Replace

```text
ArtifactStateMachine
```

### With

```text
ClaimStateMachine
```

### Constitutional Rule

Replay SHALL reconstruct:
```text
Claim State
```

Artifacts become projections.

### Required Structure

```typescript
interface ClaimState {
  claim_id: ClaimId;
  current_artifact_id: ArtifactId;
  artifact_history: ArtifactId[];
  claim_lineage: ClaimId[];
  supersedes: ClaimId[];
  superseded_by: ClaimId[];
  forked_from: ClaimId[];
  forked_into: ClaimId[];
  merged_from: ClaimId[];
  merged_into: ClaimId[];
}
```

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**HIGH** - Replay state machine refactor

---

## STAGE 5 — EVENTSTORE REWRITE

### Introduce

```text
claim_created
claim_replaced
claim_forked
claim_merged
claim_migrated
```

**events.**

### Constitutional Rule

EventStore becomes claim-aware.

### Required Event Types

```typescript
interface ClaimCreatedEvent {
  event_type: 'claim_created';
  claim_id: ClaimId;
  artifact_id: ArtifactId;
  lineage: { parent_claim_ids: ClaimId[] };
}

interface ClaimReplacedEvent {
  event_type: 'claim_replaced';
  claim_id: ClaimId;
  superseded_claim_id: ClaimId;
  new_artifact_id: ArtifactId;
}

interface ClaimForkedEvent {
  event_type: 'claim_forked';
  parent_claim_id: ClaimId;
  forked_claim_ids: ClaimId[];
}

interface ClaimMergedEvent {
  event_type: 'claim_merged';
  merged_claim_ids: ClaimId[];
  resulting_claim_id: ClaimId;
}

interface ClaimMigratedEvent {
  event_type: 'claim_migrated';
  claim_id: ClaimId;
  migration_context: unknown;
}
```

### File Location

`PING/runtime/kernel/event-store/` (new directory)

### Risk

**HIGH** - EventStore evolution

---

## STAGE 6 — WITNESS REWRITE

### Witness Subject

```text
ClaimId
```

### Constitutional Rule

Witnesses SHALL prove:
```text
constitutional continuity
```

**not:**
```text
artifact continuity
```

### Required Structure

```typescript
interface WitnessLeaf {
  leaf_id: WitnessLeafId;
  claim_id: ClaimId;
  artifact_id: ArtifactId;
  canonical_hash: string;
  lineage_commitment: string;
}

interface WitnessRoot {
  witness_root: string;
  witness_algorithm: string;
  witness_version: string;
  leaf_count: number;
  tree_height: number;
  claim_id: ClaimId;
}
```

### File Location

`PING/runtime/witness/witness_authority.ts`

### Risk

**MEDIUM** - Witness subject refactor

---

## STAGE 7 — CERTIFICATE REWRITE

### Certificate Subject

```text
ClaimId
```

### Constitutional Rule

Certificates SHALL certify:
```text
continuous constitutional existence
```

**through:**
- replacement
- migration
- fork
- merge
- supersession

### Required Commitments

```typescript
interface ReplayCertificate {
  certificate_commitment: string;
  witness_root: string;
  replay_commitment: string;
  event_commitment: string;
  derivation_graph_commitment: string;
  state_commitment: string;
  violation_commitment: string;
  constitutional_law_commitment: string;
  canonicalization_commitment: string;
  hash_authority_commitment: string;
  
  claim_continuity_commitment: string;
  claim_lineage_commitment: string;
  claim_supersession_commitment: string;
  claim_fork_commitment: string;
  claim_merge_commitment: string;
  
  witness_law_version: string;
  replay_version: string;
  canonicalization_version: string;
  hash_version: string;
  
  witness_leaf_count: number;
  witness_tree_height: number;
}
```

### File Location

`PING/runtime/certificate/certificate_authority.ts`

### Risk

**MEDIUM** - Certificate refactor

---

## STAGE 8 — PROJECTION REWRITE

### Projection Pipeline Becomes

```text
Claim
↓
Artifact
↓
State
```

### Constitutional Rule

Claims become authoritative.

Artifacts become derived.

### Required Structure

```typescript
interface ProjectionRuntime {
  projectClaim(claimId: ClaimId): ClaimProjection;
  projectArtifact(artifactId: ArtifactId): ArtifactProjection;
  projectState(claimId: ClaimId): StateProjection;
}

interface ClaimProjection {
  claim_id: ClaimId;
  current_artifact: ArtifactProjection;
  claim_lineage: ClaimId[];
  continuity_status: 'continuous' | 'discontinuous';
}

interface ArtifactProjection {
  artifact_id: ArtifactId;
  claim_id: ClaimId;
  canonical_hash: string;
  artifact_lineage: ArtifactId[];
}
```

### File Location

`PING/runtime/projections/projection_runtime.ts` (new file)

### Risk

**HIGH** - Projection refactor

---

## STAGE 9 — COMMITSERVICE REWRITE

### Commit Pipeline Becomes

```text
HTTP
↓
CommitService
↓
AuthorizationAuthority
↓
ClaimAuthority
↓
IdentityAuthority
↓
ArtifactAuthority
↓
LineageAuthority
↓
EventStore
```

### Constitutional Rule

Commit pipeline MUST include ClaimAuthority, IdentityAuthority, ArtifactAuthority.

### File Location

`PING/runtime/kernel/commit-service/src/api/commit_controller.ts`

### Risk

**HIGH** - CommitService refactor

---

## STAGE 10 — PERSISTENCE REWRITE

### PersistenceAuthority Stores

```text
Claim Graph
Artifact Graph
Events
```

### Constitutional Rule

State becomes replay-derived.

### Required Structure

```typescript
interface PersistenceAuthority {
  storeClaimGraph(graph: ClaimGraph): void;
  storeArtifactGraph(graph: ArtifactGraph): void;
  storeEvent(event: CanonicalEventEnvelope): void;
  loadClaimGraph(): ClaimGraph;
  loadArtifactGraph(): ArtifactGraph;
  loadEventStream(): CanonicalEventEnvelope[];
}
```

### File Location

`PING/runtime/persistence/persistence_authority.ts` (new file)

### Risk

**HIGH** - Persistence refactor

---

## STAGE 11 — RUNTIME REWRITE

### RuntimeAuthority Becomes Sole Creator Of

```text
Brains
Workers
Engines
Claims
```

### Constitutional Rule

No direct construction remains.

### Required APIs

```typescript
interface RuntimeAuthority {
  createBrain(config: BrainConfig): Brain;
  createWorker(config: WorkerConfig): Worker;
  createEngine(config: EngineConfig): Engine;
  createClaim(config: ClaimConfig): Claim;
}
```

### File Location

`PING/runtime/runtime/runtime_authority.ts` (new file)

### Risk

**HIGH** - Runtime construction refactor

---

## CONSTITUTIONAL REPLAY LAW

### Old Replay Law (Deprecated)

```text
same event history
→ same artifact lineage
→ same artifact state
```

**is deprecated.**

---

### New Replay Law

```text
same event history
→ same claim graph
→ same continuity graph
→ same replay ordering
→ same claim state
→ same artifact projections
→ same canonical bytes
→ same canonical hash
→ same witness root
→ same continuity certificate
```

### Independent Of

- OS
- CPU
- runtime
- locale
- Unicode composition
- database ordering
- insertion ordering
- clock time
- process state
- platform behavior

---

## CONSTITUTIONAL INVARIANTS

### Invariant 1

```text
ClaimId never changes.
```

### Invariant 2

```text
ArtifactId may change.
```

### Invariant 3

```text
Events never define identity.
```

### Invariant 4

```text
Artifacts never define continuity.
```

### Invariant 5

```text
Claims define continuity.
```

### Invariant 6

```text
All witnesses terminate at ClaimId.
```

### Invariant 7

```text
All certificates terminate at ClaimId.
```

### Invariant 8

```text
Replay reconstructs Claim State.
```

### Invariant 9

```text
State remains projection only.
```

### Invariant 10

```text
Claim continuity is constitutional truth.
```

---

## ACCEPTANCE CRITERIA

The transition is complete only when:

- ClaimId exists
- ClaimAuthority exists
- ClaimGraph exists
- IdentityAuthority becomes mapping authority
- Replay reconstructs claims
- EventStore stores claim evolution
- Witnesses certify claim continuity
- Certificates certify claim continuity
- Artifacts become representations
- State becomes projection
- Claim continuity becomes constitutional truth

---

## CONSOLIDATED IMPLEMENTATION ORDER

| Step | Stage | Work | Risk | Dependency |
| ---- | ----- | ---- | ---- | ---------- |
| 1 | STAGE 1 | Claim Foundation | High | None |
| 2 | STAGE 2 | Identity Rewrite | High | STAGE 1 |
| 3 | STAGE 3 | Lineage Rewrite | High | STAGE 1, STAGE 2 |
| 4 | STAGE 4 | Replay Rewrite | High | STAGE 1, STAGE 2, STAGE 3 |
| 5 | STAGE 5 | EventStore Rewrite | High | STAGE 1, STAGE 4 |
| 6 | STAGE 6 | Witness Rewrite | Medium | STAGE 1, STAGE 2 |
| 7 | STAGE 7 | Certificate Rewrite | Medium | STAGE 1, STAGE 2, STAGE 6 |
| 8 | STAGE 8 | Projection Rewrite | High | STAGE 1, STAGE 2, STAGE 4, STAGE 5 |
| 9 | STAGE 9 | CommitService Rewrite | High | STAGE 1, STAGE 2, STAGE 3, STAGE 5 |
| 10 | STAGE 10 | Persistence Rewrite | High | STAGE 3, STAGE 5, STAGE 8 |
| 11 | STAGE 11 | Runtime Rewrite | High | STAGE 1, STAGE 8, STAGE 9, STAGE 10 |

---

## FINAL DETERMINATION

### Current PING Runtime State

```text
Artifact-Centric Constitution:
- ArtifactId is identity
- ArtifactState is replay object
- Artifact lineage is constitutional
- Artifact continuity is certified
- Artifact projections are authoritative
```

### Target PING Runtime State

```text
Claim-Centric Constitution:
- ClaimId is constitutional identity
- ClaimState is replay object
- Claim lineage is constitutional
- Claim continuity is certified
- Claim projections are authoritative
- ArtifactId is representation
- ArtifactState is derived
```

### Minimum Implementation

**11 stages = 11 implementation steps**

**Estimated engineering hours:** 70-90 hours (Claim-Centric constitution transition)

**Result:** PING Runtime kernel enforces ClaimIdentity as constitutional identity primitive, with ArtifactId as representation and EventId as causality. Claim continuity becomes constitutional truth.

---

## CONCLUSION

This constitutional kernel transition directive transforms PING Runtime from Artifact-Centric to Claim-Centric constitution by:

1. **Claim Foundation** (STAGE 1) - Create ClaimId, ClaimAuthority, ClaimLineage, ClaimGraph
2. **Identity Rewrite** (STAGE 2) - IdentityAuthority becomes ClaimId ↔ ArtifactId mapping authority
3. **Lineage Rewrite** (STAGE 3) - Create Claim Graph (authoritative) and Artifact Graph (derived)
4. **Replay Rewrite** (STAGE 4) - Replace ArtifactStateMachine with ClaimStateMachine
5. **EventStore Rewrite** (STAGE 5) - Add claim event families
6. **Witness Rewrite** (STAGE 6) - Witness subject becomes ClaimId, prove constitutional continuity
7. **Certificate Rewrite** (STAGE 7) - Certificate subject becomes ClaimId, certify continuous constitutional existence
8. **Projection Rewrite** (STAGE 8) - Claims become authoritative, artifacts become derived
9. **CommitService Rewrite** (STAGE 9) - Commit pipeline includes ClaimAuthority, IdentityAuthority, ArtifactAuthority
10. **Persistence Rewrite** (STAGE 10) - PersistenceAuthority stores Claim Graph, Artifact Graph, Events
11. **Runtime Rewrite** (STAGE 11) - RuntimeAuthority becomes sole creator of Brains, Workers, Engines, Claims

**At that point PING Runtime kernel enforces ClaimIdentity as constitutional identity primitive, with ArtifactId as representation and EventId as causality. Claim continuity becomes constitutional truth.**
