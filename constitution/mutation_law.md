# MUTATION LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Mutation authorization and legality only. No implementation details.
**Root Law:** TRUTH_LAW.md (truth = immutable verified event), STATE_TRANSITION_LAW.md (state transitions)
**Date:** 2026-06-24

---

# MUTATION AUTHORIZATION

## Axiom 1 — Policy Primacy

**AXIOM:** No constitutional mutation may take effect without an explicit, recorded policy decision authorizing it.

**RATIONALE:** Raw occurrence is not legitimacy. Authority, constraints, and governance must gate what becomes durable constitutional fact.

**VIOLATION CONSEQUENCE:** Unauthorized state change, shadow governance, actors gain de facto authority without audit trail.

---

# ALLOWED MUTATIONS

## Definition

Mutations that satisfy all constitutional requirements and are authorized through the legal mutation pipeline.

## Allowed Mutation Requirements

A mutation is allowed ONLY when:

```yaml
allowed_mutation:
  policy_verified:
    required: true
    condition: policy decision explicitly authorizes mutation
    verification: policy decision recorded as event
  
  authority_verified:
    required: true
    condition: actor has constitutional authority for mutation domain
    verification: authority class matches mutation domain
  
  witness_exists:
    required: true
    condition: witness attestation exists for mutation
    verification: witness hash matches recomputed witness
  
  lineage_verified:
    required: true
    condition: mutation preserves lineage acyclicity
    verification: lineage DAG constraints satisfied
  
  identity_verified:
    required: true
    condition: identity is deterministic under declared law
    verification: identity matches content under IDENTITY_LAW.md
  
  invariant_satisfied:
    required: true
    condition: mutation satisfies all constitutional invariants
    verification: invariant verification passes
```

## Legal Mutation Path

The ONLY legal mutation path is:

```
Proposal → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion
```

Any mutation bypassing this pipeline is a constitutional violation.

---

# PROHIBITED MUTATIONS

## Definition

Mutations that violate constitutional requirements or bypass the legal mutation pipeline.

## Prohibited Mutation Types

### direct_state_edit

**Definition:** Direct modification of state without event recording

**Examples:**
- Direct database update
- Direct file system modification
- Direct memory state mutation
- Direct cache modification

**Constitutional Violation:** Bypasses event recording, policy evaluation, replay, witness

**Severity:** CRITICAL

**Consequence:** Constitutional incident, state corruption, replay divergence

---

### bypass_verification

**Definition:** Mutation that skips required verification gates

**Examples:**
- Skip policy evaluation
- Skip authority verification
- Skip witness generation
- Skip lineage verification
- Skip identity verification

**Constitutional Violation:** Bypasses constitutional verification requirements

**Severity:** CRITICAL

**Consequence:** Constitutional incident, unauthorized mutation, truth corruption

---

### unverifiable_mutation

**Definition:** Mutation that cannot be verified through replay

**Examples:**
- Mutation without event recording
- Mutation without witness attestation
- Mutation without policy decision
- Mutation without actor identity
- Mutation without lineage trace

**Constitutional Violation:** Mutation is not replay-verifiable

**Severity:** CRITICAL

**Consequence:** Constitutional incident, replay divergence, audit trail fracture

---

### shadow_governance

**Definition:** Mutation that lacks recorded policy decision but takes effect

**Examples:**
- Implicit authority assumption
- Unrecorded policy decisions
- Hidden state mutation
- Runtime singleton mutation
- Cache-driven truth overwrite

**Constitutional Violation:** Shadow governance (actors gain authority without governance)

**Severity:** CRITICAL

**Consequence:** Constitutional incident, authority drift, governance bypass

---

### mutable_identifier_mutation

**Definition:** Mutation that changes immutable identifiers

**Examples:**
- Change content_hash
- Change event_id
- Change object_id
- Change lineage_id

**Constitutional Violation:** Violates IDENTITY_LAW.md (identity immutability)

**Severity:** CRITICAL

**Consequence:** Constitutional incident, identity corruption, replay divergence

---

### lineage_cycle_mutation

**Definition:** Mutation that creates cycles in lineage DAG

**Examples:**
- Create circular lineage reference
- Create duplicate lineage edges
- Reference non-existent parent

