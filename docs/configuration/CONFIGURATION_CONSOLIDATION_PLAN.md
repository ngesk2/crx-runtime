# Configuration Consolidation Plan

**Date:** 2026-06-25
**Scope:** PING Cognitive Operating System
**Objective:** Establish single constitutional configuration hierarchy

---

## Target Architecture

### Constitutional Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│              Credential Store (HashiCorp Vault)              │
│                    (Single Source of Truth)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SecretAdapter                              │
│              (Constitutional Authority Layer)                 │
│         All secret access flows through SecretAdapter        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Canonical Environment Files                      │
│  - .env.example (template with defaults)                    │
│  - .env.local (local development)                            │
│  - .env.docker (docker environment)                          │
│  - .env.production (production)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Docker Compose                               │
│         Inherits from canonical environment files              │
│         No hardcoded credentials or endpoints                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Runtime                                  │
│         Consumes configuration through SecretAdapter          │
│         No runtime defines configuration locally               │
└─────────────────────────────────────────────────────────────┘
```

### Forbidden Patterns

❌ Runtime defines configuration locally
❌ Hardcoded credentials in source
❌ Hardcoded endpoints in source
❌ Direct `os.getenv()` for secrets
❌ Duplicate configuration functions
❌ Multiple environment files with same variables
❌ Docker compose with inline environment blocks
❌ Configuration scattered across multiple files

### Required Patterns

✅ All secrets through SecretAdapter
✅ Single canonical environment file per environment
✅ Docker compose uses env_file references
✅ Runtime imports from shared configuration module
✅ No configuration duplication
✅ Clear source of truth for every variable

---

## Phase 1: Critical Security Fixes

### 1.1 Remove Hardcoded Qdrant API Key

**File:** `brainos/orchestration/infrastructure/docker/compose/docker-compose-mission-control.yml`

**Current:**
```yaml
environment:
  QDRANT_API_KEY: cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=
```

**Target:**
```yaml
environment:
  QDRANT_API_KEY: ${QDRANT_API_KEY}
```

**Action:**
1. Replace hardcoded value with `${QDRANT_API_KEY}`
2. Ensure `.env.docker` defines `QDRANT_API_KEY`
3. Ensure SecretAdapter can access `QDRANT_API_KEY`
4. Verify no other hardcoded credentials exist

**Priority:** CRITICAL
**Effort:** 15 minutes

---

### 1.2 Consolidate PostgreSQL Configuration

**Create:** `runtime/configuration.py`

```python
"""
Shared Configuration Module

Constitutional: Single source of truth for all runtime configuration.
All configuration flows through this module.
"""

import os
from typing import Dict, Any
from pathlib import Path

# Add constitutional path for SecretAdapter
import sys
sys.path.append(str(Path(__file__).parent / 'constitutional'))
from secret_adapter import get_secret_adapter


class Configuration:
    """Constitutional configuration class."""
    
    def __init__(self):
        self.secret_adapter = get_secret_adapter()
    
    def get_postgres_config(self) -> Dict[str, Any]:
        """Get PostgreSQL configuration."""
        return {
            "host": os.getenv("POSTGRES_HOST", "localhost"),
            "port": int(os.getenv("POSTGRES_PORT", "5432")),
            "database": os.getenv("POSTGRES_DB", "crx_runtime"),
            "user": os.getenv("POSTGRES_USER", "postgres"),
            "password": self.secret_adapter.get_postgres_password() or os.getenv("POSTGRES_PASSWORD", "postgres")
        }
    
    def get_qdrant_config(self) -> Dict[str, Any]:
        """Get Qdrant configuration."""
        return {
            "url": os.getenv("QDRANT_URL", "http://localhost:6333"),
            "api_key": self.secret_adapter.get_qdrant_key() or os.getenv("QDRANT_API_KEY"),
            "collection": os.getenv("QDRANT_COLLECTION", "constitutional_memory")
        }
    
    def get_ollama_config(self) -> Dict[str, Any]:
        """Get Ollama configuration."""
        return {
            "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            "chat_model": os.getenv("OLLAMA_CHAT_MODEL", "qwen3:latest"),
            "embed_model": os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        }


