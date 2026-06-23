# DIRECTORY CLASSIFICATION

**Date:** 2026-06-20
**Purpose:** Classify every major directory by type
**Classification Types:**
- runtime_component: Runtime execution infrastructure
- source_code: Source code files
- integration: External system integrations
- metadata: Metadata and configuration files
- storage: Data storage and databases
- generated_output: Generated artifacts and exports
- configuration: Configuration files
- documentation: Documentation files
- governance: Governance and constitutional documents
- experimental: Experimental features
- placeholder: Empty placeholder directories

---

## TOP-LEVEL DIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| constitution/ | governance | Constitutional layer defining Layer 0 metadata and governance laws |
| runtime/ | runtime_component | Layer 1 validation infrastructure including replay, kernel services, and event adapters |
| gateway/ | runtime_component | Event emission and Ollama integration gateway |
| workers/ | configuration | Worker configuration files for various PING services |
| knowledge/ | governance | Knowledge fabric with authoritative, derived, and experimental knowledge |
| vos/ | governance | VOS infrastructure for governance, proposals, visualization, and archiving |
| presentping/ | source_code | PowerPoint presentation generation using V17 constitutional city renderer |
| brainos/ | source_code | Newsletter digestion, RSS ingestion, research synthesis, and orchestration |
| observation/ | placeholder | Observation infrastructure placeholders (all directories empty) |
| integrations/ | integration | External integrations including Ollama, Obsidian, GitHub |
| artifacts/ | generated_output | Generated artifacts (empty) |
| audit/ | documentation | Audit documentation (empty) |
| docs/ | documentation | Documentation (empty) |
| infra/ | placeholder | Infrastructure (empty) |
| kernel/ | placeholder | Kernel (empty) |
| reports/ | generated_output | Reports (empty) |
| workspace/ | placeholder | Workspace (empty) |
| database/ | storage | Database storage (empty) |
| credentials/ | storage | Credentials storage (empty) |
| .cursor/ | configuration | Cursor IDE configuration |
| .docker/ | configuration | Docker configuration |
| .github/ | configuration | GitHub configuration |
| .vscode/ | configuration | VSCode configuration |
| node_modules/ | generated_output | Node.js dependencies (generated) |

---

## CONSTITUTION SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| constitution/ | governance | Constitutional documents (11 markdown files) |

---

## RUNTIME SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| runtime/replay/ | runtime_component | TypeScript replay infrastructure |
| runtime/kernel/ | placeholder | Kernel services (empty except commit-service/) |
| runtime/kernel/commit-service/ | placeholder | Commit service (empty) |
| runtime/adapters/ | runtime_component | Event adapters (TypeScript) |
| runtime/replay/__tests__/ | generated_output | Test files |
| runtime/replay/corpus/ | generated_output | Replay corpus |
| runtime/replay/forensics/ | generated_output | Forensics artifacts |
| runtime/replay/utils/ | source_code | Utility functions |

---

## GATEWAY SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| gateway/ | runtime_component | Event emission and Ollama integration gateway |
| gateway/node_modules/ | generated_output | Node.js dependencies (generated) |

---

## WORKERS SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| workers/ | configuration | Worker configuration files (5 YAML files) |

---

## KNOWLEDGE SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| knowledge/ | governance | Knowledge fabric |
| knowledge/authoritative/ | governance | Authoritative knowledge (37 markdown files, 2 JSON files) |
| knowledge/derived/ | governance | Derived knowledge (70 markdown files) |
| knowledge/experimental/ | experimental | Experimental knowledge (3 markdown files) |

---

## VOS SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| vos/ | governance | VOS infrastructure |
| vos/archive/ | storage | Archive storage |
| vos/cos/ | governance | COS governance framework |
| vos/proposals/ | governance | Proposals (mostly empty) |
| vos/viz/ | governance | Visualization framework |

---

## PRESENTPING SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| presentping/ | source_code | PowerPoint presentation generation |
| presentping/engine/ | source_code | V17 constitutional city renderer (9 JavaScript files) |
| presentping/engine/v17-artifacts/ | generated_output | V17 artifacts |
| presentping/config/ | configuration | Configuration files (32 JavaScript files) |
| presentping/artifacts/ | generated_output | Artifacts (5 JSON files) |
| presentping/metadata/ | metadata | Metadata files (3 JSON files) |
| presentping/exports/ | generated_output | PowerPoint exports (empty) |

---

