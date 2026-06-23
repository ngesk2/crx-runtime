# PING Runtime Constitutional Identity Algebra Directive

**Algebra Date:** 2026-06-18  
**Algebra Mode:** CONSTITUTIONAL IDENTITY PRIMITIVE FORMALIZATION  
**Algebra Principle:** Define formal algebra governing Claim Continuity, Replacement, Fork, Merge, Migration, Termination, Supersession, Replay, Witness, Certificate.

---

## CONSTITUTIONAL STATUS

ClaimIdentity has been adopted as constitutional identity.

Before any implementation of:
- ClaimAuthority
- LineageAuthority
- WitnessAuthority
- CertificateAuthority
- Replay Rewrite
- EventStore Rewrite
- Projection Rewrite

the runtime MUST define its Constitutional Identity Algebra.

No code implementation may proceed until these laws are formally specified.

---

## CONSTITUTIONAL REASON

The runtime has already determined:

```text
ClaimId
    ↓
ArtifactId
    ↓
EventId
```

where:
- ClaimId = constitutional identity
- ArtifactId = constitutional representation
- EventId = constitutional causality witness

**However:**

Claim continuity semantics are still undefined.

Without continuity semantics the runtime cannot determine:
- what survives
- what forks
- what merges
- what terminates
- what supersedes
- what witnesses prove
- what certificates certify

**Therefore Constitutional Identity Algebra becomes Stage 0.**

---

## STAGE 0 — CONSTITUTIONAL IDENTITY ALGEBRA

Determine the complete formal algebra governing:

```text
Claim Continuity
Replacement
Fork
Merge
Migration
Termination
Supersession
```

These laws become the root authority for:

```text
ClaimAuthority
LineageAuthority
ReplayAuthority
WitnessAuthority
CertificateAuthority
```

---

## LAW 1 — CLAIM CONTINUITY LAW

### Define

```text
What makes a claim the same claim?
```

### Questions

- Is continuity transitive?
- Is continuity immutable?
- Can continuity be revoked?
- Can continuity split?
- Can continuity merge?

### Required Output

```text
Claim Continuity Axioms
```

---

### Claim Continuity Axioms

#### Axiom 1 — Identity Immutability

```text
ClaimId is immutable.
```

**Formal:**
```typescript
∀ claimId: ClaimId, ∀ e: Event
  claimId(e) = claimId
```

**Constitutional Rule:** ClaimId never changes once assigned.

---

#### Axiom 2 — Continuity Transitivity

```text
Continuity is transitive.
```

**Formal:**
```typescript
∀ A, B, C: ClaimId
  continuity(A, B) ∧ continuity(B, C) → continuity(A, C)
```

**Constitutional Rule:** If A is continuous with B, and B is continuous with C, then A is continuous with C.

---

#### Axiom 3 — Continuity Immutability

```text
Continuity is immutable once established.
```

**Formal:**
```typescript
∀ A, B: ClaimId, ∀ e1, e2: Event
  continuity(A, B, e1) → continuity(A, B, e2)
```

**Constitutional Rule:** Once continuity is established between two claims, it cannot be revoked.

---

#### Axiom 4 — Continuity Non-Revocability

```text
Continuity cannot be revoked.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  continuity(A, B) → ¬revoked(A, B)
```

**Constitutional Rule:** Continuity relationships are permanent and cannot be revoked.

---

#### Axiom 5 — Continuity Splitting

```text
Continuity can split through fork.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → continuity(A, B) ∧ continuity(A, C)
```

**Constitutional Rule:** When a claim forks, continuity splits to all forked claims.

---

#### Axiom 6 — Continuity Merging

```text
Continuity can merge through merge.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → continuity(B, D) ∧ continuity(C, D)
```

**Constitutional Rule:** When claims merge, continuity merges into the merged claim.

---

#### Axiom 7 — Continuity Termination

```text
Continuity terminates at termination event.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → ∀ B: ClaimId, ¬continuity(A, B, after(termination))
```

**Constitutional Rule:** Once a claim is terminated, no new continuity relationships can be established.

---

### Claim Continuity Algebra Summary

```typescript
interface ClaimContinuity {
  claim_id: ClaimId;
  continuous_with: ClaimId[];
  continuity_type: 'direct' | 'transitive' | 'split' | 'merged';
  continuity_established_at: EventId;
  continuity_immutable: boolean;
}
```

