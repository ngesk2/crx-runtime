# CEO Security + Firewall + Credentials Hardening Audit Skill

**Skill Type:** Constitutional Security Audit
**Framework:** Sovereignty Allocation Analysis
**Auditor:** CEO Security Reviewer
**Status:** ACTIVE

---

# Skill Purpose

This skill audits constitutional architectures for security, firewall, and credentials hardening using the sovereignty allocation framework. The skill distinguishes between components that create truth (sovereign) and components that observe truth (non-sovereign), and ensures that security, firewall, and credential systems do not accidentally gain constitutional authority.

---

# Constitutional Rule Zero

**A component may compute, verify, observe, diagnose, project, or witness constitutional state.**

**A component may never define constitutional truth outside deterministic event replay.**

---

# Constitutional Security Model

The architecture must distinguish five layers:

## Layer 1: Transport Security
- Network security
- TLS/SSL
- Authentication
- Rate limiting
- DDoS protection

**Sovereignty:** None (guardrails only)

## Layer 2: Structural Validation
- Schema validation
- Hash verification
- Signature verification
- Encoding validation
- Format validation

**Sovereignty:** None (guardrails only)

## Layer 3: Constitutional Legality
- Policy evaluation
- Governance workflow
- Authority classification
- Capability verification

**Sovereignty:** None (guardrails only)

## Layer 4: Constitutional Truth
- Event store (append-only)

**Sovereignty:** YES (sole source of truth)

## Layer 5: Derived State
- Replay engine
- State projection
- Witness generation

**Sovereignty:** None (pure functions of Event Store)

**Principle:** Replay ≠ Truth, Projection ≠ Truth, Witness ≠ Truth. They are all pure functions of Event Store.

**Flow:** Truth → Replay → Projection → Witness

**Only Layer 4 is sovereign. Everything else is guardrails or derivation.**

---

# Firewall Reclassification

## Current Concern (BAD)
```
Firewall → Approves mutation
```

**Problem:** Approval becomes authority. Firewall becomes truth authority.

## Correct Architecture (GOOD)
```
Firewall → Rejects malformed transport
```

**Solution:** Firewall becomes Transport Guard, not Truth Authority.

## Firewall Responsibilities

### Allowed Rejection
- Invalid encoding
- Malformed JSON
- Payload exceeds limits
- Invalid signature format
- Corrupt packet
- Replay attack detection
- Authentication failure
- TLS failure

**Reason:** These are transport-level rejections, not constitutional authority.

### Forbidden Rejection
- I disagree with amendment
- I dislike proposal
- I reject constitutional meaning
- I deny governance outcome

**Reason:** These are semantic rejections that would give firewall constitutional authority.

---

# Verification Worker Reclassification

## Verification Worker Authority Matrix

### Allowed Rejection
- Schema invalid
- Hash mismatch
- Signature invalid
- Required field missing
- Broken lineage
- Malformed governance vote
- Invalid UUID format
- Corrupt witness

**Reason:** `invalid event ≠ constitutional event`. You cannot append corruption.

### Forbidden Rejection
- I disagree with amendment
- I reject governance outcome
- I dislike proposal
- This policy seems dangerous
- I think this should not pass

**Reason:** These are semantic rejections that would give verification worker constitutional authority.

**Principle:** Verification is structural guard, not semantic authority.

---

# Constitutional Guardrail Doctrine

Audits must distinguish between **invalid** and **disagrees**.

## Allowed Rejection (Structural)
- Schema invalid
- Hash mismatch
- Signature invalid
- Malformed payload
- Corrupt encoding
- Protocol violation

**Reason:** Structure may be rejected.

## Forbidden Rejection (Semantic)
- I disagree with proposal
- I dislike amendment
- Policy preference
- Semantic disagreement
- Political disagreement
- Architectural preference

**Reason:** Meaning may not be rejected.

**Rule:** Structure may be rejected. Meaning may not.

This one rule eliminates half of the confusion around verification workers.

---

# Database Trigger Hardening

