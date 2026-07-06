# PHASE 45C — Runtime Service Matrix

**Audit Date:** 2026-07-04  
**Scope:** Service requirement determination for each operation  
**Mode:** READ-ONLY

---

## Executive Summary

Total Services Analyzed: 16  
Operations Analyzed: 6 (Startup, Ingestion, Replay, Retrieval, Projection, UI)  
Critical Services: 4 (PostgreSQL, Qdrant, Gateway, Worker Runtime)  
Missing Services: 2 (Gateway, Worker Runtime not in compose)  

---

## Service Matrix

| Service | Startup | Ingestion | Replay | Retrieval | Projection | UI | Status |
|---------|---------|----------|--------|-----------|-----------|-----|--------|
| PostgreSQL | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED | OPTIONAL | CONFIGURED |
| Qdrant | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED | OPTIONAL | CONFIGURED |
| Gateway | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED | REQUIRED | BROKEN |
| Worker Runtime | REQUIRED | REQUIRED | REQUIRED | OPTIONAL | OPTIONAL | OPTIONAL | BROKEN |
| Mission Control | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | REQUIRED | CONFIGURED |
| Ollama | OPTIONAL | OPTIONAL | OPTIONAL | REQUIRED | OPTIONAL | REQUIRED | CONFIGURED |
| OpenWebUI | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | REQUIRED | CONFIGURED |
| Temporal | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Kafka | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Zookeeper | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Neo4j | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| DuckDB | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| OpenSearch | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Tika | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Vault | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | CONFIGURED |
| Repository Runtime | OPTIONAL | REQUIRED | OPTIONAL | REQUIRED | OPTIONAL | OPTIONAL | CONFIGURED |
| Redis | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | BROKEN |
| LiteLLM | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | OPTIONAL | MISSING |

---

## Operation Analysis

### 1. Startup

**Required Services:**
- PostgreSQL: REQUIRED (canonical state initialization)
- Qdrant: REQUIRED (vector projection initialization)
- Gateway: REQUIRED (HTTP API entry point)
- Worker Runtime: REQUIRED (event processing)

**Optional Services:**
- All other services

**Evidence:**
- PostgreSQL schema mounted as init script
- Qdrant health check required for projections
- Gateway is the HTTP entry point for all clients
- Worker Runtime polls gateway for events

**Status:** BROKEN (Gateway and Worker Runtime not in compose)

---

### 2. Ingestion

**Required Services:**
- PostgreSQL: REQUIRED (object storage, event log)
- Qdrant: REQUIRED (vector embeddings)
- Gateway: REQUIRED (ingestion API endpoints)
- Worker Runtime: REQUIRED (ingestion event processing)
- Repository Runtime: REQUIRED (repository cognition)

**Optional Services:**
- Tika: OPTIONAL (document parsing)
- Ollama: OPTIONAL (embedding generation)
- Mission Control: OPTIONAL (ingestion orchestration)

**Evidence:**
- Gateway has ingestion endpoints: document_ingestion.js, github_ingestion.js
- Worker Runtime processes ingestion events via dispatcher
- Repository Runtime provides read-only repository access
- PostgreSQL stores objects and events
- Qdrant stores vector embeddings

**Status:** BROKEN (Gateway and Worker Runtime not in compose)

---

### 3. Replay

**Required Services:**
- PostgreSQL: REQUIRED (event replay source)
- Qdrant: REQUIRED (vector replay source)
- Gateway: REQUIRED (replay API endpoints)
- Worker Runtime: REQUIRED (replay event processing)

**Optional Services:**
- Temporal: OPTIONAL (workflow replay)
- Ollama: OPTIONAL (replay inference)

**Evidence:**
- Gateway has replay authorities: replay_authority.js, replay_verifier.js
- Worker Runtime processes replay events via dispatcher
- PostgreSQL events table has replay indexes
- Qdrant projections support replay

**Status:** BROKEN (Gateway and Worker Runtime not in compose)

---

### 4. Retrieval

**Required Services:**
- PostgreSQL: REQUIRED (metadata retrieval)
- Qdrant: REQUIRED (vector retrieval)
- Gateway: REQUIRED (retrieval API endpoints)
- Ollama: REQUIRED (inference)
- Repository Runtime: REQUIRED (repository retrieval)