---

## LAW 2 — REPLACEMENT LAW

### Suppose

Claim A is replaced by Claim B

### Questions

- Is A terminated?
- Does B inherit identity?
- Does B inherit continuity?
- Can A remain active?

### Required Output

```text
Replacement Algebra
```

including:
- ReplacementIdentityRule
- ReplacementContinuityRule
- ReplacementWitnessRule
- ReplacementCertificateRule

---

### Replacement Algebra

#### ReplacementIdentityRule

```text
Replacement preserves ClaimId.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → claimId(A) = claimId(B)
```

**Constitutional Rule:** When Claim A is replaced by Claim B, Claim B inherits ClaimId from Claim A. ClaimId does not change.

---

#### ReplacementContinuityRule

```text
Replacement preserves continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → continuity(A, B) ∧ ∀ C: ClaimId
    continuity(A, C) → continuity(B, C)
```

**Constitutional Rule:** When Claim A is replaced by Claim B, Claim B inherits all continuity relationships from Claim A.

---

#### ReplacementTerminationRule

```text
Replacement terminates replaced claim.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → terminated(A) ∧ active(B)
```

**Constitutional Rule:** When Claim A is replaced by Claim B, Claim A is terminated and Claim B becomes active.

---

#### ReplacementArtifactRule

```text
Replacement generates new ArtifactId.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → artifactId(A) ≠ artifactId(B)
```

**Constitutional Rule:** When Claim A is replaced by Claim B, Claim B has a new ArtifactId (new representation).

---

#### ReplacementWitnessRule

```text
Replacement witnesses claim continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → witness(continuity(A, B))
```

**Constitutional Rule:** Replacement witnesses prove continuity between replaced claim and replacement claim.

---

#### ReplacementCertificateRule

```text
Replacement certificates certify replacement continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  replace(A, B) → certificate(claimId, continuity(A, B), replacement)
```

**Constitutional Rule:** Replacement certificates certify that replacement preserves claim continuity.

---

### Replacement Algebra Summary

```typescript
interface Replacement {
  replaced_claim_id: ClaimId;
  replacement_claim_id: ClaimId;
  replacement_type: 'upgrade' | 'correction' | 'evolution';
  continuity_preserved: boolean;
  artifact_id_changed: boolean;
  replaced_at: EventId;
}
```

---

## LAW 3 — FORK LAW

### Suppose

Claim A forks into Claim B, Claim C

### Questions

- Does A survive?
- Do B and C inherit A?
- Do both inherit continuity?
- Does continuity split?
- Can one branch revoke continuity?

### Required Output

```text
Fork Algebra
```

including:
- ForkIdentityRule
- ForkContinuityRule
- ForkWitnessRule
- ForkCertificateRule

---

### Fork Algebra

#### ForkIdentityRule

```text
Fork creates new ClaimIds.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → claimId(B) ≠ claimId(A) ∧ claimId(C) ≠ claimId(A) ∧ claimId(B) ≠ claimId(C)
```

**Constitutional Rule:** When Claim A forks into Claim B and Claim C, Claim B and Claim C have new ClaimIds distinct from Claim A and each other.

---

#### ForkSurvivalRule

```text
Fork preserves parent claim.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → active(A) ∧ active(B) ∧ active(C)
```

**Constitutional Rule:** When Claim A forks, Claim A remains active and both forked claims become active.

---

#### ForkContinuityRule

```text
Fork splits continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → continuity(A, B) ∧ continuity(A, C) ∧ ¬continuity(B, C)
```

**Constitutional Rule:** When Claim A forks, continuity splits to both forked claims, but forked claims are not continuous with each other.

---

#### ForkNonRevocabilityRule

```text
Fork continuity cannot be revoked.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B: ClaimId
  fork(A, B) → continuity(A, B) ∧ ¬revoked(A, B)
```

**Constitutional Rule:** Fork continuity is permanent and cannot be revoked by either branch.

---

#### ForkArtifactRule

```text
Fork generates new ArtifactIds.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → artifactId(B) ≠ artifactId(A) ∧ artifactId(C) ≠ artifactId(A) ∧ artifactId(B) ≠ artifactId(C)
```

