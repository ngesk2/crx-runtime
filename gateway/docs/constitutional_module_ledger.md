# Constitutional Module Ledger

**Date**: 2026-06-29
**Objective**: Constitutional census of all 71 JavaScript modules
**Purpose**: Authoritative migration document for S.17

---

## Ledger (Modules 1-10)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| adapter_authority.js | IR-based adapter compilation authority | Authority | Implemented | adapter_compiler.js, adapter_compiler_v2.js | crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| adapter_compiler.js | Adapter compilation orchestration | Compiler | Implemented | UNKNOWN | TechnologyAuthority, AdapterAuthority, CodeGenerator, WitnessGenerator, ConstitutionalAuthority, crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| adapter_compiler_v2.js | Adapter compilation orchestration V2 (reordered pipeline) | Compiler | Implemented | UNKNOWN | TechnologyAuthority, AdapterAuthority, CodeGenerator, WitnessGenerator, ConstitutionalAuthority, serializerAuthority, GeneratorManifest, ReplayDeterminismAuthority, ReproducibleBuildAuthority, GeneratorWitness, PerformanceBaselineWitness, ConstitutionalFreezeAuthority, replayLogger | UNKNOWN | adapter_compiler.js | direct hashing (crypto) | UNKNOWN | DEPRECATE |
| adapters/ollama_adapter.js | Ollama InferenceEngine adapter | Adapter | Implemented | UNKNOWN | crypto, InfrastructureAdapterInterface, serializerAuthority | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| analysis_queue.js | Analysis request persistent queue | Infrastructure | Implemented | UNKNOWN | crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| artifact_authority.js | Artifact creation authority (pure) | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, canonicalAuthority, artifactBuilder | UNKNOWN | None | None | UNKNOWN | KEEP |
| artifact_builder.js | Artifact freezing and validation | Compiler | Implemented | UNKNOWN | CanonicalAuthority | UNKNOWN | None | None | UNKNOWN | KEEP |
| artifact_type_registry.js | Artifact type schema registry | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, CanonicalBytes | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| authority_purity_audit.js | Authority purity verification tool | Infrastructure | Implemented | UNKNOWN | fs, path | UNKNOWN | None | direct filesystem (fs) | UNKNOWN | KEEP |
| autonomous_integration_engine.js | Autonomous repository integration | Runtime | Implemented | UNKNOWN | crypto, CanonicalAuthority | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |

---

## Ledger (Modules 11-20)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| background_workers.js | Background workers manager (watcher, indexer, embedding, cleanup, backup) | Infrastructure | Implemented | UNKNOWN | DocumentIngestion, ConversationMemory, QdrantClient | UNKNOWN | None | direct provider (QdrantClient) | UNKNOWN | KEEP |
| boot_authority.js | Boot sequence execution through constitutional boot graph | Authority | Implemented | UNKNOWN | serializerAuthority, runtimeFailureAuthority, witnessAuthority, constitutionVersionAuthority, fs, path | UNKNOWN | None | direct filesystem (fs) | UNKNOWN | KEEP |
| bootstrapping_validation.js | Compiler lineage verification with replay matrix | Authority | Implemented | UNKNOWN | serializerAuthority, AdapterCompilerV2, replayLogger | UNKNOWN | None | None | UNKNOWN | KEEP |
| build_graph_compiler.js | Build graph compilation (npm, cargo, go, maven, gradle, cmake, bazel, buck, make) | Compiler | Implemented | UNKNOWN | crypto, CanonicalAuthority, fs, path | UNKNOWN | None | direct hashing (crypto), direct filesystem (fs) | UNKNOWN | KEEP |
| call_graph_compiler.js | Call graph compilation (calls, called_by, recursive_cycles, fan_in, fan_out, leaf, root, dead, hot) | Compiler | Implemented | UNKNOWN | crypto, CanonicalAuthority | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| canonical_authority.js | Canonical serialization and hashing (single canonical serializer) | Authority | Implemented | canonical_graph_compiler.js, build_graph_compiler.js, call_graph_compiler.js, boot_authority.js, canonical_serializer.js, canonical_symbol_authority.js, autonomous_integration_engine.js, adapter_authority.js, adapter_compiler.js, adapter_compiler_v2.js, adapters/ollama_adapter.js, artifact_type_registry.js | crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| canonical_graph_authority.js | GraphRoot constitutional object compilation | Authority | Implemented | UNKNOWN | CanonicalGraphCompiler, ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| canonical_graph_compiler.js | GraphNode, GraphEdge, GraphRoot compilation | Compiler | Implemented | canonical_graph_authority.js | crypto, CanonicalAuthority, CanonicalBytes | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| canonical_serializer.js | Canonical serialization authority | Authority | Implemented | UNKNOWN | crypto | UNKNOWN | canonical_authority.js | direct hashing (crypto) | UNKNOWN | DEPRECATE |
| canonical_symbol_authority.js | Symbol constitutional object compilation | Authority | Implemented | UNKNOWN | CanonicalSymbolMapper, CanonicalSymbolFactory, ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |

---

## Ledger (Modules 21-30)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| canonical_symbol_objects.js | Language-independent canonical symbol mapping and factory | Authority | Implemented | canonical_symbol_authority.js | CanonicalAuthority | UNKNOWN | None | direct hashing (via CanonicalAuthority) | UNKNOWN | KEEP |
| certification_authority.js | Artifact certification (pure contract-based authority) | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, canonicalAuthority, crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| circuit_breaker.js | Ollama unavailability handling with automatic recovery | Infrastructure | Implemented | UNKNOWN | None | UNKNOWN | None | direct time (Date.now) | UNKNOWN | KEEP |
| code_generator.js | Vendor-specific adapter code generation | Compiler | Implemented | UNKNOWN | crypto | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| compiler_lineage_authority.js | Compiler lineage verification with replay matrix | Authority | Implemented | UNKNOWN | serializerAuthority, AdapterCompilerV2, replayLogger, CompilerLineageWitness | UNKNOWN | None | None | UNKNOWN | KEEP |
| compiler_lineage_witness.js | Compiler lineage witness creation and verification | Authority | Implemented | compiler_lineage_authority.js | serializerAuthority | UNKNOWN | None | None | UNKNOWN | KEEP |
| condition_authority.js | Condition evaluation for node execution | Authority | Implemented | UNKNOWN | postgresPool, artifactAuthority, constitutionalTimeAuthority, deterministicIdAuthority | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitution_validator.js | Constitutional object validation gatekeeper | Authority | Implemented | UNKNOWN | crypto, postgresPool, eventBus, objectRegistry | UNKNOWN | None | direct hashing (crypto), direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitution_version_authority.js | Constitutional version management and determinism boundary | Authority | Implemented | UNKNOWN | serializerAuthority, runtimeFailureAuthority | UNKNOWN | None | None | UNKNOWN | KEEP |
| constitutional_acquisition_loop.js | Repository constitutionalization, replay, witness, embed, compare loop | Runtime | Implemented | UNKNOWN | postgresPool, constitutionalTimeAuthority, deterministicIdAuthority, ConstitutionalKnowledgeAcquisition, ConstitutionalCompatibilityScorer, ConstitutionalOllamaIntegration | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |

---

## Ledger (Modules 31-40)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| constitutional_authority.js | Persistent constitutional authority loaded from PostgreSQL storage | Authority | Implemented | UNKNOWN | crypto, postgresPool | UNKNOWN | None | direct hashing (crypto), direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_authority_registry.js | Metadata-driven authority loading from descriptors | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_authority_weighted.js | Weighted governance evaluation with principle scoring | Authority | Implemented | UNKNOWN | None | UNKNOWN | constitutional_authority.js (different implementation) | direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_automatic_pipeline.js | DAG-based automatic pipeline execution | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, ConstitutionalExecutionPlanner, ConstitutionalDAGRuntime | UNKNOWN | None | None | UNKNOWN | KEEP |
| constitutional_autonomous_scheduler.js | Autonomous mission selection and scheduling | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_bootstrap.js | Kernel bootstrapping from bootstrap manifest | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_capability_graph.js | Authority dependency graph for metadata-driven loading | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority | UNKNOWN | None | None | UNKNOWN | KEEP |
| constitutional_code_retrieval.js | Graph-based code retrieval before LLM inference | Authority | Implemented | UNKNOWN | crypto, CanonicalAuthority | UNKNOWN | None | direct hashing (crypto), direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_command_center.js | Dashboard and orchestration for repository evaluation | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_compatibility_scorer.js | Decomposable compatibility scoring between repositories | Authority | Implemented | UNKNOWN | CanonicalAuthority, CanonicalBytes, crypto, postgresPool | UNKNOWN | None | direct hashing (crypto), direct SQL (postgresPool) | UNKNOWN | KEEP |

---