**Optional Services:**
- OpenSearch: OPTIONAL (full-text search)
- Neo4j: OPTIONAL (graph retrieval)

**Evidence:**
- Gateway has retrieval authorities: knowledge_retrieval.js, context_retrieval_authority.js
- Gateway has Qdrant integration: qdrant_client.js, qdrant_integration.js
- Gateway has Ollama integration: ollama_adapter.js, ollama_provider.js
- Repository Runtime provides repository access
- PostgreSQL provides metadata
- Qdrant provides vector search

**Status:** BROKEN (Gateway not in compose)

---

### 5. Projection

**Required Services:**
- PostgreSQL: REQUIRED (projection source)
- Qdrant: REQUIRED (projection target)
- Gateway: REQUIRED (projection orchestration)
- Worker Runtime: REQUIRED (projection event processing)

**Optional Services:**
- Neo4j: OPTIONAL (graph projection)
- DuckDB: OPTIONAL (analytics projection)
- OpenSearch: OPTIONAL (search projection)

**Evidence:**
- Gateway has projection executor: projection_executor.js
- PostgreSQL projections table defined in schema
- Qdrant used as vector projection target
- Worker Runtime processes projection events via dispatcher

**Status:** BROKEN (Gateway and Worker Runtime not in compose)

---

### 6. UI

**Required Services:**
- Gateway: REQUIRED (UI backend)
- Ollama: REQUIRED (AI inference)
- OpenWebUI: REQUIRED (UI frontend)
- Mission Control: REQUIRED (mission orchestration)

**Optional Services:**
- PostgreSQL: OPTIONAL (UI data)
- Qdrant: OPTIONAL (UI search)

**Evidence:**
- OpenWebUI depends on Ollama
- OpenWebUI depends on Mission Control (in mission-control compose)
- Mission Control depends on PostgreSQL and Qdrant
- Gateway provides HTTP API for UI

**Status:** BROKEN (Gateway not in compose)

---

## Service Criticality Analysis

### Critical Services (Required for Core Operations)
1. **PostgreSQL**
   - Critical for: Startup, Ingestion, Replay, Retrieval, Projection
   - Status: CONFIGURED
   - Risk: LOW

2. **Qdrant**
   - Critical for: Startup, Ingestion, Replay, Retrieval, Projection
   - Status: CONFIGURED
   - Risk: LOW

3. **Gateway**
   - Critical for: Startup, Ingestion, Replay, Retrieval, Projection, UI
   - Status: BROKEN (not in compose)
   - Risk: CRITICAL

4. **Worker Runtime**
   - Critical for: Startup, Ingestion, Replay, Projection
   - Status: BROKEN (not in compose)
   - Risk: CRITICAL

### High-Priority Services
1. **Repository Runtime**
   - Critical for: Ingestion, Retrieval
   - Status: CONFIGURED
   - Risk: MEDIUM

2. **Ollama**
   - Critical for: Retrieval, UI
   - Status: CONFIGURED
   - Risk: MEDIUM

3. **Mission Control**
   - Critical for: UI
   - Status: CONFIGURED
   - Risk: MEDIUM

4. **OpenWebUI**
   - Critical for: UI
   - Status: CONFIGURED
   - Risk: MEDIUM

### Optional Services
1. **Temporal** - Workflow orchestration
2. **Kafka** - Event streaming
3. **Zookeeper** - Kafka dependency
4. **Neo4j** - Knowledge graph
5. **DuckDB** - Analytics
6. **OpenSearch** - Search
7. **Tika** - Document parsing
8. **Vault** - Secret management

### Missing/Broken Services
1. **Gateway** - BROKEN (not in compose)
2. **Worker Runtime** - BROKEN (not in compose)
3. **Redis** - BROKEN (adapter exists, no infrastructure)
4. **LiteLLM** - MISSING (no infrastructure)

---

## Operation Readiness Status

### Startup
**Status:** BROKEN  
**Blockers:** Gateway, Worker Runtime not in compose  
**Required Services:** PostgreSQL, Qdrant, Gateway, Worker Runtime  
**Configured:** 2/4 (50%)  

