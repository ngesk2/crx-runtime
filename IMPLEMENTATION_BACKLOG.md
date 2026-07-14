# Implementation Backlog

**Missing components for constitutional runtime completion.**

**Status:** Active implementation backlog

**Last Updated:** 2026-07-12

**Reference:** `ARCHITECTURE_INVENTORY.md` for complete inventory of existing components

---

## Overview

The constitutional framework has solid foundations (domain models, IR, registries, infrastructure). The remaining work is concentrated in three layers:

1. **Execution Layer** - Mission DAG execution engine
2. **Normalization Layer** - Evidence normalization and authorization pipeline  
3. **Runtime Layer** - Persistent Hermes runtime service

---

## Priority 1: Runtime Layer (Hermes)

### 1.1 Hermes Runtime
**File:** `hermes/hermes_runtime.py`

**Description:** Persistent long-running process that survives requests and owns mission execution, scheduling, retries, and state management.

**Requirements:**
- Long-running process (systemd service)
- Mission queue management
- Worker pool management
- Lease management for distributed execution
- Retry engine with exponential backoff
- State persistence
- Event emission
- Health monitoring loop
- Graceful shutdown
- Signal handling (SIGTERM, SIGINT)

**Interfaces:**
```python
class HermesRuntime:
    async def start() -> None
    async def stop() -> None
    async def submit_mission(mission: Mission) -> str
    async def cancel_mission(mission_id: str) -> bool
    async def get_mission_status(mission_id: str) -> Dict[str, Any]
    async def list_missions(status: Optional[MissionStatus] = None) -> List[Dict[str, Any]]
    async def get_stats() -> Dict[str, Any]
    async def health_check() -> Dict[str, Any]
```

**Dependencies:**
- CapabilityRegistry
- Mission model
- PostgreSQL (for persistence)
- NATS (for messaging, optional)

**Estimated Effort:** 3-5 days

---

### 1.2 Mission Queue
**File:** `hermes/mission_queue.py`

**Description:** Durable queue for mission submission and scheduling.

**Requirements:**
- Persistent queue (PostgreSQL or NATS)
- Priority-based scheduling
- Delayed execution support
- Dead letter queue
- Queue statistics
- Queue health monitoring

**Interfaces:**
```python
class MissionQueue:
    async def enqueue(mission: Mission, priority: int, delay: Optional[int]) -> str
    async def dequeue() -> Optional[Mission]
    async def peek() -> Optional[Mission]
    async def ack(mission_id: str) -> None
    async def nack(mission_id: str, retry: bool) -> None
    async def get_stats() -> Dict[str, Any]
```

**Dependencies:**
- PostgreSQL or NATS
- Mission model

**Estimated Effort:** 2-3 days

---

### 1.3 Worker Pool
**File:** `hermes/worker_pool.py`

**Description:** Pool of workers for parallel task execution.

**Requirements:**
- Configurable pool size
- Worker lifecycle management
- Task distribution
- Load balancing
- Worker health monitoring
- Graceful shutdown

**Interfaces:**
```python
class WorkerPool:
    async def start() -> None
    async def stop() -> None
    async def submit_task(task: Task) -> str
    async def get_stats() -> Dict[str, Any]
    async def health_check() -> Dict[str, Any]
```

**Dependencies:**
- asyncio
- Task model

**Estimated Effort:** 2-3 days

---

### 1.4 Timer Service
**File:** `hermes/timer.py`

**Description:** Timer service for delayed execution and scheduling.

**Requirements:**
- One-shot timers
- Recurring timers (cron-like)
- Timer cancellation
- Timer persistence
- Timer health monitoring

**Interfaces:**
```python
class TimerService:
    async def schedule(callback, delay: int) -> str
    async def schedule_recurring(callback, interval: int) -> str
    async def cancel(timer_id: str) -> bool
    async def get_stats() -> Dict[str, Any]
```

**Dependencies:**
- asyncio
- PostgreSQL (for persistence)

**Estimated Effort:** 1-2 days

---

### 1.5 Watchdog
**File:** `hermes/watchdog.py`

**Description:** Watchdog for monitoring and recovering from failures.

**Requirements:**
- Process monitoring
- Resource monitoring (CPU, memory)
- Health check monitoring
- Automatic recovery
- Alerting

**Interfaces:**
```python
class Watchdog:
    async def start() -> None
    async def stop() -> None
    async def add_check(check: Callable) -> None
    async def remove_check(check_id: str) -> bool
    async def get_status() -> Dict[str, Any]
```

**Dependencies:**
- psutil
- asyncio

**Estimated Effort:** 2-3 days

---

### 1.6 Health Loop
**File:** `hermes/health_loop.py`

**Description:** Periodic health checks and status reporting.

**Requirements:**
- Configurable interval
- Health check registration
- Status aggregation
- Alerting on failures
- Metrics emission

