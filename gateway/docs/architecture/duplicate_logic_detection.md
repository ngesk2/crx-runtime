# Duplicate Logic Detection

## Chunking

### Duplicates Found
- **semantic_chunker.js**: Handwritten semantic chunking (paragraphs, headings, code blocks, JSON, functions)
- **treesitter_chunker.js**: Tree-sitter based chunking (class, function, method, interface, enum, namespace, module)
- **multi_language_parser.js**: Multi-language parsing
- **parser_authority.js**: Parser authority wrapper
- **treesitter_parser_authority.js**: Tree-sitter parser authority

### Overlap
- All handle chunking of text/code
- semantic_chunker.js and treesitter_chunker.js have overlapping functionality for code chunking
- treesitter_chunker.js and treesitter_parser_authority.js both use tree-sitter

### Recommendation
**DELETE**: semantic_chunker.js (replaced by treesitter_chunker.js + Unstructured)
**DELETE**: multi_language_parser.js (replaced by treesitter_chunker.js)
**CONSOLIDATE**: treesitter_chunker.js and treesitter_parser_authority.js into single tree-sitter chunker
**KEEP**: parser_authority.js (constitutional wrapper)

### Migration Plan
1. Replace semantic_chunker.js usage with treesitter_chunker.js
2. Delete multi_language_parser.js
3. Merge treesitter_chunker.js and treesitter_parser_authority.js
4. Keep parser_authority.js as constitutional wrapper

---

## Ollama Adapters

### Duplicates Found
- **ollama_adapter.js**: Original Ollama adapter
- **ollama_provider.js**: Ollama provider
- **ollama_provider_adapter.js**: Ollama provider adapter (subordinate to InferenceAdapter)
- **inference_adapter.js**: Single inference authority
- **inference_service.js**: Inference service

### Overlap
- All handle Ollama API calls
- ollama_adapter.js and ollama_provider.js have similar functionality
- ollama_provider_adapter.js is the correct subordinate to InferenceAdapter

### Recommendation
**DELETE**: ollama_adapter.js (replaced by ollama_provider_adapter.js)
**DELETE**: ollama_provider.js (replaced by ollama_provider_adapter.js)
**KEEP**: ollama_provider_adapter.js (correct subordinate pattern)
**KEEP**: inference_adapter.js (single authority)
**KEEP**: inference_service.js (service layer)

### Migration Plan
1. Replace ollama_adapter.js usage with ollama_provider_adapter.js
2. Delete ollama_adapter.js
3. Delete ollama_provider.js
4. Keep ollama_provider_adapter.js as the single Ollama adapter

---

## Adapters

### Duplicates Found
- **adapter_compiler.js**: Adapter compiler
- **adapter_compiler_v2.js**: Adapter compiler v2
- **adapter_authority.js**: Adapter authority
- **infrastructure_adapter_interface.js**: Infrastructure adapter interface
- **provider_interface.js**: Provider interface

### Overlap
- adapter_compiler.js and adapter_compiler_v2.js solve the same problem
- adapter_authority.js is the constitutional authority

### Recommendation
**DELETE**: adapter_compiler_v2.js (v2 implies v1 is incomplete, but v1 should be completed instead)
**KEEP**: adapter_compiler.js (complete this)
**KEEP**: adapter_authority.js (constitutional authority)
**KEEP**: infrastructure_adapter_interface.js (interface)
**KEEP**: provider_interface.js (interface)

### Migration Plan
1. Complete adapter_compiler.js
2. Delete adapter_compiler_v2.js
3. Keep adapter_authority.js as constitutional wrapper

---

## Replay

### Duplicates Found
- **replay_engine.js**: Replay engine
- **replay_executor.js**: Replay executor
- **transcript_only_replay_engine.js**: Transcript-only replay engine
- **replay_pipeline.js**: Replay pipeline
- **replay_log.js**: Replay log
- **replay_logger.js**: Replay logger
- **replay_plan_authority.js**: Replay plan authority
- **replay_recorder.js**: Replay recorder
- **replay_recorder_authority.js**: Replay recorder authority
- **replay_transcript.js**: Replay transcript
- **replay_verifier.js**: Replay verifier
- **replay_validator_authority.js**: Replay validator authority
- **replay_canonicalizer_authority.js**: Replay canonicalizer authority
- **replay_determinism_authority.js**: Replay determinism authority
- **replay_certificate.js**: Replay certificate
- **replay_kernel_audit.js**: Replay kernel audit
- **merkle_replay_graph.js**: Merkle replay graph
- **merkle_transcript.js**: Merkle transcript

### Overlap
- replay_engine.js and transcript_only_replay_engine.js have overlapping replay logic
- Multiple replay authorities (recorder, validator, canonicalizer, determinism) could be consolidated
- merkle_replay_graph.js and merkle_transcript.js handle similar Merkle tree operations

