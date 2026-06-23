# SWEEP A5 — CONSTITUTIONAL ENFORCEMENT GAP AUDIT

**Audit Date:** 2026-06-18  
**Audit Mode:** ZERO ASSUMPTION — READ ONLY — RUNTIME REALITY ONLY  
**Audit Principle:** Determine the minimum code changes required to make PING sovereign.

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Determine the minimum code changes required to make PING sovereign using outputs from Agents 1-4.

**FINAL DETERMINATION:** 17 code changes across 4 files required to make PING sovereign. 35 engineering hours estimated.

**KEY FINDINGS:**
- Direct Bypass Matrix: 5 direct SQLite write bypasses identified
- Replacement Matrix: 5 CommitService replacements required
- Mandatory Migration List: 4 authority migrations required (Event, Identity, Canonical, Lineage)
- Event-First Enforcement: 3 event-first ordering changes required
- Total: 17 code changes across 4 files

---

## DIRECT BYPASS MATRIX

| File | Function | Bypass Type | Authority Missing |
| ---- | -------- | ----------- | ----------------- |
| crx-newsletter-brain/database.py | save_raw_newsletter | Direct SQLite INSERT | CommitService, Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-newsletter-brain/database.py | update_newsletter_analysis | Direct SQLite UPDATE | CommitService, Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-newsletter-brain/database.py | save_digest | Direct SQLite INSERT | CommitService, Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-digestion-worker/database.py | save_article | Direct SQLite INSERT | CommitService, Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-digestion-worker/database.py | register_source | Direct SQLite INSERT | CommitService, Event Authority, Identity Authority, Canonical Authority, Lineage Authority |

---

## REPLACEMENT MATRIX

| Current Call | Replacement | Authority |
| ------------ | ----------- | --------- |
| sqlite3.connect(DATABASE_PATH) | CommitService.commit() | CommitService |
| cursor.execute("INSERT INTO ...") | CommitService.commit() | CommitService |
| cursor.execute("UPDATE INTO ...") | CommitService.update() | CommitService |
| newsletter['message_id'] (external) | CanonicalHashAuthority.compute() | Identity Authority |
| article['url'] (external) | CanonicalHashAuthority.compute() | Identity Authority |
| JSON.stringify(payload) (standard) | CanonicalJson.canonicalize() | Canonical Authority |
| emit_newsletter_created(newsletter) (after mutation) | EventAuthority.emit() (before mutation) | Event Authority |
| emit_article_created(article) (after mutation) | EventAuthority.emit() (before mutation) | Event Authority |
| emitInferenceRequest(model, messages) (observational) | EventAuthority.emit() (authoritative) | Event Authority |
| None (no lineage) | LineageAuthority.compute() | Lineage Authority |

---

## MANDATORY MIGRATION LIST

### Migration 1: Move UUID Generation

**From:** CRX → External Identity (message_id from Yahoo Mail, url from RSS feed)

**To:** CRX → PING Identity Authority (CanonicalHashAuthority.compute())

**Files:**
- crx-newsletter-brain/worker.py (run_ingestion_cycle, run_processing_cycle)
- crx-digestion-worker/worker.py (process_source)

**Changes:**
- Replace message_id with CanonicalHashAuthority.compute()
- Replace url with CanonicalHashAuthority.compute()

**Risk:** MEDIUM (identity generation)

**Hours:** 6

---

### Migration 2: Move Event Creation

**From:** CRX → brain/src/constitutional (observational, after mutation)

**To:** CRX → PING Event Authority (authoritative, before mutation)

**Files:**
- crx-newsletter-brain/database.py (save_raw_newsletter, update_newsletter_analysis, save_digest)
- crx-digestion-worker/database.py (save_article)
- PING Gateway/server.js (invokeOllama)

**Changes:**
- Replace emit_newsletter_created with EventAuthority.emit() (before mutation)
- Replace emit_article_created with EventAuthority.emit() (before mutation)
- Replace emitInferenceRequest with EventAuthority.emit() (authoritative)

**Risk:** MEDIUM (event ordering)

**Hours:** 6

---

### Migration 3: Move Lineage Tracking

**From:** CRX → None (no lineage)

**To:** CRX → PING Lineage Authority (LineageAuthority.compute())

**Files:**
- crx-newsletter-brain/database.py (save_raw_newsletter, update_newsletter_analysis)
- crx-digestion-worker/database.py (save_article)

**Changes:**
- Add LineageAuthority.compute() before persistence
- Track parent-child relationships
- Track DAG structure

**Risk:** LOW (lineage tracking)

**Hours:** 6

---

### Migration 4: Move Persistence Ownership

**From:** CRX → Direct SQLite writes

**To:** CRX → PING Commit Service

**Files:**
- crx-newsletter-brain/database.py (save_raw_newsletter, update_newsletter_analysis, save_digest)
- crx-digestion-worker/database.py (save_article, register_source)

