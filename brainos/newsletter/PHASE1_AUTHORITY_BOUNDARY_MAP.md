# PHASE1_AUTHORITY_BOUNDARY_MAP.md

**Audit Type:** AUTHORITY BOUNDARY DISCOVERY  
**Audit Date:** 2025-01-18  
**Audit Scope:** Identify every current authority, classify by type, map current owner, implementation, weaknesses, and migration risk  
**Evidence Only:** Running code and existing audit documents  

---

## EXECUTIVE SUMMARY

**Critical Finding:** Authority boundaries are unclear and fragmented. Constitutional authorities exist in PING but are not used by applications. Brain has duplicate constitutional authorities that should not exist. Retrieval Authority and Recommendation Authority are missing entirely.

**Authority Classification:**
- **Constitutional Authorities (PING):** Identity, Lineage, Event Recording, Replay, Witness, Canonical, Hash, State, Ledger, Artifact
- **Duplicate Authorities (Brain):** Event Recording, Object, Artifact, Lineage, Canonical, Replay, State, Ledger (should be removed)
- **Missing Authorities (Brain):** Retrieval, Recommendation, Knowledge, Memory
- **Application-Level Authorities:** Application state (SQLite databases), Application logic

**Current Ownership:**
- **PING owns:** All constitutional authorities (correct location)
- **Brain owns:** Duplicate constitutional authorities (should be removed), Documentation/specification
- **Applications own:** Application state (SQLite), Application logic

**Migration Risk:** HIGH - Applications use Brain's duplicate event_emitter.py instead of PING's constitutional event_emitter.js. Retrieval Authority must be built from scratch.

---

## AUTHORITY CLASSIFICATION

### Constitutional Authorities

**Definition:** Authorities that are constitutional primitives required for system correctness and integrity. These must exist in PING only.

**List:**
1. Identity Authority
2. Lineage Authority
3. Event Recording Authority
4. Replay Authority
5. Witness Authority
6. Canonical Authority
7. Hash Authority
8. State Authority
9. Ledger Authority
10. Artifact Authority

### Application-Level Authorities

**Definition:** Authorities that are application-specific and not constitutional. These can exist in applications.

**List:**
1. Knowledge Authority
2. Memory Authority
3. Retrieval Authority
4. Recommendation Authority
5. Application State Authority

### Duplicate Authorities

**Definition:** Authorities that duplicate constitutional authorities and should not exist.

**List:**
1. Brain's Event Recording Authority (duplicate of PING)
2. Brain's Object Authority (duplicate of PING's Artifact Authority)
3. Brain's Artifact Authority (duplicate of PING)
4. Brain's Lineage Authority (duplicate of PING)
5. Brain's Canonical Authority (duplicate of PING)
6. Brain's Replay Authority (duplicate of PING)
7. Brain's State Authority (duplicate of PING)
8. Brain's Ledger Authority (duplicate of PING)

---

## IDENTITY AUTHORITY

### Current Owner

**PING (Constitutional)** - Correct location

### Current Implementation

**Files:**
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts` - SHA256 hash computation
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts` - Canonicalization
- `C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts` - Hash authority for replay
- `C:\Users\nolan\PING\runtime\replay\replay_types.ts` - Branded types (EventId, ArtifactId, WitnessLeafId)

**Brain Duplicate:**
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql` - content_hash field in objects table (DUPLICATE)

### Current Weaknesses

1. **Brain has duplicate** - Brain's objects table with content_hash duplicates PING's Identity Authority
2. **Not used by applications** - Applications don't use PING's Identity Authority
3. **No identity integration** - Applications use application-level IDs (message_id, url) instead of constitutional identities

### Migration Risk

**LOW** - PING's Identity Authority is correct. Brain's duplicate should be removed. Applications should migrate to constitutional identities over time.

---

## EVENT AUTHORITY

### Current Owner

**PING (Constitutional)** - Correct location  
**Brain (Duplicate)** - Should be removed

### Current Implementation

**PING Implementation:**
- `C:\Users\nolan\PING\gateway\event_emitter.js` - Constitutional event logging to PostgreSQL
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts` - Event logging to execution_events
- `C:\Users\nolan\PING\database\events.sql` - Append-only events table with triggers
- `C:\Users\nolan\PING\runtime\replay\canonical_event_envelope.ts` - Constitutional event envelope