### Recommendation
**DELETE**: transcript_only_replay_engine.js (consolidate into replay_engine.js)
**CONSOLIDATE**: Multiple replay authorities into single ReplayAuthority
**CONSOLIDATE**: merkle_replay_graph.js and merkle_transcript.js
**KEEP**: replay_engine.js (core replay logic)
**KEEP**: replay authorities (constitutional)

### Migration Plan
1. Consolidate transcript_only_replay_engine.js into replay_engine.js
2. Evaluate consolidation of replay authorities
3. Evaluate consolidation of Merkle tree operations
4. Delete transcript_only_replay_engine.js

---

## Mission

### Duplicates Found
- **mission_authority.js**: Mission authority
- **mission_generator.js**: Mission generator
- **mission_planner.js**: Mission planner
- **mission_rule_authority.js**: Mission rule authority
- **constitutional_mission_control.js**: Constitutional mission control
- **constitutional_mission_queue.js**: Constitutional mission queue
- **constitutional_refactoring_missions.js**: Constitutional refactoring missions
- **devin_work_item_generator.js**: Devin work item generator

### Overlap
- mission_authority.js and constitutional_mission_control.js have overlapping mission management
- mission_generator.js and devin_work_item_generator.js generate similar work items

### Recommendation
**CONSOLIDATE**: mission_authority.js and constitutional_mission_control.js
**CONSOLIDATE**: mission_generator.js and devin_work_item_generator.js
**KEEP**: mission_planner.js (planning logic)
**KEEP**: mission_rule_authority.js (rule logic)

### Migration Plan
1. Consolidate mission_authority.js and constitutional_mission_control.js
2. Consolidate mission_generator.js and devin_work_item_generator.js
3. Keep mission_planner.js and mission_rule_authority.js

---

## Reflection

### Duplicates Found
- **reflection_authority.js**: Reflection authority
- **reflection_generator.js**: Reflection generator
- **reflection_pass.js**: Reflection pass
- **continuous_reflection_loop.js**: Continuous reflection loop
- **constitutional_reflection_authority.js**: Constitutional reflection authority

### Overlap
- reflection_authority.js and constitutional_reflection_authority.js have overlapping reflection logic

### Recommendation
**CONSOLIDATE**: reflection_authority.js and constitutional_reflection_authority.js
**KEEP**: reflection_generator.js (generation logic)
**KEEP**: reflection_pass.js (pass logic)
**KEEP**: continuous_reflection_loop.js (loop logic)

### Migration Plan
1. Consolidate reflection_authority.js and constitutional_reflection_authority.js
2. Keep reflection_generator.js, reflection_pass.js, continuous_reflection_loop.js

---

## Schedulers

### Duplicates Found
- **dependency_scheduler.js**: Dependency scheduler
- **runtime_event_scheduler.js**: Runtime event scheduler
- **constitutional_autonomous_scheduler.js**: Constitutional autonomous scheduler

### Overlap
- All handle scheduling of tasks/events
- dependency_scheduler.js and constitutional_autonomous_scheduler.js have overlapping dependency scheduling

### Recommendation
**CONSOLIDATE**: dependency_scheduler.js and constitutional_autonomous_scheduler.js
**KEEP**: runtime_event_scheduler.js (event-specific scheduling)
**REPLACE WITH**: Temporal (if adopted)

### Migration Plan
1. Consolidate dependency_scheduler.js and constitutional_autonomous_scheduler.js
2. Keep runtime_event_scheduler.js
3. If Temporal is adopted, replace with Temporal workflows

---

## Worker Queues

### Duplicates Found
- **worker_queue.js**: Worker queue
- **worker_pool.js**: Worker pool
- **worker_scheduler.js**: Worker scheduler
- **analysis_queue.js**: Analysis queue
- **persistent_queue.js**: Persistent queue
- **dead_letter_queue.js**: Dead letter queue

### Overlap
- worker_queue.js, worker_pool.js, and worker_scheduler.js handle similar worker management
- analysis_queue.js is a specialized queue that could use worker_queue.js
- persistent_queue.js provides persistence that worker_queue.js lacks

### Recommendation
**CONSOLIDATE**: worker_queue.js, worker_pool.js, and worker_scheduler.js into single queue
**CONSOLIDATE**: analysis_queue.js into worker_queue.js
**KEEP**: persistent_queue.js (persistence layer)
**KEEP**: dead_letter_queue.js (dead letter handling)
**REPLACE WITH**: Temporal (if adopted)

### Migration Plan
1. Consolidate worker_queue.js, worker_pool.js, and worker_scheduler.js
2. Integrate analysis_queue.js into consolidated queue
3. Keep persistent_queue.js and dead_letter_queue.js
4. If Temporal is adopted, replace with Temporal workflows

---

## Graph Compilers

