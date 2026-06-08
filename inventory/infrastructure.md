# Infrastructure Inventory

**Generated:** 2026-06-07  
**Audit:** CRX Layer 0 — Discovery (Read-Only)  
**Canonical Root:** `C:\Users\nolan\CRX`

---

## Summary Matrix

| Component | Installed | Configured | Running | Canonical Location | Canonicality |
|-----------|-----------|------------|---------|-------------------|--------------|
| Docker | YES (29.5.2) | YES | **NO** (daemon stopped) | CascadeProjects/infra/ (secondary) | **NOT CANONICAL** — CRX/infra absent |
| Docker Compose | YES (plugin) | YES (2 files) | NO | See below | SPLIT |
| PostgreSQL | NO (native) | YES (compose + SQL) | NO (port 5432 closed) | CascadeProjects + runtime SQL | PARTIAL |
| Redis | NO (native) | YES (compose) | NO (port 6379 closed) | CascadeProjects/infra/ | NOT CANONICAL |
| Ollama | NO (native) | YES (compose image) | NO (port 11434 closed) | CascadeProjects/infra/ | NOT CANONICAL |
| Prometheus | NO | YES (config file) | NO (port 9090 closed) | CascadeProjects/infra/observability/ | NOT CANONICAL |
| Grafana | NO | YES (compose) | NO (port 3000 closed) | CascadeProjects/infra/ | NOT CANONICAL |
| Loki | NO | YES (config file) | NO (port 3100 closed) | CascadeProjects/infra/observability/ | NOT CANONICAL |
| Tempo | NO | YES (config file) | NO (port 3200 closed) | CascadeProjects/infra/observability/ | NOT CANONICAL |
| Node.js | YES (v22.22.3) | N/A | N/A | System PATH | RUNTIME DEP |
| Python | YES (3.11.15) | N/A | N/A | System PATH | RUNTIME DEP |
| WSL2 | YES | Ubuntu + docker-desktop | **UNKNOWN** daemon state | WSL distros | DOCKER BACKEND |

---

## Docker

| Field | Value | Classification |
|-------|-------|----------------|
| Client version | 29.5.2 | FACT |
| Context | desktop-linux | FACT |
| Daemon state | Not running (`dockerDesktopLinuxEngine` pipe missing) | FACT |
| Credential store | `desktop` (config.json) | FACT |
| Docker Hub user (cred mgr) | `ngeske` | FACT |
| Containers | None queryable (daemon down) | FACT |

### Compose Files

| File | Location | Services | Status |
|------|----------|----------|--------|
| `docker-compose.yml` | `CRX/agents/` | 4 agent containers (planner, refactor, documentation, governance) | **BROKEN** — volume mounts reference non-existent `./authoritative`, `./derived`, `./experimental` under agents/ |
| `docker-compose.yml` | `CascadeProjects/infra/` | postgres, redis, ollama, prometheus, grafana, loki, tempo | **CONFIGURED** — not running; includes `.env` |
| `docker-compose.yml` | `AppData/Local/hermes/hermes-agent/` | Hermes agent (unrelated) | FACT — third-party |

**INFERENCE:** Canonical infra stack should eventually live under `CRX/infra/` but does not exist today. Operational compose is in wrong location (CascadeProjects).

---

## PostgreSQL

| Field | Value | Classification |
|-------|-------|----------------|
| Native install (`psql`) | Not on PATH | FACT |
| Local port 5432 | Closed | FACT |
| Compose definition | postgres:16-alpine in CascadeProjects | FACT |
| Init SQL (CascadeProjects) | `infra/scripts/init-db.sql` — lineage_chains, replay_snapshots | FACT |
| Runtime schema | `runtime/kernel/commit-service/src/persistence/ledger_schema.sql` | FACT |
| Runtime client | `pg` npm package in commit-service | FACT |
| DATABASE_URL | Expected via environment; no `.env` in CRX | FACT |
| External DB instance | **UNKNOWN** — may exist unmanaged | UNKNOWN |

---

## Redis

| Field | Value | Classification |
|-------|-------|----------------|
| Native install (`redis-cli`) | Not on PATH | FACT |
| Local port 6379 | Closed | FACT |
| Compose definition | redis:7-alpine in CascadeProjects | FACT |
| Runtime usage | None in commit-service | FACT |

---

## Ollama

| Field | Value | Classification |
|-------|-------|----------------|
| Native install | Not found (PATH or Program Files) | FACT |
| Local port 11434 | Closed | FACT |
| Compose definition | ollama/ollama:latest in CascadeProjects | FACT |
| Volume mount | `./volumes/ollama:/root/.ollama` | FACT |
| Models pulled | **UNKNOWN** (daemon not running) | UNKNOWN |

---

## Observability Stack

| Component | Config Location | Running | Used by Runtime |
|-----------|-----------------|---------|-----------------|
| Prometheus | CascadeProjects/infra/observability/prometheus.yml | NO | NO |
| Grafana | CascadeProjects compose only | NO | NO |
| Loki | CascadeProjects/infra/observability/loki-config.yml | NO | NO |
| Tempo | CascadeProjects/infra/observability/tempo-config.yml | NO | NO |
| pino logger | commit-service/src/utils/logger.ts | YES (if service boots) | PARTIAL |

---

## Environment Files

| File | Location | Purpose | Classification |
|------|----------|---------|----------------|
| `.env` | CascadeProjects/infra/ | Infra stack secrets/config | FACT — wrong location |
| None | CRX/ | — | FACT — no env file in canonical tree |

---

## Port Availability (localhost)

| Port | Service | Open | Classification |
|------|---------|------|----------------|
| 5432 | PostgreSQL | NO | FACT |
| 6379 | Redis | NO | FACT |
| 11434 | Ollama | NO | FACT |
| 8080 | commit-service | NO | FACT |
| 3000 | Grafana | NO | FACT |
| 9090 | Prometheus | NO | FACT |

---

## Hidden Mutable State

| State | Location | Risk |
|-------|----------|------|
| node_modules/ | runtime/kernel/commit-service/ | Dependency drift |
| CascadeProjects/infra/volumes/ | **UNKNOWN** if populated | Split-brain data |
| External PostgreSQL | **UNKNOWN** host | Unmanaged constitutional state |
| runtime/ unpushed commits | 3 ahead of origin | Lineage fragility |
