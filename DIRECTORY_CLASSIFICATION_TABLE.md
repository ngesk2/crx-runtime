# DIRECTORY CLASSIFICATION TABLE

**Date**: 2026-06-20
**Purpose**: Classify every major directory in the PING repository by type
**Mode**: READ-ONLY - No modifications, no code changes, no file moves

---

## CLASSIFICATION DEFINITIONS

- **runtime_component**: Active runtime infrastructure required for system operation
- **source_code**: Human-readable source code that defines system behavior
- **integration**: External service integrations and adapters
- **metadata**: Data about data, configuration, and documentation
- **storage**: Persistent storage for runtime state and data
- **generated_output**: Automatically generated artifacts, exports, and build outputs
- **configuration**: Configuration files and settings
- **documentation**: Documentation and reference materials
- **governance**: Governance, constitutional, and policy definitions
- **experimental**: Experimental or placeholder infrastructure
- **placeholder**: Empty directories intended for future use

---

## DIRECTORY CLASSIFICATION TABLE

| Directory | Classification | Justification |
|-----------|---------------|---------------|
| constitution/ | governance | Constitutional laws, invariants, and authority models (VERIFIED) |
| runtime/ | runtime_component | Layer 1 validation infrastructure including replay engine (VERIFIED) |
| runtime/replay/ | runtime_component | TypeScript replay engine and verification (VERIFIED) |
| runtime/adapters/ | integration | Event adapters for external systems (VERIFIED) |
| runtime/kernel/ | runtime_component | Kernel services (OBSERVED - mostly empty) |
| gateway/ | runtime_component | HTTP gateway and event emission infrastructure (VERIFIED) |
| workers/ | configuration | Worker configuration files (YAML) (VERIFIED) |
| knowledge/ | governance | Knowledge fabric with authoritative, derived, and experimental knowledge (VERIFIED) |
| knowledge/authoritative/ | governance | Authoritative knowledge definitions (VERIFIED) |
| knowledge/derived/ | governance | Derived knowledge (VERIFIED) |
| knowledge/experimental/ | experimental | Experimental knowledge (VERIFIED) |
| vos/ | experimental | VOS infrastructure (OBSERVED - mostly empty) |
| vos/archive/ | storage | VOS archive storage (OBSERVED) |
| vos/cos/ | storage | VOS COS storage (OBSERVED) |
| vos/proposals/ | governance | VOS proposals (OBSERVED - mostly empty) |
| vos/viz/ | generated_output | VOS visualization (OBSERVED) |
| presentping/ | source_code | Presentation generation infrastructure (VERIFIED) |
| presentping/engine/ | source_code | V17 constitutional city renderer (VERIFIED) |
| presentping/config/ | configuration | Presentation configuration files (VERIFIED) |
| presentping/artifacts/ | generated_output | Generated presentation artifacts (VERIFIED) |
| presentping/metadata/ | metadata | Presentation metadata (VERIFIED) |
| presentping/exports/ | generated_output | PowerPoint exports (OBSERVED - empty) |
| brainos/ | source_code | Newsletter digestion, RSS ingestion, research synthesis (VERIFIED) |
| brainos/newsletter/ | source_code | Yahoo Mail ingestion and newsletter processing (VERIFIED) |
| brainos/newsletter/knowledge/ | storage | Markdown archives (VERIFIED) |
| brainos/newsletter/docs/ | documentation | Newsletter documentation (VERIFIED) |
| brainos/rss/ | source_code | RSS ingestion and processing (VERIFIED) |
| brainos/rss/knowledge/ | storage | Markdown archives (VERIFIED) |
| brainos/research/ | source_code | Research synthesis pipeline (VERIFIED) |
| brainos/research/reports/ | generated_output | Research reports (VERIFIED) |
| brainos/orchestration/ | source_code | Constitutional orchestration layer (VERIFIED) |
| brainos/orchestration/src/ | source_code | Orchestration source code (VERIFIED) |
| brainos/orchestration/docs/ | documentation | Orchestration documentation (VERIFIED) |
| brainos/orchestration/infrastructure/ | configuration | Infrastructure configuration (VERIFIED) |
| brainos/orchestration/external/ | integration | External integrations (VERIFIED) |
| brainos/orchestration/scripts/ | source_code | Orchestration scripts (VERIFIED) |
| brainos/agents/ | placeholder | Future agent infrastructure (OBSERVED - empty) |
| brainos/knowledge/ | placeholder | Future unified knowledge storage (OBSERVED - empty) |
| observation/ | placeholder | Observation infrastructure (OBSERVED - all directories empty) |
| observation/email/ | placeholder | Email observation (OBSERVED - empty) |
| observation/rss/ | placeholder | RSS observation (OBSERVED - empty) |
| observation/github/ | placeholder | GitHub observation (OBSERVED - empty) |
| observation/youtube/ | placeholder | YouTube observation (OBSERVED - empty) |
| observation/arxiv/ | placeholder | arXiv observation (OBSERVED - empty) |
| observation/documents/ | placeholder | Document observation (OBSERVED - empty) |
| observation/chat/ | placeholder | Chat observation (OBSERVED - empty) |
| observation/meetings/ | placeholder | Meeting observation (OBSERVED - empty) |
| integrations/ | integration | External integrations (VERIFIED) |
| integrations/ollama/ | integration | Ollama integration (VERIFIED) |
| integrations/ollama/gateway/ | source_code | Ollama gateway integration (VERIFIED) |
| integrations/ollama/workers/ | configuration | Ollama worker configuration (VERIFIED) |
| integrations/obsidian/ | placeholder | Obsidian integration (OBSERVED - empty) |
| integrations/github/ | placeholder | GitHub integration (OBSERVED - empty) |
| integrations/external/ | placeholder | External integrations (OBSERVED - empty) |
| artifacts/ | generated_output | Generated artifacts (OBSERVED - empty) |
| audit/ | documentation | Audit documentation (OBSERVED - empty) |
| database/ | storage | Database storage (OBSERVED - empty) |
| docs/ | documentation | Documentation (OBSERVED - empty) |
| infra/ | configuration | Infrastructure configuration (OBSERVED - empty) |
| kernel/ | placeholder | Kernel directory (OBSERVED - empty) |
| reports/ | generated_output | Reports (OBSERVED - empty) |
| workspace/ | configuration | Workspace configuration (OBSERVED - empty) |
| credentials/ | configuration | Credentials storage (VERIFIED) |
| CascadeProjects/ | documentation | CascadeProjects reference (VERIFIED) |
| .cursor/ | configuration | Cursor configuration (OBSERVED) |
| .docker/ | configuration | Docker configuration (OBSERVED) |
| .git/ | governance | Git repository (OBSERVED) |
| .github/ | governance | GitHub configuration (OBSERVED) |
| .vscode/ | configuration | VSCode configuration (OBSERVED) |
| node_modules/ | generated_output | Node.js dependencies (VERIFIED) |