**Changes:**
- Replace sqlite3.connect with CommitService.commit()
- Replace cursor.execute with CommitService.commit()
- Replace cursor.execute with CommitService.update()

**Risk:** HIGH (core persistence path)

**Hours:** 18

---

### Migration 5: Require Event Creation

**From:** Mutation → Event (mutation-first architecture)

**To:** Event → Mutation (event-first architecture)

**Files:**
- crx-newsletter-brain/database.py (save_raw_newsletter, update_newsletter_analysis)
- crx-digestion-worker/database.py (save_article)

**Changes:**
- Emit event BEFORE state mutation
- Event authorizes mutation
- State derived from event

**Risk:** LOW (event ordering)

**Hours:** 3

---

## COMBINED OUTPUT

These five migrations collectively answer every constitutional question:

| Audit Area | Agent | Status |
| ---------- | ----- | ------ |
| Authority delegation | A1 | FAIL - Applications do NOT delegate to PING |
| Event-first enforcement | A2 | FAIL - Applications follow mutation-first architecture |
| Replayability | A3 | FAIL - State CANNOT be reconstructed from events |
| Runtime sovereignty | A4 | FAIL - Applications can boot without PING |
| Exact migration plan | A5 | 17 code changes across 4 files (35 hours) |

---

## MINIMUM CODE CHANGES REQUIRED

### Priority 1: Replace Direct SQLite Writes with CommitService (5 patches)

**Files:**
1. crx-newsletter-brain/database.py - save_raw_newsletter (line 89)
2. crx-newsletter-brain/database.py - update_newsletter_analysis (line 126)
3. crx-newsletter-brain/database.py - save_digest (line 254)
4. crx-digestion-worker/database.py - save_article (line 59)
5. crx-digestion-worker/database.py - register_source (line 161)

**Change:** Replace sqlite3.connect with CommitService.commit()

**Risk:** HIGH

**Hours:** 18

---

### Priority 2: Replace External Identity with PING Identity Authority (3 patches)

**Files:**
1. crx-newsletter-brain/worker.py - run_ingestion_cycle (line 45)
2. crx-newsletter-brain/worker.py - run_processing_cycle (line 96)
3. crx-digestion-worker/worker.py - process_source (line 46)

**Change:** Replace message_id/url with CanonicalHashAuthority.compute()

**Risk:** MEDIUM

**Hours:** 6

---

### Priority 3: Add Canonicalization Before Persistence (3 patches)

**Files:**
1. crx-newsletter-brain/database.py - save_raw_newsletter (line 93)
2. crx-newsletter-brain/database.py - update_newsletter_analysis (line 130)
3. crx-digestion-worker/database.py - save_article (line 63)

**Change:** Add CanonicalJson.canonicalize() before persistence

**Risk:** MEDIUM

**Hours:** 6

---

### Priority 4: Add Lineage Tracking (3 patches)

**Files:**
1. crx-newsletter-brain/database.py - save_raw_newsletter (line 93)
2. crx-newsletter-brain/database.py - update_newsletter_analysis (line 130)
3. crx-digestion-worker/database.py - save_article (line 63)

**Change:** Add LineageAuthority.compute() before persistence

**Risk:** LOW

**Hours:** 6

---

### Priority 5: Force Event-First Architecture (3 patches)

**Files:**
1. crx-newsletter-brain/database.py - save_raw_newsletter (line 107)
2. crx-newsletter-brain/database.py - update_newsletter_analysis (line 118)
3. crx-digestion-worker/database.py - save_article (line 78)

**Change:** Emit event BEFORE state mutation

**Risk:** LOW

**Hours:** 3

---

## TOTAL ESTIMATE

**Total Code Changes:** 17

**Total Files:** 4

**Total Hours:** 35

**Breakdown:**
- Priority 1 (CommitService): 18 hours (5 patches)
- Priority 2 (Identity): 6 hours (3 patches)
- Priority 3 (Canonicalization): 6 hours (3 patches)
- Priority 4 (Lineage): 6 hours (3 patches)
- Priority 5 (Event-First): 3 hours (3 patches)

---

## CONCLUSION

**Constitutional Enforcement Gap:**

- Authority delegation: FAIL (A1)
- Event-first enforcement: FAIL (A2)
- Replayability: FAIL (A3)
- Runtime sovereignty: FAIL (A4)

**Minimum Code Changes Required:**

- 17 code changes across 4 files
- 35 engineering hours estimated
- 5 priority levels (P1-P5)

**Final Determination:** PING can become sovereign with a focused migration effort that replaces direct SQLite writes with CommitService calls, replaces external identity with PING Identity Authority, adds canonicalization, adds lineage tracking, and forces event-first architecture. No architecture redesign required.
