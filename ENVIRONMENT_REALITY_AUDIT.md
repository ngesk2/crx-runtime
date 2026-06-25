# Phase G.1 — Environment Reality Audit

**Date:** 2026-06-25  
**Method:** `docker inspect`, `docker logs`, env var extraction, codebase grep  
**Rule:** Read only. No changes.

---

## 1. Environment Variable Inventory — All Containers

### 1.1 brain-postgres (RUNNING)

| ENV VAR | Value | Status |
|---|---|---|
| `POSTGRES_USER` | (empty string) | **EMPTY** |
| `POSTGRES_PASSWORD` | (empty string) | **EMPTY** |
| `POSTGRES_DB` | (empty string) | **EMPTY** |
| `PGDATA` | `/var/lib/postgresql/data` | SET |
| `PATH` | standard | SET |
| `GOSU_VERSION` | 1.19 | SET |
| `PG_MAJOR` | 15 | SET |
| `PG_VERSION` | 15.18 | SET |

**Startup impact:** Postgres is RUNNING despite empty POSTGRES_USER/PASSWORD/DB. This means Postgres defaulted to `postgres` user, no password, `postgres` database. Running on default credentials.

### 1.2 brain-qdrant (RUNNING)

| ENV VAR | Value | Status |
|---|---|---|
| `QDRANT__SERVICE__API_KEY` | `cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=` | SET |
| `TZ` | Etc/UTC | SET |
| `RUN_MODE` | production | SET |
| `PATH` | standard | SET |

**Startup impact:** Qdrant has API key set. Running on port 6333. Healthcheck failing (no `curl` binary), but service is operational.

### 1.3 brain-ollama (STOPPED, ExitCode 128)

| ENV VAR | Value | Status |
|---|---|---|
| `OLLAMA_HOST` | 0.0.0.0:11434 | SET |
| `NVIDIA_DRIVER_CAPABILITIES` | compute,utility | SET |
| `NVIDIA_VISIBLE_DEVICES` | all | SET |

**Startup impact:** Container was running (served API requests) but was killed. Exit 128 = signal termination, not env var failure.

### 1.4 brain-openwebui (STOPPED, ExitCode 137)

| ENV VAR | Value | Status |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://ollama:11434` | **SET but TARGET NOT RUNNING** |
| `WEBUI_SECRET_KEY` | `default-secret-key-change-in-production` | SET (default) |
| `PORT` | 8080 | SET |
| `ENV` | prod | SET |
| `USE_OLLAMA_DOCKER` | false | SET |
| `USE_CUDA_DOCKER` | false | SET |
| `USE_SLIM_DOCKER` | false | SET |
| `RAG_EMBEDDING_MODEL` | sentence-transformers/all-MiniLM-L6-v2 | SET |
| `WHISPER_MODEL` | base | SET |

**Startup impact:** Container WAS running (logs show HTTP serving). Was killed with SIGKILL (exit 137). Env vars configured but Ollama target (`ollama:11434`) was a `compose_brain_internal` hostname — which was running but brain-ollama was the only one there. Once brain-ollama stopped, this had no inference backend.

### 1.5 ping-mission-control (STOPPED, ExitCode 128)

| ENV VAR | Value | Status |
|---|---|---|
| `POSTGRES_USER` | postgres | SET |
| `POSTGRES_PASSWORD` | postgres | SET |
| `POSTGRES_DB` | crx_runtime | SET |
| `POSTGRES_HOST` | postgres | SET |
| `POSTGRES_PORT` | 5432 | SET |
| `QDRANT_URL` | `http://qdrant:6333` | SET |
| `QDRANT_API_KEY` | `cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=` | SET |
| `QDRANT_COLLECTION` | constitutional_memory | SET |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | SET |
| `INFERENCE_BASE_URL` | `http://ollama:11434` | SET |
| `YAHOO_EMAIL` | (empty string) | **EMPTY** |
| `YAHOO_APP_PASSWORD` | (empty string) | **EMPTY** |
| `PATH` | standard | SET |

