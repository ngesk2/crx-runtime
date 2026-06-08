# Execution vs Replay Separation Analysis

## Current CRX Implementation

**ARCHITECTURE:**
```
HTTP
↓
commit_controller
↓
hash
↓
validation
↓
postgres insert
```

**EXECUTION CHARACTERISTICS:**
- All execution is runtime-only
- No replay capability exists
- No transcript generation
- No state reconstruction
- No deterministic execution path
- No execution vs replay separation

**VIOLATIONS:**
- No separation between execution and replay
- All execution is coupled to runtime infrastructure
- No pure deterministic execution path
- No infrastructure-independent execution
- No provider-independent execution

---

## Constitutional Requirements

**AGENT.md MANDATES:**
- Replay must remain pure, deterministic, infrastructure-independent
- Execution may contain side effects
- These are NOT the same subsystem
- Replay is authority
- Persistence is adapter
- Kernel must NOT depend on Express, Docker, Postgres, Redis, HTTP, agents, orchestration, UI, dashboards

**CURRENT VIOLATIONS:**
- CRX has no replay capability
- CRX has no execution vs replay separation
- CRX depends on Express (HTTP)
- CRX depends on Postgres (persistence)
- CRX depends on HTTP (transport)
- CRX has no pure deterministic execution path
- CRX has no infrastructure-independent execution

---

## Execution vs Replay Separation Principles

**REPLAY MUST BE:**
- Pure (no side effects)
- Deterministic (same input → same output)
- Infrastructure-independent (no Express, Docker, Postgres, etc.)
- Provider-independent (no cloud provider dependencies)
- Transport-independent (no HTTP, no protocols)
- Observable (transcript generation)
- Verifiable (fingerprint verification)

**EXECUTION MAY BE:**
- Impure (side effects allowed)
- Non-deterministic (external dependencies allowed)
- Infrastructure-dependent (Express, Docker, Postgres allowed)
- Provider-dependent (cloud providers allowed)
- Transport-dependent (HTTP, protocols allowed)
- Observable (logging, monitoring)
- Verifiable (integrity checks)

---

## Current Violations

**VIOLATION 1: No Replay Capability**
- CRX has no replay system
- Cannot verify state reconstruction
- Cannot detect divergence
- Cannot verify constitutional compliance

**SEVERITY:** CRITICAL

**EVIDENCE:** runtime/kernel/commit-service/src/ has no replay-related files

---

**VIOLATION 2: No Execution vs Replay Separation**
- All execution is runtime-only
- No pure deterministic execution path
- No infrastructure-independent execution
- No provider-independent execution

**SEVERITY:** CRITICAL

**EVIDENCE:** commit_controller.ts directly calls persistence functions

---

**VIOLATION 3: Infrastructure Coupling**
- CRX depends on Express (HTTP)
- CRX depends on Postgres (persistence)
- CRX depends on HTTP (transport)
- No infrastructure abstraction layer

**SEVERITY:** HIGH

**EVIDENCE:** server.ts imports express, commit_controller.ts imports pool from db.ts

---

**VIOLATION 4: No Pure Deterministic Execution Path**
- All execution is coupled to runtime infrastructure
- No pure functions for core operations
- No deterministic ordering guarantees
- No transcript generation

**SEVERITY:** CRITICAL

**EVIDENCE:** commit_controller.ts has side effects (database writes)

---

**VIOLATION 5: No Infrastructure Independence**
- Kernel depends on Express
- Kernel depends on Postgres
- Kernel depends on HTTP
- No abstraction layer for infrastructure

**SEVERITY:** HIGH

**EVIDENCE:** server.ts, commit_controller.ts, db.ts

---

**VIOLATION 6: No Provider Independence**
- No abstraction for cloud providers
- No abstraction for database providers
- No abstraction for transport providers

**SEVERITY:** MEDIUM

**EVIDENCE:** db.ts hardcodes PostgreSQL pool

---

