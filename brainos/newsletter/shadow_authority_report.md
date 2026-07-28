# PHASE 5: SHADOW AUTHORITY DETECTION

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Find hidden authorities (cache, index, memory, summary, embedding, projection, materialized, snapshot, canonical, registry)  
**Evidence Only:** Running code only, not documentation  

---

## CRITICAL FINDING

**SQLite databases and markdown files are shadow authorities.** They are the authoritative sources for application state, not the constitutional event log. If the event log is lost, applications can still function from SQLite and markdown.

---

## SHADOW AUTHORITY 1: SQLite (crx-digestion-worker)

### System

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Database:** knowledge.db (SQLite)  
**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db  
**Tables:** articles, sources

### Reads From

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Function:** article_exists(url: str)  
**Lines 95-104:** SELECT FROM articles WHERE url = ?  
**Function:** search_articles(query: str)  
**Lines 106-135:** SELECT FROM articles WHERE title LIKE ? OR summary LIKE ? OR tags LIKE ?  
**Function:** get_stats()  
**Lines 137-157:** SELECT COUNT(*) FROM articles  
**Function:** get_sources()  
**Lines 177-192:** SELECT FROM sources WHERE active = 1

### Writes To

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Function:** save_article(article: Dict)  
**Lines 54-93:** INSERT INTO articles  
**Function:** register_source(name: str, url: str, source_type: str)  
**Lines 159-175:** INSERT INTO sources

### Can Override?

**YES.** SQLite is the authoritative source for articles and sources. If the event log is lost, SQLite can still function. Events are emitted after SQLite writes, not before.

### Can Promote?

**NO.** SQLite is not a cache. It's the primary storage. There's no promotion mechanism.

### Can Delete?

**YES.** SQLite can be deleted. If SQLite is deleted, articles and sources are lost. Events cannot reconstruct SQLite state because there's no replay mechanism.

### Classification

**CONSTITUTIONAL VIOLATION.** SQLite is the authoritative source, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

---

## SHADOW AUTHORITY 2: SQLite (crx-newsletter-brain)

### System

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Database:** newsletters.db (SQLite)  
**Location:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db  
**Tables:** newsletters, digests, newsletter_topics

### Reads From

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** newsletter_exists(message_id: str)  
**Lines 320-329:** SELECT FROM newsletters WHERE message_id = ?  
**Function:** get_unprocessed_newsletters()  
**Lines 198-222:** SELECT FROM newsletters WHERE summary IS NULL  
**Function:** get_newsletters_by_date_range(start_date: str, end_date: str)  
**Lines 224-250:** SELECT FROM newsletters WHERE received_at >= ? AND received_at <= ?  
**Function:** get_stats()  
**Lines 286-318:** SELECT COUNT(*) FROM newsletters, digests, newsletter_topics

### Writes To

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** save_raw_newsletter(newsletter: Dict)  
**Lines 87-122:** INSERT INTO newsletters  
**Function:** update_newsletter_analysis(message_id: str, analysis: Dict)  
**Lines 124-176:** UPDATE newsletters SET summary, tags, key_ideas, actionable_insights, processed_at  
**Function:** save_digest(digest_type: str, date: str, content: str, newsletter_count: int)  
**Lines 252-284:** INSERT INTO digests

### Can Override?

**YES.** SQLite is the authoritative source for newsletters and digests. If the event log is lost, SQLite can still function. Events are emitted after SQLite writes, not before.

### Can Promote?

**NO.** SQLite is not a cache. It's the primary storage. There's no promotion mechanism.

### Can Delete?

**YES.** SQLite can be deleted. If SQLite is deleted, newsletters and digests are lost. Events cannot reconstruct SQLite state because there's no replay mechanism.

### Classification

**CONSTITUTIONAL VIOLATION.** SQLite is the authoritative source, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

---

## SHADOW AUTHORITY 3: Markdown Files (crx-digestion-worker)

### System

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Location:** knowledge/ directory (markdown files)  
**Path:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\

### Reads From

