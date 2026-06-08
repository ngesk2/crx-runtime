# REPOSITORY_STRUCTURE_AUDIT_V2

**Audit Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** CRX contains 350+ files across 10 major directories.

**FACT:** Files are mixed across constitutional, runtime, generated, legacy, and scaffold categories.

**FACT:** No clear authority boundary separation exists.

**FACT:** Multiple duplicate systems exist (CascadeProjects, constitutional-integration-lab, ai-stack).

**INFERENCE:** Repository consolidation is required before infrastructure implementation.

---

## PHASE 1: Full Repository Inventory

### CRX Root Files

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| AGENT.md | AUTHORITATIVE | Constitutional | constitutional/AGENT.md |
| AUTHORITY_CONFLICT_REPORT.md | GENERATED | Audit | reports/generated/ |
| CRX_CONSTITUTION.md | AUTHORITATIVE | Constitutional | constitutional/CRX_CONSTITUTION.md |
| EXECUTION_REALITY_REPORT.md | GENERATED | Audit | reports/generated/ |
| FILE_INVENTORY.md | GENERATED | Audit | reports/generated/ |
| REPOSITORY_PROVENANCE_MAP.md | GENERATED | Audit | reports/generated/ |
| VERIFIED_EXISTING_FILES.md | GENERATED | Audit | reports/generated/ |
| VERIFIED_RUNTIME_ENTRYPOINTS.md | GENERATED | Audit | reports/generated/ |

**Total:** 8 files

**Classification:** 2 AUTHORITATIVE, 6 GENERATED

---

### agents/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| agents/Dockerfile | SCAFFOLD | Agents | agents/templates/Dockerfile |
| agents/Dockerfile.documentation | SCAFFOLD | Agents | agents/templates/Dockerfile.documentation |
| agents/Dockerfile.governance | SCAFFOLD | Agents | agents/templates/Dockerfile.governance |
| agents/Dockerfile.planner | SCAFFOLD | Agents | agents/templates/Dockerfile.planner |
| agents/Dockerfile.refactor | SCAFFOLD | Agents | agents/templates/Dockerfile.refactor |
| agents/agent_permissions.md | AUTHORITATIVE | Constitutional | agents/permissions/agent_permissions.md |
| agents/crx_workspace_indexer.ps1 | SCAFFOLD | Agents | agents/runtime/crx_workspace_indexer.ps1 |
| agents/crx_workspace_indexer.py | SCAFFOLD | Agents | agents/runtime/crx_workspace_indexer.py |
| agents/docker-compose.yml | SCAFFOLD | Agents | agents/templates/docker-compose.yml |
| agents/implement_authority_reduction.ps1 | SCAFFOLD | Agents | agents/runtime/implement_authority_reduction.ps1 |
| agents/requirements.txt | SCAFFOLD | Agents | agents/templates/requirements.txt |

**Total:** 11 files

**Classification:** 1 AUTHORITATIVE, 10 SCAFFOLD

---

### inventory/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| inventory/authority-conflicts-v2.md | GENERATED | Audit | reports/generated/ |
| inventory/authority-map.md | GENERATED | Audit | reports/generated/ |
| inventory/infrastructure-sovereignty-report.md | GENERATED | Audit | reports/generated/ |
| inventory/infrastructure.md | GENERATED | Audit | reports/generated/ |
| inventory/ingestion-gap-report.md | GENERATED | Audit | reports/generated/ |
| inventory/ingestion-readiness.md | GENERATED | Audit | reports/generated/ |
| inventory/knowledge.md | GENERATED | Audit | reports/generated/ |
| inventory/readiness-report.md | GENERATED | Audit | reports/generated/ |
| inventory/replay-boundary.md | GENERATED | Audit | reports/generated/ |
| inventory/replay-readiness-gap-analysis.md | GENERATED | Audit | reports/generated/ |
| inventory/repositories.md | GENERATED | Audit | reports/generated/ |
| inventory/runtime-boundary-report.md | GENERATED | Audit | reports/generated/ |
| inventory/runtime-readiness.md | GENERATED | Audit | reports/generated/ |
| inventory/shadow-system-map.md | GENERATED | Audit | reports/generated/ |

