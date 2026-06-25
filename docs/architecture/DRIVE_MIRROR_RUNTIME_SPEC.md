# Drive Mirror Runtime Specification

## Overview

The Drive Mirror Runtime defines the constitutional contract for Google Drive mirroring, synchronization, and indexing in the PING Cognitive Operating System.

**Version:** v1
**Stability:** Stable
**Last Updated:** 2026-06-25

---

## Purpose

Convert Google Drive from a live dependency into a constitutional mirror source identical to GitHub, ensuring:
- Drive is never queried during retrieval
- Drive is only queried during synchronization
- All retrieval operates exclusively from local mirrors
- Ollama never accesses Drive
- Agent Runtime never accesses Drive directly
- Repository Runtime owns all Drive synchronization

---

## Canonical Directory Layout

### Directory Structure

```
C:\PING\repositories\drive\
├── manifests\          # Drive file manifests
├── mirrors\           # Downloaded file mirrors
├── revisions\         # Revision history
├── hashes\            # Content hashes
└── indexes\           # Generated indexes
```

### Directory Responsibilities

| Directory | Purpose | Constitutional Property |
|-----------|---------|------------------------|
| `manifests/` | Drive file metadata | Source of truth for Drive metadata |
| `mirrors/` | Downloaded file mirrors | Source of truth for Drive content |
| `revisions/` | Revision history | Reproducible from Drive API |
| `hashes/` | Content hashes | Reproducible from mirrors |
| `indexes/` | Generated indexes | Reproducible from mirrors |

---

## Constitutional Invariants

### Invariant 1: Drive is Never Queried During Retrieval

**Statement:** All retrieval operations use local mirrors only.

**Implementation:**
- Retrieval Service reads from `mirrors/` directory
- No Google Drive API calls during retrieval
- No network access to Google Drive during retrieval
- All content available locally

**Verification:**
- Retrieval Service has no Google Drive API client
- Retrieval Service has no network access to Google Drive
- All retrieval operations use local file paths
- Retrieval works offline

**Constitutional Test:**
```
1. Disconnect from internet
2. Attempt retrieval from Drive mirrors
3. Result: Successful retrieval
```

---

### Invariant 2: Drive is Only Queried During Synchronization

**Statement:** Google Drive API calls only happen during sync.

**Implementation:**
- Repository Runtime owns all Drive synchronization
- Sync Service is the only Drive API client
- Sync runs on schedule, not on-demand
- No other services call Drive API

**Verification:**
- Only Repository Runtime has Drive API credentials
- Only Sync Service calls Drive API
- No other services import Drive API libraries
- Drive API calls logged to sync events

**Constitutional Test:**
```
1. Enable Drive API call logging
2. Run retrieval operations
3. Verify no Drive API calls
4. Run sync operations
5. Verify Drive API calls only during sync
```

---

### Invariant 3: All Retrieval Operates Exclusively from Local Mirrors

**Statement:** Retrieval never accesses Google Drive directly.

**Implementation:**
- Retrieval Service reads from `mirrors/` directory
- Retrieval Service has no Drive API access
- All Drive content is pre-mirrored
- Retrieval is offline-capable

**Verification:**
- Retrieval Service configuration points to local mirrors
- Retrieval Service has no Drive API credentials
- Retrieval works without internet
- All Drive content is in mirrors

**Constitutional Test:**
```
1. Disconnect from internet
2. Retrieve Drive content
3. Result: Successful retrieval
```

---

### Invariant 4: Ollama Never Accesses Drive

**Statement:** Ollama receives assembled context from Mission Control.

**Implementation:**
- Ollama has no Drive API client
- Ollama has no access to Drive mirrors
- Mission Control assembles context from indexes
- Ollama receives context via API

**Verification:**
- Ollama service has no Drive directory mounts
- Ollama service has no Drive API credentials
- Ollama receives context via HTTP API
- No direct file reads from Drive

**Constitutional Test:**
```
1. Ollama attempts to read Drive file
2. Result: File not found / permission denied
```

---

### Invariant 5: Agent Runtime Never Accesses Drive Directly

**Statement:** Agent Runtime accesses Drive via Repository Runtime API.

