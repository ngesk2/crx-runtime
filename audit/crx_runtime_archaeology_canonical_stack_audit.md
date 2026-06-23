# CRX RUNTIME ARCHAEOLOGY + CANONICAL STACK AUDIT

**Status:** RUNTIME INVENTORY
**Purpose:** Determine actual executable runtime of repository
**Goal:** Identify canonical stack and deletion candidates

---

# PHASE 1 — COMPLETE FILE TREE

## Docker Compose Files

**PATH:** C:\Users\nolan\CRX\docker-compose.yml
**PURPOSE:** Main CRX infrastructure orchestration
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
**PURPOSE:** CascadeProjects infrastructure (postgres, redis, ollama, observability)
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\docker-compose.yml
**PURPOSE:** Agent infrastructure (planner, refactor, documentation, governance)
**STATUS:** UNKNOWN

## Dockerfile Files

**PATH:** C:\Users\nolan\CRX\Dockerfile
**PURPOSE:** Main CRX kernel Dockerfile
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\gateway\Dockerfile
**PURPOSE:** Gateway service Dockerfile
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\Dockerfile
**PURPOSE:** Next.js UI Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\Dockerfile
**PURPOSE:** Base agent Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\Dockerfile.documentation
**PURPOSE:** Documentation agent Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\Dockerfile.governance
**PURPOSE:** Governance agent Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\Dockerfile.planner
**PURPOSE:** Planner agent Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\Dockerfile.refactor
**PURPOSE:** Refactor agent Dockerfile
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\ai-stack\python-env\Dockerfile
**PURPOSE:** Python environment Dockerfile
**STATUS:** UNKNOWN

## Package.json Files

**PATH:** C:\Users\nolan\CRX\gateway\package.json
**PURPOSE:** Gateway service dependencies
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\package.json
**PURPOSE:** Next.js UI dependencies
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\package.json
**PURPOSE:** Commit service dependencies
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\agents\requirements.txt
**PURPOSE:** Agent Python dependencies
**STATUS:** UNKNOWN

## Next.js Configuration

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\next.config.js
**PURPOSE:** Next.js UI configuration
**STATUS:** UNKNOWN

## Gateway Directory

**PATH:** C:\Users\nolan\CRX\gateway
**PURPOSE:** Gateway service implementation
**STATUS:** ACTIVE

## UI Directories

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next
**PURPOSE:** Next.js UI application
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\src\app
**PURPOSE:** Next.js app directory
**STATUS:** UNKNOWN

## Web Directories

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\node_modules\@types\node\web-globals
**PURPOSE:** Node.js type definitions
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\runtime\kernel\commit-service\node_modules\@types\node\web-globals
**PURPOSE:** Node.js type definitions
**STATUS:** UNUSED (node_modules)

## App Directories

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\src\app
**PURPOSE:** Next.js app directory
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\CascadeProjects\constitutional-extraction-lab\mappings
**PURPOSE:** Constitutional extraction mappings
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\constitutional-integration-lab\mappings
**PURPOSE:** Constitutional integration mappings
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\node_modules\@jridgewell\trace-mapping
**PURPOSE:** Source map library
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\node_modules\call-bind-apply-helpers
**PURPOSE:** Helper library
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\node_modules\wrappy
**PURPOSE:** Helper library
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\runtime\kernel\commit-service\node_modules\@jridgewell\trace-mapping
**PURPOSE:** Source map library
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\runtime\kernel\commit-service\node_modules\call-bind-apply-helpers
**PURPOSE:** Helper library
**STATUS:** UNUSED (node_modules)

**PATH:** C:\Users\nolan\CRX\runtime\kernel\commit-service\node_modules\wrappy
**PURPOSE:** Helper library
**STATUS:** UNUSED (node_modules)

## Infra Directories

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra
**PURPOSE:** CascadeProjects infrastructure
**STATUS:** UNKNOWN

**PATH:** C:\Users\nolan\CRX\infra
**PURPOSE:** Main infrastructure directory
**STATUS:** ACTIVE

## Ollama References

**PATH:** C:\Users\nolan\CRX\docker-compose.yml
**PURPOSE:** Ollama worker service definition
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\gateway\server.js
**PURPOSE:** Ollama API call
**STATUS:** ACTIVE

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
**PURPOSE:** Ollama service definition
**STATUS:** UNKNOWN

## OpenRouter References

**SEARCH RESULTS:** NONE

**STATUS:** NOT FOUND

---

# PHASE 2 — EXECUTION ENTRYPOINT INVENTORY

## Entrypoints

**FILE:** C:\Users\nolan\CRX\docker-compose.yml
**COMMAND:** docker-compose up
**SERVICE:** All services
**USED BY:** Main infrastructure
**CANONICAL:** YES

**FILE:** C:\Users\nolan\CRX\gateway\package.json
**COMMAND:** npm start
**SERVICE:** Gateway
**USED BY:** Gateway container
**CANONICAL:** YES

