# PING Runtime Constitutional Claim Identity Refactor Patch

**Patch Date:** 2026-06-18  
**Patch Mode:** CONSTITUTIONAL IDENTITY PRIMITIVE REFACTORING  
**Patch Principle:** Refactor PING Runtime from Artifact-Centric to Claim-Centric constitution.

---

## CONSTITUTIONAL DIRECTIVE

ClaimIdentity has been formally determined to be the constitutional identity primitive of the PING Runtime.

ArtifactId is NOT constitutional identity.

ArtifactId is a constitutional representation.

EventId is a constitutional causality witness.

The runtime SHALL be refactored accordingly.

---

## CONSTITUTIONAL HIERARCHY

### Replace

```text
ArtifactId
→ identity
```

### With

```text
ClaimId
→ constitutional identity

ArtifactId
→ representation

EventId
→ causality
```

### Constitutional Stack

```text
ClaimId
↓
ArtifactId
↓
EventId
```

**Identity continuity SHALL be anchored exclusively to ClaimId.**

---

## PATCH 1 — CONSTITUTIONAL CLAIM TYPE

### Create

```typescript
export type ClaimId =
  string & {
    readonly __claimBrand: unique symbol;
  };
```

### Requirements

- ClaimId MUST be branded
- ClaimId MUST NOT be string
- ClaimId MUST NOT be derived from ArtifactId
- ClaimId MUST survive replacement
- ClaimId MUST survive migration
- ClaimId MUST survive fork lineage
- ClaimId MUST survive merge lineage

### Search

```bash
rg -n "ArtifactId.*identity|artifact identity"
```

### Replace

Replace all constitutional identity usage with ClaimId.

### File Location

`PING/runtime/replay/replay_types.ts`

### Risk

**LOW** - New branded type introduction

---

## PATCH 2 — CLAIM AUTHORITY

### Create

```typescript
ClaimAuthority
```

### ClaimAuthority Responsibilities

ClaimAuthority becomes sole authority for:
- claim creation
- claim continuity
- claim replacement
- claim supersession
- claim migration
- claim fork
- claim merge
- claim ancestry

### Required API

```typescript
createClaim(...)
replaceClaim(...)
forkClaim(...)
mergeClaims(...)
migrateClaim(...)
validateContinuity(...)
computeContinuityDistance(...)
traceClaimLineage(...)
```

### Constitutional Rule

No other authority may own these responsibilities.

### File Location

`PING/runtime/claim/claim_authority.ts` (new file)

### Risk

**HIGH** - New constitutional authority creation

---

## PATCH 3 — ARTIFACT AUTHORITY

### Create

```typescript
ArtifactAuthority
```

### ArtifactAuthority Responsibilities

ArtifactAuthority owns:
- canonical bytes
- canonical hash
- artifact derivation
- artifact replacement generation
- artifact lineage

### Constitutional Rules

ArtifactAuthority SHALL NOT own continuity.

ArtifactAuthority SHALL NOT own identity.

ArtifactAuthority SHALL NOT own replacement semantics.

### File Location

`PING/runtime/artifact/artifact_authority.ts` (new file)

### Risk

**MEDIUM** - New constitutional authority creation

---

## PATCH 4 — IDENTITY AUTHORITY REDESIGN

### Current Implementation

IdentityAuthority owns identity derivation, hashing, canonicalization.

### Target Implementation

IdentityAuthority becomes mapping authority.

### IdentityAuthority Responsibilities

IdentityAuthority owns ONLY:
```text
ClaimId
↔
ArtifactId
```

### Required APIs

```typescript
bindArtifact(...)
resolveClaim(...)
resolveArtifact(...)
resolveCurrentArtifact(...)
```

### Constitutional Rules

IdentityAuthority SHALL NOT:
- hash
- canonicalize
- create witnesses
- create certificates

### File Location

`PING/runtime/identity/identity_authority.ts`

### Risk

**HIGH** - IdentityAuthority redesign

---

## PATCH 5 — CLAIM STATE MACHINE

### Replace Replay Object

**Current:**
```text
ArtifactState
```

**Target:**
```typescript
ClaimState
```

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

### Constitutional Rule

Replay SHALL reconstruct claims.

Artifacts become projections.

### File Location

`PING/runtime/replay/replay_types.ts`

