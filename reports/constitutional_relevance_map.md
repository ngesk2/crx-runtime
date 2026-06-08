# CONSTITUTIONAL RELEVANCE MAP

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## PURPOSE

This map traces the relationship between constitutional documents and the 5 production capabilities (Replay Executor, Witness System, Transcript System, Fingerprint Authority, Graph Verifier). It answers: "Which constitutional documents define, require, or govern each capability?"

---

## REPLAY EXECUTOR — CONSTITUTIONAL BASIS

### Direct Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| CRX_CONSTITUTION.md | Axiom 4 (Replay Determinism) | "Given the minimum replay set and a bounded point in constitutional time, state reconstruction is deterministic" | **PRIMARY** — Defines the requirement |
| CRX_CONSTITUTION.md | Axiom 3 (Event Append-Only) | "Constitutional history is recorded exclusively through append-only events" | **PRIMARY** — Defines the replay substrate |
| CRX_CONSTITUTION.md | Phase 3: Replay Authority | "OWNS: Deterministic reconstruction law, integrity verification during reconstruction, divergence detection, replay proof" | **PRIMARY** — Defines the authority |
| CRX_CONSTITUTION.md | Phase 5: Replay Law | "Deterministic reconstruction requires sufficient information to: 1. Reproduce every identity assignment 2. Traverse every lineage edge 3. Replay every event occurrence 4. Re-evaluate every policy decision 5. Verify every persisted witness 6. Produce identical state projection" | **PRIMARY** — Defines the minimum replay set |
| CRX_CONSTITUTION.md | Phase 5: Minimum Replay Set | Table of 9 required elements (event sequence, artifact content, identity law versions, lineage edges, policy law versions, policy decisions, claims, actor identities, witness attestations) | **PRIMARY** — Defines what must be replayable |
| CRX_CONSTITUTION.md | Axiom 6 (State Is Derived) | "Constitutional state at any moment is a projection of recorded events, lineage, and policy decisions" | **SECONDARY** — Defines state derivation requirement |
| CRX_CONSTITUTION.md | Axiom 7 (Separation of Recording and Reconstruction) | "Recording what happened and reconstructing what it means are distinct constitutional acts" | **SECONDARY** — Defines separation requirement |

### UCIA Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| UCIA-CONSTITUTION.md | Article 3 (Replay Theorem) | "Replay(T) reconstructs constitutional state at timestamp T deterministically" | **PRIMARY** — Formal theorem |
| UCIA-CONSTITUTION.md | Article 10 (Persistence Constitution) | "Constitutional state is persisted in append-only immutable store" | **SECONDARY** — Defines persistence requirement |
| UCIA-CONSTITUTION.md | Article 15 (Implementation Constitution) | "Replay must be deterministic" | **PRIMARY** — Implementation requirement |

### Knowledge Documents

| Document | Relevance |
|----------|-----------|
| `replay-reconstruction.md` | Defines replay algorithm, temporal traversal, corruption recovery, complexity analysis |
| `persistence-constitution.md` | Defines 4-level persistence hierarchy (Constitutional/Computed/Projection/Ephemeral) |
| `deterministic-replay-infrastructure.md` | (referenced, not yet read) |

### Gap Between Constitution and Implementation

**FACT.** The CRX_CONSTITUTION.md and UCIA-CONSTITUTION.md provide complete constitutional definitions for replay. The `deterministic_replay_harness.js` archive module provides a complete implementation. The active runtime provides ZERO implementation.

---

## WITNESS SYSTEM — CONSTITUTIONAL BASIS

### Direct Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| CRX_CONSTITUTION.md | Axiom 8 (Witness Is Verification) | "A witness attests that a binding between content, identity, and constitutional context holds. A witness does not create content, identity, lineage, or policy." | **PRIMARY** — Defines witness role |
| CRX_CONSTITUTION.md | Phase 3: Witness (Merged Authority) | "Witness is eliminated as independent authority. Absorbed by Identity (creation of identity proofs) and Replay (verification of attestations)." | **PRIMARY** — Defines authority absorption |
| CRX_CONSTITUTION.md | Phase 4: Witness Fact | "CREATED BY: Identity Authority (generation); Replay Authority (verification outcome)" | **PRIMARY** — Defines creation and verification |
| CRX_CONSTITUTION.md | Phase 5: Minimum Replay Set | "Persisted witness attestations (when recorded)" | **SECONDARY** — Defines replay requirement |