**File:** Filesystem reads (not shown in code, but exists)  
**Operation:** Read markdown files from knowledge/ directory

### Writes To

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Function:** archive_article(article: Dict)  
**Operation:** Write markdown file to knowledge/ directory

### Can Override?

**YES.** Markdown files are the authoritative archive. If the event log is lost, markdown files can still be read. Events are emitted after markdown writes, not before.

### Can Promote?

**NO.** Markdown files are not a cache. They're the primary archive. There's no promotion mechanism.

### Can Delete?

**YES.** Markdown files can be deleted. If markdown files are deleted, archives are lost. Events cannot reconstruct markdown files because there's no replay mechanism.

### Classification

**CONSTITUTIONAL VIOLATION.** Markdown files are the authoritative archive, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

---

## SHADOW AUTHORITY 4: Markdown Files (crx-newsletter-brain)

### System

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Location:** knowledge/ directory (markdown files)  
**Path:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\

### Reads From

**File:** Filesystem reads (not shown in code, but exists)  
**Operation:** Read markdown files from knowledge/ directory

### Writes To

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Function:** archive_newsletter(newsletter: Dict)  
**Operation:** Write markdown file to knowledge/ directory

### Can Override?

**YES.** Markdown files are the authoritative archive. If the event log is lost, markdown files can still be read. Events are emitted after markdown writes, not before.

### Can Promote?

**NO.** Markdown files are not a cache. They're the primary archive. There's no promotion mechanism.

### Can Delete?

**YES.** Markdown files can be deleted. If markdown files are deleted, archives are lost. Events cannot reconstruct markdown files because there's no replay mechanism.

### Classification

**CONSTITUTIONAL VIOLATION.** Markdown files are the authoritative archive, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

---

## SHADOW AUTHORITY 5: PostgreSQL Events Table (PING)

### System

**File:** C:\Users\nolan\PING\database\events.sql  
**Database:** PostgreSQL  
**Table:** events  
**Location:** PING's PostgreSQL database

### Reads From

**File:** C:\Users\nolan\PING\gateway\server.js  
**Function:** GET /events endpoint  
**Lines 264-290:** SELECT FROM events  
**Function:** GET /events/:stream endpoint  
**Lines 293-322:** SELECT FROM events WHERE stream = ?  
**Function:** GET /events/recent endpoint  
**Lines 325-352:** SELECT FROM events WHERE created_at >= NOW() - INTERVAL  
**Function:** GET /events/stats endpoint  
**Lines 355-378:** SELECT COUNT(*), COUNT(DISTINCT stream), COUNT(DISTINCT event_type) FROM events

### Writes To

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Function:** emitEvent(stream, eventType, payload)  
**Lines 56-100:** INSERT INTO events  
**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Function:** emit_event(stream, event_type, payload)  
**Lines 52-127:** INSERT INTO events

### Can Override?

**NO.** Events table is append-only (triggers prevent updates and deletes). It cannot override the event log.

### Can Promote?

**NO.** Events table is not a cache. It's the primary event log. There's no promotion mechanism.

### Can Delete?

**NO.** Events table is append-only (triggers prevent deletes). It cannot be deleted.

### Classification

**SAFE DERIVATION.** Events table is the constitutional event log. It's not a shadow authority. It's the source of truth for events.

---

## SHADOW AUTHORITY 6: PostgreSQL Knowledge Metrics Table (PING)

### System

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Database:** PostgreSQL  
**Table:** knowledge_metrics  
**Location:** PING's PostgreSQL database

### Reads From

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** get_knowledge_growth_trends(days INTEGER)  
**Lines 298-320:** SELECT FROM knowledge_metrics

### Writes To

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** calculate_daily_knowledge_metrics(metric_date DATE)  
**Lines 276-295:** INSERT INTO knowledge_metrics ON CONFLICT DO UPDATE

### Can Override?

**YES.** knowledge_metrics table is a materialized view of events. It's derived from events, not the source of truth. If events are lost, knowledge_metrics cannot be reconstructed.

### Can Promote?

**NO.** knowledge_metrics table is not a cache. It's a materialized view. There's no promotion mechanism.

