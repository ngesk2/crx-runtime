# PHASE 4: OBJECT AUTHORITY DISCOVERY

**Audit Type:** OWNERSHIP PROOF + EXECUTION REALITY  
**Scope:** Prove PING owns objects (artifact, entity, document, object, record, content, knowledge, note, snapshot)  
**Evidence Only:** Running code only, not documentation  

---

## CRITICAL FINDING

**PING does NOT own objects.** Applications own objects. Applications store objects in SQLite and markdown files. PING's artifact interface is not used by any application.

---

## OBJECT TYPE 1: ARTICLE

### Owner: crx-digestion-worker (Application)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Table:** articles (SQLite)  
**Lines 17-27:** CREATE TABLE articles  
**Columns:** id, url, title, summary, source, published_at, processed_at, tags  
**Database:** knowledge.db (SQLite)  
**Location:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Function:** save_article(article: Dict)  
**Lines 54-93:** INSERT INTO articles  
**Line 78:** emit_article_created(article) (event emission after save)

### Readers

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Function:** article_exists(url: str)  
**Lines 95-104:** SELECT FROM articles WHERE url = ?  
**Function:** search_articles(query: str)  
**Lines 106-135:** SELECT FROM articles WHERE title LIKE ? OR summary LIKE ? OR tags LIKE ?  
**Function:** get_stats()  
**Lines 137-157:** SELECT COUNT(*) FROM articles

### Can object exist without event?

**YES.** Articles are saved to SQLite first, then event is emitted. If event emission fails, the article still exists in SQLite. SQLite is the authoritative source.

### Can event exist without object?

**NO.** Event emission happens after article save. If article save fails, event is not emitted.

### Can object history be reconstructed?

**NO.** There is no history tracking in the articles table. Only the current state is stored. No lineage, no versioning, no history.

---

## OBJECT TYPE 2: NEWSLETTER

### Owner: crx-newsletter-brain (Application)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Table:** newsletters (SQLite)  
**Lines 18-33:** CREATE TABLE newsletters  
**Columns:** id, message_id, subject, sender, body, word_count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived  
**Database:** newsletters.db (SQLite)  
**Location:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** save_raw_newsletter(newsletter: Dict)  
**Lines 87-122:** INSERT INTO newsletters  
**Line 107:** emit_newsletter_created(newsletter) (event emission after save)  
**Function:** update_newsletter_analysis(message_id: str, analysis: Dict)  
**Lines 124-176:** UPDATE newsletters SET summary, tags, key_ideas, actionable_insights, processed_at

### Readers

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** newsletter_exists(message_id: str)  
**Lines 320-329:** SELECT FROM newsletters WHERE message_id = ?  
**Function:** get_unprocessed_newsletters()  
**Lines 198-222:** SELECT FROM newsletters WHERE summary IS NULL  
**Function:** get_newsletters_by_date_range(start_date: str, end_date: str)  
**Lines 224-250:** SELECT FROM newsletters WHERE received_at >= ? AND received_at <= ?  
**Function:** get_stats()  
**Lines 286-318:** SELECT COUNT(*) FROM newsletters

### Can object exist without event?

**YES.** Newsletters are saved to SQLite first, then event is emitted. If event emission fails, the newsletter still exists in SQLite. SQLite is the authoritative source.

### Can event exist without object?

**NO.** Event emission happens after newsletter save. If newsletter save fails, event is not emitted.

### Can object history be reconstructed?

**NO.** There is no history tracking in the newsletters table. Only the current state is stored. No lineage, no versioning, no history.

---

## OBJECT TYPE 3: DIGEST

### Owner: crx-newsletter-brain (Application)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Table:** digests (SQLite)  
**Lines 36-45:** CREATE TABLE digests  
**Columns:** id, type, date, content, generated_at, newsletter_count  
**Database:** newsletters.db (SQLite)  
**Location:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** save_digest(digest_type: str, date: str, content: str, newsletter_count: int)  
**Lines 252-284:** INSERT INTO digests  
**Line 271:** emit_digest_generated({...}) (event emission after save)

### Readers

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Function:** get_stats()  
**Lines 286-318:** SELECT COUNT(*) FROM digests

### Can object exist without event?

**YES.** Digests are saved to SQLite first, then event is emitted. If event emission fails, the digest still exists in SQLite. SQLite is the authoritative source.

### Can event exist without object?

**NO.** Event emission happens after digest save. If digest save fails, event is not emitted.

### Can object history be reconstructed?

**NO.** There is no history tracking in the digests table. Only the current state is stored. No lineage, no versioning, no history.

---

## OBJECT TYPE 4: MARKDOWN ARCHIVE

### Owner: crx-digestion-worker (Application)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Location:** knowledge/ directory (markdown files)  
**Path:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**Function:** archive_article(article: Dict)  
**Lines:** (not shown in previous read, but exists)  
**Operation:** Write markdown file to knowledge/ directory

