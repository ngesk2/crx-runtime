# AGENT 5 — CONSTITUTIONAL ENFORCEMENT GAP AUDIT

**Audit Name:** SWEEP_A5_SOVEREIGNTY_MIGRATION_PLAN
**Audit Date:** 2026-06-18
**Audit Mode:** ZERO ASSUMPTION — READ ONLY — RUNTIME REALITY ONLY
**Mission:** Determine the minimum code changes required to make PING sovereign

---

## SCOPE

Uses outputs from Agents 1–4

---

## QUESTIONS

- What exact runtime mutations bypass PING?
- What exact interception points force compliance?

---

## DIRECT BYPASS MATRIX

| File                                    | Function                    | Bypass Type                  | Authority Missing              |
| --------------------------------------- | --------------------------- | --------------------------- | ------------------------------ |
| crx-newsletter-brain/database.py        | save_raw_newsletter()       | Direct SQLite INSERT         | Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-newsletter-brain/database.py        | update_newsletter_analysis() | Direct SQLite UPDATE         | Event Authority, Canonical Authority, Lineage Authority |
| crx-newsletter-brain/database.py        | save_digest()               | Direct SQLite INSERT         | Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-newsletter-brain/archive.py         | archive_newsletter()        | Direct File Write            | Event Authority, Canonical Authority, Lineage Authority |
| crx-digestion-worker/database.py        | save_article()              | Direct SQLite INSERT         | Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-digestion-worker/database.py        | register_source()           | Direct SQLite INSERT         | Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| crx-digestion-worker/archive.py         | archive_article()           | Direct File Write            | Event Authority, Canonical Authority, Lineage Authority |
| PING/gateway/event_emitter.js           | emitEvent()                 | Direct PostgreSQL INSERT     | Identity Authority, Canonical Authority, Lineage Authority |

---

## REPLACEMENT MATRIX

| Current Call                                   | Replacement                          | Authority                     |
| ---------------------------------------------- | ------------------------------------ | ------------------------------ |
| sqlite3.connect(DATABASE_PATH)                | CommitService.commitArtifact()        | Event Authority, Identity Authority, Canonical Authority, Lineage Authority |
| SQLite INTEGER PRIMARY KEY auto-increment      | CanonicalHashAuthority.computeFingerprint() | Identity Authority |
| JSON.stringify(payload)                        | CanonicalJson.canonicalize()          | Canonical Authority            |
| No lineage tracking                            | LineageGraph.buildLineageGraph()     | Lineage Authority              |
| Event emission after mutation                  | Event emission before mutation        | Event Authority                |
| brain/src/constitutional event_emitter.py       | PING runtime event_emitter            | Event Authority                |

---

## MANDATORY MIGRATION LIST

### Phase 1: Identity Enforcement (LOWEST RISK)

**Move UUID generation:**
- **From:** CRX Application (SQLite auto-increment)
- **To:** PING Identity Authority (CanonicalHashAuthority.computeFingerprint())

**Files to Modify:**
- `crx-newsletter-brain/database.py` - Line 19 (replace INTEGER PRIMARY KEY with TEXT PRIMARY KEY)
- `crx-digestion-worker/database.py` - Line 18 (replace INTEGER PRIMARY KEY with TEXT PRIMARY KEY)

**Functions to Modify:**
- `crx-newsletter-brain/database.py:init_database()`
- `crx-digestion-worker/database.py:init_database()`

**Import Changes:**
- Add: `from ping.runtime.replay import CanonicalHashAuthority`

**Risk:** LOW
- Blast Radius: ID generation only
- Rollback Safety: HIGH (can revert to auto-increment)

---

### Phase 2: Canonical Enforcement (LOW RISK)

**Move canonicalization:**
- **From:** CRX Application (no canonicalization / JSON.stringify)
- **To:** PING Canonical Authority (CanonicalJson.canonicalize())

**Files to Modify:**
- `crx-newsletter-brain/database.py` - Line 93 (canonicalize before INSERT)
- `crx-newsletter-brain/database.py` - Line 130 (canonicalize before UPDATE)
- `crx-newsletter-brain/database.py` - Line 258 (canonicalize before INSERT)
- `crx-digestion-worker/database.py` - Line 63 (canonicalize before INSERT)
- `crx-digestion-worker/database.py` - Line 165 (canonicalize before INSERT)
- `PING/gateway/event_emitter.js` - Line 25 (replace JSON.stringify with CanonicalJson.canonicalize)

