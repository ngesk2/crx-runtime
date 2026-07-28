# PROJECTION REBUILD MATRIX

**Audit Date:** 2025-01-18  
**Audit Scope:** Rebuild feasibility for every projection  
**Audit Principle:** Determine exact rebuild steps without modifying application behavior

---

## EXECUTIVE SUMMARY

**2 projections are PARTIALLY rebuildable, 4 projections are FULLY rebuildable.** The critical blocker is that Ollama analysis results (summary, tags, key_ideas, actionable_insights) are not emitted as events, making newsletters.db only partially rebuildable. All markdown archives and digest files are fully rebuildable from SQLite databases.

---

## PROJECTION REBUILD MATRIX

### 1. newsletters.db

**Can this be rebuilt?** PARTIAL

**Missing Events:**
- OLLAMA_INFERENCE_REQUEST (for newsletter analysis)
- OLLAMA_INFERENCE_RESPONSE (for newsletter analysis results)
- NEWSLETTER_ANALYZED (for analysis completion)

**Missing Authority Source:**
- Ollama inference results are not stored in PostgreSQL events table
- Ollama inference results are written directly to SQLite after inference completes
- No event emission occurs for Ollama analysis

**Rebuild Steps (PARTIAL):**
1. Query PostgreSQL events table for NEWSLETTER_CREATED events
2. Extract newsletter data from event payloads (message_id, subject, sender, body, word_count, received_at)
3. Insert into newsletters table (message_id, subject, sender, body, word_count, received_at)
4. Set processed_at to event.created_at
5. Set summary, tags, key_ideas, actionable_insights to NULL (cannot rebuild from events)
6. Set archived to 0 (default)
7. Reconstruct newsletter_topics table by parsing tags field from NEWSLETTER_CREATED events

**Rebuild Steps (FULL - requires Ollama re-inference):**
1. Query PostgreSQL events table for NEWSLETTER_CREATED events
2. Extract newsletter data from event payloads (message_id, subject, sender, body, word_count, received_at)
3. For each newsletter, call Ollama to regenerate summary, tags, key_ideas, actionable_insights
4. Insert into newsletters table with full data
5. Set processed_at to current timestamp (not original)
6. Reconstruct newsletter_topics table from tags

**Critical Gap:** Ollama analysis results are not observable. Full rebuild requires re-running Ollama inference on all newsletters, which is expensive and may produce different results.

---

### 2. knowledge.db

**Can this be rebuilt?** PARTIAL

**Missing Events:**
- SOURCE_REGISTERED (for source registration)
- SOURCE_UPDATED (for source updates)

**Missing Authority Source:**
- sources table requires manual deduplication logic
- sources table active flag is not observable from events
- source registration is not emitted as event

**Rebuild Steps (PARTIAL):**
1. Query PostgreSQL events table for ARTICLE_CREATED events
2. Extract article data from event payloads (url, title, summary, source, published_at, processed_at, tags)
3. Insert into articles table (url, title, summary, source, published_at, processed_at, tags)
4. Reconstruct sources table by deduplicating source field from ARTICLE_CREATED events
5. Set active flag to 1 (default) for all sources
6. Set id to auto-increment (not deterministic)

**Rebuild Steps (FULL - requires source registration events):**
1. Query PostgreSQL events table for ARTICLE_CREATED events
2. Extract article data from event payloads
3. Query PostgreSQL events table for SOURCE_REGISTERED events
4. Reconstruct sources table from SOURCE_REGISTERED events
5. Insert into articles table with correct source references

**Critical Gap:** sources table requires manual deduplication logic. Source registration is not observable from events.

---

### 3. knowledge/YYYY/MM/*.md (newsletters)

**Can this be rebuilt?** YES

**Rebuild Steps:**
1. Query newsletters.db for all newsletters
2. For each newsletter:
   - Parse received_at timestamp
   - Generate directory structure (YYYY/MM)
   - Generate slug from subject
   - Generate markdown content from newsletter record
   - Write markdown file to knowledge/YYYY/MM/{slug}.md
3. Emit ARCHIVE_WRITTEN events (optional, for observability)

**Rebuild Feasibility:** YES
- All required data exists in newsletters.db
- Archive function (archive.py) is deterministic
- Directory structure is deterministic (based on received_at)
- Slug generation is deterministic (based on subject)
- Markdown generation is deterministic

**Missing Events:** None (ARCHIVE_WRITTEN events exist)

**Missing Authority Source:** None

---

### 4. knowledge/YYYY/MM/*.md (articles)

**Can this be rebuilt?** YES

**Rebuild Steps:**
1. Query knowledge.db for all articles
2. For each article:
   - Parse published_at timestamp
   - Generate directory structure (YYYY/MM)
   - Generate slug from title
   - Generate markdown content from article record
   - Write markdown file to knowledge/YYYY/MM/{slug}.md
3. Emit MARKDOWN_WRITTEN events (optional, for observability)

**Rebuild Feasibility:** YES
- All required data exists in knowledge.db
- Archive function (archive.py) is deterministic
- Directory structure is deterministic (based on published_at)
- Slug generation is deterministic (based on title)
- Markdown generation is deterministic

**Missing Events:** None (MARKDOWN_WRITTEN events exist)

**Missing Authority Source:** None

---

### 5. digests/daily-{date}.md

**Can this be rebuilt?** YES

**Rebuild Steps:**
1. Query digests table for daily digests
2. For each digest:
   - Parse date field
   - Generate markdown content from digest record
   - Write markdown file to digests/daily-{date}.md
