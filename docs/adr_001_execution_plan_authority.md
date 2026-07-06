# ADR-001: ExecutionPlan Authority

**Status:** Proposed
**Date:** 2026-06-29
**Phase:** Ω.98 — Constitutional Implementation Directive — Adopt Before Build

---

## Problem

**Current State:**
ExecutionRuntime currently acts as both execution authority and execution interpreter. Runtime constructs execution flow procedurally from contracts, decides infrastructure call order, and manages lifecycle step sequencing. This violates constitutional principles:

1. **Runtime is not a pure interpreter:** Runtime owns execution graph construction and scheduling logic
2. **No immutable ExecutionPlan exists:** Execution flow is procedural, not declarative
3. **ExecutionPlan sovereignty is missing:** Runtime is still the execution authority
4. **No single source of truth for execution graph:** Execution flow is scattered across Runtime methods

**Constitutional Requirement:**
Runtime must become a pure interpreter of immutable execution plan artifacts. ExecutionPlan Authority must become the single constitutional authority for execution graph construction, dependency DAG construction, deterministic scheduling, retry semantics, and durable execution metadata.

---

## Alternatives Considered

### Alternative 1: Build Custom ExecutionPlan Authority

**Description:**
Design and implement ExecutionPlan Authority from scratch without reference to existing open-source workflow engines.

**Pros:**
- Complete control over design
- No external dependencies
- Tailored to constitutional requirements

**Cons:**
- Re-inventing well-solved problems
- High risk of subtle bugs in determinism logic
- No proven track record
- Misses opportunity to leverage mature battle-tested code
- Violates Ω.97 directive to mine proven open-source systems

**Constitutional Justification:**
**REJECTED** - Violates Ω.97 directive. Deterministic execution and replay are well-solved problems; re-inventing them is unnecessary risk.

---

### Alternative 2: Use Temporal as Infrastructure

**Description:**
Deploy Temporal Server and use Temporal as the execution infrastructure. Runtime becomes a Temporal client.

**Pros:**
- Leverages proven Temporal infrastructure
- Battle-tested determinism and replay
- Mature tooling and observability

**Cons:**
- Introduces heavy operational dependency (Temporal Server)
- Runtime becomes coupled to Temporal-specific APIs
- Violates capability abstraction (Runtime knows about Temporal)
- Vendor lock-in to Temporal ecosystem
- Constitutional Runtime should not depend on external infrastructure

**Constitutional Justification:**
**REJECTED** - Violates constitutional principle that Runtime must be infrastructure-agnostic. Runtime should not know about Temporal or any specific infrastructure.

---

### Alternative 3: Mine Temporal Concepts, Build Constitutional Authority

**Description:**
Study Temporal's deterministic execution model, extract the core concepts (event sourcing, command/event model, deterministic replay, workflow versioning), and implement a constitutional ExecutionPlan Authority that uses these concepts without importing Temporal infrastructure.

**Pros:**
- Leverages proven deterministic execution concepts
- No external infrastructure dependency
- Constitutional authority remains pure
- Runtime becomes infrastructure-agnostic
- Aligns with Ω.97 directive to mine proven open-source systems

**Cons:**
- Requires careful extraction of concepts (risk of missing edge cases)
- Implementation effort to adapt concepts to constitutional model
- Need to validate determinism guarantees

**Constitutional Justification:**
**ACCEPTED** - Aligns with Ω.97 directive. Mines proven deterministic execution concepts while maintaining constitutional purity. Runtime remains infrastructure-agnostic.

---

### Alternative 4: Use Cadence as Infrastructure

**Description:**
Same as Alternative 2 but using Cadence instead of Temporal.

**Pros:**
- Similar to Temporal (Cadence is predecessor)
- Proven at Uber scale

**Cons:**
- Less actively maintained than Temporal
- Same constitutional violations as Alternative 2
- Uber-specific patterns may not generalize

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also less actively maintained than Temporal.

---

### Alternative 5: Use Dagster as Infrastructure

**Description:**
Deploy Dagster and use Dagster as the execution infrastructure.

**Pros:**
- Asset-centric approach aligns with constitutional artifacts
- Strong graph modeling

