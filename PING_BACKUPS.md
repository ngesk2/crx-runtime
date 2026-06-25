# PING Backups

**Purpose:** Create Google Drive backup using rclone
**Date:** 2026-06-25

---

# Installation

## Windows

1. Download rclone from https://rclone.org/downloads/
2. Extract to C:\Program Files\rclone\
3. Add to PATH: `setx PATH "%PATH%;C:\Program Files\rclone"`
4. Restart terminal
5. Verify: `rclone version`

---

# Configuration

## Google Drive Setup

1. Configure rclone with Google Drive:
```powershell
rclone config create ping-drive drive
```

2. Follow prompts:
   - Choose Google Drive
   - OAuth client ID: leave blank (use default)
   - OAuth client secret: leave blank
   - Scope: choose "1" (drive full access)
   - Root folder ID: leave blank
   - Service account file: leave blank
   - Edit advanced config: n
   - Use auto config: y
   - Open browser for OAuth
   - Authorize rclone

3. Verify:
```powershell
rclone ls ping-drive:
```

---

# Backup Script

## Full Backup

```powershell
# Backup vault
rclone sync C:\Users\nolan\PING\vault ping-drive:PING/vault

# Backup database (if PostgreSQL running)
rclone sync C:\Users\nolan\PING\data ping-drive:PING/data

# Backup configuration
rclone sync C:\Users\nolan\PING\brainos ping-drive:PING/brainos
```

## One-Time Backup

```powershell
# Initial backup
rclone copy C:\Users\nolan\PING\vault ping-drive:PING/vault-initial
```

---

# Restore Test

```powershell
# Test restore to temp location
rclone copy ping-drive:PING/vault C:\Users\nolan\PING\temp\restore-test
```

---

# Scheduled Backup

Create Windows Task Scheduler task to run backup weekly.

---

**Status:** rclone not installed. Follow installation steps above.
