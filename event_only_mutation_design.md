# Event-Only Mutation Design

**Design Date:** 2026-06-24
**Design Type:** Constitutional Enforcement Mechanism
**Scope:** All Runtime Code, Migration Scripts, Database Access Layers
**Status:** DESIGN ONLY - No implementation
**Authority:** CONSTITUTIONAL_LAW

---

# Executive Summary

This design enforces that no constitutional mutation can occur outside the event stream. All UPDATE and DELETE operations affecting constitutional objects, authority objects, or freeze registry must be prohibited in favor of event-driven mutations.

**Blocking Issue Addressed:** Direct PostgreSQL UPDATE (Silent Mutation)
**Constitutional Violations Resolved:** MUTATION_LAW.md (direct_state_edit, shadow_governance, bypass_verification)

---

# Current Vulnerability

## Existing Direct Database Operations

### Direct UPDATE Operations

```python
# Example from memory_ingestion_worker.py
cursor.execute(
    "UPDATE documents SET embedded_at = %s, status = 'embedded' WHERE id = %s",
    (datetime.utcnow(), document_id)
)

# Example from projection workers
cursor.execute(
    "UPDATE documents SET projected_at = %s, status = 'projected' WHERE id = %s",
    (datetime.utcnow(), document_id)
)
```

### Direct DELETE Operations

```python
# Example from potential cleanup scripts
cursor.execute("DELETE FROM documents WHERE status = 'archived'")
```

**Vulnerability:**
- Direct UPDATE/DELETE bypasses event recording
- Direct UPDATE/DELETE bypasses policy evaluation
- Direct UPDATE/DELETE bypasses replay verification
- Direct UPDATE/DELETE bypasses witness generation
- No audit trail for direct database modifications
- Violates MUTATION_LAW.md (direct_state_edit is prohibited)
- Violates MUTATION_LAW.md (shadow_governance)
- Violates MUTATION_LAW.md (bypass_verification is prohibited)

---

# Design Objectives

## Primary Objectives

1. **Event-Only Mutation:** All constitutional mutations must occur through event stream
2. **Prohibit Direct UPDATE/DELETE:** Prevent direct database modifications
3. **Event-Driven State:** State is derived from event replay, not direct mutation
4. **Audit Trail:** All mutations must be recorded in event stream

## Secondary Objectives

1. **Database Constraints:** Enforce event-only mutation at database level
2. **Runtime Enforcement:** Prevent direct database operations in runtime code
3. **Migration Enforcement:** Ensure migrations use event-driven mutations

---

# Event-Only Mutation Architecture

## Constitutional Objects

### Protected Objects

**Constitutional Objects:**
- constitutional_freeze_registry
- constitutional_freeze_audit_log
- constitutional_amendment_history
- constitutional_verification_log
- events (constitutional event stream)

**Authority Objects:**
- documents (constitutional documents)
- document_content (constitutional document content)
- lineage (constitutional lineage DAG)

**Freeze Registry Objects:**
- All tables in constitutional_freeze_registry schema

## Event-Driven Mutation Pattern

### Mutation via Event Emission

```python
def mutate_via_event(stream: str, event_type: str, payload: Dict[str, Any]) -> str:
    """
    Perform mutation via event emission.
    
    Constitutional: All mutations must occur through event stream.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            raise Exception("Failed to connect to PostgreSQL")
        
        cursor = conn.cursor()
        
        # Emit event
        cursor.execute(
            "INSERT INTO events (stream, event_type, payload, created_at) VALUES (%s, %s, %s, %s) RETURNING id",
            (stream, event_type, Json(payload), datetime.utcnow())
        )
        event_id = cursor.fetchone()[0]
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Mutation event emitted: {event_type} (event_id: {event_id})")
        return event_id
        
    except Exception as e:
        logger.error(f"Failed to emit mutation event: {e}")
        if conn:
            conn.rollback()
            conn.close()
        raise
```

### State Projection from Events

