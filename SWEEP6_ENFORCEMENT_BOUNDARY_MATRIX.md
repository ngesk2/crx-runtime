# SWEEP 6 — ENFORCEMENT BOUNDARY INJECTION AUDIT

**Audit Date:** 2026-06-18  
**Audit Mode:** ZERO ASSUMPTION — READ ONLY — RUNTIME REALITY ONLY  
**Purpose:** Find the smallest number of code interception points where PING can become mandatory.

---

## EXECUTIVE SUMMARY

**Primary Finding:** The highest leverage interception points are at the database connection layer and file system layer. Intercepting `sqlite3.connect()` and `open()` would force all mutations through PING with minimal code changes.

**Critical Insight:** All mutations flow through 2 choke points:
1. **SQLite Connection Layer:** All database mutations use `sqlite3.connect()`
2. **File System Layer:** All file writes use `open(...,'w')`

---

## ENFORCEMENT BOUNDARY MATRIX

| System | Mutation Function | File | Boundary Type | Intercept Point | Leverage |
|--------|------------------|------|---------------|----------------|----------|
| CRX Newsletter Brain | save_raw_newsletter() | database.py | SQLite | before sqlite3.connect() (line 89) | CRITICAL |
| CRX Newsletter Brain | update_newsletter_analysis() | database.py | SQLite | before sqlite3.connect() (line 126) | CRITICAL |
| CRX Newsletter Brain | mark_newsletter_archived() | database.py | SQLite | before sqlite3.connect() (line 180) | CRITICAL |
| CRX Newsletter Brain | save_digest() | database.py | SQLite | before sqlite3.connect() (line 254) | CRITICAL |
| CRX Newsletter Brain | archive_newsletter() | archive.py | Filesystem | before open() (line 74) | HIGH |
| CRX Newsletter Brain | generate_daily_digest() | digest_generator.py | SQLite | before save_digest() call (line 54) | MEDIUM |
| CRX Newsletter Brain | generate_daily_digest() | digest_generator.py | Filesystem | before open() (line 59) | HIGH |
| CRX Newsletter Brain | generate_weekly_report() | digest_generator.py | SQLite | before save_digest() call (line 123) | MEDIUM |
| CRX Newsletter Brain | generate_weekly_report() | digest_generator.py | Filesystem | before open() (line 128) | HIGH |
| CRX Digestion Worker | save_article() | database.py | SQLite | before sqlite3.connect() (line 59) | CRITICAL |
| CRX Digestion Worker | register_source() | database.py | SQLite | before sqlite3.connect() (line 161) | CRITICAL |
| CRX Digestion Worker | archive_article() | archive.py | Filesystem | before open() (line 60) | HIGH |
| PING Gateway | invokeOllama() | server.js | HTTP | before fetch() call (line 145) | HIGH |
| PING Commit Service | commitArtifact() | commit_controller.ts | PostgreSQL | before storeArtifact() call (line 19) | CRITICAL |
| KnowledgeOS | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| VOS | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Task Engine | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Decision Engine | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

---

## DETAILED FLOW ANALYSIS

### CRX Newsletter Brain

**Mutation 1: save_raw_newsletter()**
- **Entry Function:** worker.py:run_ingestion_cycle() (line 55)
- **Mutation Function:** database.py:save_raw_newsletter() (line 87)
- **Persistence Layer:** sqlite3.connect() (line 89)
- **External Write:** cursor.execute() INSERT (line 93)
- **Intercept Point:** before sqlite3.connect() (line 89)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 2: update_newsletter_analysis()**
- **Entry Function:** worker.py:run_processing_cycle() (line 98)
- **Mutation Function:** database.py:update_newsletter_analysis() (line 124)
- **Persistence Layer:** sqlite3.connect() (line 126)
- **External Write:** cursor.execute() UPDATE (line 130), INSERT (line 154)
- **Intercept Point:** before sqlite3.connect() (line 126)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 3: mark_newsletter_archived()**
- **Entry Function:** worker.py:run_processing_cycle() (line 108)
- **Mutation Function:** database.py:mark_newsletter_archived() (line 178)
- **Persistence Layer:** sqlite3.connect() (line 180)
- **External Write:** cursor.execute() UPDATE (line 184)
- **Intercept Point:** before sqlite3.connect() (line 180)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 4: save_digest()**
- **Entry Function:** worker.py:run_digest_generation() (line 124)
- **Mutation Function:** database.py:save_digest() (line 252)
- **Persistence Layer:** sqlite3.connect() (line 254)
- **External Write:** cursor.execute() INSERT (line 258)
- **Intercept Point:** before sqlite3.connect() (line 254)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 5: archive_newsletter()**
- **Entry Function:** worker.py:run_processing_cycle() (line 107)
- **Mutation Function:** archive.py:archive_newsletter() (line 10)
- **Persistence Layer:** open() (line 74)
- **External Write:** f.write() (line 75)
- **Intercept Point:** before open() (line 74)
- **Leverage:** HIGH (catches all file writes in this file)