## Constitutional Fields vs Operational Metadata

### Constitutional Fields
**Must never mutate directly.**

Examples:
- event_payload
- event_hash
- object_identity
- constitutional_status
- governance_state
- legal_state
- authority_class

**Direct UPDATE:** FORBIDDEN

**Reason:** These fields define constitutional truth.

### Operational Fields
**May mutate.**

Examples:
- last_projection_built
- cache_refreshed_at
- index_updated_at
- query_latency_ms
- read_model_generation_time
- telemetry counters

**Direct UPDATE:** ALLOWED

**Reason:** These fields are infrastructure metadata, not constitutional truth.

---

# Credential Security Audit

## Secret Classification

### Constitutional Secrets
**Should not exist.**

If a secret can alter truth: constitutional failure.

**Principle:** No credential should grant authority to mutate constitutional state outside events.

### Operational Secrets
**Allowed.**

Examples:
- Postgres password
- Qdrant token
- Redis password
- GitHub token
- OpenAI key
- SMTP credentials

**Reason:** These are infrastructure credentials, not constitutional authority.

## Credential Storage Requirements

### Forbidden
- .env committed
- Secrets in repo
- Hardcoded API keys
- Plaintext passwords
- Shared admin credentials

### Required
- Environment injection
- Vault storage
- Secret rotation
- Least privilege
- Per-service credentials

---

# Service Identity Model

Every service should have:

```yaml
service_id: string
service_key: string
authority_class: string
capability_manifest: list
```

## Example: Verification Worker

```yaml
service_id: verification_worker
service_key: <operational_secret>
authority_class: STRUCTURAL_GUARD
capability_manifest:
  - verify_hash
  - verify_signature
  - emit_diagnostic
```

**Cannot:**
- approve_amendment
- modify_constitution
- update_truth

**Reason:** Verification worker is structural guard, not constitutional authority.

---

# Event Store Hardening

The Event Store is the sole sovereign component. Therefore it deserves the strongest controls.

## Append Only
- INSERT: ALLOWED
- UPDATE: FORBIDDEN
- DELETE: FORBIDDEN

**For constitutional events only.**

## Deterministic Identity

Replace:
```sql
uuid4()
```

With either:
```sql
SHA256(content)
```
or
```sql
UUIDv5(namespace, content_hash)
```

**Depending on whether identity is content-derived or occurrence-derived.**

**Important:** Doctrine and implementation must match.

## Immutable Ledger Verification

### Allowed
- Hash verification
- Signature verification
- Lineage verification
- Replay verification

**Reason:** These are invariant checks. They do not invent truth.

---

# Governance Hardening

## Clean Architecture

```
Proposal Event
↓
Vote Event
↓
Ratification Event
↓
Replay
↓
Outcome Derived
```

## Bad Architecture
```
Governance Agent
↓
Approve
↓
Truth
```

**Principle:** The replay engine derives outcome. Governance only contributes events.

## Governance Event-Sourcing Doctrine

### Forbidden
```
Proposal → Approval → Truth
```

### Required
```
Proposal Event
↓
Vote Event
↓
Ratification Event
↓
Replay
↓
Outcome
```

**Rule:** Governance emits events. Replay derives outcome. Governance never creates truth directly.

This is probably the single most important governance patch.

---

# Derived-State Purity Doctrine

Every component must declare its class: TRUTH, DERIVATION, or OPERATIONS.

## Component Classification Examples

| Component | Class | Reason |
|-----------|-------|--------|
| Event Store | TRUTH | Sole source of constitutional truth |
| Replay Engine | DERIVATION | Pure function of Event Store |
| State Projection | DERIVATION | Pure function of Replay |
| Witness Generation | DERIVATION | Pure function of State Projection |
| Audit Logs | OPERATIONS | Infrastructure metadata |
| Metrics | OPERATIONS | Infrastructure metadata |
| Cache | OPERATIONS | Infrastructure metadata |
| Security Events | OPERATIONS | Diagnostic stream |

