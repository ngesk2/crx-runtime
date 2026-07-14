# Phase 12: Handwritten Infrastructure Audit

## Executive Summary

Audit of all handwritten infrastructure in the constitutional runtime to identify OSS replacements that satisfy constitutional determinism requirements.

## Constitutional Rule

The constitutional runtime should only contain handwritten code when it expresses constitutional law. Everything else should delegate to audited open-source infrastructure.

## Audit Results

### 1. Hashing (constitution/hashing.py)

**Current Implementation:**
- Custom SHA256 hashing using hashlib
- Canonical JSON serialization (sorted keys, no whitespace)
- Unicode normalization (NFC)
- 62 lines of handwritten code

**OSS Replacement Candidates:**
- blake3 (faster, cryptographic)
- sha2 crate (Rust)
- orjson (Python, faster JSON)

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- hashlib is standard library, mature, audited
- Canonical serialization is constitutional-specific (deterministic ordering)
- Unicode normalization is constitutional-specific (replay consistency)
- No performance bottleneck identified
- Migration risk: LOW (would require careful validation of canonical ordering)

**Decision: KEEP**
- Handwritten code expresses constitutional law (canonical ordering, normalization)
- Standard library is already audited
- No benefit to replacement

---

### 2. Merkle Tree (constitution/hashing/merkle.py)

**Current Implementation:**
- Custom Merkle tree for BuildWitness root computation
- Bottom-up tree construction
- Simplified proof generation (not fully implemented)
- 142 lines of handwritten code

**OSS Replacement Candidates:**
- merkle crate (Rust)
- merkletree crate (Rust)
- No mature Python Merkle tree libraries with constitutional guarantees

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- Deterministic leaf ordering (sorted by label)
- Uses CanonicalHasher for node hashing (constitutional)
- Proof generation is incomplete but not blocking
- Migration risk: LOW

**Decision: KEEP**
- Handwritten code expresses constitutional law (deterministic ordering)
- No mature OSS with constitutional guarantees
- Simple implementation, low maintenance burden

---

### 3. Event Store (storage/event_store.py)

**Current Implementation:**
- Custom event store using SQLAlchemy + PostgreSQL
- Append-only event log
- Transactional outbox pattern
- Custom hash verification
- 174 lines of handwritten code

**OSS Replacement Candidates:**
- eventstoredb (specialized event store)
- NATS JetStream (streaming)
- Apache Kafka (event streaming)
- sqlx (Rust database client)

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- SQLAlchemy is mature, audited OSS
- Append-only semantics are constitutional (immutability)
- Transactional outbox is constitutional (atomicity)
- Custom hash verification is constitutional (replay verification)
- Migration risk: HIGH (would require careful validation of append-only semantics)

**Decision: KEEP**
- SQLAlchemy is already mature OSS
- Handwritten code expresses constitutional law (append-only, hash verification)
- No benefit to replacement (SQLAlchemy is the standard)

---

### 4. Artifact Store (storage/artifact_store.py)

**Current Implementation:**
- Custom content-addressed artifact storage
- SHA256 content addressing
- Pluggable storage adapters
- Artifact lineage tracking via immutable references
- 324 lines of handwritten code

**OSS Replacement Candidates:**
- iroh-blobs (Rust, content-addressed storage)
- IPFS (distributed content addressing)
- S3 (object storage, not content-addressed by default)

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- Content addressing is constitutional (deterministic IDs)
- Immutable references are constitutional (lineage immutability)
- Pluggable adapters are constitutional (infrastructure abstraction)
- Migration risk: LOW

**Decision: KEEP**
- Handwritten code expresses constitutional law (content addressing, immutable lineage)
- Pluggable adapters allow OSS backends (S3, GCS, etc.)
- No benefit to replacement (already uses OSS for storage backends)

---

### 5. Storage Adapters (storage/artifact_adapter.py)

**Current Implementation:**
- Custom storage adapter pattern
- FilesystemAdapter (handwritten)
- S3Adapter (stubbed)
- MemoryAdapter (handwritten)
- 153 lines of handwritten code

**OSS Replacement Candidates:**
- boto3 (Python S3 client)
- aiofiles (Python async filesystem)
- s3fs (Python S3 filesystem interface)

**Constitutional Evaluation:**
- **REPLACE IMMEDIATELY** - S3Adapter should use boto3
- **REPLACE IMMEDIATELY** - FilesystemAdapter should use aiofiles
- Adapter pattern is constitutional (infrastructure abstraction)
- Migration risk: LOW

