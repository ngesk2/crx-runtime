# Drive Mirror Audit

**Date:** 2026-06-24  
**Method:** Container-grounded inspection (filesystem, process table, API verification, registry, task scheduler, Docker, git)  
**Scope:** Read-only audit. No files modified, no migration attempted.

---

## 1. Repositories In Scope

| Repository | Path | Remote | Type |
|---|---|---|---|
| crx-runtime (main) | `C:\Users\nolan\PING` | `github.com/ngesk2/crx-runtime.git` | Git (HEAD `071782e`, branch `audit-hardening`) |
| runtime (submodule) | `C:\Users\nolan\PING\runtime` | `github.com/ngesk2/crx-runtime.git` (pinned `2709b18`) | Git submodule |
| knowledge | `C:\Users\nolan\PING\knowledge` | **No remote set** | Standalone Git repo (4 commits, local only) |
| vos | `C:\Users\nolan\PING\vos` | **No remote set** | Standalone Git repo (2 commits, local only) |

**No repository is mirrored to Google Drive.**

---

## 2. What Tools Exist for Mirroring

### Installed Tools

| Tool | Status | Evidence |
|---|---|---|
| `robocopy` | Installed (Windows built-in) | `C:\Windows\system32\Robocopy.exe` |
| `rclone` | **NOT installed** | No binary found in PATH, no config file (`rclone.conf`) at any standard location |
| `rsync` | **NOT installed** | Not found in PATH |
| `git-remote-gdrive` | **NOT installed** | Not found |
| Google Drive Desktop | **NOT installed** | No `Google Drive` in `HKLM\Software\...\Uninstall`, no `DriveFS` directory, no `GoogleDrive` process/service |
| Python Google API client | **NOT installed** | `google-api-python-client` and `google-auth-oauthlib` not found in `.venv` or system Python |

### Sync Scripts (exist but never executed)

| Script | Purpose | Status |
|---|---|---|
| `brainos/orchestration/src/google_drive_backup.py` | Vault backup to Drive via OAuth | **NEVER EXECUTED** — dependencies not installed, no PING_BACKUPS folder exists on Drive |
| `brainos/orchestration/scripts/backup_postgres.ps1` | pg_dump + rclone sync to Drive | **NEVER EXECUTED** — references `rclone` which is not installed |
| `brainos/orchestration/scripts/backup_postgres.sh` | Same, Linux variant | **NEVER EXECUTED** — same reason |
| `runtime/ingestion/drive_ingestor.py` | Poll Drive for changes → Postgres events | **UNDEPLOYED** — not in Docker image |
| `runtime/adapters/google_drive/google_drive_ingestion_adapter.py` | Drive file download + event generation | **UNDEPLOYED** — not in Docker image |
| `brainos/orchestration/src/google_drive_ingestion.py` | Drive → Observation Event → Postgres pipeline | **UNDEPLOYED** — not in Docker image |

---

## 3. Source of Truth

| Layer | Source | Authority |
|---|---|---|
| **Code** | `C:\Users\nolan\PING` (local filesystem) | Primary — git remote at `github.com/ngesk2/crx-runtime.git` |
| **Git origin** | `github.com/ngesk2/crx-runtime.git` | Upstream — push/pull via HTTPS |
| **Vault (constitutional docs)** | `C:\Users\nolan\PING\vault/` (34 files) | Local filesystem only — no Drive backup exists |
| **Postgres data** | Docker volume `compose_postgres_data` | No backup script has ever run |
| **Qdrant vectors** | Cloud Qdrant (managed) | Constitutional docs (5 points) — no local snapshot mechanism |

---

## 4. Destination Paths (Drive)

### Designed destinations (code-defined but never materialized)

| Module | Intended Drive Path | Status |
|---|---|---|
| `google_drive_backup.py` | `PING_BACKUPS/` folder | **DOES NOT EXIST on Drive** |
| `backup_postgres.ps1` | `gdrive:PING_BACKUPS/postgres/` | **DOES NOT EXIST** (rclone not installed) |
| DriveMirror/ | `C:\Users\nolan\PING\DriveMirror/` | **EMPTY** — directory exists, zero files |

