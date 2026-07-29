# Phase A: Duplicate Implementations Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Duplicate Implementation Identification

---

## Duplicate Implementation Definition

A duplicate implementation occurs when:
1. Multiple modules implement similar functionality
2. Multiple classes serve the same purpose
3. Multiple functions perform the same operation
4. Multiple patterns are repeated without abstraction

---

## Duplicate Implementations Found

### 1. Scheduler Implementations
**Status:** High Priority
**Severity:** High

**Implementations:**
- `kernel/scheduler.py` - Core scheduler with job queue, worker loop
- `runtime/scheduler/constitutional_scheduler.py` - Constitutional scheduler with metrics
- `runtime/scheduler/vps_scheduler.py` - VPS scheduler (not used)

**Overlap:**
- Job scheduling
- Priority-based execution
- Worker loop pattern
- Job state management

**Differences:**
- `kernel/scheduler.py` - General-purpose scheduler, in-memory state
- `runtime/scheduler/constitutional_scheduler.py` - Constitutional-specific, metrics tracking
- `runtime/scheduler/vps_scheduler.py` - VPS-specific (not implemented)

**Recommendation:** Consolidate into single scheduler with pluggable backends

---

### 2. Registry Implementations
**Status:** High Priority
**Severity:** High

**Implementations:**
- `constitution/registry/capability_registry.py` - Capability registry
- `constitution/registries.py` - Multiple registries (TypeRegistry, WorkflowRegistry, PromptRegistry, ToolRegistry, AgentRegistry)
- `constitution/registry/object_registry.py` - Object registry
- `constitution/registry/authority_registry.py` - Authority registry
- `constitution/schema_registry.py` - Schema registry

**Overlap:**
- Registration pattern
- Discovery pattern
- Version management
- Integrity verification

**Differences:**
- `constitution/registry/capability_registry.py` - Capability-specific, singleton pattern
- `constitution/registries.py` - Multiple registry types in one file
- `constitution/registry/object_registry.py` - Object-specific
- `constitution/registry/authority_registry.py` - Authority-specific
- `constitution/schema_registry.py` - Schema-specific

**Recommendation:** Consolidate into unified registry framework

---

### 3. Authority Implementations
**Status:** High Priority
**Severity:** High

**Implementations:**
- `authority/aggregate_authority.py` - Aggregate authority
- `authority/migration_authority.py` - Migration authority
- `authority/projection_authority.py` - Projection authority
- `authority/registry_authority.py` - Registry authority
- `authority/snapshot_authority.py` - Snapshot authority
- `constitution/authority/canonical_authority.py` - Canonical authority
- `constitution/authority/interface.py` - Authority interface

**Overlap:**
- Validation pattern
- Decision-making pattern
- Database session dependency
- Hash verification

**Differences:**
- `authority/` - Kernel-level authorities (aggregate, migration, projection, registry, snapshot)
- `constitution/authority/` - Constitutional-level authorities (canonical, interface)

**Recommendation:** Consolidate into unified authority framework

---

### 4. Planning Implementations
**Status:** Medium Priority
**Severity:** Medium

**Implementations:**
- `runtime/planner/planner.py` - Planner subsystem
- `runtime/planning/general_planner.py` - General planning implementation
- `runtime/planning/planning_ir.py` - Planning Intermediate Representation
- `runtime/planning/compiler_stages.py` - Compiler stages
- `runtime/planning/hierarchy.py` - Planning hierarchy
- `runtime/planning/mission_compiler.py` - Mission compiler
- `runtime/planning/objective_compiler.py` - Objective compiler
- `runtime/planning/optimization_passes.py` - Optimization passes
- `runtime/planning/strategy.py` - Planning strategy
- `runtime/planning/transient_objectives.py` - Transient objectives

**Overlap:**
- Planning logic
- IR generation
- Compilation logic
- Strategy pattern

**Differences:**
- `runtime/planner/planner.py` - High-level planner subsystem
- `runtime/planning/general_planner.py` - General planning implementation
- `runtime/planning/*` - Specific planning components

**Recommendation:** Consolidate into unified planning framework

---

### 5. Execution Implementations
**Status:** High Priority
**Severity:** High