**Constitutional Rule:** When Claim A forks, both forked claims have new ArtifactIds (new representations).

---

#### ForkWitnessRule

```text
Fork witnesses split continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → witness(continuity(A, B)) ∧ witness(continuity(A, C))
```

**Constitutional Rule:** Fork witnesses prove continuity from parent claim to each forked claim.

---

#### ForkCertificateRule

```text
Fork certificates certify split continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B, C: ClaimId
  fork(A, B) ∧ fork(A, C) → certificate(claimId(A), continuity(A, B), continuity(A, C), fork)
```

**Constitutional Rule:** Fork certificates certify that fork splits continuity to all forked claims.

---

### Fork Algebra Summary

```typescript
interface Fork {
  parent_claim_id: ClaimId;
  forked_claim_ids: ClaimId[];
  fork_type: 'split' | 'divergence' | 'branch';
  continuity_split: boolean;
  parent_survives: boolean;
  forked_at: EventId;
}
```

---

## LAW 4 — MERGE LAW

### Suppose

Claim B, Claim C merge into Claim D

### Questions

- Does D inherit both?
- Does D become new identity?
- Are B and C terminated?
- Can merged claims remain active?

### Required Output

```text
Merge Algebra
```

including:
- MergeIdentityRule
- MergeContinuityRule
- MergeWitnessRule
- MergeCertificateRule

---

### Merge Algebra

#### MergeIdentityRule

```text
Merge creates new ClaimId.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → claimId(D) ≠ claimId(B) ∧ claimId(D) ≠ claimId(C)
```

**Constitutional Rule:** When Claim B and Claim C merge into Claim D, Claim D has a new ClaimId distinct from both merged claims.

---

#### MergeContinuityRule

```text
Merge merges continuity.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → continuity(B, D) ∧ continuity(C, D)
```

**Constitutional Rule:** When claims merge, continuity from all merged claims merges into the merged claim.

---

#### MergeTerminationRule

```text
Merge terminates merged claims.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → terminated(B) ∧ terminated(C) ∧ active(D)
```

**Constitutional Rule:** When Claim B and Claim C merge into Claim D, Claim B and Claim C are terminated and Claim D becomes active.

---

#### MergeArtifactRule

```text
Merge generates new ArtifactId.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → artifactId(D) ≠ artifactId(B) ∧ artifactId(D) ≠ artifactId(C)
```

**Constitutional Rule:** When claims merge, the merged claim has a new ArtifactId (new representation).

---

#### MergeWitnessRule

```text
Merge witnesses merged continuity.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → witness(continuity(B, D)) ∧ witness(continuity(C, D))
```

**Constitutional Rule:** Merge witnesses prove continuity from each merged claim to the merged claim.

---

#### MergeCertificateRule

```text
Merge certificates certify merged continuity.
```

**Formal:**
```typescript
∀ B, C: ClaimId, ∀ D: ClaimId
  merge(B, D) ∧ merge(C, D) → certificate(claimId(D), continuity(B, D), continuity(C, D), merge)
```

**Constitutional Rule:** Merge certificates certify that merge merges continuity from all merged claims.

---

### Merge Algebra Summary

```typescript
interface Merge {
  merged_claim_ids: ClaimId[];
  resulting_claim_id: ClaimId;
  merge_type: 'union' | 'intersection' | 'composition';
  continuity_merged: boolean;
  merged_claims_terminated: boolean;
  merged_at: EventId;
}
```

---

## LAW 5 — MIGRATION LAW

### Suppose

Claim A moves across:
- context
- runtime
- namespace
- storage boundary
- representation boundary

### Questions

- What changes?
- What remains invariant?
- Can ClaimId survive migration?
- Must ArtifactId change?

### Required Output

```text
Migration Algebra
```

---

### Migration Algebra

#### MigrationIdentityRule

```text
Migration preserves ClaimId.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → claimId(A, ctx1) = claimId(A, ctx2)
```

**Constitutional Rule:** When a claim migrates across contexts, ClaimId remains invariant.

---

#### MigrationArtifactRule

```text
Migration may change ArtifactId.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → artifactId(A, ctx1) ≠ artifactId(A, ctx2) ∨ artifactId(A, ctx1) = artifactId(A, ctx2)
```

