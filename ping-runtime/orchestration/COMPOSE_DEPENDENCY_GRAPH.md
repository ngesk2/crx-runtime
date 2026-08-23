# PHASE 45B — Compose Dependency Graph

**Audit Date:** 2026-07-04  
**Scope:** Runtime dependency graph construction  
**Mode:** READ-ONLY

---

## Executive Summary

Total Dependencies Analyzed: 16 services  
Required Dependencies: 8  
Optional Dependencies: 5  
Broken Dependencies: 2  
Unknown Dependencies: 1  

---

## Dependency Graph

### Main Infrastructure Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Gateway    │    │ Worker Runtime│    │ Mission Ctrl │    │
│  │  (EXTERNAL)  │    │  (EXTERNAL)   │    │   (COMPOSE)  │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │              │
│         │ HTTP              │ HTTP              │ HTTP         │
│         ▼                   ▼                   ▼              │
└─────────┼───────────────────┼───────────────────┼──────────────┘
          │                   │                   │
          │                   │                   │
┌─────────┼───────────────────┼───────────────────┼──────────────┐
│         │                   │                   │              │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    │
│  │  PostgreSQL  │    │    Qdrant    │    │    Ollama    │    │
│  │  (COMPOSE)   │    │  (COMPOSE)   │    │  (COMPOSE)   │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │              │
│         │                   │                   │              │
│         ▼                   ▼                   │              │
│  ┌──────────────┐    ┌──────────────┐         │              │
│  │   Temporal   │    │   OpenWebUI  │         │              │
│  │  (COMPOSE)   │    │  (COMPOSE)   │         │              │
│  └──────┬───────┘    └──────┬───────┘         │              │
│         │                   │                   │              │
└─────────┼───────────────────┼───────────────────┼──────────────┘
          │                   │                   │
          │                   │                   │
┌─────────┼───────────────────┼───────────────────┼──────────────┐
│         │                   │                   │              │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    │
│  │  Zookeeper  │    │   Neo4j     │    │   Vault     │    │
│  │  (COMPOSE)   │    │  (COMPOSE)   │    │  (COMPOSE)   │    │
│  └──────┬───────┘    └─────────────┘    └─────────────┘    │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │    Kafka     │                                          │
│  │  (COMPOSE)   │                                          │
│  └─────────────┘                                          │
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │   DuckDB     │    │  OpenSearch  │    │     Tika     ││
│  │  (COMPOSE)   │    │  (COMPOSE)   │    │  (COMPOSE)   ││
│  └─────────────┘    └─────────────┘    └─────────────┘│
│                                                           │
│  ┌──────────────┐                                         │
│  │Repo Runtime  │                                         │
│  │  (COMPOSE)   │                                         │
│  └─────────────┘                                         │
└───────────────────────────────────────────────────────────┘
```

---

## Service Dependency Details

### Gateway
**Status:** BROKEN (not in compose)  
**Dependencies:**
- PostgreSQL: REQUIRED (for canonical state)
- Qdrant: REQUIRED (for vector projections)
- Ollama: OPTIONAL (for inference)
- Redis: BROKEN (adapter exists, no infrastructure)
- LiteLLM: MISSING (no infrastructure)

**Evidence:**
- Gateway Dockerfile exists: `c:\Users\nolan\PING\gateway\Dockerfile`
- Gateway code references PostgreSQL: `npm install pg`
- Gateway code references Qdrant: `qdrant_client.js`, `qdrant_integration.js`
- Gateway code references Ollama: `ollama_adapter.js`, `ollama_provider.js`
- Gateway code references Redis: `adapters/redis_adapter.js`
- No gateway service in any compose file

### Worker Runtime
**Status:** BROKEN (not in compose)  
**Dependencies:**
- Gateway: REQUIRED (HTTP polling)
- PostgreSQL: OPTIONAL (via gateway)
- Qdrant: OPTIONAL (via gateway)

**Evidence:**
- Worker Runtime Dockerfile exists: `c:\Users\nolan\PING\Dockerfile.worker-runtime`
- Worker Runtime code: `c:\Users\nolan\PING\workers\worker_runtime.py`
- Polls gateway via HTTP: `GATEWAY_URL=http://gateway:8080`
- No worker runtime service in any compose file

### Mission Control
**Status:** CONFIGURED  
**Dependencies:**
- PostgreSQL: REQUIRED (health check dependency)
- Qdrant: REQUIRED (dependency)
- Ollama: REQUIRED (dependency)
- Vault: OPTIONAL (volume mount)

**Evidence:**
- Service in docker-compose-mission-control.yml
- Explicit depends_on: postgres, qdrant, ollama
- Environment variables: POSTGRES_*, QDRANT_*, OLLAMA_*

### PostgreSQL
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in both compose files
- Schema mount: canonical_state/schema.sql
- Health check: pg_isready

### Qdrant
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in both compose files
- Health check: curl /health
- API key environment variable

### Ollama
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in both compose files
- Health check: ollama list
- Used by OpenWebUI and Mission Control

### OpenWebUI
**Status:** CONFIGURED  
**Dependencies:**
- Ollama: REQUIRED (dependency)
- Mission Control: OPTIONAL (dependency in mission-control compose)

**Evidence:**
- Service in both compose files
- Environment: OLLAMA_BASE_URL
- Depends on ollama

### Temporal
**Status:** CONFIGURED  
**Dependencies:**
- PostgreSQL: REQUIRED (health check dependency)

