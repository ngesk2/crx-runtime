# RETRIEVAL LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Retrieval discipline and constitutional context requirements only. No implementation details.

---

# RETRIEVAL DISCIPLINE

## Constitutional Retrieval Requirement

Before ANY agent mutation, retrieval MUST include:

- **Invariants** — Current invariant definitions and constraints
- **Replay law** — Active replay law version and constraints
- **Authority ownership** — Authority jurisdiction and ownership boundaries
- **ADRs** — Relevant Architecture Decision Records
- **Lineage restrictions** — Lineage constraints and DAG rules
- **Policy boundaries** — Active policy constraints and authorization rules
- **Mutation permissions** — Actor authority and mutation authorization

---

# UNGOVERNED COGNITION

## Definition

Agents acting WITHOUT constitutional retrieval are engaged in **ungoverned cognition**.

**CONSEQUENCE:** Ungoverned cognition leads to recursive architectural drift.

---

## Prohibited Actions

Agents MUST NOT mutate without retrieval of:
1. Current invariant definitions
2. Active replay law
3. Authority ownership boundaries
4. Relevant ADRs
5. Lineage restrictions
6. Policy boundaries
7. Mutation permissions

---

# RETRIEVAL CONTEXT

## Required Context Elements

### Invariant Context

- Current invariant definitions
- Invariant version
- Invariant violation consequences
- Invariant enforcement mechanisms

### Replay Context

- Active replay law version
- Replay constraints
- Replay determinism requirements
- Replay verification requirements

### Authority Context

- Authority jurisdiction boundaries
- Authority ownership
- Authority interdependencies
- Authority versioning

### ADR Context

- Relevant Architecture Decision Records
- ADR status (accepted, deprecated, superseded)
- ADR implications for mutation
- ADR versioning

### Lineage Context

- Lineage DAG constraints
- Lineage acyclicity requirements
- Lineage edge rules
- Lineage verification requirements

### Policy Context

- Active policy constraints
- Policy authorization rules
- Policy version
- Policy evaluation requirements

### Mutation Context

- Actor authority
- Mutation permissions
- Mutation pipeline requirements
- Mutation verification requirements

---

# RETRIEVAL VERIFICATION

## Verification Requirements

Retrieval MUST be verified for:
- **Completeness** — All required context elements present
- **Accuracy** — Context matches current constitutional state
- **Currency** — Context reflects latest constitutional amendments
- **Consistency** — Context elements are internally consistent

---

## Retrieval Failure

Retrieval failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Be recorded in event stream

---

# RETRIEVAL AUTHORITY

## Authority Ownership

Retrieval authority is **NOT** a constitutional authority.

Retrieval is a **constitutional discipline** enforced by:
- Policy Authority (retrieval requirements)
- Replay Authority (retrieval verification)
- Mutation Law (retrieval as prerequisite)

---

## Retrieval Implementation

Retrieval implementation MUST:
- Be deterministic
- Be infrastructure-independent
- Be versioned
- Be replay-verifiable
- Not introduce new authorities

---

# RETRIEVAL FAILURE SEMANTICS

## Failure Classification

Retrieval failures MUST be deterministic:
- **INCOMPLETE_RETRIEVAL:** Required context elements missing
- **STALE_RETRIEVAL:** Context does not reflect latest constitutional state
- **INCONSISTENT_RETRIEVAL:** Context elements are internally inconsistent
- **UNAUTHORIZED_RETRIEVAL:** Retrieval exceeds actor authority

## Failure Handling

Retrieval failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Be recorded in event stream

---

# RETRIEVAL IN MUTATION PIPELINE

## Retrieval Stage

Retrieval occurs **before** policy evaluation:

```
Proposal → Retrieval → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion
```

---

## Retrieval Prerequisite

Retrieval is a **prerequisite** for:
- Claim submission
- Policy evaluation
- Mutation authorization

Without retrieval, mutation is prohibited.

---

# RETRIEVAL AND AGENT SAFETY

## Recursive Agent Safety

Agents MUST NOT:
- Create authorities without constitutional retrieval
- Rewrite replay law without constitutional retrieval
- Redefine invariants without constitutional retrieval
- Bypass witness generation without constitutional retrieval
- Promote embeddings into truth without constitutional retrieval
- Mutate kernel semantics without constitutional retrieval

---

## Retrieval Deny-List

Explicit deny-lists MUST prevent:
- Authority creation without retrieval
- Replay law modification without retrieval
- Invariant redefinition without retrieval
- Witness bypass without retrieval
- Embedding promotion without retrieval
- Kernel mutation without retrieval

---

**Document ID:** CONSTITUTION-RETRIEVAL-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
