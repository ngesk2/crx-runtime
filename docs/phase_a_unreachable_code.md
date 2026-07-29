# Phase A: Unreachable Code Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Unreachable Code Identification

---

## Unreachable Code Definition

Unreachable code is:
1. Code that can never be executed due to control flow
2. Functions that are never called
3. Classes that are never instantiated
4. Methods that are never invoked
5. Branches that are never taken
6. Code after return statements
7. Code in except blocks that are never reached

---

## Unreachable Code Analysis

### 1. API Layer Unreachable Code
**Location:** `api/main.py`

**Unreachable Code:** None detected
**Analysis:** All endpoints are accessible via HTTP
**Status:** Clean

---

### 2. Hermes Runtime Unreachable Code
**Location:** `hermes/hermes_runtime.py`

**Potential Unreachable Code:**
```python
# Line 273-299: _executor_loop
async def _executor_loop(self) -> None:
    """Main mission executor loop."""
    while self._running and not self._shutdown_event.is_set():
        try:
            # Dequeue next mission (blocking)
            queued_mission = await self.mission_queue.dequeue()
            
            if queued_mission:
                print(f"Executing mission: {queued_mission.mission_id}")
                
                # Reconstruct mission using factory
                mission = self.mission_factory.reconstruct(queued_mission.mission_data)
                
                # Execute mission through runtime router
                result = await self.runtime_router.route(mission)
                print(f"Mission result: {result}")
            
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Executor loop error: {e}")
```

**Analysis:** Code is reachable via executor loop
**Status:** Reachable

---

### 3. Kernel Scheduler Unreachable Code
**Location:** `kernel/scheduler.py`

**Potential Unreachable Code:**
```python
# Backend implementations (DramatiqBackend, TemporalBackend)
class DramatiqBackend(SchedulerBackend):
    """Dramatiq backend implementation."""
    
    async def enqueue(self, job: Job) -> None:
        """Enqueue a job."""
        raise NotImplementedError("Dramatiq backend not implemented")
    
    # ... other methods with NotImplementedError

class TemporalBackend(SchedulerBackend):
    """Temporal backend implementation."""
    
    async def enqueue(self, job: Job) -> None:
        """Enqueue a job."""
        raise NotImplementedError("Temporal backend not implemented")
    
    # ... other methods with NotImplementedError
```

**Analysis:** Backend implementations are not used (marked as not implemented)
**Status:** Unreachable (not implemented)

---

### 4. Authority Unreachable Code
**Location:** `authority/`

**Potential Unreachable Code:** All authority methods
**Analysis:** Authority methods are defined but not called by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 5. Runtime Subsystem Unreachable Code
**Location:** `runtime/`

**Potential Unreachable Code:**
```python
# runtime/planner/planner.py
class Planner:
    """Planner subsystem for generating plans from objectives."""
    
    async def plan(self, objective: str) -> PlanningIR:
        """Generate a plan from an objective."""
        # Implementation
```

**Analysis:** Planner is defined but not called by main entry points
**Status:** Potentially unreachable (not integrated)

```python
# runtime/oracle/oracle.py
class Oracle:
    """Oracle subsystem for code review and approval."""
    
    async def review(self, code: str) -> ReviewResult:
        """Review code for constitutional compliance."""
        # Implementation
```

**Analysis:** Oracle is defined but not called by main entry points
**Status:** Potentially unreachable (not integrated)

```python
# runtime/executor/executor.py
class Executor:
    """Executor subsystem for executing plans."""
    
    async def execute(self, plan: PlanningIR) -> ExecutionResult:
        """Execute a plan."""
        # Implementation
```

**Analysis:** Executor is defined but not called by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 6. Capability Registry Unreachable Code
**Location:** `constitution/registry/capability_registry.py`

**Potential Unreachable Code:**
```python
# Global registry instance
_global_registry: Optional[CapabilityRegistry] = None

def get_registry() -> CapabilityRegistry:
    """Get the global capability registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = CapabilityRegistry()
    return _global_registry
```

**Analysis:** Registry is used by hermes/hermes_runtime.py
**Status:** Reachable

---

### 7. Storage Layer Unreachable Code
**Location:** `storage/`

**Potential Unreachable Code:**
```python
# storage/artifact_adapter.py
class ArtifactAdapter:
    """Adapter for artifact storage."""
    # Implementation
```

**Analysis:** Artifact adapter is not used by main entry points
**Status:** Potentially unreachable (not integrated)

