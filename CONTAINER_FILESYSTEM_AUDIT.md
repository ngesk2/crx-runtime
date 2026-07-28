# Container Filesystem Audit — Phase 4

## Container: ping-mission-control

### File existence (verified by `find /app -type f -name '*.py'` and `ls`)

| Path | Exists? | Mounted? | Copied? | Generated? |
|---|---|---|---|---|
| `/app/runtime/replay/` | **NO** | NO | NO (not in Dockerfile) | NO |
| `/app/runtime/workers/` | **NO** | NO | NO (not in Dockerfile) | NO |
| `/app/workers/` | **NO** | NO | NO | NO |
| `/app/runtime/constitutional/` | YES | NO | YES (Dockerfile line 22) | NO |
| `/app/runtime/adapters/` | YES | NO | YES (Dockerfile line 23) | NO |
| `/app/runtime/security/` | YES | NO | YES (Dockerfile line 24) | NO |
| `/app/runtime/cognitive/` | YES | NO | YES (Dockerfile line 25) | NO |
| `/app/runtime/tools/` | YES | NO | YES (Dockerfile line 26) | NO |
| `/app/runtime/data/` | YES | NO | YES (Dockerfile line 27) — **empty except context_pack_cache/** | NO |
| `/app/src/` | YES | NO | YES (Dockerfile line 19 — `COPY brainos/orchestration/src ./src`) | NO |
| `/app/vault/` | YES | YES (bind mount from host vault/) | NO | NO |
| `/app/runtime/adapters/config_adapter.ts` | YES | NO | YES (included in COPY) | NO |
| `/app/runtime/adapters/express_commit_adapter.ts` | YES | NO | YES (included in COPY) | NO |
| `/app/runtime/adapters/postgres_event_store.ts` | YES | NO | YES (included in COPY) | NO |

### Setup scripts
| Path | Exists? | Notes |
|---|---|---|
| `~/vault/setup_vault.sh` | N/A | Not applicable — vault bind mount is at /app/vault |
| No entrypoint scripts | NO | Container has no Entrypoint, Cmd is direct uvicorn |

## Container: brain-repo-runtime

### File existence (verified by `ls`)

| Path | Exists? | Mounted? | Notes |
|---|---|---|---|
| `/repo/ping/runtime/replay/` | **YES** | YES (read-only bind mount) | 27 TypeScript files visible |
| `/repo/ping/workers/` | **YES** | YES (read-only bind mount) | 7 Python files visible |
| `/repo/ping/runtime/` | YES | YES (read-only) | Full repo |
| `/repo/content/` | YES | YES (read-only, mapped from vault/) | |
| `/repo/drive/` | YES | YES (read-only, mapped from DriveMirror/) | |
| `/repo/artifacts/` | YES | YES (read-only, mapped from Artifacts/) | |
| `/repo/graphs/` | YES | YES (read-write, mapped from Graphs/) | |
| `/repo/indexes/` | YES | YES (read-write, mapped from Indexes/) | |

### Important: This container has NO runtime to execute code. It runs `sleep infinity`.

## Container: brain-postgres

| Path | Exists? | Notes |
|---|---|---|
| `/docker-entrypoint-initdb.d/01-schema.sql` | YES | Mounted from compose volume |

## Container: brain-qdrant

| Path | Exists? | Notes |
|---|---|---|
| `/qdrant/storage/collections/constitutional_documents/` | YES | 5 points, 768-dim |
| `/qdrant/storage/collections/constitutional_memory/` | YES | 0 points |

## Container: brain-openwebui

| Path | Exists? | Notes |
|---|---|---|
| No PING-specific files | NO | Standard Open WebUI deployment |

## Conclusion
The only container with the ability to read `runtime/replay/` files is `brain-repo-runtime` (via read-only mount at `/repo/ping/runtime/replay/`), but it has no runtime to execute them (Alpine, `sleep infinity`, no Node.js, no Python). The `ping-mission-control` container does NOT have `runtime/replay/`, `runtime/workers/`, or `workers/` directories. The three `.ts` files in `/app/runtime/adapters/` are copied but CANNOT be executed (no Node.js in container).
