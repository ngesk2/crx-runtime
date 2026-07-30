# Phase 0 - Task 0.3: Bootstrap Audit

**Objective:** Enumerate every startup path and verify convergence to ExecutionEngine

**Classification:**
- ✅ Verified (directly observed in inspected source)
- 🟡 Inferred (architectural conclusion supported by evidence)
- 🔵 Requires Inspection (insufficient evidence to classify)
- ❓ Unverified Claim (claim made without supporting evidence)
- 💡 Recommendation (architectural convergence advice, not a defect)

**Confidence Scale:**
- High: Verified directly in code
- Medium: Strong architectural inference
- Low: Pattern match only
- Unknown: Repository not inspected

**Severity Scale:**
- Critical: Startup failure, canonical hash divergence, constitutional authority bypass
- High: Authority duplication, configuration drift, infrastructure fragmentation
- Medium: Architectural cleanup, façade delegation, helper duplication
- Low: Test construction, dev tools, CLI utilities

**Expected Output:**
```
Bootstrap
    ↓
ExecutionEngine
```

Everything else becomes either: projection, adapter, authority client

**Criterion:** Independent production runtime initialization (not test/CLI/dev tools)

---

## Bootstrap Path Inventory

### 1. FastAPI Main Application

**Location:** `api/main.py`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High (production runtime initialization)
**Type:** Production Runtime Initialization
**Entry Point:** `create_app(settings: Settings) -> FastAPI`
**Dependencies:**
- RuntimeContainer (DI container)
- Modular API routers (events, commands, oracle, business, product, health, replay)
- Application services (EventApplicationService, CommandApplicationService, etc.)
- Observability
- Settings

**Bootstrap Flow:**
```
create_app()
    ↓
RuntimeContainer.create()
    ↓
Application services initialization
    ↓
API router registration
    ↓
FastAPI startup
```

**Constitutional Violation:** Independent production runtime initialization not through ExecutionEngine

---

### 2. PING Mission Control

**Location:** `app_container.py`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High (production runtime initialization)
**Type:** Production Runtime Initialization
**Entry Point:** `app = FastAPI(title="PING Mission Control")`
**Dependencies:**
- FastAPI
- SecretAdapter (conditional)
- PostgreSQL
- QdrantClient
- Various external services

**Bootstrap Flow:**
```
FastAPI app creation
    ↓
CORS middleware
    ↓
SecretAdapter initialization
    ↓
PostgreSQL configuration
    ↓
QdrantClient initialization
    ↓
Route registration
```

**Constitutional Violation:** Independent production runtime initialization not through ExecutionEngine

---

### 3. Runtime Bootstrap

**Location:** `runtime/bootstrap.py`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Low (correct constitutional bootstrap)
**Type:** Production Runtime Initialization
**Entry Point:** `RuntimeBootstrap` class
**Dependencies:**
- ConstitutionAuthority
- CapabilityRegistry
- EventStore
- ReplayEngine
- ProjectionWorker
- KnowledgeGraph
- EvidenceCompiler
- ExecutionPipeline
- WorkflowEngine
- MissionEngine
- EmbeddingAuthority
- InferenceAuthority
- Qdrant
- PostgreSQL
- WebRetrieval
- ConfigurationAuthority

**Bootstrap Flow:**
```
RuntimeBootstrap (composition root)
    ↓
wires all dependencies
    ↓
ConstitutionAuthority
    ↓
EventStore
    ↓
ReplayEngine
    ↓
CapabilityRegistry
    ↓
ProjectionWorker
    ↓
KnowledgeGraph
    ↓
EvidenceCompiler
    ↓
ExecutionPipeline
    ↓
WorkflowEngine
    ↓
MissionEngine
    ↓
EmbeddingAuthority
    ↓
InferenceAuthority
    ↓
Infrastructure (Qdrant, PostgreSQL, WebRetrieval)
    ↓
ConfigurationAuthority
```

**Constitutional Status:** ✅ This is the intended constitutional bootstrap path

---

### 4. Bootstrap Loader (Hermes)

**Location:** `hermes/runtime/bootstrap_loader.py`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High (alternative production bootstrap)
**Type:** Production Runtime Initialization
**Entry Point:** `BootstrapLoader` class
**Dependencies:**
- YAML manifest
- importlib for dynamic loading
- Path operations

**Bootstrap Flow:**
```
BootstrapLoader.load_manifest()
    ↓
YAML manifest loading
    ↓
Dynamic import of capabilities
    ↓
Dynamic import of authorities
    ↓
Dynamic import of connectors
    ↓
Registry population
```