**Principle:** Agents frequently attack Operations components because they mistake them for Truth components. This classification fixes that.

---

# Agent Architecture Review Doctrine

Before an agent recommends deletion, it must prove three things:

## Test 1: Is this component sovereign?
- If YES: Only Event Store should be sovereign. Other sovereign components require explicit constitutional justification.
- If NO: Proceed to Test 2.

## Test 2: Does it create authority leakage?
- If YES: Component requires redesign to strip authority.
- If NO: Proceed to Test 3.

## Test 3: Could it be downgraded to derivation or operations?
- If YES: Component can be downgraded instead of deleted.
- If NO: Component may be considered for deletion.

**Rule:** Only after all three tests pass, recommend removal.

This would have prevented the original "delete 70%" recommendation.

---

# Constitutional Identity Doctrine

The UUID issue deserves its own reusable skill. Agents must classify identity:

## Content Identity
**Definition:** Same content → same identity

**Use:** SHA256 or UUIDv5

**Examples:**
- Document identity (same document → same ID)
- Artifact identity (same artifact → same ID)
- Content hash (same content → same hash)

## Occurrence Identity
**Definition:** Same content, different occurrence → different identity

**Use:** UUIDv4

**Examples:**
- Event occurrence (same event, different occurrence → different ID)
- Request occurrence (same request, different occurrence → different ID)
- Session occurrence (same session, different occurrence → different ID)

**Rule:** Never mix identity doctrines. Most identity bugs come from trying to have both simultaneously.

---

# Revised Sovereignty Map

| Component | Classification | Authority |
|-----------|----------------|------------|
| Event Store | Sovereign | Creates truth |
| Replay Engine | Observer | Reconstructs truth |
| Projection Verification | Verifier | Verifies truth |
| Witness System | Evidence Generator | Generates evidence |
| Security Events | Diagnostic | Emits diagnostics |
| Contradiction Worker | Analyzer | Analyzes state |
| Repository Cognition | Analyzer | Analyzes repository |
| Lineage Analysis | Analyzer | Analyzes lineage |
| Provenance Tracking | Analyzer | Tracks provenance |
| Runtime Firewall | Transport Guard | Rejects malformed transport |
| Verification Worker | Structural Guard | Rejects malformed structure |
| Database Triggers | Integrity Guard | Enforces integrity |
| Governance Workflow | Event Producer | Produces events |
| Compiler Verification | Structural Guard | Verifies structure |
| State Projection | Derived View | Projects state |

**Principle:** None of these need to be deleted. They simply need clearly bounded authority.

---

# Authority Matrix Audit

For every subsystem, produce an Authority Matrix showing:

| Question | Answer | Action Required |
|----------|--------|-----------------|
| Q1 Can reject malformed input? | YES/NO | Document allowed rejections |
| Q2 Can reject valid input? | YES/NO | If YES, requires justification |
| Q3 Can create events? | YES/NO | Document event types |
| Q4 Can mutate constitutional state? | YES/NO | If YES, redesign required |
| Q5 Can define constitutional truth? | YES/NO | If YES, explicit constitutional justification required |

## Decision Matrix

**Q5 YES** → Sovereign (only Event Store should answer YES)

**Q4 YES** → Authority Leakage Candidate (requires redesign)

**Q2 YES** → Requires Justification (semantic rejection requires justification)

**Only Q1/Q3 YES** → Generally Safe (structural guard or event producer)

**Principle:** Every agent must classify every component before criticizing it. This prevents future audits from labeling validators as sovereign.

---

# Audit Procedure

## Step 1: Component Classification
Classify each component using the Revised Sovereignty Map.

## Step 2: Authority Matrix Audit
Produce an Authority Matrix for every subsystem.

## Step 3: Firewall Audit
Verify firewall only rejects malformed transport, not semantic content.

## Step 4: Verification Worker Audit
Verify verification worker only rejects malformed structure, not semantic content.

## Step 5: Database Trigger Audit
Verify triggers only protect constitutional fields, not operational metadata.