```python
def project_state_from_events(event_id: str) -> Dict[str, Any]:
    """
    Project state from event stream.
    
    Constitutional: State is derived from event replay, not direct mutation.
    """
    try:
        conn = get_postgres_connection()
        if not conn:
            raise Exception("Failed to connect to PostgreSQL")
        
        cursor = conn.cursor()
        
        # Replay events from beginning to event_id
        cursor.execute(
            """
            SELECT id, stream, event_type, payload, created_at
            FROM events
            WHERE id <= %s
            ORDER BY id ASC
            """,
            (event_id,)
        )
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Apply events to state
        state = {}
        for event in events:
            state = apply_event_to_state(state, event)
        
        return state
        
    except Exception as e:
        logger.error(f"Failed to project state from events: {e}")
        raise
```

---

# Database Constraints

## Prohibit Direct UPDATE/DELETE on Protected Objects

### PostgreSQL Trigger: prevent_direct_update

```sql
CREATE OR REPLACE FUNCTION prevent_direct_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Direct UPDATE not permitted on constitutional objects. Use event-driven mutation.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_direct_update
    BEFORE UPDATE ON constitutional_freeze_registry
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_update();

CREATE TRIGGER trigger_prevent_direct_update
    BEFORE UPDATE ON constitutional_freeze_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_update();

CREATE TRIGGER trigger_prevent_direct_update
    BEFORE UPDATE ON constitutional_amendment_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_update();

CREATE TRIGGER trigger_prevent_direct_update
    BEFORE UPDATE ON constitutional_verification_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_update();
```

### PostgreSQL Trigger: prevent_direct_delete

```sql
CREATE OR REPLACE FUNCTION prevent_direct_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Direct DELETE not permitted on constitutional objects. Use event-driven mutation.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_direct_delete
    BEFORE DELETE ON constitutional_freeze_registry
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_delete();

CREATE TRIGGER trigger_prevent_direct_delete
    BEFORE DELETE ON constitutional_freeze_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_delete();

CREATE TRIGGER trigger_prevent_direct_delete
    BEFORE DELETE ON constitutional_amendment_history
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_delete();

CREATE TRIGGER trigger_prevent_direct_delete
    BEFORE DELETE ON constitutional_verification_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_direct_delete();
```

### Exception for System Fields

```sql
CREATE OR REPLACE FUNCTION prevent_direct_update_except_system()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow updates to system fields only
    IF 
        NEW.updated_at != OLD.updated_at OR
        NEW.last_verified_at != OLD.last_verified_at OR
        NEW.verification_status != OLD.verification_status
    THEN
        RETURN NEW;
    END IF;
    
    -- Allow updates if explicitly authorized by event
    IF TG_ARGV[0]::boolean = true THEN
        RETURN NEW;
    END IF;
    
    RAISE EXCEPTION 'Direct UPDATE not permitted on constitutional objects. Use event-driven mutation.';
END;
$$ LANGUAGE plpgsql;
```

---

# Runtime Enforcement

## Database Access Layer Wrapper

```python
class ConstitutionalDatabaseAccess:
    """
    Database access layer that enforces event-only mutation.
    
    Constitutional: All mutations must occur through event stream.
    """
    
    def __init__(self, connection):
        self.connection = connection
        self.cursor = connection.cursor()
    
    def execute(self, query: str, params: tuple = None):
        """
        Execute query with event-only mutation enforcement.
        
        Raises DirectMutationException if direct UPDATE/DELETE detected.
        """
        query_upper = query.upper().strip()
        
        # Check for direct UPDATE on protected objects
        if query_upper.startswith('UPDATE') and self._is_protected_object(query):
            raise DirectMutationException(
                "Direct UPDATE not permitted on constitutional objects. Use event-driven mutation.",
                query=query
            )
        
        # Check for direct DELETE on protected objects
        if query_upper.startswith('DELETE') and self._is_protected_object(query):
            raise DirectMutationException(
                "Direct DELETE not permitted on constitutional objects. Use event-driven mutation.",
                query=query
            )
        
        # Execute query
        return self.cursor.execute(query, params)
    
    def _is_protected_object(self, query: str) -> bool:
        """Check if query affects protected object."""
        protected_objects = [
            'constitutional_freeze_registry',
            'constitutional_freeze_audit_log',
            'constitutional_amendment_history',
            'constitutional_verification_log',
            'documents',
            'document_content',
            'lineage'
        ]
        
        for obj in protected_objects:
            if obj.lower() in query.lower():
                return True
        
        return False
    
    def close(self):
        """Close cursor and connection."""
        self.cursor.close()
        self.connection.close()
```

