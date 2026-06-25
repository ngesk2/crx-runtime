# Repository Runtime Specification

## Overview

The Repository Runtime defines the constitutional contract for repository ingestion, mirroring, and indexing in the PING Cognitive Operating System.

**Version:** v1
**Stability:** Stable
**Last Updated:** 2026-06-25

---

## Purpose

Convert repository ingestion from architectural concept into a constitutional runtime contract that ensures:
- Repositories are mirrored only (never modified)
- All indexing is reproducible from mirrored artifacts
- Repository runtime is read-only to consumers
- Ollama never crawls repositories directly
- Repository state is rebuildable from mirrors

---

## Repository Runtime Layout

### Directory Structure

```
C:\PING\repositories\
├── github\              # GitHub repository mirrors
├── drive\               # Google Drive mirrors
├── generated\           # Generated runtime artifacts
├── indexes\             # Repository indexes
├── manifests\           # Repository manifests
└── hashes\              # Content hashes
```

### Directory Responsibilities

| Directory | Purpose | Constitutional Property |
|-----------|---------|------------------------|
| `github/` | GitHub repository mirrors | Source of truth for GitHub repos |
| `drive/` | Google Drive mirrors | Source of truth for Drive repos |
| `generated/` | Generated runtime artifacts | Reproducible from mirrors |
| `indexes/` | Repository indexes | Reproducible from mirrors |
| `manifests/` | Repository manifests | Reproducible from mirrors |
| `hashes/` | Content hashes | Reproducible from mirrors |

---

## Constitutional Invariants

### Invariant 1: Repositories are Mirrored Only

**Statement:** Source repositories are never modified.

**Implementation:**
- Repository mirrors are read-only copies
- No write operations to mirrored repositories
- All modifications happen in generated artifacts
- Source repositories remain canonical

**Verification:**
- Mirrored directories have read-only permissions
- No code paths write to mirror directories
- All writes go to `generated/` directory

**Constitutional Test:**
```
1. Mirror a repository
2. Attempt to modify mirrored file
3. Result: Permission denied
```

---

### Invariant 2: All Indexing is Reproducible from Mirrors

**Statement:** Indexes can be regenerated from mirrored artifacts.

**Implementation:**
- Indexes are derived from mirrored content
- Index generation is deterministic
- Indexes can be deleted and regenerated
- Index metadata includes source hash

**Verification:**
- Delete all indexes
- Regenerate from mirrors
- Compare regenerated indexes with originals
- Result: Identical

**Constitutional Test:**
```
1. Generate indexes from mirrors
2. Record index hashes
3. Delete all indexes
4. Regenerate indexes from mirrors
5. Compare hashes
6. Result: Identical
```

---

### Invariant 3: Repository Runtime is Read-Only to Consumers

**Statement:** Consumers cannot modify repository runtime.

**Implementation:**
- Repository runtime is mounted read-only
- Consumer services have no write permissions
- All modifications happen through Repository Runtime service
- Direct filesystem access is restricted

**Verification:**
- Consumer services cannot write to repository directories
- All modifications go through Repository Runtime API
- Write attempts are logged and rejected

**Constitutional Test:**
```
1. Consumer service attempts write to repository
2. Result: Permission denied
```

---

### Invariant 4: Ollama Never Crawls Repositories Directly

**Statement:** Ollama receives assembled context from Mission Control.

**Implementation:**
- Ollama has no direct repository access
- Mission Control assembles context from indexes
- Ollama receives context via API
- No filesystem access to repositories

**Verification:**
- Ollama service has no repository directory mounts
- Ollama receives context via HTTP API
- No direct file reads from repositories

**Constitutional Test:**
```
1. Ollama attempts to read repository file
2. Result: File not found / permission denied
```

---

### Invariant 5: Repository State is Rebuildable from Mirrors

**Statement:** Complete repository state can be reconstructed from mirrors.

