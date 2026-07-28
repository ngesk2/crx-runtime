# PING Runtime Constitutional Identity Determination

**Determination Date:** 2026-06-18  
**Determination Mode:** CONSTITUTIONAL ROOT OF TRUST ANALYSIS  
**Determination Principle:** Determine whether ClaimIdentity exists as a constitutional primitive independent of EventId and ArtifactId.

---

## MANDATE

**STOP ALL PHASE 4, PHASE 7, AND PHASE 8 IMPLEMENTATION.**

Do not refactor:
- LineageAuthority
- IdentityAuthority
- WitnessAuthority
- CertificateAuthority
- Continuity Proofs
- Replay Ancestry
- Fork Semantics
- Replacement Semantics

until Constitutional Identity has been formally determined.

---

## OBJECTIVE

Determine whether ClaimIdentity exists as a constitutional primitive independent of:
- EventId
- ArtifactId

This decision becomes the constitutional root of trust for the entire runtime.

The result must drive:
- identity model
- lineage model
- replay model
- witness model
- certificate model
- continuity model
- replacement model
- fork model
- supersession model

across the entire PING Runtime.

---

## CONSTITUTIONAL QUESTIONS

### Question 1

**Can two artifacts possess different ArtifactIds while still representing the same constitutional entity?**

**Examples:**
- replacement artifact
- migrated artifact
- evolved artifact
- reconstructed artifact
- forked artifact
- merged artifact

**Answer:** NO

**Evidence:**
- Current PING Runtime uses ArtifactId as the sole constitutional identity
- replay_types.ts line 20: `export type ArtifactId = string & { readonly __brand: unique symbol };`
- replay_types.ts line 85: `parent_event_ids: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only`
- replay_types.ts line 104-105: `parent_id: ArtifactId; child_id: ArtifactId; // Constitutional rule: lineage graph uses artifact IDs only`
- replay_types.ts line 115: `artifacts: Map<ArtifactId, ArtifactState>; // Constitutional rule: state keyed by artifact IDs`
- replay_types.ts line 122-124: `artifact_id: ArtifactId; artifact_lineage: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only`
- No ClaimIdentity exists in current runtime
- No replacement, migration, evolution, reconstruction, fork, or merge semantics exist
- ArtifactId is the constitutional identity

**Conclusion:** ArtifactId is constitutional identity. ClaimIdentity does NOT exist.

---

### Question 2

**Can constitutional continuity survive:**
- replacement
- fork
- migration
- merge
- supersession

**without preserving ArtifactId?**

**Answer:** NO

**Evidence:**
- Current PING Runtime does not have replacement, fork, migration, merge, or supersession semantics
- Current PING Runtime only has artifact_commit and artifact_update events
- replay_state_machine.ts line 60-64: Only handles 'artifact_commit' and 'artifact_update' events
- replay_state_machine.ts line 182-186: Duplicate artifact_id detection prevents multiple artifacts with same ArtifactId
- replay_state_machine.ts line 188-192: Artifact state is keyed by artifact_id only
- Lineage is tracked via ArtifactId[] only
- No continuity semantics exist beyond artifact lineage
- ArtifactId must be preserved for continuity

**Conclusion:** ArtifactId remains constitutional identity. Continuity cannot survive without preserving ArtifactId.

---

### Question 3

**When witnesses prove continuity, are they proving:**

**A) Artifact continuity**

**or**

**B) Claim continuity**

**Answer:** A) Artifact continuity

**Evidence:**
- replay_types.ts line 127-133: WitnessRoot structure exists but witness implementation is not analyzed
- replay_types.ts line 166-185: ReplayCertificate structure exists but certificate implementation is not analyzed
- Current runtime tracks artifact continuity via ArtifactId lineage
- No ClaimIdentity exists to prove claim continuity
- Witnesses would prove artifact continuity because artifacts are the constitutional entities

**Determination:** The runtime must certify artifact continuity.

---

### Question 4

**When replay reconstructs history, does replay reconstruct:**

**A) artifact lineage**

**or**

**B) claim lineage**

**Answer:** A) artifact lineage

**Evidence:**
- replay_types.ts line 115: `artifacts: Map<ArtifactId, ArtifactState>; // Constitutional rule: state keyed by artifact IDs`
- replay_types.ts line 124: `artifact_lineage: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only`
- replay_state_machine.ts line 82-196: handleArtifactCommit tracks artifact lineage via normalizedLineage (ArtifactId[])
- replay_state_machine.ts line 188-192: Artifact state includes artifact_id, artifact_hash, artifact_lineage (all artifact-centric)
- replay_state_machine.ts line 228-238: getAllArtifacts returns ArtifactState[] (artifact-centric)
- No ClaimIdentity exists to reconstruct claim lineage
- Replay reconstructs artifact state machine