**Constitutional Violation:** Violates lineage acyclicity invariant

**Severity:** CRITICAL

**Consequence:** Constitutional incident, lineage corruption, replay failure

---

### invariant_violation_mutation

**Definition:** Mutation that violates constitutional invariants

**Examples:**
- Violate event immutability
- Violate truth classification
- Violate authority hierarchy
- Violate replay determinism

**Constitutional Violation:** Violates constitutional invariants

**Severity:** CRITICAL

**Consequence:** Constitutional incident, invariant violation, system failure

---

# MUTATION VERIFICATION GATE

## Verification Requirements

Before any mutation takes effect, it must pass the verification gate:

```yaml
verification_gate:
  input:
    - mutation_proposal
    - actor_identity
    - policy_decision
    - mutation_domain
  
  verification_steps:
    1. policy_verification:
        - Check if policy decision exists
        - Check if policy decision authorizes mutation
        - Check if policy decision is recorded as event
    
    2. authority_verification:
        - Check if actor has authority for mutation domain
        - Check if authority class matches domain
        - Check if authority is constitutional
    
    3. witness_verification:
        - Check if witness exists for mutation
        - Check if witness hash matches recomputed witness
        - Check if witness signature is valid
    
    4. lineage_verification:
        - Check if lineage is acyclic
        - Check if lineage edges are valid
        - Check if lineage trace exists
    
    5. identity_verification:
        - Check if identity is deterministic
        - Check if identity matches content
        - Check if identity is immutable
    
    6. invariant_verification:
        - Check if all invariants are satisfied
        - Check if no constitutional violations
        - Check if state is consistent
  
  output:
    - verification_result: PASS | FAIL
    - rejection_reason: string (if FAIL)
  
  failure_action:
    - Reject mutation
    - Open constitutional incident
    - Record rejection reason
```

---

# Policy Primacy

**AXIOM:** No constitutional mutation may take effect without an explicit, recorded policy decision authorizing it.

**RATIONALE:** Raw occurrence is not legitimacy. Authority, constraints, and governance must gate what becomes durable constitutional fact.

**VIOLATION CONSEQUENCE:** Unauthorized state change, shadow governance, actors gain de facto authority without audit trail.

---

# MUTATION PIPELINE

## Legal Mutation Path

The ONLY legal mutation path is:

```
Proposal → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion
```

Any mutation bypassing this pipeline is a constitutional violation.

---

## Mutation Stages

### Stage 1: Proposal

**ACTOR:** Any actor capable of initiating constitutional occurrence

**ACTION:** Submit proposal for mutation

**REQUIREMENTS:**
- Actor identity must be established
- Proposal must reference affected artifacts or lineage
- Proposal must include mutation intent and parameters

---

### Stage 2: Claim

**AUTHORITY:** Claim Authority (subsumed under Event Recording)

**ACTION:** Record claim as propositional assertion

**REQUIREMENTS:**
- Claim must be recorded as event
- Claim must include actor identity
- Claim must reference proposal details
- Claim must be immutable once recorded

---

### Stage 3: Policy Evaluation

**AUTHORITY:** Policy Authority

**ACTION:** Evaluate claim against active policy law

**REQUIREMENTS:**
- Policy law version must be declared
- Evaluation must be deterministic
- Evaluation must consider all relevant constraints
- Evaluation must produce explicit decision

---

### Stage 4: Policy Decision

**AUTHORITY:** Policy Authority

**ACTION:** Record policy decision as fact

**REQUIREMENTS:**
- Decision must be recorded as event
- Decision must be immutable once recorded
- Decision must reference claim
- Decision must include disposition (approved/denied)
- Decision must include reasoning

---

### Stage 5: Event Recording

**AUTHORITY:** Event Recording Authority

**ACTION:** Record mutation event with policy decision

**REQUIREMENTS:**
- Event must be append-only
- Event must include actor identity
- Event must include policy decision reference
- Event must be immutable once recorded
- Event must be ordered in constitutional sequence

---

### Stage 6: Replay

**AUTHORITY:** Replay Authority

**ACTION:** Replay event to reconstruct state

**REQUIREMENTS:**
- Replay must use minimum replay set
- Replay must be deterministic
- Replay must verify lineage integrity
- Replay must verify policy decision validity
- Replay must verify invariants

