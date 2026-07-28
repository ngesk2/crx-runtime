# PHASE 6: STORAGE COLLAPSE ANALYSIS

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Inventory every persistence layer (SQLite, Postgres, DuckDB, Neo4j, Qdrant, Markdown, JSON, Parquet, Filesystem)  
**Evidence Only:** Running code only, not documentation  

---

## STORAGE LAYER 1: SQLite (crx-digestion-worker)

### Data Owner

**crx-digestion-worker (Application)**

### Location

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db  
**Type:** SQLite database file  
**Tables:** articles, sources

### Authoritative?

**YES.** SQLite is the authoritative source for articles and sources. Events are emitted after SQLite writes, not before. If events are lost, SQLite can still function.

### Replayable?

**NO.** There is no replay mechanism to reconstruct SQLite state from events. SQLite is the source of truth, not the event log.

### Can Rebuild?

**NO.** If SQLite is deleted, articles and sources are lost. Events cannot reconstruct SQLite state because there's no replay mechanism.

### Delete Consequence

**CATASTROPHIC.** If SQLite is deleted, all articles and sources are lost. Events cannot reconstruct state. Application cannot function.

### Decision

**KEEP.** SQLite is the authoritative source for application state. Cannot be deleted without catastrophic data loss.

---

## STORAGE LAYER 2: SQLite (crx-newsletter-brain)

### Data Owner

**crx-newsletter-brain (Application)**

### Location

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db  
**Type:** SQLite database file  
**Tables:** newsletters, digests, newsletter_topics

### Authoritative?

**YES.** SQLite is the authoritative source for newsletters and digests. Events are emitted after SQLite writes, not before. If events are lost, SQLite can still function.

### Replayable?

**NO.** There is no replay mechanism to reconstruct SQLite state from events. SQLite is the source of truth, not the event log.

### Can Rebuild?

**NO.** If SQLite is deleted, newsletters and digests are lost. Events cannot reconstruct SQLite state because there's no replay mechanism.

### Delete Consequence

**CATASTROPHIC.** If SQLite is deleted, all newsletters and digests are lost. Events cannot reconstruct state. Application cannot function.

### Decision

**KEEP.** SQLite is the authoritative source for application state. Cannot be deleted without catastrophic data loss.

---

## STORAGE LAYER 3: PostgreSQL (PING events table)

### Data Owner

**PING (Constitutional)**

### Location

**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB)  
**Table:** events  
**Schema:** C:\Users\nolan\PING\database\events.sql

### Authoritative?

**YES.** Events table is the constitutional event log. It's the source of truth for events.

### Replayable?

**NO.** There is no replay mechanism to reconstruct state from events. Events are emitted but not used for replay.

### Can Rebuild?

**NO.** If events table is deleted, event history is lost. Cannot be rebuilt because there's no replay mechanism.

### Delete Consequence

**OPERATIONAL IMPACT.** If events table is deleted, operational intelligence (dashboard queries, worker monitoring, model performance, failure tracking) is lost. Applications can still function from SQLite and markdown.

### Decision

**KEEP.** Events table is the constitutional event log. Required for operational intelligence.

---

## STORAGE LAYER 4: PostgreSQL (PING knowledge_metrics table)

### Data Owner

**PING (Operational Intelligence)**

### Location

**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB)  
**Table:** knowledge_metrics  
**Schema:** C:\Users\nolan\PING\database\operational_intelligence.sql

### Authoritative?

**NO.** knowledge_metrics table is a materialized view derived from events. Events are the source of truth.

### Replayable?

**YES.** knowledge_metrics can be recalculated from events using calculate_daily_knowledge_metrics() function.

### Can Rebuild?

**YES.** If knowledge_metrics table is deleted, it can be recalculated from events.

### Delete Consequence

**OPERATIONAL IMPACT.** If knowledge_metrics table is deleted, knowledge growth trends are lost. Can be rebuilt from events.

### Decision

**REBUILDABLE.** knowledge_metrics table is a materialized view derived from events. Can be rebuilt from events.

---

## STORAGE LAYER 5: PostgreSQL (PING raw_payloads table)

### Data Owner

**PING (Operational Intelligence)**

### Location

**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB)  
**Table:** raw_payloads  
**Schema:** C:\Users\nolan\PING\database\operational_intelligence.sql

### Authoritative?

**NO.** raw_payloads table is a cache of raw inputs. Raw inputs can be refetched from sources.

### Replayable?

**YES.** raw_payloads can be refetched from RSS sources and Yahoo Mail.

### Can Rebuild?

**YES.** If raw_payloads table is deleted, raw inputs can be refetched from sources.

### Delete Consequence