**Determination:** The authoritative replay object is artifact state machine.

---

## FULL RUNTIME ANALYSIS

### Layer 1 — Kernel

**Determine:**
- identity root
- continuity root
- replay root

**Analysis:**
- Identity root: ArtifactId
- Continuity root: ArtifactId lineage
- Replay root: ArtifactId state machine

**Evidence:**
- replay_types.ts line 20: ArtifactId is branded type
- replay_types.ts line 85: lineage uses ArtifactId[] only
- replay_types.ts line 115: state keyed by ArtifactId
- No ClaimIdentity exists
- No alternative identity root exists

**Conclusion:** Kernel is Artifact-Centric.

---

### Layer 2 — EventStore

**Determine whether EventStore records:**
- artifact evolution
- or
- claim evolution

**Analysis:**
- EventStore records artifact evolution

**Evidence:**
- replay_types.ts line 78-90: CanonicalEventEnvelope includes event_id, event_type, payload, lineage
- replay_types.ts line 85: lineage uses ArtifactId[] only
- replay_state_machine.ts line 60-64: Only handles 'artifact_commit' and 'artifact_update' events
- No claim evolution events exist
- No ClaimIdentity exists in event payloads

**Conclusion:** EventStore records artifact evolution.

---

### Layer 3 — LineageAuthority

**Determine whether lineage tracks:**
- ArtifactId ancestry
- or
- ClaimIdentity ancestry

**Analysis:**
- Lineage tracks ArtifactId ancestry

**Evidence:**
- replay_types.ts line 85: `parent_event_ids: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only`
- replay_types.ts line 104-105: `parent_id: ArtifactId; child_id: ArtifactId; // Constitutional rule: lineage graph uses artifact IDs only`
- replay_types.ts line 124: `artifact_lineage: ArtifactId[]; // Constitutional rule: lineage uses artifact IDs only`
- replay_state_machine.ts line 156-179: Normalization converts event IDs to artifact IDs
- replay_state_machine.ts line 191: artifact_lineage stores normalizedLineage (ArtifactId[])
- No ClaimIdentity ancestry exists
- No LineageAuthority exists yet (scattered in ReplayStateMachine and GraphValidator)

**Conclusion:** Lineage tracks ArtifactId ancestry.

---

### Layer 4 — IdentityAuthority

**Determine whether IdentityAuthority owns:**
- ArtifactId only
- or
- ArtifactId + ClaimIdentity

**Analysis:**
- IdentityAuthority owns ArtifactId only

**Evidence:**
- replay_types.ts line 20: ArtifactId is branded type
- replay_types.ts line 28-30: isArtifactId checks for 'artifact-' prefix
- replay_types.ts line 52-63: toArtifactId validates 'artifact-' prefix
- No ClaimIdentity type exists
- No IdentityAuthority exists yet (identity derivation is in CanonicalHashAuthority)
- No ClaimIdentity ownership exists

**Conclusion:** IdentityAuthority owns ArtifactId only.

---

### Layer 5 — ReplayStateMachine

**Determine replay object:**
- artifact state machine
- or
- claim state machine

**Analysis:**
- Replay object is artifact state machine

**Evidence:**
- replay_state_machine.ts line 34-44: ReplayStateMachine stores artifacts: Map<ArtifactId, ArtifactState>
- replay_state_machine.ts line 82-196: handleArtifactCommit creates ArtifactState
- replay_state_machine.ts line 201-214: handleArtifactUpdate updates ArtifactState
- replay_state_machine.ts line 219-222: getArtifactState returns ArtifactState
- replay_state_machine.ts line 228-238: getAllArtifacts returns ArtifactState[]
- No ClaimState exists
- No claim state machine exists

**Conclusion:** Replay object is artifact state machine.

---

### Layer 6 — WitnessAuthority

**Determine witness subject:**
- artifact
- or
- claim

**Analysis:**
- Witness subject is artifact

**Evidence:**
- replay_types.ts line 127-133: WitnessRoot structure exists
- replay_types.ts line 19: WitnessLeafId is branded type
- No ClaimIdentity exists to witness
- No WitnessAuthority implementation analyzed yet
- Witness would prove artifact continuity because artifacts are constitutional entities

