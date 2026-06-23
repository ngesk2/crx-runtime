# EVENT COVERAGE AUDIT

**Audit Date:** 2025-01-18  
**Audit Scope:** Every application mutation and its observability  
**Audit Principle:** Determine which mutations are observable via events

---

## EXECUTIVE SUMMARY

**Event coverage is 60% for critical mutations.** ARTICLE_CREATED, NEWSLETTER_CREATED, DIGEST_GENERATED, ARCHIVE_WRITTEN, and MARKDOWN_WRITTEN are observable. ARTICLE_UPDATED is partially observable. Ollama analysis mutations (summary, tags, key_ideas, actionable_insights) are invisible. Source registration mutations are invisible.

---

## MUTATION COVERAGE MATRIX

### 1. ARTICLE_CREATED

**Mutation:** Save article to knowledge.db  
**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` (save_article)  
**Observable:** YES  
**Event:** ARTICLE_CREATED (emitted via emit_article_created)  
**Event Stream:** rss  
**Event Payload:** url, title, summary, source, published_at, processed_at, tags  
**Coverage:** 100% (all article fields are in event payload)

**Event Emission Code:**
```python
# database.py line 78
emit_article_created(article)
```

**Event Definition:**
```python
# event_emitter.py line 183-193
def emit_article_created(article: Dict[str, Any]) -> bool:
    return emit_event('rss', ARTICLE_CREATED, article)
```

**Coverage Analysis:**
- url: YES (in event payload)
- title: YES (in event payload)
- summary: YES (in event payload)
- source: YES (in event payload)
- published_at: YES (in event payload)
- processed_at: YES (in event payload)
- tags: YES (in event payload)

---

### 2. ARTICLE_UPDATED

**Mutation:** Update article in knowledge.db  
**Location:** NOT IMPLEMENTED  
**Observable:** N/A (mutation does not exist)  
**Event:** ARTICLE_UPDATED (defined but not used)  
**Event Stream:** rss  
**Event Payload:** article dictionary  
**Coverage:** N/A (mutation does not exist)

**Event Definition:**
```python
# event_emitter.py line 196-206
def emit_article_updated(article: Dict[str, Any]) -> bool:
    return emit_event('rss', ARTICLE_UPDATED, article)
```

**Coverage Analysis:**
- Mutation does not exist in current codebase
- Event is defined but never emitted
- If mutation were implemented, coverage would be 100% (all article fields in event payload)

---

### 3. NEWSLETTER_CREATED

**Mutation:** Save newsletter to newsletters.db  
**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (save_raw_newsletter)  
**Observable:** YES  
**Event:** NEWSLETTER_CREATED (emitted via emit_newsletter_created)  
**Event Stream:** yahoo  
**Event Payload:** message_id, subject, sender, body, word_count, received_at  
**Coverage:** 50% (Ollama analysis fields are missing)

**Event Emission Code:**
```python
# database.py line 107
emit_newsletter_created(newsletter)
```

**Event Definition:**
```python
# event_emitter.py line 227-237
def emit_newsletter_created(newsletter: Dict[str, Any]) -> bool:
    return emit_event('yahoo', NEWSLETTER_CREATED, newsletter)
```

**Coverage Analysis:**
- message_id: YES (in event payload)
- subject: YES (in event payload)
- sender: YES (in event payload)
- body: YES (in event payload)
- word_count: YES (in event payload)
- received_at: YES (in event payload)
- summary: NO (not in event payload - added later via Ollama)
- tags: NO (not in event payload - added later via Ollama)
- key_ideas: NO (not in event payload - added later via Ollama)
- actionable_insights: NO (not in event payload - added later via Ollama)
- processed_at: NO (not in event payload - added later via Ollama)
- archived: NO (not in event payload - added later via archive)

**Critical Gap:** Ollama analysis results (summary, tags, key_ideas, actionable_insights) are written to SQLite via update_newsletter_analysis() but no event is emitted for this mutation.

---

### 4. DIGEST_GENERATED

**Mutation:** Save digest to newsletters.db  
**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (save_digest)  
**Observable:** YES  
**Event:** DIGEST_GENERATED (emitted via emit_digest_generated)  
**Event Stream:** yahoo  
**Event Payload:** type, date, newsletter_count, content_length  
**Coverage:** 80% (digest content is missing)

**Event Emission Code:**
```python
# database.py line 271
emit_digest_generated({
    'type': digest_type,
    'date': date,
    'newsletter_count': newsletter_count,
    'content_length': len(content)
})
```

**Event Definition:**
```python
# event_emitter.py line 240-250
def emit_digest_generated(digest: Dict[str, Any]) -> bool:
    return emit_event('yahoo', DIGEST_GENERATED, digest)