**Constitutional Rule:** When a claim migrates, ArtifactId may change (new representation) or remain the same (same representation).

---

#### MigrationContinuityRule

```text
Migration preserves continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → continuity(A, ctx1, ctx2)
```

**Constitutional Rule:** When a claim migrates, continuity is preserved across the migration boundary.

---

#### MigrationContextRule

```text
Migration changes context.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → context(A, ctx1) ≠ context(A, ctx2)
```

**Constitutional Rule:** When a claim migrates, the context changes (by definition of migration).

---

#### MigrationWitnessRule

```text
Migration witnesses cross-context continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → witness(continuity(A, ctx1, ctx2))
```

**Constitutional Rule:** Migration witnesses prove continuity across the migration boundary.

---

#### MigrationCertificateRule

```text
Migration certificates certify cross-context continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ ctx1, ctx2: Context
  migrate(A, ctx1, ctx2) → certificate(claimId(A), continuity(A, ctx1, ctx2), migration)
```

**Constitutional Rule:** Migration certificates certify that migration preserves claim continuity across contexts.

---

### Migration Algebra Summary

```typescript
interface Migration {
  claim_id: ClaimId;
  from_context: Context;
  to_context: Context;
  migration_type: 'context' | 'location' | 'format' | 'runtime' | 'namespace';
  claim_id_preserved: boolean;
  artifact_id_changed: boolean;
  continuity_preserved: boolean;
  migrated_at: EventId;
}
```

---

## LAW 6 — TERMINATION LAW

### Questions

- What constitutes constitutional death?
- Can terminated claims be replayed?
- Can terminated claims be revived?
- Can continuity resume after termination?

### Required Output

```text
Termination Algebra
```

---

### Termination Algebra

#### TerminationDefinitionRule

```text
Termination is constitutional death.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → ¬active(A) ∧ ∀ B: ClaimId, ¬continuity(A, B, after(termination))
```

**Constitutional Rule:** When a claim is terminated, it becomes inactive and cannot establish new continuity relationships.

---

#### TerminationReplayRule

```text
Terminated claims can be replayed.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → replayable(A)
```

**Constitutional Rule:** Terminated claims can be replayed (historical reconstruction), but cannot be revived (future continuity).

---

#### TerminationRevivalRule

```text
Terminated claims cannot be revived.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → ¬revivable(A)
```

**Constitutional Rule:** Once a claim is terminated, it cannot be revived. Continuity cannot resume after termination.

---

#### TerminationContinuityRule

```text
Termination preserves historical continuity.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B: ClaimId
  terminated(A) ∧ continuity(A, B, before(termination)) → historical_continuity(A, B)
```

**Constitutional Rule:** Termination preserves historical continuity relationships (for replay), but prevents new continuity relationships.

---

#### TerminationWitnessRule

```text
Termination witnesses termination event.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → witness(termination_event(A))
```

**Constitutional Rule:** Termination witnesses prove that a claim was terminated at a specific event.

---

#### TerminationCertificateRule

```text
Termination certificates certify termination.
```

**Formal:**
```typescript
∀ A: ClaimId
  terminated(A) → certificate(claimId(A), termination_event(A), termination)
```

**Constitutional Rule:** Termination certificates certify that a claim was constitutionally terminated.

---

### Termination Algebra Summary

```typescript
interface Termination {
  claim_id: ClaimId;
  termination_type: 'explicit' | 'implicit' | 'timeout' | 'supersession';
  terminated_at: EventId;
  replayable: boolean;
  revivable: boolean;
  historical_continuity_preserved: boolean;
}
```

---

## LAW 7 — SUPERSESSION LAW

### Questions

- How does supersession differ from replacement?
- Can multiple claims supersede one claim?
- Can one claim supersede many claims?
- Does supersession preserve continuity?

### Required Output

```text
Supersession Algebra
```

---

### Supersession Algebra

#### SupersessionDefinitionRule

```text
Supersession is multi-source replacement.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B: ClaimId
  supersede(A, B) → replace(A, B) ∧ supersession_type = 'multi_source'
```

**Constitutional Rule:** Supersession is a type of replacement where multiple claims may supersede a single claim.

---

#### SupersessionMultiSourceRule