# Global configuration instance
_configuration: Configuration = None


def get_configuration() -> Configuration:
    """Get global configuration instance."""
    global _configuration
    if _configuration is None:
        _configuration = Configuration()
    return _configuration
```

**Update Files:**
- `observation_worker.py`
- `claim_worker.py`
- `replay_worker.py`
- `witness_worker.py`
- `lineage_worker.py`
- `constitutional_runtime.py`
- `repository_scanner.py`

**Pattern:**
```python
from runtime.configuration import get_configuration

config = get_configuration()
postgres_config = config.get_postgres_config()
```

**Priority:** HIGH
**Effort:** 2 hours

---

## Phase 2: Environment Standardization

### 2.1 Create Environment-Specific Files

**Create:** `.env.local` (Local Development)
```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=constitutional_memory

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:latest
OLLAMA_EMBED_MODEL=nomic-embed-text

# Repository
REPOSITORY_ROOT=C:\PING\repositories\drive
```

**Create:** `.env.docker` (Docker Environment)
```env
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=constitutional_memory

# Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=qwen3:latest
OLLAMA_EMBED_MODEL=nomic-embed-text

# Repository
REPOSITORY_ROOT=/workspace/repositories/drive
```

**Create:** `.env.production` (Production)
```env
# PostgreSQL
POSTGRES_HOST=${POSTGRES_HOST}
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Qdrant
QDRANT_URL=https://67ee96e2-58e5-4476-aa17-a6e32a1e668d.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=${QDRANT_API_KEY}
QDRANT_COLLECTION=constitutional_memory

# Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=qwen3:latest
OLLAMA_EMBED_MODEL=nomic-embed-text

# Repository
REPOSITORY_ROOT=/workspace/repositories/drive
```

**Update:** `.gitignore`
```
.env.local
.env.docker
.env.production
```

**Priority:** HIGH
**Effort:** 1 hour

---

### 2.2 Standardize Variable Names

**Standardize Ollama Variables:**

**Current:** `OLLAMA_HOST`, `INFERENCE_BASE_URL`, `OLLAMA_BASE_URL`
**Target:** `OLLAMA_BASE_URL`

**Update Files:**
- `.env.example`
- `docker-compose-mission-control.yml`
- `docker-compose.yml (rss)`
- `generate_secrets.py`

**Priority:** MEDIUM
**Effort:** 30 minutes

---

### 2.3 Standardize Qdrant URL Per Environment

**Update:** `.env.example`
```env
# Qdrant Configuration
# Local Development
QDRANT_URL=http://localhost:6333
# Docker
# QDRANT_URL=http://qdrant:6333
# Production
# QDRANT_URL=https://67ee96e2-58e5-4476-aa17-a6e32a1e668d.sa-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=
QDRANT_COLLECTION=constitutional_memory
```

**Priority:** HIGH
**Effort:** 15 minutes

---

## Phase 3: SecretAdapter Enforcement

### 3.1 Update All Workers to Use SecretAdapter

**Files to Update:**
- `retrieval_service.py`
- `observation_worker.py`
- `claim_worker.py`
- `replay_worker.py`
- `witness_worker.py`
- `lineage_worker.py`
- `constitutional_runtime.py`
- `repository_scanner.py`

**Pattern:**
```python
# Before
qdrant_api_key = os.getenv("QDRANT_API_KEY")

