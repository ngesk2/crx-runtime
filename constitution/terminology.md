# TERMINOLOGY

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Constitutional terminology definitions only. No implementation details.

---

# CONSTITUTIONAL TERMS

## Actor

**DEFINITION:** An entity capable of initiating a constitutional occurrence.

**NOT DEFINITION:** Not an identity. Not an artifact. Not a policy. Not a permission grant. Not a runtime process or service name.

**DEPENDENCIES:** None. Actor is primitive.

---

## Artifact

**DEFINITION:** Durable constitutional content whose identity is deterministically derivable from its content under identity law.

**NOT DEFINITION:** Not a file path. Not a database row. Not a cache entry. Not a projection. Not an event record itself.

**DEPENDENCIES:** Content (as constituent). Identity (as address). May be referenced by lineage and events.

---

## Claim

**DEFINITION:** A propositional assertion about constitutional reality that requires evaluation before it may alter durable state.

**NOT DEFINITION:** Not a decision. Not established fact. Not a policy rule. Not an event. Not speculative narrative without submission to evaluation.

**DEPENDENCIES:** Actor (submitter). Event (occasion of assertion). Policy (evaluation gate). May reference artifacts and lineage.

---

## Event

**DEFINITION:** An immutable, ordered record that something occurred at a point in constitutional time, including who acted, what act occurred, and what inputs were involved.

**NOT DEFINITION:** Not mutable state. Not a projection. Not a summary. Not a reversible log entry. Not equivalent to the artifact it references.

**DEPENDENCIES:** Actor. May reference artifacts, claims, lineage edges, and policy decisions.

---

## Witness

**DEFINITION:** A verifiable attestation that a specific binding holds—typically between content, identity, lineage position, or event sequence—at the time of attestation.

**NOT DEFINITION:** Not the content itself. Not identity assignment. Not lineage creation. Not policy judgment. Not a substitute for event recording.

**DEPENDENCIES:** Content and/or identity and/or lineage and/or events (as subjects of attestation). Identity law (for verifiability).

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

## Authority

**DEFINITION:** A constitutional jurisdiction that owns specific truth domains and defines how those domains may be mutated.

**NOT DEFINITION:** Not a runtime service. Not a database. Not a cache. Not a UI component. Not an infrastructure system.

**TYPES:**
- Root Authority: Owns root facts and defines constitutional law
- Derived Authority: Operates on outputs of root authorities, creates no root facts
- Eliminated Authority: Jurisdiction absorbed by other authorities

---

## Invariant

**DEFINITION:** A constitutional rule that must hold at all times. Invariants define the boundaries of valid constitutional state.

**NOT DEFINITION:** Not a policy rule. Not a constraint. Not a validation rule. Not a runtime check.

**PROPERTIES:**
- Deterministic: Same state → same invariant evaluation
- Pure: No side effects during evaluation
- Verifiable: Invariant violations can be detected and reported
- Replayable: Invariant evaluation is reproducible from minimum replay set

---

## Replay

**DEFINITION:** Deterministic reconstruction of constitutional state from recorded history at a bounded point in time.

**NOT DEFINITION:** Not execution. Not runtime side effects. Not live service calls. Not current state.

**PROPERTIES:**
- Deterministic: Same inputs → same outputs
- Pure: No side effects during reconstruction
- Infrastructure-independent: No network IO, no clock dependence
- Transport-independent: No HTTP, no protocol dependencies

---

## Canonicalization

**DEFINITION:** Normalization of content to a deterministic representation suitable for identity assignment.

**NOT DEFINITION:** Not identity assignment. Not fingerprinting. Not hashing. Not serialization.

**STATUS:** Absorbed by Identity Authority as normalization phase.

---

## Fingerprint

**DEFINITION:** Cryptographic hash of canonicalized content used for identity assignment.

**NOT DEFINITION:** Not identity. Not content. Not lineage. Not policy.

**ALGORITHM:** SHA-256

---

## Minimum Replay Set

**DEFINITION:** The minimum set of facts required to deterministically reconstruct constitutional state at any declared boundary.

**COMPONENTS:**
- Complete event sequence with actor for each occurrence
- All artifact content or retrievable content for referenced identities
- Identity law version per constitutional era
- Complete lineage edge set
- Policy law version per constitutional era
- All recorded policy decisions
- All claims and their dispositions
- Persisted witness attestations (when durably recorded)
- Declared reconstruction boundary

---

## Constitutional Time

**DEFINITION:** The ordered sequence of events as recorded in the append-only event log.

**NOT DEFINITION:** Not wall-clock time. Not system time. Not timestamp. Not duration.

**PROPERTIES:**
- Defined by event ordering
- Immutable once recorded
- Bounded by event index or policy version

---

## Derived Fact

**DEFINITION:** A fact that is computable from root facts and constitutional law.

