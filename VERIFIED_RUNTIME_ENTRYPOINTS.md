# VERIFIED_RUNTIME_ENTRYPOINTS.md

**Repository:** C:\Users\nolan\CRX
**Audit Date:** 2026-06-06
**Audit Type:** Constitutional Reality Reconciliation

---

## PHASE 2 — RUNTIME ENTRYPOINT VERIFICATION

### Entrypoint Candidates

| FILE | REACHABLE | BOOTSTRAP_ROLE | IMPORT_GRAPH | STATUS |
|------|-----------|----------------|--------------|--------|
| `runtime/kernel/commit-service/src/server.ts` | YES | HTTP Server | express, commit_controller, audit_controller | VERIFIED_RUNTIME_TRUTH |
| `runtime/kernel/commit-service/package.json` | YES | Build Config | N/A | VERIFIED_RUNTIME_TRUTH |
| `agents/docker-compose.yml` | NO | Container Bootstrap | N/A | SHADOW_RUNTIME (broken) |

### Detailed Analysis

#### 1. `runtime/kernel/commit-service/src/server.ts`

**FILE:** `runtime/kernel/commit-service/src/server.ts`
**REACHABLE:** YES
**BOOTSTRAP_ROLE:** HTTP Server
**IMPORT_GRAPH:**
```
server.ts
├── express (npm: express@^5.2.1)
├── ./api/commit_controller
│   ├── express
│   ├── ./engines/identity_engine
│   │   ├── crypto (node)
│   │   └── ./engines/canonical_engine
│   ├── ./validation/dag_validator
│   ├── ./persistence/artifact_store
│   ├── ./persistence/lineage_store
│   ├── ./events/event_log
│   └── ./utils/logger
│       └── pino (npm: pino@^9.5.0)
└── ./api/audit_controller
```

**BOOTSTRAP SEQUENCE:**
```typescript
1. Import express
2. Import controllers
3. Create express app
4. Configure JSON middleware
5. Register POST /kernel/commit → commitArtifact
6. Register GET /kernel/audit → auditArtifacts
7. Listen on port 8080
8. Log "CRX kernel running on ${port}"
```

**ENVIRONMENT DEPENDENCIES:**
- `DATABASE_URL` (required for PostgreSQL connection in db.ts)

**STATUS:** VERIFIED_RUNTIME_TRUTH

---

#### 2. `runtime/kernel/commit-service/package.json`

**FILE:** `runtime/kernel/commit-service/package.json`
**REACHABLE:** YES
**BOOTSTRAP_ROLE:** Build Configuration
**SCRIPTS:**
```json
{
  "test": "echo \"Error: no test specified\" && exit 1",
  "dev": "ts-node src/server.ts"
}
```

**DEPENDENCIES:**
```json
{
  "express": "^5.2.1",
  "pg": "^8.20.0",
  "pino": "^9.5.0"
}
```

**DEV_DEPENDENCIES:**
```json
{
  "@types/express": "^5.0.6",
  "@types/node": "^25.6.2",
  "ts-node": "^10.9.2",
  "typescript": "^6.0.3"
}
```

**BOOTSTRAP COMMAND:** `npm run dev` → `ts-node src/server.ts`

**STATUS:** VERIFIED_RUNTIME_TRUTH

---

#### 3. `agents/docker-compose.yml`

**FILE:** `agents/docker-compose.yml`
**REACHABLE:** NO (broken - missing code/dirs)
**BOOTSTRAP_ROLE:** Container Bootstrap
**SERVICES DEFINED:**
- planner-agent (Dockerfile.planner)
- refactor-agent (Dockerfile.refactor)
- documentation-agent (Dockerfile.documentation)
- governance-agent (Dockerfile.governance)

**VOLUME MOUNTS:**
- `./authoritative:/crx/authoritative:ro` (DOES NOT EXIST in agents/)
- `./derived:/crx/derived:ro` (DOES NOT EXIST in agents/)
- `./experimental:/crx/experimental:rw` (DOES NOT EXIST in agents/)
- `./logs:/crx/logs` (DOES NOT EXIST in agents/)

**STATUS:** SHADOW_RUNTIME (broken - references non-existent directories)

---

### Missing Entrypoints (SEARCHED BUT NOT FOUND)

| CANDIDATE | SEARCHED | FOUND | STATUS |
|-----------|----------|-------|--------|
| `index.ts` | YES | NO | NOT_APPLICABLE |
| `main.ts` | YES | NO | NOT_APPLICABLE |
| `app.ts` | YES | NO | NOT_APPLICABLE |
| `worker.ts` | YES | NO | NOT_APPLICABLE |
| `scheduler.ts` | YES | NO | NOT_APPLICABLE |
| `fastify()` | YES | NO | NOT_APPLICABLE |
| `createServer()` | YES | NO | NOT_APPLICABLE |

---

### BOOTSTRAP GRAPH

