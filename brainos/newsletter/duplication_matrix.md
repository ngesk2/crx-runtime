# PHASE 5: DUPLICATION DETECTION

**Audit Scope:** Identify duplicated primitives (Object definitions, Event schemas, Identity systems, Storage abstractions, Knowledge schemas, Archives, Registries, State systems)  
**Constitutional Root:** PING (C:\Users\nolan\PING)  

---

## OBJECT DEFINITIONS

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\models\artifact.ts  
**Definition:** Artifact interface with artifact_type and content  
**Constitutional Status:** YES - Constitutional primitive (Artifact)  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Definition:** artifacts table (artifact_id TEXT PRIMARY KEY, artifact_type TEXT, content JSONB)  
**Constitutional Status:** YES - Constitutional substrate schema  

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Definition:** objects table (object_id UUID PRIMARY KEY, content_hash VARCHAR(64), content JSONB)  
**Constitutional Status:** DUPLICATE - Brain should not have its own object definition  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** objects table (expanded with version, metadata, archived_at, deleted_at)  
**Constitutional Status:** DUPLICATE - Brain should not have its own object definition  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** articles table (url TEXT UNIQUE, title TEXT, summary TEXT)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** newsletters table (message_id TEXT UNIQUE, subject TEXT, body TEXT)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** Artifact interface, artifacts table
- **Brain has:** objects table (DUPLICATE)
- **Applications have:** articles table, newsletters table (application state, not constitutional)

**Winner:** PING (constitutional root)  
**Action Required:** Remove Brain's objects table, migrate to PING's artifacts table  

---

## EVENT SCHEMAS

### PING Implementation

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Definition:** INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED events  
**Constitutional Status:** YES - Event Recording Authority implementation  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts  
**Definition:** execution_events table (event_id, artifact_id, event_type, payload)  
**Constitutional Status:** YES - Event Recording Authority implementation  

**File:** C:\Users\nolan\PING\database\events.sql  
**Definition:** events table (id BIGSERIAL PRIMARY KEY, stream TEXT, event_type TEXT, payload JSONB, created_at TIMESTAMPTZ) with append-only triggers  
**Constitutional Status:** YES - Constitutional substrate schema (Event Recording Authority)  

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Definition:** emit_event(stream, event_type, payload) with ARTICLE_CREATED, NEWSLETTER_CREATED, DIGEST_GENERATED, INFERENCE_REQUEST, INFERENCE_RESPONSE  
**Constitutional Status:** DUPLICATE - Brain should not have its own event authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Definition:** events table (event_id UUID, event_type VARCHAR(255), aggregate_id UUID, event_data JSONB)  
**Constitutional Status:** DUPLICATE - Brain should not have its own event schema  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** events table (expanded with deleted_at, causation_id, correlation_id)  
**Constitutional Status:** DUPLICATE - Brain should not have its own event schema  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** Imports from Brain: emit_article_created, emit_article_processing_failed  
**Constitutional Status:** APPLICATION using DUPLICATE - Should use PING's event_emitter.js  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** Imports from Brain: emit_newsletter_created, emit_digest_generated  
**Constitutional Status:** APPLICATION using DUPLICATE - Should use PING's event_emitter.js  

### DUPLICATION SUMMARY

- **PING has:** event_emitter.js, events.sql (append-only)
- **Brain has:** event_emitter.py, events table (DUPLICATE)
- **Applications use:** Brain's event_emitter.py (WRONG - should use PING's)

**Winner:** PING (constitutional root)  
**Action Required:** Remove Brain's event_emitter.py, migrate applications to use PING's event_emitter.js  

---

## IDENTITY SYSTEMS

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts  
**Definition:** computeCanonicalHash(input: any): string using SHA256  
**Constitutional Status:** YES - Identity Authority implementation (hash computation)  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts  
**Definition:** canonicalize(value: unknown): string using @crx/replay CanonicalJson  
**Constitutional Status:** YES - Identity Authority implementation (canonicalization)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts  
**Definition:** Hash authority for replay kernel  
**Constitutional Status:** YES - Identity Authority implementation  

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Definition:** Branded types (EventId, ArtifactId, WitnessLeafId) with type guards  
**Constitutional Status:** YES - Constitutional primitive type system  

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Definition:** objects table with content_hash VARCHAR(64) field  
**Constitutional Status:** DUPLICATE - Brain should not have its own identity system  

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\HASH_AUTHORITY.md  
**Definition:** Documentation for hash authority  
**Constitutional Status:** DUPLICATE - Brain should not have its own identity authority documentation  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** articles table with url TEXT UNIQUE as identity  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** newsletters table with message_id TEXT UNIQUE as identity  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** identity_engine.ts, canonical_engine.ts, canonical_hash_authority.ts, replay_types.ts (branded types)
- **Brain has:** content_hash field, hash authority documentation (DUPLICATE)
- **Applications have:** url, message_id as identity (application state, not constitutional)

