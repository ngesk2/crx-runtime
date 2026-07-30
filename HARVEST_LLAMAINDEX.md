# LlamaIndex Architectural Harvest

**Purpose:** Extract constitutional patterns from LlamaIndex for PING

---

## Core Patterns

### 1. Deterministic Testing with VCR

**Pattern:** Record and replay LLM interactions for deterministic tests
- Testing complex LLM-powered applications is challenging
- External dependencies on APIs make testing difficult
- LLMs produce slightly different outputs for same input (non-deterministic)
- VCR.py records HTTP interactions and replays them during future test runs
- Fast, deterministic, accurate tests without constant re-execution

**VCR Approach:**
- Record each LLM call and response from one run
- Intercept future calls to same endpoints
- Replay old responses for identical data
- Deterministic IF responses from each step are identical to previous run
- No need to patch library or dependencies

**Constitutional Rules:**
- Deterministic testing for LLM applications
- Record and replay LLM interactions
- No external dependencies during tests
- Fast, deterministic, accurate tests
- No need to patch library or dependencies

**PING Application:**
- Event Service should implement deterministic testing
- Record and replay event interactions
- No external dependencies during tests
- Fast, deterministic, accurate tests
- No need to patch library or dependencies

---

### 2. Retrieval-Augmented Generation (RAG)

**Pattern:** Find and return most relevant documents for query
- Retrieval finds and returns most relevant documents for query from Index
- Most common type is "top-k" semantic retrieval
- Postprocessing optionally reranks, transforms, or filters retrieved nodes
- Response synthesis combines query, relevant data, and prompt for LLM response
- Low-level composition API for granular control over querying

**RAG Pipeline:**
- Retrieval: find relevant documents
- Postprocessing: rerank, transform, filter nodes
- Response synthesis: combine query, data, prompt for LLM
- Low-level composition API
- Granular control over querying

**Constitutional Rules:**
- Retrieval-augmented generation
- Top-k semantic retrieval
- Postprocessing for reranking, transforming, filtering
- Response synthesis for LLM
- Low-level composition API

**PING Application:**
- Event Service should implement RAG pattern
- Top-k event retrieval
- Postprocessing for reranking, transforming, filtering
- Response synthesis for LLM
- Low-level composition API

---

### 3. Node Postprocessing

**Pattern:** Filter and augment retrieved nodes for improved relevancy
- Advanced Node filtering and augmentation improve relevancy
- KeywordNodePostprocessor: filters nodes by required_keywords and exclude_keywords
- SimilarityPostprocessor: filters nodes by threshold on similarity score
- PrevNextNodePostprocessor: augments nodes with additional relevant context based on relationships
- Reduce time/number of LLM calls/cost or improve response quality

**Postprocessing Features:**
- Keyword filtering
- Similarity threshold filtering
- Context augmentation based on relationships
- Reduce LLM calls/cost
- Improve response quality

**Constitutional Rules:**
- Node postprocessing for improved relevancy
- Keyword filtering
- Similarity threshold filtering
- Context augmentation
- Reduce LLM calls/cost

**PING Application:**
- Event Service should implement node postprocessing
- Event filtering by keywords
- Event filtering by similarity threshold
- Context augmentation based on relationships
- Reduce LLM calls/cost

---

### 4. Response Synthesis Modes

**Pattern:** Different strategies for synthesizing LLM responses
- Default: "create and refine" by sequentially going through each retrieved Node
- Compact: "compact" prompt during each LLM call by stuffing as many Node chunks as fit
- Tree_summarize: recursively construct tree and return root node as response
- No_text: only run retriever to fetch nodes without sending to LLM
- Accumulate: apply query to each Node text chunk while accumulating responses

**Synthesis Modes:**
- Default: sequential through nodes
- Compact: stuff as many chunks as fit
- Tree_summarize: recursive tree construction
- No_text: only retrieval, no LLM
- Accumulate: accumulate responses across chunks

**Constitutional Rules:**
- Multiple response synthesis modes
- Sequential through nodes
- Compact for efficiency
- Tree summarization
- Accumulate for chunk-wise processing

**PING Application:**
- Event Service should implement response synthesis modes
- Sequential event processing
- Compact for efficiency
- Tree summarization
- Accumulate for chunk-wise processing

---

### 5. Sequential vs Batch Retrieval

**Pattern:** Choose between sequential and batch retrieval based on question type
- Sequential: top-1 first, sufficiency predicate, escalate if needed
- Batch: all K at once (default behavior)
- Sequential wins on easy factual questions where top-1 already has answer
- Batch wins on listing, comparison, and tight-score retrieval questions
- Dispatch between sequential and batch based on question type

