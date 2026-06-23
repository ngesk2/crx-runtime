# PHASE 7: INTERFACE AUDIT

**Audit Scope:** Audit localhost:3000, crx-ui-next, open-webui, Gateway APIs, Operational Dashboards  
**Constitutional Root:** PING (C:\Users\nolan\PING)  

---

## LOCALHOST:3000

### Current Status

**Container:** crx-ui-next  
**Status:** Exited (exit code 0) - 47 hours ago  
**Port:** 3000:3000  
**Image:** crx-ui-next:1.0.0  
**Network:** crx_crx-network  
**Environment:** NEXT_PUBLIC_GATEWAY_URL=http://gateway-worker:8080, NODE_ENV=production  
**Health Check:** curl -f http://localhost:3000/api/health (interval: 30s, timeout: 10s, start_period: 10s, retries: 3)  

### Purpose

Next.js UI frontend for CRX system. Provides a user interface for interacting with the CRX system through the PING gateway.

### Constitutional Status

**APPLICATION** - This is an application interface, not a constitutional primitive. It is built on top of PING (connects to gateway-worker:8080).

### Dependencies

- PING Gateway (gateway-worker:8080)
- Next.js framework
- Node.js runtime

### Ownership

**PING APPLICATION** - Owned by PING as the canonical UI for the CRX system.

---

## CRX-UI-NEXT

### Current Status

**Container:** crx-ui-next  
**Status:** Exited (exit code 0) - 47 hours ago  
**Port:** 3000:3000  
**Image:** crx-ui-next:1.0.0  
**Network:** crx_crx-network  
**Environment:** NEXT_PUBLIC_GATEWAY_URL=http://gateway-worker:8080, NODE_ENV=production  

### Purpose

Next.js UI frontend for CRX system. Same as localhost:3000 (this is the container that serves localhost:3000).

### Constitutional Status

**APPLICATION** - This is an application interface, not a constitutional primitive.

### Dependencies

- PING Gateway (gateway-worker:8080)
- Next.js framework
- Node.js runtime

### Ownership

**PING APPLICATION** - Owned by PING as the canonical UI for the CRX system.

---

## OPEN-WEBUI (crx-digestion-worker)

### Current Status

**Container:** open-webui  
**Status:** Exited (exit code 137) - 47 hours ago  
**Port:** 3001:8080  
**Image:** ghcr.io/open-webui/open-webui:main  
**Network:** crx-digestion-worker_default  
**Volume:** crx-digestion-worker_open-webui-data:/app/backend/data  
**Environment:** OLLAMA_BASE_URL=http://host.docker.internal:11434, USE_OLLAMA_DOCKER=false, USE_CUDA_DOCKER=false, RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2, AUXILIARY_EMBEDDING_MODEL=TaylorAI/bge-micro-v2  
**Health Check:** curl --silent --fail http://localhost:${PORT:-8080}/health | jq -ne 'input.status == true' || exit 1  

### Purpose

Open WebUI AI interface for Ollama models. Provides a web interface for interacting with Ollama models.

### Constitutional Status

**OBSOLETE** - This is an external AI interface application that duplicates functionality that should be provided by crx-ui-next. It is not a constitutional primitive and should be removed.

### Dependencies

- Ollama (host.docker.internal:11434)
- Open WebUI (external application)

### Ownership

**OBSOLETE** - Should be removed. crx-ui-next is the canonical UI.

---

## OPEN-WEBUI (brain infrastructure)

### Current Status

**Container:** brain-openwebui  
**Status:** Not currently running (defined in brain infrastructure)  
**Port:** 3000:8080  
**Image:** ghcr.io/open-webui/open-webui:latest  
**Network:** brain_internal  
**Environment:** OLLAMA_BASE_URL=http://ollama:11434  
**Depends on:** ollama  
**Health Check:** curl -f http://localhost:8080 (interval: 10s, timeout: 5s, retries: 5)  

### Purpose

Open WebUI AI interface for Brain's Ollama models.

### Constitutional Status

