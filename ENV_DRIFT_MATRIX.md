# ENVIRONMENT VARIABLE DRIFT MATRIX

**Repository**: CRX (Constitutional Runtime eXtension)
**Analysis Date**: 2026-06-13
**Phase**: PHASE 5 — ENVIRONMENT VARIABLE DRIFT

---

## EXECUTIVE SUMMARY

**.env Files Found**: 0
**Environment Variables Defined in Code**: 10
**Environment Variables Consumed at Runtime**: 3
**Environment Variables Defined but Not Consumed**: 7
**Environment Variables Referenced in Config Only**: 0 (no .env files)

**Drift Assessment**: MODERATE
- Gateway uses 3 env vars (all consumed)
- Commit-service uses 1 env var (consumed)
- Config adapter defines 5 env vars (adapter never used, so env vars never consumed)
- Worker YAML files reference infrastructure env vars (not implemented)

---

## ENVIRONMENT VARIABLE INVENTORY

### DEFINED AND CONSUMED

#### OLLAMA_URL
**Location**: gateway/server.js line 6-7
**Default**: 'http://crx-ollama:11434'
**Consumed By**: gateway/server.js (line 20)
**Purpose**: Ollama API endpoint
**Status**: CONSUMED
**Classification**: ACTIVE

**Evidence**:
```javascript
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://crx-ollama:11434';
// Used in:
const response = await fetch(`${OLLAMA_URL}/api/chat`, {...})
```

---

#### OLLAMA_MODEL
**Location**: gateway/server.js line 9-10
**Default**: 'qwen2.5-coder:14b'
**Consumed By**: gateway/server.js (line 27)
**Purpose**: Ollama model name
**Status**: CONSUMED
**Classification**: ACTIVE

**Evidence**:
```javascript
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b';
// Used in:
body: JSON.stringify({
  model: OLLAMA_MODEL,
  ...
})
```

---

#### PORT
**Location**: gateway/server.js line 102
**Default**: 8080
**Consumed By**: gateway/server.js (line 103)
**Purpose**: Gateway HTTP server port
**Status**: CONSUMED
**Classification**: ACTIVE

**Evidence**:
```javascript
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {...})
```

---

#### DATABASE_URL
**Location**: runtime/kernel/commit-service/src/persistence/db.ts line 10
**Default**: '' (empty string)
**Consumed By**: runtime/kernel/commit-service/src/persistence/db.ts (line 10)
**Purpose**: PostgreSQL connection string
**Status**: CONSUMED
**Classification**: ACTIVE

**Evidence**:
```typescript
export const pool = createPool(process.env.DATABASE_URL || '')
// Used by:
// - artifact_store.ts
// - lineage_store.ts
// - event_log.ts
```

**Risk**: HIGH - Default is empty string, will fail if not set

---

### DEFINED BUT NOT CONSUMED

#### CANONICALIZATION_VERSION
**Location**: runtime/adapters/config_adapter.ts line 39-40
**Default**: '1.0'
**Consumed By**: runtime/adapters/config_adapter.ts (line 40)
**Purpose**: Canonicalization version configuration
**Status**: NOT CONSUMED (adapter never used)
**Classification**: SHADOW

**Evidence**:
```typescript
if (process.env.CANONICALIZATION_VERSION) {
  this.setConfig('canonicalization_version', process.env.CANONICALIZATION_VERSION);
}
```

**Issue**: config_adapter.ts is never imported by any executing service

---

#### HASH_ALGORITHM
**Location**: runtime/adapters/config_adapter.ts line 42-43
**Default**: 'sha256'
**Consumed By**: runtime/adapters/config_adapter.ts (line 43)
**Purpose**: Hash algorithm configuration
**Status**: NOT CONSUMED (adapter never used)
**Classification**: SHADOW

**Evidence**:
```typescript
if (process.env.HASH_ALGORITHM) {
  this.setConfig('hash_algorithm', process.env.HASH_ALGORITHM);
}
```

**Issue**: config_adapter.ts is never imported by any executing service

---

#### HASH_VERSION
**Location**: runtime/adapters/config_adapter.ts line 45-46
**Default**: '1.0'
**Consumed By**: runtime/adapters/config_adapter.ts (line 46)
**Purpose**: Hash version configuration
**Status**: NOT CONSUMED (adapter never used)
**Classification**: SHADOW

**Evidence**:
```typescript
if (process.env.HASH_VERSION) {
  this.setConfig('hash_version', process.env.HASH_VERSION);
}
```

**Issue**: config_adapter.ts is never imported by any executing service

---

#### REPLAY_VERSION
**Location**: runtime/adapters/config_adapter.ts line 48-49
**Default**: '1.0'
**Consumed By**: runtime/adapters/config_adapter.ts (line 49)
**Purpose**: Replay version configuration
**Status**: NOT CONSUMED (adapter never used)
**Classification**: SHADOW

