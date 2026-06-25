# Constitutional Time Enforcement

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** All Uses of Wall Clock, System Clock, Filesystem Timestamps
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design enforces that constitutional ordering derives ONLY from event order, not from wall clock, system clock, or filesystem timestamps. All timestamp fields are converted to metadata-only, and event_order_index is introduced as the sole constitutional time reference.

**Blocking Issue Addressed:** Replay Inconsistency (Timestamps vs Event Order)
**Constitutional Violations Resolved:** TIME_LAW.md (constitutional time is event order, not timestamps)

---

# Current Vulnerability

## Existing Timestamp Usage

### Database Timestamps

```sql
-- Current schema uses timestamps for ordering
CREATE TABLE constitutional_freeze_registry (
    frozen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_amendment_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Queries use timestamps for ordering
SELECT * FROM constitutional_freeze_registry ORDER BY frozen_at;
```

### Python Timestamps

```python
# Current code uses datetime.utcnow() for ordering
cursor.execute(
    "INSERT INTO events (stream, event_type, payload, created_at) VALUES (%s, %s, %s, %s)",
    (stream, event_type, Json(payload), datetime.utcnow())
)

# Queries use timestamps for ordering
cursor.execute(
    "SELECT * FROM events ORDER BY created_at"
)
```

**Vulnerability:**
- Timestamps used for constitutional ordering
- Wall clock time used for event ordering
- System clock time used for event ordering
- Filesystem timestamps used for document ordering
- Violates TIME_LAW.md (constitutional time is event order, not timestamps)
- Replay divergence possible
- Event ordering ambiguity

---

# Design Objectives

## Primary Objectives

1. **Event-Only Ordering:** Constitutional ordering derives ONLY from event order
2. **Event Order Index:** Introduce event_order_index as sole constitutional time reference
3. **Timestamp Metadata:** Convert all timestamp fields to metadata-only
4. **Replay Determinism:** Ensure replay produces identical event order

## Secondary Objectives

1. **Database Constraints:** Enforce event-only ordering at database level
2. **Runtime Enforcement:** Prevent timestamp-based ordering in runtime code
3. **Migration Enforcement:** Ensure migrations use event_order_index

---

# Constitutional Time Architecture

## Event Order Index

### Event Order Index Definition

```sql
-- Add event_order_index to events table
ALTER TABLE events ADD COLUMN event_order_index BIGSERIAL NOT NULL;
CREATE UNIQUE INDEX idx_events_event_order_index ON events(event_order_index);

-- Add event_order_index to constitutional_freeze_registry
ALTER TABLE constitutional_freeze_registry ADD COLUMN event_order_index BIGINT;
CREATE INDEX idx_constitutional_freeze_registry_event_order_index ON constitutional_freeze_registry(event_order_index);

-- Add event_order_index to constitutional_amendment_history
ALTER TABLE constitutional_amendment_history ADD COLUMN event_order_index BIGINT;
CREATE INDEX idx_constitutional_amendment_history_event_order_index ON constitutional_amendment_history(event_order_index);
```

### Event Order Index Assignment

```python
def emit_event_with_order(stream: str, event_type: str, payload: Dict[str, Any]) -> str:
    """
    Emit event with automatic event_order_index assignment.
    
    Constitutional: Event order is constitutional time.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            raise Exception("Failed to connect to PostgreSQL")
        
        cursor = conn.cursor()
        
        # Emit event with automatic event_order_index
        cursor.execute(
            """
            INSERT INTO events (stream, event_type, payload, created_at, event_order_index)
            VALUES (%s, %s, %s, %s, DEFAULT)
            RETURNING id, event_order_index
            """,
            (stream, event_type, Json(payload), datetime.utcnow())
        )
        event_id, event_order_index = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Event emitted: {event_type} (event_id: {event_id}, event_order_index: {event_order_index})")
        return event_id
        
    except Exception as e:
        logger.error(f"Failed to emit event: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise
```

---

# Timestamp Metadata Conversion

## Convert Timestamps to Metadata

### Freeze Registry

```sql
-- Convert frozen_at to metadata
ALTER TABLE constitutional_freeze_registry ALTER COLUMN frozen_at DROP NOT NULL;
ALTER TABLE constitutional_freeze_registry ADD COLUMN frozen_at_metadata TIMESTAMP WITH TIME ZONE;
UPDATE constitutional_freeze_registry SET frozen_at_metadata = frozen_at;
ALTER TABLE constitutional_freeze_registry DROP COLUMN frozen_at;

-- Convert last_amendment_at to metadata
ALTER TABLE constitutional_freeze_registry ALTER COLUMN last_amendment_at DROP NOT NULL;
ALTER TABLE constitutional_freeze_registry ADD COLUMN last_amendment_at_metadata TIMESTAMP WITH TIME ZONE;
UPDATE constitutional_freeze_registry SET last_amendment_at_metadata = last_amendment_at;
ALTER TABLE constitutional_freeze_registry DROP COLUMN last_amendment_at;

-- Convert created_at to metadata
ALTER TABLE constitutional_freeze_registry ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE constitutional_freeze_registry ADD COLUMN created_at_metadata TIMESTAMP WITH TIME ZONE;
UPDATE constitutional_freeze_registry SET created_at_metadata = created_at;
ALTER TABLE constitutional_freeze_registry DROP COLUMN created_at;

-- Convert updated_at to metadata
ALTER TABLE constitutional_freeze_registry ALTER COLUMN updated_at DROP NOT NULL;
ALTER TABLE constitutional_freeze_registry ADD COLUMN updated_at_metadata TIMESTAMP WITH TIME ZONE;
UPDATE constitutional_freeze_registry SET updated_at_metadata = updated_at;
ALTER TABLE constitutional_freeze_registry DROP COLUMN updated_at;
```