**Implementation:**
- Agent Runtime has no Drive API client
- Agent Runtime calls Repository Runtime API
- Repository Runtime handles Drive access
- Agent Runtime receives content via API

**Verification:**
- Agent Runtime has no Drive API credentials
- Agent Runtime calls Repository Runtime API
- Agent Runtime has no direct Drive access
- All Drive access goes through Repository Runtime

**Constitutional Test:**
```
1. Agent Runtime attempts direct Drive access
2. Result: Permission denied
```

---

### Invariant 6: Repository Runtime Owns All Drive Synchronization

**Statement:** Only Repository Runtime synchronizes Drive mirrors.

**Implementation:**
- Repository Runtime owns Drive API credentials
- Repository Runtime runs sync operations
- No other services sync Drive
- Sync events emitted by Repository Runtime

**Verification:**
- Only Repository Runtime has Drive API credentials
- Only Repository Runtime runs sync operations
- No other services call Drive API
- All sync events from Repository Runtime

**Constitutional Test:**
```
1. Check Drive API credential access
2. Verify only Repository Runtime has credentials
3. Verify only Repository Runtime calls Drive API
```

---

## Drive Mirror Manifest Schema

### Manifest Structure

```json
{
  "drive_file_id": "string",
  "drive_revision_id": "string",
  "mime_type": "string",
  "sha256": "string",
  "mirror_timestamp": "ISO8601",
  "source_url": "string",
  "local_path": "string",
  "file_size_bytes": "integer",
  "checksum_verified": "boolean",
  "sync_status": "string"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `drive_file_id` | string | Google Drive file ID |
| `drive_revision_id` | string | Google Drive revision ID |
| `mime_type` | string | File MIME type |
| `sha256` | string | SHA256 hash of file content |
| `mirror_timestamp` | ISO8601 | Timestamp when file was mirrored |
| `source_url` | string | Original Drive URL |
| `local_path` | string | Local mirror path |
| `file_size_bytes` | integer | File size in bytes |
| `checksum_verified` | boolean | Whether checksum was verified |
| `sync_status` | string | Sync status (synced, changed, deleted) |

### Manifest Storage

**Location:** `C:\PING\repositories\drive\manifests\{drive_file_id}.json`

**Database:** PostgreSQL `drive_manifests` table

**Fields:**
- `drive_file_id` (TEXT) - Primary key
- `drive_revision_id` (TEXT) - Revision ID
- `mime_type` (TEXT) - MIME type
- `sha256` (TEXT) - Content hash
- `mirror_timestamp` (TIMESTAMP) - Mirror timestamp
- `source_url` (TEXT) - Source URL
- `local_path` (TEXT) - Local path
- `file_size_bytes` (INTEGER) - File size
- `checksum_verified` (BOOLEAN) - Checksum verified
- `sync_status` (TEXT) - Sync status

---

## Repository Events

### Event Types

| Event Type | Trigger | Purpose |
|------------|---------|---------|
| `DRIVE_SYNC_STARTED` | Sync operation started | Notify sync start |
| `DRIVE_FILE_MIRRORED` | File mirrored | Notify file mirror completion |
| `DRIVE_FILE_CHANGED` | File changed | Notify file change |
| `DRIVE_FILE_DELETED` | File deleted | Notify file deletion |
| `DRIVE_SYNC_COMPLETED` | Sync completed | Notify sync completion |

### Event Schemas

#### DRIVE_SYNC_STARTED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_SYNC_STARTED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "sync_uuid",
  "aggregate_type": "DRIVE_SYNC",
  "event_data": {
    "sync_id": "uuid",
    "drive_folder_id": "string",
    "file_count": 100
  }
}
```

#### DRIVE_FILE_MIRRORED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_FILE_MIRRORED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "drive_file_id",
  "aggregate_type": "DRIVE_FILE",
  "event_data": {
    "drive_file_id": "string",
    "drive_revision_id": "string",
    "local_path": "string",
    "sha256": "string",
    "file_size_bytes": 1000
  }
}
```

#### DRIVE_FILE_CHANGED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_FILE_CHANGED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "drive_file_id",
  "aggregate_type": "DRIVE_FILE",
  "event_data": {
    "drive_file_id": "string",
    "old_revision_id": "string",
    "new_revision_id": "string",
    "change_type": "content_modified"
  }
}
```