## DirectMutationException

```python
class DirectMutationException(Exception):
    """
    Raised when direct mutation is attempted on constitutional objects.
    
    Constitutional: Direct mutation is prohibited. Use event-driven mutation.
    """
    def __init__(self, message: str, query: str = None):
        self.message = message
        self.query = query
        super().__init__(message)
```

---

# Migration Enforcement

## Migration Script Guidelines

### Prohibited Operations

```sql
-- PROHIBITED
UPDATE constitutional_freeze_registry SET status = 'FROZEN' WHERE document_id = 'TRUTH_LAW';
DELETE FROM constitutional_freeze_registry WHERE status = 'ARCHIVED';
```

### Required Operations

```sql
-- REQUIRED: Use event-driven mutation
INSERT INTO events (stream, event_type, payload, created_at)
VALUES (
    'constitutional',
    'FREEZE_STATUS_CHANGED',
    '{"document_id": "TRUTH_LAW", "new_status": "FROZEN"}',
    NOW()
);

INSERT INTO events (stream, event_type, payload, created_at)
VALUES (
    'constitutional',
    'DOCUMENT_ARCHIVED',
    '{"document_id": "TRUTH_LAW"}',
    NOW()
);
```

### Migration Helper Functions

```python
def migrate_via_event(stream: str, event_type: str, payload: Dict[str, Any]):
    """
    Perform migration via event emission.
    
    Constitutional: Migrations must use event-driven mutation.
    """
    event_id = mutate_via_event(stream, event_type, payload)
    
    # Wait for event to be processed
    wait_for_event_processing(event_id)
    
    # Verify state projection
    verify_state_projection(event_id)
```

---

# Event-Driven Mutation Examples

## Example 1: Freeze Status Change

### Direct UPDATE (Prohibited)

```python
# PROHIBITED
cursor.execute(
    "UPDATE constitutional_freeze_registry SET status = 'FROZEN' WHERE document_id = 'TRUTH_LAW'"
)
```

### Event-Driven Mutation (Required)

```python
# REQUIRED
mutate_via_event(
    stream='constitutional',
    event_type='FREEZE_STATUS_CHANGED',
    payload={
        'document_id': 'TRUTH_LAW',
        'old_status': 'ACTIVE',
        'new_status': 'FROZEN',
        'reason': 'Constitutional freeze v1.0'
    }
)
```

## Example 2: Document Ingestion

### Direct INSERT (Allowed for non-constitutional)

```python
# ALLOWED for non-constitutional documents
cursor.execute(
    "INSERT INTO documents (document_hash, source_type, source_path, ...) VALUES (%s, %s, %s, ...)",
    (document_hash, 'IMPORTED_DOCUMENT', source_path, ...)
)
```

### Event-Driven Mutation (Required for constitutional)

```python
# REQUIRED for constitutional documents
mutate_via_event(
    stream='constitutional',
    event_type='CONSTITUTIONAL_DOCUMENT_INGESTED',
    payload={
        'document_id': 'TRUTH_LAW',
        'document_hash': document_hash,
        'source_path': source_path,
        'authority_class': 'CONSTITUTIONAL_LAW'
    }
)
```

## Example 3: Amendment

### Direct UPDATE (Prohibited)

```python
# PROHIBITED
cursor.execute(
    "UPDATE constitutional_freeze_registry SET amendment_count = amendment_count + 1 WHERE document_id = 'TRUTH_LAW'"
)
```

### Event-Driven Mutation (Required)

```python
# REQUIRED
mutate_via_event(
    stream='constitutional',
    event_type='CONSTITUTIONAL_AMENDED',
    payload={
        'document_id': 'TRUTH_LAW',
        'amendment_number': 1,
        'amendment_type': 'patch',
        'previous_sha256_hash': old_hash,
        'new_sha256_hash': new_hash,
        'amendment_author': 'governance_agent',
        'amendment_justification': 'Fix typo in TRUTH_LAW.md'
    }
)
```