**Startup impact:** All critical env vars are SET correctly. Container was RUNNING (logs show health checks and API serving). Exit 128 = signal termination. The YAHOO vars are EMPTY but are only needed for newsletter ingestion (not running).

**Evidence that it worked:** Logs show `GET /health HTTP/1.1 200 OK` and `POST /reasoning/query HTTP/1.1 200 OK`.

### 1.6 vault (STOPPED, ExitCode 255)

| ENV VAR | Value | Status |
|---|---|---|
| `VAULT_DEV_ROOT_TOKEN_ID` | root | SET |
| `PATH` | standard | SET |

**Startup impact:** Only one env var set: `VAULT_DEV_ROOT_TOKEN_ID=root`. Vault dev mode requires a config file at `/vault/config` which didn't exist (empty volume `compose_vault_config`). Exit 255 = startup failure.

### 1.7 brain-repo-runtime (STOPPED, ExitCode 137)

| ENV VAR | Value | Status |
|---|---|---|
| `PATH` | standard | SET |

**Startup impact:** Alpine container with no env vars and no command. Exited with SIGKILL (137). Purpose was read-only repo access. No services depended on it.

### 1.8 crx-gateway (RUNNING)

| ENV VAR | Value | Status |
|---|---|---|
| `OLLAMA_URL` | `http://crx-ollama-worker:11434` | SET |
| `OLLAMA_MODEL` | qwen2.5-coder:14b | SET |
| `NODE_ENV` | production | SET |
| `PATH` | standard | SET |

**Startup impact:** No Postgres env vars. No database access at all. Gateway only connects to Ollama. It uses `crx-ollama-worker:11434` as hostname — but crx-ollama-worker is on NO network (isolated). This suggests the gateway resolves the hostname via Docker DNS or `host.docker.internal` proxy.

### 1.9 crx-ui-next (RUNNING, non-functional)

| ENV VAR | Value | Status |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | `http://gateway-worker:8080` | **SET but TARGET DOESN'T EXIST** |
| `NODE_ENV` | production | SET |
| `PATH` | standard | SET |

**Startup impact:** Points to `gateway-worker:8080` — no container with that name exists. The running gateway is named `crx-gateway`. Port 3000 not responding. This container is non-functional.

### 1.10 crx-ollama-worker (RUNNING)

| ENV VAR | Value | Status |
|---|---|---|
| `OLLAMA_HOST` | 0.0.0.0:11434 | SET |
| `NVIDIA_DRIVER_CAPABILITIES` | compute,utility | SET |
| `NVIDIA_VISIBLE_DEVICES` | all | SET |

**Startup impact:** Same env vars as brain-ollama. Running, no network interfaces, port 11434 not exposed to host. Inference accessible only via `host.docker.internal` proxy.

### 1.11 open-webui/crx-digestion-worker (RUNNING)

| ENV VAR | Value | Status |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | SET |
| `WEBUI_SECRET_KEY` | (empty string) | **EMPTY** |
| `PORT` | 8080 | SET |
| `ENV` | prod | SET |
| `USE_OLLAMA_DOCKER` | false | SET |
| `USE_CUDA_DOCKER` | false | SET |
| `RAG_EMBEDDING_MODEL` | sentence-transformers/all-MiniLM-L6-v2 | SET |
| `WHISPER_MODEL` | base | SET |

**Startup impact:** Container is RUNNING and serving. Uses `host.docker.internal:11434` for Ollama (Docker Desktop DNS host proxy). WEBUI_SECRET_KEY is EMPTY — Open WebUI will work without one but sessions won't be encrypted.

---

## 2. Required Variable Validation

### 2.1 Postgres Connectivity

| Variable | brain-postgres (actual) | ping-mission-control (env) | crx-gateway (env) | Required by |
|---|---|---|---|---|
| `POSTGRES_HOST` | — | `postgres` (SET) | **MISSING** | mission_control, workers |
| `POSTGRES_PORT` | — | 5432 (SET) | **MISSING** | mission_control, workers |
| `POSTGRES_DB` | **EMPTY** (default: crx_runtime?) | crx_runtime (SET) | **MISSING** | mission_control, workers |
| `POSTGRES_USER` | **EMPTY** (default: postgres) | postgres (SET) | **MISSING** | mission_control, workers |
| `POSTGRES_PASSWORD` | **EMPTY** (default: none) | postgres (SET) | **MISSING** | mission_control, workers |

