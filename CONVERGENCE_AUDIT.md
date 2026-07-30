# Constitutional Runtime Convergence Audit

**Audit Date:** 2026-07-29
**Objective:** Identify authority duplication and harvest targets for Oracle convergence
**Assessment:** Execution spine 95%, Provider model 90%, Replay sovereignty 65%, Authority convergence 60%, Oracle convergence 55%

---

## Audit Findings

### 1. Execution Entry Points

**Canonical Entry Point:**
- `ExecutionEngine.execute()` - Constitutional execution spine

**Alternative Entry Points (Harvest Targets):**

**Business Services (src/services/):**
- `EventService` - Event sourcing operations (append, replay, snapshot, witness, verify)
- `ReplayService` - Replay operations (aggregate, property, customer, artifact, timeline)
- `GraphService` - Graph operations (nodes, edges, paths, traversal)
- `IdentityService` - Identity operations (customer, crew member, company, role assignment)
- `ArtifactService` - Artifact operations (various business artifact types)
- `PropertyService` - Property operations (property management)
- `ClassifierService` - Classifier operations

**Commit Service (runtime/kernel/commit-service/):**
- `commitArtifact` - Commit operations via HTTP API
- `auditArtifacts` - Audit operations via HTTP API
- Express server on port 8080

**Compiler Execution (constitutional-compiler/execution/):**
- `DistributedExecution` - Worker scheduling and distributed compute
- `DistributedGraphScheduler` - Graph computation scheduling

**Direct Provider Execution:**
- `GitHubProvider.execute()` - Direct GitHub API calls
- All providers implement `execute()` method

**Status:** ❌ **FAIL** - Multiple execution entry points exist

---

### 2. Event Bus Implementations

**Canonical Event Authority:**
- `ExecutionEventBus` - Constitutional event pipeline

**Alternative Event Systems (Harvest Targets):**

**EventService (src/services/event-service.ts):**
- `InMemoryEventStore` - Event storage and retrieval
- Event sourcing operations independent of ExecutionEventBus
- Event history management

**Multiple Event Bus Instances:**
- Test files create new `ExecutionEventBus` instances:
  - `spine-test.ts` - Line 31
  - `github-spine-test.ts` - Line 34
  - `execution-engine-test.ts` - Uses ExecutionEngine which creates ExecutionEventBus

**Status:** ❌ **FAIL** - Multiple event bus implementations exist

---

### 3. Replay Engines

**Canonical Replay Authority:**
- `ReplayAuthority` - Constitutional replay metadata generation

**Alternative Replay Systems (Harvest Targets):**

**ReplayService (src/services/replay-service.ts):**
- `InMemoryReplayService` - Business replay implementation
- Replay operations for aggregates, properties, customers, artifacts
- Certificate generation and verification
- Depends on EventService, IdentityService, PropertyService, ArtifactService

**ReplayHook (runtime/kernel/execution/replay-hook.ts):**
- Hook-based replay event generation
- Transcript recording
- Independent replay mechanism

**ReplayVerification (runtime/kernel/replay/replay_verification.ts):**
- Replay determinism verification
- Used by ExpressCommitAdapter

**ReplayEventStream (runtime/kernel/replay/replay_event_stream.ts):**
- Event stream management for replay

**Status:** ❌ **FAIL** - Multiple replay engines exist

---

### 4. Graph Writes Outside Knowledge Authority

**Canonical Graph Authority:**
- `IKnowledgeAuthority.createNode()` - Constitutional graph node creation
- `IKnowledgeAuthority.createEdge()` - Constitutional graph edge creation

**Alternative Graph Writes (Harvest Targets):**

**GraphService (src/services/graph-service.ts):**
- Direct node and edge creation
- Graph operations independent of Knowledge Authority
- Business-specific graph logic mixed with universal graph operations

**Execution Engine (runtime/kernel/execution/execution-engine.ts):**
- Direct calls to `knowledgeAuthority.createNode()` - Line 197
- Direct calls to `knowledgeAuthority.createEdge()` - Line 157
- Execution knows graph layout (architectural violation)

**Test Files:**
- `spine-test.ts` - Direct graph mutation in event data
- `github-spine-test.ts` - Direct graph mutation in event data

**Status:** ❌ **FAIL** - Graph writes exist outside Knowledge Authority

---

### 5. Direct Provider Construction

**Canonical Provider Authority:**
- `ProviderRegistry` - Dynamic provider registration and resolution

**Direct Provider Construction (Harvest Targets):**

