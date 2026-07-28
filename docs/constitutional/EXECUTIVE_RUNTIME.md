# Executive Runtime

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Define agent consumption. Agents never see Git, files, or sources. Agents consume Knowledge, Capability, Assessment, Plan, and Certificate.

---

## Overview

The Executive Runtime is where agents appear. Agents never see Git, files, or sources. Agents consume only canonical objects: Knowledge, Capability, Assessment, Plan, and Certificate. This ensures that agents operate on verified, constitutional knowledge rather than raw sources.

---

## Agent Consumption

### Agent Input

Agents consume the following canonical objects:

**Knowledge:**
- Immutable semantic knowledge compiled from Facts, Evidence, Relationships, and Constitution
- Contains zero subjective fields
- Contains only things replay can regenerate

**Capability:**
- Abstract capabilities derived from Knowledge
- Examples: Search, Authentication, Payment, Logging, Metrics, Deployment

**Assessment:**
- Mutable assessment of Knowledge
- Contains subjective fields: Confidence, Trust, Freshness, Risk, Priority, Quality, Complexity, Security, Coverage

**Plan:**
- Executable intent generated from Knowledge, Capability, Policy, and Goal
- Contains executable steps and worker assignments

**Certificate:**
- Certificates that verify correctness
- Examples: Witness Certificate, Verification Certificate, Signature Certificate, Audit Certificate

---

### Agent Output

Agents produce the following canonical objects:

**Plan:**
- Updated plans based on execution
- New plans for new goals

**Assessment:**
- Updated assessments based on execution
- New assessments for new knowledge

**Certificate:**
- Execution certificates
- Verification certificates

---

## Agent Constraints

### Agent Forbidden Actions

Agents MUST NOT:

**Direct Source Access:**
- Never see Git repositories
- Never see files
- Never see sources
- Never see raw artifacts

**Direct Evidence Access:**
- Never see raw evidence
- Never see raw facts
- Never see raw relationships

**Direct Compiler Access:**
- Never invoke compiler stages
- Never modify compiler pipeline
- Never bypass compiler

**Direct Knowledge Modification:**
- Never modify Knowledge
- Never mutate Knowledge
- Never delete Knowledge

**Direct Assessment Modification:**
- Never modify Assessment (except through Assessment Authority)
- Never mutate Assessment (except through Assessment Authority)

---

### Agent Required Actions

Agents MUST:

**Canonical Object Consumption:**
- Consume Knowledge
- Consume Capability
- Consume Assessment
- Consume Plan
- Consume Certificate

**Canonical Object Production:**
- Produce Plan
- Produce Assessment
- Produce Certificate

**Constitutional Compliance:**
- Respect constitutional constraints
- Respect authority boundaries
- Respect knowledge immutability
- Respect assessment mutability

---

## Agent Pipeline

### Pipeline Position

Agents run after Planning and before Execution.

```
Planning → Plan
    ↓
Executive Runtime → Agent Execution
    ↓
Execution → Execution Results
```

**Invariant:** Agents consume canonical objects, not sources.

---

### Agent Execution Flow

**Input:**
- Knowledge
- Capability
- Assessment
- Plan
- Certificate

**Transformation:**
- Agent executes Plan
- Agent produces Execution Results
- Agent produces Updated Assessment
- Agent produces Execution Certificate

**Output:**
- Execution Results
- Updated Assessment
- Execution Certificate

---

## Agent Types

### Planning Agent

**Purpose:** Generate Plans from Knowledge, Capability, Policy, and Goal.

**Input:**
- Knowledge
- Capability
- Policy
- Goal

**Output:**
- Plan

**Invariant:** Planning Agent never sees sources.

---

### Execution Agent

**Purpose:** Execute Plans and produce Execution Results.

**Input:**
- Plan
- Knowledge
- Capability

**Output:**
- Execution Results
- Execution Certificate

**Invariant:** Execution Agent never sees sources.

---

### Assessment Agent

**Purpose:** Generate Assessments from Knowledge.

**Input:**
- Knowledge

