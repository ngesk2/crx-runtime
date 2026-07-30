# Axon Framework Architectural Harvest

**Purpose:** Extract constitutional patterns from Axon Framework for PING

---

## Core Patterns

### 1. Event-Sourced Entities

**Pattern:** Entity stores no state directly, reconstructs from events
- Event-sourced entity stores no state directly
- Every state change recorded as event
- Entity's current state reconstructed by replaying events in order
- Event log is single source of truth
- Complete and immutable audit trail of everything that ever happened to entity

**Entity Components:**
- **Creational command handlers:** Static methods that handle command creating entity
- **Instance command handlers:** Instance methods that handle commands on existing entity
- **Event sourcing handlers:** Instance methods that apply events to update state fields
- **Entity creator:** Constructor or static factory method for initial entity instance

**Constitutional Rules:**
- Event sourcing handlers must never contain business logic, only state assignments
- Command handlers validate and append events, must never write to entity state fields
- Event sourcing handlers also run during replay when entity loaded from event stream
- Any business logic in event sourcing handler would execute unexpectedly during replay
- Entity only needs state required to make decisions about incoming commands

**PING Application:**
- Event Service should support event-sourced entities
- Entities reconstruct state from events
- Event log is single source of truth
- Complete and immutable audit trail
- Event handlers contain no business logic

---

### 2. Command-Query Responsibility Separation (CQRS)

**Pattern:** Separate read and write operations
- Commands modify system's state
- Queries merely retrieve information without causing changes
- Separation allows developers to optimize each operation independently
- Query model optimized for specific read patterns
- Event Store captures results of command operations as series of events

**CQRS Benefits:**
- Independent optimization of read and write operations
- Cleaner code structure and easier maintenance
- Ability to scale query models differently
- Event Store serves as system's source of truth
- Rebuild state at any point in time by replaying events

**Constitutional Rules:**
- Separate command and query operations
- Commands modify state, queries retrieve information
- Event Store captures command results as events
- Query model optimized for read patterns
- Event sourcing complements CQRS

**PING Application:**
- Event Service should implement CQRS
- Separate command and query operations
- Event Store captures command results as events
- Query model optimized for read patterns
- Rebuild state by replaying events

---

### 3. Streaming Event Processor

**Pattern:** Receive events from StreamableEventSource
- Streaming Processor receives events from StreamableEventSource
- StreamableEventSource is infrastructure component for opening event stream
- Source can specify positions on event stream (Tracking Tokens)
- Used as start positions when opening event stream
- Example: EventStore (Axon Server or JPA aggregate-based storage)

**Streaming Processor Features:**
- Decoupling, parallelization, resiliency, replay-ability
- Pooled Streaming Event Processor (PSEP) is default
- High-performance, two-pool architecture
- Separates event fetching from event processing
- Efficient parallel processing and better resource utilization

**Constitutional Rules:**
- Streaming processors for event processing
- Tracking tokens for position tracking
- Two-pool architecture for performance
- Separate event fetching from processing
- Support replaying events

**PING Application:**
- Event Service should implement streaming event processor
- Tracking tokens for position tracking
- Two-pool architecture for performance
- Separate event fetching from processing
- Support replaying events

---

### 4. Tracking Token

**Pattern:** Keep track of events that have been processed
- Tracking Token represents position of event in event stream
- Different Event Store implementations use different implementations
- Tracking Token stored in Token Store for restart recovery
- Token Store implementations: JPA, JDBC, Mongo, custom
- Best place to store Tracking Token is where projection also stored

**Tracking Token Features:**
- Represents position of event in event stream
- Stored in Token Store for restart recovery
- Multiple implementations available
- Claim extension for collaboration among instances/threads
- Replay events by adjusting token position

**Constitutional Rules:**
- Tracking token for position tracking
- Token store for restart recovery
- Claim extension for collaboration
- Replay events by adjusting token position
- Store token with projection

**PING Application:**
- Event Service should implement tracking tokens
- Token store for restart recovery
- Claim extension for collaboration
- Replay events by adjusting token position
- Store token with projection

---

### 5. Event Replay

**Pattern:** Reopen stream at any point in time
- Benefit of streaming events is ability to reopen stream at any point in time
- When event handling components misbehaved, replay useful
- Handling events again by adjusting position on stream is called "replay"
- Supported by StreamingEventProcessor
- Can trigger reset through Axoniq Platform or programmatically through API