### Actual Drive state (verified via API, token refresh successful)

| Metric | Value |
|---|---|
| Total files on Drive | 39 |
| Total folders on Drive | 1 (`PICTURES`) |
| Folders matching PING names | **0** |
| Files matching PING namespace | **0** |
| OAuth scopes | `drive.readonly`, `drive.metadata.readonly` — **read-only only** |
| Token status | Functional (refresh verified 2026-06-24) |

The 39 files on Drive are **PING presentation and script content** (16 PPTX, 8 DOCX, 5 Google Docs, 9 PNG, 1 binary) — all at root level, **zero folder hierarchy**. These files were uploaded manually (not via any automated pipeline). They are NOT mirrors of local repository content.

---

## 5. Direction

**Intended:** One-way (local → Drive).  
**Actual:** No data flow exists in either direction.

- OAuth scopes are **`drive.readonly`** only — cannot write to Drive
- No script has ever successfully written anything to Drive under the PING namespace
- The only folder on Drive is `PICTURES` (pre-existing, not PING-related)

---

## 6. Scheduling / Triggering

| Mechanism | Status | Evidence |
|---|---|---|
| Windows Task Scheduler | **No sync tasks exist** | Only OneDrive tasks present |
| Windows Startup folder | **No Drive/PING tasks** | Only Tailscale present |
| WSL crontab | **Empty** | `crontab -l` returns empty |
| Docker cron/scheduler | **None** | No scheduler container in compose files |
| Mission Control endpoints | **No backup endpoints in running app.py** | `app.py` has no `/backup/*` routes |
| `run_continuous()` in drive_ingestor.py | **UNDEPLOYED** | Not in Docker image, never called |

**No scheduled, event-driven, or automated mirroring exists.**

---

## 7. Current Functioning Status

**NOT FUNCTIONING.** Zero data flows between the local repository and Google Drive.

| Component | Functioning? | Evidence |
|---|---|---|
| OAuth token | ✅ YES | Refresh verified 2026-06-24, returns 200 |
| Drive API read access | ✅ YES | Can list files, search, get metadata |
| `DriveMirror/` directory | ❌ EMPTY | Exists but contains zero files |
| PING_BACKUPS folder on Drive | ❌ DOES NOT EXIST | API query returns empty |
| Backup scripts | ❌ NEVER EXECUTED | Dependencies missing, no output artifacts |
| Ingestion workers | ❌ UNDEPLOYED | Not in Docker image or compose config |

---

## 8. Duplicate Mirrors

**None detected.**

- No secondary git remotes referencing Drive
- No clone/bare repos pointing to Drive
- No worktree on Drive paths
- No `gdrive`, `googledrive`, or `rclone` remotes

---

## 9. Stale Mirrors

**The `DriveMirror/` directory** at `C:\Users\nolan\PING\DriveMirror/` is stale — it is an empty directory created `2026-06-23 21:18:38` and never populated. It represents a planned mirror infrastructure that was never executed.

**No other stale mirrors exist.**

---

## 10. Data Loss Risk Assessment

### Scenario: Drive becomes authoritative

If Google Drive were treated as the authoritative source:

| Asset | On Drive? | Loss? |
|---|---|---|
| Source code (PING/) | **NO** | **TOTAL LOSS** — 0 files mirrored |
| Vault/constitutional docs (34 files) | **NO** | **TOTAL LOSS** — no backup exists on Drive |
| Knowledge docs (~100 files) | **NO** | **TOTAL LOSS** — not mirrored |
| VOS governance (~200 files) | **NO** | **TOTAL LOSS** — not mirrored |
| Postgres data (~1044 events) | **NO** | **TOTAL LOSS** — no backup executed |
| Qdrant vectors (5 constitutional docs) | **NO** | **TOTAL LOSS** — no snapshot mechanism |
| Docker volumes | **NO** | **TOTAL LOSS** — no backup mechanism |
| **Drive-only assets** (39 files) | **YES** | **Only assets that survive** |
| OneDrive-backed Desktop/Documents | **NO** | OneDrive syncs these independently |

