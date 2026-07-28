# MASTER PING-FIRST CONSTITUTIONAL INVENTORY

**Audit Type:** PING-FIRST CONSTITUTIONAL ARCHAEOLOGY AUDIT  
**Constitutional Root:** C:\Users\nolan\PING (Layer 0)  
**Audit Date:** 2025-01-18  
**Audit Scope:** Complete inventory of PING kernel, Docker runtime, authorities, Brain subsystem, duplications, constitutional ownership, and interfaces  

---

## EXECUTIVE SUMMARY

**PING is the constitutional root (Layer 0).** All constitutional primitives reside in PING. Brain is a subsystem built on PING, not infrastructure. Applications are built on top of PING. Foundations move downward.

**Critical Findings:**
1. **PING has all constitutional primitives** - Identity, Lineage, Event Recording, Replay, Witness, Canonical, Hash, State, Ledger, Artifact authorities
2. **Brain has duplicate constitutional implementations** - event_emitter.py, canonical_state schemas duplicate PING's constitutional primitives
3. **Brain is primarily documentation/specification** - 53+ markdown files, only 5 Python files, minimal implementation
4. **Applications use Brain's duplicate event_emitter.py** - Should use PING's event_emitter.js
5. **Open WebUI is obsolete** - Duplicate of crx-ui-next, should be removed
6. **Brain-ollama is obsolete** - Duplicate of crx-ollama-worker, should be removed

**Constitutional Ownership:**
- **PING owns:** All constitutional primitives, Gateway, Commit Service, Operational Intelligence, crx-gateway, crx-ollama-worker, crx-ui-next
- **Brain owns:** Documentation/specification, Brain-specific services (Qdrant, Neo4j, Temporal, Kafka, DuckDB, OpenSearch, Tika)
- **Applications own:** Application state (SQLite databases), Application logic (workers, summarizers, archives), Application dashboards
- **Obsolete:** open-webui, brain-openwebui, brain-ollama, Brain's constitutional duplicates

---

## PHASE 1: PING KERNEL INVENTORY

### Constitutional Primitives in PING

**Identity Authority:**
- identity_engine.ts (SHA256 hash computation)
- canonical_engine.ts (canonicalization using @crx/replay)
- canonical_hash_authority.ts (hash authority for replay)
- replay_types.ts (branded types: EventId, ArtifactId, WitnessLeafId)

**Lineage Authority:**
- lineage_store.ts (PostgreSQL lineage edge storage)
- dag_validator.ts (DAG validation, cycle detection)
- ledger_schema.sql (lineage_edges table)
- replay_types.ts (LineageEdge, LineageGraph interfaces)

**Event Recording Authority:**
- event_emitter.js (constitutional event logging to PostgreSQL)
- event_log.ts (event logging to execution_events table)
- events.sql (append-only events table with triggers)
- canonical_event_envelope.ts (event envelope structure)

**Replay Authority:**
- deterministic_replay_engine.ts (deterministic reconstruction from event stream)
- replay_state_machine.ts (state machine for replay execution)
- replay_verification.ts (replay integrity verification)
- invariant_runner.ts (invariant checking during replay)
- replay_invariants.ts (constitutional invariant definitions)
- replay_event_stream.ts (event stream for replay)

**Witness Authority:**
- witness_authority.ts (witness computation and verification)
- merkle_tree.ts (Merkle tree for witness proofs)

**Canonical Authority:**
- canonical_json.ts (deterministic JSON canonicalization)
- canonical_event_envelope.ts (canonical event envelope)

**Hash Authority:**
- identity_engine.ts (SHA256 hash computation)
- canonical_hash_authority.ts (hash authority)
- event_emitter.js (hash computation for request/response tracking)

**State Authority:**
- replay_types.ts (ReplayState, ArtifactState interfaces)
- deterministic_replay_engine.ts (state reconstruction from events)

**Ledger Authority:**
- ledger_schema.sql (artifacts, lineage_edges, execution_events tables)
- events.sql (append-only events table)

**Artifact Authority:**
- artifact.ts (Artifact interface)
- artifact_store.ts (PostgreSQL artifact storage)

### PING Services

**Gateway (Orchestration):**
- server.js (Express API gateway with model routing)
- Model routing logic (complexity-based model selection)
- Context services endpoint (operational intelligence)

**Commit Service (Mutation Authority):**
- server.ts (Express server for commit/audit endpoints)
- commit_controller.ts (artifact commit API)
- audit_controller.ts (artifact audit API)

