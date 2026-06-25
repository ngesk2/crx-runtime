# Environment Authority Audit — Phase 1

## Active Environment Sources

### Source 1: docker-compose-mission-control.yml (hardcoded values)
| Variable | Value | Referenced By | Runtime Consumer | Observed Usage |
|---|---|---|---|---|
| POSTGRES_HOST | postgres | app.py | psycopg2.connect | Running, queryable |
| POSTGRES_PORT | 5432 | app.py | psycopg2.connect | Running |
| POSTGRES_DB | crx_runtime | app.py | psycopg2.connect | Running |
| POSTGRES_USER | postgres | app.py | psycopg2.connect | Auth OK |
| POSTGRES_PASSWORD | postgres | app.py | psycopg2.connect | Auth OK |
| QDRANT_URL | http://qdrant:6333 | app.py, retrieval.py, projection_worker.py | qdrant_client | LOCAL qdrant (not Cloud) |
| QDRANT_API_KEY | cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY= | app.py, retrieval.py, projection_worker.py | qdrant_client | Authenticated |
| QDRANT_COLLECTION | constitutional_memory | app.py, projection_worker.py | qdrant_client | 0 points |
| OLLAMA_BASE_URL | http://ollama:11434 | app.py | inference_adapter | Ollama running |
| INFERENCE_BASE_URL | http://ollama:11434 | app.py | inference_adapter | Ollama running |
| YAHOO_EMAIL | (from host env) | app.py, newsletter | - | NOT SET in compose |
| YAHOO_APP_PASSWORD | (from host env) | app.py, newsletter | - | NOT SET in compose |

### Source 2: Container Runtime Environment (docker inspect)
Confirmed identical to compose values. No override.

### Source 3: .env.mission-control (on host, NOT loaded at runtime)
Contains CLOUD Qdrant URL (https://67ee96e2-...) — **NOT the active config**. Local compose hardcodes `http://qdrant:6333`.

### Source 4: .env.qdrant (on host, NOT loaded at runtime)
Contains Cloud Qdrant URL + localhost Postgres — **NOT active**. Used by previous session's manual runs.

### Source 5: .env.local (NOT loaded)
Local dev overrides. Not used by compose.

### Source 6: .env.production (NOT loaded)
Production overrides. Not used by compose.

### Variables NOT Present (not in compose, not in runtime env)
- `REPLAY_*` — No replay-related variables exist
- `MEMORY_*` — No custom MEMORY variables (uses QDRANT_COLLECTION)
- `AUTHORITY_*` — No authority variables
- `WITNESS_*` — No witness variables
- `LINEAGE_*` — No lineage variables
- `GRAPH_*` — No graph variables
- `PROJECTION_*` — No projection variables

### Variables Present But Unused at Runtime
- `MEMORY_COLLECTION` — Defined in app.py as `'memory'` but collection does NOT exist in Qdrant
- `TIER2_OPERATIONAL` — Defined in app.py as `'tier2_operational'` but collection does NOT exist in Qdrant
- `TIER3_WORKING` — Defined in app.py as `'tier3_working'` but collection does NOT exist in Qdrant

## Verified Runtime Variable Values (from docker inspect ping-mission-control)
```
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=cG96ZGV2ZWxvcG1lbnRAcGluZy5jb20uYXU6c3VwZXItc2ljcmV0LWtleS0xMjM0NTY=
QDRANT_COLLECTION=constitutional_memory
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=crx_runtime
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
OLLAMA_BASE_URL=http://ollama:11434
INFERENCE_BASE_URL=http://ollama:11434
```

## Conclusion
No override compose files exist. No `.env` files are loaded at runtime. All environment comes from hardcoded values in docker-compose-mission-control.yml. There are no REPLAY, AUTHORITY, WITNESS, LINEAGE, GRAPH, or PROJECTION environment variables in the runtime.
