# PHASE1_RETRIEVAL_AUTHORITY_DESIGN.md

**Design Type:** RETRIEVAL AUTHORITY SUBSYSTEM DESIGN  
**Design Date:** 2025-01-18  
**Design Scope:** Design Retrieval Authority as a first-class subsystem with FTS, Semantic, Timeline, Lineage, PARA, and Recommendation retrieval components  
**Status:** DESIGN ONLY - NO IMPLEMENTATION  

---

## EXECUTIVE SUMMARY

**Design Goal:** Create a first-class Retrieval Authority subsystem that provides unified access to all retrieval modes (FTS, Semantic, Timeline, Lineage, PARA, Recommendations) with clear authority boundaries and dependencies.

**Key Design Decisions:**
1. **Retrieval Authority as first-class subsystem** - Not an afterthought, but a core Brain component
2. **Unified retrieval interface** - Single entry point for all retrieval modes
3. **Component-based architecture** - Each retrieval mode is a separate component
4. **Authority boundaries** - Clear separation between retrieval and storage
5. **Dependency on Inference Gateway** - Semantic search and recommendations use InferenceGateway
6. **Dependency on PING authorities** - Lineage retrieval uses PING's Lineage Authority
7. **Storage abstraction** - Retrieval Authority abstracts over multiple storage backends

**Architecture:**

```
Retrieval Authority
├─ FTS Retrieval
├─ Semantic Retrieval
├─ Timeline Retrieval
├─ Lineage Retrieval
├─ PARA Retrieval
└─ Recommendation Retrieval
```

---

## RETRIEVAL AUTHORITY OVERVIEW

### System Architecture

```
Brain
  ↓
Retrieval Authority (first-class subsystem)
  ↓
├─ FTS Retrieval Component
├─ Semantic Retrieval Component
├─ Timeline Retrieval Component
├─ Lineage Retrieval Component
├─ PARA Retrieval Component
└─ Recommendation Retrieval Component
  ↓
Storage Layer
├─ SQLite (FTS, Timeline, PARA)
├─ Qdrant (Semantic)
├─ PING Lineage Authority (Lineage)
└─ Inference Gateway (Recommendations)
```

### Authority Boundaries

**Retrieval Authority owns:**
- Retrieval logic and algorithms
- Query planning and optimization
- Result ranking and scoring
- Retrieval orchestration
- Retrieval caching (if any)

**Retrieval Authority does NOT own:**
- Storage (SQLite, Qdrant, etc.)
- Constitutional authorities (PING)
- Inference (Inference Gateway)
- Raw data

**Dependencies:**
- **Inference Gateway** - For embeddings and recommendation generation
- **PING Lineage Authority** - For lineage retrieval
- **Storage Layer** - For data persistence (SQLite, Qdrant)
- **Event Authority** - For retrieval event logging

---

## UNIFIED RETRIEVAL INTERFACE

### Interface Definition

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum

class RetrievalMode(Enum):
    """Retrieval mode enumeration."""
    FTS = "fts"
    SEMANTIC = "semantic"
    TIMELINE = "timeline"
    LINEAGE = "lineage"
    PARA = "para"
    RECOMMENDATION = "recommendation"
    HYBRID = "hybrid"

@dataclass
class RetrievalQuery:
    """Unified retrieval query."""
    query: str
    mode: RetrievalMode
    filters: Optional[Dict[str, Any]] = None
    limit: int = 10
    offset: int = 0
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RetrievalResult:
    """Unified retrieval result."""
    id: str
    content: str
    score: float
    mode: RetrievalMode
    metadata: Dict[str, Any]
    snippet: Optional[str] = None

