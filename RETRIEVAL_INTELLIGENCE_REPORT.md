# Constitutional Retrieval Intelligence Report

**Date**: 2026-07-29
**Scope**: 20+ retrieval systems studied, ~40 pages of research synthesized
**Constraint**: Everything plugs into existing PING authorities. No new runtime, no new replay, no new event system.

---

## Executive Summary

PING has a world-class event pipeline and authority system but zero retrieval intelligence. The gap between where PING is today (events → knowledge graph → recommendations) and where it needs to be (events → observations → knowledge authority → retrieval planner → hybrid retrieval → evidence ranking → reasoning → recommendations) is bridgeable using existing components and the strategies harvested in this report.

**Key insight across all 20+ systems studied**: The single highest-leverage improvement for PING is not a new database or a new model. It is **Evidence Accumulation** — the ability to iteratively retrieve, assess sufficiency, identify gaps, refine queries, and accumulate until confidence thresholds are met. FalkorDB's MultiPathRetrieval, MS GraphRAG's DRIFT search, and FAIR-RAG's Structured Evidence Assessment all converge on this pattern.

---

## Part 1: System-by-System Findings

### 1.1 HyperRAG / HyperGraphRAG / HyperTreeRAG

| Dimension | Finding |
|-----------|---------|
| **Ranking** | Bi-directional DDE encoding — query-to-document and document-to-query relevance. Not just "find similar" but "find what the query needs." |
| **Graph+Vector merge** | Structure-aware retrieval: entities as nodes, relationships capture document structure. HyperTreeRAG uses tree-structured query decomposition. |
| **Query expansion** | Multi-level: decompose query into sub-queries at different granularities, retrieve per sub-query, fuse results. |
| **Confidence** | Plausibility scoring per retrieved passage — not just similarity but "does this make sense given the query?" |
| **Missing context** | Bi-directional expansion: if initial retrieval is insufficient, expand outward from retrieved entities along graph edges. |
| **Evolving knowledge** | Not addressed — static index at research time. |

**Strategy harvested**: Density-aware adaptive thresholding — adjust similarity threshold based on local embedding density. Sparse regions need lower thresholds.

### 1.2 Microsoft GraphRAG

| Dimension | Finding |
|-----------|---------|
| **Graph usefulness** | Leiden algorithm → hierarchical communities (Level 0 entities → Level 1 local → Level 2 regional → Level 3 global). Pre-computed community summaries at each level. |
| **Evidence movement** | Documents → chunks → LLM extracts (entities, relationships, claims) → graph nodes/edges → community detection → summaries. Query: embed → identify communities → retrieve subgraph + summaries. |
| **Observations→facts** | LLM extraction during indexing. **No verification stage** — extraction quality determines everything. No confidence scoring. |
| **Confidence evolution** | **None.** Extraction is binary. No mechanism for confidence evolution. |
| **Key insight** | Community summaries compress thousands of chunks into hierarchical text. Pre-computation shifts cost from query time to index time. |

**Strategy harvested**: Hierarchical query routing — classify query as local (entity-specific), global (thematic), or hybrid. Each uses different abstraction level.

### 1.3 LightRAG

| Dimension | Finding |
|-----------|---------|
| **Graph usefulness** | Dual-level: low-level keywords (specific entities) + high-level keywords (broad themes). LLM extracts both from query. |
| **Caching** | Most sophisticated: LLM response cache per mode (default/naive/local/global/hybrid/mix), entity extraction cache, embedding cache with similarity threshold (0.95), selective clearable per mode. |
| **Compression** | Token caps: MAX_ENTITY_TOKENS, MAX_RELATION_TOKENS, MAX_TOTAL_TOKENS. COSINE_THRESHOLD (0.2) discards low-similarity results. |
| **Discard** | CHUNK_P_DROP_REFERENCES drops trailing reference sections. Deletion reconstruction: deleted document triggers rebuild of affected entities/relationships from remaining docs. |
| **Incremental merge** | New documents merge into existing graph via set merging — no global rebuild. Deletion preserves shared entities. |

**Strategy harvested**: Dual-level keyword extraction → graph traversal at both levels → augment with vector similarity over raw chunks. Graph provides structure, vectors provide semantic breadth.

### 1.4 FalkorDB

