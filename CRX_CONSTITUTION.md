# CRX Constitutional Kernel Specification

**Phase:** 3.5A — Constitutional Freeze  
**Status:** FROZEN  
**Scope:** Constitutional law only. No migration, extraction, infrastructure, repository layout, or implementation.  
**Supersedes:** All informal kernel descriptions for purposes of extraction and implementation conformance.

---

# PHASE 1 — CONSTITUTIONAL AXIOMS

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

# PHASE 2 — ROOT CONCEPT DEFINITIONS

## Actor

**NAME:** Actor

**DEFINITION:** An entity capable of initiating a constitutional occurrence. An actor is the origin of agency in an event, without regard to implementation mechanism.

**NOT DEFINITION:** Not an identity. Not an artifact. Not a policy. Not a permission grant. Not a runtime process or service name.

**DEPENDENCIES:** None. Actor is primitive.

---

## Artifact

**NAME:** Artifact

**DEFINITION:** Durable constitutional content whose identity is deterministically derivable from its content under identity law.

**NOT DEFINITION:** Not a file path. Not a database row. Not a cache entry. Not a projection. Not an event record itself.

**DEPENDENCIES:** Content (as constituent). Identity (as address). May be referenced by lineage and events.

---

## Claim

**NAME:** Claim

**DEFINITION:** A propositional assertion about constitutional reality that requires evaluation before it may alter durable state.

**NOT DEFINITION:** Not a decision. Not established fact. Not a policy rule. Not an event. Not speculative narrative without submission to evaluation.

**DEPENDENCIES:** Actor (submitter). Event (occasion of assertion). Policy (evaluation gate). May reference artifacts and lineage.

---

## Event

**NAME:** Event

**DEFINITION:** An immutable, ordered record that something occurred at a point in constitutional time, including who acted, what act occurred, and what inputs were involved.

**NOT DEFINITION:** Not mutable state. Not a projection. Not a summary. Not a reversible log entry. Not equivalent to the artifact it references.

**DEPENDENCIES:** Actor. May reference artifacts, claims, lineage edges, and policy decisions.

---

## Witness

**NAME:** Witness

**DEFINITION:** A verifiable attestation that a specific binding holds—typically between content, identity, lineage position, or event sequence—at the time of attestation.

**NOT DEFINITION:** Not the content itself. Not identity assignment. Not lineage creation. Not policy judgment. Not a substitute for event recording.

**DEPENDENCIES:** Content and/or identity and/or lineage and/or events (as subjects of attestation). Identity law (for verifiability).

---

## Lineage

**NAME:** Lineage

**DEFINITION:** The directed acyclic set of derivation relationships among artifacts, expressing causal ancestry without ambiguity.

**NOT DEFINITION:** Not a timeline. Not an event log. Not a folder hierarchy. Not a deployment graph. Not reversible parentage.

**DEPENDENCIES:** Artifact (endpoints of edges). Identity (stable edge endpoints). Event (occasion of edge creation).

---

## State

**NAME:** State

**DEFINITION:** The set of constitutional facts held to be current at a bounded point in time, produced by applying policy and reconstruction law to recorded history.

**NOT DEFINITION:** Not the event log. Not a cache. Not a UI view. Not an agent context window. Not authoritative over recorded substrate.

**DEPENDENCIES:** Events. Lineage. Policy decisions. Claims and their dispositions. Replay law.

---

## Policy

**NAME:** Policy

**DEFINITION:** The body of constitutional rules governing whether an proposed mutation may be recorded, and under what constraints.

**NOT DEFINITION:** Not an event. Not a claim. Not implementation configuration. Not operator preference. Not implicit convention.

**DEPENDENCIES:** May reference actors, claims, artifacts, lineage, and prior policy decisions. Produces policy decisions as facts.

---

# PHASE 3 — AUTHORITY JURISDICTION

## Identity Authority

**AUTHORITY:** Identity

**OWNS:** Content normalization law, identity assignment law, identity verification, identity equality judgment.

**DOES NOT OWN:** Lineage structure, event ordering, policy judgment, state projection, external attestation networks.

**CREATES:** Identity facts. Witness bindings that are purely identity proofs (content-to-identity attestations).

**VERIFIES:** That presented content matches claimed identity under declared identity law.

**CONSUMES:** Artifact content. Declared identity law version.