**Brain Duplicate:**
- `C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py` - Event emission to PostgreSQL (DUPLICATE)
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql` - Events table (DUPLICATE)

**Application Usage:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` - Imports from Brain's event_emitter.py (WRONG)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` - Imports from Brain's event_emitter.py (WRONG)

### Current Weaknesses

1. **Brain has duplicate** - Brain's event_emitter.py duplicates PING's event_emitter.js
2. **Applications use duplicate** - Applications import from Brain's duplicate instead of PING
3. **No constitutional event flow** - Applications emit events to Brain's duplicate, not PING's constitutional authority
4. **Event fragmentation** - Events are split between PING and Brain

### Migration Risk

**HIGH** - Applications currently use Brain's duplicate event_emitter.py. Must migrate to PING's event_emitter.js. This requires:
1. Removing Brain's event_emitter.py
2. Updating application imports to use PING's event_emitter.js
3. Updating application code to call PING's event functions
4. Testing event emission after migration

---

## STATE AUTHORITY

### Current Owner

**PING (Constitutional)** - Correct location  
**Brain (Duplicate)** - Should be removed

### Current Implementation

**PING Implementation:**
- `C:\Users\nolan\PING\runtime\replay\replay_types.ts` - State types (ReplayState, ArtifactState)
- `C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts` - State reconstruction from events

**Brain Duplicate:**
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql` - Projections table (DUPLICATE)
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql` - Projection registry (DUPLICATE)

**Application State:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db` - SQLite database (application state, not constitutional)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db` - SQLite database (application state, not constitutional)

### Current Weaknesses

1. **Brain has duplicate** - Brain's projections table duplicates PING's State Authority
2. **No replay mechanism** - Applications don't use PING's replay engine for state reconstruction
3. **State is authoritative, not events** - SQLite databases are authoritative, not event log
4. **No state projection** - No mechanism to project state from events

### Migration Risk

**MEDIUM** - Brain's duplicate should be removed. Applications should continue using SQLite as application state (not constitutional). Future migration to event-sourced state would require:
1. Implementing PING's replay engine in applications
2. Making events authoritative instead of SQLite
3. Projecting state from events

---

## LINEAGE AUTHORITY

### Current Owner

**PING (Constitutional)** - Correct location  
**Brain (Duplicate)** - Should be removed

### Current Implementation

**PING Implementation:**
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts` - PostgreSQL lineage edge storage
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\validation\dag_validator.ts` - DAG validation
- `C:\Users\nolan\PING\database\ledger_schema.sql` - lineage_edges table
- `C:\Users\nolan\PING\runtime\replay\replay_types.ts` - Lineage types (LineageEdge, LineageGraph)

