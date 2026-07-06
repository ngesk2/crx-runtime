# ADR-002: ReplayAuthority

**Status:** Proposed
**Date:** 2026-06-29
**Phase:** Ω.98 — Constitutional Implementation Directive — Adopt Before Build

---

## Problem

**Current State:**
Replay behavior is currently scattered across multiple authorities:
- Runtime handles execution report storage
- WitnessAuthority handles witness generation
- VerificationAuthority handles verification
- CertificationAuthority handles certification
- PublicationAuthority handles publication

There is no single constitutional authority for:
- Deterministic replay
- Stream reconstruction
- Version handling
- Snapshot boundaries
- Event ordering
- Replay equivalence
- Replay verification

This violates constitutional principles:

1. **Replay is emergent behavior:** Replay is not a first-class constitutional authority
2. **No single replay owner:** Replay logic is distributed across authorities
3. **Runtime understands replay:** Runtime owns execution report storage and replay logic
4. **No snapshot strategy:** No constitutional snapshot boundaries
5. **No version handling:** No constitutional version handling for replay

**Constitutional Requirement:**
ReplayAuthority must become the single constitutional authority for deterministic replay, stream reconstruction, version handling, snapshot boundaries, event ordering, replay equivalence, and replay verification. Runtime must never understand replay.

---

## Alternatives Considered

### Alternative 1: Build Custom ReplayAuthority

**Description:**
Design and implement ReplayAuthority from scratch without reference to existing open-source event sourcing systems.

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
**REJECTED** - Violates Ω.97 directive. Deterministic replay and event sourcing are well-solved problems; re-inventing them is unnecessary risk.

---

### Alternative 2: Use EventStoreDB as Infrastructure

**Description:**
Deploy EventStoreDB and use EventStoreDB as the event storage infrastructure. ReplayAuthority becomes an EventStoreDB client.

**Pros:**
- Leverages proven EventStoreDB infrastructure
- Battle-tested event replay
- Built-in snapshot support
- Mature tooling and observability

**Cons:**
- Introduces heavy operational dependency (EventStoreDB server)
- ReplayAuthority becomes coupled to EventStoreDB-specific APIs
- Violates capability abstraction (ReplayAuthority knows about EventStoreDB)
- Vendor lock-in to EventStoreDB ecosystem
- Constitutional authorities should not depend on external infrastructure

**Constitutional Justification:**
**REJECTED** - Violates constitutional principle that authorities must be infrastructure-agnostic. ReplayAuthority should not know about EventStoreDB or any specific infrastructure.

---

### Alternative 3: Mine EventStoreDB Concepts, Build Constitutional Authority

**Description:**
Study EventStoreDB's event replay model, extract the core concepts (event replay optimization, snapshot boundaries, stream versioning, event ordering), and implement a constitutional ReplayAuthority that uses these concepts without importing EventStoreDB infrastructure.

**Pros:**
- Leverages proven event replay concepts
- No external infrastructure dependency
- Constitutional authority remains pure
- ReplayAuthority remains infrastructure-agnostic
- Aligns with Ω.97 directive to mine proven open-source systems

**Cons:**
- Requires careful extraction of concepts (risk of missing edge cases)
- Implementation effort to adapt concepts to constitutional model
- Need to validate determinism guarantees

**Constitutional Justification:**
**ACCEPTED** - Aligns with Ω.97 directive. Mines proven event replay concepts while maintaining constitutional purity. ReplayAuthority remains infrastructure-agnostic.

---

### Alternative 4: Use Axon Framework as Infrastructure

**Description:**
Same as Alternative 2 but using Axon Framework instead of EventStoreDB.

**Pros:**
- Mature CQRS/ES framework
- Strong projection rebuild support
- Java ecosystem integration

**Cons:**
- Java-specific
- Requires Axon Server for distributed scenarios
- Same constitutional violations as Alternative 2
- Complex configuration

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also Java-specific.

---

### Alternative 5: Use Marten as Infrastructure

**Description:**
Same as Alternative 2 but using Marten instead of EventStoreDB.

**Pros:**
- .NET event store built on PostgreSQL
- Simple integration with existing databases
- Strong .NET ecosystem

