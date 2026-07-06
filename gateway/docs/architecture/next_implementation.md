# Next Implementation Recommendation

## Recommendation

**Introduce Document Acquisition Layer with Canonical Intermediate Representation**

## Rationale

### Highest Leverage
- Establishes the foundational architecture for all document ingestion
- Creates clear separation: RepositoryAuthority → RepositoryAdapter → DocumentReader → CanonicalDocument
- Enables every future connector (GitHub, Filesystem, Zip, MCP, S3, Google Drive, OneDrive) to feed the same canonical pipeline
- Eliminates handwritten parsers, loaders, and metadata extraction (solved problems)

### Lowest Risk
- Layered approach allows incremental migration
- Constitutional layer never knows specific readers exist (easy to swap)
- Canonical Intermediate Representation provides stable contract
- Can start with GitHub adapter and expand to others

### Maximum Reuse
- Once CanonicalDocument pipeline exists, every future connector becomes trivial
- Single immutable document model for all ingestion paths
- Clear transformation pipeline (Acquire → Normalize → Parse → Chunk → Embed → Project)
- Easy to debug and test

## Implementation Plan

### Phase 1: Define Canonical Intermediate Representation
Create `core/canonical_document.js`:
```javascript
{
  id: string,              // Unique identifier
  uri: string,             // Original URI
  language: string,        // Detected language
  mime: string,            // MIME type
  source: string,          // Source system (github, filesystem, etc.)
  metadata: object,        // Extracted metadata
  content: string,         // Normalized content
  provenance: object,      // Provenance tracking
  hashes: object           // Content hashes (SHA256, etc.)
}
```

Create `core/canonical_ast.js`:
```javascript
{
  documentId: string,      // Reference to CanonicalDocument
  ast: object,             // Parsed AST
  language: string,        // Language
  parser: string,          // Parser used (tree-sitter, etc.)
  metadata: object         // AST metadata
}
```

Create `core/canonical_chunk.js`:
```javascript
{
  id: string,              // Unique identifier
  documentId: string,      // Reference to CanonicalDocument
  astId: string,           // Reference to CanonicalAST (if applicable)
  text: string,            // Chunk text
  strategy: string,        // Chunk strategy used
  metadata: object,        // Chunk metadata
  embedding: number[],     // Vector embedding (optional)
  provenance: object       // Provenance tracking
}
```

### Phase 2: Create RepositoryAdapter Interface
Create `adapters/repository_adapter_interface.js`:
```javascript
class RepositoryAdapter {
  async acquire(uri) {
    // Acquire document from source
    // Return raw bytes/string
  }
}
```

### Phase 3: Create DocumentReader Interface
Create `adapters/document_reader_interface.js`:
```javascript
class DocumentReader {
  async read(rawContent) {
    // Read and normalize document
    // Return CanonicalDocument
  }
}
```

### Phase 4: Implement GitHubAdapter
Create `adapters/github_adapter.js`:
- Implement RepositoryAdapter interface
- Use LlamaIndex GitHub Reader
- Return raw content
- Preserve constitutional provenance tracking

### Phase 5: Implement LlamaIndexReader
Create `adapters/llamaindex_reader.js`:
- Implement DocumentReader interface
- Wrap LlamaIndex readers
- Normalize content (UTF-8, newlines, paths)
- Extract metadata using Unstructured
- Return CanonicalDocument

### Phase 6: Update RepositoryAuthority
Update `repository_authority.js`:
- Use GitHubAdapter for acquisition
- Use LlamaIndexReader for reading
- Produce CanonicalDocument
- Keep constitutional provenance tracking
- Maintain existing public interface

### Phase 7: Implement Pipeline Stages
Create `pipeline/normalize_stage.js`:
- UTF-8 conversion
- Newline normalization
- Path normalization
- Whitespace normalization

Create `pipeline/parse_stage.js`:
- Tree-sitter for code
- Markdown parser for markdown
- HTML parser for HTML
- JSON parser for JSON
- Return CanonicalAST

Create `pipeline/chunk_stage.js`:
- ChunkStrategy interface
- ASTChunkStrategy for code
- SemanticChunkStrategy for text
- HybridChunkStrategy for mixed
- Return CanonicalChunk[]