**Classification:**

| Variable | Status |
|---|---|
| `POSTGRES_HOST` | Required and Present (in mission-control), **Required and Missing** (in gateway) |
| `POSTGRES_PORT` | Required and Present, **Required and Missing** (gateway) |
| `POSTGRES_DB` | Required and Present, **Required and Missing** (gateway) |
| `POSTGRES_USER` | **Required but EMPTY in Postgres runtime**, Required and Present (mission-control) |
| `POSTGRES_PASSWORD` | **Required but EMPTY in Postgres runtime**, Required and Present (mission-control) |

### 2.2 Qdrant Connectivity

| Variable | brain-qdrant (actual) | ping-mission-control (env) | Required by |
|---|---|---|---|
| `QDRANT_URL` | — | `http://qdrant:6333` (SET) | mission_control, projection worker |
| `QDRANT_API_KEY` | `cG96...` (SET) | `cG96...` (SET) | mission_control, projection worker |

**Classification:** Required and Present.

### 2.3 Ollama Connectivity

| Variable | brain-ollama | crx-ollama-worker | Containers that need it |
|---|---|---|---|
| `OLLAMA_HOST` | 0.0.0.0:11434 (SET) | 0.0.0.0:11434 (SET) | Ollama itself |
| `OLLAMA_BASE_URL` | — | — | mission-control, open-webui, brain-openwebui |
| `OLLAMA_URL` | — | — | crx-gateway |

**Classification:**

| Container | Var | Status |
|---|---|---|
| ping-mission-control | `OLLAMA_BASE_URL` | SET: `http://ollama:11434` → TARGET NOT RUNNING (brain-ollama stopped) |
| open-webui (running) | `OLLAMA_BASE_URL` | SET: `http://host.docker.internal:11434` → TARGET OK (crx-ollama-worker via host proxy) |
| brain-openwebui (stopped) | `OLLAMA_BASE_URL` | SET: `http://ollama:11434` → TARGET NOT RUNNING |
| crx-gateway | `OLLAMA_URL` | SET: `http://crx-ollama-worker:11434` → TARGET ISOLATED (no network, but host proxy works) |

### 2.4 Open WebUI

| Variable | open-webui (running) | brain-openwebui (stopped) |
|---|---|---|
| `WEBUI_SECRET_KEY` | **EMPTY** | `default-secret-key-change-in-production` |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` (functional) | `http://ollama:11434` (brain-ollama stopped) |

### 2.5 Vault

| Variable | vault container | Required by |
|---|---|---|
| `VAULT_ADDR` | **MISSING** | Any Vault client |
| `VAULT_TOKEN` | **MISSING** (not in env; `VAULT_DEV_ROOT_TOKEN_ID=root` exists) | Any Vault client |
| `VAULT_DEV_ROOT_TOKEN_ID` | root (SET) | Vault dev mode |

**Classification:** **Dead** — Vault never started, no services use Vault.

### 2.6 Google OAuth

| Variable | Any container? | Any .env? |
|---|---|---|
| `GOOGLE_CLIENT_ID` | **MISSING** | **MISSING** |
| `GOOGLE_CLIENT_SECRET` | **MISSING** | **MISSING** |

**Classification:** **Dead** — Google Drive OAuth token exists on filesystem but client ID/secret are not in any env.

### 2.7 SMTP / Outbound Email

| Variable | Any container? | Any .env? |
|---|---|---|
| `SMTP_HOST` | **MISSING** | **MISSING** |
| `SMTP_PORT` | **MISSING** | **MISSING** |
| `SMTP_USERNAME` | **MISSING** | **MISSING** |
| `SMTP_PASSWORD` | **MISSING** | **MISSING** |
| `RESEND_API_KEY` | **MISSING** | **MISSING** |
| `SENDGRID_API_KEY` | **MISSING** | **MISSING** |
| `MAILGUN_API_KEY` | **MISSING** | **MISSING** |

