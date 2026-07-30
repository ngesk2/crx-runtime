# Phase 1 - Execution Sovereignty

**Objective:** Produce a complete inventory of every execution entry point

**For each:**
- Location
- Purpose
- Authority Owner
- Disposition (Harvest/Preserve/Delete)

**Acceptance Criteria:** Execution enters the constitutional runtime through one path only

---

## Execution Entry Point Inventory

### 1. ExecutionEngine.execute()

**Location:** `runtime/kernel/execution/execution-engine.ts`
**Purpose:** Constitutional execution spine - canonical execution entry point
**Authority Owner:** ExecutionEngine (Constitutional Authority)
**Disposition:** ✅ **Preserve** - This is the canonical execution authority

**Execution Flow:**
```
ExecutionEngine.execute()
    ↓
Identity resolution
    ↓
Policy check
    ↓
Provider execution
    ↓
Evidence storage
    ↓
Knowledge graph indexing
    ↓
Replay transcript generation
    ↓
Projection
    ↓
Event publishing
```

**Constitutional Status:** ✅ This is the intended sole execution ingress

---

### 2. GitHubProvider.execute()

**Location:** `runtime/adapters/github-provider-adapter.ts`
**Purpose:** Direct GitHub API execution
**Authority Owner:** GitHubProvider (Provider)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Current Usage:**
- Direct provider.execute() calls bypass execution spine
- Test files call GitHubProvider.execute() directly
- Self-improvement loop calls GitHubProvider through ExecutionEngine

**Constitutional Violation:** Direct provider execution bypasses constitutional spine

---

### 3. EventService Operations

**Location:** `src/services/event-service.ts`
**Purpose:** Event sourcing operations (append, replay, snapshot, witness, verify)
**Authority Owner:** EventService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- appendEvent()
- replayEvents()
- createSnapshot()
- generateWitness()
- verifyEvent()

**Constitutional Violation:** Business service performing constitutional work

---

### 4. ReplayService Operations

**Location:** `src/services/replay-service.ts`
**Purpose:** Replay operations (aggregate, property, customer, artifact, timeline)
**Authority Owner:** ReplayService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- replayAggregate()
- replayProperty()
- replayCustomer()
- replayArtifact()
- replayTimeline()
- generateCertificate()
- verifyCertificate()

**Constitutional Violation:** Business service performing constitutional replay work

---

### 5. GraphService Operations

**Location:** `src/services/graph-service.ts`
**Purpose:** Graph operations (nodes, edges, paths, traversal)
**Authority Owner:** GraphService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- createNode()
- createEdge()
- findPath()
- traverseGraph()

**Constitutional Violation:** Business service performing constitutional graph work

---

### 6. IdentityService Operations

**Location:** `src/services/identity-service.ts`
**Purpose:** Identity operations (customer, crew member, company, role assignment)
**Authority Owner:** IdentityService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- createCustomer()
- createCrewMember()
- createCompany()
- assignRole()

**Constitutional Violation:** Business service performing constitutional identity work

---

### 7. ArtifactService Operations

**Location:** `src/services/artifact-service.ts`
**Purpose:** Artifact operations (various business artifact types)
**Authority Owner:** ArtifactService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- createArtifact()
- updateArtifact()
- deleteArtifact()

**Constitutional Violation:** Business service performing constitutional evidence work

---

### 8. PropertyService Operations

**Location:** `src/services/property-service.ts`
**Purpose:** Property operations (property management)
**Authority Owner:** PropertyService (Business Service)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- createProperty()
- updateProperty()
- transferProperty()

**Constitutional Violation:** Business service performing constitutional evidence work

---

### 9. Commit Service API

**Location:** `runtime/kernel/commit-service/src/api/commit_controller.ts`
**Purpose:** Commit operations via HTTP API
**Authority Owner:** CommitService (HTTP API)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- commitArtifact()
- auditArtifacts()
- auditSystem()

**Constitutional Violation:** HTTP API bypassing execution spine

---

### 10. DistributedExecution

**Location:** `constitutional-compiler/execution/distributed-execution.ts`
**Purpose:** Worker scheduling and distributed compute
**Authority Owner:** DistributedExecution (Compiler)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- scheduleWorker()
- executeTask()
- distributeWorkload()

**Constitutional Violation:** Compiler execution bypassing runtime spine

---

### 11. DistributedGraphScheduler

**Location:** `constitutional-compiler/execution/distributed-graph-scheduler.ts`
**Purpose:** Graph computation scheduling
**Authority Owner:** DistributedGraphScheduler (Compiler)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- scheduleGraphComputation()
- executeGraphTask()

