# GraphRAG Architectural Harvest

**Purpose:** Extract constitutional patterns from GraphRAG for PING

---

## Core Patterns

### 1. Deterministic Retrieval Mode

**Pattern:** Stable global→local routing without hidden randomness
- Many RAG systems rely on multi-hop reasoning, planner-generated routes, sampling/temperature
- These introduce hidden randomness and make end-to-end reproducibility difficult
- Deterministic mode offers strict, reproducible routing mode
- Same corpus + same query → same route → same output
- Enables reproducibility, research comparisons, compliance/audit pipelines, deterministic evaluation

**Deterministic Mode Features:**
- Global routing uses fixed clustering or deterministic partition
- Local search uses exact/deterministic similarity
- LLM calls disable sampling (temperature=0)
- Planner and hop expansion are disabled
- Same input → same routing trace → same output

**Constitutional Rules:**
- Deterministic retrieval for reproducibility
- No hidden randomness in retrieval
- Fixed clustering/partitioning
- Exact similarity search
- Disabled sampling in LLM calls

**PING Application:**
- Graph Service should support deterministic retrieval
- No hidden randomness in graph traversal
- Fixed clustering for reproducibility
- Exact similarity search
- Disabled sampling in AI calls

---

### 2. Knowledge Graph Construction

**Pattern:** Extract structured knowledge from unstructured text
- GraphRAG extracts meaningful, structured data from unstructured text using LLMs
- Constructs symbolic knowledge graph from text data
- Encodes entities and factual relationships as structured fact triples
- Knowledge graph memory structures enhance LLM outputs
- Graph organizes scattered facts into structured knowledge

**Triple Extraction:**
- Extracts (subject, relation, object) triples from raw text
- Defines semantic backbone of knowledge graph
- Entity: specific object or concept in text
- Relation: semantic connection between entities
- High-quality triple extraction is critical for downstream reasoning

**Constitutional Rules:**
- Structured knowledge extraction from unstructured text
- Symbolic knowledge graph construction
- Entity and relationship extraction
- Fact triples as knowledge units
- High-quality extraction for downstream reasoning

**PING Application:**
- Graph Service should construct knowledge graphs from events
- Extract entities and relationships from events
- Symbolic knowledge graph construction
- Fact triples as knowledge units
- High-quality extraction for downstream reasoning

---

### 3. Community Clustering

**Pattern:** Partition knowledge graph into meaningful units
- Community clustering partitions knowledge graph into meaningful units
- Granularity of fundamental knowledge units has significant impact on downstream performance
- Balance between factual detail and topical coherence within each unit
- Enables precise and comprehensive retrieval
- Facilitates effective multi-hop reasoning

**Clustering Strategies:**
- KMeans with fixed seed for determinism
- Deterministic community assignment
- Fixed clustering for reproducibility
- Balance detail vs coherence
- Optimal granularity for performance

**Constitutional Rules:**
- Deterministic community clustering
- Fixed seed for reproducibility
- Balance detail vs coherence
- Optimal granularity for performance
- Meaningful knowledge units

**PING Application:**
- Graph Service should support deterministic clustering
- Fixed seed for reproducibility
- Balance detail vs coherence
- Optimal granularity for performance
- Meaningful event communities

---

### 4. Multi-Hop Reasoning

**Pattern:** Traverse graph across multiple hops for complex reasoning
- Multi-hop reasoning requires synthesis of information from various sources
- Graph structures illustrate explicit entity relationships
- Support inferential pathways similar to human reasoning
- Entity-guided graph traversal through Personalized PageRank (PPR)
- Efficient, scalable retrieval based on knowledge graph

**Traversal Strategies:**
- Entity-guided graph traversal
- Personalized PageRank (PPR) for traversal
- Multi-hop reasoning across graph
- Efficient retrieval based on graph
- Inferential pathways similar to human reasoning

**Constitutional Rules:**
- Multi-hop reasoning across graph
- Entity-guided traversal
- Efficient graph-based retrieval
- Inferential pathways
- Scalable traversal

**PING Application:**
- Graph Service should support multi-hop reasoning
- Entity-guided event traversal
- Efficient event-based retrieval
- Inferential pathways across events
- Scalable event graph traversal

---

### 5. Prompt-Driven Execution

**Pattern:** Prompt design guides retrieval and reasoning process
- Prompt design affects entity extraction accuracy, fact selection, passage classification
- Prompt-driven execution actively guides retrieval process
- Prompt-conditioned LLM filtering selects relevant facts
- Query prompts drive seed entity selection and graph traversal
- Prompt-guided semantic filtering for precise sub-graph selections

