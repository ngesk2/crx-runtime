# Ollama Context Architecture Audit

**Date:** 2026-06-25  
**Method:** Static code analysis, call chain tracing, prompt text extraction  
**Rule:** Read only. No changes.

---

## Executive Summary

BrainOS has a **context architecture gap** — not an accumulation problem. The gateway passes user messages verbatim to Ollama with zero context injection. The reasoning pipeline injects structured evidence (ContextPack JSON) with token-agnostic dumping. However, ~300+ constitutional `.md` files exist on disk but are never loaded into prompts. The architecture has 4 independent prompt builders with no shared context management, no truncation logic, and no duplicate detection.

---

## 1. Complete Request Flow: User → Ollama

### 1A. Gateway Path (crx-gateway, the only path currently running)

```
User/UI → POST /api/v1/chat { messages: [...] }
  → gateway/server.js:200  (POST handler)
    → routeMessage(messages)  (shadow router — not used for model selection)
    → invokeInference(messages, ROUTER_MODEL_14B)
      → emitInferenceRequest() → Postgres (audit trail)
      → getInferenceAdapter().chat(messages)
        → inference_adapter.js (singleton, delegates to OllamaProviderAdapter)
          → ollama_provider_adapter.js
            → POST {base_url}/api/chat { model, messages }
              → OLLAMA (qwen2.5-coder:14b / qwen2.5-coder:7b)
      → emitInferenceResponse() / emitInferenceFailed() → Postgres
```

**Key finding: Gateway adds NO context whatsoever.** The `messages` array from the user passes through to Ollama unchanged. No system prompt, no constitutional document, no database result is injected. The only transformation is model selection.

### 1B. Reasoning Pipeline Path (in Mission Control — NOT currently running, but code exists)

```
User → POST /reasoning/query { question }
  → app.py:1558  reasoning_query()
    → ReasoningGateway.reason(question)
      → Supervisor.reason(question)
        → Supervisor.plan() → ReasoningPlan (7 steps)
        → Supervisor.execute_plan()
          │
          ├── SearchWorker → authority_search.py (subprocess)
          │     ├── Postgres: authority_objects table
          │     ├── JSON fallback: tools/authority_index.json
          │     └── Qdrant fallback: calls Ollama /api/embeddings directly
          │       → returns {authority_class, verification, lineage}
          │
          ├── SearchWorker → lineage_search.py (subprocess)
          │     └── Postgres: events, artifact_registry, authority_lineage
          │
          ├── SearchWorker → graph_expand.py (subprocess)
          │     └── Postgres: artifact_relationships / JSON fallback
          │
          ├── ContradictionWorker → contradiction_search.py
          │     └── Postgres: events stance heuristics
          │
          ├── ArchitectureWorker → repository_symbols.py + repository_relationships.py
          │     └── Filesystem: Python/TS AST parsing
          │
          └── MemoryWorker → ContextPackBuilder.build_from_findings()
                └── Assembles all worker outputs into ContextPack
        │
        └── Supervisor.synthesize_answer(plan, pack)
              ├── Builds system prompt
              ├── Dumps ContextPack to JSON (full serialization)
              ├── Calls adapter.chat(messages=[system, user])
              └── OLLAMA (qwen2.5-coder:14b)

```

**Key finding: The reasoning pipeline injects EVERYTHING into a single prompt.** The entire ContextPack (authority chain, lineage, supporting docs, contradictions, repository symbols, graph expansion, witness roots) is serialized to JSON and dumped into the user message with no size limit, no truncation, no selection.

---

## 2. All Ollama Call Sites

### Chat Completions (text generation)

| # | File | Line | Function | Model | Context Injected |
|---|---|---|---|---|---|
| 1 | `runtime/cognitive/supervisor.py` | 217 | `synthesize_answer()` | 14B | System prompt + full ContextPack JSON |
| 2 | `brainos/newsletter/summarizer.py` | 45 | `analyze_newsletter()` | 7B | None (hardcoded prompt + newsletter body) |
| 3 | `brainos/rss/summarizer.py` | 34 | `summarize_article()` | 7B | None (hardcoded prompt + article text) |
| 4 | `brainos/orchestration/src/web_retrieval.py` | 183 | `summarize()` | 7B | None (hardcoded prompt + fetched content) |
| 5 | `gateway/server.js` | 210 | `invokeInference()` | 14B/7B | **None** — passes messages verbatim |

### Embeddings (vector generation)

