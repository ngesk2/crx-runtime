# INFORMATION FLOW

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Trace Input → Processing → Storage → Retrieval → Output. Determine where information enters, where information mutates, where information is lost, where information becomes unreachable.

---

## EXECUTIVE SUMMARY

**Information flow is fragmented.** Information enters from Yahoo Mail and RSS feeds. Information mutates during Ollama analysis and Ollama summarization. Information is stored in SQLite and PostgreSQL events table. Information is lost during archive writes (never read). Information becomes unreachable after storage (never retrieved except by dashboard). 100% of processed information terminates in storage with no retrieval or consumption.

---

## FLOW 1: Newsletter Ingestion

### Input
**Where Information Enters:** Yahoo Mail (external service)
**Entry Point:** crx-newsletter-brain/worker.py → run_ingestion_cycle() → YahooMailClient.fetch_unread_newsletters()
**Data:** message_id, subject, sender, body, word_count, received_at

### Processing
**Where Information Mutates:** crx-newsletter-brain/worker.py → run_ingestion_cycle()
**Mutations:**
- Duplicate check (newsletter_exists())
- Word count filter (word_count >= MIN_WORD_COUNT)
- SQLite write (save_raw_newsletter())
- Event emission (NEWSLETTER_CREATED)

### Storage
**Where Information Is Stored:** SQLite newsletters table
**Data:** message_id, subject, sender, body, word_count, received_at

### Retrieval
**Where Information Is Retrieved:** crx-newsletter-brain/dashboard.py
**Retrieval:** get_newsletters_by_date_range(), search_newsletters()

### Output
**Where Information Is Output:** Dashboard display
**Output:** Newsletter display in browser

### Information Loss
**Where Information Is Lost:** NONE (no information loss during newsletter ingestion)

### Information Unreachable
**Where Information Becomes Unreachable:** NONE (newsletter information is reachable via dashboard)

---

## FLOW 2: Newsletter Analysis

### Input
**Where Information Enters:** SQLite newsletters table (unprocessed newsletter)
**Entry Point:** crx-newsletter-brain/worker.py → run_processing_cycle() → get_unprocessed_newsletters()
**Data:** message_id, subject, sender, body, word_count, received_at

### Processing
**Where Information Mutates:** crx-newsletter-brain/worker.py → run_processing_cycle()
**Mutations:**
- Ollama analysis (analyze_newsletter())
- SQLite update (update_newsletter_analysis())
- Archive write (archive_newsletter())
- Archive status update (mark_newsletter_archived())