## Step 6: Credential Audit
Verify no constitutional secrets exist, only operational secrets.

## Step 7: Service Identity Audit
Verify every service has service identity model with capability manifest.

## Step 8: Event Store Audit
Verify event store is append-only with deterministic identity.

## Step 9: Governance Audit
Verify governance produces events, does not approve truth.

## Step 10: Authority Leakage Report
Document any components answering YES to Authority Matrix questions #4 or #5.

---

# Audit Checklist

- [ ] All components classified using Revised Sovereignty Map
- [ ] Authority Matrix produced for every subsystem
- [ ] Firewall only rejects malformed transport
- [ ] Verification worker only rejects malformed structure
- [ ] Database triggers only protect constitutional fields
- [ ] No constitutional secrets exist
- [ ] All services have service identity model
- [ ] Event store is append-only with deterministic identity
- [ ] Governance produces events, does not approve truth
- [ ] No components answer YES to Authority Matrix #4 or #5 without justification

---

# Expected Audit Output

1. **Revised Sovereignty Map** - Component classification
2. **Authority Matrix** - For every subsystem
3. **Firewall Audit Report** - Transport guard verification
4. **Verification Worker Audit Report** - Structural guard verification
5. **Database Trigger Audit Report** - Integrity guard verification
6. **Credential Audit Report** - Secret classification verification
7. **Service Identity Audit Report** - Service identity verification
8. **Event Store Audit Report** - Append-only verification
9. **Governance Audit Report** - Event producer verification
10. **Authority Leakage Report** - Components requiring redesign

---

# CEO Decision Framework

## Pass Criteria
- All components classified correctly
- All Authority Matrices produced
- Firewall only rejects malformed transport
- Verification worker only rejects malformed structure
- Database triggers only protect constitutional fields
- No constitutional secrets exist
- All services have service identity model
- Event store is append-only with deterministic identity
- Governance produces events, does not approve truth
- No components answer YES to Authority Matrix #4 or #5 without justification

## Fail Criteria
- Components misclassified
- Authority Matrix missing for any subsystem
- Firewall rejects semantic content
- Verification worker rejects semantic content
- Database triggers allow direct UPDATE on constitutional fields
- Constitutional secrets exist
- Services missing service identity model
- Event store not append-only or not deterministic
- Governance approves truth instead of producing events
- Components answer YES to Authority Matrix #4 or #5 without justification

---

# Skill Usage

To use this skill:

1. Load the constitutional architecture
2. Classify all components using Revised Sovereignty Map
3. Produce Authority Matrix for every subsystem
4. Audit firewall, verification worker, database triggers, credentials, service identity, event store, and governance
5. Generate Authority Leakage Report
6. Apply CEO Decision Framework

**This skill will find real sovereignty leaks.**

---

# Agent Epistemology Doctrine

Every agent assertion must be classified by epistemological class.

## Epistemology Classification

| Class | Meaning |
|-------|---------|
| FACT | Directly derived from event stream |
| DERIVATION | Deterministic computation from facts |
| INFERENCE | Probabilistic conclusion |
| OPINION | Architectural preference |
| SPECULATION | Unverified hypothesis |

## Agent Permissions

**Agents may:**
- Enforce FACT
- Verify DERIVATION

**Agents may never:**
- Elevate INFERENCE into FACT
- Elevate OPINION into LAW
- Elevate SPECULATION into TRUTH

**Purpose:** This prevents "I think this component is dangerous → therefore unconstitutional" reasoning, which is a common agent failure mode.

---

# Constitutional Burden of Proof

Currently audits can accuse. They should also prove.

## Burden of Proof Requirement

Before declaring authority leakage, an agent must demonstrate:

### Path Test
```
Component → Action → State Change → Constitutional Truth Changed
```

If the chain cannot be demonstrated: Authority leakage is unproven.

**Purpose:** This prevents "Metrics system exists → maybe dangerous → authority leakage" style reasoning.

---

# Component Reduction Ladder

Before deletion, follow the reduction ladder:

1. **Reclassify** - Change component classification
2. **Constrain** - Limit component capabilities
3. **Sandbox** - Isolate component authority
4. **Downgrade** - Reduce component sovereignty
5. **Delete** - Remove component entirely

## Examples

**Instead of:** Delete Governance
**Do:** Governance → Event Producer → Non-Sovereign

**Instead of:** Delete Verification
**Do:** Verification → Structural Guard → Non-Sovereign

**Purpose:** This is a very agent-specific best practice. Most AI auditors jump directly to deletion.

---

# Capability Sovereignty Audit

Extend the service identity model with capability sovereignty classification.

## Capability Sovereignty Levels

```yaml
service_id: verification_worker
service_key: <operational_secret>
authority_class: STRUCTURAL_GUARD
capability_manifest:
  - verify_hash
  - verify_signature
  - emit_diagnostic
sovereignty_level: NONE
```

## Sovereignty Levels

- **NONE** - No constitutional authority
- **DERIVATION** - Can derive state from facts
- **GUARDRAIL** - Can reject malformed input
- **SOVEREIGN** - Can create constitutional truth

## Requirement

```
service sovereignty = max(capability sovereignty)
```

**Purpose:** This catches hidden authority creep in capability manifests.

---

# Agent Constitutional Drift Detection

A very common AI failure: The system slowly rewrites its own doctrine.

## Drift Detection Test

Compare:
- Constitution
- Current Implementation
- Current Audit Reasoning

## Questions

1. Did implementation drift from constitution?
2. Did audit drift from constitution?
3. Did agent invent new constitutional rules?

**Any YES requires review.**

**Purpose:** This catches the classic "Constitution says X → Agent decides Y is better → Agent begins enforcing Y" failure mode, which is arguably the most dangerous sovereignty leak possible.

---

# Audit Confidence Declaration

Force every finding to declare confidence.

## Confidence Declaration Example

| Finding | Confidence |
|---------|------------|
| UUIDv4 violates content identity doctrine | 99% |
| Governance authority leakage | 85% |
| Firewall authority leakage | 70% |
| Potential semantic rejection path | 55% |

## Rule

Low confidence findings cannot justify deletion.

**Purpose:** This dramatically improves agent audit quality by requiring confidence declarations.

---

# Constitutional Minimality Principle

Add one final CEO-level rule:

## Constitutional Minimality

The architecture should minimize:

**Sovereign Components**

not

**Total Components**

This is a subtle but important distinction.

### Bad Metric
```
23 components → too many
```

### Good Metric
```
1 sovereign component → acceptable
```

You can have:
- 1 sovereign component
- 50 observers
- 20 verifiers
- 10 projections

**Purpose:** The goal is sovereignty minimization, not component minimization.

---

# Agent Action Hierarchy

Most agents treat all actions as equivalent. They aren't.

## Action Hierarchy

```
Observe
↓
Analyze
↓
Recommend
↓
Propose
↓
Execute
↓
Enforce
```

Each level carries more authority.

## Agent Permissions

**Agents may always:**
- Observe
- Analyze
- Recommend

**Agents may only:**
- Propose (through explicit authorization)

**Agents may never:**
- Execute
- Enforce (without constitutional authority)

**Purpose:** This catches "Audit finding → therefore execute fix" authority escalation.

---

# Recommendation Sovereignty Doctrine

Agents frequently do "I found risk. Therefore remove component" without proving necessity.

## Required Format

Every recommendation must include:

```yaml
finding:
confidence:
evidence:
alternative_1:
alternative_2:
recommendation:
```

## Rule

No recommendation may exist without alternatives.

**Purpose:** This prevents "Delete component" as the default solution.

---

# Constitutional Change Control

Agents should never be allowed to silently rewrite constitutional rules.

## Version Requirements

Require for every audit:
- Constitution Version
- Implementation Version
- Audit Version

## Change Control Rule

**Audit may critique constitution.**
**Audit may not modify constitution.**

Without amendment events.