**Evidence**:
```typescript
if (process.env.REPLAY_VERSION) {
  this.setConfig('replay_version', process.env.REPLAY_VERSION);
}
```

**Issue**: config_adapter.ts is never imported by any executing service

---

#### POLICY_VERSION
**Location**: runtime/adapters/config_adapter.ts line 51-52
**Default**: '1.0'
**Consumed By**: runtime/adapters/config_adapter.ts (line 52)
**Purpose**: Policy version configuration
**Status**: NOT CONSUMED (adapter never used)
**Classification**: SHADOW

**Evidence**:
```typescript
if (process.env.POLICY_VERSION) {
  this.setConfig('policy_version', process.env.POLICY_VERSION);
}
```

**Issue**: config_adapter.ts is never imported by any executing service

---

### REFERENCED IN CONFIGURATION ONLY (NOT IMPLEMENTED)

#### Redis Configuration
**Location**: All worker YAML files
**Variables**: REDIS_HOST, REDIS_PORT (implied)
**Status**: NOT IMPLEMENTED
**Classification**: THEATER

**Evidence**:
```yaml
message_queue:
  type: redis
  host: localhost
  port: 6379
```

**Issue**: Redis is never implemented. No Redis client library is installed.

---

#### Neo4j Configuration
**Location**: workers/graph-worker.yaml
**Variables**: NEO4J_HOST, NEO4J_PORT (implied)
**Status**: NOT IMPLEMENTED
**Classification**: THEATER

**Evidence**:
```yaml
graph:
  type: neo4j
  host: localhost
  port: 7687
  database: crx
```

**Issue**: Neo4j is never implemented. No Neo4j client library is installed.

---

#### Ollama Worker Configuration
**Location**: workers/ollama-worker.yaml
**Variables**: OLLAMA_HOST, OLLAMA_PORT (implied)
**Status**: NOT IMPLEMENTED
**Classification**: THEATER

**Evidence**:
```yaml
ollama:
  host: 0.0.0.0
  port: 11434
```

**Issue**: Ollama worker is never implemented. Ollama is accessed directly from gateway.

---

### HARDCODED VALUES (SHOULD BE ENV VARS)

#### Gateway URL in Next.js UI
**Location**: CascadeProjects/infra/ui-next/src/app/chat/page.tsx line 33
**Value**: 'http://localhost:8080'
**Status**: HARDCODED
**Classification**: RISKY

**Evidence**:
```typescript
const response = await fetch('http://localhost:8080/api/v1/chat', {...})
```

**Issue**: Hardcoded localhost URL won't work in containerized deployment. Should be NEXT_PUBLIC_GATEWAY_URL.

---

#### NODE_ENV in Dockerfiles
**Location**: gateway/Dockerfile, CascadeProjects/infra/ui-next/Dockerfile
**Value**: 'production'
**Status**: HARDCODED
**Classification**: ACCEPTABLE

**Evidence**:
```dockerfile
ENV NODE_ENV=production
```

**Issue**: Acceptable for production Dockerfiles, but could be configurable.

---

## .ENV FILE AUDIT

### Root Directory
**.env**: NOT FOUND
**.env.example**: NOT FOUND
**.env.local**: NOT FOUND
**.env.production**: NOT FOUND

**Status**: MISSING

**Impact**: No template for required environment variables. Developers must infer required env vars from code.

---

### Gateway Directory
**.env**: NOT FOUND
**.env.example**: NOT FOUND

**Status**: MISSING

---

### Commit Service Directory
**.env**: NOT FOUND
**.env.example**: NOT FOUND

**Status**: MISSING

---

### Next.js UI Directory
**.env**: NOT FOUND
**.env.local**: NOT FOUND
**.env.example**: NOT FOUND

**Status**: MISSING

---

## COMPOSE ENV VAR AUDIT

### Docker Compose Files
**Status**: NONE FOUND

**Impact**: No docker-compose files to define environment variables for containerized deployment.

---

## NEXT PUBLIC ENV VAR AUDIT

### Next.js UI
**NEXT_PUBLIC_** Prefix Variables**: NONE FOUND

**Status**: MISSING

**Impact**: No way to configure client-side environment variables in Next.js UI.

---

## DOCKER ARG AUDIT

### Dockerfile: Gateway
**ARG Variables**: NONE FOUND

**Status**: NONE

---

### Dockerfile: Next.js UI
**ARG Variables**: NONE FOUND

**Status**: NONE

---

## ENVIRONMENT VARIABLE DRIFT MATRIX

