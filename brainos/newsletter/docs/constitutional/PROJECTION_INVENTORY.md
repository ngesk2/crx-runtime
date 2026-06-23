# PROJECTION INVENTORY

**Audit Date:** 2025-01-18  
**Audit Scope:** All projections produced by the civilization  
**Audit Principle:** Inventory reality without modifying application behavior

---

## EXECUTIVE SUMMARY

**The civilization produces 5 distinct projection types across 2 applications.** All projections are currently classified as AUTHORITATIVE (SQLite databases) or ARCHIVE (markdown files). No true PROJECTIONS or CACHES exist. All projections have rebuild paths defined, but rebuild feasibility varies.

---

## PROJECTION CLASSIFICATION

### Classification Definitions

**AUTHORITY:** Source of truth for application state. Mutations write here first.  
**PROJECTION:** Derived state computed from authority. Rebuildable from events.  
**CACHE:** Temporary storage for performance optimization. Rebuildable from authority.  
**ARCHIVE:** Long-term storage for historical records. Immutable once written.

---

## PROJECTION INVENTORY

### 1. SQLite Database: newsletters.db

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\newsletters.db`  
**Application:** crx-newsletter-brain (Yahoo Mail newsletter ingestion)  
**Classification:** AUTHORITY  
**Size:** 45KB

**Tables:**
- `newsletters` (id, message_id, subject, sender, body, word_count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived)
- `digests` (id, type, date, content, generated_at, newsletter_count)
- `newsletter_topics` (id, article_id, topic, confidence, created_at)

**Indexes:**
- idx_newsletters_message_id
- idx_newsletters_received_at
- idx_newsletters_processed_at
- idx_digests_date
- idx_newsletter_topics_article_id
- idx_newsletter_topics_topic

**Source of Truth:** This database is the authoritative source for newsletter and digest state. Mutations write to SQLite first, then emit events to PostgreSQL.

**Rebuild Path:** 
1. Query PostgreSQL events table for NEWSLETTER_CREATED events
2. Query PostgreSQL events table for DIGEST_GENERATED events
3. Reconstruct newsletters table from NEWSLETTER_CREATED payloads
4. Reconstruct digests table from DIGEST_GENERATED payloads
5. Reconstruct newsletter_topics table from NEWSLETTER_CREATED payloads (topics field)

**Rebuild Feasibility:** PARTIAL
- NEWSLETTER_CREATED events contain full newsletter data (message_id, subject, sender, body, word_count, received_at)
- DIGEST_GENERATED events contain digest metadata (type, date, newsletter_count, content_length)
- MISSING: Ollama analysis results (summary, tags, key_ideas, actionable_insights) are NOT in events
- MISSING: newsletter_topics table requires parsing tags field from NEWSLETTER_CREATED events
- MISSING: processed_at timestamp is NOT in events (inferred from event created_at)

**Critical Gap:** Ollama analysis results are not emitted as events. They are written directly to SQLite after Ollama inference completes.

---

### 2. SQLite Database: knowledge.db

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge.db`  
**Application:** crx-digestion-worker (RSS feed ingestion)  
**Classification:** AUTHORITY  
**Size:** Unknown

**Tables:**
- `articles` (id, url, title, summary, source, published_at, processed_at, tags)
- `sources` (id, name, url, type, active)

**Indexes:**
- idx_articles_url
- idx_articles_source
- idx_articles_published

**Source of Truth:** This database is the authoritative source for article and source state. Mutations write to SQLite first, then emit events to PostgreSQL.

**Rebuild Path:**
1. Query PostgreSQL events table for ARTICLE_CREATED events
2. Reconstruct articles table from ARTICLE_CREATED payloads
3. Reconstruct sources table from ARTICLE_CREATED payloads (source field)

**Rebuild Feasibility:** PARTIAL
- ARTICLE_CREATED events contain full article data (url, title, summary, source, published_at, processed_at, tags)
- MISSING: sources table requires deduplication of source field from ARTICLE_CREATED events
- MISSING: active flag for sources is NOT in events (default to 1)

**Critical Gap:** sources table requires manual deduplication logic during rebuild.

---

### 3. Markdown Archives: knowledge/YYYY/MM/*.md

