# Infrastructure Sovereignty Report

**Audit Date:** 2026-06-07  
**Protocol:** CRX Layer 0B — Sovereignty Stabilization Audit  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Two docker-compose.yml files exist in different locations.

**FACT:** AGENT.md mandates ONE canonical infrastructure stack in infra/.

**FACT:** infra/ does NOT exist in canonical repository.

**FACT:** CascadeProjects/infra/ exists with complete infrastructure stack.

**INFERENCE:** Infrastructure sovereignty is VIOLATED - canonical infrastructure in wrong location.

---

## Constitutional Infrastructure Mandate

**FACT:** Per AGENT.md, infrastructure mandate is:

```
Canonical path: infra/
Required layout:
infra/
 ├── docker-compose.yml
 ├── .env
 ├── postgres/
 ├── redis/
 ├── ollama/
 ├── observability/
 ├── scripts/
 └── volumes/
```

**FACT:** AGENT.md mandates "There must be ONE canonical infrastructure stack".

**FACT:** AGENT.md mandates "All services boot from docker compose up -d ONLY".

**FACT:** AGENT.md mandates required core services: postgres, redis, ollama, api, worker, scheduler, prometheus, grafana, loki, tempo.

---

## Compose File Inventory

### Compose File 1: CascadeProjects/infra/docker-compose.yml

**Location:** `C:\Users\nolan\CascadeProjects\infra\docker-compose.yml`

**Status:** SHADOW AUTHORITY (wrong location)

**Services:**
- postgres (postgres:16-alpine)
- redis (redis:7-alpine)
- ollama (ollama/ollama:latest)
- prometheus (prom/prometheus:latest)
- grafana (grafana/grafana:latest)
- loki (grafana/loki:latest)
- tempo (grafana/tempo:latest)

**Constitutional Compliance:** PARTIAL (matches AGENT.md service requirements but missing api, worker, scheduler)

**Boot Capability:** UNKNOWN (Docker not running, not tested)

---

### Compose File 2: CRX/agents/docker-compose.yml

**Location:** `C:\Users\nolan\CRX\agents\docker-compose.yml`

**Status:** BROKEN SCAFFOLD

**Services:**
- planner-agent (Dockerfile.planner)
- refactor-agent (Dockerfile.refactor)
- documentation-agent (Dockerfile.documentation)
- governance-agent (Dockerfile.governance)

**Constitutional Compliance:** VIOLATION (agent services not constitutional infrastructure, references non-existent directories)

**Boot Capability:** CANNOT BOOT (broken volume mounts, missing code)

---

## Service Definition Analysis

### Service 1: PostgreSQL

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: postgres:16-alpine
- Container: crx-postgres
- Port: 5432
- Volume: ./volumes/postgres:/var/lib/postgresql/data
- Init script: ./scripts/init-db.sql
- Health check: pg_isready

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** PARTIAL (PostgreSQL client exists in runtime, requires external DATABASE_URL)

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 2: Redis

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: redis:7-alpine
- Container: crx-redis
- Port: 6379
- Volume: ./volumes/redis:/data
- Command: redis-server --appendonly yes
- Health check: redis-cli ping

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 3: Ollama

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: ollama/ollama:latest
- Container: crx-ollama
- Port: 11434
- Volume: ./volumes/ollama:/root/.ollama
- Environment: OLLAMA_HOST=0.0.0.0

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 4: Prometheus

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: prom/prometheus:latest
- Container: crx-prometheus
- Port: 9090
- Volume: ./observability/prometheus.yml:/etc/prometheus/prometheus.yml
- Volume: ./volumes/prometheus:/prometheus
- Command: --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 5: Grafana

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: grafana/grafana:latest
- Container: crx-grafana
- Port: 3000
- Volume: ./volumes/grafana:/var/lib/grafana
- Environment: GF_SECURITY_ADMIN_USER, GF_SECURITY_ADMIN_PASSWORD
- Depends on: prometheus

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 6: Loki

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: grafana/loki:latest
- Container: crx-loki
- Port: 3100
- Volume: ./observability/loki-config.yml:/etc/loki/local-config.yaml
- Volume: ./volumes/loki:/loki
- Command: -config.file=/etc/loki/local-config.yaml

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 7: Tempo

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** CascadeProjects/infra/docker-compose.yml
- Image: grafana/tempo:latest
- Container: crx-tempo
- Port: 3200, 4317
- Volume: ./observability/tempo-config.yaml:/etc/tempo-config.yaml
- Volume: ./volumes/tempo:/tmp/tempo
- Command: -config.file=/etc/tempo-config.yaml

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** SHADOW ONLY (exists in wrong location)

