# PHASE5_ACTIVE_RUNTIME_MAP.md

**Audit Type:** ACTIVE FLOW AUDIT  
**Audit Date:** 2025-01-18  
**Repository Root:** C:\Users\nolan\PING  
**Status:** PHASE 5 COMPLETE  

---

## EXECUTIVE SUMMARY

**Critical Finding:** PING has minimal active runtime flows. PING is primarily a constitutional runtime, not an application runtime. Active flows are limited to:

1. **Gateway Flow:** External applications → PING Gateway → Ollama → PostgreSQL events
2. **Commit Service Flow:** External applications → PING Kernel/Commit-Service → PostgreSQL artifacts/lineage/events
3. **Replay Flow:** (Not actively running - pure library, not a service)

**Application Flows (NOT in PING):**
- Newsletter Flow: External (crx-newsletter-brain)
- Article Flow: External (crx-newsletter-brain)
- Digest Flow: External (crx-digestion-worker)
- Topic Flow: External (crx-newsletter-brain)
- Research Flow: External (not found in PING)
- Dashboard Flow: External (not found in PING)
- Archive Flow: External (crx-newsletter-brain, crx-digestion-worker)

**Conclusion:** PING is a constitutional infrastructure layer. Application flows are external and depend on PING for constitutional primitives (events, identity, lineage).

---

## ACTIVE RUNTIME FLOWS

### Gateway Flow

**Purpose:** Inference routing and event recording  
**Entry Point:** `gateway/server.js`  
**Status:** ACTIVE (based on code evidence)

**Flow:**
```
External Applications (crx-newsletter-brain, etc.)
  ↓ HTTP POST
PING Gateway (gateway/server.js)
  ↓ Ollama routing
Ollama (external service)
  ↓ Response
PING Gateway (gateway/event_emitter.js)
  ↓ PostgreSQL insert
PostgreSQL (events table)
```

**Input:**
- HTTP POST requests to gateway endpoints
- Inference requests (prompt, model, etc.)

**Processing:**
- Ollama model routing (7B vs 14B based on complexity)
- Inference execution via Ollama
- Event emission to PostgreSQL

**Storage:**
- PostgreSQL events table (append-only)
- Event types: INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED

**Retrieval:**
- Not applicable (gateway is write-only for events)

**Evidence:**
- `gateway/server.js` line 1-50: Express server with Ollama routing
- `gateway/server.js` line 3: imports from `event_emitter.js`
- `gateway/server.js` line 39-43: Ollama URL and model configuration
- `gateway/event_emitter.js` line 1-50: PostgreSQL event emitter
- `database/events.sql` line 6-12: Events table schema

### Commit Service Flow

**Purpose:** Artifact commit and lineage validation  
**Entry Point:** `runtime/kernel/commit-service/src/server.ts`  
**Status:** ACTIVE (based on code evidence)

**Flow:**
```
External Applications
  ↓ HTTP POST /kernel/commit
PING Kernel/Commit-Service (runtime/kernel/commit-service/src/server.ts)
  ↓ Commit controller
Identity Engine (computeCanonicalHash)
  ↓ SHA256 hash
DAG Validator (validateLineage)
  ↓ Cycle detection
Artifact Store (storeArtifact)
  ↓ PostgreSQL insert
Lineage Store (storeLineage)
  ↓ PostgreSQL insert
Event Log (logEvent)
  ↓ PostgreSQL insert
PostgreSQL (artifacts, lineage_edges, execution_events tables)
```

**Input:**
- HTTP POST requests to `/kernel/commit`
- Artifact data and lineage information

**Processing:**
- Identity computation (SHA256 hash)
- Lineage validation (DAG cycle detection)
- Artifact storage
- Lineage edge storage
- Event logging

**Storage:**
- PostgreSQL artifacts table
- PostgreSQL lineage_edges table
- PostgreSQL execution_events table

**Retrieval:**
- Not applicable (commit service is write-only)

**Evidence:**
- `runtime/kernel/commit-service/src/server.ts` line 9-10: POST /kernel/commit endpoint
- `runtime/kernel/commit-service/src/api/commit_controller.ts` line 9-35: Commit logic
- `runtime/kernel/commit-service/src/engines/identity_engine.ts`: Identity computation
- `runtime/kernel/commit-service/src/validation/dag_validator.ts`: DAG validation
- `runtime/kernel/commit-service/src/persistence/ledger_schema.sql`: Schema

### Replay Flow

**Purpose:** Deterministic replay (library, not service)  
**Entry Point:** N/A (pure library)  
**Status:** NOT ACTIVELY RUNNING (library only)

**Flow:**
```
N/A (replay is a library, not a service)
```

**Input:**
- N/A (library is imported by other services)

**Processing:**
- N/A (library provides functions)

**Storage:**
- N/A (library does not store data directly)

**Retrieval:**
- N/A (library does not retrieve data directly)

**Evidence:**
- `runtime/replay/index.ts` line 1-42: Pure TypeScript exports
- `runtime/replay/index.ts` comment: "Pure TypeScript replay kernel exports. No infrastructure dependencies."
- No server.ts or main.ts in runtime/replay/
- No Dockerfile in runtime/replay/

---

## APPLICATION FLOWS (NOT IN PING)

### Newsletter Flow