**Conclusion:** Witness subject is artifact.

---

### Layer 7 — CertificateAuthority

**Determine certification subject:**
- artifact continuity
- or
- claim continuity

**Analysis:**
- Certification subject is artifact continuity

**Evidence:**
- replay_types.ts line 166-185: ReplayCertificate structure exists
- replay_types.ts line 169: witness_root (artifact witness)
- replay_types.ts line 170: replay_commitment (artifact replay)
- replay_types.ts line 171: derivation_graph_commitment (artifact lineage)
- replay_types.ts line 172: state_commitment (artifact state)
- No ClaimIdentity continuity exists to certify
- No CertificateAuthority implementation analyzed yet

**Conclusion:** Certification subject is artifact continuity.

---

### Layer 8 — Projection Runtime

**Determine whether projections materialize:**
- artifacts
- or
- claims

**Analysis:**
- Projections materialize artifacts

**Evidence:**
- No Projection Runtime exists yet
- Current applications (CRX Newsletter Brain, CRX Digestion Worker) materialize artifacts (newsletters, articles, digests)
- No ClaimIdentity exists to materialize
- No claim projections exist

**Conclusion:** Projections materialize artifacts.

---

### Layer 9 — Application Layer

**Determine whether applications reason about:**
- artifacts
- or
- claims

**Analysis:**
- Applications reason about artifacts

**Evidence:**
- CRX Newsletter Brain: save_raw_newsletter, save_digest (artifacts)
- CRX Digestion Worker: save_article (artifact)
- PING Gateway: inference requests/responses (artifacts)
- No ClaimIdentity exists for applications to reason about
- No claim-based application logic exists

**Conclusion:** Applications reason about artifacts.

---

## CONSTITUTIONAL END STATES

### Model A — Artifact-Centric Constitution

**Structure:**
```
EventId
→ ArtifactId
```

**ArtifactId is identity.**

**Consequences:**
- replacement creates new identity
- migration creates new identity
- fork creates new identity
- merge creates new identity

**Witnesses prove artifact continuity only.**

**Current PING Runtime Status:** Model A is currently implemented.

---

### Model B — Claim-Centric Constitution

**Structure:**
```
EventId
→ ArtifactId
→ ClaimIdentity
```

**ClaimIdentity is constitutional identity.**

**ArtifactIds become representations.**

**Consequences:**
- replacement preserves identity
- migration preserves identity
- fork may preserve or split identity
- merge may create composite identity

**Witnesses prove claim continuity.**

**Current PING Runtime Status:** Model B is NOT implemented. ClaimIdentity does NOT exist.

---

## MODEL EVALUATION

### Model A — Artifact-Centric Constitution

**Advantages:**
- Simplicity: Single identity layer (ArtifactId)
- Determinism: ArtifactId is derived from canonical hash
- No ambiguity: ArtifactId uniquely identifies artifact
- Current implementation: Already implemented in PING Runtime
- Clear semantics: ArtifactId = identity

**Disadvantages:**
- No continuity across replacement: Replacement creates new identity
- No continuity across migration: Migration creates new identity
- No continuity across fork: Fork creates new identity
- No continuity across merge: Merge creates new identity
- Limited evolution: Artifacts cannot evolve while preserving identity
- Limited autonomy: Artifacts cannot claim continuity across transformations

**Constitutional Correctness:**
- Replay sovereignty: YES (deterministic artifact lineage)
- Witness sovereignty: YES (artifact continuity is provable)
- Continuity correctness: LIMITED (no continuity across transformations)
- Long-term evolution: LIMITED (artifacts cannot evolve while preserving identity)

---

### Model B — Claim-Centric Constitution

**Advantages:**
- Continuity across replacement: Replacement preserves identity
- Continuity across migration: Migration preserves identity
- Continuity across fork: Fork may preserve or split identity
- Continuity across merge: Merge may create composite identity
- Evolution: Claims can evolve while preserving identity
- Autonomy: Claims can claim continuity across transformations
- Long-term evolution: Claims can evolve autonomously

**Disadvantages:**
- Complexity: Two identity layers (ArtifactId + ClaimIdentity)
- Ambiguity: ClaimIdentity may have multiple ArtifactId representations
- Implementation: NOT implemented in PING Runtime
- Semantics: ClaimIdentity semantics undefined (replacement, fork, migration, merge)
- Determinism: ClaimIdentity derivation must be deterministic
- Authority: ClaimIdentity authority must be constitutional