### Storage
**Where Information Is Stored:** 
- SQLite newsletters table (updated with summary, tags, key_ideas, actionable_insights)
- SQLite newsletter_topics table (topics)
- Markdown archive (knowledge/YYYY/MM/*.md)
- PostgreSQL events table (NEWSLETTER_PROCESSING_FAILED, DATABASE_WRITE_FAILED)

### Retrieval
**Where Information Is Retrieved:** crx-newsletter-brain/dashboard.py
**Retrieval:** get_newsletters_by_date_range(), search_newsletters()

### Output
**Where Information Is Output:** Dashboard display
**Output:** Newsletter display with analysis in browser

### Information Loss
**Where Information Is Lost:** Markdown archive (never read)
**Why:** Markdown archive is written but never read, never consumed, never acted upon

### Information Unreachable
**Where Information Becomes Unreachable:** Markdown archive (knowledge/YYYY/MM/*.md)
**Why:** Markdown archive is never retrieved, never consumed, never acted upon

---

## FLOW 3: Article Ingestion

### Input
**Where Information Enters:** RSS feeds (external service)
**Entry Point:** crx-digestion-worker/worker.py → run_cycle() → tools.py → fetch_rss()
**Data:** url, title, summary, source, published_at

### Processing
**Where Information Mutates:** crx-digestion-worker/worker.py → run_cycle()
**Mutations:**
- Duplicate check (article_exists())
- Ollama summarization (process_article())
- SQLite write (save_article())
- Archive write (archive_article())

### Storage
**Where Information Is Stored:**
- SQLite articles table (url, title, summary, source, published_at, processed_at, tags)
- Markdown archive (knowledge/YYYY/MM/*.md)
- PostgreSQL events table (ARTICLE_CREATED, ARTICLE_PROCESSING_FAILED, DATABASE_WRITE_FAILED)

### Retrieval
**Where Information Is Retrieved:** NONE (no retrieval exists for articles)
**Retrieval:** NONE (articles are never retrieved)

### Output
**Where Information Is Output:** NONE (no output exists for articles)
**Output:** NONE (articles are never displayed, never consumed, never acted upon)

### Information Loss
**Where Information Is Lost:** 
- Markdown archive (never read)
- Article state (never retrieved)
**Why:** Markdown archive is written but never read, never consumed, never acted upon. Article state is stored but never retrieved, never consumed, never acted upon.

### Information Unreachable
**Where Information Becomes Unreachable:** 
- Markdown archive (knowledge/YYYY/MM/*.md)
- SQLite articles table
**Why:** Markdown archive is never retrieved, never consumed, never acted upon. Article state is never retrieved, never consumed, never acted upon.

---

## FLOW 4: Digest Generation

### Input
**Where Information Enters:** SQLite newsletters table (processed newsletters from date range)
**Entry Point:** crx-newsletter-brain/worker.py → run_digest_generation() → digest_generator.py → get_newsletters_by_date_range()
**Data:** newsletters from date range

### Processing
**Where Information Mutates:** crx-newsletter-brain/worker.py → run_digest_generation()
**Mutations:**
- Digest aggregation (aggregate newsletter summaries)
- Digest generation (generate digest content)
- SQLite write (save_digest())
- Markdown write (digests/daily-{date}.md, digests/weekly-{date}.md)

### Storage
**Where Information Is Stored:**
- SQLite digests table (type, date, content, generated_at, newsletter_count)
- Markdown archive (digests/daily-{date}.md, digests/weekly-{date}.md)
- PostgreSQL events table (DIGEST_GENERATED)

### Retrieval
**Where Information Is Retrieved:** NONE (no retrieval exists for digests)
**Retrieval:** NONE (digests are never retrieved)

### Output
**Where Information Is Output:** NONE (no output exists for digests)
**Output:** NONE (digests are never displayed, never consumed, never acted upon)

### Information Loss
**Where Information Is Lost:** 
- Markdown archive (never read)
- Digest state (never retrieved)
**Why:** Markdown archive is written but never read, never consumed, never acted upon. Digest state is stored but never retrieved, never consumed, never acted upon.

### Information Unreachable
**Where Information Becomes Unreachable:** 
- Markdown archive (digests/daily-{date}.md, digests/weekly-{date}.md)
- SQLite digests table
**Why:** Markdown archive is never retrieved, never consumed, never acted upon. Digest state is never retrieved, never consumed, never acted upon.

---

## FLOW 5: Event Emission

### Input
**Where Information Enters:** SQLite mutations (newsletter save, article save, digest save)
**Entry Point:** crx-newsletter-brain/database.py, crx-digestion-worker/database.py
**Data:** newsletter, article, digest

### Processing
**Where Information Mutates:** Brain/event_emitter.py → emit_event()
**Mutations:**
- Event emission (NEWSLETTER_CREATED, ARTICLE_CREATED, DIGEST_GENERATED)
- Event emission (NEWSLETTER_PROCESSING_FAILED, DATABASE_WRITE_FAILED)

### Storage
**Where Information Is Stored:** PostgreSQL events table
**Data:** event_type, stream, payload, created_at

### Retrieval
**Where Information Is Retrieved:** NONE (no retrieval exists for events)
**Retrieval:** NONE (events are never retrieved)

### Output
**Where Information Is Output:** NONE (no output exists for events)
**Output:** NONE (events are never displayed, never consumed, never acted upon)

### Information Loss
**Where Information Is Lost:** Event state (never retrieved)
**Why:** Event state is stored but never retrieved, never consumed, never acted upon.

### Information Unreachable
**Where Information Becomes Unreachable:** PostgreSQL events table
**Why:** Event state is never retrieved, never consumed, never acted upon.

---

## CRITICAL FINDINGS

1. **Information flow is fragmented.** Information enters from Yahoo Mail and RSS feeds. Information mutates during Ollama analysis and Ollama summarization. Information is stored in SQLite and PostgreSQL events table. Information is lost during archive writes (never read). Information becomes unreachable after storage (never retrieved except by dashboard).

2. **Newsletter information is reachable.** Newsletter information enters from Yahoo Mail, mutates during Ollama analysis, is stored in SQLite, is retrieved by dashboard, is displayed in browser. Newsletter information is NOT lost. Newsletter information is NOT unreachable.

3. **Article information is unreachable.** Article information enters from RSS feeds, mutates during Ollama summarization, is stored in SQLite and markdown archive, is NEVER retrieved, is NEVER displayed, is NEVER consumed, is NEVER acted upon. Article information is LOST during archive write (never read). Article information is UNREACHABLE after storage (never retrieved).

4. **Digest information is unreachable.** Digest information enters from SQLite newsletters table, mutates during digest generation, is stored in SQLite and markdown archive, is NEVER retrieved, is NEVER displayed, is NEVER consumed, is NEVER acted upon. Digest information is LOST during archive write (never read). Digest information is UNREACHABLE after storage (never retrieved).

5. **Event information is unreachable.** Event information enters from SQLite mutations, mutates during event emission, is stored in PostgreSQL events table, is NEVER retrieved, is NEVER displayed, is NEVER consumed, is NEVER acted upon. Event information is LOST after storage (never retrieved). Event information is UNREACHABLE after storage (never retrieved).

6. **Archive writes are information loss points.** Markdown archives are written but never read. Information is lost during archive writes. Information becomes unreachable after archive writes.

7. **Article storage is an information loss point.** Article state is stored but never retrieved. Information is lost after article storage. Information becomes unreachable after article storage.

8. **Digest storage is an information loss point.** Digest state is stored but never retrieved. Information is lost after digest storage. Information becomes unreachable after digest storage.

9. **Event storage is an information loss point.** Event state is stored but never retrieved. Information is lost after event storage. Information becomes unreachable after event storage.

10. **100% of processed information terminates in storage.** All information flows from Input → Processing → Storage → DEAD END. No retrieval, consumption, or action occurs beyond dashboard display for newsletters.

---

## ANSWER

**Where Information Enters:**
- Yahoo Mail (newsletter ingestion)
- RSS feeds (article ingestion)
- SQLite newsletters table (newsletter analysis)
- SQLite newsletters table (digest generation)
- SQLite mutations (event emission)

**Where Information Mutates:**
- crx-newsletter-brain/worker.py (newsletter ingestion, newsletter analysis, digest generation)
- crx-digestion-worker/worker.py (article ingestion)
- Brain/event_emitter.py (event emission)

**Where Information Is Lost:**
- Markdown archive (never read)
- Article state (never retrieved)
- Digest state (never retrieved)
- Event state (never retrieved)

**Where Information Becomes Unreachable:**
- Markdown archive (knowledge/YYYY/MM/*.md, digests/daily-{date}.md, digests/weekly-{date}.md)
- SQLite articles table
- SQLite digests table
- PostgreSQL events table

**Overall Information Flow:** Fragmented (1 flow is reachable, 3 flows are unreachable)