**Implementation:**
- All artifacts are derived from mirrors
- Generation process is deterministic
- State reconstruction is reproducible
- No external dependencies for reconstruction

**Verification:**
- Delete all generated artifacts
- Rebuild from mirrors
- Compare rebuilt state with original
- Result: Identical

**Constitutional Test:**
```
1. Record complete repository state hash
2. Delete all generated artifacts
3. Rebuild from mirrors
4. Generate state hash
5. Compare hashes
6. Result: Identical
```

---

## Repository Mirror

### GitHub Mirror

**Purpose:** Mirror GitHub repositories for local processing.

**Implementation:**
```python
def mirror_github_repository(repo_url: str, destination: str):
    """Mirror GitHub repository to local storage"""
    # Clone repository
    git clone --mirror {repo_url} {destination}
    
    # Set read-only permissions
    chmod -R a-w {destination}
    
    # Generate manifest
    generate_repository_manifest(destination)
```

**Location:** `C:\PING\repositories\github\{owner}/{repo}/`

**Properties:**
- Read-only after mirroring
- Contains complete repository history
- Includes all branches and tags
- Git metadata preserved

---

### Google Drive Mirror

**Purpose:** Mirror Google Drive files for local processing.

**Implementation:**
```python
def mirror_drive_file(file_id: str, destination: str):
    """Mirror Google Drive file to local storage"""
    # Download file
    download_drive_file(file_id, destination)
    
    # Set read-only permissions
    chmod a-w {destination}
    
    # Generate hash
    generate_file_hash(destination)
```

**Location:** `C:\PING\repositories\drive\{file_id}/`

**Properties:**
- Read-only after mirroring
- Content hash preserved
- Metadata preserved
- Version tracking

---

## Generated Runtime Artifacts

### Artifact Types

| Artifact Type | Location | Purpose | Reproducible |
|---------------|----------|---------|--------------|
| Code Indexes | `indexes/code/` | Symbol extraction | Yes |
| Relationship Graphs | `indexes/relationships/` | Code relationships | Yes |
| Embeddings | `indexes/embeddings/` | Vector representations | Yes |
| Manifests | `manifests/` | Repository metadata | Yes |
| Hashes | `hashes/` | Content integrity | Yes |

### Generation Process

```python
def generate_artifacts(mirror_path: str, output_path: str):
    """Generate all artifacts from repository mirror"""
    # Extract symbols
    symbols = extract_code_symbols(mirror_path)
    
    # Build relationships
    relationships = build_relationship_graph(symbols)
    
    # Generate embeddings
    embeddings = generate_embeddings(symbols)
    
    # Create manifest
    manifest = create_repository_manifest(mirror_path, symbols, relationships)
    
    # Store artifacts
    store_artifacts(output_path, symbols, relationships, embeddings, manifest)
```

---

## Repository Indexer

### Indexing Pipeline

```
Repository Mirror
    ↓
Symbol Extraction
    ↓
Relationship Building
    ↓
Embedding Generation
    ↓
Index Storage
    ↓
Qdrant Projection
```

### Symbol Extraction

**Purpose:** Extract code symbols from repository.

**Implementation:**
```python
def extract_code_symbols(repository_path: str) -> List[Symbol]:
    """Extract code symbols from repository"""
    symbols = []
    
    for file in walk_repository(repository_path):
        if is_code_file(file):
            file_symbols = parse_symbols(file)
            symbols.extend(file_symbols)
    
    return symbols
```

**Output:** `indexes/code/{repository}/symbols.json`

---

### Relationship Building

**Purpose:** Build code relationship graph.

**Implementation:**
```python
def build_relationship_graph(symbols: List[Symbol]) -> Graph:
    """Build relationship graph from symbols"""
    graph = Graph()
    
    for symbol in symbols:
        graph.add_node(symbol)
        
        # Find dependencies
        dependencies = find_dependencies(symbol, symbols)
        for dep in dependencies:
            graph.add_edge(symbol, dep)
    
    return graph
```

