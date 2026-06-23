# SURGICAL PATCH PLAN

**Audit Date:** 2025-01-18  
**Audit Scope:** Smallest possible patches to achieve Projection Rebuildability, Canonical Knowledge Extraction, and Retrieval Fabric  
**Audit Principle:** Planning only - no implementation, no PING runtime modification

---

## EXECUTIVE SUMMARY

**7 surgical patches are required to achieve constitutional observability and reconstruction.** These patches are minimal, non-invasive, and do not modify PING runtime behavior. The patches focus on event emission, SQLite FTS5 enablement, and basic entity extraction. Estimated effort: 2-3 weeks.

---

## PATCH 1: Ollama Analysis Event Emission

**Goal:** Make Ollama analysis results observable via events  
**Impact:** Enables full rebuildability of newsletters.db  
**Effort:** 2 hours  
**Priority:** CRITICAL

**Current State:**
- Ollama analysis results (summary, tags, key_ideas, actionable_insights) are written to SQLite via update_newsletter_analysis()
- No event is emitted for this mutation
- newsletters.db is only 50% rebuildable from events

**Patch:**
1. Add event emission to update_newsletter_analysis() in database.py
2. Emit NEWSLETTER_ANALYZED event with analysis results
3. Event payload: message_id, summary, tags, key_ideas, actionable_insights, processed_at
4. Event stream: yahoo

**Code Change:**
```python
# database.py line 124-176
def update_newsletter_analysis(message_id: str, analysis: Dict) -> bool:
    # ... existing code ...
    
    # NEW: Emit constitutional event
    emit_newsletter_analyzed({
        'message_id': message_id,
        'summary': analysis.get('summary', ''),
        'tags': analysis.get('tags', ''),
        'key_ideas': analysis.get('key_ideas', ''),
        'actionable_insights': analysis.get('actionable_insights', ''),
        'processed_at': datetime.utcnow().isoformat()
    })
    
    # ... existing code ...
```

**New Event Definition:**
```python
# event_emitter.py
def emit_newsletter_analyzed(analysis: Dict[str, Any]) -> bool:
    return emit_event('yahoo', 'NEWSLETTER_ANALYZED', analysis)
```

**Impact:**
- newsletters.db becomes 100% rebuildable from events
- Ollama analysis results become observable
- No behavior change to application logic

---

## PATCH 2: Source Registration Event Emission

**Goal:** Make source registration observable via events  
**Impact:** Enables full rebuildability of knowledge.db sources table  
**Effort:** 1 hour  
**Priority:** HIGH

**Current State:**
- Source registration writes to SQLite via register_source()
- No event is emitted for this mutation
- knowledge.db sources table is not fully rebuildable

**Patch:**
1. Add event emission to register_source() in database.py
2. Emit SOURCE_REGISTERED event with source data
3. Event payload: name, url, type, active
4. Event stream: rss

**Code Change:**
```python
# database.py line 159-175
def register_source(name: str, url: str, source_type: str) -> bool:
    # ... existing code ...
    
    # NEW: Emit constitutional event
    emit_source_registered({
        'name': name,
        'url': url,
        'type': source_type,
        'active': 1
    })
    
    # ... existing code ...
```

**New Event Definition:**
```python
# event_emitter.py
def emit_source_registered(source: Dict[str, Any]) -> bool:
    return emit_event('rss', 'SOURCE_REGISTERED', source)
```

**Impact:**
- knowledge.db sources table becomes 100% rebuildable from events
- Source registration becomes observable
- No behavior change to application logic

---

## PATCH 3: SQLite FTS5 Enablement

**Goal:** Enable full-text search on articles and newsletters  
**Impact:** Enables FTS capability without external dependencies  
**Effort:** 4 hours  
**Priority:** HIGH

**Current State:**
- SQLite LIKE queries are slow and provide no ranking
- No FTS5 extension is enabled
- No full-text index exists

**Patch:**
1. Enable SQLite FTS5 extension in database.py
2. Create FTS5 virtual tables for articles and newsletters
3. Populate FTS5 tables with existing data
4. Update search functions to use FTS5 queries
5. Add ranking and relevance scoring