### Risk

**HIGH** - Replay state machine refactor

---

## PATCH 6 — LINEAGE AUTHORITY REDESIGN

### Current Implementation

LineageAuthority tracks ArtifactId ancestry only.

### Target Implementation

LineageAuthority must become dual graph authority.

### Required Graphs

```text
Claim Graph
Artifact Graph
```

### Required APIs

```typescript
traceClaimLineage(...)
traceArtifactLineage(...)
buildClaimGraph(...)
buildArtifactGraph(...)
validateClaimContinuity(...)
validateArtifactContinuity(...)
```

### Constitutional Rule

Claim graph becomes constitutional.

Artifact graph becomes representational.

### File Location

`PING/runtime/lineage/lineage_authority.ts`

### Risk

**HIGH** - Lineage authority redesign

---

## PATCH 7 — EVENTSTORE EVOLUTION

### Current Implementation

EventStore records artifact evolution only.

### Target Implementation

EventStore becomes claim-aware.

### Add Event Families

```typescript
claim_created
claim_replaced
claim_forked
claim_merged
claim_migrated
```

### Constitutional Rule

Replay MUST reconstruct claim continuity exclusively from EventStore.

No projection may create continuity.

No database state may create continuity.

### File Location

`PING/runtime/kernel/event-store/` (new directory)

### Risk

**HIGH** - EventStore evolution

---

## PATCH 8 — WITNESS REFACTOR

### Current Implementation

Witness subject is artifact.

### Target Implementation

Witness subject becomes ClaimId.

### Witness Leaves MUST Contain

```typescript
ClaimId
ArtifactId
CanonicalHash
LineageCommitment
```

### Constitutional Rule

Witnesses SHALL prove:
```text
claim continuity
```

**not:**
```text
artifact continuity
```

### File Location

`PING/runtime/witness/witness_authority.ts`

### Risk

**MEDIUM** - Witness subject refactor

---

## PATCH 9 — CERTIFICATE REFACTOR

### Current Implementation

Certificates certify artifact continuity.

### Target Implementation

Replay certificates become continuity certificates.

### Required Commitments

```typescript
claim_continuity_commitment
claim_lineage_commitment
claim_supersession_commitment
claim_fork_commitment
claim_merge_commitment
```

### Certificate Subject

```text
ClaimId
```

### Constitutional Rule

Certificate SHALL certify:
```text
continuous constitutional existence
```

**across all transformations.**

### File Location

`PING/runtime/certificate/certificate_authority.ts`

### Risk

**MEDIUM** - Certificate refactor

---

## PATCH 10 — PROJECTION REFACTOR

### Current Implementation

```text
Artifact
↓
State
```

### Target Implementation

Projection runtime becomes:
```text
Claim
↓
Artifact Projection
↓
State Projection
```

### Constitutional Rule

Claims become authoritative.

Artifacts become derived.

### File Location

`PING/runtime/projections/projection_runtime.ts` (new file)

### Risk

**HIGH** - Projection refactor

---

## PATCH 11 — CONSTITUTIONAL REPLAY LAW

### Current Convergence Target

```text
same event history
→ same artifact graph
→ same replay ordering
→ same replay state
→ same canonical bytes
→ same canonical hash
→ same witness root
→ same replay certificate
```

### Target Convergence Target

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

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**HIGH** - Replay convergence target refactor

---

## NEW CONSTITUTIONAL AUTHORITIES

### 13 Constitutional Authorities

1. AuthorizationAuthority
2. CanonicalAuthority
3. CanonicalHashAuthority
4. ClaimAuthority (NEW)
5. ArtifactAuthority (NEW)
6. IdentityAuthority (REDESIGNED)
7. LineageAuthority (REDESIGNED)
8. EventStore (EVOLVED)
9. ProjectionRuntime (EVOLVED)
10. PersistenceAuthority
11. WitnessAuthority (REFACTORED)
12. CertificateAuthority (REFACTORED)
13. RuntimeAuthority

### Authority Changes

**New Authorities:**
- ClaimAuthority
- ArtifactAuthority

**Redesigned Authorities:**
- IdentityAuthority (becomes mapping authority)
- LineageAuthority (becomes dual graph authority)

**Evolved Authorities:**
- EventStore (becomes claim-aware)
- ProjectionRuntime (becomes claim-centric)

