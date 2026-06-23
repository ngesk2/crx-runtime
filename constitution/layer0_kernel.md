# LAYER 0 KERNEL

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Constitutional kernel only. No implementation, infrastructure, or operational details.
**Authority:** This is the sole constitutional authority for Layer 0 kernel definition.

---

# CONSTITUTIONAL AXIOMS

## Axiom 1 — Identity Determinism

**AXIOM:** Identical content under identical identity rules yields identical identity. Identity assignment is a pure function of content and declared identity law.

**RATIONALE:** Without deterministic identity, artifacts cannot be referenced, deduplicated, verified, or replayed. Constitutional memory requires stable addressability.

**VIOLATION CONSEQUENCE:** Replay divergence, duplicate constitutional objects, integrity proofs become meaningless, audit trails fracture.

---

## Axiom 2 — Lineage Acyclicity

**AXIOM:** Lineage forms a directed acyclic graph. No artifact may be its own ancestor. No duplicate parent edge may exist for the same child.

**RATIONALE:** Causal history must be well-founded. Cycles destroy temporal ordering, legitimacy chains, and reconstruction semantics.

**VIOLATION CONSEQUENCE:** Infinite ancestry, non-terminating replay, ambiguous provenance, fork resolution becomes arbitrary.

---

## Axiom 3 — Event Append-Only Sovereignty

**AXIOM:** Constitutional history is recorded exclusively through append-only events. Past events are never altered, deleted, or overwritten.

**RATIONALE:** Auditability and legitimacy require an immutable temporal record. Mutable history destroys trust and replay substrate.

**VIOLATION CONSEQUENCE:** History erasure, undetectable tampering, replay becomes non-authoritative, governance decisions lose provenance.

---

## Axiom 4 — Replay Determinism

**AXIOM:** Given the minimum replay set and a bounded point in constitutional time, state reconstruction is deterministic. Two independent reconstructions yield identical constitutional facts.

**RATIONALE:** Constitutional truth must be reproducible, not narrated. Deterministic replay is the enforcement mechanism for all other axioms.

**VIOLATION CONSEQUENCE:** Divergent constitutional states, unresolvable disputes, verification collapse, implementation drift becomes undetectable.

---

## Axiom 5 — Policy Primacy on Mutation

**AXIOM:** No constitutional mutation may take effect without an explicit, recorded policy decision authorizing it.

**RATIONALE:** Raw occurrence is not legitimacy. Authority, constraints, and governance must gate what becomes durable constitutional fact.

**VIOLATION CONSEQUENCE:** Unauthorized state change, shadow governance, actors gain de facto authority without audit trail.

---

## Axiom 6 — State Is Derived, Not Authoritative

**AXIOM:** Constitutional state at any moment is a projection of recorded events, lineage, and policy decisions. State never overrides its substrate.

**RATIONALE:** Prevents dual sources of truth. Durable recorded substrate beats ephemeral or cached projections.

**VIOLATION CONSEQUENCE:** State-context collapse, hidden mutations, replay and live state diverge irreconcilably.

---

## Axiom 7 — Separation of Recording and Reconstruction

**AXIOM:** Recording what happened and reconstructing what it means are distinct constitutional acts. Neither may silently subsume the other.

**RATIONALE:** Lineage validation and integrity checks must complete before reconstruction is treated as authoritative. Coupling them hides failures.

**VIOLATION CONSEQUENCE:** Invalid history enters the substrate, replay legitimizes corrupt input, failures surface only after damage is durable.

---

## Axiom 8 — Witness Is Verification, Not Origin

**AXIOM:** A witness attests that a binding between content, identity, and constitutional context holds. A witness does not create content, identity, lineage, or policy.

**RATIONALE:** Proof and attestation are downstream of facts. Conflating witness with origin conflates evidence with authority.

**VIOLATION CONSEQUENCE:** Self-certifying artifacts, circular legitimacy, integrity claims without independent substrate.

---

# ROOT CONCEPT DEFINITIONS

## Actor

**DEFINITION:** An entity capable of initiating a constitutional occurrence. An actor is the origin of agency in an event, without regard to implementation mechanism.

**NOT DEFINITION:** Not an identity. Not an artifact. Not a policy. Not a permission grant. Not a runtime process or service name.

**DEPENDENCIES:** None. Actor is primitive.

---

## Artifact

**DEFINITION:** Durable constitutional content whose identity is deterministically derivable from its content under identity law.

**NOT DEFINITION:** Not a file path. Not a database row. Not a cache entry. Not a projection. Not an event record itself.

**DEPENDENCIES:** Content (as constituent). Identity (as address). May be referenced by lineage and events.

---

## Event

**DEFINITION:** An immutable, ordered record that something occurred at a point in constitutional time, including who acted, what act occurred, and what inputs were involved.

**NOT DEFINITION:** Not mutable state. Not a projection. Not a summary. Not a reversible log entry. Not equivalent to the artifact it references.

**DEPENDENCIES:** Actor. May reference artifacts, claims, lineage edges, and policy decisions.

---

## Lineage

**DEFINITION:** The directed acyclic set of derivation relationships among artifacts, expressing causal ancestry without ambiguity.

**NOT DEFINITION:** Not a timeline. Not an event log. Not a folder hierarchy. Not a deployment graph. Not reversible parentage.

**DEPENDENCIES:** Artifact (endpoints of edges). Identity (stable edge endpoints). Event (occasion of edge creation).

---

## State

**DEFINITION:** The set of constitutional facts held to be current at a bounded point in time, produced by applying policy and reconstruction law to recorded history.

