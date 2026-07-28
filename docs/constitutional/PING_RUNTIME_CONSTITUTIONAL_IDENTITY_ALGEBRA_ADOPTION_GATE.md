# PING Runtime Constitutional Identity Algebra Adoption Gate

**Gate Date:** 2026-06-18  
**Gate Mode:** CONSTITUTIONAL READINESS AUDIT  
**Gate Principle:** Audit current runtime against adopted Constitutional Identity Algebra before Stage 1 implementation.

---

## CONSTITUTIONAL STATUS

ClaimIdentity is constitutional identity.

ArtifactIdentity is abolished as constitutional identity.

ArtifactId is constitutional representation.

EventId is constitutional causality witness.

**Constitutional Identity Stack:**
```text
ClaimId
→ ArtifactId
→ EventId
```

**Constitutional Truth:**
```text
Claim Continuity
```

**NOT:**
```text
Artifact Continuity
```

---

## CONSTITUTIONAL REQUIREMENT

Treat the following document as already adopted constitutional law:

**PING_RUNTIME_CONSTITUTIONAL_IDENTITY_ALGEBRA_DIRECTIVE.md**

This algebra is now superior to:
- ClaimAuthority
- IdentityAuthority
- ArtifactAuthority
- LineageAuthority
- ReplayAuthority
- WitnessAuthority
- CertificateAuthority
- EventStore
- ProjectionRuntime
- RuntimeAuthority

**No authority may violate algebraic law.**

---

## REQUIRED AUDIT

For each constitutional law:
1. Claim Continuity Law
2. Replacement Law
3. Fork Law
4. Merge Law
5. Migration Law
6. Termination Law
7. Supersession Law
8. Replay Law
9. Witness Law
10. Certificate Law

Determine:
- A: What runtime components currently violate the law?
- B: What runtime components currently assume ArtifactId is identity?
- C: What runtime components must be rewritten before Stage 1 can begin?
- D: What runtime invariants must be added?
- E: What replay determinism risks emerge under the new algebra?

---

## DELIVERABLE 1 — CONSTITUTIONAL COMPLIANCE MATRIX

| Law | Authority | Current Status | Constitutional Violation | Required Refactor | Blocking Severity |
| --- | --- | --- | --- | --- | --- |
| Claim Continuity Law | None (not implemented) | ClaimId does not exist | YES - ClaimId missing | Create ClaimId branded type | CRITICAL |
| Claim Continuity Law | ReplayStateMachine | ArtifactState is replay object | YES - Should be ClaimState | Replace ArtifactState with ClaimState | CRITICAL |
| Claim Continuity Law | ReplayStateMachine | artifact_lineage uses ArtifactId[] | YES - Should be claim_lineage with ClaimId[] | Add claim_lineage to ClaimState | CRITICAL |
| Replacement Law | None (not implemented) | Replacement semantics do not exist | YES - Replacement missing | Implement replacement events and logic | HIGH |
| Fork Law | None (not implemented) | Fork semantics do not exist | YES - Fork missing | Implement fork events and logic | HIGH |
| Merge Law | None (not implemented) | Merge semantics do not exist | YES - Merge missing | Implement merge events and logic | HIGH |
| Migration Law | None (not implemented) | Migration semantics do not exist | YES - Migration missing | Implement migration events and logic | HIGH |
| Termination Law | None (not implemented) | Termination semantics do not exist | YES - Termination missing | Implement termination events and logic | HIGH |
| Supersession Law | None (not implemented) | Supersession semantics do not exist | YES - Supersession missing | Implement supersession events and logic | HIGH |
| Replay Law | ReplayStateMachine | Replay reconstructs ArtifactState | YES - Should reconstruct ClaimState | Replace ArtifactState with ClaimState | CRITICAL |
| Replay Law | ReplayStateMachine | No ClaimGraph exists | YES - ClaimGraph missing | Create ClaimGraph structure | CRITICAL |
| Replay Law | ReplayStateMachine | No ContinuityGraph exists | YES - ContinuityGraph missing | Create ContinuityGraph structure | CRITICAL |
| Witness Law | WitnessRoot | WitnessRoot subject is ArtifactId | YES - Should be ClaimId | Replace ArtifactId with ClaimId | CRITICAL |
| Witness Law | WitnessLeaf | WitnessLeaf subject is ArtifactId | YES - Should be ClaimId | Replace ArtifactId with ClaimId | CRITICAL |
| Certificate Law | ReplayCertificate | Certificate subject is ArtifactId | YES - Should be ClaimId | Replace ArtifactId with ClaimId | CRITICAL |
| Certificate Law | ReplayCertificate | No claim_continuity_commitment | YES - Missing commitment | Add claim_continuity_commitment | CRITICAL |
| Certificate Law | ReplayCertificate | No claim_lineage_commitment | YES - Missing commitment | Add claim_lineage_commitment | CRITICAL |

---

## DELIVERABLE 2 — CLAIM ALGEBRA DEPENDENCY GRAPH

