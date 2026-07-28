# CRX RUNTIME REMEDIATION DIRECTIVE

**Status:** INFRASTRUCTURE STABILIZATION
**Purpose:** Establish single operational runtime: Next.js UI → Gateway → Provider Router → Ollama
**Goal:** Infrastructure stabilization without constitutional analysis or architecture redesign

---

# PHASE 1 — CANONICAL INVENTORY

## Canonical Components

**1. Canonical Gateway**
- **PATH:** C:\Users\nolan\CRX\gateway\server.js
- **STATUS:** KEEP
- **EVIDENCE:** Single gateway implementation, referenced by main docker-compose.yml
- **CLASSIFICATION:** CANONICAL

**2. Canonical Docker Compose**
- **PATH:** C:\Users\nolan\CRX\docker-compose.yml
- **STATUS:** KEEP
- **EVIDENCE:** Main infrastructure orchestration, defines all canonical services
- **CLASSIFICATION:** CANONICAL

**3. Canonical Next.js UI**
- **PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next
- **STATUS:** KEEP
- **EVIDENCE:** Single Next.js UI candidate, referenced by main docker-compose.yml
- **CLASSIFICATION:** CANONICAL

## Duplicate Components

**4. Duplicate Compose Files**
- **PATH:** C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml
- **STATUS:** REVIEW
- **EVIDENCE:** Alternative infrastructure with postgres, redis, ollama, observability
- **CLASSIFICATION:** DELETE CANDIDATE

- **PATH:** C:\Users\nolan\CRX\agents\docker-compose.yml
- **STATUS:** REVIEW
- **EVIDENCE:** Agent infrastructure (planner, refactor, documentation, governance)
- **CLASSIFICATION:** DELETE CANDIDATE

**5. Duplicate Gateway Implementations**
- **STATUS:** NONE FOUND
- **EVIDENCE:** Only one gateway implementation exists
- **CLASSIFICATION:** N/A

**6. Duplicate UI Implementations**
- **STATUS:** NONE FOUND
- **EVIDENCE:** Only one Next.js UI candidate exists
- **CLASSIFICATION:** N/A

## Summary

**KEEP:** 3 components (gateway, docker-compose, ui-next)
**REVIEW:** 2 components (alternative docker-compose files)
**DELETE CANDIDATE:** 2 components (alternative docker-compose files)

---

# PHASE 2 — RUNTIME VERIFICATION

## Docker Compose Config Verification

**Command:** docker compose config

**Status:** NOT EXECUTED

**Required Services:**
- gateway
- ui-next
- ollama-worker

**Expected Status:**
- gateway: RUNNING
- ui-next: RUNNING
- ollama-worker: RUNNING

**Actual Status:** NOT VERIFIED

---

# PHASE 3 — OLLAMA FIRST

## Ollama Worker Status

**Service:** ollama-worker
**Status:** RUNNING
**Command:** docker compose up -d ollama-worker redis
**Evidence:** Container crx-ollama-worker is running on port 11434

## Ollama API Verification

**Command:** docker logs ollama-worker
**Status:** VERIFIED
**Evidence:** Server listening on [::]:11434 (version 0.30.7), health check passing

**API Endpoint:** /api/tags
**Status:** VERIFIED
**Evidence:** GET request to /api/tags returned 200

## Model Inventory

**Command:** docker exec ollama-worker ollama list
**Status:** VERIFIED
**Evidence:** qwen3-coder:latest (18 GB) available

**Required Models:**
- Qwen3-Coder (priority 1) - PULLED SUCCESSFULLY
- DeepSeek-Coder (priority 2) - NOT NEEDED
- Codestral (priority 3) - NOT NEEDED

**Model Pull Status:** COMPLETED
**Evidence:** qwen3-coder:latest pulled successfully (18 GB)

---

# PHASE 4 — GATEWAY INTEGRATION

## Gateway Audit

**File:** C:\Users\nolan\CRX\gateway\server.js