**Functions to Modify:**
- `crx-newsletter-brain/database.py:save_raw_newsletter()`
- `crx-newsletter-brain/database.py:update_newsletter_analysis()`
- `crx-newsletter-brain/database.py:save_digest()`
- `crx-digestion-worker/database.py:save_article()`
- `crx-digestion-worker/database.py:register_source()`
- `PING/gateway/event_emitter.js:emitEvent()`

**Import Changes:**
- Add: `from ping.runtime.replay import CanonicalJson`

**Risk:** LOW
- Blast Radius: Data serialization only
- Rollback Safety: HIGH (can remove canonicalization)

---

### Phase 3: Event-First Mutation Enforcement (MEDIUM RISK)

**Move event creation:**
- **From:** CRX Application (brain/src/constitutional event_emitter.py)
- **To:** PING Event Authority (PING runtime event_emitter)

**Require event creation:**
- **Before:** state mutation
- **After:** state mutation (current violation)

**Files to Modify:**
- `crx-newsletter-brain/database.py` - Line 107 (move emit_newsletter_created before line 93)
- `crx-newsletter-brain/database.py` - Line 166 (move emit_newsletter_processing_failed before line 130)
- `crx-newsletter-brain/database.py` - Line 271 (move emit_digest_generated before line 258)
- `crx-digestion-worker/database.py` - Line 78 (move emit_article_created before line 63)
- `crx-digestion-worker/database.py` - Add event emission for register_source() (currently missing)

**Functions to Modify:**
- `crx-newsletter-brain/database.py:save_raw_newsletter()`
- `crx-newsletter-brain/database.py:update_newsletter_analysis()`
- `crx-newsletter-brain/database.py:save_digest()`
- `crx-digestion-worker/database.py:save_article()`
- `crx-digestion-worker/database.py:register_source()`

**Import Changes:**
- Remove: `from src.constitutional import emit_event`
- Add: `from ping.runtime.event_authority import emitEvent`

**Risk:** MEDIUM
- Blast Radius: All mutation paths
- Rollback Safety: MEDIUM (requires event cleanup)

---

### Phase 4: Lineage Tracking Enforcement (MEDIUM RISK)

**Move lineage tracking:**
- **From:** CRX Application (no lineage tracking)
- **To:** PING Lineage Authority (LineageGraph.buildLineageGraph())

**Files to Modify:**
- `crx-newsletter-brain/database.py` - Add lineage tracking to save_raw_newsletter() (line 93)
- `crx-newsletter-brain/database.py` - Add lineage tracking to update_newsletter_analysis() (line 130)
- `crx-newsletter-brain/database.py` - Add lineage tracking to save_digest() (line 258)
- `crx-digestion-worker/database.py` - Add lineage tracking to save_article() (line 63)
- `crx-digestion-worker/database.py` - Add lineage tracking to register_source() (line 165)

**Functions to Modify:**
- `crx-newsletter-brain/database.py:save_raw_newsletter()`
- `crx-newsletter-brain/database.py:update_newsletter_analysis()`
- `crx-newsletter-brain/database.py:save_digest()`
- `crx-digestion-worker/database.py:save_article()`
- `crx-digestion-worker/database.py:register_source()`

**Import Changes:**
- Add: `from ping.runtime.replay import LineageGraph`

**Risk:** MEDIUM
- Blast Radius: All mutation paths
- Rollback Safety: MEDIUM (requires lineage cleanup)

---

### Phase 5: Commit Service Mandatory (HIGH RISK)

**Move persistence ownership:**
- **From:** CRX Application (SQLite direct writes)
- **To:** PING Commit Service (CommitService.commitArtifact())