| # | File | Line | Function | Via Adapter? |
|---|---|---|---|---|
| 1 | `runtime/adapters/ollama_provider_adapter.py` | 31 | `embed()` | YES |
| 2 | `brainos/orchestration/src/constitutional_retrieval.py` | 65 | embed for projection | YES |
| 3 | `brainos/orchestration/src/constitutional_search.py` | 79 | embed for search | YES |
| 4 | `brainos/orchestration/src/mission_control/app.py` | 407 | embed memory query | YES |
| 5 | `brainos/orchestration/src/mission_control/app.py` | 864 | embed constitutional query | YES |
| 6 | `brainos/orchestration/src/mission_control/app.py` | 1095 | embed constitution search | YES |
| 7 | `runtime/projection_worker/constitutional_projection_worker.py` | 148 | embed vault chunks | YES |
| 8 | **`runtime/tools/authority_search.py`** | **228** | **try_qdrant_fallback()** | **NO — direct `requests.post()`** |
| 9 | **`brainos/orchestration/src/projection_worker.py`** | **72** | **generate_embedding()** | **NO — direct `requests.post()`** |

---

## 3. Static Context Sources

### 3A. Files on Disk (Never Injected)

~300+ `.md` files exist across the repository that are **never loaded into any prompt**:

| Location | File Count | Total Size | Injected? |
|---|---|---|---|
| `constitution/` | 19 | ~175 KB | **NO** (metadata only via ContextPack) |
| `vault/constitutional/immutable/` | 4 | ~39 KB | **NO** |
| `vault/laws/` | 3 | ~30 KB | **NO** |
| `vault/constitution/` | 1 | ~9 KB | **NO** |
| `brainos/orchestration/docs/architecture/` | 6 | ~50 KB | **NO** |
| `knowledge/authoritative/` | ~20 | ~200 KB | **NO** |
| `AGENTS.md` | 1 | varies | **NO** (used by AI agent, not by BrainOS) |

Constitutional documents appear in prompts **only as metadata** (title, class, verification status, hash) via the ContextPack `highest_authority` field. The actual document text is never included.

### 3B. Files Injected Into Prompts

| Source | Injection Mechanism | Content |
|---|---|---|
| Postgres `events` table | → ContextPackBuilder → JSON in supervisor prompt | Event payloads (timestamps, types, hashes) |
| Postgres `authority_objects` table | → authority_search.py → ContextPack → supervisor prompt | Authority class, title, description, hash |
| Postgres `authority_lineage` table | → lineage_search.py → ContextPack → supervisor prompt | Lineage chain entries |
| Postgres `artifact_registry` table | → lineage_search.py → ContextPack → supervisor prompt | Artifact metadata |
| Qdrant `constitutional_documents` | → authority_search.py fallback → ContextPack | Vector search results (payload hashes, not content) |
| Filesystem AST (Python/TS files) | → repository_symbols.py → ContextPack | Parsed symbols and relationships |
| JSON files (`tools/authority_index.json`, etc.) | → authority_search.py fallback | Authority metadata |

### 3C. System Prompts (Hardcoded in Code)

4 total, embedded in Python source:

| # | Location | Text | Length (chars) |
|---|---|---|---|
| 1 | `supervisor.py:200` | `"You are a constitutional reasoning supervisor. You NEVER perform retrieval. You ONLY synthesize from provided evidence..."` | ~200 |
| 2 | `rss/summarizer.py:20` | `"You are a content summarization assistant. Please analyze the following article and provide..."` | ~350 |
| 3 | `newsletter/summarizer.py:25` | `"You are a newsletter analysis assistant. Please analyze the following newsletter and provide..."` | ~450 |
| 4 | `web_retrieval.py:170` | `"Summarize the following content in X characters or less..."` | ~100 |

No system prompt configuration file exists. No way to update system prompts without code changes.

---

## 4. Dynamic Context Sources

### 4A. Postgres (queried by subprocess tools)

| Table | Query Location | Purpose | Injected? |
|---|---|---|---|
| `events` | `lineage_search.py`, `contradiction_search.py` | Event history, stance detection | Yes — via ContextPack |
| `authority_objects` | `authority_search.py` | Authority classification | Yes — via ContextPack |
| `authority_lineage` | `lineage_search.py` | Lineage chain | Yes — via ContextPack |
| `artifact_registry` | `lineage_search.py` | Artifact verification | Yes — via ContextPack |