### Scenario: Local filesystem becomes authoritative

| Asset | Local? | Loss? |
|---|---|---|
| Drive presentations (16 PPTX + native Google formats) | **NO** | **TOTAL LOSS** — 39 files only exist on Drive |
| PING_Constitutional_Kernel_Master_Script.docx | **NO** (local version likely outdated) | **PARTIAL LOSS** — local version may differ |

**Net risk:** High in both directions. The systems are fully disconnected — no data flows between local storage and Drive.

---

## Failure Mode Analysis

| Mode | Trigger | Impact |
|---|---|---|
| **Drive token expiry** | No automated refresh loop | Scripts fail with 401 — no retry mechanism |
| **Drive API quota exhaustion** | Manual repeated queries | Temporary read failure until quota resets |
| **Local disk failure** | SSD failure, corruption | Total loss of all code, vault, DB, Qdrant (no Drive backup) |
| **GitHub availability loss** | GitHub outage | Cannot push/pull — no gating mirror |
| **OneDrive conflict** | Desktop/Documents redirect | User may believe PING is backed up via Desktop → it is NOT |
| **DriveMirror/ directory confusion** | Empty directory exists | False sense of security — appears populated from `dir` but is empty |

---

## Recommendation

### Classification: **REPO → DRIVE MIRROR DOES NOT EXIST**

The infrastructure for mirroring is partially built at the code level (backup scripts exist, OAuth token works) but **zero data has ever flowed** to Drive. This is a pre-alpha capability — scaffolding without execution.

### Recommended Priority Actions

1. **Install `google-api-python-client` and `google-auth-oauthlib`** into the active Python environment
2. **Widen OAuth scope** — current scopes are `drive.readonly` only; cannot write backups
3. **Execute `google_drive_backup.py` once** to create PING_BACKUPS folder and seed initial backup
4. **Deploy ingestion workers** (`drive_ingestor.py`, `google_drive_ingestion_adapter.py`) into the Docker image
5. **Establish one source of truth** — decide whether Drive is backup target (write-only) or canonical source (read-write)
6. **Remove empty `DriveMirror/` directory** or populate it — empty directories create false confidence

### Files Examined

| File | Relevance |
|---|---|
| `token.json` | OAuth token (functional, refreshable) |
| `credentials/client_secret.json` | OAuth client config |
| `google_drive_oauth.py` | OAuth flow initiator (port 80 redirect) |
| `verify_google_drive_access.py` | Drive API read verification script |
| `drive_inventory.py` | Inventory script |
| `google_drive_backup.py` | Backup worker (NEVER EXECUTED) |
| `google_drive_ingestion.py` | Ingestion worker (UNDEPLOYED) |
| `runtime/ingestion/drive_ingestor.py` | Drive poller (UNDEPLOYED) |
| `runtime/adapters/google_drive/google_drive_ingestion_adapter.py` | Drive adapter (UNDEPLOYED) |
| `brainos/orchestration/scripts/backup_postgres.ps1` | DB backup script (references uninstalled rclone) |
| `brainos/orchestration/scripts/backup_postgres.sh` | DB backup script (references uninstalled rclone) |
| `DRIVE_INVENTORY.md` | Previous inventory (39 files, 0 folders) |
| `DRIVE_MIRROR_AUDIT.json` | Previous audit (mirror_parity: 0.0) |
| `GOOGLE_DRIVE_REALITY_REPORT.md` | Reality report |
| `GOOGLE_DRIVE_SURVIVABILITY_CERTIFICATION.md` | Survivability cert |
| `GOOGLE_DRIVE_OAUTH_AUDIT.md` | OAuth audit |
| `audit_reports/drive_duplication_report.csv` | Duplication scan (all paths NOT FOUND) |
| `docker-compose*.yml` | Compose files (no Drive-related services) |
| `.env.*` | Environment files (no Drive references) |
