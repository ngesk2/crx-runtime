# SWEEP_A5_SOVEREIGNTY_MIGRATION_PLAN

**Audit Date:** 2026-06-18
**Agent:** AGENT 5 — CONSTITUTIONAL ENFORCEMENT GAP AUDIT
**Mission:** Determine the minimum code changes required to make PING sovereign

---

# AUDIT SCOPE

**Inputs:**
- Agent 1: Authority Path Matrix
- Agent 2: Event-First Ordering
- Agent 3: Replay Reconstruction
- Agent 4: Runtime Sovereignty

**Questions:**
- What exact runtime mutations bypass PING?
- What exact interception points force compliance?

---

# DIRECT BYPASS MATRIX

| System | File | Function | Bypass Type | Authority Missing |
|--------|------|----------|-------------|-------------------|
| CRX Newsletter Brain | database.py | save_raw_newsletter() | SQLite INSERT | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | database.py | update_newsletter_analysis() | SQLite UPDATE | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | database.py | mark_newsletter_archived() | SQLite UPDATE | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | database.py | save_digest() | SQLite INSERT | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | archive.py | archive_newsletter() | Filesystem write | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | digest_generator.py | generate_daily_digest() | Filesystem write | Event Authority, Identity Authority, Canonical Authority |
| CRX Newsletter Brain | digest_generator.py | generate_weekly_report() | Filesystem write | Event Authority, Identity Authority, Canonical Authority |
| CRX Digestion Worker | database.py | save_article() | SQLite INSERT | Event Authority, Identity Authority, Canonical Authority |
| CRX Digestion Worker | database.py | register_source() | SQLite INSERT | Event Authority, Identity Authority, Canonical Authority |
| CRX Digestion Worker | archive.py | archive_article() | Filesystem write | Event Authority, Identity Authority, Canonical Authority |

**Total Bypasses:** 10
**Bypass Rate:** 100%

---

# REPLACEMENT MATRIX

## Event Authority

### Current Call

**CRX Newsletter Brain:**
```python
# crx-newsletter-brain/database.py:105
emit_newsletter_created(newsletter)  # brain/src/constitutional (not PING)
```

**CRX Digestion Worker:**
```python
# crx-digestion-worker/database.py:75
emit_article_created(article)  # brain/src/constitutional (not PING)
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with PING Event Authority
from PING.runtime.replay.event_authority import EventAuthority

event_authority = EventAuthority()
event_authority.createEvent('NEWSLETTER_CREATED', newsletter)
```

**CRX Digestion Worker:**
```python
# Replace with PING Event Authority
from PING.runtime.replay.event_authority import EventAuthority

event_authority = EventAuthority()
event_authority.createEvent('ARTICLE_CREATED', article)
```

**Authority:** PING Event Authority

---

## Identity Authority

### Current Call

**CRX Newsletter Brain:**
```python
# crx-newsletter-brain/database.py:18-32
cursor.execute("""
    CREATE TABLE IF NOT EXISTS newsletters (
        id INTEGER PRIMARY KEY,  # SQLite auto-increment
        message_id TEXT UNIQUE,
        ...
    )
""")
```

**CRX Digestion Worker:**
```python
# crx-digestion-worker/database.py:17-27
cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,  # SQLite auto-increment
        url TEXT UNIQUE,
        ...
    )
""")
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with PING Identity Authority
from PING.runtime.replay.canonical_hash_authority import CanonicalHashAuthority

identity_authority = CanonicalHashAuthority()
canonical_id = identity_authority.computeCanonicalHash(newsletter)

cursor.execute("""
    CREATE TABLE IF NOT EXISTS newsletters (
        id TEXT PRIMARY KEY,  # PING canonical hash
        message_id TEXT UNIQUE,
        ...
    )
""")
```

**CRX Digestion Worker:**
```python
# Replace with PING Identity Authority
from PING.runtime.replay.canonical_hash_authority import CanonicalHashAuthority

identity_authority = CanonicalHashAuthority()
canonical_id = identity_authority.computeCanonicalHash(article)

cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,  # PING canonical hash
        url TEXT UNIQUE,
        ...
    )
""")
```

**Authority:** PING Identity Authority

---

## Canonical Authority

### Current Call

**CRX Newsletter Brain:**
```python
# crx-newsletter-brain/database.py:94-103
cursor.execute("""
    INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
    VALUES (?, ?, ?, ?, ?, ?)
""", (
    newsletter['message_id'],  # No canonicalization
    newsletter['subject'],     # No canonicalization
    newsletter['sender'],      # No canonicalization
    newsletter['body'],        # No canonicalization
    newsletter['word_count'],  # No canonicalization
    newsletter['received_at']  # No canonicalization
))
```

