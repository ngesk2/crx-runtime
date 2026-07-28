# INVARIANT LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Invariant definitions and enforcement law only. No implementation details.

---

# INVARIANT DEFINITION

## Invariant Semantics

**DEFINITION:** An invariant is a constitutional rule that must hold at all times. Invariants define the boundaries of valid constitutional state.

**PURPOSE:** Invariants enforce constitutional axioms, prevent architectural corruption, and enable verification of replay correctness.

**CLASSIFICATION:** CONSTITUTIONAL_CONSTRAINT

**PROPERTIES:**
- **Deterministic:** Same state → same invariant evaluation
- **Pure:** No side effects during evaluation
- **Verifiable:** Invariant violations can be detected and reported
- **Replayable:** Invariant evaluation is reproducible from minimum replay set

---

# CONSTITUTIONAL INVARIANTS

## Invariant 1: Identity Determinism

**INVARIANT_ID:** IDENTITY_DETERMINISM

**STATEMENT:** Identity is deterministic under declared law.

**ENFORCEMENT:**
- Identity assignment must be deterministic function of content and law
- Identity verification must produce identical results for identical content
- Identity must be reproducible from minimum replay set

**VIOLATION CONSEQUENCE:** Replay divergence, duplicate constitutional objects, integrity proofs become meaningless

---

## Invariant 2: Lineage Acyclicity

**INVARIANT_ID:** LINEAGE_ACYCLICITY

**STATEMENT:** Lineage is a directed acyclic graph.

**ENFORCEMENT:**
- Lineage must not contain cycles
- Lineage must not contain duplicate parent edges
- Lineage must be well-founded (no infinite ancestry)

**VIOLATION CONSEQUENCE:** Infinite ancestry, non-terminating replay, ambiguous provenance

---

## Invariant 3: Event Append-Only Sovereignty

**INVARIANT_ID:** EVENT_APPEND_ONLY

**STATEMENT:** Events are append-only and sovereign.

**ENFORCEMENT:**
- Events must never be altered, deleted, or overwritten
- Events must be ordered in constitutional sequence
- Events must be immutable once recorded

**VIOLATION CONSEQUENCE:** History erasure, undetectable tampering, replay becomes non-authoritative

---

## Invariant 4: Replay Determinism

**INVARIANT_ID:** REPLAY_DETERMINISM

**STATEMENT:** Replay is deterministic at any declared boundary.

**ENFORCEMENT:**
- Replay must produce identical state for identical inputs
- Replay must use minimum replay set
- Replay must be infrastructure-independent

**VIOLATION CONSEQUENCE:** Divergent constitutional states, unresolvable disputes, verification collapse

---

## Invariant 5: Policy Primacy

**INVARIANT_ID:** POLICY_PRIMACY

**STATEMENT:** No mutation without recorded policy decision.

**ENFORCEMENT:**
- All mutations must have explicit policy authorization
- Policy decisions must be recorded as events
- Policy evaluation must be deterministic

**VIOLATION CONSEQUENCE:** Unauthorized state change, shadow governance, actors gain de facto authority

---

## Invariant 6: State Derived Not Authoritative

**INVARIANT_ID:** STATE_DERIVED

**STATEMENT:** State never overrides recorded substrate.

**ENFORCEMENT:**
- State must be derived from replay
- State must be projection, not source of truth
- State must be invalidatable on replay divergence

**VIOLATION CONSEQUENCE:** State-context collapse, hidden mutations, replay and live state diverge

---

## Invariant 7: Recording Reconstruction Separation

**INVARIANT_ID:** RECORDING_RECONSTRUCTION_SEPARATION

**STATEMENT:** Recording and reconstruction remain separated.

**ENFORCEMENT:**
- Recording must complete before reconstruction
- Lineage validation must complete before reconstruction
- Failures must surface before reconstruction is treated as authoritative

**VIOLATION CONSEQUENCE:** Invalid history enters substrate, replay legitimizes corrupt input

---