**Prompt-Driven Features:**
- Prompt-driven entity extraction
- Prompt-driven fact selection
- Prompt-driven passage reranking
- Prompt-guided semantic filtering
- Prompt-driven sub-graph selection

**Constitutional Rules:**
- Prompt design as central feature
- Prompt-driven execution integration
- Prompt engineering throughout pipeline
- Prompt-guided semantic filtering
- Precise sub-graph selections

**PING Application:**
- Graph Service should support prompt-driven execution
- Prompt-driven event extraction
- Prompt-driven fact selection
- Prompt-guided semantic filtering
- Precise event subgraph selections

---

### 6. Graph Context-Aware Generation

**Pattern:** Incorporate textual and topological information into LLMs
- Graph context-aware generation incorporates textual graphs into LLMs
- Two complementary views: text view and graph view
- Enables LLMs to more effectively comprehend and utilize graph context
- Preserves both textual and topological information
- Maintains interdependencies between textual and topological information

**Context-Aware Features:**
- Text view for textual information
- Graph view for topological information
- Joint textual and topological information
- Preserves interdependencies
- Effective graph context comprehension

**Constitutional Rules:**
- Graph context-aware generation
- Text and graph views
- Joint textual and topological information
- Preserve interdependencies
- Effective graph context comprehension

**PING Application:**
- Graph Service should support graph context-aware generation
- Text and graph views for events
- Joint textual and topological event information
- Preserve event interdependencies
- Effective event graph context comprehension

---

### 7. Divide-and-Conquer Retrieval

**Pattern:** Retrieve optimal subgraph structure in linear time
- Divide-and-conquer strategy retrieves optimal subgraph structure
- Linear time retrieval for efficiency
- Handles high dimensionality of textual features within nodes and edges
- Efficient textual subgraph retrieval
- Scalable retrieval for large graphs

**Divide-and-Conquer Features:**
- Optimal subgraph structure retrieval
- Linear time retrieval
- Handles high dimensionality
- Efficient textual subgraph retrieval
- Scalable for large graphs

**Constitutional Rules:**
- Efficient subgraph retrieval
- Linear time complexity
- Handle high dimensionality
- Scalable retrieval
- Optimal subgraph structure

**PING Application:**
- Graph Service should support divide-and-conquer retrieval
- Efficient event subgraph retrieval
- Linear time complexity
- Handle high event dimensionality
- Scalable event graph retrieval

---

### 8. Report Generation

**Pattern:** Generate reports from knowledge graph communities
- Simple template-based reporting outperforms LLM-based summarization
- Template-based reporting more accurate and efficient
- Reports generated from knowledge graph communities
- Verbalized communities for retrieval
- Chunked and indexed for efficient retrieval

**Report Generation Strategies:**
- Template-based reporting
- LLM-based summarization
- Verbalized communities
- Chunked for retrieval
- Indexed for efficient retrieval

**Constitutional Rules:**
- Template-based reporting for accuracy
- Efficient report generation
- Verbalized communities
- Chunked for retrieval
- Indexed for efficient retrieval

**PING Application:**
- Graph Service should support template-based reporting
- Efficient event community reporting
- Verbalized event communities
- Chunked for retrieval
- Indexed for efficient retrieval

---

### 9. Knowledge Indexing Pipeline

**Pattern:** Seven-stage pipeline for knowledge graph construction
- Offline knowledge indexing (Stages 1-5): documents transformed into knowledge graph
- Online question answering (Stages 6-7): relevant chunks retrieved and used to generate answers
- Triple Extraction extracts (subject, relation, object) triples from raw text
- Graph Construction builds directed knowledge graph by merging entity mentions
- Community Detection partitions graph into communities
- Community Summarization generates summaries for each community
- Community Embedding generates embeddings for communities
- Document Embedding generates embeddings for documents

**Pipeline Stages:**
1. Triple Extraction
2. Graph Construction
3. Community Detection
4. Community Summarization
5. Community Embedding
6. Document Embedding
7. Retrieval and Generation

**Constitutional Rules:**
- Seven-stage pipeline for knowledge graph construction
- Offline indexing for efficiency
- Online retrieval for responsiveness
- Modular pipeline design
- Each stage independently optimized

**PING Application:**
- Graph Service should implement knowledge indexing pipeline
- Offline event indexing for efficiency
- Online event retrieval for responsiveness
- Modular pipeline design
- Each stage independently optimized

---

### 10. Graph-Based Retrieval

**Pattern:** Retrieve relevant information using graph structure
- Graph-based retrieval for advanced reasoning
- Graph structures illustrate explicit entity relationships
- Support inferential pathways similar to human reasoning
- Networked documents require graph context
- Graph retrieval enhances traditional RAG