# After
qdrant_api_key = self.secret_adapter.get_qdrant_key()
```

**Priority:** MEDIUM
**Effort:** 2 hours

---

### 3.2 Update SecretAdapter Fallback

**File:** `runtime/constitutional/secret_adapter.py`

**Ensure Fallback Covers All Secrets:**
```python
env_mapping = {
    'openai': {'api_key': os.getenv('OPENAI_API_KEY')},
    'anthropic': {'api_key': os.getenv('ANTHROPIC_API_KEY')},
    'postgres': {
        'password': os.getenv('POSTGRES_PASSWORD'),
        'user': os.getenv('POSTGRES_USER'),
        'host': os.getenv('POSTGRES_HOST'),
        'port': os.getenv('POSTGRES_PORT'),
        'database': os.getenv('POSTGRES_DB')
    },
    'qdrant': {'api_key': os.getenv('QDRANT_API_KEY')},
    'jwt': {'signing_key': os.getenv('JWT_SECRET')},
    'google-drive': {'client_secret': os.getenv('GOOGLE_CLIENT_SECRET')},
    'github': {'private_key_path': os.getenv('GITHUB_APP_PRIVATE_KEY_PATH')}
}
```

**Priority:** MEDIUM
**Effort:** 30 minutes

---

## Phase 4: Docker Compose Consolidation

### 4.1 Consolidate Docker Compose Files

**Create:** `docker-compose.yml` (Unified)

**Structure:**
```yaml
version: '3.8'

services:
  # Shared Services
  postgres:
    image: postgres:15-alpine
    container_name: brain-postgres
    env_file:
      - .env.docker
    # ... rest of config

  qdrant:
    image: qdrant/qdrant:latest
    container_name: brain-qdrant
    env_file:
      - .env.docker
    # ... rest of config

  ollama:
    image: ollama/ollama:latest
    container_name: brain-ollama
    env_file:
      - .env.docker
    # ... rest of config

  # Mission Control Profile
  mission-control:
    build: brainos/orchestration/infrastructure/docker/Dockerfile.mission-control
    container_name: ping-mission-control
    env_file:
      - .env.docker
    profiles:
      - mission-control
    depends_on:
      - postgres
      - qdrant
      - ollama

  # Open WebUI Profile
  openwebui:
    image: ghcr.io/open-webui/open-webui:latest
    container_name: brain-openwebui
    env_file:
      - .env.docker
    profiles:
      - openwebui
    depends_on:
      - ollama
```

**Usage:**
```bash
# Start all shared services
docker-compose up -d

# Start mission control profile
docker-compose --profile mission-control up -d

# Start openwebui profile
docker-compose --profile openwebui up -d
```

**Priority:** MEDIUM
**Effort:** 3 hours

---

### 4.2 Remove Inline Environment Blocks

**Action:** Replace all inline `environment:` blocks with `env_file:` references

**Priority:** MEDIUM
**Effort:** 1 hour

---

## Phase 5: Google Drive Configuration Consolidation

### 5.1 Remove YAML Configuration

**File:** `config.yaml`

**Current:**
```yaml
storage:
  google_drive:
    enabled: true
    credentials: ./credentials/client_secret.json