### Phase 8: Integration Test
Update `tests/ingest.test.js`:
- Test GitHubAdapter → LlamaIndexReader → CanonicalDocument
- Test Normalize → Parse → Chunk pipeline
- Verify full pipeline works
- Ensure no breaking changes

## Expected Outcomes

### Code Reduction
- Delete custom GitHub loaders (github_ingestion.js, github_adapter.js, github_snapshot.js)
- Delete custom document loaders (document_ingestion.js)
- Add 1 Canonical IR (3 files)
- Add 2 interfaces (RepositoryAdapter, DocumentReader)
- Add 2 adapters (GitHubAdapter, LlamaIndexReader)
- Add 3 pipeline stages (Normalize, Parse, Chunk)
- Net reduction: 2-3 files

### Architecture Improvement
- Clear separation of concerns (Acquire → Normalize → Parse → Chunk → Embed → Project)
- Single immutable document model
- Every ingestion path produces same IR
- Easy to add new ingestion sources

### Maintenance Reduction
- No more handwritten parsers, loaders, metadata extraction
- Leverage LlamaIndex and Unstructured
- Focus on constitutional logic only
- Easy to swap implementations

## Risk Assessment

### Risk Level: LOW
- Layered approach allows incremental migration
- Interfaces provide stable contracts
- Can start with GitHub and expand
- No breaking changes to public API

### Mitigation
- Keep custom loaders as fallback during migration
- Run integration tests before and after
- Monitor for edge cases
- Document migration process

## Success Criteria

1. Canonical Intermediate Representation defined (CanonicalDocument, CanonicalAST, CanonicalChunk)
2. RepositoryAdapter and DocumentReader interfaces defined
3. GitHubAdapter implements RepositoryAdapter
4. LlamaIndexReader implements DocumentReader
5. RepositoryAuthority produces CanonicalDocument
6. Pipeline stages (Normalize, Parse, Chunk) implemented
7. Integration test passes with new architecture
8. No breaking changes to public interfaces
9. Custom loaders deleted

## Timeline Estimate

- Phase 1: 1 hour (define Canonical IR)
- Phase 2: 30 minutes (define RepositoryAdapter interface)
- Phase 3: 30 minutes (define DocumentReader interface)
- Phase 4: 2 hours (implement GitHubAdapter)
- Phase 5: 2 hours (implement LlamaIndexReader)
- Phase 6: 1 hour (update RepositoryAuthority)
- Phase 7: 3 hours (implement pipeline stages)
- Phase 8: 1 hour (integration test)

**Total: ~11 hours**

## Next Steps

1. Define Canonical Intermediate Representation
2. Define RepositoryAdapter and DocumentReader interfaces
3. Implement GitHubAdapter
4. Implement LlamaIndexReader
5. Update RepositoryAuthority
6. Implement pipeline stages (Normalize, Parse, Chunk)
7. Run integration tests
8. Delete custom loaders
9. Document changes

## Why This Task First?

This task is the highest leverage because:
1. It establishes the foundational architecture for all document ingestion
2. Every future connector (GitHub, Filesystem, Zip, MCP, S3, Google Drive, OneDrive) becomes trivial
3. Eliminates handwritten parsers, loaders, and metadata extraction (solved problems)
4. Creates clear separation of concerns (Acquire → Normalize → Parse → Chunk → Embed → Project)
5. Provides single immutable document model (CanonicalDocument)
6. Enables the entire vertical pipeline (Repository → Knowledge → Embedding → Projection → Qdrant)
7. Has the lowest migration risk due to layered approach

After this task is complete, the next tasks would be:
- Implement additional RepositoryAdapters (Filesystem, Zip, MCP, S3)
- Implement ChunkStrategy pattern (ASTChunkStrategy, SemanticChunkStrategy, HybridChunkStrategy)
- Implement pass-based graph compilation (GraphCompiler → GraphPass)
- Consolidate worker queues (Queue Interface → TemporalAdapter/BullMQAdapter)
- Refine replay architecture (ReplayAuthority → ReplayPlanner → ReplayExecutor → Temporal)
