# XState Architectural Harvest

**Purpose:** Extract constitutional patterns from XState for PING

---

## Core Patterns

### 1. Event Sourcing

**Pattern:** Restore state by replaying events
- Event sourcing is alternative to persisting state
- Restores state of actor by replaying events that led to that state
- Can be more reliable than persisting state
- Less prone to incompatible state
- Allows replaying actions

**Implementation:**
- Persist events as they happen using inspection API
- Replay events to restore state of actor
- Only listen for events sent to root actor
- Store events in localStorage or other storage
- Replay events to restore state

**Constitutional Rules:**
- Event sourcing for state restoration
- Replay events to restore state
- More reliable than persisting state
- Less prone to incompatible state
- Allows replaying actions

**PING Application:**
- Event Service should support event sourcing
- Replay events to restore state
- More reliable than persisting state
- Less prone to incompatible state
- Allows replaying actions

---

### 2. Inspection API

**Pattern:** Inspect and persist events
- Inspection API allows monitoring actor behavior
- Can persist events as they happen
- Filter events by type (@xstate.event)
- Filter events by actor reference
- Only listen for events sent to root actor

**Inspection Features:**
- Monitor actor behavior
- Persist events as they happen
- Filter by event type
- Filter by actor reference
- Root actor filtering

**Constitutional Rules:**
- Inspection API for monitoring
- Persist events as they happen
- Filter events by type
- Filter events by actor
- Root actor filtering

**PING Application:**
- Event Service should implement inspection API
- Monitor event behavior
- Persist events as they happen
- Filter events by type
- Filter events by actor

---

### 3. State Machine Versioning

**Pattern:** Evolve state machine implementation over time
- Persist sequence of events with payloads that led to current state
- Current state becomes ephemeral
- Can always be reconstructed by replaying events against current implementation
- Change state machine implementation at any time
- Retain ability to process all same events

**Versioning Challenges:**
- Event payloads form public API
- States and transitions are implementation details
- Can change at any time
- Event schema evolution via event sourcing methodologies
- Audit log of meaningful events

**Constitutional Rules:**
- Event payloads as public API
- States and transitions as implementation details
- Can change implementation at any time
- Retain ability to process all same events
- Audit log for monitoring and debugging

**PING Application:**
- Event Service should support state machine versioning
- Event payloads as public API
- States and transitions as implementation details
- Can change implementation at any time
- Audit log for monitoring and debugging

---

### 4. Defer/Recall Pattern

**Pattern:** Defer events that aren't accepted in state
- Defer events that aren't accepted in current state
- Recall deferred events when state changes
- Wildcard transition for deferring events
- Recall action to process deferred events
- Unstuck workflow when state changes

**Defer/Recall Features:**
- Defer events not accepted in state
- Recall deferred events on state change
- Wildcard transition for deferring
- Recall action for processing
- Unstuck workflow

**Constitutional Rules:**
- Defer events not accepted in state
- Recall deferred events on state change
- Wildcard transition for deferring
- Recall action for processing
- Unstuck workflow

**PING Application:**
- Event Service should implement defer/recall pattern
- Defer events not accepted in state
- Recall deferred events on state change
- Wildcard transition for deferring
- Recall action for processing

---

### 5. Non-Deterministic Results

**Pattern:** Handle non-deterministic results in event sourcing
- Events that cause non-deterministic result are problem
- API calls that grab new token every time
- Non-deterministic results break event sourcing
- Need to handle side effects carefully
- Persisting context only as alternative

**Non-Deterministic Challenges:**
- API calls with non-deterministic results
- Token generation
- Side effects in event sourcing
- Need to handle carefully
- Persisting context as alternative

**Constitutional Rules:**
- Handle non-deterministic results carefully
- API calls break event sourcing
- Side effects need special handling
- Persisting context as alternative
- Deterministic results preferred

**PING Application:**
- Event Service should handle non-deterministic results
- API calls break event sourcing
- Side effects need special handling
- Persisting context as alternative
- Deterministic results preferred

