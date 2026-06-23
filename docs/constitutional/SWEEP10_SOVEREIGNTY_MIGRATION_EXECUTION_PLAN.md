# SWEEP 10 — SOVEREIGNTY MIGRATION EXECUTION PLAN

**Plan Date:** 2026-06-18  
**Plan Mode:** MIGRATION EXECUTION (NOT AUDIT)  
**Plan Principle:** Generate minimal patch plan to make PING sovereign without redesigning architecture.

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Transform applications from direct SQLite writes to PING constitutional authority delegation.

**TRANSFORMATION:**

**FROM:**
```
Application
   ↓
SQLite Write
   ↓
Optional Event Emit
```

**TO:**
```
Application
   ↓
PING Commit Service
   ↓
Event Authority
   ↓
Identity Authority
   ↓
Canonical Authority
   ↓
Lineage Authority
   ↓
Persistence
```

**CONSTRAINTS:**
- Assume PING infrastructure already complete
- Do NOT build new systems
- Do NOT redesign kernel
- Only reroute authority

---

## MIGRATION EXECUTION TABLE

| Priority | File | Function | Change | Risk | Hours |
| -------- | ---- | -------- | ------ | ---- | ----- |
| P1 | crx-newsletter-brain/database.py | save_raw_newsletter | Replace sqlite3.connect with CommitService.commit() | HIGH | 4 |
| P1 | crx-newsletter-brain/database.py | update_newsletter_analysis | Replace sqlite3.connect with CommitService.update() | HIGH | 4 |
| P1 | crx-newsletter-brain/database.py | save_digest | Replace sqlite3.connect with CommitService.commit() | HIGH | 3 |
| P1 | crx-digestion-worker/database.py | save_article | Replace sqlite3.connect with CommitService.commit() | HIGH | 4 |
| P1 | crx-digestion-worker/database.py | register_source | Replace sqlite3.connect with CommitService.commit() | HIGH | 3 |
| P2 | crx-newsletter-brain/worker.py | run_ingestion_cycle | Replace message_id with CanonicalHashAuthority.compute() | MEDIUM | 2 |
| P2 | crx-newsletter-brain/worker.py | run_processing_cycle | Replace message_id with CanonicalHashAuthority.compute() | MEDIUM | 2 |
| P2 | crx-digestion-worker/worker.py | process_source | Replace url with CanonicalHashAuthority.compute() | MEDIUM | 2 |
| P3 | crx-newsletter-brain/database.py | save_raw_newsletter | Add CanonicalJson.canonicalize() before persistence | MEDIUM | 2 |
| P3 | crx-newsletter-brain/database.py | update_newsletter_analysis | Add CanonicalJson.canonicalize() before persistence | MEDIUM | 2 |
| P3 | crx-digestion-worker/database.py | save_article | Add CanonicalJson.canonicalize() before persistence | MEDIUM | 2 |
| P4 | crx-newsletter-brain/database.py | save_raw_newsletter | Add LineageAuthority.compute() before persistence | LOW | 2 |
| P4 | crx-newsletter-brain/database.py | update_newsletter_analysis | Add LineageAuthority.compute() before persistence | LOW | 2 |
| P4 | crx-digestion-worker/database.py | save_article | Add LineageAuthority.compute() before persistence | LOW | 2 |
| P5 | crx-newsletter-brain/database.py | save_raw_newsletter | Force event-first architecture (emit before persist) | LOW | 1 |
| P5 | crx-newsletter-brain/database.py | update_newsletter_analysis | Force event-first architecture (emit before persist) | LOW | 1 |
| P5 | crx-digestion-worker/database.py | save_article | Force event-first architecture (emit before persist) | LOW | 1 |

**Total Estimated Hours:** 35 hours

---

## DETAILED PATCH SPECIFICATIONS

### P1: Replace Direct SQLite Writes with CommitService

#### Patch 1.1: crx-newsletter-brain/database.py - save_raw_newsletter

**Current Code (lines 87-122):**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            newsletter['message_id'],
            newsletter['subject'],
            newsletter['sender'],
            newsletter['body'],
            newsletter['word_count'],
            newsletter['received_at']
        ))
        
        conn.commit()
        conn.close()
        
        # Emit constitutional event
        emit_newsletter_created(newsletter)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save newsletter: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        return False
```

**Patched Code:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(newsletter)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_newsletter_created(newsletter)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save newsletter: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        return False
```