**MERGE NOTE — Canonicalization:** Canonicalization is **not** an independent authority. It is the normalization phase **owned by Identity** that precedes identity assignment. Separation of normalization from fingerprinting is an implementation invariant, not a separate constitutional jurisdiction.

---

## Lineage Authority

**AUTHORITY:** Lineage

**OWNS:** Parent-child derivation relationships, DAG legality, ancestry queries, fork detection at the lineage layer.

**DOES NOT OWN:** Artifact content, identity assignment, event transport, replay execution, policy permissibility.

**CREATES:** Lineage edge facts.

**VERIFIES:** That proposed lineage edges preserve acyclicity and uniqueness constraints.

**CONSUMES:** Artifact identities (edge endpoints). Events recording lineage assertions.

---

## Event Recording Authority

**AUTHORITY:** Event Recording

**OWNS:** Constitutional occurrence capture, append-only event sequence, event immutability, temporal ordering of occurrences.

**DOES NOT OWN:** Meaning of events, policy outcomes, state projections, identity derivation, lineage legality (except as recorded fact).

**CREATES:** Event occurrence facts.

**VERIFIES:** That a proposed record satisfies recording law (required fields, ordering, immutability) before append.

**CONSUMES:** Actor identity. References to artifacts, claims, lineage proposals, and policy decisions as event payload.

---

## Replay Authority

**AUTHORITY:** Replay

**OWNS:** Deterministic reconstruction law, integrity verification during reconstruction, divergence detection, replay proof.

**DOES NOT OWN:** Initial recording of events, policy authoring, lineage edge creation, identity law definition.

**CREATES:** Reconstructed state projections (transient). Witness verification outcomes (when verifying persisted attestations). Replay proof artifacts (transient or persisted per recording law).

**VERIFIES:** That recorded history reconstructs without drift; that witnesses match reconstructed bindings; that invariants hold at bounded time.

**CONSUMES:** Minimum replay set. Identity law. Lineage graph. Policy law. Event sequence.

---

## Policy Authority

**AUTHORITY:** Policy

**OWNS:** Mutation authorization rules, constraint evaluation, policy versioning, disposition of claims.

**DOES NOT OWN:** Event transport, identity derivation, lineage structure, replay execution mechanics.

**CREATES:** Policy decision facts.

**VERIFIES:** That proposed mutations satisfy active policy before they may be recorded as effective.

**CONSUMES:** Claims. Actor authority context. Current policy law. Relevant artifact and lineage context.

---

## State Authority

**AUTHORITY:** State

**OWNS:** Definition of "current" constitutional facts, state boundary selection, invalidation of stale projections.

**DOES NOT OWN:** Event substrate, identity law, lineage creation, policy authoring.

**CREATES:** State projection facts (always derived).

**VERIFIES:** That a projection corresponds to replay output at the declared boundary; that no projection contradicts recorded substrate.

**CONSUMES:** Replay output. Policy decisions. Claim dispositions. Lineage-resolved artifact set.

**DERIVED STATUS:** State authority is **jurisdictionally derived**. It operates exclusively on replay and policy outputs. It does not originate constitutional fact.

---

## Witness — Merged Authority

**AUTHORITY:** Witness *(eliminated as independent authority)*

**ABSORBED BY:** Identity (creation of identity proofs) and Replay (verification of attestations against reconstructed substrate).

**JUSTIFICATION:** Witness has no independent ontological primitive. It neither creates content, identity, lineage, events, nor policy. It attests bindings among facts that other authorities own. Constitutional law requires witness **facts** but not a witness **authority**.

---

## Canonicalization — Merged Authority

**AUTHORITY:** Canonicalization *(eliminated as independent authority)*

**ABSORBED BY:** Identity

**JUSTIFICATION:** Canonicalization is normalization law applied before identity assignment. It produces no independent constitutional fact. Its violation manifests as identity violation. Independent jurisdiction would duplicate Identity without adding constitutional primitive.

---

# PHASE 4 — FACT TAXONOMY

## Content

**FACT:** Content

**ROOT / DERIVED:** Root

**PERSISTED / TRANSIENT:** Persisted (as artifact body or retrievable content addressed by identity)

**CREATED BY:** Actor action recorded as event, subject to policy

**RECONSTRUCTABLE:** Yes — from persisted content or content-addressed storage referenced by identity

---

## Identity

**FACT:** Identity

**ROOT / DERIVED:** Root (as assignment outcome); operation is derived from content + identity law

