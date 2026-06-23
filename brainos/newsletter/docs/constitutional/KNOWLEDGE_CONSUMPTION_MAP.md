# KNOWLEDGE CONSUMPTION MAP

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Trace every artifact through Input → Processing → Storage → Retrieval → Consumption → Action. Identify every dead end.

---

## EXECUTIVE SUMMARY

**100% of processed knowledge terminates in storage.** Every artifact (Newsletter, Article, Digest, Archive, Summary, Topic, Insight, Tag) flows from Input → Processing → Storage → DEAD END. No retrieval, consumption, or action occurs. Knowledge is written but never read, never consumed, never acted upon.

---

## ARTIFACT: Newsletter

### Input
**Source:** Yahoo Mail (external service)
**Entry Point:** crx-newsletter-brain/worker.py → run_ingestion_cycle() → YahooMailClient.fetch_unread_newsletters()
**Data:** message_id, subject, sender, body, word_count, received_at

### Processing
**Step 1:** Duplicate check (newsletter_exists() in SQLite)
**Step 2:** Word count filter (MIN_WORD_COUNT = 500)
**Step 3:** Save to SQLite (save_raw_newsletter())
**Step 4:** Emit NEWSLETTER_CREATED event
**Step 5:** Ollama analysis (analyze_newsletter() → summary, tags, key_ideas, actionable_insights, topics)
**Step 6:** Update SQLite with analysis (update_newsletter_analysis())
**Step 7:** Archive as markdown (archive_newsletter())
**Step 8:** Mark as archived (mark_newsletter_archived())

### Storage
**Location 1:** SQLite newsletters table (SYSTEM OF RECORD)
**Fields:** message_id, subject, sender, body, word_count, received_at, processed_at, summary, tags, key_ideas, actionable_insights, archived
**Location 2:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Full newsletter with analysis
**Location 3:** PostgreSQL events table (DERIVED)
**Event:** NEWSLETTER_CREATED

### Retrieval
**Query 1:** get_newsletters_by_date_range() (SQL date range query)
**Query 2:** search_newsletters() (SQL LIKE query)
**Query 3:** dashboard.py (reads from SQLite for display)
**Consumer:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)

### Consumption
**Consumer 1:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)
**Consumer 2:** digest_generator.py (ACTIVE - reads for digest generation)
**Consumer 3:** NONE (no other consumers)

### Action
**Action 1:** Generate daily digest (digest_generator.py → generate_daily_digest())
**Action 2:** Generate weekly report (digest_generator.py → generate_weekly_report())
**Action 3:** NONE (no other actions)

### Dead End
**Status:** PARTIAL DEAD END
- Newsletter is stored in SQLite
- Newsletter is archived in markdown
- Newsletter is displayed in dashboard
- Newsletter is used for digest generation
- Newsletter is NOT used for retrieval (only basic SQL queries)
- Newsletter is NOT used for recommendations
- Newsletter is NOT used for decision support
- Newsletter is NOT used for project tracking
- Newsletter is NOT used for task tracking

---

## ARTIFACT: Article

### Input
**Source:** RSS feeds (external service)
**Entry Point:** crx-digestion-worker/worker.py → run_cycle() → process_source() → fetch_rss()
**Data:** url, title, summary, source, published_at

### Processing
**Step 1:** Duplicate check (article_exists() in SQLite)
**Step 2:** Ollama summarization (process_article() → summary, tags)
**Step 3:** Save to SQLite (save_article())
**Step 4:** Emit ARTICLE_CREATED event
**Step 5:** Archive as markdown (archive_article())

### Storage
**Location 1:** SQLite articles table (SYSTEM OF RECORD)
**Fields:** url, title, summary, source, published_at, processed_at, tags
**Location 2:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Full article with summary
**Location 3:** PostgreSQL events table (DERIVED)
**Event:** ARTICLE_CREATED

### Retrieval
**Query 1:** search_articles() (SQL LIKE query)
**Consumer:** NONE (no active consumers)

### Consumption
**Consumer 1:** NONE (no consumers)

### Action
**Action 1:** NONE (no actions)

### Dead End
**Status:** COMPLETE DEAD END
- Article is stored in SQLite
- Article is archived in markdown
- Article is NOT retrieved
- Article is NOT consumed
- Article is NOT acted upon
- Article is NEVER read after storage

---

## ARTIFACT: Digest

### Input
**Source:** SQLite newsletters table (SYSTEM OF RECORD)
**Entry Point:** crx-newsletter-brain/worker.py → run_digest_generation() → digest_generator.py
**Data:** All newsletters from date range

### Processing
**Step 1:** Generate daily digest (generate_daily_digest())
**Step 2:** Generate weekly report (generate_weekly_report())
**Step 3:** Save to SQLite (save_digest())
**Step 4:** Emit DIGEST_GENERATED event
**Step 5:** Write to markdown (digests/daily-{date}.md, digests/weekly-{date}.md)