**Change:** Replace sqlite3.connect with CommitService.commit()  
**Risk:** HIGH (core persistence path)  
**Hours:** 4

#### Patch 1.2: crx-newsletter-brain/database.py - update_newsletter_analysis

**Current Code (lines 124-176):**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE newsletters
            SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
            WHERE message_id = ?
        """, (
            analysis['summary'],
            analysis['tags'],
            analysis['key_ideas'],
            analysis['actionable_insights'],
            datetime.utcnow().isoformat(),
            message_id
        ))
        
        conn.commit()
        conn.close()
        
        return True
    except Exception as e:
        logger.error(f"Failed to update newsletter analysis: {e}")
        return False
```

**Patched Code:**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results via PING CommitService."""
    try:
        from constitutional_kernel import CommitService
        
        commit_service = CommitService()
        artifact_id = commit_service.update(message_id, analysis)
        
        return True
    except Exception as e:
        logger.error(f"Failed to update newsletter analysis: {e}")
        return False
```

**Change:** Replace sqlite3.connect with CommitService.update()  
**Risk:** HIGH (core persistence path)  
**Hours:** 4

#### Patch 1.3: crx-newsletter-brain/database.py - save_digest

**Current Code (lines 252-284):**
```python
def save_digest(digest_type: str, date: str, content: str, newsletter_count: int) -> bool:
    """Save a digest to the database."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO digests (type, date, content, generated_at, newsletter_count)
            VALUES (?, ?, ?, ?, ?)
        """, (
            digest_type,
            date,
            content,
            datetime.utcnow().isoformat(),
            newsletter_count
        ))
        
        conn.commit()
        conn.close()
        
        # Emit constitutional event
        emit_digest_generated({
            'type': digest_type,
            'date': date,
            'newsletter_count': newsletter_count,
            'content_length': len(content)
        })
        
        return True
    except Exception as e:
        logger.error(f"Failed to save digest: {e}")
        return False
```

**Patched Code:**
```python
def save_digest(digest_type: str, date: str, content: str, newsletter_count: int) -> bool:
    """Save a digest to the database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService
        
        digest = {
            'type': digest_type,
            'date': date,
            'content': content,
            'newsletter_count': newsletter_count
        }
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(digest)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_digest_generated(digest)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save digest: {e}")
        return False
```

**Change:** Replace sqlite3.connect with CommitService.commit()  
**Risk:** HIGH (core persistence path)  
**Hours:** 3

#### Patch 1.4: crx-digestion-worker/database.py - save_article

**Current Code (lines 57-93):**
```python
def save_article(article: Dict) -> bool:
    """Save article to database."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            article['url'],
            article['title'],
            article['summary'],
            article['source'],
            article['published_at'],
            article['processed_at'],
            article['tags']
        ))
        
        conn.commit()
        conn.close()
        
        # Emit constitutional event
        emit_article_created(article)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save article: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        return False
