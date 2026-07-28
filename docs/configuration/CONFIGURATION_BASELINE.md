# Configuration Baseline

**Date:** 2026-06-25
**Purpose:** Capture current configuration state before any changes
**Status:** FROZEN - This baseline must not change until Sprint 04 is complete

---

## Current Docker Compose Files

### File 1: docker-compose-mission-control.yml

**Location:** `brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml`

**Services:**
- mission-control
- postgres
- qdrant
- ollama
- openwebui

**Environment Variables Injected:**
```yaml
mission-control:
  POSTGRES_HOST: postgres
  POSTGRES_PORT: 5432
  POSTGRES_DB: crx_runtime
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  QDRANT_URL: http://qdrant:6333
  QDRANT_API_KEY: cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=  # HARDCODED
  QDRANT_COLLECTION: constitutional_memory
  OLLAMA_BASE_URL: http://ollama:11434
  INFERENCE_BASE_URL: http://ollama:11434
  YAHOO_EMAIL: ${YAHOO_EMAIL}
  YAHOO_APP_PASSWORD: ${YAHOO_APP_PASSWORD}

postgres:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  POSTGRES_DB: crx_runtime

qdrant:
  QDRANT__SERVICE__API_KEY: cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=  # HARDCODED

openwebui:
  OLLAMA_BASE_URL: http://ollama:11434
  WEBUI_SECRET_KEY: ${WEBUI_SECRET_KEY:-default-secret-key-change-in-production}
```

**Status:** Active - Used for mission control deployment

---

### File 2: docker-compose.yml (Orchestration)

**Location:** `brainos/orchestration/infrastructure/docker/compose/docker-compose.yml`

**Services:**
- postgres
- qdrant
- neo4j
- temporal
- kafka
- zookeeper

**Environment Variables Injected:**
```yaml
postgres:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}

qdrant:
  QDRANT__SERVICE__API_KEY: ""

neo4j:
  NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}

temporal:
  TEMPORAL_NAMESPACE: ${TEMPORAL_NAMESPACE:-default}
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```

**Status:** Active - Used for orchestration infrastructure

---

### File 3: docker-compose.yml (Newsletter)

**Location:** `brainos/newsletter/docker-compose.yml`

**Services:**
- worker
- dashboard

**Environment Variables Injected:**
```yaml
worker:
  env_file: .env

dashboard:
  env_file: .env
```

**Status:** Active - Used for newsletter service

---

### File 4: docker-compose.yml (RSS)

**Location:** `brainos/rss/docker-compose.yml`

**Services:**
- open-webui
- worker

**Environment Variables Injected:**
```yaml
open-webui:
  OLLAMA_BASE_URL: http://host.docker.internal:11434

worker:
  env_file: .env
```

**Status:** Active - Used for RSS service

---

## Current Environment Files

### File 1: .env.example

**Location:** Root directory

**Key Variables:**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY_PATH=C:\PING\secrets\github\github_app_private_key.pem
GITHUB_APP_WEBHOOK_SECRET=

QDRANT_URL=https://67ee96e2-58e5-4476-aa17-a6e32a1e668d.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=
QDRANT_COLLECTION=constitutional_memory

OLLAMA_BASE_URL=http://localhost:11434

REPOSITORY_ROOT=C:\PING\repositories\drive

GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_ROOT=C:\PING\repositories\drive
GOOGLE_CREDENTIALS=C:\PING\integrations\google-drive\credentials.json
GOOGLE_TOKEN=C:\PING\integrations\google-drive\token.json
```

**Status:** Template - Contains defaults and examples

---

### File 2: config.yaml

**Location:** Root directory

**Key Configuration:**
```yaml
storage:
  google_drive:
    enabled: true
    credentials: ./credentials/client_secret.json
    output_folder: Architecture Intelligence

models:
  provider: ollama
  model: qwen2.5-coder:14b
```

**Status:** Active - Used by runtime

---

## Current SecretAdapter

**Location:** `runtime/constitutional/secret_adapter.py`

**Current Implementation:**
- Vault client with AppRole authentication
- Fallback to environment variables for development
- Methods for: OpenAI, Anthropic, PostgreSQL, Qdrant, JWT, Google Drive

**Current Consumers:**
- qdrant_projection_worker.py ✅

**Non-Consumers:**
- retrieval_service.py ❌
- observation_worker.py ❌
- claim_worker.py ❌
- replay_worker.py ❌
- witness_worker.py ❌
- lineage_worker.py ❌
- constitutional_runtime.py ❌
- repository_scanner.py ❌

**Status:** Partially implemented - Not universally adopted

---

## Current Startup Scripts

### Script 1: bootstrap.sh

**Location:** `brainos/orchestration/infrastructure/docker/scripts/bootstrap.sh`

**Actions:**
1. Checks prerequisites (docker, docker-compose, python3)
2. Creates directory structure
3. Generates secrets via generate_secrets.py
4. Generates cryptographic keys
5. Sets permissions
6. Initializes database schema
7. Starts services via docker-compose
8. Waits for services to be ready
9. Verifies database schema
10. Creates initial backup

**Environment File Generated:** `brain/config/environments/.env`

**Status:** Active - Used for infrastructure bootstrap

---

### Script 2: start-mission-control.sh

**Location:** `brainos/orchestration/start-mission-control.sh`

**Actions:**
1. Checks for docker-compose-mission-control.yml
2. Checks for .env.mission-control
3. Loads environment variables
4. Starts services via docker-compose

**Environment File:** `brainos/config/environments/.env.mission-control`

**Status:** Active - Used for mission control startup

---

### Script 3: generate_secrets.py

**Location:** `brainos/orchestration/infrastructure/docker/scripts/generate_secrets.py`

**Secrets Generated:**
- POSTGRES_PASSWORD
- QDRANT_API_KEY
- NEO4J_PASSWORD
- JWT_SECRET
- ENCRYPTION_MASTER_KEY
- BACKUP_ENCRYPTION_KEY
- VAULTWARDEN_ADMIN_TOKEN

**Output File:** `brain/config/environments/.env`

**Status:** Active - Used for secret generation

---

## Current Runtime Environment

### PostgreSQL Configuration Pattern

**Duplicated across 6 files:**
- observation_worker.py
- claim_worker.py
- replay_worker.py
- witness_worker.py
- lineage_worker.py
- constitutional_runtime.py

**Pattern:**
```python
def get_postgres_config() -> Dict[str, Any]:
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres")
    }