### 4B. Qdrant (queried for vector search)

| Collection | Query Location | Purpose | Injected? |
|---|---|---|---|
| `constitutional_documents` | `authority_search.py` fallback | Vector search for authority | Yes — payload metadata only |
| `constitutional_memory` | Never queried (0 points) | Memory retrieval | No |

**Key finding: Qdrant is queried only as a fallback** when Postgres queries fail. The primary authority source is Postgres. Qdrant search results contain only payload metadata (hashes, IDs) — not document content.

### 4C. Drive / Google Drive

**Not used.** No Drive data is queried for prompts. Drive Mirror OAuth exists but has never executed a sync.

### 4D. Filesystem

| Source | Query Location | Purpose | Injected? |
|---|---|---|---|
| Python/TS source files | `repository_symbols.py`, `repository_relationships.py` | AST parsing for code symbols | Yes — via ContextPack |
| JSON authority index files | `authority_search.py` fallback | Authority metadata | Yes — via ContextPack |

---

## 5. Context Assembly Path — Detailed Per Endpoint

### 5A. `POST /api/v1/chat` (Gateway, RUNNING)

```
Context assembled: NONE
Messages from user → Ollama verbatim
System prompt: NONE
```

### 5B. `POST /reasoning/query` (Mission Control, STOPPED)

```
Context assembled via ContextPackBuilder:

ContextPack {
  question: string
  highest_authority: {
    artifact_id, authority_class (CONSTITUTIONAL_LAW/CANONICAL_SPEC/etc.),
    title, description, sha256, source_system, status, lineage_depth,
    witness_count, verification: { artifact_hash, event_hash, lineage,
    witness, projection, truth }
  }
  authority_chain: [ { authority_class, title, depth } ]  // up to 10
  lineage: [ { event_id, event_type, timestamp, aggregate_type } ]
  supporting_documents: [ { id, content_hash, payload_hash } ]
  contradictions: [ { claim_a, claim_b, stance_a, stance_b, severity } ]
  citations: [ { citation_id, text, authority_class } ]
  witness_roots: [ { root_id, hash, timestamp } ]
  graph_expansion: { nodes, edges }
  repository_symbols: [ { name, type, file, dependencies } ]
  repository_relationships: [ { source, target, type } ]
  authority_resolution: {
    highest_authority, authority_class, authority_chain,
    supersession_chain, verification: { 6 booleans + overall }
  }
}

→ JSON-serialized (json.dumps(pack.to_dict(), indent=2, default=str))
→ Concatenated into user message after "Context Pack:\n"
→ Sent to Ollama 14B with system prompt
```

**This is the only endpoint that injects context into an LLM call.**

### 5C. Newsletter/RSS/Web summarizers (Undeployed)

```
Context assembled: Document text only
prompt = f"You are a {role}...\n\n{title}\n{content[:truncation]}"
→ Sent to Ollama 7B
→ No constitutional docs, no Postgres data, no Qdrant search
```

---

## 6. Token Accounting

### 6A. Current State

| Metric | Value | Source |
|---|---|---|
| **Average prompt size** | Unknown — never measured | No logging of token counts |
| **Maximum prompt size** | Unknown — no limit enforced | No truncation in supervisor.py |
| **Truncation points** | 4K chars (RSS), 5K chars (web retrieval), 8K chars (newsletter) | Hardcoded string slices |
| **Context window** (qwen2.5-coder:7b) | 32,768 tokens | Model spec |
| **Context window** (qwen2.5-coder:14b) | 32,768 tokens | Model spec |
| **Training data cutoff** | Unknown | Not configured |

### 6B. Truncation Analysis

| Code Location | Truncation? | Method | Limit |
|---|---|---|---|
| `supervisor.py` | **NO TRUNCATION** | Full ContextPack JSON dump | Unlimited |
| `rss/summarizer.py:32` | String slice | `content[:4000]` | 4,000 chars |
| `web_retrieval.py:173` | String slice | `content[:5000]` | 5,000 chars |
| `newsletter/summarizer.py:43` | String slice | `body_truncated` | 8,000 chars |
| `gateway/server.js` | N/A (pass-through) | None | Unlimited (user-provided) |

**Critical gap: The supervisor synthesis prompt has NO size limit.** The ContextPack can grow unbounded as more data accumulates in Postgres/Qdrant. With ~50 rows currently, the JSON dump is small. At 1,000+ rows, it could exceed the 32K token context window.

