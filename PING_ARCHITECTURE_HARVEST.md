# PING Pattern Harvest - Replay & Event Sourcing

**Purpose:** Harvest constitutional patterns from production event-sourcing systems for PING architecture

---

## Research Targets

**High Priority:**
- EventStoreDB - Append-only stream design, optimistic concurrency, replay subscriptions
- Axon Framework - CQRS, aggregate replay, event upcasting, version evolution
- Apache Kafka - Immutable logs, offset replay, deterministic consumers
- Temporal - Deterministic execution, forbidden APIs, replay testing
- Microsoft GraphRAG - Graph intelligence and entity relationships
- Git internals - Lineage, hashing, immutable history
- OpenTelemetry - Causality and trace modeling
- XState - Explicit state machines

**Medium Priority:**
- Home maintenance domain models
- Event modeling and ubiquitous language

---

## EventStoreDB Patterns

### Append-Only Stream Design

**Core Principle:** Every change is an immutable event appended to a named stream. Streams are the fundamental unit, typically representing a single aggregate instance (e.g., `order-123`, `customer-abc`).

**PING Constitutional Rule:**
```
All state changes MUST be expressed as immutable events appended to streams.
Streams represent aggregate lifetimes (Customer, Estimate, Review, Property).
Events are NEVER mutated, only appended.
```

### Optimistic Concurrency

**Pattern:** When appending events, specify the expected version of the stream. If the actual version doesn't match, the append fails.

**Constants:**
- `ExpectedVersion.Any` - Disables check (less safe)
- `ExpectedVersion.NoStream` - Stream must not exist
- `ExpectedVersion.EmptyStream` - Stream exists but has no events
- `ExpectedVersion.StreamExists` - Stream or metadata exists
- Integer value - Expected exact event number

**PING Constitutional Rule:**
```
All appends MUST specify expected version for concurrency control.
Concurrent modifications MUST fail explicitly (WrongExpectedVersion).
No silent overwrites allowed.
```

### Idempotence

**Pattern:** Identical append operations are idempotent based on `EventId` and `stream`. Duplicate events are not appended.

**PING Constitutional Rule:**
```
Event IDs MUST be globally unique.
Identical appends (same EventId, same stream) MUST be idempotent.
Idempotence check based on (EventId, stream) tuple.
```

### Persistent Subscriptions

**Pattern:** Server-maintained subscriptions with competing consumers. Server tracks position, supports at-least-once delivery, load balancing across consumer groups.

**PING Constitutional Rule:**
```
PING replay subscriptions MUST be server-side (not client-driven).
Position tracking MUST be server-maintained.
Consumer groups MUST support competing consumers pattern.
At-least-once delivery guarantee required.
```

### Catch-Up Subscriptions

**Pattern:** Client-driven subscriptions where client maintains checkpoint. Order is guaranteed, but no built-in retries or load balancing.

**PING Constitutional Rule:**
```
When order matters more than throughput, use catch-up subscriptions.
Client MUST maintain checkpoint position.
Checkpoint persistence MUST be transactional with event processing.
```

### Projections

**Pattern:** Materialized views built by subscribing to event streams. Separate read models from write model (CQRS). Can be rebuilt from event stream.

**PING Constitutional Rule:**
```
All read models MUST be projections from event streams.
Projections MUST be rebuildable from event stream.
Write model (events) and read model (projections) MUST be separate.
```

### Snapshots

**Pattern:** Periodic state capture to avoid replaying entire event history. Snapshot + events since snapshot = current state.

**PING Constitutional Rule:**
```
Aggregates MAY use snapshots for performance.
Snapshots MUST be derived from events, not independent.
Snapshot + events since snapshot MUST equal current state.
```

---

## Axon Framework Patterns

### CQRS Separation

**Pattern:** Command Query Responsibility Segregation. Write model (commands → events) separate from read model (events → projections).

**PING Constitutional Rule:**
```
Commands MUST NOT read from read models.
Queries MUST NOT write to event store.
Write model: Commands → Events
Read model: Events → Projections
```

### Aggregate Replay

**Pattern:** Current state derived by replaying events in order. Every command results in events being appended.

**PING Constitutional Rule:**
```
Aggregate state MUST be derived by replaying events.
Event replay MUST be deterministic.
Same events in same order MUST produce same state.
```

### Event Upcasting

