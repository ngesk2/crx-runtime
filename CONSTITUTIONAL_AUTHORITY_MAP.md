# Constitutional Authority Map

**Status:** FROZEN - Constitutional authority definitions established

---

## Authority Categories

### Constitutional Authority
- Owns canonical semantics
- Defines constitutional behavior
- Single source of truth
- Examples: ExecutionEventBus, KnowledgeAuthority, DeterministicReplayEngine

### Constitutional Runtime Gateway
- Orchestrates constitutional execution
- Enforces constitutional boundaries
- Single constitutional ingress
- Does not own execution semantics (providers + replay own semantics)
- Examples: ExecutionEngine

### Runtime Authority
- Executes constitutional decisions
- Orchestrates runtime lifecycle
- Does not define canonical semantics
- Examples: RuntimeContainer

### Projection
- Derived views only
- Never creates constitutional state
- Consumes Witness or Evidence
- Examples: GitProjection, Graph projections, UI projections

### Infrastructure
- Adapters, storage, HTTP, databases
- Never defines constitutional state
- Supports constitutional operations
- Examples: PostgreSQL, Qdrant, HTTP adapters

---

## Constitutional Authorities

### Execution

**Owner:** ExecutionEngine
**Location:** `runtime/kernel/execution/execution-engine.ts`
**Responsibilities:**
- Single constitutional execution ingress
- Provider execution orchestration
- Identity resolution
- Policy check
- Evidence storage
- Knowledge graph indexing
- Replay transcript generation
- Projection
- Event publishing

**Constitutional Rule:** All provider execution must route through ExecutionEngine.execute()

---

### Events

**Owner:** ExecutionEventBus
**Location:** `runtime/kernel/execution/execution-event-bus.ts`
**Responsibilities:**
- Single constitutional event minting authority
- Event envelope creation
- Event publishing
- Event stream management

**Constitutional Rule:** Only ExecutionEventBus may mint constitutional events

**Other Components (NOT authorities):**
- EventStore: Storage only (does not mint events)
- ProjectionStore: Projection only (does not mint events)
- EventReader: Read-only (does not mint events)

---

### Replay

**Owner:** DeterministicReplayEngine
**Location:** `runtime/kernel/replay/deterministic_replay_engine.ts`
**Responsibilities:**
- Single constitutional replay authority
- Deterministic replay execution
- Replay state machine
- Replay verification

**Constitutional Rule:** Only DeterministicReplayEngine owns canonical replay semantics

**Auxiliary Authority (NOT canonical):**
- Python ReplayKernel: Verification, migration, research implementation
  - May verify
  - May compare
  - May migrate
  - May never commit
  - May never publish
  - May never mutate
  - May never evolve runtime state

**Supporting Modules (NOT authorities):**
- ReplayStateMachine: State machine logic
- ReplayTranscriptBuilder: Transcript generation
- ReplayLimits: Configuration limits
- ReplayInvariants: Invariant definitions
- StateSerializer: State serialization

---

### Knowledge

**Owner:** KnowledgeAuthority
**Location:** `runtime/kernel/knowledge/knowledge-authority.ts`
**Responsibilities:**
- Single constitutional graph mutation authority
- Graph node creation
- Graph edge creation
- Graph queries

**Constitutional Rule:** Only KnowledgeAuthority may mutate graph state

**Constitutional Flow:**
```
Execution
    ↓
Evidence
    ↓
Knowledge Indexer
    ↓
Knowledge Authority
    ↓
Graph Mutation
```

---

### Identity

**Owner:** CanonicalIdentityService
**Location:** `runtime/kernel/identity/canonical-identity-service.ts`
**Responsibilities:**
- Canonical identity generation
- Identity resolution
- Identity validation

**Constitutional Rule:** Only CanonicalIdentityService owns canonical identity

---

### Witness

**Owner:** WitnessAuthority
**Location:** `runtime/kernel/replay/witness_authority.ts`
**Responsibilities:**
- Witness generation
- Witness validation
- Witness persistence

**Constitutional Rule:** Only WitnessAuthority owns canonical witness semantics

---

### Canonical Hash

**Owner:** CanonicalHashAuthority
**Location:** `runtime/kernel/replay/canonical_hash_authority.ts`
**Responsibilities:**
- Canonical hash generation
- Hash validation

