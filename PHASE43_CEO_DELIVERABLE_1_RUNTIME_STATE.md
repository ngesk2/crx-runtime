# CEO Deliverable 1: Runtime State Inventory

## Classification
Every runtime component classified by lifecycle state:

| Component | Implemented | Wired | Production | Status |
|-----------|-------------|-------|------------|--------|
| Gateway (server.js) | ✅ | ✅ | ✅ | **PRODUCTION** |
| Postgres (events table) | ✅ | ✅ | ✅ | **BROKEN** (3 blockers) |
| Postgres (repository_events) | ✅ | ✅ | ✅ | **PRODUCTION** |
| Qdrant (constitutional_documents) | ✅ | ✅ | ✅ | **PRODUCTION** (768d, 5 pts) |
| Qdrant (constitutional_memory) | ✅ | ✅ | ✅ | **PRODUCTION** (768d, 0 pts) |
| Ollama | ✅ | ✅ | ❌ | **NOT PRODUCTION** (network isolated) |
| Worker Runtime | ✅ | ❌ | ❌ | **NOT WIRED** (no Dockerfile existed pre-Phase 43) |
| Pipeline Orchestrator | ✅ | ✅ | ✅ | **PRODUCTION** (15s setInterval) |
| Kernel Dispatcher | ✅ | ❌ | ❌ | **DORMANT** (no driver) |
| ReducerRegistry | ✅ | ❌ | ❌ | **DORMANT** (0 handlers) |
| ConstitutionalDispatcher | ✅ | ❌ | ❌ | **DORMANT** (7 handlers, unwired) |
| 6 Compilers | ✅ | ❌ | ❌ | **DORMANT** (~6,500 lines) |
| Neo4j | ❌ | ❌ | ❌ | **ORPHAN INFRASTRUCTURE** (zero code connects) |
| LiteLLM | ❌ | ❌ | ❌ | **MISSING** (only in design docs) |

## Critical Focus

1 event type hits Postgres: `DOCUMENT_IMPORTED` (16 rows).  
0 event types from the worker pipeline (`OBSERVATION_CREATED`, `CLAIM_GENERATED`, etc.) have ever been persisted — the CHECK constraint blocks them all.

**The pipeline has never been fully operational.** Phase 43 is the first attempt to make it so.