---

### 6. Action Replay

**Pattern:** Control whether actions are replayed
- Actions that have already executed will not be re-executed
- Event sourcing preferred for replaying actions
- v5 changes behavior: actions not replayed from persisted state
- Built-in actions like assign(), raise() executed regardless
- Opt-in or opt-out logic for action replay

**Action Replay Features:**
- Actions not re-executed by default
- Event sourcing for replaying actions
- v5: actions not replayed from persisted state
- Built-in actions executed regardless
- Opt-in/opt-out logic

**Constitutional Rules:**
- Actions not re-executed by default
- Event sourcing for replaying actions
- Built-in actions executed regardless
- Opt-in/opt-out logic
- Consistent behavior

**PING Application:**
- Event Service should control action replay
- Actions not re-executed by default
- Event sourcing for replaying actions
- Built-in actions executed regardless
- Opt-in/opt-out logic

---

### 7. Actor Persistence

**Pattern:** Persist hierarchical group of actors
- Persisting systems (hierarchical group of actors) is challenge
- Serialize state to JSON only has ID for actors, not their state
- Need to serialize each actor state separately
- Rehydrate whole system for automated solution
- Propagate changes between actors

**Actor Persistence Challenges:**
- Hierarchical group of actors
- Serialize state to JSON only has ID
- Need to serialize each actor separately
- Rehydrate whole system
- Propagate changes between actors

**Constitutional Rules:**
- Hierarchical actor persistence
- Serialize each actor separately
- Rehydrate whole system
- Propagate changes between actors
- Automated solution needed

**PING Application:**
- Event Service should support actor persistence
- Hierarchical event actor persistence
- Serialize each actor separately
- Rehydrate whole system
- Propagate changes between actors

---

### 8. State Incompatibility

**Pattern:** Handle incompatible state on machine changes
- Incompatible state if machine or actor logic changes
- Restored state may be incompatible with new logic
- Event sourcing preferred for this use case
- State must be serializable (JSON-serializable)
- Cannot persist functions, classes, non-serializable values

**State Incompatibility Challenges:**
- Machine logic changes cause incompatibility
- Restored state incompatible with new logic
- Event sourcing preferred
- State must be serializable
- Cannot persist non-serializable values

**Constitutional Rules:**
- Handle state incompatibility
- Event sourcing preferred
- State must be serializable
- Cannot persist non-serializable values
- JSON-serializable only

**PING Application:**
- Event Service should handle state incompatibility
- Event sourcing preferred
- State must be serializable
- Cannot persist non-serializable values
- JSON-serializable only

---

### 9. Event Schema Evolution

**Pattern:** Evolve event schema over time
- Evolve event schema over time via event sourcing methodologies
- Event payloads form public API
- Schema of event payloads may not change quickly
- Event payloads more suitable for API boundary than states
- Event schema evolution requires careful design

**Schema Evolution Strategies:**
- Event sourcing methodologies for schema evolution
- Event payloads as public API
- Slow schema evolution
- Event payloads as API boundary
- Careful design required

**Constitutional Rules:**
- Event schema evolution via event sourcing
- Event payloads as public API
- Slow schema evolution
- Event payloads as API boundary
- Careful design required

**PING Application:**
- Event Service should support event schema evolution
- Event payloads as public API
- Slow schema evolution
- Event payloads as API boundary
- Careful design required

---

### 10. Audit Log

**Pattern:** Audit log of meaningful events
- Event sourcing provides audit log of meaningful events
- Describes how arrived at current state
- Extremely valuable for monitoring and debugging
- Complete history of state changes
- Replayable for debugging

**Audit Log Features:**
- Audit log of meaningful events
- Describes how arrived at current state
- Valuable for monitoring
- Valuable for debugging
- Complete history

**Constitutional Rules:**
- Audit log of meaningful events
- Describes how arrived at current state
- Valuable for monitoring
- Valuable for debugging
- Complete history

