# Phase A: Circular Imports Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Circular Import Identification

---

## Circular Import Definition

A circular import occurs when:
1. Module A imports Module B
2. Module B imports Module A (direct circular import)
3. Module A imports Module B, which imports Module C, which imports Module A (indirect circular import)
4. Import happens at module level (not inside functions)

---

## Circular Import Analysis

### 1. Hermes Runtime Circular Import Risk
**Status:** High Risk
**Location:** `hermes/hermes_runtime.py`

**Import Chain:**
```
hermes/hermes_runtime.py
  ├─► hermes.execution (MissionQueue, RuntimeState, RuntimeLifecycle, LeaseManager, MissionStateStore)
  │   └─► hermes.execution.queue (MissionQueue)
  │       └─► hermes.execution.queue_backend (MissionQueueBackend)
  │
  └─► hermes.runtime (RuntimeRouter, CapabilityResolver, ExecutionPipeline, CanonicalArtifactRepository, EventBus, MissionFactory, MissionSerializer, BootstrapLoader)
      └─► hermes.runtime.router (RuntimeRouter)
          └─► hermes.runtime.resolver (CapabilityResolver)
              └─► constitution.registry (get_registry)
                  └─► constitution.registry.capability_registry (CapabilityRegistry)
```

**Circular Risk:** Medium
**Analysis:** No direct circular import detected, but complex dependency chain

**Recommendation:** Monitor for circular dependencies as hermes.runtime and hermes.execution evolve

---

### 2. Constitution Registry Circular Import Risk
**Status:** Medium Risk
**Location:** `constitution/registry/`

**Import Chain:**
```
constitution/registry/capability_registry.py
  └─► constitution.models (potential future import)
      └─► constitution.registry (potential circular import)
```

**Circular Risk:** Low
**Analysis:** No current circular import, but potential future risk

**Recommendation:** Avoid importing constitution.models in constitution.registry

---

### 3. Runtime Subsystem Circular Import Risk
**Status:** Medium Risk
**Location:** `runtime/`

**Import Chain:**
```
runtime/planner/planner.py
  └─► runtime.planning.planning_ir
  └─► runtime.planning.general_planner
      └─► runtime.planning.planning_ir (potential circular import)
```

**Circular Risk:** Low
**Analysis:** No current circular import, but potential future risk

**Recommendation:** Avoid circular imports between planner and planning modules

---

### 4. Authority Circular Import Risk
**Status:** Low Risk
**Location:** `authority/`

**Import Chain:**
```
authority/aggregate_authority.py
  └─► storage.postgres.models (EventModel)
      └─► No circular import detected
```

**Circular Risk:** None
**Analysis:** No circular import detected

**Recommendation:** Maintain clean separation between authorities and storage

---

### 5. API Layer Circular Import Risk
**Status:** Low Risk
**Location:** `api/`

**Import Chain:**
```
api/main.py
  ├─► constitution.models.event
  ├─► constitution.models.command
  ├─► storage.postgres.database
  ├─► storage.postgres.models
  ├─► storage.repositories
  ├─► transport.nats.transport
  ├─► config.settings
  ├─► config.logging
  ├─► runtime.observability
  └─► api.dto
```

**Circular Risk:** None
**Analysis:** No circular import detected

**Recommendation:** Maintain clean separation between API and implementation layers

---

### 6. Kernel Circular Import Risk
**Status:** Low Risk
**Location:** `kernel/`

**Import Chain:**
```
kernel/scheduler.py
  └─► No circular import detected (uses only standard library)
```

**Circular Risk:** None
**Analysis:** No circular import detected

**Recommendation:** Maintain kernel independence from runtime layers

---

### 7. Storage Layer Circular Import Risk
**Status:** Low Risk
**Location:** `storage/`

**Import Chain:**
```
storage/postgres/database.py
  └─► config.settings
      └─► No circular import detected

storage/repositories.py
  └─► storage.postgres.database
  └─► storage.postgres.models
      └─► No circular import detected
```

**Circular Risk:** None
**Analysis:** No circular import detected

**Recommendation:** Maintain clean storage layer independence

---

### 8. Transport Layer Circular Import Risk
**Status:** Low Risk
**Location:** `transport/`

**Import Chain:**
```
transport/nats/transport.py
  └─► nats-py (external library)
      └─► No circular import detected
```

**Circular Risk:** None
**Analysis:** No circular import detected

**Recommendation:** Maintain clean transport layer independence

---

## Potential Circular Import Risks

### 1. Runtime ↔ Constitution Circular Import
**Status:** Medium Risk
**Location:** `runtime/` and `constitution/`

**Potential Issue:** Runtime modules may import constitution modules, which may import runtime modules

**Example Scenario:**
```
runtime/planner/planner.py
  └─► constitution.models.mission
      └─► constitution.registry (potential future import)
          └─► runtime.planner (potential circular import)
```

**Recommendation:** Establish clear layer boundaries (constitution → runtime, not runtime → constitution)

---

### 2. Hermes Runtime ↔ Kernel Circular Import
**Status:** Medium Risk
**Location:** `hermes/hermes_runtime.py` and `kernel/scheduler.py`

**Current State:**
```
hermes/hermes_runtime.py
  └─► kernel.scheduler (Scheduler)
      └─► No import back to hermes
```

**Potential Issue:** Kernel may need to import Hermes in the future

**Recommendation:** Maintain kernel as independent layer, avoid importing Hermes