### Dependency Ordering

```text
ClaimId (foundation)
  ↓
ClaimAuthority (depends on ClaimId)
  ↓
ArtifactAuthority (depends on ClaimId, ArtifactId)
  ↓
IdentityAuthority (depends on ClaimId, ArtifactId, ClaimAuthority, ArtifactAuthority)
  ↓
LineageAuthority (depends on ClaimId, ClaimAuthority)
  ↓
ReplayAuthority (depends on ClaimId, ClaimState, ClaimGraph, ContinuityGraph)
  ↓
WitnessAuthority (depends on ClaimId, ClaimAuthority)
  ↓
CertificateAuthority (depends on ClaimId, ClaimAuthority, WitnessAuthority)
  ↓
EventStore (depends on ClaimId, ClaimAuthority, LineageAuthority)
  ↓
ProjectionRuntime (depends on ClaimId, ClaimState, ArtifactAuthority)
  ↓
PersistenceAuthority (depends on ClaimId, ClaimGraph, ArtifactGraph, EventStore)
  ↓
RuntimeAuthority (depends on all above)
```

### Cycles Identified

**No cycles detected.** Dependency graph is acyclic.

### Critical Path

```text
ClaimId → ClaimAuthority → LineageAuthority → EventStore → PersistenceAuthority → RuntimeAuthority
```

### Parallelizable Paths

```text
Path A: ClaimId → ClaimAuthority → WitnessAuthority → CertificateAuthority
Path B: ClaimId → ArtifactAuthority → IdentityAuthority
Path C: ClaimId → ClaimAuthority → ReplayAuthority → ProjectionRuntime
```

---

## DELIVERABLE 3 — CONSTITUTIONAL INVARIANT REGISTRY

### Claim Continuity Invariants

#### Invariant 1: ClaimIdImmutableInvariant

**Invariant ID:** `CLAIM_ID_IMMUTABLE`

**Invariant Definition:**
```typescript
∀ claimId: ClaimId, ∀ e: Event
  claimId(e) = claimId
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.createClaim, ClaimAuthority.replaceClaim

**Replay Impact:** Replay must verify ClaimId never changes across event stream

---

#### Invariant 2: ContinuityTransitivityInvariant

**Invariant ID:** `CONTINUITY_TRANSITIVITY`

**Invariant Definition:**
```typescript
∀ A, B, C: ClaimId
  continuity(A, B) ∧ continuity(B, C) → continuity(A, C)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify continuity transitivity during claim graph reconstruction

---

#### Invariant 3: ContinuityImmutabilityInvariant

**Invariant ID:** `CONTINUITY_IMMUTABILITY`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId, ∀ e1, e2: Event
  continuity(A, B, e1) → continuity(A, B, e2)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify continuity is immutable once established

---

#### Invariant 4: ContinuityNonRevocabilityInvariant

**Invariant ID:** `CONTINUITY_NON_REVOCABILITY`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  continuity(A, B) → ¬revoked(A, B)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify continuity cannot be revoked

---

#### Invariant 5: ContinuitySplittingInvariant

