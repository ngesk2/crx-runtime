# G.4 Container Dependency Audit

**Date:** 2026-06-25  
**Method:** `docker inspect`, compose file analysis, network connectivity tests, env var inspection

---

## Dependency Graph

```
=== compose_brain_internal ===

brain-postgres ─────────────────────────────────┐
  │                                              │
  ├── Depends-on: none                           │
  ├── Env: POSTGRES_USER/PASSWORD/DATABASE      │
  └── Used by (coded but no container):          │
      ├── ping-mission-control (stopped)         │
      ├── projection_worker.py (coded)           │
      ├── constitutional_retrieval.py (coded)    │
      └── Various workers (coded, undeployed)    │
                                                 │
brain-qdrant ────────────────────────────────────┤
  │                                              │
  ├── Depends-on: none                           │
  └── Used by (coded but no container):          │
      ├── ping-mission-control (stopped)         │
      └── projection_worker.py (coded)           │
                                                 │
[brain-ollama (stopped)] ────────────────────────┤
  └── Was used by: ping-mission-control          │
                                                 │
[brain-openwebui (stopped)] ─────────────────────┤
  └── Was used by: users (port 3000)             │
                                                 │
                                                 │
=== crx_crx-network ===                          │
                                                 │
crx-gateway ─────────────────────────────────────┤
  │                                              │
  ├── Depends-on: none                           │
  ├── Port: 8080->8080                          │
  └── Connected to: crx_crx-network              │
                                                 │
[crx-ai-worker (stopped)] ───────────────────────┤
[crx-email-worker (stopped)] ────────────────────┤
                                                 │
                                                 │
=== Isolated (no network) ===                    │
                                                 │
crx-ollama-worker ───────────────────────────────┤
  ├── No network connectivity                    │
  ├── Port 11434 (not exposed)                   │
  └── Processes API calls from crx-gateway?      │
      (Cannot verify — no cross-network route)   │
                                                 │
crx-ui-next ─────────────────────────────────────┤
  ├── No network connectivity                    │
  ├── Port 3000 (not responding)                 │
  └── Appears non-functional                     │
                                                 │
crx-digestion-worker_default ────────────────────┤
                                                 │
open-webui ──────────────────────────────────────┤
  ├── Port 3001->8080 (exposed to host)          │
  └── Ollama accessible via host:11434?          │
      (No direct network — relies on host proxy) │
```

---

## Key Findings

### 1. Three Independent Network Domains — No Cross-Domain Routes

| Domain | Containers | 
|---|---|
| `compose_brain_internal` (172.21.0.x) | brain-postgres, brain-qdrant (+ stopped containers) |
| `crx_crx-network` (172.19.0.x) | crx-gateway (+ stopped workers) |
| `crx-digestion-worker_default` (172.20.0.x) | open-webui |

**No container can reach another domain** without host port mapping.

### 2. Postgres/Qdrant Are Network-Isolated

brain-postgres (172.21.0.2) and brain-qdrant (172.21.0.3) are on an internal network with:
- No host port mapping
- No other running containers on that network
- **Only accessible from: nothing running**

This means:
- crx-gateway cannot reach brain-postgres
- crx-ollama-worker cannot reach brain-postgres  
- open-webui cannot reach brain-postgres
- **No running service can access the constitutional event store**

### 3. crx-ollama-worker Has No Network

Despite being the sole inference engine, crx-ollama-worker:
- Has no network interfaces (confirmed by `docker inspect`)
- Exposes no ports to host
- Cannot reach Gateway, Postgres, or any other service

**How does Gateway reach Ollama?** They communicate via `host.docker.internal:11434` or similar host proxy — this is a fragile dependency on Docker Desktop's DNS resolution.

### 4. crx-ui-next Is Non-Functional

Port 3000 returns 000 status. The container runs (40 MB RSS) but:
- No network connectivity
- No responding HTTP handler
- **Appears to be a build artifact that never started its application**

### 5. No Container Has a `depends_on` Chain

`docker inspect` shows zero `DependsOn` for any running container:
- No startup ordering
- If Postgres restarts, workers that need it will simply error until retry
- If Qdrant restarts, same situation

### 6. The dependency on Postgres is CODED but not DEPLOYED

`constitutional_retrieval.py`, `projection_worker.py`, `claim_worker.py`, `summary_worker.py`, etc. all import and use Postgres/Qdrant connections — but **none of these are running in any container right now**.

---

## Dependency Table

| Service | Depends On | Required By | Connection Method |
|---|---|---|---|
| brain-postgres | nothing | Mission Control (stopped), workers (undeployed) | docker network (172.21.0.x) |
| brain-qdrant | nothing | Mission Control (stopped), projection worker (undeployed) | docker network (172.21.0.x) |
| brain-ollama (stopped) | nothing | Mission Control (stopped) | docker network (172.21.0.x) |
| crx-gateway | nothing (coded: ollama, postgres) | UI users | host:8080 |
| crx-ollama-worker | nothing | crx-gateway (via host proxy) | host.docker.internal:11434 |
| open-webui | nothing | Users | host:3001 |
| crx-ui-next | nothing | Users (non-functional) | host:3000 |

---

## Conclusion

**The runtime dependency graph is three disconnected clusters.** The single authoritative data store (Postgres) is in a cluster with zero running consumers. The inference engine (Ollama) is in a cluster with zero network access. The UI layer (Gateway, Open WebUI) somehow bridges these gaps via host port mapping — a fragile, undocumented topology.
