# Phase A: Event Flow Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Event Flow Analysis

---

## Event Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Producers                           │
│              (API, Runtime, External Systems)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Store                               │
│              (PostgreSQL - events table)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   NATS       │  │   Kernel     │  │  Authorities │
│  (Transport) │  │ (Projections) │  │  (Validation) │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Consumers                           │
│              (Projections, Subscribers, Replay)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Types

### Domain Events
**Location:** `constitution/models/event.py`

**Event Types:**
- `MissionQueued` - Mission queued for execution
- `MissionStarted` - Mission execution started
- `MissionCompleted` - Mission execution completed
- `MissionFailed` - Mission execution failed
- `MissionCancelled` - Mission execution cancelled
- `CapabilityInvoked` - Capability invoked
- `EvidenceCollected` - Evidence collected
- `SnapshotCreated` - Snapshot created
- `ProjectionUpdated` - Projection updated

### Infrastructure Events
**Location:** `constitution/models/event.py`

**Event Types:**
- `ServiceStarted` - Service started
- `ServiceStopped` - Service stopped
- `ServiceDegraded` - Service degraded
- `DatabaseConnected` - Database connected
- `DatabaseDisconnected` - Database disconnected
- `TransportConnected` - Transport connected
- `TransportDisconnected` - Transport disconnected

---

## Event Flow Matrix

### 1. Event Creation Flow

**Producer:** API Layer
**Endpoint:** `POST /events`
**Location:** `api/main.py`

**Flow:**
```
Client
  │
  ▼ POST /events
API Layer (api/main.py)
  │
  ├─► Validate EventRequestDTO
  │
  ├─► Create EventEnvelope
  │   │
  │   ├─► event_type
  │   ├─► event_category (DomainEvent/InfrastructureEvent)
  │   ├─► payload
  │   ├─► occurred_at
  │   ├─► recorded_at
  │   ├─► schema_version
  │   ├─► global_sequence (assigned by database)
  │   ├─► correlation_id
  │   ├─► causality_id
  │   ├─► producer_id
  │   ├─► caused_by_command_id
  │   └─► aggregate_sequence
  │
  ├─► Persist to PostgreSQL
  │   │
  │   └─► storage.postgres.database.get_session()
  │       │
  │       └─► INSERT events table
  │           │
  │           └─► global_sequence assigned by database
  │
  ├─► Publish to NATS
  │   │
  │   └─► transport.nats.transport.publish()
  │       │
  │       └─► NATS: constitutional.events.{event_type}
  │
  └─► Return EventResponseDTO
```

**Event Envelope Structure:**
```python
EventEnvelope:
  - event_id: str (UUID)
  - event_type: str
  - event_category: EventCategory
  - payload: Dict[str, Any]
  - occurred_at: datetime
  - recorded_at: datetime
  - processed_at: Optional[datetime]
  - schema_version: str
  - global_sequence: int (database-assigned)
  - correlation_id: Optional[str]
  - causality_id: Optional[str]
  - producer_id: Optional[str]
  - caused_by_command_id: Optional[str]
  - aggregate_sequence: Optional[int]
  - event_hash: str
```

---

### 2. Command Creation Flow

**Producer:** API Layer
**Endpoint:** `POST /commands`
**Location:** `api/main.py`

**Flow:**
```
Client
  │
  ▼ POST /commands
API Layer (api/main.py)
  │
  ├─► Validate CommandRequestDTO
  │
  ├─► Create Command
  │   │
  │   ├─► command_id
  │   ├─► command_type
  │   ├─► parameters
  │   ├─► created_at
  │   ├─► aggregate_id
  │   └─► aggregate_version
  │
  ├─► Persist to PostgreSQL
  │   │
  │   └─► storage.postgres.database.get_session()
  │       │
  │       └─► INSERT commands table
  │
  ├─► Publish to NATS
  │   │
  │   └─► transport.nats.transport.publish()
  │       │
  │       └─► NATS: constitutional.commands
  │
  └─► Return CommandResponseDTO
```