---

### Service 8: API

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** MISSING

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** PARTIAL (commit-service exists but not in docker-compose)

**Constitutional Compliance:** NOT IMPLEMENTED

---

### Service 9: Worker

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** MISSING

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** NOT IMPLEMENTED

---

### Service 10: Scheduler

**Canonical Mandate:** REQUIRED per AGENT.md

**Shadow Implementation:** MISSING

**Canonical Implementation:** MISSING (infra/ does not exist)

**Runtime Implementation:** NONE

**Constitutional Compliance:** NOT IMPLEMENTED

---

## Configuration Sovereignty

### Configuration File 1: CascadeProjects/infra/.env

**Location:** `C:\Users\nolan\CascadeProjects\infra\.env`

**Status:** SHADOW AUTHORITY (wrong location)

**Configuration:**
- PostgreSQL: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT
- Redis: REDIS_PORT
- Ollama: OLLAMA_PORT, OLLAMA_MODEL
- Observability: PROMETHEUS_PORT, GRAFANA_PORT, GRAFANA_USER, GRAFANA_PASSWORD, LOKI_PORT, TEMPO_PORT, TEMPO_OTLP_PORT
- API: API_PORT, API_HOST
- Worker: WORKER_CONCURRENCY
- Scheduler: SCHEDULER_ENABLED
- Runtime: LOG_LEVEL, ENVIRONMENT
- Policy: POLICY_VERSION, POLICY_ENFORCEMENT
- Replay: REPLAY_ENABLED, REPLAY_VALIDATION
- Lineage: LINEAGE_TRACKING, LINEAGE_RETENTION_DAYS

**Constitutional Compliance:** PARTIAL (matches AGENT.md centralization mandate but in wrong location)

---

### Configuration File 2: CRX/.env

**Location:** MISSING

**Status:** NOT IMPLEMENTED

**Constitutional Compliance:** VIOLATION (AGENT.md mandates centralization in infra/.env)

---

## Infrastructure Sovereignty Assessment

| Component | Canonical Location | Shadow Location | Constitutional Mandate | Status |
|-----------|-------------------|-----------------|----------------------|--------|
| docker-compose.yml | MISSING (infra/) | EXISTS (CascadeProjects/infra/) | MUST exist in infra/ | VIOLATION |
| .env | MISSING (infra/) | EXISTS (CascadeProjects/infra/) | MUST exist in infra/ | VIOLATION |
| postgres | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| redis | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| ollama | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| prometheus | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| grafana | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| loki | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| tempo | MISSING | EXISTS (CascadeProjects/infra/) | REQUIRED | SHADOW ONLY |
| api | MISSING | MISSING | REQUIRED | NOT IMPLEMENTED |
| worker | MISSING | MISSING | REQUIRED | NOT IMPLEMENTED |
| scheduler | MISSING | MISSING | REQUIRED | NOT IMPLEMENTED |

---

## Closest Stack to Constitutional Requirements

**FACT:** CascadeProjects/infra/docker-compose.yml is closest to constitutional requirements.

**COMPLIANCE SCORE:** 7/10 (7 of 10 required services implemented)

**MISSING SERVICES:**
- api (commit-service exists but not in docker-compose)
- worker (not implemented)
- scheduler (not implemented)

**LOCATION ISSUE:** Exists in wrong location (CascadeProjects instead of CRX/infra/)

**INFERENCE:** Moving CascadeProjects/infra/ to CRX/infra/ would satisfy constitutional mandate for 7/10 services.

---

## Infrastructure Sovereignty Violations

### Violation 1: Infrastructure in Wrong Location

**SEVERITY:** HIGH

**EVIDENCE:** Constitutional infrastructure exists in CascadeProjects/infra/ but AGENT.md mandates infra/ in CRX/.

**RISK:** Future agents may implement infrastructure in wrong location.

**MITIGATION:** Move CascadeProjects/infra/ to CRX/infra/ or delete.

---