**Classification:** **Not configured.**

---

## 3. Container Startup Failures — Detailed

### 3.1 ping-mission-control (Exit 128)

| Property | Value |
|---|---|
| Exit Code | 128 (128 + 0 = SIGHUP? Or generic signal) |
| Logs Available | Yes — last 100 lines show normal operation |
| Last Activity | Serving `GET /health` 200, `POST /reasoning/query` 200, one Ollama read timeout |
| Startup Command | Python uvicorn app |
| Env Vars | All present for Postgres, Qdrant, Ollama |
| **Failure Reason** | **Signal termination** — was running, then killed. Not a env var failure, not a config failure, not a dependency failure. Exit 128 typically means Docker killed it (out of memory? `docker stop`? Compose restart?). |
| Evidence | `docker logs` shows normal HTTP serving up to the last second. No error traceback. |

### 3.2 brain-ollama (Exit 128)

| Property | Value |
|---|---|
| Exit Code | 128 |
| Logs Available | Yes — last 100 lines show health check polling |
| Last Activity | Serving `HEAD /` and `GET /api/tags` every 30 seconds (health check from mission-control or openwebui) |
| **Failure Reason** | **Signal termination** — was running, then killed. Exact same scenario as mission-control: both exited 128 at same time (~12 hours ago). Consistent with `docker compose down` or Docker restart. |
| Evidence | Regular 30-second health check polling with all 200 responses, then container stops. No error in logs. |

### 3.3 brain-openwebui (Exit 137)

| Property | Value |
|---|---|
| Exit Code | 137 (128 + 9 = SIGKILL) |
| Logs Available | Yes — last 100 lines show continuous HTTP serving |
| Last Activity | Serving `GET /` 200 every 10 seconds (health check polling from itself or external) |
| **Failure Reason** | **Force killed (SIGKILL)** — exited with 137 at same time as brain-ollama and ping-mission-control (~12 hours ago). SIGKILL indicates Docker daemon forced termination, not a graceful shutdown. Consistent with `docker compose down --timeout` or Docker restart with kill timeout. |
| Evidence | Logs show normal serving then `Closed shared aiohttp session pool`. No traceback. |

### 3.4 vault (Exit 255)

| Property | Value |
|---|---|
| Exit Code | 255 (Vault startup error) |
| Logs Available | No |
| **Failure Reason** | **Configuration failure** — Vault dev mode requires config file at `/vault/config`. Empty volume (`compose_vault_config`, 0 B) means no config was injected. `No config file found` would be the error. |
| Evidence | Exit 255 is Vault's code for "startup failure". Empty config volume confirmed by `docker volume inspect`. Container never successfully started. |

### 3.5 brain-repo-runtime (Exit 137)

| Property | Value |
|---|---|
| Exit Code | 137 (SIGKILL) |
| Logs Available | No (Alpine container with no running process) |
| **Failure Reason** | **No startup command** — Alpine container with no CMD/ENTRYPOINT that does work. Was creating a read-only mount for repo access. Killed when no longer needed. |
| Evidence | Exit 137 = SIGKILL from Docker. No logs because no process ever ran. |

---

## 4. Container Startup Blockers — Summary

| Container | Blocked By | Classification |
|---|---|---|
| ping-mission-control | NOT blocked — was running. Killed by signal. | **Signal termination** |
| brain-ollama | NOT blocked — was running. Killed by signal. | **Signal termination** |
| brain-openwebui | NOT blocked — was running. Killed by SIGKILL. | **Force killed** |
| vault | Empty config volume → No config file → Exit 255 | **Configuration failure** |
| brain-repo-runtime | No CMD to execute → exited immediately | **No startup command** |
| crx-ui-next | Undefined hostname `gateway-worker:8080` → port 3000 not responding | **Misconfigured hostname** |
| **All 8 workers** (summary_worker, claim_worker, etc.) | Never deployed to any container | **Not containerized** |

---

## 5. Environment Variable Summary

