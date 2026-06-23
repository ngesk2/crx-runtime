# PHASE 6: CONSTITUTIONAL OWNERSHIP

**Audit Scope:** Determine final ownership (PING vs Brain vs Applications)  
**Constitutional Root:** PING (C:\Users\nolan\PING) is Layer 0  

---

## CONSTITUTIONAL OWNERSHIP PRINCIPLES

1. **PING is Layer 0 (Constitutional Root)** - All constitutional primitives belong in PING
2. **Brain is a Subsystem** - Brain is built on PING, not infrastructure
3. **Foundations Downward** - Constitutional primitives should reside in PING
4. **Applications are Layer 5+** - Applications are built on top of PING
5. **No Duplicates** - Constitutional primitives should exist in one place only (PING)

---

## PING OWNERSHIP (Constitutional Root)

### Constitutional Primitives (PING owns these)

1. **Identity Authority**
   - identity_engine.ts (SHA256 hash computation)
   - canonical_engine.ts (canonicalization)
   - canonical_hash_authority.ts (hash authority)
   - replay_types.ts (branded types: EventId, ArtifactId, WitnessLeafId)

2. **Lineage Authority**
   - lineage_store.ts (PostgreSQL lineage edge storage)
   - dag_validator.ts (DAG validation, cycle detection)
   - ledger_schema.sql (lineage_edges table)
   - replay_types.ts (LineageEdge, LineageGraph interfaces)

3. **Event Recording Authority**
   - event_emitter.js (constitutional event logging)
   - event_log.ts (event logging to execution_events)
   - events.sql (append-only events table with triggers)
   - canonical_event_envelope.ts (event envelope structure)

4. **Replay Authority**
   - deterministic_replay_engine.ts (deterministic reconstruction)
   - replay_state_machine.ts (state machine for replay)
   - replay_verification.ts (replay integrity verification)
   - invariant_runner.ts (invariant checking)
   - replay_invariants.ts (invariant definitions)
   - replay_event_stream.ts (event stream for replay)

5. **Witness Authority**
   - witness_authority.ts (witness computation and verification)
   - merkle_tree.ts (Merkle tree for witness proofs)

6. **Canonical Authority**
   - canonical_json.ts (deterministic JSON canonicalization)
   - canonical_event_envelope.ts (canonical event envelope)

7. **Hash Authority**
   - identity_engine.ts (SHA256 hash computation)
   - canonical_hash_authority.ts (hash authority)
   - event_emitter.js (hash computation for request/response)

8. **State Authority**
   - replay_types.ts (ReplayState, ArtifactState interfaces)
   - deterministic_replay_engine.ts (state reconstruction from events)

9. **Ledger Authority**
   - ledger_schema.sql (artifacts, lineage_edges, execution_events tables)
   - events.sql (append-only events table)

10. **Artifact Authority**
    - artifact.ts (Artifact interface)
    - artifact_store.ts (PostgreSQL artifact storage)

11. **Gateway (Orchestration)**
    - server.js (Express API gateway with model routing)
    - Model routing logic (complexity-based model selection)
    - Context services endpoint (operational intelligence)

12. **Commit Service (Mutation Authority)**
    - server.ts (Express server for commit/audit endpoints)
    - commit_controller.ts (artifact commit API)
    - audit_controller.ts (artifact audit API)

13. **Operational Intelligence**
    - operational_intelligence.sql (dashboard queries, worker monitoring, model performance, failure tracking, daily digest, dead letter queue)

### PING Services (PING owns these)

1. **crx-gateway container** - PING KERNEL (orchestration and event recording)
2. **crx-ollama-worker container** - PING SERVICE (Ollama inference service used by PING gateway)
3. **crx-ui-next container** - PING APPLICATION (Next.js UI frontend for CRX system)

---

## BRAIN OWNERSHIP (Subsystem Built on PING)

### Brain-Specific Functionality (Brain owns these)

1. **Documentation/Specification**
   - README.md (6-layer architecture specification)
   - docs/architecture/ (architecture documentation)
   - docs/runtime/ (runtime design documents)
   - docs/constitutional/ (constitutional documentation)
   - docs/protocol/ (protocol documentation)
   - docs/audit/ (audit documentation)

2. **Infrastructure Configuration**
   - infrastructure/docker/compose/docker-compose.yml (Docker infrastructure for Brain services)
   - infrastructure/docker/scripts/ (bootstrap and utility scripts)
   - config/ (configuration templates)

### Brain Services (Brain owns these)