**Interfaces:**
```python
class HealthLoop:
    async def start() -> None
    async def stop() -> None
    async def register_check(name: str, check: Callable) -> None
    async def get_status() -> Dict[str, Any]
```

**Dependencies:**
- asyncio
- Prometheus (for metrics)

**Estimated Effort:** 1-2 days

---

## Priority 2: Execution Layer

### 2.1 Mission Executor
**File:** `constitution/execution/mission_executor.py`

**Description:** Engine for executing mission task DAGs.

**Requirements:**
- Task DAG execution
- Dependency resolution
- Parallel execution where possible
- State management
- Error handling
- Progress tracking
- Cancellation support

**Interfaces:**
```python
class MissionExecutor:
    async def execute(mission: Mission) -> Dict[str, Any]
    async def cancel(mission_id: str) -> bool
    async def get_progress(mission_id: str) -> Dict[str, Any]
    async def pause(mission_id: str) -> bool
    async def resume(mission_id: str) -> bool
```

**Dependencies:**
- Mission model
- Task model
- CapabilityRegistry

**Estimated Effort:** 4-5 days

---

### 2.2 Task Graph
**File:** `constitution/execution/task_graph.py`

**Description:** Task DAG representation and manipulation.

**Requirements:**
- Task DAG construction
- Dependency tracking
- Topological sorting
- Cycle detection
- Ready task calculation
- Critical path analysis

**Interfaces:**
```python
class TaskGraph:
    def add_task(task: Task) -> None
    def add_dependency(from_task: str, to_task: str) -> None
    def get_ready_tasks() -> List[Task]
    def get_critical_path() -> List[Task]
    def detect_cycles() -> bool
    def topological_sort() -> List[Task]
```

**Dependencies:**
- Task model
- graphlib (Python 3.9+)

**Estimated Effort:** 2-3 days

---

### 2.3 Scheduler
**File:** `constitution/execution/scheduler.py`

**Description:** Scheduler for task execution.

**Requirements:**
- Priority-based scheduling
- Resource-aware scheduling
- Fair scheduling
- Preemption support
- Scheduling policies (FIFO, priority, round-robin)

**Interfaces:**
```python
class Scheduler:
    async def schedule(task: Task) -> None
    async def unschedule(task_id: str) -> bool
    async def get_queue() -> List[Task]
    async def set_policy(policy: SchedulingPolicy) -> None
```

**Dependencies:**
- Task model
- asyncio

**Estimated Effort:** 2-3 days

---

### 2.4 Lease Manager
**File:** `constitution/execution/lease_manager.py`

**Description:** Lease management for distributed execution.

**Requirements:**
- Lease acquisition
- Lease renewal
- Lease release
- Lease expiration
- Distributed lock support
- Lease statistics

**Interfaces:**
```python
class LeaseManager:
    async def acquire(resource: str, ttl: int) -> Optional[Lease]
    async def renew(lease: Lease, ttl: int) -> bool
    async def release(lease: Lease) -> bool
    async def get_status(resource: str) -> Dict[str, Any]
```

**Dependencies:**
- PostgreSQL or Redis
- asyncio

**Estimated Effort:** 2-3 days

---

### 2.5 Retry Engine
**File:** `constitution/execution/retry_engine.py`

**Description:** Retry engine with configurable policies.

**Requirements:**
- Exponential backoff
- Linear backoff
- Fixed delay
- Max retry limits
- Jitter
- Retry condition evaluation
- Retry statistics

**Interfaces:**
```python
class RetryEngine:
    async def execute_with_retry(func: Callable, policy: RetryPolicy) -> Any
    async def get_stats() -> Dict[str, Any]
```

**Dependencies:**
- asyncio

**Estimated Effort:** 1-2 days

---

### 2.6 State Store
**File:** `constitution/execution/state_store.py`

**Description:** Persistent state store for mission and task state.

**Requirements:**
- State persistence
- State retrieval
- State updates
- State history
- State versioning
- Query capabilities

**Interfaces:**
```python
class StateStore:
    async def save_state(entity_id: str, state: Dict[str, Any]) -> None
    async def get_state(entity_id: str) -> Optional[Dict[str, Any]]
    async def update_state(entity_id: str, updates: Dict[str, Any]) -> None
    async def get_history(entity_id: str) -> List[Dict[str, Any]]
    async def query(filter: Dict[str, Any]) -> List[Dict[str, Any]]
```

**Dependencies:**
- PostgreSQL

**Estimated Effort:** 2-3 days

---

## Priority 3: Normalization Layer

### 3.1 Normalizer
**File:** `constitution/normalization/normalizer.py`

**Description:** Normalizer for source-specific evidence normalization.

**Requirements:**
- Source-specific normalizers (GitHub, Filesystem, Network, etc.)
- Normalizer registration
- Normalizer discovery
- Normalizer pipeline
- Validation
- Error handling