**Implementations:**
- `runtime/executor/executor.py` - Executor subsystem
- `hermes/execution/executor.py` - Hermes executor
- `runtime/execution/workflow_compiler.py` - Workflow compiler
- `hermes/execution/executor_pool.py` - Executor pool
- `hermes/execution/lifecycle.py` - Lifecycle management

**Overlap:**
- Execution logic
- Task execution
- State management
- Lifecycle management

**Differences:**
- `runtime/executor/executor.py` - High-level executor subsystem
- `hermes/execution/executor.py` - Hermes-specific executor
- `runtime/execution/workflow_compiler.py` - Workflow compilation
- `hermes/execution/executor_pool.py` - Executor pooling
- `hermes/execution/lifecycle.py` - Lifecycle management

**Recommendation:** Consolidate into unified execution framework

---

### 6. Evidence Implementations
**Status:** Medium Priority
**Severity:** Medium

**Implementations:**
- `constitution/models/evidence.py` - Evidence models
- `runtime/evidence/evidence_compiler.py` - Evidence compiler
- `runtime/evidence/evidence_executor.py` - Evidence executor

**Overlap:**
- Evidence collection
- Evidence validation
- Evidence verification

**Differences:**
- `constitution/models/evidence.py` - Evidence data models
- `runtime/evidence/evidence_compiler.py` - Evidence compilation
- `runtime/evidence/evidence_executor.py` - Evidence execution

**Recommendation:** Consolidate into unified evidence framework

---

### 7. Queue Implementations
**Status:** Medium Priority
**Severity:** Medium

**Implementations:**
- `hermes/execution/queue.py` - Mission queue
- `hermes/execution/queue_backend.py` - Queue backends (SQLite, Redis, NATS)
- `kernel/scheduler.py` - Job queue (in-memory)

**Overlap:**
- Queue management
- Priority-based scheduling
- Backend abstraction

**Differences:**
- `hermes/execution/queue.py` - Mission-specific queue
- `hermes/execution/queue_backend.py` - Queue backend implementations
- `kernel/scheduler.py` - Job queue (in-memory)

**Recommendation:** Consolidate into unified queue framework

---

### 8. State Store Implementations
**Status:** Medium Priority
**Severity:** Medium

**Implementations:**
- `hermes/execution/state_store.py` - Mission state store
- `storage/postgres/models.py` - Database models
- `storage/repositories.py` - Repository pattern
- `storage/event_store.py` - Event store
- `storage/artifact_store.py` - Artifact store

**Overlap:**
- State persistence
- Database operations
- Repository pattern

**Differences:**
- `hermes/execution/state_store.py` - Mission-specific state
- `storage/postgres/models.py` - Database models
- `storage/repositories.py` - General repository pattern
- `storage/event_store.py` - Event-specific storage
- `storage/artifact_store.py` - Artifact-specific storage

**Recommendation:** Consolidate into unified storage framework

---

### 9. Transport Implementations
**Status:** Medium Priority
**Severity:** Medium

**Implementations:**
- `transport/nats/transport.py` - NATS transport
- `transport/event_bus.py` - Event bus
- `hermes/runtime/event_bus.py` - Hermes event bus

**Overlap:**
- Message transport
- Event publishing
- Event subscription

**Differences:**
- `transport/nats/transport.py` - NATS-specific transport
- `transport/event_bus.py` - General event bus
- `hermes/runtime/event_bus.py` - Hermes-specific event bus

**Recommendation:** Consolidate into unified transport framework

---

### 10. Hashing Implementations
**Status:** Low Priority
**Severity:** Low

**Implementations:**
- `constitution/hashing.py` - General hashing
- `constitution/hashing/merkle.py` - Merkle tree hashing
- `constitution/authority/internal/canonical_hash.py` - Canonical hashing
- `constitution/authority/internal/merkle.py` - Merkle tree (duplicate)

**Overlap:**
- Hash computation
- Merkle tree construction
- Canonical serialization

**Differences:**
- `constitution/hashing.py` - General hashing utilities
- `constitution/hashing/merkle.py` - Merkle tree implementation
- `constitution/authority/internal/canonical_hash.py` - Canonical-specific hashing
- `constitution/authority/internal/merkle.py` - Merkle tree (duplicate)