**Winner:** PING (constitutional root)  
**Action Required:** Remove Brain's content_hash field and hash authority documentation  

---

## STORAGE ABSTRACTIONS

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts  
**Definition:** storeArtifact(id, artifact) inserts into artifacts table  
**Constitutional Status:** YES - Persistence layer for constitutional artifacts  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts  
**Definition:** storeLineage(parentIds, childId) inserts into lineage_edges table  
**Constitutional Status:** YES - Persistence layer for constitutional lineage  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\db.ts  
**Definition:** PostgreSQL pool factory  
**Constitutional Status:** YES - Infrastructure adapter for constitutional storage  

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Definition:** PostgreSQL schema for objects, events, lineage, projections  
**Constitutional Status:** DUPLICATE - Brain should not have its own storage abstraction  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** Expanded PostgreSQL schema with additional tables  
**Constitutional Status:** DUPLICATE - Brain should not have its own storage abstraction  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** SQLite database (knowledge.db) with articles, sources tables  
**Constitutional Status:** APPLICATION STATE - Projection cache (not constitutional)  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** SQLite database (newsletters.db) with newsletters, digests, topics tables  
**Constitutional Status:** APPLICATION STATE - Projection cache (not constitutional)  

### DUPLICATION SUMMARY

- **PING has:** PostgreSQL storage (artifacts, lineage_edges)
- **Brain has:** PostgreSQL schema (objects, events, lineage, projections) (DUPLICATE)
- **Applications have:** SQLite databases (application state, not constitutional)

**Winner:** PING (constitutional root)  
**Action Required:** Remove Brain's PostgreSQL schemas, keep applications' SQLite as projection cache  

---

## KNOWLEDGE SCHEMAS

### PING Implementation

**None** - PING does not have knowledge schemas (knowledge is application-level)

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** entities table (entity_id, entity_type, entity_name, entity_attributes)  
**Constitutional Status:** DUPLICATE - Brain should not have its own knowledge schema  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** relationships table (relationship_id, source_entity_id, target_entity_id, relationship_type)  
**Constitutional Status:** DUPLICATE - Brain should not have its own knowledge schema  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** articles table (url, title, summary, source, tags)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** newsletters table (message_id, subject, body, summary, tags, key_ideas)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** newsletter_topics table (article_id, topic, confidence)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** None (knowledge is application-level)
- **Brain has:** entities, relationships tables (DUPLICATE - application-level, not constitutional)
- **Applications have:** articles, newsletters, newsletter_topics tables (application state, not constitutional)

**Winner:** Applications (knowledge is application-level, not constitutional)  
**Action Required:** Remove Brain's entities and relationships tables (knowledge is application-level)  

---

## ARCHIVES

### PING Implementation

**None** - PING does not have archives (archives are application-level)

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** documents table (document_id, file_path, file_size, file_type, classification)  
**Constitutional Status:** DUPLICATE - Brain should not have its own archive schema  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** canonical_documents table (canonical_document_id, document_id, metadata, canonicalization_rules)  
**Constitutional Status:** DUPLICATE - Brain should not have its own archive schema  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Definition:** archive_article(article) saves to knowledge/ directory as markdown  
**Constitutional Status:** APPLICATION ARCHIVE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Definition:** archive_newsletter(newsletter) saves to knowledge/ directory as markdown  
**Constitutional Status:** APPLICATION ARCHIVE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** None (archives are application-level)
- **Brain has:** documents, canonical_documents tables (DUPLICATE - application-level, not constitutional)
- **Applications have:** Markdown files in knowledge/ directories (application archives, not constitutional)

**Winner:** Applications (archives are application-level, not constitutional)  
**Action Required:** Remove Brain's documents and canonical_documents tables (archives are application-level)  

---

## REGISTRIES

