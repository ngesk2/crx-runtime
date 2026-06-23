# ACTUAL RUNTIME

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Determine the actual constitutional runtime that exists today.

---

## EXECUTIVE SUMMARY

**Actual runtime is minimal.** Only 5 components execute in practice: crx-newsletter-brain worker, crx-newsletter-brain dashboard, crx-digestion-worker worker, Brain PostgreSQL, and Brain Ollama. All other components are dormant or abandoned. PING primitives are not in the actual runtime. Brain infrastructure services (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI) are not in the actual runtime.

---

## STARTUP PATHS

### crx-newsletter-brain worker
**Path:** docker-compose.yml → worker service → worker.py → main()
**Status:** ACTIVE
**Executes:** YES

### crx-newsletter-brain dashboard
**Path:** docker-compose.yml → dashboard service → dashboard.py
**Status:** ACTIVE
**Executes:** YES

### crx-digestion-worker worker
**Path:** docker-compose.yml → worker service → worker.py → main()
**Status:** ACTIVE
**Executes:** YES

### crx-digestion-worker open-webui
**Path:** docker-compose.yml → open-webui service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain PostgreSQL
**Path:** docker-compose.yml → postgres service
**Status:** ACTIVE
**Executes:** YES

### Brain Ollama
**Path:** docker-compose.yml → ollama service
**Status:** ACTIVE
**Executes:** YES

### Brain Qdrant
**Path:** docker-compose.yml → qdrant service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain Neo4j
**Path:** docker-compose.yml → neo4j service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain Temporal
**Path:** docker-compose.yml → temporal service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain Kafka
**Path:** docker-compose.yml → kafka service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain Zookeeper
**Path:** docker-compose.yml → zookeeper service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain DuckDB
**Path:** docker-compose.yml → duckdb service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain OpenSearch
**Path:** docker-compose.yml → opensearch service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain Tika
**Path:** docker-compose.yml → tika service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### Brain OpenWebUI
**Path:** docker-compose.yml → openwebui service
**Status:** DORMANT
**Executes:** YES (but not used by applications)

### PING commit-service
**Path:** NONE (no docker-compose.yml)
**Status:** ABANDONED
**Executes:** NO

### PING gateway
**Path:** NONE (no docker-compose.yml)
**Status:** ABANDONED
**Executes:** NO

---

## EXECUTED SERVICES

### ACTIVE
- crx-newsletter-brain worker
- crx-newsletter-brain dashboard
- crx-digestion-worker worker
- Brain PostgreSQL
- Brain Ollama

### DORMANT
- crx-digestion-worker open-webui
- Brain Qdrant
- Brain Neo4j
- Brain Temporal
- Brain Kafka
- Brain Zookeeper
- Brain DuckDB
- Brain OpenSearch
- Brain Tika
- Brain OpenWebUI

### ABANDONED
- PING commit-service
- PING gateway

---

## EXECUTED WORKERS

### ACTIVE
- crx-newsletter-brain/worker.py (executes ingestion cycle, processing cycle, digest generation)
- crx-digestion-worker/worker.py (executes RSS ingestion cycle)

### DORMANT
- NONE

### ABANDONED
- NONE

---

## ACTIVE DATABASES

### ACTIVE
- SQLite (newsletters.db) - SYSTEM OF RECORD
- SQLite (knowledge.db) - SYSTEM OF RECORD
- PostgreSQL (events table) - DERIVED

### DORMANT
- NONE

### ABANDONED
- PostgreSQL (artifacts table) - UNUSED
- PostgreSQL (lineage_edges table) - UNUSED
- PostgreSQL (execution_events table) - UNUSED

---

## ACTIVE QUEUES

### ACTIVE
- NONE

### DORMANT
- NONE

### ABANDONED
- Kafka (UNUSED)

---

## ACTIVE EVENT EMITTERS

### ACTIVE
- Brain/src/constitutional/event_emitter.py (emits events to PostgreSQL events table)

### DORMANT
- PING/gateway/event_emitter.js (not executed)

### ABANDONED
- PING/runtime/adapters/postgres_event_store.ts (stub)

---

## ACTIVE PERSISTENCE PATHS