```

**Action:** Remove Google Drive configuration from YAML

**Priority:** LOW
**Effort:** 15 minutes

---

### 5.2 Standardize Environment Variables

**Update:** `.env.example`
```env
# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_ROOT=C:\PING\repositories\drive
GOOGLE_CREDENTIALS=C:\PING\secrets\drive\credentials.json
GOOGLE_TOKEN=C:\PING\secrets\drive\token.json
```

**Action:** Update path references to canonical secret location

**Priority:** LOW
**Effort:** 15 minutes

---

## Phase 6: Dead Variable Removal

### 6.1 Audit Service URL Usage

**Action:** Search codebase for each service URL variable

**Variables to Audit:**
- CONSTITUTION_SERVICE_URL
- LEDGER_SERVICE_URL
- PROJECTION_SERVICE_URL
- REPOSITORY_RUNTIME_URL
- RETRIEVAL_SERVICE_URL
- AGENT_RUNTIME_URL
- SKILL_SERVICE_URL
- FILESYSTEM_SERVICE_URL
- WITNESS_SERVICE_URL
- REPLAY_SERVICE_URL
- GRAPH_SERVICE_URL
- MEMORY_SERVICE_URL
- SCHEDULER_SERVICE_URL

**Priority:** LOW
**Effort:** 2 hours

---

### 6.2 Remove Unused Variables

**Action:** Remove variables not found in codebase from `.env.example`

**Priority:** LOW
**Effort:** 1 hour

---

## Phase 7: Bootstrap Script Update

### 7.1 Verify Path References

**File:** `brainos/orchestration/infrastructure/docker/scripts/bootstrap.sh`

**Action:** Verify all path references match actual directory structure

**Priority:** LOW
**Effort:** 30 minutes

---

### 7.2 Update Environment File Generation

**Action:** Ensure bootstrap generates correct environment file for context

**Priority:** LOW
**Effort:** 30 minutes

---

## Implementation Order

### Week 1: Critical Security Fixes
1. Remove hardcoded Qdrant API key (15 min)
2. Consolidate PostgreSQL configuration (2 hours)
3. Create environment-specific files (1 hour)

### Week 2: Environment Standardization
1. Standardize variable names (30 min)
2. Standardize Qdrant URL (15 min)
3. Enforce SecretAdapter usage (2.5 hours)

### Week 3: Docker Compose Consolidation
1. Consolidate docker-compose files (3 hours)
2. Remove inline environment blocks (1 hour)

### Week 4: Cleanup
1. Google Drive consolidation (30 min)
2. Dead variable removal (3 hours)
3. Bootstrap script update (1 hour)

**Total Estimated Effort:** 16 hours over 4 weeks

---

## Validation Checklist

### Security Validation
- [ ] No hardcoded credentials in source
- [ ] All secrets through SecretAdapter
- [ ] No credentials in docker-compose files
- [ ] SecretAdapter fallback works

### Configuration Validation
- [ ] Single source of truth per environment
- [ ] No duplicate configuration functions
- [ ] Consistent variable names
- [ ] Environment-specific files exist

### Runtime Validation
- [ ] All workers use shared configuration module
- [ ] All workers use SecretAdapter for secrets
- [ ] No runtime defines configuration locally
- [ ] Configuration imports work correctly

### Docker Validation
- [ ] Single docker-compose.yml
- [ ] All services use env_file references
- [ ] No inline environment blocks
- [ ] Docker compose profiles work correctly

### Documentation Validation
- [ ] Configuration hierarchy documented
- [ ] Environment usage documented
- [ ] SecretAdapter usage documented
- [ ] Migration guide documented

---

## Rollback Plan

If consolidation causes issues:

1. **Git Revert:** Revert to previous commit
2. **Restore Files:** Restore backup of original files
3. **Verify Services:** Verify services start with original configuration
4. **Document Issues:** Document what failed and why

**Rollback Time:** 15 minutes

---

## Success Criteria

Configuration consolidation is successful when:

1. **Security:** No hardcoded credentials in source control
2. **Consistency:** Single source of truth for each variable
3. **Maintainability:** No code duplication
4. **Flexibility:** Environment-specific configurations work
5. **Constitutional:** All secrets flow through SecretAdapter
6. **Docker:** Single docker-compose file with profiles
7. **Runtime:** All runtimes use shared configuration module
8. **Documentation:** Clear hierarchy and usage documented

---

## Summary

**Total Phases:** 7
**Total Estimated Effort:** 16 hours
**Implementation Timeline:** 4 weeks
**Risk Level:** Medium (configuration changes affect all services)

**Key Benefits:**
1. Eliminates security vulnerabilities
2. Reduces configuration duplication
3. Standardizes secret access
4. Simplifies environment management
5. Improves maintainability
6. Establishes constitutional configuration hierarchy

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: Critical Security Fixes
3. Execute phases in order
4. Validate each phase before proceeding
5. Update documentation as changes are made
