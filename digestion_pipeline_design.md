# 7B Digestion Pipeline Design
# Priority 3: 7B Digestion Pipeline
# Date: 2026-06-23

## Architecture

```
New Document
    ↓
7B Model (qwen2.5-coder:7b)
    ↓
Structured Output
    ├── Summary
    ├── Topics
    ├── Entities
    ├── Claims
    ├── Keywords
    └── Citations
    ↓
Events
    ↓
Projection
```

## Constitutional Principles

- **Structured Output Only**: Output must be JSON, not prose
- **Event-Based**: All digestion results stored as events
- **Replayable**: Digestion can be replayed from original document
- **Verifiable**: Digestion results can be verified against source
- **No Transient State**: Never store LLM output as transient data

## PostgreSQL Schema

### Digestion Results Table

```sql
CREATE TABLE IF NOT EXISTS digestion_results (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    digestion_model TEXT NOT NULL,
    digested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary TEXT,
    topics JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    claims JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    citations JSONB DEFAULT '[]',
    digestion_hash TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_digestion_results_document_id ON digestion_results(document_id);
CREATE INDEX IF NOT EXISTS idx_digestion_results_model ON digestion_results(digestion_model);
CREATE INDEX IF NOT EXISTS idx_digestion_results_hash ON digestion_results(digestion_hash);
```

### Digestion Events Table

```sql
-- Events are stored in the existing events table
-- Event stream: 'digestion'
-- Event types: 'DIGESTION_STARTED', 'DIGESTION_COMPLETED', 'DIGESTION_FAILED'
```

## Structured Output Schema

### Digestion Output JSON

```json
{
  "summary": "Concise summary of the document (2-3 sentences)",
  "topics": [
    {
      "topic": "Topic name",
      "confidence": 0.95,
      "relevance": "high"
    }
  ],
  "entities": [
    {
      "entity": "Entity name",
      "type": "person|organization|location|concept",
      "confidence": 0.90,
      "context": "Context where entity appears"
    }
  ],
  "claims": [
    {
      "claim": "Factual claim made in document",
      "confidence": 0.85,
      "source": "Section or paragraph reference"
    }
  ],
  "keywords": [
    {
      "keyword": "Important keyword",
      "relevance": 0.92
    }
  ],
  "citations": [
    {
      "text": "Cited text",
      "source": "Source reference if available"
    }
  ]
}
```

## Event Flow

### DIGESTION_STARTED Event

```json
{
  "document_id": 123,
  "document_hash": "abc123...",
  "digestion_model": "qwen2.5-coder:7b",
  "started_at": "2026-06-23T12:00:00Z"
}
```

### DIGESTION_COMPLETED Event

```json
{
  "document_id": 123,
  "document_hash": "abc123...",
  "digestion_model": "qwen2.5-coder:7b",
  "completed_at": "2026-06-23T12:00:05Z",
  "duration_ms": 5000,
  "digestion_hash": "def456...",
  "summary_length": 150,
  "topics_count": 5,
  "entities_count": 10,
  "claims_count": 3,
  "keywords_count": 8,
  "citations_count": 2
}
```

### DIGESTION_FAILED Event

```json
{
  "document_id": 123,
  "document_hash": "abc123...",
  "digestion_model": "qwen2.5-coder:7b",
  "failed_at": "2026-06-23T12:00:03Z",
  "error_message": "Failed to parse structured output",
  "error_type": "parsing_error",
  "retry_count": 1
}
```

## Implementation

### Digestion Pipeline Worker

```python
def digest_document(document_id: int, content: str) -> Dict[str, Any]:
    """
    Digest document using 7B model.
    
    Returns structured output as JSON.
    """
    prompt = f"""
    Analyze the following document and return structured JSON output.
    
    Document:
    {content}
    
    Return JSON in this exact format:
    {{
      "summary": "2-3 sentence summary",
      "topics": [{{"topic": "name", "confidence": 0.95, "relevance": "high"}}],
      "entities": [{{"entity": "name", "type": "person|organization|location|concept", "confidence": 0.90, "context": "context"}}],
      "claims": [{{"claim": "claim", "confidence": 0.85, "source": "reference"}}],
      "keywords": [{{"keyword": "word", "relevance": 0.92}}],
      "citations": [{{"text": "text", "source": "source"}}]
    }}
    
    Return ONLY valid JSON. No prose. No explanations.
    """
    
    response = ollama_generate(prompt, model="qwen2.5-coder:7b")
    
    # Parse JSON response
    try:
        digestion_result = json.loads(response)
        return digestion_result
    except json.JSONDecodeError:
        # Retry with stricter prompt
        return retry_digestion(content)
```