```

**Patched Code:**
```python
def save_article(article: Dict) -> bool:
    """Save article to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(article)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_article_created(article)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save article: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        return False
```

**Change:** Replace sqlite3.connect with CommitService.commit()  
**Risk:** HIGH (core persistence path)  
**Hours:** 4

#### Patch 1.5: crx-digestion-worker/database.py - register_source

**Current Code (lines 159-175):**
```python
def register_source(name: str, url: str, source_type: str) -> bool:
    """Register a source in the database."""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sources (name, url, source_type, registered_at)
            VALUES (?, ?, ?, ?)
        """, (
            name,
            url,
            source_type,
            datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return True
    except Exception as e:
        logger.error(f"Failed to register source: {e}")
        return False
```

**Patched Code:**
```python
def register_source(name: str, url: str, source_type: str) -> bool:
    """Register a source in the database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService
        
        source = {
            'name': name,
            'url': url,
            'source_type': source_type
        }
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(source)
        
        return True
    except Exception as e:
        logger.error(f"Failed to register source: {e}")
        return False
```

**Change:** Replace sqlite3.connect with CommitService.commit()  
**Risk:** HIGH (core persistence path)  
**Hours:** 3

### P2: Replace External Identity with PING Identity Authority

#### Patch 2.1: crx-newsletter-brain/worker.py - run_ingestion_cycle

**Current Code (lines 45-50):**
```python
if newsletter_exists(newsletter['message_id']):
    continue

# Save to database
if save_raw_newsletter(newsletter):
    new_count += 1
```

**Patched Code:**
```python
from constitutional_kernel import CanonicalHashAuthority

hash_authority = CanonicalHashAuthority()
artifact_id = hash_authority.compute(newsletter)

if commit_service.exists(artifact_id):
    continue

# Save to database via CommitService
if save_raw_newsletter(newsletter):
    new_count += 1
```

**Change:** Replace message_id with CanonicalHashAuthority.compute()  
**Risk:** MEDIUM (identity generation)  
**Hours:** 2

#### Patch 2.2: crx-newsletter-brain/worker.py - run_processing_cycle

**Current Code (lines 96-105):**
```python
# Update database with analysis
if update_newsletter_analysis(newsletter['message_id'], analysis):
    processed_count += 1

newsletter_with_analysis = newsletter.copy()
newsletter_with_analysis.update(analysis)
newsletter_with_analysis['processed_at'] = datetime.utcnow().isoformat()
```

**Patched Code:**
```python
from constitutional_kernel import CanonicalHashAuthority

hash_authority = CanonicalHashAuthority()
artifact_id = hash_authority.compute(newsletter)

# Update database via CommitService
if update_newsletter_analysis(artifact_id, analysis):
    processed_count += 1

newsletter_with_analysis = newsletter.copy()
newsletter_with_analysis.update(analysis)
newsletter_with_analysis['processed_at'] = datetime.utcnow().isoformat()
```

**Change:** Replace message_id with CanonicalHashAuthority.compute()  
**Risk:** MEDIUM (identity generation)  
**Hours:** 2

#### Patch 2.3: crx-digestion-worker/worker.py - process_source

**Current Code (lines 46-55):**
```python
if article_exists(article['url']):
    continue

# Save to database
if save_article(processed):
    archive_article(processed)
    new_count += 1
```

**Patched Code:**
```python
from constitutional_kernel import CanonicalHashAuthority

hash_authority = CanonicalHashAuthority()
artifact_id = hash_authority.compute(article)

if commit_service.exists(artifact_id):
    continue

# Save to database via CommitService
if save_article(processed):
    archive_article(processed)
    new_count += 1
```

**Change:** Replace url with CanonicalHashAuthority.compute()  
**Risk:** MEDIUM (identity generation)  
**Hours:** 2

### P3: Add Canonicalization Before Persistence

#### Patch 3.1: crx-newsletter-brain/database.py - save_raw_newsletter

**Patched Code:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_newsletter = canonical_json.canonicalize(newsletter)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_newsletter)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_newsletter_created(newsletter)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save newsletter: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        return False
```

**Change:** Add CanonicalJson.canonicalize() before persistence  
**Risk:** MEDIUM (canonicalization)  
**Hours:** 2

#### Patch 3.2: crx-newsletter-brain/database.py - update_newsletter_analysis

**Patched Code:**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_analysis = canonical_json.canonicalize(analysis)
        
        commit_service = CommitService()
        artifact_id = commit_service.update(message_id, canonical_analysis)
        
        return True
    except Exception as e:
        logger.error(f"Failed to update newsletter analysis: {e}")
        return False
```

**Change:** Add CanonicalJson.canonicalize() before persistence  
**Risk:** MEDIUM (canonicalization)  
**Hours:** 2

#### Patch 3.3: crx-digestion-worker/database.py - save_article

**Patched Code:**
```python
def save_article(article: Dict) -> bool:
    """Save article to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_article = canonical_json.canonicalize(article)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_article)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_article_created(article)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save article: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        return False
```

**Change:** Add CanonicalJson.canonicalize() before persistence  
**Risk:** MEDIUM (canonicalization)  
**Hours:** 2

### P4: Add Lineage Tracking

#### Patch 4.1: crx-newsletter-brain/database.py - save_raw_newsletter

**Patched Code:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_newsletter = canonical_json.canonicalize(newsletter)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_newsletter)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_newsletter, lineage)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_newsletter_created(newsletter)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save newsletter: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        return False
```

**Change:** Add LineageAuthority.compute() before persistence  
**Risk:** LOW (lineage tracking)  
**Hours:** 2

#### Patch 4.2: crx-newsletter-brain/database.py - update_newsletter_analysis

**Patched Code:**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_analysis = canonical_json.canonicalize(analysis)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_analysis, parent_id=message_id)
        
        commit_service = CommitService()
        artifact_id = commit_service.update(message_id, canonical_analysis, lineage)
        
        return True
    except Exception as e:
        logger.error(f"Failed to update newsletter analysis: {e}")
        return False