@dataclass
class RetrievalResponse:
    """Unified retrieval response."""
    results: List[RetrievalResult]
    total: int
    mode: RetrievalMode
    query: str
    latency_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class RetrievalAuthority(ABC):
    """Abstract base class for Retrieval Authority."""
    
    @abstractmethod
    def retrieve(self, query: RetrievalQuery) -> RetrievalResponse:
        """Execute retrieval query."""
        pass
    
    @abstractmethod
    def fts_search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """Full-text search."""
        pass
    
    @abstractmethod
    def semantic_search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """Semantic search using embeddings."""
        pass
    
    @abstractmethod
    def timeline_retrieve(self, start_date: str, end_date: str, filters: Optional[Dict] = None) -> RetrievalResponse:
        """Timeline retrieval by date range."""
        pass
    
    @abstractmethod
    def lineage_retrieve(self, entity_id: str, depth: int = 3) -> RetrievalResponse:
        """Lineage retrieval by entity ID."""
        pass
    
    @abstractmethod
    def para_retrieve(self, para_type: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """PARA retrieval by type (Projects, Areas, Resources, Archives)."""
        pass
    
    @abstractmethod
    def recommend(self, context: str, user_id: Optional[str] = None, limit: int = 10) -> RetrievalResponse:
        """Generate recommendations based on context and user preferences."""
        pass
    
    @abstractmethod
    def hybrid_search(self, query: str, weights: Optional[Dict[str, float]] = None, limit: int = 10) -> RetrievalResponse:
        """Hybrid search combining multiple retrieval modes."""
        pass
```

---

## FTS RETRIEVAL COMPONENT

### Purpose

Full-text search across all text content using SQLite FTS5 extension.

### Inputs

- **Query:** Search query string
- **Filters:** Optional filters (source, date range, tags, etc.)
- **Limit:** Maximum number of results
- **Offset:** Pagination offset

### Outputs

- **Results:** List of documents with FTS scores
- **Snippets:** Text snippets with highlighted matches
- **Metadata:** Document metadata (source, date, tags, etc.)

### Dependencies

- **SQLite FTS5:** Full-text search extension
- **Storage Layer:** SQLite database with FTS5 virtual tables
- **Event Authority:** For logging retrieval events

### Storage Requirements

**FTS5 Virtual Tables:**
- `newsletters_fts` - Full-text search index for newsletters
- `digests_fts` - Full-text search index for digests
- `archives_fts` - Full-text search index for markdown archives

**Schema:**
```sql
CREATE VIRTUAL TABLE newsletters_fts USING fts5(
    content,
    subject,
    sender,
    tokenize='porter unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER newsletters_fts_insert AFTER INSERT ON newsletters BEGIN
    INSERT INTO newsletters_fts(rowid, content, subject, sender)
    VALUES (new.id, new.body, new.subject, new.sender);
END;
```

### Authority Boundaries

**FTS Retrieval owns:**
- FTS query construction
- FTS result parsing
- Snippet generation
- FTS score normalization

**FTS Retrieval does NOT own:**
- SQLite database (Storage Layer)
- Raw document content (Storage Layer)

### Implementation Outline

```python
class FTSRetrieval:
    """Full-text search retrieval component."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> List[Dict]:
        """Execute FTS search."""
        # Construct FTS query with filters
        # Execute FTS5 search
        # Parse results with snippets
        # Return ranked results
        pass
```

---

## SEMANTIC RETRIEVAL COMPONENT

### Purpose

Semantic search using vector embeddings and similarity search.

### Inputs

- **Query:** Search query string
- **Filters:** Optional filters (source, date range, tags, etc.)
- **Limit:** Maximum number of results
- **Threshold:** Minimum similarity score

### Outputs

- **Results:** List of documents with similarity scores
- **Embeddings:** Query embedding (for caching)
- **Metadata:** Document metadata (source, date, tags, etc.)

### Dependencies

- **Inference Gateway:** For generating embeddings
- **Qdrant:** Vector database for storage and similarity search
- **Storage Layer:** For document metadata
- **Event Authority:** For logging retrieval events

### Storage Requirements

**Qdrant Collections:**
- `newsletters_embeddings` - Newsletter embeddings
- `digests_embeddings` - Digest embeddings
- `archives_embeddings` - Archive embeddings

**Collection Schema:**
```python
{
    "vectors": {
        "size": 1536,  # Depends on embedding model
        "distance": "Cosine"
    },
    "payload": {
        "document_id": "str",
        "source": "str",
        "created_at": "str",
        "tags": "list[str]"
    }
}
```

### Authority Boundaries

**Semantic Retrieval owns:**
- Query embedding generation (via Inference Gateway)
- Similarity search execution (via Qdrant)
- Result ranking and scoring
- Embedding caching (if any)

**Semantic Retrieval does NOT own:**
- Qdrant vector database (Storage Layer)
- Inference Gateway (separate subsystem)
- Raw document content (Storage Layer)

### Implementation Outline

```python
class SemanticRetrieval:
    """Semantic search retrieval component."""
    
    def __init__(self, inference_gateway: InferenceGateway, qdrant_client):
        self.inference_gateway = inference_gateway
        self.qdrant_client = qdrant_client
    
    def search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> List[Dict]:
        """Execute semantic search."""
        # Generate query embedding via InferenceGateway
        # Execute similarity search via Qdrant
        # Apply filters
        # Return ranked results
        pass
```

---

## TIMELINE RETRIEVAL COMPONENT

### Purpose

Timeline retrieval with date range queries, time-series analysis, and pattern detection.

### Inputs

- **Start Date:** Start of date range
- **End Date:** End of date range
- **Granularity:** Time granularity (day, week, month, year)
- **Filters:** Optional filters (source, tags, etc.)
- **Aggregations:** Optional aggregations (count, trends, patterns)

### Outputs

- **Results:** List of documents in date range
- **Time Series:** Aggregated data over time
- **Patterns:** Detected patterns (trends, seasonality, anomalies)
- **Metadata:** Timeline metadata

### Dependencies

- **Storage Layer:** SQLite database with date indexes
- **Event Authority:** For logging retrieval events

### Storage Requirements

**SQLite Tables:**
- `newsletters` - With `received_at` and `processed_at` indexes
- `digests` - With `generated_at` index
- `timeline_cache` - Optional cache for pre-computed aggregations

**Indexes:**
```sql
CREATE INDEX idx_newsletters_received_at ON newsletters(received_at);
CREATE INDEX idx_newsletters_processed_at ON newsletters(processed_at);
CREATE INDEX idx_digests_generated_at ON digests(generated_at);
```

### Authority Boundaries

**Timeline Retrieval owns:**
- Date range query construction
- Time-series aggregation logic
- Pattern detection algorithms
- Timeline visualization data

**Timeline Retrieval does NOT own:**
- SQLite database (Storage Layer)
- Raw document content (Storage Layer)

### Implementation Outline

```python
class TimelineRetrieval:
    """Timeline retrieval component."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def retrieve(self, start_date: str, end_date: str, granularity: str = 'day') -> Dict:
        """Execute timeline retrieval."""
        # Construct date range query
        # Execute query with granularity
        # Compute aggregations
        # Detect patterns
        # Return timeline results
        pass
```

---

## LINEAGE RETRIEVAL COMPONENT

### Purpose

Lineage retrieval using PING's constitutional Lineage Authority.

### Inputs

- **Entity ID:** Starting entity ID
- **Depth:** Traversal depth (default: 3)
- **Direction:** Traversal direction (ancestors, descendants, both)
- **Filters:** Optional filters (entity type, date range, etc.)

### Outputs

- **Lineage Graph:** DAG of related entities
- **Paths:** All paths between entities
- **Metadata:** Lineage metadata (creation time, relationship type, etc.)

### Dependencies

- **PING Lineage Authority:** Constitutional lineage storage and validation
- **Event Authority:** For logging retrieval events

### Storage Requirements

**PING Lineage Authority:**
- `lineage_edges` table (PING's constitutional storage)
- DAG validation (PING's dag_validator.ts)

**No additional storage required** - Uses PING's constitutional storage.

### Authority Boundaries

**Lineage Retrieval owns:**
- Lineage query construction
- Lineage graph traversal
- Path finding algorithms
- Lineage visualization data

**Lineage Retrieval does NOT own:**
- PING Lineage Authority (constitutional)
- Lineage edges storage (PING)
- DAG validation (PING)

### Implementation Outline

```python
class LineageRetrieval:
    """Lineage retrieval component."""
    
    def __init__(self, ping_lineage_authority):
        self.ping_lineage_authority = ping_lineage_authority
    
    def retrieve(self, entity_id: str, depth: int = 3, direction: str = 'both') -> Dict:
        """Execute lineage retrieval."""
        # Query PING Lineage Authority
        # Traverse lineage graph
        # Find all paths
        # Return lineage results
        pass
```

---

## PARA RETRIEVAL COMPONENT

### Purpose

PARA (Projects, Areas, Resources, Archives) retrieval for knowledge organization.

### Inputs

- **PARA Type:** One of (Projects, Areas, Resources, Archives)
- **Filters:** Optional filters (status, priority, tags, etc.)
- **Limit:** Maximum number of results
- **Sort:** Sort order (priority, date, relevance)

### Outputs

- **Results:** List of PARA items
- **Hierarchy:** PARA hierarchy (if applicable)
- **Metadata:** PARA metadata (status, priority, due date, etc.)

### Dependencies

- **Storage Layer:** SQLite database with PARA tables
- **Event Authority:** For logging retrieval events

### Storage Requirements

**SQLite Tables:**
- `para_items` - PARA items with type, status, priority, etc.
- `para_relationships` - PARA hierarchy and relationships
- `para_tags` - PARA tag associations

**Schema:**
```sql
CREATE TABLE para_items (
    id INTEGER PRIMARY KEY,
    item_id TEXT UNIQUE,
    para_type TEXT NOT NULL, -- 'project', 'area', 'resource', 'archive'
    title TEXT NOT NULL,
    content TEXT,
    status TEXT, -- 'active', 'inactive', 'completed', 'archived'
    priority INTEGER, -- 1-10
    due_date TEXT,
    created_at TEXT,
    updated_at TEXT,
    metadata JSON
);

CREATE INDEX idx_para_items_type ON para_items(para_type);
CREATE INDEX idx_para_items_status ON para_items(status);
CREATE INDEX idx_para_items_priority ON para_items(priority);
```

### Authority Boundaries

**PARA Retrieval owns:**
- PARA query construction
- PARA hierarchy traversal
- PARA filtering and sorting
- PARA visualization data

**PARA Retrieval does NOT own:**
- SQLite database (Storage Layer)
- Raw PARA content (Storage Layer)

### Implementation Outline

```python
class PARARetrieval:
    """PARA retrieval component."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def retrieve(self, para_type: str, filters: Optional[Dict] = None, limit: int = 10) -> List[Dict]:
        """Execute PARA retrieval."""
        # Construct PARA query
        # Apply filters and sorting
        # Traverse hierarchy if needed
        # Return PARA results
        pass
```

---

## RECOMMENDATION RETRIEVAL COMPONENT

### Purpose

Recommendation generation using Inference Gateway and user preferences.

### Inputs

- **Context:** Current context (query, document, etc.)
- **User ID:** Optional user ID for personalization
- **User Preferences:** Optional user preferences (topics, sources, etc.)
- **Limit:** Maximum number of recommendations
- **Recommendation Type:** Type of recommendation (content, source, topic, etc.)

### Outputs

- **Recommendations:** List of recommended items
- **Scores:** Recommendation scores
- **Explanations:** Explanation for each recommendation
- **Metadata:** Recommendation metadata (model used, confidence, etc.)

### Dependencies

- **Inference Gateway:** For recommendation generation
- **Storage Layer:** For user preferences and history
- **Event Authority:** For logging retrieval events

### Storage Requirements

**SQLite Tables:**
- `user_preferences` - User preferences for personalization
- `recommendation_history` - Recommendation history for feedback loop
- `user_interactions` - User interactions for collaborative filtering

**Schema:**
```sql
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    preference_type TEXT NOT NULL, -- 'topics', 'sources', 'tags', etc.
    preference_value TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE recommendation_history (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    context TEXT,
    recommendations JSON,
    model_used TEXT,
    generated_at TEXT
);
```

### Authority Boundaries

**Recommendation Retrieval owns:**
- Recommendation query construction
- Recommendation generation (via Inference Gateway)
- Recommendation ranking and scoring
- Personalization logic
- Feedback loop implementation

**Recommendation Retrieval does NOT own:**
- Inference Gateway (separate subsystem)
- User preferences (Storage Layer)
- User interactions (Storage Layer)

### Implementation Outline

```python
class RecommendationRetrieval:
    """Recommendation retrieval component."""
    
    def __init__(self, inference_gateway: InferenceGateway, db_path: str):
        self.inference_gateway = inference_gateway
        self.db_path = db_path
    
    def recommend(self, context: str, user_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Generate recommendations."""
        # Load user preferences if user_id provided
        # Construct recommendation prompt
        # Generate recommendations via InferenceGateway
        # Apply personalization
        # Rank and score recommendations
        # Return recommendations
        pass
```

---

## HYBRID RETRIEVAL

### Purpose

Hybrid retrieval combining multiple retrieval modes with configurable weights.

### Inputs

- **Query:** Search query string
- **Modes:** List of retrieval modes to combine
- **Weights:** Weights for each mode (default: equal weights)
- **Limit:** Maximum number of results
- **Filters:** Optional filters

### Outputs

- **Results:** Combined and re-ranked results
- **Mode Scores:** Scores from each mode
- **Final Scores:** Combined scores
- **Metadata:** Hybrid retrieval metadata

### Dependencies

- **All Retrieval Components:** FTS, Semantic, Timeline, Lineage, PARA, Recommendation
- **Event Authority:** For logging retrieval events

### Storage Requirements

**No additional storage required** - Uses component storage.

### Authority Boundaries

**Hybrid Retrieval owns:**
- Mode selection logic
- Weight configuration
- Score combination algorithms
- Result re-ranking logic

**Hybrid Retrieval does NOT own:**
- Individual retrieval components
- Component storage

### Implementation Outline

```python
class HybridRetrieval:
    """Hybrid retrieval component."""
    
    def __init__(self, components: Dict[str, Any]):
        self.components = components  # FTS, Semantic, Timeline, etc.
    
    def search(self, query: str, modes: List[str], weights: Optional[Dict[str, float]] = None, limit: int = 10) -> List[Dict]:
        """Execute hybrid search."""
        # Execute each retrieval mode
        # Combine scores with weights
        # Re-rank results
        # Return combined results
        pass
```

---

## RETRIEVAL AUTHORITY ORCHESTRATION

### Main Retrieval Authority Class

```python
class RetrievalAuthorityImpl(RetrievalAuthority):
    """Main Retrieval Authority implementation."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Retrieval Authority.
        
        Required Configuration:
        - db_path: str - SQLite database path
        - qdrant_host: str - Qdrant host
        - qdrant_port: int - Qdrant port
        - inference_gateway: InferenceGateway - Inference Gateway instance
        - ping_lineage_authority: PING Lineage Authority instance
        """
        self.config = config
        
        # Initialize components
        self.fts_retrieval = FTSRetrieval(config['db_path'])
        self.semantic_retrieval = SemanticRetrieval(
            config['inference_gateway'],
            QdrantClient(host=config['qdrant_host'], port=config['qdrant_port'])
        )
        self.timeline_retrieval = TimelineRetrieval(config['db_path'])
        self.lineage_retrieval = LineageRetrieval(config['ping_lineage_authority'])
        self.para_retrieval = PARARetrieval(config['db_path'])
        self.recommendation_retrieval = RecommendationRetrieval(
            config['inference_gateway'],
            config['db_path']
        )
        self.hybrid_retrieval = HybridRetrieval({
            'fts': self.fts_retrieval,
            'semantic': self.semantic_retrieval,
            'timeline': self.timeline_retrieval,
            'lineage': self.lineage_retrieval,
            'para': self.para_retrieval,
            'recommendation': self.recommendation_retrieval
        })
    
    def retrieve(self, query: RetrievalQuery) -> RetrievalResponse:
        """Execute retrieval query based on mode."""
        if query.mode == RetrievalMode.FTS:
            return self.fts_search(query.query, query.filters, query.limit)
        elif query.mode == RetrievalMode.SEMANTIC:
            return self.semantic_search(query.query, query.filters, query.limit)
        elif query.mode == RetrievalMode.TIMELINE:
            return self.timeline_retrieve(query.filters['start_date'], query.filters['end_date'], query.filters)
        elif query.mode == RetrievalMode.LINEAGE:
            return self.lineage_retrieve(query.filters['entity_id'], query.filters.get('depth', 3))
        elif query.mode == RetrievalMode.PARA:
            return self.para_retrieve(query.filters['para_type'], query.filters, query.limit)
        elif query.mode == RetrievalMode.RECOMMENDATION:
            return self.recommend(query.query, query.filters.get('user_id'), query.limit)
        elif query.mode == RetrievalMode.HYBRID:
            return self.hybrid_search(query.query, query.filters.get('weights'), query.limit)
        else:
            raise ValueError(f"Unknown retrieval mode: {query.mode}")
    
    def fts_search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """Full-text search."""
        results = self.fts_retrieval.search(query, filters, limit)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.FTS,
            query=query
        )
    
    def semantic_search(self, query: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """Semantic search."""
        results = self.semantic_retrieval.search(query, filters, limit)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.SEMANTIC,
            query=query
        )
    
    def timeline_retrieve(self, start_date: str, end_date: str, filters: Optional[Dict] = None) -> RetrievalResponse:
        """Timeline retrieval."""
        results = self.timeline_retrieval.retrieve(start_date, end_date, filters.get('granularity', 'day'))
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.TIMELINE,
            query=f"{start_date} to {end_date}"
        )
    
    def lineage_retrieve(self, entity_id: str, depth: int = 3) -> RetrievalResponse:
        """Lineage retrieval."""
        results = self.lineage_retrieval.retrieve(entity_id, depth)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.LINEAGE,
            query=entity_id
        )
    
    def para_retrieve(self, para_type: str, filters: Optional[Dict] = None, limit: int = 10) -> RetrievalResponse:
        """PARA retrieval."""
        results = self.para_retrieval.retrieve(para_type, filters, limit)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.PARA,
            query=para_type
        )
    
    def recommend(self, context: str, user_id: Optional[str] = None, limit: int = 10) -> RetrievalResponse:
        """Generate recommendations."""
        results = self.recommendation_retrieval.recommend(context, user_id, limit)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.RECOMMENDATION,
            query=context
        )
    
    def hybrid_search(self, query: str, weights: Optional[Dict[str, float]] = None, limit: int = 10) -> RetrievalResponse:
        """Hybrid search."""
        modes = ['fts', 'semantic']  # Default modes for hybrid
        results = self.hybrid_retrieval.search(query, modes, weights, limit)
        return RetrievalResponse(
            results=[RetrievalResult(**r) for r in results],
            total=len(results),
            mode=RetrievalMode.HYBRID,
            query=query
        )