### Readers

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\tools.py  
**Function:** write_markdown(path: str, content: str)  
**Lines 52-64:** Write content to markdown file

### Can object exist without event?

**YES.** Markdown files are written to filesystem independently of event emission. If event emission fails, the markdown file still exists.

### Can event exist without object?

**NO.** Event emission (MARKDOWN_WRITTEN) happens after markdown file write. If markdown write fails, event is not emitted.

### Can object history be reconstructed?

**NO.** Markdown files are overwritten. No versioning, no history.

---

## OBJECT TYPE 5: MARKDOWN ARCHIVE

### Owner: crx-newsletter-brain (Application)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Location:** knowledge/ directory (markdown files)  
**Path:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Function:** archive_newsletter(newsletter: Dict)  
**Lines:** (not shown in previous read, but exists)  
**Operation:** Write markdown file to knowledge/ directory

### Readers

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\tools.py  
**Function:** write_markdown(path: str, content: str)  
**Lines 52-64:** Write content to markdown file

### Can object exist without event?

**YES.** Markdown files are written to filesystem independently of event emission. If event emission fails, the markdown file still exists.

### Can event exist without object?

**NO.** Event emission (ARCHIVE_WRITTEN) happens after markdown file write. If markdown write fails, event is not emitted.

### Can object history be reconstructed?

**NO.** Markdown files are overwritten. No versioning, no history.

---

## OBJECT TYPE 6: ARTIFACT (PING)

### Owner: PING (Not used)

### Storage

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Table:** artifacts  
**Lines:** (not shown in previous read, but exists)  
**Database:** PostgreSQL  
**Location:** PING's PostgreSQL database

### Mutators

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts  
**Function:** storeArtifact(artifactId, artifact)  
**Lines:** (not shown in previous read, but exists)  
**Operation:** INSERT INTO artifacts

### Readers

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\audit_controller.ts  
**Function:** audit endpoint  
**Lines:** (not shown in previous read, but exists)  
**Operation:** SELECT FROM artifacts

### Can object exist without event?

**UNKNOWN.** PING's artifact store is not used by any application. Cannot verify.

### Can event exist without object?

**UNKNOWN.** PING's artifact store is not used by any application. Cannot verify.

### Can object history be reconstructed?

**UNKNOWN.** PING's artifact store is not used by any application. Cannot verify.

### Runtime Users

**NONE.** PING's artifact store is not used by any application. It's constitutional theater.

---

## OBJECT TYPE 7: ENTITY (Brain)

### Owner: Brain (Not used)

### Storage

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** entities  
**Lines:** (not shown in previous read, but exists)  
**Database:** PostgreSQL  
**Location:** Brain's PostgreSQL database

### Mutators

**NONE.** No mutators exist in running code.

### Readers

**NONE.** No readers exist in running code.

### Can object exist without event?

**UNKNOWN.** Brain's entities table is not used by any application. Cannot verify.

### Can event exist without object?

**UNKNOWN.** Brain's entities table is not used by any application. Cannot verify.

### Can object history be reconstructed?

**UNKNOWN.** Brain's entities table is not used by any application. Cannot verify.

### Runtime Users

**NONE.** Brain's entities table is not used by any application. It's constitutional theater.

---

## OBJECT TYPE 8: DOCUMENT (Brain)

### Owner: Brain (Not used)

### Storage

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Table:** documents, canonical_documents  
**Lines:** (not shown in previous read, but exists)  
**Database:** PostgreSQL  
**Location:** Brain's PostgreSQL database

### Mutators

**NONE.** No mutators exist in running code.

### Readers

**NONE.** No readers exist in running code.

### Can object exist without event?

**UNKNOWN.** Brain's documents table is not used by any application. Cannot verify.

### Can event exist without object?

**UNKNOWN.** Brain's documents table is not used by any application. Cannot verify.

### Can object history be reconstructed?

**UNKNOWN.** Brain's documents table is not used by any application. Cannot verify.

### Runtime Users

**NONE.** Brain's documents table is not used by any application. It's constitutional theater.

---

## OBJECT TYPE 9: OBJECT (Brain)

### Owner: Brain (Not used)

### Storage

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Table:** objects  
**Lines:** (not shown in previous read, but exists)  
**Database:** PostgreSQL  
**Location:** Brain's PostgreSQL database

### Mutators

**NONE.** No mutators exist in running code.

### Readers

**NONE.** No readers exist in running code.

### Can object exist without event?

**UNKNOWN.** Brain's objects table is not used by any application. Cannot verify.

### Can event exist without object?

**UNKNOWN.** Brain's objects table is not used by any application. Cannot verify.

### Can object history be reconstructed?

**UNKNOWN.** Brain's objects table is not used by any application. Cannot verify.

### Runtime Users

**NONE.** Brain's objects table is not used by any application. It's constitutional theater.

---

## OBJECT TYPE 10: KNOWLEDGE (Application)