| Variable | Defined | Consumed | Location | Status | Classification |
|----------|---------|----------|----------|--------|----------------|
| OLLAMA_URL | YES | YES | gateway/server.js | ACTIVE | CONSUMED |
| OLLAMA_MODEL | YES | YES | gateway/server.js | ACTIVE | CONSUMED |
| PORT | YES | YES | gateway/server.js | ACTIVE | CONSUMED |
| DATABASE_URL | YES | YES | commit-service/db.ts | ACTIVE | CONSUMED |
| CANONICALIZATION_VERSION | YES | NO | config_adapter.ts | SHADOW | NOT CONSUMED |
| HASH_ALGORITHM | YES | NO | config_adapter.ts | SHADOW | NOT CONSUMED |
| HASH_VERSION | YES | NO | config_adapter.ts | SHADOW | NOT CONSUMED |
| REPLAY_VERSION | YES | NO | config_adapter.ts | SHADOW | NOT CONSUMED |
| POLICY_VERSION | YES | NO | config_adapter.ts | SHADOW | NOT CONSUMED |
| REDIS_HOST | NO | NO | worker YAMLs | THEATER | NOT IMPLEMENTED |
| REDIS_PORT | NO | NO | worker YAMLs | THEATER | NOT IMPLEMENTED |
| NEO4J_HOST | NO | NO | graph-worker.yaml | THEATER | NOT IMPLEMENTED |
| NEO4J_PORT | NO | NO | graph-worker.yaml | THEATER | NOT IMPLEMENTED |
| NEXT_PUBLIC_GATEWAY_URL | NO | NO | (should exist) | MISSING | NOT DEFINED |

---

## SPECIAL ATTENTION VARIABLES

### OLLAMA_URL vs OLLAMA_BASE_URL
**OLLAMA_URL**: Used in gateway/server.js
**OLLAMA_BASE_URL**: NOT FOUND

**Status**: CONSISTENT (only OLLAMA_URL is used)

---

### GATEWAY_URL
**Status**: NOT DEFINED (should be NEXT_PUBLIC_GATEWAY_URL for Next.js UI)

**Impact**: Next.js UI hardcodes localhost:8080, which won't work in containerized deployment.

---

### NEXT_PUBLIC_ Variables
**Status**: NONE FOUND

**Impact**: No client-side configuration for Next.js UI.

---

### POSTGRES_ Variables
**DATABASE_URL**: Used in commit-service
**POSTGRES_HOST**: NOT FOUND
**POSTGRES_PORT**: NOT FOUND
**POSTGRES_USER**: NOT FOUND
**POSTGRES_PASSWORD**: NOT FOUND
**POSTGRES_DB**: NOT FOUND

**Status**: Uses connection string pattern (DATABASE_URL) instead of individual variables.

**Classification**: ACCEPTABLE (standard pattern)

---

### REDIS_ Variables
**Status**: NOT IMPLEMENTED (referenced in worker YAMLs only)

**Classification**: THEATER

---

## MISMATCHED VARIABLES

### Gateway URL
**Expected**: NEXT_PUBLIC_GATEWAY_URL
**Actual**: Hardcoded 'http://localhost:8080' in Next.js UI

**Status**: MISMATCHED

**Risk**: Deployment failure in containerized environments

---

## SHADOWED VARIABLES

### Config Adapter Variables (5 variables)
**Variables**: CANONICALIZATION_VERSION, HASH_ALGORITHM, HASH_VERSION, REPLAY_VERSION, POLICY_VERSION

**Status**: SHADOWED (defined in code that is never executed)

**Impact**: These variables appear to be part of an abandoned adapter pattern architecture.

---

## UNUSED VARIABLES

### All Config Adapter Variables (5 variables)
**Status**: UNUSED (adapter never imported)

**Recommendation**: Remove config_adapter.ts or integrate it into the actual runtime.

---

## SUMMARY

**Environment Variables Defined**: 10
**Environment Variables Consumed**: 4 (PORT, OLLAMA_URL, OLLAMA_MODEL, DATABASE_URL)
**Environment Variables Shadowed**: 5 (config_adapter.ts variables)
**Environment Variables Theater**: 4 (Redis, Neo4j from worker YAMLs)
**Environment Variables Missing**: 1 (NEXT_PUBLIC_GATEWAY_URL)

**Drift Assessment**: MODERATE

**Key Issues**:
1. No .env files or .env.example files exist
2. Next.js UI hardcodes gateway URL (should use NEXT_PUBLIC_GATEWAY_URL)
3. Config adapter defines 5 env vars that are never consumed (adapter never used)
4. Worker YAML files reference infrastructure env vars that were never implemented
5. DATABASE_URL has empty default (high risk if not set)

**Recommendations**:
1. Create .env.example files for each service
2. Add NEXT_PUBLIC_GATEWAY_URL to Next.js UI configuration
3. Remove or integrate config_adapter.ts
4. Archive worker YAML files (describe non-existent infrastructure)
5. Add validation for DATABASE_URL in commit-service
