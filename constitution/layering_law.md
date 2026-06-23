# LAYERING LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Layer boundaries and dependency rules only. No implementation details.

---

# LAYER DEFINITIONS

## Layer 0: Constitutional Kernel

**DEFINITION:** Transport-independent constitutional physics.

**SCOPE:**
- Constitutional axioms
- Root authorities
- Root facts
- Constitutional invariants
- Replay law
- Mutation law
- Witness law
- Retrieval law
- Source of truth law
- Invariant law

**PROPERTIES:**
- Deterministic
- Pure
- Infrastructure-independent
- Transport-independent
- Runtime-independent
- Provider-independent

**FORBIDDEN DEPENDENCIES:**
- Agents
- Embeddings
- Vector DBs
- Planners
- Orchestration
- Redis
- OpenTelemetry
- UI
- Prompts
- LLM APIs
- HTTP
- Express
- pg
- Docker
- SDKs
- Providers

---

## Layer 1: Runtime

**DEFINITION:** Constitutional execution engine.

**SCOPE:**
- Event stream processing
- Replay execution
- State reconstruction
- Invariant enforcement
- Witness generation
- Certificate generation

**PROPERTIES:**
- Deterministic
- Replay-safe
- Infrastructure-aware
- Transport-aware

**ALLOWED DEPENDENCIES:**
- Layer 0 (constitutional kernel)
- Infrastructure adapters
- Storage adapters

**FORBIDDEN DEPENDENCIES:**
- Agents
- Orchestration
- External providers (except via adapters)

---

## Layer 2: Adapters

**DEFINITION:** Infrastructure and transport adapters.

**SCOPE:**
- Database adapters
- HTTP adapters
- Storage adapters
- Provider adapters
- Logging adapters

**PROPERTIES:**
- Infrastructure-dependent
- Transport-dependent
- Provider-dependent

**ALLOWED DEPENDENCIES:**
- Layer 1 (runtime)
- Infrastructure (postgres, redis, etc.)
- External providers (ollama, etc.)

---

## Layer 3: Orchestration

**DEFINITION:** Workflow and agent orchestration.

**SCOPE:**
- Agent coordination
- Workflow execution
- Task scheduling
- Capability routing

**PROPERTIES:**
- Infrastructure-dependent
- Transport-dependent
- Provider-dependent

**ALLOWED DEPENDENCIES:**
- Layer 2 (adapters)
- Layer 1 (runtime)
- Infrastructure

**FORBIDDEN DEPENDENCIES:**
- Direct Layer 0 access (must go through Layer 1)

---

## Layer 4: Infrastructure

**DEFINITION:** Deployment and operational substrate.

**SCOPE:**
- Docker
- Kubernetes
- Postgres
- Redis
- Ollama
- Network
- Storage

**PROPERTIES:**
- Infrastructure-only
- No constitutional authority

**FORBIDDEN DEPENDENCIES:**
- Layer 0 (constitutional kernel) — infrastructure must not depend on constitutional physics

---

# LAYER VIOLATIONS

## Forbidden Layer 0 Dependencies

Layer 0 MUST NOT import:
- Agents
- Embeddings
- Vector DBs
- Planners
- Orchestration
- Redis
- OpenTelemetry
- UI
- Prompts
- LLM APIs
- HTTP
- Express
- pg
- Docker
- SDKs
- Providers

---

## Forbidden Cross-Layer Dependencies

### Layer 0 Forbidden Imports

Layer 0 MUST NOT import from:
- Layer 1 (runtime)
- Layer 2 (adapters)
- Layer 3 (orchestration)
- Layer 4 (infrastructure)

**RATIONALE:** Layer 0 must remain transport-independent constitutional physics.

---

### Layer 1 Forbidden Imports

Layer 1 MUST NOT import from:
- Layer 3 (orchestration)
- Layer 4 (infrastructure) directly

**RATIONALE:** Layer 1 must access infrastructure through adapters only.

---

### Layer 2 Forbidden Imports

Layer 2 MUST NOT import from:
- Layer 0 (constitutional kernel) directly

**RATIONALE:** Layer 2 must access constitutional kernel through Layer 1 only.

---

# LAYER PURITY

## Layer 0 Purity

Layer 0 MUST remain:
- Deterministic
- Pure
- Infrastructure-independent
- Transport-independent
- Runtime-independent
- Provider-independent

Layer 0 logic MUST execute identically in:
- Node
- Bun
- WASM
- Tests
- CI replay
- Offline verification

---

## Layer 1 Purity

Layer 1 MUST remain:
- Deterministic
- Replay-safe
- Infrastructure-aware (via adapters only)
- Transport-aware (via adapters only)

Layer 1 MUST NOT:
- Depend directly on infrastructure
- Depend directly on external providers
- Introduce non-determinism

---

## Layer 2 Purity

Layer 2 MUST remain:
- Adapter-only
- No constitutional authority
- No mutation logic
- No replay logic

Layer 2 MUST:
- Translate between Layer 1 and infrastructure
- Handle transport details
- Handle provider details

---

# LAYER VERIFICATION

## Verification Requirements

Layer boundaries MUST be verified for:
- **Dependency direction** — Higher layers may depend on lower layers, not vice versa
- **Import restrictions** - Forbidden imports must be absent
- **Purity constraints** - Layer 0 must remain pure
- **Adapter isolation** - Infrastructure must be accessed through adapters only

---

## Verification Failure

Layer verification failures MUST:
- Fail deterministically with structured failure codes
- Prevent build or deployment
- Provide sufficient context for diagnosis
- Trigger constitutional audit

---

# LAYER FAILURE SEMANTICS

## Failure Classification

Layer failures MUST be deterministic:
- **LAYER_0_FORBIDDEN_IMPORT:** Layer 0 imports forbidden dependency
- **LAYER_0_DEPENDENCY_VIOLATION:** Layer 0 depends on higher layer
- **LAYER_1_DIRECT_INFRASTRUCTURE:** Layer 1 depends directly on infrastructure
- **LAYER_2_DIRECT_KERNEL:** Layer 2 depends directly on Layer 0
- **LAYER_PURITY_VIOLATION:** Layer purity constraint violated

## Failure Handling

Layer failures MUST:
- Fail deterministically with structured failure codes
- Prevent build or deployment
- Provide sufficient context for diagnosis
- Trigger constitutional audit

---

# LAYER MIGRATION

## Migration Rules

Layer migration MUST:
- Preserve layer boundaries
- Maintain dependency direction
- Respect import restrictions
- Preserve purity constraints

---

## Migration Verification

Layer migration MUST be verified for:
- Layer boundary preservation
- Dependency direction preservation
- Import restriction compliance
- Purity constraint compliance

---

**Document ID:** CONSTITUTION-LAYERING-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