**Constitutional Rule:** Only CanonicalHashAuthority owns canonical hash semantics

---

### Providers

**Lifetime Owner:** RuntimeContainer
**Location:** `runtime/di_container.py`
**Responsibilities:**
- Provider lifetime management
- Singleton identity
- Dependency graph
- Destruction

**Resolution Owner:** ProviderRegistry
**Location:** `runtime/kernel/providers/provider-registry.ts`
**Responsibilities:**
- Provider discovery
- Capability resolution
- Provider selection
- Provider policy

**Constitutional Law:**
- RuntimeContainer owns object lifetime
- ProviderRegistry owns provider selection
- A ProviderRegistry never constructs providers

**Constitutional Flow:**
```
RuntimeBootstrap
    ↓
RuntimeContainer (owns lifetime)
    ↓
ProviderRegistry (owns selection)
    ↓
Provider (executes work)
```

**Constitutional Flow:**
```
RuntimeBootstrap
    ↓
RuntimeContainer (owns lifetime)
    ↓
ProviderRegistry (owns resolution)
    ↓
Provider (executes work)
```

**Provider Responsibilities:**
- Execute work
- Never self-register
- Never self-construct

---

### Bootstrap

**Owner:** RuntimeBootstrap
**Location:** `runtime/bootstrap.py`
**Responsibilities:**
- Single constitutional bootstrap path
- Composition root
- Dependency wiring

**Constitutional Rule:** Only RuntimeBootstrap may initialize production runtime

**Criterion:** Independent production runtime initialization (not test/CLI/dev tools)

---

### Git

**Owner:** ProjectionPipeline
**Location:** `runtime/kernel/projection/projection-pipeline.ts` (to be created)
**Responsibilities:**
- Projection orchestration
- Evidence-to-projection transformation
- Projection sink management

**Projection Sink:** GitProjection
**Location:** `constitutional-compiler/git/git-infrastructure.ts` (to be repurposed)
**Responsibilities:**
- Git projection sink
- Evidence archive
- Provenance record
- Witness persistence

**Constitutional Law:** Git is never constitutional state. Git is merely one projection sink.

**Constitutional Flow:**
```
Execution
    ↓
Evidence
    ↓
Replay
    ↓
Witness
    ↓
ProjectionPipeline
    ↓
GitProjection (one sink among many)
```

**Future-Proof:** ProjectionPipeline may emit to Git, OCI, Witness archive, Ledger from same evidence.

**Forbidden Flow:**
```
Execution
    ↓
Git
    ↓
Execution continues
```

**Constitutional Violation:** Git as execution dependency (constitutional leakage)

---

### Infrastructure

**Owner:** GatewayAuthority
**Location:** `src/lib/gateway.ts` (crx-ui-next)
**Responsibilities:**
- Single gateway resolution authority
- Gateway URL resolution
- Gateway configuration

**Constitutional Rule:** Only GatewayAuthority may resolve gateway URLs

**Criterion:** Production infrastructure only (not test/CLI/dev tools)

---

## Supporting Modules (Not Authorities)

**Definition:** Supporting modules participate in authority operations but do not own canonical semantics

**Examples:**
- ReplayStateMachine: State machine logic
- ReplayTranscriptBuilder: Transcript generation
- ReplayLimits: Configuration limits
- ReplayInvariants: Invariant definitions
- StateSerializer: State serialization
- CanonicalJson: Canonical JSON serialization

**Constitutional Rule:** Authorities own decisions, helpers execute decisions

---

## Business Service Classification

**Every business service must be classified as either:**

### Facade (Acceptable)
- Coordinates other components
- Delegates to authorities
- Does not own canonical semantics

### Authority (Violation if not canonical)
- Owns canonical semantics
- Defines constitutional behavior
- Single source of truth

**Constitutional Rule:** Only constitutional authorities may own canonical semantics

**Question:** Does the service decide or delegate?
- Decide: Authority (violation if not constitutional)
- Delegate: Façade (acceptable)

---

## Event Authority Definition

**Constitutional Question:** Who may mint constitutional events?

**Event Creation (Authority):**
- Component creates new constitutional events
- Component is event authority
- **Constitutional violation if not canonical**

**Event Storage (Not Authority):**
- Component stores events
- Component does not mint events
- **Not constitutional violation unless synthesizing events**

