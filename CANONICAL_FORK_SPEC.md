# CANONICAL FORK SPECIFICATION

**Document ID:** CANONICAL-FORK-SPEC-1.0  
**Status:** CONSTITUTIONAL  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS  
**Amendment:** Requires constitutional amendment process

---

## SECTION 0 — DECLARATION

This specification defines canonical fork handling for PING.

Canonical fork handling is permanent constitutional substrate.

Mistakes propagate permanently.

No modifications after Phase B freeze.

---

## SECTION 1 — FORK REALITY

### Constitutional Law

**Forks may occur.**

**Fragmentation cannot be prevented.**

### Fork Definition

Fork is:
- Protocol divergence
- Constitutional divergence
- Witness divergence
- Event stream divergence

### Fork Examples

Forks occur in:
- Git
- Bitcoin
- Ethereum
- Mastodon
- ActivityPub
- AT Protocol

---

## SECTION 2 — FORK OBSERVABILITY

### Constitutional Law

**Fragmentation MUST be cryptographically observable.**

**Canonical lineage divergence MUST be detectable.**

### Observability Requirements

Fork observability MUST:
- Detect protocol divergence
- Detect constitutional divergence
- Detect witness divergence
- Detect event stream divergence

### Observability Algorithm

```
detect_fork(ledger_a, ledger_b):
  divergence_point = find_divergence_point(ledger_a, ledger_b)
  if divergence_point:
    return fork_detected(divergence_point)
  return no_fork
```

---

## SECTION 3 — CANONICAL LINEAGE DIVERGENCE

### Constitutional Law

**Canonical lineage divergence MUST be detectable.**

### Divergence Detection

Canonical lineage divergence detection MUST:
- Identify divergence point
- Verify canonical lineage
- Detect divergent branches
- Maintain divergence history

### Divergence Algorithm

```
detect_lineage_divergence(lineage_a, lineage_b):
  divergence_point = find_common_ancestor(lineage_a, lineage_b)
  divergent_branch_a = lineage_a.from(divergence_point)
  divergent_branch_b = lineage_b.from(divergence_point)
  return divergence_point, divergent_branch_a, divergent_branch_b
```

---

## SECTION 4 — CANONICAL BRANCH IDENTIFICATION

### Constitutional Law

**Canonical branch MUST be identifiable.**

### Identification Requirements

Canonical branch identification MUST:
- Identify canonical branch
- Verify canonical signatures
- Verify canonical witnesses
- Verify canonical events

### Identification Algorithm

```
identify_canonical_branch(divergent_branches):
  canonical_branch = null
  for branch in divergent_branches:
    if verify_canonical_signatures(branch):
      if verify_canonical_witnesses(branch):
        canonical_branch = branch
  return canonical_branch
```

---

## SECTION 5 — FORK RESOLUTION

### Constitutional Law

**Fork resolution MUST maintain constitutional truth.**

### Resolution Requirements

Fork resolution MUST:
- Identify canonical branch
- Verify canonical signatures
- Reconcile divergent branches
- Maintain constitutional truth

### Resolution Algorithm

```
resolve_fork(divergent_branches):
  canonical_branch = identify_canonical_branch(divergent_branches)
  for branch in divergent_branches:
    if branch != canonical_branch:
      mark_branch_divergent(branch)
  return canonical_branch
```

---

## SECTION 6 — FORK PREVENTION

### Constitutional Law

**Fork prevention is impossible.**

**Fork observability is required.**

### Prevention Reality

Fork prevention is impossible because:
- Physics allows copies
- Any actor can fork software
- Distributed systems can diverge
- Protocol evolution can diverge

### Observability Alternative

Instead of prevention:
- Detect forks
- Observe forks
- Resolve forks
- Maintain canonical truth

---

## SECTION 7 — FORK DOCUMENTATION

### Constitutional Law

**Forks MUST be documented.**

### Documentation Requirements

Fork documentation MUST:
- Record fork event
- Record divergence point
- Record divergent branches
- Record resolution decision

### Documentation Algorithm

```
document_fork(divergence_point, divergent_branches, resolution):
  fork_event = emit_fork_event(
    divergence_point=divergence_point,
    divergent_branches=divergent_branches,
    resolution=resolution
  )
  return fork_event
```

---

## SECTION 8 — CONSTITUTIONAL CONSTRAINTS

### Constraint 1: Fork Reality

Forks may occur.
Fragmentation cannot be prevented.

### Constraint 2: Fork Observability

Fragmentation MUST be cryptographically observable.
Canonical lineage divergence MUST be detectable.

### Constraint 3: Canonical Identification

Canonical branch MUST be identifiable.
Canonical branch MUST be verifiable.

### Constraint 4: Fork Resolution

Fork resolution MUST maintain constitutional truth.
Fork resolution MUST be documented.

### Constraint 5: Fork Documentation

Forks MUST be documented.
Fork documentation MUST record divergence, branches, resolution.

---

## SECTION 9 — FINAL PRINCIPLE

Forks may occur.
Fragmentation cannot be prevented.
Fragmentation MUST be cryptographically observable.
Canonical lineage divergence MUST be detectable.

**Constitutional Law:**
Forks may occur.
Fragmentation MUST be cryptographically observable.
Canonical lineage divergence MUST be detectable.

---

**Document ID:** CANONICAL-FORK-SPEC-1.0  
**Status:** CONSTITUTIONAL  
**Amendment:** Requires constitutional amendment process