**Cons:**
- Data-pipeline focused (not general workflow)
- Less emphasis on determinism than Temporal
- Python-specific
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also less emphasis on determinism.

---

## Selected Approach

**Alternative 3: Mine Temporal Concepts, Build Constitutional Authority**

Primary source: Temporal (for durable orchestration, retries, timers, worker execution, persistence)
Secondary source: Cadence (for shadow/replay testing)
Tertiary source: Dagster (for asset graph modeling)

**Critical Separation:**
ExecutionPlan Authority is NOT Temporal. ExecutionPlan Authority owns constitutional execution semantics. Temporal is an execution engine underneath.

**ExecutionPlan Authority owns:**
- DAG validation
- Canonical execution graph
- Deterministic scheduling rules
- Replay ordering
- Execution witnesses
- Execution hashes

**Temporal owns:**
- Durable orchestration
- Retries
- Timers
- Worker execution
- Persistence

**Architecture:**
```
ExecutionPlanAuthority
      ↓
Canonical ExecutionPlan
      ↓
TemporalAdapter
      ↓
Temporal
```

**NOT:**
```
ExecutionPlanAuthority
      ↓
Temporal APIs
```

---

## Extracted Concepts

### From Temporal

1. **Event-Sourced Execution History**
   - Append-only log of execution events
   - Commands generated by workflow code
   - Events stored in history
   - Deterministic replay via history reconstruction

2. **Command/Event Model**
   - ScheduleActivityTask → ActivityTaskScheduled
   - StartTimer → TimerStarted
   - CompleteWorkflowExecution → WorkflowExecutionCompleted
   - Immutable command sequence
   - Immutable event log