**CRX Digestion Worker:**
```python
# crx-digestion-worker/database.py:64-66
cursor.execute("""
    INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    article['url'],      # No canonicalization
    article['title'],    # No canonicalization
    article['summary'],  # No canonicalization
    article['source'],   # No canonicalization
    article['published_at'],  # No canonicalization
    article['processed_at'],  # No canonicalization
    article['tags']     # No canonicalization
))
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with PING Canonical Authority
from PING.runtime.replay.canonical_hash_authority import CanonicalHashAuthority

canonical_authority = CanonicalHashAuthority()
canonical_newsletter = canonical_authority.canonicalize(newsletter)

cursor.execute("""
    INSERT INTO newsletters (id, message_id, subject, sender, body, word_count, received_at, canonical_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", (
    canonical_id,  # PING canonical hash
    canonical_newsletter['message_id'],  # Canonicalized
    canonical_newsletter['subject'],     # Canonicalized
    canonical_newsletter['sender'],      # Canonicalized
    canonical_newsletter['body'],        # Canonicalized
    canonical_newsletter['word_count'],  # Canonicalized
    canonical_newsletter['received_at'],  # Canonicalized
    canonical_newsletter  # Canonical bytes
))
```

**CRX Digestion Worker:**
```python
# Replace with PING Canonical Authority
from PING.runtime.replay.canonical_hash_authority import CanonicalHashAuthority

canonical_authority = CanonicalHashAuthority()
canonical_article = canonical_authority.canonicalize(article)

cursor.execute("""
    INSERT INTO articles (id, url, title, summary, source, published_at, processed_at, tags, canonical_bytes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    canonical_id,  # PING canonical hash
    canonical_article['url'],      # Canonicalized
    canonical_article['title'],    # Canonicalized
    canonical_article['summary'],  # Canonicalized
    canonical_article['source'],   # Canonicalized
    canonical_article['published_at'],  # Canonicalized
    canonical_article['processed_at'],  # Canonicalized
    canonical_article['tags'],     # Canonicalized
    canonical_article  # Canonical bytes
))
```

**Authority:** PING Canonical Authority

---

## Lineage Authority

### Current Call

**CRX Newsletter Brain:**
```python
# No lineage tracking in any mutation function
# No parent verification before mutations
# No lineage graph construction
```

**CRX Digestion Worker:**
```python
# No lineage tracking in any mutation function
# No parent verification before mutations
# No lineage graph construction
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with PING Lineage Authority
from PING.runtime.replay.witness_authority import WitnessAuthority

witness_authority = WitnessAuthority()
lineage_graph = witness_authority.buildLineageGraph(state)

# Verify lineage before mutation
if not witness_authority.verifyLineage(newsletter, lineage_graph):
    raise Exception("Lineage verification failed")
```

**CRX Digestion Worker:**
```python
# Replace with PING Lineage Authority
from PING.runtime.replay.witness_authority import WitnessAuthority

witness_authority = WitnessAuthority()
lineage_graph = witness_authority.buildLineageGraph(state)

# Verify lineage before mutation
if not witness_authority.verifyLineage(article, lineage_graph):
    raise Exception("Lineage verification failed")
```

**Authority:** PING Lineage Authority

---

## Persistence Ownership

### Current Call

**CRX Newsletter Brain:**
```python
# crx-newsletter-brain/database.py:89
conn = sqlite3.connect(DATABASE_PATH)  # Direct SQLite access
```

**CRX Digestion Worker:**
```python
# crx-digestion-worker/database.py:59
conn = sqlite3.connect(DATABASE_PATH)  # Direct SQLite access
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with PING Commit Service
from PING.runtime.kernel.commit_service import CommitService

commit_service = CommitService()
commit_service.commit(newsletter, 'newsletters')  # PING controls persistence
```

**CRX Digestion Worker:**
```python
# Replace with PING Commit Service
from PING.runtime.kernel.commit_service import CommitService

commit_service = CommitService()
commit_service.commit(article, 'articles')  # PING controls persistence
```

**Authority:** PING Commit Service

---

## Event Creation Ordering

### Current Call

**CRX Newsletter Brain:**
```python
# crx-newsletter-brain/database.py:93-105
cursor.execute("INSERT INTO newsletters...")  # Mutation first
conn.commit()  # Commit first
emit_newsletter_created(newsletter)  # Event after mutation
```

