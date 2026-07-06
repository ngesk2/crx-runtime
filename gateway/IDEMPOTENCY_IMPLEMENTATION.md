# Idempotency Implementation

## Phase A1.3 — Constitutional Idempotency

### Constitutional Rules

Every externally reachable command must support deterministic replay.

**Required:**
- Idempotency-Key
- Database uniqueness
- Replay detection
- Response reuse
- Duplicate suppression

Duplicate requests must never execute business logic twice.

---

## Implementation

### IdempotencyManager Class

**Location:** `idempotency_manager.js`

**Schema:**
```sql
CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  operation_type VARCHAR(100) NOT NULL,
  operation_result JSONB,
  processed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE execution_tokens (
  execution_token VARCHAR(64) PRIMARY KEY,
  mission_id VARCHAR(64) NOT NULL,
  execution_type VARCHAR(100) NOT NULL,
  execution_status VARCHAR(50) DEFAULT 'pending',
  execution_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT uq_execution_mission_type UNIQUE (mission_id, execution_type, execution_status)
);

CREATE TABLE replay_tokens (
  replay_token VARCHAR(64) PRIMARY KEY,
  execution_id VARCHAR(64) NOT NULL,
  replay_status VARCHAR(50) DEFAULT 'pending',
  replay_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Core Methods

#### `checkProcessed(idempotencyKey)`
Checks if operation was already processed.

- Queries idempotency_keys table
- Respects expiration (expires_at)
- Returns previous result if exists
- Returns null if not processed

#### `markProcessed(idempotencyKey, operationType, operationResult, ttlSeconds)`
Marks operation as processed.

- Inserts into idempotency_keys table
- Uses `ON CONFLICT DO NOTHING` for idempotency
- Supports TTL for expiration
- Stores operation result for replay

#### `executeIdempotent(idempotencyKey, operationType, operation, ttlSeconds)`
Executes operation idempotently.

- Checks if already processed
- Returns cached result if exists
- Executes operation if not processed
- Marks as processed
- Returns result

**Usage Example:**
```javascript
const idempotencyManager = new IdempotencyManager(postgresPool);

const result = await idempotencyManager.executeIdempotent(
  'create-mission-123',
  'create_mission',
  async () => {
    return await createMission(missionData);
  },
  3600 // 1 hour TTL
);
```

#### `createExecutionToken(missionId, executionType)`
Creates execution token for mission execution.

- Generates unique token
- Inserts into execution_tokens table
- Unique constraint prevents duplicate executions
- Returns token

#### `completeExecutionToken(executionToken, status, result)`
Completes execution token.

- Updates execution status
- Stores execution result
- Records completion timestamp

### Database-Level Uniqueness

**Unique Constraints:**
- `idempotency_key` PRIMARY KEY - Prevents duplicate idempotency keys
- `uq_execution_mission_type` - Prevents duplicate executions for same mission/type/status

These constraints are enforced at the database level, ensuring idempotency even with concurrent requests.

### Replay Detection

Execution tokens and replay tokens enable:
- Tracking individual execution attempts
- Detecting replay attempts
- Storing replay results
- Preventing duplicate replays

---

## Repository Invariants Preserved

✓ Duplicate requests execute once
✓ Database uniqueness enforced
✓ Replay detection
✓ Response reuse
✓ Duplicate suppression

---

## Evidence Required

### Duplicate Request Tests
- Verify duplicate requests return same result
- Verify business logic executes once
- Verify idempotency key uniqueness

### Concurrent Duplicate Tests
- Verify concurrent duplicates handled correctly
- Verify no race conditions
- Verify database constraint enforcement

### Replay Tests
- Verify operations can be replayed
- Verify cached results returned
- Verify replay detection works

---

## Forbidden Patterns

❌ Retry loops inside authorities
❌ Manual retry duplication
❌ Idempotency without database constraints
❌ Business logic in idempotency check

---

## Status

**Implementation:** ✅ Complete
**Tests:** ⏳ Pending
**Documentation:** ✅ Complete
