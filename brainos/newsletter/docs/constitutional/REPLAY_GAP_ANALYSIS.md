# REPLAY GAP ANALYSIS

**Audit Date:** 2025-01-18  
**Audit Mode:** ZERO ASSUMPTION - READ ONLY  
**Audit Principle:** Determine whether current events are sufficient for deterministic replay. Identify missing events, invisible mutations, unreplayable state transitions, post-write emissions, side effects not captured.

---

## EXECUTIVE SUMMARY

**Current event stream is incomplete.** Major state mutations are invisible. Ollama analysis mutations are not emitted. Digest generation mutations are not emitted. Archive mutations are not emitted. Topic extraction mutations are not emitted. Current stream cannot support deterministic replay.

---

## CURRENT EVENT STREAM

### Existing Events

**NEWSLETTER_CREATED**
- Emitted by: crx-newsletter-brain/database.py save_raw_newsletter()
- Trigger: After SQLite write
- Payload: newsletter (message_id, subject, sender, body, word_count, received_at)
- Timing: POST-WRITE (after SQLite insert)

**DIGEST_GENERATED**
- Emitted by: crx-newsletter-brain/database.py save_digest()
- Trigger: After SQLite write
- Payload: digest (type, date, newsletter_count, content_length)
- Timing: POST-WRITE (after SQLite insert)

**ARTICLE_CREATED**
- Emitted by: crx-digestion-worker/database.py save_article()
- Trigger: After SQLite write
- Payload: article (url, title, summary, source, published_at, processed_at, tags)
- Timing: POST-WRITE (after SQLite insert)

**NEWSLETTER_PROCESSING_FAILED**
- Emitted by: crx-newsletter-brain/database.py update_newsletter_analysis()
- Trigger: On exception
- Payload: error message
- Timing: POST-WRITE (after SQLite update attempt)

**DATABASE_WRITE_FAILED**
- Emitted by: crx-newsletter-brain/database.py save_raw_newsletter(), update_newsletter_analysis()
- Emitted by: crx-digestion-worker/database.py save_article()
- Trigger: On exception
- Payload: table, error, worker
- Timing: POST-WRITE (after SQLite write attempt)

**INGESTION_CYCLE_STARTED**
- Emitted by: crx-newsletter-brain/worker.py run_ingestion_cycle()
- Trigger: Before Yahoo Mail fetch
- Payload: timestamp
- Timing: PRE-WRITE (before any writes)

**PROCESSING_CYCLE_STARTED**
- Emitted by: crx-newsletter-brain/worker.py run_processing_cycle()
- Trigger: Before Ollama analysis
- Payload: timestamp
- Timing: PRE-WRITE (before any writes)

**WORKER_HEARTBEAT**
- Emitted by: crx-newsletter-brain/worker.py run_ingestion_cycle(), run_processing_cycle()
- Emitted by: crx-digestion-worker/worker.py run_cycle()
- Trigger: Every cycle
- Payload: worker, cycle timestamp
- Timing: PRE-WRITE (before any writes)

**CYCLE_STARTED**
- Emitted by: crx-digestion-worker/worker.py run_cycle()
- Trigger: Before RSS fetch
- Payload: timestamp
- Timing: PRE-WRITE (before any writes)

**ARTICLE_PROCESSING_FAILED**
- Emitted by: crx-digestion-worker/database.py (commented out, not actually emitted)
- Trigger: On exception
- Payload: error message
- Timing: POST-WRITE (after SQLite update attempt)

---

## MISSING EVENTS

### OLLAMA_ANALYSIS_COMPLETED

**Status:** MISSING

**Mutation:** Ollama analysis of newsletter (summary, tags, key_ideas, actionable_insights, topics)

**Current Behavior:**
- crx-newsletter-brain/worker.py calls summarizer.analyze_newsletter()
- Ollama returns analysis
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to SQLite
- NO EVENT EMITTED

**Problem:** Ollama analysis mutation is invisible. Cannot replay Newsletter → Ollama analysis → SQLite update.

