# Audit Methodology Revision

**Objective:** Address methodological weaknesses in the constitutional runtime audit

---

## Classification Framework

### Finding Classification

| Classification | Meaning | Evidence Required |
|----------------|---------|-------------------|
| ✅ Verified | Directly observed in inspected source code | Source file, line numbers, code snippets |
| 🟡 Inferred | Architectural conclusion supported by evidence but not directly proven | Pattern matching, architectural analysis, indirect evidence |
| 🔵 Requires Inspection | Insufficient evidence to classify | Repository not inspected, code not available, unclear implementation |
| ❓ Unverified Claim | Claim made without supporting evidence | No source inspection, no architectural evidence |
| 💡 Recommendation | Architectural convergence advice, not a defect | Constitutional design guidance |

### Confidence Scores

| Confidence | Meaning | Evidence Standard |
|------------|---------|-------------------|
| High | Verified directly in code | Source inspection with line numbers and code snippets |
| Medium | Strong architectural inference | Pattern matching across multiple files, consistent architectural patterns |
| Low | Pattern match only | Single file inspection, limited context |
| Unknown | Repository not inspected | No source code available |

### Severity Levels

| Severity | Meaning | Examples | Contractor Guidance |
|----------|---------|----------|---------------------|
| P0 Constitutional Failure | Startup failure, canonical hash divergence, constitutional authority bypass | DI import errors, replay divergence, execution spine bypass | Blocks convergence |
| P1 Runtime Failure | Authority duplication, configuration drift, infrastructure fragmentation | Multiple authorities, hardcoded URLs, bootstrap fragmentation | Requires immediate attention |
| P2 Drift | Architectural cleanup, façade delegation, helper duplication | Business service orchestration, supporting modules | Can be deferred |
| P3 Cleanup | Test construction, dev tools, CLI utilities | Test-only code, development tools | Can be deferred |

---

## Constitutional Authority Definition

### Constitutional Authority
A constitutional authority owns:
- Canonical state
- Canonical ordering
- Canonical identity
- Canonical mutation
- Canonical replay

### Supporting Module
A supporting module:
- Participates in authority operations
- Does not own canonical semantics
- Is a helper or utility

**Example:** ReplayStateMachine, ReplayTranscriptBuilder, ReplayLimits, ReplayInvariants are supporting modules, not constitutional authorities.

---

## Ownership vs Orchestration vs Delegation

### Ownership
- Component owns canonical semantics
- Component defines constitutional behavior
- Component is the single source of truth

### Orchestration
- Component coordinates other components
- Component does not own canonical semantics
- Component is a façade or coordinator

### Delegation
- Component delegates to authority
- Component does not own canonical semantics
- Component is a client

**Example:** A business service that delegates to ReplayAuthority is acceptable (delegation). A business service that implements its own replay semantics is not (ownership).

---

## Bootstrap Classification

### Production Runtime Initialization
- Independent production runtime startup
- Constitutional runtime initialization
- **Constitutional violation if not converged**

### Test/CLI/Dev Tools
- Test initialization
- CLI utilities
- Development tools
- Migrations
- Benchmarks
- **Not constitutional violations**

---

## Event Authority Definition

### Constitutional Question: Who may mint constitutional events?

### Event Creation
- Component creates new constitutional events
- Component is event authority
- **Constitutional violation if not canonical**

### Event Storage
- Component stores events
- Component does not mint events
- **Not constitutional violation unless synthesizing events**

### Event Consumption
- Component reads events
- Component does not mint events
- **Not constitutional violation**

---

## Canonical vs Auxiliary

### Canonical
- Single source of truth
- Constitutional authority
- Production runtime

### Auxiliary
- Offline verification
- Migration
- Testing
- Formal validation
- **Not constitutional violation**

---

## Architecture vs Implementation

### Architecture Guidance
- Constitutional design recommendations
- Convergence objectives
- **Classified as 💡 Recommendation**

### Implementation Verification
- Verified implementation defects
- Code-level violations
- **Classified as ✅ Verified, 🟡 Inferred, or 🔵 Requires Inspection**

---

## Repository Inspection

### Inspected Repository
- Source code available
- Direct inspection performed
- **Classification: Verified or Inferred**

### Uninspected Repository
- Source code not available
- No direct inspection
- **Classification: 🔵 Requires Inspection**

---

## Measurable Criteria

### Instead of Architecture Goals
- "One execution authority" → "Number of public execution entrypoints"
- "One event authority" → "Number of event minting APIs"
- "One replay authority" → "Number of replay implementations"
- "One provider resolution authority" → "Number of provider construction sites"