**Output:**
- Assessment

**Invariant:** Assessment Agent never sees sources.

---

### Verification Agent

**Purpose:** Verify Knowledge and produce Certificates.

**Input:**
- Knowledge
- Plan
- Execution Results

**Output:**
- Certificate

**Invariant:** Verification Agent never sees sources.

---

## Agent Authority

### Agent Authority Boundaries

**Planning Agent:**
- Authority: Planning Authority
- Scope: Plan generation
- Constraints: Constitutional constraints, Policy constraints

**Execution Agent:**
- Authority: Execution Authority
- Scope: Plan execution
- Constraints: Constitutional constraints, Capability constraints

**Assessment Agent:**
- Authority: Assessment Authority
- Scope: Assessment generation
- Constraints: Constitutional constraints, Knowledge constraints

**Verification Agent:**
- Authority: Verification Authority
- Scope: Certificate generation
- Constraints: Constitutional constraints, Replay constraints

---

### Agent Authority Invariants

1. **Authority Isolation:** Agents operate within their authority boundaries.
2. **Authority Delegation:** Agents can delegate to other agents within authority boundaries.
3. **Authority Verification:** Agents verify authority before actions.
4. **Authority Logging:** Agents log all authority actions.

---

## Agent Communication

### Agent Communication Protocol

Agents communicate through canonical objects:

**Planning Agent → Execution Agent:**
- Planning Agent produces Plan
- Execution Agent consumes Plan

**Execution Agent → Assessment Agent:**
- Execution Agent produces Execution Results
- Assessment Agent consumes Execution Results

**Assessment Agent → Verification Agent:**
- Assessment Agent produces Assessment
- Verification Agent consumes Assessment

**Verification Agent → Planning Agent:**
- Verification Agent produces Certificate
- Planning Agent consumes Certificate

**Invariant:** Agents communicate through canonical objects, not through direct API calls.

---

## Agent State

### Agent State Management

**Agent State:**
- Agents maintain internal state during execution
- Agent state is not canonical
- Agent state is not persisted
- Agent state is reset on replay

**Canonical State:**
- Agents produce canonical objects as output
- Canonical objects are persisted
- Canonical objects are replayable
- Canonical objects are verifiable

**Invariant:** Agent state is not canonical. Only canonical objects are persisted.

---

## Agent Replay

### Agent Replay Strategy

**Replay Process:**
1. Replay Agent Input (Knowledge, Capability, Assessment, Plan, Certificate)
2. Replay Agent Execution
3. Verify Agent Output (Execution Results, Updated Assessment, Execution Certificate)

**Replay Invariants:**
1. **Determinism:** Same inputs produce same outputs.
2. **Purity:** No side effects on canonical objects.
3. **Locality:** Only inspect declared inputs.
4. **Replayability:** Can be replayed independently.

---

### Agent Replay Verification

**Verification Strategy:**
1. Replay Agent Execution independently.
2. Compare replay outputs with original outputs.
3. Verify Execution Results match.
4. Verify Updated Assessment matches.
5. Verify Execution Certificate matches.

**Success Conditions:**
- Replay outputs match original outputs.
- Execution Results match.
- Updated Assessment matches.
- Execution Certificate matches.

**Failure Modes:**
- Non-deterministic agent execution
- Side effects on canonical objects
- Global lookups during agent execution
- Runtime state during agent execution

---

## Agent Failure Modes

### Failure Modes

**Planning Agent Failure:**
- Unable to generate Plan
- Plan violates constraints
- Plan is incomplete

**Execution Agent Failure:**
- Unable to execute Plan
- Execution violates constraints
- Execution is incomplete

**Assessment Agent Failure:**
- Unable to generate Assessment
- Assessment violates constraints
- Assessment is inconsistent

**Verification Agent Failure:**
- Unable to verify Knowledge
- Verification violates constraints
- Verification is inconsistent

---

### Failure Recovery

**Recovery Strategy:**
1. Identify the agent that failed.
2. Investigate the cause of failure.
3. Fix the cause of failure.
4. Replay the agent.
5. Verify agent succeeds.