**Invariant ID:** `CONTINUITY_SPLITTING`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → continuity(A, B) ∧ continuity(A, C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.forkClaim

**Replay Impact:** Replay must verify fork splits continuity to all forked claims

---

#### Invariant 6: ContinuityMergingInvariant

**Invariant ID:** `CONTINUITY_MERGING`

**Invariant Definition:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → continuity(B, D) ∧ continuity(C, D)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.mergeClaims

**Replay Impact:** Replay must verify merge merges continuity from all merged claims

---

#### Invariant 7: ContinuityTerminationInvariant

**Invariant ID:** `CONTINUITY_TERMINATION`

**Invariant Definition:**
```typescript
∀ A: ClaimId
  terminated(A) → ∀ B: ClaimId, ¬continuity(A, B, after(termination))
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.terminateClaim

**Replay Impact:** Replay must verify no new continuity after termination

---

### Replacement Invariants

#### Invariant 8: ReplacementIdentityRuleInvariant

**Invariant ID:** `REPLACEMENT_IDENTITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → claimId(A) = claimId(B)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.replaceClaim

**Replay Impact:** Replay must verify replacement preserves ClaimId

---

#### Invariant 9: ReplacementContinuityRuleInvariant

**Invariant ID:** `REPLACEMENT_CONTINUITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → continuity(A, B) ∧ ∀ C: ClaimId
    continuity(A, C) → continuity(B, C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.replaceClaim

**Replay Impact:** Replay must verify replacement preserves all continuity relationships

---

#### Invariant 10: ReplacementTerminationRuleInvariant

**Invariant ID:** `REPLACEMENT_TERMINATION`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → terminated(A) ∧ active(B)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.replaceClaim

**Replay Impact:** Replay must verify replacement terminates replaced claim

---

#### Invariant 11: ReplacementArtifactRuleInvariant

**Invariant ID:** `REPLACEMENT_ARTIFACT_CHANGE`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → artifactId(A) ≠ artifactId(B)
```

**Authority Owner:** ArtifactAuthority

**Enforcement Location:** ArtifactAuthority.generateReplacementArtifact

**Replay Impact:** Replay must verify replacement generates new ArtifactId

---

### Fork Invariants

#### Invariant 12: ForkIdentityRuleInvariant

**Invariant ID:** `FORK_IDENTITY_CREATION`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → claimId(B) ≠ claimId(A) ∧ claimId(C) ≠ claimId(A) ∧ claimId(B) ≠ claimId(C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.forkClaim

**Replay Impact:** Replay must verify fork creates new ClaimIds

---

#### Invariant 13: ForkSurvivalRuleInvariant

**Invariant ID:** `FORK_PARENT_SURVIVAL`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → active(A) ∧ active(B) ∧ active(C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.forkClaim

**Replay Impact:** Replay must verify fork preserves parent claim

---

#### Invariant 14: ForkContinuityRuleInvariant

**Invariant ID:** `FORK_CONTINUITY_SPLIT`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → continuity(A, B) ∧ continuity(A, C) ∧ ¬continuity(B, C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.forkClaim

**Replay Impact:** Replay must verify fork splits continuity

---

#### Invariant 15: ForkNonRevocabilityRuleInvariant

**Invariant ID:** `FORK_CONTINUITY_NON_REVOCABILITY`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B: ClaimId
  fork(A, B) → continuity(A, B) ∧ ¬revoked(A, B)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify fork continuity cannot be revoked

---

#### Invariant 16: ForkArtifactRuleInvariant

**Invariant ID:** `FORK_ARTIFACT_CREATION`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → artifactId(B) ≠ artifactId(A) ∧ artifactId(C) ≠ artifactId(A) ∧ artifactId(B) ≠ artifactId(C)
```

**Authority Owner:** ArtifactAuthority

**Enforcement Location:** ArtifactAuthority.generateForkArtifacts

**Replay Impact:** Replay must verify fork generates new ArtifactIds

---

### Merge Invariants

#### Invariant 17: MergeIdentityRuleInvariant

**Invariant ID:** `MERGE_IDENTITY_CREATION`

**Invariant Definition:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → claimId(D) ≠ claimId(B) ∧ claimId(D) ≠ claimId(C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.mergeClaims

**Replay Impact:** Replay must verify merge creates new ClaimId

---

#### Invariant 18: MergeContinuityRuleInvariant

**Invariant ID:** `MERGE_CONTINUITY_MERGING`

**Invariant Definition:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → continuity(B, D) ∧ continuity(C, D)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.mergeClaims

**Replay Impact:** Replay must verify merge merges continuity

---

#### Invariant 19: MergeTerminationRuleInvariant

**Invariant ID:** `MERGE_TERMINATION`

**Invariant Definition:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → terminated(B) ∧ terminated(C) ∧ active(D)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.mergeClaims

**Replay Impact:** Replay must verify merge terminates merged claims

---

#### Invariant 20: MergeArtifactRuleInvariant

**Invariant ID:** `MERGE_ARTIFACT_CREATION`

**Invariant Definition:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → artifactId(D) ≠ artifactId(B) ∧ artifactId(D) ≠ artifactId(C)
```

**Authority Owner:** ArtifactAuthority

**Enforcement Location:** ArtifactAuthority.generateMergeArtifact

**Replay Impact:** Replay must verify merge generates new ArtifactId

---

### Migration Invariants

#### Invariant 21: MigrationIdentityRuleInvariant

**Invariant ID:** `MIGRATION_IDENTITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → claimId(A, ctx1) = claimId(A, ctx2)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.migrateClaim

**Replay Impact:** Replay must verify migration preserves ClaimId

---

#### Invariant 22: MigrationArtifactRuleInvariant

**Invariant ID:** `MIGRATION_ARTIFACT_OPTIONAL_CHANGE`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → artifactId(A, ctx1) ≠ artifactId(A, ctx2) ∨ artifactId(A, ctx1) = artifactId(A, ctx2)
```

**Authority Owner:** ArtifactAuthority

**Enforcement Location:** ArtifactAuthority.generateMigrationArtifact

**Replay Impact:** Replay must verify migration may change ArtifactId

---

#### Invariant 23: MigrationContinuityRuleInvariant

**Invariant ID:** `MIGRATION_CONTINUITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → continuity(A, ctx1, ctx2)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify migration preserves continuity

---

### Termination Invariants

#### Invariant 24: TerminationDefinitionRuleInvariant

**Invariant ID:** `TERMINATION_CONSTITUTIONAL_DEATH`

**Invariant Definition:**
```typescript
∀ A: ClaimId
  terminated(A) → ¬active(A) ∧ ∀ B: ClaimId, ¬continuity(A, B, after(termination))
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.terminateClaim

**Replay Impact:** Replay must verify termination prevents new continuity

---

#### Invariant 25: TerminationReplayRuleInvariant

**Invariant ID:** `TERMINATION_REPLAYABILITY`

**Invariant Definition:**
```typescript
∀ A: ClaimId
  terminated(A) → replayable(A)
```

**Authority Owner:** ReplayAuthority

**Enforcement Location:** ReplayAuthority.replayTerminatedClaim

**Replay Impact:** Replay must verify terminated claims are replayable

---

#### Invariant 26: TerminationRevivalRuleInvariant

**Invariant ID:** `TERMINATION_IRREVERSIBILITY`

**Invariant Definition:**
```typescript
∀ A: ClaimId
  terminated(A) → ¬revivable(A)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.terminateClaim

**Replay Impact:** Replay must verify terminated claims cannot be revived

---

#### Invariant 27: TerminationContinuityRuleInvariant

**Invariant ID:** `TERMINATION_HISTORICAL_CONTINUITY`

**Invariant Definition:**
```typescript
∀ A: ClaimId, ∀ B: ClaimId
  terminated(A) ∧ continuity(A, B, before(termination)) → historical_continuity(A, B)
```

**Authority Owner:** LineageAuthority

**Enforcement Location:** LineageAuthority.validateClaimContinuity

**Replay Impact:** Replay must verify termination preserves historical continuity

---

### Supersession Invariants

#### Invariant 28: SupersessionIdentityRuleInvariant

**Invariant ID:** `SUPERSESSION_IDENTITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → claimId(A) = claimId(B)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.supersedeClaim

**Replay Impact:** Replay must verify supersession preserves ClaimId

---

#### Invariant 29: SupersessionContinuityRuleInvariant

**Invariant ID:** `SUPERSESSION_CONTINUITY_PRESERVATION`

**Invariant Definition:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → continuity(A, B) ∧ ∀ C: ClaimId
    continuity(A, C) → continuity(B, C)
```

**Authority Owner:** ClaimAuthority

**Enforcement Location:** ClaimAuthority.supersedeClaim

**Replay Impact:** Replay must verify supersession preserves continuity

---

### Replay Invariants

#### Invariant 30: ReplayObjectRuleInvariant

**Invariant ID:** `REPLAY_CLAIM_STATE_OBJECT`

**Invariant Definition:**
```typescript
replay(events) → ClaimState
```

**Authority Owner:** ReplayAuthority

**Enforcement Location:** ReplayStateMachine.applyEvent

**Replay Impact:** Replay must reconstruct ClaimState, not ArtifactState

---

#### Invariant 31: ReplayClaimGraphRuleInvariant

**Invariant ID:** `REPLAY_CLAIM_GRAPH_RECONSTRUCTION`

**Invariant Definition:**
```typescript
replay(events) → ClaimGraph
```

**Authority Owner:** ReplayAuthority

**Enforcement Location:** ReplayStateMachine.buildClaimGraph

**Replay Impact:** Replay must reconstruct ClaimGraph

---

#### Invariant 32: ReplayContinuityGraphRuleInvariant

**Invariant ID:** `REPLAY_CONTINUITY_GRAPH_RECONSTRUCTION`

**Invariant Definition:**
```typescript
replay(events) → ContinuityGraph
```

**Authority Owner:** ReplayAuthority

**Enforcement Location:** ReplayStateMachine.buildContinuityGraph

**Replay Impact:** Replay must reconstruct ContinuityGraph

---

#### Invariant 33: ReplayArtifactProjectionRuleInvariant

**Invariant ID:** `REPLAY_ARTIFACT_PROJECTION`

**Invariant Definition:**
```typescript
replay(events) → ClaimState → ArtifactProjection
```

**Authority Owner:** ProjectionRuntime

**Enforcement Location:** ProjectionRuntime.projectArtifact

**Replay Impact:** Replay must project Artifacts from Claims

---

#### Invariant 34: ReplayDeterminismRuleInvariant

**Invariant ID:** `REPLAY_DETERMINISM`

**Invariant Definition:**
```typescript
∀ events1, events2: Event[]
  events1 = events2 → replay(events1) = replay(events2)
```

**Authority Owner:** ReplayAuthority

**Enforcement Location:** ReplayStateMachine.applyEvent

**Replay Impact:** Replay must be deterministic

---

### Witness Invariants

#### Invariant 35: WitnessRootSubjectRuleInvariant

**Invariant ID:** `WITNESS_ROOT_CLAIM_SUBJECT`

**Invariant Definition:**
```typescript
∀ witnessRoot: WitnessRoot
  subject(witnessRoot) = ClaimId
```

**Authority Owner:** WitnessAuthority

**Enforcement Location:** WitnessAuthority.createWitnessRoot

**Replay Impact:** WitnessRoot must be rooted in ClaimId

---

#### Invariant 36: WitnessLeafSubjectRuleInvariant

**Invariant ID:** `WITNESS_LEAF_CLAIM_SUBJECT`

**Invariant Definition:**
```typescript
∀ witnessLeaf: WitnessLeaf
  subject(witnessLeaf) = ClaimId
```

**Authority Owner:** WitnessAuthority

**Enforcement Location:** WitnessAuthority.createWitnessLeaf

**Replay Impact:** WitnessLeaf must be rooted in ClaimId

---

#### Invariant 37: ContinuityProofSubjectRuleInvariant

**Invariant ID:** `CONTINUITY_PROOF_CLAIM_SUBJECT`

**Invariant Definition:**
```typescript
∀ continuityProof: ContinuityProof
  subject(continuityProof) = ClaimId
```

**Authority Owner:** WitnessAuthority

**Enforcement Location:** WitnessAuthority.createContinuityProof

**Replay Impact:** Continuity proofs must prove ClaimId continuity

---

#### Invariant 38: WitnessArtifactRuleInvariant

**Invariant ID:** `WITNESS_INCLUDES_ARTIFACT`

**Invariant Definition:**
```typescript
∀ witnessLeaf: WitnessLeaf
  includes(witnessLeaf, ArtifactId)
```

**Authority Owner:** WitnessAuthority

**Enforcement Location:** WitnessAuthority.createWitnessLeaf

**Replay Impact:** WitnessLeaf must include ArtifactId as representation

---

#### Invariant 39: WitnessLineageRuleInvariant

**Invariant ID:** `WITNESS_INCLUDES_LINEAGE`

**Invariant Definition:**
```typescript
∀ witnessLeaf: WitnessLeaf
  includes(witnessLeaf, LineageCommitment)
```

**Authority Owner:** WitnessAuthority

**Enforcement Location:** WitnessAuthority.createWitnessLeaf

**Replay Impact:** WitnessLeaf must include LineageCommitment

---

### Certificate Invariants

#### Invariant 40: CertificateSubjectRuleInvariant

**Invariant ID:** `CERTIFICATE_CLAIM_SUBJECT`

**Invariant Definition:**
```typescript
∀ certificate: Certificate
  subject(certificate) = ClaimId
```

**Authority Owner:** CertificateAuthority

**Enforcement Location:** CertificateAuthority.createCertificate

**Replay Impact:** Certificate must be rooted in ClaimId

---

#### Invariant 41: CertificateCommitmentLawInvariant

**Invariant ID:** `CERTIFICATE_CLAIM_COMMITMENT`

**Invariant Definition:**
```typescript
∀ certificate: Certificate
  commitment(certificate, ClaimId)
```

**Authority Owner:** CertificateAuthority

**Enforcement Location:** CertificateAuthority.createCertificate

**Replay Impact:** Certificate must commit to ClaimId

---

#### Invariant 42: ContinuityCommitmentLawInvariant

**Invariant ID:** `CERTIFICATE_CONTINUITY_COMMITMENT`

**Invariant Definition:**
```typescript
∀ certificate: Certificate
  commitment(certificate, continuity)
```

**Authority Owner:** CertificateAuthority

**Enforcement Location:** CertificateAuthority.createCertificate

**Replay Impact:** Certificate must commit to continuity

---

#### Invariant 43: LineageCommitmentLawInvariant

**Invariant ID:** `CERTIFICATE_LINEAGE_COMMITMENT`

**Invariant Definition:**
```typescript
∀ certificate: Certificate
  commitment(certificate, lineage)
```

**Authority Owner:** CertificateAuthority

**Enforcement Location:** CertificateAuthority.createCertificate

**Replay Impact:** Certificate must commit to lineage

---

#### Invariant 44: CertificateExistenceRuleInvariant

**Invariant ID:** `CERTIFICATE_CONTINUOUS_EXISTENCE`

**Invariant Definition:**
```typescript
∀ certificate: Certificate
  certifies(certificate, continuous_constitutional_existence(ClaimId))
```

**Authority Owner:** CertificateAuthority

**Enforcement Location:** CertificateAuthority.createCertificate

**Replay Impact:** Certificate must certify continuous constitutional existence

---

## DELIVERABLE 4 — CONSTITUTIONAL EVENT TAXONOMY

### claim_created

**Required Payload:**
```typescript
interface ClaimCreatedEvent {
  event_type: 'claim_created';
  claim_id: ClaimId;
  artifact_id: ArtifactId;
  lineage: { parent_claim_ids: ClaimId[] };
  continuity_commitment: string;
}
```

**Continuity Commitments:**
- claim_id continuity
- parent_claim_ids continuity

**Witness Commitments:**
- claim_id witness
- artifact_id witness
- lineage_commitment witness

**Certificate Commitments:**
- claim_id certificate
- continuity certificate
- lineage certificate

---

### claim_replaced

**Required Payload:**
```typescript
interface ClaimReplacedEvent {
  event_type: 'claim_replaced';
  claim_id: ClaimId;
  superseded_claim_id: ClaimId;
  new_artifact_id: ArtifactId;
  continuity_commitment: string;
  supersession_commitment: string;
}
```

**Continuity Commitments:**
- claim_id continuity (preserved)
- superseded_claim_id continuity (preserved)
- supersession continuity

**Witness Commitments:**
- claim_id witness
- superseded_claim_id witness
- new_artifact_id witness
- continuity_commitment witness

**Certificate Commitments:**
- claim_id certificate
- continuity certificate
- supersession certificate

---

### claim_forked

**Required Payload:**
```typescript
interface ClaimForkedEvent {
  event_type: 'claim_forked';
  parent_claim_id: ClaimId;
  forked_claim_ids: ClaimId[];
  forked_artifact_ids: ArtifactId[];
  continuity_commitment: string;
  fork_commitment: string;
}
```

**Continuity Commitments:**
- parent_claim_id continuity (split)
- forked_claim_ids continuity (split)
- fork continuity

**Witness Commitments:**
- parent_claim_id witness
- forked_claim_ids witness
- forked_artifact_ids witness
- continuity_commitment witness

**Certificate Commitments:**
- parent_claim_id certificate
- continuity certificate
- fork certificate

---

### claim_merged

**Required Payload:**
```typescript
interface ClaimMergedEvent {
  event_type: 'claim_merged';
  merged_claim_ids: ClaimId[];
  resulting_claim_id: ClaimId;
  resulting_artifact_id: ArtifactId;
  continuity_commitment: string;
  merge_commitment: string;
}
```

**Continuity Commitments:**
- merged_claim_ids continuity (merged)
- resulting_claim_id continuity (merged)
- merge continuity

**Witness Commitments:**
- merged_claim_ids witness
- resulting_claim_id witness
- resulting_artifact_id witness
- continuity_commitment witness

**Certificate Commitments:**
- resulting_claim_id certificate
- continuity certificate
- merge certificate

---

### claim_migrated

**Required Payload:**
```typescript
interface ClaimMigratedEvent {
  event_type: 'claim_migrated';
  claim_id: ClaimId;
  from_context: Context;
  to_context: Context;
  artifact_id: ArtifactId;
  continuity_commitment: string;
  migration_commitment: string;
}
```

**Continuity Commitments:**
- claim_id continuity (preserved)
- migration continuity (cross-context)

**Witness Commitments:**
- claim_id witness
- artifact_id witness
- continuity_commitment witness

**Certificate Commitments:**
- claim_id certificate
- continuity certificate
- migration certificate

---

### claim_terminated

**Required Payload:**
```typescript
interface ClaimTerminatedEvent {
  event_type: 'claim_terminated';
  claim_id: ClaimId;
  termination_type: 'explicit' | 'implicit' | 'timeout' | 'supersession';
  historical_continuity_commitment: string;
}
```

**Continuity Commitments:**
- historical continuity (preserved)
- termination continuity (no new continuity)

**Witness Commitments:**
- claim_id witness
- termination witness
- historical_continuity_commitment witness

**Certificate Commitments:**
- claim_id certificate
- termination certificate
- historical_continuity certificate

---

### claim_superseded

**Required Payload:**
```typescript
interface ClaimSupersededEvent {
  event_type: 'claim_superseded';
  superseded_claim_id: ClaimId;
  superseding_claim_ids: ClaimId[];
  continuity_commitment: string;
  supersession_commitment: string;
}
```

**Continuity Commitments:**
- superseded_claim_id continuity (preserved)
- superseding_claim_ids continuity (preserved)
- supersession continuity

**Witness Commitments:**
- superseded_claim_id witness
- superseding_claim_ids witness
- continuity_commitment witness

**Certificate Commitments:**
- superseded_claim_id certificate
- continuity certificate
- supersession certificate

---

## DELIVERABLE 5 — CONSTITUTIONAL REPLAY MODEL

### Replay Object Hierarchy

```text
EventStream
  ↓
ReplayStateMachine
  ↓
ClaimGraph (constitutional)
  ↓
ContinuityGraph (constitutional)
  ↓
ClaimState (constitutional)
  ↓
ArtifactProjection (derived)
  ↓
WitnessProjection (derived)
  ↓
CertificateProjection (derived)
```

### Authoritative Reconstruction Order

1. **EventStream** - Raw event sequence
2. **ClaimGraph** - Constitutional lineage graph (ClaimId nodes, ClaimId edges)
3. **ContinuityGraph** - Constitutional continuity graph (ClaimId nodes, continuity edges)
4. **ClaimState** - Constitutional state (claim_id, current_artifact_id, artifact_history, claim_lineage, supersedes, superseded_by, forked_from, forked_into, merged_from, merged_into)
5. **ArtifactProjection** - Derived state (artifact_id, claim_id, canonical_hash, artifact_lineage)
6. **WitnessProjection** - Derived witnesses (witness_root, witness_leaves, continuity_proofs)
7. **CertificateProjection** - Derived certificates (certificate_commitment, continuity_commitment, lineage_commitment)

### ClaimGraph Structure

```typescript
interface ClaimGraph {
  nodes: Map<ClaimId, ClaimNode>;
  edges: ClaimEdge[];
  graph_version: string;
}

interface ClaimNode {
  claim_id: ClaimId;
  node_type: 'claim' | 'replacement' | 'fork' | 'merge' | 'migration' | 'termination' | 'supersession';
  created_at: EventId;
}

interface ClaimEdge {
  parent_claim_id: ClaimId;
  child_claim_id: ClaimId;
  edge_type: 'continuity' | 'supersession' | 'fork' | 'merge';
  created_at: EventId;
}
```

### ContinuityGraph Structure

```typescript
interface ContinuityGraph {
  nodes: Map<ClaimId, ContinuityNode>;
  edges: ContinuityEdge[];
  graph_version: string;
}

interface ContinuityNode {
  claim_id: ClaimId;
  continuity_type: 'direct' | 'transitive' | 'split' | 'merged';
  continuity_established_at: EventId;
}

interface ContinuityEdge {
  source_claim_id: ClaimId;
  target_claim_id: ClaimId;
  continuity_type: 'direct' | 'transitive' | 'split' | 'merged';
  continuity_established_at: EventId;
}
```

### ClaimState Structure

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
  status: 'active' | 'terminated';
  status_changed_at: EventId;
}
```

### ArtifactProjection Structure

```typescript
interface ArtifactProjection {
  artifact_id: ArtifactId;
  claim_id: ClaimId;
  canonical_hash: string;
  artifact_lineage: ArtifactId[];
  projection_type: 'current' | 'historical';
}
```

### WitnessProjection Structure

```typescript
interface WitnessProjection {
  claim_id: ClaimId;
  witness_root: WitnessRoot;
  witness_leaves: WitnessLeaf[];
  continuity_proofs: ContinuityProof[];
}
```

### CertificateProjection Structure

```typescript
interface CertificateProjection {
  claim_id: ClaimId;
  certificate: ReplayCertificate;
  continuity_commitment: string;
  lineage_commitment: string;
}
```

---

## CONSTITUTIONAL READINESS REPORT

### A. Runtime Components Currently Violating Laws

**Critical Violations:**
- ReplayStateMachine - Reconstructs ArtifactState instead of ClaimState
- ReplayStateMachine - Uses artifact_lineage instead of claim_lineage
- ReplayStateMachine - No ClaimGraph exists
- ReplayStateMachine - No ContinuityGraph exists
- WitnessRoot - Subject is ArtifactId instead of ClaimId
- WitnessLeaf - Subject is ArtifactId instead of ClaimId
- ReplayCertificate - Subject is ArtifactId instead of ClaimId
- ReplayCertificate - Missing claim_continuity_commitment
- ReplayCertificate - Missing claim_lineage_commitment

**High Violations:**
- No ClaimId branded type exists
- No ClaimAuthority exists
- No replacement semantics exist
- No fork semantics exist
- No merge semantics exist
- No migration semantics exist
- No termination semantics exist
- No supersession semantics exist

---

### B. Runtime Components Currently Assuming ArtifactId is Identity

**Violating Components:**
- replay_types.ts line 20: ArtifactId is branded type (assumed identity)
- replay_types.ts line 85: parent_event_ids: ArtifactId[] (lineage uses artifact IDs)
- replay_types.ts line 104-105: LineageEdge uses ArtifactId for parent_id and child_id
- replay_types.ts line 115: ReplayState uses Map<ArtifactId, ArtifactState> (state keyed by artifact IDs)
- replay_types.ts line 122-124: ArtifactState uses artifact_id and artifact_lineage (artifact-centric)
- replay_state_machine.ts line 39: artifacts: Map<ArtifactId, ArtifactState> (artifact state machine)
- replay_state_machine.ts line 60-64: Handles artifact_commit and artifact_update events (artifact-centric)
- replay_state_machine.ts line 84: artifactId = payload.artifact_id || event.getEventId() (artifact identity)
- replay_state_machine.ts line 188-192: state.artifacts.set(artifactId, ArtifactState) (artifact state)

---

### C. Runtime Components Must Be Rewritten Before Stage 1

**Critical Rewrites Required:**
1. replay_types.ts - Add ClaimId branded type
2. replay_types.ts - Replace ArtifactState with ClaimState
3. replay_types.ts - Add ClaimGraph structure
4. replay_types.ts - Add ContinuityGraph structure
5. replay_state_machine.ts - Replace ArtifactStateMachine with ClaimStateMachine
6. replay_state_machine.ts - Replace artifact_commit with claim_created
7. replay_state_machine.ts - Replace artifact_update with claim_replaced
8. replay_state_machine.ts - Add claim_forked event handler
9. replay_state_machine.ts - Add claim_merged event handler
10. replay_state_machine.ts - Add claim_migrated event handler
11. replay_state_machine.ts - Add claim_terminated event handler
12. replay_state_machine.ts - Add claim_superseded event handler
13. canonical_hash_authority.ts - Split into CanonicalAuthority, CanonicalHashAuthority, IdentityAuthority
14. WitnessRoot - Replace ArtifactId with ClaimId
15. WitnessLeaf - Replace ArtifactId with ClaimId
16. ReplayCertificate - Replace ArtifactId with ClaimId
17. ReplayCertificate - Add claim_continuity_commitment
18. ReplayCertificate - Add claim_lineage_commitment

---

### D. Runtime Invariants Must Be Added

**Required Invariants (44 total):**
- 7 Claim Continuity Invariants
- 4 Replacement Invariants
- 5 Fork Invariants
- 4 Merge Invariants
- 3 Migration Invariants
- 4 Termination Invariants
- 2 Supersession Invariants
- 5 Replay Invariants
- 5 Witness Invariants
- 5 Certificate Invariants

**Invariant Enforcement Locations:**
- ClaimAuthority - 9 invariants
- LineageAuthority - 7 invariants
- ArtifactAuthority - 4 invariants
- ReplayAuthority - 5 invariants
- WitnessAuthority - 5 invariants
- CertificateAuthority - 5 invariants
- ProjectionRuntime - 1 invariant

---

### E. Replay Determinism Risks Under New Algebra

**Identified Risks:**

1. **ClaimId Derivation Risk:** If ClaimId is not derived deterministically from canonical bytes, replay may produce different ClaimIds for same event stream.
   - **Mitigation:** ClaimId must be derived deterministically from canonical hash or assigned deterministically by ClaimAuthority.

2. **ClaimGraph Ordering Risk:** If ClaimGraph reconstruction depends on event insertion order, replay may produce different ClaimGraph for same event stream.
   - **Mitigation:** ClaimGraph reconstruction must use deterministic ordering (e.g., lexicographic by ClaimId).

3. **ContinuityGraph Ordering Risk:** If ContinuityGraph reconstruction depends on event insertion order, replay may produce different ContinuityGraph for same event stream.
   - **Mitigation:** ContinuityGraph reconstruction must use deterministic ordering (e.g., lexicographic by ClaimId).

4. **ArtifactProjection Derivation Risk:** If ArtifactProjection derivation depends on non-deterministic factors, replay may produce different ArtifactProjections for same event stream.
   - **Mitigation:** ArtifactProjection derivation must be deterministic (derived from ClaimState only).

5. **WitnessProjection Derivation Risk:** If WitnessProjection derivation depends on non-deterministic factors, replay may produce different WitnessProjections for same event stream.
   - **Mitigation:** WitnessProjection derivation must be deterministic (derived from ClaimState only).

6. **CertificateProjection Derivation Risk:** If CertificateProjection derivation depends on non-deterministic factors, replay may produce different CertificateProjections for same event stream.
   - **Mitigation:** CertificateProjection derivation must be deterministic (derived from ClaimState only).

7. **Fork Continuity Splitting Risk:** If fork continuity splitting is not deterministic, replay may produce different continuity graphs for same event stream.
   - **Mitigation:** Fork continuity splitting must be deterministic (based on fork event order and ClaimId ordering).

8. **Merge Continuity Merging Risk:** If merge continuity merging is not deterministic, replay may produce different continuity graphs for same event stream.
   - **Mitigation:** Merge continuity merging must be deterministic (based on merge event order and ClaimId ordering).

---

## CONCLUSION

### Constitutional Readiness Status

**NOT READY FOR STAGE 1**

**Blocking Issues:**
- ClaimId branded type does not exist (CRITICAL)
- ClaimState does not exist (CRITICAL)
- ClaimGraph does not exist (CRITICAL)
- ContinuityGraph does not exist (CRITICAL)
- ClaimAuthority does not exist (CRITICAL)
- 44 constitutional invariants not implemented (CRITICAL)
- 7 event families not implemented (HIGH)
- ReplayStateMachine violates Replay Law (CRITICAL)
- WitnessRoot violates Witness Law (CRITICAL)
- WitnessLeaf violates Witness Law (CRITICAL)
- ReplayCertificate violates Certificate Law (CRITICAL)

### Required Actions Before Stage 1

1. Create ClaimId branded type
2. Create ClaimState structure
3. Create ClaimGraph structure
4. Create ContinuityGraph structure
5. Implement 44 constitutional invariants
6. Implement 7 event families
7. Refactor ReplayStateMachine to use ClaimState
8. Refactor WitnessRoot to use ClaimId
9. Refactor WitnessLeaf to use ClaimId
10. Refactor ReplayCertificate to use ClaimId
11. Add claim_continuity_commitment to ReplayCertificate
12. Add claim_lineage_commitment to ReplayCertificate

### Estimated Engineering Hours

**Pre-Stage 1 Refactor:** 40-50 hours

**Stage 1 Implementation:** 20-30 hours

**Total:** 60-80 hours

### Recommendation

**DO NOT BEGIN STAGE 1 IMPLEMENTATION.**

Complete all blocking issues first. This constitutional readiness report identifies all violations and required refactors before Stage 1 Claim Foundation can begin.

END REPORT
