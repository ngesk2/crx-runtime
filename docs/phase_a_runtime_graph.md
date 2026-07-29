# Phase A: Runtime Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Runtime Architecture Analysis

---

## Runtime Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Entry Points                              │
│              (API, CLI, Hermes Runtime)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Runtime Context                           │
│              (ExecutionContext, InfrastructureContext)        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Kernel     │  │   Runtime    │  │  Execution   │
│  (Scheduler) │  │  (Services)  │  │  (Engine)    │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Authorities │  │  Capabilities│  │   Evidence   │
│ (Validation) │  │  (Registry)  │  │  (Compiler)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Runtime Entry Points

### 1. API Entry Point
**Location:** `api/main.py`
**Framework:** FastAPI
**Startup:** `uvicorn api.main:app`

**Runtime Flow:**
```
uvicorn api.main:app
  │
  ▼ create_app(settings)
FastAPI Application
  │
  ├─► Configure logging
  │
  ├─► Create observability instance
  │
  ├─► Setup lifespan handler
  │   │
  │   ├─► Startup: Initialize NATS transport
  │   │
  │   └─► Shutdown: Close NATS transport
  │
  └─► Register endpoints
      │
      ├─► /health
      ├─► /ready
      ├─► /events
      ├─► /commands
      ├─► /replay
      └─► /metrics
```

---

### 2. Hermes Runtime Entry Point
**Location:** `hermes/hermes_runtime.py`
**Framework:** asyncio
**Startup:** `python -m hermes.hermes_runtime`

**Runtime Flow:**
```
HermesRuntime()
  │
  ▼ start()
Runtime Initialization
  │
  ├─► Update runtime state (STARTING)
  │
  ├─► Initialize state store
  │
  ├─► Bootstrap registration
  │
  ├─► Initialize scheduler
  │
  ├─► Update runtime state (RUNNING)
  │
  ├─► Start executor loop
  │
  └─► Setup signal handlers
      │
      ▼
Executor Loop
  │
  ├─► Dequeue mission
  │
  ├─► Execute mission
  │
  ├─► Update state
  │
  └─► Emit events
```

---

### 3. CLI Entry Point
**Location:** Not implemented
**Framework:** None
**Startup:** N/A

**Status:** Missing from implementation

---

## Runtime Context

### ExecutionContext
**Location:** `runtime/execution_context.py`

**Purpose:** Provides execution context for operations

**Components:**
- Mission context
- Capability context
- Evidence context
- State context

**Dependencies:**
- `typing`
- `dataclasses`

---

### InfrastructureContext
**Location:** `runtime/infrastructure_context.py`

**Purpose:** Provides infrastructure context for operations

**Components:**
- Database context
- Transport context
- Storage context
- Network context

**Dependencies:**
- `typing`
- `dataclasses`

---

## Runtime Services

### 1. Kernel Services
**Location:** `kernel/`

**Services:**
- `scheduler.py` - Job scheduling and execution
- `aggregate.py` - Aggregate management
- `projection.py` - Projection management
- `command_bus.py` - Command handling
- `event_dag.py` - Event DAG management
- `invariant_engine.py` - Invariant checking
- `state_machine.py` - State machine management
- `snapshot.py` - Snapshot management
- `replay.py` - Replay functionality

**Runtime Characteristics:**
- In-memory state (scheduler)
- Database-backed (aggregate, projection)
- Event-driven (command_bus, event_dag)
- State machine-based (state_machine)

---

### 2. Runtime Services
**Location:** `runtime/`

**Services:**
- `oracle/oracle.py` - Oracle subsystem (code review)
- `planner/planner.py` - Planner subsystem (planning)
- `executor/executor.py` - Executor subsystem (execution)
- `planning/planning_ir.py` - Planning Intermediate Representation
- `planning/general_planner.py` - General planning implementation
- `security/capability_broker.py` - Capability management
- `evidence/evidence_compiler.py` - Evidence generation
- `scheduler/constitutional_scheduler.py` - Constitutional scheduler
- `scheduler/vps_scheduler.py` - VPS scheduler
- `loop.py` - Runtime loop
- `observability.py` - Observability

**Runtime Characteristics:**
- Factory-based (replaced singletons)
- Async/await based
- Evidence-focused
- Security-focused

---

### 3. Execution Services
**Location:** `hermes/execution/`

**Services:**
- `queue.py` - Mission queue
- `queue_backend.py` - Queue backend implementations
- `executor.py` - Mission executor
- `executor_pool.py` - Executor pool
- `lease.py` - Lease management
- `lifecycle.py` - Lifecycle management
- `state_store.py` - State storage
- `context.py` - Execution context