### Measurable Metrics
- Count of public APIs
- Count of implementation sites
- Count of authority owners
- Count of canonical implementations

---

## Ownership Hierarchy Definition

### Provider Ownership
**Option A:**
```
RuntimeContainer
    ↓
ProviderRegistry
    ↓
Provider
```

**Option B:**
```
RuntimeContainer
    ↓
Provider
```

**Requirement:** Define which owns provider lifetime

---

## Phase Count Consistency

### Inventory Must Equal Summary
- Total findings in inventory = Total findings in summary
- Each component counted once
- Supporting modules not counted as authorities
- Test-only items marked separately

---

## Revision Plan

### Phase 0.5 - Freeze Interfaces (NEW)
- Freeze public APIs
- Freeze imports
- Freeze authority interfaces
- Prevent interface changes during harvesting

### Phase 0 - Startup Integrity
- Re-classify DI imports as Verified/Inferred
- Re-classify replay imports as Verified/Inferred/Requires Inspection
- Re-classify bootstrap paths as Production vs Test/CLI/Dev Tools
- Fix count inconsistencies
- Replace recommendations with executable gates

### Phase 1 - Execution Sovereignty
- Distinguish orchestration vs ownership for business services
- Re-classify test-only entries
- Fix count inconsistencies
- Replace recommendations with executable gates

### Phase 2 - Event Sovereignty
- Clarify event authority definition (who may mint events)
- Distinguish storage from creation
- Re-classify as Verified/Inferred/Requires Inspection
- Replace recommendations with executable gates

### Phase 3 - Replay Sovereignty
- Distinguish canonical vs auxiliary for ReplayKernel
- Separate supporting modules from authorities
- Re-classify as Verified/Inferred/Requires Inspection
- Replace recommendations with executable gates

### Phase 4 - Knowledge Sovereignty
- Re-classify graph mutations as Verified/Inferred/Requires Inspection
- Distinguish orchestration vs ownership
- Replace recommendations with executable gates

### Phase 5 - Provider Sovereignty
- Define ProviderRegistry vs RuntimeContainer ownership hierarchy
- Re-classify as Verified/Inferred/Requires Inspection
- Replace recommendations with executable gates

### Phase 6 - Git Projection
- Separate architecture guidance from implementation verification
- Re-classify as Recommendation vs Verified/Inferred
- Replace recommendations with executable gates

### Phase 7 - Infrastructure Sovereignty
- Mark un-inspected repositories as Requires Inspection
- Re-classify as 🔵 Requires Inspection
- Replace recommendations with executable gates

### Phase 8 - Verification
- Replace architecture goals with measurable criteria
- Add severity levels to all findings
- Add confidence scores to all findings
- Fix count inconsistencies
- Replace recommendations with executable gates

---

## Executable Gates

### Phase 0.5 - Freeze Interfaces
**Gate:** Public APIs, imports, authority interfaces must be frozen before harvesting
**Test:** No interface changes during Phase 0-7

### Phase 0 - Startup Integrity
**Gate:** `rg "from constitution.authority"` returns only canonical export surface
**Gate:** `rg "execute("` returns only ExecutionEngine.execute() in production code
**Gate:** `rg "bootstrap"` returns only RuntimeBootstrap in production code
**Gate:** Entry-point census: All execution paths reach ExecutionEngine.execute()
**Gate:** Call graph verification: No dead execution paths
**Gate:** Bootstrap convergence: All production bootstraps converge to RuntimeBootstrap

### Phase 1 - Execution Sovereignty
**Gate:** `rg "execute("` returns only ExecutionEngine.execute() and zero production alternatives
**Gate:** All business services classified as Façade or Authority
**Gate:** Entry-point census: All provider execution routes through ExecutionEngine
**Gate:** Call graph verification: No bypass of ExecutionEngine

### Phase 2 - Event Sovereignty
**Gate:** `rg "Event("` returns only ExecutionEventBus event creation
**Gate:** All event storage marked as storage, not authority
**Gate:** Entry-point census: All event creation routes through ExecutionEventBus
**Gate:** Call graph verification: No bypass of ExecutionEventBus

### Phase 3 - Replay Sovereignty
**Gate:** `rg "replay"` returns only DeterministicReplayEngine as canonical
**Gate:** Python ReplayKernel marked as auxiliary
**Gate:** Replay purity verification: snapshot(state) → replay(events) → snapshot(state) → byte equality
**Gate:** If not identical: P0 constitutional failure