### Ingestion
**Status:** BROKEN  
**Blockers:** Gateway, Worker Runtime not in compose  
**Required Services:** PostgreSQL, Qdrant, Gateway, Worker Runtime, Repository Runtime  
**Configured:** 3/5 (60%)  

### Replay
**Status:** BROKEN  
**Blockers:** Gateway, Worker Runtime not in compose  
**Required Services:** PostgreSQL, Qdrant, Gateway, Worker Runtime  
**Configured:** 2/4 (50%)  

### Retrieval
**Status:** BROKEN  
**Blockers:** Gateway not in compose  
**Required Services:** PostgreSQL, Qdrant, Gateway, Ollama, Repository Runtime  
**Configured:** 4/5 (80%)  

### Projection
**Status:** BROKEN  
**Blockers:** Gateway, Worker Runtime not in compose  
**Required Services:** PostgreSQL, Qdrant, Gateway, Worker Runtime  
**Configured:** 2/4 (50%)  

### UI
**Status:** BROKEN  
**Blockers:** Gateway not in compose  
**Required Services:** Gateway, Ollama, OpenWebUI, Mission Control  
**Configured:** 3/4 (75%)  

---

## Service Dependency Summary

### PostgreSQL Dependencies
- Required by: Startup, Ingestion, Replay, Retrieval, Projection
- Used by: Temporal, Mission Control
- Status: CONFIGURED

### Qdrant Dependencies
- Required by: Startup, Ingestion, Replay, Retrieval, Projection
- Used by: Mission Control
- Status: CONFIGURED

### Gateway Dependencies
- Required by: Startup, Ingestion, Replay, Retrieval, Projection, UI
- Depends on: PostgreSQL, Qdrant, Ollama
- Status: BROKEN (not in compose)

### Worker Runtime Dependencies
- Required by: Startup, Ingestion, Replay, Projection
- Depends on: Gateway (HTTP)
- Status: BROKEN (not in compose)

### Repository Runtime Dependencies
- Required by: Ingestion, Retrieval
- Depends on: None (read-only volumes)
- Status: CONFIGURED

### Ollama Dependencies
- Required by: Retrieval, UI
- Used by: OpenWebUI, Mission Control
- Status: CONFIGURED

### Mission Control Dependencies
- Required by: UI
- Depends on: PostgreSQL, Qdrant, Ollama
- Status: CONFIGURED

### OpenWebUI Dependencies
- Required by: UI
- Depends on: Ollama, Mission Control
- Status: CONFIGURED

---

## Critical Findings

### 1. Gateway Missing from Compose
**Severity:** CRITICAL  
**Impact:** Blocks ALL operations (Startup, Ingestion, Replay, Retrieval, Projection, UI)  
**Evidence:** Gateway Dockerfile exists but no service in compose files  
**Status:** BROKEN  

### 2. Worker Runtime Missing from Compose
**Severity:** CRITICAL  
**Impact:** Blocks Startup, Ingestion, Replay, Projection  
**Evidence:** Worker Runtime Dockerfile exists but no service in compose files  
**Status:** BROKEN  

### 3. Gateway Service Resolution
**Severity:** CRITICAL  
**Impact:** Worker Runtime references gateway:8080 but Gateway not in compose  
**Evidence:** GATEWAY_URL=http://gateway:8080 in worker runtime  
**Status:** BROKEN  

### 4. Redis Infrastructure Missing
**Severity:** HIGH  
**Impact:** Gateway has Redis adapter but no Redis service  
**Evidence:** adapters/redis_adapter.js exists, no Redis service in compose  
**Status:** BROKEN  

### 5. LiteLLM Infrastructure Missing
**Severity:** MEDIUM  
**Impact:** No LiteLLM gateway infrastructure  
**Evidence:** No LiteLLM service in compose files  
**Status:** MISSING  

---

## Evidence Sources

1. **Docker Compose Files:** Service definitions analyzed
2. **Dockerfiles:** Gateway and Worker Runtime analyzed
3. **Source Code:** Gateway authorities and adapters analyzed
4. **Worker Runtime:** HTTP polling mechanism analyzed
5. **Schema Files:** PostgreSQL schema analyzed
6. **Adapter Files:** Redis adapter found

---

## Next Steps

Proceed to Phase 45D: Pipeline Integration Audit