**Cons:**
- .NET-specific
- PostgreSQL dependency
- Less mature than EventStoreDB/Axon
- Same constitutional violations as Alternative 2

**Constitutional Justification:**
**REJECTED** - Same constitutional violations as Alternative 2. Also .NET-specific and PostgreSQL dependency.

---

## Selected Approach

**Alternative 3: Mine EventStoreDB Concepts, Build Constitutional Authority**

Primary source: EventStoreDB (for event replay optimization, snapshot boundaries, stream versioning, event ordering)
Secondary source: Axon Framework (for projection rebuild, idempotency)
Tertiary source: Marten (for aggregate state reconstruction)

**Critical Separation:**
ReplayAuthority is NOT EventStoreDB. ReplayAuthority owns constitutional replay semantics. EventStoreDB is storage underneath.

**ReplayAuthority exposes ONLY constitutional concepts:**
- Canonical Replay Log
- Replay Transcript
- Replay Witnesses
- Replay Validation
- Snapshot Boundaries

**ReplayAuthority NEVER exposes EventStore concepts:**
- Stream (EventStore concept)
- Projection (EventStore concept)
- Subscription (EventStore concept)
- Event Store (EventStore concept)

**Architecture:**
```
ReplayAuthority
      ↓
Canonical Replay Log
      ↓
EventStoreAdapter (maps Canonical Replay Log → EventStore Stream)
      ↓
EventStoreDB
```

**NOT:**
```
ReplayAuthority
      ↓
EventStore APIs (Stream, Projection, Subscription)
```

---

## Extracted Concepts

### From EventStoreDB

1. **Event Replay Optimization**
   - Stream-based event storage
   - Append-only event log
   - Deterministic event ordering
   - Replay performance optimization
   - Stream metadata

2. **Snapshot Boundaries**
   - Snapshot creation strategies
   - Snapshot recovery
   - Snapshot versioning
   - Snapshot optimization
   - Snapshot validation

3. **Stream Versioning**
   - Stream metadata
   - Version handling
   - Stream consistency
   - Stream validation
   - Stream migration

4. **Event Ordering**
   - Strict event ordering
   - Event sequence numbers
   - Event timestamps
   - Event consistency
   - Event validation

### From Axon Framework

1. **Projection Rebuild**
   - Projection state reconstruction
   - Projection reset
   - Projection versioning
   - Projection optimization
   - Projection validation

2. **Snapshot Thresholds**
   - Snapshot creation triggers
   - Snapshot recovery
   - Snapshot versioning
   - Snapshot optimization

3. **Idempotency**
   - Deduplication tokens
   - Idempotent event handling
   - Idempotent command handling
   - Idempotency validation

### From Marten

1. **Aggregate State Reconstruction**
   - Apply methods are deterministic
   - State-only event handling
   - Replay-safe aggregates
   - Aggregate versioning
   - Aggregate validation

---

## Rejected Concepts

### From EventStoreDB

1. **EventStoreDB Server Infrastructure**
   - We don't need the server
   - We have capability abstraction

2. **Vendor-Specific Client APIs**
   - We need constitutional interfaces
   - We don't need EventStoreDB SDKs

3. **Persistence Layer**
   - We have capability abstraction
   - We don't need EventStoreDB persistence

4. **Stream Subscription Model**
   - We have different execution model
   - We don't need EventStoreDB subscriptions

5. **UI/Observability Stack**
   - We have separate observability
   - We don't need EventStoreDB UI

### From Axon Framework

1. **Axon Server Infrastructure**
   - Same as EventStoreDB Server

2. **Java-Specific Runtime**
   - We need language-agnostic constitutional authority

3. **Vendor-Specific APIs**
   - Same as EventStoreDB

4. **Complex Configuration**
   - We need simple constitutional authority

5. **Spring Boot Integration**
   - We don't need Spring

### From Marten

1. **PostgreSQL Dependency**
   - We have capability abstraction
   - We don't need PostgreSQL

2. **.NET-Specific Runtime**
   - We need language-agnostic constitutional authority

3. **Vendor-Specific APIs**
   - Same as EventStoreDB

4. **Document Database Features**
   - We don't need document storage

---

## Constitutional Justification

### Alignment with Constitutional Principles