**Evidence:**
- Service in docker-compose.yml
- Depends on postgres with health check
- Environment: DB configuration

### Kafka
**Status:** CONFIGURED  
**Dependencies:**
- Zookeeper: REQUIRED (dependency)

**Evidence:**
- Service in docker-compose.yml
- Depends on zookeeper
- Environment: ZOOKEEPER_CONNECT

### Zookeeper
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- Required by Kafka

### Neo4j
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- No explicit dependencies
- Used for knowledge graph projection

### Vault
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- Mounted by Mission Control
- Used for secret management

### DuckDB
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- No health check
- Used for analytics

### OpenSearch
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- Health check: curl /_cluster/health
- Used for search

### Tika
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose.yml
- Health check: curl /
- Used for document parsing

### Repository Runtime
**Status:** CONFIGURED  
**Dependencies:**
- None (base infrastructure)

**Evidence:**
- Service in docker-compose-mission-control.yml
- Read-only volume mounts
- No health check
- Used for repository cognition

---

## Dependency Classification

### REQUIRED Dependencies
1. Gateway → PostgreSQL
2. Gateway → Qdrant
3. Worker Runtime → Gateway
4. Mission Control → PostgreSQL
5. Mission Control → Qdrant
6. Mission Control → Ollama
7. OpenWebUI → Ollama
8. Temporal → PostgreSQL
9. Kafka → Zookeeper

### OPTIONAL Dependencies
1. Gateway → Ollama
2. Worker Runtime → PostgreSQL (via gateway)
3. Worker Runtime → Qdrant (via gateway)
4. Mission Control → Vault
5. OpenWebUI → Mission Control

### BROKEN Dependencies
1. Gateway → Redis (adapter exists, no infrastructure)
2. Gateway → LiteLLM (no infrastructure)

### UNKNOWN Dependencies
1. Neo4j (no consumer identified in compose)
2. DuckDB (no consumer identified in compose)
3. OpenSearch (no consumer identified in compose)
4. Tika (no consumer identified in compose)
5. Repository Runtime (no consumer identified in compose)

---

## Critical Dependency Issues

### 1. Gateway Not in Compose
**Severity:** CRITICAL  
**Component:** Gateway  
**Impact:** Gateway is a REQUIRED dependency for Worker Runtime and all HTTP clients  
**Evidence:** Gateway Dockerfile exists but no service definition in compose files  
**Status:** BROKEN  

### 2. Worker Runtime Not in Compose
**Severity:** CRITICAL  
**Component:** Worker Runtime  
**Impact:** Worker Runtime is REQUIRED for event processing  
**Evidence:** Worker Runtime Dockerfile exists but no service definition in compose files  
**Status:** BROKEN  

### 3. Redis Infrastructure Missing
**Severity:** HIGH  
**Component:** Redis  
**Impact:** Gateway has Redis adapter but no Redis service  
**Evidence:** adapters/redis_adapter.js exists, no Redis service in compose  
**Status:** BROKEN  

### 4. LiteLLM Infrastructure Missing
**Severity:** MEDIUM  
**Component:** LiteLLM  
**Impact:** No LiteLLM gateway infrastructure  
**Evidence:** No LiteLLM service in compose files  
**Status:** MISSING  

### 5. Gateway Service Resolution
**Severity:** CRITICAL  
**Component:** Gateway  
**Impact:** Worker Runtime references gateway:8080 but Gateway not in compose  
**Evidence:** GATEWAY_URL=http://gateway:8080 in worker runtime  
**Status:** BROKEN  

---

## Startup Order Analysis

### Correct Startup Order
1. Zookeeper (no dependencies)
2. PostgreSQL (no dependencies)
3. Qdrant (no dependencies)
4. Ollama (no dependencies)
5. Vault (no dependencies)
6. Neo4j (no dependencies)
7. DuckDB (no dependencies)
8. OpenSearch (no dependencies)
9. Tika (no dependencies)
10. Repository Runtime (no dependencies)
11. Kafka (depends on Zookeeper)
12. Temporal (depends on PostgreSQL health)
13. Mission Control (depends on postgres, qdrant, ollama)
14. OpenWebUI (depends on ollama, mission-control)

### Missing from Startup Order
1. Gateway (not in compose)
2. Worker Runtime (not in compose)

---

## Dependency Graph Summary

### Application Layer
- Gateway: BROKEN (not in compose)
- Worker Runtime: BROKEN (not in compose)
- Mission Control: CONFIGURED

### Data Layer
- PostgreSQL: CONFIGURED
- Qdrant: CONFIGURED
- Neo4j: CONFIGURED
- DuckDB: CONFIGURED
- OpenSearch: CONFIGURED

### Event Layer
- Kafka: CONFIGURED
- Zookeeper: CONFIGURED
- Temporal: CONFIGURED

### AI Layer
- Ollama: CONFIGURED
- OpenWebUI: CONFIGURED

### Infrastructure Layer
- Vault: CONFIGURED
- Tika: CONFIGURED
- Repository Runtime: CONFIGURED

### Missing Layer
- Redis: BROKEN
- LiteLLM: MISSING

---

## Evidence Sources

1. **Docker Compose Files:** 4 files analyzed
2. **Dockerfiles:** 6 files analyzed
3. **Source Code:** Gateway and Worker Runtime code analyzed
4. **Adapter Files:** redis_adapter.js found
5. **Environment Variables:** Worker runtime GATEWAY_URL analyzed

---

## Next Steps

Proceed to Phase 45C: Runtime Service Matrix