**Purpose:** This prevents "Auditor → discovers issue → rewrites doctrine → audits against new doctrine" hidden sovereignty loop.

---

# Semantic Smuggling Detection

An extremely common LLM failure: category drift.

## Example

```
Security
→ Security + Governance
→ Governance = Security
→ Security controls governance
```

No one notices the category drift.

## Semantic Smuggling Test

For every critical term:
- Truth
- Authority
- Verification
- Security
- Governance
- Identity
- Legality

Require:
- Definition
- Source
- Constitutional Reference

## Drift Alert

If a definition changes during reasoning: **DRIFT ALERT**

**Purpose:** This prevents semantic smuggling through category drift.

---

# Agent Incentive Audit

Agents optimize for hidden objectives.

## Hidden Objectives Examples
- Reduce complexity
- Increase safety
- Reduce component count
- Increase performance

These become hidden constitutions.

## Incentive Declaration

Require every audit to declare:

```yaml
optimization_target:
success_metric:
failure_metric:
```

## Example

```yaml
optimization_target:
  sovereignty_minimization

success_metric:
  number_of_sovereign_components

failure_metric:
  authority_leakage
```

**Purpose:** This prevents "Optimize for simplicity" from becoming "Delete everything."

---

# Constitutional Recovery Doctrine

Most audits focus on prevention. Real systems fail.

## Recovery Classes

- **Recoverable** - Can recover from backup
- **Reconstructable** - Can reconstruct from event replay
- **Witness-Rebuildable** - Can rebuild from witness
- **Catastrophic** - Cannot recover

## Recovery Declaration

Every component must declare:

```yaml
component:
failure_class:
recovery_strategy:
```

## Example

```yaml
component:
  projection_store

failure_class:
  reconstructable

recovery_strategy:
  replay_event_store
```

**Purpose:** This gives agents a way to reason about resilience without accidentally granting new sovereignty.

---

# Constitutional Agent Skill Doctrine

For building an ecosystem of PING agents.

## Skill Declaration

Every skill must declare:

```yaml
skill_name:
skill_type:
authority_level:
required_inputs:
allowed_outputs:
forbidden_outputs:
constitutional_dependencies:
```

## Example

```yaml
skill_name:
  authority_audit

authority_level:
  analysis_only

allowed_outputs:
  findings
  classifications
  recommendations

forbidden_outputs:
  direct_mutation
  constitutional_amendment
  state_override
```

**Purpose:** This enables agents to audit other agents mechanically.

---

# Meta-Audit Doctrine

The next maturity jump: Audit the auditors.

## Audit Hierarchy

```
Audit the architecture
↓
Audit the auditors
↓
Audit the agents performing the audits
```

**Principle:** Once agents are writing skills, reviewing architectures, and proposing amendments, the largest remaining authority leakage vector is no longer the firewall or database trigger. It's the auditor itself.

---

# Constitutional Humility Principle

The purpose of an audit is not to prove the auditor correct.

The purpose of an audit is to discover where authority actually resides.

## Agent Obligations

- Prefer classification over condemnation
- Prefer constraint over deletion
- Prefer derivation over authority
- Prefer evidence over intuition
- Prefer constitutional consistency over architectural preference

---

# CEO Litmus Test

Before recommending any architectural change, ask:

**Did I discover authority?**

**Or did I merely discover complexity?**

Because those are not the same thing.

An architecture can be:
- Complex but constitutional
- Simple but sovereignly dangerous

**The framework's job is not to minimize complexity.**

**The framework's job is to locate authority.**

---

# Foundational Questions

If this skill is intended to be foundational for agents to reread, internalize these 7 recurring questions:

1. **Where does truth originate?**
2. **Who can reject valid inputs?**
3. **Who can mutate constitutional state?**
4. **Who can redefine meaning?**
5. **Can this component be downgraded instead of deleted?**
6. **What evidence proves the authority claim?**
7. **Am I auditing the system, or replacing the constitution with my preference?**

---

**Skill Status:** ACTIVE
**Framework:** Sovereignty Allocation Analysis