**Status:** NOT IN PING  
**Location:** External (crx-newsletter-brain)  
**Evidence:** Phase 1 Audit (crx-newsletter-brain) showed newsletter processing in external application

**Flow (External):**
```
Yahoo Finance API
  ↓
crx-newsletter-brain (worker.py)
  ↓
Ollama (direct coupling - should use PING Gateway)
  ↓
SQLite (newsletters.db)
  ↓
Markdown archives (knowledge/)
```

**PING Dependency:**
- Currently: NONE (uses direct Ollama coupling)
- Should use: PING Gateway for inference
- Should use: PING event_emitter.js for events

### Article Flow

**Status:** NOT IN PING  
**Location:** External (crx-newsletter-brain)  
**Evidence:** Phase 1 Audit (crx-newsletter-brain) showed article processing in external application

**Flow (External):**
```
RSS feeds
  ↓
crx-newsletter-brain (worker.py)
  ↓
Ollama (direct coupling - should use PING Gateway)
  ↓
SQLite (newsletters.db)
  ↓
Markdown archives (knowledge/)
```

**PING Dependency:**
- Currently: NONE (uses direct Ollama coupling)
- Should use: PING Gateway for inference
- Should use: PING event_emitter.js for events

### Digest Flow

**Status:** NOT IN PING  
**Location:** External (crx-digestion-worker)  
**Evidence:** Phase 1 Audit (crx-digestion-worker) showed digest generation in external application

**Flow (External):**
```
SQLite (newsletters.db)
  ↓
crx-digestion-worker (daily_digest.py)
  ↓
Markdown digests
```

**PING Dependency:**
- Currently: NONE
- Should use: PING event_emitter.js for events

### Topic Flow

**Status:** NOT IN PING  
**Location:** External (crx-newsletter-brain)  
**Evidence:** Phase 1 Audit (crx-newsletter-brain) showed topic extraction in external application

**Flow (External):**
```
Ollama (direct coupling)
  ↓
Topic extraction
  ↓
SQLite (newsletter_topics table)
```

**PING Dependency:**
- Currently: NONE (uses direct Ollama coupling)
- Should use: PING Gateway for inference

### Research Flow

**Status:** NOT FOUND  
**Location:** N/A  
**Evidence:** No research flow found in PING repository

**PING Dependency:**
- N/A

### Dashboard Flow

**Status:** NOT FOUND  
**Location:** N/A  
**Evidence:** No dashboard found in PING repository

**PING Dependency:**
- N/A

### Archive Flow

**Status:** NOT IN PING  
**Location:** External (crx-newsletter-brain, crx-digestion-worker)  
**Evidence:** Phase 1 Audit showed markdown archiving in external applications

**Flow (External):**
```
Processed content
  ↓
Markdown files (knowledge/)
```

**PING Dependency:**
- Currently: NONE
- Should use: PING event_emitter.js for events

---

## SUMMARY

### Active PING Flows

| Flow | Entry Point | Processing | Storage | Retrieval | Status |
|------|-------------|------------|---------|-----------|--------|
| Gateway Flow | gateway/server.js | Ollama routing, event emission | PostgreSQL events | None | ACTIVE |
| Commit Service Flow | runtime/kernel/commit-service/src/server.ts | Identity, lineage validation, commit | PostgreSQL artifacts/lineage/events | None | ACTIVE |
| Replay Flow | N/A | N/A | N/A | N/A | LIBRARY ONLY |

### External Application Flows (NOT in PING)

| Flow | Location | PING Dependency | Current Status |
|------|----------|-----------------|----------------|
| Newsletter Flow | crx-newsletter-brain | Should use PING Gateway, event_emitter.js | External |
| Article Flow | crx-newsletter-brain | Should use PING Gateway, event_emitter.js | External |
| Digest Flow | crx-digestion-worker | Should use PING event_emitter.js | External |
| Topic Flow | crx-newsletter-brain | Should use PING Gateway | External |
| Research Flow | N/A | N/A | NOT FOUND |
| Dashboard Flow | N/A | N/A | NOT FOUND |
| Archive Flow | crx-newsletter-brain, crx-digestion-worker | Should use PING event_emitter.js | External |

### Critical Findings

1. **PING is a constitutional infrastructure layer**, not an application runtime
2. **Active flows are minimal** - only Gateway and Commit Service
3. **Replay is a library**, not a service
4. **Application flows are external** - crx-newsletter-brain, crx-digestion-worker
5. **Applications do NOT use PING** - they use direct Ollama coupling and Brain's duplicate event_emitter.py
6. **Migration needed** - Applications should use PING Gateway and PING event_emitter.js

### Evidence Sources

**Code Files Read:**
- `gateway/server.js` - Express server with Ollama routing
- `gateway/event_emitter.js` - PostgreSQL event emitter
- `runtime/kernel/commit-service/src/server.ts` - Commit service server
- `runtime/kernel/commit-service/src/api/commit_controller.ts` - Commit controller
- `runtime/replay/index.ts` - Pure TypeScript library exports

**Database Schemas:**
- `database/events.sql` - Events table schema
- `runtime/kernel/commit-service/src/persistence/ledger_schema.sql` - Ledger schema

**Phase 1 Audit Evidence:**
- crx-newsletter-brain uses direct Ollama coupling
- crx-digestion-worker uses Brain's duplicate event_emitter.py
- Applications have SQLite databases and markdown archives