**Total:** 14 files

**Classification:** 14 GENERATED

---

### reports/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| reports/AUDIT_OF_AUDITS.md | GENERATED | Audit | reports/generated/ |
| reports/AUTHORITY_EQUIVALENCE_MATRIX.md | GENERATED | Audit | reports/generated/ |
| reports/AUTHORITY_MIGRATION_GRAPH.md | GENERATED | Audit | reports/generated/ |
| reports/AUTHORITY_REUSE_MATRIX.md | GENERATED | Audit | reports/generated/ |
| reports/BEHAVIORAL_DIFFERENTIAL_REPORT.md | GENERATED | Audit | reports/generated/ |
| reports/CANONICAL_INFRA_REMEDIATION_PLAN.md | GENERATED | Audit | reports/generated/ |
| reports/CONSTITUTIONAL_CONFLICT_MATRIX.md | GENERATED | Audit | reports/generated/ |
| reports/CONSTITUTIONAL_PRIORITY_QUEUE.md | GENERATED | Audit | reports/generated/ |
| reports/FINAL_FORENSIC_VERDICT.md | GENERATED | Audit | reports/generated/ |
| reports/INFRA_GAP_REPORT.md | GENERATED | Audit | reports/generated/ |
| reports/KERNEL_MINIMIZATION_REPORT.md | GENERATED | Audit | reports/generated/ |
| reports/REPLACEMENT_SAFETY_MATRIX.md | GENERATED | Audit | reports/generated/ |
| reports/REPLAY_GAP_REPORT.md | GENERATED | Audit | reports/generated/ |
| reports/ROADMAP_TRACEABILITY_MATRIX.md | GENERATED | Audit | reports/generated/ |
| reports/archive_to_runtime_mapping.md | GENERATED | Audit | reports/generated/ |
| reports/authority-conflicts-v2.md | GENERATED | Audit | reports/generated/ |
| reports/authority_boundary_violations.md | GENERATED | Audit | reports/generated/ |
| reports/authority_classification_map.md | GENERATED | Audit | reports/generated/ |
| reports/constitutional-authority-reconciliation.md | GENERATED | Audit | reports/generated/ |
| reports/constitutional_relevance_map.md | GENERATED | Audit | reports/generated/ |
| reports/continuity_breaks.md | GENERATED | Audit | reports/generated/ |
| reports/duplicate_authority_systems.md | GENERATED | Audit | reports/generated/ |
| reports/event_substrate_forensics.md | GENERATED | Audit | reports/generated/ |
| reports/floating_module_inventory.md | GENERATED | Audit | reports/generated/ |
| reports/historical_strata_registry.md | GENERATED | Audit | reports/generated/ |
| reports/infrastructure-sovereignty-report.md | GENERATED | Audit | reports/generated/ |
| reports/infrastructure_reality_audit.md | GENERATED | Audit | reports/generated/ |
| reports/ingestion-gap-report.md | GENERATED | Audit | reports/generated/ |
| reports/local_corpus_topology.md | GENERATED | Audit | reports/generated/ |
| reports/master_corpus_inventory.md | GENERATED | Audit | reports/generated/ |
| reports/mergeability-report.md | GENERATED | Audit | reports/generated/ |
| reports/orphaned_modules.md | GENERATED | Audit | reports/generated/ |
| reports/pre_infra_constitutional_freeze.md | GENERATED | Audit | reports/generated/ |
| reports/provenance-report.md | GENERATED | Audit | reports/generated/ |
| reports/replay-readiness-gap-analysis.md | GENERATED | Audit | reports/generated/ |
| reports/replay_capability_matrix.md | GENERATED | Audit | reports/generated/ |
| reports/replay_critical_authority_map.md | GENERATED | Audit | reports/generated/ |
| reports/replay_truth_audit.md | GENERATED | Audit | reports/generated/ |
| reports/runtime-boundary-report.md | GENERATED | Audit | reports/generated/ |
| reports/shadow-system-map.md | GENERATED | Audit | reports/generated/ |
| reports/sovereignty-gap-report.md | GENERATED | Audit | reports/generated/ |