**Replay Features:**
- Reopen stream at any point in time
- Reset processor to replay events
- Track progress during replay
- Each segment has its own pace during replay
- Replay API keeps difference between newly published events and replayed events

**Constitutional Rules:**
- Replay events by adjusting token position
- Reset processor to trigger replay
- Track progress during replay
- Replay API controls which events get replayed
- Sagas not replayable by default

**PING Application:**
- Replay Service should support event replay
- Replay events by adjusting token position
- Reset processor to trigger replay
- Track progress during replay
- Control which events get replayed

---

### 6. Event Tagging

**Pattern:** Mark identifier field on events for filtering
- Axon needs to know which events belong to entity's stream
- Mark identifier field on events with @EventTag
- Set tagKey on entity annotation to same key
- @EventTag marks identifier field so Axon can filter event stream for entity
- tagKey must match field name used in @EventTag

**Event Tagging Features:**
- @EventTag marks identifier field on event
- tagKey on entity annotation
- Filter event stream for entity
- Stable if class renamed
- Tag-based filtering

**Constitutional Rules:**
- Event tagging for stream filtering
- @EventTag marks identifier field
- tagKey on entity annotation
- Stable if class renamed
- Tag-based filtering

**PING Application:**
- Event Service should support event tagging
- Event tags for stream filtering
- Stable tagging if class renamed
- Tag-based filtering
- Event stream filtering

---

### 7. Event Sourcing Handlers

**Pattern:** Apply events to update state fields
- Event sourcing handlers are instance methods that apply events to update state fields
- They must never contain business logic, only state assignments
- Event sourcing handlers also run during replay when entity loaded from event stream
- Any business logic in event sourcing handler would execute unexpectedly during replay
- Entity only needs state required to make decisions about incoming commands

**Event Sourcing Handler Rules:**
- Must never contain business logic
- Only state assignments
- Run during replay
- No unexpected execution during replay
- Only state required for command validation

**Constitutional Rules:**
- Event sourcing handlers contain no business logic
- Only state assignments
- Run during replay
- No unexpected execution
- Minimal state for command validation

**PING Application:**
- Event Service should implement event sourcing handlers
- Event handlers contain no business logic
- Only state assignments
- Run during replay
- Minimal state for command validation

---

### 8. Command Handlers

**Pattern:** Validate commands and append events
- Creational command handlers: static methods that handle command creating entity
- Instance command handlers: instance methods that handle commands on existing entity
- Command handlers validate command and append events
- They must never write to entity state fields
- Separation is critical because event sourcing handlers run during replay

**Command Handler Types:**
- Creational command handlers: create entity
- Instance command handlers: handle commands on existing entity
- Validate command and append事件
- Never write to entity state fields
- Separation from event sourcing handlers

**Constitutional Rules:**
- Command handlers validate and append events
- Never write to entity state fields
- Separation from event sourcing handlers
- Creational vs instance handlers
- Validation before event append

**PING Application:**
- Event Service should implement command handlers
- Command handlers validate and append events
- Never write to entity state fields
- Separation from event sourcing handlers
- Validation before event append

---

### 9. Pooled Streaming Event Processor

**Pattern:** Two-pool architecture for high performance
- Pooled Streaming Event Processor (PSEP) is recommended for most users
- High-performance, two-pool architecture
- Separates event fetching from event processing
- Efficient parallel processing and better resource utilization
- Supports all core streaming operations

**PSEP Features:**
- Two-pool architecture
- Separate event fetching from processing
- Efficient parallel processing
- Better resource utilization
- Support replaying events, parallelism, tracking progress

**Constitutional Rules:**
- Two-pool architecture for performance
- Separate event fetching from processing
- Efficient parallel processing
- Better resource utilization
- Support core streaming operations

**PING Application:**
- Event Service should implement pooled streaming event processor
- Two-pool architecture for performance
- Separate event fetching from processing
- Efficient parallel processing
- Better resource utilization

---

### 10. Event Store

**Pattern:** Capture results of command operations as series of events
- Event Store is essential for capturing results of command operations as series of events
- Represents changes in state
- When combined with Event Sourcing, Event Store serves as system's source of truth
- Makes possible to rebuild state of application at any point in time by replaying events
- Event handlers react to changes initiated by command model