### 6C. Estimated Current Prompt Size (reasoning pipeline)

| Component | Approx Tokens |
|---|---|
| System prompt | ~30 |
| Question text | ~20-100 |
| ContextPack JSON (current: ~49 rows across 4 tables) | ~2,000-5,000 |
| **Total estimated** | **~2,050-5,130 tokens** (within 32K window) |

### 6D. Token Accounting Infrastructure

| Capability | Status |
|---|---|
| Token counting before sending | **NOT IMPLEMENTED** |
| Context window size awareness | **NOT IMPLEMENTED** |
| Dynamic truncation | **NOT IMPLEMENTED** |
| Token usage logging | **NOT IMPLEMENTED** |
| Max prompt size configuration | **NOT IMPLEMENTED** |

---

## 7. Retrieval Effectiveness

### 7A. What Percentage of Retrieved Context Is Actually Used?

**Unknown — zero measurement exists.** There is no:
- Relevance scoring on retrieved documents
- Context utilization tracking
- Post-hoc analysis of which ContextPack fields influence the output

### 7B. Known Inefficiencies

| Issue | Evidence |
|---|---|
| **All-or-nothing context** | ContextPack dumps ALL fields into every prompt regardless of whether the question needs them |
| **Repository symbols injected for non-code questions** | `repository_symbols` and `repository_relationships` are always included even for questions like "what is the meaning of life?" |
| **Authority chain always included** | Full authority chain (up to 10 entries) + verification booleans (6 per entry) always included |
| **Contradictions always included** | Even when zero contradictions exist, empty array is serialized |
| **Static JSON files as fallback** | `authority_index.json` etc. are always loaded even when Postgres succeeds |
| **Worker results merged unconditionally** | Every worker's output is packed into ContextPack even if it returned empty results |

### 7C. Retrieval Methods

| Method | Where | Effectiveness |
|---|---|---|
| Keyword matching | `constitutional_integration.py` `is_constitutional_question()` | Simple string match — no semantic understanding |
| Vector similarity (Qdrant) | `authority_search.py` fallback | Only used as Postgres fallback |
| SQL queries | `authority_search.py`, `lineage_search.py`, etc. | Exact match — retrieves everything matching criteria |
| AST parsing | `repository_symbols.py` | Parses all files matching patterns — no relevance filtering |

---

## 8. Duplicate Context Analysis

### 8A. Repeated Constitutional Files

| File 1 | File 2 | Content Duplicate? |
|---|---|---|
| `constitution/replay_law.md` | `vault/laws/REPLAY_LAW.md` | **PARTIAL OVERLAP** — same subject, different rules |
| `constitution/witness_law.md` | `vault/laws/WITNESS_LAW.md` | **DIVERGENT** — same subject, different content |
| `constitution/source_of_truth_law.md` | `constitution/TRUTH_LAW.md` | **OVERLAPPING JURISDICTION** — both define truth |
| `vault/constitutional/immutable/IDENTITY_LAW.md` | `vault/laws/IDENTITY_LAW.md` | **IDENTICAL** — exact copy |
| `vault/constitutional/immutable/REPLAY_LAW.md` | `vault/laws/REPLAY_LAW.md` | **PARTIAL OVERLAP** |
| `vault/constitutional/immutable/WITNESS_LAW.md` | `vault/laws/WITNESS_LAW.md` | **DIVERGENT** |

### 8B. Repeated Instructions

| Issue | Location | Impact |
|---|---|---|
| `OLLAMA_BASE_URL` vs `INFERENCE_BASE_URL` | Both used in different files | Same value, different env var names pointing to same Ollama instance |
| `OLLAMA_URL` (gateway) vs `OLLAMA_BASE_URL` (container env) | JS vs Python adapters | Different env var name for same thing |
| Model registry duplicated | `model_capabilities.json` vs `gateway/server.js` | JS gateway has hardcoded model list, Python has JSON registry |
| 2 embedding call implementations | Adapter path vs direct `requests.post` | Same endpoint, different callers |
| 2 constitutional retrieval implementations | `constitutional_retrieval.py` vs `app.py` inline | Different code paths, same Qdrant collections |
| 2 projection worker implementations | `projection_worker.py` (root) vs `projection_worker/projection_worker.py` (brainos) | Different code, same purpose |

### 8C. Repeated Memory Injections