```python
# storage/artifact_store.py
class ArtifactStore:
    """Artifact storage implementation."""
    # Implementation
```

**Analysis:** Artifact store is not used by main entry points
**Status:** Potentially unreachable (not integrated)

```python
# storage/event_store.py
class EventStore:
    """Event store implementation."""
    # Implementation
```

**Analysis:** Event store is not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 8. Transport Layer Unreachable Code
**Location:** `transport/`

**Potential Unreachable Code:**
```python
# transport/event_bus.py
class EventBus:
    """Event bus implementation."""
    # Implementation
```

**Analysis:** Event bus is not used by main entry points (hermes/runtime/event_bus.py is used instead)
**Status:** Potentially unreachable (duplicate implementation)

---

### 9. Architecture Modules Unreachable Code
**Location:** `architecture/`

**Potential Unreachable Code:** All architecture modules
**Analysis:** Architecture modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 10. Constitution Modules Unreachable Code
**Location:** `constitution/`

**Potential Unreachable Code:**
```python
# constitution/intents.py
# constitution/transcript.py
# constitution/value_objects.py
# constitution/registries.py
# constitution/schema_registry.py
# constitution/hashing.py
# constitution/hashing/merkle.py
# constitution/authority/ (all modules)
```

**Analysis:** These modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 11. Capabilities Unreachable Code
**Location:** `capabilities/`

**Potential Unreachable Code:** All capability implementations
**Analysis:** Capability implementations are not registered with CapabilityRegistry
**Status:** Potentially unreachable (not registered)

---

### 12. Runtime Skills Unreachable Code
**Location:** `runtime/skills/`

**Potential Unreachable Code:** All skill modules
**Analysis:** Skill modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 13. Kernel Replay Unreachable Code
**Location:** `kernel/replay/`

**Potential Unreachable Code:** All replay modules
**Analysis:** Replay modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 14. Runtime Planning Unreachable Code
**Location:** `runtime/planning/`

**Potential Unreachable Code:**
```python
# runtime/planning/compiler_stages.py
# runtime/planning/hierarchy.py
# runtime/planning/mission_compiler.py
# runtime/planning/objective_compiler.py
# runtime/planning/optimization_passes.py
# runtime/planning/strategy.py
# runtime/planning/transient_objectives.py
```

**Analysis:** These modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 15. Runtime Registry Unreachable Code
**Location:** `runtime/registry/`

**Potential Unreachable Code:**
```python
# runtime/registry/agents.json
# runtime/registry/oracle_reviewer.py
# runtime/registry/oracle_sandbox.py
# runtime/registry/promotion_pipeline.py
# runtime/registry/work_claim_manager.py
# runtime/registry/work_claims.json
```

**Analysis:** These modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 16. Runtime Security Unreachable Code
**Location:** `runtime/security/`

**Potential Unreachable Code:**
```python
# runtime/security/capability_tokens.py
# runtime/security/execution_policy.py
# runtime/security/semantic_capabilities.py
# runtime/security/signed_policy.py
```

**Analysis:** These modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 17. Runtime Scheduler Unreachable Code
**Location:** `runtime/scheduler/`

**Potential Unreachable Code:**
```python
# runtime/scheduler/vps_scheduler.py
```

**Analysis:** VPS scheduler is not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

### 18. Runtime Other Modules Unreachable Code
**Location:** `runtime/`

**Potential Unreachable Code:**
```python
# runtime/artifacts/artifact_ontology.py
# runtime/event_sourcing/projections.py
# runtime/execution/workflow_compiler.py
# runtime/hermes/constitutional_citizen.py
# runtime/kernel/capabilities.py
# runtime/knowledge/knowledge_graph.py
# runtime/messaging/outbox.py
# runtime/state/state_machine.py
# runtime/verification/verifier.py
```

**Analysis:** These modules are not used by main entry points
**Status:** Potentially unreachable (not integrated)

---

## Unreachable Code Summary

### Confirmed Unreachable Code
1. **Kernel Backend Implementations** - DramatiqBackend, TemporalBackend (marked as not implemented)
2. **Transport Event Bus** - Duplicate implementation not used