**Decision: REPLACE IMMEDIATELY**
- S3Adapter: Replace stubbed implementation with boto3
- FilesystemAdapter: Replace with aiofiles for async operations
- Adapter pattern remains (constitutional)

---

### 6. Event DAG (kernel/event_dag.py)

**Current Implementation:**
- Custom DAG implementation for causal relationships
- EventDAG, ReplayDAG, MissionDAG, ArtifactDAG, CommandDAG
- Custom adjacency map implementation
- 559 lines of handwritten code

**OSS Replacement Candidates:**
- petgraph (Rust graph library)
- networkx (Python graph library)

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- Causal relationships are constitutional (replay determinism)
- Custom adjacency map is constitutional (O(depth) lookup)
- networkx is not constitutional (mutable, non-deterministic ordering)
- Migration risk: HIGH (would require validation of deterministic ordering)

**Decision: KEEP**
- Handwritten code expresses constitutional law (causal relationships, deterministic ordering)
- networkx is not constitutional (mutable, non-deterministic)
- petgraph is Rust (not applicable to Python layer)

---

### 7. Database Setup (storage/postgres/database.py)

**Current Implementation:**
- Custom database setup using SQLAlchemy
- Async session management
- Database initialization/drop
- 38 lines of handwritten code

**OSS Replacement Candidates:**
- SQLAlchemy (already using)
- sqlx (Rust database client)
- alembic (already using for migrations)

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- SQLAlchemy is mature, audited OSS
- Session management is standard pattern
- Migration risk: LOW

**Decision: KEEP**
- SQLAlchemy is already mature OSS
- Handwritten code is minimal (38 lines)
- No benefit to replacement

---

### 8. JSON Serialization (implicit in multiple files)

**Current Implementation:**
- Using standard json module
- CanonicalHasher uses json.dumps with sort_keys=True

**OSS Replacement Candidates:**
- orjson (faster JSON serialization)
- msgspec (faster, schema-based)
- cbor2 (CBOR binary format)

**Constitutional Evaluation:**
- **REPLACE LATER** - Consider orjson for performance
- Current implementation is constitutional (deterministic)
- orjson is faster but requires validation of canonical ordering
- Migration risk: LOW

**Decision: REPLACE LATER**
- Performance optimization, not constitutional requirement
- Requires validation of canonical ordering
- Can be deferred until profiling identifies bottleneck

---

### 9. PostgreSQL Models (storage/postgres/models.py)

**Current Implementation:**
- Custom SQLAlchemy models
- 411 lines of handwritten code

**OSS Replacement Candidates:**
- SQLAlchemy (already using)
- No replacement needed

**Constitutional Evaluation:**
- **KEEP** - Current implementation is constitutional
- SQLAlchemy models are standard pattern
- Constitutional fields are properly defined
- Migration risk: LOW

**Decision: KEEP**
- SQLAlchemy is already mature OSS
- Handwritten code is model definitions (constitutional schema)
- No benefit to replacement

---

## Migration Plan

### KEEP (Constitutional-specific, no replacement)

1. **constitution/hashing.py** - Expresses constitutional law (canonical ordering, normalization)
2. **constitution/hashing/merkle.py** - Expresses constitutional law (deterministic ordering)
3. **storage/event_store.py** - Uses mature OSS (SQLAlchemy), expresses constitutional law (append-only)
4. **storage/artifact_store.py** - Expresses constitutional law (content addressing, immutable lineage)
5. **kernel/event_dag.py** - Expresses constitutional law (causal relationships, deterministic ordering)
6. **storage/postgres/database.py** - Uses mature OSS (SQLAlchemy), minimal handwritten code
7. **storage/postgres/models.py** - Model definitions (constitutional schema)

### REPLACE IMMEDIATELY (Infrastructure adapters)

1. **storage/artifact_adapter.py** - Replace stubbed S3Adapter with boto3, replace FilesystemAdapter with aiofiles

### REPLACE LATER (Performance optimizations)

1. **JSON serialization** - Consider orjson after profiling identifies bottleneck

### DELETE

None identified.

## Next Steps

1. Generate patches for REPLACE IMMEDIATELY items
2. Validate constitutional compliance of patches
3. Apply patches
4. Run tests to verify replay determinism