### ACTIVE
- SQLite (newsletters.db) - SYSTEM OF RECORD
- SQLite (knowledge.db) - SYSTEM OF RECORD
- PostgreSQL (events table) - DERIVED
- Markdown files (knowledge/YYYY/MM/*.md) - ARCHIVE
- Markdown files (digests/daily-{date}.md) - ARCHIVE
- Markdown files (digests/weekly-{date}.md) - ARCHIVE

### DORMANT
- NONE

### ABANDONED
- PostgreSQL (artifacts table) - UNUSED
- PostgreSQL (lineage_edges table) - UNUSED
- PostgreSQL (execution_events table) - UNUSED

---

## CLASSIFICATION

### ACTIVE
- crx-newsletter-brain worker
- crx-newsletter-brain dashboard
- crx-digestion-worker worker
- Brain PostgreSQL
- Brain Ollama
- Brain/event_emitter.py
- SQLite (newsletters.db)
- SQLite (knowledge.db)
- PostgreSQL (events table)
- Markdown files

### DORMANT
- crx-digestion-worker open-webui
- Brain Qdrant
- Brain Neo4j
- Brain Temporal
- Brain Kafka
- Brain Zookeeper
- Brain DuckDB
- Brain OpenSearch
- Brain Tika
- Brain OpenWebUI

### ABANDONED
- PING commit-service
- PING gateway
- PING replay engine
- PING witness system
- PING canonical state
- PING identity engine
- PING hash authority
- PING lineage tracking

---

## FINAL QUESTION

**What is the actual constitutional kernel of the system today?**

### 1. Actual Kernel

**Components:**
- Brain/src/constitutional/event_emitter.py (event emission)
- SQLite (newsletters.db) (authoritative storage for newsletters, digests, topics)
- SQLite (knowledge.db) (authoritative storage for articles, sources)
- PostgreSQL (events table) (event log)
- Ollama (AI model server for summarization)
- crx-newsletter-brain/worker.py (newsletter ingestion and processing)
- crx-digestion-worker/worker.py (RSS ingestion and processing)
- crx-newsletter-brain/dashboard.py (dashboard UI)

**Classification:**
- Events: ACTIVE (Brain/event_emitter.py)
- Storage: ACTIVE (SQLite, PostgreSQL events table)
- Summarization: ACTIVE (Ollama)
- Digest Generation: ACTIVE (digest_generator.py)
- Archival: ACTIVE (archive.py)

**Status:**
- Minimal functional kernel
- No replay capability
- No witness computation
- No canonical state
- No identity computation
- No lineage tracking
- No retrieval capability
- No recommendation capability

---

### 2. Dormant Kernel

**Components:**
- PING replay engine (deterministic_replay_engine.ts, replay_state_machine.ts, replay_event_stream.ts, replay_verification.ts)
- PING witness system (witness_authority.ts, merkle_tree.ts, canonical_certificate.ts)
- PING canonical state (canonical_json.ts, canonical_event_envelope.ts, state_serializer.ts)
- PING identity engine (identity_engine.ts, replay_types.ts)
- PING hash authority (canonical_hash_authority.ts)
- PING lineage tracking (graph_validator.ts, dag_validator.ts, lineage_store.ts)
- Brain Qdrant (vector database)
- Brain Neo4j (graph database)
- Brain Temporal (workflow engine)
- Brain Kafka (event streaming)
- Brain Zookeeper (Kafka dependency)
- Brain DuckDB (analytics database)
- Brain OpenSearch (search engine)
- Brain Tika (document parser)
- Brain OpenWebUI (AI UI)

**Classification:**
- Replay: DORMANT
- Witness: DORMANT
- Canonical: DORMANT
- Identity: DORMANT
- Hash: DORMANT
- Lineage: DORMANT
- Vector Storage: DORMANT
- Graph Storage: DORMANT
- Workflow: DORMANT
- Event Streaming: DORMANT
- Analytics: DORMANT
- Search: DORMANT
- Document Parsing: DORMANT
- AI UI: DORMANT

**Status:**
- Implementation exists but is not used
- No runtime consumers
- No application dependencies
- Deleting has NO EFFECT on current behavior

---

### 3. Fictional/Documented Kernel

**Components:**
- PING Layer 0 (constitutional kernel with replay engine, event system, witness system, object authority, canonical state, ledger, hash, lineage)
- PING commit-service (artifact storage, lineage tracking, event logging)
- PING gateway (inference routing, event emission)
- Brain infrastructure (Qdrant, Neo4j, Temporal, Kafka, Zookeeper, DuckDB, OpenSearch, Tika, OpenWebUI)
- Constitutional primitives (Objects, Events, Replay, Witnesses, Identity, Canonical State, Ledger, Hash, Lineage)

**Classification:**
- Documented as constitutional kernel
- Reality: 90% dormant or abandoned
- Reality: Applications do not use PING primitives
- Reality: Applications do not use Brain infrastructure services

**Status:**
- Documentation is STALE or FICTION
- Documentation claims PING is the constitutional kernel
- Reality: PING is dormant code with no runtime consumers
- Documentation claims Brain infrastructure is used
- Reality: Brain infrastructure is dormant with no runtime consumers

---

### 4. Migration Path from Actual → Constitutional

**Step 1: Enable Event Replay**
- Implement event replay from PostgreSQL events table
- Reconstruct state from events
- Enable state reconstruction for newsletters, articles, digests
- Effort: 40 hours

**Step 2: Enable Canonical State**
- Integrate PING canonical_json.ts into applications
- Canonicalize all state mutations
- Emit canonical events
- Effort: 20 hours

**Step 3: Enable Identity Computation**
- Integrate PING identity_engine.ts into applications
- Compute canonical hashes for all artifacts
- Use artifact IDs for deduplication
- Effort: 10 hours

**Step 4: Enable Lineage Tracking**
- Integrate PING lineage tracking into applications
- Track lineage edges for all artifacts
- Enable DAG validation
- Effort: 30 hours

**Step 5: Enable Witness Computation**
- Integrate PING witness authority into applications
- Compute witness roots for all event streams
- Enable Merkle tree proofs
- Effort: 20 hours

**Step 6: Enable Retrieval**
- Enable FTS5 in SQLite
- Implement entity search
- Implement relationship search
- Implement timeline search
- Implement PARA search
- Implement graph traversal
- Effort: 60 hours

**Step 7: Enable Recommendations**
- Implement recommendation engine
- Implement priority ranking
- Implement task tracking
- Implement decision tracking
- Implement pattern detection
- Effort: 80 hours

**Step 8: Enable Brain Infrastructure Services**
- Integrate Qdrant for vector storage
- Integrate Neo4j for graph storage
- Integrate OpenSearch for search indexing
- Integrate Temporal for workflow orchestration
- Integrate Kafka for event streaming
- Effort: 100 hours

**Total Estimated Effort:** 360 hours (9 weeks)

**Migration Strategy:**
- Incremental migration
- Start with event replay (highest priority)
- Add canonical state and identity computation (medium priority)
- Add lineage tracking and witness computation (medium priority)
- Add retrieval and recommendations (low priority)
- Add Brain infrastructure services (lowest priority)
