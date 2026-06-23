# RETRIEVAL DISCIPLINE SWEEP

**Status:** AUDIT IN PROGRESS
**Purpose:** Verify agent mutations include constitutional retrieval
**Goal:** Prevent ungoverned cognition

---

# CONSTITUTIONAL RETRIEVAL REQUIREMENTS

Before ANY agent mutation, retrieval MUST include:

1. **Invariants** — Current invariant definitions and constraints
2. **Replay law** — Active replay law version and constraints
3. **Authority ownership** — Authority jurisdiction and ownership boundaries
4. **ADRs** — Relevant Architecture Decision Records
5. **Lineage restrictions** — Lineage constraints and DAG rules
6. **Policy boundaries** — Active policy constraints and authorization rules
7. **Mutation permissions** — Actor authority and mutation authorization

---

# AGENT SYSTEMS AUDIT

## Agent Systems Inventory

| System | Location | Status | Retrieval Implemented? |
|--------|----------|--------|------------------------|
| Agent Runtime | agents/ | NOT IMPLEMENTED | N/A |
| Agent Orchestration | orchestration/ | NOT IMPLEMENTED | N/A |
| Agent Workers | workers/ | NOT IMPLEMENTED | N/A |
| Gateway | gateway/server.js | IMPLEMENTED | NO |

---

## Gateway Analysis

**Location:** gateway/server.js

**Purpose:** HTTP API gateway for Ollama integration

**Agent Status:** Gateway is infrastructure, not agent system

**Retrieval Implementation:** NO

**Analysis:**
- Gateway is infrastructure layer (Layer 3)
- Gateway does not perform constitutional mutations
- Gateway delegates to Ollama for inference
- Gateway does not require constitutional retrieval

**Conclusion:** Gateway does not require retrieval discipline as it is infrastructure, not agent system.

---

# UNGOVERNED COGNITION AUDIT

## Ungoverned Cognition Definition

Agents acting WITHOUT constitutional retrieval of:
- Invariants
- Replay law
- Authority ownership
- ADRs
- Lineage restrictions
- Policy boundaries
- Mutation permissions

Are engaged in **ungoverned cognition**.

---

## Ungoverned Cognition Detection

**Search:** Agent systems without retrieval implementation

**Finding:** No agent systems implemented

**Status:** CLEAN

**Evidence:**
- No agent runtime implemented
- No agent orchestration implemented
- No agent workers implemented
- Gateway is infrastructure, not agent system

---

# RETRIEVAL IMPLEMENTATION STATUS

## Retrieval Not Required

**Finding:** Retrieval discipline is not required in current codebase

**Reason:** No agent systems implemented

**Status:** NOT APPLICABLE

**Note:** When agent systems are implemented, retrieval discipline MUST be enforced.

---

# FUTURE RETRIEVAL REQUIREMENTS

## When Agent Systems Are Implemented

Retrieval MUST be implemented for:

1. **Agent Runtime**
   - Retrieve invariants before mutation
   - Retrieve replay law before mutation
   - Retrieve authority ownership before mutation
   - Retrieve ADRs before mutation
   - Retrieve lineage restrictions before mutation
   - Retrieve policy boundaries before mutation
   - Retrieve mutation permissions before mutation

2. **Agent Orchestration**
   - Retrieve invariants before orchestration
   - Retrieve replay law before orchestration
   - Retrieve authority ownership before orchestration
   - Retrieve ADRs before orchestration
   - Retrieve lineage restrictions before orchestration
   - Retrieve policy boundaries before orchestration
   - Retrieve mutation permissions before orchestration

3. **Agent Workers**
   - Retrieve invariants before task execution
   - Retrieve replay law before task execution
   - Retrieve authority ownership before task execution
   - Retrieve ADRs before task execution
   - Retrieve lineage restrictions before task execution
   - Retrieve policy boundaries before task execution
   - Retrieve mutation permissions before task execution

---

# RETRIEVAL VERIFICATION

## Retrieval Verification Requirements

Retrieval MUST be verified for:
- **Completeness** — All required context elements present
- **Accuracy** — Context matches current constitutional state
- **Currency** — Context reflects latest constitutional amendments
- **Consistency** — Context elements are internally consistent

---

## Retrieval Failure Handling

Retrieval failures MUST:
- Fail deterministically with structured failure codes
- Prevent mutation from proceeding
- Provide sufficient context for diagnosis
- Be recorded in event stream

---

# RETRIEVAL AUTHORITY

## Retrieval Authority Status

**Finding:** Retrieval authority is NOT a constitutional authority

**Status:** CORRECT

**Rationale:** Retrieval is a constitutional discipline, not an authority

**Enforced By:**
- Policy Authority (retrieval requirements)
- Replay Authority (retrieval verification)
- Mutation Law (retrieval as prerequisite)

---

# RETRIEVAL FAILURE SEMANTICS

## Failure Classification

Retrieval failures MUST be deterministic:
- **INCOMPLETE_RETRIEVAL:** Required context elements missing
- **STALE_RETRIEVAL:** Context does not reflect latest constitutional state
- **INCONSISTENT_RETRIEVAL:** Context elements are internally inconsistent
- **UNAUTHORIZED_RETRIEVAL:** Retrieval exceeds actor authority

---

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

# RETRIEVAL DISCIPLINE SUMMARY

## Current Status

**Finding:** Retrieval discipline is not applicable in current codebase

**Reason:** No agent systems implemented

**Status:** NOT APPLICABLE

**Evidence:**
- No agent runtime implemented
- No agent orchestration implemented
- No agent workers implemented
- Gateway is infrastructure, not agent system

---

## Future Requirements

When agent systems are implemented, retrieval discipline MUST be enforced:

1. **Retrieval before mutation** — All required context elements
2. **Retrieval verification** — Completeness, accuracy, currency, consistency
3. **Retrieval failure handling** — Deterministic failure codes
4. **Retrieval deny-list** — Explicit deny-lists for dangerous actions

---

# REMEDIATION PLAN

## No Immediate Remediation Required

The current retrieval discipline posture is compliant with constitutional retrieval law.

**Status:** COMPLIANT

**Notes:**
- When agent systems are implemented, retrieval discipline MUST be enforced
- Add retrieval verification to agent runtime
- Add retrieval deny-lists to agent runtime
- Add retrieval failure handling to agent runtime

---

# VERIFICATION CHECKLIST

When agent systems are implemented, verify:
- [ ] Retrieval includes invariants
- [ ] Retrieval includes replay law
- [ ] Retrieval includes authority ownership
- [ ] Retrieval includes ADRs
- [ ] Retrieval includes lineage restrictions
- [ ] Retrieval includes policy boundaries
- [ ] Retrieval includes mutation permissions
- [ ] Retrieval is verified for completeness
- [ ] Retrieval is verified for accuracy
- [ ] Retrieval is verified for currency
- [ ] Retrieval is verified for consistency
- [ ] Retrieval failures are deterministic
- [ ] Retrieval deny-list is implemented
- [ ] Retrieval prevents ungoverned cognition

---

**Document ID:** AUDIT-RETRIEVAL-DISCIPLINE-SWEEP-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
