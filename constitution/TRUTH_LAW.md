# TRUTH LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Formal definition of truth within the constitutional framework. Root constitutional law.
**Supersedes:** source_of_truth_law.md (domain ownership), OBJECT_STATE_LAW.md (truth claims)
**Date:** 2026-06-24

---

## Article 1 — Constitutional Truth

### 1.1 Definition

Constitutional truth is an **immutable verified event** in the authoritative event store (Postgres).

```
Truth = Immutable Verified Event
```

### 1.2 Properties

A constitutional truth MUST satisfy all of:

```yaml
truth:
  immutable:        true    # Once committed, never modified
  verified:         true    # Passed mechanical verification
  event_sourced:    true    # Recorded as event in Postgres
  deterministic:    true    # Derivable from replay
  content_addressed: true   # Referenced by content hash
```

### 1.3 What Truth Is NOT

The following are explicitly **not truth**:

```yaml
non_truth:
  - inference              # Model output, not verified event
  - embedding              # Vector representation, not event
  - vector                 # Numerical projection, not event
  - summary                # Derived text, not source event
  - memory                 # Agent context, not verified
  - model_output           # Generated content, not committed
  - observation            # Unverified perception
  - candidate_claim        # Unverified proposition
  - qdrant_vector          # Projection, not event store
  - agent_output           # Agent generation, not constitutional
```

**Constitutional Invariant:**

```
Truth ≠ Projection
Truth ≠ Embedding
Truth ≠ Agent Output
Truth = Immutable Verified Event
```

---

## Article 2 — Derived Truth

### 2.1 Definition

Derived truth is a **deterministic replay projection** computed from constitutional truth.

### 2.2 Properties

```yaml
derived_truth:
  source:              constitutional_truth    # Must derive from verified events
  computation:         deterministic_replay    # Pure function of event stream
  reproducibility:     must_match             # Same input → same output
  non_authoritative:   true                    # Projection, not event
  verifiable:          true                    # Can be recomputed
```

### 2.3 Constraints

- Derived truth is a projection, not a new constitutional truth
- Derived truth may be cached for performance but never treated as authoritative
- Derived truth MUST be reproducible from the event stream
- Derived truth MUST NOT be used to create constitutional claims
- Derived truth is subordinate to the constitutional truth it derives from

---

## Article 3 — Non-Truth Classification

### 3.1 Inference

```yaml
inference:
  classification:     non_truth
  reason:             model_output_is_not_event
  authority:          none
  verification:       false
  projection:         permitted
```

### 3.2 Embedding

```yaml
embedding:
  classification:     non_truth
  reason:             vector_is_not_event
  authority:          none
  verification:       false
  projection:         permitted
```

### 3.3 Summary

```yaml
summary:
  classification:     non_truth
  reason:             derived_text_is_not_source
  authority:          none
  verification:       false
  projection:         permitted
```

### 3.4 Memory

```yaml
agent_memory:
  classification:     non_truth
  reason:             context_is_not_event
  authority:          none
  verification:       false
  projection:         permitted
```

### 3.5 Candidate Claim

```yaml
candidate_claim:
  classification:     non_truth
  reason:             unverified_proposition
  authority:          none
  verification:       false
  projection:         prohibited
```

---

## Article 4 — Truth Verification

### 4.1 Verification Gate

Every event that claims constitutional truth MUST pass verification:

```yaml
verification:
  artifact_hash_check:   required   # payload_hash == sha256(content)
  event_hash_check:      required   # event_id exists and matches
  lineage_check:         required   # lineage_depth > 0
  witness_check:         required   # witness_count > 0
  projection_valid:      required   # status == 'projected'
```

Only after all five checks pass may an event be considered constitutional truth.

### 4.2 Authority Requirement

Truth MUST trace to a single root authority.

```yaml
authority:
  must_trace_to_single_root: true
  source:                    postgres_event_store
  verification:              constitutional_replay
```

---

## Article 5 — Enforcement

### 5.1 Violation Classification

| Violation | Severity | Response |
|-----------|----------|----------|
| Inference treated as truth | CRITICAL | Remove inference from truth context |
| Embedding treated as truth | CRITICAL | Remove vector from truth context |
| Agent output treated as truth | CRITICAL | Remove agent output from truth context |
| Unverified event treated as truth | CRITICAL | Verify event or remove |
| Projection treated as truth | HIGH | Label as projection, not truth |
| ML model output treated as truth | CRITICAL | Tag as AI_GENERATED_ANALYSIS |

### 5.2 Truth Audit

Every constitutional session MUST verify:

1. No inference content in truth registry
2. No embedding in truth registry
3. No unverified events in truth registry
4. All truth entries pass verification gate
5. All truth entries trace to single root authority

---

## Article 6 — Relationship to Other Laws

- **source_of_truth_law.md** — Defines truth domain ownership (one authority per domain). THIS law defines what truth IS.
- **OBJECT_STATE_LAW.md** — Object truth claims are subordinate to event truth.
- **REPLAY_LAW.md** — Replay produces derived truth (projections), not constitutional truth.
- **WITNESS_LAW.md** — Witness verifies truth; witness is not itself truth.

---

## Article 7 — Constitutional Invariants

```yaml
invariants:
  truth_immutability:
    immutable_verified_event_only: required
    inference_is_not_truth:        required
    embedding_is_not_truth:        required
    agent_output_is_not_truth:     required
    projection_is_not_truth:       required
    qdrant_is_not_truth:           required
```

---

**Document ID:** CONSTITUTION-TRUTH-LAW-1.0
**Status:** FROZEN
**Root Law:** This document is root constitutional law. It may only be amended through the constitutional amendment process.
