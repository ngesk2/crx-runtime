# Migration Architecture

**Constitutional Law 8:** The system must survive 10+ years of schema changes

---

## Overview

Migration architecture ensures the system can survive 10+ years of schema changes while preserving historical information and maintaining backward compatibility. No historical information may become unreadable.

---

## Schema Evolution Strategy

### Versioning Strategy

#### Schema Version Table
```sql
CREATE TABLE schema_versions (
    id UUID PRIMARY KEY,
    schema_id UUID NOT NULL UNIQUE,
    schema_name VARCHAR(255) NOT NULL,
    version VARCHAR(255) NOT NULL,
    previous_version VARCHAR(255),
    migration_script TEXT,
    migration_duration_ms BIGINT,
    tables_affected JSONB,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL,
    rollback_script TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### Version Numbering
- Format: `v{major}.{minor}.{patch}`
- Major: Breaking changes
- Minor: Additive changes
- Patch: Bug fixes

### Migration Architecture

#### Migration Script Format
```sql
-- Migration: v1.0.0 to v1.1.0
-- Description: Add soft deletion support
-- Author: System
-- Date: 2026-06-14

BEGIN;

-- Add deleted_at column to tables
ALTER TABLE objects ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for deleted_at
CREATE INDEX idx_objects_deleted_at ON objects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- Record migration
INSERT INTO schema_versions (
    schema_id,
    schema_name,
    version,
    previous_version,
    migration_script,
    tables_affected,
    applied_at
) VALUES (
    uuid_generate_v4(),
    'canonical_state',
    'v1.1.0',
    'v1.0.0',
    'migration_v1.0.0_to_v1.1.0.sql',
    '["objects", "events", "documents"]',
    NOW()
);

COMMIT;
```

#### Rollback Script Format
```sql
-- Rollback: v1.1.0 to v1.0.0
-- Description: Remove soft deletion support
-- Author: System
-- Date: 2026-06-14

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_objects_deleted_at;
DROP INDEX IF EXISTS idx_events_deleted_at;
DROP INDEX IF EXISTS idx_documents_deleted_at;

-- Remove deleted_at column from tables
ALTER TABLE objects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE events DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE documents DROP COLUMN IF EXISTS deleted_at;

-- Record rollback
INSERT INTO schema_versions (
    schema_id,
    schema_name,
    version,
    previous_version,
    migration_script,
    tables_affected,
    applied_at
) VALUES (
    uuid_generate_v4(),
    'canonical_state',
    'v1.0.0',
    'v1.1.0',
    'rollback_v1.1.0_to_v1.0.0.sql',
    '["objects", "events", "documents"]',
    NOW()
);

COMMIT;
```

---

## Event Schema Evolution

### Event Versioning

#### Event Schema Version
```json
{
  "event_id": "UUID",
  "event_type": "OBJECT_CREATED",
  "event_version": "v1.0.0",
  "timestamp": "ISO 8601",
  "aggregate_id": "UUID",
  "aggregate_type": "object",
  "event_data": {},
  "causation_id": "UUID",
  "correlation_id": "UUID"
}
```

#### Event Schema Migration
```python
def migrate_event(event: Dict, from_version: str, to_version: str) -> Dict:
    """
    Migrate event from one version to another.
    
    Args:
        event: Event to migrate
        from_version: Source version
        to_version: Target version
    
    Returns:
        Migrated event
    """
    # Apply migration rules
    migration_rules = get_event_migration_rules(from_version, to_version)
    
    for rule in migration_rules:
        event = apply_rule(event, rule)
    
    # Update event version
    event['event_version'] = to_version
    
    return event
```

### Backward Compatibility

#### Event Handler Registry
```python
EVENT_HANDLERS = {
    'OBJECT_CREATED': {
        'v1.0.0': handle_object_created_v1,
        'v1.1.0': handle_object_created_v1,
        'v1.2.0': handle_object_created_v2
    },
    'CHUNKED': {
        'v1.0.0': handle_chunked_v1,
        'v1.1.0': handle_chunked_v2
    }
}