3. **Deterministic Replay Algorithm**
   - Re-execute workflow code from beginning
   - Use stored results for Activities (don't re-execute)
   - Compare generated Commands to recorded Events
   - Fail on mismatch (non-deterministic error)

4. **Workflow Versioning**
   - GetVersion for branching logic
   - SideEffect for non-deterministic capture
   - Binary checksum for version identification
   - Handles code changes without breaking replay

5. **Retry Semantics**
   - Activity retry policies
   - Workflow retry policies
   - Backoff strategies
   - Maximum attempt limits

6. **Durable Execution Metadata**
   - Event history
   - Workflow state
   - Timer metadata
   - Activity metadata

### From Cadence

1. **Shadow/Replay Testing**
   - Production history replay
   - Non-deterministic error detection
   - Deployment validation methodology

2. **Binary Checksum Versioning**
   - GIT_REF-based versioning
   - Binary checksum for version identification

### From Dagster

1. **Asset Graph Modeling**
   - Asset-centric dependency graphs
   - Data dependency patterns

2. **Executor Abstraction**
   - Pluggable execution substrates
   - Isolation patterns

---

## Rejected Concepts

### From Temporal

1. **Temporal Server Infrastructure**
   - We don't need the server
   - We have ExecutionRuntime as interpreter

2. **Worker Process Model**
   - We have ExecutionRuntime
   - We don't need Temporal workers

3. **Task Queue Implementation**
   - We have DIContainer
   - We don't need Temporal task queues

4. **Persistence Layer**
   - We have capability abstraction
   - We don't need Temporal persistence

5. **Vendor-Specific SDK APIs**
   - We need constitutional interfaces
   - We don't need Temporal SDKs

6. **UI/Observability Stack**
   - We have separate observability
   - We don't need Temporal UI

### From Cadence

1. **Cadence Server Infrastructure**
   - Same as Temporal Server

2. **Uber-Specific Operational Patterns**
   - Not generalizable
   - Not constitutional

3. **Legacy Code Paths**
   - Temporal has evolved beyond Cadence

### From Dagster

1. **Data Pipeline Specifics**
   - Too narrow for constitutional runtime
   - We need general workflow execution

2. **Python-Specific Runtime**
   - We need language-agnostic constitutional authority

3. **Complex Executor Ecosystem**
   - We have capability abstraction
   - We don't need Dagster executors

4. **UI/Observability Stack**
   - Same as Temporal

---

## Constitutional Justification

### Alignment with Constitutional Principles

1. **Runtime as Pure Interpreter**
   - ExecutionPlan Authority owns execution graph construction
   - Runtime only interprets ExecutionPlanArtifact
   - Runtime has no execution authority

2. **Immutable ExecutionPlanArtifact**
   - Execution plan is immutable artifact
   - Command sequence is immutable
   - Dependency DAG is immutable
   - Retry policies are immutable

3. **Event Sourcing**
   - Execution history is event-sourced
   - Commands and Events are immutable
   - Deterministic replay via event history

4. **Determinism**
   - Execution plan generation is deterministic
   - Command sequence is deterministic
   - Replay guarantees determinism

5. **Capability Abstraction**
   - ExecutionPlan Authority has no infrastructure dependencies
   - Runtime has no infrastructure knowledge
   - Infrastructure is behind capability abstraction

6. **No Vendor Lock-In**
   - No dependency on Temporal Server
   - No dependency on Temporal SDKs
   - Only concepts are mined, not implementation

### Alignment with Ω.97 Directive

1. **Mine Proven Open-Source Systems**
   - Temporal is proven at scale
   - Deterministic execution is battle-tested
   - Event sourcing is well-understood

2. **Extract Only Deterministic Core**
   - Command/event model
   - Deterministic replay algorithm
   - Workflow versioning
   - Retry semantics

3. **Wrap Behind Constitutional Authority**
   - ExecutionPlan Authority is constitutional authority
   - No vendor-specific APIs exposed to Runtime
   - Runtime remains infrastructure-agnostic

4. **Never Expose Vendor-Specific APIs**
   - Temporal APIs are not exposed
   - Only constitutional interfaces are exposed
   - Runtime knows nothing about Temporal

---

## Open Source Adoption Justification

### Existing Project Surveyed
- **Temporal:** 21,000+ GitHub stars, 280+ contributors, MIT license, CNCF graduated project
- **Cadence:** 9,358 GitHub stars, ~100 contributors, Apache 2.0 license
- **Netflix Conductor:** 12,800 GitHub stars, ~50 contributors, Apache 2.0 license (archived by Netflix)
- **Argo Workflows:** 16,773 GitHub stars, ~200 contributors, Apache 2.0 license, CNCF graduated
- **Prefect:** ~22,000 GitHub stars, ~150 contributors, Apache 2.0 license
- **Dagster:** ~14,000 GitHub stars, ~100 contributors, Apache 2.0 license

### Why Adopted
**Temporal** was adopted because it meets the 80% threshold with 8/10 constitutional requirements satisfied:
- Core determinism and replay requirements are perfectly matched
- CNCF graduated project with proven track record at scale
- Active community (280+ contributors) and regular releases
- Gaps (artifact model, capability abstraction) can be addressed by wrapper
- Wrapper size is manageable (~500-1000 lines)
- Building from scratch would require re-inventing proven determinism logic

### Why Rejected
- **Cadence:** 70% threshold not met; less active than Temporal; community has moved to Temporal
- **Netflix Conductor:** 40% threshold not met; Netflix archived original repo; determinism not core requirement
- **Argo Workflows:** 30% threshold not met; Kubernetes-specific (not infrastructure-independent); determinism not core requirement
- **Prefect:** 20% threshold not met; philosophical mismatch (embraces non-determinism); Python-specific
- **Dagster:** 30% threshold not met; data pipeline focus (too narrow); Python-specific

### Wrapper Responsibilities
- Translate Canonical ExecutionPlan to Temporal workflow
- Hide Temporal Server dependency (use Temporalite or adapter)
- Expose constitutional interfaces only
- Handle capability abstraction
- Add artifact lineage
- Add constitutional witnesses
- **Critical:** ExecutionPlan Authority never calls Temporal APIs directly
- **Critical:** TemporalAdapter is the only component that knows Temporal

### Constitutional Responsibilities
- ExecutionPlan Authority owns DAG validation
- ExecutionPlan Authority owns canonical execution graph
- ExecutionPlan Authority owns deterministic scheduling rules
- ExecutionPlan Authority owns replay ordering
- ExecutionPlan Authority owns execution witnesses
- ExecutionPlan Authority owns execution hashes
- Runtime only interprets Canonical ExecutionPlan
- TemporalAdapter owns Temporal translation
- Temporal owns durable orchestration, retries, timers, worker execution, persistence

### Replay Guarantees
- Deterministic replay via Temporal's event-sourced execution history
- Command/event model ensures deterministic replay
- Workflow versioning (GetVersion, SideEffect) handles code changes
- Non-deterministic error detection via command/event matching

### Vendor Isolation Guarantees
- No dependency on Temporal Server (use embedded mode or adapter)
- No dependency on Temporal SDKs (constitutional interfaces only)
- Runtime knows nothing about Temporal
- Only concepts are mined, not implementation
- Infrastructure adapters hide concrete implementations

### Lines Reused vs. Newly Written
- **Lines Reused from OSS:** ~50,000+ lines (Temporal core)
- **Lines Newly Written:** ~500-1000 lines (wrapper)
- **Constitutional Wrapper Size:** Medium
- **Maintenance Reduction:** High (leverage Temporal maintenance)
- **Replay Safety Impact:** Positive (Temporal has proven replay safety)

---

## Implementation Plan

### Phase 1: ExecutionPlanArtifact Design
- Define ExecutionPlanArtifact structure
- Define Command types
- Define Event types
- Define dependency DAG representation
- Define retry policy structure
- Define version metadata structure

### Phase 2: ExecutionPlan Authority Implementation
- Implement ExecutionPlan Authority
- Implement command generation from workflow
- Implement dependency DAG construction
- Implement retry policy embedding
- Implement version metadata generation

### Phase 3: Deterministic Replay Implementation
- Implement deterministic replay algorithm
- Implement command/event matching
- Implement non-deterministic error detection
- Implement workflow versioning (GetVersion, SideEffect)

### Phase 4: Runtime Integration
- Modify ExecutionRuntime to use ExecutionPlanArtifact
- Remove execution graph construction from Runtime
- Remove lifecycle step sequencing from Runtime
- Runtime becomes pure interpreter

### Phase 5: Testing
- Implement shadow/replay testing
- Validate determinism guarantees
- Validate replay correctness
- Validate versioning correctness

---

## Consequences

### Positive

1. **Runtime becomes pure interpreter**
   - Runtime no longer owns execution authority
   - Runtime only interprets ExecutionPlanArtifact
   - Constitutional sovereignty established

2. **Immutable execution plans**
   - Execution plans are immutable artifacts
   - Single source of truth for execution graph
   - Deterministic replay guarantees

3. **No infrastructure dependency**
   - ExecutionPlan Authority has no infrastructure dependencies
   - Runtime remains infrastructure-agnostic
   - No vendor lock-in

4. **Proven deterministic execution**
   - Leverages Temporal's battle-tested concepts
   - Determinism guarantees are proven
   - Replay guarantees are proven

### Negative

1. **Implementation complexity**
   - Extracting concepts from Temporal requires careful implementation
   - Risk of missing edge cases in determinism logic
   - Need extensive testing

2. **Learning curve**
   - Team needs to understand Temporal's determinism model
   - Team needs to understand event sourcing
   - Team needs to understand workflow versioning

3. **Migration effort**
   - Existing Runtime logic needs to be refactored
   - Existing contracts need to be updated
   - Existing tests need to be updated

### Tradeoffs

1. **Implementation effort vs. proven concepts**
   - Accept implementation effort to leverage proven concepts
   - Better than re-inventing determinism from scratch

2. **Complexity vs. constitutional purity**
   - Accept complexity to achieve constitutional purity
   - Runtime must be pure interpreter

3. **Migration effort vs. architectural correctness**
   - Accept migration effort to achieve architectural correctness
   - ExecutionPlan sovereignty is required

---

## References

- Temporal Documentation: https://docs.temporal.io/
- Cadence Documentation: https://cadenceworkflow.io/
- Dagster Documentation: https://docs.dagster.io/
- Ω.97 Constitutional Directive: Open Source First
- Ω.96 Constitutional Convergence Report