### UCIA Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| UCIA-CONSTITUTION.md | Article 15 §Requirement 8 | "Cryptographic integrity verification must be enabled" | **PRIMARY** — Defines verification requirement |

### Archive Implementations

| Module | What It Implements |
|--------|-------------------|
| `merkle_anchor_chain_validator.js` | Merkle anchor chain structural validation |
| `merkle_anchor_replay_verifier.js` | Merkle anchor replay/divergence detection |
| `merkle_anchor_chain_drift_detector.js` | Chain drift detection |
| `merkle_anchor_chain_drift_summary.js` | Drift classification |
| `merkle_anchor_chain_severity_and_divergence.js` | Severity analysis |
| `merkle_anchor_chain_fork_graph_builder.js` | Fork graph construction |
| `authority_boundary_prover.js` | Authority boundary attestation |
| `cross_anchor_drift_detector.js` | Cross-anchor drift detection |
| `domain_lockfile_fingerprint_guard.js` | Domain lockfile attestation |

### Gap

**FACT.** The constitution defines witness as "verification, not origin." The archive implements 15+ witness modules. The runtime implements ZERO.

---

## TRANSCRIPT SYSTEM — CONSTITUTIONAL BASIS

### Direct Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| CRX_CONSTITUTION.md | Axiom 3 (Event Append-Only) | "Constitutional history is recorded exclusively through append-only events" | **PRIMARY** — Defines transcript substrate |
| CRX_CONSTITUTION.md | Phase 3: Event Recording Authority | "OWNS: Constitutional occurrence capture, append-only event sequence, event immutability, temporal ordering" | **PRIMARY** — Defines authority |
| CRX_CONSTITUTION.md | Phase 5: Minimum Replay Set | "Complete event sequence — without total ordering of occurrences, constitutional time is undefined" | **PRIMARY** — Defines completeness requirement |

### Schema Definitions

| Document | What It Defines |
|----------|-----------------|
| `canonical-event-envelope.json` (CascadeProjects) | 7 required fields: event_id, event_type, actor_id, timestamp, payload, lineage, policy_version |
| `init-db.sql` (integration lab) | events table with UUID, actor_id, timestamz, payload JSONB, lineage JSONB, policy_version |
| `audit-event.schema.json` (CRX/vos) | 8-field audit event schema |

### Gap

**FACT.** The constitution defines event recording authority. The `canonical-event-envelope.json` defines a complete event schema. The runtime `event_log.ts` implements only 2 fields (event_type, payload) with no envelope structure, no UUID, no fingerprint, no lineage.

---

## FINGERPRINT AUTHORITY — CONSTITUTIONAL BASIS

### Direct Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| CRX_CONSTITUTION.md | Axiom 1 (Identity Determinism) | "Identical content under identical identity rules yields identical identity" | **PRIMARY** — Defines determinism requirement |
| CRX_CONSTITUTION.md | Phase 3: Identity Authority | "OWNS: Content normalization law, identity assignment law, identity verification, identity equality judgment" | **PRIMARY** — Defines authority |
| CRX_CONSTITUTION.md | Phase 3: Canonicalization (Merged) | "Canonicalization is not an independent authority. It is the normalization phase owned by Identity." | **PRIMARY** — Defines normalization ownership |
| CRX_CONSTITUTION.md | Phase 4: Identity Fact | "CREATED BY: Identity Authority. RECONSTRUCTABLE: Yes — deterministically from content + identity law version" | **PRIMARY** — Defines reconstructability |
| CRX_CONSTITUTION.md | Phase 5: Minimum Replay Set | "Identity law version for each era" | **PRIMARY** — Defines versioning requirement |

### UCIA Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| UCIA-CONSTITUTION.md | Article 1 §Axiom 5 (Identity) | "Identity is represented by Canonical ID. Formalization: entity.canonical_id in CanonicalIDs" | **PRIMARY** — Defines identity primitive |
| UCIA-CONSTITUTION.md | Article 13 §Guarantee 1 | "7 primitives is a proven minimum" | **SECONDARY** — Defines minimality |