| Dimension | Finding |
|-----------|---------|
| **Pipeline** | 9-stage ingestion: Loader → Chunker → Lexical Graph → Extraction (GLiNER NER + LLM verify) → Quality Filter → Schema Prune → Entity Resolution → Graph Write → Mentions + Chunk Indexing |
| **MultiPathRetrieval** | 4 parallel retrieval paths: (1) RELATES edge vector, (2) 2-path entity discovery (substring + fulltext), (3) 2-hop relationship expansion, (4) 4-path chunk retrieval (fulltext + vector + MENTIONED_IN + 2-hop). All fused by cosine score. |
| **Quality gates** | Quality Filter (removes NULL IDs, orphans), Schema Prune (keeps schema-matching), Entity Resolution (ExactMatch or DescriptionMerge — concatenates descriptions from multiple docs). |
| **Ranking** | #1 on GraphRAG-Bench Novel (63.73 ACC). Cosine reranking across all 4 paths. |

**Strategy harvested**: Don't commit to one retrieval path — run ALL paths in parallel, fuse by score, rerank. Parameters: chunk_top_k=15, max_entities=30, max_relationships=20, rel_top_k=15, keyword_limit=10.

### 1.5 Memgraph

| Dimension | Finding |
|-----------|---------|
| **Atomic pipeline** | Entire retrieval (pivot search → graph expansion → ranking → prompt assembly) executes as single Cypher query. Database IS the execution layer. |
| **Strategies** | Three atomic types per query: Text2Cypher (analytical), Local Graph Search (entity expansion), Query-Focused Summarization (community-level). LLM calls via `llm.complete()` from within Cypher. |
| **Streaming** | Real-time ingestion (Kafka, Redpanda, Pulsar). TTL supports automatic expiry. |

**Strategy harvested**: Express search, expansion, ranking, and prompt assembly as a single atomic operation. Swap ranking functions or traversal strategies without modifying surrounding code.

### 1.6 RAGFlow

| Dimension | Finding |
|-----------|---------|
| **Pipeline** | Visual ETL: Parser (23+ formats via factory pattern) → Transformer (LLM enrichment: summary, keywords, questions) → Indexer (full-text + vector + hybrid). |
| **Long-Context** | TOC extraction — LLM attaches chapter info to each chunk at index time; retrieval uses TOC structure to fill gaps from chunk fragmentation. |
| **Self-RAG** | Cyclic graph — Relevant operator scores retrieval; if irrelevant, query rewritten and loop continues. Dynamic query planning. |

**Strategy harvested**: TOC-attached chunks for long-context retrieval. Self-RAG reflection loop for query rewriting.

### 1.7 ColBERTv2

| Dimension | Finding |
|-----------|---------|
| **Late interaction** | Each query token finds its closest passage token (MaxSim). Alignment-free, preserves fine-grained matching. |
| **Compression** | Residual compression: 128-dim vector → 4 bytes centroid index + 16-32 bytes quantized residual (1-2 bits/dim). 7-13x compression. PLAID engine ~10x faster. |

**Strategy harvested**: MaxSim scoring — token-level interaction beats pooled embeddings. Centroid-based residual compression for efficient large-scale retrieval.

### 1.8 RAPTOR

| Dimension | Finding |
|-----------|---------|
| **Tree structure** | Chunks (leaves) → GMM cluster → LLM summarize → embed → repeat. Collapsed tree (flatten all layers → cosine similarity across all nodes) outperforms tree traversal. |
| **Retrieval** | SBERT embeddings + cosine similarity. Top nodes until token budget (2000 tokens ≈ top-20 nodes). |
| **Key finding** | ~4% minor hallucination rate in summaries. Leaf chunks retained alongside summaries — both granular and abstractive coexist. |

### 1.9 DSPy

| Dimension | Finding |
|-----------|---------|
| **Optimization** | Compiler (MIPROv2, GEPA, BootstrapFewShot) jointly optimizes instructions AND few-shot demonstrations. Pipeline = text transformation graph with typed signatures. |
| **Retrieval** | Built-in ColBERTv2 wrapper + Retrieve module. Optimization tunes number of chunks, selection criteria, prompt instructions as part of full pipeline compile. |

**Strategy harvested**: Programmatic pipeline optimization — give a training set and metric, the compiler optimizes retrieval strategy automatically.

### 1.10 Supermemory (Omi)

| Dimension | Finding |
|-----------|---------|
| **Memory extraction** | LLM extracts facts per conversation: max 15 words, max 2 interesting + 2 system, shareability test, no duplicates, no mundane details. |
| **Categories** | Interesting (hobbies, opinions, stories), System (preferences, habits), Manual (user-defined). |
| **Conversation metadata** | Title, overview, action items, people mentioned, topics, entities, dates stored per conversation vector. |