**Event Store Features:**
- Capture command results as events
- Represent changes in state
- System's source of truth
- Rebuild state at any point in time
- Event handlers update query model

**Constitutional Rules:**
- Event Store captures command results as events
- System's source of truth
- Rebuild state by replaying events
- Event handlers update query model
- Eventual consistency

**PING Application:**
- Event Service should implement Event Store
- Capture command results as events
- System's source of truth
- Rebuild state by replaying events
- Event handlers update query model

---

## Implementation Patterns

### Event-Sourced Entity
- Entity stores no state directly
- Reconstruct state from events
- Event log is single source of truth
- Creational command handlers
- Instance command handlers
- Event sourcing handlers

### CQRS
- Separate command and query operations
- Commands modify state
- Queries retrieve information
- Event Store captures command results
- Query model optimized for read patterns

### Streaming Event Processor
- Receive events from StreamableEventSource
- Tracking tokens for position tracking
- Two-pool architecture for performance
- Separate event fetching from processing
- Support replaying events

---

## Anti-Patterns to Avoid

### 1. Business Logic in Event Sourcing Handlers
- **Problem:** Executes unexpectedly during replay
- **Solution:** Event sourcing handlers contain no business logic, only state assignments

### 2. Writing to Entity State Fields in Command Handlers
- **Problem:** Breaks event sourcing pattern
- **Solution:** Command handlers validate and append events, never write to state fields

### 3. Not Using Tracking Tokens
- **Problem:** Cannot track progress or replay events
- **Solution:** Use tracking tokens for position tracking and replay

### 4. Single-Pool Architecture
- **Problem:** Poor performance, inefficient resource utilization
- **Solution:** Use two-pool architecture separating event fetching from processing

### 5. Not Separating Commands and Queries
- **Problem:** Cannot optimize independently, poor performance
- **Solution:** Implement CQRS with separate command and query operations

---

## PING-Specific Recommendations

### Event Service
- Implement event-sourced entities
- Implement CQRS pattern
- Implement streaming event processor
- Implement tracking tokens
- Support event replay

### Command Service
- Implement command handlers
- Validate commands before appending events
- Never write to entity state fields
- Separate creational and instance handlers
- Validation before event append

### Query Service
- Implement query model optimized for read patterns
- Separate from command model
- Event handlers update query model
- Handle eventual consistency
- Optimize for read-heavy operations

### Replay Service
- Support event replay by adjusting token position
- Reset processor to trigger replay
- Track progress during replay
- Control which events get replayed
- Replay API for fine-grained control

---

## Performance Considerations

### Event Processing Performance
- Two-pool architecture for high performance
- Separate event fetching from processing
- Efficient parallel processing
- Better resource utilization
- Support replaying events

### Replay Performance
- Reopen stream at any point in time
- Track progress during replay
- Each segment has its own pace
- Replay API controls which events get replayed
- Efficient replay mechanism

### Token Store Performance
- Tracking token for position tracking
- Token store for restart recovery
- Claim extension for collaboration
- Store token with projection
- Multiple implementations available

---

## Monitoring and Observability

### Event Metrics
- Event processing rate
- Event replay rate
- Token position
- Processor status
- Segment progress

### Command Metrics
- Command processing rate
- Command validation rate
- Event append rate
- Command failure rate
- Command latency

### Query Metrics
- Query processing rate
- Query latency
- Query model update rate
- Eventual consistency lag
- Query optimization rate

---

## Migration Path

### From CRUD to Event Sourcing
1. Implement event-sourced entities
2. Implement command handlers
3. Implement event sourcing handlers
4. Implement Event Store
5. Implement replay mechanism

### From Simple Processing to Streaming Processing
1. Implement streaming event processor
2. Implement tracking tokens
3. Implement token store
4. Implement pooled streaming event processor
5. Implement replay mechanism

---

## References

- [Event-Sourced Entities](https://docs.axoniq.io/axon-framework-reference/5.2/commands/entities/event-sourced-entity/)
- [Streaming Event Processor](https://docs.axoniq.io/axon-framework-reference/development/events/event-processors/streaming/)
- [Tracking Event Processors](https://www.axoniq.io/blog/demystifying-tracking-event-processors-in-axon-framework)
- [Axon Framework](https://www.axoniq.io/axon-framework)
- [CQRS](https://www.axoniq.io/concepts/cqrs)
