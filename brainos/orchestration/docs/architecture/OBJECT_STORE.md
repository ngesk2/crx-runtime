# Object Store Architecture

**Layer:** 0 — Immutable Object Storage
**Status:** CONSTITUTIONAL TRUTH
**Purpose:** Store all immutable content with content-addressable identification

---

## Overview

The object store is the foundational layer of the constitutional architecture. All content entering the system is stored as immutable objects with content-addressable identification. The object store never modifies or deletes objects.

---

## Design Principles

### 1. Content Addressable
- Objects identified by SHA256 hash
- Hash computed from object content
- Hash serves as unique identifier
- Enables deduplication

### 2. Immutable
- Objects never modified after creation
- Objects never deleted
- Append-only storage
- Versioning through new objects

### 3. Git-Style Layout
- First 2 characters of hash as directory
- Remaining characters as filename
- Prevents directory overcrowding
- Enables efficient filesystem operations

### 4. Path Transparency
- Objects never referenced by path
- All references use object_id and content_hash
- Storage location transparent to consumers
- Enables storage migration

---

## Directory Structure

```
objects/
  ab/
    ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef
    ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcde1
  ef/
    ef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
  ...
```

### Path Derivation
```python
def derive_path(content_hash: str) -> str:
    """
    Derive storage path from content hash.
    
    Args:
        content_hash: SHA256 hex digest (64 characters)
    
    Returns:
        Relative path: "ab/ab12cd34..."
    """
    prefix = content_hash[:2]
    suffix = content_hash[2:]
    return f"{prefix}/{suffix}"
```

---

## Object Identity Model

### Required Fields

```json
{
  "object_id": "550e8400-e29b-41d4-a716-446655440000",
  "content_hash": "ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef",
  "created_at": "2026-06-14T18:00:00Z",
  "version": 1,
  "lineage_id": "550e8400-e29b-41d4-a716-446655440000",
  "content_type": "application/json",
  "content_size": 1024,
  "metadata": {}
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| object_id | UUID v4 | Unique object identifier |
| content_hash | SHA256 | Cryptographic hash of content |
| created_at | ISO 8601 | Creation timestamp |
| version | integer | Object version number |
| lineage_id | UUID v4 | Tracks object evolution |
| content_type | MIME type | Content media type |
| content_size | integer | Content size in bytes |
| metadata | JSON | User-defined metadata |

---

## Content Hash Computation

### Algorithm
```python
import hashlib

def compute_content_hash(content: bytes) -> str:
    """
    Compute SHA256 hash of content.
    
    Args:
        content: Raw content bytes
    
    Returns:
        SHA256 hex digest (64 characters)
    """
    return hashlib.sha256(content).hexdigest()
```

### Requirements
- SHA256 algorithm only
- Hex digest format
- 64 character output
- Deterministic computation

---

## Object Lifecycle

### Creation
1. Compute content hash
2. Generate object_id (UUID v4)
3. Set created_at (current timestamp)
4. Set version (1)
5. Set lineage_id (object_id)
6. Store at derived path
7. Emit OBJECT_CREATED event

### Versioning
1. Compute new content hash
2. Generate new object_id
3. Set created_at (current timestamp)
4. Set version (previous version + 1)
5. Set lineage_id (original lineage_id)
6. Store at derived path
7. Emit OBJECT_VERSIONED event

### Access
1. Query by object_id
2. Retrieve content_hash
3. Derive storage path
4. Read content
5. Verify content hash
6. Return content

---

## Storage Requirements

### Filesystem
- Support for long filenames (64+ characters)
- Support for deep directory structures
- Support for large files (GB+)
- POSIX permissions

### Performance
- Efficient directory lookups
- Fast file reads
- Concurrent access support
- Lock-free reads

### Scalability
- Distributed filesystem support
- Object storage backend (S3, MinIO)
- Caching layer
- CDN support

---

## Integrity Verification

### Read Verification
```python
def verify_object(content: bytes, content_hash: str) -> bool:
    """
    Verify object integrity.
    
    Args:
        content: Object content
        content_hash: Expected hash
    
    Returns:
        True if hash matches
    """
    computed_hash = compute_content_hash(content)
    return computed_hash == content_hash
