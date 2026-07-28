# PING_RUNTIME_CONSTITUTIONAL_IDENTITY_ALGEBRA

**Specification Date:** 2026-06-18
**Constitutional Status:** STAGE 0 — FOUNDATIONAL
**Authority:** Highest-order constitutional authority for PING Runtime

---

# CONSTITUTIONAL REASONING

## Current Identity Hierarchy

The runtime has determined:

```
ClaimId
    ↓
ArtifactId
    ↓
EventId
```

**Definitions:**
- **ClaimId:** Constitutional identity (the claim itself)
- **ArtifactId:** Constitutional representation (the claim's state)
- **EventId:** Constitutional causality witness (the claim's history)

## Constitutional Gap

**Claim continuity semantics are undefined.**

Without continuity semantics, the runtime cannot determine:
- What survives
- What forks
- What merges
- What terminates
- What supersedes
- What witnesses prove
- What certificates certify

**Constitutional Constraint:**
No implementation of ClaimAuthority, LineageAuthority, WitnessAuthority, CertificateAuthority, Replay Rewrite, EventStore Rewrite, or Projection Rewrite may proceed until these laws are formally adopted.

---

# STAGE 0 — CONSTITUTIONAL IDENTITY ALGEBRA

## Formal Algebra Definition

The Constitutional Identity Algebra is a tuple:

```
𝒜 = (𝒞, 𝒪, 𝒮, ℛ)
```

Where:
- **𝒞** = Set of Claims (constitutional identities)
- **𝒪** = Set of Operations (continuity, replacement, fork, merge, migration, termination, supersession)
- **𝒮** = Set of States (active, terminated, superseded, forked, merged, migrated)
- **ℛ** = Set of Relations (identity, continuity, lineage, causality)

## Claim Definition

A Claim is a constitutional identity defined as:

```
Claim = (ClaimId, ArtifactId, ContinuityGraph, LineageGraph, State)
```

Where:
- **ClaimId:** Unique identifier (canonical hash)
- **ArtifactId:** Representation identifier (canonical hash of state)
- **ContinuityGraph:** Directed acyclic graph of continuity relations
- **LineageGraph:** Directed acyclic graph of derivation relations
- **State:** Current state (active, terminated, superseded, etc.)

## Identity Invariant

**Constitutional Law:** ClaimId is immutable and unique across all time, space, and context.

```
∀ c₁, c₂ ∈ 𝒞: (c₁.ClaimId = c₂.ClaimId) ↔ (c₁ = c₂)
```

**Interpretation:** Two claims with the same ClaimId are the same claim. ClaimId never changes.

---

# LAW 1 — CLAIM CONTINUITY LAW

## Continuity Axioms

### Axiom 1: Continuity Identity

**Definition:** A claim has continuity if and only if it has a non-empty ContinuityGraph.

```
∀ c ∈ 𝒞: HasContinuity(c) ↔ (c.ContinuityGraph ≠ ∅)
```

### Axiom 2: Continuity Transitivity

**Definition:** Continuity is transitive across the ContinuityGraph.

```
∀ c₁, c₂, c₃ ∈ 𝒞: 
    (c₁ → c₂ ∧ c₂ → c₃) → (c₁ → c₃)
```

Where `→` denotes continuity relation.

### Axiom 3: Continuity Immutability

**Definition:** Once established, continuity cannot be revoked.

```
∀ c₁, c₂ ∈ 𝒞: 
    (c₁ → c₂) → ¬Revokable(c₁ → c₂)
```

**Interpretation:** Continuity is permanent. Once claim A has continuity to claim B, that relation cannot be removed.

### Axiom 4: Continuity Irreversibility

**Definition:** Continity flows forward in time only.

```
∀ c₁, c₂ ∈ 𝒞: 
    (c₁ → c₂) → (Timestamp(c₁) < Timestamp(c₂))
```

**Interpretation:** Continuity always flows from earlier claims to later claims. Never backward.

### Axiom 5: Continuity Uniqueness

**Definition:** A claim can have at most one immediate continuity predecessor.

```
∀ c ∈ 𝒞: 
    |{c' ∈ 𝒞 : c' → c}| ≤ 1
```

**Interpretation:** A claim can have multiple ancestors via transitivity, but only one direct predecessor.

### Axiom 6: Continuity Splitting

**Definition:** Continuity can split (fork) but not merge.

```
∀ c ∈ 𝒞: 
    (|{c' ∈ 𝒞 : c → c'}| > 1) → Forked(c)
```

**Interpretation:** A claim can have multiple successors (fork), but a claim cannot have multiple continuity predecessors (merge is not allowed in continuity graph).

### Axiom 7: Continuity Termination

**Definition:** Continuity terminates when a claim has no successors.

```
∀ c ∈ 𝒞: 
    (|{c' ∈ 𝒞 : c → c'}| = 0) → Terminal(c)
```

**Interpretation:** A claim with no continuity successors is terminal. Continuity ends there.

## Claim Continuity Axioms Summary

| Axiom | Property | Formal Statement |
|-------|----------|------------------|
| 1 | Continuity Identity | HasContinuity(c) ↔ (c.ContinuityGraph ≠ ∅) |
| 2 | Continuity Transitivity | (c₁ → c₂ ∧ c₂ → c₃) → (c₁ → c₃) |
| 3 | Continuity Immutability | (c₁ → c₂) → ¬Revokable(c₁ → c₂) |
| 4 | Continuity Irreversibility | (c₁ → c₂) → (Timestamp(c₁) < Timestamp(c₂)) |
| 5 | Continuity Uniqueness | |{c' ∈ 𝒞 : c' → c}| ≤ 1 |
| 6 | Continuity Splitting | |{c' ∈ 𝒞 : c → c'}| > 1 → Forked(c) |
| 7 | Continuity Termination | |{c' ∈ 𝒞 : c → c'}| = 0 → Terminal(c) |

---

# LAW 2 — REPLACEMENT LAW

## Replacement Algebra

### Replacement Identity Rule

**Definition:** When Claim A is replaced by Claim B:
- Claim A is terminated
- Claim B is a new identity (new ClaimId)
- Claim B does NOT inherit Claim A's ClaimId
- Claim B inherits Claim A's continuity

**Formal Statement:**
```
Replace(A, B) → 
    (State(A) = terminated) ∧
    (ClaimId(B) ≠ ClaimId(A)) ∧
    (A → B) ∧
    (ContinuityGraph(B) = ContinuityGraph(A) ∪ {A → B})
```

**Interpretation:** Replacement creates a new claim that continues the continuity of the old claim, but with a new identity.

### Replacement Continuity Rule

**Definition:** Claim B inherits Claim A's continuity.

**Formal Statement:**
```
Replace(A, B) → 
    ∀ c ∈ 𝒞: (c → A) → (c → B)
```

**Interpretation:** All continuity that flowed to A now flows to B. Continuity is preserved.

### Replacement Witness Rule

**Definition:** The replacement operation itself is witnessed.

**Formal Statement:**
```
Replace(A, B) → 
    ∃ e ∈ Events: 
        (e.Type = REPLACEMENT) ∧
        (e.Predecessor = ClaimId(A)) ∧
        (e.Successor = ClaimId(B)) ∧
        (e.Timestamp = Timestamp(B))
```

**Interpretation:** Every replacement must be recorded as an event. This provides a causality witness.

### Replacement Certificate Rule

**Definition:** The replacement operation is certified by the authority that performed it.

**Formal Statement:**
```
Replace(A, B) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = REPLACEMENT_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.Predecessor = ClaimId(A)) ∧
        (cert.Successor = ClaimId(B)) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Replacements must be certified by the ClaimAuthority to be constitutionally valid.

## Replacement Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Identity | New identity | ClaimId(B) ≠ ClaimId(A) |
| Continuity | Inherit continuity | (c → A) → (c → B) |
| Witness | Event recorded | ∃ e: e.Type = REPLACEMENT |
| Certificate | Authority certified | ∃ cert: cert.Type = REPLACEMENT_CERTIFICATE |

---

# LAW 3 — FORK LAW

## Fork Algebra

### Fork Identity Rule

**Definition:** When Claim A forks into Claim B and Claim C:
- Claim A remains active
- Claim B is a new identity (new ClaimId)
- Claim C is a new identity (new ClaimId)
- Claim B and Claim C both inherit Claim A's continuity

**Formal Statement:**
```
Fork(A, {B, C}) → 
    (State(A) = active) ∧
    (ClaimId(B) ≠ ClaimId(A)) ∧
    (ClaimId(C) ≠ ClaimId(A)) ∧
    (ClaimId(B) ≠ ClaimId(C)) ∧
    (A → B) ∧
    (A → C) ∧
    (ContinuityGraph(B) = ContinuityGraph(A) ∪ {A → B}) ∧
    (ContinuityGraph(C) = ContinuityGraph(A) ∪ {A → C})
```

**Interpretation:** Forking creates multiple new claims that all inherit the continuity of the original claim. The original claim remains active.

### Fork Continuity Rule

**Definition:** Claim B and Claim C both inherit Claim A's continuity. Continuity splits.

**Formal Statement:**
```
Fork(A, {B, C}) → 
    ∀ c ∈ 𝒞: (c → A) → ((c → B) ∧ (c → C))
```

**Interpretation:** All continuity that flowed to A now flows to both B and C. Continuity splits into multiple branches.

### Fork Witness Rule

**Definition:** The fork operation itself is witnessed.

**Formal Statement:**
```
Fork(A, {B, C}) → 
    ∃ e ∈ Events: 
        (e.Type = FORK) ∧
        (e.Predecessor = ClaimId(A)) ∧
        (e.Successors = {ClaimId(B), ClaimId(C)}) ∧
        (e.Timestamp = Timestamp(B) = Timestamp(C))
```

**Interpretation:** Every fork must be recorded as an event. This provides a causality witness.

### Fork Certificate Rule

**Definition:** The fork operation is certified by the authority that performed it.

**Formal Statement:**
```
Fork(A, {B, C}) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = FORK_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.Predecessor = ClaimId(A)) ∧
        (cert.Successors = {ClaimId(B), ClaimId(C)}) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Forks must be certified by the ClaimAuthority to be constitutionally valid.

### Fork Branch Revocation Rule

**Definition:** One branch cannot revoke the continuity of another branch.

**Formal Statement:**
```
Fork(A, {B, C}) → 
    ¬Revokable(B → C) ∧
    ¬Revokable(C → B)
```

**Interpretation:** Once a fork occurs, the branches are independent. Neither branch can revoke the continuity of the other.

## Fork Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Identity | New identities | ClaimId(B) ≠ ClaimId(A) ∧ ClaimId(C) ≠ ClaimId(A) |
| Continuity | Split continuity | (c → A) → ((c → B) ∧ (c → C)) |
| Witness | Event recorded | ∃ e: e.Type = FORK |
| Certificate | Authority certified | ∃ cert: cert.Type = FORK_CERTIFICATE |
| Branch Revocation | Independent branches | ¬Revokable(B → C) |

---

# LAW 4 — MERGE LAW

## Merge Algebra

### Merge Identity Rule

**Definition:** When Claim B and Claim C merge into Claim D:
- Claim B is terminated
- Claim C is terminated
- Claim D is a new identity (new ClaimId)
- Claim D inherits both Claim B and Claim C's continuity

**Formal Statement:**
```
Merge({B, C}, D) → 
    (State(B) = terminated) ∧
    (State(C) = terminated) ∧
    (ClaimId(D) ≠ ClaimId(B)) ∧
    (ClaimId(D) ≠ ClaimId(C)) ∧
    (B → D) ∧
    (C → D) ∧
    (ContinuityGraph(D) = ContinuityGraph(B) ∪ ContinuityGraph(C) ∪ {B → D, C → D})
```

**Interpretation:** Merging creates a new claim that inherits the continuity of both merged claims. The merged claims are terminated.

### Merge Continuity Rule

**Definition:** Claim D inherits both Claim B and Claim C's continuity. Continuity converges.

**Formal Statement:**
```
Merge({B, C}, D) → 
    ∀ c ∈ 𝒞: ((c → B) ∨ (c → C)) → (c → D)
```

**Interpretation:** All continuity that flowed to either B or C now flows to D. Continuity converges from multiple branches.

### Merge Witness Rule

**Definition:** The merge operation itself is witnessed.

**Formal Statement:**
```
Merge({B, C}, D) → 
    ∃ e ∈ Events: 
        (e.Type = MERGE) ∧
        (e.Predecessors = {ClaimId(B), ClaimId(C)}) ∧
        (e.Successor = ClaimId(D)) ∧
        (e.Timestamp = Timestamp(D))
```

**Interpretation:** Every merge must be recorded as an event. This provides a causality witness.

### Merge Certificate Rule

**Definition:** The merge operation is certified by the authority that performed it.

**Formal Statement:**
```
Merge({B, C}, D) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = MERGE_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.Predecessors = {ClaimId(B), ClaimId(C)}) ∧
        (cert.Successor = ClaimId(D)) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Merges must be certified by the ClaimAuthority to be constitutionally valid.

### Merge Active Claim Rule

**Definition:** Merged claims cannot remain active.

**Formal Statement:**
```
Merge({B, C}, D) → 
    (State(B) = terminated) ∧
    (State(C) = terminated)
```

**Interpretation:** Once claims are merged, they are terminated. They cannot remain active independently.

## Merge Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Identity | New identity | ClaimId(D) ≠ ClaimId(B) ∧ ClaimId(D) ≠ ClaimId(C) |
| Continuity | Converge continuity | (c → B) ∨ (c → C) → (c → D) |
| Witness | Event recorded | ∃ e: e.Type = MERGE |
| Certificate | Authority certified | ∃ cert: cert.Type = MERGE_CERTIFICATE |
| Active Claim | Terminated | State(B) = terminated ∧ State(C) = terminated |

---

# LAW 5 — MIGRATION LAW

## Migration Algebra

### Migration Identity Rule

**Definition:** When Claim A migrates across context, runtime, namespace, storage boundary, or representation boundary:
- Claim A remains the same identity (ClaimId unchanged)
- ArtifactId may change (representation may change)
- Continuity is preserved

**Formal Statement:**
```
Migrate(A, Boundary) → 
    (ClaimId(A) = ClaimId(A')) ∧
    (ArtifactId(A') = CanonicalHash(State(A'))) ∧
    (ContinuityGraph(A') = ContinuityGraph(A)) ∧
    (LineageGraph(A') = LineageGraph(A) ∪ {A → A'})
```

Where A' is the migrated claim.

**Interpretation:** Migration preserves identity but may change representation. Continuity is invariant across migration.

### Migration Invariant Rule

**Definition:** ClaimId is invariant across migration. ArtifactId may change.

**Formal Statement:**
```
Migrate(A, Boundary) → 
    (ClaimId(A) = ClaimId(A')) ∧
    (ArtifactId(A') ≠ ArtifactId(A) ↔ RepresentationChanged(A, A'))
```

**Interpretation:** The claim's identity never changes during migration. The representation may change, which changes the ArtifactId.

### Migration Continuity Rule

**Definition:** Continuity is preserved across migration.

**Formal Statement:**
```
Migrate(A, Boundary) → 
    ∀ c ∈ 𝒞: (c → A) → (c → A')
```

**Interpretation:** All continuity that flowed to A before migration continues to flow to A' after migration.

### Migration Witness Rule

**Definition:** The migration operation itself is witnessed.

**Formal Statement:**
```
Migrate(A, Boundary) → 
    ∃ e ∈ Events: 
        (e.Type = MIGRATION) ∧
        (e.ClaimId = ClaimId(A)) ∧
        (e.SourceBoundary = Source(A)) ∧
        (e.DestinationBoundary = Destination(A')) ∧
        (e.Timestamp = Timestamp(A'))
```

**Interpretation:** Every migration must be recorded as an event. This provides a causality witness.

### Migration Certificate Rule

**Definition:** The migration operation is certified by the authority that performed it.

**Formal Statement:**
```
Migrate(A, Boundary) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = MIGRATION_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.ClaimId = ClaimId(A)) ∧
        (cert.SourceBoundary = Source(A)) ∧
        (cert.DestinationBoundary = Destination(A')) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Migrations must be certified by the ClaimAuthority to be constitutionally valid.

## Migration Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Identity | ClaimId invariant | ClaimId(A) = ClaimId(A') |
| Invariant | ArtifactId may change | ArtifactId(A') ≠ ArtifactId(A) ↔ RepresentationChanged |
| Continuity | Preserved | (c → A) → (c → A') |
| Witness | Event recorded | ∃ e: e.Type = MIGRATION |
| Certificate | Authority certified | ∃ cert: cert.Type = MIGRATION_CERTIFICATE |

---

# LAW 6 — TERMINATION LAW

## Termination Algebra

### Termination Definition

**Definition:** Constitutional death occurs when a claim enters the `terminated` state and has no continuity successors.

**Formal Statement:**
```
Terminated(c) ↔ 
    (State(c) = terminated) ∧
    (|{c' ∈ 𝒞 : c → c'}| = 0)
```

**Interpretation:** A claim is constitutionally dead when it is terminated and has no continuity successors. Continuity ends there.

### Termination Replay Rule

**Definition:** Terminated claims can be replayed but cannot be revived.

**Formal Statement:**
```
Terminated(c) → 
    Replayable(c) ∧
    ¬Revivable(c)
```

**Interpretation:** Terminated claims can be replayed (their history can be reconstructed), but they cannot be revived (brought back to active state).

### Termination Revival Rule

**Definition:** Continuity cannot resume after termination.

**Formal Statement:**
```
Terminated(c) → 
    ¬∃ c' ∈ 𝒞: (c → c' ∧ State(c') = active)
```

**Interpretation:** Once a claim is terminated, no new claim can have continuity from it. Continuity cannot resume after termination.

### Termination Witness Rule

**Definition:** The termination operation itself is witnessed.

**Formal Statement:**
```
Terminate(c) → 
    ∃ e ∈ Events: 
        (e.Type = TERMINATION) ∧
        (e.ClaimId = ClaimId(c)) ∧
        (e.Timestamp = Timestamp(c))
```

**Interpretation:** Every termination must be recorded as an event. This provides a causality witness.

### Termination Certificate Rule

**Definition:** The termination operation is certified by the authority that performed it.

**Formal Statement:**
```
Terminate(c) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = TERMINATION_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.ClaimId = ClaimId(c)) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Terminations must be certified by the ClaimAuthority to be constitutionally valid.

## Termination Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Definition | Constitutional death | State(c) = terminated ∧ |{c' : c → c'}| = 0 |
| Replay | Replayable but not revivable | Replayable(c) ∧ ¬Revivable(c) |
| Revival | Continuity cannot resume | ¬∃ c': (c → c' ∧ State(c') = active) |
| Witness | Event recorded | ∃ e: e.Type = TERMINATION |
| Certificate | Authority certified | ∃ cert: cert.Type = TERMINATION_CERTIFICATE |

---

# LAW 7 — SUPERSESSION LAW

## Supersession Algebra

### Supersession Definition

**Definition:** Supersession differs from replacement in that supersession allows the superseded claim to remain active, while replacement terminates the superseded claim.

**Formal Statement:**
```
Supersede(A, B) → 
    (State(A) = active) ∧
    (ClaimId(B) ≠ ClaimId(A)) ∧
    (A → B) ∧
    (Supersedes(B, A))
```

**Interpretation:** Supersession creates a new claim that supersedes the old claim, but the old claim remains active. This is different from replacement, which terminates the old claim.

### Supersession Identity Rule

**Definition:** Claim B is a new identity that supersedes Claim A.

**Formal Statement:**
```
Supersede(A, B) → 
    (ClaimId(B) ≠ ClaimId(A)) ∧
    (Supersedes(B, A))
```

**Interpretation:** Supersession creates a new identity. The superseding claim has a new ClaimId.

### Supersession Continuity Rule

**Definition:** Supersession preserves continuity.

**Formal Statement:**
```
Supersede(A, B) → 
    ∀ c ∈ 𝒞: (c → A) → (c → B)
```

**Interpretation:** All continuity that flowed to A now flows to B. Continuity is preserved.

### Supersession Multiple Rule

**Definition:** Multiple claims can supersede one claim. One claim can supersede many claims.

**Formal Statement:**
```
∀ A, B₁, B₂, ..., Bₙ ∈ 𝒞: 
    (∀ i: Supersede(A, Bᵢ)) → Valid
```

**Interpretation:** A single claim can be superseded by multiple claims. A single claim can supersede multiple claims.

### Supersession Witness Rule

**Definition:** The supersession operation itself is witnessed.

**Formal Statement:**
```
Supersede(A, B) → 
    ∃ e ∈ Events: 
        (e.Type = SUPERSESSION) ∧
        (e.Superseded = ClaimId(A)) ∧
        (e.Superseding = ClaimId(B)) ∧
        (e.Timestamp = Timestamp(B))
```

**Interpretation:** Every supersession must be recorded as an event. This provides a causality witness.

### Supersession Certificate Rule

**Definition:** The supersession operation is certified by the authority that performed it.

**Formal Statement:**
```
Supersede(A, B) → 
    ∃ cert ∈ Certificates: 
        (cert.Type = SUPERSESSION_CERTIFICATE) ∧
        (cert.Authority = ClaimAuthority) ∧
        (cert.Superseded = ClaimId(A)) ∧
        (cert.Superseding = ClaimId(B)) ∧
        (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Supersessions must be certified by the ClaimAuthority to be constitutionally valid.

## Supersession Algebra Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Definition | Superseded remains active | State(A) = active |
| Identity | New identity | ClaimId(B) ≠ ClaimId(A) |
| Continuity | Preserved | (c → A) → (c → B) |
| Multiple | Multiple supersede one | ∀ i: Supersede(A, Bᵢ) → Valid |
| Witness | Event recorded | ∃ e: e.Type = SUPERSESSION |
| Certificate | Authority certified | ∃ cert: cert.Type = SUPERSESSION_CERTIFICATE |

---

# LAW 8 — REPLAY IDENTITY LAW

## Replay Identity Law

### Replay Authoritative Object

**Definition:** Replay reconstructs Claim State, not Artifact State.

**Formal Statement:**
```
Replay(EventStream) → 
    ClaimState
```

**Interpretation:** The authoritative object of replay is the Claim, not the Artifact. Replay reconstructs the constitutional identity and its continuity, not just the representation.

### Replay Identity Rule

**Definition:** Replay must reconstruct ClaimId, not just ArtifactId.

**Formal Statement:**
```
Replay(EventStream) → 
    ∀ c ∈ Claims: 
        (ClaimId(c) = ReconstructClaimId(EventStream, c))
```

**Interpretation:** Replay must reconstruct the ClaimId for each claim. The ClaimId is the constitutional identity that must be preserved.

### Replay Continuity Graph Rule

**Definition:** Replay must reconstruct the ContinuityGraph, not just the LineageGraph.

**Formal Statement:**
```
Replay(EventStream) → 
    ∀ c ∈ Claims: 
        (ContinuityGraph(c) = ReconstructContinuityGraph(EventStream, c))
```

**Interpretation:** Replay must reconstruct the continuity relations, not just the derivation relations. Continuity is constitutional, lineage is operational.

### Replay Claim Graph Rule

**Definition:** Replay reconstructs the Claim Graph (claims + continuity relations), not just the Artifact Graph.

**Formal Statement:**
```
Replay(EventStream) → 
    ClaimGraph
```

Where:
```
ClaimGraph = (Claims, ContinuityGraph)
```

**Interpretation:** The output of replay is the Claim Graph, which includes all claims and their continuity relations. This is the constitutional state.

## Replay Identity Law Summary

| Rule | Property | Formal Statement |
|------|----------|------------------|
| Authoritative Object | Claim State | Replay(EventStream) → ClaimState |
| Identity | Reconstruct ClaimId | ClaimId(c) = ReconstructClaimId(EventStream, c) |
| Continuity Graph | Reconstruct ContinuityGraph | ContinuityGraph(c) = ReconstructContinuityGraph(EventStream, c) |
| Claim Graph | Reconstruct ClaimGraph | Replay(EventStream) → ClaimGraph |

---

# LAW 9 — WITNESS SUBJECT LAW

## Witness Subject Law

### WitnessRoot Subject

**Definition:** The WitnessRoot witnesses the ClaimGraph (claims + continuity relations).

**Formal Statement:**
```
WitnessRoot = Hash(ClaimGraph)
```

**Interpretation:** The WitnessRoot is a hash of the entire Claim Graph. This witnesses the constitutional state (claims and continuity).

### WitnessLeaf Subject

**Definition:** WitnessLeaf subjects are:
- ClaimId (identity)
- ContinuityGraph (continuity)
- ArtifactId (representation)
- LineageGraph (derivation)

**Formal Statement:**
```
WitnessLeaves = {
    ClaimId,
    ContinuityGraph,
    ArtifactId,
    LineageGraph
}
```

**Interpretation:** Witness leaves include both constitutional (ClaimId, ContinuityGraph) and operational (ArtifactId, LineageGraph) subjects.

### ContinuityProof Subject

**Definition:** ContinuityProof witnesses the continuity relation between two claims.

**Formal Statement:**
```
ContinuityProof(A, B) = MerkleProof(ContinuityGraph, A → B)
```

**Interpretation:** A continuity proof is a Merkle proof that demonstrates the continuity relation between two claims in the ContinuityGraph.

### Identity Witness Rule

**Definition:** Identity is witnessed by ClaimId.

**Formal Statement:**
```
WitnessIdentity(c) = ClaimId(c)
```

**Interpretation:** The identity of a claim is witnessed by its ClaimId. The ClaimId is the constitutional identity witness.

### Continuity Witness Rule

**Definition:** Continuity is witnessed by ContinuityGraph.

**Formal Statement:**
```
WitnessContinuity(c) = ContinuityGraph(c)
```

**Interpretation:** The continuity of a claim is witnessed by its ContinuityGraph. The ContinuityGraph is the constitutional continuity witness.

### Representation Witness Rule

**Definition:** Representation is witnessed by ArtifactId.

**Formal Statement:**
```
WitnessRepresentation(c) = ArtifactId(c)
```

**Interpretation:** The representation of a claim is witnessed by its ArtifactId. The ArtifactId is the constitutional representation witness.

### Lineage Witness Rule

**Definition:** Lineage is witnessed by LineageGraph.

**Formal Statement:**
```
WitnessLineage(c) = LineageGraph(c)
```

**Interpretation:** The lineage of a claim is witnessed by its LineageGraph. The LineageGraph is the constitutional derivation witness.

## Witness Subject Law Summary

| Subject | Witnessed By | Formal Statement |
|---------|-------------|------------------|
| WitnessRoot | ClaimGraph | WitnessRoot = Hash(ClaimGraph) |
| WitnessLeaf | ClaimId, ContinuityGraph, ArtifactId, LineageGraph | WitnessLeaves = {...} |
| ContinuityProof | ContinuityGraph | ContinuityProof(A, B) = MerkleProof(ContinuityGraph, A → B) |
| Identity | ClaimId | WitnessIdentity(c) = ClaimId(c) |
| Continuity | ContinuityGraph | WitnessContinuity(c) = ContinuityGraph(c) |
| Representation | ArtifactId | WitnessRepresentation(c) = ArtifactId(c) |
| Lineage | LineageGraph | WitnessLineage(c) = LineageGraph(c) |

---

# LAW 10 — CERTIFICATE SUBJECT LAW

## Certificate Subject Law

### Certificate Commitment Law

**Definition:** Certificates commit to the existence of a claim.

**Formal Statement:**
```
CertificateExistence(c) = 
    (cert.Type = EXISTENCE_CERTIFICATE) ∧
    (cert.ClaimId = ClaimId(c)) ∧
    (cert.Timestamp = Timestamp(c)) ∧
    (cert.Signature = Sign(Authority, cert))
```

**Interpretation:** An existence certificate commits to the fact that a claim exists at a specific time. This is signed by the authority.

### Continuity Commitment Law

**Definition:** Certificates commit to the continuity of a claim.

**Formal Statement:**
```
CertificateContinuity(A, B) = 
    (cert.Type = CONTINUITY_CERTIFICATE) ∧
    (cert.Predecessor = ClaimId(A)) ∧
    (cert.Successor = ClaimId(B)) ∧
    (cert.Timestamp = Timestamp(B)) ∧
    (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** A continuity certificate commits to the continuity relation between two claims. This is signed by the ClaimAuthority.

### Lineage Commitment Law

**Definition:** Certificates commit to the lineage of a claim.

**Formal Statement:**
```
CertificateLineage(A, B) = 
    (cert.Type = LINEAGE_CERTIFICATE) ∧
    (cert.Parent = ClaimId(A)) ∧
    (cert.Child = ClaimId(B)) ∧
    (cert.Timestamp = Timestamp(B)) ∧
    (cert.Signature = Sign(LineageAuthority, cert))
```

**Interpretation:** A lineage certificate commits to the derivation relation between two claims. This is signed by the LineageAuthority.

### Identity Certification Rule

**Definition:** Identity is certified by ClaimId.

**Formal Statement:**
```
CertifyIdentity(c) = 
    (cert.Type = IDENTITY_CERTIFICATE) ∧
    (cert.ClaimId = ClaimId(c)) ∧
    (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Identity certification commits to the ClaimId of a claim. This is signed by the ClaimAuthority.

### Continuity Certification Rule

**Definition:** Continuity is certified by ContinuityGraph.

**Formal Statement:**
```
CertifyContinuity(c) = 
    (cert.Type = CONTINUITY_CERTIFICATE) ∧
    (cert.ContinuityGraph = ContinuityGraph(c)) ∧
    (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Continuity certification commits to the ContinuityGraph of a claim. This is signed by the ClaimAuthority.

### Existence Certification Rule

**Definition:** Existence is certified by timestamp.

**Formal Statement:**
```
CertifyExistence(c) = 
    (cert.Type = EXISTENCE_CERTIFICATE) ∧
    (cert.Timestamp = Timestamp(c)) ∧
    (cert.Signature = Sign(ClaimAuthority, cert))
```

**Interpretation:** Existence certification commits to the timestamp of a claim. This is signed by the ClaimAuthority.

### Lineage Certification Rule

**Definition:** Lineage is certified by LineageGraph.

**Formal Statement:**
```
CertifyLineage(c) = 
    (cert.Type = LINEAGE_CERTIFICATE) ∧
    (cert.LineageGraph = LineageGraph(c)) ∧
    (cert.Signature = Sign(LineageAuthority, cert))
```

**Interpretation:** Lineage certification commits to the LineageGraph of a claim. This is signed by the LineageAuthority.

## Certificate Subject Law Summary

| Subject | Certified By | Formal Statement |
|---------|--------------|------------------|
| Existence | Timestamp | CertificateExistence(c) = (cert.Type = EXISTENCE_CERTIFICATE) |
| Continuity | ContinuityGraph | CertificateContinuity(A, B) = (cert.Type = CONTINUITY_CERTIFICATE) |
| Lineage | LineageGraph | CertificateLineage(A, B) = (cert.Type = LINEAGE_CERTIFICATE) |
| Identity | ClaimId | CertifyIdentity(c) = (cert.Type = IDENTITY_CERTIFICATE) |
| Continuity | ContinuityGraph | CertifyContinuity(c) = (cert.Type = CONTINUITY_CERTIFICATE) |
| Existence | Timestamp | CertifyExistence(c) = (cert.Type = EXISTENCE_CERTIFICATE) |
| Lineage | LineageGraph | CertifyLineage(c) = (cert.Type = LINEAGE_CERTIFICATE) |

---

# CONSTITUTIONAL IDENTITY ALGEBRA SUMMARY

## Algebra Structure

```
𝒜 = (𝒞, 𝒪, 𝒮, ℛ)
```

Where:
- **𝒞** = Set of Claims (constitutional identities)
- **𝒪** = Set of Operations (continuity, replacement, fork, merge, migration, termination, supersession)
- **𝒮** = Set of States (active, terminated, superseded, forked, merged, migrated)
- **ℛ** = Set of Relations (identity, continuity, lineage, causality)

## Claim Definition

```
Claim = (ClaimId, ArtifactId, ContinuityGraph, LineageGraph, State)
```

## Identity Invariant

```
∀ c₁, c₂ ∈ 𝒞: (c₁.ClaimId = c₂.ClaimId) ↔ (c₁ = c₂)
```

## Operations Summary

| Operation | Identity Change | Continuity Change | State Change |
|-----------|----------------|-------------------|--------------|
| Continuity | None | Add relation | None |
| Replacement | New ClaimId | Inherit | A terminated |
| Fork | New ClaimIds | Split | A remains active |
| Merge | New ClaimId | Converge | B, C terminated |
| Migration | None (ClaimId invariant) | Preserve | None |
| Termination | None | End | Terminated |
| Supersession | New ClaimId | Preserve | A remains active |

## Authority Hierarchy

The Constitutional Identity Algebra becomes the highest-order constitutional authority for:

1. ClaimAuthority
2. LineageAuthority
3. ReplayAuthority
4. WitnessAuthority
5. CertificateAuthority

All these authorities must implement the algebra defined in this specification.

---

# CONSTITUTIONAL CONSTRAINT

**No implementation of:**
- ClaimAuthority
- LineageAuthority
- WitnessAuthority
- CertificateAuthority
- Replay Rewrite
- EventStore Rewrite
- Projection Rewrite

**may begin until all identity algebra laws have been formally adopted.**

The resulting algebra becomes the highest-order constitutional authority of the PING Runtime.

---

# DELIVERABLES COMPLETED

1. ✅ Constitutional Identity Algebra
2. ✅ Claim Continuity Axioms (Law 1)
3. ✅ Replacement Algebra (Law 2)
4. ✅ Fork Algebra (Law 3)
5. ✅ Merge Algebra (Law 4)
6. ✅ Migration Algebra (Law 5)
7. ✅ Termination Algebra (Law 6)
8. ✅ Supersession Algebra (Law 7)
9. ✅ Replay Identity Law (Law 8)
10. ✅ Witness Subject Law (Law 9)
11. ✅ Certificate Subject Law (Law 10)

**Status:** STAGE 0 COMPLETE
**Next Stage:** Implementation of constitutional authorities based on this algebra.