1. **brain-postgres container** - BRAIN SERVICE (PostgreSQL for Brain - should use PING's PostgreSQL)
2. **brain-qdrant container** - BRAIN SERVICE (Vector database for Brain - application-level, not constitutional)
3. **brain-neo4j container** - BRAIN SERVICE (Knowledge graph for Brain - application-level, not constitutional)
4. **brain-temporal container** - BRAIN SERVICE (Workflow engine for Brain - application-level, not constitutional)
5. **brain-kafka container** - BRAIN SERVICE (Event streaming for Brain - application-level, not constitutional)
6. **brain-zookeeper container** - BRAIN SERVICE (Kafka dependency - application-level, not constitutional)
7. **brain-duckdb container** - BRAIN SERVICE (Analytics for Brain - application-level, not constitutional)
8. **brain-opensearch container** - BRAIN SERVICE (Search engine for Brain - application-level, not constitutional)
9. **brain-tika container** - BRAIN SERVICE (Document parsing for Brain - application-level, not constitutional)
10. **brain-ollama container** - BRAIN SERVICE (Ollama for Brain - DUPLICATE of crx-ollama-worker)
11. **brain-openwebui container** - BRAIN SERVICE (Open WebUI for Brain - DUPLICATE of open-webui)

### Brain Constitutional Duplicates (Brain should NOT own these - must be removed)

1. **event_emitter.py** - DUPLICATE of PING's event_emitter.js
2. **canonical_state/schema.sql** - DUPLICATE of PING's events.sql and ledger_schema.sql
3. **canonical_state/schema_expanded.sql** - DUPLICATE of PING's constitutional schemas
4. **objects table** - DUPLICATE of PING's artifacts table
5. **events table** - DUPLICATE of PING's events table
6. **lineage table** - DUPLICATE of PING's lineage_edges table
7. **projections table** - DUPLICATE (state is derived from replay, not stored)
8. **entities table** - Application-level (should be in applications, not Brain)
9. **relationships table** - Application-level (should be in applications, not Brain)
10. **documents table** - Application-level (should be in applications, not Brain)
11. **canonical_documents table** - Application-level (should be in applications, not Brain)
12. **artifact_registry table** - Application-level (should be in applications, not Brain)
13. **projection_registry table** - Application-level (should be in applications, not Brain)

---

## APPLICATION OWNERSHIP (Built on Top of PING)

### crx-digestion-worker (Application)

1. **Application State**
   - knowledge.db (SQLite database - projection cache, not constitutional)
   - articles table (article storage - application-level)
   - sources table (source registry - application-level)

2. **Application Logic**
   - worker.py (RSS ingestion worker)
   - tools.py (RSS feed fetching)
   - summarizer.py (article summarization using Ollama)
   - archive.py (article archival as markdown)

3. **Application Archives**
   - knowledge/ directory (markdown files - application archive, not constitutional)

4. **Application Configuration**
   - docker-compose.yml (container configuration)
   - sources.yaml (RSS source configuration)

5. **Constitutional Dependencies**
   - Currently imports from Brain's event_emitter.py (WRONG - should import from PING)
   - Should import from PING's event_emitter.js (CORRECT)

### crx-newsletter-brain (Application)

1. **Application State**
   - newsletters.db (SQLite database - projection cache, not constitutional)
   - newsletters table (newsletter storage - application-level)
   - digests table (digest storage - application-level)
   - newsletter_topics table (topic classification - application-level)

2. **Application Logic**
   - worker.py (Yahoo Mail ingestion worker)
   - yahoo_client.py (Yahoo Mail API client)
   - summarizer.py (newsletter summarization using Ollama)
   - daily_digest.py (daily digest generation)
   - dashboard.py (dashboard for newsletter worker)

3. **Application Archives**
   - knowledge/ directory (markdown files - application archive, not constitutional)
   - digests/ directory (digest files - application archive, not constitutional)

4. **Application Configuration**
   - docker-compose.yml (container configuration)
   - .env (environment variables)

5. **Constitutional Dependencies**
   - Currently imports from Brain's event_emitter.py (WRONG - should import from PING)
   - Should import from PING's event_emitter.js (CORRECT)

---

## OBSOLETE (Should Be Removed)

### Duplicate Containers

1. **open-webui container** - OBSOLETE (duplicates crx-ui-next functionality)
2. **brain-openwebui container** - OBSOLETE (duplicate of open-webui, which is itself obsolete)

### Duplicate Ollama Instances

1. **brain-ollama container** - OBSOLETE (duplicate of crx-ollama-worker)

### Duplicate Constitutional Implementations

1. **Brain's event_emitter.py** - OBSOLETE (duplicate of PING's event_emitter.js)
2. **Brain's canonical_state/schema.sql** - OBSOLETE (duplicate of PING's events.sql and ledger_schema.sql)
3. **Brain's canonical_state/schema_expanded.sql** - OBSOLETE (duplicate of PING's constitutional schemas)

### Application-Level Primitives in Brain

1. **Brain's entities table** - OBSOLETE (application-level, should be in applications)
2. **Brain's relationships table** - OBSOLETE (application-level, should be in applications)
3. **Brain's documents table** - OBSOLETE (application-level, should be in applications)
4. **Brain's canonical_documents table** - OBSOLETE (application-level, should be in applications)
5. **Brain's artifact_registry table** - OBSOLETE (application-level, should be in applications)
6. **Brain's projection_registry table** - OBSOLETE (application-level, should be in applications)

---

## CONSTITUTIONAL OWNERSHIP MATRIX