def handle_event(event: Dict):
    """
    Handle event with version-aware dispatch.
    
    Args:
        event: Event to handle
    """
    event_type = event['event_type']
    event_version = event.get('event_version', 'v1.0.0')
    
    # Get handler for version
    handlers = EVENT_HANDLERS.get(event_type, {})
    handler = handlers.get(event_version, handlers.get('v1.0.0'))
    
    # Migrate event if needed
    if event_version != 'v1.0.0':
        event = migrate_event(event, event_version, 'v1.0.0')
    
    # Handle event
    return handler(event)
```

---

## Canonical Schema Evolution

### Additive Changes

#### Adding Columns
```sql
-- Add new column (additive change)
ALTER TABLE objects ADD COLUMN new_column VARCHAR(255);
```

#### Adding Tables
```sql
-- Add new table (additive change)
CREATE TABLE new_table (
    id UUID PRIMARY KEY,
    ...
);
```

#### Adding Indexes
```sql
-- Add new index (additive change)
CREATE INDEX idx_objects_new_column ON objects(new_column);
```

### Non-Breaking Changes

#### Renaming Columns
```sql
-- Rename column with migration
ALTER TABLE objects RENAME COLUMN old_column TO new_column;

-- Update event handlers to use new column
-- Maintain backward compatibility with view
CREATE VIEW objects_v1 AS
SELECT
    id,
    object_id,
    new_column AS old_column,
    ...
FROM objects;
```

#### Changing Column Types
```sql
-- Change column type with migration
ALTER TABLE objects ALTER COLUMN column TYPE VARCHAR(512);

-- Maintain backward compatibility with cast
CREATE OR REPLACE FUNCTION cast_column_v1(column_value VARCHAR(512))
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN substring(column_value, 1, 255);
END;
$$ LANGUAGE plpgsql;
```

### Breaking Changes

#### Removing Columns
```sql
-- Never remove columns directly
-- Mark as deprecated instead
COMMENT ON COLUMN objects.deprecated_column IS 'DEPRECATED: Use new_column instead';

-- Create view for backward compatibility
CREATE VIEW objects_v1 AS
SELECT
    id,
    object_id,
    deprecated_column,
    ...
FROM objects;
```

#### Removing Tables
```sql
-- Never remove tables directly
-- Mark as deprecated instead
COMMENT ON TABLE deprecated_table IS 'DEPRECATED: Use new_table instead';

-- Create view for backward compatibility
CREATE VIEW deprecated_table_v1 AS
SELECT * FROM deprecated_table;
```

---

## Artifact Schema Evolution

### Artifact Versioning

#### Artifact Schema Version
```json
{
  "artifact_id": "UUID",
  "artifact_type": "document",
  "artifact_version": "v1.0.0",
  "artifact_schema": {},
  "created_at": "ISO 8601"
}
```

#### Artifact Migration
```python
def migrate_artifact(artifact: Dict, from_version: str, to_version: str) -> Dict:
    """
    Migrate artifact from one version to another.
    
    Args:
        artifact: Artifact to migrate
        from_version: Source version
        to_version: Target version
    
    Returns:
        Migrated artifact
    """
    # Get migration rules
    migration_rules = get_artifact_migration_rules(from_version, to_version)
    
    # Apply migration
    for rule in migration_rules:
        artifact = apply_rule(artifact, rule)
    
    # Update version
    artifact['artifact_version'] = to_version
    
    return artifact