**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\knowledge\`  
**Application:** crx-newsletter-brain (Yahoo Mail newsletter ingestion)  
**Classification:** ARCHIVE  
**Format:** Markdown files with YYYY/MM directory structure

**File Pattern:** `knowledge/YYYY/MM/{slug}.md`

**Content Structure:**
```markdown
# {subject}

**From:** {sender}
**Received:** {received_at}
**Processed:** {processed_at}

## Summary
{summary}

## Tags
{tags}

## Key Ideas
{key_ideas}

## Actionable Insights
{actionable_insights}

## Original Content
{body}[:2000]...
```

**Source of Truth:** Derived from newsletters.db. Written after SQLite write completes.

**Rebuild Path:**
1. Query newsletters.db for all newsletters
2. Generate markdown files from newsletter records
3. Organize by received_at date (YYYY/MM structure)
4. Generate slug from subject

**Rebuild Feasibility:** YES
- All required data exists in newsletters.db
- Archive function (archive.py) is deterministic
- Directory structure is deterministic (based on received_at)
- Slug generation is deterministic (based on subject)

**Event Coverage:** ARCHIVE_WRITTEN events are emitted for each archive write.

---

### 4. Markdown Archives: knowledge/YYYY/MM/*.md

**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\knowledge\`  
**Application:** crx-digestion-worker (RSS feed ingestion)  
**Classification:** ARCHIVE  
**Format:** Markdown files with YYYY/MM directory structure

**File Pattern:** `knowledge/YYYY/MM/{slug}.md`

**Content Structure:**
```markdown
# {title}

**Source:** {source}
**URL:** {url}
**Published:** {published_at}
**Processed:** {processed_at}

## Summary
{summary}

## Tags
{tags}
```

**Source of Truth:** Derived from knowledge.db. Written after SQLite write completes.

**Rebuild Path:**
1. Query knowledge.db for all articles
2. Generate markdown files from article records
3. Organize by published_at date (YYYY/MM structure)
4. Generate slug from title

**Rebuild Feasibility:** YES
- All required data exists in knowledge.db
- Archive function (archive.py) is deterministic
- Directory structure is deterministic (based on published_at)
- Slug generation is deterministic (based on title)

**Event Coverage:** MARKDOWN_WRITTEN events are emitted for each archive write.

---

### 5. Digest Archives: digests/daily-{date}.md

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\`  
**Application:** crx-newsletter-brain (daily digest generation)  
**Classification:** ARCHIVE  
**Format:** Markdown files with daily-{date}.md naming

**File Pattern:** `digests/daily-{date}.md`

**Content Structure:**
```markdown
# Daily Digest - {date}

**Newsletter Count:** {count}
**Generated:** {generated_at}

---

## {subject}

**From:** {sender}

### Summary
{summary}

### Tags
{tags}

### Key Ideas
{key_ideas}

### Actionable Insights
{actionable_insights}

---
```

**Source of Truth:** Derived from newsletters.db (digests table). Written after digest generation completes.

**Rebuild Path:**
1. Query digests table for daily digests
2. Generate markdown files from digest records
3. File naming is deterministic (daily-{date}.md)

**Rebuild Feasibility:** YES
- All required data exists in digests table
- Digest generator (digest_generator.py) is deterministic
- File naming is deterministic (based on date)

**Event Coverage:** DIGEST_GENERATED events are emitted for each digest generation.

---

### 6. Digest Archives: digests/weekly-{date}.md

**Location:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\digests\`  
**Application:** crx-newsletter-brain (weekly report generation)  
**Classification:** ARCHIVE  
**Format:** Markdown files with weekly-{date}.md naming

**File Pattern:** `digests/weekly-{date}.md`

**Content Structure:**
```markdown
# Weekly Intelligence Report

**Week:** {start_date} to {end_date}
**Newsletter Count:** {count}
**Generated:** {generated_at}

## Top Themes
{tags}

---

## Newsletter Summaries

### {subject}
**From:** {sender} | **Date:** {received_at}

{summary}

**Key Ideas:**
{key_ideas}

**Actionable Insights:**
{actionable_insights}