---

### 3. Execution ↔ Planning Circular Import
**Status:** Medium Risk
**Location:** `runtime/executor/` and `runtime/planner/`

**Current State:**
```
runtime/executor/executor.py
  └─► runtime.planning.planning_ir
      └─► No import back to executor
```

**Potential Issue:** Planner may need to import executor in the future

**Recommendation:** Maintain clear separation between planning and execution

---

### 4. Evidence ↔ Execution Circular Import
**Status:** Medium Risk
**Location:** `runtime/evidence/` and `runtime/executor/`

**Current State:**
```
runtime/executor/executor.py
  └─► runtime.evidence.evidence_compiler (potential future import)
      └─► No import back to executor
```

**Potential Issue:** Evidence compiler may need to import executor in the future

**Recommendation:** Maintain clear separation between evidence and execution

---

## Circular Import Prevention Strategies

### 1. Layered Architecture
**Strategy:** Establish clear layer boundaries

**Layers:**
1. **Constitution Layer** - Core models and authorities (no dependencies on runtime)
2. **Storage Layer** - Database and storage (no dependencies on runtime)
3. **Transport Layer** - Messaging and networking (no dependencies on runtime)
4. **Kernel Layer** - Core scheduling and execution (no dependencies on Hermes)
5. **Runtime Layer** - Runtime services (can depend on constitution, storage, transport, kernel)
6. **Hermes Layer** - Mission execution (can depend on runtime, kernel)
7. **API Layer** - HTTP API (can depend on all layers)

**Import Rules:**
- Lower layers cannot import higher layers
- Higher layers can import lower layers
- Same layer imports allowed with caution

---

### 2. Dependency Injection
**Strategy:** Use dependency injection instead of direct imports

**Example:**
```python
# Instead of:
from constitution.registry import get_registry

# Use:
class Planner:
    def __init__(self, registry: CapabilityRegistry):
        self.registry = registry
```

**Benefits:**
- Breaks circular import chains
- Improves testability
- Enables runtime configuration

---

### 3. Lazy Imports
**Strategy:** Import modules inside functions instead of at module level

**Example:**
```python
# Instead of:
from constitution.models import Mission

class Planner:
    def plan(self):
        mission = Mission(...)

# Use:
class Planner:
    def plan(self):
        from constitution.models import Mission
        mission = Mission(...)
```

**Benefits:**
- Defers import until needed
- Breaks circular import chains
- Improves startup time

---

### 4. Interface Segregation
**Strategy:** Define interfaces in separate modules

**Example:**
```python
# constitution/interfaces.py
class CapabilityRegistry(Protocol):
    def register(self, capability: Capability) -> None: ...
    def get(self, name: str) -> Optional[Capability]: ...

# runtime/planner/planner.py
from constitution.interfaces import CapabilityRegistry
```

**Benefits:**
- Breaks circular import chains
- Improves modularity
- Enables multiple implementations

---

### 5. Module Reorganization
**Strategy:** Reorganize modules to eliminate circular dependencies

**Example:**
```python
# Before:
# runtime/planner/planner.py imports runtime/planning/general_planner.py
# runtime/planning/general_planner.py imports runtime/planner/planner.py

# After:
# runtime/planner/planner.py (high-level planner interface)
# runtime/planning/general_planner.py (implementation, no import back to planner)
```

**Benefits:**
- Eliminates circular dependencies
- Improves module organization
- Clearer separation of concerns

---

## Circular Import Detection

### Manual Detection
1. Review import statements in each module
2. Trace import chains
3. Identify circular dependencies
4. Document circular import risks

### Automated Detection
**Tools:**
- `pylint` - Detects circular imports
- `pycycle` - Detects circular dependencies
- `circular-dependency-detector` - Detects circular imports

**Integration:**
Add to CI/CD pipeline to automatically detect circular imports

---

## Circular Import Summary

### Confirmed Circular Imports
**Status:** None
**Analysis:** No confirmed circular imports detected in current codebase

### Potential Circular Import Risks
1. **Hermes Runtime Complex Dependency Chain** - Medium risk
2. **Runtime ↔ Constitution** - Medium risk
3. **Hermes Runtime ↔ Kernel** - Medium risk
4. **Execution ↔ Planning** - Medium risk
5. **Evidence ↔ Execution** - Medium risk

### No Circular Import Risks
- API Layer
- Kernel Layer
- Storage Layer
- Transport Layer
- Authority Layer

---

## Recommendations

### Immediate Actions
1. **Add Circular Import Detection:** Add `pylint` or `pycycle` to CI/CD pipeline
2. **Establish Layer Boundaries:** Document and enforce layer boundaries
3. **Review Complex Dependencies:** Review hermes runtime dependency chain

### Medium-Term Actions
4. **Implement Dependency Injection:** Replace direct imports with dependency injection
5. **Use Lazy Imports:** Convert circular import risks to lazy imports
6. **Define Interfaces:** Create interface modules to break circular dependencies

### Long-Term Actions
7. **Reorganize Modules:** Reorganize modules to eliminate circular dependencies
8. **Monitor Circular Imports:** Continuously monitor for new circular imports
9. **Document Import Rules:** Document and enforce import rules

---

## Next Steps

- Add circular import detection to CI/CD pipeline
- Document layer boundaries in architecture documentation
- Review hermes runtime dependency chain
- Implement dependency injection for high-risk modules
- Convert potential circular imports to lazy imports