**Required Event:**
```json
{
  "event_type": "OLLAMA_ANALYSIS_COMPLETED",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "summary": "...",
    "tags": "...",
    "key_ideas": "...",
    "actionable_insights": "...",
    "topics": [...],
    "model": "...",
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite update)

---

### OLLAMA_SUMMARIZATION_COMPLETED

**Status:** MISSING

**Mutation:** Ollama summarization of article (summary, tags)

**Current Behavior:**
- crx-digestion-worker/worker.py calls summarizer.process_article()
- Ollama returns summary
- crx-digestion-worker/database.py save_article() writes to SQLite
- NO EVENT EMITTED

**Problem:** Ollama summarization mutation is invisible. Cannot replay Article → Ollama summarization → SQLite write.

**Required Event:**
```json
{
  "event_type": "OLLAMA_SUMMARIZATION_COMPLETED",
  "stream": "rss",
  "payload": {
    "url": "...",
    "summary": "...",
    "tags": "...",
    "model": "...",
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite write)

---

### NEWSLETTER_CLASSIFIED

**Status:** MISSING

**Mutation:** Topic extraction for newsletter

**Current Behavior:**
- crx-newsletter-brain/summarizer.py extracts topics
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to newsletter_topics table
- NO EVENT EMITTED

**Problem:** Topic extraction mutation is invisible. Cannot replay Newsletter → Topic extraction → SQLite write.

**Required Event:**
```json
{
  "event_type": "NEWSLETTER_CLASSIFIED",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "topics": [...],
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite update)

---

### TOPICS_EXTRACTED

**Status:** MISSING

**Mutation:** Topic extraction for newsletter (alternative naming)

**Current Behavior:**
- crx-newsletter-brain/summarizer.py extracts topics
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to newsletter_topics table
- NO EVENT EMITTED

**Problem:** Topic extraction mutation is invisible. Cannot replay Newsletter → Topic extraction → SQLite write.

**Required Event:**
```json
{
  "event_type": "TOPICS_EXTRACTED",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "topics": [...],
    "confidence": 1.0,
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite update)

---

### INSIGHTS_EXTRACTED

**Status:** MISSING

**Mutation:** Insight extraction for newsletter (key_ideas, actionable_insights)

**Current Behavior:**
- crx-newsletter-brain/summarizer.py extracts insights
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to SQLite
- NO EVENT EMITTED

**Problem:** Insight extraction mutation is invisible. Cannot replay Newsletter → Insight extraction → SQLite write.

**Required Event:**
```json
{
  "event_type": "INSIGHTS_EXTRACTED",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "key_ideas": "...",
    "actionable_insights": "...",
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite update)

---

### ARCHIVE_WRITTEN

**Status:** MISSING

**Mutation:** Archive newsletter to markdown

**Current Behavior:**
- crx-newsletter-brain/archive.py archive_newsletter() writes to markdown
- NO EVENT EMITTED (commented out in code)

**Problem:** Archive mutation is invisible. Cannot replay Newsletter → Archive → Markdown write.

**Required Event:**
```json
{
  "event_type": "ARCHIVE_WRITTEN",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "archive_path": "...",
    "timestamp": "..."
  }
}
```

**Timing:** POST-WRITE (after markdown write)

---

### MARKDOWN_WRITTEN

**Status:** MISSING

**Mutation:** Archive article to markdown

**Current Behavior:**
- crx-digestion-worker/archive.py archive_article() writes to markdown
- NO EVENT EMITTED (commented out in code)

**Problem:** Archive mutation is invisible. Cannot replay Article → Archive → Markdown write.

**Required Event:**
```json
{
  "event_type": "MARKDOWN_WRITTEN",
  "stream": "rss",
  "payload": {
    "url": "...",
    "archive_path": "...",
    "timestamp": "..."
  }
}
```

**Timing:** POST-WRITE (after markdown write)

---

### NEWSLETTER_ARCHIVED

**Status:** MISSING

**Mutation:** Mark newsletter as archived in SQLite

**Current Behavior:**
- crx-newsletter-brain/database.py mark_newsletter_archived() updates SQLite
- NO EVENT EMITTED

**Problem:** Archive status mutation is invisible. Cannot replay Newsletter → Archive status update.

**Required Event:**
```json
{
  "event_type": "NEWSLETTER_ARCHIVED",
  "stream": "yahoo",
  "payload": {
    "message_id": "...",
    "timestamp": "..."
  }
}
```

**Timing:** POST-WRITE (after SQLite update)

---

### DIGEST_CREATED

**Status:** MISSING

**Mutation:** Generate daily digest

**Current Behavior:**
- crx-newsletter-brain/digest_generator.py generate_daily_digest() generates digest
- crx-newsletter-brain/database.py save_digest() writes to SQLite
- DIGEST_GENERATED event is emitted (POST-WRITE)

**Problem:** Digest generation mutation is invisible before SQLite write. Cannot replay Newsletter → Digest generation.

**Required Event:**
```json
{
  "event_type": "DIGEST_CREATED",
  "stream": "yahoo",
  "payload": {
    "type": "daily",
    "date": "...",
    "newsletter_count": 10,
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite write)

---

### WEEKLY_REPORT_CREATED

**Status:** MISSING

**Mutation:** Generate weekly report

**Current Behavior:**
- crx-newsletter-brain/digest_generator.py generate_weekly_report() generates report
- crx-newsletter-brain/database.py save_digest() writes to SQLite
- DIGEST_GENERATED event is emitted (POST-WRITE)

**Problem:** Weekly report generation mutation is invisible before SQLite write. Cannot replay Newsletter → Weekly report generation.

**Required Event:**
```json
{
  "event_type": "WEEKLY_REPORT_CREATED",
  "stream": "yahoo",
  "payload": {
    "type": "weekly",
    "date": "...",
    "newsletter_count": 50,
    "timestamp": "..."
  }
}
```

**Timing:** PRE-WRITE (before SQLite write)

---

## INVISIBLE MUTATIONS

### Ollama Analysis Mutation

**Status:** INVISIBLE

**Mutation:** Ollama analysis of newsletter (summary, tags, key_ideas, actionable_insights, topics)

**Current Behavior:**
- crx-newsletter-brain/worker.py calls summarizer.analyze_newsletter()
- Ollama returns analysis
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to SQLite
- NO EVENT EMITTED

**Problem:** Ollama analysis mutation is invisible. Cannot replay Newsletter → Ollama analysis → SQLite update.

**Impact:** HIGH - Major state mutation is invisible. Cannot reconstruct state from events.

---

### Ollama Summarization Mutation

**Status:** INVISIBLE

**Mutation:** Ollama summarization of article (summary, tags)

**Current Behavior:**
- crx-digestion-worker/worker.py calls summarizer.process_article()
- Ollama returns summary
- crx-digestion-worker/database.py save_article() writes to SQLite
- NO EVENT EMITTED

**Problem:** Ollama summarization mutation is invisible. Cannot replay Article → Ollama summarization → SQLite write.

**Impact:** HIGH - Major state mutation is invisible. Cannot reconstruct state from events.

---

### Topic Extraction Mutation

**Status:** INVISIBLE

**Mutation:** Topic extraction for newsletter

**Current Behavior:**
- crx-newsletter-brain/summarizer.py extracts topics
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to newsletter_topics table
- NO EVENT EMITTED

**Problem:** Topic extraction mutation is invisible. Cannot replay Newsletter → Topic extraction → SQLite write.

**Impact:** MEDIUM - Topic extraction mutation is invisible. Cannot reconstruct topic state from events.

---

### Insight Extraction Mutation

**Status:** INVISIBLE

**Mutation:** Insight extraction for newsletter (key_ideas, actionable_insights)

**Current Behavior:**
- crx-newsletter-brain/summarizer.py extracts insights
- crx-newsletter-brain/database.py update_newsletter_analysis() writes to SQLite
- NO EVENT EMITTED

**Problem:** Insight extraction mutation is invisible. Cannot replay Newsletter → Insight extraction → SQLite write.

**Impact:** MEDIUM - Insight extraction mutation is invisible. Cannot reconstruct insight state from events.

---

### Archive Mutation

**Status:** INVISIBLE

**Mutation:** Archive newsletter to markdown

**Current Behavior:**
- crx-newsletter-brain/archive.py archive_newsletter() writes to markdown
- NO EVENT EMITTED (commented out in code)

**Problem:** Archive mutation is invisible. Cannot replay Newsletter → Archive → Markdown write.

**Impact:** LOW - Archive mutation is invisible. Cannot reconstruct archive state from events.

---

### Archive Status Mutation

**Status:** INVISIBLE

**Mutation:** Mark newsletter as archived in SQLite

**Current Behavior:**
- crx-newsletter-brain/database.py mark_newsletter_archived() updates SQLite
- NO EVENT EMITTED

**Problem:** Archive status mutation is invisible. Cannot replay Newsletter → Archive status update.

**Impact:** LOW - Archive status mutation is invisible. Cannot reconstruct archive status from events.

---

## UNREPLAYABLE STATE TRANSITIONS

### Newsletter → Ollama Analysis → SQLite Update

**Status:** UNREPLAYABLE

**Reason:** Ollama analysis mutation is invisible. No event emitted for Ollama analysis.

**Impact:** HIGH - Cannot reconstruct newsletter analysis state from events.

---

### Newsletter → Topic Extraction → SQLite Update

**Status:** UNREPLAYABLE

**Reason:** Topic extraction mutation is invisible. No event emitted for topic extraction.

**Impact:** MEDIUM - Cannot reconstruct topic state from events.

---

### Newsletter → Insight Extraction → SQLite Update

**Status:** UNREPLAYABLE

**Reason:** Insight extraction mutation is invisible. No event emitted for insight extraction.

**Impact:** MEDIUM - Cannot reconstruct insight state from events.

---

### Newsletter → Archive → Markdown Write

**Status:** UNREPLAYABLE

**Reason:** Archive mutation is invisible. No event emitted for archive write.

**Impact:** LOW - Cannot reconstruct archive state from events.

---

### Newsletter → Archive Status Update

**Status:** UNREPLAYABLE

**Reason:** Archive status mutation is invisible. No event emitted for archive status update.

**Impact:** LOW - Cannot reconstruct archive status from events.

---

### Article → Ollama Summarization → SQLite Write

**Status:** UNREPLAYABLE

**Reason:** Ollama summarization mutation is invisible. No event emitted for Ollama summarization.

**Impact:** HIGH - Cannot reconstruct article summary state from events.

---

### Article → Archive → Markdown Write

**Status:** UNREPLAYABLE

**Reason:** Archive mutation is invisible. No event emitted for archive write.

**Impact:** LOW - Cannot reconstruct archive state from events.

---

### Newsletter → Digest Generation → SQLite Write

**Status:** PARTIALLY REPLAYABLE

**Reason:** DIGEST_GENERATED event is emitted POST-WRITE. Digest generation mutation is invisible before SQLite write.

**Impact:** MEDIUM - Cannot reconstruct digest generation from events. Can reconstruct digest storage from events.

---

## POST-WRITE EMISSIONS

### NEWSLETTER_CREATED

**Status:** POST-WRITE

**Emission:** After SQLite insert

**Problem:** Event is emitted after SQLite write. Cannot replay from event alone because SQLite is source of truth.

**Impact:** MEDIUM - Event is derived from SQLite, not source of truth.

---

### DIGEST_GENERATED

**Status:** POST-WRITE

**Emission:** After SQLite insert

**Problem:** Event is emitted after SQLite write. Cannot replay from event alone because SQLite is source of truth.

**Impact:** MEDIUM - Event is derived from SQLite, not source of truth.

---

### ARTICLE_CREATED

**Status:** POST-WRITE

**Emission:** After SQLite insert

**Problem:** Event is emitted after SQLite write. Cannot replay from event alone because SQLite is source of truth.

**Impact:** MEDIUM - Event is derived from SQLite, not source of truth.

---

## SIDE EFFECTS NOT CAPTURED

### Ollama API Call

**Status:** NOT CAPTURED

**Side Effect:** Ollama API call for newsletter analysis

**Problem:** Ollama API call is not captured in event stream. Cannot replay Ollama API call from events.

**Impact:** HIGH - Ollama API call is not deterministic. Cannot replay Ollama API call from events.

---

### Ollama API Call

**Status:** NOT CAPTURED

**Side Effect:** Ollama API call for article summarization

**Problem:** Ollama API call is not captured in event stream. Cannot replay Ollama API call from events.

**Impact:** HIGH - Ollama API call is not deterministic. Cannot replay Ollama API call from events.

---

### Markdown File Write

**Status:** NOT CAPTURED

**Side Effect:** Markdown file write for newsletter archive

**Problem:** Markdown file write is not captured in event stream. Cannot replay markdown file write from events.

**Impact:** LOW - Markdown file write is not deterministic. Cannot replay markdown file write from events.

---

### Markdown File Write

**Status:** NOT CAPTURED

**Side Effect:** Markdown file write for article archive

**Problem:** Markdown file write is not captured in event stream. Cannot replay markdown file write from events.

**Impact:** LOW - Markdown file write is not deterministic. Cannot replay markdown file write from events.

---

## CRITICAL FINDINGS

1. **Current event stream is incomplete.** Major state mutations are invisible. Ollama analysis mutations are not emitted. Digest generation mutations are not emitted. Archive mutations are not emitted. Topic extraction mutations are not emitted.

2. **Ollama analysis mutations are invisible.** Ollama analysis of newsletter (summary, tags, key_ideas, actionable_insights, topics) is not emitted. Cannot replay Newsletter → Ollama analysis → SQLite update.

3. **Ollama summarization mutations are invisible.** Ollama summarization of article (summary, tags) is not emitted. Cannot replay Article → Ollama summarization → SQLite write.

4. **Topic extraction mutations are invisible.** Topic extraction for newsletter is not emitted. Cannot replay Newsletter → Topic extraction → SQLite update.

5. **Insight extraction mutations are invisible.** Insight extraction for newsletter (key_ideas, actionable_insights) is not emitted. Cannot replay Newsletter → Insight extraction → SQLite update.

6. **Archive mutations are invisible.** Archive newsletter to markdown is not emitted. Cannot replay Newsletter → Archive → Markdown write.

7. **Archive status mutations are invisible.** Mark newsletter as archived in SQLite is not emitted. Cannot replay Newsletter → Archive status update.

8. **Digest generation mutations are invisible.** Generate daily digest is not emitted before SQLite write. Cannot replay Newsletter → Digest generation.

9. **Post-write emissions are derived.** NEWSLETTER_CREATED, DIGEST_GENERATED, ARTICLE_CREATED are emitted POST-WRITE. Events are derived from SQLite, not source of truth.

10. **Ollama API calls are not captured.** Ollama API calls are not deterministic. Cannot replay Ollama API calls from events.

---

## ANSWER

**Missing Events:**
- OLLAMA_ANALYSIS_COMPLETED
- OLLAMA_SUMMARIZATION_COMPLETED
- NEWSLETTER_CLASSIFIED
- TOPICS_EXTRACTED
- INSIGHTS_EXTRACTED
- ARCHIVE_WRITTEN
- MARKDOWN_WRITTEN
- NEWSLETTER_ARCHIVED
- DIGEST_CREATED
- WEEKLY_REPORT_CREATED

**Invisible Mutations:**
- Ollama analysis mutation (summary, tags, key_ideas, actionable_insights, topics)
- Ollama summarization mutation (summary, tags)
- Topic extraction mutation (topics)
- Insight extraction mutation (key_ideas, actionable_insights)
- Archive mutation (markdown write)
- Archive status mutation (archived flag)

**Unreplayable State Transitions:**
- Newsletter → Ollama Analysis → SQLite Update (UNREPLAYABLE)
- Newsletter → Topic Extraction → SQLite Update (UNREPLAYABLE)
- Newsletter → Insight Extraction → SQLite Update (UNREPLAYABLE)
- Newsletter → Archive → Markdown Write (UNREPLAYABLE)
- Newsletter → Archive Status Update (UNREPLAYABLE)
- Article → Ollama Summarization → SQLite Write (UNREPLAYABLE)
- Article → Archive → Markdown Write (UNREPLAYABLE)
- Newsletter → Digest Generation → SQLite Write (PARTIALLY REPLAYABLE)

**Post-Write Emissions:**
- NEWSLETTER_CREATED (POST-WRITE)
- DIGEST_GENERATED (POST-WRITE)
- ARTICLE_CREATED (POST-WRITE)

**Side Effects Not Captured:**
- Ollama API call for newsletter analysis
- Ollama API call for article summarization
- Markdown file write for newsletter archive
- Markdown file write for article archive

**Current Stream Replay Capability:** 0% (Cannot replay any state transitions from events)