**Test Files:**
- `execution-engine-test.ts` - Line 37: `new GitHubProvider()`
- `github-spine-test.ts` - Line 38: `new GitHubProvider()`
- `spine-test.ts` - No direct provider construction (uses event bus)

**Business Services:**
- `EventService` - Direct instantiation in tests
- `IdentityService` - Direct instantiation in tests
- `GraphService` - Direct instantiation in tests
- `ReplayService` - Direct instantiation in tests
- `ArtifactService` - Direct instantiation in tests
- `PropertyService` - Direct instantiation in tests

**Adapters:**
- `ExpressCommitAdapter` - Line 17: `new ReplayVerification()`
- `ConfigAdapter` - Direct instantiation

**Status:** ❌ **FAIL** - Direct provider construction exists

---

### 6. Git Dependencies for Correctness

**Constitutional Git Usage:**
- Git should be a projection, not a runtime dependency

**Git Dependencies (Harvest Targets):**

**Execution Engine (runtime/kernel/execution/execution-engine.ts):**
- Line 32: Imports `GitInfrastructureEngine`
- Line 85: Constructor creates `new GitInfrastructureEngine()`
- Line 228: Direct call to `gitInfrastructure.recordCompilerRun()`
- Git is used for correctness (commit SHA generation)

**Architectural Issue:**
- Git is an execution dependency
- Execution → Git (backwards dependency)
- Should be: Execution → Evidence → Replay → Witness → Git Projection

**Status:** ❌ **FAIL** - Git is used as runtime dependency, not projection

---

### 7. Bootstrap Paths

**Canonical Bootstrap:**
- Single bootstrap path through ExecutionEngine

**Alternative Bootstrap Paths (Harvest Targets):**

**Commit Service:**
- `runtime/kernel/commit-service/src/server.ts` - Express server bootstrap
- Port 8080 HTTP API
- Independent runtime initialization

**Express Adapter:**
- `ExpressCommitAdapter` - HTTP API integration
- Independent adapter initialization

**Business Services:**
- Each service has independent initialization
- Multiple service constructors
- No unified bootstrap

**Test Files:**
- Each test file has independent setup
- Multiple initialization patterns

**Status:** ❌ **FAIL** - Multiple bootstrap paths exist

---

## Harvest Targets

### Priority 1: Execution Entry Points

**Target:** Converge all execution to `ExecutionEngine.execute()`

**Harvest Candidates:**
1. `EventService` → Oracle Authority
2. `ReplayService` → Oracle Authority  
3. `GraphService` → Knowledge Authority
4. `IdentityService` → Identity Authority
5. `ArtifactService` → Evidence Authority
6. `PropertyService` → Evidence Authority
7. `Commit Service` → Oracle Authority
8. `DistributedExecution` → Oracle Authority

**Action Plan:**
- Replace service direct execution with ExecutionEngine.execute()
- Services become Oracle authorities or projections
- Remove direct provider.execute() calls

### Priority 2: Event Bus Convergence

**Target:** Single constitutional event authority

**Harvest Candidates:**
1. `EventService` → Event Authority
2. `InMemoryEventStore` → Event Authority
3. Multiple ExecutionEventBus instances → Single instance

**Action Plan:**
- Merge EventService into Event Authority
- Eliminate InMemoryEventStore
- Ensure single ExecutionEventBus instance
- Test files use shared event bus

### Priority 3: Replay Sovereignty

**Target:** Evidence-only replay

**Harvest Candidates:**
1. `ReplayService` → Replay Authority
2. `ReplayHook` → Replay Authority
3. `ReplayVerification` → Replay Authority
4. `ReplayEventStream` → Replay Authority

**Action Plan:**
- Converge all replay to Replay Authority
- Evidence → Canonical Transcript → Reducer → Canonical State
- Remove provider/network dependencies from replay
- Replay from evidence only, not runtime events

### Priority 4: Knowledge Authority Convergence

**Target:** All graph writes through Knowledge Authority

**Harvest Candidates:**
1. `GraphService` → Knowledge Authority
2. Execution Engine direct graph writes → Evidence → Knowledge Indexer

**Action Plan:**
- Execution emits evidence only
- Knowledge Authority consumes evidence
- Execution should not know graph layout
- Knowledge Indexer processes evidence into graph

### Priority 5: Provider Registry Enforcement

**Target:** All providers through registry

**Harvest Candidates:**
1. Direct GitHubProvider construction → ProviderRegistry
2. Direct service construction → ProviderRegistry
3. Adapter construction → ProviderRegistry