### PING Implementation

**None** - PING does not have registries (registries are application-level)

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** artifact_registry table (artifact_id, artifact_type, artifact_name, artifact_schema)  
**Constitutional Status:** DUPLICATE - Brain should not have its own registry  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** projection_registry table (projection_type, projection_name, projection_schema, dependencies)  
**Constitutional Status:** DUPLICATE - Brain should not have its own registry  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** sources table (name, url, type)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** None (registries are application-level)
- **Brain has:** artifact_registry, projection_registry tables (DUPLICATE - application-level, not constitutional)
- **Applications have:** sources table (application state, not constitutional)

**Winner:** Applications (registries are application-level, not constitutional)  
**Action Required:** Remove Brain's artifact_registry and projection_registry tables (registries are application-level)  

---

## STATE SYSTEMS

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Definition:** ReplayState interface (artifacts Map<ArtifactId, ArtifactState>, seen_event_ids Set<string>, event_to_artifact_map Map<string, string>)  
**Constitutional Status:** YES - Constitutional primitive type system  

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Definition:** ArtifactState interface (artifact_id, artifact_hash, artifact_lineage)  
**Constitutional Status:** YES - Constitutional primitive type system  

**File:** C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts  
**Definition:** Deterministic reconstruction from event stream  
**Constitutional Status:** YES - Replay Authority implementation (state reconstruction)  

### Brain Implementation (DUPLICATE)

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Definition:** projections table (projection_id, projection_type, projection_data)  
**Constitutional Status:** DUPLICATE - Brain should not have its own state system  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Definition:** projection_registry table (projection_schema, dependencies, build_schedule)  
**Constitutional Status:** DUPLICATE - Brain should not have its own state system  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Definition:** articles table with processed_at field (state)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Definition:** newsletters table with processed_at field (state)  
**Constitutional Status:** APPLICATION STATE - Not constitutional  

### DUPLICATION SUMMARY

- **PING has:** ReplayState, ArtifactState interfaces, deterministic replay engine
- **Brain has:** projections table, projection_registry table (DUPLICATE)
- **Applications have:** processed_at fields in application tables (application state, not constitutional)

**Winner:** PING (constitutional root)  
**Action Required:** Remove Brain's projections and projection_registry tables (state is derived from replay, not stored)  

---

## CRITICAL DUPLICATIONS SUMMARY

### CONSTITUTIONAL PRIMITIVES (Must be in PING only)

1. **Object Definitions** - PING artifacts table vs Brain objects table (DUPLICATE)
2. **Event Schemas** - PING events table vs Brain events table (DUPLICATE)
3. **Identity Systems** - PING identity_engine.ts vs Brain content_hash field (DUPLICATE)
4. **Storage Abstractions** - PING PostgreSQL vs Brain PostgreSQL schemas (DUPLICATE)
5. **State Systems** - PING ReplayState vs Brain projections table (DUPLICATE)

### APPLICATION-LEVEL (Not constitutional, can exist in applications)

1. **Knowledge Schemas** - Brain entities/relationships tables (DUPLICATE - should be in applications only)
2. **Archives** - Brain documents/canonical_documents tables (DUPLICATE - should be in applications only)
3. **Registries** - Brain artifact_registry/projection_registry tables (DUPLICATE - should be in applications only)

### ANSWER

**What primitives are duplicated?**
- Object definitions (PING artifacts vs Brain objects)
- Event schemas (PING events vs Brain events)
- Identity systems (PING identity_engine vs Brain content_hash)
- Storage abstractions (PING PostgreSQL vs Brain PostgreSQL schemas)
- State systems (PING ReplayState vs Brain projections)
- Knowledge schemas (Brain entities/relationships - application-level, not constitutional)
- Archives (Brain documents/canonical_documents - application-level, not constitutional)
- Registries (Brain artifact_registry/projection_registry - application-level, not constitutional)

**Where are the duplicates?**
- Brain has duplicate implementations of constitutional primitives (objects, events, identity, storage, state)
- Brain has application-level primitives that should be in applications (knowledge, archives, registries)

**What needs to be consolidated?**
- Remove Brain's constitutional primitives (objects, events, identity, storage, state)
- Remove Brain's application-level primitives (knowledge, archives, registries)
- Applications should keep their application-level primitives (articles, newsletters, markdown archives)
- PING remains the constitutional root for all constitutional primitives