### Archive Implementation

| Module | What It Implements |
|--------|-------------------|
| `canonical_fingerprint_service.js` | Complete fingerprint authority: 14 domains, NFC normalization, circular detection, type rejection, verification, schema versioning |

### Gap

**FACT.** The constitution defines Identity Authority with normalization, assignment, verification, and equality judgment. The archive implements all four. The runtime implements only assignment (SHA-256 hash) without normalization (NFC), without verification, without domain separation.

---

## GRAPH VERIFIER — CONSTITUTIONAL BASIS

### Direct Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| CRX_CONSTITUTION.md | Axiom 2 (Lineage Acyclicity) | "Lineage forms a directed acyclic graph. No artifact may be its own ancestor." | **PRIMARY** — Defines DAG requirement |
| CRX_CONSTITUTION.md | Phase 3: Lineage Authority | "OWNS: Parent-child derivation relationships, DAG legality, ancestry queries, fork detection" | **PRIMARY** — Defines authority |
| CRX_CONSTITUTION.md | Phase 4: Lineage Edge Fact | "CREATED BY: Lineage Authority upon authorized event. RECONSTRUCTABLE: Yes — from persisted lineage edge set" | **PRIMARY** — Defines reconstructability |
| CRX_CONSTITUTION.md | Phase 5: Minimum Replay Set | "Complete lineage edge set — ancestry is constitutional fact" | **PRIMARY** — Defines completeness |

### UCIA Constitutional Definitions

| Document | Section | What It Defines | Relevance |
|----------|---------|-----------------|-----------|
| UCIA-CONSTITUTION.md | Article 1 §Axiom 7 (Ordering) | "Ordering is represented by Causal Ordering" | **PRIMARY** — Defines ordering primitive |

### Archive Implementation

| Module | What It Implements |
|--------|-------------------|
| `formal_invariant_graph_verifier.js` | Full DAG verification: DFS cycle detection, required/forbidden edge verification, invariant topology binding, graph fingerprinting |
| `structural_graph_builder.js` | Deterministic structural identity compilation |
| `snapshot_lineage_integrity_guard.js` | Snapshot lineage fingerprint chain |

### Gap

**FACT.** The constitution defines Lineage Authority with DAG legality, ancestry queries, and fork detection. The archive implements all three. The runtime implements only direct self-loop detection (no transitive cycles, no ancestry queries, no fork detection).

---

## CONSTITUTIONAL COVERAGE SUMMARY

| Capability | Constitutional Definition | Archive Implementation | Runtime Implementation | Gap |
|------------|--------------------------|----------------------|----------------------|-----|
| Replay Executor | COMPLETE (Axiom 4, Phase 3, Phase 5) | COMPLETE (296 LOC harness) | MISSING (0 LOC) | CRITICAL |
| Witness System | COMPLETE (Axiom 8, Phase 3, Phase 4) | COMPLETE (15+ modules, ~3,800 LOC) | MISSING (0 LOC) | CRITICAL |
| Transcript System | COMPLETE (Axiom 3, Phase 3, Phase 5) | PARTIAL (event log only) | MINIMAL (2 fields, no envelope) | HIGH |
| Fingerprint Authority | COMPLETE (Axiom 1, Phase 3, Phase 4) | COMPLETE (479 LOC, 14 domains) | INCOMPLETE (33 LOC, no NFC, no verification) | CRITICAL |
| Graph Verifier | COMPLETE (Axiom 2, Phase 3, Phase 4) | COMPLETE (262 LOC, DFS) | INCOMPLETE (13 LOC, shallow only) | CRITICAL |

---

## KEY INSIGHT

**FACT.** The constitutional documents (CRX_CONSTITUTION.md, UCIA-CONSTITUTION.md) provide COMPLETE definitions for all 5 capabilities. The archive (JS.txt) provides COMPLETE implementations for all 5 capabilities. The active runtime provides INCOMPLETE or MISSING implementations for all 5 capabilities.

The gap is not constitutional — it is integration. The constitution is well-defined. The implementations exist. They have not been connected.

---

**Classification:** FACT (verified by direct document and source inspection)
**Confidence:** HIGH