**Files to Modify:**
- `crx-newsletter-brain/database.py` - Line 13 (replace sqlite3.connect with CommitService)
- `crx-newsletter-brain/database.py` - Line 93 (add CommitService.commitArtifact before INSERT)
- `crx-newsletter-brain/database.py` - Line 130 (add CommitService.commitArtifact before UPDATE)
- `crx-newsletter-brain/database.py` - Line 258 (add CommitService.commitArtifact before INSERT)
- `crx-digestion-worker/database.py` - Line 13 (replace sqlite3.connect with CommitService)
- `crx-digestion-worker/database.py` - Line 63 (add CommitService.commitArtifact before INSERT)
- `crx-digestion-worker/database.py` - Line 165 (add CommitService.commitArtifact before INSERT)

**Functions to Modify:**
- `crx-newsletter-brain/database.py:init_database()`
- `crx-newsletter-brain/database.py:save_raw_newsletter()`
- `crx-newsletter-brain/database.py:update_newsletter_analysis()`
- `crx-newsletter-brain/database.py:save_digest()`
- `crx-digestion-worker/database.py:init_database()`
- `crx-digestion-worker/database.py:save_article()`
- `crx-digestion-worker/database.py:register_source()`

**Import Changes:**
- Remove: `import sqlite3`
- Add: `from ping.runtime.kernel.commit_service import CommitService`

**Risk:** HIGH
- Blast Radius: All mutation paths
- Rollback Safety: LOW (requires CommitService availability)

---

### Phase 6: Runtime Dependency Enforcement (HIGHEST RISK)

**Add PING runtime dependency:**
- **From:** No PING imports
- **To:** Mandatory PING imports

**Files to Modify:**
- `crx-newsletter-brain/worker.py` - Add PING runtime imports
- `crx-digestion-worker/worker.py` - Add PING runtime imports

**Import Changes:**
- Add: `from ping.runtime.replay import CanonicalHashAuthority, CanonicalJson, LineageGraph`
- Add: `from ping.runtime.kernel.commit_service import CommitService`

**Risk:** HIGHEST
- Blast Radius: Entire application startup
- Rollback Safety: LOWEST (requires PING runtime availability)

---

## ENFORCEMENT MIGRATION ORDER

### Phase 1: Identity Enforcement (LOWEST RISK)
- Replace SQLite auto-increment IDs with CanonicalHashAuthority
- Modify database schemas to use TEXT PRIMARY KEY
- Update all INSERT statements to use CanonicalHashAuthority.computeFingerprint()

### Phase 2: Canonical Enforcement (LOW RISK)
- Add canonicalization before persistence
- Import CanonicalJson from PING replay subsystem
- Canonicalize all payloads before INSERT/UPDATE

### Phase 3: Event-First Mutation Enforcement (MEDIUM RISK)
- Move event emission before state mutation
- Make SQLite INSERT/UPDATE dependent on successful event creation
- Rollback mutations if event creation fails
- Replace brain/src/constitutional with PING runtime event_emitter

### Phase 4: Lineage Tracking Enforcement (MEDIUM RISK)
- Add lineage tracking to all mutation functions
- Import LineageGraph from PING replay subsystem
- Build lineage graph before state mutation

### Phase 5: Commit Service Mandatory (HIGH RISK)
- Import CommitService from PING runtime
- Add CommitService.commitArtifact() call before all SQLite INSERT/UPDATE
- Replace sqlite3.connect() with CommitService persistence layer

### Phase 6: Runtime Dependency Enforcement (HIGHEST RISK)
- Add mandatory PING runtime imports to worker.py
- Ensure PING runtime is available at startup
- Verify PING runtime connectivity before application start

---

## EXACT PATCH POINTS

### CRX Newsletter Brain

**File:** `C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py`

**Patch 1:** Line 13
```python
# BEFORE:
conn = sqlite3.connect(DATABASE_PATH)

# AFTER:
from ping.runtime.kernel.commit_service import CommitService
commit_service = CommitService()
```

**Patch 2:** Line 19
```python
# BEFORE:
id INTEGER PRIMARY KEY,

# AFTER:
id TEXT PRIMARY KEY,
```