```

**Status:** Duplicated - Needs consolidation

---

### Qdrant Configuration Pattern

**Pattern 1 - SecretAdapter (qdrant_projection_worker.py):**
```python
self.qdrant_url = os.getenv('QDRANT_URL', 'http://localhost:6333')
self.qdrant_api_key = self.secret_adapter.get_qdrant_key()
```

**Pattern 2 - Direct Environment (retrieval_service.py):**
```python
self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
self.qdrant_api_key = os.getenv("QDRANT_API_KEY")
```

**Status:** Inconsistent - Needs standardization

---

## Current Injected Variables Summary

### Database Variables
- POSTGRES_HOST (multiple values: localhost, postgres)
- POSTGRES_PORT (5432)
- POSTGRES_DB (crx_runtime, brain_db)
- POSTGRES_USER (postgres, brain_user)
- POSTGRES_PASSWORD (postgres, generated)

### Qdrant Variables
- QDRANT_URL (multiple values: localhost, qdrant, cloud endpoint)
- QDRANT_API_KEY (hardcoded in compose, empty in others)
- QDRANT_COLLECTION (constitutional_memory)
- QDRANT__SERVICE__API_KEY (hardcoded in compose)

### Ollama Variables
- OLLAMA_BASE_URL (multiple values: localhost, ollama, host.docker.internal)
- OLLAMA_HOST (ollama:11434)
- INFERENCE_BASE_URL (ollama:11434)
- OLLAMA_CHAT_MODEL (qwen3:latest)
- OLLAMA_EMBED_MODEL (nomic-embed-text)

### Google Drive Variables
- GOOGLE_DRIVE_ENABLED (true)
- GOOGLE_DRIVE_ROOT (C:\PING\repositories\drive)
- GOOGLE_CREDENTIALS (multiple paths)
- GOOGLE_TOKEN (multiple paths)

---

## Current Hardcoded Secrets

### Critical: Hardcoded Qdrant API Key

**Location:** `docker-compose-mission-control.yml:18`
**Value:** `cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=`
**Decoded:** `pozdevelopment@ping.com.au:super-secret-key-123456`

**Status:** CRITICAL SECURITY VULNERABILITY

---

## Current Configuration Sources Count

- Docker Compose Files: 4
- Environment Files: 2 (.env.example, config.yaml)
- Startup Scripts: 3
- Configuration Modules: 1 (SecretAdapter)
- Duplicated Configuration Functions: 6 (PostgreSQL)
- Hardcoded Secrets: 1 (Qdrant API key)

---

## Current Deployment State

### Active Deployments
- Mission Control (docker-compose-mission-control.yml)
- Orchestration Infrastructure (docker-compose.yml)
- Newsletter Service (docker-compose.yml)
- RSS Service (docker-compose.yml)

### Environment Contexts
- Local Development (localhost)
- Docker (container names)
- Production (cloud endpoint - defined but not consistently used)

---

## Baseline Validation

### Platform Deployable: YES
- All compose files valid
- All environment files valid
- All scripts functional
- SecretAdapter operational

### Security Status: VULNERABLE
- Hardcoded Qdrant API key in source
- SecretAdapter not universally used
- Credentials in multiple locations

### Configuration Status: DRIFT
- Duplicated PostgreSQL configuration
- Inconsistent endpoint values
- Multiple compose files
- Scattered environment definitions

---

## Rollback Information

### Git Commit Before Baseline
**Commit:** `docs(configuration): complete configuration audit and consolidation plan`
**Hash:** `2a83680`

### Files to Preserve for Rollback
- All docker-compose.yml files
- .env.example
- config.yaml
- secret_adapter.py
- All startup scripts
- All worker files with configuration

### Rollback Procedure
1. `git checkout 2a83680`
2. Restore any manually modified files
3. Verify platform deployable
4. Verify services start

---

## Next Steps After Baseline

**Priority 1:** Remove hardcoded Qdrant API key
**Priority 2:** Create canonical environment file
**Priority 3:** Standardize endpoints
**Priority 4:** Enforce SecretAdapter usage
**Priority 5:** Consolidate compose files
**Priority 6:** Remove configuration drift
**Priority 7:** Validate runtime after each phase
**Priority 8:** Generate security validation report

---

## Baseline Status

**Created:** 2026-06-25
**Frozen:** YES
**Validated:** YES
**Platform Deployable:** YES
**Ready for Sprint 04:** YES