**Constitutional Correctness:**
- Replay sovereignty: YES (deterministic claim lineage)
- Witness sovereignty: YES (claim continuity is provable)
- Continuity correctness: HIGH (continuity across transformations)
- Long-term evolution: HIGH (claims can evolve autonomously)

---

## REQUIRED DELIVERABLES

### 1. Constitutional Identity Determination

**Determination:** Model A — Artifact-Centric Constitution

**Rationale:**
- Current PING Runtime is Artifact-Centric
- No ClaimIdentity exists
- No replacement, fork, migration, merge semantics exist
- ArtifactId is constitutional identity
- Simplicity favors Model A
- Determinism favors Model A
- Current implementation favors Model A

**Constraint:** Do not optimize for implementation simplicity. Optimize for replay sovereignty, witness sovereignty, constitutional correctness, continuity correctness, long-term evolution of autonomous entities.

**Revised Determination:** Model B — Claim-Centric Constitution

**Revised Rationale:**
- Constitutional correctness favors Model B (continuity across transformations)
- Long-term evolution of autonomous entities favors Model B
- Replay sovereignty is achievable in both models
- Witness sovereignty is achievable in both models
- Continuity correctness favors Model B
- Autonomous entities require ClaimIdentity for long-term evolution

---

### 2. Identity Graph Model

**Model B — Claim-Centric Constitution:**

```
EventId
  ↓
ArtifactId (representation)
  ↓
ClaimIdentity (constitutional identity)
```

**ClaimIdentity Properties:**
- canonical_id: ClaimId (branded type)
- supersedes: ClaimId[] (claims superseded by this claim)
- descendant: ClaimId[] (claims descendant from this claim)
- replacement: ClaimId[] (claims that replace this claim)
- fork: ClaimId[] (claims forked from this claim)
- merge: ClaimId[] (claims merged into this claim)

**ArtifactId Properties:**
- artifact_id: ArtifactId (branded type)
- claim_id: ClaimId (constitutional identity)
- canonical_hash: string (derived from canonical bytes)
- canonical_bytes: CanonicalBytes

**EventId Properties:**
- event_id: EventId (branded type)
- artifact_id: ArtifactId (artifact created/updated by event)
- claim_id: ClaimId (claim affected by event)

---

### 3. Replay Identity Model

**Model B — Claim-Centric Constitution:**

**Replay Object:** Claim state machine

**Replay State:**
```typescript
interface ReplayState {
  claims: Map<ClaimId, ClaimState>;
  artifacts: Map<ArtifactId, ArtifactState>;
  seen_event_ids: Set<EventId>;
  event_to_claim_map: Map<EventId, ClaimId>;
  event_to_artifact_map: Map<EventId, ArtifactId>;
  claim_to_artifacts_map: Map<ClaimId, ArtifactId[]>;
  state_version: string;
}

interface ClaimState {
  claim_id: ClaimId;
  claim_lineage: ClaimId[];
  supersedes: ClaimId[];
  superseded_by: ClaimId[];
  forked_from: ClaimId[];
  forked_into: ClaimId[];
  merged_from: ClaimId[];
  merged_into: ClaimId[];
  current_artifact_id: ArtifactId;
  artifact_history: ArtifactId[];
}
```

**Replay reconstructs claim lineage.**

---

### 4. Witness Identity Model

**Model B — Claim-Centric Constitution:**

**Witness Subject:** Claim

**Witness Structure:**
```typescript
interface WitnessRoot {
  witness_root: string;
  witness_algorithm: string;
  witness_version: string;
  leaf_count: number;
  tree_height: number;
  claim_id: ClaimId;
}

interface WitnessLeaf {
  leaf_id: WitnessLeafId;
  claim_id: ClaimId;
  artifact_id: ArtifactId;
  canonical_hash: string;
  witness_position: number;
}
```

**Witnesses prove claim continuity.**

---

### 5. Certificate Identity Model

**Model B — Claim-Centric Constitution:**

**Certification Subject:** Claim continuity

**Certificate Structure:**
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

---

### 6. Continuity Semantics

**Model B — Claim-Centric Constitution:**

**Continuity Definition:** Claim continuity is preserved when a claim evolves through replacement, migration, fork, or merge while maintaining a traceable lineage to the original claim.

**Continuity Proof:** Witnesses prove claim continuity by providing a cryptographically verifiable chain of claim lineage events.

**Continuity Validation:** Replay validates claim continuity by reconstructing claim lineage from event stream and verifying that each transformation (replacement, migration, fork, merge) is constitutionally valid.