**Code Change:**
```python
# database.py init_database()
def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # NEW: Enable FTS5
    cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(title, summary, tags, content='articles', content_rowid='id')")
    
    # NEW: Populate FTS5 table
    cursor.execute("INSERT INTO articles_fts(rowid, title, summary, tags) SELECT id, title, summary, tags FROM articles")
    
    # ... existing code ...
```

**Search Function Update:**
```python
# database.py search_articles()
def search_articles(query: str) -> List[Dict]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # NEW: Use FTS5 with ranking
    cursor.execute("""
        SELECT articles.title, articles.url, articles.summary, articles.source, articles.published_at, articles.tags, rank
        FROM articles_fts
        JOIN articles ON articles_fts.rowid = articles.id
        WHERE articles_fts MATCH ?
        ORDER BY rank DESC
        LIMIT 50
    """, (query,))
    
    # ... existing code ...
```

**Impact:**
- FTS capability enabled
- Search performance improved
- Ranking and relevance scoring added
- No external dependencies (SQLite FTS5 is built-in)

---

## PATCH 4: Newsletter Archive Flag Event Emission

**Goal:** Make archive flag changes observable via events  
**Impact:** Enables full observability of archive state  
**Effort:** 1 hour  
**Priority:** MEDIUM

**Current State:**
- Archive flag changes write to SQLite via mark_newsletter_archived()
- No event is emitted for this mutation
- Archive flag changes are invisible

**Patch:**
1. Add event emission to mark_newsletter_archived() in database.py
2. Emit NEWSLETTER_ARCHIVED event with message_id
3. Event payload: message_id, archived_at
4. Event stream: yahoo

**Code Change:**
```python
# database.py line 178-196
def mark_newsletter_archived(message_id: str) -> bool:
    # ... existing code ...
    
    # NEW: Emit constitutional event
    emit_newsletter_archived({
        'message_id': message_id,
        'archived_at': datetime.utcnow().isoformat()
    })
    
    # ... existing code ...
```

**New Event Definition:**
```python
# event_emitter.py
def emit_newsletter_archived(archive: Dict[str, Any]) -> bool:
    return emit_event('yahoo', 'NEWSLETTER_ARCHIVED', archive)
```

**Impact:**
- Archive flag changes become observable
- No behavior change to application logic

---

## PATCH 5: Basic Named Entity Recognition

**Goal:** Extract named entities from summaries  
**Impact:** Enables basic entity search capability  
**Effort:** 8 hours  
**Priority:** HIGH

**Current State:**
- No named entity recognition exists
- Entities are trapped in unstructured text
- No entity storage exists

**Patch:**
1. Add spaCy NER pipeline to summarizer.py
2. Extract entities (PERSON, ORG, GPE, DATE, MONEY, PERCENT) from summaries
3. Store entities in new entities table
4. Add entity search function

**Code Change:**
```python
# database.py init_database()
def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # NEW: Create entities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id INTEGER PRIMARY KEY,
            entity_type TEXT,
            entity_text TEXT,
            article_id INTEGER,
            confidence REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # NEW: Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entities_text ON entities(entity_text)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entities_article ON entities(article_id)")
    
    # ... existing code ...
```

**Entity Extraction Function:**
```python
# summarizer.py
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_entities(text: str) -> List[Dict]:
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        entities.append({
            'text': ent.text,
            'label': ent.label_,
            'start': ent.start_char,
            'end': ent.end_char
        })
    return entities
```

**Entity Search Function:**
```python
# database.py
def search_entities(entity_type: str, entity_text: str) -> List[Dict]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT e.entity_text, e.entity_type, a.title, a.url
        FROM entities e
        JOIN articles a ON e.article_id = a.id
        WHERE e.entity_type = ? AND e.entity_text LIKE ?
        ORDER BY e.confidence DESC
        LIMIT 50
    """, (entity_type, f"%{entity_text}%"))
    
    # ... existing code ...
```