#### DRIVE_FILE_DELETED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_FILE_DELETED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "drive_file_id",
  "aggregate_type": "DRIVE_FILE",
  "event_data": {
    "drive_file_id": "string",
    "local_path": "string",
    "deleted_timestamp": "2026-06-25T00:00:00Z"
  }
}
```

#### DRIVE_SYNC_COMPLETED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_SYNC_COMPLETED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "sync_uuid",
  "aggregate_type": "DRIVE_SYNC",
  "event_data": {
    "sync_id": "uuid",
    "files_mirrored": 100,
    "files_changed": 10,
    "files_deleted": 2,
    "duration_seconds": 300
  }
}
```

---

## Replay Requirements

### State Reconstruction

**Requirement:** Deleting all indexes must allow complete reconstruction from Drive mirrors alone.

**Implementation:**
- All indexes derived from mirrors
- Index generation is deterministic
- Indexes can be deleted and regenerated
- Index metadata includes source hash

**Verification:**
- Delete all indexes
- Regenerate from mirrors
- Compare regenerated indexes with originals
- Result: Identical

**Constitutional Test:**
```
1. Generate indexes from Drive mirrors
2. Record index hashes
3. Delete all indexes
4. Regenerate indexes from mirrors
5. Compare hashes
6. Result: Identical
```

---

## Offline Mode

### Offline Capabilities

**Requirement:** If Google Drive becomes unavailable, all services must continue using mirrors only.

**Capabilities:**
- ✅ Retrieval works
- ✅ Indexing works
- ✅ Graph Runtime works
- ✅ Memory Runtime works
- ❌ Synchronization does not work (expected)

### Offline Verification

**Test:**
```
1. Disconnect from internet
2. Attempt retrieval from Drive mirrors
3. Attempt indexing from Drive mirrors
4. Attempt graph operations from Drive mirrors
5. Attempt memory operations from Drive mirrors
6. Result: All operations successful
```

### Offline Limitations

**Expected Limitations:**
- Synchronization cannot run
- New Drive files cannot be mirrored
- Changed Drive files cannot be updated
- Deleted Drive files cannot be detected

**Mitigation:**
- Sync runs on schedule
- Last known state remains available
- Manual sync trigger when connection restored
- Sync queue for pending operations

---

## Service Contract

### Drive Sync Service

**Service Name:** Drive Sync Service
**Port:** 8085 (shared with Repository Runtime)
**URL:** `http://repo_runtime:8085`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/drive/sync` | POST | Trigger Drive synchronization |
| `/drive/sync/status` | GET | Get sync status |
| `/drive/file/{file_id}` | GET | Get Drive file manifest |
| `/drive/file/{file_id}/content` | GET | Get Drive file content |
| `/drive/rebuild` | POST | Rebuild Drive mirrors |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DRIVE_SYNC_SERVICE_URL` | http://repo_runtime:8085 | Drive sync service URL |
| `DRIVE_CREDENTIALS_PATH` | C:\PING\secrets\drive\credentials.json | Drive credentials path |
| `DRIVE_SYNC_INTERVAL_SECONDS` | 3600 | Sync interval (seconds) |
| `DRIVE_MIRROR_ROOT` | C:\PING\repositories\drive | Mirror root directory |
| `DRIVE_INCREMENTAL_SYNC` | true | Enable incremental sync |

### Repository Runtime Ownership

**Repository Runtime Owns:**
- Synchronization
- Mirror updates
- Revision tracking
- Checksum validation

**No Other Service May:**
- Call Google Drive APIs
- Access Drive mirrors directly
- Modify Drive manifests
- Trigger Drive synchronization

---

## Security Considerations

### OAuth Credential Storage

**Location:** `C:\PING\secrets\drive\credentials.json`

**Environment Variable:** `DRIVE_CREDENTIALS_PATH`

**Permissions:**
- File owner: read-only
- Group: no permissions
- Others: no permissions

**Usage:**
```python
import os
import json

credentials_path = os.getenv("DRIVE_CREDENTIALS_PATH")

with open(credentials_path, "r") as f:
    credentials = json.load(f)
```

