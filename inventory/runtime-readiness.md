# Runtime Readiness Inventory

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 Phase 6 — Discovery (Read-Only)  
**Scope:** `C:\Users\nolan\CRX\runtime`

No code written. Audit only.

---

## Repository State

| Field | Value |
|-------|-------|
| Path | `C:\Users\nolan\CRX\runtime` |
| Branch | `audit-hardening` (ahead of origin by 3) |
| Remote | `https://github.com/ngesk2/crx-runtime.git` |
| Entrypoint | `kernel/commit-service/src/server.ts` |

---

## Implementation Matrix

| Component | Path | Status | Evidence |
|-----------|------|--------|----------|
| HTTP server | `src/server.ts` | **IMPLEMENTED** | Express on :8080 |
| Commit API | `src/api/commit_controller.ts` | **IMPLEMENTED** | POST /kernel/commit |
| Audit API | `src/api/audit_controller.ts` | **IMPLEMENTED** | GET /kernel/audit |
| Canonicalization | `src/engines/canonical_engine.ts` | **IMPLEMENTED** | Recursive key sort |
| Identity / hashing | `src/engines/identity_engine.ts` | **IMPLEMENTED** | SHA-256 over canonical form |
| DAG validation | `src/validation/dag_validator.ts` | **IMPLEMENTED** | Parent link checker |
| Event log | `src/events/event_log.ts` | **IMPLEMENTED** | Append events |
| Artifact store | `src/persistence/artifact_store.ts` | **IMPLEMENTED** | PG persistence |
| Lineage store | `src/persistence/lineage_store.ts` | **IMPLEMENTED** | PG persistence |
| DB client | `src/persistence/db.ts` | **IMPLEMENTED** | Requires DATABASE_URL |
| Ledger schema | `src/persistence/ledger_schema.sql` | **IMPLEMENTED** | DDL |
| Logger | `src/utils/logger.ts` | **IMPLEMENTED** | pino |
| Replay engine | — | **MISSING** | Doc only |
| Witness verifier | — | **MISSING** | Archived JS only |
| Policy engine | — | **MISSING** | Doc only |
| Worker process | — | **MISSING** | No worker.ts |
| Scheduler | — | **MISSING** | No scheduler.ts |
| VM sandbox | — | **MISSING** | No isolation |
| Tests | package.json | **PLACEHOLDER** | `"test": "echo Error"` |

---

## Boot Requirements

| Prerequisite | Status |
|--------------|--------|
| Node.js v22+ | AVAILABLE |
| ts-node | Installed (devDependency) |
| DATABASE_URL | REQUIRED — not in CRX .env |
| PostgreSQL running | NOT RUNNING locally |
| npm install | node_modules present |

**Boot command:** `cd runtime/kernel/commit-service && npm run dev`

**Classification:** PARTIALLY BOOTABLE — requires external database

---

## Dependencies (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | HTTP transport |
| pg | ^8.20.0 | PostgreSQL |
| pino | ^9.5.0 | Logging |
| ts-node | ^10.9.2 | Dev execution |
| typescript | ^6.0.3 | Compilation |

---

## Parallel Runtimes (Non-Canonical)

| Runtime | Location | Status | Risk |
|---------|----------|--------|------|
| ai-stack FastAPI | `C:\Users\nolan\ai-stack\api\main.py` | Experimental — incomplete (missing db.py, models.py) | HIGH |
| JS.txt harnesses | Codex archive | Archaeological | MEDIUM |
| Extracted runtime copy | constitutional-integration-lab/extracted/runtime/ | Mirror | LOW |

---

## Agent Scaffold (CRX/agents)

| Item | Status |
|------|--------|
| docker-compose.yml | BROKEN — wrong volume paths |
| Dockerfiles (4) | SCAFFOLD — no runnable agent code |
| crx_workspace_indexer.py/.ps1 | TOOLING — inventory, not runtime |
| agent_permissions.md | GOVERNANCE DOC |

---

## Readiness Classification

| Layer | Status |
|-------|--------|
| Commit path (write events) | PARTIAL |
| Audit path (read events) | PARTIAL |
| Replay | NOT READY |
| Policy enforcement | NOT READY |
| Multi-agent orchestration | NOT READY |
| Observability (metrics/traces) | NOT READY |
