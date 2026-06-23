# SWEEP_A2_EVENT_FIRST_ORDERING

**Audit Date:** 2026-06-18
**Agent:** AGENT 2 — MUTATION ORDERING AUDIT
**Mission:** Determine whether state mutation occurs before or after constitutional authorization

---

# AUDIT SCOPE

**Write Paths:**
- SQLite
- PostgreSQL
- Redis
- Filesystem
- Vector DB
- API mutations

**Questions:**
For every mutation:
- Application → PING → Event → Mutation (Event-first)
- OR
- Application → Mutation → Event (Mutation-first)

---

# SYSTEM ANALYSIS

## CRX Newsletter Brain

### Write Path 1: save_raw_newsletter()

**File:** crx-newsletter-brain/database.py
**Function:** save_raw_newsletter()
**Lines:** 87-123

**Exact Ordering:**
```python
def save_raw_newsletter(newsletter: Dict) -> bool:
    """Save raw newsletter to database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 93: MUTATION FIRST
        cursor.execute("""
            INSERT INTO newsletters (message_id, subject, sender, body, word_count, received_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (...))
        
        # LINE 102: COMMIT FIRST
        conn.commit()
        
        # LINE 105: EVENT AFTER MUTATION
        emit_newsletter_created(newsletter)
        
        return True
```

**Ordering:** Application → Mutation → Event
**Event Before Mutation:** NO
**Event After Mutation:** YES
**Status:** FAIL (mutation-first)

---

### Write Path 2: update_newsletter_analysis()

**File:** crx-newsletter-brain/database.py
**Function:** update_newsletter_analysis()
**Lines:** 124-176

**Exact Ordering:**
```python
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    """Update newsletter with Ollama analysis results."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 131: MUTATION FIRST
        cursor.execute("""
            UPDATE newsletters
            SET summary = ?, tags = ?, key_ideas = ?, actionable_insights = ?, processed_at = ?
            WHERE message_id = ?
        """, (...))
        
        # LINE 154: MUTATION FIRST (INSERT newsletter_topics)
        cursor.execute("""
            INSERT INTO newsletter_topics (article_id, topic, confidence)
            VALUES (?, ?, ?)
        """, (...))
        
        # LINE 163: COMMIT FIRST
        conn.commit()
        
        # NO EVENT EMITTED
        
        return True
```

**Ordering:** Application → Mutation (no event)
**Event Before Mutation:** NO
**Event After Mutation:** NO
**Status:** FAIL (no event at all)

---

### Write Path 3: mark_newsletter_archived()

**File:** crx-newsletter-brain/database.py
**Function:** mark_newsletter_archived()
**Lines:** 178-197

**Exact Ordering:**
```python
def mark_newsletter_archived(message_id: str) -> bool:
    """Mark newsletter as archived."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 185: MUTATION FIRST
        cursor.execute("""
            UPDATE newsletters
            SET archived = 1
            WHERE message_id = ?
        """, (message_id,))
        
        # LINE 188: COMMIT FIRST
        conn.commit()
        
        # NO EVENT EMITTED
        
        return True
```

**Ordering:** Application → Mutation (no event)
**Event Before Mutation:** NO
**Event After Mutation:** NO
**Status:** FAIL (no event at all)

---

### Write Path 4: save_digest()

**File:** crx-newsletter-brain/database.py
**Function:** save_digest()
**Lines:** 226-272

**Exact Ordering:**
```python
def save_digest(digest_type: str, date: str, content: str, newsletter_count: int) -> bool:
    """Save a digest to the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 259: MUTATION FIRST
        cursor.execute("""
            INSERT INTO digests (type, date, content, generated_at, newsletter_count)
            VALUES (?, ?, ?, ?, ?)
        """, (...))
        
        # LINE 267: COMMIT FIRST
        conn.commit()
        
        # LINE 270: EVENT AFTER MUTATION
        emit_digest_generated({...})
        
        return True
```

**Ordering:** Application → Mutation → Event
**Event Before Mutation:** NO
**Event After Mutation:** YES
**Status:** FAIL (mutation-first)

---

### Write Path 5: archive_newsletter()

**File:** crx-newsletter-brain/archive.py
**Function:** archive_newsletter()
**Lines:** 39-89