**Constitutional Violation:** Compiler execution bypassing runtime spine

---

### 12. Provider Direct Construction

**Location:** Test files (execution-engine-test.ts, github-spine-test.ts)
**Purpose:** Direct provider instantiation for testing
**Authority Owner:** Test Code
**Disposition:** ⚠ **Preserve** (test-only) - Should use ProviderRegistry in production

**Instances:**
- `new GitHubProvider()` in execution-engine-test.ts line 37
- `new GitHubProvider()` in github-spine-test.ts line 38

**Constitutional Status:** Acceptable in tests, but production code should use ProviderRegistry

---

### 13. Gateway Server

**Location:** `gateway/server.js`
**Purpose:** Express gateway for inference requests
**Authority Owner:** Gateway (Infrastructure)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Operations:**
- Inference request handling
- Event emission
- Repository queries

**Constitutional Violation:** Infrastructure bypassing execution spine

---

### 14. FastAPI Application Services

**Location:** `api/main.py` (application services)
**Purpose:** Application service operations
**Authority Owner:** Application Services (API Layer)
**Disposition:** ❌ **Harvest** - Should route through ExecutionEngine.execute()

**Services:**
- EventApplicationService
- CommandApplicationService
- OracleApplicationService
- BusinessApplicationService
- ProductApplicationService
- HealthApplicationService
- ReplayApplicationService

**Constitutional Violation:** API layer performing constitutional work

---

## Execution Entry Point Summary

**Total Entry Points:** 14
**✅ Canonical:** 1 (ExecutionEngine.execute())
**❌ Alternative:** 13

---

## Entry Point Classification

### Constitutional Execution Authority
- ✅ ExecutionEngine.execute() - Preserve

### Business Services (Harvest Targets)
- ❌ EventService - Harvest
- ❌ ReplayService - Harvest
- ❌ GraphService - Harvest
- ❌ IdentityService - Harvest
- ❌ ArtifactService - Harvest
- ❌ PropertyService - Harvest

### HTTP APIs (Harvest Targets)
- ❌ CommitService - Harvest
- ❌ Gateway Server - Harvest
- ❌ FastAPI Application Services - Harvest

### Compiler Execution (Harvest Targets)
- ❌ DistributedExecution - Harvest
- ❌ DistributedGraphScheduler - Harvest

### Provider Direct Execution (Harvest Targets)
- ❌ GitHubProvider.execute() - Harvest

### Test Code (Preserve with Registry)
- ⚠ Direct provider construction in tests - Preserve (test-only, use ProviderRegistry in production)

---

## Acceptance Criteria Status

- [x] Complete inventory of execution entry points - ✅ 14 entry points identified
- [ ] Execution enters through one path only - ❌ 13 alternative entry points exist

---

## Required Actions

### 1. Harvest Business Services
**Target:** EventService, ReplayService, GraphService, IdentityService, ArtifactService, PropertyService
**Action:** Route all operations through ExecutionEngine.execute()
**Disposition:** Services become authority clients

### 2. Harvest HTTP APIs
**Target:** CommitService, Gateway Server, FastAPI Application Services
**Action:** Route all API calls through ExecutionEngine.execute()
**Disposition:** APIs become projection adapters

### 3. Harvest Compiler Execution
**Target:** DistributedExecution, DistributedGraphScheduler
**Action:** Route all compiler execution through ExecutionEngine.execute()
**Disposition:** Compiler becomes authority client

### 4. Harvest Provider Direct Execution
**Target:** GitHubProvider.execute() and all other providers
**Action:** All provider execution must route through ExecutionEngine.execute()
**Disposition:** Providers become authority clients

### 5. Update Test Code
**Target:** Test files with direct provider construction
**Action:** Use ProviderRegistry for provider access in tests
**Disposition:** Preserve test code but use registry pattern

---

## Disposition

**Finding:** Execution Spine Incompleteness
**Status:** ❌ **Confirmed** - 13 alternative execution entry points exist
**Evidence:** Repository scan and source inspection
**Action:** Harvest all alternative entry points to ExecutionEngine.execute()

**Constitutional Target:**
```
ExecutionEngine.execute() (sole execution ingress)
    ↓
All providers, services, APIs, compilers
    ↓
Constitutional execution spine
```

**Current State:**
```
14 execution entry points
    ↓
Multiple execution authorities
    ↓
Constitutional fragmentation
    ↓
Execution bypass
```