**Sequential Retrieval:**
- Top-1 first
- Sufficiency predicate
- Escalate if needed
- 1/5 of batch cost for easy questions
- Efficient for factual lookups

**Batch Retrieval:**
- All K at once
- Default behavior
- Wins on listing questions
- Wins on comparison questions
- Wins on tight-score retrieval

**Constitutional Rules:**
- Sequential vs batch retrieval
- Sufficiency predicate
- Dispatch based on question type
- Sequential for easy factual questions
- Batch for listing, comparison, tight-score

**PING Application:**
- Event Service should implement sequential vs batch retrieval
- Sufficiency predicate
- Dispatch based on event type
- Sequential for easy event lookups
- Batch for listing, comparison, tight-score

---

### 6. Retry Query Engine

**Pattern:** Use evaluator to improve response from base query engine
- Retry query engine uses evaluator to improve response
- First queries base query engine
- Use evaluator to decide if response passes
- If response passes, return response
- Otherwise, transform original query with evaluation result into new query

**Retry Query Engine:**
- Query base engine
- Evaluate response
- Return if passes
- Transform query if fails
- Repeat up to max_retries

**Constitutional Rules:**
- Retry query engine for improvement
- Evaluate response
- Return if passes
- Transform query if fails
- Repeat up to max_retries

**PING Application:**
- Event Service should implement retry query engine
- Evaluate event response
- Return if passes
- Transform event query if fails
- Repeat up to max_retries

---

### 7. Retry Source Query Engine

**Pattern:** Modify query source nodes by filtering based on LLM node evaluation
- Retry Source modifies query source nodes
- Filters existing source nodes for query based on LLM node evaluation
- Improves retrieval by filtering nodes
- Uses LLM to evaluate node relevance
- Filters out irrelevant nodes

**Retry Source Features:**
- Modify source nodes
- Filter based on LLM evaluation
- Improve retrieval
- LLM evaluates node relevance
- Filter out irrelevant nodes

**Constitutional Rules:**
- Retry source query engine
- Modify source nodes
- Filter based on LLM evaluation
- Improve retrieval
- Filter out irrelevant nodes

**PING Application:**
- Event Service should implement retry source query engine
- Modify event source nodes
- Filter based on LLM evaluation
- Improve event retrieval
- Filter out irrelevant events

---

### 8. Retry Guideline Query Engine

**Pattern:** Use guidelines to direct evaluator behavior
- Retry Guideline uses guidelines to direct evaluator behavior
- Customize own guidelines
- Evaluate response with guidelines
- Transform query based on evaluation
- Resynthesize query if needed

**Retry Guideline Features:**
- Guidelines for evaluator
- Customizable guidelines
- Evaluate response with guidelines
- Transform query based on evaluation
- Resynthesize query if needed

**Constitutional Rules:**
- Retry guideline query engine
- Guidelines for evaluator
- Customizable guidelines
- Evaluate response with guidelines
- Transform query based on evaluation

**PING Application:**
- Event Service should implement retry guideline query engine
- Guidelines for event evaluator
- Customizable guidelines
- Evaluate event response with guidelines
- Transform event query based on evaluation

---

### 9. Composite Retrieval

**Pattern:** Use multiple retrieval pipelines for comprehensive retrieval
- Composite retrieval uses multiple retrieval pipelines
- Mode: "routing" or "full"
- Pipelines: array of RetrieverPipeline
- Alpha value for hybrid retrieval (weights between dense and sparse)
- Rerank configuration for composite retrieval

**Composite Retrieval Features:**
- Multiple retrieval pipelines
- Routing or full mode
- Hybrid retrieval with alpha
- Rerank configuration
- Comprehensive retrieval

**Constitutional Rules:**
- Composite retrieval for comprehensive results
- Multiple retrieval pipelines
- Routing or full mode
- Hybrid retrieval with alpha
- Rerank configuration

**PING Application:**
- Event Service should implement composite retrieval
- Multiple event retrieval pipelines
- Routing or full mode
- Hybrid event retrieval with alpha
- Rerank configuration

---

### 10. Metadata Filtering

**Pattern:** Comprehensive metadata filtering for vector stores
- Metadata filters for vector stores
- Comprehensive filter with multiple operators
- Filter conditions to combine different filters
- JSON Schema for search_filters inference
- Support for various data types

**Metadata Filtering Features:**
- Comprehensive metadata filters
- Multiple operators (==, >, <, !=, >=, <=, in, nin, any, all, text_match, contains, is_empty)
- Filter conditions (and, or, not)
- JSON Schema for inference
- Support for various data types