| Component | Current Location | Constitutional Status | Final Ownership | Action Required |
|------------|------------------|----------------------|----------------|----------------|
| Identity Authority | PING | Constitutional | PING | Keep in PING |
| Lineage Authority | PING | Constitutional | PING | Keep in PING |
| Event Recording Authority | PING, Brain (duplicate) | Constitutional | PING | Remove Brain duplicate |
| Replay Authority | PING | Constitutional | PING | Keep in PING |
| Witness Authority | PING | Constitutional | PING | Keep in PING |
| Canonical Authority | PING | Constitutional | PING | Keep in PING |
| Hash Authority | PING, Brain (duplicate) | Constitutional | PING | Remove Brain duplicate |
| State Authority | PING, Brain (duplicate) | Constitutional | PING | Remove Brain duplicate |
| Ledger Authority | PING, Brain (duplicate) | Constitutional | PING | Remove Brain duplicate |
| Artifact Authority | PING, Brain (duplicate) | Constitutional | PING | Remove Brain duplicate |
| Gateway | PING | Constitutional | PING | Keep in PING |
| Commit Service | PING | Constitutional | PING | Keep in PING |
| Operational Intelligence | PING | Non-constitutional | PING | Keep in PING (operational) |
| crx-gateway container | PING | PING KERNEL | PING | Keep |
| crx-ollama-worker container | PING | PING SERVICE | PING | Keep |
| crx-ui-next container | PING | APPLICATION | PING | Keep |
| brain-postgres container | Brain | BRAIN SERVICE | Brain | Keep (but should use PING's PostgreSQL) |
| brain-qdrant container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-neo4j container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-temporal container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-kafka container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-zookeeper container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-duckdb container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-opensearch container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-tika container | Brain | BRAIN SERVICE | Brain | Keep (application-level) |
| brain-ollama container | Brain | BRAIN SERVICE | OBSOLETE | Remove (duplicate) |
| brain-openwebui container | Brain | BRAIN SERVICE | OBSOLETE | Remove (duplicate) |
| open-webui container | crx-digestion-worker | APPLICATION | OBSOLETE | Remove (duplicate) |
| Brain documentation | Brain | Documentation | Brain | Keep (specification) |
| Brain infrastructure config | Brain | Infrastructure | Brain | Keep (specification) |
| crx-digestion-worker state | crx-digestion-worker | Application State | Application | Keep (projection cache) |
| crx-newsletter-brain state | crx-newsletter-brain | Application State | Application | Keep (projection cache) |
| crx-digestion-worker logic | crx-digestion-worker | Application Logic | Application | Keep |
| crx-newsletter-brain logic | crx-newsletter-brain | Application Logic | Application | Keep |
| crx-digestion-worker archives | crx-digestion-worker | Application Archives | Application | Keep |
| crx-newsletter-brain archives | crx-newsletter-brain | Application Archives | Application | Keep |

---

## MIGRATION ACTIONS

### Phase 1: Remove Brain Constitutional Duplicates

1. Remove Brain's event_emitter.py
2. Remove Brain's canonical_state/schema.sql
3. Remove Brain's canonical_state/schema_expanded.sql
4. Remove Brain's objects, events, lineage, projections tables

### Phase 2: Migrate Applications to PING

1. Update crx-digestion-worker to import from PING's event_emitter.js instead of Brain's event_emitter.py
2. Update crx-newsletter-brain to import from PING's event_emitter.js instead of Brain's event_emitter.py
3. Update applications to use PING's PostgreSQL for constitutional events

### Phase 3: Remove Obsolete Containers

1. Stop and remove open-webui container
2. Stop and remove brain-openwebui container
3. Stop and remove brain-ollama container

### Phase 4: Consolidate Brain Infrastructure

1. Brain should use PING's PostgreSQL for constitutional events
2. Brain can keep its application-level databases (Qdrant, Neo4j, etc.) for Brain-specific functionality
3. Brain should focus on documentation/specification, not constitutional implementation

---

## ANSWER

**What is the constitutional ownership?**

**PING owns:**
- All constitutional primitives (Identity, Lineage, Event Recording, Replay, Witness, Canonical, Hash, State, Ledger, Artifact)
- Gateway (orchestration)
- Commit Service (mutation authority)
- Operational Intelligence (non-constitutional but PING-owned)
- crx-gateway container (PING KERNEL)
- crx-ollama-worker container (PING SERVICE)
- crx-ui-next container (PING APPLICATION)

**Brain owns:**
- Documentation/specification (design documents, architecture docs)
- Infrastructure configuration (Docker compose, scripts)
- Brain-specific services (Qdrant, Neo4j, Temporal, Kafka, DuckDB, OpenSearch, Tika)
- Brain should NOT own constitutional primitives (duplicates must be removed)

**Applications own:**
- Application state (SQLite databases as projection cache)
- Application logic (workers, summarizers, archives)
- Application archives (markdown files)
- Applications should import from PING for constitutional primitives

**Obsolete:**
- open-webui container (duplicate of crx-ui-next)
- brain-openwebui container (duplicate)
- brain-ollama container (duplicate of crx-ollama-worker)
- Brain's constitutional duplicates (event_emitter.py, canonical_state schemas)