**Impact:**
- Basic entity extraction enabled
- Entity search capability added
- No behavior change to application logic
- Requires spaCy dependency

---

## PATCH 6: Basic Relationship Extraction

**Goal:** Extract basic relationships from summaries  
**Impact:** Enables basic relationship search capability  
**Effort:** 12 hours  
**Priority:** MEDIUM

**Current State:**
- No relationship extraction exists
- Relationships are trapped in unstructured text
- No relationship storage exists

**Patch:**
1. Add relationship extraction to summarizer.py
2. Extract subject-verb-object triples from summaries
3. Store relationships in new relationships table
4. Add relationship search function

**Code Change:**
```python
# database.py init_database()
def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # NEW: Create relationships table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY,
            subject TEXT,
            predicate TEXT,
            object TEXT,
            article_id INTEGER,
            confidence REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # NEW: Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_subject ON relationships(subject)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_predicate ON relationships(predicate)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_object ON relationships(object)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_relationships_article ON relationships(article_id)")
    
    # ... existing code ...
```

**Relationship Extraction Function:**
```python
# summarizer.py
def extract_relationships(text: str) -> List[Dict]:
    # Use spaCy dependency parsing
    doc = nlp(text)
    relationships = []
    for token in doc:
        if token.dep_ == "nsubj" and token.head.dep_ == "ROOT":
            subject = token.text
            predicate = token.head.text
            # Find object
            for child in token.head.children:
                if child.dep_ == "dobj":
                    obj = child.text
                    relationships.append({
                        'subject': subject,
                        'predicate': predicate,
                        'object': obj
                    })
    return relationships
```

**Relationship Search Function:**
```python
# database.py
def search_relationships(subject: str, predicate: str, object: str) -> List[Dict]:
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.subject, r.predicate, r.object, a.title, a.url
        FROM relationships r
        JOIN articles a ON r.article_id = a.id
        WHERE r.subject LIKE ? AND r.predicate LIKE ? AND r.object LIKE ?
        ORDER BY r.confidence DESC
        LIMIT 50
    """, (f"%{subject}%", f"%{predicate}%", f"%{object}%"))
    
    # ... existing code ...
```

**Impact:**
- Basic relationship extraction enabled
- Relationship search capability added
- No behavior change to application logic
- Requires spaCy dependency

---

## PATCH 7: Projection Rebuild Script

**Goal:** Create script to rebuild projections from events  
**Impact:** Enables projection rebuildability  
**Effort:** 4 hours  
**Priority:** HIGH

**Current State:**
- No projection rebuild script exists
- Manual rebuild would be error-prone

**Patch:**
1. Create rebuild_projections.py script
2. Query PostgreSQL events table
3. Rebuild newsletters.db from NEWSLETTER_CREATED and NEWSLETTER_ANALYZED events
4. Rebuild knowledge.db from ARTICLE_CREATED and SOURCE_REGISTERED events
5. Rebuild markdown archives from SQLite databases
6. Rebuild digest files from SQLite databases

**Code Change:**
```python
# rebuild_projections.py
import psycopg2
import sqlite3

def rebuild_newsletters_db():
    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(...)
    
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('newsletters.db')
    
    # Query NEWSLETTER_CREATED events
    cursor = pg_conn.cursor()
    cursor.execute("SELECT payload FROM events WHERE event_type = 'NEWSLETTER_CREATED' ORDER BY created_at")
    
    # Rebuild newsletters table
    for row in cursor.fetchall():
        payload = row[0]
        # Insert into newsletters table
        # ...
    
    # Query NEWSLETTER_ANALYZED events
    cursor.execute("SELECT payload FROM events WHERE event_type = 'NEWSLETTER_ANALYZED' ORDER BY created_at")
    
    # Update newsletters table with analysis results
    for row in cursor.fetchall():
        payload = row[0]
        # Update newsletters table
        # ...
    
    # Rebuild newsletter_topics table
    # ...
```

**Impact:**
- Projection rebuildability enabled
- Disaster recovery capability added
- No behavior change to application logic

---

## PATCH SUMMARY