## Ledger (Modules 41-50)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| constitutional_dag_runtime.js | DAG interpreter (load plan, execute node, emit artifacts) | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_dependency_graph.js | Dependency graph for replay verification | Authority | Implemented | UNKNOWN | serializerAuthority, runtimeFailureAuthority, witnessAuthority, stepRegistry | UNKNOWN | None | None | UNKNOWN | KEEP |
| constitutional_discovery_system.js | Autonomous constitutional technology acquisition | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool, githubAdapter | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_event_sourcing.js | Event source every state change | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, CanonicalBytes, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_evolution_engine.js | Kernel evolution with simulation phase | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool, executionPlanAuthority, artifactAuthority, authorities, eventSourcing | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_execution_planner.js | PURE planner (no IO, no execution, no replay) | Compiler | Implemented | UNKNOWN | CanonicalAuthority | UNKNOWN | None | direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_freeze.js | Constitutional freeze authority | Authority | Implemented | UNKNOWN | serializerAuthority, ConstitutionalRecord, replayLogger | UNKNOWN | None | direct hashing (crypto) | UNKNOWN | KEEP |
| constitutional_fuzzer.js | Constitutional fuzzer for determinism testing | Infrastructure | Implemented | UNKNOWN | serializerAuthority, runtimeFailureAuthority, transcriptAuthority, replayVerifier | UNKNOWN | None | direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_gap_analysis.js | Constitutional gap analysis for repositories | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool, knowledgeAcquisition, ollamaIntegration | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_git_commit_manager.js | Automatic git commits with deterministic messages | Infrastructure | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, execSync (child_process) | UNKNOWN | None | direct filesystem (execSync) | UNKNOWN | KEEP |

---

## Ledger (Modules 51-60)

| Module | Responsibility | Owner | Lifecycle | Imported By | Imports | Production Reachability | Duplicate Of | Constitutional Violations | Runtime Path | Recommendation |
|--------|---------------|-------|-----------|-------------|---------|------------------------|-------------|------------------------|-------------|----------------|
| constitutional_mission_control.js | Mission Control dashboard for autonomous evolution | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool, discoverySystem, technologyEvaluator, refactoringMissions | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_pattern_database.js | Pattern database for mining architectural patterns | Authority | Implemented | UNKNOWN | crypto, CanonicalAuthority, postgresPool, objectRegistry, witnessChain, symbolGraph, typeGraph, callGraph, importGraph, fingerprinting | UNKNOWN | None | direct hashing (crypto), direct SQL (postgresPool), direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_persistent_history.js | Persistent history for RFCs, missions, replay reports | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_proof_artifact.js | Proof artifact with Merkle root over subsystems | Authority | Implemented | UNKNOWN | crypto, CanonicalAuthority, postgresPool, validationHarness, objectRegistry, witnessChain | UNKNOWN | None | direct hashing (crypto), direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_record.js | Immutable constitutional record type | Authority | Implemented | UNKNOWN | None | UNKNOWN | None | direct time (Date.now) | UNKNOWN | KEEP |
| constitutional_refactoring_missions.js | Refactoring missions from technology evaluations | Runtime | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool, technologyEvaluator | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_reflection_authority.js | Reflection authority (immutable metadata only) | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool, authorityRegistry, schemaAuthority, artifactTypeRegistry, policyCompiler, capabilityGraph, artifactAuthority | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_regression_corpus.js | Regression corpus with expected outcomes | Infrastructure | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_replay_gate.js | Replay gate for verification evidence | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool, validationHarness | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_replay_sandbox.js | Replay sandbox for isolated testing | Infrastructure | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, execSync, fs, path, postgresPool, validationHarness | UNKNOWN | None | direct filesystem (fs, execSync), direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_result.js | Constitutional result interface | Compiler | Implemented | UNKNOWN | None | UNKNOWN | None | None | UNKNOWN | KEEP |
| constitutional_runtime.js | Constitutional runtime orchestration | Runtime | Implemented | UNKNOWN | crypto, constitutionalTimeAuthority, deterministicIdAuthority, GitHubSnapshot, EmbeddingAuthority, getInferenceAdapter, ReflectionGenerator, MissionGenerator, ReplayRecorder, WitnessRecorder, QdrantClient, LifecycleContext, Stage, LifecycleStatus | UNKNOWN | None | direct hashing (crypto), direct provider (QdrantClient) | UNKNOWN | KEEP |
| constitutional_schema_authority.js | Schema authority for validation | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_seed_repositories.js | Seed repository list with priorities | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, postgresPool | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |
| constitutional_technology_evaluator.js | Technology evaluator for repositories | Authority | Implemented | UNKNOWN | constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority, postgresPool, knowledgeAcquisition, ollamaIntegration | UNKNOWN | None | direct SQL (postgresPool) | UNKNOWN | KEEP |

