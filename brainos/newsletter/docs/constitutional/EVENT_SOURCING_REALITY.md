# EVENT SOURCING REALITY

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY - RUNTIME REALITY ONLY  
**Audit Principle:** Determine whether runtime is actually event-sourced (A) or state-sourced with event projections (B). Provide proof. Trace Newsletter lifecycle, Article lifecycle, Digest lifecycle. Show where authority originates. Answer: Are events authority?

---

## EXECUTIVE SUMMARY

**Runtime is state-sourced with event projections.** Runtime is NOT event-sourced. Authority originates from SQLite (state), NOT from events (projections). Events are POST-WRITE (derived from SQLite, not source of truth). Events are incomplete (10 missing event types). Newsletter lifecycle: Yahoo Mail → SQLite INSERT → Event emission. Article lifecycle: RSS feed → SQLite INSERT → Event emission. Digest lifecycle: SQLite newsletters → SQLite INSERT → Event emission. Events are NOT authority.

---

## DEFINITION

### Event-Sourced (A)
- Events are authority
- State is projection (derived from events)
- Events are PRE-WRITE (emitted before state mutations)
- State can be reconstructed from events
- Events are complete (all state transitions captured)

### State-Sourced with Event Projections (B)
- State is authority
- Events are projection (derived from state)
- Events are POST-WRITE (emitted after state mutations)
- State cannot be reconstructed from events
- Events are incomplete (missing state transitions)

---

## NEWSLETTER LIFECYCLE

### Step 1: Newsletter Receipt
**Authority Origin:** Yahoo Mail (external service)
**Action:** Fetch unread newsletters from Yahoo Mail
**Location:** crx-newsletter-brain/worker.py run_ingestion_cycle()
**Evidence:**
```python
def run_ingestion_cycle():
    client = YahooMailClient()
    newsletters = client.fetch_unread_newsletters()
```

### Step 2: Newsletter Duplicate Check
**Authority Origin:** SQLite (state)
**Action:** Check if newsletter already exists in SQLite
**Location:** crx-newsletter-brain/database.py newsletter_exists()
**Evidence:**
```python
def newsletter_exists(message_id: str) -> bool:
    cursor.execute("SELECT id FROM newsletters WHERE message_id = ?", (message_id,))
    return cursor.fetchone() is not None
```

### Step 3: Newsletter Filter
**Authority Origin:** Application logic (not state, not events)
**Action:** Filter newsletters by word count
**Location:** crx-newsletter-brain/worker.py run_ingestion_cycle()
**Evidence:**
```python
if newsletter["word_count"] >= MIN_WORD_COUNT:
    save_raw_newsletter(newsletter)
```