**PERSISTED / TRANSIENT:** Persisted (as identity fact bound to artifact)

**CREATED BY:** Identity Authority

**RECONSTRUCTABLE:** Yes — deterministically from content + identity law version

---

## Witness

**FACT:** Witness

**ROOT / DERIVED:** Derived

**PERSISTED / TRANSIENT:** Persisted when recorded as attestation; transient when produced only during replay verification

**CREATED BY:** Identity Authority (generation); Replay Authority (verification outcome)

**RECONSTRUCTABLE:** Yes — from content, identity law, and attestation law; verification is replay-derived

---

## Lineage Edge

**FACT:** Lineage Edge

**ROOT / DERIVED:** Root

**PERSISTED / TRANSIENT:** Persisted

**CREATED BY:** Lineage Authority upon authorized event

**RECONSTRUCTABLE:** Yes — from persisted lineage edge set

---

## Event Occurrence

**FACT:** Event Occurrence

**ROOT / DERIVED:** Root

**PERSISTED / TRANSIENT:** Persisted

**CREATED BY:** Event Recording Authority

**RECONSTRUCTABLE:** Yes — from append-only event sequence

---

## Policy Decision

**FACT:** Policy Decision

**ROOT / DERIVED:** Root

**PERSISTED / TRANSIENT:** Persisted

**CREATED BY:** Policy Authority

**RECONSTRUCTABLE:** Yes — from policy law version + evaluated inputs recorded in event substrate

---

## State Projection

**FACT:** State Projection

**ROOT / DERIVED:** Derived

**PERSISTED / TRANSIENT:** Transient by default; persisted only as non-authoritative cache or snapshot explicitly marked as derived

**CREATED BY:** State Authority via Replay Authority

**RECONSTRUCTABLE:** Yes — always and only from minimum replay set

---

# PHASE 5 — REPLAY LAW

## Constitutional Requirement

Deterministic reconstruction requires sufficient information to:
1. Reproduce every identity assignment under declared law
2. Traverse every lineage edge in recorded order
3. Replay every event occurrence in constitutional order
4. Re-evaluate every policy decision under the policy law active at each boundary
5. Verify every persisted witness without external mutable reference
6. Produce identical state projection at any declared boundary

## MINIMUM REPLAY SET

| Element | Constitutional Justification |
|---------|------------------------------|
| **Complete event sequence** | Axiom 3 — history is append-only events; without total ordering of occurrences, constitutional time is undefined |
| **Artifact content or content-addressed retrievals for all referenced identities** | Axiom 1 — identity is content-derived; reconstruction cannot resolve artifacts without content |
| **Identity law version for each era** | Axiom 1 — identity determinism is versioned law, not implicit convention |
| **Complete lineage edge set** | Axiom 2 — ancestry is constitutional fact; state without lineage is ungrounded |
| **Policy law version for each era** | Axiom 5 — mutations require policy; replay must re-derive authorization, not assume it |
| **Recorded policy decisions** | Axiom 5 — dispositions are facts, not recomputable opinions without recorded judgment context |
| **Claim records and dispositions** | Links propositional intent to authorized mutations; legitimacy chain is not inferable from events alone |
| **Actor identity for each event** | Agency and authority chains require knowing who acted |
| **Persisted witness attestations (when recorded)** | Axiom 8 — attestations are part of the integrity substrate when durably recorded |
| **Declared reconstruction boundary** | Axiom 4 — determinism is bounded to a point in constitutional time |

**Explicit exclusions from minimum replay set:**
- State projections (derived)
- Ephemeral caches and agent context (non-constitutional)
- Narrative summaries (non-authoritative)
- Transport metadata not recorded as constitutional events
- Implementation-specific storage coordinates

---

# PHASE 6 — ELIMINATION TEST

## Identity

**AUTHORITY:** Identity

**CAN BE ELIMINATED?** NO

**IRREDUCIBLE REASON:** Without deterministic addressability, artifacts cannot be referenced, lineage cannot anchor, or replay cannot bind content to history.

---

## Lineage

**AUTHORITY:** Lineage

**CAN BE ELIMINATED?** NO

**IRREDUCIBLE REASON:** Causal structure is constitutional fact distinct from temporal occurrence. Events record that lineage was asserted; lineage is the persistent DAG those events build.

---

## Event Recording

**AUTHORITY:** Event Recording

**CAN BE ELIMINATED?** NO