**Constitutional Violation:** Alternative production bootstrap mechanism using YAML manifests instead of RuntimeBootstrap

---

### 5. Gateway Server

**Location:** `gateway/server.js`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High (production runtime initialization)
**Type:** Production Runtime Initialization
**Entry Point:** Express server
**Dependencies:**
- Express
- PostgreSQL pool
- RepositoryStore
- InferenceAdapter
- EventEmitter

**Bootstrap Flow:**
```
Express app creation
    ↓
PostgreSQL pool initialization
    ↓
RepositoryStore initialization
    ↓
InferenceAdapter configuration
    ↓
CORS middleware
    ↓
Route registration
    ↓
Server startup
```

**Constitutional Violation:** Independent production runtime initialization not through ExecutionEngine

---

### 6. Commit Service Server

**Location:** `runtime/kernel/commit-service/src/server.ts`
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High (production runtime initialization)
**Type:** Production Runtime Initialization
**Entry Point:** Express server on port 8080
**Dependencies:**
- Express
- commitArtifact controller
- auditArtifacts controller

**Bootstrap Flow:**
```
Express app creation
    ↓
JSON middleware
    ↓
Route registration (/kernel/commit, /kernel/audit)
    ↓
Server startup (port 8080)
```

**Constitutional Violation:** Independent production runtime initialization not through ExecutionEngine

---

## Bootstrap Path Summary

**Total Bootstrap Paths:** 6
**Production Runtime Initialization:** 5
**Constitutional Bootstrap:** 1
**Test/CLI/Dev Tools:** 0

**By Classification:**
- ✅ Verified: 6
- 🟡 Inferred: 0
- 🔵 Requires Inspection: 0
- ❓ Unverified Claim: 0
- 💡 Recommendation: 0

**By Severity:**
- Critical: 0
- High: 5 (independent production bootstraps)
- Medium: 0
- Low: 1 (correct constitutional bootstrap)

**By Confidence:**
- High: 6
- Medium: 0
- Low: 0
- Unknown: 0

---

## Bootstrap Path Classification

### Constitutional Bootstrap
- ✅ `runtime/bootstrap.py` - RuntimeBootstrap composition root (Low severity - correct)

### Independent Production Bootstraps (Harvest Targets)
- ❌ `api/main.py` - FastAPI main application (High severity)
- ❌ `app_container.py` - PING Mission Control (High severity)
- ❌ `hermes/runtime/bootstrap_loader.py` - YAML manifest loader (High severity)
- ❌ `gateway/server.js` - Express gateway (High severity)
- ❌ `runtime/kernel/commit-service/src/server.ts` - Commit service (High severity)

### Test/CLI/Dev Tools
- None identified

---

## Acceptance Criteria Status

- [x] Enumerate every production runtime startup path - ✅ 5 production paths identified
- [x] Distinguish production from test/CLI/dev tools - ✅ 0 test/CLI/dev tools
- [ ] Bootstrap → ExecutionEngine - ❌ Only 1/5 production paths use constitutional bootstrap
- [ ] Everything else becomes projection/adapter/authority client - ❌ 4 independent production bootstraps

---

## Required Actions

### 1. Converge FastAPI Main Application (High)
**Target:** `api/main.py`
**Action:** Route through ExecutionEngine
**Disposition:** Harvest into RuntimeBootstrap or become authority client

### 2. Converge PING Mission Control (High)
**Target:** `app_container.py`
**Action:** Route through ExecutionEngine
**Disposition:** Harvest into RuntimeBootstrap or become projection

### 3. Converge Bootstrap Loader (High)
**Target:** `hermes/runtime/bootstrap_loader.py`
**Action:** Eliminate YAML manifest bootstrap
**Disposition:** Harvest into RuntimeBootstrap

### 4. Converge Gateway Server (High)
**Target:** `gateway/server.js`
**Action:** Route through ExecutionEngine
**Disposition:** Become projection adapter

### 5. Converge Commit Service (High)
**Target:** `runtime/kernel/commit-service/src/server.ts`
**Action:** Route through ExecutionEngine
**Disposition:** Become authority client

---

## Disposition

**Finding:** Bootstrap Fragmentation
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** High
**Evidence:** Source inspection of all startup files
**Action:** Converge all production bootstraps to RuntimeBootstrap → ExecutionEngine

**Constitutional Target:**
```
RuntimeBootstrap (single composition root)
    ↓
ExecutionEngine
    ↓
All other components (as projections, adapters, authority clients)
```

**Current State:**
```
5 independent production bootstrap paths
    ↓
Multiple initialization strategies
    ↓
Configuration drift
    ↓
Constitutional fragmentation
```
