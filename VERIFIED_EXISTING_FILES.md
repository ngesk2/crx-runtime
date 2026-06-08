# VERIFIED_EXISTING_FILES.md

**Repository:** C:\Users\nolan\CRX
**Audit Date:** 2026-06-06
**Audit Type:** Constitutional Reality Reconciliation

---

## PHASE 1 — FILESYSTEM TRUTH WALK

### Top-Level Directories

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | GENERATED | LEGACY | AUTHORITATIVE | NOTES |
|------|--------|------------|------------------|-----------|--------|---------------|-------|
| `AGENT.md` | YES | 1 | YES | NO | NO | YES | Existing constitutional directive (13,529 bytes) |
| `knowledge/` | YES | 100+ | YES | NO | NO | YES | UCIA specs, schemas, proofs (sub-repo: master) |
| `vos/` | YES | 80+ | YES | NO | NO | YES | COS governance + VOS diagrams (sub-repo: main) |
| `runtime/` | YES | 12 | YES | NO | NO | YES | Kernel commit-service (sub-repo: audit-hardening) |
| `agents/` | YES | 8 | YES | NO | NO | PARTIAL | Agent scaffold + broken compose (no .git) |
| `infra/` | NO | 0 | YES | YES | NO | NO | TARGET: canonical infrastructure (not yet created) |

### Runtime Code (VERIFIED_RUNTIME_TRUTH)

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | STATUS |
|------|--------|------------|------------------|--------|
| `runtime/kernel/commit-service/src/server.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/api/commit_controller.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/api/audit_controller.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/engines/canonical_engine.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/engines/identity_engine.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/events/event_log.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/persistence/artifact_store.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/persistence/db.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/persistence/lineage_store.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/persistence/ledger_schema.sql` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/validation/dag_validator.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/src/utils/logger.ts` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/package.json` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/tsconfig.json` | YES | 1 | YES | VERIFIED_RUNTIME_TRUTH |

### Knowledge Base (AUTHORITATIVE)

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | STATUS |
|------|--------|------------|------------------|--------|
| `knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/claim.schema.json` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/decision.schema.json` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/replay-reconstruction.md` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/persistence-constitution.md` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/mutation-governance-model.md` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/authoritative/constitutional-agent-infrastructure.md` | YES | 1 | YES | AUTHORITATIVE |
| `knowledge/derived/cos-mapping.md` | YES | 1 | YES | DERIVED |
| `knowledge/derived/agent-workflow-topology.md` | YES | 1 | YES | DERIVED |

### VOS/COS (AUTHORITATIVE)

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | STATUS |
|------|--------|------------|------------------|--------|
| `vos/cos/CONSTITUTION.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/ARCHITECTURE.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/STRUCTURE.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/protocols/clarification-protocol.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/engines/thesis-compiler.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/engines/argument-compiler.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/engines/delayed-execution.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/governance/governance-framework.md` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/schema/audit-event.schema.json` | YES | 1 | YES | AUTHORITATIVE |
| `vos/cos/schema/argument-graph.schema.json` | YES | 1 | YES | AUTHORITATIVE |

### Agents (SHADOW_AUTHORITY)

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | STATUS |
|------|--------|------------|------------------|--------|
| `agents/docker-compose.yml` | YES | 1 | YES | SHADOW_AUTHORITY (broken) |
| `agents/agent_permissions.md` | YES | 1 | YES | AUTHORITATIVE |
| `agents/Dockerfile.planner` | YES | 1 | YES | SHADOW_AUTHORITY (no code) |
| `agents/Dockerfile.refactor` | YES | 1 | YES | SHADOW_AUTHORITY (no code) |
| `agents/Dockerfile.documentation` | YES | 1 | YES | SHADOW_AUTHORITY (no code) |
| `agents/Dockerfile.governance` | YES | 1 | YES | SHADOW_AUTHORITY (no code) |

### Infrastructure (MISSING)

| PATH | EXISTS | FILE COUNT | RUNTIME RELEVANT | STATUS |
|------|--------|------------|------------------|--------|
| `infra/docker-compose.yml` | NO | 0 | YES | MISSING (canonical target) |
| `infra/.env` | NO | 0 | YES | MISSING (canonical target) |
| `infra/postgres/` | NO | 0 | YES | MISSING |
| `infra/redis/` | NO | 0 | YES | MISSING |
| `infra/ollama/` | NO | 0 | YES | MISSING |
| `infra/observability/` | NO | 0 | YES | MISSING |

---

## CRITICAL FINDINGS

### 1. REPOSITORY IS MULTI-REPO STRUCTURE
- `knowledge/` has its own .git (branch: master)
- `vos/` has its own .git (branch: main)
- `runtime/` has its own .git (branch: audit-hardening)
- `agents/` has NO .git (scaffold only)
- Root CRX/ has NO .git (constitutional workspace root)

### 2. ACTUAL RUNTIME CODE EXISTS
- 12 TypeScript files in `runtime/kernel/commit-service/src/`
- Express server on port 8080
- PostgreSQL client via `DATABASE_URL`
- Canonicalization engine (NOT empty)
- Identity engine (NOT broken)
- DAG lineage validator
- Artifact and lineage stores
- Event logging

### 3. MULTIPLE CONSTITUTIONAL AUTHORITIES
- `AGENT.md` - Agent execution law (Priority 1)
- `knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md` - Kernel primitives (Priority 2)
- `vos/cos/CONSTITUTION.md` - Engineering process (Priority 3)
- `agents/agent_permissions.md` - Agent permissions (Priority 4)

### 4. INFRASTRUCTURE FRAGMENTATION
- `agents/docker-compose.yml` exists (4 agent services, broken - missing code/dirs)
- `infra/` does NOT exist (canonical target per AGENT.md)
- Runtime expects external Postgres via `DATABASE_URL`
- No centralized `.env`
- No observability stack

### 5. SCHEMA DRIFT
- COS `audit-event.schema.json` (governance audit)
- Runtime `execution_events` table (artifact commits)
- UCIA `claim.schema.json`, `decision.schema.json`
- AGENT.md canonical event envelope (target for consolidation)

---

## EVIDENCE SUMMARY

**VERIFIED_RUNTIME_TRUTH:** 12 TypeScript files + package.json + tsconfig.json
**AUTHORITATIVE_DOCUMENTS:** 30+ constitutional/spec documents
**SHADOW_AUTHORITY:** 5 Dockerfiles + docker-compose.yml (broken)
**MISSING_CANONICAL:** infra/ directory and all infrastructure
**DUPLICATE_SYSTEMS:** Multiple event schemas, multiple compose stacks (target vs broken)