**Mutation 6: generate_daily_digest()**
- **Entry Function:** worker.py:run_digest_generation() (line 124)
- **Mutation Function:** digest_generator.py:generate_daily_digest() (line 8)
- **Persistence Layer:** save_digest() call (line 54), open() (line 59)
- **External Write:** save_digest() (SQLite), f.write() (line 60)
- **Intercept Point:** before save_digest() call (line 54), before open() (line 59)
- **Leverage:** MEDIUM (delegates to other functions)

**Mutation 7: generate_weekly_report()**
- **Entry Function:** worker.py:run_digest_generation() (line 130)
- **Mutation Function:** digest_generator.py:generate_weekly_report() (line 64)
- **Persistence Layer:** save_digest() call (line 123), open() (line 128)
- **External Write:** save_digest() (SQLite), f.write() (line 129)
- **Intercept Point:** before save_digest() call (line 123), before open() (line 128)
- **Leverage:** MEDIUM (delegates to other functions)

---

### CRX Digestion Worker

**Mutation 1: save_article()**
- **Entry Function:** worker.py:process_source() (line 55)
- **Mutation Function:** database.py:save_article() (line 54)
- **Persistence Layer:** sqlite3.connect() (line 59)
- **External Write:** cursor.execute() INSERT (line 63)
- **Intercept Point:** before sqlite3.connect() (line 59)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 2: register_source()**
- **Entry Function:** worker.py:process_source() (line 55)
- **Mutation Function:** database.py:register_source() (line 159)
- **Persistence Layer:** sqlite3.connect() (line 161)
- **External Write:** cursor.execute() INSERT (line 165)
- **Intercept Point:** before sqlite3.connect() (line 161)
- **Leverage:** CRITICAL (catches all SQLite mutations in this file)

**Mutation 3: archive_article()**
- **Entry Function:** worker.py:process_source() (line 57)
- **Mutation Function:** archive.py:archive_article() (line 10)
- **Persistence Layer:** open() (line 60)
- **External Write:** f.write() (line 61)
- **Intercept Point:** before open() (line 60)
- **Leverage:** HIGH (catches all file writes in this file)

---

### PING Gateway

**Mutation 1: invokeOllama()**
- **Entry Function:** server.js:POST /inference (line 135)
- **Mutation Function:** server.js:invokeOllama() (line 135)
- **Persistence Layer:** fetch() HTTP call (line 145)
- **External Write:** Ollama HTTP request
- **Intercept Point:** before fetch() call (line 145)
- **Leverage:** HIGH (catches all inference requests)

---

### PING Commit Service

**Mutation 1: commitArtifact()**
- **Entry Function:** commit_controller.ts:POST /commit (line 9)
- **Mutation Function:** commit_controller.ts:commitArtifact() (line 9)
- **Persistence Layer:** storeArtifact() call (line 19)
- **External Write:** PostgreSQL INSERT (artifact_store.ts:line 4)
- **Intercept Point:** before storeArtifact() call (line 19)
- **Leverage:** CRITICAL (catches all artifact commits)

---

## HIGHEST LEVERAGE INTERCEPTION POINTS

### Level 1: Database Connection Layer (CRITICAL)

**Intercept Point:** Replace `sqlite3.connect()` with PING database wrapper

**Files to Patch:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (lines 89, 126, 180, 254)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` (lines 59, 161)

**Impact:** Catches 8/10 CRX mutations (80%)

**Implementation:** Monkey-patch `sqlite3.connect()` or replace with PING database adapter

---

### Level 2: File System Layer (HIGH)

**Intercept Point:** Replace `open(...,'w')` with PING file wrapper

**Files to Patch:**
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py` (line 74)
- `C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py` (line 60)
- `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\digest_generator.py` (lines 59, 128)

**Impact:** Catches 4/10 CRX mutations (40%)

**Implementation:** Monkey-patch `open()` or replace with PING file adapter

---

### Level 3: HTTP Layer (HIGH)

**Intercept Point:** Intercept `fetch()` calls in PING Gateway

**Files to Patch:**
- `C:\Users\nolan\PING\gateway\server.js` (line 145)

