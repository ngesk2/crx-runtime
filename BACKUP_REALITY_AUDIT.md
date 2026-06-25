# G.6 Backup Reality Audit

**Date:** 2026-06-25  
**Method:** Filesystem search, Drive API verification, container inspection, scheduled task check

---

## Backup Inventory

### What Actually Exists

| Item | Path/Details | Status |
|---|---|---|
| pg_dump / WAL archive | `/tmp/*.sql`? `C:\Users\nolan\PING\backup\*.sql`? | **DOES NOT EXIST** |
| /backup -> Drive mount | mount bind | **NOT CONFIGURED** |
| PING_BACKUPS on Google Drive | Expected folder | **DOES NOT EXIST** |
| DriveMirror/ files | `C:\Users\nolan\PING\DriveMirror\` | **EMPTY DIRECTORY** |
| rclone binary | rclone.exe / scoop rclone | **NOT INSTALLED** |
| pg_dump scheduled task | Task Scheduler | **NOT CONFIGURED** |
| Zip archives in repo root | `archive.zip`, `vault-backup.zip` | **STALE COPIES OF VAULT**, not Postgres backups |

### What Should Exist (But Doesn't)

1. **Postgres Dump** — `pg_dump -U postgres crx_runtime > backup-$(date +%F).sql` — never executed
2. **Qdrant Snapshot** — `POST /collections/{name}/snapshots` — never executed
3. **Drive Sync** — `rclone sync /backup remote:Backups` — never configured
4. **Cron/Scheduled Task** — Windows Task Scheduler entry for periodic backup — none found
5. **Backup Script** — Never created

### What Exists (But Is Not a Backup)

| File | Size | Content | Backup Value |
|---|---|---|---|
| `C:\Users\nolan\PING\archive.zip` | ? | Vault content | **NONE** — stale vault, not database |
| `C:\Users\nolan\PING\vault-backup.zip` | ? | Vault content | **NONE** — stale vault, not database |

---

## Drive Mirror Verification

### OAuth Token Status
- **Token exists**: `C:\Users\nolan\PING\auth_tokens\token.json` (contains `access_token`, `refresh_token`, `expiry`)
- **Token expiry**: Not expired (refresh_token present)
- **Scope**: `https://www.googleapis.com/auth/drive.file`
- **Has token ever been used for a backup?** — No. The `DriveMirror/` directory is empty.

### Drive Folder Status
- `PING_BACKUPS` folder on Google Drive — **does not exist**
- `PING_MIRROR` folder on Google Drive — **does not exist**
- Any PING-related folder on Drive — **MIRRORED DOCUMENTS DO NOT EXIST ON DRIVE**

---

## Postgres Recovery Options (Without Backup)

| Loss Scenario | Recovery Path | Outcome |
|---|---|---|
| Postgres crash (disks intact) | Docker restart | Recoverable (volume persists) |
| Volume corruption | None available | **TOTAL DATA LOSS** — 15 events, 4 tables |
| Full filesystem loss | None available | **TOTAL DATA LOSS** — no snapshot exists |
| Accidental DELETE/SELECT | None available | **TOTAL DATA LOSS** — no point-in-time recovery |

---

## Conclusion

**Operational backup rating: ZERO (0/10)**

- No backup exists anywhere
- No backup infrastructure exists (rclone, cron, Drive folder)
- Stale zip archives are not backups
- OAuth token works but has never been used
- All data is held in a single Docker volume on a single machine

The only reason data loss is not catastrophic: the dataset is small (15 events, 47 MB). But the infrastructure has no data protection at all.
