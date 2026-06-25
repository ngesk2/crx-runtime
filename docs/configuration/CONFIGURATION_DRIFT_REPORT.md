# Configuration Drift Report

**Date:** 2026-06-25
**Scope:** PING Cognitive Operating System
**Objective:** Identify and classify all configuration drift, duplicates, conflicts, and dead variables

---

## Critical Drift Issues

### Issue 1: Hardcoded Qdrant API Key

**Location:** `brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml:18`

**Hardcoded Value:**
```yaml
QDRANT_API_KEY: cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=
```

**Base64 Decoded:** `pozdevelopment@ping.com.au:super-secret-key-123456`

**Severity:** CRITICAL

**Impact:**
- Credential exposed in source control
- Cannot rotate without code change
- Violates secret management policy
- Security vulnerability

**Conflicts With:**
- `.env.example` (empty value)
- `docker-compose.yml` (empty value)
- SecretAdapter (expects environment variable)

**Recommendation:**
1. Remove hardcoded value immediately
2. Use `${QDRANT_API_KEY}` environment variable
3. Ensure SecretAdapter is the source of truth

---

### Issue 2: Duplicated PostgreSQL Configuration

**Locations:**
- `observation_worker.py:15-23`
- `claim_worker.py:15-23`
- `replay_worker.py:16-24`
- `witness_worker.py:16-24`
- `lineage_worker.py:15-23`
- `constitutional_runtime.py:15-23`

**Identical Code Pattern:**
```python
def get_postgres_config() -> Dict[str, Any]:
    """Get PostgreSQL configuration from environment variables"""
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres")
    }
```

**Severity:** HIGH

**Impact:**
- Code duplication (6 copies)
- Maintenance burden
- Inconsistent updates possible
- Violates DRY principle

**Conflicts With:**
- SecretAdapter `get_postgres_config()` method
- `repository_scanner.py` (uses dict directly)

**Recommendation:**
1. Create shared configuration module: `runtime/configuration.py`
2. Consolidate all `get_postgres_config()` into single function
3. Update all workers to import from shared module
4. Ensure SecretAdapter is used for password

---

### Issue 3: Inconsistent Qdrant URL Values

**Locations and Values:**
- `.env.example:14` - `https://67ee96e2-58e5-4476-aa17-a6e32a1e668d.sa-east-1-0.aws.cloud.qdrant.io`
- `docker-compose-mission-control.yml:17` - `http://qdrant:6333`
- `qdrant_projection_worker.py:75` - `http://localhost:6333` (default)
- `retrieval_service.py:18` - `http://localhost:6333` (default)

**Severity:** HIGH

**Impact:**
- Different environments use different endpoints
- Cloud endpoint in .env.example but not used in Docker
- Local development uses localhost
- Docker uses container name
- Potential connection failures

**Conflicts With:**
- No single source of truth
- Environment-specific values not isolated

**Recommendation:**
1. Define environment-specific configurations:
   - `.env.local` - Local development (localhost)
   - `.env.docker` - Docker (container names)
   - `.env.production` - Production (cloud endpoint)
2. Use appropriate file per environment
3. Document which file to use in each context

---

### Issue 4: Inconsistent Ollama URL Variable Names

**Variable Names Found:**
- `OLLAMA_BASE_URL` (docker-compose-mission-control.yml, docker-compose rss)
- `OLLAMA_HOST` (.env.example, generate_secrets.py)
- `INFERENCE_BASE_URL` (docker-compose-mission-control.yml)

**Severity:** MEDIUM

**Impact:**
- Confusion about which variable to use
- Potential misconfiguration
- Documentation inconsistency

**Conflicts With:**
- No standard naming convention
- Multiple variables for same service

**Recommendation:**
1. Standardize on `OLLAMA_BASE_URL`
2. Update all references to use single variable name
3. Remove deprecated variable names

---

### Issue 5: SecretAdapter Not Consistently Used

**Files Using SecretAdapter:**
- `qdrant_projection_worker.py` ✅

**Files Using Direct Environment Access:**
- `retrieval_service.py` ❌
- `observation_worker.py` ❌
- `claim_worker.py` ❌
- `replay_worker.py` ❌
- `witness_worker.py` ❌
- `lineage_worker.py` ❌
- `constitutional_runtime.py` ❌
- `repository_scanner.py` ❌

