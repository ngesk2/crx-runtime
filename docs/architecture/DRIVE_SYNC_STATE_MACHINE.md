# Drive Sync State Machine

## Overview

The Drive Sync State Machine defines the constitutional contract for Google Drive synchronization states and transitions in the PING Cognitive Operating System.

**Version:** v1
**Stability:** Stable
**Last Updated:** 2026-06-25

---

## State Machine Definition

### States

| State | Description | Entry Action | Exit Action |
|-------|-------------|--------------|-------------|
| `DISCOVERING` | Discovering Drive files | List Drive files | Emit discovery complete event |
| `DOWNLOADING` | Downloading file content | Download file | Emit download complete event |
| `VERIFYING` | Verifying checksum | Compute SHA256 | Compare with manifest |
| `HASHING` | Computing content hash | Compute SHA256 | Store hash in manifest |
| `INDEXING` | Indexing file content | Generate indexes | Store indexes |
| `COMPLETE` | Sync completed | Emit sync complete event | None |
| `FAILED` | Sync failed | Emit sync failed event | Retry or abort |

---

## State Transitions

### Transition Diagram

```
[DISCOVERING] → [DOWNLOADING] → [VERIFYING] → [HASHING] → [INDEXING] → [COMPLETE]
     ↓              ↓              ↓              ↓              ↓
   [FAILED]        [FAILED]        [FAILED]        [FAILED]        [FAILED]
```

### Transition Rules

| From State | To State | Condition | Action |
|------------|----------|-----------|--------|
| `DISCOVERING` | `DOWNLOADING` | Files discovered | Start downloading |
| `DISCOVERING` | `FAILED` | Discovery error | Emit error event |
| `DOWNLOADING` | `VERIFYING` | Download complete | Start verification |
| `DOWNLOADING` | `FAILED` | Download error | Emit error event |
| `VERIFYING` | `HASHING` | Checksum valid | Start hashing |
| `VERIFYING` | `FAILED` | Checksum invalid | Emit error event |
| `HASHING` | `INDEXING` | Hash computed | Start indexing |
| `HASHING` | `FAILED` | Hash error | Emit error event |
| `INDEXING` | `COMPLETE` | Indexing complete | Emit complete event |
| `INDEXING` | `FAILED` | Indexing error | Emit error event |
| `FAILED` | `DISCOVERING` | Retry triggered | Restart sync |
| `FAILED` | `COMPLETE` | Abort triggered | End sync |

---

## State Descriptions

### DISCOVERING

**Purpose:** Discover files in Google Drive folder.

**Entry Actions:**
- Initialize Drive API client
- List files in Drive folder
- Emit `DRIVE_SYNC_STARTED` event

**Exit Actions:**
- Emit discovery complete event
- Transition to `DOWNLOADING`

**Error Handling:**
- Authentication failure → `FAILED`
- API quota exceeded → `FAILED`
- Network error → `FAILED`

**Retry Policy:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5
- Abort after max retries

---

### DOWNLOADING

**Purpose:** Download file content from Google Drive.

**Entry Actions:**
- Initialize download
- Track progress
- Emit `DRIVE_FILE_MIRRORED` event

**Exit Actions:**
- Emit download complete event
- Transition to `VERIFYING`

**Error Handling:**
- Download timeout → `FAILED`
- Disk space error → `FAILED`
- Network error → `FAILED`

**Retry Policy:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 3
- Abort after max retries

---

### VERIFYING

**Purpose:** Verify file checksum against manifest.

**Entry Actions:**
- Compute SHA256 of downloaded file
- Compare with manifest checksum

**Exit Actions:**
- If valid → Transition to `HASHING`
- If invalid → Transition to `FAILED`

**Error Handling:**
- Checksum mismatch → `FAILED`
- File corruption → `FAILED`

**Retry Policy:**
- No retry for checksum mismatch
- Re-download file

---

### HASHING

**Purpose:** Compute and store content hash.

**Entry Actions:**
- Compute SHA256 of file content
- Store hash in manifest
- Update manifest timestamp

**Exit Actions:**
- Transition to `INDEXING`

**Error Handling:**
- Hash computation error → `FAILED`
- Manifest write error → `FAILED`

**Retry Policy:**
- Retry once
- Abort if retry fails

---

### INDEXING

**Purpose:** Index file content for retrieval.

**Entry Actions:**
- Extract symbols from file
- Build relationships
- Generate embeddings
- Store indexes

**Exit Actions:**
- Emit indexing complete event
- Transition to `COMPLETE`

**Error Handling:**
- Indexing error → `FAILED`
- Storage error → `FAILED`

**Retry Policy:**
- Retry once
- Abort if retry fails

---

### COMPLETE

**Purpose:** Sync operation completed successfully.

**Entry Actions:**
- Emit `DRIVE_SYNC_COMPLETED` event
- Update sync status
- Log sync metrics

**Exit Actions:**
- None (terminal state)

**Error Handling:**
- None

**Retry Policy:**
- None

---

### FAILED

**Purpose:** Sync operation failed.

**Entry Actions:**
- Emit sync failed event
- Log error details
- Update sync status

**Exit Actions:**
- Retry → `DISCOVERING`
- Abort → `COMPLETE`