### Duplicates Found
- **import_graph_compiler.js**: Import graph compiler
- **call_graph_compiler.js**: Call graph compiler
- **type_graph_compiler.js**: Type graph compiler
- **build_graph_compiler.js**: Build graph compiler
- **canonical_graph_compiler.js**: Canonical graph compiler
- **canonical_graph_authority.js**: Canonical graph authority

### Overlap
- All compile different types of graphs
- Similar patterns for graph construction
- canonical_graph_compiler.js and canonical_graph_authority.js have overlapping canonical graph logic

### Recommendation
**CONSOLIDATE**: Create unified GraphCompiler with strategy pattern for different graph types
**KEEP**: canonical_graph_authority.js (constitutional wrapper)
**DELETE**: canonical_graph_compiler.js (move logic into unified compiler)

### Migration Plan
1. Create unified GraphCompiler with strategy pattern
2. Migrate import_graph_compiler.js, call_graph_compiler.js, type_graph_compiler.js, build_graph_compiler.js
3. Delete canonical_graph_compiler.js
4. Keep canonical_graph_authority.js as constitutional wrapper

---

## Metadata Extraction

### Duplicates Found
- **metadata_extractor.js**: Metadata extractor
- **repository_fingerprinting.js**: Repository fingerprinting

### Overlap
- Both extract metadata from files/repositories
- repository_fingerprinting.js is specialized for git repositories

### Recommendation
**CONSOLIDATE**: Integrate repository_fingerprinting.js into metadata_extractor.js
**REPLACE WITH**: Unstructured (for base metadata)

### Migration Plan
1. Integrate repository_fingerprinting.js into metadata_extractor.js
2. Replace base metadata extraction with Unstructured
3. Keep constitutional provenance tracking only

---

## Embedding

### Duplicates Found
- **embedding_authority.js**: Embedding authority
- **embedding_provider.js**: Embedding provider abstraction
- **embedding_worker.js**: Embedding worker
- **embedding_batcher.js**: Embedding batcher
- **embedding_cache.js**: Embedding cache
- **ollama_adapter.js**: Ollama adapter (duplicate, see above)
- **ollama_provider.js**: Ollama provider (duplicate, see above)
- **ollama_provider_adapter.js**: Ollama provider adapter
- **inference_adapter.js**: Inference adapter
- **inference_authority.js**: Inference authority

### Overlap
- embedding_authority.js and inference_authority.js have overlapping embedding logic
- embedding_provider.js and ollama_provider_adapter.js both provide embedding abstraction

### Recommendation
**KEEP**: embedding_authority.js (constitutional authority)
**KEEP**: embedding_provider.js (provider abstraction)
**KEEP**: embedding_worker.js (worker logic)
**KEEP**: embedding_batcher.js (batching logic)
**KEEP**: embedding_cache.js (cache logic)
**CONSOLIDATE**: embedding_authority.js and inference_authority.js embedding logic
**DELETE**: ollama_adapter.js, ollama_provider.js (see above)

### Migration Plan
1. Consolidate embedding logic from inference_authority.js into embedding_authority.js
2. Keep embedding_provider.js as provider abstraction
3. Delete ollama_adapter.js and ollama_provider.js (see above)

---

## Summary

### High Priority Duplicates (Consolidate Immediately)
1. **Ollama adapters**: ollama_adapter.js, ollama_provider.js → delete, keep ollama_provider_adapter.js
2. **Adapters**: adapter_compiler_v2.js → delete, complete adapter_compiler.js
3. **Chunking**: semantic_chunker.js, multi_language_parser.js → delete, use treesitter_chunker.js
4. **Worker queues**: worker_queue.js, worker_pool.js, worker_scheduler.js, analysis_queue.js → consolidate

### Medium Priority Duplicates (Consolidate Soon)
1. **Replay**: transcript_only_replay_engine.js → consolidate into replay_engine.js
2. **Mission**: mission_authority.js, constitutional_mission_control.js → consolidate
3. **Reflection**: reflection_authority.js, constitutional_reflection_authority.js → consolidate
4. **Schedulers**: dependency_scheduler.js, constitutional_autonomous_scheduler.js → consolidate

### Low Priority Duplicates (Consolidate Later)
1. **Graph compilers**: Multiple graph compilers → create unified compiler
2. **Metadata**: metadata_extractor.js, repository_fingerprinting.js → consolidate
3. **Embedding**: embedding_authority.js, inference_authority.js → consolidate embedding logic

### Total Duplicates Found
- **Files to delete**: 5-7
- **Files to consolidate**: 15-20
- **Estimated reduction**: 20-30 files

### Risk Assessment
- **Low risk**: Deleting adapter_compiler_v2.js, semantic_chunker.js
- **Medium risk**: Consolidating worker queues, schedulers
- **High risk**: Consolidating replay authorities, graph compilers

### Recommendation
Start with low-risk consolidations (Ollama adapters, adapters, chunking). Move to medium-risk (worker queues, schedulers). Defer high-risk (replay, graph compilers) until Temporal integration is evaluated.