**Runtime Characteristics:**
- Persistent queue (SQLite, Redis, NATS)
- Lease-based execution
- State machine-based lifecycle
- Database-backed state

---

### 4. Runtime Services (Hermes)
**Location:** `hermes/runtime/`

**Services:**
- `artifact_backend.py` - Artifact backend
- `artifact_repository.py` - Artifact repository
- `bootstrap_loader.py` - Bootstrap loader
- `event_bus.py` - Event bus
- `execution_context.py` - Execution context
- `mission_factory.py` - Mission factory
- `mission_store.py` - Mission store
- `pipeline.py` - Execution pipeline
- `pipeline_stages.py` - Pipeline stages
- `resolver.py` - Capability resolver
- `router.py` - Runtime router
- `serializer.py` - Mission serializer
- `unit_of_work.py` - Unit of work

**Runtime Characteristics:**
- Event-driven
- Factory-based
- Repository pattern
- Pipeline-based execution

---

## Runtime State Management

### RuntimeState
**Location:** `hermes/execution/`

**Purpose:** Tracks runtime state and lifecycle

**States:**
- STOPPED
- STARTING
- RUNNING
- STOPPING

**Properties:**
- lifecycle
- healthy
- uptime_seconds
- mission_count
- active_lease

---

### MissionState
**Location:** `hermes/execution/state_store.py`

**Purpose:** Tracks mission state

**States:**
- QUEUED
- RUNNING
- COMPLETED
- FAILED
- CANCELLED

**Properties:**
- mission_id
- lifecycle
- created_at
- updated_at
- result
- error
- lease_id

---

### JobState
**Location:** `kernel/scheduler.py`

**Purpose:** Tracks job state

**States:**
- PENDING
- RUNNING
- COMPLETED
- FAILED
- CANCELLED

**Properties:**
- job_id
- status
- priority
- scheduled_at
- started_at
- completed_at

---

## Runtime Lifecycle

### API Lifecycle
```
Startup:
  1. Configure logging
  2. Create observability instance
  3. Initialize NATS transport
  4. Register endpoints
  5. Start HTTP server

Shutdown:
  1. Stop HTTP server
  2. Close NATS transport
  3. Cleanup resources
```

### Hermes Runtime Lifecycle
```
Startup:
  1. Update runtime state (STARTING)
  2. Initialize state store
  3. Bootstrap registration
  4. Initialize scheduler
  5. Update runtime state (RUNNING)
  6. Start executor loop
  7. Setup signal handlers

Shutdown:
  1. Update runtime state (STOPPING)
  2. Signal shutdown event
  3. Stop executor loop
  4. Stop scheduler
  5. Shutdown capabilities
  6. Update runtime state (STOPPED)
```

### Scheduler Lifecycle
```
Startup:
  1. Initialize job queue
  2. Sort queue deterministically
  3. Start worker loop
  4. Register enqueue method

Shutdown:
  1. Stop worker loop
  2. Cancel pending jobs
  3. Cleanup resources
```

---

## Runtime Resource Management

### Database Connections
**Management:** SQLAlchemy connection pooling
**Location:** `storage/postgres/database.py`

**Characteristics:**
- Async connection pool
- Automatic connection management
- Transaction management via AsyncSession

### NATS Connections
**Management:** Singleton NATS transport
**Location:** `transport/nats/transport.py`

**Characteristics:**
- Singleton connection
- Automatic reconnection
- Subject-based publishing/subscribing

### Capability Instances
**Management:** CapabilityRegistry
**Location:** `constitution/registry/capability_registry.py`

**Characteristics:**
- Singleton registry
- Instance lifecycle management
- Health monitoring

### Mission State
**Management:** MissionStateStore
**Location:** `hermes/execution/state_store.py`

**Characteristics:**
- SQLite persistence
- State machine-based lifecycle
- Lease tracking

---

## Runtime Concurrency Model

### API Layer
**Model:** Async/await with FastAPI
**Concurrency:** Async HTTP handling
**Thread Safety:** Async-safe (no shared mutable state)

### Hermes Runtime
**Model:** Async/await with asyncio
**Concurrency:** Async mission execution
**Thread Safety:** Async-safe (protected by locks)

### Kernel Scheduler
**Model:** Async/await with asyncio
**Concurrency:** Async job execution
**Thread Safety:** Async-safe (protected by locks)