## BRAINOS SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| brainos/ | source_code | Newsletter digestion, RSS ingestion, research synthesis, orchestration |
| brainos/newsletter/ | source_code | Newsletter processing (144 files) |
| brainos/newsletter/__pycache__/ | generated_output | Python cache (generated) |
| brainos/newsletter/knowledge/ | storage | Knowledge storage (markdown archives) |
| brainos/newsletter/docs/ | documentation | Documentation |
| brainos/rss/ | source_code | RSS ingestion (23 files) |
| brainos/rss/__pycache__/ | generated_output | Python cache (generated) |
| brainos/rss/knowledge/ | storage | Knowledge storage (markdown archives) |
| brainos/research/ | source_code | Research synthesis (2 files) |
| brainos/research/reports/ | generated_output | Research reports |
| brainos/orchestration/ | source_code | Orchestration layer (121 files) |
| brainos/orchestration/config/ | configuration | Configuration |
| brainos/orchestration/constitutional/ | governance | Constitutional orchestration |
| brainos/orchestration/data/ | storage | Data storage |
| brainos/orchestration/docs/ | documentation | Documentation |
| brainos/orchestration/external/ | integration | External integrations |
| brainos/orchestration/infrastructure/ | runtime_component | Infrastructure |
| brainos/orchestration/logs/ | generated_output | Logs |
| brainos/orchestration/scripts/ | source_code | Scripts |
| brainos/orchestration/services/ | runtime_component | Services |
| brainos/orchestration/src/ | source_code | Source code |
| brainos/orchestration/storage/ | storage | Storage |
| brainos/agents/ | placeholder | Agent infrastructure (empty) |
| brainos/knowledge/ | placeholder | Unified knowledge storage (empty) |

---

## OBSERVATION SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| observation/ | placeholder | Observation infrastructure (all directories empty) |
| observation/email/ | placeholder | Email ingestion (empty) |
| observation/rss/ | placeholder | RSS ingestion (empty) |
| observation/github/ | placeholder | GitHub ingestion (empty) |
| observation/youtube/ | placeholder | YouTube ingestion (empty) |
| observation/arxiv/ | placeholder | arXiv ingestion (empty) |
| observation/documents/ | placeholder | Document ingestion (empty) |
| observation/chat/ | placeholder | Chat ingestion (empty) |
| observation/meetings/ | placeholder | Meeting ingestion (empty) |

---

## INTEGRATIONS SUBDIRECTORIES

| Directory | Classification | Justification |
|----------|---------------|---------------|
| integrations/ | integration | External integrations |
| integrations/ollama/ | integration | Ollama integration |
| integrations/ollama/gateway/ | runtime_component | Ollama gateway |
| integrations/ollama/workers/ | configuration | Ollama worker configuration |
| integrations/obsidian/ | placeholder | Obsidian integration (empty) |
| integrations/github/ | placeholder | GitHub integration (empty) |
| integrations/external/ | placeholder | External integrations (empty) |

---

## CLASSIFICATION SUMMARY

**Total Directories Classified:** 70+

**By Classification Type:**
- governance: 14 (constitution, knowledge, vos, and subdirectories)
- runtime_component: 10 (runtime, gateway, adapters, orchestration services)
- source_code: 12 (presentping, brainos, and subdirectories)
- integration: 4 (integrations and subdirectories)
- metadata: 1 (presentping/metadata/)
- storage: 7 (vos/archive, brainos knowledge, orchestration storage)
- generated_output: 12 (node_modules, __pycache__, artifacts, exports, reports)
- configuration: 8 (workers, presentping/config, orchestration config, IDE configs)
- documentation: 5 (docs, orchestration docs)
- experimental: 1 (knowledge/experimental/)
- placeholder: 15 (kernel, observation/*, integrations/*, brainos/agents, brainos/knowledge)

---

## CRITICAL OBSERVATIONS

**High Governance Density:**
- constitution/, knowledge/, vos/ are all governance-classified
- This indicates strong constitutional layer presence

**Runtime Component Distribution:**
- runtime/ contains the core runtime components
- gateway/ is a runtime component (event emission gateway)
- orchestration/services/ contains runtime components

**Generated Content Locations:**
- node_modules/ (gateway/)
- __pycache__/ (brainos/newsletter/, brainos/rss/)
- artifacts/ (presentping/)
- exports/ (presentping/)
- reports/ (brainos/research/)

**Placeholder Density:**
- observation/ has 8 placeholder directories
- integrations/ has 3 placeholder directories
- brainos/ has 2 placeholder directories (agents/, knowledge/)
- This indicates incomplete infrastructure

**Storage Fragmentation:**
- SQLite databases in brainos/newsletter/ and brainos/rss/
- Markdown knowledge archives in brainos/newsletter/knowledge/ and brainos/rss/knowledge/
- No unified storage location