**EXAMPLES:**
- Witness (attestation binding among root facts)
- State Projection (current constitutional view at a boundary)

**PROPERTIES:**
- Reproducible from root facts and law
- Non-authoritative unless revalidated by replay
- May be cached for performance

---

## Root Fact

**DEFINITION:** A fact that is not derivable from other facts. Root facts are the foundation of constitutional truth.

**EXAMPLES:**
- Content
- Identity
- Lineage Edge
- Event Occurrence
- Policy Decision
- Claim

**PROPERTIES:**
- Not derivable from other facts
- Authoritative
- Persisted

---

## Shadow Copy

**DEFINITION:** A dangerous duplicate that creates competing sources of truth.

**EXAMPLES:**
- Mutable caches of canonical state
- Duplicated YAML configurations
- Runtime patches to invariant definitions
- Shadow databases

**PROPERTIES:**
- Duplicate canonical representation
- Independent mutation capability
- Not synchronized with source
- Creates ambiguity

**STATUS:** Prohibited by constitutional law.

---

## Ungoverned Cognition

**DEFINITION:** Agent action without constitutional retrieval of invariants, replay law, authority ownership, ADRs, lineage restrictions, policy boundaries, and mutation permissions.

**CONSEQUENCE:** Leads to recursive architectural drift.

**STATUS:** Prohibited by constitutional law.

---

## Constitutional Divergence

**DEFINITION:** A situation where replay produces different results than expected, indicating corruption or drift in constitutional substrate.

**CAUSES:**
- Violated invariants
- Shadow copies
- Illegal mutations
- Layer violations
- Authority violations

**CONSEQUENCE:** Replay verification failure, witness divergence, constitutional audit required.

---

## Constitutional Amendment

**DEFINITION:** A formal process for changing constitutional law, including axioms, authorities, invariants, or layering rules.

**REQUIREMENTS:**
- Explicit policy decision
- Event recording
- Replay verification
- Witness generation
- Constitutional audit

**STATUS:** Only legal mechanism for changing constitutional law.

---

# LAYERING TERMS

## Layer 0: Constitutional Kernel

**DEFINITION:** Transport-independent constitutional physics.

**SCOPE:** Constitutional axioms, root authorities, root facts, constitutional invariants, replay law, mutation law, witness law, retrieval law, source of truth law, invariant law.

**PROPERTIES:** Deterministic, pure, infrastructure-independent, transport-independent, runtime-independent, provider-independent.

---

## Layer 1: Runtime

**DEFINITION:** Constitutional execution engine.

**SCOPE:** Event stream processing, replay execution, state reconstruction, invariant enforcement, witness generation, certificate generation.

**PROPERTIES:** Deterministic, replay-safe, infrastructure-aware (via adapters), transport-aware (via adapters).

---

## Layer 2: Adapters

**DEFINITION:** Infrastructure and transport adapters.

**SCOPE:** Database adapters, HTTP adapters, storage adapters, provider adapters, logging adapters.

**PROPERTIES:** Infrastructure-dependent, transport-dependent, provider-dependent.

---

## Layer 3: Orchestration

**DEFINITION:** Workflow and agent orchestration.

**SCOPE:** Agent coordination, workflow execution, task scheduling, capability routing.

**PROPERTIES:** Infrastructure-dependent, transport-dependent, provider-dependent.

---

## Layer 4: Infrastructure

**DEFINITION:** Deployment and operational substrate.

**SCOPE:** Docker, Kubernetes, Postgres, Redis, Ollama, network, storage.

**PROPERTIES:** Infrastructure-only, no constitutional authority.

---

# AUTHORITY TERMS

## Identity Authority

**JURISDICTION:** Content normalization, identity assignment, identity verification, identity equality judgment.

---

## Lineage Authority

**JURISDICTION:** Parent-child derivation relationships, DAG legality, ancestry queries, fork detection.

---

## Event Recording Authority

**JURISDICTION:** Constitutional occurrence capture, append-only event sequence, event immutability, temporal ordering.

---

## Replay Authority

**JURISDICTION:** Deterministic reconstruction law, integrity verification during reconstruction, divergence detection, replay proof.

---

## Policy Authority

**JURISDICTION:** Mutation authorization rules, constraint evaluation, policy versioning, disposition of claims.

---

## State Authority

**JURISDICTION:** Definition of "current" constitutional facts, state boundary selection, invalidation of stale projections.

**STATUS:** Derived authority. Operates exclusively on replay and policy outputs.

---

## Witness Authority

**STATUS:** Eliminated. Absorbed by Identity (creation of identity proofs) + Replay (verification of attestations).

---

## Canonicalization Authority

**STATUS:** Eliminated. Absorbed by Identity as normalization phase.

---

**Document ID:** CONSTITUTION-TERMINOLOGY-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