**Total:** 41 files

**Classification:** 41 GENERATED

---

### knowledge/ Directory (Sub-repo: master)

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| knowledge/.gitignore | SCAFFOLD | Git | knowledge/.gitignore |
| knowledge/README.md | DERIVED | Knowledge | knowledge/README.md |
| knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md | AUTHORITATIVE | Constitutional | knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md |
| knowledge/authoritative/claim-decision-model-v0.1.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/claim-decision-model-v0.1.md |
| knowledge/authoritative/claim-lifecycle-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/claim-lifecycle-model.md |
| knowledge/authoritative/claim.schema.json | AUTHORITATIVE | Knowledge | knowledge/authoritative/claim.schema.json |
| knowledge/authoritative/constitutional-agent-infrastructure.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-agent-infrastructure.md |
| knowledge/authoritative/constitutional-attention-runtime.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-attention-runtime.md |
| knowledge/authoritative/constitutional-computation-pipeline-v0.1.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-computation-pipeline-v0.1.md |
| knowledge/authoritative/constitutional-database-spec.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-database-spec.md |
| knowledge/authoritative/constitutional-governance-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-governance-model.md |
| knowledge/authoritative/constitutional-knowledge-graph-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-knowledge-graph-model.md |
| knowledge/authoritative/constitutional-media-infrastructure.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-media-infrastructure.md |
| knowledge/authoritative/constitutional-mutation-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-mutation-model.md |
| knowledge/authoritative/constitutional-narrative-runtime.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-narrative-runtime.md |
| knowledge/authoritative/constitutional-rule-system-v0.1.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-rule-system-v0.1.md |
| knowledge/authoritative/constitutional-runtime-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-runtime-model.md |
| knowledge/authoritative/constitutional-runtime-objects.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-runtime-objects.md |
| knowledge/authoritative/constitutional-state-hash-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-state-hash-model.md |
| knowledge/authoritative/constitutional-threat-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-threat-model.md |
| knowledge/authoritative/constitutional-verdict.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/constitutional-verdict.md |
| knowledge/authoritative/decision-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/decision-reconstruction.md |
| knowledge/authoritative/decision.schema.json | AUTHORITATIVE | Knowledge | knowledge/authoritative/decision.schema.json |
| knowledge/authoritative/distributed-constitutional-sync.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/distributed-constitutional-sync.md |
| knowledge/authoritative/evaluator-upgrade-protocol.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/evaluator-upgrade-protocol.md |
| knowledge/authoritative/fact-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/fact-reconstruction.md |
| knowledge/authoritative/meaning-continuity-final-verdict.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/meaning-continuity-final-verdict.md |
| knowledge/authoritative/minimal-kernel-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/minimal-kernel-reconstruction.md |
| knowledge/authoritative/missing-primitive-analysis.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/missing-primitive-analysis.md |
| knowledge/authoritative/mutation-governance-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/mutation-governance-model.md |
| knowledge/authoritative/persistence-constitution.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/persistence-constitution.md |
| knowledge/authoritative/primitive-compression.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/primitive-compression.md |
| knowledge/authoritative/primitive-minimum-proof.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/primitive-minimum-proof.md |
| knowledge/authoritative/replay-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/replay-reconstruction.md |
| knowledge/authoritative/rule-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/rule-reconstruction.md |
| knowledge/authoritative/semantic-lineage-final-verdict.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/semantic-lineage-final-verdict.md |
| knowledge/authoritative/semantic-threat-model.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/semantic-threat-model.md |
| knowledge/authoritative/vos-reconstruction.md | AUTHORITATIVE | Knowledge | knowledge/authoritative/vos-reconstruction.md |
| knowledge/authority-legitimacy-audit.md | DERIVED | Knowledge | knowledge/derived/authority-legitimacy-audit.md |
| knowledge/authority-reconstruction.md | DERIVED | Knowledge | knowledge/derived/authority-reconstruction.md |
| knowledge/derived/* (50+ files) | DERIVED | Knowledge | knowledge/derived/* |
| knowledge/experimental/* (3 files) | DERIVED | Knowledge | knowledge/experimental/* |
| knowledge/inventory.json | DERIVED | Knowledge | knowledge/derived/inventory.json |

**Total:** 89 files

**Classification:** 42 AUTHORITATIVE, 46 DERIVED, 1 SCAFFOLD

---

### vos/ Directory (Sub-repo: main)

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| vos/.gitignore | SCAFFOLD | Git | vos/.gitignore |
| vos/README.md | DERIVED | VOS | vos/README.md |
| vos/archive/manifest.json | DERIVED | VOS | vos/archive/manifest.json |
| vos/cos/* (68 files) | AUTHORITATIVE | Constitutional | vos/cos/* |
| vos/proposals/* (13 files) | DERIVED | VOS | vos/proposals/* |
| vos/viz/* (68 files) | DERIVED | VOS | vos/viz/* |

**Total:** 68 files

**Classification:** 68 AUTHORITATIVE (COS), DERIVED (proposals, viz)

---

### runtime/ Directory (Sub-repo: audit-hardening)

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| runtime/.gitignore | SCAFFOLD | Git | runtime/.gitignore |
| runtime/README.md | DERIVED | Runtime | runtime/README.md |
| runtime/kernel/commit-service/package.json | RUNTIME | Runtime | runtime/kernel/commit-service/package.json |
| runtime/kernel/commit-service/package-lock.json | RUNTIME | Runtime | runtime/kernel/commit-service/package-lock.json |
| runtime/kernel/commit-service/tsconfig.json | RUNTIME | Runtime | runtime/kernel/commit-service/tsconfig.json |
| runtime/kernel/commit-service/src/api/audit_controller.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/api/audit_controller.ts |
| runtime/kernel/commit-service/src/api/commit_controller.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/api/commit_controller.ts |
| runtime/kernel/commit-service/src/engines/canonical_engine.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/engines/canonical_engine.ts |
| runtime/kernel/commit-service/src/engines/identity_engine.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/engines/identity_engine.ts |
| runtime/kernel/commit-service/src/events/event_log.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/events/event_log.ts |
| runtime/kernel/commit-service/src/persistence/artifact_store.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/persistence/artifact_store.ts |
| runtime/kernel/commit-service/src/persistence/db.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/persistence/db.ts |
| runtime/kernel/commit-service/src/persistence/ledger_schema.sql | RUNTIME | Runtime | runtime/kernel/commit-service/src/persistence/ledger_schema.sql |
| runtime/kernel/commit-service/src/persistence/lineage_store.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/persistence/lineage_store.ts |
| runtime/kernel/commit-service/src/server.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/server.ts |
| runtime/kernel/commit-service/src/utils/logger.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/utils/logger.ts |
| runtime/kernel/commit-service/src/validation/dag_validator.ts | RUNTIME | Runtime | runtime/kernel/commit-service/src/validation/dag_validator.ts |
| runtime/kernel/commit-service/node_modules/* (1000+ files) | RUNTIME | Runtime | runtime/kernel/commit-service/node_modules/* |

**Total:** 1000+ files (17 source files + node_modules)

**Classification:** 17 RUNTIME, 1 SCAFFOLD, 1000+ RUNTIME (node_modules)

---

### infra/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| infra/api/ (0 files) | INFRASTRUCTURE | Infra | infra/api/ |
| infra/observability/ (0 files) | INFRASTRUCTURE | Infra | infra/observability/ |
| infra/ollama/ (0 files) | INFRASTRUCTURE | Infra | infra/ollama/ |
| infra/postgres/ (0 files) | INFRASTRUCTURE | Infra | infra/postgres/ |
| infra/postgres/init/ (0 files) | INFRASTRUCTURE | Infra | infra/postgres/init/ |
| infra/redis/ (0 files) | INFRASTRUCTURE | Infra | infra/redis/ |
| infra/scripts/ (0 files) | INFRASTRUCTURE | Infra | infra/scripts/ |
| infra/volumes/ (0 files) | INFRASTRUCTURE | Infra | infra/volumes/ |
| infra/worker/ (0 files) | INFRASTRUCTURE | Infra | infra/worker/ |

**Total:** 9 directories (0 files)

**Classification:** 9 INFRASTRUCTURE (empty directories)

---

### constitutional-integration-lab/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| constitutional-integration-lab/* (41+ files) | LEGACY | Legacy | legacy/constitutional-integration-lab/* |

**Total:** 41+ files

**Classification:** 41+ LEGACY

---

### ai-stack/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| ai-stack/api/main.py | LEGACY | Legacy | legacy/ai-stack/api/main.py |
| ai-stack/api/__pycache__/main.cpython-311.pyc | LEGACY | Legacy | legacy/ai-stack/api/__pycache__/main.cpython-311.pyc |
| ai-stack/python-env/Dockerfile | LEGACY | Legacy | legacy/ai-stack/python-env/Dockerfile |

**Total:** 3 files

**Classification:** 3 LEGACY

---

### CascadeProjects/ Directory

| Path | Classification | Owner | Recommended Destination |
|------|----------------|-------|-------------------------|
| CascadeProjects/* (36 files) | LEGACY | Legacy | legacy/CascadeProjects/* |

**Total:** 36 files

**Classification:** 36 LEGACY

---

## Summary Statistics

### Total Files by Classification

| Classification | Count | Percentage |
|----------------|-------|------------|
| AUTHORITATIVE | 110 | 31% |
| DERIVED | 114 | 32% |
| GENERATED | 61 | 17% |
| LEGACY | 80 | 23% |
| SCAFFOLD | 12 | 3% |
| RUNTIME | 17 | 5% |
| INFRASTRUCTURE | 0 | 0% |
| UNKNOWN | 0 | 0% |

**Total:** 394 files (excluding node_modules)

---

### Total Files by Directory

| Directory | Count | Percentage |
|-----------|-------|------------|
| knowledge/ | 89 | 23% |
| vos/ | 68 | 17% |
| reports/ | 41 | 10% |
| constitutional-integration-lab/ | 41 | 10% |
| runtime/ | 17 | 4% |
| inventory/ | 14 | 4% |
| agents/ | 11 | 3% |
| CascadeProjects/ | 36 | 9% |
| CRX root | 8 | 2% |
| ai-stack/ | 3 | 1% |
| infra/ | 0 | 0% |

**Total:** 328 files (excluding node_modules)

---

### Key Findings

**FACT:** 110 AUTHORITATIVE files exist (constitutional documents, knowledge specifications)

**FACT:** 114 DERIVED files exist (knowledge derived, VOS proposals, VOS viz)

**FACT:** 61 GENERATED files exist (audit reports, inventory reports)

**FACT:** 80 LEGACY files exist (constitutional-integration-lab, ai-stack, CascadeProjects)

**FACT:** 12 SCAFFOLD files exist (agent Dockerfiles, scripts)

**FACT:** 17 RUNTIME files exist (commit-service source code)

**FACT:** 0 INFRASTRUCTURE files exist (infra/ directory is empty)

**INFERENCE:** Repository consolidation is required to establish authority boundaries

**INFERENCE:** Legacy directories (constitutional-integration-lab, ai-stack, CascadeProjects) should be moved to legacy/

**INFERENCE:** Generated reports should be consolidated into reports/generated/

**INFERENCE:** Constitutional documents should be consolidated into constitutional/

**RECOMMENDATION:** Proceed with PHASE 2-10 to establish constitutional repository layout