**Event Consumption (Not Authority):**
- Component reads events
- Component does not mint events
- **Not constitutional violation**

**Constitutional Rule:** Only ExecutionEventBus may mint constitutional events

---

## Implementation Gate

**Every finding must satisfy before harvest:**

1. **Observed:** Directly observed in inspected source
2. **Owner Known:** Maps to single constitutional owner in this map
3. **Replacement Known:** Clear path to constitutional owner
4. **Acceptance Test Exists:** Test to verify constitutional convergence
5. **Harvest:** Remove code that violates ownership map

**If any one is missing:**
- Classification: "Requires Constitutional Definition"
- NOT "Remaining" or "Recommendation"

---

## Constitutional Ownership Hierarchy

```
RuntimeBootstrap (builds the system)
    ↓
RuntimeContainer (owns lifetime, singleton identity, dependency graph, destruction)
    ↓
ProviderRegistry (owns provider discovery, capability resolution, provider selection, provider policy)
    ↓
Provider (executes work, never self-register, never self-construct)
```

---

## Constitutional Flow

```
Execution
    ↓
Evidence
    ↓
Replay
    ↓
Witness
    ↓
Git Projection
```

**Forbidden:** Execution → Git → Execution continues (constitutional leakage)

---

## Constitutional Invariants

**Execution:**
- Execution may mutate nothing except Evidence
- Execution is pure except Evidence append

**Evidence:**
- Evidence is append-only
- Evidence is immutable
- Evidence is the source of truth

**Replay:**
- Replay is pure
- Replay is deterministic
- Replay never mutates runtime state

**Witness:**
- Witness is deterministic
- Witness is derived from Evidence
- Witness is immutable

**Knowledge:**
- Knowledge consumes Evidence only
- Knowledge never creates Evidence
- Knowledge mutations are authoritative

**Projection:**
- Projection consumes Witness only
- Projection never creates Witness
- Projection is derived

**Infrastructure:**
- Infrastructure never defines constitutional state
- Infrastructure supports operations only
- Infrastructure is replaceable

**Providers:**
- Providers execute but never decide
- Providers never self-register
- Providers never self-construct

**Git:**
- Git records state but never creates state
- Git is a projection sink only
- Git is never execution dependency

---

## Authority Map Summary

| Authority | Owner | Location | Category | Status |
|-----------|-------|----------|----------|--------|
| Execution | ExecutionEngine | runtime/kernel/execution/execution-engine.ts | Constitutional Runtime Gateway | ✅ Frozen |
| Events | ExecutionEventBus | runtime/kernel/execution/execution-event-bus.ts | Constitutional | ✅ Frozen |
| Replay | DeterministicReplayEngine | runtime/kernel/replay/deterministic_replay_engine.ts | Constitutional | ✅ Frozen |
| Knowledge | KnowledgeAuthority | runtime/kernel/knowledge/knowledge-authority.ts | Constitutional | ✅ Frozen |
| Identity | CanonicalIdentityService | runtime/kernel/identity/canonical-identity-service.ts | Constitutional | ✅ Frozen |
| Witness | WitnessAuthority | runtime/kernel/replay/witness_authority.ts | Constitutional | ✅ Frozen |
| Canonical Hash | CanonicalHashAuthority | runtime/kernel/replay/canonical_hash_authority.ts | Constitutional | ✅ Frozen |
| Provider Lifetime | RuntimeContainer | runtime/di_container.py | Runtime | ✅ Frozen |
| Provider Resolution | ProviderRegistry | runtime/kernel/providers/provider-registry.ts | Constitutional | ✅ Frozen |
| Bootstrap | RuntimeBootstrap | runtime/bootstrap.py | Runtime | ✅ Frozen |
| Projection Pipeline | ProjectionPipeline | runtime/kernel/projection/projection-pipeline.ts | Runtime | ✅ Frozen |
| Git Projection | GitProjection | constitutional-compiler/git/git-infrastructure.ts | Projection | ✅ Frozen |
| Infrastructure | GatewayAuthority | src/lib/gateway.ts (crx-ui-next) | Infrastructure | ✅ Frozen |

---

**Frozen Date:** 2026-07-29
**Status:** Constitutional authority definitions established
**Next Step:** Phase 0 - Startup Integrity (P0 only)
