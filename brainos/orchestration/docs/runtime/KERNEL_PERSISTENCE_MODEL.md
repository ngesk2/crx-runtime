# Kernel Persistence Model

**Phase 13:** Define what persists, what is derived, what is disposable

---

## Overview

Kernel Persistence Model defines what persists, what is derived, and what is disposable. Persistent: Objects, Events, State, Lineage, Witnesses. Disposable: Caches, Indexes, Graphs, Vectors, AI projections.

---

## Persistent Data

### Objects (Layer 0)
**Status:** PERSISTENT
**Storage:** Immutable Object Store
**Characteristics:**
- Content-addressable
- Immutable
- Never deleted
- Never modified

**Persistence Strategy:**
- Store in object store
- Replicate across storage
- Archive old objects
- Backup regularly

### Events (Layer 1)
**Status:** PERSISTENT
**Storage:** Event Log
**Characteristics:**
- Append-only
- Immutable
- Never deleted
- Never modified

**Persistence Strategy:**
- Store in event log
- Replicate across storage
- Archive old events
- Backup regularly

### State (Layer 2)
**Status:** PERSISTENT
**Storage:** Canonical State (PostgreSQL)
**Characteristics:**
- Event-sourced
- Reconstructable
- Verifiable
- Hashable

**Persistence Strategy:**
- Store in PostgreSQL
- Replicate across databases
- Backup regularly
- Support point-in-time recovery

### Lineage
**Status:** PERSISTENT
**Storage:** Canonical State (PostgreSQL)
**Characteristics:**
- Event-sourced
- Replay-verifiable
- Verifiable
- Auditable

**Persistence Strategy:**
- Store in PostgreSQL
- Replicate across databases
- Backup regularly
- Support lineage queries

### Witnesses
**Status:** PERSISTENT
**Storage:** Witness Storage
**Characteristics:**
- Deterministic
- Verifiable
- Long-lived
- Archivable

**Persistence Strategy:**
- Store in witness storage
- Replicate across storage
- Archive old witnesses
- Backup regularly

---

## Derived Data

### Aggregations
**Status:** DERIVED
**Source:** Persistent Data
**Characteristics:**
- Computed from persistent data
- Rebuildable
- Verifiable
- Disposable

**Examples:**
- Object counts
- Event counts
- Task statistics
- Workflow statistics

### Projections
**Status:** DERIVED
**Source:** Persistent Data
**Characteristics:**
- Computed from persistent data
- Rebuildable
- Verifiable
- Disposable

**Examples:**
- Knowledge graph (Neo4j)
- Vector space (Qdrant)
- Search index (OpenSearch)

---

## Disposable Data

### Caches
**Status:** DISPOSABLE
**Purpose:** Performance optimization
**Characteristics:**
- Rebuildable
- Deletable
- Replaceable
- Never source of truth

**Examples:**
- Object cache
- Event cache
- State cache
- Result cache

### Indexes
**Status:** DISPOSABLE
**Purpose:** Query optimization
**Characteristics:**
- Rebuildable
- Deletable
- Replaceable
- Never source of truth

**Examples:**
- Search indexes
- Full-text indexes
- Metadata indexes

### Graphs
**Status:** DISPOSABLE
**Purpose:** Knowledge representation
**Characteristics:**
- Rebuildable
- Deletable
- Replaceable
- Never source of truth

**Examples:**
- Knowledge graph (Neo4j)
- Relationship graph
- Entity graph

### Vectors
**Status:** DISPOSABLE
**Purpose:** Semantic search
**Characteristics:**
- Rebuildable
- Deletable
- Replaceable
- Never source of truth

**Examples:**
- Vector embeddings
- Vector index (Qdrant)
- Similarity search index

### AI Projections
**Status:** DISPOSABLE
**Purpose:** AI operations
**Characteristics:**
- Rebuildable
- Deletable
- Replaceable
- Never source of truth

**Examples:**
- LLM responses
- Agent outputs
- AI model outputs

---

## Persistence Strategy

### Write Path
```
Command
    ↓
Event Emission
    ↓
Event Persistence (Layer 1)
    ↓
State Mutation (Layer 2)
    ↓
State Persistence (Layer 2)
    ↓
Witness Generation
    ↓
Witness Persistence
```

### Read Path
```
Query
    ↓
Check Cache (Disposable)
    ↓
Cache Hit → Return
    ↓
Cache Miss → Query Persistent Data
    ↓
Return Result
    ↓
Populate Cache
```

### Rebuild Path
```
Projection Rebuild Request
    ↓
Query Persistent Data
    ↓
Rebuild Projection
    ↓
Verify Projection
    ↓
Replace Projection
```

---

## Persistence Best Practices

### 1. Persistent Data
- Never delete persistent data
- Never modify persistent data
- Always replicate persistent data
- Always backup persistent data

### 2. Derived Data
- Always rebuild from persistent data
- Never store derived data as truth
- Always verify derived data
- Always rebuild derived data regularly

### 3. Disposable Data
- Always treat as disposable
- Always rebuild when needed
- Always delete when not needed
- Never use as source of truth

### 4. Verification
- Verify persistent data integrity
- Verify derived data correctness
- Verify disposable data rebuildability
- Verify data consistency

### 5. Documentation
- Document persistence strategy
- Document rebuild procedures
- Document verification procedures
- Document data lifecycle