**Interfaces:**
```python
class Normalizer:
    @property
    def source(self) -> EvidenceSource
    async def normalize(raw_evidence: Dict[str, Any]) -> CanonicalArtifact
    async def validate(evidence: CanonicalArtifact) -> bool

class NormalizerPipeline:
    def register(normalizer: Normalizer) -> None
    async def normalize(raw_evidence: Dict[str, Any], source: EvidenceSource) -> CanonicalArtifact
    async def normalize_batch(raw_evidence_list: List[Dict[str, Any]], source: EvidenceSource) -> List[CanonicalArtifact]
```

**Dependencies:**
- CanonicalArtifact model
- EvidenceSource enum

**Estimated Effort:** 3-4 days

---

### 3.2 Canonicalizer
**File:** `constitution/normalization/canonicalizer.py`

**Description:** Canonicalizer for data normalization.

**Requirements:**
- Key sorting
- Unicode normalization (NFC)
- Whitespace normalization
- Type normalization
- Hash verification

**Interfaces:**
```python
class Canonicalizer:
    async def canonicalize(data: Dict[str, Any]) -> Dict[str, Any]
    async def verify_hash(data: Dict[str, Any], expected_hash: str) -> bool
```

**Dependencies:**
- CanonicalHasher

**Estimated Effort:** 1-2 days

---

### 3.3 Authority Pipeline
**File:** `constitution/normalization/authority_pipeline.py`

**Description:** Pipeline for authorizing evidence through constitutional authorities.

**Requirements:**
- Authority routing
- Authorization execution
- Constraint checking
- Authorization result aggregation
- Error handling

**Interfaces:**
```python
class AuthorityPipeline:
    async def authorize(evidence: CanonicalArtifact, authority_name: str) -> Dict[str, Any]
    async def authorize_batch(evidence_list: List[CanonicalArtifact], authority_name: str) -> List[Dict[str, Any]]
    async def check_constraints(evidence: CanonicalArtifact, authority_name: str) -> bool
```

**Dependencies:**
- AuthorityRegistry
- CanonicalArtifact model

**Estimated Effort:** 2-3 days

---

### 3.4 Validation Pipeline
**File:** `constitution/normalization/validation_pipeline.py`

**Description:** Pipeline for validating evidence.

**Requirements:**
- Schema validation
- Business rule validation
- Constraint validation
- Validation result aggregation
- Error reporting

**Interfaces:**
```python
class ValidationPipeline:
    async def validate(evidence: CanonicalArtifact) -> ValidationResult
    async def validate_batch(evidence_list: List[CanonicalArtifact]) -> List[ValidationResult]
    async def add_validator(validator: Validator) -> None
```

**Dependencies:**
- SchemaRegistry
- CanonicalArtifact model

**Estimated Effort:** 2-3 days

---

## Integration Tasks

### 4.1 Capability Registration
**Description:** Register existing capabilities with CapabilityRegistry.

**Requirements:**
- Register filesystem capabilities
- Register network capabilities
- Register storage capabilities
- Register search capabilities
- Register connector capabilities
- Add health checks
- Add initialization logic

**Estimated Effort:** 2-3 days

---

### 4.2 Authority Registration
**Description:** Register existing authorities with AuthorityRegistry.

**Requirements:**
- Register aggregate authority
- Register migration authority
- Register projection authority
- Register registry authority
- Register snapshot authority
- Add constraint checking
- Add authorization logic

**Estimated Effort:** 2-3 days

---

### 4.3 Event Store Integration
**Description:** Integrate normalized and authorized evidence into event store.

**Requirements:**
- Event store schema
- Event ingestion
- Event query
- Event replay
- Event versioning

**Estimated Effort:** 3-4 days

---

## Estimated Total Effort

**Runtime Layer:** 11-18 days
**Execution Layer:** 13-19 days
**Normalization Layer:** 8-12 days
**Integration Tasks:** 7-10 days

**Total:** 39-59 days (~8-12 weeks)

---

## Implementation Order

**Phase 1 (Weeks 1-3): Runtime Foundation**
- Hermes Runtime
- Mission Queue
- Worker Pool
- Health Loop

**Phase 2 (Weeks 4-6): Execution Engine**
- Task Graph
- Mission Executor
- Scheduler
- Retry Engine
- State Store

**Phase 3 (Weeks 7-9): Normalization Pipeline**
- Normalizer
- Canonicalizer
- Authority Pipeline
- Validation Pipeline

**Phase 4 (Weeks 10-12): Integration**
- Capability Registration
- Authority Registration
- Event Store Integration
- Timer Service
- Watchdog
- Lease Manager

---

## Notes

- All components should be async/await compatible
- Use existing domain models (Mission, Goal, CanonicalArtifact)
- Use existing registries (CapabilityRegistry, AuthorityRegistry)
- Follow existing patterns in the codebase
- Add comprehensive tests for each component
- Update ARCHITECTURE_INVENTORY.md as components are completed
