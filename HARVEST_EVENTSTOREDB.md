# EventStoreDB Architectural Harvest

**Purpose:** Extract constitutional patterns from EventStoreDB for PING

---

## Core Patterns

### 1. Append-Only Storage

**Pattern:** Events are never lost or overwritten
- Immutable append-only storage guarantees
- State becomes derived from event replay
- History is preserved (never lose information)

**Constitutional Rules:**
- No update, no delete on the event log
- Everything else assumes append-only
- Events are the only persisted state

**PING Application:**
- Event Service must be append-only
- No destructive operations on event store
- All state derived from event replay

---

### 2. Deterministic Replay

**Pattern:** Same events, same order, same final state
- Core invariant: deterministic left fold
- `applyEvent` must be pure
- Event stream must be ordered within a stream
- No clocks, no random IDs, no implicit time-of-day reads inside `evolve`

**Constitutional Rules:**
- Deterministic replay is required
- Same events + same order = same final state
- No non-deterministic operations in event handlers

**PING Application:**
- Replay Service must be deterministic
- Event handlers must be pure functions
- No external dependencies in replay logic
- Timestamps must be explicit in events

---

### 3. Stream Ordering

**Pattern:** Total order within a stream, causal order across streams
- Events are ordered by time within a stream
- Across streams, only causal order matters
- No global clock (pretending you have one is a footgun)
- Stream-level ordering is sufficient for most use cases

**Constitutional Rules:**
- Total order within a stream
- Causal order across streams
- No global ordering guarantees by default
- Global sequence number available but rarely needed

**PING Application:**
- Events ordered by timestamp within aggregate
- Causal relationships across aggregates
- No global event ordering required
- Use causal ordering for cross-aggregate consistency

---

### 4. Optimistic Concurrency

**Pattern:** Expected version prevents lost updates
- When appending events, specify expected stream version
- If actual version doesn't match, append fails
- Prevents duplicate writes and lost updates
- `ExpectedVersion.NoStream` for new streams
- `ExpectedVersion.Any` for existing streams (less safe)
- `ExpectedVersion.FromStreamNumber(n)` for specific version

**Constitutional Rules:**
- Optimistic concurrency is fundamental
- Expected version check maintains integrity
- Prevents concurrent modification conflicts

**PING Application:**
- Event Service must implement optimistic concurrency
- Append with expected version
- Fail fast on version mismatch
- Retry with latest version on conflict

---

### 5. Idempotent Projections

**Pattern:** Subscribers will see duplicates and replays
- Handlers must tolerate duplicate events
- Projections must be idempotent
- Subscribers replay on restart
- Event bus may deliver out of order on rebalance
- SQL statements use `ON CONFLICT` for idempotency

**Constitutional Rules:**
- Idempotency is a fundamental requirement
- Projections must handle duplicate events
- No double-counting on replay
- Checkpointing to resume after restart

**PING Application:**
- All projections must be idempotent
- Use unique constraints to prevent duplicates
- Checkpoint projection positions
- Handle out-of-order delivery

---

### 6. CQRS

**Pattern:** Separate write model from read model
- Write side: aggregates and commands
- Read side: projections and queries
- Events flow into projections that shape read model
- No general "query the event store"
- Every read serves a projection

**Constitutional Rules:**
- Event sourcing implies CQRS
- Reads come from projections, never from event store
- CQRS does not imply event sourcing (can split commands/queries with CRUD)
- Combining event sourcing + CQRS adds complexity

**PING Application:**
- Separate write (Event Service) from read (Projections)
- All queries go through projections
- No direct queries to event store
- Projections are derived from events

---

### 7. Snapshots

**Pattern:** Optimization for long-lived aggregates
- Snapshot is serialized copy of aggregate state at version
- Load latest snapshot, then replay events after that version
- Reduces rehydration time from thousands to dozens of events
- Not needed for aggregates with hundreds of events
- Wait until measured cold-start or load times push past SLO

**Snapshot Triggers:**
- Event-count: Every N events (predictable replay cost)
- Time-based: Every N hours/days (operationally simple)
- State-triggered: On natural transitions (semantic boundaries)
- On-demand: First load that exceeds threshold (only when needed)

**Constitutional Rules:**
- Snapshots are optimization, never source of truth
- Do not snapshot eagerly
- Measure before guessing
- Snapshots at semantic boundaries preferred

**PING Application:**
- Replay Service should support snapshots
- Trigger snapshots based on event count or state transitions
- Snapshots are derived, not authoritative
- Always replay events after snapshot version

---

### 8. Projections

**Pattern:** Transform events into queryable views
- Server-side projections in JavaScript (lightweight transformations)
- Application-side projections for durable read models
- Persistent subscriptions with checkpointing
- Load-balanced consumer groups for parallel processing
- Pinned consumer strategy for indexing projections

**Constitutional Rules:**
- Projections make queries efficient without replaying entire streams
- Server-side projections for lightweight transformations
- Application-side projections for durable read models
- Checkpointing to resume after restart

**PING Application:**
- Graph Service as projection over events
- Classifier Service as projection over artifacts
- Search Service as projection over entities
- All projections must be idempotent

---

### 9. Persistent Subscriptions

**Pattern:** Real-time event delivery with position tracking
- Server maintains subscription state
- Last known position stored on server
- Load-balanced consumer groups
- Pinned consumer strategy for indexing
- Consumer strategies: Round Robin, Pinned