**VIOLATION 7: No Transport Independence**
- All execution is HTTP-based
- No alternative transport mechanisms
- No transport abstraction layer

**SEVERITY:** MEDIUM

**EVIDENCE:** server.ts uses Express, commit_controller.ts uses HTTP request/response

---

## Separation Strategy

**PHASE 1: Extract Pure Functions**
- Extract canonical_engine.ts as pure function (already pure)
- Extract identity_engine.ts as pure function (already pure)
- Extract dag_validator.ts as pure function (already pure)
- Create replay_engine.ts as pure function (new)

**PHASE 2: Create Infrastructure Abstraction Layer**
- Create persistence_adapter.ts for database abstraction
- Create transport_adapter.ts for HTTP abstraction
- Create infrastructure_adapter.ts for infrastructure abstraction

**PHASE 3: Separate Execution Layers**
- Create kernel/ for pure deterministic functions
- Create runtime/ for infrastructure-dependent execution
- Create adapters/ for infrastructure adapters

**PHASE 4: Implement Replay System**
- Create replay_engine.ts for pure replay logic
- Create state_rebuilder.ts for state reconstruction
- Create transcript_generator.ts for transcript generation

**PHASE 5: Decouple Kernel from Infrastructure**
- Remove Express dependency from kernel
- Remove Postgres dependency from kernel
- Remove HTTP dependency from kernel
- Remove all infrastructure dependencies from kernel

---

## Proposed Architecture

```
kernel/ (pure, deterministic, infrastructure-independent)
├── canonical/
│   └── canonical_engine.ts (pure)
├── identity/
│   └── identity_engine.ts (pure)
├── lineage/
│   └── dag_validator.ts (pure)
├── replay/
│   ├── replay_engine.ts (pure)
│   ├── state_rebuilder.ts (pure)
│   └── transcript_generator.ts (pure)
└── event/
    └── event_validator.ts (pure)

runtime/ (infrastructure-dependent, may have side effects)
├── execution/
│   ├── commit_executor.ts (impure)
│   └── audit_executor.ts (impure)
└── orchestration/
    └── http_orchestrator.ts (impure)

adapters/ (infrastructure abstraction)
├── persistence/
│   ├── postgres_adapter.ts (Postgres-specific)
│   └── persistence_adapter.ts (abstraction)
├── transport/
│   ├── http_adapter.ts (HTTP-specific)
│   └── transport_adapter.ts (abstraction)
└── infrastructure/
    └── infrastructure_adapter.ts (abstraction)
```

---

## Migration Path

**STEP 1: Extract Pure Functions**
- Move canonical_engine.ts to kernel/canonical/
- Move identity_engine.ts to kernel/identity/
- Move dag_validator.ts to kernel/lineage/
- Verify no infrastructure dependencies

**STEP 2: Create Replay System**
- Create kernel/replay/replay_engine.ts
- Create kernel/replay/state_rebuilder.ts
- Create kernel/replay/transcript_generator.ts
- Verify pure functions

**STEP 3: Create Infrastructure Abstraction**
- Create adapters/persistence/persistence_adapter.ts
- Create adapters/transport/transport_adapter.ts
- Create adapters/infrastructure/infrastructure_adapter.ts

**STEP 4: Separate Execution Layers**
- Create runtime/execution/commit_executor.ts
- Create runtime/execution/audit_executor.ts
- Create runtime/orchestration/http_orchestrator.ts

**STEP 5: Decouple Kernel from Infrastructure**
- Remove Express from kernel
- Remove Postgres from kernel
- Remove HTTP from kernel
- Verify kernel is pure

**STEP 6: Update Imports**
- Update all imports to use new structure
- Update package.json scripts
- Update documentation

---

## Risk Assessment

**HIGH RISK:**
- Requires architectural restructuring
- Requires breaking changes
- Requires extensive testing
- Requires migration of existing code

**MITIGATION:**
- Implement incrementally
- Create migration script
- Add comprehensive tests
- Document migration process
- Provide rollback plan