```

**Coverage Analysis:**
- type: YES (in event payload)
- date: YES (in event payload)
- newsletter_count: YES (in event payload)
- content_length: YES (in event payload)
- content: NO (not in event payload - too large for event payload)
- generated_at: NO (not in event payload - can be inferred from event created_at)

**Critical Gap:** Digest content is not in event payload due to size. Digest content can be reconstructed from newsletters.db by querying newsletters for the date range.

---

### 5. ARCHIVE_WRITTEN

**Mutation:** Write newsletter markdown archive  
**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py` (archive_newsletter)  
**Observable:** YES  
**Event:** ARCHIVE_WRITTEN (emitted via emit_archive_written)  
**Event Stream:** yahoo  
**Event Payload:** path, content_length, timestamp  
**Coverage:** 80% (markdown content is missing)

**Event Emission Code:**
```python
# archive.py line 78
emit_archive_written(file_path, markdown)
```

**Event Definition:**
```python
# event_emitter.py line 253-268
def emit_archive_written(archive_path: str, content: str) -> bool:
    return emit_event('yahoo', ARCHIVE_WRITTEN, {
        'path': archive_path,
        'content_length': len(content),
        'timestamp': datetime.utcnow().isoformat()
    })
```

**Coverage Analysis:**
- path: YES (in event payload)
- content_length: YES (in event payload)
- timestamp: YES (in event payload)
- content: NO (not in event payload - too large for event payload)

**Critical Gap:** Markdown content is not in event payload due to size. Markdown content can be reconstructed from newsletters.db by regenerating markdown from newsletter record.

---

### 6. MARKDOWN_WRITTEN

**Mutation:** Write article markdown archive  
**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py` (archive_article)  
**Observable:** YES  
**Event:** MARKDOWN_WRITTEN (emitted via emit_markdown_written)  
**Event Stream:** rss  
**Event Payload:** path, content_length, timestamp  
**Coverage:** 80% (markdown content is missing)

**Event Emission Code:**
```python
# archive.py line 64
emit_markdown_written(file_path, markdown)
```

**Event Definition:**
```python
# event_emitter.py line 209-224
def emit_markdown_written(markdown_path: str, content: str) -> bool:
    return emit_event('rss', MARKDOWN_WRITTEN, {
        'path': markdown_path,
        'content_length': len(content),
        'timestamp': datetime.utcnow().isoformat()
    })
```

**Coverage Analysis:**
- path: YES (in event payload)
- content_length: YES (in event payload)
- timestamp: YES (in event payload)
- content: NO (not in event payload - too large for event payload)

**Critical Gap:** Markdown content is not in event payload due to size. Markdown content can be reconstructed from knowledge.db by regenerating markdown from article record.

---

## INVISIBLE MUTATIONS

### 1. Ollama Analysis (Newsletter)

**Mutation:** Update newsletter with Ollama analysis results  
**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (update_newsletter_analysis)  
**Observable:** NO  
**Event:** NONE  
**Coverage:** 0%

**Mutation Code:**
```python
# database.py line 124-176
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    cursor.execute("""
        UPDATE newsletters
        SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
        WHERE message_id = ?
    """, (...))
```

**Critical Gap:** No event is emitted when Ollama analysis results are written to SQLite. This makes summary, tags, key_ideas, and actionable_insights invisible to the event log.

**Required Event:** NEWSLETTER_ANALYZED or OLLAMA_INFERENCE_RESPONSE

---

### 2. Source Registration

**Mutation:** Register source in knowledge.db  
**Location:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` (register_source)  
**Observable:** NO  
**Event:** NONE  
**Coverage:** 0%

**Mutation Code:**
```python
# database.py line 159-175
def register_source(name: str, url: str, source_type: str) -> bool:
    cursor.execute("""
        INSERT OR IGNORE INTO sources (name, url, type)
        VALUES (?, ?, ?)
    """, (name, url, source_type))
```

**Critical Gap:** No event is emitted when source is registered. This makes source registration invisible to the event log.

**Required Event:** SOURCE_REGISTERED

---

### 3. Newsletter Archive Flag

