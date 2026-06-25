-- Qdrant Memory Projection Schema
-- Priority 1: Constitutional Memory Ingestion
-- Date: 2026-06-23

-- Constitutional Architecture:
-- PostgreSQL = Truth (Layer 1)
-- Qdrant = Memory Projection (Layer 4 - Disposable, Rebuildable)

-- Collection: documents
-- Purpose: Vector projection of document content for semantic search
-- Rebuildable from: PostgreSQL documents + document_content tables
-- Authority: PostgreSQL is source of truth, Qdrant is projection

-- Collection Configuration
-- Collection Name: documents
-- Vector Dimension: 768 (for qwen2.5-coder:7b embeddings) or 1024 (for other models)
-- Distance Metric: Cosine
-- Payload Schema: Defined below

-- Payload Schema (JSON)
{
  "document_id": "bigint",           -- PostgreSQL document.id
  "document_hash": "string",         -- PostgreSQL document.document_hash
  "source_type": "string",           -- 'vault', 'drive', 'research', 'scripts', 'transcripts', 'notes'
  "source_path": "string",           -- Original file path
  "title": "string",                 -- Document title
  "author": "string",                -- Document author
  "created_at": "string",            -- ISO 8601 timestamp
  "discovered_at": "string",         -- ISO 8601 timestamp
  "ingested_at": "string",           -- ISO 8601 timestamp
  "embedded_at": "string",           -- ISO 8601 timestamp
  "projected_at": "string",          -- ISO 8601 timestamp
  "content_length": "integer",       -- Content length in characters
  "word_count": "integer",           -- Word count
  "language": "string",              -- Document language (default: 'en')
  "embedding_model": "string",       -- Model used for embedding (e.g., 'qwen2.5-coder:7b')
  "embedding_dimension": "integer", -- Embedding dimension
  "content_hash": "string",          -- SHA-256 hash of content
  "embedding_hash": "string",        -- SHA-256 hash of embedding
  "metadata": "object",              -- Additional metadata as JSON object
  "tags": "array<string>",           -- Array of tags
  "status": "string"                 -- 'discovered', 'ingested', 'embedded', 'projected', 'failed'
}

-- Index Configuration
-- Index on: document_id (for PostgreSQL verification)
-- Index on: source_type (for filtering by source)
-- Index on: tags (for tag-based filtering)
-- Index on: created_at (for temporal queries)
-- Index on: status (for status filtering)

-- Collection Creation (Qdrant REST API)
-- POST /collections/documents
{
  "vectors": {
    "size": 768,
    "distance": "Cosine"
  },
  "payload_schema": {
    "document_id": "integer",
    "document_hash": "keyword",
    "source_type": "keyword",
    "source_path": "text",
    "title": "text",
    "author": "keyword",
    "created_at": "integer",
    "discovered_at": "integer",
    "ingested_at": "integer",
    "embedded_at": "integer",
    "projected_at": "integer",
    "content_length": "integer",
    "word_count": "integer",
    "language": "keyword",
    "embedding_model": "keyword",
    "embedding_dimension": "integer",
    "content_hash": "keyword",
    "embedding_hash": "keyword",
    "metadata": "object",
    "tags": "array<string>",
    "status": "keyword"
  }
}

-- Payload Index Configuration
-- POST /collections/documents/indexes
{
  "field_name": "document_id",
  "field_schema": "integer"
}
{
  "field_name": "source_type",
  "field_schema": "keyword"
}
{
  "field_name": "tags",
  "field_schema": "keyword"
}
{
  "field_name": "created_at",
  "field_schema": "integer"
}
{
  "field_name": "status",
  "field_schema": "keyword"
}

-- Collection: document_chunks
-- Purpose: Vector projection of document chunks for fine-grained retrieval
-- Rebuildable from: PostgreSQL document_content table
-- Authority: PostgreSQL is source of truth, Qdrant is projection

-- Payload Schema (JSON)
{
  "chunk_id": "bigint",              -- PostgreSQL chunk.id (if chunk table exists)
  "document_id": "bigint",           -- PostgreSQL document.id
  "document_hash": "string",         -- PostgreSQL document.document_hash
  "chunk_index": "integer",          -- Chunk index within document
  "chunk_start": "integer",          -- Start position in content
  "chunk_end": "integer",            -- End position in content
  "content_preview": "string",       -- First 200 characters of chunk
  "source_type": "string",           -- 'vault', 'drive', 'research', 'scripts', 'transcripts', 'notes'
  "title": "string",                 -- Document title
  "created_at": "string",            -- ISO 8601 timestamp
  "embedded_at": "string",           -- ISO 8601 timestamp
  "projected_at": "string",          -- ISO 8601 timestamp
  "embedding_model": "string",       -- Model used for embedding
  "embedding_dimension": "integer", -- Embedding dimension
  "content_hash": "string",          -- SHA-256 hash of chunk content
  "embedding_hash": "string",        -- SHA-256 hash of embedding
  "metadata": "object"              -- Additional metadata
}

-- Collection Creation (Qdrant REST API)
-- POST /collections/document_chunks
{
  "vectors": {
    "size": 768,
    "distance": "Cosine"
  },
  "payload_schema": {
    "chunk_id": "integer",
    "document_id": "integer",
    "document_hash": "keyword",
    "chunk_index": "integer",
    "chunk_start": "integer",
    "chunk_end": "integer",
    "content_preview": "text",
    "source_type": "keyword",
    "title": "text",
    "created_at": "integer",
    "embedded_at": "integer",
    "projected_at": "integer",
    "embedding_model": "keyword",
    "embedding_dimension": "integer",
    "content_hash": "keyword",
    "embedding_hash": "keyword",
    "metadata": "object"
  }
}

-- Payload Index Configuration
-- POST /collections/document_chunks/indexes
{
  "field_name": "document_id",
  "field_schema": "integer"
}
{
  "field_name": "document_hash",
  "field_schema": "keyword"
}
{
  "field_name": "chunk_index",
  "field_schema": "integer"
}
{
  "field_name": "source_type",
  "field_schema": "keyword"
}

-- Rebuild Path Verification
-- This collection is rebuildable from PostgreSQL truth:
-- 1. SELECT * FROM documents WHERE status = 'projected'
-- 2. SELECT content FROM document_content WHERE document_id = ?
-- 3. Generate embeddings using embedding_model
-- 4. Insert into Qdrant with payload
-- 5. Verify: SELECT COUNT(*) FROM documents = Qdrant collection count

-- Verification Query
-- POST /collections/documents/points/scroll
{
  "limit": 0,
  "with_payload": false,
  "with_vector": false
}
-- Compare result count with PostgreSQL: SELECT COUNT(*) FROM documents WHERE status = 'projected'

-- Constitutional Constraint
-- Qdrant is NOT source of truth
-- Qdrant is disposable projection
-- Qdrant can be destroyed and rebuilt from PostgreSQL
-- PostgreSQL events table provides audit trail
-- PostgreSQL document tables provide canonical state