**CRX Digestion Worker:**
```python
# crx-digestion-worker/database.py:64-75
cursor.execute("INSERT INTO articles...")  # Mutation first
conn.commit()  # Commit first
emit_article_created(article)  # Event after mutation
```

### Replacement

**CRX Newsletter Brain:**
```python
# Replace with event-first ordering
from PING.runtime.replay.event_authority import EventAuthority

event_authority = EventAuthority()
event = event_authority.createEvent('NEWSLETTER_CREATED', newsletter)  # Event first

# Submit to PING for authorization
if not event_authority.authorize(event):
    raise Exception("Event authorization failed")

# Only mutate after authorization
cursor.execute("INSERT INTO newsletters...")
conn.commit()
```

**CRX Digestion Worker:**
```python
# Replace with event-first ordering
from PING.runtime.replay.event_authority import EventAuthority

event_authority = EventAuthority()
event = event_authority.createEvent('ARTICLE_CREATED', article)  # Event first

# Submit to PING for authorization
if not event_authority.authorize(event):
    raise Exception("Event authorization failed")

# Only mutate after authorization
cursor.execute("INSERT INTO articles...")
conn.commit()
```

**Authority:** PING Event Authority (event-first)

---

# MANDATORY MIGRATION LIST

## Phase 1: Dependency Injection (HIGH PRIORITY)

### Action: Add PING Imports

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py
- crx-newsletter-brain/archive.py
- crx-digestion-worker/archive.py
- crx-newsletter-brain/digest_generator.py

**Changes:**
```python
# Add PING imports
import sys
sys.path.append('C:/Users/nolan/PING/runtime/replay')
from event_authority import EventAuthority
from canonical_hash_authority import CanonicalHashAuthority
from witness_authority import WitnessAuthority

# Remove brain/src/constitutional imports (not PING)
# from src.constitutional import emit_event  # REMOVE
```

**Risk:** HIGH (applications now depend on PING)
**Rollback:** HIGH (remove imports)

---

## Phase 2: Schema Migration (HIGH PRIORITY)

### Action: Add canonical_id Column

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py

**Changes:**
```python
# Add canonical_id column to newsletters table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS newsletters (
        id TEXT PRIMARY KEY,  # Change from INTEGER to TEXT
        message_id TEXT UNIQUE,
        subject TEXT,
        sender TEXT,
        body TEXT,
        word_count INTEGER,
        received_at TEXT,
        processed_at TEXT,
        summary TEXT,
        tags TEXT,
        key_ideas TEXT,
        actionable_insights TEXT,
        archived INTEGER DEFAULT 0,
        canonical_id TEXT,  # ADD THIS COLUMN
        canonical_bytes BLOB  # ADD THIS COLUMN
    )
""")

# Add canonical_id column to articles table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,  # Change from INTEGER to TEXT
        url TEXT UNIQUE,
        title TEXT,
        summary TEXT,
        source TEXT,
        published_at TEXT,
        processed_at TEXT,
        tags TEXT,
        canonical_id TEXT,  # ADD THIS COLUMN
        canonical_bytes BLOB  # ADD THIS COLUMN
    )
""")
```

**Risk:** MEDIUM (schema change)
**Rollback:** HIGH (drop columns)

---

## Phase 3: Event-First Ordering (HIGH PRIORITY)

### Action: Move Event Creation Before Mutation

**Files:**
- crx-newsletter-brain/database.py (save_raw_newsletter, save_digest)
- crx-digestion-worker/database.py (save_article)
- crx-newsletter-brain/archive.py (archive_newsletter)
- crx-digestion-worker/archive.py (archive_article)

**Changes:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    # CREATE EVENT FIRST
    event = event_authority.createEvent('NEWSLETTER_CREATED', newsletter)
    
    # AUTHORIZE WITH PING
    if not event_authority.authorize(event):
        raise Exception("Event authorization failed")
    
    # GENERATE CANONICAL ID
    canonical_id = canonical_hash_authority.computeCanonicalHash(newsletter)
    
    # MUTATE AFTER AUTHORIZATION
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO newsletters (id, message_id, subject, sender, body, word_count, received_at, canonical_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (canonical_id, ...))
        conn.commit()
        return True
```

**Risk:** HIGH (changes execution order)
**Rollback:** MEDIUM (revert to mutation-first)

---

## Phase 4: Identity Authority Integration (MEDIUM PRIORITY)

### Action: Replace Auto-Increment with Canonical Hash

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py

**Changes:**
```python
# Replace SQLite auto-increment with PING canonical hash
identity_authority = CanonicalHashAuthority()
canonical_id = identity_authority.computeCanonicalHash(newsletter)