---
```

**Source of Truth:** Derived from newsletters.db. Generated by querying newsletters by date range.

**Rebuild Path:**
1. Query newsletters.db for newsletters in date range
2. Generate weekly report from newsletter records
3. File naming is deterministic (weekly-{date}.md)

**Rebuild Feasibility:** YES
- All required data exists in newsletters.db
- Weekly report generator (digest_generator.py) is deterministic
- File naming is deterministic (based on date)

**Event Coverage:** DIGEST_GENERATED events are emitted for each weekly report generation.

---

## MISSING PROJECTIONS

### Search Indexes
**Status:** MISSING  
**Description:** No full-text search index exists for articles or newsletters.  
**Impact:** Search is limited to SQL LIKE queries (slow, no ranking).  
**Rebuild Path:** Not applicable (does not exist).

### Caches
**Status:** MISSING  
**Description:** No cache layer exists (Redis, in-memory, etc.).  
**Impact:** All queries hit SQLite directly (potential performance bottleneck).  
**Rebuild Path:** Not applicable (does not exist).

### Neo4j Data
**Status:** MISSING  
**Description:** Neo4j container exists in Brain infrastructure but is not used.  
**Impact:** No graph traversal, no relationship queries.  
**Rebuild Path:** Not applicable (does not exist).

### Vector Indexes
**Status:** MISSING  
**Description:** No vector embeddings or vector search exists.  
**Impact:** No semantic search, no similarity search.  
**Rebuild Path:** Not applicable (does not exist).

---

## PROJECTION SUMMARY

| Projection | Type | Classification | Source of Truth | Rebuild Feasibility |
|-----------|------|----------------|-----------------|-------------------|
| newsletters.db | SQLite | AUTHORITY | SQLite itself | PARTIAL (missing Ollama analysis) |
| knowledge.db | SQLite | AUTHORITY | SQLite itself | PARTIAL (missing source deduplication) |
| knowledge/YYYY/MM/*.md (newsletters) | Markdown | ARCHIVE | newsletters.db | YES |
| knowledge/YYYY/MM/*.md (articles) | Markdown | ARCHIVE | knowledge.db | YES |
| digests/daily-{date}.md | Markdown | ARCHIVE | digests table | YES |
| digests/weekly-{date}.md | Markdown | ARCHIVE | newsletters.db | YES |
| Search Indexes | N/A | MISSING | N/A | N/A |
| Caches | N/A | MISSING | N/A | N/A |
| Neo4j Data | N/A | MISSING | N/A | N/A |
| Vector Indexes | N/A | MISSING | N/A | N/A |

---

## CRITICAL FINDINGS

1. **SQLite databases are AUTHORITATIVE, not PROJECTIONS.** This violates constitutional principles. In a constitutional system, the event log should be authoritative, and all state should be derived projections.

2. **Ollama analysis results are not observable.** Summary, tags, key_ideas, and actionable_insights are written directly to SQLite without being emitted as events. This makes newsletters.db only partially rebuildable from events.

3. **No true PROJECTIONS exist.** All derived artifacts (markdown files, digest files) are classified as ARCHIVES, not PROJECTIONS. They are not optimized for query performance.

4. **No CACHES exist.** All queries hit SQLite directly. No performance optimization layer exists.

5. **No SEARCH INDEXES exist.** Search is limited to SQL LIKE queries, which are slow and provide no ranking.

6. **Neo4j and Vector Indexes are MISSING.** Brain infrastructure includes Neo4j and Qdrant containers, but they are not used by applications.

---

## ANSWER

**Every Authority:**
- newsletters.db (SQLite)
- knowledge.db (SQLite)

**Every Projection:**
- None (all derived artifacts are classified as ARCHIVES)

**Every Rebuild Path:**
- newsletters.db: PARTIAL (missing Ollama analysis events)
- knowledge.db: PARTIAL (missing source deduplication logic)
- knowledge/YYYY/MM/*.md (newsletters): YES (from newsletters.db)
- knowledge/YYYY/MM/*.md (articles): YES (from knowledge.db)
- digests/daily-{date}.md: YES (from digests table)
- digests/weekly-{date}.md: YES (from newsletters.db)

**Every Invisible Mutation:**
- Ollama analysis results (summary, tags, key_ideas, actionable_insights) are written to SQLite without event emission
- processed_at timestamp is not emitted in events (inferred from event created_at)
- source deduplication for knowledge.db sources table is not observable

**Every Retrieval Blocker:**
- No full-text search index
- No vector embeddings
- No Neo4j graph data
- No cache layer
- SQLite is authoritative (not event-sourced)