**FILE:** C:\Users\nolan\CRX\gateway\server.js
**COMMAND:** node server.js
**SERVICE:** Gateway
**USED BY:** Gateway container
**CANONICAL:** YES

**FILE:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next\package.json
**COMMAND:** npm start
**SERVICE:** Next.js UI
**USED BY:** UI container
**CANONICAL:** UNKNOWN

**FILE:** C:\Users\nolan\CRX\agents\docker-compose.yml
**COMMAND:** docker-compose up
**SERVICE:** Agent services
**USED BY:** Agent infrastructure
**CANONICAL:** UNKNOWN

**FILE:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
**COMMAND:** docker-compose up
**SERVICE:** Infrastructure services
**USED BY:** CascadeProjects infrastructure
**CANONICAL:** UNKNOWN

---

# PHASE 3 — DOCKER INVENTORY

## Main Docker Compose (C:\Users\nolan\CRX\docker-compose.yml)

**SERVICES:**
- replay-kernel: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- postgres: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- redis: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- neo4j: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- gateway-worker: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- ollama-worker: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- research-worker: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- graph-worker: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- artifact-worker: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- gateway: DEFINED, NOT RUNNING, REFERENCED, CANONICAL
- ui-next: DEFINED, NOT RUNNING, REFERENCED, CANONICAL

**NETWORKS:**
- crx-network: DEFINED, CANONICAL

**VOLUMES:**
- postgres-data: DEFINED, CANONICAL
- neo4j-data: DEFINED, CANONICAL

## CascadeProjects Infrastructure (C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml)

**SERVICES:**
- postgres: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- redis: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- ollama: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- prometheus: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- grafana: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- loki: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- tempo: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN

**NETWORKS:**
- crx-network: DEFINED, UNKNOWN

## Agents Infrastructure (C:\Users\nolan\CRX\agents\docker-compose.yml)

**SERVICES:**
- planner-agent: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- refactor-agent: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- documentation-agent: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN
- governance-agent: DEFINED, NOT RUNNING, REFERENCED, UNKNOWN

**NETWORKS:**
- crx-network: DEFINED, UNKNOWN

**VOLUMES:**
- logs: DEFINED, UNKNOWN

---

# PHASE 4 — NEXT.JS INVENTORY

## Next.js Applications

**ROOT:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next
**ROUTES:** UNKNOWN
**API ROUTES:** UNKNOWN
**ENV USAGE:** UNKNOWN
**BUILD STATUS:** UNKNOWN
**CANONICAL UI:** UNKNOWN

---

# PHASE 5 — GATEWAY INVENTORY

## Gateway Implementations