---

## Agent Tooling

### Agent Tools

**Planning Tools:**
- Plan generator
- Plan validator
- Plan visualizer

**Execution Tools:**
- Plan executor
- Execution monitor
- Execution debugger

**Assessment Tools:**
- Assessment generator
- Assessment validator
- Assessment visualizer

**Verification Tools:**
- Knowledge verifier
- Certificate generator
- Certificate validator

---

## Agent Anti-Patterns

### Anti-Pattern: Agent Direct Source Access

**Problem:** Agent direct source access leads to constitutional violations.

**Solution:** Agents consume canonical objects, not sources.

---

### Anti-Pattern: Agent Direct Knowledge Modification

**Problem:** Agent direct knowledge modification leads to knowledge corruption.

**Solution:** Agents never modify Knowledge. Agents produce Assessment.

---

### Anti-Pattern: Agent Direct Compiler Access

**Problem:** Agent direct compiler access leads to compiler bypass.

**Solution:** Agents never invoke compiler stages. Agents consume compiler outputs.

---

### Anti-Pattern: Agent State Persistence

**Problem:** Agent state persistence leads to non-deterministic behavior.

**Solution:** Agent state is not persisted. Only canonical objects are persisted.

---

## Agent Success Criteria

1. **Canonical Object Consumption:** Agents consume only canonical objects (Knowledge, Capability, Assessment, Plan, Certificate).
2. **Canonical Object Production:** Agents produce only canonical objects (Plan, Assessment, Certificate).
3. **Source Isolation:** Agents never see sources (Git, files, raw artifacts).
4. **Knowledge Immutability:** Agents never modify Knowledge.
5. **Assessment Mutability:** Agents produce Assessment through Assessment Authority.
6. **Authority Compliance:** Agents respect authority boundaries.
7. **Determinism:** Same inputs produce same outputs.
8. **Replayability:** Agent execution can be replayed.
9. **Verifiability:** Agent outputs can be verified.

---

## Executive Runtime Invariants

1. **Canonical Object Consumption:** Agents consume only canonical objects.
2. **Canonical Object Production:** Agents produce only canonical objects.
3. **Source Isolation:** Agents never see sources.
4. **Knowledge Immutability:** Agents never modify Knowledge.
5. **Assessment Mutability:** Agents produce Assessment through Assessment Authority.
6. **Authority Compliance:** Agents respect authority boundaries.
7. **Determinism:** Same inputs produce same outputs.
8. **Replayability:** Agent execution can be replayed.
9. **Verifiability:** Agent outputs can be verified.

---

## Executive Runtime Pipeline

### Complete Pipeline

```
External Sources
    ↓
Discovery → Source
    ↓
Acquisition → Artifact
    ↓
Parsing → Evidence
    ↓
Fact Extraction → Fact
    ↓
Relationship → Relationship
    ↓
Knowledge Compilation → Knowledge
    ↓
Optimization Passes → Optimized Knowledge
    ↓
Assessment → Assessment
    ↓
Capability → Capability
    ↓
Planning → Plan
    ↓
Executive Runtime → Agent Execution
    ↓
Execution → Execution Results
    ↓
Verification → Certificate
```

**Invariant:** Agents consume canonical objects, not sources.

---

## Executive Runtime Success Criteria

1. **Canonical Object Consumption:** Agents consume only canonical objects.
2. **Canonical Object Production:** Agents produce only canonical objects.
3. **Source Isolation:** Agents never see sources.
4. **Knowledge Immutability:** Agents never modify Knowledge.
5. **Assessment Mutability:** Agents produce Assessment through Assessment Authority.
6. **Authority Compliance:** Agents respect authority boundaries.
7. **Determinism:** Same inputs produce same outputs.
8. **Replayability:** Agent execution can be replayed.
9. **Verifiability:** Agent outputs can be verified.
10. **Pipeline Completeness:** Pipeline is complete from sources to certificates.

---

**Status:** DRAFT
**Version:** 1.0