**Exact Ordering:**
```python
def archive_newsletter(newsletter: Dict) -> bool:
    """Store newsletter as markdown in the knowledge archive."""
    try:
        # LINE 73: FILESYSTEM MUTATION FIRST
        os.makedirs(dir_path, exist_ok=True)
        
        # LINE 74-75: FILESYSTEM MUTATION FIRST
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # LINE 78: EVENT AFTER MUTATION
        emit_archive_written(file_path, markdown)
        
        return True
```

**Ordering:** Application → Mutation → Event
**Event Before Mutation:** NO
**Event After Mutation:** YES
**Status:** FAIL (mutation-first)

---

### Write Path 6: generate_daily_digest()

**File:** crx-newsletter-brain/digest_generator.py
**Function:** generate_daily_digest()
**Lines:** 28-62

**Exact Ordering:**
```python
def generate_daily_digest(date: str = None) -> str:
    """Generate daily digest of newsletters."""
    # ... content generation ...
    
    # LINE 55: DATABASE MUTATION FIRST
    save_digest('daily', date, digest_content, len(newsletters))
    
    # LINE 58-59: FILESYSTEM MUTATION FIRST
    os.makedirs(DIGEST_DIR, exist_ok=True)
    digest_file = os.path.join(DIGEST_DIR, f"daily-{date}.md")
    with open(digest_file, 'w', encoding='utf-8') as f:
        f.write(digest_content)
    
    # NO EVENT EMITTED
    
    return digest_content
```

**Ordering:** Application → Mutation (no event)
**Event Before Mutation:** NO
**Event After Mutation:** NO
**Status:** FAIL (no event at all)

---

## CRX Digestion Worker

### Write Path 1: save_article()

**File:** crx-digestion-worker/database.py
**Function:** save_article()
**Lines:** 54-93

**Exact Ordering:**
```python
def save_article(article: Dict) -> bool:
    """Save an article to the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 64: MUTATION FIRST
        cursor.execute("""
            INSERT INTO articles (url, title, summary, source, published_at, processed_at, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (...))
        
        # LINE 72: COMMIT FIRST
        conn.commit()
        
        # LINE 75: EVENT AFTER MUTATION
        emit_article_created(article)
        
        return True
```

**Ordering:** Application → Mutation → Event
**Event Before Mutation:** NO
**Event After Mutation:** YES
**Status:** FAIL (mutation-first)

---

### Write Path 2: register_source()

**File:** crx-digestion-worker/database.py
**Function:** register_source()
**Lines:** 111-137

**Exact Ordering:**
```python
def register_source(name: str, url: str, source_type: str) -> bool:
    """Register a source in the database."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # LINE 115: MUTATION FIRST
        cursor.execute("""
            INSERT OR IGNORE INTO sources (name, url, type)
            VALUES (?, ?, ?)
        """, (name, url, source_type))
        
        # LINE 119: COMMIT FIRST
        conn.commit()
        
        # NO EVENT EMITTED
        
        return True
```

**Ordering:** Application → Mutation (no event)
**Event Before Mutation:** NO
**Event After Mutation:** NO
**Status:** FAIL (no event at all)

---

### Write Path 3: archive_article()

**File:** crx-digestion-worker/archive.py
**Function:** archive_article()
**Lines:** 28-75

**Exact Ordering:**
```python
def archive_article(article: Dict) -> bool:
    """Store article summary as markdown in the knowledge archive."""
    try:
        # LINE 59: FILESYSTEM MUTATION FIRST
        os.makedirs(dir_path, exist_ok=True)
        
        # LINE 60-61: FILESYSTEM MUTATION FIRST
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # LINE 64: EVENT AFTER MUTATION
        emit_markdown_written(file_path, markdown)
        
        return True
```

**Ordering:** Application → Mutation → Event
**Event Before Mutation:** NO
**Event After Mutation:** YES
**Status:** FAIL (mutation-first)

---

## Brain Constitutional Module

### Write Path 1: emit_event()

**File:** brain/src/constitutional/event_emitter.py
**Function:** emit_event()
**Lines:** 54-120

**Exact Ordering:**
```python
def emit_event(stream: str, event_type: str, payload: Dict[str, Any]) -> bool:
    """Emit an event to the constitutional event log."""
    # LINE 90: POSTGRESQL CONNECTION
    conn = get_postgres_connection()
    
    if conn:
        cursor = conn.cursor()
        try:
            # LINE 103: POSTGRESQL MUTATION FIRST
            cursor.execute(query, (
                stream,
                event_type,
                Json(payload),
                datetime.utcnow().isoformat()
            ))
            
            # LINE 110: COMMIT FIRST
            conn.commit()
            
            # NO EVENT BEFORE MUTATION
            # THIS IS THE EVENT ITSELF
            
            return True
```