### Events Table

```sql
-- Convert created_at to metadata
ALTER TABLE events ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE events ADD COLUMN created_at_metadata TIMESTAMP WITH TIME ZONE;
UPDATE events SET created_at_metadata = created_at;
ALTER TABLE events DROP COLUMN created_at;
```

### Amendment History

```sql
-- Convert amendment_date to metadata
ALTER TABLE constitutional_amendment_history ALTER COLUMN amendment_date DROP NOT NULL;
ALTER TABLE constitutional_amendment_history ADD COLUMN amendment_date_metadata TIMESTAMP WITH TIME ZONE;
UPDATE constitutional_amendment_history SET amendment_date_metadata = amendment_date;
ALTER TABLE constitutional_amendment_history DROP COLUMN amendment_date;
```

---

# Runtime Enforcement

## Prohibit Timestamp-Based Ordering

```python
class ConstitutionalTimeEnforcement:
    """
    Enforce constitutional time (event order) in runtime code.
    
    Constitutional: Constitutional ordering derives ONLY from event order.
    """
    
    def __init__(self, connection):
        self.connection = connection
        self.cursor = connection.cursor()
    
    def execute(self, query: str, params: tuple = None):
        """
        Execute query with constitutional time enforcement.
        
        Raises ConstitutionalTimeViolationException if timestamp-based ordering detected.
        """
        query_upper = query.upper().strip()
        
        # Check for ORDER BY timestamp
        if 'ORDER BY' in query_upper and self._has_timestamp_ordering(query):
            raise ConstitutionalTimeViolationException(
                "Timestamp-based ordering not permitted. Use event_order_index for constitutional ordering.",
                query=query
            )
        
        # Check for WHERE timestamp comparisons
        if 'WHERE' in query_upper and self._has_timestamp_comparison(query):
            raise ConstitutionalTimeViolationException(
                "Timestamp-based filtering not permitted. Use event_order_index for constitutional ordering.",
                query=query
            )
        
        # Execute query
        return self.cursor.execute(query, params)
    
    def _has_timestamp_ordering(self, query: str) -> bool:
        """Check if query uses timestamp-based ordering."""
        timestamp_columns = [
            'created_at',
            'updated_at',
            'frozen_at',
            'last_amendment_at',
            'amendment_date',
            'datetime.utcnow()',
            'NOW()',
            'CURRENT_TIMESTAMP'
        ]
        
        for col in timestamp_columns:
            if f'ORDER BY {col}' in query.upper():
                return True
        
        return False
    
    def _has_timestamp_comparison(self, query: str) -> bool:
        """Check if query uses timestamp-based comparison."""
        timestamp_columns = [
            'created_at',
            'updated_at',
            'frozen_at',
            'last_amendment_at',
            'amendment_date'
        ]
        
        for col in timestamp_columns:
            if f'WHERE {col}' in query.upper():
                return True
        
        return False
    
    def close(self):
        """Close cursor and connection."""
        self.cursor.close()
        self.connection.close()
```

## ConstitutionalTimeViolationException

```python
class ConstitutionalTimeViolationException(Exception):
    """
    Raised when timestamp-based ordering is attempted.
    
    Constitutional: Constitutional ordering derives ONLY from event order.
    """
    def __init__(self, message: str, query: str = None):
        self.message = message
        self.query = query
        super().__init__(message)
```

---

# Event-Only Ordering Examples

## Example 1: Event Ordering

### Timestamp-Based Ordering (Prohibited)

```python
# PROHIBITED
cursor.execute("SELECT * FROM events ORDER BY created_at")
```

### Event-Order-Based Ordering (Required)

```python
# REQUIRED
cursor.execute("SELECT * FROM events ORDER BY event_order_index")
```

## Example 2: Freeze Registry Ordering

### Timestamp-Based Ordering (Prohibited)

```python
# PROHIBITED
cursor.execute("SELECT * FROM constitutional_freeze_registry ORDER BY frozen_at")
```

### Event-Order-Based Ordering (Required)

