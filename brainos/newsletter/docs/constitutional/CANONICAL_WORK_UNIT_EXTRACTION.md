# CANONICAL WORK UNIT EXTRACTION

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Determine the smallest replayable unit of work. Use only code that currently exists.

---

## EXECUTIVE SUMMARY

**5 work units exist.** Newsletter Ingestion, Newsletter Analysis, Article Ingestion, Article Summarization, Digest Generation. 0 work units are replayable (0%). All work units have non-deterministic components (Ollama API calls, external service calls). All work units have side effects (SQLite writes, markdown writes). All work units have no identity requirements. All work units have no lineage requirements.

---

## WORK UNIT 1: Newsletter Ingestion

**Work Unit Name:** Newsletter Ingestion

**Inputs:**
- Yahoo Mail (external service)
- Unread email (message_id, subject, sender, body, word_count, received_at)

**Outputs:**
- Newsletter saved to SQLite (message_id, subject, sender, body, word_count, received_at)
- NEWSLETTER_CREATED event emitted

**State Dependencies:**
- SQLite newsletters table (for duplicate check)

**External Calls:**
- Yahoo Mail API (fetch_unread_newsletters())

**Side Effects:**
- SQLite INSERT (newsletters table)
- PostgreSQL INSERT (events table)

**Persistence Writes:**
- SQLite newsletters table (INSERT)
- PostgreSQL events table (INSERT)

**Deterministic Components:**
- Duplicate check (newsletter_exists())
- Word count filter (word_count >= MIN_WORD_COUNT)
- SQLite write (save_raw_newsletter())

**Non Deterministic Components:**
- Yahoo Mail API call (fetch_unread_newsletters()) - external service, non-deterministic response
- Email arrival time (received_at) - external service, non-deterministic

**Replay Feasibility:** NOT REPLAYABLE
- Yahoo Mail API call is non-deterministic (cannot replay external service call)
- Email arrival time is non-deterministic (cannot replay external service state)
- NEWSLETTER_CREATED event is POST-WRITE (derived from SQLite, not source of truth)

**Identity Requirements:** NONE
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist

**Lineage Requirements:** NONE
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist

**Evidence:**
- crx-newsletter-brain/worker.py run_ingestion_cycle()
- crx-newsletter-brain/yahoo_client.py YahooMailClient
- crx-newsletter-brain/database.py save_raw_newsletter()

---

## WORK UNIT 2: Newsletter Analysis

**Work Unit Name:** Newsletter Analysis

**Inputs:**
- SQLite newsletters table (unprocessed newsletter)
- Newsletter (message_id, subject, sender, body, word_count, received_at)

**Outputs:**
- Newsletter analysis saved to SQLite (summary, tags, key_ideas, actionable_insights)
- Newsletter topics saved to SQLite (article_id, topic, confidence, created_at)
- Newsletter archived as markdown

**State Dependencies:**
- SQLite newsletters table (for unprocessed newsletters)
- SQLite newsletter_topics table (for topic storage)

**External Calls:**
- Ollama API (analyze_newsletter())