## Invariant 8: Witness Verification Not Origin

**INVARIANT_ID:** WITNESS_VERIFICATION

**STATEMENT:** Witness verifies; it does not originate.

**ENFORCEMENT:**
- Witness must attest bindings among facts
- Witness must not create content, identity, lineage, or policy
- Witness must be verifiable independently

**VIOLATION CONSEQUENCE:** Self-certifying artifacts, circular legitimacy, integrity claims without independent substrate

---

## Invariant 9: Derived Facts Reproducible

**INVARIANT_ID:** DERIVED_FACTS_REPRODUCIBLE

**STATEMENT:** Derived facts are reproducible from root facts and law.

**ENFORCEMENT:**
- Derived facts must be traceable to root facts
- Derived facts must be recomputable from minimum replay set
- Derived facts must be marked as non-authoritative

**VIOLATION CONSEQUENCE:** Unverifiable derivations, hidden state, replay divergence

---

## Invariant 10: Projections Non-Authoritative

**INVARIANT_ID:** PROJECTIONS_NON_AUTHORITATIVE

**STATEMENT:** Projections are non-authoritative unless revalidated by replay.

**ENFORCEMENT:**
- Projections must be marked as derived
- Projections must be invalidatable on replay divergence
- Projections must not override recorded substrate

**VIOLATION CONSEQUENCE:** Projection authority creep, hidden state, replay divergence

---

# INVARIANT ENFORCEMENT

## Enforcement Points

Invariants MUST be enforced at:
- **Event Recording** — Before event is appended
- **Replay** — During state reconstruction
- **Mutation** — Before state promotion
- **Witness Generation** — Before witness commitment
- **Verification** — During integrity checks

---

## Enforcement Mechanisms

Invariants MUST be enforced by:
- **Deterministic evaluation** — Same state → same result
- **Structured failure reporting** — Deterministic failure codes
- **Replay verification** — Invariants verified during replay
- **Witness commitment** — Invariants committed in witness

---

# INVARIANT VERSIONING

## Version Requirements

Invariants MUST be versioned:
- Invariant definitions must have version
- Invariant changes must be recorded as events
- Invariant version must be traceable in minimum replay set
- Invariant version must be committed in witness

---

## Version Changes

Invariant version changes MUST:
- Be recorded as constitutional events
- Require explicit policy authorization
- Be traceable in minimum replay set
- Cause witness divergence

---

# INVARIANT FAILURE SEMANTICS

## Failure Classification

Invariant failures MUST be deterministic:
- **IDENTITY_DETERMINISM_VIOLATION:** Identity not deterministic under declared law
- **LINEAGE_CYCLE_DETECTED:** Lineage contains cycle
- **LINEAGE_DUPLICATE_EDGE:** Lineage contains duplicate parent edge
- **EVENT_MUTATION_DETECTED:** Event was altered or deleted
- **REPLAY_DIVERGENCE:** Replay produced divergent state
- **UNAUTHORIZED_MUTATION:** Mutation lacks policy authorization
- **STATE_OVERRIDE_DETECTED:** State overrode recorded substrate
- **WITNESS_ORIGIN_DETECTED:** Witness attempted to originate fact
- **DERIVED_FACT_UNREPRODUCIBLE:** Derived fact cannot be reproduced
- **PROJECTION_OVERRIDE_DETECTED:** Projection overrode recorded substrate

## Failure Handling

Invariant failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Be recorded in event stream
- Trigger witness divergence

---

# INVARIANT REGISTRY

## Registry Requirements

Invariant registry MUST:
- Contain all invariant definitions
- Track invariant versions
- Provide invariant evaluation
- Enable invariant verification
- Be replay-verifiable

---

## Registry Authority

Invariant registry is **NOT** a constitutional authority.

Invariant registry is maintained by:
- Policy Authority (invariant definition)
- Replay Authority (invariant evaluation)
- Witness Authority (invariant commitment)

---

**Document ID:** CONSTITUTION-INVARIANT-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
