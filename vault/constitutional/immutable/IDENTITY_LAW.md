# Constitutional Identity Law

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Constitutional identity definitions only. No implementation details.
**Root Law:** TRUTH_LAW.md (truth = immutable verified event), REPLAY_LAW.md (replay determinism)
**Date:** 2026-06-24

---

# CONSTITUTIONAL IDENTITY

## Axiom 1 — Identity Determinism

**AXIOM:** Identical content under identical identity rules yields identical identity. Identity assignment is a pure function of content and declared identity law.

**RATIONALE:** Without deterministic identity, artifacts cannot be referenced, deduplicated, verified, or replayed. Constitutional memory requires stable addressability.

**VIOLATION CONSEQUENCE:** Replay divergence, duplicate constitutional objects, integrity proofs become meaningless, audit trails fracture.

---

# IDENTITY CLASSIFICATIONS

## Immutable Identity

### Definition

Identity that is derived directly from content and never changes.

### content_hash

**Type:** SHA256 hex digest

**Purpose:** Immutable content-based identity

**Properties:**
- Derived from content
- Content-addressable
- Enables deduplication
- Verifies integrity
- Never changes

**Example:** `ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef`

**Constitutional Requirement:**
- Every artifact must have content_hash
- content_hash must be computed at creation
- content_hash must never change
- content_hash must be SHA256

**Use Cases:**
- Artifact identity
- Content verification
- Deduplication
- Witness generation

---

## Derived Identity

### Definition

Identity that is deterministically derived from content using a namespace and deterministic algorithm.

### deterministic_uuid_v5

**Type:** UUID v5 (SHA-1 namespace-based UUID)

**Purpose:** Deterministic derived identity

**Properties:**
- Deterministic: same content + namespace → same UUID
- Namespace-based: prevents collisions across domains
- Reproducible across systems
- Content-addressable

**Algorithm:**
```
UUIDv5(namespace, content) = SHA1(namespace + content) → UUID format
```

**Namespaces:**
- Artifact namespace: For artifact identity
- Event namespace: For event identity
- Lineage namespace: For lineage identity
- Actor namespace: For actor identity

**Example:** `6ba7b810-9dad-11d1-80b4-00c04fd430c8`

**Constitutional Requirement:**
- Derived identity must use UUID v5
- Derived identity must use declared namespace
- Derived identity must be deterministic
- Derived identity must be reproducible

**Use Cases:**
- Event identity (derived from event payload)
- Artifact identity (derived from artifact content)
- Lineage identity (derived from lineage chain)

---

## Prohibited Identities

### random_uuid_v4

**Type:** UUID v4 (random)

**Status:** PROHIBITED

**Reason:** Not deterministic. Same content produces different UUID across systems.

**Example:** `550e8400-e29b-41d4-a716-446655440000`

**Constitutional Consequence:** Replay divergence, identity mismatch, verification failure

---

### mutable_identifier

**Type:** Any identifier that can change

**Status:** PROHIBITED

**Examples:**
- Auto-increment IDs
- Database row IDs
- Sequential numbers
- Timestamp-based IDs that can change

**Reason:** Mutable identifiers break replay determinism. Identity must be immutable.

**Constitutional Consequence:** Replay divergence, identity corruption, audit trail fracture

---

### temporary_identifier

**Type:** Any identifier that is temporary or ephemeral

**Status:** PROHIBITED

**Examples:**
- Session IDs
- Temporary file names
- Cache keys
- In-memory IDs

**Reason:** Temporary identifiers are not constitutional. Constitutional identity must be permanent.

**Constitutional Consequence:** Identity loss, verification failure, replay divergence

---

### file_path

**Type:** File system path

**Status:** PROHIBITED

**Reason:** Location-dependent, not portable, not deterministic across systems

**Example:** `/path/to/file.pdf`

**Constitutional Consequence:** Portability failure, replay divergence, identity corruption

---

### insertion_ordering

**Type:** Identity based on insertion order

**Status:** PROHIBITED

**Reason:** Not deterministic across systems, depends on insertion timing

**Example:** Relying on insertion order for identity

**Constitutional Consequence:** Replay divergence, identity mismatch, verification failure

---

# CONSTITUTIONAL IDENTITY REQUIREMENTS

## Artifact Identity

Every artifact must have:
- **content_hash**: SHA256 (immutable identity)
- **object_id**: UUID v5 (derived identity, artifact namespace)