**Pattern:** Transform stored events from old version to new version at read time. One transformation per version step. Chain composes transformations.

**PING Constitutional Rule:**
```
Event version evolution MUST use upcasting.
Stored events NEVER mutated.
Transformations applied at read time.
One transformation per version step.
Transformation chain MUST be deterministic.
```

### Version Evolution

**Pattern:** Events change format over time. Application must handle multiple versions. Payload conversion handles many changes without upcasters.

**PING Constitutional Rule:**
```
Events MUST have explicit version (e.g., "1.0.0").
Old event versions MUST remain readable.
Payload conversion preferred over upcasting when possible.
Upcasters only for structural changes.
```

### Command Separation

**Pattern:** Commands are intent, events are facts. Commands are validated, then produce events. Events are immutable.

**PING Constitutional Rule:**
```
Commands represent intent (may fail).
Events represent facts (immutable).
Command validation BEFORE event emission.
Events MUST NOT be rejected after emission.
```

---

## Apache Kafka Patterns

### Immutable Logs

**Pattern:** Topics are append-only logs. Messages never mutated. Offsets track position.

**PING Constitutional Rule:**
```
Event streams MUST be immutable logs.
Offsets MUST track position in stream.
Messages NEVER mutated after append.
```

### Offset Replay

**Pattern:** Consumers track offset. Can replay from any offset. Offsets are consumer-specific.

**PING Constitutional Rule:**
```
Consumers MUST track offset independently.
Replay MUST be possible from any offset.
Offset persistence MUST be transactional with processing.
```

### Deterministic Consumers

**Pattern:** Same message consumed by same consumer in consumer group. Ordering guaranteed within partition.

**PING Constitutional Rule:**
```
Event processing MUST be deterministic.
Same event + same consumer = same result.
Ordering MUST be guaranteed within stream.
```

### Ordering Guarantees

**Pattern:** Ordering guaranteed within partition, not across partitions. Trade-off between ordering and parallelism.

**PING Constitutional Rule:**
```
Ordering MUST be guaranteed within aggregate stream.
Cross-stream ordering NOT guaranteed.
Parallel processing allowed across different streams.
```

---

## Temporal Patterns

### Deterministic Execution

**Pattern:** Workflows execute deterministically. Same input + same workflow = same output. Non-deterministic operations (random, time) are forbidden or controlled.

**PING Constitutional Rule:**
```
Event processing MUST be deterministic.
Non-deterministic operations FORBIDDEN in event handlers.
If non-determinism needed, must be externalized (e.g., as event data).
```

### Forbidden APIs

**Pattern:** Certain APIs forbidden in workflows (e.g., direct network calls, random number generation). Must use deterministic alternatives.

**PING Constitutional Rule:**
```
Direct network calls FORBIDDEN in event handlers.
Random number generation FORBIDDEN in event handlers.
System time FORBIDDEN in event handlers (use event timestamp).
All non-determinism MUST be externalized.
```

### Replay Testing

**Pattern:** Workflows can be replayed from history. Same history produces same result. Used for testing and debugging.

**PING Constitutional Rule:**
```
Event replay MUST produce identical results.
Replay MUST be testable deterministically.
Replay used for testing, debugging, migration.
```

### Workflow History

**Pattern:** Complete history of workflow execution preserved. Can be queried, replayed, analyzed.

**PING Constitutional Rule:**
```
Complete event history MUST be preserved.
History MUST be queryable.
History MUST be replayable.
```

---

## Git Internals Patterns

### Hashes

**Pattern:** Every object identified by SHA-1 hash. Content-addressable storage. Hash collision extremely unlikely.

**PING Constitutional Rule:**
```
Events MUST have content-addressable identifiers.
Event IDs MUST be cryptographically unique.
Hash-based verification of event integrity.
```

### Object IDs

**Pattern:** Objects (blobs, trees, commits) have IDs. IDs derived from content. Immutable.

**PING Constitutional Rule:**
```
Event IDs derived from event content.
Events immutable once emitted.
Event content determines identity.
```

### DAG Traversal

**Pattern:** Git history is directed acyclic graph. Commits point to parents. Traversal follows parent references.

**PING Constitutional Rule:**
```
Event relationships form DAG.
Lineage tracked via parent references.
Traversal follows parent references.
No cycles allowed in event lineage.
```

### Parent References