**Severity:** MEDIUM

**Impact:**
- Bypasses constitutional secret authority
- Inconsistent secret access patterns
- SecretAdapter fallback always used
- Vault integration not realized

**Conflicts With:**
- Constitutional architecture design
- Secret management policy

**Recommendation:**
1. Update all workers to use SecretAdapter
2. Remove direct `os.getenv()` for secrets
3. Ensure Vault is configured before migration
4. Test SecretAdapter fallback during transition

---

## Medium Drift Issues

### Issue 6: Multiple Docker Compose Files

**Files:**
- `brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml`
- `brainos/orchestration/infrastructure/docker/compose/docker-compose.yml`
- `brainos/newsletter/docker-compose.yml`
- `brainos/rss/docker-compose.yml`

**Severity:** MEDIUM

**Impact:**
- Configuration scattered across files
- No single source of truth
- Difficult to manage shared services
- Potential service name conflicts

**Conflicts With:**
- Shared service definitions (postgres, qdrant, ollama)
- Different environment variable names
- Inconsistent service networking

**Recommendation:**
1. Consolidate into single docker-compose.yml
2. Use Docker Compose profiles for different stacks
3. Share common services via external compose
4. Document service dependencies

---

### Issue 7: Google Drive Credentials in Multiple Locations

**Locations:**
- `config.yaml:4` - `credentials: ./credentials/client_secret.json`
- `.env.example:144` - `GOOGLE_CREDENTIALS=C:\PING\integrations\google-drive\credentials.json`
- `.env.example:145` - `GOOGLE_TOKEN=C:\PING\integrations\google-drive\token.json`
- `credentials/client_secret.json` - Actual credentials file

**Severity:** MEDIUM

**Impact:**
- Configuration duplication
- Unclear which source is authoritative
- Path inconsistencies
- Potential for misconfiguration

**Conflicts With:**
- YAML configuration vs environment variables
- Different path references

**Recommendation:**
1. Choose single source (environment variables)
2. Remove YAML configuration for credentials
3. Standardize path references
4. Document credential location

---

## Low Drift Issues

### Issue 8: Potentially Unused Service URLs

**Variables in `.env.example` (May Be Unused):**
- `CONSTITUTION_SERVICE_URL`
- `LEDGER_SERVICE_URL`
- `PROJECTION_SERVICE_URL`
- `REPOSITORY_RUNTIME_URL`
- `RETRIEVAL_SERVICE_URL`
- `AGENT_RUNTIME_URL`
- `SKILL_SERVICE_URL`
- `FILESYSTEM_SERVICE_URL`
- `WITNESS_SERVICE_URL`
- `REPLAY_SERVICE_URL`
- `GRAPH_SERVICE_URL`
- `MEMORY_SERVICE_URL`
- `SCHEDULER_SERVICE_URL`

**Severity:** LOW

**Impact:**
- Configuration bloat
- Potential confusion
- Unused variables

**Conflicts With:**
- None (just unused)

**Recommendation:**
1. Audit actual usage in codebase
2. Remove unused variables
3. Keep only actively used URLs

---

## Dead Variables

### Variables Defined But Not Referenced

