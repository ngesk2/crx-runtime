# Constitutional Identity Law

**Phase 1:** Audit all identifiers and establish constitutional identity requirements

---

## Overview

Constitutional Identity Law establishes the requirements for all identifiers in the system. Every object must be addressable solely by constitutional identity, never by implementation details.

---

## Prohibited Identifiers

### Auto-Increment IDs
**Status:** PROHIBITED
**Reason:** Not reproducible across systems
**Example:** `id SERIAL PRIMARY KEY`

### Database Row IDs
**Status:** PROHIBITED
**Reason:** Implementation-specific, not portable
**Example:** Physical row locations, internal IDs

### File Paths
**Status:** PROHIBITED
**Reason:** Location-dependent, not portable
**Example:** `/path/to/file.pdf`

### Insertion Ordering
**Status:** PROHIBITED
**Reason:** Not deterministic across systems
**Example:** Relying on insertion order for identity

---

## Required Identifiers

### object_id
**Type:** UUID v4
**Purpose:** Unique object identifier
**Properties:**
- Universally unique
- No central authority required
- Reproducible across systems
- Independent of storage location

**Example:** `550e8400-e29b-41d4-a716-446655440000`

### content_hash
**Type:** SHA256 hex digest
**Purpose:** Content-based identity
**Properties:**
- Derived from content
- Content-addressable
- Enables deduplication
- Verifies integrity

**Example:** `ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef`

### lineage_id
**Type:** UUID v4
**Purpose:** Tracks object evolution
**Properties:**
- Identifies object family
- Tracks version history
- Enables lineage traversal
- Supports replay

**Example:** `6ba7b810-9dad-11d1-80b4-00c04fd430c8`

### event_id
**Type:** UUID v4
**Purpose:** Unique event identifier
**Properties:**
- Universally unique
- Event ordering independent
- Supports distributed systems
- Enables event replay

**Example:** `6ba7b810-9dad-11d1-80b4-00c04fd430c8`

---

## Identity Audit

### Current Schema Audit

#### Objects Table
```sql
CREATE TABLE objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ PROHIBITED
    object_id UUID NOT NULL UNIQUE,                 -- ✅ REQUIRED
    content_hash VARCHAR(64) NOT NULL,              -- ✅ REQUIRED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    lineage_id UUID NOT NULL,                       -- ✅ REQUIRED
    ...
);
```

**Audit Result:** 
- ✅ object_id present
- ✅ content_hash present  
- ✅ lineage_id present
- ❌ Auto-increment id present (must be removed from identity logic)

#### Events Table
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ PROHIBITED
    event_id UUID NOT NULL UNIQUE,                  -- ✅ REQUIRED
    event_type VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregate_id UUID NOT NULL,
    ...
);
```

**Audit Result:**
- ✅ event_id present
- ❌ Auto-increment id present (must be removed from identity logic)

#### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ❌ PROHIBITED
    document_id UUID NOT NULL UNIQUE,                -- ✅ REQUIRED
    object_id UUID NOT NULL,
    file_path VARCHAR(1024),                        -- ❌ PROHIBITED
    ...
);
```

**Audit Result:**
- ✅ document_id present
- ✅ object_id present
- ❌ file_path present (must not be used for identity)

---

## Identity Requirements

### 1. Object Identity
Every object must be identified by:
- `object_id`: UUID v4
- `content_hash`: SHA256
- `lineage_id`: UUID v4

No other identifier may be used for object identity.

### 2. Event Identity
Every event must be identified by:
- `event_id`: UUID v4
- `timestamp`: ISO 8601
- `aggregate_id`: UUID v4

No other identifier may be used for event identity.

### 3. Lineage Identity
Every lineage must be identified by:
- `lineage_id`: UUID v4
- `root_artifact_id`: UUID v4

No other identifier may be used for lineage identity.

---

## Identity Resolution