**OPERATIONAL IMPACT.** If raw_payloads table is deleted, raw input preservation is lost. Can be rebuilt by refetching from sources.

### Decision

**REBUILDABLE.** raw_payloads table is a cache of raw inputs. Can be rebuilt by refetching from sources.

---

## STORAGE LAYER 6: PostgreSQL (PING dead_letters table)

### Data Owner

**PING (Operational Intelligence)**

### Location

**Database:** PostgreSQL (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB)  
**Table:** dead_letters  
**Schema:** C:\Users\nolan\PING\database\operational_intelligence.sql

### Authoritative?

**NO.** dead_letters table is a cache of permanent failures. Failures don't affect runtime.

### Replayable?

**NO.** Failures are permanent. Cannot be replayed.

### Can Rebuild?

**NO.** If dead_letters table is deleted, failure history is lost. Cannot be rebuilt.

### Delete Consequence

**OPERATIONAL IMPACT.** If dead_letters table is deleted, failure history is lost. Runtime is not affected.

### Decision

**DELETE.** dead_letters table is a cache of permanent failures. Can be deleted without affecting runtime.

---

## STORAGE LAYER 7: PostgreSQL (Brain canonical state)

### Data Owner

**Brain (Not used)**

### Location

**Database:** PostgreSQL (Brain's PostgreSQL)  
**Tables:** objects, events, lineage, projections, system_metadata, audit_log  
**Schema:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql

### Authoritative?

**UNKNOWN.** Not used at runtime.

### Replayable?

**UNKNOWN.** Not used at runtime.

### Can Rebuild?

**UNKNOWN.** Not used at runtime.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**DELETE.** Brain's canonical state schema is not used at runtime. It's constitutional theater.

---

## STORAGE LAYER 8: PostgreSQL (Brain expanded canonical state)

### Data Owner

**Brain (Not used)**

### Location

**Database:** PostgreSQL (Brain's PostgreSQL)  
**Tables:** artifact_lineage, documents, canonical_documents, chunks, entities, relationships, processors, processing_runs, replay_runs, projection_registry, schema_versions  
**Schema:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql

### Authoritative?

**UNKNOWN.** Not used at runtime.

### Replayable?

**UNKNOWN.** Not used at runtime.

### Can Rebuild?

**UNKNOWN.** Not used at runtime.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**DELETE.** Brain's expanded canonical state schema is not used at runtime. It's constitutional theater.

---

## STORAGE LAYER 9: PostgreSQL (Brain postgres container)

### Data Owner

**Brain (Infrastructure)**

### Location

**Container:** brain-postgres  
**Database:** PostgreSQL  
**Volume:** postgres_data:/var/lib/postgresql/data

### Authoritative?

**NO.** Brain's PostgreSQL is not used by any application. It's infrastructure only.

### Replayable?

**UNKNOWN.** Not used by any application.

### Can Rebuild?

**YES.** If Brain's PostgreSQL is deleted, it can be rebuilt from docker-compose.yml.

### Delete Consequence

**NONE.** Brain's PostgreSQL is not used by any application. No impact.

### Decision

**DELETE.** Brain's PostgreSQL is not used by any application. It's infrastructure only.

---

## STORAGE LAYER 10: DuckDB (Brain)

### Data Owner

**Brain (Not used)**

### Location

**Container:** brain-duckdb  
**Database:** DuckDB  
**Volume:** duckdb_data:/data

### Authoritative?

**UNKNOWN.** Not used at runtime.

### Replayable?

**UNKNOWN.** Not used at runtime.

### Can Rebuild?

**YES.** If DuckDB is deleted, it can be rebuilt from docker-compose.yml.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**DELETE.** DuckDB is not used by any application. It's infrastructure only.

---

## STORAGE LAYER 11: Neo4j (Brain)

### Data Owner

**Brain (Not used)**

### Location

**Container:** brain-neo4j  
**Database:** Neo4j  
**Volumes:** neo4j_data:/data, neo4j_logs:/logs

### Authoritative?

**UNKNOWN.** Not used at runtime.

### Replayable?

**UNKNOWN.** Not used at runtime.

### Can Rebuild?

**YES.** If Neo4j is deleted, it can be rebuilt from docker-compose.yml.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**DELETE.** Neo4j is not used by any application. It's infrastructure only.

---

## STORAGE LAYER 12: Qdrant (Brain)

### Data Owner

**Brain (Not used)**

### Location

**Container:** brain-qdrant  
**Database:** Qdrant  
**Volume:** qdrant_data:/qdrant/storage

### Authoritative?

**UNKNOWN.** Not used at runtime.

### Replayable?

**UNKNOWN.** Not used at runtime.

### Can Rebuild?

**YES.** If Qdrant is deleted, it can be rebuilt from docker-compose.yml.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**DELETE.** Qdrant is not used by any application. It's infrastructure only.

---

## STORAGE LAYER 13: Markdown Files (crx-digestion-worker)

### Data Owner

**crx-digestion-worker (Application)**

### Location

**Directory:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\  
**Type:** Filesystem (markdown files)

### Authoritative?

**YES.** Markdown files are the authoritative archive. Events are emitted after markdown writes, not before. If events are lost, markdown files can still be read.

### Replayable?

**NO.** There is no replay mechanism to reconstruct markdown files from events. Markdown files are the source of truth, not the event log.

### Can Rebuild?

**NO.** If markdown files are deleted, archives are lost. Events cannot reconstruct markdown files because there's no replay mechanism.

### Delete Consequence

**CATASTROPHIC.** If markdown files are deleted, all archives are lost. Events cannot reconstruct state. Application archives are lost.

### Decision

**KEEP.** Markdown files are the authoritative archive. Cannot be deleted without catastrophic data loss.

---

## STORAGE LAYER 14: Markdown Files (crx-newsletter-brain)

### Data Owner

**crx-newsletter-brain (Application)**

### Location

**Directory:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\  
**Type:** Filesystem (markdown files)

### Authoritative?

**YES.** Markdown files are the authoritative archive. Events are emitted after markdown writes, not before. If events are lost, markdown files can still be read.

### Replayable?

**NO.** There is no replay mechanism to reconstruct markdown files from events. Markdown files are the source of truth, not the event log.

### Can Rebuild?

**NO.** If markdown files are deleted, archives are lost. Events cannot reconstruct markdown files because there's no replay mechanism.

### Delete Consequence

**CATASTROPHIC.** If markdown files are deleted, all archives are lost. Events cannot reconstruct state. Application archives are lost.

### Decision

**KEEP.** Markdown files are the authoritative archive. Cannot be deleted without catastrophic data loss.

---

## STORAGE LAYER 15: Markdown Files (crx-newsletter-brain digests)

### Data Owner

**crx-newsletter-brain (Application)**

### Location

**Directory:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\  
**Type:** Filesystem (markdown files)

### Authoritative?

**YES.** Digest markdown files are the authoritative archive. Events are emitted after digest saves, not before. If events are lost, digest files can still be read.

### Replayable?

**NO.** There is no replay mechanism to reconstruct digest files from events. Digest files are the source of truth, not the event log.

### Can Rebuild?

**NO.** If digest files are deleted, digests are lost. Events cannot reconstruct digest files because there's no replay mechanism.

### Delete Consequence

**OPERATIONAL IMPACT.** If digest files are deleted, digests are lost. Can be regenerated from SQLite.

### Decision

**REBUILDABLE.** Digest files can be regenerated from SQLite digests table.

---

## STORAGE LAYER 16: JSON (Not used)

### Data Owner

**None**

### Location

**None**

### Authoritative?

**N/A.** Not used at runtime.

### Replayable?

**N/A.** Not used at runtime.

### Can Rebuild?

**N/A.** Not used at runtime.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**N/A.** Not used at runtime.

---

## STORAGE LAYER 17: Parquet (Not used)

### Data Owner

**None**

### Location

**None**

### Authoritative?

**N/A.** Not used at runtime.

### Replayable?

**N/A.** Not used at runtime.

### Can Rebuild?

**N/A.** Not used at runtime.

### Delete Consequence

**NONE.** Not used at runtime. No impact.

### Decision

**N/A.** Not used at runtime.

---

## STORAGE LAYER 18: Filesystem (Docker volumes)

### Data Owner

**Docker**

### Location

**Volumes:** open-webui-data, postgres_data, qdrant_data, neo4j_data, kafka_data, zookeeper_data, duckdb_data, opensearch_data, ollama_data

### Authoritative?

**NO.** Docker volumes are infrastructure only.

### Replayable?

**UNKNOWN.** Infrastructure only.

### Can Rebuild?

**YES.** If Docker volumes are deleted, they can be rebuilt from docker-compose.yml.

### Delete Consequence

**OPERATIONAL IMPACT.** If Docker volumes are deleted, infrastructure state is lost. Can be rebuilt from docker-compose.yml.

### Decision

**REBUILDABLE.** Docker volumes are infrastructure only. Can be rebuilt from docker-compose.yml.

---

## SUMMARY

### Storage Authority Matrix

| Storage Layer | Data Owner | Authoritative? | Replayable? | Can Rebuild? | Delete Consequence | Decision |
|--------------|------------|----------------|-------------|-------------|-------------------|----------|
| SQLite (crx-digestion-worker) | crx-digestion-worker (Application) | YES | NO | NO | CATASTROPHIC | KEEP |
| SQLite (crx-newsletter-brain) | crx-newsletter-brain (Application) | YES | NO | NO | CATASTROPHIC | KEEP |
| PostgreSQL (PING events table) | PING (Constitutional) | YES | NO | NO | OPERATIONAL IMPACT | KEEP |
| PostgreSQL (PING knowledge_metrics table) | PING (Operational Intelligence) | NO | YES | YES | OPERATIONAL IMPACT | REBUILDABLE |
| PostgreSQL (PING raw_payloads table) | PING (Operational Intelligence) | NO | YES | YES | OPERATIONAL IMPACT | REBUILDABLE |
| PostgreSQL (PING dead_letters table) | PING (Operational Intelligence) | NO | NO | NO | OPERATIONAL IMPACT | DELETE |
| PostgreSQL (Brain canonical state) | Brain (Not used) | UNKNOWN | UNKNOWN | UNKNOWN | NONE | DELETE |
| PostgreSQL (Brain expanded canonical state) | Brain (Not used) | UNKNOWN | UNKNOWN | UNKNOWN | NONE | DELETE |
| PostgreSQL (Brain postgres container) | Brain (Infrastructure) | NO | UNKNOWN | YES | NONE | DELETE |
| DuckDB (Brain) | Brain (Not used) | UNKNOWN | UNKNOWN | YES | NONE | DELETE |
| Neo4j (Brain) | Brain (Not used) | UNKNOWN | UNKNOWN | YES | NONE | DELETE |
| Qdrant (Brain) | Brain (Not used) | UNKNOWN | UNKNOWN | YES | NONE | DELETE |
| Markdown Files (crx-digestion-worker) | crx-digestion-worker (Application) | YES | NO | NO | CATASTROPHIC | KEEP |
| Markdown Files (crx-newsletter-brain) | crx-newsletter-brain (Application) | YES | NO | NO | CATASTROPHIC | KEEP |
| Markdown Files (crx-newsletter-brain digests) | crx-newsletter-brain (Application) | YES | NO | NO | OPERATIONAL IMPACT | REBUILDABLE |
| JSON | None | N/A | N/A | N/A | NONE | N/A |
| Parquet | None | N/A | N/A | N/A | NONE | N/A |
| Filesystem (Docker volumes) | Docker | NO | UNKNOWN | YES | OPERATIONAL IMPACT | REBUILDABLE |

### Critical Findings

1. **SQLite databases are KEEP.** SQLite is the authoritative source for application state. Cannot be deleted without catastrophic data loss.

2. **Markdown files are KEEP.** Markdown files are the authoritative archive. Cannot be deleted without catastrophic data loss.

3. **PostgreSQL events table is KEEP.** Events table is the constitutional event log. Required for operational intelligence.

4. **PostgreSQL knowledge_metrics table is REBUILDABLE.** knowledge_metrics table is a materialized view derived from events. Can be rebuilt from events.

5. **PostgreSQL raw_payloads table is REBUILDABLE.** raw_payloads table is a cache of raw inputs. Can be rebuilt by refetching from sources.

6. **PostgreSQL dead_letters table is DELETE.** dead_letters table is a cache of permanent failures. Can be deleted without affecting runtime.

7. **Brain's PostgreSQL is DELETE.** Brain's PostgreSQL is not used by any application. It's infrastructure only.

8. **DuckDB is DELETE.** DuckDB is not used by any application. It's infrastructure only.

9. **Neo4j is DELETE.** Neo4j is not used by any application. It's infrastructure only.

10. **Qdrant is DELETE.** Qdrant is not used by any application. It's infrastructure only.

### Answer

**What is the storage authority?**
- **KEEP:** SQLite databases (crx-digestion-worker, crx-newsletter-brain), Markdown files (crx-digestion-worker, crx-newsletter-brain), PostgreSQL events table (PING)
- **REBUILDABLE:** PostgreSQL knowledge_metrics table (PING), PostgreSQL raw_payloads table (PING), Markdown digest files (crx-newsletter-brain), Docker volumes
- **DELETE:** PostgreSQL dead_letters table (PING), Brain's PostgreSQL, DuckDB, Neo4j, Qdrant, Brain's canonical state schemas

**Decision categories:**
- **KEEP:** Authoritative sources that cannot be deleted without catastrophic data loss
- **REBUILDABLE:** Derived sources that can be rebuilt from other sources
- **DELETE:** Unused sources that can be deleted without affecting runtime
