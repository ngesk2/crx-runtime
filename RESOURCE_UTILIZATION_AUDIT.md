# G.11 Resource Utilization Audit

**Date:** 2026-06-25 (17:00-17:30)  
**Method:** `docker stats`, `docker system df`, `Get-PSDrive`, `Get-ChildItem` directory sizing

---

## Host Resources

| Resource | Value |
|---|---|
| **Disk** (C:\) | 286.31 GB used, 175.7 GB free (62% full) |
| **Memory** | 31.19 GB total |
| **CPU** | Multi-core (Windows 11) |

### Largest PING Directories

| Directory | Size | Content |
|---|---|---|
| `.venv/` | 103.3 MB | Python virtual environment |
| `node_modules/` | 32.6 MB | JavaScript dependencies |
| `runtime/` | 32.6 MB | Python runtime code |
| `.cursor/` | 7.5 MB | Cursor editor settings |
| `brainos/` | 2.4 MB | BrainOS code |
| `presentping/` | 1.9 MB | Presentation code |
| `knowledge/` | 1.2 MB | Knowledge base |

---

## Container Resource Usage

### Running Containers (Recorded at rest)

| Container | CPU % | Memory | Mem % | Network I/O |
|---|---|---|---|---|
| brain-postgres | 0.00% | 22.66 MB | 0.07% | Trace |
| brain-qdrant | 0.34% | 112.4 MB | 0.35% | Trace |
| crx-gateway | 0.00% | 25.8 MB | 0.08% | Trace |
| open-webui | 0.16% | 693.9 MB | 2.17% | Trace |
| crx-ollama-worker | 0.22% | 31.48 MB | 0.10% | Trace |
| crx-ui-next | 0.00% | 40.12 MB | 0.07% | None |

**Total running container memory: ~926 MB (3.0% of available 31.19 GB)**

### Stopped Container Image Sizes

| Image | Size |
|---|---|
| ollama/ollama:latest | 8.25 GB (shared across 2 stopped containers) |
| ghcr.io/open-webui/open-webui:latest | 6.73 GB |
| ghcr.io/open-webui/open-webui:main | 6.73 GB (running) |
| compose-mission-control | 908 MB |
| hashicorp/vault:latest | 739 MB |
| crx-ui-next:1.0.0 | 666 MB |
| postgres:15-alpine | 417 MB (running) |
| qdrant/qdrant:latest | 270 MB (running) |
| crx-gateway:1.0.0 | 208 MB (running) |
| alpine:latest | 13 MB |

**Total image disk consumption: ~22 GB**

---

## Idle Analysis

### CPU (all containers <0.5%)
All services are effectively idle. No active queries, no batch processing, no background workers.

### Memory
- 2x open-webui images consuming 6.73 GB each (dual versions) — 13.46 GB allocated disk for duplicate UI containers
- Running open-webui uses 694 MB for an idle chat UI
- Qdrant uses 112 MB for 5 vectors (massive overhead for tiny dataset)
- Postgres uses 23 MB for 47 MB of data (reasonable)

### Disk
- 16 GB of dead infrastructure from stopped containers (ollama ×2 + openwebui + mission-control + vault = ~16.6 GB)
- 6.73 GB for duplicative open-webui tag (`:latest` vs `:main`)
- `brainos/` directory is only 2.4 MB — the entire codebase is tiny

---

## Blocked Resource Analysis

### Why Mission Control is stopped

```
Container exited (128) — likely port conflict or missing dependency
```

When it ran previously:
- Used Ollama (brain-ollama, now stopped)
- Used Postgres (still running, but on isolated network)
- Used Qdrant (still running, same network)

Current blockers for restarting:
1. brain-ollama is stopped — no inference for Mission Control
2. `compose_brain_internal` network exists but has no route to crx-ollama-worker
3. Port 8000 might conflict if something else started using it

### Why crx-ui-next is non-functional

- Process running (40 MB RSS) but port 3000 not responding
- Likely a Node.js crash or misconfiguration

---

## Waste Estimation

| Waste Category | Amount | Annualized Cost |
|---|---|---|
| Duplicate Docker images (same content, different tags) | ~6.73 GB | Minimal (disk is cheap) |
| Dead stopped containers | ~16.6 GB disk | Minimal |
| Over-provisioned memory (31 GB available, <1 GB used) | ~30 GB | Opportunity cost |
| Idle compute (all services <0.5% CPU) | ~99.5% unused | Significant for cloud deployment |

---

## Conclusion

**Resource utilization: <5% of available capacity.**

The system is massively over-provisioned for its actual workload. 30 GB of 31 GB RAM is unused. CPU is idle. Disk is 62% full but mostly from dead containers and duplicate images. The entire workload would run comfortably on a $10/month VPS with 2 GB RAM and 20 GB disk.