**Patch 3:** Line 93
```python
# BEFORE:
cursor.execute("""
    INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
    VALUES (?, ?, ?, ?, ?, ?)
""", (...))
conn.commit()
emit_newsletter_created(newsletter)

# AFTER:
from ping.runtime.replay import CanonicalHashAuthority, CanonicalJson, LineageGraph
artifact_id = CanonicalHashAuthority.computeFingerprint(newsletter)
canonical_payload = CanonicalJson.canonicalize(newsletter)
lineage_graph = LineageGraph.buildLineageGraph(parent_ids=[...], child_id=artifact_id)
await commit_service.commitArtifact(artifact_id, canonical_payload, lineage_graph)
emit_newsletter_created(newsletter)
cursor.execute("""
    INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
    VALUES (?, ?, ?, ?, ?, ?)
""", (...))
```

**Patch 4:** Line 130
```python
# BEFORE:
cursor.execute("""
    UPDATE newsletters
    SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
    WHERE message_id = ?
""", (...))
conn.commit()
emit_newsletter_processing_failed(message_id, str(e), 'yahoo_worker')

# AFTER:
artifact_id = CanonicalHashAuthority.computeFingerprint(newsletter)
canonical_payload = CanonicalJson.canonicalize(newsletter)
lineage_graph = LineageGraph.buildLineageGraph(parent_ids=[...], child_id=artifact_id)
await commit_service.commitArtifact(artifact_id, canonical_payload, lineage_graph)
emit_newsletter_processing_failed(message_id, str(e), 'yahoo_worker')
cursor.execute("""
    UPDATE newsletters
    SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
    WHERE message_id = ?
""", (...))
```

**Patch 5:** Line 258
```python
# BEFORE:
cursor.execute("""
    INSERT INTO digests (type, date, content, generated_at, newsletter_count)
    VALUES (?, ?, ?, ?, ?)
""", (...))
conn.commit()
emit_digest_generated(digest)

# AFTER:
artifact_id = CanonicalHashAuthority.computeFingerprint(digest)
canonical_payload = CanonicalJson.canonicalize(digest)
lineage_graph = LineageGraph.buildLineageGraph(parent_ids=[...], child_id=artifact_id)
await commit_service.commitArtifact(artifact_id, canonical_payload, lineage_graph)
emit_digest_generated(digest)
cursor.execute("""
    INSERT INTO digests (type, date, content, generated_at, newsletter_count)
    VALUES (?, ?, ?, ?, ?)
""", (...))
```

---

### CRX Digestion Worker

**File:** `C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py`

**Patch 1:** Line 13
```python
# BEFORE:
conn = sqlite3.connect(DATABASE_PATH)

# AFTER:
from ping.runtime.kernel.commit_service import CommitService
commit_service = CommitService()
```

**Patch 2:** Line 18
```python
# BEFORE:
id INTEGER PRIMARY KEY,

# AFTER:
id TEXT PRIMARY KEY,
```

**Patch 3:** Line 63
```python
# BEFORE:
cursor.execute("""
    INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (...))
conn.commit()
emit_article_created(article)

# AFTER:
from ping.runtime.replay import CanonicalHashAuthority, CanonicalJson, LineageGraph
artifact_id = CanonicalHashAuthority.computeFingerprint(article)
canonical_payload = CanonicalJson.canonicalize(article)
lineage_graph = LineageGraph.buildLineageGraph(parent_ids=[...], child_id=artifact_id)
await commit_service.commitArtifact(artifact_id, canonical_payload, lineage_graph)
emit_article_created(article)
cursor.execute("""
    INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (...))
```

**Patch 4:** Line 165
```python
# BEFORE:
cursor.execute("""
    INSERT OR IGNORE INTO sources (name, url, type)
    VALUES (?, ?, ?)
""", (...))
conn.commit()

# AFTER:
artifact_id = CanonicalHashAuthority.computeFingerprint(source)
canonical_payload = CanonicalJson.canonicalize(source)
lineage_graph = LineageGraph.buildLineageGraph(parent_ids=[...], child_id=artifact_id)
await commit_service.commitArtifact(artifact_id, canonical_payload, lineage_graph)
emit_source_registered(source)
cursor.execute("""
    INSERT OR IGNORE INTO sources (name, url, type)
    VALUES (?, ?, ?)
""", (...))
```

---

### PING Gateway

**File:** `C:\Users\nolan\PING\gateway\event_emitter.js`

