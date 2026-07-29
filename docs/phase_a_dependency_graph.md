# Phase A: Dependency Graph

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Dependency Analysis

---

## Module Dependency Analysis

### Core Dependencies (pyproject.toml)

```
constitutional-runtime
├── fastapi>=0.109.0
├── uvicorn[standard]>=0.27.0
├── pydantic>=2.5.0
├── pydantic-settings>=2.1.0
├── sqlalchemy>=2.0.25
├── alembic>=1.13.0
├── asyncpg>=0.29.0
├── nats-py>=2.7.0
├── opentelemetry-api>=1.22.0
├── opentelemetry-sdk>=1.22.0
├── opentelemetry-instrumentation-fastapi>=0.43b0
├── opentelemetry-instrumentation-sqlalchemy>=0.43b0
├── opentelemetry-exporter-prometheus>=1.46.0
└── prometheus-client>=0.19.0
```

### Workspace Structure (pyproject.toml)

```
constitutional-runtime
├── apps/* (empty)
├── api
├── runtime
├── constitution
├── kernel
├── storage
└── transport
```

### Internal Module Dependencies

#### API Layer (`api/`)
```
api/main.py
├── constitution.models.event
├── constitution.models.command
├── storage.postgres.database
├── storage.postgres.models
├── storage.repositories
├── transport.nats.transport
├── config.settings
├── config.logging
├── runtime.observability
└── api.dto
```

#### Hermes Runtime (`hermes/`)
```
hermes/hermes_runtime.py
├── constitution.registry (get_registry)
├── hermes.execution (MissionQueue, RuntimeState, RuntimeLifecycle, LeaseManager, MissionStateStore)
├── hermes.runtime (RuntimeRouter, CapabilityResolver, ExecutionPipeline, CanonicalArtifactRepository, EventBus, MissionFactory, MissionSerializer, BootstrapLoader)
└── kernel.scheduler (Scheduler)
```

#### Kernel (`kernel/`)
```
kernel/scheduler.py
├── asyncio
├── datetime
├── typing
└── enum
```

#### Storage (`storage/`)
```
storage/postgres/database.py
├── sqlalchemy
├── asyncpg
└── config.settings

storage/repositories.py
├── storage.postgres.database
└── storage.postgres.models
```

#### Transport (`transport/`)
```
transport/nats/transport.py
├── nats-py
└── asyncio
```

#### Runtime (`runtime/`)
```
runtime/oracle/oracle.py
├── dataclasses
├── typing
├── datetime
├── enum
└── uuid

runtime/planner/planner.py
├── runtime.planning.planning_ir
├── runtime.planning.general_planner
└── asyncio

runtime/executor/executor.py
├── runtime.planning.planning_ir
└── asyncio
```

#### Constitution (`constitution/`)
```
constitution/models/mission.py
├── pydantic
├── datetime
└── hashlib

constitution/registry/
├── constitution.authority
├── constitution.canonical_serialization
└── constitution.hashing
```

---

## Dependency Issues Identified

### 1. Circular Import Risk
**Status:** Potential
**Location:** `hermes/hermes_runtime.py` → `hermes/runtime/` → `hermes/execution/`

**Analysis:**
- `hermes_runtime.py` imports from `hermes.runtime` and `hermes.execution`
- `hermes.runtime` may import from `hermes.execution`
- Need to verify if circular dependency exists

### 2. Singleton Pattern Dependencies
**Status:** High Risk
**Location:** Multiple modules

**Analysis:**
- `constitution.registry.get_registry()` uses singleton
- `runtime.planning.general_planner.get_general_planner()` uses singleton
- `runtime.security.capability_broker.get_capability_broker()` uses singleton
- `runtime.evidence.evidence_compiler.get_evidence_compiler()` uses singleton

**Impact:** Violates dependency injection principles, makes testing difficult

### 3. Missing Dependencies
**Status:** Medium Risk
**Location:** `hermes/hermes_runtime.py`

**Analysis:**
- Imports `hermes.execution` components that may not exist
- Imports `hermes.runtime` components that may not exist
- Need to verify actual file existence

### 4. External Dependency Version Conflicts
**Status:** Low Risk
**Location:** `pyproject.toml` vs `requirements.txt`

**Analysis:**
- `pyproject.toml` specifies `fastapi>=0.109.0`
- `requirements.txt` specifies `fastapi>=0.100.0`
- Version mismatch between dependency specifications

---

## Dependency Graph Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  api/main.py → api/dto.py                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Constitution │ │   Storage    │ │  Transport   │
│   Models     │ │   (Postgres) │ │   (NATS)     │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   Hermes Runtime │
              │  (orchestration) │
              └────────┬─────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Kernel     │ │   Runtime    │ │  Execution   │
│  (Scheduler) │ │ (Services)   │ │  (Engine)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Hidden Dependencies

### 1. Database Schema Dependencies
**Location:** `storage/postgres/models.py`
**Hidden Dependency:** Assumes specific PostgreSQL schema structure
**Impact:** Schema changes require model updates

### 2. NATS Subject Naming
**Location:** `transport/nats/transport.py`
**Hidden Dependency:** Hardcoded subject names (e.g., "constitutional.events.*")
**Impact:** Subject name changes require code updates

### 3. Configuration File Dependencies
**Location:** `config/settings.py`
**Hidden Dependency:** Environment variable naming conventions
**Impact:** Environment changes require configuration updates

---

## Recommendations

1. **Eliminate Singletons:** Replace with dependency injection
2. **Resolve Circular Imports:** Restructure module boundaries
3. **Standardize Dependency Versions:** Align `pyproject.toml` and `requirements.txt`
4. **Document Hidden Dependencies:** Add explicit dependency documentation
5. **Add Dependency Tests:** Verify import structure in CI

---

## Next Steps

- Verify actual file existence for all imports
- Test circular import detection
- Create dependency injection refactoring plan
- Standardize dependency specifications
