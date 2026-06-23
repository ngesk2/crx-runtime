# Storage Classification

**Date:** 2026-06-14
**Phase:** PING CONSTITUTIONAL STABILIZATION PHASE F
**Objective:** Classify storage systems by constitutional role

---

## STORAGE SYSTEM CLASSIFICATION

### 1. PostgreSQL

**Location:** PING Commit Service

**Type:** Relational Database

**Current Role:** Artifact persistence (PING Commit Service)

**Constitutional Classification:** AUTHORITY

**Rationale:**
- PostgreSQL provides durability, transactions, indexing, queryability, operational maturity
- PostgreSQL can serve as constitutional object store
- PostgreSQL can serve as constitutional event log
- PostgreSQL can serve as canonical state
- PostgreSQL requires constitutional schemas and append-only guarantees
- PostgreSQL does NOT require new storage engine

**Constitutional Role:**
- **Layer 0 — Constitutional Object Store:** Store constitutional objects
- **Layer 1 — Constitutional Event Log:** Store immutable events
- **Layer 2 — Canonical State:** Store derived state

**Migration Path:**
- Add constitutional object schema to PostgreSQL
- Add constitutional event schema to PostgreSQL
- Add append-only guarantees (triggers, constraints)
- Migrate existing artifacts to constitutional objects
- Add event logging to all mutations
- Use PostgreSQL as constitutional authority

**Status:** AUTHORITY (constitutional event authority)

---

### 2. SQLite (CRX-Digestion-Worker)

**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db

**Type:** Embedded Relational Database

**Current Role:** Article persistence (articles, sources)

**Constitutional Classification:** PROJECTION CACHE

**Rationale:**
- SQLite provides durability, indexing, queryability, operational simplicity
- SQLite can serve as projection cache
- SQLite can serve as replay materialization layer
- SQLite can serve as query accelerator
- SQLite can serve as derived state cache
- SQLite loses authority status

**Constitutional Role:**
- **Layer 4+ — Projections:** Cache derived projections (summaries, digests)
- **Layer 4+ — Replay Materialization:** Materialize replay state for fast queries
- **Layer 4+ — Query Accelerator:** Accelerate queries from constitutional state

**Migration Path:**
- Keep SQLite as projection cache
- Remove authority status
- Migrate existing articles to constitutional objects
- Use SQLite for derived projections (summaries, digests)
- Use SQLite for replay materialization
- Use SQLite for temporary indexes

**Status:** PROJECTION CACHE (non-constitutional)

---

### 3. SQLite (CRX-Newsletter-Brain)

**Location:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db

**Type:** Embedded Relational Database

**Current Role:** Newsletter persistence (newsletters, digests, topics)

**Constitutional Classification:** PROJECTION CACHE

**Rationale:**
- SQLite provides durability, indexing, queryability, operational simplicity
- SQLite can serve as projection cache
- SQLite can serve as replay materialization layer
- SQLite can serve as query accelerator
- SQLite can serve as derived state cache
- SQLite loses authority status

**Constitutional Role:**
- **Layer 4+ — Projections:** Cache derived projections (summaries, digests)
- **Layer 4+ — Replay Materialization:** Materialize replay state for fast queries
- **Layer 4+ — Query Accelerator:** Accelerate queries from constitutional state

**Migration Path:**
- Keep SQLite as projection cache
- Remove authority status
- Migrate existing newsletters to constitutional objects
- Use SQLite for derived projections (summaries, digests)
- Use SQLite for replay materialization
- Use SQLite for temporary indexes

**Status:** PROJECTION CACHE (non-constitutional)

---

### 4. Markdown Files (CRX-Digestion-Worker)

**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\

**Type:** File System Storage

**Current Role:** Article archival (markdown files)

**Constitutional Classification:** ARCHIVE

**Rationale:**
- Markdown files are human-readable archives
- Markdown files are not authoritative
- Markdown files are derived from constitutional objects
- Markdown files can be regenerated from constitutional objects

**Constitutional Role:**
- **Layer 4+ — Projections:** Human-readable projections of constitutional objects
- **Layer 4+ — Archive:** Long-term storage of derived projections

**Migration Path:**
- Keep markdown files as archive
- Remove authority status
- Regenerate markdown files from constitutional objects
- Use markdown files for human-readable access

**Status:** ARCHIVE (non-constitutional)

---

### 5. Markdown Files (CRX-Newsletter-Brain)

**Location:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\

**Type:** File System Storage

**Current Role:** Newsletter archival (markdown files)

**Constitutional Classification:** ARCHIVE

**Rationale:**
- Markdown files are human-readable archives
- Markdown files are not authoritative
- Markdown files are derived from constitutional objects
- Markdown files can be regenerated from constitutional objects

**Constitutional Role:**
- **Layer 4+ — Projections:** Human-readable projections of constitutional objects
- **Layer 4+ — Archive:** Long-term storage of derived projections

**Migration Path:**
- Keep markdown files as archive
- Remove authority status
- Regenerate markdown files from constitutional objects
- Use markdown files for human-readable access

**Status:** ARCHIVE (non-constitutional)

---