3. Emit DIGEST_GENERATED events (optional, for observability)

**Rebuild Feasibility:** YES
- All required data exists in digests table
- Digest generator (digest_generator.py) is deterministic
- File naming is deterministic (based on date)
- Markdown generation is deterministic

**Missing Events:** None (DIGEST_GENERATED events exist)

**Missing Authority Source:** None

---

### 6. digests/weekly-{date}.md

**Can this be rebuilt?** YES

**Rebuild Steps:**
1. Query newsletters.db for newsletters in date range
2. For each week:
   - Calculate week range (start_of_week to end_of_week)
   - Query newsletters by date range
   - Extract all tags from newsletters
   - Generate weekly report content
   - Write markdown file to digests/weekly-{date}.md
3. Emit DIGEST_GENERATED events (optional, for observability)

**Rebuild Feasibility:** YES
- All required data exists in newsletters.db
- Weekly report generator (digest_generator.py) is deterministic
- File naming is deterministic (based on date)
- Markdown generation is deterministic

**Missing Events:** None (DIGEST_GENERATED events exist)

**Missing Authority Source:** None

---

## MISSING PROJECTIONS

### Search Indexes

**Can this be rebuilt?** N/A (does not exist)

**Rebuild Steps:** Not applicable

**Missing Events:** None (search indexes do not exist)

**Missing Authority Source:** None (search indexes do not exist)

---

### Caches

**Can this be rebuilt?** N/A (does not exist)

**Rebuild Steps:** Not applicable

**Missing Events:** None (caches do not exist)

**Missing Authority Source:** None (caches do not exist)

---

### Neo4j Data

**Can this be rebuilt?** N/A (does not exist)

**Rebuild Steps:** Not applicable

**Missing Events:** None (Neo4j data does not exist)

**Missing Authority Source:** None (Neo4j data does not exist)

---

### Vector Indexes

**Can this be rebuilt?** N/A (does not exist)

**Rebuild Steps:** Not applicable

**Missing Events:** None (vector indexes do not exist)

**Missing Authority Source:** None (vector indexes do not exist)

---

## REBUILD SUMMARY

| Projection | Rebuildable | Missing Events | Missing Authority Source | Rebuild Complexity |
|-----------|-------------|----------------|--------------------------|-------------------|
| newsletters.db | PARTIAL | OLLAMA_INFERENCE_REQUEST, OLLAMA_INFERENCE_RESPONSE, NEWSLETTER_ANALYZED | Ollama inference results | HIGH (requires Ollama re-inference) |
| knowledge.db | PARTIAL | SOURCE_REGISTERED, SOURCE_UPDATED | Source deduplication logic | MEDIUM (requires deduplication) |
| knowledge/YYYY/MM/*.md (newsletters) | YES | None | None | LOW (deterministic) |
| knowledge/YYYY/MM/*.md (articles) | YES | None | None | LOW (deterministic) |
| digests/daily-{date}.md | YES | None | None | LOW (deterministic) |
| digests/weekly-{date}.md | YES | None | None | LOW (deterministic) |
| Search Indexes | N/A | N/A | N/A | N/A |
| Caches | N/A | N/A | N/A | N/A |
| Neo4j Data | N/A | N/A | N/A | N/A |
| Vector Indexes | N/A | N/A | N/A | N/A |

---

## CRITICAL FINDINGS

1. **newsletters.db is only PARTIALLY rebuildable.** Ollama analysis results (summary, tags, key_ideas, actionable_insights) are not emitted as events. Full rebuild requires re-running Ollama inference on all newsletters.

2. **knowledge.db is PARTIALLY rebuildable.** sources table requires manual deduplication logic. Source registration is not observable from events.

3. **All markdown archives are FULLY rebuildable.** All required data exists in SQLite databases. Archive functions are deterministic.

4. **All digest files are FULLY rebuildable.** All required data exists in SQLite databases. Digest generators are deterministic.

5. **No search indexes, caches, Neo4j data, or vector indexes exist.** These are missing projections, not rebuildable projections.

---

## ANSWER

**Can newsletters.db be rebuilt?**
PARTIAL. Missing Ollama inference events. Full rebuild requires re-running Ollama inference on all newsletters.

**Can knowledge.db be rebuilt?**
PARTIAL. Missing source registration events. Rebuild requires manual deduplication logic for sources table.

**Can knowledge/YYYY/MM/*.md (newsletters) be rebuilt?**
YES. All required data exists in newsletters.db. Archive function is deterministic.

**Can knowledge/YYYY/MM/*.md (articles) be rebuilt?**
YES. All required data exists in knowledge.db. Archive function is deterministic.

**Can digests/daily-{date}.md be rebuilt?**
YES. All required data exists in digests table. Digest generator is deterministic.

**Can digests/weekly-{date}.md be rebuilt?**
YES. All required data exists in newsletters.db. Weekly report generator is deterministic.

**Missing Events:**
- OLLAMA_INFERENCE_REQUEST (for newsletter analysis)
- OLLAMA_INFERENCE_RESPONSE (for newsletter analysis results)
- NEWSLETTER_ANALYZED (for analysis completion)
- SOURCE_REGISTERED (for source registration)
- SOURCE_UPDATED (for source updates)

**Missing Authority Source:**
- Ollama inference results (not stored in PostgreSQL events table)
- Source deduplication logic (not observable from events)