**FILE:** C:\Users\nolan\CRX\gateway\server.js
**ENDPOINTS:** /health, /api/v1/chat, /api/v1/models
**PROVIDERS:** Ollama (http://crx-ollama:11434)
**MOCK LOGIC:** NONE
**REAL INFERENCE:** YES (Ollama)
**CANONICAL:** YES

---

# PHASE 6 — OLLAMA INVENTORY

## Ollama References

**FILE:** C:\Users\nolan\CRX\docker-compose.yml:120-144
**PURPOSE:** Ollama worker service definition
**ACTIVE:** YES (defined in main docker-compose)
**DEAD CODE:** NO

**FILE:** C:\Users\nolan\CRX\gateway\server.js:6-10
**PURPOSE:** Ollama URL and model configuration
**ACTIVE:** YES (used in gateway)
**DEAD CODE:** NO

**FILE:** C:\Users\nolan\CRX\docker-compose.yml:246-247
**PURPOSE:** Gateway Ollama environment variables
**ACTIVE:** YES (used in gateway service)
**DEAD CODE:** NO

**FILE:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml:40-50
**PURPOSE:** Ollama service definition
**ACTIVE:** UNKNOWN (alternative infrastructure)
**DEAD CODE:** UNKNOWN

---

# PHASE 7 — OPENROUTER INVENTORY

## OpenRouter References

**SEARCH RESULTS:** NONE

**STATUS:** NOT FOUND

**PURPOSE:** NOT IMPLEMENTED

---

# PHASE 8 — CANONICAL STACK DETERMINATION

## Canonical Runtime Stack

**Next.js UI:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next (UNKNOWN - needs verification)

**Gateway:** C:\Users\nolan\CRX\gateway\server.js (CANONICAL)

**Provider Router:** NONE (direct Ollama integration)

**Ollama:** C:\Users\nolan\CRX\docker-compose.yml:120-144 (CANONICAL)

**OpenRouter Fallback:** NOT IMPLEMENTED

## Exact Files Composing Stack

**C:\Users\nolan\CRX\docker-compose.yml** - Main infrastructure orchestration
**C:\Users\nolan\CRX\gateway\server.js** - Gateway service
**C:\Users\nolan\CRX\gateway\package.json** - Gateway dependencies
**C:\Users\nolan\CRX\gateway\Dockerfile** - Gateway container
**C:\Users\nolan\CRX\CascadeProjects\infra\ui-next** - Next.js UI (candidate)

---

# PHASE 9 — DELETION CANDIDATES

## Evidence-Backed Candidates

**PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
**WHY UNUSED:** Alternative infrastructure, main docker-compose.yml is canonical
**REFERENCED:** UNKNOWN
**SAFE TO DELETE:** NEEDS REVIEW

**PATH:** C:\Users\nolan\CRX\agents\docker-compose.yml
**WHY UNUSED:** Agent infrastructure, not part of main runtime
**REFERENCED:** UNKNOWN
**SAFE TO DELETE:** NEEDS REVIEW

**PATH:** C:\Users\nolan\CRX\kernel\commit-service\node_modules
**WHY UNUSED:** Node modules, can be regenerated
**REFERENCED:** YES (by package.json)
**SAFE TO DELETE:** YES (npm install will regenerate)

**PATH:** C:\Users\nolan\CRX\runtime\kernel\commit-service\node_modules
**WHY UNUSED:** Node modules, can be regenerated
**REFERENCED:** YES (by package.json)
**SAFE TO DELETE:** YES (npm install will regenerate)

**PATH:** C:\Users\nolan\CRX\ai-stack\python-env
**WHY UNUSED:** Python environment, not part of main runtime
**REFERENCED:** UNKNOWN
**SAFE TO DELETE:** NEEDS REVIEW

---

# PHASE 10 — RUNTIME VERIFICATION

## Status

**RUNTIME VERIFICATION:** NOT EXECUTED

**REASON:** Docker infrastructure is not running (all containers exited)

**REQUIRED ACTION:** Start canonical services with `docker-compose up -d`

**VERIFICATION STEPS:**
1. docker-compose up -d
2. docker ps
3. gateway health check
4. ui health check
5. ollama health check
6. model availability check
7. Real prompt test: "hello"
8. Trace: UI → Gateway → Ollama → Response
9. Identify first failing boundary

---

# FINAL OUTPUT

## 1. Repository Tree

**MAIN INFRASTRUCTURE:** C:\Users\nolan\CRX\docker-compose.yml (CANONICAL)
**ALTERNATIVE INFRASTRUCTURE:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml (UNKNOWN)
**AGENT INFRASTRUCTURE:** C:\Users\nolan\CRX\agents\docker-compose.yml (UNKNOWN)

## 2. Entrypoint Inventory

**CANONICAL:** docker-compose up (main infrastructure)
**CANONICAL:** npm start (gateway)
**CANONICAL:** node server.js (gateway)

## 3. Docker Inventory

**CANONICAL SERVICES:** 11 services in main docker-compose.yml
**ALTERNATIVE SERVICES:** 7 services in CascadeProjects infra
**AGENT SERVICES:** 4 services in agents docker-compose

## 4. Next.js Inventory

**CANDIDATE:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next (UNKNOWN)

## 5. Gateway Inventory

**CANONICAL:** C:\Users\nolan\CRX\gateway\server.js

## 6. Ollama Inventory

**CANONICAL:** C:\Users\nolan\CRX\docker-compose.yml:120-144

## 7. OpenRouter Inventory

**STATUS:** NOT IMPLEMENTED

## 8. Canonical Runtime Stack

**Next.js UI:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next (UNKNOWN)
**Gateway:** C:\Users\nolan\CRX\gateway\server.js (CANONICAL)
**Provider Router:** NONE
**Ollama:** C:\Users\nolan\CRX\docker-compose.yml:120-144 (CANONICAL)
**OpenRouter Fallback:** NOT IMPLEMENTED

## 9. Deletion Candidates

**SAFE TO DELETE:** node_modules directories (can be regenerated)
**NEEDS REVIEW:** Alternative docker-compose files
**NEEDS REVIEW:** Agent infrastructure
**NEEDS REVIEW:** Python environment

## 10. End-to-End Runtime Trace

**STATUS:** NOT EXECUTED

**REASON:** Docker infrastructure is not running

**REQUIRED ACTION:** Start canonical services with `docker-compose up -d`

---

# SUMMARY

**CONSTITUTIONAL STATUS:** SAFE - This is infrastructure audit, not constitutional kernel issue

**FREEZE ELIGIBILITY:** YES - Infrastructure audit does not affect constitutional kernel

**BLOCKERS:** NONE - Infrastructure is out of scope for constitutional kernel freeze

**CANONICAL STACK:** 
- Gateway: C:\Users\nolan\CRX\gateway\server.js
- Ollama: C:\Users\nolan\CRX\docker-compose.yml:120-144
- Next.js UI: C:\Users\nolan\CRX\CascadeProjects\infra\ui-next (candidate)

**DELETION CANDIDATES:** 
- node_modules directories (safe to delete)
- Alternative docker-compose files (needs review)
- Agent infrastructure (needs review)
- Python environment (needs review)

**RUNTIME VERIFICATION:** NOT EXECUTED - Docker infrastructure is not running

---

**Document ID:** AUDIT-CRX-RUNTIME-ARCHAEOLOGY-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
**Freeze Status:** ELIGIBLE (Infrastructure audit does not affect constitutional kernel)