### 1.11 Mem0

| Dimension | Finding |
|-----------|---------|
| **v3 ADD-only** | Nothing overwritten. Old and new facts coexist. UPDATE/DELETE removed. 94.4 LongMemEval vs 67.8 old algorithm. |
| **Memory layers** | Conversation (single turn) → Session (run_id, manual clear) → User (user_id, weeks/forever) → Organizational (global, shared). |
| **Graph variant** | Mem0g: Full Neo4j labeled graph. Two-stage LLM extraction: entity extractor → relationship generator. |
| **Structured attributes** | Temporal breakdown: when event occurred, ongoing/completed, precision, memory type (event/state/plan/preference/relationship/absence). |
| **Key finding** | "Knowledge update" is hardest category for ADD-only (93.6 score) — old facts persist alongside new. |

### 1.12 Letta (MemGPT)

| Dimension | Finding |
|-----------|---------|
| **MemFS** | Git-backed filesystem of Markdown files with YAML frontmatter. system/ always loaded, reference/ lazy-loaded. Every edit git-committed. |
| **Dreaming** | Sleep-time compute: background subagents review recent conversations, consolidate, update memory. Uses git worktrees to avoid blocking. |
| **Memory tiers** | Working (context window, system/ files + recent conversation) → Long-term (MemFS, all files on disk) → External (cloud backup, shared repos, semantic index) → Procedural (Skills, Tools, Mods). |
| **Memory defrag** | /doctor command: backs up FS, launches subagent that splits large files, merges duplicates, restructures to 15-25 focused files. |

**Strategy harvested**: Sleep-time compute for memory consolidation. Git-backed memory with versioned history. Lazy-loading vs always-loaded tier separation.

### 1.13 Graphiti (Zep)

| Dimension | Finding |
|-----------|---------|
| **Bi-temporal model** | Every edge has valid_from + valid_to. Old edges invalidated (not deleted) when contradicted. Query "what was true at time T" or "what is true now." |
| **Provenance** | Episodes stored as graph nodes. Entities + edges connect to episodes via MENTIONS edges. Full lineage from any fact back to source episode. |
| **Hybrid search** | Semantic + BM25 + graph traversal. Node distance reranking prioritizes facts close to focal entity. |
| **Performance** | 94.7% LoCoMo at 155ms, 90.2% LongMemEval at 162ms. |

### 1.14 Evidence Accumulation Frameworks

| Framework | Evidence Unit | Accumulation | Sufficiency Check |
|-----------|--------------|--------------|-------------------|
| **Stateful EDRAG** | Structured Reasoning Unit (SRU) with {relevance, summary, evidence, confidence} | Contrastive pool (positive + negative) | LLM agent evaluates + generates deficiency signals |
| **S2G-RAG** | Sentence-level extract (pointer-based) | Concatenated evidence context Ct | S2G-Judge: binary sufficiency + structured gap items |
| **FAIR-RAG** | Findings checklist | Validated evidence set | SEA: checklist audit → gaps identified |
| **ERA** | Dirichlet evidence distribution | Dempster-Shafer belief fusion | Conflict score κ + evidence threshold |
| **ERAG** | Dirichlet evidence per chunk | Conflict-preserving DS fusion | Fused uncertainty → route: direct/conflict-aware/abstain |
| **CAR** | Generator confidence change ΔC | Bayesian posterior correction | Query confidence threshold gating |

---

## Part 2: Constitutional Laws for Retrieval

These are derived from patterns across ALL systems studied. Each law is a binding constraint for PING's retrieval architecture.

### Law 1: Every retrieved result must carry its trace

**Invariant**: Every result returned by any retrieval authority MUST include: artifact_hash, event_hash, lineage_depth, verification_status, and source authority level.

**Rationale**: Reranking without traceability conflates projection-derived evidence with authority-derived truth. FalkorDB's MENTIONS edges, Graphiti's episode tracking, and PING's existing verification pipeline all converge here.

**Violation**: Any retrieval path that returns { id, score, payload } without trace fields.

### Law 2: Hybrid search is the default. Pure vector requires explicit authorization.

**Invariant**: Hybrid search (RRF-fused BM25 + dense vector + graph traversal) is the default retrieval mode. Pure vector search is only permitted when explicitly authorized by a higher authority and documented in the query plan.