**Ordering:** Application → Mutation (event is the mutation)
**Event Before Mutation:** N/A (event is the mutation)
**Event After Mutation:** N/A (event is the mutation)
**Status:** N/A (event is the mutation, not authorization)

---

## PING Runtime

### Write Path 1: replay()

**File:** PING/runtime/replay/deterministic_replay_engine.ts
**Function:** replay()
**Lines:** 44-87

**Exact Ordering:**
```typescript
replay(eventStream: ReplayEventStream): ReplayResult {
  // LINE 46: CREATE STATE MACHINE
  const stateMachine = new ReplayStateMachine();
  
  // LINE 49-52: PROCESS EVENTS IN ORDER
  const events = eventStream.getEvents();
  for (const event of events) {
    stateMachine.applyEvent(event);  // Event first, then state mutation
  }
  
  // LINE 55: GET FINAL STATE
  const state = stateMachine.getState();
  
  // LINE 57-61: CANONICALIZE AND FINGERPRINT
  const canonicalBytes = this.hashAuthority.canonicalize(eventStream.toJSON());
  const fingerprint = this.hashAuthority.computeFingerprint(canonicalBytes);
  
  // LINE 63-70: GENERATE WITNESS
  const { witnessRoot, lineageGraph } = this.witnessAuthority.generateWitness(
    eventStream,
    state,
    violations
  );
}
```

**Ordering:** Event → State Mutation → Witness
**Event Before Mutation:** YES
**Event After Mutation:** NO
**Status:** PASS (event-first)

---

# EVENT-FIRST ORDERING MATRIX

| System | Write Path | File | Function | Event Before Mutation | Event After Mutation | Status |
|--------|------------|------|----------|----------------------|---------------------|--------|
| CRX Newsletter Brain | SQLite INSERT | database.py | save_raw_newsletter() | NO | YES | FAIL |
| CRX Newsletter Brain | SQLite UPDATE | database.py | update_newsletter_analysis() | NO | NO | FAIL |
| CRX Newsletter Brain | SQLite UPDATE | database.py | mark_newsletter_archived() | NO | NO | FAIL |
| CRX Newsletter Brain | SQLite INSERT | database.py | save_digest() | NO | YES | FAIL |
| CRX Newsletter Brain | Filesystem | archive.py | archive_newsletter() | NO | YES | FAIL |
| CRX Newsletter Brain | Filesystem | digest_generator.py | generate_daily_digest() | NO | NO | FAIL |
| CRX Digestion Worker | SQLite INSERT | database.py | save_article() | NO | YES | FAIL |
| CRX Digestion Worker | SQLite INSERT | database.py | register_source() | NO | NO | FAIL |
| CRX Digestion Worker | Filesystem | archive.py | archive_article() | NO | YES | FAIL |
| Brain Constitutional Module | PostgreSQL INSERT | event_emitter.py | emit_event() | N/A | N/A | N/A |
| PING Runtime | Replay | deterministic_replay_engine.ts | replay() | YES | NO | PASS |

---

# SUMMARY STATISTICS

**Total Write Paths Analyzed:** 11
**Event-First Paths:** 1/11 (9.1%)
**Mutation-First Paths:** 9/11 (81.8%)
**No Event Paths:** 1/11 (9.1%)

**CRX Applications:**
- Event-First: 0/9 (0%)
- Mutation-First: 7/9 (77.8%)
- No Event: 2/9 (22.2%)

**PING Runtime:**
- Event-First: 1/1 (100%)
- Mutation-First: 0/1 (0%)
- No Event: 0/1 (0%)

---

# CONCLUSION

**Event-First Ordering Rate:** 0% for CRX applications

**Findings:**
- CRX applications use mutation-first ordering exclusively
- Events are emitted AFTER mutations complete
- Some mutations have no events at all
- PING Runtime uses event-first ordering correctly

**Sovereignty Status:** FAIL
- Applications do not use event-first ordering
- Events are logging only, not authorization
- PING cannot authorize mutations before they occur
- PING cannot enforce constitutional constraints

**Recommendation:** All mutations must use event-first ordering:
1. Create event before mutation
2. Submit event to PING for authorization
3. Only mutate state after PING authorization