**PING Application:**
- Event Service should provide audit log
- Audit log of meaningful events
- Describes how arrived at current state
- Valuable for monitoring
- Valuable for debugging

---

## Implementation Patterns

### Event Sourcing
- Persist events as they happen
- Replay events to restore state
- Inspection API for monitoring
- Filter events by type and actor
- Store events in localStorage or other storage

### State Machine Versioning
- Persist sequence of events
- Current state ephemeral
- Reconstruct by replaying events
- Change implementation at any time
- Retain ability to process same events

### Defer/Recall Pattern
- Defer events not accepted in state
- Recall deferred events on state change
- Wildcard transition for deferring
- Recall action for processing
- Unstuck workflow

---

## Anti-Patterns to Avoid

### 1. Persisting State Instead of Events
- **Problem:** Incompatible state on machine changes
- **Solution:** Use event sourcing instead of persisting state

### 2. Non-Deterministic Results in Event Sourcing
- **Problem:** Breaks replayability
- **Solution:** Handle non-deterministic results carefully, use deterministic operations

### 3. Replaying Actions by Default
- **Problem:** Side effects re-executed
- **Solution:** Control action replay with opt-in/opt-out logic

### 4. Ignoring Actor Hierarchy
- **Problem:** Cannot persist hierarchical actors
- **Solution:** Serialize each actor separately, rehydrate whole system

### 5. Fast Event Schema Changes
- **Problem:** Breaks event sourcing
- **Solution:** Slow schema evolution, event payloads as public API

---

## PING-Specific Recommendations

### Event Service
- Implement event sourcing
- Support state machine versioning
- Implement defer/recall pattern
- Handle non-deterministic results
- Control action replay

### State Machine Service
- Support event schema evolution
- Provide audit log
- Handle state incompatibility
- Support actor persistence
- Implement inspection API

### Replay Service
- Replay events to restore state
- Control action replay
- Handle non-deterministic results
- Support state machine versioning
- Provide audit log

### Persistence Service
- Persist events as they happen
- Serialize each actor separately
- Rehydrate whole system
- Support hierarchical actors
- Propagate changes between actors

---

## Performance Considerations

### Event Sourcing Performance
- Replay events to restore state
- Event sourcing more reliable than persisting state
- Less prone to incompatible state
- Allows replaying actions
- Audit log for debugging

### State Machine Performance
- Event payloads as public API
- States and transitions as implementation details
- Can change implementation at any time
- Retain ability to process same events
- Audit log for monitoring

### Actor Persistence Performance
- Hierarchical actor persistence
- Serialize each actor separately
- Rehydrate whole system
- Propagate changes between actors
- Automated solution needed

---

## Monitoring and Observability

### Event Metrics
- Event processing rate
- Event replay rate
- Event schema evolution rate
- Event incompatibility rate
- Event audit log size

### State Machine Metrics
- State transition rate
- State incompatibility rate
- State machine version rate
- Defer/recall rate
- Action replay rate

### Actor Metrics
- Actor creation rate
- Actor persistence rate
- Actor rehydration rate
- Actor hierarchy depth
- Actor propagation rate

---

## Migration Path

### From State Persistence to Event Sourcing
1. Implement inspection API
2. Persist events as they happen
3. Replay events to restore state
4. Handle non-deterministic results
5. Implement defer/recall pattern

### From Simple State Machines to Versioned State Machines
1. Persist sequence of events
2. Make current state ephemeral
3. Reconstruct by replaying events
4. Change implementation at any time
5. Retain ability to process same events

---

## References

- [XState Persistence](https://stately.ai/docs/persistence)
- [Persisting State with Actors](https://github.com/statelyai/xstate/discussions/1515)
- [Migrating State Chart](https://github.com/statelyai/xstate/discussions/1338)
- [Persistence with Actors](https://github.com/statelyai/xstate/discussions/1832)
- [Do Not Replay Actions](https://github.com/statelyai/xstate/pull/3888)