```text
Multiple claims can supersede one claim.
```

**Formal:**
```typescript
∀ A: ClaimId, ∀ B1, B2: ClaimId
  supersede(B1, A) ∧ supersede(B2, A) → superseded_by(A, {B1, B2})
```

**Constitutional Rule:** Multiple claims can supersede a single claim (the superseded claim has multiple successors).

---

#### SupersessionMultiTargetRule

```text
One claim can supersede many claims.
```

**Formal:**
```typescript
∀ A1, A2: ClaimId, ∀ B: ClaimId
  supersede(A1, B) ∧ supersede(A2, B) → supersedes(B, {A1, A2})
```

**Constitutional Rule:** One claim can supersede multiple claims (the superseding claim has multiple predecessors).

---

#### SupersessionContinuityRule

```text
Supersession preserves continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → continuity(A, B) ∧ ∀ C: ClaimId
    continuity(A, C) → continuity(B, C)
```

**Constitutional Rule:** Supersession preserves continuity from superseded claim to superseding claim.

---

#### SupersessionIdentityRule

```text
Supersession preserves ClaimId.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → claimId(A) = claimId(B)
```

**Constitutional Rule:** When Claim A is superseded by Claim B, Claim B inherits ClaimId from Claim A.

---

#### SupersessionWitnessRule

```text
Supersession witnesses supersession continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → witness(continuity(A, B))
```

**Constitutional Rule:** Supersession witnesses prove continuity from superseded claim to superseding claim.

---

#### SupersessionCertificateRule

```text
Supersession certificates certify supersession continuity.
```

**Formal:**
```typescript
∀ A, B: ClaimId
  supersede(A, B) → certificate(claimId, continuity(A, B), supersession)
```

**Constitutional Rule:** Supersession certificates certify that supersession preserves claim continuity.

---

### Supersession Algebra Summary

```typescript
interface Supersession {
  superseded_claim_id: ClaimId;
  superseding_claim_id: ClaimId;
  supersession_type: 'multi_source' | 'multi_target' | 'single';
  continuity_preserved: boolean;
  claim_id_preserved: boolean;
  superseded_at: EventId;
}
```

---

## LAW 8 — REPLAY LAW

### Replay currently reconstructs

```text
Artifact State
```

### New constitution proposes

```text
Claim State
```

### Questions

- What is replay's authoritative object?
- Claim?
- Claim Graph?
- Continuity Graph?

### Required Output

```text
Replay Identity Law
```

---

### Replay Identity Law

#### ReplayObjectRule

```text
Replay reconstructs Claim State.
```

**Formal:**
```typescript
replay(events) → ClaimState
```

**Constitutional Rule:** Replay's authoritative object is Claim State, not Artifact State.

---

#### ReplayClaimGraphRule

```text
Replay reconstructs Claim Graph.
```

**Formal:**
```typescript
replay(events) → ClaimGraph
```

**Constitutional Rule:** Replay reconstructs the Claim Graph (constitutional lineage graph).

---

#### ReplayContinuityGraphRule

```text
Replay reconstructs Continuity Graph.
```

**Formal:**
```typescript
replay(events) → ContinuityGraph
```

**Constitutional Rule:** Replay reconstructs the Continuity Graph (continuity relationships between claims).

---

#### ReplayArtifactProjectionRule

```text
Replay projects Artifacts from Claims.
```

**Formal:**
```typescript
replay(events) → ClaimState → ArtifactProjection
```

**Constitutional Rule:** Artifacts are projections derived from Claims during replay.

---

#### ReplayDeterminismRule

```text
Replay is deterministic.
```

**Formal:**
```typescript
∀ events1, events2: Event[]
  events1 = events2 → replay(events1) = replay(events2)
```

**Constitutional Rule:** Replay is deterministic: same events produce same Claim State, Claim Graph, Continuity Graph, and Artifact Projections.

---

### Replay Identity Law Summary

```typescript
interface ReplayIdentity {
  authoritative_object: 'ClaimState';
  constitutional_graph: 'ClaimGraph';
  continuity_graph: 'ContinuityGraph';
  artifact_projection: 'ArtifactProjection';
  replay_determinism: boolean;
}
```

---

## LAW 9 — WITNESS LAW

### Questions