**In `.env.example:`
- `ARTIFACT_SCHEMA_VERSION`
- `ARTIFACT_COLLECTION`
- `ARTIFACT_NAMESPACE`
- `ARTIFACT_CACHE_TTL`
- `ARTIFACT_MAX_SIZE_MB`
- `ARTIFACT_COMPRESSION`
- `ARTIFACT_STORAGE_BACKEND`
- `CONSTITUTION_VERSION`
- `CONSTITUTION_NAMESPACE`
- `AUTHORITY_ENGINE`
- `AUTHORITY_CACHE_TTL`
- `AUTHORITY_MAX_DEPTH`
- `WITNESS_HASH_ALGORITHM`
- `REPLAY_MAX_DEPTH`
- `REPLAY_BATCH_SIZE`
- `PROJECTION_BATCH_SIZE`
- `EVENT_SCHEMA_VERSION`
- `EVENT_RETENTION_DAYS`
- `EVENT_BATCH_SIZE`
- `EVENT_MAX_PAYLOAD_MB`
- `EVENT_COMPRESSION`
- `EVENT_SIGNATURES`
- `LEDGER_HASH_ALGORITHM`
- `LEDGER_APPEND_ONLY`
- `LEDGER_VERIFY_ON_STARTUP`
- `RETRIEVAL_TOP_K`
- `RETRIEVAL_MAX_RESULTS`
- `CONTEXT_PACK_MAX_TOKENS`
- `CONTEXT_PACK_MAX_CITATIONS`
- `LINEAGE_MAX_DEPTH`
- `AUTHORITY_MAX_DEPTH` (duplicate)
- `GRAPH_MAX_DEPTH`
- `QDRANT_COLLECTION_CONSTITUTION`
- `QDRANT_COLLECTION_ARTIFACTS`
- `QDRANT_COLLECTION_CODE`
- `QDRANT_COLLECTION_EVENTS`
- `QDRANT_COLLECTION_OBSERVATIONS`
- `QDRANT_DISTANCE`
- `QDRANT_EMBEDDING_DIMENSIONS`
- `QDRANT_SNAPSHOT_INTERVAL`
- `QDRANT_PAYLOAD_INDEXING`
- `OLLAMA_CONTEXT_LENGTH`
- `OLLAMA_PARALLEL_REQUESTS`
- `OLLAMA_GPU_LAYERS`
- `OLLAMA_KEEP_ALIVE`
- `OLLAMA_ENABLE_TOOLS`
- `OLLAMA_ENABLE_STRUCTURED_OUTPUT`
- `REPOSITORY_SYMBOL_COLLECTION`
- `REPOSITORY_RELATIONSHIP_COLLECTION`
- `REPOSITORY_INCREMENTAL_INDEX`
- `REPOSITORY_MAX_FILE_MB`
- `REPOSITORY_GRAPH_DEPTH`
- `GRAPH_MAX_NEIGHBORS`
- `GRAPH_TRAVERSAL_DEPTH`
- `GRAPH_CACHE_TTL`
- `AGENT_MAX_CONCURRENT`
- `AGENT_DEFAULT_TIMEOUT`
- `AGENT_MEMORY_LIMIT_MB`
- `AGENT_AUTHORITY_ENFORCEMENT`
- `AGENT_REQUIRE_WITNESS`
- `SKILL_REGISTRY_VERSION`
- `SKILL_CACHE_TTL`
- `FILESYSTEM_INDEX_BATCH`
- `FILESYSTEM_WATCH_DEBOUNCE_MS`
- `FILESYSTEM_HASH_ALGORITHM`
- `OBJECT_STORE_PROVIDER`
- `OBJECT_STORE_ROOT`
- `OBJECT_RETENTION_DAYS`
- `OBJECT_HASH_ALGORITHM`
- `OBJECT_COMPRESSION`
- `MEMORY_CACHE_SIZE_MB`
- `MEMORY_VECTOR_BACKEND`
- `MEMORY_GRAPH_BACKEND`
- `MEMORY_AUTHORITY_BACKEND`
- `CRON_TIMEZONE`
- `WORKER_HEARTBEAT_SECONDS`

**Severity:** LOW

**Impact:**
- Configuration bloat
- Confusion about active configuration
- Maintenance burden

**Recommendation:**
1. Audit actual usage
2. Remove unused variables
3. Keep only actively used configuration

---

## Summary

**Critical Issues:** 5
**Medium Issues:** 3
**Low Issues:** 1
**Dead Variables:** 70+

**Drift Categories:**
1. **Hardcoded Credentials:** 1 (CRITICAL)
2. **Code Duplication:** 1 (HIGH)
3. **Inconsistent Values:** 2 (HIGH, MEDIUM)
4. **Inconsistent Patterns:** 1 (MEDIUM)
5. **Scattered Configuration:** 2 (MEDIUM)
6. **Unused Configuration:** 1 (LOW)
7. **Dead Variables:** 70+ (LOW)

**Immediate Actions Required:**
1. Remove hardcoded Qdrant API key
2. Consolidate PostgreSQL configuration
3. Standardize Qdrant URL per environment
4. Standardize Ollama variable name
5. Enforce SecretAdapter usage

**Follow-up Actions:**
1. Consolidate docker-compose files
2. Standardize Google Drive credentials
3. Remove unused service URLs
4. Remove dead variables

**Estimated Effort:**
- Critical issues: 4 hours
- Medium issues: 6 hours
- Low issues: 2 hours
- Total: 12 hours