1. **Replay as First-Class Authority**
   - ReplayAuthority is the single constitutional replay authority
   - Replay is no longer emergent behavior
   - Replay logic is centralized

2. **Runtime Never Understands Replay**
   - Runtime no longer owns execution report storage
   - Runtime no longer owns replay logic
   - Runtime only interprets ExecutionPlanArtifact

3. **Immutable Event Streams**
   - Event streams are immutable artifacts
   - Events are append-only
   - Event ordering is guaranteed

4. **Deterministic Replay**
   - Replay is deterministic
   - Same event stream → same state reconstruction
   - Replay validation is deterministic

5. **Capability Abstraction**
   - ReplayAuthority uses capability interfaces (EventStore, SnapshotStore)
   - ReplayAuthority is infrastructure-agnostic
   - No vendor lock-in

6. **No Vendor Lock-In**
   - No dependency on EventStoreDB server
   - No dependency on EventStoreDB SDKs
   - Only concepts are mined, not implementation

### Alignment with Ω.97 Directive

1. **Mine Proven Open-Source Systems**
   - EventStoreDB is proven at scale
   - Event replay is battle-tested
   - Snapshot boundaries are well-understood

2. **Extract Only Deterministic Core**
   - Event replay optimization
   - Snapshot boundaries
   - Stream versioning
   - Event ordering

3. **Wrap Behind Constitutional Authority**
   - ReplayAuthority is constitutional authority
   - No vendor-specific APIs exposed to Runtime
   - Runtime knows nothing about EventStoreDB

4. **Never Expose Vendor-Specific APIs**
   - EventStoreDB APIs are not exposed
   - Only constitutional interfaces are exposed
   - Runtime knows nothing about EventStoreDB

---

## Open Source Adoption Justification

### Existing Project Surveyed
- **EventStoreDB (KurrentDB):** 5,806 GitHub stars, 140 contributors, Other license (NOASSERTION)
- **Marten:** 3,411 GitHub stars, ~50 contributors, MIT license
- **Eventuous:** 508 GitHub stars, ~10 contributors, Apache 2.0 license
- **Axon Framework:** 3,587 GitHub stars, 190 contributors, Apache 2.0 license
- **Akka Persistence:** 13,273 GitHub stars (akka-core), ~100 contributors, Other license

### Why Adopted
**EventStoreDB (KurrentDB)** was adopted because it meets the 80% threshold with 8/10 constitutional requirements satisfied:
- Core replay and event sourcing requirements are perfectly matched
- Purpose-built for event sourcing and replay
- Active development (last push: June 2026) and regular releases
- Gaps (witnesses, equivalence validation) can be addressed by wrapper
- Wrapper size is manageable (~500-1000 lines)
- Building from scratch would require re-inventing proven event sourcing logic

### Why Rejected
- **Marten:** 60% threshold not met; PostgreSQL dependency (not infrastructure-independent); .NET-specific
- **Eventuous:** 50% threshold not met; less mature; breaking changes keep coming; EventStoreDB is better choice
- **Axon Framework:** 60% threshold not met; Java-specific (not language-agnostic); Axon Server dependency
- **Akka Persistence:** 50% threshold not met; Scala/Java-specific; actor model complexity; EventStoreDB is simpler

### Wrapper Responsibilities
- Hide EventStoreDB dependency (use adapter pattern)
- Expose constitutional interfaces only
- Map Canonical Replay Log to EventStore Stream internally
- Add constitutional witnesses
- Add replay equivalence validation
- Add artifact lineage
- **Critical:** ReplayAuthority never exposes EventStore terminology
- **Critical:** EventStoreAdapter is the only component that knows EventStoreDB
- **Critical:** Replay transcript remains constitutional

### Constitutional Responsibilities
- ReplayAuthority owns canonical replay ordering
- ReplayAuthority owns replay witnesses
- ReplayAuthority owns deterministic transcripts
- ReplayAuthority owns replay certification
- ReplayAuthority owns Canonical Replay Log
- Runtime never understands replay
- EventStoreAdapter maps Canonical Replay Log to EventStore Stream
- EventStoreDB owns event storage