**OBSOLETE** - This is a duplicate of open-webui in crx-digestion-worker, which itself is obsolete. It duplicates functionality that should be provided by crx-ui-next.

### Dependencies

- Brain's Ollama (ollama:11434)
- Open WebUI (external application)

### Ownership

**OBSOLETE** - Should be removed. crx-ui-next is the canonical UI.

---

## GATEWAY APIS

### File: C:\Users\nolan\PING\gateway\server.js

### Current Status

**Container:** crx-gateway  
**Status:** Exited (exit code 1) - 47 hours ago  
**Port:** 8080:8080  
**Image:** crx-gateway:1.0.0  
**Network:** crx_crx-network  
**Environment:** OLLAMA_URL=http://crx-ollama-worker:11434, OLLAMA_MODEL=qwen2.5-coder:14b, NODE_ENV=production  

### Purpose

Express-based API gateway with model routing, constitutional event emission, and operational intelligence context services.

### API Endpoints

1. **POST /api/v1/chat**
   - Purpose: Chat endpoint for LLM inference
   - Model routing based on complexity score
   - Emits INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED events
   - Dependencies: Ollama, PostgreSQL (event store)

2. **GET /events**
   - Purpose: Query events from PostgreSQL event store
   - Parameters: stream, event_type, limit, offset
   - Dependencies: PostgreSQL (event store)

3. **GET /events/stats**
   - Purpose: Get event statistics
   - Returns: event counts by type, activity metrics
   - Dependencies: PostgreSQL (event store)

4. **GET /context**
   - Purpose: Get runtime context for LLMs
   - Returns: worker status, model performance, recent errors
   - Dependencies: PostgreSQL (operational_intelligence.sql)

5. **GET /context/worker-status**
   - Purpose: Get worker status
   - Returns: worker heartbeat status
   - Dependencies: PostgreSQL (operational_intelligence.sql)

6. **GET /context/model-performance**
   - Purpose: Get model performance metrics
   - Returns: model performance data
   - Dependencies: PostgreSQL (operational_intelligence.sql)

7. **GET /context/recent-errors**
   - Purpose: Get recent errors
   - Returns: recent error logs
   - Dependencies: PostgreSQL (operational_intelligence.sql)

8. **GET /context/daily-digest**
   - Purpose: Get daily runtime digest
   - Returns: daily digest summary
   - Dependencies: PostgreSQL (operational_intelligence.sql)

9. **GET /context/knowledge-growth**
   - Purpose: Get knowledge growth metrics
   - Returns: knowledge growth data
   - Dependencies: PostgreSQL (operational_intelligence.sql)

10. **POST /api/v1/autocomplete**
    - Purpose: Autocomplete endpoint
    - Returns: autocomplete suggestions
    - Dependencies: Ollama

### Constitutional Status

**PING KERNEL** - This is the PING gateway, which is the orchestration layer for PING. It implements constitutional event recording and operational intelligence context services.

### Dependencies

- PostgreSQL (event store, operational intelligence)
- Ollama (inference)
- Node.js runtime

### Ownership

**PING KERNEL** - Owned by PING as the constitutional gateway.

---

## OPERATIONAL DASHBOARDS

### File: C:\Users\nolan\PING\database\operational_intelligence.sql

### Purpose

SQL functions and queries for operational intelligence dashboards, including:

1. **get_event_activity()**
   - Purpose: Get event activity metrics
   - Returns: Event counts by type, time ranges
   - Dependencies: events table

2. **get_worker_status()**
   - Purpose: Get worker heartbeat status
   - Returns: Worker status, last heartbeat
   - Dependencies: events table (WORKER_HEARTBEAT events)

3. **get_model_performance()**
   - Purpose: Get model performance metrics
   - Returns: Model performance data (latency, success rate)
   - Dependencies: events table (INFERENCE_REQUEST, INFERENCE_RESPONSE events)

4. **get_top_errors()**
   - Purpose: Get top errors
   - Returns: Error counts by type
   - Dependencies: events table (INFERENCE_FAILED, ARTICLE_PROCESSING_FAILED, NEWSLETTER_PROCESSING_FAILED events)