**Pattern:** Each commit references parent(s). Branch points are commits with multiple children. Merges are commits with multiple parents.

**PING Constitutional Rule:**
```
Events MAY reference parent events.
Causality tracked via parent references.
Multiple parents allowed (merge semantics).
Multiple children allowed (branch semantics).
```

### Immutable History

**Pattern:** Git history never mutated. New commits added. Old commits remain. Rewriting history creates new objects.

**PING Constitutional Rule:**
```
Event history NEVER mutated.
New events appended.
Old events remain.
History rewriting creates new events, not mutations.
```

---

## Microsoft GraphRAG Patterns

### Graph Construction

**Pattern:** Extract entities from documents. Build graph of relationships. Entities as nodes, relationships as edges.

**PING Constitutional Rule:**
```
Entities extracted from events.
Graph of entity relationships.
Entities as nodes, relationships as edges.
```

### Entity Extraction

**Pattern:** Identify entities (people, organizations, locations) from text. Normalize to canonical identities.

**PING Constitutional Rule:**
```
Entities extracted from event data.
Normalization to canonical identities.
Deduplication across events.
```

### Graph Queries

**Pattern:** Query graph for relationships, paths, communities. Traversal algorithms (BFS, DFS, shortest path).

**PING Constitutional Rule:**
```
Graph queries for entity relationships.
Traversal algorithms for path finding.
Community detection for clustering.
```

---

## OpenTelemetry Patterns

### Spans

**Pattern:** Spans represent units of work. Spans have parent-child relationships. Distributed tracing across services.

**PING Constitutional Rule:**
```
Event processing represented as spans.
Parent-child relationships for causality.
Distributed tracing across PING components.
```

### Traces

**Pattern:** Trace is collection of spans forming a tree. Represents end-to-end request. Trace ID links all spans.

**PING Constitutional Rule:**
```
Event replay represented as trace.
Trace ID links all events in replay.
End-to-end causality tracking.
```

### Causality

**Pattern:** Spans linked via parent IDs. Causal relationships explicit. Temporal ordering preserved.

**PING Constitutional Rule:**
```
Causal relationships explicit in events.
Parent event IDs for causality.
Temporal ordering preserved.
```

---

## XState Patterns

### Explicit State Transitions

**Pattern:** State machines with explicit transitions. States and transitions defined declaratively. No implicit state changes.

**PING Constitutional Rule:**
```
Aggregate state transitions MUST be explicit.
States and transitions defined declaratively.
No implicit state changes.
```

### Deterministic Execution

**Pattern:** Same input + same state = same next state. State machines are deterministic.

**PING Constitutional Rule:**
```
State transitions MUST be deterministic.
Same event + same state = same next state.
Non-deterministic transitions FORBIDDEN.
```

---

## Constitutional Rules Summary

### Replay Laws

1. **Immutable Events:** Events never mutated after emission.
2. **Append-Only Streams:** Only append operations allowed.
3. **Deterministic Replay:** Same events in same order produce same state.
4. **Position Tracking:** Server-maintained position for subscriptions.
5. **Idempotent Appends:** Identical appends produce no duplicates.

### Projection Laws

1. **Rebuildable:** All projections rebuildable from event stream.
2. **Separation:** Write model (events) separate from read model (projections).
3. **CQRS:** Commands don't read, queries don't write.

### Identity Laws

1. **Content-Addressable:** Event IDs derived from content.
2. **Canonical Entities:** Entities normalized to canonical identities.
3. **Lineage Tracking:** Parent references for causality.

### Authority Laws

1. **Optimistic Concurrency:** Expected version checks on appends.
2. **Explicit State Transitions:** No implicit state changes.
3. **Command Separation:** Commands are intent, events are facts.

### Version Laws

1. **Explicit Versioning:** Events have explicit version numbers.
2. **Upcasting:** Old events transformed at read time.
3. **Backward Compatibility:** Old event versions remain readable.

---

## Next Steps

1. **Research Temporal TypeScript SDK** - Deterministic replay patterns
2. **Research Git internals** - Lineage, hashing, immutable history
3. **Research OpenTelemetry** - Causality and trace modeling
4. **Research XState** - Explicit state machines
5. **Research home maintenance domain models** - Ubiquitous language
6. **Research event modeling** - Domain events, event storming

---

## Blocking Issues

None - Research only, no implementation required.
