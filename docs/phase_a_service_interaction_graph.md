# Phase A: Service Interaction Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Service Interaction Analysis

---

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                          │
│              (HTTP, CLI, Other Services)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│              (FastAPI - api/main.py)                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    NATS      │  │  Observability│
│   (Storage)  │  │  (Transport) │  │   (Metrics)   │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hermes Runtime                             │
│              (hermes/hermes_runtime.py)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Kernel     │  │   Runtime    │  │  Execution   │
│  (Scheduler) │  │  (Services)  │  │  (Engine)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Service Interaction Matrix

### 1. API Layer (`api/main.py`)

**Service Type:** HTTP API Server
**Framework:** FastAPI
**Port:** 8000 (configurable)

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| PostgreSQL | AsyncSession | Event/Command persistence | PostgreSQL protocol |
| NATS | publish() | Event/Command publishing | NATS protocol |
| Constitution Models | import | Event/Command validation | Python import |
| Runtime Observability | get_metrics() | Metrics collection | Python method call |
| Config Settings | import | Configuration | Python import |

**Endpoints:**
- `GET /health` - Health check
- `GET /ready` - Readiness check (PostgreSQL, NATS)
- `POST /events` - Create event
- `POST /commands` - Create command
- `GET /events` - List events
- `GET /replay` - Replay events
- `GET /metrics` - Get metrics

**Dependencies:**
- `constitution.models.event` - EventEnvelope, DomainEvent, InfrastructureEvent
- `constitution.models.command` - Command
- `storage.postgres.database` - get_session
- `storage.postgres.models` - Event, Command models
- `storage.repositories` - PostgresEventRepository
- `transport.nats.transport` - get_nats_transport, close_nats_transport
- `config.settings` - Settings
- `config.logging` - configure_logging, get_logger
- `runtime.observability` - Observability
- `api.dto` - DTOs

---

### 2. Hermes Runtime (`hermes/hermes_runtime.py`)

**Service Type:** Long-running Process
**Framework:** asyncio
**Database:** SQLite (hermes_missions.db)

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| Constitution Registry | get_registry() | Capability discovery | Python method call |
| Hermes Execution | MissionQueue, etc. | Mission execution | Python method call |
| Hermes Runtime Services | EventBus, etc. | Runtime services | Python method call |
| Kernel Scheduler | Scheduler | Task scheduling | Python method call |

**Components:**
- CapabilityRegistry - Capability discovery and execution
- MissionQueue - Mission queuing
- LeaseManager - Distributed lease management
- MissionStateStore - Mission state persistence
- EventBus - Event publishing
- CanonicalArtifactRepository - Artifact storage
- CapabilityResolver - Capability resolution
- ExecutionPipeline - Mission execution pipeline
- RuntimeRouter - Mission routing
- MissionFactory - Mission creation
- MissionSerializer - Mission serialization
- BootstrapLoader - Bootstrap registration
- Kernel Scheduler - Task scheduling

**Dependencies:**
- `constitution.registry` - get_registry
- `hermes.execution` - MissionQueue, RuntimeState, RuntimeLifecycle, LeaseManager, MissionStateStore
- `hermes.runtime` - RuntimeRouter, CapabilityResolver, ExecutionPipeline, CanonicalArtifactRepository, EventBus, MissionFactory, MissionSerializer, BootstrapLoader
- `kernel.scheduler` - Scheduler

---

### 3. Kernel Scheduler (`kernel/scheduler.py`)

**Service Type:** In-memory Scheduler
**Framework:** asyncio
**Persistence:** None (in-memory)

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| Job Queue | heapq | Job scheduling | Python heapq |
| Job Tasks | asyncio.create_task | Job execution | Python asyncio |

**Components:**
- Job - Scheduled job representation
- JobStatus - Job status enumeration
- JobPriority - Job priority enumeration
- Scheduler - Job scheduling and execution
- SchedulerBackend - Abstract backend interface
- DramatiqBackend - Dramatiq backend implementation
- TemporalBackend - Temporal backend implementation

**Dependencies:**
- `asyncio` - Async execution
- `datetime` - Time handling
- `typing` - Type hints
- `enum` - Enumerations

---

### 4. Storage Layer (`storage/`)