5. **get_daily_runtime_digest()**
   - Purpose: Get daily runtime digest
   - Returns: Daily digest summary (events processed, errors, performance)
   - Dependencies: events table

6. **get_knowledge_growth_metrics()**
   - Purpose: Get knowledge growth metrics
   - Returns: Knowledge growth over time
   - Dependencies: events table (ARTICLE_CREATED, NEWSLETTER_CREATED events)

7. **raw_payloads table**
   - Purpose: Store raw input payloads for input preservation
   - Dependencies: None

8. **dead_letters table**
   - Purpose: Store permanent failures
   - Dependencies: None

### Constitutional Status

**PING OPERATIONAL INTELLIGENCE** - This is operational intelligence (non-constitutional but PING-owned). It provides telemetry, metrics, heartbeats, runtime digests, dead letters, and failure tracking.

### Dependencies

- PostgreSQL (events table)
- Event logging from applications

### Ownership

**PING OPERATIONAL INTELLIGENCE** - Owned by PING as operational intelligence (not constitutional primitive but PING-owned).

---

## APPLICATION DASHBOARDS

### crx-newsletter-brain Dashboard

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\dashboard.py  
**Container:** newsletter-brain-dashboard  
**Status:** Not currently running (defined in docker-compose.yml)  
**Port:** 5001:5001  
**Purpose:** Dashboard for newsletter worker  
**Dependencies:** SQLite (newsletters.db)  
**Constitutional Status:** APPLICATION DASHBOARD - Not constitutional  
**Ownership:** APPLICATION (crx-newsletter-brain)

### crx-digestion-worker Dashboard

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\dashboard.py  
**Container:** None (not defined in docker-compose.yml)  
**Purpose:** Dashboard for digestion worker  
**Dependencies:** SQLite (knowledge.db)  
**Constitutional Status:** APPLICATION DASHBOARD - Not constitutional  
**Ownership:** APPLICATION (crx-digestion-worker)

---

## SUMMARY

### INTERFACES BY CONSTITUTIONAL STATUS

**PING KERNEL (Constitutional):**
1. Gateway APIs (server.js) - Constitutional gateway with event recording and operational intelligence

**PING APPLICATION (Non-constitutional but PING-owned):**
1. crx-ui-next (localhost:3000) - Canonical UI for CRX system
2. Operational Dashboards (operational_intelligence.sql) - Telemetry, metrics, heartbeats, runtime digests, dead letters, failure tracking

**APPLICATION (Non-constitutional, application-owned):**
1. crx-newsletter-brain Dashboard (dashboard.py) - Newsletter worker dashboard
2. crx-digestion-worker Dashboard (dashboard.py) - Digestion worker dashboard

**OBSOLETE (Should be removed):**
1. open-webui (crx-digestion-worker) - Duplicate of crx-ui-next
2. brain-openwebui (brain infrastructure) - Duplicate of open-webui

### ANSWER

**What interfaces exist?**
- PING Gateway APIs (constitutional gateway with event recording and operational intelligence)
- crx-ui-next (canonical UI for CRX system)
- Operational Dashboards (telemetry, metrics, heartbeats, runtime digests, dead letters, failure tracking)
- Application Dashboards (newsletter worker dashboard, digestion worker dashboard)
- open-webui (obsolete - duplicate of crx-ui-next)

**Where are they located?**
- PING Gateway: C:\Users\nolan\PING\gateway\server.js
- crx-ui-next: Container crx-ui-next (port 3000)
- Operational Dashboards: C:\Users\nolan\PING\database\operational_intelligence.sql
- Application Dashboards: crx-newsletter-brain/dashboard.py, crx-digestion-worker/dashboard.py
- open-webui: Container open-webui (obsolete)

**What is the constitutional ownership?**
- PING owns: Gateway APIs, crx-ui-next, Operational Dashboards
- Applications own: Application Dashboards
- Obsolete: open-webui, brain-openwebui (should be removed)
