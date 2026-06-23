# Open WebUI Constitutional Integration

**Date:** 2026-06-22  
**Purpose:** Integrate constitutional context into Open WebUI chat flow  
**Constitutional Law:** TRUTH ≠ EMBEDDINGS

---

## INTEGRATION PATTERN

Every chat request in Open WebUI should receive `constitutional_context` assembled from:
- Qdrant retrieval (semantic search)
- Authority chain (constitutional verification)
- Lineage references (provenance tracking)

Before reaching Ollama.

---

## ARCHITECTURE

```
User Query (Open WebUI)
  ↓
Constitutional Context Assembly
  ↓
Query Embedding (Ollama)
  ↓
Qdrant Search (constitutional_memory)
  ↓
Authority Chain Resolution
  ↓
Lineage Reference Assembly
  ↓
constitutional_context
  ↓
User Query + constitutional_context
  ↓
Ollama Chat Completion
  ↓
Response with Citations
```

---

## IMPLEMENTATION

### Option 1: Open WebUI Function Calling

Open WebUI supports function calling through MCP tools. Configure Open WebUI to call `search_constitutional_memory` before each chat request.

**Configuration:**
```json
{
  "mcp_servers": [
    {
      "name": "ping_mcp",
      "url": "http://mcp-server:3000",
      "tools": [
        "search_constitutional_memory"
      ]
    }
  ],
  "chat_context": {
    "pre_query": [
      {
        "tool": "search_constitutional_memory",
        "params": {
          "query": "{{user_query}}",
          "top_k": 5
        },
        "inject_as": "constitutional_context"
      }
    ]
  }
}
```

### Option 2: Mission Control Middleware

Create a middleware endpoint in Mission Control that assembles constitutional context for Open WebUI.

**Endpoint:** POST /constitutional/context  
**Request:**
```json
{
  "query": "user query",
  "top_k": 5
}
```

**Response:**
```json
{
  "constitutional_context": {
    "snippets": [...],
    "citations": [...],
    "authority_chain": [...],
    "lineage": [...]
  }
}
```

**Open WebUI Configuration:**
```json
{
  "context_endpoint": "http://mission-control:8000/constitutional/context",
  "context_params": {
    "top_k": 5
  }
}
```

---

## CONSTITUTIONAL CONTEXT STRUCTURE

```json
{
  "constitutional_context": {
    "snippets": [
      {
        "content": "Replay is deterministic...",
        "score": 0.85,
        "source": "vault",
        "authority_level": "constitutional",
        "document_path": "vault/laws/REPLAY_LAW.md"
      }
    ],
    "citations": [
      {
        "source": "vault",
        "document_path": "vault/laws/REPLAY_LAW.md",
        "vault_hash": "48e610b7...",
        "authority_level": "constitutional"
      }
    ],
    "authority_chain": [
      {
        "document": "vault/laws/REPLAY_LAW.md",
        "authority_level": "constitutional",
        "vault_hash": "48e610b7..."
      }
    ],
    "lineage": [
      {
        "source_ids": ["vault/laws/REPLAY_LAW.md"],
        "parent_event_ids": [],
        "document_path": "vault/laws/REPLAY_LAW.md"
      }
    ]
  }
}
```

---

## OLLAMA PROMPT TEMPLATE

When constitutional context is available, inject it into the Ollama prompt:

```
System: You are PING, a constitutional social substrate. Answer questions using the provided constitutional context.

User Query: {{user_query}}

Constitutional Context:
{% for snippet in constitutional_context.snippets %}
- {{snippet.content}} (Source: {{snippet.document_path}}, Authority: {{snippet.authority_level}})
{% endfor %}

Citations:
{% for citation in constitutional_context.citations %}
- {{citation.document_path}} (Hash: {{citation.vault_hash}})
{% endfor %}

Answer the user query using the constitutional context above. Always cite your sources.
```

---

## CONSTITUTIONAL CONSTRAINTS

1. **Truth ≠ Embeddings**: Constitutional context is retrieved from Qdrant (projections), but truth is in PostgreSQL events and Vault documents.

2. **Authority Verification**: Only constitutional authority level documents are used for answering questions about constitutional law.

3. **Lineage Tracking**: All answers include lineage references to trace back to truth sources.

4. **Replay Determinism**: The same query should always produce the same constitutional context (deterministic retrieval).

---

## TESTING

### Test Query
```
"What have we ever documented about replay law?"
```

### Expected Response
- Snippets from REPLAY_LAW.md
- Citations to REPLAY_LAW.md
- Authority chain showing constitutional authority
- Lineage references to vault/laws/REPLAY_LAW.md

### Verification
- Response includes citations
- Response includes authority chain
- Response includes lineage references
- Citations match vault documents
- Authority level is constitutional

---

## DEPLOYMENT

### Step 1: Configure Open WebUI
Add MCP server configuration to Open WebUI settings.

### Step 2: Enable Pre-Query Context
Configure Open WebUI to call `search_constitutional_memory` before each chat request.

### Step 3: Configure Prompt Template
Add constitutional context injection to Ollama prompt template.

### Step 4: Test
Test with query "What have we ever documented about replay law?"

### Step 5: Verify
Verify that responses include citations, authority chain, and lineage references.

---

## CONCLUSION

Open WebUI integration ensures that every chat request receives constitutional context before reaching Ollama, preserving the constitutional law TRUTH ≠ EMBEDDINGS while enabling intelligent responses with full provenance tracking.