**IRREDUCIBLE REASON:** Append-only occurrence record is the sole substrate of constitutional time and audit. No other authority creates temporal history.

---

## Replay

**AUTHORITY:** Replay

**CAN BE ELIMINATED?** NO

**IRREDUCIBLE REASON:** Deterministic reconstruction is the enforcement mechanism for axioms 1–8. Recording without reconstructability is memory without legitimacy.

---

## Policy

**AUTHORITY:** Policy

**CAN BE ELIMINATED?** NO

**IRREDUCIBLE REASON:** Mutation without authorization law collapses governance into occurrence. Policy is the gate between proposal and durable fact.

---

## State

**AUTHORITY:** State

**CAN BE ELIMINATED?** YES

**ABSORBED BY:** Replay (reconstruction) with State Projection as derived fact class

**WHY:** State has no root fact. It is always the output of applying replay law at a boundary. Retaining State as an authority is a jurisdictional convenience for projection lifecycle, not an irreducible constitutional primitive. **State authority is demoted to derived jurisdiction** in the final constitution.

---

## Witness

**AUTHORITY:** Witness

**CAN BE ELIMINATED?** YES

**ABSORBED BY:** Identity (attestation generation) + Replay (attestation verification)

**WHY:** Witness attests bindings among facts owned by other authorities. No independent constitutional primitive exists for "witness" separate from identity proof and replay verification.

---

## Canonicalization

**AUTHORITY:** Canonicalization

**CAN BE ELIMINATED?** YES

**ABSORBED BY:** Identity

**WHY:** Normalization is prerequisite law within identity assignment, not a separate fact class or jurisdiction.

---

# PHASE 7 — FINAL CONSTITUTION

## ROOT FACTS

1. **Content** — durable constitutional payload
2. **Identity** — deterministic address of content under declared law
3. **Lineage Edge** — directed derivation between identities
4. **Event Occurrence** — immutable record of constitutional action
5. **Policy Decision** — recorded authorization or denial of mutation
6. **Claim** — submitted proposition pending or completed disposition *(subsumed under event/policy substrate but retained as fact class because legitimacy chains require it)*

## DERIVED FACTS

1. **Witness** — attestation binding among root facts
2. **State Projection** — current constitutional view at a boundary

## ROOT AUTHORITIES

1. **Identity** — owns normalization and identity law
2. **Lineage** — owns DAG structure and legality
3. **Event Recording** — owns append-only constitutional history
4. **Replay** — owns deterministic reconstruction and integrity proof
5. **Policy** — owns mutation authorization law

## DERIVED AUTHORITIES

1. **State** — owns projection lifecycle; creates no root facts; consumes replay output only

## ELIMINATED AUTHORITIES

| Eliminated | Absorbed By | Reason |
|------------|-------------|--------|
| Witness | Identity + Replay | Attestation is verification, not origin |
| Canonicalization | Identity | Normalization is phase of identity assignment |

## MINIMUM REPLAY SET

1. Complete append-only event sequence with actor for each occurrence  
2. All artifact content or retrievable content for referenced identities  
3. Identity law version per constitutional era  
4. Complete lineage edge set  
5. Policy law version per constitutional era  
6. All recorded policy decisions  
7. All claims and their dispositions  
8. Persisted witness attestations (when durably recorded)  
9. Declared reconstruction boundary  

## CONSTITUTIONAL INVARIANTS

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

## CRX KERNEL

The CRX constitutional kernel is the **minimum survivable unit** of governance-grade systems:

```text
ROOT AUTHORITIES:
  Identity + Lineage + Event Recording + Policy + Replay

ROOT FACTS:
  Content + Identity + Lineage Edge + Event Occurrence + Policy Decision + Claim

DERIVED LAYER:
  Witness (fact) ← Identity + Replay
  State Projection (fact) ← Replay + Policy + State (derived authority)

LAW:
  Record occurrences → validate lineage → authorize by policy →
  assign identity → reconstruct deterministically → project state
```

**Kernel equation:**

```text
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

**Freeze declaration:** All extraction, migration, replay implementation, repository restructuring, and infrastructure work must conform to this document. Any implementation that violates a root axiom or merges eliminated authorities without constitutional amendment is non-conformant.

---

```text
Document ID:  CRX-CONST-KERNEL-3.5A
Status:       FROZEN
Amendment:    Requires constitutional amendment process per COS
Replay:       Required before any implementation claiming conformance
```