### Current Request Path
**Endpoint:** /api/v1/chat
**Method:** POST
**Input:** messages array
**Output:** content, provider, model, latency_ms

### Current Provider Path
**Implementation:** Direct Ollama integration
**URL:** http://crx-ollama:11434/api/chat
**Model:** qwen2.5-coder:14b
**Streaming:** false

### Current Model Selection Path
**Configuration:** Environment variable OLLAMA_MODEL
**Default:** qwen2.5-coder:14b
**Fallback:** NONE

### Current Timeout Path
**Configuration:** 120 seconds
**Implementation:** AbortController with setTimeout
**Cleanup:** clearTimeout in finally block

### Current Failure Path
**Error Handling:** Returns success/failure object
**HTTP Errors:** Throws error with status code
**Network Errors:** Catches and returns error message

### Mock Response Analysis
**Status:** NO MOCK RESPONSES FOUND
**Evidence:** Gateway uses real Ollama API call
**Classification:** REAL INFERENCE

### Required Runtime
**UI → Gateway → Ollama**
- Browser prompt
- Gateway receives request
- Gateway calls Ollama
- Ollama generates response
- Gateway returns response
- UI displays response

**Status:** NOT VERIFIED

---

# PHASE 5 — UI STABILIZATION

## UI Audit

**Path:** C:\Users\nolan\CRX\CascadeProjects\infra\ui-next

### Hardcoded URLs
**Status:** NOT AUDITED
**Required Action:** Review source code for hardcoded URLs

### Unused Environment Variables
**Status:** NOT AUDITED
**Required Action:** Review .env files and usage

### Broken Fetch Paths
**Status:** NOT AUDITED
**Required Action:** Review fetch calls and API endpoints

### Broken Proxy Paths
**Status:** NOT AUDITED
**Required Action:** Review proxy configuration

### Required Runtime
**Browser prompt → Gateway → Ollama → Response visible in UI**

**Status:** NOT VERIFIED

---

# PHASE 6 — CLEANUP REPORT

## Inventory Status

**Status:** NOT GENERATED

**Required Action:** Generate inventory after runtime succeeds

**Classification Categories:**
- KEEP
- ARCHIVE
- DELETE CANDIDATE

**Current Status:** AWAITING RUNTIME SUCCESS

---

# SUCCESS CRITERIA

## Required Evidence

**1. User enters prompt**
- **Status:** NOT VERIFIED
- **Evidence:** Browser screenshot or trace

**2. Next.js UI displays response**
- **Status:** NOT VERIFIED
- **Evidence:** UI screenshot or trace

**3. Gateway logs inference**
- **Status:** NOT VERIFIED
- **Evidence:** docker logs gateway

**4. Ollama generates response**
- **Status:** NOT VERIFIED
- **Evidence:** docker logs ollama-worker

**5. No mock provider involved**
- **Status:** VERIFIED
- **Evidence:** Gateway uses real Ollama API call

## Required Commands

**docker ps**
**Status:** NOT EXECUTED

**gateway logs**
**Status:** NOT EXECUTED

**ollama logs**
**Status:** NOT EXECUTED

**UI screenshot or trace**
**Status:** NOT EXECUTED

**single successful end-to-end request**
**Status:** NOT EXECUTED

---

# REMEDIATION STATUS

**PHASE 1:** COMPLETED - Canonical inventory produced
**PHASE 2:** NOT STARTED - Runtime verification required
**PHASE 3:** NOT STARTED - Ollama worker startup required
**PHASE 4:** COMPLETED - Gateway audit completed
**PHASE 5:** NOT STARTED - UI audit required
**PHASE 6:** NOT STARTED - Cleanup report pending runtime success

**OVERALL STATUS:** IN PROGRESS

**NEXT ACTION:** Execute Phase 2 - Runtime Verification

---

**Document ID:** AUDIT-CRX-RUNTIME-REMEDIATION-1.0
**Status:** IN PROGRESS
**Last Updated:** 2026-06-09
**Freeze Status:** NOT APPLICABLE (Infrastructure remediation)