```
npm run dev
    ↓
ts-node src/server.ts
    ↓
express()
    ↓
app.use(express.json())
    ↓
app.post("/kernel/commit", commitArtifact)
    ↓
app.get("/kernel/audit", auditArtifacts)
    ↓
app.listen(8080)
    ↓
"CRX kernel running on 8080"
```

---

### HTTP Endpoints

| METHOD | PATH | CONTROLLER | FUNCTION | STATUS |
|--------|------|------------|----------|--------|
| POST | /kernel/commit | commit_controller.ts | commitArtifact | VERIFIED_RUNTIME_TRUTH |
| GET | /kernel/audit | audit_controller.ts | auditArtifacts | VERIFIED_RUNTIME_TRUTH |

---

### COMMIT PATH FORENSICS

**POST /kernel/commit Execution Path:**

```
HTTP Request
    ↓
commit_controller.ts:commitArtifact()
    ↓
identity_engine.ts:computeCanonicalHash(artifact)
    ↓
canonical_engine.ts:canonicalize(input)
    ↓
dag_validator.ts:validateLineage(parentIds, artifactId)
    ↓
artifact_store.ts:storeArtifact(artifactId, artifact)
    ↓
lineage_store.ts:storeLineage(parentIds, artifactId)
    ↓
event_log.ts:logEvent("artifact_commit", { artifactId })
    ↓
db.ts:pool (PostgreSQL via DATABASE_URL)
    ↓
Response: { accepted: true, artifact_id: artifactId }
```

**AUTHORITY OWNERSHIP BY STAGE:**

| STAGE | FILE | FUNCTION | AUTHORITY |
|-------|------|----------|-----------|
| Transport | server.ts | express() | Orchestration |
| Validation | commit_controller.ts | Request parsing | Orchestration |
| Canonicalization | canonical_engine.ts | canonicalize() | Canonicalization |
| Identity | identity_engine.ts | computeCanonicalHash() | Identity |
| Lineage Validation | dag_validator.ts | validateLineage() | Lineage |
| Persistence | artifact_store.ts | storeArtifact() | Persistence |
| Persistence | lineage_store.ts | storeLineage() | Persistence |
| Event Recording | event_log.ts | logEvent() | Event Recording |
| Database | db.ts | pool | Persistence |

---

### CRITICAL FINDINGS

1. **SINGLE VERIFIED ENTRYPOINT:** Only `runtime/kernel/commit-service/src/server.ts` is verified as reachable runtime truth.

2. **NO WORKER/SCHEDULER:** No worker.ts or scheduler.ts files exist. These are specified as required in AGENT.md but not implemented.

3. **BROKEN AGENTS COMPOSE:** `agents/docker-compose.yml` references non-existent directories (`authoritative/`, `derived/`, `experimental/` in agents/ context). These exist in `knowledge/` instead.

4. **EXTERNAL POSTGRES DEPENDENCY:** Runtime requires external PostgreSQL via `DATABASE_URL` environment variable. No local postgres container defined.

5. **NO DOCKER CMD TARGETS:** No Dockerfile exists for runtime commit-service. Only agent Dockerfiles exist (broken).

6. **EXPRESS ONLY:** No Fastify, no createServer (http), only express().

---

### REACHABILITY ANALYSIS

**CAN BOOT:**
- ✅ `npm run dev` in `runtime/kernel/commit-service/` (if DATABASE_URL set and PostgreSQL running)

**CANNOT BOOT:**
- ❌ `docker-compose up` in `agents/` (missing directories, missing code)
- ❌ Any worker process (no worker.ts exists)
- ❌ Any scheduler process (no scheduler.ts exists)
- ❌ Full infrastructure stack (no infra/docker-compose.yml exists)

---

### IMPORT GRAPH COMPLETENESS

**COMPLETE IMPORT CHAIN:**
```
server.ts → commit_controller.ts → identity_engine.ts → canonical_engine.ts ✓
server.ts → commit_controller.ts → dag_validator.ts ✓
server.ts → commit_controller.ts → artifact_store.ts ✓
server.ts → commit_controller.ts → lineage_store.ts ✓
server.ts → commit_controller.ts → event_log.ts ✓
server.ts → commit_controller.ts → logger.ts ✓
server.ts → audit_controller.ts ✓
```

**ALL IMPORTS RESOLVE:** Yes, all referenced files exist and are non-empty.

---

### FINAL CLASSIFICATION

**VERIFIED_RUNTIME_TRUTH:** 2 files
- `runtime/kernel/commit-service/src/server.ts`
- `runtime/kernel/commit-service/package.json`

**SHADOW_RUNTIME:** 1 file
- `agents/docker-compose.yml` (broken - missing code/dirs)

**HIGH_CONFIDENCE_DEAD:** 0 files

**GENERATED_NOT_IMPLEMENTED:** 0 files

**UNVERIFIED:** 0 files