### Step 4: Newsletter Save (SQLite INSERT)
**Authority Origin:** SQLite (state)
**Action:** Insert newsletter into SQLite
**Location:** crx-newsletter-brain/database.py save_raw_newsletter()
**Evidence:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO newsletters ...", (...))
        conn.commit()
        return True
    except Exception as e:
        emit_event("newsletter", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 5: Event Emission (POST-WRITE)
**Authority Origin:** SQLite (state) → PostgreSQL (event projection)
**Action:** Emit NEWSLETTER_CREATED event
**Location:** crx-newsletter-brain/database.py save_raw_newsletter()
**Evidence:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO newsletters ...", (...))
        conn.commit()
        emit_event("newsletter", "NEWSLETTER_CREATED", {"message_id": newsletter["message_id"]})
        return True
    except Exception as e:
        emit_event("newsletter", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 6: Newsletter Analysis
**Authority Origin:** Ollama (external service)
**Action:** Call Ollama API for newsletter analysis
**Location:** crx-newsletter-brain/worker.py run_processing_cycle()
**Evidence:**
```python
def run_processing_cycle():
    newsletters = get_unprocessed_newsletters()
    for newsletter in newsletters:
        analysis = analyze_newsletter(newsletter)
        update_newsletter_analysis(newsletter["id"], analysis)
```

### Step 7: Newsletter Update (SQLite UPDATE)
**Authority Origin:** SQLite (state)
**Action:** Update newsletter with Ollama analysis
**Location:** crx-newsletter-brain/database.py update_newsletter_analysis()
**Evidence:**
```python
def update_newsletter_analysis(newsletter_id: int, analysis: Dict) -> bool:
    try:
        cursor.execute("UPDATE newsletters SET summary=?, tags=?, key_ideas=?, actionable_insights=?, processed_at=? WHERE id=?", (...))
        conn.commit()
        return True
    except Exception as e:
        emit_event("newsletter", "NEWSLETTER_PROCESSING_FAILED", {"error": str(e)})
        return False
```

### Step 8: Event Emission (NO EVENT for success)
**Authority Origin:** NONE (no event emitted for success)
**Action:** NONE (no event emitted for newsletter analysis success)
**Location:** NONE
**Evidence:**
```python
def update_newsletter_analysis(newsletter_id: int, analysis: Dict) -> bool:
    try:
        cursor.execute("UPDATE newsletters SET summary=?, tags=?, key_ideas=?, actionable_insights=?, processed_at=? WHERE id=?", (...))
        conn.commit()
        return True
    except Exception as e:
        emit_event("newsletter", "NEWSLETTER_PROCESSING_FAILED", {"error": str(e)})
        return False
```

### Newsletter Lifecycle Authority Flow
```
Yahoo Mail (external service)
  → Application logic (filter)
  → SQLite INSERT (state authority)
  → Event emission (POST-WRITE, projection)
  → Ollama (external service)
  → SQLite UPDATE (state authority)
  → NO EVENT (no projection for success)
```

---

## ARTICLE LIFECYCLE

### Step 1: Article Receipt
**Authority Origin:** RSS feed (external service)
**Action:** Fetch articles from RSS feed
**Location:** crx-digestion-worker/worker.py run_cycle()
**Evidence:**
```python
def run_cycle():
    sources = get_all_sources()
    for source in sources:
        articles = fetch_rss(source["url"])
```

### Step 2: Article Duplicate Check
**Authority Origin:** SQLite (state)
**Action:** Check if article already exists in SQLite
**Location:** crx-digestion-worker/database.py article_exists()
**Evidence:**
```python
def article_exists(url: str) -> bool:
    cursor.execute("SELECT id FROM articles WHERE url = ?", (url,))
    return cursor.fetchone() is not None
```

### Step 3: Article Save (SQLite INSERT)
**Authority Origin:** SQLite (state)
**Action:** Insert article into SQLite
**Location:** crx-digestion-worker/database.py save_article()
**Evidence:**
```python
def save_article(article: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO articles ...", (...))
        conn.commit()
        return True
    except Exception as e:
        emit_event("article", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 4: Event Emission (POST-WRITE)
**Authority Origin:** SQLite (state) → PostgreSQL (event projection)
**Action:** Emit ARTICLE_CREATED event
**Location:** crx-digestion-worker/database.py save_article()
**Evidence:**
```python
def save_article(article: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO articles ...", (...))
        conn.commit()
        emit_event("article", "ARTICLE_CREATED", {"url": article["url"]})
        return True
    except Exception as e:
        emit_event("article", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 5: Article Summarization
**Authority Origin:** Ollama (external service)
**Action:** Call Ollama API for article summarization
**Location:** crx-digestion-worker/worker.py run_cycle()
**Evidence:**
```python
def run_cycle():
    articles = get_unprocessed_articles()
    for article in articles:
        summary = process_article(article)
        # No SQLite update for summary (summary is not persisted)
```

### Step 6: Article Archive (Markdown WRITE)
**Authority Origin:** Markdown file (state)
**Action:** Write article to markdown file
**Location:** crx-digestion-worker/archive.py archive_article()
**Evidence:**
```python
def archive_article(article: Dict, output_dir: str):
    # Write article to markdown file
    # No event emission
```

### Article Lifecycle Authority Flow
```
RSS feed (external service)
  → SQLite INSERT (state authority)
  → Event emission (POST-WRITE, projection)
  → Ollama (external service)
  → Markdown WRITE (state authority)
  → NO EVENT (no projection for archive)
```

---

## DIGEST LIFECYCLE

### Step 1: Newsletter Fetch
**Authority Origin:** SQLite (state)
**Action:** Fetch newsletters from SQLite by date range
**Location:** crx-newsletter-brain/database.py get_newsletters_by_date_range()
**Evidence:**
```python
def get_newsletters_by_date_range(start_date: str, end_date: str):
    cursor.execute("SELECT * FROM newsletters WHERE received_at BETWEEN ? AND ?", (start_date, end_date))
    return cursor.fetchall()
```

### Step 2: Digest Generation
**Authority Origin:** Application logic (not state, not events)
**Action:** Aggregate newsletter summaries into digest
**Location:** crx-newsletter-brain/digest_generator.py generate_digest()
**Evidence:**
```python
def generate_digest(date_range):
    newsletters = get_newsletters_by_date_range(date_range)
    digest_content = aggregate_newsletter_summaries(newsletters)
    return digest_content
```

### Step 3: Digest Save (SQLite INSERT)
**Authority Origin:** SQLite (state)
**Action:** Insert digest into SQLite
**Location:** crx-newsletter-brain/database.py save_digest()
**Evidence:**
```python
def save_digest(digest: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO digests ...", (...))
        conn.commit()
        return True
    except Exception as e:
        emit_event("digest", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 4: Event Emission (POST-WRITE)
**Authority Origin:** SQLite (state) → PostgreSQL (event projection)
**Action:** Emit DIGEST_GENERATED event
**Location:** crx-newsletter-brain/database.py save_digest()
**Evidence:**
```python
def save_digest(digest: Dict) -> bool:
    try:
        cursor.execute("INSERT INTO digests ...", (...))
        conn.commit()
        emit_event("digest", "DIGEST_GENERATED", {"type": digest["type"], "date": digest["date"]})
        return True
    except Exception as e:
        emit_event("digest", "DATABASE_WRITE_FAILED", {"error": str(e)})
        return False
```

### Step 5: Digest Archive (Markdown WRITE)
**Authority Origin:** Markdown file (state)
**Action:** Write digest to markdown file
**Location:** crx-newsletter-brain/digest_generator.py write_digest_to_markdown()
**Evidence:**
```python
def write_digest_to_markdown(digest: Dict, output_dir: str):
    # Write digest to markdown file
    # No event emission
```

### Digest Lifecycle Authority Flow
```
SQLite (state authority)
  → Application logic (digest generation)
  → SQLite INSERT (state authority)
  → Event emission (POST-WRITE, projection)
  → Markdown WRITE (state authority)
  → NO EVENT (no projection for archive)
```

---

## AUTHORITY ORIGIN ANALYSIS

### Newsletter Authority Origin
**Primary Authority:** SQLite (state)
**Secondary Authority:** Yahoo Mail (external service)
**Event Authority:** NONE (events are projection, not authority)
**Evidence:**
- Newsletter is saved to SQLite first
- Event is emitted after SQLite INSERT (POST-WRITE)
- Event does not contain full newsletter content
- Event does not contain Ollama analysis output
- Newsletter cannot be reconstructed from events

### Article Authority Origin
**Primary Authority:** SQLite (state)
**Secondary Authority:** RSS feed (external service)
**Event Authority:** NONE (events are projection, not authority)
**Evidence:**
- Article is saved to SQLite first
- Event is emitted after SQLite INSERT (POST-WRITE)
- Event does not contain full article content
- Event does not contain Ollama summarization output
- Article cannot be reconstructed from events

### Digest Authority Origin
**Primary Authority:** SQLite (state)
**Secondary Authority:** Application logic (digest generation)
**Event Authority:** NONE (events are projection, not authority)
**Evidence:**
- Digest is saved to SQLite first
- Event is emitted after SQLite INSERT (POST-WRITE)
- Event does not contain full digest content
- Event does not contain newsletter list used for digest generation
- Digest cannot be reconstructed from events

---

## CRITICAL FINDINGS

1. **Runtime is state-sourced with event projections.** Runtime is NOT event-sourced. Authority originates from SQLite (state), NOT from events (projections).

2. **Events are POST-WRITE.** All events are emitted after SQLite INSERT or SQLite UPDATE. Events are derived from SQLite, not source of truth.

3. **Events are incomplete.** 10 missing events exist (NEWSLETTER_RECEIVED, OLLAMA_ANALYSIS_COMPLETED, NEWSLETTER_CLASSIFIED, TOPICS_EXTRACTED, INSIGHTS_EXTRACTED, ARCHIVE_WRITTEN, MARKDOWN_WRITTEN, NEWSLETTER_ARCHIVED, ARTICLE_RECEIVED, OLLAMA_SUMMARIZATION_COMPLETED).

4. **Newsletter lifecycle authority originates from SQLite.** Newsletter is saved to SQLite first. Event is emitted after SQLite INSERT (POST-WRITE). Event does not contain full newsletter content. Newsletter cannot be reconstructed from events.

5. **Article lifecycle authority originates from SQLite.** Article is saved to SQLite first. Event is emitted after SQLite INSERT (POST-WRITE). Event does not contain full article content. Article cannot be reconstructed from events.

6. **Digest lifecycle authority originates from SQLite.** Digest is saved to SQLite first. Event is emitted after SQLite INSERT (POST-WRITE). Event does not contain full digest content. Digest cannot be reconstructed from events.

7. **Events are NOT authority.** Events are projection (derived from state). Events are POST-WRITE (emitted after state mutations). Events are incomplete (missing state transitions). State cannot be reconstructed from events.

8. **State is authority.** SQLite is SYSTEM OF RECORD. PostgreSQL events table is DERIVED. Authority originates from SQLite, NOT from events.

---

## ANSWER

**Is the runtime event-sourced?** NO

**Is the runtime state-sourced with event projections?** YES

**Newsletter Lifecycle Authority Flow:**
- Yahoo Mail (external service)
- → Application logic (filter)
- → SQLite INSERT (state authority)
- → Event emission (POST-WRITE, projection)
- → Ollama (external service)
- → SQLite UPDATE (state authority)
- → NO EVENT (no projection for success)

**Article Lifecycle Authority Flow:**
- RSS feed (external service)
- → SQLite INSERT (state authority)
- → Event emission (POST-WRITE, projection)
- → Ollama (external service)
- → Markdown WRITE (state authority)
- → NO EVENT (no projection for archive)

**Digest Lifecycle Authority Flow:**
- SQLite (state authority)
- → Application logic (digest generation)
- → SQLite INSERT (state authority)
- → Event emission (POST-WRITE, projection)
- → Markdown WRITE (state authority)
- → NO EVENT (no projection for archive)

**Where Authority Originates:** SQLite (state)

**Are Events Authority?** NO