### Object Resolution
```python
def resolve_object(object_id: UUID) -> Dict:
    """
    Resolve object by constitutional identity.
    
    Args:
        object_id: Constitutional object identifier
    
    Returns:
        Object data
    """
    # Query by object_id only
    query = "SELECT * FROM objects WHERE object_id = $1"
    return execute_query(query, [object_id])
```

### Content Resolution
```python
def resolve_by_content(content_hash: str) -> Dict:
    """
    Resolve object by content hash.
    
    Args:
        content_hash: Content hash
    
    Returns:
        Object data
    """
    # Query by content_hash only
    query = "SELECT * FROM objects WHERE content_hash = $1"
    return execute_query(query, [content_hash])
```

### Lineage Resolution
```python
def resolve_lineage(lineage_id: UUID) -> Dict:
    """
    Resolve lineage by constitutional identity.
    
    Args:
        lineage_id: Constitutional lineage identifier
    
    Returns:
        Lineage data
    """
    # Query by lineage_id only
    query = "SELECT * FROM lineage WHERE lineage_id = $1"
    return execute_query(query, [lineage_id])
```

---

## Identity Migration

### Migration Strategy

#### Step 1: Add Required Identifiers
```sql
-- Ensure all required identifiers exist
ALTER TABLE objects ADD COLUMN IF NOT EXISTS object_id UUID NOT NULL UNIQUE;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) NOT NULL;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS lineage_id UUID NOT NULL;

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_id UUID NOT NULL UNIQUE;
```

#### Step 2: Generate Missing Identifiers
```sql
-- Generate object_id for existing objects
UPDATE objects 
SET object_id = uuid_generate_v4() 
WHERE object_id IS NULL;

-- Generate content_hash for existing objects
UPDATE objects 
SET content_hash = encode(digest(content, 'sha256'), 'hex')
WHERE content_hash IS NULL;

-- Generate lineage_id for existing objects
UPDATE objects 
SET lineage_id = object_id 
WHERE lineage_id IS NULL;

-- Generate event_id for existing events
UPDATE events 
SET event_id = uuid_generate_v4() 
WHERE event_id IS NULL;
```

#### Step 3: Remove Identity Dependencies
```sql
-- Remove references to auto-increment ids
-- Update all foreign keys to use constitutional identifiers
```

---

## Identity Verification

### Verification Procedures

#### Object Identity Verification
```python
def verify_object_identity():
    """
    Verify all objects have constitutional identity.
    """
    query = """
        SELECT COUNT(*) FROM objects 
        WHERE object_id IS NULL 
        OR content_hash IS NULL 
        OR lineage_id IS NULL
    """
    
    count = execute_query(query)[0]['count']
    
    if count > 0:
        raise Exception(f"{count} objects missing constitutional identity")
    
    return True
```

#### Event Identity Verification
```python
def verify_event_identity():
    """
    Verify all events have constitutional identity.
    """
    query = """
        SELECT COUNT(*) FROM events 
        WHERE event_id IS NULL
    """
    
    count = execute_query(query)[0]['count']
    
    if count > 0:
        raise Exception(f"{count} events missing constitutional identity")
    
    return True
```

---

## Identity Best Practices

### 1. Always Use Constitutional Identifiers
- Never use auto-increment IDs for identity
- Never use database row IDs for identity
- Never use file paths for identity
- Always use object_id, content_hash, lineage_id, event_id

### 2. Generate Identifiers at Creation
- Generate object_id before storage
- Generate content_hash before storage
- Generate lineage_id before storage
- Generate event_id before storage

### 3. Never Change Identifiers
- object_id never changes
- content_hash never changes
- lineage_id never changes
- event_id never changes

### 4. Verify Identifiers Regularly
- Verify object identity regularly
- Verify event identity regularly
- Verify lineage identity regularly
- Verify identifier uniqueness

### 5. Document Identity Usage
- Document which identifiers are used where
- Document identifier generation
- Document identifier resolution
- Document identifier verification