**Command Structure:**
```python
Command:
  - command_id: str (UUID)
  - command_type: str
  - parameters: Dict[str, Any]
  - created_at: datetime
  - aggregate_id: Optional[str]
  - aggregate_version: Optional[int]
  - status: str
```

---

### 3. Mission Event Flow

**Producer:** Hermes Runtime
**Location:** `hermes/hermes_runtime.py`

**Flow:**
```
Client
  │
  ▼ submit_mission()
Hermes Runtime (hermes/hermes_runtime.py)
  │
  ├─► Create Mission (MissionFactory)
  │
  ├─► Serialize Mission (MissionSerializer)
  │
  ├─► Enqueue Mission (MissionQueue)
  │
  ├─► Save Initial State (MissionStateStore)
  │
  ├─► Emit MissionQueued Event (EventBus)
  │   │
  │   └─► transport.nats.transport.publish()
  │       │
  │       └─► NATS: constitutional.events.MissionQueued
  │
  └─► Return mission_id
      │
      ▼
Executor Loop
  │
  ├─► Dequeue Mission (MissionQueue)
  │
  ├─► Emit MissionStarted Event (EventBus)
  │   │
  │   └─► NATS: constitutional.events.MissionStarted
  │
  ├─► Execute Mission (RuntimeRouter)
  │   │
  │   ├─► Emit CapabilityInvoked Event (EventBus)
  │   │   │
  │   │   └─► NATS: constitutional.events.CapabilityInvoked
  │   │
  │   └─► Emit EvidenceCollected Event (EventBus)
  │       │
  │       └─► NATS: constitutional.events.EvidenceCollected
  │
  ├─► Emit MissionCompleted Event (EventBus)
  │   │
  │   └─► NATS: constitutional.events.MissionCompleted
  │
  └─► Update State (MissionStateStore)
```

---

### 4. Event Replay Flow

**Producer:** API Layer
**Endpoint:** `GET /replay`
**Location:** `api/main.py`

**Flow:**
```
Client
  │
  ▼ GET /replay?from_sequence=X&to_sequence=Y
API Layer (api/main.py)
  │
  ├─► Query Events from PostgreSQL
  │   │
  │   └─► storage.postgres.database.get_session()
  │       │
  │       └─► SELECT events WHERE global_sequence >= X AND global_sequence <= Y
  │           │
  │           └─► ORDER BY global_sequence
  │
  ├─► Replay Events (TODO: Not Implemented)
  │   │
  │   ├─► For each event:
  │   │   │
  │   │   ├─► Load Projection State
  │   │   │
  │   │   ├─► Apply Event to Projection
  │   │   │
  │   │   ├─► Validate with Authority
  │   │   │
  │   │   └─► Update Projection State
  │
  └─► Return Replay Results
```

**Note:** Actual replay logic is not implemented (marked as TODO in code)

---

### 5. Event Subscription Flow

**Consumer:** Kernel Projections
**Location:** `kernel/projection.py`

**Flow:**
```
NATS Transport
  │
  ▼ Subscribe to constitutional.events.*
Kernel Projection
  │
  ├─► Receive Event
  │
  ├─► Validate Event Schema
  │
  ├─► Validate Event Hash
  │
  ├─► Load Projection State
  │
  ├─► Apply Event to Projection
  │
  ├─► Validate with Authority
  │   │
  │   └─► authority.projection_authority.validate_projection_state()
  │
  ├─► Update Projection State
  │
  ├─► Validate Witness
  │   │
  │   └─► authority.projection_authority.validate_witness()
  │
  └─► Persist Projection State
```

---

## Event Store Schema

### Events Table
**Location:** `storage/postgres/models.py`

```python
Event:
  - event_id: str (UUID, primary key)
  - event_type: str
  - event_category: str
  - payload: JSON
  - occurred_at: datetime
  - recorded_at: datetime
  - processed_at: Optional[datetime]
  - correlation_id: Optional[str]
  - causality_id: Optional[str]
  - producer_id: Optional[str]
  - caused_by_command_id: Optional[str]
  - schema_version: str
  - global_sequence: int (database sequence)
  - aggregate_sequence: Optional[int]
  - event_hash: str
```