```

**Change:** Add LineageAuthority.compute() before persistence  
**Risk:** LOW (lineage tracking)  
**Hours:** 2

#### Patch 4.3: crx-digestion-worker/database.py - save_article

**Patched Code:**
```python
def save_article(article: Dict) -> bool:
    """Save article to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_article = canonical_json.canonicalize(article)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_article)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_article, lineage)
        
        # Emit constitutional event (now via PING Event Authority)
        emit_article_created(article)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save article: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        return False
```

**Change:** Add LineageAuthority.compute() before persistence  
**Risk:** LOW (lineage tracking)  
**Hours:** 2

### P5: Force Event-First Architecture

#### Patch 5.1: crx-newsletter-brain/database.py - save_raw_newsletter

**Patched Code:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority, EventAuthority
        
        # Event-first: emit event before persistence
        event_authority = EventAuthority()
        event_id = event_authority.emit('NEWSLETTER_CREATED', newsletter)
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_newsletter = canonical_json.canonicalize(newsletter)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_newsletter, parent_event_id=event_id)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_newsletter, lineage)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save newsletter: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('newsletters', str(e), 'yahoo_worker')
        return False
```

**Change:** Force event-first architecture (emit before persist)  
**Risk:** LOW (event ordering)  
**Hours:** 1

#### Patch 5.2: crx-newsletter-brain/database.py - update_newsletter_analysis

**Patched Code:**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority, EventAuthority
        
        # Event-first: emit event before persistence
        event_authority = EventAuthority()
        event_id = event_authority.emit('NEWSLETTER_UPDATED', analysis)
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_analysis = canonical_json.canonicalize(analysis)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_analysis, parent_id=message_id, parent_event_id=event_id)
        
        commit_service = CommitService()
        artifact_id = commit_service.update(message_id, canonical_analysis, lineage)
        
        return True
    except Exception as e:
        logger.error(f"Failed to update newsletter analysis: {e}")
        return False
```

**Change:** Force event-first architecture (emit before persist)  
**Risk:** LOW (event ordering)  
**Hours:** 1

#### Patch 5.3: crx-digestion-worker/database.py - save_article

**Patched Code:**
```python
def save_article(article: Dict) -> bool:
    """Save article to database via PING CommitService."""
    try:
        from constitutional_kernel import CommitService, CanonicalJson, LineageAuthority, EventAuthority
        
        # Event-first: emit event before persistence
        event_authority = EventAuthority()
        event_id = event_authority.emit('ARTICLE_CREATED', article)
        
        # Canonicalize before persistence
        canonical_json = CanonicalJson()
        canonical_article = canonical_json.canonicalize(article)
        
        # Compute lineage
        lineage_authority = LineageAuthority()
        lineage = lineage_authority.compute(canonical_article, parent_event_id=event_id)
        
        commit_service = CommitService()
        artifact_id = commit_service.commit(canonical_article, lineage)
        
        return True
    except Exception as e:
        logger.error(f"Failed to save article: {e}")
        # Emit constitutional event for database write failure
        emit_database_write_failed('articles', str(e), 'rss_worker')
        return False
```

**Change:** Force event-first architecture (emit before persist)  
**Risk:** LOW (event ordering)  
**Hours:** 1

---

## FINAL QUESTIONS

### Question 1

**What exact code changes make PING sovereign?**

**Answer:**

1. **Replace all direct SQLite writes with CommitService calls** (5 patches)
   - crx-newsletter-brain/database.py: save_raw_newsletter
   - crx-newsletter-brain/database.py: update_newsletter_analysis
   - crx-newsletter-brain/database.py: save_digest
   - crx-digestion-worker/database.py: save_article
   - crx-digestion-worker/database.py: register_source

2. **Replace external identity with PING Identity Authority** (3 patches)
   - crx-newsletter-brain/worker.py: run_ingestion_cycle (message_id → CanonicalHashAuthority.compute())
   - crx-newsletter-brain/worker.py: run_processing_cycle (message_id → CanonicalHashAuthority.compute())
   - crx-digestion-worker/worker.py: process_source (url → CanonicalHashAuthority.compute())

3. **Add canonicalization before persistence** (3 patches)
   - crx-newsletter-brain/database.py: save_raw_newsletter (add CanonicalJson.canonicalize())
   - crx-newsletter-brain/database.py: update_newsletter_analysis (add CanonicalJson.canonicalize())
   - crx-digestion-worker/database.py: save_article (add CanonicalJson.canonicalize())

4. **Add lineage tracking** (3 patches)
   - crx-newsletter-brain/database.py: save_raw_newsletter (add LineageAuthority.compute())
   - crx-newsletter-brain/database.py: update_newsletter_analysis (add LineageAuthority.compute())
   - crx-digestion-worker/database.py: save_article (add LineageAuthority.compute())

5. **Force event-first architecture** (3 patches)
   - crx-newsletter-brain/database.py: save_raw_newsletter (emit before persist)
   - crx-newsletter-brain/database.py: update_newsletter_analysis (emit before persist)
   - crx-digestion-worker/database.py: save_article (emit before persist)

**Total:** 17 code changes across 4 files

### Question 2

**How many files require patching?**

**Answer:** 4 files

**Files:**
1. crx-newsletter-brain/database.py
2. crx-newsletter-brain/worker.py
3. crx-digestion-worker/database.py
4. crx-digestion-worker/worker.py

### Question 3

**What is minimum patch set?**

**Answer:** P1 patches only (5 patches)

**Minimum Patch Set:**
1. crx-newsletter-brain/database.py: save_raw_newsletter (replace sqlite3.connect with CommitService.commit())
2. crx-newsletter-brain/database.py: update_newsletter_analysis (replace sqlite3.connect with CommitService.update())
3. crx-newsletter-brain/database.py: save_digest (replace sqlite3.connect with CommitService.commit())
4. crx-digestion-worker/database.py: save_article (replace sqlite3.connect with CommitService.commit())
5. crx-digestion-worker/database.py: register_source (replace sqlite3.connect with CommitService.commit())

**Rationale:** P1 patches replace direct SQLite writes with CommitService calls, which is the minimum requirement to force delegation to PING constitutional authority. P2-P5 patches are optional enhancements (identity, canonicalization, lineage, event-first) that can be added incrementally.

### Question 4

**Estimated engineering hours?**

**Answer:** 35 hours (full patch set) or 18 hours (minimum patch set)

**Breakdown:**
- P1 (CommitService): 18 hours (4+4+3+4+3)
- P2 (Identity): 6 hours (2+2+2)
- P3 (Canonicalization): 6 hours (2+2+2)
- P4 (Lineage): 6 hours (2+2+2)
- P5 (Event-First): 3 hours (1+1+1)

**Total:** 35 hours (full patch set)

**Minimum (P1 only):** 18 hours

### Question 5

**Can sovereignty be enforced without redesigning architecture?**

**Answer:** YES

**Rationale:**
- PING constitutional infrastructure already exists (CanonicalJson, CanonicalHashAuthority, LineageAuthority, EventAuthority, CommitService)
- Applications only need to import and use existing PING modules
- No new architecture required
- No new systems required
- Only reroute authority from direct SQLite writes to CommitService calls
- Migration is additive (add imports, replace function calls)
- Migration does not require redesigning database schema
- Migration does not require redesigning application logic
- Migration does not require redesigning event flow
- Migration is a simple function replacement exercise

**Conclusion:** Sovereignty can be enforced without redesigning architecture by replacing direct SQLite writes with CommitService calls and adding PING authority imports.

---

## OVERALL AUDIT PROGRESSION

### Audit 1: CONSTITUTIONAL DELEGATION AUDIT
**Finding:** PING constitutional authorities are DORMANT (code exists but not executed)

### Audit 2: CONSTITUTIONAL ENFORCEMENT AUDIT
**Finding:** PING authority is optional because applications have direct SQLite access

### Audit 3: SWEEP_2_IDENTITY_CANONICAL_AUDIT
**Finding:** Applications own identity (external identifiers, no canonicalization)

### Audit 4: SWEEP_10_SOVEREIGNTY_MIGRATION_EXECUTION_PLAN
**Finding:** Sovereignty can be enforced with 17 code changes across 4 files (35 hours)

**Progression:**
1. Identified that PING constitutional infrastructure exists but is dormant
2. Identified that applications bypass PING authority through direct SQLite access
3. Identified that applications own identity and do not use canonicalization
4. Generated minimal patch plan to make PING sovereign without redesigning architecture

**Conclusion:** PING can become sovereign with a focused migration effort that replaces direct SQLite writes with CommitService calls and adds PING authority imports. No architecture redesign required.