## STORAGE CLASSIFICATION SUMMARY

| Storage System | Location | Type | Current Role | Constitutional Classification | Constitutional Role | Status |
|----------------|----------|------|--------------|-------------------------------|---------------------|--------|
| PostgreSQL | PING Commit Service | Relational Database | Artifact persistence | AUTHORITY | Layer 0-2 (Objects, Events, State) | AUTHORITY |
| SQLite (CRX-Digestion) | knowledge.db | Embedded Database | Article persistence | PROJECTION CACHE | Layer 4+ (Projections, Replay Materialization) | PROJECTION CACHE |
| SQLite (CRX-Newsletter) | newsletters.db | Embedded Database | Newsletter persistence | PROJECTION CACHE | Layer 4+ (Projections, Replay Materialization) | PROJECTION CACHE |
| Markdown (CRX-Digestion) | knowledge/ | File System | Article archival | ARCHIVE | Layer 4+ (Projections, Archive) | ARCHIVE |
| Markdown (CRX-Newsletter) | knowledge/ | File System | Newsletter archival | ARCHIVE | Layer 4+ (Projections, Archive) | ARCHIVE |

---

## CONSTITUTIONAL STORAGE ARCHITECTURE

### Layer 0 — Constitutional Objects (AUTHORITY)

**Storage:** PostgreSQL
**Purpose:** Store constitutional objects
**Schema:** `objects (id UUID PRIMARY KEY, content_hash TEXT UNIQUE, content TEXT, created_at TIMESTAMP)`
**Authority:** Constitutional object authority

### Layer 1 — Constitutional Event Log (AUTHORITY)

**Storage:** PostgreSQL
**Purpose:** Store immutable events
**Schema:** `events (id BIGSERIAL PRIMARY KEY, stream TEXT NOT NULL, event_type TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
**Authority:** Constitutional event authority
**Guarantees:** Append-only, no updates, no deletes

### Layer 2 — Canonical State (AUTHORITY)

**Storage:** PostgreSQL
**Purpose:** Store derived state
**Schema:** `state (object_id UUID PRIMARY KEY, current_state JSON, updated_at TIMESTAMP)`
**Authority:** Constitutional state authority
**Derivation:** Derived from replay of events

### Layer 4+ — Projections (PROJECTION CACHE)

**Storage:** SQLite (knowledge.db, newsletters.db)
**Purpose:** Cache derived projections for fast access
**Schema:** Existing schemas (articles, newsletters, digests, topics)
**Authority:** Non-constitutional projection cache
**Derivation:** Derived from constitutional state

### Layer 4+ — Replay Materialization (PROJECTION CACHE)

**Storage:** SQLite (knowledge.db, newsletters.db)
**Purpose:** Materialize replay state for fast queries
**Schema:** Existing schemas (articles, newsletters, digests, topics)
**Authority:** Non-constitutional replay materialization
**Derivation:** Derived from replay of events

### Layer 4+ — Archive (ARCHIVE)

**Storage:** File System (knowledge/)
**Purpose:** Human-readable archive of derived projections
**Schema:** Markdown files
**Authority:** Non-constitutional archive
**Derivation:** Derived from constitutional objects

---

## STORAGE MIGRATION STRATEGY

### Phase 1: Add Constitutional Schemas to PostgreSQL

- Add `objects` table to PostgreSQL
- Add `events` table to PostgreSQL
- Add `state` table to PostgreSQL
- Add append-only guarantees (triggers, constraints)

### Phase 2: Migrate Existing Data to Constitutional Objects

- Migrate PING artifacts to constitutional objects
- Migrate CRX articles to constitutional objects
- Migrate CRX newsletters to constitutional objects

### Phase 3: Add Event Logging to All Mutations

- Add event logging to PING Commit Service
- Add event logging to CRX RSS Worker
- Add event logging to CRX Yahoo Worker
- Add event logging to PING Gateway

### Phase 4: Reclassify SQLite as Projection Cache

- Add comments indicating SQLite is projection cache
- Remove authority status from SQLite
- Keep SQLite for derived projections
- Keep SQLite for replay materialization

### Phase 5: Regenerate Projections from Constitutional State

- Regenerate SQLite projections from constitutional state
- Regenerate markdown archives from constitutional objects
- Verify projections match constitutional state

---

## CRITICAL DISTINCTION

**SQLite survives. SQLite loses authority status.**

This is an enormous distinction from deletion.

**SQLite becomes:**
- Projection cache
- Replay materialization layer
- Query accelerator
- Derived state cache

**NOT constitutional authority.**

**PostgreSQL becomes:**
- Constitutional object store
- Constitutional event log
- Canonical state

**Constitutional authority.**

---

## CONCLUSION

**PostgreSQL is constitutional authority (Layer 0-2).**

**SQLite is projection cache (Layer 4+).**

**Markdown files are archive (Layer 4+).**

**No storage systems are deleted.**

**All storage systems are reclassified by constitutional role.**

**PostgreSQL requires constitutional schemas and append-only guarantees.**

**SQLite requires removal of authority status.**

**Markdown files require removal of authority status.**

**This saves months compared to implementing new storage engine.**
