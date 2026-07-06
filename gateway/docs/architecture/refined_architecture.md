# Refined Architecture

## Document Acquisition Layer

### Architecture
```
RepositoryAuthority
    ↓
RepositoryAdapter Interface
    ↓
GitHubAdapter
FilesystemAdapter
GitAdapter
ZipAdapter
MCPAdapter
S3Adapter
    ↓
DocumentReader Interface
    ↓
LlamaIndex Reader
Unstructured
MarkItDown
    ↓
Canonical Document
    ↓
Chunk Pipeline
```

### Key Principle
The constitutional layer never knows LlamaIndex exists. Tomorrow you can swap it.

### RepositoryAdapter Interface
```javascript
class RepositoryAdapter {
  async acquire(uri) {
    // Acquire document from source
  }
}
```

### DocumentReader Interface
```javascript
class DocumentReader {
  async read(rawContent) {
    // Read and normalize document
  }
}
```

### Canonical Document
```javascript
{
  id: string,
  uri: string,
  language: string,
  mime: string,
  source: string,
  metadata: object,
  content: string,
  provenance: object,
  hashes: object
}
```

---

## Pipeline Stages

### Separation of Concerns
Previously combined parsing, loading, and chunking. Now separated into distinct stages:

```
Acquire
    ↓
Normalize
    ↓
Parse
    ↓
Chunk
    ↓
Embed
    ↓
Project
```

### Stage 1: Acquire
**Purpose**: Fetch raw content from source
**Examples**: GitHub Reader, Filesystem Reader, S3 Reader
**Output**: Raw bytes/string

### Stage 2: Normalize
**Purpose**: Normalize content format
**Examples**:
- UTF-8 conversion
- Newline normalization (\r\n → \n)
- Path normalization
- Whitespace normalization
**Output**: Normalized string

### Stage 3: Parse
**Purpose**: Parse content into structured representation
**Examples**:
- Tree-sitter (code)
- Markdown parser (markdown)
- HTML parser (HTML)
- JSON parser (JSON)
**Output**: Parsed AST or structured data

### Stage 4: Chunk
**Purpose**: Split into semantic chunks
**Examples**:
- AST-based chunking (code)
- Semantic chunking (text)
- Hybrid chunking (mixed)
**Output**: CanonicalChunk[]

### Stage 5: Embed
**Purpose**: Generate vector embeddings
**Examples**: llama.cpp, OpenAI, vLLM
**Output**: vector[]

### Stage 6: Project
**Purpose**: Project into knowledge graph
**Examples**: Qdrant, knowledge graph
**Output**: knowledge graph nodes

---

## Chunking Strategy

### Strategy Pattern
Instead of deleting semantic chunking, demote it to a strategy:

```
ChunkStrategy
    ↓
ASTChunkStrategy
SemanticChunkStrategy
HybridChunkStrategy
```

### Strategy Selection
Choose based on file type:

**Python Files (.py)**
```
.py
    ↓
Tree-sitter (parse)
    ↓
ASTChunkStrategy (chunk by AST)
    ↓
semantic merge (merge small chunks)
    ↓
embedding
```

**Markdown Files (.md)**
```
.md
    ↓
Markdown parser (parse)
    ↓
SemanticChunkStrategy (chunk by headings)
    ↓
embedding
```

**Mixed Files**
```
.js
    ↓
Tree-sitter (parse)
    ↓
HybridChunkStrategy (AST + semantic)
    ↓
embedding
```

### ChunkStrategy Interface
```javascript
class ChunkStrategy {
  chunk(parsedContent, options) {
    // Return CanonicalChunk[]
  }
}
```

### ASTChunkStrategy
- Chunks by AST nodes (class, function, method)
- Preserves code structure
- Never splits inside function/class bodies

### SemanticChunkStrategy
- Chunks by semantic boundaries (paragraphs, headings)
- Preserves logical structure
- Good for text documents

### HybridChunkStrategy
- Combines AST and semantic chunking
- Uses AST for code, semantic for text
- Good for mixed content

---

## Graph Compilation

### Pass-based Architecture
Instead of one monolithic compiler, use pass-based architecture similar to LLVM:

```
GraphCompiler
    ↓
GraphPass
    ↓
ImportPass
CallPass
TypePass
BuildPass
ReferencePass
ControlFlowPass
```

### GraphCompiler
- Orchestrates passes
- Manages pass dependencies
- Provides pass context
- Collects results

### GraphPass Interface
```javascript
class GraphPass {
  name: string
  dependencies: string[]
  
  execute(graph, context) {
    // Transform graph
    return transformedGraph
  }
}
```

### ImportPass
- Extracts import statements
- Builds dependency graph
- Identifies external dependencies

### CallPass
- Extracts function calls
- Builds call graph
- Identifies call chains

### TypePass
- Extracts type information
- Builds type graph
- Identifies type relationships

### BuildPass
- Extracts build information
- Builds build graph
- Identifies build dependencies

