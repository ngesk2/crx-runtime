# AUTHORITY MODEL

**Status:** OBSOLETE
**Superseded By:** AUTHORITY_TAXONOMY_SPEC.md
**Rationale:** New authority taxonomy is more comprehensive and explicitly defines truth-defining permissions
**Scope:** Authority jurisdiction and ownership only. No implementation details.

---

# AUTHORITY JURISDICTION

## Identity Authority

**JURISDICTION:** Content normalization, identity assignment, identity verification, identity equality judgment.

**OWNS:**
- Content normalization law
- Identity assignment law
- Identity verification
- Identity equality judgment

**DOES NOT OWN:**
- Lineage structure
- Event ordering
- Policy judgment
- State projection
- External attestation networks

**CREATES:**
- Identity facts
- Witness bindings that are purely identity proofs (content-to-identity attestations)

**VERIFIES:**
- That presented content matches claimed identity under declared identity law

**CONSUMES:**
- Artifact content
- Declared identity law version

---

## Lineage Authority

**JURISDICTION:** Parent-child derivation relationships, DAG legality, ancestry queries, fork detection.

**OWNS:**
- Parent-child derivation relationships
- DAG legality
- Ancestry queries
- Fork detection at the lineage layer

**DOES NOT OWN:**
- Artifact content
- Identity assignment
- Event transport
- Replay execution
- Policy permissibility

**CREATES:**
- Lineage edge facts

**VERIFIES:**
- That proposed lineage edges preserve acyclicity and uniqueness constraints

**CONSUMES:**
- Artifact identities (edge endpoints)
- Events recording lineage assertions

---

## Event Recording Authority

**JURISDICTION:** Constitutional occurrence capture, append-only event sequence, event immutability, temporal ordering.

**OWNS:**
- Constitutional occurrence capture
- Append-only event sequence
- Event immutability
- Temporal ordering of occurrences

**DOES NOT OWN:**
- Meaning of events
- Policy outcomes
- State projections
- Identity derivation
- Lineage legality (except as recorded fact)

**CREATES:**
- Event occurrence facts

**VERIFIES:**
- That a proposed record satisfies recording law (required fields, ordering, immutability) before append

**CONSUMES:**
- Actor identity
- References to artifacts, claims, lineage proposals, and policy decisions as event payload

---

## Replay Authority

**JURISDICTION:** Deterministic reconstruction law, integrity verification during reconstruction, divergence detection, replay proof.

**OWNS:**
- Deterministic reconstruction law
- Integrity verification during reconstruction
- Divergence detection
- Replay proof

**DOES NOT OWN:**
- Initial recording of events
- Policy authoring
- Lineage edge creation
- Identity law definition

**CREATES:**
- Reconstructed state projections (transient)
- Witness verification outcomes (when verifying persisted attestations)
- Replay proof artifacts (transient or persisted per recording law)

**VERIFIES:**
- That recorded history reconstructs without drift
- That witnesses match reconstructed bindings
- That invariants hold at bounded time

**CONSUMES:**
- Minimum replay set
- Identity law
- Lineage graph
- Policy law
- Event sequence

---

## Policy Authority

**JURISDICTION:** Mutation authorization rules, constraint evaluation, policy versioning, disposition of claims.

**OWNS:**
- Mutation authorization rules
- Constraint evaluation
- Policy versioning
- Disposition of claims

**DOES NOT OWN:**
- Event transport
- Identity derivation
- Lineage structure
- Replay execution mechanics

**CREATES:**
- Policy decision facts

**VERIFIES:**
- That proposed mutations satisfy active policy before they may be recorded as effective

**CONSUMES:**
- Claims
- Actor authority context
- Current policy law
- Relevant artifact and lineage context

---

## State Authority

**JURISDICTION:** Definition of "current" constitutional facts, state boundary selection, invalidation of stale projections.

**OWNS:**
- Definition of "current" constitutional facts
- State boundary selection
- Invalidation of stale projections

**DOES NOT OWN:**
- Event substrate
- Identity law
- Lineage creation
- Policy authoring

**CREATES:**
- State projection facts (always derived)

**VERIFIES:**
- That a projection corresponds to replay output at the declared boundary
- That no projection contradicts recorded substrate

**CONSUMES:**
- Replay output
- Policy decisions
- Claim dispositions
- Lineage-resolved artifact set

**DERIVED STATUS:** State authority is **jurisdictionally derived**. It operates exclusively on replay and policy outputs. It does not originate constitutional fact.

---

# ELIMINATED AUTHORITIES

## Witness Authority

**STATUS:** ELIMINATED

**ABSORBED BY:** Identity (creation of identity proofs) + Replay (verification of attestations against reconstructed substrate)

**JUSTIFICATION:** Witness has no independent ontological primitive. It neither creates content, identity, lineage, events, nor policy. It attests bindings among facts that other authorities own. Constitutional law requires witness **facts** but not a witness **authority**.

---

## Canonicalization Authority

**STATUS:** ELIMINATED

**ABSORBED BY:** Identity

**JUSTIFICATION:** Canonicalization is normalization law applied before identity assignment. It produces no independent constitutional fact. Its violation manifests as identity violation. Independent jurisdiction would duplicate Identity without adding constitutional primitive.

---

# AUTHORITY HIERARCHY

## Root Authorities

1. **Identity** — owns normalization and identity law
2. **Lineage** — owns DAG structure and legality
3. **Event Recording** — owns append-only constitutional history
4. **Replay** — owns deterministic reconstruction and integrity proof
5. **Policy** — owns mutation authorization law

## Derived Authorities

1. **State** — owns projection lifecycle; creates no root facts; consumes replay output only

---

# AUTHORITY INTERDEPENDENCIES

## Identity Dependencies

- **Consumes:** Artifact content, identity law version
- **Produces:** Identity facts, identity proofs
- **Depends on:** None (primitive authority)

## Lineage Dependencies

- **Consumes:** Artifact identities, events recording lineage assertions
- **Produces:** Lineage edge facts
- **Depends on:** Identity (for stable edge endpoints)

## Event Recording Dependencies

- **Consumes:** Actor identity, references to artifacts, claims, lineage proposals, policy decisions
- **Produces:** Event occurrence facts
- **Depends on:** None (primitive authority)

## Replay Dependencies

- **Consumes:** Minimum replay set, identity law, lineage graph, policy law, event sequence
- **Produces:** Reconstructed state projections, witness verification outcomes, replay proof artifacts
- **Depends on:** Identity, Lineage, Event Recording, Policy

## Policy Dependencies

- **Consumes:** Claims, actor authority context, current policy law, relevant artifact and lineage context
- **Produces:** Policy decision facts
- **Depends on:** Identity (for actor context), Lineage (for artifact context)

## State Dependencies

- **Consumes:** Replay output, policy decisions, claim dispositions, lineage-resolved artifact set
- **Produces:** State projection facts
- **Depends on:** Replay, Policy, Lineage (derived authority)

---

# AUTHORITY INVARIANTS

1. **Identity** is deterministic under declared law
2. **Lineage** preserves acyclicity and uniqueness
3. **Event Recording** maintains append-only immutability
4. **Replay** produces deterministic reconstruction from minimum replay set
5. **Policy** authorizes all mutations before they become effective
6. **State** never overrides recorded substrate
7. **No authority** creates facts outside its jurisdiction
8. **Derived authorities** consume only from root authorities
9. **Authority boundaries** are enforced at import and runtime
10. **Cross-authority mutation** requires explicit constitutional amendment

---

**Document ID:** CONSTITUTION-AUTHORITY-MODEL-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