**Impact:** Catches 1/1 PING Gateway mutations (100%)

**Implementation:** Already uses PING event emitter (no patch needed for enforcement)

---

### Level 4: PostgreSQL Layer (CRITICAL)

**Intercept Point:** Intercept `pool.query()` calls in PING Commit Service

**Files to Patch:**
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts` (line 4)
- `C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts` (line 4)

**Impact:** Catches 1/1 PING Commit Service mutations (100%)

**Implementation:** Already uses PING event log (no patch needed for enforcement)

---

## SMALLEST SET OF INTERCEPTION POINTS

### Option A: Single Point Per Application (4 points)

1. **CRX Newsletter Brain:** Monkey-patch `sqlite3.connect()` in database.py
2. **CRX Digestion Worker:** Monkey-patch `sqlite3.connect()` in database.py
3. **PING Gateway:** Already uses PING event emitter (no patch needed)
4. **PING Commit Service:** Already uses PING event log (no patch needed)

**Total Points:** 2 (only CRX applications need patches)

**Coverage:** 80% of CRX mutations (database layer only)

---

### Option B: Two Points Per Application (6 points)

1. **CRX Newsletter Brain:** Monkey-patch `sqlite3.connect()` in database.py + `open()` in archive.py and digest_generator.py
2. **CRX Digestion Worker:** Monkey-patch `sqlite3.connect()` in database.py + `open()` in archive.py
3. **PING Gateway:** Already uses PING event emitter (no patch needed)
4. **PING Commit Service:** Already uses PING event log (no patch needed)

**Total Points:** 4 (2 per CRX application)

**Coverage:** 100% of CRX mutations (database + file system)

---

### Option C: Global Monkey-Patch (2 points)

1. **Global SQLite Patch:** Monkey-patch `sqlite3.connect()` at Python import time
2. **Global File Patch:** Monkey-patch `open()` at Python import time

**Total Points:** 2 (global patches)

**Coverage:** 100% of CRX mutations (all database and file operations)

**Implementation:** Add to application entry points (worker.py)

---

## FINAL QUESTION

**What is the smallest set of interception points that can force mandatory PING authority?**

**Answer:** 2 global monkey-patches

**Exact Points:**

1. **Global SQLite Patch:** Monkey-patch `sqlite3.connect()` in both worker.py files
   - File: `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py` (add at top)
   - File: `C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py` (add at top)
   - Impact: Catches all SQLite mutations (8/10 CRX mutations = 80%)

2. **Global File Patch:** Monkey-patch `open()` in both worker.py files
   - File: `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\worker.py` (add at top)
   - File: `C:\Users\nolan\CascadeProjects\crx-digestion-worker\worker.py` (add at top)
   - Impact: Catches all file writes (4/10 CRX mutations = 40%)

**Total Coverage:** 100% of CRX mutations (database + file system)

**Implementation Strategy:**

```python
# Add to top of worker.py files
import sqlite3
import builtins

# Monkey-patch sqlite3.connect()
original_connect = sqlite3.connect
def ping_connect(*args, **kwargs):
    # Call PING event authority before connecting
    from src.constitutional import emit_event
    emit_event('database', 'CONNECTION_REQUESTED', {'path': args[0]})
    return original_connect(*args, **kwargs)
sqlite3.connect = ping_connect

# Monkey-patch open()
original_open = builtins.open
def ping_open(*args, **kwargs):
    # Call PING event authority before opening file
    from src.constitutional import emit_event
    if 'w' in kwargs.get('mode', args[1] if len(args) > 1 else ''):
        emit_event('filesystem', 'FILE_WRITE_REQUESTED', {'path': args[0]})
    return original_open(*args, **kwargs)
builtins.open = ping_open
```

**Why This is the Smallest Set:**
- 2 patches total (1 per boundary type)
- Applied at 2 entry points (worker.py files)
- Catches 100% of CRX mutations
- No changes to mutation functions required
- Minimal code changes (10 lines per worker.py)
- Easy to rollback (remove patches)

**Alternative: Single Point Per Database File (4 points)**

If global monkey-patching is not acceptable, the next smallest set is:

1. `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py` (line 89)
2. `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py` (line 59)
3. `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\archive.py` (line 74)
4. `C:\Users\nolan\CascadeProjects\crx-digestion-worker\archive.py` (line 60)

**Total Points:** 4

**Coverage:** 100% of CRX mutations (database + file system)

**Implementation:** Replace `sqlite3.connect()` and `open()` with PING wrappers at each call site.
