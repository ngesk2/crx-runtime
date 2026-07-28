# G.3 Volume Authority Audit

**Date:** 2026-06-25  
**Method:** `docker volume ls`, `docker volume inspect`, `docker system df`

---

## Volume Inventory

| Volume | Size | Mount | Used By | Classification |
|---|---|---|---|---|
| crx_crx-postgres-volume | ~47 MB | /var/lib/postgresql/data | brain-postgres | **AUTHORITATIVE** |
| compose_qdrant_data | ~1.2 MB | /qdrant/storage | brain-qdrant | DISPOSABLE PROJECTION |
| compose_ollama_data | 0 B | /root/.ollama | brain-ollama (stopped) | ORPHANED |
| compose_openwebui_data | 0 B | /app/backend/data | brain-openwebui (stopped) | ORPHANED |
| crx_crx-postgres-temp-volume | 0 B | /tmp | (unused) | ORPHANED |
| crx_crx-volume | 0 B | (unknown) | (unused) | ORPHANED |
| crx_crx-tmp-volume | 0 B | (unknown) | (unused) | ORPHANED |
| compose_vault_config | 0 B | /vault/config | vault (stopped) | ORPHANED |

---

## Classification

### CONSTITUTIONAL AUTHORITY (1 volume, 47 MB)
- **crx_crx-postgres-volume** — stores the only authoritative copy of all events, artifacts, authority objects, and lineage. **LOSS = PERMANENT DATA LOSS.**

### DISPOSABLE PROJECTION (1 volume, 1.2 MB)
- **compose_qdrant_data** — stores vector embeddings generated from Postgres events. Rebuildable by re-running projection worker.

### ORPHANED (5 volumes, 0 B)
- All other volumes are empty and associated with stopped containers or never-started services. They consume no meaningful disk space but add clutter.

---

## Key Findings

1. **Postgres is authoritative for everything.** 47 MB of event data is the sole source of truth. No backup exists (see BACKUP_REALITY_AUDIT.md).

2. **Qdrant is trivially disposable.** 1.2 MB of vectors can be regenerated from Postgres events in ~2 minutes per 500 events.

3. **No volume is shared between containers.** Postgres data is accessible only to brain-postgres. Qdrant data is accessible only to brain-qdrant. No NFS, no shared filesystem.

4. **Zero volumes are encrypted at rest.** Docker volumes use default local driver (ext4/VFS on Windows). No encryption, no access control beyond OS file permissions.

5. **22 GB disk consumed by images** (ollama 8.25 × 1 shared + open-webui 6.73 × 2 + postgres 0.4 + qdrant 0.27 + gateway 0.2 + ui-next 0.67 + vault 0.74 + alpine 0.013 + mission-control 0.91 = ~22 GB). Volumes consume negligible space.