**Action Plan:**
- Eliminate direct provider construction outside bootstrap
- All providers registered in ProviderRegistry
- Providers resolved through registry only
- Test files use registry for provider access

### Priority 6: Git Projection

**Target:** Git as projection, not dependency

**Harvest Candidates:**
1. `GitInfrastructureEngine` in ExecutionEngine → Git Projection Authority

**Action Plan:**
- Remove Git from ExecutionEngine constructor
- Git becomes projection: Evidence → Replay → Witness → Git Projection
- Git records witness, does not create witness
- Execution → Evidence → Witness → Git Commit

### Priority 7: Bootstrap Convergence

**Target:** Single bootstrap path

**Harvest Candidates:**
1. Commit Service bootstrap → Oracle bootstrap
2. Express Adapter bootstrap → Oracle bootstrap
3. Service initialization → Oracle bootstrap

**Action Plan:**
- Single bootstrap through ExecutionEngine
- All services initialized as authorities
- Adapters initialized as projections
- Unified runtime initialization

---

## Convergence Roadmap

### Phase 1: Execution Convergence (Week 1)
- Harvest EventService, ReplayService, GraphService
- Converge to ExecutionEngine.execute()
- Remove direct provider.execute() calls

### Phase 2: Event Bus Convergence (Week 1)
- Merge EventService into Event Authority
- Eliminate InMemoryEventStore
- Single ExecutionEventBus instance

### Phase 3: Replay Sovereignty (Week 2)
- Converge all replay to Replay Authority
- Evidence-only replay
- Remove provider/network dependencies

### Phase 4: Knowledge Authority (Week 2)
- Execution emits evidence only
- Knowledge Authority consumes evidence
- Remove Execution graph coupling

### Phase 5: Provider Registry (Week 3)
- Eliminate direct provider construction
- All providers through registry
- Test file updates

### Phase 6: Git Projection (Week 3)
- Remove Git from ExecutionEngine
- Git as projection authority
- Witness → Git Commit flow

### Phase 7: Bootstrap Convergence (Week 4)
- Single bootstrap path
- Unified runtime initialization
- Service authority initialization

---

## Oracle Convergence Target

**Final Architecture:**

```
Oracle (Single Execution Authority)
    ↓
ExecutionEngine.execute()
    ↓
Identity Authority
    ↓
Evidence Authority
    ↓
Knowledge Authority
    ↓
Replay Authority
    ↓
Projection Authorities (Git, etc.)
    ↓
Presentation Layer
```

**Convergence Metrics:**
- Execution spine: 95% → 100%
- Provider model: 90% → 100%
- Replay sovereignty: 65% → 100%
- Authority convergence: 60% → 100%
- Oracle convergence: 55% → 100%

---

## Next Steps

1. **Immediate:** Stop adding features
2. **Phase 1:** Harvest EventService, ReplayService, GraphService
3. **Phase 2:** Event bus convergence
4. **Phase 3:** Replay sovereignty
5. **Phase 4:** Knowledge authority decoupling
6. **Phase 5:** Provider registry enforcement
7. **Phase 6:** Git projection
8. **Phase 7:** Bootstrap convergence

**Goal:** Unified constitutional runtime with Oracle as sole execution authority

---

# Constitutional Runtime Convergence Audit — Addendum

## Priority 0 — Critical Constitutional Violations

These findings represent immediate constitutional failures that prevent deterministic runtime convergence before the larger authority harvest can proceed.

---

## 0.1 Dependency Injection Import Authority Failure

### Status

❌ **FAIL**

### Findings

The dependency injection container references authorities using incorrect module paths.

**Confirmed:**

`constitution/authority/__init__.py` 

correctly exports

* `CanonicalAuthority` 

therefore

```python
from constitution.authority import CanonicalAuthority
```

is valid.

However:

`di_container.py` 

imports

```python
constitution.authority.canonical
```

which does **not exist**.

This produces an application startup ImportError before constitutional bootstrapping completes.

---

### Constitutional Violation

Bootstrap imports must originate from the constitutional export surface.

The export surface is:

```
constitution.authority
```

not internal implementation paths.

---

### Harvest Target

DI Container

↓

Canonical Authority export surface

---

## 0.2 Replay Engine Path Drift

### Status

❌ **FAIL**

The DI layer references

```
runtime/kernel/replay/replay_engine.py
```

which does **not exist**.

This indicates replay authority fragmentation and stale import references.

---

### Constitutional Violation

Replay Authority must have a single canonical implementation.