### Phase 4 - Knowledge Sovereignty
**Gate:** `rg "graph.mutate"` returns only KnowledgeAuthority
**Gate:** All graph mutations map to KnowledgeAuthority
**Gate:** Entry-point census: All graph mutations route through KnowledgeAuthority
**Gate:** Call graph verification: No bypass of KnowledgeAuthority

### Phase 5 - Provider Sovereignty
**Gate:** `rg "new Provider"` returns only RuntimeContainer construction
**Gate:** `rg "ProviderRegistry"` returns only resolution, not construction
**Gate:** Provider construction verification: No `new Provider(...)` outside RuntimeContainer
**Gate:** ProviderRegistry bypass verification: No provider construction bypassing ProviderRegistry

### Phase 6 - Git Projection
**Gate:** `rg "Git"` returns only ProjectionPipeline → GitProjection
**Gate:** No direct Git dependencies in ExecutionEngine
**Gate:** ProjectionPipeline exists before Git removal (prevent projection vacuum)

### Phase 7 - Infrastructure Sovereignty
**Gate:** `rg "gateway"` returns only GatewayAuthority
**Gate:** All infrastructure marked as Infrastructure category
**Gate:** Entry-point census: All gateway resolution routes through GatewayAuthority

### Phase 8 - Verification
**Gate:** Every finding maps to single constitutional owner
**Gate:** Every finding has replacement path and acceptance test
**Gate:** All findings are ✅ Verified resolved, ⚠ Explicitly deferred, or 🔵 Requires inspection
**Gate:** Authority inventory generated from codebase matches frozen authority map

---

## Evidence Invariants Verification

### Evidence Append-Only
**Gate:** No update operations on Evidence
**Test:** `rg "update.*evidence"` returns zero results in production code

### Evidence Immutable
**Gate:** No delete operations on Evidence
**Test:** `rg "delete.*evidence"` returns zero results in production code

### Evidence No Overwrite
**Gate:** No overwrite paths on Evidence
**Test:** `rg "overwrite.*evidence"` returns zero results in production code

### Evidence Hash Stability
**Gate:** Evidence hash is stable across replay
**Test:** Hash evidence → replay → hash evidence → byte equality
**If not identical:** P0 constitutional failure

---

## Severity Tied to Executable Gates

### P0 Constitutional Failure
- Fails deterministic replay (snapshot before/after not byte equal)
- Fails bootstrap (startup failure)
- Canonical hash mismatch
- Evidence update/delete/overwrite operations
- Evidence hash instability
- Replay mutates runtime state

### P1 Runtime Failure
- Duplicate execution ingress
- Duplicate event minting
- Provider construction outside RuntimeContainer
- ProviderRegistry bypass
- Git execution dependency (before ProjectionPipeline exists)

### P2 Drift
- Façade cleanup
- Helper duplication
- Supporting module misclassification

### P3 Cleanup
- Test code
- Dev tools
- CLI utilities

---

## Lock-Step Harvest Cycle

### Cycle for Each Phase
1. **Inspect:** Inventory current implementation
2. **Verify current state:** Run executable gates on baseline
3. **Harvest:** Remove violations
4. **Replay Verification:** snapshot → replay → snapshot → byte equality
5. **Canonical Hash Verification:** Hash stability check
6. **Witness Verification:** Witness generation check
7. **Constitutional Regression Gate:** Authority inventory unchanged, count unchanged, replay unchanged, witness unchanged, hash unchanged
8. **Commit:** Only if all gates pass

**Rule:** No phase advances unless every constitutional gate passes

---

## Constitutional Dependency Law

### Authorities May Only Depend Downward

**Constitutional Dependency Hierarchy:**
```
Execution (Constitutional Runtime Gateway)
    ↓
Evidence
    ↓
Replay
    ↓
Witness
    ↓
Projection
    ↓
Infrastructure
```

**Constitutional Law:**
- Never upward dependencies
- Never sideways dependencies
- Never cyclic dependencies
- Only downward dependencies

**Purpose:** Prevents constitutional drift during harvest

---

## Authority Inventory as Source of Truth

### Current (Incorrect) Flow
Frozen Authority Map
    ↓
Compare against code

### Correct Flow
Code
    ↓
Inventory Generator
    ↓
Constitutional Map
    ↓
Human Review
    ↓
Freeze

**Purpose:** Prevents stale documentation from becoming constitutional truth

---

## Authority Inventory Generation

### Generated from Codebase
**Output Format:**
| Authority | Owner | Implementation | Public APIs | Violations |
|-----------|-------|---------------|-------------|------------|
| Execution | ExecutionEngine | runtime/kernel/execution/execution-engine.ts | execute() | 0 |
| Replay | DeterministicReplayEngine | runtime/kernel/replay/deterministic_replay_engine.ts | replay(), verify() | 0 |
| Knowledge | KnowledgeAuthority | runtime/kernel/knowledge/knowledge-authority.ts | mutateGraph(), queryGraph() | 0 |