| Issue | Evidence |
|---|---|
| Same events in Postgres and Qdrant | Events are stored in Postgres AND projected to Qdrant. Authority search queries Postgres first, Qdrant as fallback. **No deduplication during retrieval** — if both succeed, both sets of results enter the ContextPack |
| Constitutional docs in both collections | `constitutional_documents` (5 points) and `constitutional_memory` (0 points) target same documents. Only `constitutional_documents` has data |
| JSON fallback duplicates | `authority_search.py` loads `tools/authority_index.json` AND queries Postgres. If Postgres has the same data, it enters twice |
| Agent memory duplication | `AGENTS.md` is read by the AI agent, not by BrainOS code — but it contains constitutional summaries that overlap with `constitution/*.md` |

---

## 9. Authority Violations in Context

From the Session 7 audit, two call sites bypass the InferenceAdapter:

| File | Line | What It Does | Why Violation |
|---|---|---|---|
| `runtime/tools/authority_search.py` | 226-231 | `try_qdrant_fallback()` calls `requests.post()` to `ollama_base/api/embeddings` | CRITICAL — bypasses adapter, hardcoded URL |
| `brainos/orchestration/src/projection_worker.py` | 70-76 | `generate_embedding()` calls `requests.post()` to `EMBED_URL/api/embeddings` | HIGH — bypasses adapter, uses different env var |

---

## 10. The Context Architecture Gap

### What Exists (Makeshift)

| Component | Status |
|---|---|
| Per-endpoint prompt builders | 4 independent implementations, no shared abstraction |
| ContextPack data structure | Structured but no size management |
| System prompts | Hardcoded in Python source, no config file |
| Constitutional context | Only metadata injected (title, class, hash) — not document content |
| Token limits | No monitoring, no enforcement |

### What Is Missing (Standard Context Architecture)

| Component | Status |
|---|---|
| Centralized context manager | **MISSING** — no single service owns context assembly |
| Prompt template system | **MISSING** — no template files, no variable substitution |
| Context window budget | **MISSING** — no token counting before sending |
| Dynamic truncation/selection | **MISSING** — supervisor dumps everything |
| Relevance filtering | **MISSING** — all retrieved data is included |
| Duplicate detection | **MISSING** — same data can enter via Postgres + JSON fallback |
| Context versioning | **MISSING** — no prompt version tracking |
| Token usage monitoring | **MISSING** — no metric on how many tokens per prompt |
| Context caching | **MISSING** — every request rebuilds context from scratch |

---

## 11. Conclusions

### Is it a context architecture or a context accumulation problem?

**It is a context architecture gap — with early signs of accumulation.**

- **Architecture gap:** The gateway adds zero context despite being the primary user-facing endpoint. The reasoning pipeline has a structured but unconstrained context builder (ContextPack) that dumps everything into a single JSON blob with no size awareness. The 4 summarization prompt builders are ad-hoc with inconsistent truncation limits.

- **Accumulation signs:** 2 duplicate embedding call implementations (adapter + direct), 2 duplicate constitutional retrieval implementations, 2 duplicate projection worker implementations, JSON fallbacks that can duplicate Postgres data in the same ContextPack, and ~300 constitutional `.md` files on disk that are never loaded into prompts (dead context weight).

The architecture currently functions because the dataset is tiny (~50 rows, 5 constitutional docs). It will not survive a 10× data increase without either:
1. Context window overflow (supervisor prompt exceeds 32K tokens)
2. Irrelevant context diluting answer quality (repository symbols in every prompt)
3. Duplicate entries from Postgres + JSON fallback + Qdrant all loading into the same ContextPack

### Key Metrics

| Metric | Value |
|---|---|
| Distinct prompt builders | 4 (gateway, supervisor, newsletter, RSS, web — 5 actually) |
| System prompts | 4 hardcoded in source files |
| Context sources actively injected | Postgres (4 tables), Qdrant (1 collection, metadata only), filesystem (AST), JSON files (fallback) |
| Context sources available but not injected | All 300+ `.md` files, Drive, Qdrant `constitutional_memory` |
| Token counting | **NOT IMPLEMENTED** anywhere |
| Truncation enforcement | Only in summarizers (4K-8K char slices) |
| Supervisor truncation | **NONE** — full ContextPack JSON dump |
| Duplicate context paths | Postgres + JSON fallback (same authority data), 2 embedding APIs |
| Direct Ollama calls (bypassing adapter) | 2 violations (`authority_search.py:228`, `projection_worker.py:72`) |