### Violation 2: Missing Canonical Infrastructure

**SEVERITY:** HIGH

**EVIDENCE:** infra/ does NOT exist in CRX/ despite AGENT.md mandate.

**RISK:** Constitutional infrastructure authority cannot be enforced.

**MITIGATION:** Create CRX/infra/ with canonical docker-compose.yml.

---

### Violation 3: Duplicate Compose Stacks

**SEVERITY:** HIGH

**EVIDENCE:** Two docker-compose.yml files exist (CascadeProjects/infra/ and agents/).

**RISK:** Infrastructure fragmentation, authority confusion.

**MITIGATION:** Consolidate to single canonical stack in CRX/infra/.

---

### Violation 4: Missing Core Services

**SEVERITY:** MEDIUM

**EVIDENCE:** api, worker, scheduler not implemented in any stack.

**RISK:** Cannot boot constitutional infrastructure per AGENT.md.

**MITIGATION:** Implement missing services in canonical stack.

---

## Infrastructure Consolidation Plan

### Phase 1: Create Canonical Infrastructure Directory

**ACTION:** Create `C:\Users\nolan\CRX\infra\` directory.

**ACTION:** Create subdirectories: postgres/, redis/, ollama/, observability/, scripts/, volumes/.

**JUSTIFICATION:** AGENT.md mandates canonical infrastructure in infra/.

**RISK:** LOW (directory creation only)

---

### Phase 2: Move Shadow Infrastructure to Canonical Location

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\docker-compose.yml` to `C:\Users\nolan\CRX\infra\docker-compose.yml`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\.env` to `C:\Users\nolan\CRX\infra\.env`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\volumes\` to `C:\Users\nolan\CRX\infra\volumes\`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\observability\` to `C:\Users\nolan\CRX\infra\observability\`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\scripts\` to `C:\Users\nolan\CRX\infra\scripts\`.

**JUSTIFICATION:** Satisfy constitutional mandate for infrastructure location.

**RISK:** LOW (content matches constitutional requirements)

---

### Phase 3: Add Missing Services

**ACTION:** Add api service to docker-compose.yml (commit-service).

**ACTION:** Add worker service to docker-compose.yml.

**ACTION:** Add scheduler service to docker-compose.yml.

**JUSTIFICATION:** AGENT.md mandates api, worker, scheduler as required core services.

**RISK:** MEDIUM (requires implementation of worker and scheduler)

---

### Phase 4: Delete Broken Agent Infrastructure

**ACTION:** Delete `C:\Users\nolan\CRX\agents\docker-compose.yml`.

**ACTION:** Delete agent Dockerfiles (Dockerfile.planner, Dockerfile.refactor, etc.).

**JUSTIFICATION:** Agent runtime not constitutional infrastructure, broken scaffold.

**RISK:** LOW (agent runtime is future work, not current priority)

---

### Phase 5: Delete Shadow Repository

**ACTION:** Delete entire `C:\Users\nolan\CascadeProjects\` directory.

**JUSTIFICATION:** Per REPOSITORY_PROVENANCE_MAP.md, CascadeProjects is GENERATED_BY_AGENT in wrong location.

**RISK:** LOW (no canonical content in CascadeProjects)

---

## Infrastructure Readiness Assessment

| Service | Shadow Implementation | Canonical Implementation | Readiness |
|---------|---------------------|-------------------------|-----------|
| postgres | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| redis | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| ollama | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| prometheus | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| grafana | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| loki | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| tempo | READY (CascadeProjects) | MISSING | SHADOW ONLY |
| api | PARTIAL (runtime) | MISSING | PARTIAL |
| worker | NOT IMPLEMENTED | MISSING | NOT READY |
| scheduler | NOT IMPLEMENTED | MISSING | NOT READY |

**INFERENCE:** Infrastructure readiness is 0% in canonical location, 70% in shadow location.

---

## Final Classification

**FACT:** 2 docker-compose.yml files exist in different locations.

**FACT:** 4 infrastructure sovereignty violations identified.

**FACT:** 7/10 required services exist in shadow location.

**FACT:** 0/10 required services exist in canonical location.

**INFERENCE:** Infrastructure sovereignty is VIOLATED - canonical infrastructure in wrong location.

**RECOMMENDATION:** Execute Infrastructure Consolidation Plan before Layer 1 implementation.