### Storage Layer
**Model:** Async/await with SQLAlchemy
**Concurrency:** Async database operations
**Thread Safety:** Async-safe (connection pooling)

---

## Runtime Error Handling

### API Layer
**Strategy:** HTTP exception handling
**Mechanism:** FastAPI exception handlers
**Recovery:** Return error responses

### Hermes Runtime
**Strategy:** Exception logging and state updates
**Mechanism:** try/except blocks
**Recovery:** Continue executor loop

### Kernel Scheduler
**Strategy:** Job failure tracking
**Mechanism:** Job state transitions
**Recovery:** Retry failed jobs

### Storage Layer
**Strategy:** Transaction rollback
**Mechanism:** SQLAlchemy transaction management
**Recovery:** Retry on connection errors

---

## Runtime Monitoring

### Observability
**Location:** `runtime/observability.py`

**Metrics:**
- Request count
- Request duration
- Error count
- Active connections
- Queue depth

**Mechanism:** Prometheus metrics

### Health Checks
**Locations:** Multiple

**API Layer:**
- `/health` - Basic health
- `/ready` - Dependency readiness

**Hermes Runtime:**
- `health_check()` - Runtime health
- `get_stats()` - Runtime statistics

**Kernel Scheduler:**
- Job queue depth
- Active job count

---

## Runtime Issues

### 1. In-Memory Scheduler State
**Status:** High Risk
**Location:** `kernel/scheduler.py`

**Issue:** Scheduler state is in-memory, not persisted
**Impact:** State lost on restart, no replayability
**Recommendation:** Persist scheduler state to database

### 2. Singleton Pattern in CapabilityRegistry
**Status:** High Risk
**Location:** `constitution/registry/capability_registry.py`

**Issue:** Global registry instance creates hidden dependencies
**Impact:** Difficult to test, creates global state
**Recommendation:** Replace with dependency injection

### 3. No Graceful Shutdown for API
**Status:** Medium Risk
**Location:** `api/main.py`

**Issue:** No graceful shutdown for in-flight requests
**Impact:** Requests may be interrupted
**Recommendation:** Implement graceful shutdown

### 4. No Resource Limits
**Status:** Medium Risk
**Location:** All runtime services

**Issue:** No resource limits (memory, CPU, connections)
**Impact:** Resource exhaustion possible
**Recommendation:** Add resource limits

### 5. No Deadlock Detection
**Status:** Low Risk
**Location:** Async operations

**Issue:** No deadlock detection for async operations
**Impact:** Potential deadlocks
**Recommendation:** Add deadlock detection

---

## Runtime Performance

### API Layer
**Framework:** FastAPI
**Performance:** High (async)
**Bottlenecks:** Database queries, NATS publishing

### Hermes Runtime
**Framework:** asyncio
**Performance:** High (async)
**Bottlenecks:** Mission execution, state persistence

### Kernel Scheduler
**Framework:** asyncio
**Performance:** High (async)
**Bottlenecks:** Job execution, queue operations

### Storage Layer
**Framework:** SQLAlchemy + asyncpg
**Performance:** High (async)
**Bottlenecks:** Database queries, connection pool

---

## Runtime Security

### Capability Broker
**Location:** `runtime/security/capability_broker.py`

**Security Features:**
- Zero-trust capability management
- Lease-based access control
- Audit logging
- Bypass detection

### Evidence Collection
**Location:** `runtime/evidence/evidence_compiler.py`

**Security Features:**
- Mandatory evidence collection
- Evidence validation
- Evidence verification

### Constitutional Enforcement
**Location:** Multiple authorities

**Security Features:**
- Authority-based validation
- Constitutional law enforcement
- Immutable state tracking

---

## Recommendations

1. **Persist Scheduler State:** Move scheduler state to database
2. **Eliminate Singletons:** Replace with dependency injection
3. **Implement Graceful Shutdown:** Handle in-flight requests
4. **Add Resource Limits:** Prevent resource exhaustion
5. **Add Deadlock Detection:** Detect async deadlocks
6. **Add Runtime Metrics:** Monitor runtime performance
7. **Add Distributed Tracing:** Track request flow
8. **Add Rate Limiting:** Protect against abuse
9. **Add Circuit Breakers:** Prevent cascading failures
10. **Add Runtime Profiling:** Identify performance bottlenecks

---

## Next Steps

- Implement scheduler state persistence
- Replace singleton pattern with dependency injection
- Implement graceful shutdown for API
- Add resource limits to runtime services
- Add deadlock detection for async operations
- Add comprehensive runtime metrics
- Add distributed tracing
