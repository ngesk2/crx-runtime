# Infrastructure Repair Report — Sprint 04A Phase 1

**Date:** 2026-06-25 21:10 UTC  
**Status:** COMPLETE

---

## DOCKER DAEMON
**Status:** Running (v29.5.3)  
**Stability:** Intermittent crash-loop detected (2 crashes in session)  
**Service:** `com.docker.service` is MANUAL/STOPPED — cannot start without admin  
**Workaround:** Docker Desktop user process launches daemon successfully; usable but requires occasional restart

## POSTGRES
**Status:** Running  
**Container:** `brain-postgres` (postgres:15-alpine)  
**Health:** pg_isready — accepting connections  
**Uptime:** ~5 minutes (since last Docker restart)  
**Port binding:** `0.0.0.0:5432 -> 5432/tcp` ✅  
**Host port:** TCP 0.0.0.0:5432 LISTENING (PID 24452 — wsl-bootstrap)  
**Host IPv4:** TCP 127.0.0.1:5432 LISTENING (PID 43904 — host forward)

## POSTGRES — HOST CONNECTION
**Status:** Success  
**Command:** `psycopg2.connect(host='localhost', port=5432, dbname='crx_runtime', user='postgres', password='postgres')`  
**Result:** `(1,)` ✅

## POSTGRES — DATA STATE
| Table | Rows | Notes |
|---|---|---|
| events | 16 | 16x DOCUMENT_IMPORTED only |
| observations | 6992 | Heavy population, direct insert bypass |
| artifact_registry | 15 | Populated |
| authority_objects | 15 | Populated |
| authority_lineage | 4 | Populated |
| system_metadata | 2 | Populated |
| claims | 0 | Empty |
| projections | 0 | Empty |
| lineage | 0 | Empty |
| event_processing | 0 | Empty |
| objects | 0 | Empty |
| authority_witness | 0 | Empty |
| (other 6 tables) | 0 | Empty |

## POSTGRES — SCHEMA ISSUE
`events.aggregate_id` is type `uuid` but observation_worker inserts `doc_0`–`doc_5` (strings)  
→ 6 INSERT failures visible in logs (OBSERVATION_CREATED events never persisted)

## QDRANT
**Status:** Running  
**Container:** `brain-qdrant` (qdrant/qdrant:latest)  
**Port mapping:** `0.0.0.0:6333 -> 6333/tcp` ✅ (recreated — was unbound)  
**Port mapping:** `0.0.0.0:6334 -> 6334/tcp` ✅  
**Collections:** `['constitutional_documents', 'constitutional_memory']`  
**Volume:** `compose_qdrant_data` — data preserved

## COMPOSE INTEGRITY
**Files present:** compose.yaml, compose.brain.yaml, compose.dev.yaml, compose.prod.yaml, compose.minimal.yaml, compose.cpu.yaml, compose.gpu.yaml, compose.debug.yaml

## ROOT CAUSE
**RCA-1:** Docker Desktop crash-loop. `com.docker.service` is `MANUAL/STOPPED` and cannot be started from non-admin shell. Docker Desktop process starts daemon but crashes intermittently (~5-10 min windows). Likely cause: resource pressure or previous crash corruption.

**RCA-2:** Qdrant originally started without `-p 6333:6333` — port was not published to host. Recreated with correct mapping.

## FIX APPLIED
```
# Fix 1: Kill stuck Docker Desktop backend, restart
Stop-Process -Name "com.docker.backend" -Force
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Start-Sleep -Seconds 60

# Fix 2: Start Qdrant with correct port mapping
docker stop brain-qdrant
docker rm brain-qdrant
docker run -d --name brain-qdrant -p 6333:6333 -p 6334:6334 \
  --restart unless-stopped \
  -v compose_qdrant_data:/qdrant/storage \
  qdrant/qdrant:latest

# Fix 3: Start brain-postgres (restarted automatically by Docker)
docker start brain-postgres
```

## KNOWN REMAINING ISSUES
1. **Docker crash-loop** — will need monitoring; Phase 2-6 should assume daemon may restart and design accordingly
2. **OBSERVATION_CREATED events not in events table** — schema mismatch (aggregate_id should accept text or observation worker should generate proper UUIDs for document IDs)
3. **No workers running** — observation_worker etc. all exited and not set to restart

## READY FOR PHASE 2
**YES** — Postgres and Qdrant are operational, port-bound, and host-reachable.  
**Condition:** Docker Desktop stability window is ~5-10 minutes. Plan accordingly.