---

# Security Event Emission

## DIRECT_MUTATION_ATTEMPT Event

```json
{
  "stream": "security",
  "event_type": "DIRECT_MUTATION_ATTEMPT",
  "payload": {
    "query": "UPDATE constitutional_freeze_registry SET status = 'FROZEN' WHERE document_id = 'TRUTH_LAW'",
    "detected_at": "2026-06-24T00:00:00Z",
    "blocked": true
  }
}
```

---

# Implementation Requirements

## Required Changes

1. **Implement prevent_direct_update trigger** on all protected objects
2. **Implement prevent_direct_delete trigger** on all protected objects
3. **Implement ConstitutionalDatabaseAccess** wrapper class
4. **Implement DirectMutationException** for violation detection
5. **Update all runtime code** to use ConstitutionalDatabaseAccess
6. **Update all migration scripts** to use event-driven mutation
7. **Emit security events** for direct mutation attempts

## Optional Changes

1. **Implement state projection service** for event replay
2. **Implement event processing service** for event-driven state updates
3. **Implement migration helper functions** for event-driven migrations

---

# Testing Strategy

## Unit Tests

1. **prevent_direct_update Trigger Test:** Test trigger prevents direct UPDATE
2. **prevent_direct_delete Trigger Test:** Test trigger prevents direct DELETE
3. **ConstitutionalDatabaseAccess Test:** Test wrapper enforces event-only mutation
4. **DirectMutationException Test:** Test exception is raised on direct mutation
5. **mutate_via_event() Test:** Test event-driven mutation

## Integration Tests

1. **End-to-End Event-Driven Mutation Test:** Test full event-driven mutation flow
2. **Direct Mutation Blocking Test:** Test direct mutation is blocked
3. **State Projection Test:** Test state projection from events

## Regression Tests

1. **No Direct UPDATE Test:** Verify direct UPDATE is blocked
2. **No Direct DELETE Test:** Verify direct DELETE is blocked
3. **Event-Only Mutation Test:** Verify all mutations use event stream

---

# Compliance Matrix

| Requirement | Current State | Target State | Implementation |
|-------------|---------------|--------------|----------------|
| No direct UPDATE | Direct UPDATE allowed | Direct UPDATE prohibited | prevent_direct_update trigger |
| No direct DELETE | Direct DELETE allowed | Direct DELETE prohibited | prevent_direct_delete trigger |
| Event-driven mutation | Optional mutation | Required mutation | mutate_via_event() |
| Runtime enforcement | No enforcement | ConstitutionalDatabaseAccess wrapper | ConstitutionalDatabaseAccess |
| Migration enforcement | Direct mutations allowed | Event-driven mutations required | Migration helper functions |
| Security events | No security events | Security events emitted | Emit DIRECT_MUTATION_ATTEMPT |

---

# Migration Path

## Phase 1: Database Constraints

1. Implement prevent_direct_update trigger
2. Implement prevent_direct_delete trigger
3. Deploy triggers to staging
4. Test triggers

## Phase 2: Runtime Enforcement

1. Implement ConstitutionalDatabaseAccess wrapper
2. Implement DirectMutationException
3. Update runtime code to use wrapper
4. Deploy to staging
5. Test runtime enforcement

## Phase 3: Migration Enforcement

1. Implement migration helper functions
2. Update migration scripts to use event-driven mutation
3. Deploy to staging
4. Test migration enforcement

## Phase 4: Security Events

1. Implement security event emission
2. Update enforcement to emit security events
3. Deploy to staging
4. Test security event emission

## Phase 5: Production Deployment

1. Deploy triggers to production
2. Deploy runtime enforcement to production
3. Deploy migration enforcement to production
4. Monitor direct mutation attempts
5. Monitor security events

---

**Design Status:** COMPLETE
**Next Phase:** BLOCKER 4 - Freeze Registry Tampering
