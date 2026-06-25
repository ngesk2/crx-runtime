-- Constitutional Memory Ingestion Schema
-- Priority 1: Constitutional Memory Ingestion
-- Date: 2026-06-23

-- Documents Table (Truth Layer)
-- This table stores document metadata and state derived from events
-- State is reconstructable from event history
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    document_hash TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL, -- 'vault', 'drive', 'research', 'scripts', 'transcripts', 'notes'
    source_path TEXT NOT NULL,
    title TEXT,
    content_hash TEXT,
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ,
    embedded_at TIMESTAMPTZ,
    projected_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'discovered', -- 'discovered', 'ingested', 'embedded', 'projected', 'failed'
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    content_length INTEGER,
    word_count INTEGER,
    language TEXT DEFAULT 'en'
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(document_hash);
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON documents(source_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_discovered_at ON documents(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_source_path ON documents(source_path);

-- Document Content Table (Truth Layer)
-- Stores actual document content with content-addressable storage
CREATE TABLE IF NOT EXISTS document_content (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    stored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for document content
CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
CREATE INDEX IF NOT EXISTS idx_document_content_hash ON document_content(content_hash);

-- Document Embeddings Table (Truth Layer)
-- Stores embedding metadata (actual embeddings in Qdrant)
CREATE TABLE IF NOT EXISTS document_embeddings (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    embedding_model TEXT NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    qdrant_id BIGINT,
    embedded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    embedding_hash TEXT
);

-- Indexes for document embeddings
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_model ON document_embeddings(embedding_model);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_qdrant_id ON document_embeddings(qdrant_id);

-- Document Lineage Table (Truth Layer)
-- Tracks document relationships and transformations
CREATE TABLE IF NOT EXISTS document_lineage (
    id BIGSERIAL PRIMARY KEY,
    parent_document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    child_document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL, -- 'derived_from', 'summarized_from', 'transcribed_from', 'cited_by'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for document lineage
CREATE INDEX IF NOT EXISTS idx_document_lineage_parent ON document_lineage(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_document_lineage_child ON document_lineage(child_document_id);
CREATE INDEX IF NOT EXISTS idx_document_lineage_type ON document_lineage(relationship_type);

-- Document Tags Table (Truth Layer)
-- Stores document tags and categories
CREATE TABLE IF NOT EXISTS document_tags (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    tag_type TEXT DEFAULT 'manual', -- 'manual', 'auto', 'ai_generated'
    confidence NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for document tags
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);
CREATE INDEX IF NOT EXISTS idx_document_tags_type ON document_tags(tag_type);

-- Document Citations Table (Truth Layer)
-- Tracks citations between documents
CREATE TABLE IF NOT EXISTS document_citations (
    id BIGSERIAL PRIMARY KEY,
    citing_document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    cited_document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    citation_context TEXT,
    citation_position INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for document citations
CREATE INDEX IF NOT EXISTS idx_document_citations_citing ON document_citations(citing_document_id);
CREATE INDEX IF NOT EXISTS idx_document_citations_cited ON document_citations(cited_document_id);

-- Document Statistics Function
CREATE OR REPLACE FUNCTION get_document_statistics()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_documents', COUNT(*),
        'by_source_type', jsonb_object_agg(source_type, COUNT(*)),
        'by_status', jsonb_object_agg(status, COUNT(*)),
        'total_content_length', SUM(content_length),
        'total_word_count', SUM(word_count),
        'avg_content_length', AVG(content_length),
        'avg_word_count', AVG(word_count)
    ) INTO stats
    FROM documents;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Document Discovery Function
CREATE OR REPLACE FUNCTION discover_document(
    p_source_type TEXT,
    p_source_path TEXT,
    p_title TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_author TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS BIGINT AS $$
DECLARE
    v_content_hash TEXT;
    v_document_hash TEXT;
    v_document_id BIGINT;
BEGIN
    -- Calculate content hash
    IF p_content IS NOT NULL THEN
        v_content_hash := encode(digest(p_content, 'sha256'), 'hex');
    ELSE
        v_content_hash := NULL;
    END IF;
    
    -- Calculate document hash (unique identifier)
    v_document_hash := encode(digest(p_source_type || p_source_path || COALESCE(v_content_hash, ''), 'sha256'), 'hex');
    
    -- Check if document already exists
    SELECT id INTO v_document_id FROM documents WHERE document_hash = v_document_hash;
    
    IF v_document_id IS NULL THEN
        -- Insert new document
        INSERT INTO documents (
            document_hash, source_type, source_path, title, content_hash,
            author, created_at, discovered_at, status, metadata,
            content_length, word_count
        ) VALUES (
            v_document_hash, p_source_type, p_source_path, p_title, v_content_hash,
            p_author, COALESCE((p_metadata->>'created_at')::TIMESTAMPTZ, NOW()), NOW(), 'discovered', p_metadata,
            LENGTH(p_content), array_length(regexp_split_to_array(p_content, '\s+'), 1)
        ) RETURNING id INTO v_document_id;
        
        -- Store content if provided
        IF p_content IS NOT NULL THEN
            INSERT INTO document_content (document_id, content, content_hash)
            VALUES (v_document_id, p_content, v_content_hash);
        END IF;
    END IF;
    
    RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;

-- Document Ingestion Function
CREATE OR REPLACE FUNCTION ingest_document(p_document_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE documents
    SET ingested_at = NOW(),
        status = 'ingested'
    WHERE id = p_document_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Document Embedding Function
CREATE OR REPLACE FUNCTION embed_document(
    p_document_id BIGINT,
    p_embedding_model TEXT,
    p_embedding_dimension INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_content_hash TEXT;
    v_embedding_hash TEXT;
BEGIN
    -- Get content hash
    SELECT content_hash INTO v_content_hash
    FROM document_content
    WHERE document_id = p_document_id;
    
    -- Calculate embedding hash
    v_embedding_hash := encode(digest(p_embedding_model || v_content_hash, 'sha256'), 'hex');
    
    -- Insert embedding record
    INSERT INTO document_embeddings (
        document_id, embedding_model, embedding_dimension, embedded_at, embedding_hash
    ) VALUES (
        p_document_id, p_embedding_model, p_embedding_dimension, NOW(), v_embedding_hash
    );
    
    -- Update document status
    UPDATE documents
    SET embedded_at = NOW(),
        status = 'embedded'
    WHERE id = p_document_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Document Projection Function
CREATE OR REPLACE FUNCTION project_document(
    p_document_id BIGINT,
    p_qdrant_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update embedding record with Qdrant ID
    UPDATE document_embeddings
    SET qdrant_id = p_qdrant_id
    WHERE document_id = p_document_id;
    
    -- Update document status
    UPDATE documents
    SET projected_at = NOW(),
        status = 'projected'
    WHERE id = p_document_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Document Search Function (PostgreSQL full-text search)
CREATE OR REPLACE FUNCTION search_documents(p_query TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    document_id BIGINT,
    title TEXT,
    source_type TEXT,
    source_path TEXT,
    content_preview TEXT,
    similarity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.source_type,
        d.source_path,
        SUBSTRING(dc.content, 1, 200) as content_preview,
        ts_rank_cd(to_tsvector('english', dc.content), to_tsquery('english', p_query)) as similarity_score
    FROM documents d
    JOIN document_content dc ON d.id = dc.document_id
    WHERE to_tsvector('english', dc.content) @@ to_tsquery('english', p_query)
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Document Lineage Function
CREATE OR REPLACE FUNCTION add_document_lineage(
    p_parent_id BIGINT,
    p_child_id BIGINT,
    p_relationship_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO document_lineage (parent_document_id, child_document_id, relationship_type)
    VALUES (p_parent_id, p_child_id, p_relationship_type);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