**Purpose:** Source of truth for constitutional authority map

---

## Constitutional Regression Gate

### After Every Harvest
**Gate:** Authority inventory unchanged
**Gate:** Authority count unchanged
**Gate:** Replay unchanged (snapshot before/after byte equal)
**Gate:** Witness unchanged
**Gate:** Hash unchanged

**If any gate fails:** Rollback harvest and investigate

**Purpose:** Prevents constitutional drift during harvest

---

## Phase 0 Scope (P0 Only)

### Startup Integrity
**Scope:**
- Fix DI import failures
- Eliminate replay path drift
- Converge production bootstrap to single RuntimeBootstrap
- Ensure every production execution path reaches ExecutionEngine.execute()
- Ensure no replay implementation mutates runtime state
- Verify evidence append-only behavior

**Deliverables:**
- Startup succeeds from clean environment
- One production bootstrap path
- One execution ingress
- Replay passes determinism
- Canonical hash remains stable
- Witness generation remains identical before and after fixes

**Excluded from Phase 0:**
- Provider harvesting
- Event harvesting
- Git projection changes
- Infrastructure cleanup

**Purpose:** Establish stable, deterministic runtime before modifying authority boundaries

---

**Status:** Methodology frozen
**Next Step:** Execute Phase 0 - Startup Integrity (P0 only)

---

## Implementation Order (Final)

**Phase 0:** Startup Integrity (P0 only)
- Fix DI import failures
- Eliminate replay path drift
- Converge production bootstrap to single RuntimeBootstrap
- Ensure every production execution path reaches ExecutionEngine.execute()
- Ensure no replay implementation mutates runtime state
- Verify evidence append-only behavior

**Phase 0.1:** Generate authority inventory from codebase
- Scan codebase for all authority implementations
- Document public APIs
- Document violations

**Phase 0.2:** Diff inventory vs constitutional map
- Compare generated inventory against frozen authority map
- Identify drift
- Human review of discrepancies

**Phase 0.3:** Freeze interfaces
- Freeze public APIs based on verified inventory
- Freeze authority interfaces
- Freeze canonical export surfaces

**Phase 0.4:** Freeze imports
- Freeze canonical import paths
- Ensure no import drift

**Phase 0.5:** Begin harvesting
- Start harvesting violations
- Follow lock-step verification cycle

**Phase 0.6:** Implement ProjectionPipeline before removing Git dependencies
- Create ProjectionPipeline
- Prevent projection vacuum

**Phase 1:** Harvest execution ingress (with lock-step verification)
**Phase 2:** Harvest event minting (with lock-step verification)
**Phase 3:** Harvest replay ownership (with lock-step verification)
**Phase 4:** Harvest knowledge mutation (with lock-step verification)
**Phase 5:** Harvest provider resolution (with lock-step verification)
**Phase 6:** Remove Git from execution (after ProjectionPipeline exists)
**Phase 7:** Converge infrastructure (with lock-step verification)
**Phase 8:** Re-run audit and regenerate verification matrix

**Each Phase:** Inspect → Verify current state → Harvest → Replay verify → Hash verify → Witness verify → Commit

---

## Authority Categories (Refined)

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

## Constitutional Laws

**Provider Ownership:**
- RuntimeContainer owns object lifetime
- ProviderRegistry owns provider selection
- A ProviderRegistry never constructs providers

**Git Projection:**
- Git is never constitutional state
- Git is merely one projection sink
- ProjectionPipeline owns projection

**Replay Auxiliary:**
- Auxiliary replay may verify
- Auxiliary replay may compare
- Auxiliary replay may migrate
- Auxiliary replay may never commit
- Auxiliary replay may never publish
- Auxiliary replay may never mutate
- Auxiliary replay may never evolve runtime state

---

## Implementation Order

**Phase 0.5:** Freeze Interfaces
**Phase 0:** DI imports, replay path drift, bootstrap convergence (P0 failures)
**Phase 1:** Single execution ingress
**Phase 2:** Single event minting authority
**Phase 3:** Replay convergence
**Phase 4:** Knowledge mutation convergence
**Phase 5:** Provider resolution convergence
**Phase 6:** Git becomes projection only
**Phase 7:** Infrastructure convergence
**Phase 8:** Re-run audit and regenerate verification matrix

---

**Status:** Methodology revisions frozen
**Next Step:** Execute Phase 0.5 - Freeze Interfaces