**Service Type:** Database Layer
**Database:** PostgreSQL
**Framework:** SQLAlchemy + asyncpg

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| PostgreSQL | AsyncSession | Database operations | PostgreSQL protocol |

**Components:**
- `storage/postgres/database.py` - Database connection management
- `storage/postgres/models.py` - SQLAlchemy models
- `storage/postgres/event_stream.py` - Event stream operations
- `storage/repositories.py` - Repository pattern implementation
- `storage/artifact_store.py` - Artifact storage
- `storage/event_store.py` - Event storage

**Dependencies:**
- `sqlalchemy` - ORM
- `asyncpg` - Async PostgreSQL driver
- `config.settings` - Database configuration

---

### 5. Transport Layer (`transport/`)

**Service Type:** Message Transport
**Protocol:** NATS
**Framework:** nats-py

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| NATS Server | connect() | Connection establishment | NATS protocol |
| NATS Server | publish() | Message publishing | NATS protocol |
| NATS Server | subscribe() | Message subscription | NATS protocol |

**Components:**
- `transport/nats/client.py` - NATS client
- `transport/nats/transport.py` - Transport abstraction
- `transport/event_bus.py` - Event bus implementation

**Dependencies:**
- `nats-py` - NATS client library
- `asyncio` - Async execution

---

### 6. Runtime Layer (`runtime/`)

**Service Type:** Runtime Services
**Framework:** asyncio

**Interactions:**

| Target | Method | Purpose | Protocol |
|--------|--------|---------|----------|
| Planning IR | import | Planning representation | Python import |
| General Planner | get_general_planner() | Planning execution | Python method call |
| Capability Broker | create_capability_broker() | Capability management | Python method call |
| Evidence Compiler | create_evidence_compiler() | Evidence generation | Python method call |

**Components:**
- `runtime/oracle/oracle.py` - Oracle subsystem (code review)
- `runtime/planner/planner.py` - Planner subsystem (planning)
- `runtime/executor/executor.py` - Executor subsystem (execution)
- `runtime/planning/planning_ir.py` - Planning Intermediate Representation
- `runtime/planning/general_planner.py` - General planning implementation
- `runtime/security/capability_broker.py` - Capability management
- `runtime/evidence/evidence_compiler.py` - Evidence generation
- `runtime/scheduler/constitutional_scheduler.py` - Constitutional scheduler
- `runtime/scheduler/vps_scheduler.py` - VPS scheduler

**Dependencies:**
- `runtime.planning.planning_ir` - PlanningIR
- `runtime.planning.general_planner` - GeneralPlanner
- `asyncio` - Async execution
- `dataclasses` - Data structures
- `typing` - Type hints

---

## Service Interaction Flow

### Event Creation Flow

```
Client
  │
  ▼ POST /events
API Layer (api/main.py)
  │
  ├─► Validate EventRequestDTO
  │
  ├─► Create EventEnvelope
  │
  ├─► Persist to PostgreSQL
  │   │
  │   └─► storage.postgres.database.get_session()
  │       │
  │       └─► INSERT events table
  │
  ├─► Publish to NATS
  │   │
  │   └─► transport.nats.transport.publish()
  │       │
  │       └─► NATS: constitutional.events.{event_type}
  │
  └─► Return EventResponseDTO
```

### Command Creation Flow

```
Client
  │
  ▼ POST /commands
API Layer (api/main.py)
  │
  ├─► Validate CommandRequestDTO
  │
  ├─► Create Command
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

### Mission Execution Flow

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
  │
  └─► Return mission_id
      │
      ▼
Executor Loop
  │
  ├─► Dequeue Mission (MissionQueue)
  │
  ├─► Reconstruct Mission (MissionFactory)
  │
  ├─► Route Mission (RuntimeRouter)
  │   │
  │   └─► Resolve Capability (CapabilityResolver)
  │       │
  │       └─► Execute Capability (CapabilityRegistry)
  │
  ├─► Execute Pipeline (ExecutionPipeline)
  │   │
  │   ├─► Acquire Lease (LeaseManager)
  │   │
  │   ├─► Update State (MissionStateStore)
  │   │
  │   ├─► Collect Evidence (CanonicalArtifactRepository)
  │   │
  │   └─► Release Lease (LeaseManager)
  │
  └─► Emit MissionCompleted Event (EventBus)
```