- What exactly is witnessed?
- Identity?
- Continuity?
- Representation?
- Lineage?

### Required Output

```text
Witness Subject Law
```

including:
- WitnessRootSubject
- WitnessLeafSubject
- ContinuityProofSubject

---

### Witness Subject Law

#### WitnessRootSubjectRule

```text
WitnessRoot subject is ClaimId.
```

**Formal:**
```typescript
∀ witnessRoot: WitnessRoot
  subject(witnessRoot) = ClaimId
```

**Constitutional Rule:** WitnessRoot is rooted in ClaimId (constitutional identity).

---

#### WitnessLeafSubjectRule

```text
WitnessLeaf subject is ClaimId.
```

**Formal:**
```typescript
∀ witnessLeaf: WitnessLeaf
  subject(witnessLeaf) = ClaimId
```

**Constitutional Rule:** WitnessLeaf is rooted in ClaimId (constitutional identity).

---

#### ContinuityProofSubjectRule

```text
Continuity proof subject is ClaimId.
```

**Formal:**
```typescript
∀ continuityProof: ContinuityProof
  subject(continuityProof) = ClaimId
```

**Constitutional Rule:** Continuity proofs prove continuity between ClaimIds (constitutional identity).

---

#### WitnessArtifactRule

```text
Witness includes ArtifactId as representation.
```

**Formal:**
```typescript
∀ witnessLeaf: WitnessLeaf
  includes(witnessLeaf, ArtifactId)
```

**Constitutional Rule:** WitnessLeaf includes ArtifactId as representation, but subject is ClaimId.

---

#### WitnessLineageRule

```text
Witness includes LineageCommitment.
```

**Formal:**
```typescript
∀ witnessLeaf: WitnessLeaf
  includes(witnessLeaf, LineageCommitment)
```

**Constitutional Rule:** WitnessLeaf includes LineageCommitment to prove claim lineage.

---

### Witness Subject Law Summary

```typescript
interface WitnessSubject {
  witness_root_subject: 'ClaimId';
  witness_leaf_subject: 'ClaimId';
  continuity_proof_subject: 'ClaimId';
  includes_artifact_id: boolean;
  includes_lineage_commitment: boolean;
}
```

---

## LAW 10 — CERTIFICATE LAW

### Questions

- What exactly is certified?
- Identity?
- Continuity?
- Existence?
- Lineage?

### Required Output

```text
Certificate Subject Law
```

including:
- CertificateCommitmentLaw
- ContinuityCommitmentLaw
- LineageCommitmentLaw

---

### Certificate Subject Law

#### CertificateSubjectRule

```text
Certificate subject is ClaimId.
```

**Formal:**
```typescript
∀ certificate: Certificate
  subject(certificate) = ClaimId
```

**Constitutional Rule:** Certificate is rooted in ClaimId (constitutional identity).

---

#### CertificateCommitmentLaw

```text
Certificate commits to ClaimId.
```

**Formal:**
```typescript
∀ certificate: Certificate
  commitment(certificate, ClaimId)
```

**Constitutional Rule:** Certificate commits to ClaimId (constitutional identity).

---

#### ContinuityCommitmentLaw

```text
Certificate commits to continuity.
```

**Formal:**
```typescript
∀ certificate: Certificate
  commitment(certificate, continuity)
```

**Constitutional Rule:** Certificate commits to continuity (constitutional continuity).

---

#### LineageCommitmentLaw

```text
Certificate commits to lineage.
```

**Formal:**
```typescript
∀ certificate: Certificate
  commitment(certificate, lineage)
```

**Constitutional Rule:** Certificate commits to lineage (constitutional lineage graph).

---

#### CertificateExistenceRule

```text
Certificate certifies continuous constitutional existence.
```

**Formal:**
```typescript
∀ certificate: Certificate
  certifies(certificate, continuous_constitutional_existence(ClaimId))
```

**Constitutional Rule:** Certificate certifies continuous constitutional existence of ClaimId across all transformations.

---

### Certificate Subject Law Summary

```typescript
interface CertificateSubject {
  certificate_subject: 'ClaimId';
  certificate_commitment: 'ClaimId';
  continuity_commitment: boolean;
  lineage_commitment: boolean;
  certifies_continuous_existence: boolean;
}
```

---

## REQUIRED DELIVERABLES