### Credential Rotation

**Frequency:** Every 90 days

**Process:**
1. Generate new OAuth credentials
2. Update credentials file
3. Update environment variables
4. Restart Repository Runtime
5. Verify sync operations work
6. Revoke old credentials

---

## Performance Considerations

### Incremental Synchronization

**Purpose:** Only sync changed files.

**Implementation:**
```python
def incremental_sync(drive_folder_id: str, last_sync_timestamp: str):
    """Sync only changed files"""
    # Get changes since last sync
    changes = drive_service.list_changes(last_sync_timestamp)
    
    for change in changes:
        if change['removed']:
            handle_file_deleted(change['fileId'])
        else:
            handle_file_changed(change['fileId'])
```

### Parallel Processing

**Purpose:** Download multiple files simultaneously.

**Implementation:**
```python
from concurrent.futures import ThreadPoolExecutor

def parallel_download(files: List[str]):
    """Download files in parallel"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(download_file, files)
```

---

## Monitoring and Observability

### Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `drive_sync_duration` | Time to sync Drive | < 10 minutes |
| `drive_files_mirrored` | Number of files mirrored | < 10,000 |
| `drive_sync_errors` | Number of sync errors | < 5% |
| `drive_storage_size` | Storage used | < 100 GB |

### Logging

**Log Levels:**
- INFO: Sync start, sync completion, file mirrored
- WARN: Large files, slow operations, sync errors
- ERROR: Sync failures, authentication failures

**Log Format:**
```json
{
  "timestamp": "2026-06-25T00:00:00Z",
  "level": "INFO",
  "service": "drive_sync",
  "message": "Drive sync completed",
  "files_mirrored": 100,
  "duration_seconds": 300
}
```

---

## Constitutional Tests

### Test 1: Drive Not Queried During Retrieval

**Steps:**
1. Enable Drive API call logging
2. Run retrieval operations
3. Verify no Drive API calls

**Expected Result:** No Drive API calls

---

### Test 2: Drive Only Queried During Sync

**Steps:**
1. Enable Drive API call logging
2. Run sync operations
3. Verify Drive API calls only during sync

**Expected Result:** Drive API calls only during sync

---

### Test 3: Retrieval from Mirrors Only

**Steps:**
1. Disconnect from internet
2. Retrieve Drive content
3. Verify retrieval succeeds

**Expected Result:** Successful retrieval

---

### Test 4: Ollama No Drive Access

**Steps:**
1. Ollama attempts to read Drive file
2. Verify read fails

**Expected Result:** File not found / permission denied

---

### Test 5: Agent Runtime No Direct Drive Access

**Steps:**
1. Agent Runtime attempts direct Drive access
2. Verify access fails

**Expected Result:** Permission denied

---

### Test 6: Repository Runtime Owns Sync

**Steps:**
1. Check Drive API credential access
2. Verify only Repository Runtime has credentials
3. Verify only Repository Runtime calls Drive API

**Expected Result:** Only Repository Runtime has Drive access

---

### Test 7: Offline Mode

**Steps:**
1. Disconnect from internet
2. Attempt retrieval, indexing, graph, memory operations
3. Verify all operations succeed

**Expected Result:** All operations successful

---

### Test 8: Index Rebuildability

**Steps:**
1. Generate indexes from Drive mirrors
2. Record index hashes
3. Delete all indexes
4. Regenerate indexes from mirrors
5. Compare hashes

**Expected Result:** Hashes are identical

---

## Migration Path

### From Live Drive Access

1. Mirror all Drive files to local storage
2. Generate manifests for all files
3. Update services to use mirrors
4. Disable live Drive access
5. Verify all operations work offline
6. Implement sync service
7. Verify sync operations work

### From No Drive Integration

1. Set up Drive API credentials
2. Configure Repository Runtime
3. Run initial sync
4. Generate indexes
5. Verify all operations work
6. Test offline mode
7. Test sync operations

---

## Status

**FROZEN** - This specification is constitutional and cannot be changed without breaking Drive mirror guarantees.

**Date:** 2026-06-25
**Version:** 1.0
**Implementation Status:** Not Implemented