**Side Effects:**
- SQLite UPDATE (newsletters table)
- SQLite INSERT (newsletter_topics table)
- Markdown WRITE (knowledge/YYYY/MM/*.md)

**Persistence Writes:**
- SQLite newsletters table (UPDATE)
- SQLite newsletter_topics table (INSERT)
- Markdown archive (WRITE)

**Deterministic Components:**
- SQLite update (update_newsletter_analysis())
- SQLite insert (newsletter_topics table)
- Markdown write (archive_newsletter())

**Non Deterministic Components:**
- Ollama API call (analyze_newsletter()) - external service, non-deterministic response
- Ollama model output (summary, tags, key_ideas, actionable_insights, topics) - AI model, non-deterministic

**Replay Feasibility:** NOT REPLAYABLE
- Ollama API call is non-deterministic (cannot replay AI model)
- Ollama model output is non-deterministic (cannot replay AI model output)
- NO EVENT EMITTED for successful analysis (cannot replay from events)

**Identity Requirements:** NONE
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist

**Lineage Requirements:** NONE
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist

**Evidence:**
- crx-newsletter-brain/worker.py run_processing_cycle()
- crx-newsletter-brain/summarizer.py analyze_newsletter()
- crx-newsletter-brain/database.py update_newsletter_analysis()
- crx-newsletter-brain/archive.py archive_newsletter()

---

## WORK UNIT 3: Article Ingestion

**Work Unit Name:** Article Ingestion

**Inputs:**
- RSS feed (external service)
- Article (url, title, summary, source, published_at)

**Outputs:**
- Article saved to SQLite (url, title, summary, source, published_at, processed_at, tags)
- ARTICLE_CREATED event emitted

**State Dependencies:**
- SQLite articles table (for duplicate check)

**External Calls:**
- RSS feed API (fetch_rss())

**Side Effects:**
- SQLite INSERT (articles table)
- PostgreSQL INSERT (events table)

**Persistence Writes:**
- SQLite articles table (INSERT)
- PostgreSQL events table (INSERT)

**Deterministic Components:**
- Duplicate check (article_exists())
- SQLite write (save_article())

**Non Deterministic Components:**
- RSS feed API call (fetch_rss()) - external service, non-deterministic response
- Article publication time (published_at) - external service, non-deterministic

**Replay Feasibility:** NOT REPLAYABLE
- RSS feed API call is non-deterministic (cannot replay external service call)
- Article publication time is non-deterministic (cannot replay external service state)
- ARTICLE_CREATED event is POST-WRITE (derived from SQLite, not source of truth)

**Identity Requirements:** NONE
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist

**Lineage Requirements:** NONE
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist

**Evidence:**
- crx-digestion-worker/worker.py run_cycle()
- crx-digestion-worker/tools.py fetch_rss()
- crx-digestion-worker/database.py save_article()

---

## WORK UNIT 4: Article Summarization

**Work Unit Name:** Article Summarization

**Inputs:**
- RSS feed (external service)
- Article (url, title, summary, source, published_at)

**Outputs:**
- Article summary saved to SQLite (summary, tags)
- Article archived as markdown

**State Dependencies:**
- SQLite articles table (for article storage)

**External Calls:**
- Ollama API (process_article())

**Side Effects:**
- SQLite UPDATE (articles table)
- Markdown WRITE (knowledge/YYYY/MM/*.md)

**Persistence Writes:**
- SQLite articles table (UPDATE)
- Markdown archive (WRITE)

**Deterministic Components:**
- SQLite update (save_article())
- Markdown write (archive_article())

**Non Deterministic Components:**
- Ollama API call (process_article()) - external service, non-deterministic response
- Ollama model output (summary, tags) - AI model, non-deterministic

**Replay Feasibility:** NOT REPLAYABLE
- Ollama API call is non-deterministic (cannot replay AI model)
- Ollama model output is non-deterministic (cannot replay AI model output)
- NO EVENT EMITTED for successful summarization (cannot replay from events)

**Identity Requirements:** NONE
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist

**Lineage Requirements:** NONE
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist

**Evidence:**
- crx-digestion-worker/worker.py run_cycle()
- crx-digestion-worker/summarizer.py process_article()
- crx-digestion-worker/database.py save_article()
- crx-digestion-worker/archive.py archive_article()

---

## WORK UNIT 5: Digest Generation

**Work Unit Name:** Digest Generation

**Inputs:**
- SQLite newsletters table (processed newsletters from date range)

**Outputs:**
- Digest saved to SQLite (type, date, content, generated_at, newsletter_count)
- Digest written to markdown (digests/daily-{date}.md, digests/weekly-{date}.md)
- DIGEST_GENERATED event emitted

**State Dependencies:**
- SQLite newsletters table (for digest generation)
- SQLite digests table (for digest storage)

**External Calls:**
- NONE (no external calls)

**Side Effects:**
- SQLite INSERT (digests table)
- Markdown WRITE (digests/daily-{date}.md, digests/weekly-{date}.md)

**Persistence Writes:**
- SQLite digests table (INSERT)
- Markdown archive (WRITE)

**Deterministic Components:**
- Newsletter fetch (get_newsletters_by_date_range())
- Digest aggregation (aggregate newsletter summaries)
- Digest generation (generate digest content)
- SQLite write (save_digest())
- Markdown write (digests/daily-{date}.md, digests/weekly-{date}.md)

**Non Deterministic Components:**
- NONE (all components are deterministic)

**Replay Feasibility:** PARTIALLY REPLAYABLE
- All components are deterministic
- DIGEST_GENERATED event is POST-WRITE (derived from SQLite, not source of truth)
- NO EVENT EMITTED for digest generation before SQLite write
- Can replay from SQLite state, cannot replay from events

**Identity Requirements:** NONE
- No identity computation exists
- No artifact IDs exist
- No canonical hashes exist

**Lineage Requirements:** NONE
- No lineage tracking exists
- No DAG validation exists
- No ancestry proofs exist

**Evidence:**
- crx-newsletter-brain/worker.py run_digest_generation()
- crx-newsletter-brain/digest_generator.py generate_daily_digest()
- crx-newsletter-brain/digest_generator.py generate_weekly_report()
- crx-newsletter-brain/database.py save_digest()

---

## CRITICAL FINDINGS

1. **5 work units exist.** Newsletter Ingestion, Newsletter Analysis, Article Ingestion, Article Summarization, Digest Generation. 0 work units are replayable (0%).

2. **All work units have non-deterministic components.** Yahoo Mail API calls, RSS feed API calls, Ollama API calls are non-deterministic. Cannot replay external service calls.

3. **All work units have side effects.** SQLite writes, markdown writes are side effects. Cannot replay side effects.

4. **All work units have no identity requirements.** No identity computation exists. No artifact IDs exist. No canonical hashes exist.

5. **All work units have no lineage requirements.** No lineage tracking exists. No DAG validation exists. No ancestry proofs exist.

6. **Newsletter Ingestion is NOT REPLAYABLE.** Yahoo Mail API call is non-deterministic. Email arrival time is non-deterministic. NEWSLETTER_CREATED event is POST-WRITE.

7. **Newsletter Analysis is NOT REPLAYABLE.** Ollama API call is non-deterministic. Ollama model output is non-deterministic. NO EVENT EMITTED for successful analysis.

8. **Article Ingestion is NOT REPLAYABLE.** RSS feed API call is non-deterministic. Article publication time is non-deterministic. ARTICLE_CREATED event is POST-WRITE.

9. **Article Summarization is NOT REPLAYABLE.** Ollama API call is non-deterministic. Ollama model output is non-deterministic. NO EVENT EMITTED for successful summarization.

10. **Digest Generation is PARTIALLY REPLAYABLE.** All components are deterministic. DIGEST_GENERATED event is POST-WRITE. NO EVENT EMITTED for digest generation before SQLite write. Can replay from SQLite state, cannot replay from events.

---

## ANSWER

**Newsletter Ingestion:** NOT REPLAYABLE
- Inputs: Yahoo Mail (unread email)
- Outputs: Newsletter saved to SQLite, NEWSLETTER_CREATED event emitted
- State Dependencies: SQLite newsletters table
- External Calls: Yahoo Mail API
- Side Effects: SQLite INSERT, PostgreSQL INSERT
- Persistence Writes: SQLite newsletters table, PostgreSQL events table
- Deterministic Components: Duplicate check, word count filter, SQLite write
- Non Deterministic Components: Yahoo Mail API call, email arrival time
- Replay Feasibility: NOT REPLAYABLE
- Identity Requirements: NONE
- Lineage Requirements: NONE

**Newsletter Analysis:** NOT REPLAYABLE
- Inputs: SQLite newsletters table (unprocessed newsletter)
- Outputs: Newsletter analysis saved to SQLite, newsletter topics saved to SQLite, newsletter archived as markdown
- State Dependencies: SQLite newsletters table, SQLite newsletter_topics table
- External Calls: Ollama API
- Side Effects: SQLite UPDATE, SQLite INSERT, Markdown WRITE
- Persistence Writes: SQLite newsletters table, SQLite newsletter_topics table, Markdown archive
- Deterministic Components: SQLite update, SQLite insert, Markdown write
- Non Deterministic Components: Ollama API call, Ollama model output
- Replay Feasibility: NOT REPLAYABLE
- Identity Requirements: NONE
- Lineage Requirements: NONE

**Article Ingestion:** NOT REPLAYABLE
- Inputs: RSS feed (article)
- Outputs: Article saved to SQLite, ARTICLE_CREATED event emitted
- State Dependencies: SQLite articles table
- External Calls: RSS feed API
- Side Effects: SQLite INSERT, PostgreSQL INSERT
- Persistence Writes: SQLite articles table, PostgreSQL events table
- Deterministic Components: Duplicate check, SQLite write
- Non Deterministic Components: RSS feed API call, article publication time
- Replay Feasibility: NOT REPLAYABLE
- Identity Requirements: NONE
- Lineage Requirements: NONE

**Article Summarization:** NOT REPLAYABLE
- Inputs: RSS feed (article)
- Outputs: Article summary saved to SQLite, article archived as markdown
- State Dependencies: SQLite articles table
- External Calls: Ollama API
- Side Effects: SQLite UPDATE, Markdown WRITE
- Persistence Writes: SQLite articles table, Markdown archive
- Deterministic Components: SQLite update, Markdown write
- Non Deterministic Components: Ollama API call, Ollama model output
- Replay Feasibility: NOT REPLAYABLE
- Identity Requirements: NONE
- Lineage Requirements: NONE

**Digest Generation:** PARTIALLY REPLAYABLE
- Inputs: SQLite newsletters table (processed newsletters from date range)
- Outputs: Digest saved to SQLite, digest written to markdown, DIGEST_GENERATED event emitted
- State Dependencies: SQLite newsletters table, SQLite digests table
- External Calls: NONE
- Side Effects: SQLite INSERT, Markdown WRITE
- Persistence Writes: SQLite digests table, Markdown archive
- Deterministic Components: Newsletter fetch, digest aggregation, digest generation, SQLite write, Markdown write
- Non Deterministic Components: NONE
- Replay Feasibility: PARTIALLY REPLAYABLE
- Identity Requirements: NONE
- Lineage Requirements: NONE

**Overall Replay Feasibility:** 0% (0 out of 5 work units are replayable, 1 is partially replayable)
