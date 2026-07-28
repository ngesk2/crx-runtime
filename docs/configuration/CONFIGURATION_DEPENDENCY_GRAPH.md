# Configuration Dependency Graph

**Date:** 2026-06-25
**Scope:** PING Cognitive Operating System
**Objective:** Document all configuration dependencies and data flow

---

## PostgreSQL Configuration Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Configuration                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Sources:                                                   │
│  - .env.example (POSTGRES_*)                                │
│  - docker-compose-mission-control.yml (POSTGRES_*)          │
│  - docker-compose.yml (POSTGRES_*)                          │
│  - generate_secrets.py (POSTGRES_*)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers (Direct os.getenv):                              │
│  - observation_worker.py (get_postgres_config)             │
│  - claim_worker.py (get_postgres_config)                    │
│  - replay_worker.py (get_postgres_config)                   │
│  - witness_worker.py (get_postgres_config)                  │
│  - lineage_worker.py (get_postgres_config)                  │
│  - constitutional_runtime.py (get_postgres_config)          │
│  - repository_scanner.py (postgres_config dict)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SecretAdapter (Not Currently Used):                        │
│  - secret_adapter.get_postgres_config()                     │
│  - Falls back to environment variables                      │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** 6 identical `get_postgres_config()` functions across workers

**Recommendation:** Consolidate into shared configuration module

---

## Qdrant Configuration Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Qdrant Configuration                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Sources:                                                   │
│  - .env.example (QDRANT_*)                                  │
│  - docker-compose-mission-control.yml (QDRANT_*)            │
│    ⚠️ HARDCODED API KEY                                     │
│  - docker-compose.yml (QDRANT__SERVICE__API_KEY)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers (Mixed Patterns):                                │
│                                                              │
│  Pattern 1 - SecretAdapter:                                  │
│  - qdrant_projection_worker.py                              │
│    - secret_adapter.get_qdrant_key()                        │
│    - os.getenv('QDRANT_URL')                                │
│                                                              │
│  Pattern 2 - Direct Environment:                            │
│  - retrieval_service.py                                     │
│    - os.getenv('QDRANT_URL')                                │
│    - os.getenv('QDRANT_API_KEY')                            │
│                                                              │
│  Pattern 3 - Docker Compose:                               │
│  - docker-compose-mission-control.yml                        │
│    - environment: QDRANT_API_KEY (hardcoded)                 │
│  - docker-compose.yml                                        │
│    - environment: QDRANT__SERVICE__API_KEY                    │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Inconsistent access patterns, hardcoded credentials

**Recommendation:** Standardize on SecretAdapter for all Qdrant access

---

## Ollama Configuration Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                     Ollama Configuration                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Sources:                                                   │
│  - .env.example (OLLAMA_*)                                  │
│  - docker-compose-mission-control.yml (OLLAMA_BASE_URL)     │
│  - docker-compose.yml (rss) (OLLAMA_BASE_URL)               │
│  - generate_secrets.py (OLLAMA_HOST)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers:                                                 │
│  - mission-control (docker-compose-mission-control.yml)     │
│  - open-webui (docker-compose-mission-control.yml)          │
│  - rss worker (docker-compose.yml)                           │
│  - runtime (EMBED_MODEL)                                    │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Multiple variable names (OLLAMA_BASE_URL, OLLAMA_HOST, INFERENCE_BASE_URL)

**Recommendation:** Standardize on OLLAMA_BASE_URL

---

## Google Drive Configuration Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                 Google Drive Configuration                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Sources:                                                   │
│  - config.yaml (credentials path)                           │
│  - .env.example (GOOGLE_*)                                  │
│  - credentials/client_secret.json (actual credentials)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers:                                                 │
│  - Runtime (GOOGLE_DRIVE_ENABLED, GOOGLE_DRIVE_ROOT)         │
│  - Google Drive adapters                                    │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Configuration split across YAML and environment

**Recommendation:** Consolidate to environment variables only

---

## SecretAdapter Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      SecretAdapter                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Configuration:                                            │
│  - VAULT_URL                                                │
│  - VAULT_ROLE_ID                                            │
│  - VAULT_SECRET_ID                                          │
│  - VAULT_TOKEN                                              │
│  - VAULT_MOUNT_POINT                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Methods:                                                   │
│  - get_openai_key()                                         │
│  - get_anthropic_key()                                      │
│  - get_google_api_key()                                     │
│  - get_postgres_password()                                  │
│  - get_postgres_config()                                    │
│  - get_qdrant_key()                                         │
│  - get_jwt_signing_key()                                    │
│  - get_google_drive_secret()                                │
│  - get_secret(path, key)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Fallback (Development):                                     │
│  - Maps to environment variables if Vault unavailable        │
│  - Temporary for migration                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Current Consumers:                                         │
│  - qdrant_projection_worker.py ✅                           │
│                                                              │
│  Non-Consumers (Should Use):                                │
│  - retrieval_service.py ❌                                   │
│  - observation_worker.py ❌                                  │
│  - claim_worker.py ❌                                        │
│  - replay_worker.py ❌                                       │
│  - witness_worker.py ❌                                      │
│  - lineage_worker.py ❌                                      │
│  - constitutional_runtime.py ❌                               │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** SecretAdapter not consistently used across runtimes