Import paths must converge on one replay engine.

---

### Harvest Target

Replay imports

↓

Replay Authority

---

## 0.3 DI Import Graph Audit

### Status

❌ **FAIL**

The DI container requires a complete constitutional import verification.

Audit every imported authority:

* CanonicalAuthority
* ReplayAuthority
* KnowledgeAuthority
* EvidenceAuthority
* IdentityAuthority
* Projection Authorities
* ProviderRegistry

Verify:

* module exists
* export exists
* import path canonical
* no stale implementation references
* no duplicated authority implementations

---

### Required Audit

```
DI Container

↓

Authority Export Surface

↓

Concrete Authority

↓

Single Implementation
```

No bypasses.

---

# Infrastructure Convergence Audit

## UI → Gateway Constitutional Audit

Repository:

```
crx-ui-next
```

---

## Status

❌ **FAIL**

The frontend communicates with the Gateway using four different authority models.

---

## Gateway Resolution Patterns

### Pattern A

Shared Gateway Library

```
src/lib/gateway.ts
```

Uses

```
NEXT_PUBLIC_GATEWAY_URL
```

with fallback.

✅ Constitutional

---

### Pattern B

Inline Environment Variable

Two write paths duplicate gateway resolution.

⚠ Authority duplication.

---

### Pattern C

Hardcoded Gateway Constant

```
CockpitDashboard.tsx

const GATEWAY_URL =
http://localhost:8080
```

❌ Completely bypasses constitutional configuration.

---

### Pattern D

Hardcoded Fetch URLs

Multiple files directly call

```
http://localhost:8080
```

ignoring environment configuration.

Affected:

* command-center
* chat
* CockpitDashboard

---

## Constitutional Violation

Gateway Authority must be singular.

UI components must never independently determine gateway location.

Current state:

```
Gateway Resolution

↓

4 competing authorities

↓

Configuration drift
```

---

## Canonical Target

Every network call resolves through

```
Gateway Authority

↓

src/lib/gateway.ts

↓

NEXT_PUBLIC_GATEWAY_URL

↓

Gateway
```

No component may construct URLs independently.

---

## Environment Audit

### Status

⚠ Missing

No

```
.env
.env.local
```

files exist.

Local execution therefore silently falls back to

```
localhost:8080
```

creating implicit runtime assumptions.

---

## Docker Audit

Compose correctly injects

```
NEXT_PUBLIC_GATEWAY_URL=http://gateway:8080
```

However:

hardcoded localhost URLs ignore Docker DNS.

This creates runtime divergence between:

* local execution
* Docker execution

---

## Proxy Layer

### Status

❌ Missing

No

```
next.config.js
rewrites()
```

configuration exists.

Browser communicates directly with Gateway.

Consequences:

* CORS dependency
* duplicated gateway resolution
* frontend owns infrastructure topology

---

## Constitutional Target

Browser

↓

Next.js

↓

Gateway Proxy

↓

Gateway

↓

Oracle

Components should never know gateway topology.

---

# Additional Harvest Targets

## Priority 0

Dependency Injection

↓

Canonical export surface

---

## Priority 0

Replay import convergence

↓

Replay Authority

---

## Priority 0

Gateway Authority

Harvest:

* CockpitDashboard
* command-center
* chat page

↓

Shared Gateway Library

---

## Priority 0

Gateway topology

Harvest:

```
hardcoded URLs

↓

Gateway Authority

↓

Next.js rewrite

↓

Gateway
```

---

# Updated Convergence Roadmap

## Phase 0 — Constitutional Startup Repair

Complete before all other phases.

1. Fix DI import authority.
2. Remove stale replay imports.
3. Verify every authority export.
4. Audit DI graph.
5. Converge Gateway Authority.
6. Eliminate hardcoded localhost references.
7. Add Next.js gateway rewrite/proxy.
8. Verify Docker and local execution converge identically.

Only after Phase 0 passes should the existing seven-phase Oracle convergence roadmap begin.

---

## Updated Constitutional Goal

Execution convergence now requires **three independent dimensions**:

```
Authority Convergence
        ↓
Replay Convergence
        ↓
Infrastructure Convergence
        ↓
Oracle
        ↓
Execution Engine
        ↓
Evidence
        ↓
Knowledge
        ↓
Replay
        ↓
Witness
        ↓
Git Projection
```

Any duplicated import path, gateway path, replay path, or authority export constitutes constitutional fragmentation and must be harvested into a single sovereign authority before claiming full Oracle convergence.