**Error Handling:**
- Log error details
- Notify monitoring system

**Retry Policy:**
- Manual retry or scheduled retry
- Exponential backoff for retries

---

## Event Emission

### Events by State

| State | Events Emitted |
|-------|---------------|
| `DISCOVERING` | `DRIVE_SYNC_STARTED` |
| `DOWNLOADING` | `DRIVE_FILE_MIRRORED` |
| `VERIFYING` | None |
| `HASHING` | None |
| `INDEXING` | None |
| `COMPLETE` | `DRIVE_SYNC_COMPLETED` |
| `FAILED` | `DRIVE_SYNC_FAILED` |

### Event Schema

#### DRIVE_SYNC_FAILED

```json
{
  "event_id": "uuid",
  "event_type": "DRIVE_SYNC_FAILED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "sync_uuid",
  "aggregate_type": "DRIVE_SYNC",
  "event_data": {
    "sync_id": "uuid",
    "error_type": "string",
    "error_message": "string",
    "failed_state": "string",
    "retry_count": 0
  }
}
```

---

## State Persistence

### State Storage

**Location:** PostgreSQL `drive_sync_states` table

**Schema:**
```sql
CREATE TABLE drive_sync_states (
    sync_id UUID PRIMARY KEY,
    current_state TEXT NOT NULL,
    previous_state TEXT,
    drive_file_id TEXT,
    started_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB
);
```

### State Recovery

**Purpose:** Recover from interrupted sync.

**Implementation:**
1. Query last sync state from database
2. Resume from last known state
3. Verify file integrity
4. Continue sync from recovery point

**Recovery Logic:**
```python
def recover_sync_state(sync_id: str):
    """Recover sync state from database"""
    state = query_sync_state(sync_id)
    
    if state['current_state'] == 'DOWNLOADING':
        # Resume download
        resume_download(state['drive_file_id'])
    elif state['current_state'] == 'VERIFYING':
        # Re-verify
        verify_file(state['drive_file_id'])
    elif state['current_state'] == 'HASHING':
        # Re-hash
        hash_file(state['drive_file_id'])
    elif state['current_state'] == 'INDEXING':
        # Re-index
        index_file(state['drive_file_id'])
    else:
        # Restart from beginning
        start_sync()
```

---

## Concurrent Sync

### Parallel File Processing

**Purpose:** Process multiple files concurrently.

**Implementation:**
```python
from concurrent.futures import ThreadPoolExecutor

def concurrent_sync(files: List[str]):
    """Sync multiple files concurrently"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for file_id in files:
            future = executor.submit(sync_file, file_id)
            futures.append(future)
        
        for future in futures:
            future.result()  # Wait for completion
```

### State Coordination

**Purpose:** Coordinate state across concurrent operations.

**Implementation:**
- Each file has independent state
- Global sync state tracks overall progress
- Atomic state transitions
- Lock-based coordination for shared resources

---

## Error Handling

### Error Classification

| Error Type | Severity | Action |
|------------|----------|--------|
| Authentication | CRITICAL | Abort sync, notify admin |
| Network | HIGH | Retry with backoff |
| Disk Space | CRITICAL | Abort sync, notify admin |
| Checksum | HIGH | Re-download file |
| Indexing | MEDIUM | Skip file, continue sync |
| API Quota | HIGH | Wait for quota reset |

### Error Recovery

**Retry Logic:**
```python
def retry_with_backoff(operation, max_retries=5):
    """Retry operation with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return operation()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt
            time.sleep(wait_time)
```

---

## Monitoring

### State Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `sync_state_duration` | Time in each state | < 5 minutes |
| `sync_state_transitions` | Number of state transitions | < 100 per sync |
| `sync_state_errors` | Number of errors per state | < 5% |
| `sync_state_retries` | Number of retries per state | < 3 per file |

### State Logging

**Log Format:**
```json
{
  "timestamp": "2026-06-25T00:00:00Z",
  "level": "INFO",
  "service": "drive_sync",
  "message": "State transition",
  "sync_id": "uuid",
  "from_state": "DOWNLOADING",
  "to_state": "VERIFYING",
  "drive_file_id": "string"
}
```

---

## Constitutional Tests

### Test 1: State Transition Correctness

**Steps:**
1. Start sync operation
2. Verify state transitions follow diagram
3. Verify no invalid transitions

**Expected Result:** All transitions valid

---

### Test 2: State Recovery

**Steps:**
1. Start sync operation
2. Interrupt sync during processing
3. Recover sync state
4. Verify sync resumes correctly

**Expected Result:** Sync resumes from recovery point

---

### Test 3: Error Handling

**Steps:**
1. Simulate error during sync
2. Verify error handling logic
3. Verify retry policy
4. Verify state transition to FAILED

**Expected Result:** Error handled correctly

---

### Test 4: Concurrent Sync

**Steps:**
1. Start concurrent sync of multiple files
2. Verify state coordination
3. Verify no race conditions
4. Verify all files synced correctly

**Expected Result:** Concurrent sync successful

---

## Status

**FROZEN** - This state machine is constitutional and cannot be changed without breaking Drive sync guarantees.

**Date:** 2026-06-25
**Version:** 1.0
**Implementation Status:** Not Implemented