```python
# REQUIRED
cursor.execute("SELECT * FROM constitutional_freeze_registry ORDER BY event_order_index")
```

## Example 3: Amendment History Ordering

### Timestamp-Based Ordering (Prohibited)

```python
# PROHIBITED
cursor.execute("SELECT * FROM constitutional_amendment_history ORDER BY amendment_date")
```

### Event-Order-Based Ordering (Required)

```python
# REQUIRED
cursor.execute("SELECT * FROM constitutional_amendment_history ORDER BY event_order_index")
```

---

# Replay Determinism

## Replay with Event Order

```python
def replay_events_with_order(from_event_order: int, to_event_order: int) -> List[Dict[str, Any]]:
    """
    Replay events using event_order_index for deterministic replay.
    
    Constitutional: Replay uses event order, not timestamps.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            raise Exception("Failed to connect to PostgreSQL")
        
        cursor = conn.cursor()
        
        # Replay events using event_order_index
        cursor.execute(
            """
            SELECT id, stream, event_type, payload, event_order_index
            FROM events
            WHERE event_order_index >= %s AND event_order_index <= %s
            ORDER BY event_order_index ASC
            """,
            (from_event_order, to_event_order)
        )
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Replay events
        replay_state = {}
        for event in events:
            replay_state = apply_event_to_state(replay_state, event)
        
        return replay_state
        
    except Exception as e:
        logger.error(f"Failed to replay events: {e}")
        raise
```

---

# Security Event Emission

## CONSTITUTIONAL_TIME_VIOLATION Event

```json
{
  "stream": "security",
  "event_type": "CONSTITUTIONAL_TIME_VIOLATION",
  "payload": {
    "query": "SELECT * FROM events ORDER BY created_at",
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Add event_order_index** to events table (BIGSERIAL)
2. **Add event_order_index** to constitutional_freeze_registry (BIGINT)
3. **Add event_order_index** to constitutional_amendment_history (BIGINT)
4. **Convert timestamp fields** to metadata-only
5. **Implement emit_event_with_order()** function
6. **Implement ConstitutionalTimeEnforcement** class
7. **Implement ConstitutionalTimeViolationException** class
8. **Update all runtime code** to use event_order_index for ordering
9. **Update all queries** to use event_order_index instead of timestamps
10. **Emit security events** for timestamp-based ordering attempts

## Optional Changes

1. **Implement replay service** using event_order_index
2. **Implement time migration service** to convert existing data

---

# Testing Strategy

## Unit Tests

1. **emit_event_with_order() Test:** Test event emission with event_order_index
2. **ConstitutionalTimeEnforcement Test:** Test enforcement prevents timestamp-based ordering
3. **ConstitutionalTimeViolationException Test:** Test exception is raised on violation
4. **replay_events_with_order() Test:** Test replay uses event_order_index

## Integration Tests

1. **End-to-End Event Ordering Test:** Test full event ordering flow
2. **Timestamp Blocking Test:** Test timestamp-based ordering is blocked
3. **Replay Determinism Test:** Test replay is deterministic

## Regression Tests

1. **No Timestamp Ordering Test:** Verify timestamp-based ordering is blocked
2. **Event Order Only Test:** Verify only event_order_index is used for ordering
3. **Replay Determinism Test:** Verify replay produces identical state

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| Event order index | No event_order_index | event_order_index required | Add event_order_index column |
| Timestamp metadata | Timestamps used for ordering | Timestamps metadata-only | Convert timestamps to metadata |
| Event-only ordering | Timestamp-based ordering | Event-order-based ordering | ConstitutionalTimeEnforcement |
| Replay determinism | Timestamp-based replay | Event-order-based replay | replay_events_with_order() |
| Security events | No security events | Security events emitted | Emit CONSTITUTIONAL_TIME_VIOLATION |

---

# Migration Path

## Phase 1: Database Schema

1. Add event_order_index to events table
2. Add event_order_index to constitutional_freeze_registry
3. Add event_order_index to constitutional_amendment_history
4. Deploy schema to staging
5. Test schema

## Phase 2: Timestamp Conversion

1. Convert timestamp fields to metadata-only
2. Update existing data to preserve timestamps as metadata
3. Deploy to staging
4. Test conversion

## Phase 3: Runtime Enforcement

1. Implement emit_event_with_order()
2. Implement ConstitutionalTimeEnforcement class
3. Implement ConstitutionalTimeViolationException class
4. Update runtime code to use event_order_index
5. Deploy to staging
6. Test runtime enforcement

## Phase 4: Query Updates

1. Update all queries to use event_order_index
2. Update all ordering to use event_order_index
3. Deploy to staging
4. Test query updates

## Phase 5: Security Events

1. Implement security event emission
2. Update enforcement to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 6: Production Deployment

1. Deploy schema to production
2. Deploy timestamp conversion to production
3. Deploy runtime enforcement to production
4. Deploy query updates to production
5. Monitor timestamp-based ordering attempts
6. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 7 - Amendment Engine