**Output:** `indexes/relationships/{repository}/graph.json`

---

### Embedding Generation

**Purpose:** Generate vector embeddings for symbols.

**Implementation:**
```python
def generate_embeddings(symbols: List[Symbol]) -> List[Embedding]:
    """Generate embeddings for symbols"""
    embeddings = []
    
    for symbol in symbols:
        text = symbol_to_text(symbol)
        embedding = ollama.embed(text)
        embeddings.append(embedding)
    
    return embeddings
```

**Output:** `indexes/embeddings/{repository}/embeddings.json`

---

## Repository Metadata Store

### Metadata Schema

```json
{
  "repository_id": "uuid",
  "repository_url": "https://github.com/owner/repo",
  "mirror_path": "C:\\PING\\repositories\\github\\owner\\repo",
  "mirror_hash": "sha256...",
  "mirror_timestamp": "2026-06-25T00:00:00Z",
  "index_hash": "sha256...",
  "index_timestamp": "2026-06-25T00:00:00Z",
  "artifact_count": 1000,
  "status": "indexed"
}
```

### Storage Location

**Database:** PostgreSQL `repository_metadata` table

**Fields:**
- `repository_id` (UUID) - Canonical identifier
- `repository_url` (TEXT) - Source URL
- `mirror_path` (TEXT) - Mirror location
- `mirror_hash` (TEXT) - Mirror content hash
- `mirror_timestamp` (TIMESTAMP) - Mirror timestamp
- `index_hash` (TEXT) - Index hash
- `index_timestamp` (TIMESTAMP) - Index timestamp
- `artifact_count` (INTEGER) - Number of artifacts
- `status` (TEXT) - Indexing status

---

## Repository Event Emission

### Event Types

| Event Type | Trigger | Purpose |
|------------|---------|---------|
| `REPOSITORY_MIRRORED` | Repository mirrored | Notify mirror completion |
| `REPOSITORY_INDEXED` | Repository indexed | Notify index completion |
| `SYMBOL_EXTRACTED` | Symbol extracted | Notify symbol extraction |
| `RELATIONSHIP_BUILT` | Relationship built | Notify relationship building |
| `EMBEDDING_GENERATED` | Embedding generated | Notify embedding generation |

### Event Schema

```json
{
  "event_id": "uuid",
  "event_type": "REPOSITORY_MIRRORED",
  "timestamp": "2026-06-25T00:00:00Z",
  "aggregate_id": "repository_uuid",
  "aggregate_type": "REPOSITORY",
  "event_data": {
    "repository_url": "https://github.com/owner/repo",
    "mirror_path": "C:\\PING\\repositories\\github\\owner\\repo",
    "mirror_hash": "sha256...",
    "artifact_count": 1000
  }
}
```

---

## Repository Runtime Service

### Service Contract

**Service Name:** Repository Runtime
**Port:** 8085
**URL:** `http://repo_runtime:8085`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mirror` | POST | Mirror a repository |
| `/index` | POST | Index a repository |
| `/query` | GET | Query repository index |
| `/status` | GET | Get repository status |
| `/rebuild` | POST | Rebuild from mirrors |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REPOSITORY_RUNTIME_URL` | http://repo_runtime:8085 | Repository runtime URL |
| `REPOSITORY_ROOT` | C:\PING\repositories | Repository root directory |
| `REPOSITORY_SYMBOL_COLLECTION` | repository_symbols | Symbol collection name |
| `REPOSITORY_RELATIONSHIP_COLLECTION` | repository_relationships | Relationship collection name |
| `REPOSITORY_INCREMENTAL_INDEX` | true | Enable incremental indexing |
| `REPOSITORY_MAX_FILE_MB` | 20 | Maximum file size (MB) |
| `REPOSITORY_GRAPH_DEPTH` | 12 | Repository graph depth |

---

## Constitutional Tests