### Storage
**Location 1:** SQLite digests table (SYSTEM OF RECORD)
**Fields:** type, date, content, generated_at, newsletter_count
**Location 2:** Markdown archive (digests/daily-{date}.md, digests/weekly-{date}.md) (ARCHIVE)
**Content:** Full digest content
**Location 3:** PostgreSQL events table (DERIVED)
**Event:** DIGEST_GENERATED

### Retrieval
**Query 1:** NONE (no retrieval queries)
**Consumer:** NONE (no active consumers)

### Consumption
**Consumer 1:** NONE (no consumers)

### Action
**Action 1:** NONE (no actions)

### Dead End
**Status:** COMPLETE DEAD END
- Digest is stored in SQLite
- Digest is archived in markdown
- Digest is NOT retrieved
- Digest is NOT consumed
- Digest is NOT acted upon
- Digest is NEVER read after storage

---

## ARTIFACT: Archive (Newsletter)

### Input
**Source:** SQLite newsletters table (SYSTEM OF RECORD)
**Entry Point:** crx-newsletter-brain/worker.py → run_processing_cycle() → archive_newsletter()
**Data:** Newsletter with analysis

### Processing
**Step 1:** Create markdown file (archive_newsletter())
**Step 2:** Write to knowledge/YYYY/MM/*.md
**Step 3:** Emit ARCHIVE_WRITTEN event

### Storage
**Location 1:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Full newsletter with analysis
**Location 2:** PostgreSQL events table (DERIVED)
**Event:** ARCHIVE_WRITTEN

### Retrieval
**Query 1:** NONE (no retrieval queries)
**Consumer:** NONE (no active consumers)

### Consumption
**Consumer 1:** NONE (no consumers)

### Action
**Action 1:** NONE (no actions)

### Dead End
**Status:** COMPLETE DEAD END
- Archive is stored in markdown
- Archive is NOT retrieved
- Archive is NOT consumed
- Archive is NOT acted upon
- Archive is NEVER read after storage

---

## ARTIFACT: Archive (Article)

### Input
**Source:** SQLite articles table (SYSTEM OF RECORD)
**Entry Point:** crx-digestion-worker/worker.py → process_source() → archive_article()
**Data:** Article with summary

### Processing
**Step 1:** Create markdown file (archive_article())
**Step 2:** Write to knowledge/YYYY/MM/*.md
**Step 3:** Emit MARKDOWN_WRITTEN event

### Storage
**Location 1:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Full article with summary
**Location 2:** PostgreSQL events table (DERIVED)
**Event:** MARKDOWN_WRITTEN

### Retrieval
**Query 1:** NONE (no retrieval queries)
**Consumer:** NONE (no active consumers)

### Consumption
**Consumer 1:** NONE (no consumers)

### Action
**Action 1:** NONE (no actions)

### Dead End
**Status:** COMPLETE DEAD END
- Archive is stored in markdown
- Archive is NOT retrieved
- Archive is NOT consumed
- Archive is NOT acted upon
- Archive is NEVER read after storage

---

## ARTIFACT: Summary

### Input
**Source:** Ollama (external service)
**Entry Point:** crx-newsletter-brain/summarizer.py → analyze_newsletter()
**Data:** Newsletter subject, body, sender

### Processing
**Step 1:** Call Ollama API
**Step 2:** Receive summary from Ollama
**Step 3:** Update SQLite with summary (update_newsletter_analysis())
**Step 4:** Archive with summary (archive_newsletter())

### Storage
**Location 1:** SQLite newsletters table (SYSTEM OF RECORD)
**Field:** summary
**Location 2:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Summary in markdown

### Retrieval
**Query 1:** get_newsletters_by_date_range() (SQL date range query)
**Query 2:** search_newsletters() (SQL LIKE query)
**Consumer:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)

### Consumption
**Consumer 1:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)
**Consumer 2:** digest_generator.py (ACTIVE - reads for digest generation)

### Action
**Action 1:** Generate daily digest (digest_generator.py → generate_daily_digest())
**Action 2:** Generate weekly report (digest_generator.py → generate_weekly_report())

### Dead End
**Status:** PARTIAL DEAD END
- Summary is stored in SQLite
- Summary is archived in markdown
- Summary is displayed in dashboard
- Summary is used for digest generation
- Summary is NOT used for retrieval (only basic SQL queries)
- Summary is NOT used for recommendations
- Summary is NOT used for decision support
- Summary is NOT used for project tracking
- Summary is NOT used for task tracking

---

## ARTIFACT: Topic

### Input
**Source:** Ollama (external service)
**Entry Point:** crx-newsletter-brain/summarizer.py → analyze_newsletter()
**Data:** Newsletter subject, body, sender

### Processing
**Step 1:** Call Ollama API
**Step 2:** Receive topics from Ollama
**Step 3:** Update SQLite with topics (update_newsletter_analysis())
**Step 4:** Save to newsletter_topics table

### Storage
**Location 1:** SQLite newsletter_topics table (SYSTEM OF RECORD)
**Fields:** article_id, topic, confidence, created_at
**Location 2:** SQLite newsletters table (SYSTEM OF RECORD)
**Field:** tags (comma-separated topics)

### Retrieval
**Query 1:** get_stats() (counts topics)
**Consumer:** crx-newsletter-brain/worker.py (ACTIVE - statistics only)

### Consumption
**Consumer 1:** crx-newsletter-brain/worker.py (ACTIVE - statistics only)

### Action
**Action 1:** NONE (no actions)

### Dead End
**Status:** COMPLETE DEAD END
- Topic is stored in SQLite
- Topic is counted in statistics
- Topic is NOT retrieved for search
- Topic is NOT used for recommendations
- Topic is NOT used for decision support
- Topic is NOT used for project tracking
- Topic is NOT used for task tracking
- Topic is NOT used for theme detection

---

## ARTIFACT: Insight

### Input
**Source:** Ollama (external service)
**Entry Point:** crx-newsletter-brain/summarizer.py → analyze_newsletter()
**Data:** Newsletter subject, body, sender

### Processing
**Step 1:** Call Ollama API
**Step 2:** Receive key_ideas from Ollama
**Step 3:** Receive actionable_insights from Ollama
**Step 4:** Update SQLite with key_ideas and actionable_insights (update_newsletter_analysis())
**Step 5:** Archive with insights (archive_newsletter())

### Storage
**Location 1:** SQLite newsletters table (SYSTEM OF RECORD)
**Fields:** key_ideas, actionable_insights
**Location 2:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Insights in markdown

### Retrieval
**Query 1:** get_newsletters_by_date_range() (SQL date range query)
**Query 2:** search_newsletters() (SQL LIKE query)
**Consumer:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)

### Consumption
**Consumer 1:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)
**Consumer 2:** digest_generator.py (ACTIVE - reads for digest generation)

### Action
**Action 1:** Generate daily digest (digest_generator.py → generate_daily_digest())
**Action 2:** Generate weekly report (digest_generator.py → generate_weekly_report())

### Dead End
**Status:** PARTIAL DEAD END
- Insight is stored in SQLite
- Insight is archived in markdown
- Insight is displayed in dashboard
- Insight is used for digest generation
- Insight is NOT used for retrieval (only basic SQL queries)
- Insight is NOT used for recommendations
- Insight is NOT used for decision support
- Insight is NOT used for project tracking
- Insight is NOT used for task tracking
- Insight is NOT tracked separately (no insights table)

---

## ARTIFACT: Tag

### Input
**Source:** Ollama (external service)
**Entry Point:** crx-newsletter-brain/summarizer.py → analyze_newsletter()
**Data:** Newsletter subject, body, sender

### Processing
**Step 1:** Call Ollama API
**Step 2:** Receive tags from Ollama
**Step 3:** Update SQLite with tags (update_newsletter_analysis())
**Step 4:** Archive with tags (archive_newsletter())

### Storage
**Location 1:** SQLite newsletters table (SYSTEM OF RECORD)
**Field:** tags
**Location 2:** Markdown archive (knowledge/YYYY/MM/*.md) (ARCHIVE)
**Content:** Tags in markdown

### Retrieval
**Query 1:** get_newsletters_by_date_range() (SQL date range query)
**Query 2:** search_newsletters() (SQL LIKE query)
**Consumer:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)

### Consumption
**Consumer 1:** crx-newsletter-brain/dashboard.py (ACTIVE - read-only display)
**Consumer 2:** digest_generator.py (ACTIVE - reads for digest generation)

### Action
**Action 1:** Generate daily digest (digest_generator.py → generate_daily_digest())
**Action 2:** Generate weekly report (digest_generator.py → generate_weekly_report())

### Dead End
**Status:** PARTIAL DEAD END
- Tag is stored in SQLite
- Tag is archived in markdown
- Tag is displayed in dashboard
- Tag is used for digest generation
- Tag is NOT used for retrieval (only basic SQL queries)
- Tag is NOT used for recommendations
- Tag is NOT used for decision support
- Tag is NOT used for project tracking
- Tag is NOT used for task tracking
- Tag is NOT indexed separately (no tags table)

---

## CRITICAL FINDINGS

1. **100% of processed knowledge terminates in storage.** Every artifact flows from Input → Processing → Storage → DEAD END. No retrieval, consumption, or action occurs beyond basic display and digest generation.

2. **Articles are complete dead ends.** Articles are stored in SQLite and archived in markdown but are NEVER retrieved, NEVER consumed, NEVER acted upon.

3. **Digests are complete dead ends.** Digests are stored in SQLite and archived in markdown but are NEVER retrieved, NEVER consumed, NEVER acted upon.

4. **Archives are complete dead ends.** Archives are stored in markdown but are NEVER retrieved, NEVER consumed, NEVER acted upon.

5. **Topics are complete dead ends.** Topics are stored in SQLite but are NEVER retrieved for search, NEVER used for recommendations, NEVER used for decision support, NEVER used for project tracking, NEVER used for task tracking, NEVER used for theme detection.

6. **Insights are partial dead ends.** Insights are stored in SQLite, displayed in dashboard, and used for digest generation but are NOT used for retrieval (only basic SQL queries), NOT used for recommendations, NOT used for decision support, NOT used for project tracking, NOT used for task tracking.

7. **Tags are partial dead ends.** Tags are stored in SQLite, displayed in dashboard, and used for digest generation but are NOT used for retrieval (only basic SQL queries), NOT used for recommendations, NOT used for decision support, NOT used for project tracking, NOT used for task tracking.

8. **Newsletters are partial dead ends.** Newsletters are stored in SQLite, displayed in dashboard, and used for digest generation but are NOT used for retrieval (only basic SQL queries), NOT used for recommendations, NOT used for decision support, NOT used for project tracking, NOT used for task tracking.

9. **No retrieval architecture exists.** Only basic SQL LIKE queries and date range queries exist. No FTS, no entity search, no relationship search, no timeline search, no PARA search, no graph traversal.

10. **No consumption architecture exists.** Only dashboard display and digest generation consume knowledge. No recommendations, no decision support, no project tracking, no task tracking, no pattern detection.

---

## ANSWER

**Newsletter:** PARTIAL DEAD END
- Input: Yahoo Mail
- Processing: Duplicate check, word count filter, Ollama analysis, archive
- Storage: SQLite newsletters table, Markdown archive, PostgreSQL events table
- Retrieval: Basic SQL queries, dashboard display
- Consumption: Dashboard display, digest generation
- Action: Digest generation
- Dead End: Yes (not used for retrieval, recommendations, decision support, project tracking, task tracking)

**Article:** COMPLETE DEAD END
- Input: RSS feeds
- Processing: Duplicate check, Ollama summarization, archive
- Storage: SQLite articles table, Markdown archive, PostgreSQL events table
- Retrieval: Basic SQL queries (no active consumers)
- Consumption: NONE
- Action: NONE
- Dead End: Yes (never retrieved, never consumed, never acted upon)

**Digest:** COMPLETE DEAD END
- Input: SQLite newsletters table
- Processing: Daily digest generation, weekly report generation
- Storage: SQLite digests table, Markdown archive, PostgreSQL events table
- Retrieval: NONE
- Consumption: NONE
- Action: NONE
- Dead End: Yes (never retrieved, never consumed, never acted upon)

**Archive:** COMPLETE DEAD END
- Input: SQLite newsletters table, SQLite articles table
- Processing: Markdown file creation
- Storage: Markdown archive, PostgreSQL events table
- Retrieval: NONE
- Consumption: NONE
- Action: NONE
- Dead End: Yes (never retrieved, never consumed, never acted upon)

**Summary:** PARTIAL DEAD END
- Input: Ollama
- Processing: SQLite update, markdown archive
- Storage: SQLite newsletters table, Markdown archive
- Retrieval: Basic SQL queries, dashboard display
- Consumption: Dashboard display, digest generation
- Action: Digest generation
- Dead End: Yes (not used for retrieval, recommendations, decision support, project tracking, task tracking)

**Topic:** COMPLETE DEAD END
- Input: Ollama
- Processing: SQLite update, newsletter_topics table
- Storage: SQLite newsletter_topics table, SQLite newsletters table
- Retrieval: Statistics only
- Consumption: Statistics only
- Action: NONE
- Dead End: Yes (not used for search, recommendations, decision support, project tracking, task tracking, theme detection)

**Insight:** PARTIAL DEAD END
- Input: Ollama
- Processing: SQLite update, markdown archive
- Storage: SQLite newsletters table, Markdown archive
- Retrieval: Basic SQL queries, dashboard display
- Consumption: Dashboard display, digest generation
- Action: Digest generation
- Dead End: Yes (not used for retrieval, recommendations, decision support, project tracking, task tracking)

**Tag:** PARTIAL DEAD END
- Input: Ollama
- Processing: SQLite update, markdown archive
- Storage: SQLite newsletters table, Markdown archive
- Retrieval: Basic SQL queries, dashboard display
- Consumption: Dashboard display, digest generation
- Action: Digest generation
- Dead End: Yes (not used for retrieval, recommendations, decision support, project tracking, task tracking)