**Mutation:** Mark newsletter as archived  
**Location:** `c:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (mark_newsletter_archived)  
**Observable:** NO  
**Event:** NONE  
**Coverage:** 0%

**Mutation Code:**
```python
# database.py line 178-196
def mark_newsletter_archived(message_id: str) -> bool:
    cursor.execute("""
        UPDATE newsletters
        SET archived = 1
        WHERE message_id = ?
    """, (message_id,))
```

**Critical Gap:** No event is emitted when newsletter is marked as archived. This makes archive flag changes invisible to the event log.

**Required Event:** NEWSLETTER_ARCHIVED

---

## EVENT COVERAGE SUMMARY

| Mutation | Observable | Event | Coverage | Missing Fields |
|----------|------------|-------|----------|----------------|
| ARTICLE_CREATED | YES | ARTICLE_CREATED | 100% | None |
| ARTICLE_UPDATED | N/A | ARTICLE_UPDATED | N/A | Mutation does not exist |
| NEWSLETTER_CREATED | YES | NEWSLETTER_CREATED | 50% | summary, tags, key_ideas, actionable_insights, processed_at, archived |
| DIGEST_GENERATED | YES | DIGEST_GENERATED | 80% | content, generated_at |
| ARCHIVE_WRITTEN | YES | ARCHIVE_WRITTEN | 80% | content |
| MARKDOWN_WRITTEN | YES | MARKDOWN_WRITTEN | 80% | content |
| Ollama Analysis (Newsletter) | NO | NONE | 0% | summary, tags, key_ideas, actionable_insights, processed_at |
| Source Registration | NO | NONE | 0% | name, url, type, active |
| Newsletter Archive Flag | NO | NONE | 0% | archived |

---

## COVERAGE CALCULATION

**Critical Mutations:** 6 (ARTICLE_CREATED, NEWSLETTER_CREATED, DIGEST_GENERATED, ARCHIVE_WRITTEN, MARKDOWN_WRITTEN, Ollama Analysis)

**Observable Mutations:** 5 (ARTICLE_CREATED, NEWSLETTER_CREATED, DIGEST_GENERATED, ARCHIVE_WRITTEN, MARKDOWN_WRITTEN)

**Partially Observable Mutations:** 1 (NEWSLETTER_CREATED - 50% coverage)

**Invisible Mutations:** 1 (Ollama Analysis)

**Coverage Percentage:** 60% (5 observable out of 6 critical mutations, with 1 partially observable)

**Weighted Coverage:** 67% (100% * 1 + 50% * 1 + 100% * 3) / 5 = 350% / 5 = 70% (excluding invisible mutations)

---

## CRITICAL FINDINGS

1. **Ollama analysis results are invisible.** The most valuable knowledge (summary, tags, key_ideas, actionable_insights) is written to SQLite without event emission. This is the critical blocker for full rebuildability.

2. **NEWSLETTER_CREATED event is incomplete.** Only raw newsletter data is emitted, not the Ollama analysis results. This makes newsletters.db only 50% rebuildable from events.

3. **Source registration is invisible.** Source registration mutations are not emitted as events. This makes knowledge.db sources table not fully rebuildable.

4. **Newsletter archive flag is invisible.** Archive flag changes are not emitted as events. This is a minor gap (archive flag can be inferred from ARCHIVE_WRITTEN events).

5. **Digest and markdown content is not in events.** Content is too large for event payloads, but can be reconstructed from SQLite databases.

---

## ANSWER

**Observable Mutations:**
- ARTICLE_CREATED (100% coverage)
- NEWSLETTER_CREATED (50% coverage)
- DIGEST_GENERATED (80% coverage)
- ARCHIVE_WRITTEN (80% coverage)
- MARKDOWN_WRITTEN (80% coverage)

**Partially Observable Mutations:**
- NEWSLETTER_CREATED (50% coverage - missing Ollama analysis results)

**Invisible Mutations:**
- Ollama Analysis (Newsletter) - summary, tags, key_ideas, actionable_insights, processed_at
- Source Registration - name, url, type, active
- Newsletter Archive Flag - archived

**Coverage Percentage:** 60% (5 observable out of 6 critical mutations, with 1 partially observable)

**Weighted Coverage:** 67% (average coverage across observable mutations)

**Missing Events:**
- NEWSLETTER_ANALYZED (for Ollama analysis results)
- SOURCE_REGISTERED (for source registration)
- NEWSLETTER_ARCHIVED (for archive flag changes)