**Prohibited:**
- UUID v4 (random)
- Auto-increment IDs
- File paths
- Temporary identifiers

---

## Event Identity

Every event must have:
- **event_id**: UUID v5 (derived identity, event namespace, derived from event payload)
- **content_hash**: SHA256 (immutable identity, derived from canonicalized event payload)

**Prohibited:**
- UUID v4 (random)
- Timestamp-based IDs
- Sequential numbers
- Temporary identifiers

---

## Lineage Identity

Every lineage must have:
- **lineage_id**: UUID v5 (derived identity, lineage namespace)
- **root_artifact_id**: UUID v5 (derived identity, artifact namespace)

**Prohibited:**
- UUID v4 (random)
- Auto-increment IDs
- Temporary identifiers

---

## Actor Identity

Every actor must have:
- **actor_id**: UUID v5 (derived identity, actor namespace, derived from actor identity declaration)

**Prohibited:**
- UUID v4 (random)
- Temporary session IDs
- Mutable identifiers

---

# IDENTITY GENERATION RULES

## Rule 1 — Immutable Identity Generation

**Rule:** content_hash must be SHA256 of content

**Algorithm:**
```
content_hash = SHA256(content)
```

**Validation:**
- Verify content_hash matches SHA256 of content
- Verify content_hash is 64 hex characters

**Failure:**
- Identity violation
- Constitutional incident

---

## Rule 2 — Derived Identity Generation

**Rule:** Derived identity must use UUID v5 with declared namespace

**Algorithm:**
```
derived_id = UUIDv5(namespace, content)
```

**Namespaces:**
- Artifact namespace: `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
- Event namespace: `6ba7b811-9dad-11d1-80b4-00c04fd430c8`
- Lineage namespace: `6ba7b812-9dad-11d1-80b4-00c04fd430c8`
- Actor namespace: `6ba7b813-9dad-11d1-80b4-00c04fd430c8`

**Validation:**
- Verify derived_id is UUID v5 format
- Verify derived_id is deterministic (same content → same UUID)
- Verify derived_id uses correct namespace

**Failure:**
- Identity violation
- Constitutional incident

---

## Rule 3 — Identity Immutability

**Rule:** Identity must never change after creation

**Validation:**
- Verify content_hash never changes
- Verify derived_id never changes
- Verify no identity updates

**Failure:**
- Identity mutation
- Constitutional incident
- Replay divergence

---

# IDENTITY VERIFICATION

## Verification Gate

**Purpose:** Verify identity compliance before storage

**Input:**
- content
- content_hash
- derived_id
- namespace

**Verification:**
1. Verify content_hash matches SHA256 of content
2. Verify derived_id is UUID v5 format
3. Verify derived_id matches UUIDv5(namespace, content)
4. Verify derived_id uses correct namespace
5. Verify no prohibited identifiers

**Output:**
- verification_result: PASS | FAIL
- rejection_reason: string (if FAIL)

**Failure:**
- Reject identity
- Open constitutional incident
- Record rejection reason

---

# CONSTITUTIONAL INVARIANTS

## Invariant 1 — Identity is Deterministic

**Statement:** Identical content under identical identity rules yields identical identity

**Violation:** Non-deterministic identity assignment

**Consequence:** Constitutional incident

---

## Invariant 2 — Identity is Immutable

**Statement:** Identity never changes after creation

**Violation:** Identity mutation

**Consequence:** Constitutional incident

---

## Invariant 3 — Identity is Content-Addressable

**Statement:** Identity is derived from content

**Violation:** Identity not derived from content

**Consequence:** Constitutional incident

---

## Invariant 4 — No Prohibited Identifiers

**Statement:** Prohibited identifiers are never used

**Violation:** Use of prohibited identifier

**Consequence:** Constitutional incident

---

# FAILURE SEMANTICS

## Identity Violation Detection

**Detection:** Identity verification gate

**Severity:** CRITICAL

**Action:** Reject identity, open constitutional incident

**Remediation:** Fix identity generation, re-run verification

## Identity Divergence Detection

**Detection:** Replay verification

**Severity:** CRITICAL

**Action:** Open constitutional incident

**Remediation:** Investigate identity generation, fix replay divergence

---

# CONSTITUTIONAL PRINCIPLE

**Identity must be deterministic. Identity must be immutable. Identity must be content-addressable. Prohibited identifiers are constitutional violations.**

---

**Document ID:** CONSTITUTION-IDENTITY-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process

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
