# Transaction Boundary Implementation

## Phase A1.1 — Constitutional Transaction Boundary

### Constitutional Rules

Every state transition must execute inside one constitutional transaction.

**Requirements:**
- Exactly one transaction per state transition
- Automatic rollback on failure
- No partial persistence
- No side effects before commit
- Nested transactions prohibited unless implemented through savepoints

---

## Implementation

### TransactionBoundary Class

**Location:** `transaction_boundary.js`

**Core Methods:**

#### `execute(operation, options)`
Executes an operation within a transaction boundary.

- Acquires PostgreSQL client connection
- Begins transaction
- Executes operation with transaction context
- Commits on success
- Rolls back on failure
- Releases connection

**Transaction Context:**
- `query(sql, params)` - Execute query within transaction
- `withSavepoint(name, operation)` - Execute with savepoint
- `isTransactionActive()` - Check if transaction is active
- `getTransactionDepth()` - Get transaction depth

#### `withSavepoint(savepointName, operation)`
Executes an operation with a PostgreSQL savepoint.

- Requires active transaction
- Creates savepoint
- Executes operation
- Releases savepoint on success
- Rolls back to savepoint on failure

**Usage Example:**
```javascript
const transactionBoundary = new TransactionBoundary(postgresPool);

await transactionBoundary.execute(async (tx) => {
  // Insert mission
  await tx.query(
    'INSERT INTO missions (mission_id, mission_type) VALUES ($1, $2)',
    [missionId, missionType]
  );

  // Insert into queue
  await tx.query(
    'INSERT INTO mission_queue (queue_id, mission_id) VALUES ($1, $2)',
    [queueId, missionId]
  );

  // Write to outbox
  await eventOutbox.write(event); // Uses tx context automatically
});
```

### TransactionMiddleware

**Express middleware for automatic transaction boundaries.**

**Usage:**
```javascript
const transactionMiddleware = new TransactionMiddleware(transactionBoundary).middleware();

app.post('/api/v1/missions', transactionMiddleware, async (req, res) => {
  // req.tx is available here
  const result = await createMission(req.body, req.tx);
  res.json(result);
});
```

---

## Repository Invariants Preserved

✓ No partial writes
✓ Automatic rollback on failure
✓ No side effects before commit
✓ Single transaction per state transition
✓ Nested transactions prohibited (savepoints only)

---

## Evidence Required

### Rollback Tests
- Verify rollback on error
- Verify no partial persistence after rollback
- Verify connection release after rollback

### Nested Transaction Tests
- Verify savepoint behavior
- Verify savepoint rollback
- Verify savepoint release

### Partial Failure Tests
- Verify transaction atomicity
- Verify no partial state on failure
- Verify connection cleanup

---

## Forbidden Patterns

❌ Global transaction objects
❌ Manual transaction management
❌ Side effects before commit
❌ Nested transactions without savepoints
❌ Transaction context leakage

---

## Status

**Implementation:** ✅ Complete
**Tests:** ⏳ Pending
**Documentation:** ✅ Complete
