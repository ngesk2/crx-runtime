# Outbox Architecture

## Phase A1.2 — Transactional Outbox

### Constitutional Rules

No authority may directly:
- Publish events
- Enqueue jobs
- Invoke workers
- Notify external systems

inside an active transaction.

All external side effects originate from persisted Outbox records.

---

## Implementation

### EventOutbox Class

**Location:** `event_outbox.js`

**Schema:**
```sql
CREATE TABLE event_outbox (
  outbox_id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  authority VARCHAR(100) NOT NULL,
  authority_version VARCHAR(20) NOT NULL,
  causation_id VARCHAR(64),
  correlation_id VARCHAR(64),
  payload_version INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  witness JSONB,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  publish_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_outbox_event_id UNIQUE (event_id)
)
```

**Indexes:**
- `idx_outbox_published` - For unpublished event queries
- `idx_outbox_created` - For ordering by creation time
- `idx_outbox_aggregate` - For aggregate-based queries
- `idx_outbox_correlation` - For correlation-based queries

### Core Methods

#### `write(event)`
Writes event to outbox within transaction.

- Validates event against StandardEventSchema
- Uses transaction context if available
- Inserts into outbox table
- Returns outbox ID

**Transactional Guarantee:**
Event is persisted in same transaction as state changes.

#### `publish(event)`
Publishes event (immediate + durable).

- Writes to outbox for durability
- Publishes immediately for low latency
- Dispatcher will handle retry if immediate publish fails

#### `_processOutbox()`
Processes unpublished events.

- Queries unpublished events with ordering guarantee
- Processes in batches (limit 10)
- Orders by `created_at ASC, outbox_id ASC`
- Respects retry limit (5 attempts)

#### `_publishOutboxEvent(event)`
Publishes single outbox event.

- Reconstructs standard event from outbox
- Publishes to subscribers (Redis, event bus)
- Marks as published on success
- Increments retry count on failure

#### `_publishToSubscribers(eventType, event)`
Publishes to all subscribers.

- Redis pub/sub if available
- Event bus subscribers
- Error handling per subscriber

### Ordering Guarantees

Events are processed in strict order:
1. By creation timestamp
2. By outbox ID (tiebreaker)

This ensures causal ordering within an aggregate.

### Retry Strategy

- Max attempts: 5
- No exponential backoff (currently)
- Failed events remain in outbox for manual inspection
- Error message persisted

### Duplicate Prevention

Unique constraint on `event_id` prevents duplicate events.

---

## Repository Invariants Preserved

✓ Side effects survive crashes
✓ Events replay deterministically
✓ Duplicate dispatch prevention
✓ Ordering guarantees
✓ No direct publication in transactions

---

## Evidence Required

### Dispatcher Recovery After Crash
- Verify dispatcher resumes after restart
- Verify unpublished events are processed
- Verify no duplicate publication

### Duplicate Dispatch Prevention
- Verify unique constraint prevents duplicates
- Verify idempotency in subscribers

### Replay Verification
- Verify events can be replayed from outbox
- Verify deterministic reconstruction

---

## Forbidden Patterns

❌ Fire-and-forget publishing
❌ Business logic inside dispatcher
❌ Direct publication in transactions
❌ Custom event formats
❌ Manual retry duplication

---

## Status

**Implementation:** ✅ Complete
**Tests:** ⏳ Pending
**Documentation:** ✅ Complete