**Constitutional Rules:**
- Comprehensive metadata filtering
- Multiple operators
- Filter conditions
- JSON Schema for inference
- Support for various data types

**PING Application:**
- Event Service should implement metadata filtering
- Comprehensive event metadata filters
- Multiple operators
- Filter conditions
- JSON Schema for inference

---

## Implementation Patterns

### Deterministic Testing
- Record and replay LLM interactions
- VCR.py for HTTP interaction recording
- Deterministic tests without external dependencies
- Fast, accurate tests
- No need to patch library or dependencies

### Retrieval-Augmented Generation
- Top-k semantic retrieval
- Postprocessing for reranking, transforming, filtering
- Response synthesis for LLM
- Low-level composition API
- Granular control over querying

### Sequential vs Batch Retrieval
- Sequential: top-1 first, sufficiency predicate
- Batch: all K at once
- Dispatch based on question type
- Sequential for easy factual questions
- Batch for listing, comparison, tight-score

---

## Anti-Patterns to Avoid

### 1. Non-Deterministic LLM Tests
- **Problem:** LLMs produce different outputs for same input
- **Solution:** Use VCR.py to record and replay LLM interactions

### 2. Always Batch Retrieval
- **Problem:** Wasteful for easy factual questions
- **Solution:** Implement sequential vs batch dispatch

### 3. No Postprocessing
- **Problem:** Lower relevancy, higher LLM costs
- **Solution:** Implement node postprocessing for filtering and augmentation

### 4. Single Synthesis Mode
- **Problem:** Not optimal for all use cases
- **Solution:** Implement multiple response synthesis modes

### 5. No Retry Logic
- **Problem:** Poor response quality on first attempt
- **Solution:** Implement retry query engine with evaluator

---

## PING-Specific Recommendations

### Event Service
- Implement deterministic testing with VCR
- Implement RAG pattern
- Implement node postprocessing
- Implement response synthesis modes
- Implement sequential vs batch retrieval

### Retrieval Service
- Implement retry query engine
- Implement retry source query engine
- Implement retry guideline query engine
- Implement composite retrieval
- Implement metadata filtering

### Testing Service
- Implement VCR.py for deterministic tests
- Record and replay event interactions
- No external dependencies during tests
- Fast, deterministic, accurate tests
- No need to patch library or dependencies

### Synthesis Service
- Implement multiple response synthesis modes
- Sequential event processing
- Compact for efficiency
- Tree summarization
- Accumulate for chunk-wise processing

---

## Performance Considerations

### Retrieval Performance
- Sequential vs batch retrieval
- Top-k semantic retrieval
- Node postprocessing
- Composite retrieval
- Metadata filtering

### Synthesis Performance
- Multiple response synthesis modes
- Sequential through nodes
- Compact for efficiency
- Tree summarization
- Accumulate for chunk-wise processing

### Retry Performance
- Retry query engine
- Retry source query engine
- Retry guideline query engine
- Evaluate response
- Transform query if fails

---

## Monitoring and Observability

### Retrieval Metrics
- Retrieval rate
- Top-k retrieval rate
- Sequential vs batch rate
- Composite retrieval rate
- Metadata filtering rate

### Synthesis Metrics
- Synthesis mode usage rate
- Sequential processing rate
- Compact processing rate
- Tree summarization rate
- Accumulate processing rate

### Retry Metrics
- Retry rate
- Retry success rate
- Evaluation pass rate
- Query transformation rate
- Max retries reached rate

---

## Migration Path

### From Simple Retrieval to Composite Retrieval
1. Implement multiple retrieval pipelines
2. Implement routing or full mode
3. Implement hybrid retrieval with alpha
4. Implement rerank configuration
5. Verify comprehensive retrieval

### From Batch to Sequential/Batch Dispatch
1. Implement sequential retrieval
2. Implement sufficiency predicate
3. Implement dispatch logic
4. Verify sequential wins on easy questions
5. Verify batch wins on listing, comparison

---

## References

- [Deterministic Tests for LLM RAG](https://medium.com/@scrudato/deterministic-tests-for-complex-llm-rag-applications-b5a354b75346)
- [RAG Querying](https://developers.llamaindex.ai/python/framework/understanding/rag/querying/index.md)
- [Loop Engineering for RAG](https://towardsdatascience.com/loop-engineering-for-rag-generation-when-top-1-is-enough-when-you-need-top-k/)
- [Retry Query Engine](https://developers.llamaindex.ai/python/examples/evaluation/retryquery/)
- [Direct Retrieve](https://developers.api.llamaindex.ai/api/resources/retrievers/methods/search)