**Refactored Authorities:**
- WitnessAuthority (subject becomes ClaimId)
- CertificateAuthority (certifies claim continuity)

---

## CONSTITUTIONAL LAW

### ClaimIdentity Sovereignty

ClaimIdentity is sovereign.

ArtifactId is representational.

EventId is causal.

### Continuity Origin

No authority may derive constitutional continuity from artifacts.

All continuity originates from ClaimIdentity.

### Authority Overlap

Authority overlap constitutes a constitutional violation.

### Constitutional Stack

```text
ClaimId (constitutional identity)
↓
ArtifactId (representation)
↓
EventId (causality)
```

---

## CONSOLIDATED IMPLEMENTATION ORDER

| Step | Patch | Work | Risk | Dependency |
| ---- | ----- | ---- | ---- | ---------- |
| 1 | PATCH 1 | Constitutional Claim Type | Low | None |
| 2 | PATCH 3 | Artifact Authority | Medium | PATCH 1 |
| 3 | PATCH 2 | Claim Authority | High | PATCH 1, PATCH 3 |
| 4 | PATCH 5 | Claim State Machine | High | PATCH 1, PATCH 2 |
| 5 | PATCH 6 | Lineage Authority Redesign | High | PATCH 1, PATCH 2, PATCH 5 |
| 6 | PATCH 4 | Identity Authority Redesign | High | PATCH 1, PATCH 2, PATCH 3 |
| 7 | PATCH 7 | EventStore Evolution | High | PATCH 1, PATCH 2, PATCH 5 |
| 8 | PATCH 8 | Witness Refactor | Medium | PATCH 1, PATCH 2 |
| 9 | PATCH 9 | Certificate Refactor | Medium | PATCH 1, PATCH 2, PATCH 8 |
| 10 | PATCH 10 | Projection Refactor | High | PATCH 1, PATCH 2, PATCH 5, PATCH 7 |
| 11 | PATCH 11 | Constitutional Replay Law | High | PATCH 1, PATCH 2, PATCH 5, PATCH 6, PATCH 7 |

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

**11 patches = 11 implementation steps**

**Estimated engineering hours:** 50-70 hours (Claim-Centric constitution refactor)

**Result:** PING Runtime kernel enforces ClaimIdentity as constitutional identity primitive, with ArtifactId as representation and EventId as causality.

---

## CONCLUSION

This constitutional claim identity refactor transforms PING Runtime from Artifact-Centric to Claim-Centric constitution by:

1. **Constitutional Claim Type** (PATCH 1) - Create ClaimId branded type as constitutional identity primitive
2. **Claim Authority** (PATCH 2) - Create ClaimAuthority for claim lifecycle (creation, continuity, replacement, supersession, migration, fork, merge, ancestry)
3. **Artifact Authority** (PATCH 3) - Create ArtifactAuthority for artifact derivation (canonical bytes, canonical hash, artifact derivation, artifact lineage)
4. **Identity Authority Redesign** (PATCH 4) - IdentityAuthority becomes mapping authority (ClaimId ↔ ArtifactId)
5. **Claim State Machine** (PATCH 5) - Replace ArtifactState with ClaimState (claim_id, current_artifact_id, artifact_history, claim_lineage, supersedes, superseded_by, forked_from, forked_into, merged_from, merged_into)
6. **Lineage Authority Redesign** (PATCH 6) - Dual graph authority (Claim Graph + Artifact Graph)
7. **EventStore Evolution** (PATCH 7) - Add claim event families (claim_created, claim_replaced, claim_forked, claim_merged, claim_migrated)
8. **Witness Refactor** (PATCH 8) - Witness subject becomes ClaimId, witnesses prove claim continuity
9. **Certificate Refactor** (PATCH 9) - Continuity certificates for claims (claim_continuity_commitment, claim_lineage_commitment, claim_supersession_commitment, claim_fork_commitment, claim_merge_commitment)
10. **Projection Refactor** (PATCH 10) - Claims become authoritative, artifacts become derived
11. **Constitutional Replay Law** (PATCH 11) - Replay convergence target becomes claim-centric

**At that point PING Runtime kernel enforces ClaimIdentity as constitutional identity primitive, with ArtifactId as representation and EventId as causality.**