**Graph-Based Features:**
- Explicit entity relationships
- Inferential pathways
- Networked document handling
- Graph context integration
- Enhanced traditional RAG

**Constitutional Rules:**
- Graph-based retrieval for advanced reasoning
- Explicit entity relationships
- Inferential pathways
- Networked document handling
- Graph context integration

**PING Application:**
- Graph Service should support graph-based retrieval
- Explicit event relationships
- Inferential pathways across events
- Networked event handling
- Graph context integration

---

## Implementation Patterns

### Triple Extraction
- Extract (subject, relation, object) triples from raw text
- High-quality extraction for downstream reasoning
- Entity and relationship extraction
- Semantic backbone of knowledge graph
- LLM-based extraction with prompts

### Community Clustering
- Deterministic clustering with fixed seed
- Balance detail vs coherence
- Optimal granularity for performance
- KMeans with fixed seed
- Deterministic community assignment

### Graph Traversal
- Entity-guided graph traversal
- Personalized PageRank (PPR)
- Multi-hop reasoning
- Efficient traversal
- Scalable retrieval

### Prompt-Driven Execution
- Prompt-driven entity extraction
- Prompt-driven fact selection
- Prompt-guided semantic filtering
- Prompt-driven sub-graph selection
- Prompt engineering throughout pipeline

---

## Anti-Patterns to Avoid

### 1. Hidden Randomness in Retrieval
- **Problem:** Non-deterministic retrieval breaks reproducibility
- **Solution:** Use deterministic retrieval mode with fixed clustering

### 2. Low-Quality Triple Extraction
- **Problem:** Poor extraction quality bottlenecks downstream reasoning
- **Solution:** High-quality triple extraction with prompts

### 3. Suboptimal Community Granularity
- **Problem:** Poor balance between detail and coherence
- **Solution:** Optimal granularity for performance

### 4. LLM-Based Summarization
- **Problem:** Less accurate and efficient than template-based
- **Solution:** Template-based reporting for accuracy

### 5. Ignoring Graph Context
- **Problem:** Misses networked document relationships
- **Solution:** Graph context-aware generation

---

## PING-Specific Recommendations

### Graph Service
- Implement deterministic retrieval mode
- Construct knowledge graphs from events
- Support deterministic community clustering
- Implement multi-hop reasoning
- Support prompt-driven execution

### Knowledge Extraction Service
- Extract entities and relationships from events
- High-quality triple extraction
- Prompt-driven entity extraction
- Prompt-driven fact selection
- Prompt-guided semantic filtering

### Retrieval Service
- Implement divide-and-conquer retrieval
- Entity-guided graph traversal
- Personalized PageRank for traversal
- Efficient subgraph retrieval
- Scalable event graph retrieval

### Generation Service
- Support graph context-aware generation
- Text and graph views for events
- Joint textual and topological information
- Preserve event interdependencies
- Template-based reporting

---

## Performance Considerations

### Indexing Performance
- GraphRAG indexing can be expensive
- Start small to understand costs
- Offline indexing for efficiency
- Modular pipeline design
- Each stage independently optimized

### Retrieval Performance
- Linear time retrieval with divide-and-conquer
- Efficient subgraph retrieval
- Scalable for large graphs
- Entity-guided traversal
- Personalized PageRank for efficiency

### Generation Performance
- Template-based reporting more efficient than LLM-based
- Graph context-aware generation
- Text and graph views
- Joint textual and topological information
- Effective graph context comprehension

---

## Monitoring and Observability

### Graph Metrics
- Node count
- Edge count
- Community count
- Graph depth
- Graph density

### Retrieval Metrics
- Retrieval latency
- Retrieval accuracy
- Multi-hop depth
- Subgraph size
- Traversal path length

### Generation Metrics
- Generation latency
- Generation accuracy
- Report quality
- Template usage rate
- LLM usage rate

---

## Migration Path

### From Traditional RAG to GraphRAG
1. Implement triple extraction
2. Construct knowledge graph
3. Implement community clustering
4. Implement graph traversal
5. Implement prompt-driven execution
6. Implement graph context-aware generation

### From Non-Deterministic to Deterministic Retrieval
1. Implement deterministic clustering
2. Disable sampling in LLM calls
3. Use exact similarity search
4. Disable planner and hop expansion
5. Verify deterministic retrieval

---

## References

- [Deterministic Retrieval Mode](https://github.com/microsoft/graphrag/issues/2136)
- [GraphRAG Repository](https://github.com/microsoft/graphrag)
- [PROPEX-RAG](https://arxiv.org/html/2511.01802)
- [Dissecting GraphRAG](https://aclanthology.org/2026.tacl-1.29.pdf)
- [GRAG](https://aclanthology.org/2025.findings-naacl.232.pdf)