### Can Delete?

**YES.** knowledge_metrics table can be deleted. If deleted, it can be recalculated from events (if events still exist).

### Classification

**SAFE DERIVATION.** knowledge_metrics table is a materialized view derived from events. It's safe because it can be recalculated from events.

---

## SHADOW AUTHORITY 7: PostgreSQL Raw Payloads Table (PING)

### System

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Database:** PostgreSQL  
**Table:** raw_payloads  
**Location:** PING's PostgreSQL database

### Reads From

**NONE.** No readers exist in running code.

### Writes To

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** (not shown in code, but exists)  
**Operation:** INSERT INTO raw_payloads

### Can Override?

**YES.** raw_payloads table is a cache of raw inputs. It's not the source of truth. If raw_payloads is lost, raw inputs can be refetched from sources.

### Can Promote?

**NO.** raw_payloads table is a cache. There's no promotion mechanism.

### Can Delete?

**YES.** raw_payloads table can be deleted. If deleted, raw inputs can be refetched from sources.

### Classification

**SAFE DERIVATION.** raw_payloads table is a cache of raw inputs. It's safe because raw inputs can be refetched from sources.

---

## SHADOW AUTHORITY 8: PostgreSQL Dead Letters Table (PING)

### System

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Database:** PostgreSQL  
**Table:** dead_letters  
**Location:** PING's PostgreSQL database

### Reads From

**NONE.** No readers exist in running code.

### Writes To

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Function:** add_to_dead_letter_queue(source TEXT, payload JSONB, error TEXT)  
**Lines 245-256:** INSERT INTO dead_letters

### Can Override?

**YES.** dead_letters table is a cache of permanent failures. It's not the source of truth. If dead_letters is lost, failures are lost but don't affect runtime.

### Can Promote?

**NO.** dead_letters table is a cache. There's no promotion mechanism.

### Can Delete?

**YES.** dead_letters table can be deleted. If deleted, failures are lost but don't affect runtime.

### Classification

**SAFE DERIVATION.** dead_letters table is a cache of permanent failures. It's safe because failures don't affect runtime.

---

## SHADOW AUTHORITY 9: Brain Canonical State Schema (Brain)

### System

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Database:** PostgreSQL  
**Tables:** objects, events, lineage, projections, system_metadata, audit_log  
**Location:** Brain's PostgreSQL database

### Reads From

**NONE.** No readers exist in running code.

### Writes To

**NONE.** No writers exist in running code.

### Can Override?

**UNKNOWN.** Not used at runtime.

### Can Promote?

**UNKNOWN.** Not used at runtime.

### Can Delete?

**UNKNOWN.** Not used at runtime.

### Classification

**CONSTITUTIONAL THEATER.** Brain's canonical state schema is not used at runtime. It's documentation only.

---

## SHADOW AUTHORITY 10: Brain Projection Registry (Brain)

### System

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Database:** PostgreSQL  
**Table:** projection_registry  
**Location:** Brain's PostgreSQL database

### Reads From

**NONE.** No readers exist in running code.

### Writes To

**NONE.** No writers exist in running code.

### Can Override?

**UNKNOWN.** Not used at runtime.

### Can Promote?

**UNKNOWN.** Not used at runtime.

### Can Delete?

**UNKNOWN.** Not used at runtime.

### Classification

**CONSTITUTIONAL THEATER.** Brain's projection registry is not used at runtime. It's documentation only.

---

## SHADOW AUTHORITY 11: Brain Artifact Registry (Brain)

### System

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Database:** PostgreSQL  
**Table:** artifact_registry  
**Location:** Brain's PostgreSQL database

### Reads From

**NONE.** No readers exist in running code.

### Writes To

**NONE.** No writers exist in running code.

### Can Override?

**UNKNOWN.** Not used at runtime.

### Can Promote?

**UNKNOWN.** Not used at runtime.

### Can Delete?

**UNKNOWN.** Not used at runtime.

### Classification

**CONSTITUTIONAL THEATER.** Brain's artifact registry is not used at runtime. It's documentation only.