**Rationale**: Every system surveyed achieves best results with hybrid. Pure vector loses keyword precision. The mode determines which failure surface the system exposes.

**Violation**: Any query that uses only one retrieval modality without documented justification.

### Law 3: Evidence must be accumulated, not just retrieved.

**Invariant**: No answer shall be generated from a single retrieval pass. The system must: (a) identify information gaps via structured analysis, (b) generate targeted sub-queries, (c) iteratively accumulate until all gaps are filled, (d) gate generation on sufficiency.

**Rationale**: Every production RAG system that achieves >90% accuracy uses iterative evidence accumulation (FAIR-RAG's SEA, S2G-RAG's judge, Stateful EDRAG's contrastive pool). Single-pass retrieval is insufficient for business decisions.

**Violation**: Any endpoint that retrieves and returns without checking evidence sufficiency.

### Law 4: Provenance is non-detachable from facts.

**Invariant**: Any fact in the knowledge graph MUST carry a verifiable edge to its source event(s). Stripping provenance destroys the system's ability to update, correct, or trust its own knowledge.

**Rationale**: LightRAG's deletion reconstruction proves the system cannot function without provenance. FalkorDB's lexical graph (Document→PART_OF→Chunk→NEXT_CHUNK), Graphiti's episode MENTIONS edges, and PING's event pipeline all enforce this.

**Violation**: Any fact node without incoming MENTIONS edges from source events.

### Law 5: Abstraction level must match query intent.

**Invariant**: The retrieval system must classify query intent and select the appropriate abstraction level (entity, community, theme, document, summary) before retrieval. Using the wrong level produces wrong answers.

**Rationale**: MS GraphRAG's hierarchical community levels, LightRAG's dual-level keywords, and Memgraph's three atomic pipeline types all implement per-query level selection.

**Violation**: A single retrieval strategy applied to all query types without intent classification.

### Law 6: Insert must be idempotent. Delete must preserve shared structure.

**Invariant**: Re-ingesting the same event must produce exactly the same graph state. Deleting an event must preserve entities shared with other events.

**Rationale**: LightRAG's incremental merge (set merging, not overwrite) and FalkorDB's apply_changes() demonstrate this. PING's event-sourced pipeline already has this property at the event layer — it must extend to the knowledge layer.

**Violation**: Duplicate event ingestion creates duplicate entities. Event deletion orphans shared entities.

### Law 7: ADD-only accumulation with invalidation, not deletion.

**Invariant**: No knowledge shall be deleted by automatic processes. Outdated facts are invalidated (marked with valid_to), not removed. Old and new facts coexist.

**Rationale**: Mem0 v3's ADD-only achieves 94.4 LongMemEval vs 67.8 with UPDATE/DELETE. Graphiti's bi-temporal edges (valid_from/valid_to) enable temporal queries. Overwriting destroys traceability.

**Violation**: Any UPDATE or DELETE on knowledge graph state by an automatic process.

### Law 8: Confidence must be disentangled from belief.

**Invariant**: Evidence accumulation must separately track: (a) belief mass (confidence claim is true), (b) epistemic uncertainty (how much evidence seen), (c) knowledge conflict (disagreement between sources). No single scalar shall conflate these.

**Rationale**: ERA/ERAG frameworks' Dempster-Shafer fusion preserves uncertainty. Conflating into one score loses the ability to distinguish "confident with little evidence" from "confident with much evidence."

### Law 9: Quantization must be declared on every result.

**Invariant**: Any result produced from quantized vectors MUST declare: compression ratio, quantization method (INT8/Binary/PQ/TurboQuant), and whether rescoring was applied. A score from 3-bit TurboQuant is not the same as FP32.

**Rationale**: Qdrant's quantized search requires 3-5x oversampling + rescore for equivalent accuracy. The consumer must know which precision regime produced the score.

### Law 10: Every query must declare its retrieval plan.

**Invariant**: Every query must declare its retrieval strategy (ANN-only / hybrid / graph-traversal / full-text / community-summary) in a human-readable and auditable query plan. The system must be able to explain HOW it retrieved, not just WHAT it retrieved.

**Rationale**: FalkorDB's MultiPathRetrieval, MS GraphRAG's query routing, and Memgraph's atomic pipeline types all produce explicit query plans.

---

## Part 3: PING Authority Impact Assessment

| PING Authority | Current State | Improvement Opportunity | Priority |
|----------------|---------------|------------------------|----------|
| **KnowledgeAuthority** | Graph with nodes+edges. No retrieval planner, no query expansion, no multi-path fusion. | Wire as RetrievalPlanner → multi-path retrieval (vector + keyword + graph) → RRF fusion → evidence ranking. Implement density-aware adaptive thresholding. | P0 |
| **BusinessMemory** | Does not exist as a distinct authority. Events accumulate but no memory tiers exist. | Implement 3-tier memory: Working (session), Business (entities+relationships with bi-temporal edges), Organizational (shared community summaries). Follow Letta's MemFS pattern — git-backed, declarative files. | P0 |
| **ReplayAuthority** | Exists at event level but not at retrieval level. | Retrieval queries must be replayable: same query + same index version = same results. Add retrieval plan hashing for replay. | P1 |
| **RecommendationAuthority** | Static mappings from classification→action. | Upgrade to evidence-based: recommendations carry confidence derived from evidence accumulation sufficiency, not static rules. | P1 |
| **MissionRuntime** | Polls pending missions, dispatches workers. | Add sufficiency gate: missions check evidence accumulation before dispatching next stage. | P1 |
| **EventReadAuthority** | Event retrieval with Postgres queries. | Add TOC-aware chunk retrieval: attach chapter/section metadata to document events for long-context retrieval. | P2 |
| **CapabilityRegistry** | Provider metadata, reasoning summaries. | Expand reasoning summaries to include retrieval capability awareness: "I can find entities similar to X using KnowledgeAuthority graph traversal." | P2 |
| **UnifiedEventRuntime** | Event emission + pipeline. | Add LLM response cache (LightRAG pattern) — keyed on (event_type, payload_hash, signature). Reduce redundant event processing. | P2 |
| **RecoveryAuthority** | Not a named authority. | Needed for temporal query: "What was true about this customer on July 1?" Requires Graphiti-style bi-temporal edges in KnowledgeAuthority. | P3 |
| **Oracle / BusinessQuestions** | 3/24 questions answerable. | Implement evidence accumulation pipeline: question → checklist → sub-queries → iterative retrieval → sufficiency gate → answer with confidence. | P0 |

---

## Part 4: Concrete Implementation Recommendations

### Recommendation 1: Add RetrievalPlanner to KnowledgeAuthority

**What**: Before any retrieval, classify query intent → select strategy → execute → accumulate → gate.

**Implementation**:
```
Query → IntentClassifier (entity/community/theme/document)
  → RetrievalPlanner.selectStrategy(intent)
  → MultiPathRetrieval (vector + BM25 + graph traversal)
  → RRFFuser.rank(candidates)
  → EvidenceAccumulator.checkSufficiency(results, query)
  → If insufficient: QueryRefiner.generateSubQueries(gaps) → loop
  → If sufficient: return results with confidence
```

**Files**: `ping-runtime/knowledge/retrieval_planner.js` (new, ~300 lines)
**Piggybacks on**: existing `KnowledgeAuthority`, `knowledge_graph.js`, Qdrant client
**Tests**: ~20 tests

### Recommendation 2: Add QueryIntentClassifier to KnowledgeAuthority

**What**: Classify query into intent categories to select retrieval abstraction level.

**Implementation**: Lightweight LLM-free classifier using keyword heuristics + entity matching:
- Contains named entity → entity-level retrieval
- Contains category/theme words → community-level retrieval
- Contains time range → temporal retrieval with bi-temporal edges
- Generic/question → hybrid (all paths)

**Files**: `ping-runtime/knowledge/query_intent_classifier.js` (new, ~100 lines)

### Recommendation 3: Implement 3-Tier BusinessMemory

**What**: Working (session), Business (bi-temporal knowledge graph), Organizational (community summaries).

**Implementation**:
- Working: in-memory Map per session, TTL-based expiry (default 30 min)
- Business: KnowledgeAuthority edges get valid_from/valid_to (Graphiti pattern)
- Organizational: Community summaries from KnowledgeAuthority (MS GraphRAG Light pattern, triggered by configurable schedule)

**Files**: `ping-runtime/memory/business_memory.js` (new, ~250 lines)
**Piggybacks on**: existing KnowledgeAuthority, event pipeline

### Recommendation 4: Add EvidenceAccumulator

**What**: Iterative retrieval with sufficiency gating.

**Implementation**: FAIR-RAG pattern — deconstruct query into findings checklist, accumulate evidence per finding, gate on completion.

**Files**: `ping-runtime/knowledge/evidence_accumulator.js` (new, ~200 lines)
**Algorithm**:
1. Parse question into required findings (e.g., "Why did profit drop?" → [revenue_change, cost_change, time_period])
2. Retrieve evidence per finding via RetrievalPlanner
3. Check sufficiency: all findings have supporting evidence?
4. If gaps: generate sub-queries, retrieve more, update evidence pool
5. When sufficient: return evidence bundle + confidence
6. If max iterations reached: return best-effort with uncertainty flag

### Recommendation 5: Add LLM Response Cache to UnifiedEventRuntime

**What**: Cache LLM responses per (event_type, payload_hash, signature) to eliminate redundant LLM calls.

**Implementation**: LightRAG pattern — persistent cache with similarity threshold, selectively clearable per mode.

**Files**: `ping-runtime/events/unified_event_runtime.js` (add caching layer, ~80 lines)

### Recommendation 6: Add Retrieval Plan Hashing to ReplayAuthority

**What**: Every query's retrieval plan (strategy, parameters, index version) gets a deterministic hash. Replay verifies same query produces same plan.

**Files**: `runtime/replay/replay_plan_authority.ts` (or equivalent, add plan hashing)

### Recommendation 7: Add Bi-Temporal Edge Support to KnowledgeAuthority

**What**: Every edge carries valid_from + valid_to. No deletion — only invalidation. Enable temporal queries.

**Files**: `ping-runtime/knowledge/knowledge_graph.js` (modify edge schema, add temporal query methods)
**Temporal queries**:
- `getStateAt(entityId, timestamp)` — what was true at time T
- `getHistory(entityId)` — all versions of truth
- `getChanges(entityId, from, to)` — what changed between two times

---

## Part 5: Research Gaps for Future Study

These areas were identified during research but not deeply studied:

1. **DSPy MIPROv2** — joint instruction + few-shot optimization. Could optimize PING's retrieval pipeline prompts automatically.
2. **GEPA (Jul 2025)** — Reflective Prompt Evolution. Self-critique and revision for prompt optimization.
3. **Conformal RAG** — Distribution-free guarantee for retrieval sets. "Trusted chunk sets via conformal prediction."
4. **Graph RAG using LLMs** (Fatemi+ 2024, arXiv 2410.16261) — Theorems about optimal retrieval on graphs informed by LLM knowledge.
5. **Voyage AI's Voyage-3-Large** — State-of-the-art retrieval embeddings (4096-dim, 1000+ tasks).
6. **PGVector + PGMQ** — Postgres-native vector search + queue for unified stack (no external DB).

---

## Appendix: Research Coverage

| Area | Systems Studied | Key Papers |
|------|-----------------|------------|
| Graph+Vector RAG | HyperRAG, HyperGraphRAG, HyperTreeRAG, MS GraphRAG, Neo4j GraphRAG, Memgraph, Kùzu, FalkorDB | GraphRAG (Microsoft, 2024), FalkorDB SDK, Memgraph atomic GraphRAG |
| Lightweight RAG | LightRAG | LightRAG (2024), incremental merge/deletion |
| Pipeline Orchestration | RAGFlow | RAGFlow v0.21 docs |
| Memory Systems | Supermemory, Mem0, Letta, Graphiti | Mem0 (YC S24), MemGPT (UC Berkeley), Graphiti (Zep) |
| Retrieval Optimization | ColBERTv2, RAPTOR, DSPy | ColBERTv2 (Stanford), RAPTOR (Stanford), DSPy (Stanford) |
| Evidence Accumulation | Stateful EDRAG, S2G-RAG, FAIR-RAG, ERA, ERAG, CAR | ERA (arXiv 2604.20854), S2G-RAG (ACL 2026), FAIR-RAG |
| Knowledge Evolution | Graphiti, RDF-star, PROV, Causal Graphs | Graphiti (Zep), RDF-star (W3C), PROV (W3C), DoWhy (Microsoft) |
| Bayesian Reasoning | ERA, CAR, Bayesian causal discovery | ERA Dirichlet fusion, CAR Bayesian posterior correction |
| Local Vector DBs | Qdrant, Weaviate, Milvus, LanceDB, Chroma, Kùzu | Qdrant TurboQuant (ICLR 2026), Weaviate v1.38 |
| Evaluation | RAGBench, CRUD-RAG, LongBench, LongBench Pro | RAGBench (TRACe), CRUD-RAG (2024), LongBench (2024) |