**Brain Duplicate:**
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql` - Lineage table (DUPLICATE)
- `C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql` - Artifact lineage table (DUPLICATE)

**Application Usage:**
- **None** - Applications do not use lineage tracking

### Current Weaknesses

1. **Brain has duplicate** - Brain's lineage tables duplicate PING's Lineage Authority
2. **Not used by applications** - Applications don't use PING's Lineage Authority
3. **No lineage tracking** - Applications don't track lineage of documents or operations
4. **No lineage retrieval** - No mechanism to retrieve lineage information

### Migration Risk

**LOW** - Brain's duplicate should be removed. Applications should integrate PING's Lineage Authority when lineage tracking is needed.

---

## KNOWLEDGE AUTHORITY

### Current Owner

**MISSING** - No Knowledge Authority exists

### Current Implementation

**Brain Documentation:**
- `C:\Users\nolan\CascadeProjects\brain\README.md` - Describes 6-layer architecture with Layer 3 (Knowledge Graph Projection) using Neo4j (DESIGN ONLY)
- `C:\Users\nolan\CascadeProjects\brain\docs\runtime\ARTIFACT_GRAPH.md` - Design document for artifact graph (DESIGN ONLY)

**Application Implementation:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\` - Markdown files (application archive, not authority)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\` - Markdown files (application archive, not authority)

**Infrastructure:**
- `brain-neo4j` container - Neo4j knowledge graph database (UNUSED)

### Current Weaknesses

1. **No Knowledge Authority** - No first-class Knowledge Authority subsystem exists
2. **Design only** - Brain has design documents but no implementation
3. **Neo4j unused** - Neo4j container exists but is not used
4. **No knowledge graph** - No knowledge graph implementation
5. **No knowledge organization** - No systematic knowledge organization

### Migration Risk

**HIGH** - Knowledge Authority must be built from scratch as a first-class subsystem. Requires:
1. Designing Knowledge Authority interface
2. Implementing knowledge graph using Neo4j
3. Building knowledge organization system
4. Integrating with applications

---

## MEMORY AUTHORITY

### Current Owner

**MISSING** - No Memory Authority exists

### Current Implementation

**Brain Documentation:**
- `C:\Users\nolan\CascadeProjects\brain\data\raw\processed\normalized\vectors\graph\memory\` - Empty directory (NOT IMPLEMENTED)

**Application Implementation:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db` - SQLite database (application state, not memory authority)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db` - SQLite database (application state, not memory authority)

### Current Weaknesses

1. **No Memory Authority** - No first-class Memory Authority subsystem exists
2. **No implementation** - Brain has empty directory for memory
3. **No memory system** - No memory retrieval or storage system
4. **No memory organization** - No systematic memory organization

### Migration Risk

**HIGH** - Memory Authority must be built from scratch as a first-class subsystem. Requires:
1. Designing Memory Authority interface
2. Implementing memory storage and retrieval
3. Building memory organization system
4. Integrating with applications

---

## RETRIEVAL AUTHORITY

### Current Owner

**MISSING** - No Retrieval Authority exists

### Current Implementation

**Application Implementation:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` - Date-range queries (basic retrieval, not authority)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` - Search by title, summary, tags (basic retrieval, not authority)

**Infrastructure:**
- `brain-qdrant` container - Vector database (UNUSED)

**Retrieval Capabilities:**
- FTS: MISSING
- Semantic Search: MISSING
- Vector Search: MISSING
- Timeline Retrieval: PARTIAL (date-range only)
- Lineage Retrieval: MISSING
- PARA Retrieval: MISSING
- Recommendation Generation: WEAK (topic extraction only)

### Current Weaknesses

1. **No Retrieval Authority** - No first-class Retrieval Authority subsystem exists
2. **Limited retrieval** - Only basic date-range and simple search exist
3. **No semantic search** - No embeddings or semantic search
4. **No vector search** - Qdrant exists but unused
5. **No PARA organization** - No PARA system
6. **No recommendation engine** - Only weak topic extraction

### Migration Risk

**HIGH** - Retrieval Authority must be built from scratch as a first-class subsystem. Requires:
1. Designing Retrieval Authority interface
2. Implementing FTS, Semantic, Timeline, Lineage, PARA, Recommendation components
3. Integrating Qdrant for vector search
4. Integrating PING's Lineage Authority for lineage retrieval
5. Building PARA organization system
6. Building recommendation engine

---

## RECOMMENDATION AUTHORITY

### Current Owner

**MISSING** - No Recommendation Authority exists

### Current Implementation

**Application Implementation:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\summarizer.py` - Topic extraction via Ollama (weak recommendation)
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\daily_digest.py` - Topic aggregation (weak recommendation)

**Recommendation Capabilities:**
- Topic extraction: WEAK (Ollama generates 3-5 topics)
- Topic aggregation: WEAK (count topics across newsletters)
- Personalized recommendations: MISSING
- Content-based recommendations: MISSING
- Collaborative filtering: MISSING
- Trend detection: MISSING

### Current Weaknesses

1. **No Recommendation Authority** - No first-class Recommendation Authority subsystem exists
2. **Weak recommendations** - Only topic extraction and aggregation exist
3. **No personalization** - No user preference tracking
4. **No relevance scoring** - No recommendation scoring algorithm
5. **No feedback loop** - No mechanism to improve recommendations
6. **Direct Ollama coupling** - Topic extraction uses Ollama directly (should use Inference Gateway)

### Migration Risk

**HIGH** - Recommendation Authority must be built from scratch as a first-class subsystem. Requires:
1. Designing Recommendation Authority interface
2. Building recommendation engine
3. Implementing personalization
4. Implementing feedback loop
5. Migrating to Inference Gateway for provider flexibility

---

## STORAGE AUTHORITY

### Current Owner

**PING (Constitutional)** - Events table  
**Applications (Application State)** - SQLite databases

### Current Implementation

**PING Storage:**
- PostgreSQL events table (constitutional event log)
- PostgreSQL knowledge_metrics table (operational intelligence)
- PostgreSQL raw_payloads table (operational intelligence)
- PostgreSQL dead_letters table (operational intelligence)

**Brain Storage (Unused):**
- PostgreSQL canonical state (UNUSED)
- DuckDB (UNUSED)
- Neo4j (UNUSED)
- Qdrant (UNUSED)

**Application Storage:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db` - SQLite (application state)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db` - SQLite (application state)
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\` - Markdown files (application archive)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\` - Markdown files (application archive)

### Current Weaknesses

1. **Storage fragmentation** - Storage is split across PING, Brain, and applications
2. **Brain storage unused** - Brain's PostgreSQL, DuckDB, Neo4j, Qdrant are unused
3. **No storage abstraction** - No unified storage interface
4. **SQLite is authoritative** - SQLite databases are authoritative, not event log

### Migration Risk

**MEDIUM** - Brain's unused storage should be removed or activated. Applications should continue using SQLite as application state. Future migration to event-sourced storage would require:
1. Making events authoritative instead of SQLite
2. Projecting state from events
3. Using PING's PostgreSQL for constitutional events

---

## INFERENCE AUTHORITY

### Current Owner

**MISSING** - No Inference Authority exists

### Current Implementation

**Application Implementation:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\summarizer.py` - Direct Ollama coupling (no abstraction)
- `C:\Users\nolan\PING\gateway\server.js` - PING Gateway with Ollama (has abstraction)