**NOT DEFINITION:** Not the event log. Not a cache. Not a UI view. Not an agent context window. Not authoritative over recorded substrate.

**DEPENDENCIES:** Events. Lineage. Policy decisions. Claims and their dispositions. Replay law.

---

## Policy

**DEFINITION:** The body of constitutional rules governing whether an proposed mutation may be recorded, and under what constraints.

**NOT DEFINITION:** Not an event. Not a claim. Not implementation configuration. Not operator preference. Not implicit convention.

**DEPENDENCIES:** May reference actors, claims, artifacts, lineage, and prior policy decisions. Produces policy decisions as facts.

---

# ROOT AUTHORITIES

## Identity Authority

**OWNS:** Content normalization law, identity assignment law, identity verification, identity equality judgment.

**DOES NOT OWN:** Lineage structure, event ordering, policy judgment, state projection, external attestation networks.

**CREATES:** Identity facts. Witness bindings that are purely identity proofs (content-to-identity attestations).

**VERIFIES:** That presented content matches claimed identity under declared identity law.

**CONSUMES:** Artifact content. Declared identity law version.

---

## Lineage Authority

**OWNS:** Parent-child derivation relationships, DAG legality, ancestry queries, fork detection at the lineage layer.

**DOES NOT OWN:** Artifact content, identity assignment, event transport, replay execution, policy permissibility.

**CREATES:** Lineage edge facts.

**VERIFIES:** That proposed lineage edges preserve acyclicity and uniqueness constraints.

**CONSUMES:** Artifact identities (edge endpoints). Events recording lineage assertions.

---

## Event Recording Authority

**OWNS:** Constitutional occurrence capture, append-only event sequence, event immutability, temporal ordering of occurrences.

**DOES NOT OWN:** Meaning of events, policy outcomes, state projections, identity derivation, lineage legality (except as recorded fact).

**CREATES:** Event occurrence facts.

**VERIFIES:** That a proposed record satisfies recording law (required fields, ordering, immutability) before append.

**CONSUMES:** Actor identity. References to artifacts, claims, lineage proposals, and policy decisions as event payload.

---

## Replay Authority

**OWNS:** Deterministic reconstruction law, integrity verification during reconstruction, divergence detection, replay proof.

**DOES NOT OWN:** Initial recording of events, policy authoring, lineage edge creation, identity law definition.

**CREATES:** Reconstructed state projections (transient). Witness verification outcomes (when verifying persisted attestations). Replay proof artifacts (transient or persisted per recording law).

**VERIFIES:** That recorded history reconstructs without drift; that witnesses match reconstructed bindings; that invariants hold at bounded time.

**CONSUMES:** Minimum replay set. Identity law. Lineage graph. Policy law. Event sequence.

---

## Policy Authority

**OWNS:** Mutation authorization rules, constraint evaluation, policy versioning, disposition of claims.

**DOES NOT OWN:** Event transport, identity derivation, lineage structure, replay execution mechanics.

**CREATES:** Policy decision facts.

**VERIFIES:** That proposed mutations satisfy active policy before they may be recorded as effective.

**CONSUMES:** Claims. Actor authority context. Current policy law. Relevant artifact and lineage context.

---

## State Authority

**OWNS:** Definition of "current" constitutional facts, state boundary selection, invalidation of stale projections.

**DOES NOT OWN:** Event substrate, identity law, lineage creation, policy authoring.

**CREATES:** State projection facts (always derived).

**VERIFIES:** That a projection corresponds to replay output at the declared boundary; that no projection contradicts recorded substrate.

**CONSUMES:** Replay output. Policy decisions. Claim dispositions. Lineage-resolved artifact set.

**DERIVED STATUS:** State authority is **jurisdictionally derived**. It operates exclusively on replay and policy outputs. It does not originate constitutional fact.

---

# ROOT FACTS

1. **Content** — durable constitutional payload
2. **Identity** — deterministic address of content under declared law
3. **Lineage Edge** — directed derivation between identities
4. **Event Occurrence** — immutable record of constitutional action
5. **Policy Decision** — recorded authorization or denial of mutation
6. **Claim** — submitted proposition pending or completed disposition

# DERIVED FACTS

1. **Witness** — attestation binding among root facts
2. **State Projection** — current constitutional view at a boundary

# MINIMUM REPLAY SET

1. Complete append-only event sequence with actor for each occurrence
2. All artifact content or retrievable content for referenced identities
3. Identity law version per constitutional era
4. Complete lineage edge set
5. Policy law version per constitutional era
6. All recorded policy decisions
7. All claims and their dispositions
8. Persisted witness attestations (when durably recorded)
9. Declared reconstruction boundary

# CONSTITUTIONAL INVARIANTS

1. Identity is deterministic under declared law
2. Lineage is a DAG
3. Events are append-only and sovereign
4. Replay is deterministic at any declared boundary
5. No mutation without recorded policy decision
6. State never overrides substrate
7. Recording and reconstruction remain separated
8. Witness verifies; it does not originate
9. Derived facts are reproducible from root facts and law
10. Projections are non-authoritative unless revalidated by replay

# KERNEL EQUATION

```
Constitutional Reality at boundary T =
  Replay(
    Events₀…ₙ,
    Lineage,
    Content,
    IdentityLaw,
    PolicyLaw,
    PolicyDecisions,
    Claims,
    Witnessesₚ
  ) → StateProjectionₜ
```

---

**Document ID:** CONSTITUTION-LAYER0-KERNEL-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
**Replay:** Required before any implementation claiming conformance