### Test 1: Mirror Read-Only

**Steps:**
1. Mirror a repository
2. Attempt to modify mirrored file
3. Verify modification fails

**Expected Result:** Permission denied

---

### Test 2: Index Reproducibility

**Steps:**
1. Generate indexes from mirrors
2. Record index hashes
3. Delete all indexes
4. Regenerate indexes from mirrors
5. Compare hashes

**Expected Result:** Hashes are identical

---

### Test 3: Read-Only Consumers

**Steps:**
1. Consumer service attempts write to repository
2. Verify write fails

**Expected Result:** Permission denied

---

### Test 4: Ollama No Direct Access

**Steps:**
1. Ollama attempts to read repository file
2. Verify read fails

**Expected Result:** File not found / permission denied

---

### Test 5: State Rebuildability

**Steps:**
1. Record complete repository state hash
2. Delete all generated artifacts
3. Rebuild from mirrors
4. Generate state hash
5. Compare hashes

**Expected Result:** Hashes are identical

---

## Security Considerations

### GitHub App Authentication

**Private Key Location:** `C:\PING\secrets\github\github_app_private_key.pem`

**Environment Variable:** `GITHUB_APP_PRIVATE_KEY_PATH`

**Permissions:**
- File owner: read-only
- Group: no permissions
- Others: no permissions

**Usage:**
```python
import os
from cryptography.hazmat.primitives import serialization

private_key_path = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")

with open(private_key_path, "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None
    )
```

### Secret Hygiene

**Rules:**
1. No secrets in version control
2. No secrets in environment files
3. No secrets in code
4. Secrets in canonical locations only
5. Secrets referenced via environment variables

**Canonical Secret Locations:**
- GitHub keys: `C:\PING\secrets\github\`
- Database credentials: `C:\PING\secrets\database\`
- API keys: `C:\PING\secrets\api\`

---

## Performance Considerations

### Incremental Indexing

**Purpose:** Only index changed files.

**Implementation:**
```python
def incremental_index(repository_path: str, previous_hash: str):
    """Index only changed files"""
    current_hash = compute_repository_hash(repository_path)
    
    if current_hash == previous_hash:
        return  # No changes
    
    changed_files = find_changed_files(repository_path, previous_hash)
    
    for file in changed_files:
        index_file(file)
```

### Parallel Processing

**Purpose:** Index multiple files simultaneously.

**Implementation:**
```python
from concurrent.futures import ThreadPoolExecutor

def parallel_index(files: List[str]):
    """Index files in parallel"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(index_file, files)
```

---

## Monitoring and Observability

### Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `repository_mirror_duration` | Time to mirror repository | < 5 minutes |
| `repository_index_duration` | Time to index repository | < 10 minutes |
| `repository_artifact_count` | Number of artifacts | < 1,000,000 |
| `repository_storage_size` | Storage used | < 100 GB |

### Logging

**Log Levels:**
- INFO: Repository mirroring, indexing completion
- WARN: Large files, slow operations
- ERROR: Mirror failures, index failures

**Log Format:**
```json
{
  "timestamp": "2026-06-25T00:00:00Z",
  "level": "INFO",
  "service": "repository_runtime",
  "message": "Repository mirrored",
  "repository_url": "https://github.com/owner/repo",
  "duration_seconds": 120
}
```

---

## Migration Path

### From Existing Setup

1. Move existing repositories to `C:\PING\repositories\`
2. Regenerate indexes from mirrors
3. Update service configurations
4. Update environment variables
5. Verify constitutional tests pass

### From No Setup

1. Create repository directory structure
2. Configure GitHub App authentication
3. Set up Repository Runtime service
4. Mirror initial repositories
5. Generate indexes
6. Verify constitutional tests pass

---

## Status

**FROZEN** - This specification is constitutional and cannot be changed without breaking repository runtime guarantees.

**Date:** 2026-06-25
**Version:** 1.0
**Implementation Status:** In Progress