### 1. Constitutional Identity Algebra

**Status:** COMPLETE

**Summary:** Formal algebra governing Claim Continuity, Replacement, Fork, Merge, Migration, Termination, Supersession, Replay, Witness, Certificate.

---

### 2. Claim Continuity Axioms

**Status:** COMPLETE

**Summary:** 7 axioms governing claim continuity (Identity Immutability, Continuity Transitivity, Continuity Immutability, Continuity Non-Revocability, Continuity Splitting, Continuity Merging, Continuity Termination).

---

### 3. Replacement Algebra

**Status:** COMPLETE

**Summary:** 6 rules governing replacement (ReplacementIdentityRule, ReplacementContinuityRule, ReplacementTerminationRule, ReplacementArtifactRule, ReplacementWitnessRule, ReplacementCertificateRule).

---

### 4. Fork Algebra

**Status:** COMPLETE

**Summary:** 7 rules governing fork (ForkIdentityRule, ForkSurvivalRule, ForkContinuityRule, ForkNonRevocabilityRule, ForkArtifactRule, ForkWitnessRule, ForkCertificateRule).

---

### 5. Merge Algebra

**Status:** COMPLETE

**Summary:** 6 rules governing merge (MergeIdentityRule, MergeContinuityRule, MergeTerminationRule, MergeArtifactRule, MergeWitnessRule, MergeCertificateRule).

---

### 6. Migration Algebra

**Status:** COMPLETE

**Summary:** 6 rules governing migration (MigrationIdentityRule, MigrationArtifactRule, MigrationContinuityRule, MigrationContextRule, MigrationWitnessRule, MigrationCertificateRule).

---

### 7. Termination Algebra

**Status:** COMPLETE

**Summary:** 6 rules governing termination (TerminationDefinitionRule, TerminationReplayRule, TerminationRevivalRule, TerminationContinuityRule, TerminationWitnessRule, TerminationCertificateRule).

---

### 8. Supersession Algebra

**Status:** COMPLETE

**Summary:** 7 rules governing supersession (SupersessionDefinitionRule, SupersessionMultiSourceRule, SupersessionMultiTargetRule, SupersessionContinuityRule, SupersessionIdentityRule, SupersessionWitnessRule, SupersessionCertificateRule).

---

### 9. Replay Identity Law

**Status:** COMPLETE

**Summary:** 5 rules governing replay (ReplayObjectRule, ReplayClaimGraphRule, ReplayContinuityGraphRule, ReplayArtifactProjectionRule, ReplayDeterminismRule).

---

### 10. Witness Subject Law

**Status:** COMPLETE

**Summary:** 5 rules governing witness (WitnessRootSubjectRule, WitnessLeafSubjectRule, ContinuityProofSubjectRule, WitnessArtifactRule, WitnessLineageRule).

---

### 11. Certificate Subject Law

**Status:** COMPLETE

**Summary:** 5 rules governing certificate (CertificateSubjectRule, CertificateCommitmentLaw, ContinuityCommitmentLaw, LineageCommitmentLaw, CertificateExistenceRule).

---

## CONSTITUTIONAL CONSTRAINT

No implementation of:
- ClaimAuthority
- LineageAuthority
- ReplayAuthority
- WitnessAuthority
- CertificateAuthority

may begin until all identity algebra laws have been formally adopted.

The resulting algebra becomes the highest-order constitutional authority of the PING Runtime.

---

## CONCLUSION

This Constitutional Identity Algebra defines the formal algebra governing Claim Continuity, Replacement, Fork, Merge, Migration, Termination, Supersession, Replay, Witness, and Certificate.

**10 Laws:**
1. Claim Continuity Law - 7 axioms
2. Replacement Law - 6 rules
3. Fork Law - 7 rules
4. Merge Law - 6 rules
5. Migration Law - 6 rules
6. Termination Law - 6 rules
7. Supersession Law - 7 rules
8. Replay Law - 5 rules
9. Witness Law - 5 rules
10. Certificate Law - 5 rules

**11 Deliverables:** All complete.

**Constitutional Status:** This algebra becomes the highest-order constitutional authority of the PING Runtime. No implementation may proceed until this algebra is formally adopted.

**Next Steps:** Stage 1 (Claim Foundation) may proceed after this algebra is formally adopted.