# Use canonical_id as primary key
cursor.execute("""
    INSERT INTO newsletters (id, message_id, ...)
    VALUES (?, ?, ...)
""", (canonical_id, ...))
```

**Risk:** MEDIUM (changes ID generation)
**Rollback:** MEDIUM (revert to auto-increment)

---

## Phase 5: Canonical Authority Integration (MEDIUM PRIORITY)

### Action: Canonicalize Payloads Before Persistence

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py

**Changes:**
```python
# Canonicalize before persistence
canonical_authority = CanonicalHashAuthority()
canonical_newsletter = canonical_authority.canonicalize(newsletter)
canonical_bytes = canonical_newsletter

# Store canonical bytes
cursor.execute("""
    INSERT INTO newsletters (..., canonical_bytes)
    VALUES (...)
""", (..., canonical_bytes))
```

**Risk:** MEDIUM (changes data format)
**Rollback:** MEDIUM (remove canonicalization)

---

## Phase 6: Lineage Authority Integration (LOW PRIORITY)

### Action: Add Lineage Tracking

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py

**Changes:**
```python
# Build lineage graph before mutation
witness_authority = WitnessAuthority()
lineage_graph = witness_authority.buildLineageGraph(state)

# Verify lineage
if not witness_authority.verifyLineage(newsletter, lineage_graph):
    raise Exception("Lineage verification failed")

# Store lineage
cursor.execute("""
    INSERT INTO lineage (parent_id, child_id, edge_type)
    VALUES (?, ?, ?)
""", (parent_id, canonical_id, 'derivation'))
```

**Risk:** LOW (new feature)
**Rollback:** HIGH (remove lineage tracking)

---

## Phase 7: Persistence Ownership Transfer (HIGH PRIORITY)

### Action: Replace Direct SQLite Access with PING Commit Service

**Files:**
- crx-newsletter-brain/database.py
- crx-digestion-worker/database.py

**Changes:**
```python
# Replace direct SQLite access
# conn = sqlite3.connect(DATABASE_PATH)  # REMOVE
# cursor.execute(...)  # REMOVE

# Use PING Commit Service
commit_service = CommitService()
commit_service.commit(newsletter, 'newsletters')
```

**Risk:** CRITICAL (changes persistence layer)
**Rollback:** MEDIUM (revert to direct access)

---

# MIGRATION ORDER

| Phase | Description | Priority | Risk | Rollback | Estimated Time |
|-------|-------------|----------|------|----------|----------------|
| 1 | Dependency Injection | HIGH | HIGH | HIGH | 1 hour |
| 2 | Schema Migration | HIGH | MEDIUM | HIGH | 30 minutes |
| 3 | Event-First Ordering | HIGH | HIGH | MEDIUM | 2 hours |
| 4 | Identity Authority Integration | MEDIUM | MEDIUM | MEDIUM | 2 hours |
| 5 | Canonical Authority Integration | MEDIUM | MEDIUM | MEDIUM | 2 hours |
| 6 | Lineage Authority Integration | LOW | LOW | HIGH | 1 hour |
| 7 | Persistence Ownership Transfer | HIGH | CRITICAL | MEDIUM | 4 hours |

**Total Estimated Time:** ~12 hours

**Recommended Approach:**
1. Execute Phase 1-2 in development environment
2. Test thoroughly with PING authorities available
3. Test rollback procedures
4. Execute Phase 1-2 in production
5. Monitor for 24 hours
6. Execute Phase 3-5 in production (one at a time)
7. Monitor for 24 hours after each phase
8. Execute Phase 6-7 only after all previous phases are stable

---

# SUMMARY

**Total Bypasses:** 10
**Total Replacements:** 7
**Total Migration Phases:** 7
**Total Estimated Time:** ~12 hours

**Critical Changes:**
- Phase 1: Dependency Injection (applications now depend on PING)
- Phase 3: Event-First Ordering (changes execution order)
- Phase 7: Persistence Ownership Transfer (changes persistence layer)

**Expected Outcome:**
- Applications will delegate all authority to PING
- Applications will use event-first ordering
- Applications will use PING identity generation
- Applications will use PING canonicalization
- Applications will use PING lineage tracking
- Applications will use PING commit service
- PING will be structurally mandatory
- PING will be sovereign

**Sovereignty Status After Migration:** PASS