**Current Flow:**
```
Brain (worker.py, process_newsletters.py)
  ↓
summarizer.py (direct Ollama coupling)
  ↓
ollama.Client(host=OLLAMA_BASE_URL)
  ↓
Ollama API (http://localhost:11434)
```

### Current Weaknesses

1. **No Inference Authority** - No first-class Inference Authority subsystem exists
2. **Direct Ollama coupling** - Brain couples directly to Ollama with no abstraction
3. **No provider flexibility** - Cannot switch providers without code changes
4. **No unified interface** - No unified inference interface

### Migration Risk

**HIGH** - Inference Authority must be built from scratch as a first-class subsystem. Requires:
1. Designing Inference Gateway interface
2. Implementing provider abstractions (Ollama, OpenAI, Gemini, Claude, OpenRouter, Mock)
3. Migrating Brain code to use Inference Gateway
4. Removing direct Ollama coupling

---

## AUTHORITY BOUNDARY MATRIX

| Authority | Current Owner | Constitutional Status | Current Implementation | Current Weaknesses | Migration Risk |
|-----------|---------------|----------------------|----------------------|-------------------|----------------|
| Identity Authority | PING | Constitutional | identity_engine.ts, canonical_engine.ts, canonical_hash_authority.ts | Brain has duplicate, not used by applications | LOW |
| Event Authority | PING, Brain (duplicate) | Constitutional | event_emitter.js (PING), event_emitter.py (Brain duplicate) | Brain has duplicate, applications use duplicate | HIGH |
| State Authority | PING, Brain (duplicate) | Constitutional | replay_types.ts (PING), projections table (Brain duplicate) | Brain has duplicate, no replay mechanism | MEDIUM |
| Lineage Authority | PING, Brain (duplicate) | Constitutional | lineage_store.ts, dag_validator.ts (PING), lineage table (Brain duplicate) | Brain has duplicate, not used by applications | LOW |
| Canonical Authority | PING, Brain (duplicate) | Constitutional | canonical_json.ts (PING), canonical_documents table (Brain duplicate) | Brain has duplicate | LOW |
| Hash Authority | PING, Brain (duplicate) | Constitutional | identity_engine.ts (PING), hash documentation (Brain duplicate) | Brain has duplicate (documentation only) | LOW |
| Replay Authority | PING, Brain (duplicate) | Constitutional | deterministic_replay_engine.ts (PING), replay_runs table (Brain duplicate) | Brain has duplicate, not used by applications | LOW |
| Ledger Authority | PING, Brain (duplicate) | Constitutional | ledger_schema.sql (PING), events table (Brain duplicate) | Brain has duplicate | LOW |
| Artifact Authority | PING, Brain (duplicate) | Constitutional | artifact.ts, artifact_store.ts (PING), objects table (Brain duplicate) | Brain has duplicate | LOW |
| Witness Authority | PING | Constitutional | witness_authority.ts, merkle_tree.ts | None | LOW |
| Knowledge Authority | MISSING | Missing | None (design only) | No implementation, Neo4j unused | HIGH |
| Memory Authority | MISSING | Missing | None (empty directory) | No implementation | HIGH |
| Retrieval Authority | MISSING | Missing | None (basic SQL queries only) | No implementation, Qdrant unused | HIGH |
| Recommendation Authority | MISSING | Missing | None (topic extraction only) | No implementation, weak recommendations | HIGH |
| Inference Authority | MISSING | Missing | None (direct Ollama coupling) | No abstraction, direct Ollama coupling | HIGH |
| Storage Authority | PING, Applications | Mixed | PostgreSQL (PING), SQLite (Applications) | Fragmented, Brain storage unused | MEDIUM |