### Replay Guarantees
- Deterministic replay via Canonical Replay Log
- Strict event ordering guarantees
- Replay transcript is constitutional (not EventStore-specific)
- Snapshot boundaries for replay optimization
- Event immutability for replay safety
- Replay validation is deterministic

### Vendor Isolation Guarantees
- No dependency on EventStoreDB server (use embedded mode or adapter)
- No dependency on EventStoreDB SDKs (constitutional interfaces only)
- Runtime knows nothing about EventStoreDB
- Only concepts are mined, not implementation
- Infrastructure adapters hide concrete implementations

### Lines Reused vs. Newly Written
- **Lines Reused from OSS:** ~50,000+ lines (EventStoreDB core)
- **Lines Newly Written:** ~500-1000 lines (wrapper)
- **Constitutional Wrapper Size:** Medium
- **Maintenance Reduction:** High (leverage EventStoreDB maintenance)
- **Replay Safety Impact:** Positive (EventStoreDB has proven replay safety)

---

## Implementation Plan

### Phase 1: Event Stream Artifact Design
- Define EventStreamArtifact structure
- Define Event types
- Define event ordering
- Define stream metadata
- Define stream versioning

### Phase 2: Snapshot Artifact Design
- Define SnapshotArtifact structure
- Define snapshot creation strategies
- Define snapshot recovery
- Define snapshot versioning
- Define snapshot boundaries

### Phase 3: Replay Authority Implementation
- Implement Replay Authority
- Implement event replay optimization
- Implement snapshot recovery
- Implement stream versioning
- Implement event ordering validation

### Phase 4: Deterministic Replay Implementation
- Implement deterministic replay algorithm
- Implement state reconstruction
- Implement replay validation
- Implement replay equivalence checking

### Phase 5: Runtime Integration
- Remove execution report storage from Runtime
- Remove replay logic from Runtime
- Runtime only interprets ExecutionPlanArtifact
- ReplayAuthority handles all replay logic

### Phase 6: Testing
- Validate deterministic replay
- Validate snapshot recovery
- Validate stream versioning
- Validate replay equivalence

---

## Consequences

### Positive

1. **Replay as First-Class Authority**
   - ReplayAuthority is the single constitutional replay authority
   - Replay logic is centralized
   - Replay is no longer emergent behavior

2. **Runtime Never Understands Replay**
   - Runtime no longer owns execution report storage
   - Runtime no longer owns replay logic
   - Runtime is pure interpreter

3. **Immutable Event Streams**
   - Event streams are immutable artifacts
   - Events are append-only
   - Event ordering is guaranteed

4. **Deterministic Replay**
   - Replay is deterministic
   - Same event stream → same state reconstruction
   - Replay validation is deterministic

5. **No Infrastructure Dependency**
   - ReplayAuthority uses capability interfaces
   - ReplayAuthority is infrastructure-agnostic
   - No vendor lock-in

6. **Proven Event Replay**
   - Leverages EventStoreDB's battle-tested concepts
   - Deterministic replay guarantees are proven
   - Snapshot boundaries are proven

### Negative

1. **Implementation Complexity**
   - Extracting concepts from EventStoreDB requires careful implementation
   - Risk of missing edge cases in determinism logic
   - Need extensive testing

2. **Learning Curve**
   - Team needs to understand EventStoreDB's event replay model
   - Team needs to understand snapshot boundaries
   - Team needs to understand stream versioning

3. **Migration Effort**
   - Existing Runtime replay logic needs to be refactored
   - Existing authority replay logic needs to be refactored
   - Existing tests need to be updated

### Tradeoffs

1. **Implementation Effort vs. Proven Concepts**
   - Accept implementation effort to leverage proven concepts
   - Better than re-inventing event replay from scratch

2. **Complexity vs. Constitutional Purity**
   - Accept complexity to achieve constitutional purity
   - Replay must be first-class authority

3. **Migration Effort vs. Architectural Correctness**
   - Accept migration effort to achieve architectural correctness
   - Replay sovereignty is required

---

## References

- EventStoreDB Documentation: https://docs.eventsourcingdb.io/
- Axon Framework Documentation: https://docs.axonframework.org/
- Marten Documentation: https://martendb.io/
- Ω.97 Constitutional Directive: Open Source First
- Ω.96 Constitutional Convergence Report