---

### 7. Fork Semantics

**Model B — Claim-Centric Constitution:**

**Fork Definition:** A claim fork occurs when a single claim diverges into two or more independent claims, each preserving continuity to the original claim.

**Fork Properties:**
- forked_from: ClaimId[] (claims forked from this claim)
- forked_into: ClaimId[] (claims forked into this claim)
- fork_type: "split" | "divergence" | "branch"

**Fork Validation:**
- Fork must preserve claim continuity
- Fork must be explicitly authorized
- Fork must create distinct ClaimIds
- Fork must create distinct ArtifactIds
- Fork must be witnessed

---

### 8. Merge Semantics

**Model B — Claim-Centric Constitution:**

**Merge Definition:** A claim merge occurs when two or more claims converge into a single claim, preserving continuity to all merged claims.

**Merge Properties:**
- merged_from: ClaimId[] (claims merged into this claim)
- merged_into: ClaimId[] (claims merged into this claim)
- merge_type: "union" | "intersection" | "composition"

**Merge Validation:**
- Merge must preserve claim continuity
- Merge must be explicitly authorized
- Merge must create distinct ClaimId
- Merge must create distinct ArtifactId
- Merge must be witnessed

---

### 9. Replacement Semantics

**Model B — Claim-Centric Constitution:**

**Replacement Definition:** A claim replacement occurs when a claim is superseded by a new claim, preserving continuity to the original claim.

**Replacement Properties:**
- supersedes: ClaimId[] (claims superseded by this claim)
- superseded_by: ClaimId[] (claims superseded by this claim)
- replacement_type: "upgrade" | "correction" | "evolution"

**Replacement Validation:**
- Replacement must preserve claim continuity
- Replacement must be explicitly authorized
- Replacement must create distinct ClaimId
- Replacement must create distinct ArtifactId
- Replacement must be witnessed

---

### 10. Migration Semantics

**Model B — Claim-Centric Constitution:**

**Migration Definition:** A claim migration occurs when a claim moves from one context to another while preserving continuity to the original claim.

**Migration Properties:**
- migrated_from: ClaimId[] (claims migrated from)
- migrated_to: ClaimId[] (claims migrated to)
- migration_type: "context" | "location" | "format"

**Migration Validation:**
- Migration must preserve claim continuity
- Migration must be explicitly authorized
- Migration may preserve ClaimId or create new ClaimId
- Migration must create distinct ArtifactId
- Migration must be witnessed

---

### 11. Final Constitutional Recommendation

**Recommendation:** Model B — Claim-Centric Constitution

**Rationale:**
1. **Constitutional Correctness:** ClaimIdentity enables continuity across replacement, fork, migration, merge
2. **Long-term Evolution:** Autonomous entities require ClaimIdentity for long-term evolution
3. **Replay Sovereignty:** Claim-centric replay is deterministic and verifiable
4. **Witness Sovereignty:** Claim continuity is provable and certifiable
5. **Continuity Correctness:** ClaimIdentity enables correct continuity semantics

**Implementation Requirements:**
1. Create ClaimIdentity as constitutional primitive (branded type)
2. Create ClaimAuthority to manage claim lifecycle
3. Extend IdentityAuthority to own ArtifactId + ClaimIdentity
4. Extend LineageAuthority to track ClaimId ancestry
5. Extend ReplayStateMachine to reconstruct claim lineage
6. Extend WitnessAuthority to witness claim continuity
7. Extend CertificateAuthority to certify claim continuity
8. Implement replacement, fork, migration, merge semantics
9. Update EventStore to record claim evolution
10. Update Projection Runtime to materialize claims

**Constraint Compliance:**
- Optimized for replay sovereignty: YES
- Optimized for witness sovereignty: YES
- Optimized for constitutional correctness: YES
- Optimized for continuity correctness: YES
- Optimized for long-term evolution of autonomous entities: YES

**Decision:** Proceed with Model B — Claim-Centric Constitution.

---

## CONCLUSION

**Constitutional Identity Determination:** ClaimIdentity exists as a constitutional primitive independent of EventId and ArtifactId.

**Constitutional Model:** Model B — Claim-Centric Constitution

**Identity Graph:** EventId → ArtifactId → ClaimIdentity

**Replay Object:** Claim state machine

**Witness Subject:** Claim

**Certification Subject:** Claim continuity

**Next Steps:** Proceed with Phase 4, Phase 7, and Phase 8 implementation with ClaimIdentity as constitutional primitive.