**Operational Intelligence:**
- operational_intelligence.sql (dashboard queries, worker monitoring, model performance, failure tracking, daily digest, dead letter queue, knowledge metrics, runtime context services)

---

## PHASE 2: DOCKER RUNTIME INVENTORY

### PING KERNEL (1 container)
- **crx-gateway** - Constitutional gateway with event recording and operational intelligence

### PING SERVICE (1 container)
- **crx-ollama-worker** - Ollama inference service used by PING gateway

### APPLICATION (4 containers)
- **crx-ui-next** - Next.js UI frontend for CRX system
- **newsletter-brain-worker** - Newsletter processing worker
- **newsletter-brain-dashboard** - Dashboard for newsletter worker
- **digestion-worker** - Digestion/processing worker

### BRAIN SERVICE (10 containers)
- **brain-postgres** - PostgreSQL for Brain
- **brain-qdrant** - Vector database for Brain
- **brain-neo4j** - Knowledge graph database for Brain
- **brain-temporal** - Workflow engine for Brain
- **brain-kafka** - Event streaming for Brain
- **brain-zookeeper** - Zookeeper for Kafka
- **brain-duckdb** - Analytics database for Brain
- **brain-opensearch** - Search engine for Brain
- **brain-tika** - Document parsing for Brain
- **brain-ollama** - Ollama model server for Brain (duplicate of crx-ollama-worker)

### OBSOLETE (2 containers)
- **open-webui** - External AI interface (duplicates crx-ui-next functionality)
- **brain-openwebui** - Duplicate Open WebUI instance

### Duplication Detected
- **Ollama:** crx-ollama-worker (PING) vs brain-ollama (Brain) - Winner: crx-ollama-worker (PING owns model routing)
- **Open WebUI:** open-webui (crx-digestion-worker) vs brain-openwebui (Brain) - Winner: OBSOLETE (both should be replaced by crx-ui-next)

---

## PHASE 3: AUTHORITY DISCOVERY

### Constitutional Authorities (PING - Correct Location)

1. **Identity Authority** - identity_engine.ts, canonical_engine.ts, canonical_hash_authority.ts, replay_types.ts
2. **Lineage Authority** - lineage_store.ts, dag_validator.ts, ledger_schema.sql, replay_types.ts
3. **Event Recording Authority** - event_emitter.js, event_log.ts, events.sql, canonical_event_envelope.ts
4. **Replay Authority** - deterministic_replay_engine.ts, replay_state_machine.ts, replay_verification.ts, invariant_runner.ts, replay_invariants.ts, replay_event_stream.ts
5. **Witness Authority** - witness_authority.ts, merkle_tree.ts
6. **Canonical Authority** - canonical_engine.ts, canonical_json.ts, canonical_event_envelope.ts
7. **Hash Authority** - identity_engine.ts, canonical_hash_authority.ts, event_emitter.js
8. **State Authority** - replay_types.ts, deterministic_replay_engine.ts
9. **Ledger Authority** - ledger_schema.sql, events.sql

### Duplicate Authorities (Brain - Should Be Removed)