**Recommendation:** Consolidate into unified hashing framework

---

### 11. Configuration Implementations
**Status:** Low Priority
**Severity:** Low

**Implementations:**
- `config/settings.py` - Settings configuration
- `config/logging.py` - Logging configuration
- `infra/docker/config/` - Docker configuration files
- `infra/.env.example` - Environment variables

**Overlap:**
- Configuration management
- Environment variable handling
- Logging configuration

**Differences:**
- `config/settings.py` - Application settings
- `config/logging.py` - Logging configuration
- `infra/docker/config/` - Docker-specific configuration
- `infra/.env.example` - Environment variable template

**Recommendation:** Consolidate into unified configuration framework

---

### 12. Singleton Pattern Implementations
**Status:** High Priority
**Severity:** High

**Implementations:**
- `constitution/registry/capability_registry.py` - Global registry instance
- `runtime/planning/general_planner.py` - Global planner instance
- `runtime/security/capability_broker.py` - Global broker instance
- `runtime/evidence/evidence_compiler.py` - Global compiler instance
- `runtime/scheduler/constitutional_scheduler.py` - Global scheduler instance

**Overlap:**
- Singleton pattern
- Global state
- Factory methods

**Differences:**
- Different purposes (registry, planner, broker, compiler, scheduler)

**Recommendation:** Replace with dependency injection

---

## Duplicate Implementation Summary

### High Priority Duplicates
1. **Scheduler Implementations** - 3 implementations
2. **Registry Implementations** - 5+ implementations
3. **Authority Implementations** - 7 implementations
4. **Execution Implementations** - 5 implementations
5. **Singleton Pattern** - 5 implementations

### Medium Priority Duplicates
6. **Planning Implementations** - 10 implementations
7. **Evidence Implementations** - 3 implementations
8. **Queue Implementations** - 3 implementations
9. **State Store Implementations** - 5 implementations
10. **Transport Implementations** - 3 implementations

### Low Priority Duplicates
11. **Hashing Implementations** - 4 implementations
12. **Configuration Implementations** - 4 implementations

---

## Consolidation Recommendations

### Immediate Actions (High Priority)
1. **Consolidate Schedulers:** Merge kernel/scheduler.py and runtime/scheduler/constitutional_scheduler.py
2. **Consolidate Registries:** Create unified registry framework
3. **Consolidate Authorities:** Create unified authority framework
4. **Consolidate Executors:** Merge runtime/executor/ and hermes/execution/
5. **Eliminate Singletons:** Replace with dependency injection

### Medium-Term Actions (Medium Priority)
6. **Consolidate Planning:** Create unified planning framework
7. **Consolidate Evidence:** Create unified evidence framework
8. **Consolidate Queues:** Create unified queue framework
9. **Consolidate Storage:** Create unified storage framework
10. **Consolidate Transport:** Create unified transport framework

### Long-Term Actions (Low Priority)
11. **Consolidate Hashing:** Create unified hashing framework
12. **Consolidate Configuration:** Create unified configuration framework

---

## Consolidation Strategy

### Phase 1: Framework Design
1. Design unified scheduler framework
2. Design unified registry framework
3. Design unified authority framework
4. Design unified execution framework

### Phase 2: Implementation
1. Implement unified scheduler framework
2. Implement unified registry framework
3. Implement unified authority framework
4. Implement unified execution framework

### Phase 3: Migration
1. Migrate existing code to unified frameworks
2. Remove duplicate implementations
3. Update tests
4. Update documentation

### Phase 4: Validation
1. Test unified frameworks
2. Verify functionality
3. Performance testing
4. Documentation updates

---

## Risks

### Consolidation Risks
- Breaking changes to existing code
- Loss of specialized functionality
- Performance degradation
- Increased complexity

### Mitigation Strategies
- Maintain backward compatibility during transition
- Preserve specialized functionality through plugins
- Performance testing before consolidation
- Incremental consolidation to manage complexity

---

## Next Steps

- Design unified scheduler framework
- Design unified registry framework
- Design unified authority framework
- Design unified execution framework
- Implement consolidation in phases
- Test and validate each phase