### ReferencePass
- Extracts symbol references
- Builds reference graph
- Identifies symbol usage

### ControlFlowPass
- Extracts control flow
- Builds control flow graph
- Identifies branches and loops

### Benefits
- Each pass owns exactly one concern
- Easy to add new passes
- Easy to test individual passes
- Scales much better than monolithic compiler

---

## Worker Queues

### Architecture
```
Queue Interface
    ↓
TemporalAdapter
or
BullMQAdapter
    ↓
AuthorityScheduler
```

### Queue Interface
```javascript
class Queue {
  async enqueue(task) {
    // Enqueue task
  }
  
  async dequeue() {
    // Dequeue task
  }
  
  async acknowledge(taskId) {
    // Acknowledge task completion
  }
}
```

### TemporalAdapter
- Wraps Temporal workflows
- Handles durable execution
- Manages retries and timeouts

### BullMQAdapter
- Wraps BullMQ queue
- Handles Redis-based queuing
- Manages job priorities

### AuthorityScheduler
- Constitutional runtime schedules work
- Does not reinvent distributed queue semantics
- Delegates to Queue Interface

### Benefits
- Clear separation of concerns
- Easy to swap queue implementations
- Constitutional logic independent of queue choice

---

## Replay

### Architecture
```
ReplayAuthority
    ↓
ReplayPlanner
    ↓
ReplayExecutor
    ↓
Temporal
```

### Key Principle
Replay owns Temporal, not the other way around. This is an important inversion.

### ReplayAuthority
- Constitutional authority for replay
- Manages replay lifecycle
- Enforces replay policies

### ReplayPlanner
- Plans replay execution
- Determines replay strategy
- Identifies replay dependencies

### ReplayExecutor
- Executes replay plan
- Manages replay state
- Handles replay errors

### Temporal
- Orchestrates replay workflows
- Provides durable execution
- Manages retries and timeouts

### Benefits
- Replay logic remains constitutional
- Temporal provides orchestration only
- Easy to swap orchestration layer
- Clear ownership boundaries

---

## Adapter Rule (Stricter)

### Rule
The Constitutional Core must not import any package that performs I/O.

### Prohibited I/O
- HTTP requests
- Database operations
- Queue operations
- File system operations
- Socket operations
- SDK calls

### Allowed in Constitutional Core
- Pure algorithms
- Data transformations
- Business logic
- Constitutional rules

### Required in Adapter Layer
- All I/O operations
- External service calls
- File system access
- Network operations

### Verification
Core code should almost look like pure algorithms. If it performs I/O, it belongs in the adapter layer.

---

## Canonical Intermediate Representation (CIR)

### Purpose
Everything should converge to one immutable document model before any constitutional logic runs.

### Architecture
```
Repository
    ↓
Reader
    ↓
CanonicalDocument
{
  id
  uri
  language
  mime
  source
  metadata
  content
  provenance
  hashes
}
    ↓
Parser
    ↓
CanonicalAST
    ↓
Chunker
    ↓
CanonicalChunk
    ↓
Embedding
    ↓
Projection
```

### CanonicalDocument
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

### CanonicalAST
```javascript
{
  documentId: string,      // Reference to CanonicalDocument
  ast: object,             // Parsed AST
  language: string,        // Language
  parser: string,          // Parser used (tree-sitter, etc.)
  metadata: object         // AST metadata
}
```

### CanonicalChunk
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

### Benefits
- Single immutable document model
- Every ingestion path produces same IR
- Easy to add new ingestion sources
- Clear transformation pipeline
- Easy to debug and test

---

## Summary of Refinements

### Document Acquisition Layer
- Introduce layered approach above LlamaIndex/Unstructured
- Constitutional layer never knows specific readers exist
- Easy to swap implementations

### Pipeline Stages
- Separate Acquire → Normalize → Parse → Chunk → Embed → Project
- Clear boundaries between stages
- Each stage has single responsibility

### Chunking Strategy
- Keep semantic chunking as strategy
- ASTChunkStrategy, SemanticChunkStrategy, HybridChunkStrategy
- Choose based on file type

### Graph Compilation
- Pass-based architecture instead of monolithic compiler
- GraphCompiler orchestrates GraphPass instances
- ImportPass, CallPass, TypePass, BuildPass, ReferencePass, ControlFlowPass
- Similar to LLVM

### Worker Queues
- Queue Interface → TemporalAdapter/BullMQAdapter → AuthorityScheduler
- Constitutional runtime schedules work
- Does not reinvent distributed queue semantics

### Replay
- ReplayAuthority → ReplayPlanner → ReplayExecutor → Temporal
- Replay owns Temporal, not the other way around
- Important inversion of control

### Adapter Rule
- Stricter: no I/O in Constitutional Core
- Core code should look like pure algorithms
- All I/O in adapter layer

### Canonical Intermediate Representation
- CanonicalDocument, CanonicalAST, CanonicalChunk
- Every ingestion path produces same IR
- Single immutable document model