### Commands Table
**Location:** `storage/postgres/models.py`

```python
Command:
  - command_id: str (UUID, primary key)
  - command_type: str
  - parameters: JSON
  - aggregate_id: Optional[str]
  - created_at: datetime
  - status: str
```

---

## Event Flow Issues

### 1. Missing Replay Implementation
**Status:** High Risk
**Location:** `api/main.py` (line 319)

**Issue:** Event replay is marked as TODO and not implemented
**Impact:** Cannot reconstruct state from event log
**Recommendation:** Implement replay logic with projection updates

### 2. No Event Validation
**Status:** Medium Risk
**Location:** `api/main.py`

**Issue:** Events are not validated against schema before persistence
**Impact:** Invalid events can corrupt event store
**Recommendation:** Add schema validation before persistence

### 3. No Event Deduplication
**Status:** Medium Risk
**Location:** `api/main.py`

**Issue:** Event deduplication only checks event_id, not content
**Impact:** Duplicate events with different IDs can be created
**Recommendation:** Add content-based deduplication

### 4. No Event Ordering Guarantee
**Status:** High Risk
**Location:** `api/main.py`

**Issue:** global_sequence is assigned by database but not used for ordering
**Impact:** Event ordering may be inconsistent
**Recommendation:** Use global_sequence for all event ordering

### 5. No Event Versioning
**Status:** Medium Risk
**Location:** `constitution/models/event.py`

**Issue:** Event schema version is stored but not used for migration
**Impact:** Cannot handle event schema evolution
**Recommendation:** Implement event schema migration logic

---

## NATS Subject Naming

### Event Subjects
```
constitutional.events.{event_type}
```

**Examples:**
- `constitutional.events.MissionQueued`
- `constitutional.events.MissionStarted`
- `constitutional.events.MissionCompleted`
- `constitutional.events.CapabilityInvoked`
- `constitutional.events.EvidenceCollected`

### Command Subjects
```
constitutional.commands
```

**Note:** All commands are published to a single subject

---

## Event Flow Visualization

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       ▼ POST /events
┌──────────────┐
│  API Layer   │
└──────┬───────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    NATS      │
│  (Event Log) │  │  (Transport) │
└──────┬───────┘  └──────┬───────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────┐  ┌──────────────┐
│   Kernel     │  │  Subscribers │
│ (Projections)│  │  (Consumers) │
└──────────────┘  └──────────────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────┐  ┌──────────────┐
│  Authorities │  │   Replay     │
│ (Validation) │  │  (Rebuild)   │
└──────────────┘  └──────────────┘
```

---

## Event Flow Dependencies

### Event Creation Dependencies
- PostgreSQL connection
- NATS connection
- Event model validation
- Event envelope creation

### Event Replay Dependencies
- PostgreSQL connection
- Projection state loading
- Authority validation
- Projection state persistence

### Event Subscription Dependencies
- NATS connection
- Projection state loading
- Authority validation
- Projection state persistence

---

## Recommendations

1. **Implement Replay Logic:** Complete event replay implementation
2. **Add Event Validation:** Validate events against schema before persistence
3. **Add Event Deduplication:** Implement content-based deduplication
4. **Use Global Sequence:** Use global_sequence for all event ordering
5. **Implement Event Versioning:** Handle event schema evolution
6. **Add Event Metrics:** Track event flow metrics
7. **Add Event Tracing:** Add distributed tracing for events
8. **Add Event Dead Letter Queue:** Handle failed events
9. **Add Event Retention:** Implement event retention policy
10. **Add Event Archival:** Archive old events

---

## Next Steps

- Implement event replay logic
- Add event schema validation
- Implement content-based deduplication
- Use global_sequence for ordering
- Implement event schema migration
- Add event flow metrics