### Potentially Unreachable Code (Not Integrated)
3. **Authority Modules** - All authority implementations
4. **Runtime Subsystems** - Planner, Oracle, Executor (high-level interfaces)
5. **Architecture Modules** - All architecture implementations
6. **Constitution Modules** - intents, transcript, value_objects, registries, schema_registry, hashing, authority
7. **Capability Implementations** - All capability implementations
8. **Runtime Skills** - All skill modules
9. **Kernel Replay** - All replay modules
10. **Runtime Planning** - compiler_stages, hierarchy, mission_compiler, objective_compiler, optimization_passes, strategy, transient_objectives
11. **Runtime Registry** - agents.json, oracle_reviewer, oracle_sandbox, promotion_pipeline, work_claim_manager, work_claims.json
12. **Runtime Security** - capability_tokens, execution_policy, semantic_capabilities, signed_policy
13. **Runtime Scheduler** - vps_scheduler
14. **Runtime Other** - artifact_ontology, projections, workflow_compiler, constitutional_citizen, capabilities, knowledge_graph, outbox, state_machine, verifier
15. **Storage Modules** - artifact_adapter, artifact_store, event_store

### Reachable Code
- API Layer (api/main.py, api/dto.py)
- Hermes Runtime (hermes/hermes_runtime.py)
- Hermes Execution (hermes/execution/*)
- Kernel Scheduler (kernel/scheduler.py)
- Storage PostgreSQL (storage/postgres/*)
- Transport NATS (transport/nats/*)
- Configuration (config/*)
- Constitution Models (constitution/models/*)
- Constitution Registry (constitution/registry/capability_registry.py)
- Runtime Planning IR (runtime/planning/planning_ir.py)
- Runtime General Planner (runtime/planning/general_planner.py)
- Runtime Capability Broker (runtime/security/capability_broker.py)
- Runtime Evidence Compiler (runtime/evidence/evidence_compiler.py)
- Runtime Constitutional Scheduler (runtime/scheduler/constitutional_scheduler.py)
- Runtime Merge Manifest (runtime/registry/merge_manifest.py)
- Runtime Hermes Executor (hermes/execution/executor.py)

---

## Unreachable Code Impact

### High Impact
1. **Kernel Backend Implementations** - Scheduler cannot use alternative backends
2. **Authority Modules** - Constitutional validation not integrated
3. **Runtime Subsystems** - Planner, Oracle, Executor not integrated

### Medium Impact
4. **Architecture Modules** - Architecture components not integrated
5. **Constitution Modules** - Constitutional utilities not integrated
6. **Capability Implementations** - Capabilities not registered
7. **Storage Modules** - Alternative storage not available

### Low Impact
8. **Runtime Skills** - Skills not integrated
9. **Kernel Replay** - Replay functionality not integrated
10. **Runtime Planning** - Planning components not integrated
11. **Runtime Registry** - Registry components not integrated
12. **Runtime Security** - Security components not integrated
13. **Runtime Other** - Other runtime components not integrated

---

## Recommendations

### Immediate Actions (High Priority)
1. **Implement Kernel Backends** - Implement DramatiqBackend or TemporalBackend
2. **Integrate Authorities** - Integrate authority modules with runtime
3. **Integrate Runtime Subsystems** - Integrate Planner, Oracle, Executor with runtime

### Medium-Term Actions (Medium Priority)
4. **Integrate Architecture** - Integrate architecture modules with runtime
5. **Integrate Constitution** - Integrate constitution modules with runtime
6. **Register Capabilities** - Register capability implementations with CapabilityRegistry
7. **Integrate Storage** - Integrate storage modules with runtime

### Long-Term Actions (Low Priority)
8. **Integrate Skills** - Integrate skill modules with runtime
9. **Integrate Replay** - Integrate replay modules with runtime
10. **Integrate Planning** - Integrate planning modules with runtime
11. **Integrate Registry** - Integrate registry modules with runtime
12. **Integrate Security** - Integrate security modules with runtime
13. **Integrate Other** - Integrate other runtime modules

---

## Unreachable Code Detection

### Manual Detection
1. Review import statements in main entry points
2. Trace function calls
3. Identify unused modules
4. Document unreachable code

### Automated Detection
**Tools:**
- `vulture` - Detects unused code
- `dead` - Detects dead code
- `coverage.py` - Detects unexecuted code
- `pylint` - Detects unused code

**Integration:**
Add to CI/CD pipeline to automatically detect unreachable code

---

## Next Steps

- Add unreachable code detection to CI/CD pipeline
- Implement kernel backend implementations
- Integrate authority modules with runtime
- Integrate runtime subsystems (Planner, Oracle, Executor)
- Register capability implementations with CapabilityRegistry
- Integrate architecture modules with runtime
- Integrate constitution modules with runtime