### Digestion Storage

```python
def store_digestion_result(document_id: int, digestion_result: Dict[str, Any]) -> bool:
    """
    Store digestion result in PostgreSQL.
    """
    digestion_hash = calculate_digestion_hash(digestion_result)
    
    conn = get_postgres_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        INSERT INTO digestion_results (
            document_id, digestion_model, digested_at,
            summary, topics, entities, claims, keywords, citations,
            digestion_hash, metadata
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            document_id,
            "qwen2.5-coder:7b",
            datetime.utcnow(),
            digestion_result.get('summary'),
            Json(digestion_result.get('topics', [])),
            Json(digestion_result.get('entities', [])),
            Json(digestion_result.get('claims', [])),
            Json(digestion_result.get('keywords', [])),
            Json(digestion_result.get('citations', [])),
            digestion_hash,
            Json({})
        )
    )
    
    conn.commit()
    conn.close()
    
    return True
```

## Verification

### Digestion Verification Function

```sql
CREATE OR REPLACE FUNCTION verify_digestion(p_document_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    verification JSONB;
BEGIN
    SELECT jsonb_build_object(
        'document_id', p_document_id,
        'digestion_exists', (SELECT COUNT(*) > 0 FROM digestion_results WHERE document_id = p_document_id),
        'digestion_model', (SELECT digestion_model FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'digested_at', (SELECT digested_at FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'has_summary', (SELECT summary IS NOT NULL FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'topics_count', (SELECT jsonb_array_length(topics) FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'entities_count', (SELECT jsonb_array_length(entities) FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'claims_count', (SELECT jsonb_array_length(claims) FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'keywords_count', (SELECT jsonb_array_length(keywords) FROM digestion_results WHERE document_id = p_document_id LIMIT 1),
        'citations_count', (SELECT jsonb_array_length(citations) FROM digestion_results WHERE document_id = p_document_id LIMIT 1)
    ) INTO verification;
    
    RETURN verification;
END;
$$ LANGUAGE plpgsql;
```

## Replay Path

### Digestion Replay

Digestion is replayable from the original document:

1. Retrieve document content from PostgreSQL
2. Re-run digestion with same model
3. Compare digestion_hash
4. If different, store new version with timestamp
5. Maintain history of digestion versions

### Digestion History Table

```sql
CREATE TABLE IF NOT EXISTS digestion_history (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    digestion_version INTEGER NOT NULL,
    digestion_model TEXT NOT NULL,
    digested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    digestion_hash TEXT NOT NULL,
    digestion_result JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_digestion_history_document_id ON digestion_history(document_id);
CREATE INDEX IF NOT EXISTS idx_digestion_history_version ON digestion_history(document_id, digestion_version);
```

## Integration with Memory Ingestion

### Updated Pipeline

```
Document Discovered
    ↓
Document Ingested
    ↓
Document Embedded
    ↓
Document Projected to Qdrant
    ↓
Document Digested (7B)
    ↓
Digestion Results Stored
    ↓
Digestion Events Emitted
```

### Trigger Digestion After Projection

```python
def process_document(document: Dict[str, Any]) -> bool:
    # ... existing ingestion, embedding, projection code ...
    
    # Trigger digestion after successful projection
    if projected:
        digest_document(document_id, document['content'])
    
    return True
```

## Constitutional Constraints

1. **No Prose Output**: 7B model must return JSON only
2. **Event-Based Storage**: All digestion results stored as events
3. **Replayable**: Digestion can be replayed from source document
4. **Verifiable**: Digestion results can be verified against source
5. **Versioned**: Maintain history of digestion versions
6. **Model-Agnostic**: Digestion model can be changed without breaking system

## Success Metrics

- Digestion success rate > 95%
- Structured output parsing success rate > 98%
- Digestion replay consistency > 99%
- Average digestion time < 10 seconds per document
- Digestion result storage success rate > 99%