**Patch 1:** Line 25
```javascript
// BEFORE:
const serialized = JSON.stringify(payload)

// AFTER:
import { CanonicalJson } from '@crx/replay'
const serialized = CanonicalJson.canonicalize(payload)
```

**Patch 2:** Line 28
```javascript
// BEFORE:
const hash = crypto.createHash('sha256').update(serialized).digest('hex')

// AFTER:
import { CanonicalHashAuthority } from '@crx/replay'
const hash = CanonicalHashAuthority.computeFingerprint(payload)
```

---

## CONCLUSIONS

### Minimum Enforcement Patch Set

**Total Files to Modify:** 5
- `crx-newsletter-brain/database.py` (5 patches)
- `crx-digestion-worker/database.py` (4 patches)
- `crx-newsletter-brain/worker.py` (1 patch)
- `crx-digestion-worker/worker.py` (1 patch)
- `PING/gateway/event_emitter.js` (2 patches)

**Total Functions to Modify:** 12
- `crx-newsletter-brain/database.py:init_database()` (2 patches)
- `crx-newsletter-brain/database.py:save_raw_newsletter()` (3 patches)
- `crx-newsletter-brain/database.py:update_newsletter_analysis()` (3 patches)
- `crx-newsletter-brain/database.py:save_digest()` (3 patches)
- `crx-digestion-worker/database.py:init_database()` (2 patches)
- `crx-digestion-worker/database.py:save_article()` (3 patches)
- `crx-digestion-worker/database.py:register_source()` (3 patches)
- `PING/gateway/event_emitter.js:emitEvent()` (2 patches)

**Total Import Changes:** 13
- Remove: `import sqlite3` (2 files)
- Remove: `from src.constitutional import emit_event` (2 files)
- Add: `from ping.runtime.replay import CanonicalHashAuthority, CanonicalJson, LineageGraph` (4 files)
- Add: `from ping.runtime.kernel.commit_service import CommitService` (2 files)
- Add: `import { CanonicalJson } from '@crx/replay'` (1 file)
- Add: `import { CanonicalHashAuthority } from '@crx/replay'` (1 file)

**Migration Phases:** 6
- Phase 1: Identity Enforcement (LOWEST RISK)
- Phase 2: Canonical Enforcement (LOW RISK)
- Phase 3: Event-First Mutation Enforcement (MEDIUM RISK)
- Phase 4: Lineage Tracking Enforcement (MEDIUM RISK)
- Phase 5: Commit Service Mandatory (HIGH RISK)
- Phase 6: Runtime Dependency Enforcement (HIGHEST RISK)

---

## CONSTITUTIONAL VIOLATION

**Current State:**
- CRX applications bypass all PING authorities
- CRX applications can run without PING
- State mutation occurs before event emission
- State cannot be reconstructed from events
- PING is structurally optional

**Required State:**
- CRX applications must delegate to PING authorities
- CRX applications must depend on PING runtime
- Event emission must occur before state mutation
- State must be reconstructable from events
- PING must be structurally mandatory

**Gap:** 6 migration phases required to achieve constitutional compliance

---

## AUDIT LIMITATIONS

**Systems Not Audited:**
- KnowledgeOS (not found in runtime)
- VOS (found only as documentation, not runtime)
- Task Engine (not found in runtime)
- Decision Engine (not found in runtime)

**Status:** These systems are UNKNOWN and require separate forensic audit.

---

## NON-NEGOTIABLE RULES COMPLIANCE

**READ ONLY:** ✅
**DO NOT MODIFY CODE:** ✅
**DO NOT REFACTOR:** ✅
**DO NOT PROPOSE IMPROVEMENTS:** ✅
**DO NOT DESIGN FUTURE ARCHITECTURE:** ✅
**DO NOT SPECULATE:** ✅
**DO NOT DISCUSS IDEAL ARCHITECTURE:** ✅
**DO NOT PROPOSE FUTURE SYSTEMS:** ✅
**DO NOT BUILD NEW CONSTITUTIONAL SYSTEMS:** ✅
**ONLY INSPECT EXISTING RUNTIME:** ✅
**ONLY LOCATE ENFORCEMENT FAILURES:** ✅
**ONLY IDENTIFY PATCH POINTS:** ✅