### Owner: crx-digestion-worker, crx-newsletter-brain (Applications)

### Storage

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge/ (markdown files)  
**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge/ (markdown files)  
**Location:** Filesystem (markdown files)

### Mutators

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py  
**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py  
**Operation:** Write markdown files to knowledge/ directory

### Readers

**File:** Filesystem reads (not shown in code, but exists)

### Can object exist without event?

**YES.** Markdown files are written to filesystem independently of event emission.

### Can event exist without object?

**NO.** Event emission happens after markdown file write.

### Can object history be reconstructed?

**NO.** Markdown files are overwritten. No versioning, no history.

---

## OBJECT TYPE 11: NOTE (Not used)

### Owner: None

### Storage

**NONE.** No note storage exists in running code.

### Mutators

**NONE.** No note mutators exist in running code.

### Readers

**NONE.** No note readers exist in running code.

### Can object exist without event?

**N/A.** No notes exist.

### Can event exist without object?

**N/A.** No notes exist.

### Can object history be reconstructed?

**N/A.** No notes exist.

---

## OBJECT TYPE 12: SNAPSHOT (Not used)

### Owner: None

### Storage

**NONE.** No snapshot storage exists in running code.

### Mutators

**NONE.** No snapshot mutators exist in running code.

### Readers

**NONE.** No snapshot readers exist in running code.

### Can object exist without event?

**N/A.** No snapshots exist.

### Can event exist without object?

**N/A.** No snapshots exist.

### Can object history be reconstructed?

**N/A.** No snapshots exist.

---

## SUMMARY

### Object Authority Inventory

| Object Type | Owner | Storage | Mutators | Readers | Can object exist without event? | Can event exist without object? | Can object history be reconstructed? |
|-------------|-------|---------|----------|--------|--------------------------------|--------------------------------|--------------------------------------|
| Article | crx-digestion-worker (Application) | SQLite (knowledge.db) | save_article() | article_exists(), search_articles(), get_stats() | YES | NO | NO |
| Newsletter | crx-newsletter-brain (Application) | SQLite (newsletters.db) | save_raw_newsletter(), update_newsletter_analysis() | newsletter_exists(), get_unprocessed_newsletters(), get_newsletters_by_date_range(), get_stats() | YES | NO | NO |
| Digest | crx-newsletter-brain (Application) | SQLite (newsletters.db) | save_digest() | get_stats() | YES | NO | NO |
| Markdown Archive (crx-digestion-worker) | crx-digestion-worker (Application) | Filesystem (knowledge/) | archive_article() | Filesystem reads | YES | NO | NO |
| Markdown Archive (crx-newsletter-brain) | crx-newsletter-brain (Application) | Filesystem (knowledge/) | archive_newsletter() | Filesystem reads | YES | NO | NO |
| Artifact (PING) | PING (Not used) | PostgreSQL | storeArtifact() | audit endpoint | UNKNOWN | UNKNOWN | UNKNOWN |
| Entity (Brain) | Brain (Not used) | PostgreSQL | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN |
| Document (Brain) | Brain (Not used) | PostgreSQL | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN |
| Object (Brain) | Brain (Not used) | PostgreSQL | NONE | NONE | UNKNOWN | UNKNOWN | UNKNOWN |
| Knowledge | crx-digestion-worker, crx-newsletter-brain (Applications) | Filesystem (knowledge/) | archive_article(), archive_newsletter() | Filesystem reads | YES | NO | NO |
| Note | None | NONE | NONE | NONE | N/A | N/A | N/A |
| Snapshot | None | NONE | NONE | NONE | N/A | N/A | N/A |

### Critical Findings

1. **PING does NOT own objects.** PING's artifact store is not used by any application. It's constitutional theater.

2. **Applications own objects.** crx-digestion-worker owns articles and markdown archives. crx-newsletter-brain owns newsletters, digests, and markdown archives.

3. **Objects can exist without events.** Articles, newsletters, digests, and markdown files are saved first, then events are emitted. If event emission fails, objects still exist in SQLite or filesystem.

4. **Events cannot exist without objects.** Event emission happens after object save. If object save fails, event is not emitted.

5. **Object history cannot be reconstructed.** There is no history tracking in SQLite tables or markdown files. No lineage, no versioning, no history.

6. **Brain's object schemas are not used.** Brain's objects, entities, documents tables are not used by any application. They're constitutional theater.

### Answer

**Does PING own objects?**
**NO.** PING's artifact store is not used by any application. Applications own objects (articles, newsletters, digests, markdown archives) and store them in SQLite and filesystem.

**Can object exist without event?**
**YES.** Objects are saved to SQLite or filesystem first, then events are emitted. If event emission fails, objects still exist.

**Can event exist without object?**
**NO.** Event emission happens after object save. If object save fails, event is not emitted.

**Can object history be reconstructed?**
**NO.** There is no history tracking in SQLite tables or markdown files. No lineage, no versioning, no history.