---

## CLASSIFICATION SUMMARY

**Total Directories Classified**: 67

**By Classification Type:**
- runtime_component: 5 (7.5%)
- source_code: 11 (16.4%)
- integration: 5 (7.5%)
- metadata: 1 (1.5%)
- storage: 4 (6.0%)
- generated_output: 6 (9.0%)
- configuration: 8 (11.9%)
- documentation: 4 (6.0%)
- governance: 6 (9.0%)
- experimental: 2 (3.0%)
- placeholder: 15 (22.4%)

**Key Observations:**
- 22.4% of directories are placeholders (empty directories intended for future use)
- 16.4% of directories contain source code
- 7.5% of directories are runtime components
- 9.0% of directories are governance-related
- 9.0% of directories contain generated output

**High Priority for Governance:**
- constitution/ (governance) - Constitutional layer
- runtime/ (runtime_component) - Runtime infrastructure
- gateway/ (runtime_component) - Gateway infrastructure
- knowledge/ (governance) - Knowledge fabric

**High Priority for Cleanup:**
- observation/ (placeholder) - 8 empty placeholder directories
- integrations/obsidian/ (placeholder) - Empty
- integrations/github/ (placeholder) - Empty
- integrations/external/ (placeholder) - Empty
- brainos/agents/ (placeholder) - Empty
- brainos/knowledge/ (placeholder) - Empty
- kernel/ (placeholder) - Empty