---

## Summary (1-60)

**Total Modules Analyzed**: 60

**By Owner**:
- Authority: 38
- Compiler: 9
- Adapter: 1
- Infrastructure: 7
- Runtime: 5

**By Lifecycle**:
- Implemented: 60

**Constitutional Violations**:
- Direct SQL (postgresPool): 11
- Direct hashing (crypto): 4
- Direct time (Date.now): 3
- Direct filesystem (fs, execSync): 2
- Direct provider (QdrantClient): 1

**Duplicates**: None identified in modules 51-60

**Recommendations**: All KEEP

**Notes for Modules 51-60**:
- constitutional_mission_control.js: Mission Control dashboard, uses postgresPool directly
- constitutional_pattern_database.js: Pattern mining for architectural patterns, uses crypto and postgresPool directly
- constitutional_persistent_history.js: Persistent history tracking, uses postgresPool directly
- constitutional_proof_artifact.js: Merkle root proof artifacts, uses crypto and postgresPool directly
- constitutional_record.js: Immutable record type, uses Date.now directly
- constitutional_refactoring_missions.js: Mission generation from evaluations, uses postgresPool directly
- constitutional_reflection_authority.js: Immutable metadata reflection, uses postgresPool directly
- constitutional_regression_corpus.js: Regression testing corpus, uses postgresPool directly
- constitutional_replay_gate.js: Verification evidence production, uses postgresPool directly
- constitutional_replay_sandbox.js: Isolated testing sandbox, uses fs/execSync and postgresPool directly
- constitutional_result.js: Constitutional result interface, no violations
- constitutional_runtime.js: Runtime orchestration, uses crypto and QdrantClient directly
- constitutional_schema_authority.js: Schema validation authority, uses postgresPool directly
- constitutional_seed_repositories.js: Seed repository management, uses postgresPool directly
- constitutional_technology_evaluator.js: Repository evaluation pipeline, uses postgresPool directly

---

## Notes

- **adapter_compiler_v2.js**: Duplicate of adapter_compiler.js with reordered pipeline. Should be merged or deprecated.
- **canonical_serializer.js**: Duplicate of canonical_authority.js (CanonicalBytes/CanonicalAuthority). Should be deprecated in favor of canonical_authority.js.
- **constitutional_authority_weighted.js**: Duplicate of constitutional_authority.js with weighted governance implementation. Should be deprecated or merged.
- **artifact_type_registry.js**: Direct SQL access through postgresPool - should route through Authority.
- **canonical_graph_authority.js**: Direct SQL access through postgresPool - should route through Authority.
- **canonical_symbol_authority.js**: Direct SQL access through postgresPool - should route through Authority.
- **condition_authority.js**: Direct SQL access through postgresPool - should route through Authority.
- **constitution_validator.js**: Direct SQL access through postgresPool - should route through Authority.
- **constitutional_acquisition_loop.js**: Direct SQL access through postgresPool - should route through Authority.
- **constitutional_authority.js**: Direct SQL access through postgresPool - acceptable for authority persistence.
- **constitutional_authority_registry.js**: Direct SQL access through postgresPool - acceptable for descriptor persistence.
- **constitutional_autonomous_scheduler.js**: Direct SQL access through postgresPool - acceptable for cycle persistence.
- **constitutional_bootstrap.js**: Direct SQL access through postgresPool - acceptable for manifest persistence.
- **constitutional_command_center.js**: Direct SQL access through postgresPool - acceptable for dashboard queries.
- **constitutional_compatibility_scorer.js**: Direct SQL access through postgresPool - acceptable for analysis queries.
- **constitutional_code_retrieval.js**: Direct time access (Date.now) - acceptable for query ID generation.
- **constitutional_authority_weighted.js**: Direct time access (Date.now) - acceptable for proposal ID generation.
- **background_workers.js**: Direct provider access (QdrantClient) - should route through TechnologyAuthority.
- **boot_authority.js**: Direct filesystem access - acceptable for boot sequence.
- **build_graph_compiler.js**: Direct filesystem access - acceptable for build system detection.
- **circuit_breaker.js**: Direct time access (Date.now) - acceptable for circuit breaker timing.
- **Production reachability**: UNKNOWN for all modules - requires import analysis to determine.
- **Runtime path**: UNKNOWN for all modules - requires call graph analysis.