---

### Stage 7: Witness

**AUTHORITY:** Identity Authority (generation) + Replay Authority (verification)

**ACTION:** Generate witness attestation

**REQUIREMENTS:**
- Witness must be deterministic
- Witness must be verifiable
- Witness must commit to all replay facts
- Witness must be infrastructure-independent

---

### Stage 8: State Promotion

**AUTHORITY:** State Authority

**ACTION:** Promote reconstructed state to current

**REQUIREMENTS:**
- State must be derived from replay
- State must not override recorded substrate
- State must be invalidatable on replay divergence
- State must be projection, not source of truth

---

# ILLEGAL MUTATION PATHS

## Forbidden Direct Mutations

The following mutation paths are ILLEGAL:

1. **Direct DB update** — Bypasses event recording, policy evaluation, replay, witness
2. **Runtime singleton mutation** — Bypasses event recording, policy evaluation, replay, witness
3. **Cache-driven truth overwrite** — Bypasses event recording, policy evaluation, replay, witness
4. **In-memory authority mutation** — Bypasses event recording, policy evaluation, replay, witness
5. **Implicit runtime state mutation** — Bypasses event recording, policy evaluation, replay, witness
6. **Hidden state mutation** — Bypasses event recording, policy evaluation, replay, witness

---

## Shadow Governance

Any mutation that:
- Lacks recorded policy decision
- Lacks event recording
- Lacks replay verification
- Lacks witness attestation
- Lacks actor identity

Is **shadow governance** and is a constitutional violation.

---

# MUTATION CONSTRAINTS

## Actor Authority

Actors MUST:
- Have established identity
- Have defined authority context
- Submit mutations through legal pipeline
- Accept policy decisions

Actors MUST NOT:
- Mutate state directly
- Bypass policy evaluation
- Create authorities without constitutional amendment
- Rewrite replay law
- Redefine invariants

---

## Policy Constraints

Policy MUST:
- Be versioned
- Be recorded as constitutional fact
- Be deterministic in evaluation
- Be explicit in authorization or denial
- Be traceable in event stream

Policy MUST NOT:
- Be implicit convention
- Be mutable without amendment
- Be ambiguous in authorization
- Be bypassed by any actor

---

## Lineage Constraints

Lineage mutations MUST:
- Preserve acyclicity
- Prevent duplicate edges
- Record parent-child relationships as events
- Verify parent existence
- Be replay-verifiable

Lineage mutations MUST NOT:
- Create cycles
- Create duplicate edges
- Reference non-existent parents
- Bypass event recording

---

## Identity Constraints

Identity mutations MUST:
- Be deterministic under declared law
- Be computed from content
- Be verifiable independently
- Be recorded as fact
- Be immutable once assigned

Identity mutations MUST NOT:
- Be assigned arbitrarily
- Be mutable without amendment
- Depend on external state
- Bypass canonicalization

---

# MUTATION VERIFICATION

## Replay Verification

All mutations MUST be:
- Replayable from minimum replay set
- Verifiable against recorded policy decisions
- Verifiable against lineage integrity
- Verifiable against invariants
- Verifiable against witness attestations

---

## Integrity Verification

All mutations MUST satisfy:
- Lineage acyclicity
- Identity consistency
- Policy authorization
- Invariant satisfaction
- Witness attestation

Any mutation failing verification is a constitutional violation.

---

# MUTATION FAILURE SEMANTICS

## Failure Classification

Mutation failures MUST be deterministic:
- **UNAUTHORIZED_MUTATION:** Mutation lacks required policy authorization
- **INVALID_LINEAGE:** Lineage mutation violates DAG constraints
- **IDENTITY_DIVERGENCE:** Identity does not match content under declared law
- **POLICY_VIOLATION:** Mutation violates active policy constraints
- **INVARIANT_VIOLATION:** Mutation violates invariant
- **ACTOR_UNAUTHORIZED:** Actor lacks authority for proposed mutation

## Failure Handling

Mutation failures MUST:
- Fail deterministically with structured failure codes
- Never allow partial mutation
- Never allow shadow completion
- Provide sufficient context for diagnosis
- Be recorded in event stream

---

**Document ID:** CONSTITUTION-MUTATION-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