**Constitutional Rules:**
- Persistent subscriptions maintain position
- Load balancing for parallel processing
- Pinned strategy for ordering guarantees
- Checkpointing for recovery

**PING Application:**
- Event Service should support persistent subscriptions
- Graph Service subscribes to all events
- Classifier Service subscribes to artifact events
- Checkpoint positions for recovery

---

### 10. Read-Your-Own-Writes Consistency

**Pattern:** Immediate readback after write
- If you append an event, you can immediately read it back from same stream
- Intuitive but powerful guarantee
- Cornerstone of EventStoreDB consistency model

**Constitutional Rules:**
- Read-your-own-writes consistency is guaranteed
- Write-heavy nature is acceptable
- Cost comes in reading and processing
- Projections offload read burden

**PING Application:**
- Event Service guarantees read-your-own-writes
- Immediately read appended events
- Projections handle read scaling
- Write throughput is high priority

---

## Implementation Patterns

### Stream Naming
- Use hyphen separator for categories (e.g., `order-123`)
- System projection `$by_category` splits by separator
- Use underscore for snapshot suffix (e.g., `order_snapshot-123`)

### Event Structure
- Events must be immutable
- Events must contain all necessary context
- No external dependencies in event handlers
- Timestamps must be explicit

### Concurrency Control
- Always use expected version for appends
- Handle version mismatch gracefully
- Retry with latest version on conflict
- Fail fast on unrecoverable conflicts

### Projection Checkpointing
- Persist checkpoints periodically
- Avoid replaying from beginning
- Use atomic transactions for checkpoint + projection update
- Resume from last checkpoint on restart

### Load Balancing
- Use consumer groups for parallel processing
- Pinned strategy for ordering guarantees
- Handle consumer rebalancing
- Maintain ordering within stream

---

## Anti-Patterns to Avoid

### 1. Querying Event Store Directly
- **Problem:** Slow, inefficient, breaks CQRS
- **Solution:** Always use projections for queries

### 2. Eager Snapshotting
- **Problem:** Unnecessary overhead, complexity
- **Solution:** Wait until measured performance issues

### 3. Global Ordering Assumptions
- **Problem:** Not guaranteed, performance penalty
- **Solution:** Use stream-level ordering, causal ordering across streams

### 4. Non-Idempotent Projections
- **Problem:** Duplicate events cause data corruption
- **Solution:** Make all projections idempotent

### 5. Ignoring Expected Version
- **Problem:** Lost updates, race conditions
- **Solution:** Always use expected version for appends

---

## PING-Specific Recommendations

### Event Service
- Implement append-only storage
- Implement optimistic concurrency with expected version
- Support stream-level ordering
- Support persistent subscriptions with checkpointing

### Replay Service
- Ensure deterministic replay (pure event handlers)
- Support snapshots for long-lived aggregates
- Support cursor-based iteration
- Generate replay certificates

### Graph Service
- Build as projection over events
- Make graph updates idempotent
- Use persistent subscriptions
- Checkpoint graph position

### Classifier Service
- Build as projection over artifacts
- Make classification idempotent
- Use persistent subscriptions
- Checkpoint classifier position

### Projection Service
- Support both server-side and application-side projections
- Implement checkpointing
- Support load balancing
- Handle consumer rebalancing

---

## Performance Considerations

### Write Performance
- EventStoreDB designed for high write throughput
- Appending events is very fast
- Default `maxAppendSize` of 1MB batches events
- Larger fragments may impact read performance

### Read Performance
- Cost comes in reading and processing
- Projections offload read burden
- Snapshots reduce replay cost
- In-memory index for fast stream lookups

### Replay Performance
- Replay is fine for aggregates with hundreds of events
- Snapshots needed for thousands+ events
- Measure before optimizing
- Consider event-count or state-triggered snapshots

---

## Monitoring and Observability

### Stream Metrics
- Stream length (event count)
- Append rate
- Read rate
- Replay latency

### Projection Metrics
- Projection lag (events behind)
- Checkpoint position
- Consumer group health
- Load balancing distribution

### Concurrency Metrics
- Version conflict rate
- Retry rate
- Failed appends
- Optimistic contention

---

## Migration Path

### From CRUD to Event Sourcing
1. Start with append-only event log
2. Implement deterministic replay
3. Add projections for queries
4. Add optimistic concurrency
5. Add snapshots for performance
6. Add persistent subscriptions

### From In-Memory to EventStoreDB
1. Replace in-memory event store with EventStoreDB
2. Update append operations to use expected version
3. Update replay to use EventStoreDB client
4. Add checkpointing for projections
5. Add persistent subscriptions
6. Add snapshots for performance

---

## References

- [Building Event Sourcing with EventStore and .NET](https://developersvoice.com/blog/dotnet/building-event-sourcing-with-eventstore-and-dotnet/)
- [Event Sourcing Deep Dive](https://sujeet.pro/articles/event-sourcing-deep-dive)
- [EventStoreDB Event Sourcing Example](https://github.com/evgeniy-khist/eventstoredb-event-sourcing)
- [EventStoreDB Deep Dive](https://adhdecode.com/message-queues/event-sourcing/eventstoredb/)
- [CQRS and Event Sourcing with EventStoreDB](https://adhdecode.com/articles/cqrs/cqrs-eventstore-db/)