```

---

## MIGRATION PATH

### Current Architecture

```
Brain (worker.py, daily_digest.py)
  ↓
Direct SQL queries (database.py)
  ↓
SQLite (newsletters.db)
```

### Target Architecture

```
Brain (worker.py, daily_digest.py)
  ↓
Retrieval Authority (first-class subsystem)
  ↓
├─ FTS Retrieval → SQLite FTS5
├─ Semantic Retrieval → Qdrant + Inference Gateway
├─ Timeline Retrieval → SQLite
├─ Lineage Retrieval → PING Lineage Authority
├─ PARA Retrieval → SQLite
└─ Recommendation Retrieval → Inference Gateway + SQLite
```

### Migration Steps

1. **Create Retrieval Authority interface** - Define abstract base class
2. **Implement FTS Retrieval** - Add SQLite FTS5 virtual tables and FTS component
3. **Implement Timeline Retrieval** - Migrate existing date-range queries to Timeline component
4. **Implement Semantic Retrieval** - Integrate Qdrant and Inference Gateway for embeddings
5. **Implement PARA Retrieval** - Create PARA tables and PARA component
6. **Implement Lineage Retrieval** - Integrate PING's Lineage Authority
7. **Implement Recommendation Retrieval** - Build recommendation engine with Inference Gateway
8. **Implement Hybrid Retrieval** - Combine multiple retrieval modes
9. **Update Brain code** - Replace direct SQL queries with Retrieval Authority calls
10. **Test all retrieval modes** - Verify each retrieval mode works correctly

---

## SUMMARY

### Retrieval Authority Components

| Component | Purpose | Dependencies | Storage |
|-----------|---------|--------------|---------|
| FTS Retrieval | Full-text search | SQLite FTS5 | SQLite FTS5 virtual tables |
| Semantic Retrieval | Semantic search | Inference Gateway, Qdrant | Qdrant vector database |
| Timeline Retrieval | Timeline retrieval | SQLite | SQLite with date indexes |
| Lineage Retrieval | Lineage retrieval | PING Lineage Authority | PING lineage_edges table |
| PARA Retrieval | PARA organization | SQLite | SQLite PARA tables |
| Recommendation Retrieval | Recommendations | Inference Gateway, SQLite | SQLite user preferences |

### Authority Boundaries

**Retrieval Authority owns:**
- Retrieval logic and algorithms
- Query planning and optimization
- Result ranking and scoring
- Retrieval orchestration

**Retrieval Authority does NOT own:**
- Storage (SQLite, Qdrant)
- Constitutional authorities (PING)
- Inference (Inference Gateway)
- Raw data

### Dependencies

| Dependency | Purpose | Constitutional Status |
|------------|---------|----------------------|
| Inference Gateway | Embeddings and recommendations | Separate subsystem |
| PING Lineage Authority | Lineage retrieval | Constitutional |
| SQLite | FTS, Timeline, PARA storage | Application storage |
| Qdrant | Semantic search storage | Application storage |
| Event Authority | Retrieval event logging | Constitutional |

### Migration Benefits

1. **Unified retrieval interface** - Single entry point for all retrieval modes
2. **First-class subsystem** - Retrieval is not an afterthought
3. **Authority boundaries** - Clear separation between retrieval and storage
4. **Extensibility** - Easy to add new retrieval modes
5. **Testability** - Each component can be tested independently
6. **Performance** - Optimized retrieval algorithms per mode
7. **Flexibility** - Can switch storage backends without changing retrieval logic