| Patch | Goal | Effort | Priority | Impact |
|-------|------|--------|----------|--------|
| 1 | Ollama Analysis Event Emission | 2 hours | CRITICAL | newsletters.db 100% rebuildable |
| 2 | Source Registration Event Emission | 1 hour | HIGH | knowledge.db 100% rebuildable |
| 3 | SQLite FTS5 Enablement | 4 hours | HIGH | FTS capability enabled |
| 4 | Newsletter Archive Flag Event Emission | 1 hour | MEDIUM | Archive flag observable |
| 5 | Basic Named Entity Recognition | 8 hours | HIGH | Entity search enabled |
| 6 | Basic Relationship Extraction | 12 hours | MEDIUM | Relationship search enabled |
| 7 | Projection Rebuild Script | 4 hours | HIGH | Projection rebuildability enabled |

**Total Effort:** 32 hours (4 days)

**Critical Path:** Patch 1 → Patch 7 (Ollama analysis event emission enables full projection rebuild)

---

## SUCCESS CRITERIA

At completion of these patches, the civilization will have:

**Every Authority:**
- newsletters.db (100% rebuildable from events)
- knowledge.db (100% rebuildable from events)

**Every Projection:**
- Markdown archives (rebuildable from SQLite)
- Digest files (rebuildable from SQLite)
- FTS index (rebuildable from SQLite)

**Every Rebuild Path:**
- newsletters.db: YES (from NEWSLETTER_CREATED + NEWSLETTER_ANALYZED events)
- knowledge.db: YES (from ARTICLE_CREATED + SOURCE_REGISTERED events)
- Markdown archives: YES (from SQLite databases)
- Digest files: YES (from SQLite databases)

**Every Invisible Mutation:**
- Ollama analysis results: NOW OBSERVABLE (Patch 1)
- Source registration: NOW OBSERVABLE (Patch 2)
- Archive flag changes: NOW OBSERVABLE (Patch 4)

**Every Retrieval Blocker:**
- FTS: UNBLOCKED (Patch 3)
- Entity Search: UNBLOCKED (Patch 5)
- Relationship Search: UNBLOCKED (Patch 6)
- Timeline Search: ALREADY PARTIAL (no patch needed)
- PARA Search: BLOCKED (requires PARA methodology - out of scope)
- Graph Traversal: BLOCKED (requires Neo4j integration - out of scope)

**Every Minimal Patch Required:**
- 7 patches identified
- 32 hours total effort
- No PING runtime modification
- No application behavior modification

---

## OUT OF SCOPE

**Not Included in Surgical Patch Plan:**
- PARA methodology implementation (requires product-level changes)
- Neo4j integration (requires infrastructure changes)
- Vector embeddings (requires ML infrastructure)
- Graph traversal (requires Neo4j)
- Advanced timeline visualization (requires UI changes)
- Recommendation systems (product-level feature)
- Agents (product-level feature)
- Memory systems (product-level feature)
- Notes/tasks/goals/products (product-level features)

**Reason:** These require product-level or infrastructure-level changes, not constitutional-level patches. The surgical patch plan focuses on minimal constitutional observability and reconstruction only.

---

## ANSWER

**Smallest possible patches required to achieve Projection Rebuildability:**
- Patch 1: Ollama Analysis Event Emission (2 hours)
- Patch 2: Source Registration Event Emission (1 hour)
- Patch 7: Projection Rebuild Script (4 hours)

**Smallest possible patches required to achieve Canonical Knowledge Extraction:**
- Patch 5: Basic Named Entity Recognition (8 hours)
- Patch 6: Basic Relationship Extraction (12 hours)

**Smallest possible patches required to achieve Retrieval Fabric:**
- Patch 3: SQLite FTS5 Enablement (4 hours)
- Patch 5: Basic Named Entity Recognition (8 hours)
- Patch 6: Basic Relationship Extraction (12 hours)

**Total Minimal Patches:** 7 patches
**Total Effort:** 32 hours (4 days)
**No PING Runtime Modification:** YES
**No Application Behavior Modification:** YES