**Recommendation:** Enforce SecretAdapter usage for all secret access

---

## Docker Compose Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                  Docker Compose Files                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Files:                                                     │
│  - docker-compose-mission-control.yml                        │
│  - docker-compose.yml (orchestration)                        │
│  - docker-compose.yml (newsletter)                           │
│  - docker-compose.yml (rss)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Environment Injection:                                     │
│  - Inline environment blocks                                 │
│  - env_file references                                      │
│  - ${VARIABLE} substitutions                                │
│  - Hardcoded values (⚠️)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Services:                                                  │
│  Mission Control:                                           │
│    - POSTGRES_*                                             │
│    - QDRANT_* (⚠️ hardcoded)                               │
│    - OLLAMA_BASE_URL                                         │
│    - YAHOO_*                                                │
│                                                              │
│  Orchestration:                                             │
│    - POSTGRES_*                                             │
│    - QDRANT__SERVICE__API_KEY                                │
│    - NEO4J_AUTH                                             │
│    - TEMPORAL_*                                             │
│                                                              │
│  RSS:                                                       │
│    - OLLAMA_BASE_URL (host.docker.internal)                  │
│                                                              │
│  Newsletter:                                                │
│    - env_file: .env                                         │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Configuration scattered across multiple compose files

**Recommendation:** Consolidate to single compose file with environment inheritance

---

## Service URL Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    Service URLs (.env.example)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  URLs Defined:                                             │
│  - CONSTITUTION_SERVICE_URL                                  │
│  - LEDGER_SERVICE_URL                                       │
│  - PROJECTION_SERVICE_URL                                   │
│  - REPOSITORY_RUNTIME_URL                                   │
│  - RETRIEVAL_SERVICE_URL                                    │
│  - AGENT_RUNTIME_URL                                        │
│  - SKILL_SERVICE_URL                                        │
│  - FILESYSTEM_SERVICE_URL                                   │
│  - WITNESS_SERVICE_URL                                      │
│  - REPLAY_SERVICE_URL                                       │
│  - GRAPH_SERVICE_URL                                        │
│  - MEMORY_SERVICE_URL                                       │
│  - SCHEDULER_SERVICE_URL                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers:                                                 │
│  - Runtime (service discovery)                              │
│  - Docker Compose (service references)                      │
│  - ⚠️ Some may be unused                                    │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Many service URLs defined, consumption unclear

**Recommendation:** Audit actual usage, remove unused variables

---

## Bootstrap Script Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                bootstrap.sh Dependency Graph                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Actions:                                                   │
│  1. Check prerequisites (docker, docker-compose, python3)   │
│  2. Create directory structure                              │
│  3. Generate secrets (generate_secrets.py)                  │
│  4. Generate cryptographic keys (generate_keys.py)          │
│  5. Set permissions                                          │
│  6. Initialize database schema                               │
│  7. Start services (docker-compose up)                      │
│  8. Wait for services to be ready                            │
│  9. Verify database schema                                   │
│  10. Create initial backup                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Configuration Sources:                                     │
│  - brain/config/environments/.env (generated)               │
│  - brain/infrastructure/docker/compose/.env (copied)        │
│  - brain/constitutional/canonical_state/schema.sql            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Output:                                                    │
│  - Generated .env file                                      │
│  - Running services                                          │
│  - Initialized database                                     │
│  - Initial backup                                           │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Bootstrap generates .env but path references may not match actual structure

**Recommendation:** Verify path consistency

---

## Summary

**Total Dependency Graphs:** 8
**Critical Dependencies:** PostgreSQL, Qdrant, SecretAdapter
**Configuration Sources:** 30+ files
**Consumers:** 15+ runtime components

**Key Findings:**
1. PostgreSQL configuration duplicated across 6 workers
2. Qdrant configuration has inconsistent access patterns
3. SecretAdapter not universally adopted
4. Docker compose files scattered
5. Bootstrap script path references may be inconsistent

**Next Steps:**
1. Consolidate configuration modules
2. Standardize SecretAdapter usage
3. Unify docker compose files
4. Verify bootstrap script paths
5. Remove unused service URLs