```

---

## Forward Compatibility

### Future Schema Support

#### Schema Registry
```sql
CREATE TABLE schema_registry (
    id UUID PRIMARY KEY,
    schema_id UUID NOT NULL UNIQUE,
    schema_name VARCHAR(255) NOT NULL,
    schema_version VARCHAR(255) NOT NULL,
    schema_definition JSONB NOT NULL,
    compatibility_rules JSONB,
    deprecated BOOLEAN DEFAULT false,
    deprecated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### Schema Compatibility
```python
def check_schema_compatibility(schema1: Dict, schema2: Dict) -> bool:
    """
    Check if two schemas are compatible.
    
    Args:
        schema1: First schema
        schema2: Second schema
    
    Returns:
        True if compatible
    """
    # Check for breaking changes
    breaking_changes = detect_breaking_changes(schema1, schema2)
    
    if breaking_changes:
        return False
    
    return True
```

---

## Backward Compatibility

### Legacy Support

#### Legacy Event Handlers
```python
# Legacy event handlers for old event versions
LEGACY_EVENT_HANDLERS = {
    'OBJECT_CREATED': {
        'v0.9.0': handle_object_created_v0_9,
        'v0.8.0': handle_object_created_v0_8
    }
}

def handle_legacy_event(event: Dict):
    """
    Handle legacy event.
    
    Args:
        event: Legacy event
    """
    event_version = event.get('event_version', 'v0.9.0')
    
    # Get handler
    handlers = LEGACY_EVENT_HANDLERS.get(event['event_type'], {})
    handler = handlers.get(event_version)
    
    if handler:
        return handler(event)
    else:
        # Migrate to current version
        return migrate_and_handle(event)
```

#### Legacy Views
```sql
-- Create views for backward compatibility
CREATE VIEW objects_v0_9 AS
SELECT
    id,
    object_id,
    content_hash,
    created_at,
    version,
    lineage_id
FROM objects;
```

---

## Migration Procedures

### Migration Execution

#### Apply Migration
```python
def apply_migration(migration_script: str):
    """
    Apply migration script.
    
    Args:
        migration_script: Migration script to apply
    """
    # Start transaction
    start_transaction()
    
    try:
        # Execute migration script
        execute_sql(migration_script)
        
        # Record migration
        record_migration(migration_script)
        
        # Commit transaction
        commit_transaction()
        
        print(f"Migration applied: {migration_script}")
        
    except Exception as e:
        # Rollback transaction
        rollback_transaction()
        
        print(f"Migration failed: {migration_script}")
        raise
```

#### Rollback Migration
```python
def rollback_migration(rollback_script: str):
    """
    Rollback migration script.
    
    Args:
        rollback_script: Rollback script to apply
    """
    # Start transaction
    start_transaction()
    
    try:
        # Execute rollback script
        execute_sql(rollback_script)
        
        # Record rollback
        record_rollback(rollback_script)
        
        # Commit transaction
        commit_transaction()
        
        print(f"Rollback applied: {rollback_script}")
        
    except Exception as e:
        # Rollback transaction
        rollback_transaction()
        
        print(f"Rollback failed: {rollback_script}")
        raise
```

---

## Migration Testing

### Test Procedures

#### Migration Test
```python
def test_migration(migration_script: str):
    """
    Test migration script.
    
    Args:
        migration_script: Migration script to test
    """
    # Create test database
    test_db = create_test_database()
    
    try:
        # Apply migration
        apply_migration_to_test_db(test_db, migration_script)
        
        # Verify migration
        verify_migration(test_db)
        
        print(f"Migration test passed: {migration_script}")
        
    finally:
        # Cleanup test database
        drop_test_database(test_db)
```

#### Rollback Test
```python
def test_rollback(rollback_script: str):
    """
    Test rollback script.
    
    Args:
        rollback_script: Rollback script to test
    """
    # Create test database
    test_db = create_test_database()
    
    try:
        # Apply rollback
        apply_rollback_to_test_db(test_db, rollback_script)
        
        # Verify rollback
        verify_rollback(test_db)
        
        print(f"Rollback test passed: {rollback_script}")
        
    finally:
        # Cleanup test database
        drop_test_database(test_db)
```

---

## Migration Best Practices

### 1. Additive Changes
- Prefer additive changes
- Never remove columns
- Never remove tables
- Maintain backward compatibility

### 2. Version Everything
- Version schemas
- Version events
- Version artifacts
- Version processors

### 3. Document Changes
- Document all migrations
- Document breaking changes
- Document compatibility rules
- Document rollback procedures

### 4. Test Thoroughly
- Test migrations
- Test rollbacks
- Test compatibility
- Test with real data

### 5. Support Legacy
- Support old event versions
- Support old artifact versions
- Provide migration paths
- Maintain legacy views