---

## Service Dependency Issues

### 1. Tight Coupling to PostgreSQL
**Status:** High Risk
**Location:** API Layer, Storage Layer, Authorities

**Issue:** All services directly depend on PostgreSQL via AsyncSession
**Impact:** Difficult to test, no database abstraction
**Recommendation:** Create database interface abstraction

### 2. Tight Coupling to NATS
**Status:** Medium Risk
**Location:** API Layer, Transport Layer

**Issue:** Services directly depend on NATS protocol
**Impact:** Difficult to test, no transport abstraction
**Recommendation:** Create transport interface abstraction

### 3. In-memory Scheduler State
**Status:** High Risk
**Location:** Kernel Scheduler

**Issue:** Scheduler state is in-memory, not persisted
**Impact:** State lost on restart, no replayability
**Recommendation:** Persist scheduler state to database

### 4. Singleton Pattern in CapabilityRegistry
**Status:** High Risk
**Location:** Constitution Registry

**Issue:** Global registry instance creates hidden dependencies
**Impact:** Difficult to test, creates global state
**Recommendation:** Replace with dependency injection

### 5. Missing Service Discovery
**Status:** Medium Risk
**Location:** All services

**Issue:** Services have hardcoded dependencies
**Impact:** Difficult to reconfigure, no dynamic discovery
**Recommendation:** Implement service discovery mechanism

---

## Service Communication Protocols

### HTTP (API Layer)
- **Protocol:** HTTP/1.1
- **Framework:** FastAPI
- **Port:** 8000
- **Endpoints:** RESTful API
- **Authentication:** None (currently)
- **Rate Limiting:** None (currently)

### PostgreSQL (Storage Layer)
- **Protocol:** PostgreSQL wire protocol
- **Driver:** asyncpg
- **ORM:** SQLAlchemy
- **Connection Pooling:** SQLAlchemy pool
- **Transaction Management:** AsyncSession

### NATS (Transport Layer)
- **Protocol:** NATS
- **Driver:** nats-py
- **Subjects:** constitutional.events.*, constitutional.commands
- **Message Format:** JSON
- **Acknowledgment:** None (currently)

### Python Method Calls (Internal)
- **Protocol:** Python method calls
- **Framework:** asyncio
- **Serialization:** None (in-memory)
- **Error Handling:** Python exceptions

---

## Service Health Dependencies

### API Layer Health Dependencies
- PostgreSQL connection
- NATS connection

### Hermes Runtime Health Dependencies
- SQLite database
- CapabilityRegistry
- Kernel Scheduler

### Kernel Scheduler Health Dependencies
- None (in-memory)

### Storage Layer Health Dependencies
- PostgreSQL connection

### Transport Layer Health Dependencies
- NATS connection

### Runtime Services Health Dependencies
- None (stateless)

---

## Service Startup Order

```
1. PostgreSQL (external)
2. NATS (external)
3. Storage Layer (depends on PostgreSQL)
4. Transport Layer (depends on NATS)
5. Constitution Registry (independent)
6. Runtime Services (depends on Constitution Registry)
7. Kernel Scheduler (independent)
8. Hermes Runtime (depends on all above)
9. API Layer (depends on Storage, Transport, Runtime)
```

---

## Recommendations

1. **Create Database Interface:** Abstract PostgreSQL dependency
2. **Create Transport Interface:** Abstract NATS dependency
3. **Persist Scheduler State:** Move scheduler state to database
4. **Eliminate Singletons:** Replace with dependency injection
5. **Implement Service Discovery:** Enable dynamic service configuration
6. **Add Health Checks:** Implement comprehensive health monitoring
7. **Add Circuit Breakers:** Prevent cascading failures
8. **Add Rate Limiting:** Protect API from abuse
9. **Add Authentication:** Secure API endpoints
10. **Add Message Acknowledgment:** Ensure NATS message delivery

---

## Next Steps

- Create database interface abstraction
- Create transport interface abstraction
- Implement scheduler state persistence
- Replace singleton pattern with dependency injection
- Implement service discovery mechanism
- Add comprehensive health checks