### Present and Consumed
- `POSTGRES_HOST=postgres` (mission-control only)
- `POSTGRES_PORT=5432`
- `POSTGRES_USER=postgres` / `POSTGRES_PASSWORD=postgres` / `POSTGRES_DB=crx_runtime`
- `QDRANT_URL=http://qdrant:6333`
- `QDRANT_API_KEY` (base64)
- `OLLAMA_BASE_URL` (varies by container — only the running open-webui has a WORKING target)
- `OLLAMA_URL=http://crx-ollama-worker:11434` (gateway)
- `OLLAMA_HOST=0.0.0.0:11434` (both Ollama instances)
- `WEBUI_SECRET_KEY` (stopped brain-openwebui has default; running open-webui has EMPTY)

### Present but Empty
- `POSTGRES_USER` in brain-postgres actual runtime (defaulted to `postgres`)
- `POSTGRES_PASSWORD` in brain-postgres actual runtime (defaulted to empty)
- `POSTGRES_DB` in brain-postgres actual runtime (defaulted to `postgres`)
- `WEBUI_SECRET_KEY` in running open-webui (using empty string)
- `YAHOO_EMAIL` / `YAHOO_APP_PASSWORD` in ping-mission-control (empty, newsletter worker never deployed)

### Missing Entirely
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` — not in any container or env file
- `RESEND_API_KEY` — not in any container or env file
- `SENDGRID_API_KEY` — not in any container or env file
- `MAILGUN_API_KEY` — not in any container or env file
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — not in any container or env file
- `VAULT_ADDR` / `VAULT_TOKEN` — not in any container (VAULT_DEV_ROOT_TOKEN_ID is a dev-only env, not a client token)

---

## 6. Top 10 Missing Environment Variables

| Rank | Variable | Where Needed | Impact |
|---|---|---|---|
| 1 | `WEBUI_SECRET_KEY` | running open-webui | Session encryption disabled; EMPTY value means unencrypted sessions |
| 2 | `POSTGRES_HOST` | crx-gateway | Gateway cannot reach database |
| 3 | `POSTGRES_PASSWORD` | crx-gateway (and workers) | No database access from UI layer |
| 4 | `SMTP_HOST` | Any outbound notification | Zero outbound communication exists |
| 5 | `GOOGLE_CLIENT_ID/SECRET` | Drive Mirror | OAuth token exists but can't be refreshed without client creds |
| 6 | `VAULT_ADDR` | Any Vault client | No service knows where Vault is (also: Vault is dead) |
| 7 | `YAHOO_EMAIL` | ping-mission-control (newsletter) | EMPTY — newsletter ingestion can't authenticate |
| 8 | `YAHOO_APP_PASSWORD` | ping-mission-control (newsletter) | EMPTY — same as above |
| 9 | `OLLAMA_BASE_URL` | crx-gateway (as env) | Not set in gateway — hardcoded in code instead |
| 10 | `NEXT_PUBLIC_GATEWAY_URL` | crx-ui-next | Set to `http://gateway-worker:8080` — hostname `gateway-worker` doesn't exist |

## 7. Top 10 Containers Blocked By Configuration

| Rank | Container | Blocking Reason |
|---|---|---|
| 1 | crx-ui-next | Points to `gateway-worker:8080` — no container with that name exists |
| 2 | vault | Empty config volume — Vault never started |
| 3 | ping-mission-control | Was running, killed, would restart if compose was up — but brain-ollama is dead (Ollama dependency missing) |
| 4 | brain-ollama | Was running, killed — no env var issue |
| 5 | brain-openwebui | Was running, killed — Ollama target `http://ollama:11434` points to dead brain-ollama |
| 6 | brain-repo-runtime | No CMD — Alpine container with no process |
| 7 | All 8 workers | Not containerized — no Dockerfile, no compose service definition |
| 8 | crx-gateway (workers) | Stopped companion containers (crx-ai-worker, crx-email-worker) never run |
| 9 | Newsletter pipeline | Broken import paths, no Dockerfile, Yahoo creds empty |
| 10 | Neo4j/Kafka/etc. | Defined in compose, never started — no runtime dependency on them |