---

## SUMMARY

### Shadow Authority Inventory

| System | Reads From | Writes To | Can Override? | Can Promote? | Can Delete? | Classification |
|--------|------------|-----------|---------------|--------------|-------------|----------------|
| SQLite (crx-digestion-worker) | article_exists(), search_articles(), get_stats(), get_sources() | save_article(), register_source() | YES | NO | YES | CONSTITUTIONAL VIOLATION |
| SQLite (crx-newsletter-brain) | newsletter_exists(), get_unprocessed_newsletters(), get_newsletters_by_date_range(), get_stats() | save_raw_newsletter(), update_newsletter_analysis(), save_digest() | YES | NO | YES | CONSTITUTIONAL VIOLATION |
| Markdown Files (crx-digestion-worker) | Filesystem reads | archive_article() | YES | NO | YES | CONSTITUTIONAL VIOLATION |
| Markdown Files (crx-newsletter-brain) | Filesystem reads | archive_newsletter() | YES | NO | YES | CONSTITUTIONAL VIOLATION |
| PostgreSQL Events Table (PING) | GET /events endpoints | emitEvent(), emit_event() | NO | NO | NO | SAFE DERIVATION |
| PostgreSQL Knowledge Metrics Table (PING) | get_knowledge_growth_trends() | calculate_daily_knowledge_metrics() | YES | NO | YES | SAFE DERIVATION |
| PostgreSQL Raw Payloads Table (PING) | NONE | (not shown) | YES | NO | YES | SAFE DERIVATION |
| PostgreSQL Dead Letters Table (PING) | NONE | add_to_dead_letter_queue() | YES | NO | YES | SAFE DERIVATION |
| Brain Canonical State Schema (Brain) | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Projection Registry (Brain) | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN | CONSTITUTIONAL THEATER |
| Brain Artifact Registry (Brain) | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN | CONSTITUTIONAL THEATER |

### Critical Findings

1. **SQLite databases are constitutional violations.** SQLite is the authoritative source for application state, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

2. **Markdown files are constitutional violations.** Markdown files are the authoritative archive, not the constitutional event log. This violates the constitutional principle that the event log should be the source of truth.

3. **PostgreSQL events table is safe derivation.** Events table is the constitutional event log. It's not a shadow authority. It's the source of truth for events.

4. **PostgreSQL knowledge_metrics table is safe derivation.** knowledge_metrics table is a materialized view derived from events. It's safe because it can be recalculated from events.

5. **PostgreSQL raw_payloads table is safe derivation.** raw_payloads table is a cache of raw inputs. It's safe because raw inputs can be refetched from sources.

6. **PostgreSQL dead_letters table is safe derivation.** dead_letters table is a cache of permanent failures. It's safe because failures don't affect runtime.

7. **Brain's canonical state schema is constitutional theater.** Brain's canonical state schema is not used at runtime. It's documentation only.

8. **Brain's projection registry is constitutional theater.** Brain's projection registry is not used at runtime. It's documentation only.

9. **Brain's artifact registry is constitutional theater.** Brain's artifact registry is not used at runtime. It's documentation only.

### Answer

**What systems behave like hidden authorities?**
**SQLite databases and markdown files are hidden authorities.** They are the authoritative sources for application state, not the constitutional event log.

**Can they override?**
**YES.** SQLite and markdown files can override the event log. If the event log is lost, SQLite and markdown files can still function.

**Can they promote?**
**NO.** SQLite and markdown files are not caches. They're primary storage. There's no promotion mechanism.

**Can they delete?**
**YES.** SQLite and markdown files can be deleted. If deleted, application state is lost. Events cannot reconstruct state because there's no replay mechanism.

**Classification:**
- **CONSTITUTIONAL VIOLATION:** SQLite databases, Markdown files
- **SAFE DERIVATION:** PostgreSQL events table, knowledge_metrics table, raw_payloads table, dead_letters table
- **CONSTITUTIONAL THEATER:** Brain's canonical state schema, projection registry, artifact registry