1. **Event Recording Authority** - src/constitutional/event_emitter.py (DUPLICATE of PING's event_emitter.js)
2. **Object Authority** - constitutional/canonical_state/schema.sql objects table (DUPLICATE)
3. **Artifact Authority** - constitutional/canonical_state/schema_expanded.sql artifact_lineage, artifact_registry (DUPLICATE)
4. **Lineage Authority** - constitutional/canonical_state/schema.sql lineage table (DUPLICATE)
5. **Canonical Authority** - constitutional/canonical_state/schema_expanded.sql canonical_documents table (DUPLICATE)
6. **Replay Authority** - constitutional/canonical_state/schema_expanded.sql replay_runs table (DUPLICATE)
7. **State Authority** - constitutional/canonical_state/schema.sql projections table (DUPLICATE)
8. **Ledger Authority** - constitutional/canonical_state/schema.sql, schema_expanded.sql (DUPLICATE of PING's events.sql)

### Application-Level (Not Constitutional)

1. **Entity Authority** - Brain's entities table (application-level, not constitutional)
2. **Registry Authority** - Brain's artifact_registry, projection_registry tables (application-level, not constitutional)
3. **Application State** - crx-newsletter-brain's newsletters.db (application-level, not constitutional)
4. **Application State** - crx-digestion-worker's knowledge.db (application-level, not constitutional)

---

## PHASE 4: BRAIN SUBSYSTEM AUDIT

### Critical Finding

**Brain is NOT a working subsystem.** Brain is a documentation/specification project with minimal implementation.

- **Total Python files:** 5 (event_emitter.py, generate_keys.py, generate_secrets.py, generate_daily_digest.py)
- **Total TypeScript files:** 0
- **Total JavaScript files:** 0
- **Total Markdown documentation files:** 53+
- **Actual implementation:** Minimal (only event_emitter.py for constitutional event logging)

### Brain Components (All Not Implemented)

1. **Knowledge** - NOT IMPLEMENTED (documentation only)
2. **Memory** - NOT IMPLEMENTED (empty directory)
3. **Lineage** - NOT IMPLEMENTED (documentation only - PING has the actual implementation)
4. **Interpretation** - NOT IMPLEMENTED (no documentation)
5. **Context Assembly** - NOT IMPLEMENTED (no documentation - PING has context services)
6. **Summarization** - NOT IMPLEMENTED (no documentation - applications have summarization)
7. **Classification** - NOT IMPLEMENTED (documentation only)
8. **Retrieval** - NOT IMPLEMENTED (no documentation - applications have retrieval)
9. **Archives** - NOT IMPLEMENTED (documentation only - applications have archives)
10. **Research** - NOT IMPLEMENTED (no documentation - applications have research tools)
11. **Knowledge Organization** - NOT IMPLEMENTED (documentation only - applications have organization)

### Application Implementations (Not Constitutional)

1. **Knowledge** - crx-digestion-worker (knowledge/ markdown files), crx-newsletter-brain (knowledge/ markdown files)
2. **Memory** - crx-digestion-worker (knowledge.db SQLite), crx-newsletter-brain (newsletters.db SQLite)
3. **Lineage** - None in applications (PING has the constitutional implementation)
4. **Interpretation** - crx-digestion-worker (summarizer.py), crx-newsletter-brain (summarizer.py)
5. **Context Assembly** - PING gateway (context services endpoint)
6. **Summarization** - crx-digestion-worker (summarizer.py), crx-newsletter-brain (summarizer.py, daily_digest.py)
7. **Classification** - crx-newsletter-brain (newsletter_topics table)
8. **Retrieval** - crx-digestion-worker (search_articles), crx-newsletter-brain (get_newsletters_by_date_range)
9. **Archives** - crx-digestion-worker (archive.py), crx-newsletter-brain (archive.py)
10. **Research** - crx-digestion-worker (tools.py RSS fetching), crx-newsletter-brain (yahoo_client.py)
11. **Knowledge Organization** - crx-digestion-worker (sources table), crx-newsletter-brain (newsletter_topics table)

---

## PHASE 5: DUPLICATION DETECTION

### Constitutional Primitives (Must be in PING only)

1. **Object Definitions** - PING artifacts table vs Brain objects table (DUPLICATE)
2. **Event Schemas** - PING events table vs Brain events table (DUPLICATE)
3. **Identity Systems** - PING identity_engine.ts vs Brain content_hash field (DUPLICATE)
4. **Storage Abstractions** - PING PostgreSQL vs Brain PostgreSQL schemas (DUPLICATE)
5. **State Systems** - PING ReplayState vs Brain projections table (DUPLICATE)

### Application-Level (Not constitutional, can exist in applications)

1. **Knowledge Schemas** - Brain entities/relationships tables (DUPLICATE - should be in applications only)
2. **Archives** - Brain documents/canonical_documents tables (DUPLICATE - should be in applications only)
3. **Registries** - Brain artifact_registry/projection_registry tables (DUPLICATE - should be in applications only)

### Critical Duplications Summary

- **PING has:** Artifact interface, artifacts table, event_emitter.js, events table, identity_engine.ts, canonical_engine.ts, ReplayState, ArtifactState
- **Brain has:** objects table, events table, content_hash field, projections table, entities/relationships tables, documents/canonical_documents tables, artifact_registry/projection_registry tables (ALL DUPLICATES)
- **Applications have:** articles table, newsletters table, markdown files (application state, not constitutional)

---

## PHASE 6: CONSTITUTIONAL OWNERSHIP

### PING Ownership (Constitutional Root)

**Constitutional Primitives:**
- Identity Authority (identity_engine.ts, canonical_engine.ts, canonical_hash_authority.ts, replay_types.ts)
- Lineage Authority (lineage_store.ts, dag_validator.ts, ledger_schema.sql, replay_types.ts)
- Event Recording Authority (event_emitter.js, event_log.ts, events.sql, canonical_event_envelope.ts)
- Replay Authority (deterministic_replay_engine.ts, replay_state_machine.ts, replay_verification.ts, invariant_runner.ts, replay_invariants.ts, replay_event_stream.ts)
- Witness Authority (witness_authority.ts, merkle_tree.ts)
- Canonical Authority (canonical_json.ts, canonical_event_envelope.ts)
- Hash Authority (identity_engine.ts, canonical_hash_authority.ts, event_emitter.js)
- State Authority (replay_types.ts, deterministic_replay_engine.ts)
- Ledger Authority (ledger_schema.sql, events.sql)
- Artifact Authority (artifact.ts, artifact_store.ts)

**PING Services:**
- Gateway (server.js - orchestration and event recording)
- Commit Service (server.ts - mutation authority)
- Operational Intelligence (operational_intelligence.sql - telemetry, metrics, heartbeats, runtime digests, dead letters, failure tracking)
- crx-gateway container (PING KERNEL)
- crx-ollama-worker container (PING SERVICE)
- crx-ui-next container (PING APPLICATION)

### Brain Ownership (Subsystem Built on PING)

**Brain-Specific Functionality:**
- Documentation/Specification (README.md, docs/architecture/, docs/runtime/, docs/constitutional/, docs/protocol/, docs/audit/)
- Infrastructure Configuration (infrastructure/docker/compose/docker-compose.yml, infrastructure/docker/scripts/, config/)

**Brain Services:**
- brain-postgres container (BRAIN SERVICE - should use PING's PostgreSQL)
- brain-qdrant container (BRAIN SERVICE - application-level, not constitutional)
- brain-neo4j container (BRAIN SERVICE - application-level, not constitutional)
- brain-temporal container (BRAIN SERVICE - application-level, not constitutional)
- brain-kafka container (BRAIN SERVICE - application-level, not constitutional)
- brain-zookeeper container (BRAIN SERVICE - application-level, not constitutional)
- brain-duckdb container (BRAIN SERVICE - application-level, not constitutional)
- brain-opensearch container (BRAIN SERVICE - application-level, not constitutional)
- brain-tika container (BRAIN SERVICE - application-level, not constitutional)
- brain-ollama container (BRAIN SERVICE - OBSOLETE - duplicate of crx-ollama-worker)
- brain-openwebui container (BRAIN SERVICE - OBSOLETE - duplicate of open-webui)

**Brain Constitutional Duplicates (Must be removed):**
- event_emitter.py (DUPLICATE of PING's event_emitter.js)
- canonical_state/schema.sql (DUPLICATE of PING's events.sql and ledger_schema.sql)
- canonical_state/schema_expanded.sql (DUPLICATE of PING's constitutional schemas)
- objects table (DUPLICATE of PING's artifacts table)
- events table (DUPLICATE of PING's events table)
- lineage table (DUPLICATE of PING's lineage_edges table)
- projections table (DUPLICATE - state is derived from replay, not stored)
- entities table (Application-level - should be in applications, not Brain)
- relationships table (Application-level - should be in applications, not Brain)
- documents table (Application-level - should be in applications, not Brain)
- canonical_documents table (Application-level - should be in applications, not Brain)
- artifact_registry table (Application-level - should be in applications, not Brain)
- projection_registry table (Application-level - should be in applications, not Brain)

### Application Ownership (Built on Top of PING)

**crx-digestion-worker:**
- Application State (knowledge.db SQLite - projection cache, not constitutional)
- Application Logic (worker.py, tools.py, summarizer.py, archive.py)
- Application Archives (knowledge/ directory - markdown files)
- Application Configuration (docker-compose.yml, sources.yaml)
- Constitutional Dependencies (currently imports from Brain's event_emitter.py - WRONG - should import from PING's event_emitter.js)

**crx-newsletter-brain:**
- Application State (newsletters.db SQLite - projection cache, not constitutional)
- Application Logic (worker.py, yahoo_client.py, summarizer.py, daily_digest.py, dashboard.py)
- Application Archives (knowledge/ directory, digests/ directory - markdown files)
- Application Configuration (docker-compose.yml, .env)
- Constitutional Dependencies (currently imports from Brain's event_emitter.py - WRONG - should import from PING's event_emitter.js)

### Obsolete (Should Be Removed)

- open-webui container (duplicates crx-ui-next functionality)
- brain-openwebui container (duplicate of open-webui, which is itself obsolete)
- brain-ollama container (duplicate of crx-ollama-worker)
- Brain's event_emitter.py (duplicate of PING's event_emitter.js)
- Brain's canonical_state/schema.sql (duplicate of PING's events.sql and ledger_schema.sql)
- Brain's canonical_state/schema_expanded.sql (duplicate of PING's constitutional schemas)
- Brain's application-level primitives (entities, relationships, documents, canonical_documents, artifact_registry, projection_registry tables)

---

## PHASE 7: INTERFACE AUDIT

### PING KERNEL (Constitutional)

**Gateway APIs (server.js):**
- POST /api/v1/chat (Chat endpoint for LLM inference with model routing)
- GET /events (Query events from PostgreSQL event store)
- GET /events/stats (Get event statistics)
- GET /context (Get runtime context for LLMs)
- GET /context/worker-status (Get worker heartbeat status)
- GET /context/model-performance (Get model performance metrics)
- GET /context/recent-errors (Get recent errors)
- GET /context/daily-digest (Get daily runtime digest)
- GET /context/knowledge-growth (Get knowledge growth metrics)
- POST /api/v1/autocomplete (Autocomplete endpoint)

### PING APPLICATION (Non-constitutional but PING-owned)

**crx-ui-next (localhost:3000):**
- Next.js UI frontend for CRX system
- Canonical UI for the CRX system
- Connects to PING Gateway (gateway-worker:8080)

**Operational Dashboards (operational_intelligence.sql):**
- get_event_activity() (Event activity metrics)
- get_worker_status() (Worker heartbeat status)
- get_model_performance() (Model performance metrics)
- get_top_errors() (Top errors)
- get_daily_runtime_digest() (Daily runtime digest)
- get_knowledge_growth_metrics() (Knowledge growth metrics)
- raw_payloads table (Raw input preservation)
- dead_letters table (Permanent failures)

### APPLICATION (Non-constitutional, application-owned)

**crx-newsletter-brain Dashboard:**
- dashboard.py (Dashboard for newsletter worker)
- Port 5001
- Depends on SQLite (newsletters.db)

**crx-digestion-worker Dashboard:**
- dashboard.py (Dashboard for digestion worker)
- Depends on SQLite (knowledge.db)

### OBSOLETE (Should be removed)

**open-webui (crx-digestion-worker):**
- Port 3001
- External AI interface for Ollama models
- Duplicates crx-ui-next functionality
- Should be removed

**brain-openwebui (brain infrastructure):**
- Port 3000
- Duplicate of open-webui
- Should be removed

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

## FINAL ANSWER

**What constitutional primitives exist?**
- PING has all constitutional authorities: Identity, Lineage, Event Recording, Replay, Witness, Canonical, Hash, State, Ledger, Artifact

**Where are they located?**
- PING (C:\Users\nolan\PING) - Correct location for constitutional authorities
- Brain (C:\Users\nolan\CascadeProjects\brain) - Duplicate implementations that should be removed
- Applications (crx-newsletter-brain, crx-digestion-worker) - Application-level state only

**What needs to be consolidated?**
- Remove Brain's event_emitter.py (duplicate of PING's event_emitter.js)
- Remove Brain's canonical_state schemas (duplicate of PING's events.sql)
- Applications should import from PING, not from Brain
- Brain should focus on Brain-specific functionality (knowledge, memory, retrieval), not constitutional primitives
- Remove open-webui and brain-openwebui (obsolete - duplicate of crx-ui-next)
- Remove brain-ollama (obsolete - duplicate of crx-ollama-worker)

**What is the constitutional ownership?**
- **PING owns:** All constitutional primitives, Gateway, Commit Service, Operational Intelligence, crx-gateway, crx-ollama-worker, crx-ui-next
- **Brain owns:** Documentation/specification, Brain-specific services (Qdrant, Neo4j, Temporal, Kafka, DuckDB, OpenSearch, Tika)
- **Applications own:** Application state (SQLite databases), Application logic (workers, summarizers, archives), Application dashboards
- **Obsolete:** open-webui, brain-openwebui, brain-ollama, Brain's constitutional duplicates

**PING is the constitutional root (Layer 0).** All constitutional primitives reside in PING. Brain is a subsystem built on PING, not infrastructure. Applications are built on top of PING. Foundations move downward.