```

### Batch Verification
- Periodic integrity scans
- Content hash recomputation
- Corruption detection
- Automated repair procedures

---

## Deduplication

### Automatic Deduplication
- Same content hash = same object
- No duplicate storage
- Reference counting
- Garbage collection

### Reference Tracking
```json
{
  "content_hash": "ab12cd34...",
  "reference_count": 5,
  "references": [
    "object_id_1",
    "object_id_2",
    "object_id_3",
    "object_id_4",
    "object_id_5"
  ]
}
```

---

## Metadata Storage

### Object Metadata
- Stored alongside object
- JSON format
- User-defined
- Indexed for search

### System Metadata
- Content type
- Content size
- Creation timestamp
- Access timestamps
- Storage location

---

## Access Patterns

### Write Pattern
1. Compute content hash
2. Check if exists
3. If exists, return existing object_id
4. If not exists, create new object
5. Return object_id

### Read Pattern
1. Query by object_id
2. Retrieve content_hash
3. Derive path
4. Read content
5. Verify hash
6. Return content

### List Pattern
1. Query by lineage_id
2. Return all versions
3. Order by version
4. Return metadata

---

## Backup Strategy

### Hot Backup
- Real-time replication
- Synchronous writes
- Zero RPO
- Automatic failover

### Warm Backup
- Periodic snapshots
- Asynchronous replication
- RPO < 1 hour
- Manual failover

### Cold Backup
- Encrypted archives
- Off-site storage
- RPO < 24 hours
- Manual restore

---

## Migration Strategy

### Storage Migration
1. Export object metadata
2. Copy objects to new location
3. Verify content hashes
4. Update path mapping
5. Switch references
6. Decommission old storage

### Path Mapping
```json
{
  "content_hash": "ab12cd34...",
  "old_path": "objects/ab/ab12cd34...",
  "new_path": "new_storage/ab/ab12cd34..."
}
```

---

## Security

### Encryption at Rest
- AES-256 encryption
- Per-object keys
- Key management integration
- Transparent encryption

### Encryption in Transit
- TLS 1.3
- Certificate pinning
- Mutual TLS
- Secure protocols

### Access Control
- Read/write permissions
- Role-based access
- Audit logging
- IP restrictions

---

## Monitoring

### Metrics
- Object count
- Storage usage
- Read/write latency
- Error rates
- Deduplication ratio

### Alerts
- Storage capacity
- Corruption detection
- Access failures
- Performance degradation

---

## API Interface

### Create Object
```http
POST /objects
Content-Type: application/octet-stream

<binary content>

Response:
{
  "object_id": "UUID",
  "content_hash": "SHA256",
  "created_at": "ISO 8601",
  "version": 1
}
```

### Get Object
```http
GET /objects/{object_id}

Response:
Content-Type: application/octet-stream
X-Content-Hash: SHA256

<binary content>
```

### List Objects
```http
GET /objects?lineage_id={lineage_id}

Response:
{
  "objects": [
    {
      "object_id": "UUID",
      "content_hash": "SHA256",
      "version": 1,
      "created_at": "ISO 8601"
    }
  ]
}
```

---

## Implementation Notes

### Filesystem Backend
- Default for laptop deployment
- Simple implementation
- No external dependencies
- Direct file access

### Object Storage Backend
- S3-compatible API
- MinIO for self-hosted
- AWS S3 for cloud
- Azure Blob for Azure

### Hybrid Backend
- Hot tier: Local filesystem
- Warm tier: MinIO cluster
- Cold tier: S3 Glacier

---

## Future Considerations

### Compression
- Optional compression
- Transparent decompression
- Content hash of compressed content
- Metadata flag

### Erasure Coding
- Data durability
- Reduced storage cost
- Computational overhead
- Recovery procedures

### Content Addressable Storage (CAS)
- Industry standard
- Interoperability
- Tooling support
- Best practices