---

## AUTHORITY OWNERSHIP MAP

### PING Ownership (Constitutional Root)

**Constitutional Authorities (Correct Location):**
- Identity Authority ✓
- Event Authority ✓
- State Authority ✓
- Lineage Authority ✓
- Canonical Authority ✓
- Hash Authority ✓
- Replay Authority ✓
- Ledger Authority ✓
- Artifact Authority ✓
- Witness Authority ✓

**PING Services:**
- Gateway (orchestration and event recording)
- Commit Service (mutation authority)
- Operational Intelligence (telemetry, metrics, heartbeats)

**PING Containers:**
- crx-gateway (PING KERNEL)
- crx-ollama-worker (PING SERVICE)

### Brain Ownership (Subsystem Built on PING)

**Brain-Specific Functionality:**
- Documentation/Specification (README.md, docs/)
- Infrastructure Configuration (docker-compose.yml, config/)

**Brain Constitutional Duplicates (Must be removed):**
- event_emitter.py (DUPLICATE of PING's event_emitter.js)
- canonical_state/schema.sql (DUPLICATE of PING's events.sql)
- canonical_state/schema_expanded.sql (DUPLICATE of PING's constitutional schemas)
- objects, events, lineage, projections tables (DUPLICATES)

**Brain Services (Unused or Application-Level):**
- brain-postgres (UNUSED - should use PING's PostgreSQL)
- brain-qdrant (UNUSED - should be activated for Retrieval Authority)
- brain-neo4j (UNUSED - should be activated for Knowledge Authority)
- brain-temporal (UNUSED - application-level)
- brain-kafka (UNUSED - application-level)
- brain-zookeeper (UNUSED - application-level)
- brain-duckdb (UNUSED - application-level)
- brain-opensearch (UNUSED - application-level)
- brain-tika (UNUSED - application-level)
- brain-ollama (OBSOLETE - duplicate of crx-ollama-worker)

### Application Ownership (Built on Top of PING)

**crx-newsletter-brain:**
- Application State (newsletters.db SQLite)
- Application Logic (worker.py, yahoo_client.py, summarizer.py, daily_digest.py, dashboard.py)
- Application Archives (knowledge/, digests/ markdown files)
- Constitutional Dependencies (WRONG - currently imports from Brain's event_emitter.py)

**crx-digestion-worker:**
- Application State (knowledge.db SQLite)
- Application Logic (worker.py, tools.py, summarizer.py, archive.py)
- Application Archives (knowledge/ markdown files)
- Constitutional Dependencies (WRONG - currently imports from Brain's event_emitter.py)

---

## MIGRATION PRIORITIES

### Priority 1: Remove Brain Constitutional Duplicates

**Actions:**
1. Remove Brain's event_emitter.py
2. Remove Brain's canonical_state/schema.sql
3. Remove Brain's canonical_state/schema_expanded.sql
4. Remove Brain's objects, events, lineage, projections tables

**Risk:** HIGH - Applications currently use Brain's event_emitter.py

**Timeline:** Phase 1

### Priority 2: Migrate Applications to PING

**Actions:**
1. Update crx-digestion-worker to import from PING's event_emitter.js
2. Update crx-newsletter-brain to import from PING's event_emitter.js
3. Update applications to use PING's PostgreSQL for constitutional events
4. Test event emission after migration

**Risk:** HIGH - Requires changing application code

**Timeline:** Phase 1

### Priority 3: Build Inference Authority

**Actions:**
1. Design Inference Gateway interface
2. Implement provider abstractions (Ollama, OpenAI, Gemini, Claude, OpenRouter, Mock)
3. Migrate Brain code to use Inference Gateway
4. Remove direct Ollama coupling

**Risk:** HIGH - Requires building new subsystem

**Timeline:** Phase 1

### Priority 4: Build Retrieval Authority

**Actions:**
1. Design Retrieval Authority interface
2. Implement FTS, Semantic, Timeline, Lineage, PARA, Recommendation components
3. Integrate Qdrant for vector search
4. Integrate PING's Lineage Authority
5. Build PARA organization system
6. Build recommendation engine

**Risk:** HIGH - Requires building new subsystem from scratch

**Timeline:** Phase 2

### Priority 5: Build Knowledge Authority

**Actions:**
1. Design Knowledge Authority interface
2. Implement knowledge graph using Neo4j
3. Build knowledge organization system
4. Integrate with applications

**Risk:** HIGH - Requires building new subsystem from scratch

**Timeline:** Phase 3

### Priority 6: Build Memory Authority

**Actions:**
1. Design Memory Authority interface
2. Implement memory storage and retrieval
3. Build memory organization system
4. Integrate with applications

**Risk:** HIGH - Requires building new subsystem from scratch

**Timeline:** Phase 3

---

## SUMMARY

### Constitutional Authorities (PING - Correct Location)

| Authority | Status | Weaknesses | Migration Risk |
|-----------|--------|------------|----------------|
| Identity Authority | ✓ Correct | Brain has duplicate, not used by applications | LOW |
| Event Authority | ✓ Correct | Brain has duplicate, applications use duplicate | HIGH |
| State Authority | ✓ Correct | Brain has duplicate, no replay mechanism | MEDIUM |
| Lineage Authority | ✓ Correct | Brain has duplicate, not used by applications | LOW |
| Canonical Authority | ✓ Correct | Brain has duplicate | LOW |
| Hash Authority | ✓ Correct | Brain has duplicate (documentation only) | LOW |
| Replay Authority | ✓ Correct | Brain has duplicate, not used by applications | LOW |
| Ledger Authority | ✓ Correct | Brain has duplicate | LOW |
| Artifact Authority | ✓ Correct | Brain has duplicate | LOW |
| Witness Authority | ✓ Correct | None | LOW |

### Duplicate Authorities (Brain - Should Be Removed)

| Authority | Status | Action Required |
|-----------|--------|----------------|
| Event Authority | DUPLICATE | Remove Brain's event_emitter.py |
| Object Authority | DUPLICATE | Remove Brain's objects table |
| Artifact Authority | DUPLICATE | Remove Brain's artifact tables |
| Lineage Authority | DUPLICATE | Remove Brain's lineage table |
| Canonical Authority | DUPLICATE | Remove Brain's canonical_documents table |
| Replay Authority | DUPLICATE | Remove Brain's replay_runs table |
| State Authority | DUPLICATE | Remove Brain's projections table |
| Ledger Authority | DUPLICATE | Remove Brain's events table |

### Missing Authorities (Must Be Built)

| Authority | Status | Weaknesses | Migration Risk |
|-----------|--------|------------|----------------|
| Knowledge Authority | MISSING | No implementation, Neo4j unused | HIGH |
| Memory Authority | MISSING | No implementation | HIGH |
| Retrieval Authority | MISSING | No implementation, Qdrant unused | HIGH |
| Recommendation Authority | MISSING | No implementation, weak recommendations | HIGH |
| Inference Authority | MISSING | No abstraction, direct Ollama coupling | HIGH |

### Application-Level Authorities (Not Constitutional)

| Authority | Owner | Status | Notes |
|-----------|-------|--------|-------|
| Application State | Applications | ✓ Correct | SQLite databases are application state |
| Application Logic | Applications | ✓ Correct | Workers, summarizers, archives |
| Application Archives | Applications | ✓ Correct | Markdown files |

---

## ANSWER

**What authorities exist?**
- **Constitutional Authorities (PING):** Identity, Event, State, Lineage, Canonical, Hash, Replay, Ledger, Artifact, Witness
- **Duplicate Authorities (Brain):** Event, Object, Artifact, Lineage, Canonical, Replay, State, Ledger
- **Missing Authorities:** Knowledge, Memory, Retrieval, Recommendation, Inference
- **Application-Level Authorities:** Application State (SQLite), Application Logic, Application Archives

**Where are they located?**
- **PING (C:\Users\nolan\PING):** All constitutional authorities (correct location)
- **Brain (C:\Users\nolan\CascadeProjects\brain):** Duplicate constitutional authorities (should be removed)
- **Applications (crx-newsletter-brain, crx-digestion-worker):** Application-level authorities

**What are the current weaknesses?**
- **Brain has duplicate constitutional authorities** - Should be removed
- **Applications use Brain's duplicate event_emitter.py** - Should use PING's event_emitter.js
- **No Inference Authority** - Direct Ollama coupling with no abstraction
- **No Retrieval Authority** - Only basic SQL queries, no semantic search, no PARA
- **No Knowledge Authority** - Neo4j exists but unused
- **No Memory Authority** - No implementation
- **No Recommendation Authority** - Only weak topic extraction
- **Storage fragmentation** - Storage split across PING, Brain, applications

**What is the migration risk?**
- **HIGH:** Event Authority (applications use Brain's duplicate), Inference Authority (direct Ollama coupling), Retrieval Authority (must build from scratch), Knowledge Authority (must build from scratch), Memory Authority (must build from scratch), Recommendation Authority (must build from scratch)
- **MEDIUM:** State Authority (no replay mechanism), Storage Authority (fragmented)
- **LOW:** Identity Authority, Lineage Authority, Canonical Authority, Hash Authority, Replay Authority, Ledger Authority, Artifact Authority, Witness Authority
