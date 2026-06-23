# MUTATION LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Mutation authorization and legality only. No implementation details.

---

# MUTATION AUTHORIZATION

## Policy Primacy

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
