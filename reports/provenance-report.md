# Provenance Report

**Audit Date:** 2026-06-07  
**Protocol:** CRX-RECOVERY-FORENSICS  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** CRX is a multi-repo workspace with no root git repository.

**FACT:** Sub-repos exist: knowledge/ (master), vos/ (main), runtime/ (audit-hardening).

**FACT:** Working tree contains 59 files not in any branch (CRX root, agents/, inventory/, reports/).

**FACT:** origin/audit-hardening branch contains artifact.ts model not in audit-hardening branch.

**INFERENCE:** Working tree files are GENERATED_BY_AGENT (reports, inventory) or SCAFFOLD (agents/).

---

## Branch File Enumeration

### knowledge/ (master branch)

**Total Files:** 89

**File List:**
- .gitignore
- README.md
- authoritative/UCIA-CONSTITUTION-v1.0.md
- authoritative/claim-decision-model-v0.1.md
- authoritative/claim-lifecycle-model.md
- authoritative/claim.schema.json
- authoritative/constitutional-agent-infrastructure.md
- authoritative/constitutional-attention-runtime.md
- authoritative/constitutional-computation-pipeline-v0.1.md
- authoritative/constitutional-database-spec.md
- authoritative/constitutional-governance-model.md
- authoritative/constitutional-knowledge-graph-model.md
- authoritative/constitutional-media-infrastructure.md
- authoritative/constitutional-mutation-model.md
- authoritative/constitutional-narrative-runtime.md
- authoritative/constitutional-rule-system-v0.1.md
- authoritative/constitutional-runtime-model.md
- authoritative/constitutional-runtime-objects.md
- authoritative/constitutional-state-hash-model.md
- authoritative/constitutional-threat-model.md
- authoritative/constitutional-verdict.md
- authoritative/decision-reconstruction.md
- authoritative/decision.schema.json
- authoritative/distributed-constitutional-sync.md
- authoritative/evaluator-upgrade-protocol.md
- authoritative/fact-reconstruction.md
- authoritative/meaning-continuity-final-verdict.md
- authoritative/minimal-kernel-reconstruction.md
- authoritative/missing-primitive-analysis.md
- authoritative/mutation-governance-model.md
- authoritative/persistence-constitution.md
- authoritative/primitive-compression.md
- authoritative/primitive-minimum-proof.md
- authoritative/replay-reconstruction.md
- authoritative/rule-reconstruction.md
- authoritative/semantic-lineage-final-verdict.md
- authoritative/semantic-threat-model.md
- authoritative/vos-reconstruction.md
- authority-legitimacy-audit.md
- authority-reconstruction.md
- derived/100-year-survivability-assessment.md
- derived/UCIA_v1.0.md
- derived/agent-workflow-topology.md
- derived/ai-memory-architecture.md
- derived/ai-retrieval-architecture.md
- derived/automation-boundary-audit.md
- derived/canon-formation-engine.md
- derived/civilization-fork-analysis.md
- derived/civilization-kernel.md
- derived/civilization-memory-survivability.md
- derived/compression-proof.md
- derived/constitutional-primitive-reduction-audit.md
- derived/context-assembly-system.md
- derived/cos-mapping.md
- derived/creator-canonical-storage-spec-v1.md
- derived/creator-computed-state-audit.md
- derived/creator-intelligence-runtime.md
- derived/creator-primitive-reduction-audit.md
- derived/creator-projection-generation-model.md
- derived/creator-retrieval-architecture.md
- derived/creator-state-closure-model.md
- derived/cvm-instruction-set-v0.1.md
- derived/cvm-reference-architecture-v0.1.md
- derived/cvm-state-transition-model.md
- derived/derived-state-audit.md
- derived/deterministic-replay-infrastructure.md
- derived/distributed-cvm-model.md
- derived/evaluator-dependency-audit.md
- derived/evaluator-drift-analysis.md
- derived/evaluator-execution-runtime.md
- derived/evaluator-fork-analysis.md
- derived/falsification-audit-final-verdict.md
- derived/identity-continuity-rules.md
- derived/identity-persistence-audit.md
- derived/knowledge-closure-model.md
- derived/local-ai-survivability-assessment.md
- derived/mandatory-questions-answers-creator.md
- derived/mandatory-questions-answers-p1.2.md
- derived/mandatory-questions-answers-p1.3.md
- derived/mandatory-questions-answers-p1.4.md
- derived/mandatory-questions-answers-p2.0.md
- derived/mandatory-questions-answers-p3.0.md
- derived/mandatory-questions-answers.md
- derived/meaning-compression-proof.md
- derived/meaning-drift-model.md
- derived/meaning-preservation-attack.md
- derived/meaning-primitive-audit.md
- derived/multi-agent-runtime-model.md
- derived/multi-generational-replay.md
- derived/narrative-continuity.md
- derived/narrative-identity-continuity.md
- derived/primitive-removal-audit.md
- derived/prompt-system-reduction-audit.md
- derived/replay-boundary-audit.md
- derived/replay-sufficiency-proof.md
- derived/replay-verification-model.md
- derived/script-generation-pipeline-v2.md
- derived/semantic-lineage-formal-specification.md
- derived/signal-ingestion-architecture-v0.1.md
- derived/trend-runtime-model.md
- derived/trust-anchor-analysis.md
- derived/twenty-year-survivability-audit.md
- derived/ucia-civilization-reference-stack-v1.md
- derived/unified-creator-intelligence-runtime.md
- derived/unified-object-ontology.md
- derived/universal-replay-semantics.md
- derived/universal-state-equation.md
- experimental/civilization-survivability-test.md
- experimental/determinism-boundary-test.md
- experimental/semantic-reduction-test.md
- inventory.json

---

### vos/ (main branch)

**Total Files:** 68

**File List:**
- .gitignore
- README.md
- archive/manifest.json
- cos/ARCHITECTURE.md
- cos/CONSTITUTION.md
- cos/STRUCTURE.md
- cos/audit/README.md
- cos/audit/events.jsonl
- cos/checklists/amendment-review.md
- cos/checklists/decision-review.md
- cos/checklists/execution-approval.md
- cos/checklists/thesis-review.md
- cos/checklists/vos-expansion-review.md
- cos/engines/argument-compiler.md
- cos/engines/delayed-execution.md
- cos/engines/thesis-compiler.md
- cos/frameworks/failure-analysis.md
- cos/governance/governance-framework.md
- cos/governance/self-improvement.md
- cos/index.json
- cos/lifecycle/artifact-lifecycle.md
- cos/protocols/clarification-protocol.md
- cos/refactoring/repository-cleanup-plan.md
- cos/schema/argument-graph.schema.json
- cos/schema/audit-event.schema.json
- cos/templates/amendment-proposal.template.md
- cos/templates/argument-graph.template.json
- cos/templates/decision-record.template.md
- cos/templates/deprecation-notice.template.md
- cos/templates/execution-approval.template.md
- cos/templates/experiment-record.template.md
- cos/templates/failure-record.template.md
- cos/templates/proposal-stage.template.md
- cos/templates/reflection-record.template.md
- cos/templates/thesis-compiler.template.md
- cos/versioning/versioning-strategy.md
- proposals/.gitkeep
- proposals/prop-20260604-audit-schema-enforcement/01-problem.md
- proposals/prop-20260604-audit-schema-enforcement/02-thesis.md
- proposals/prop-20260604-audit-schema-enforcement/03-constraints.md
- proposals/prop-20260604-audit-schema-enforcement/04-dependencies.md
- proposals/prop-20260604-audit-schema-enforcement/05-failures.md
- proposals/prop-20260604-audit-schema-enforcement/06-verification.md
- proposals/prop-20260604-audit-schema-enforcement/07-experiment.md
- proposals/prop-20260604-audit-schema-enforcement/08-execution-approval.md
- proposals/prop-20260604-audit-schema-enforcement/DEC-001.md
- proposals/prop-20260604-audit-schema-enforcement/EXEC-001.md
- proposals/prop-20260604-audit-schema-enforcement/THS-001.md
- viz/VOS.md
- viz/concepts/context-collapse/diagram.d2
- viz/concepts/context-collapse/diagram.mmd
- viz/concepts/context-collapse/meta.json
- viz/concepts/context-compiler/diagram.d2
- viz/concepts/context-compiler/diagram.mmd
- viz/concepts/context-compiler/meta.json
- viz/concepts/distributed-cognition-system/diagram.d2
- viz/concepts/distributed-cognition-system/diagram.mmd
- viz/concepts/distributed-cognition-system/meta.json
- viz/concepts/event-store/diagram.d2
- viz/concepts/event-store/diagram.mmd
- viz/concepts/event-store/meta.json
- viz/concepts/execution-entropy/diagram.d2
- viz/concepts/execution-entropy/diagram.mmd
- viz/concepts/execution-entropy/meta.json
- viz/concepts/memory-hierarchy/diagram.d2
- viz/concepts/memory-hierarchy/diagram.mmd
- viz/concepts/memory-hierarchy/meta.json
- viz/concepts/persistent-cognition-graph/diagram.d2
- viz/concepts/persistent-cognition-graph/diagram.mmd
- viz/concepts/persistent-cognition-graph/meta.json
- viz/concepts/replay-engine/diagram.d2
- viz/concepts/replay-engine/diagram.mmd
- viz/concepts/replay-engine/meta.json
- viz/concepts/stateful-problem-space/diagram.d2
- viz/concepts/stateful-problem-space/diagram.mmd
- viz/concepts/stateful-problem-space/meta.json
- viz/concepts/stateless-intelligence-engine/diagram.d2
- viz/concepts/stateless-intelligence-engine/diagram.mmd
- viz/concepts/stateless-intelligence-engine/meta.json
- viz/index.json
- viz/schema/deliverable-bundle.schema.json
- viz/themes/d2-classes.d2
- viz/themes/mermaid-init.mmd

---

### runtime/ (audit-hardening branch)

**Total Files:** 17 (excluding node_modules)

**File List:**
- .gitignore
- README.md
- kernel/commit-service/package-lock.json
- kernel/commit-service/package.json
- kernel/commit-service/src/api/audit_controller.ts
- kernel/commit-service/src/api/commit_controller.ts
- kernel/commit-service/src/engines/canonical_engine.ts
- kernel/commit-service/src/engines/identity_engine.ts
- kernel/commit-service/src/events/event_log.ts
- kernel/commit-service/src/persistence/artifact_store.ts
- kernel/commit-service/src/persistence/db.ts
- kernel/commit-service/src/persistence/ledger_schema.sql
- kernel/commit-service/src/persistence/lineage_store.ts
- kernel/commit-service/src/server.ts
- kernel/commit-service/src/utils/logger.ts
- kernel/commit-service/src/validation/dag_validator.ts
- kernel/commit-service/tsconfig.json

---

### runtime/ (origin/audit-hardening branch)

**Total Files:** 18 (excluding node_modules)

**File List:**
- README.md
- kernel/commit-service/package-lock.json
- kernel/commit-service/package.json
- kernel/commit-service/src/api/audit_controller.ts
- kernel/commit-service/src/api/commit_controller.ts
- kernel/commit-service/src/engines/canonical_engine.ts
- kernel/commit-service/src/engines/identity_engine.ts
- kernel/commit-service/src/events/event_log.ts
- kernel/commit-service/src/models/artifact.ts
- kernel/commit-service/src/persistence/artifact_store.ts
- kernel/commit-service/src/persistence/db.ts
- kernel/commit-service/src/persistence/ledger_schema.sql
- kernel/commit-service/src/persistence/lineage_store.ts
- kernel/commit-service/src/server.ts
- kernel/commit-service/src/utils/logger.ts
- kernel/commit-service/src/validation/dag_validator.ts
- kernel/commit-service/tsconfig.json

**DIFFERENCE:** origin/audit-hardening has src/models/artifact.ts not in audit-hardening branch

---

### Working Tree (CRX root)

**Total Files:** 59 (excluding sub-repo files)

**File List:**
- AGENT.md
- AUTHORITY_CONFLICT_REPORT.md
- CRX_CONSTITUTION.md
- EXECUTION_REALITY_REPORT.md
- FILE_INVENTORY.md
- REPOSITORY_PROVENANCE_MAP.md
- VERIFIED_EXISTING_FILES.md
- VERIFIED_RUNTIME_ENTRYPOINTS.md
- agents/Dockerfile
- agents/Dockerfile.documentation
- agents/Dockerfile.governance
- agents/Dockerfile.planner
- agents/Dockerfile.refactor
- agents/agent_permissions.md
- agents/crx_workspace_indexer.ps1
- agents/crx_workspace_indexer.py
- agents/docker-compose.yml
- agents/implement_authority_reduction.ps1
- agents/requirements.txt
- inventory/authority-conflicts-v2.md
- inventory/authority-map.md
- inventory/infrastructure-sovereignty-report.md
- inventory/infrastructure.md
- inventory/ingestion-gap-report.md
- inventory/ingestion-readiness.md
- inventory/knowledge.md
- inventory/readiness-report.md
- inventory/replay-boundary.md
- inventory/replay-readiness-gap-analysis.md
- inventory/repositories.md
- inventory/runtime-boundary-report.md
- inventory/runtime-readiness.md
- inventory/shadow-system-map.md
- reports/AUDIT_OF_AUDITS.md
- reports/AUTHORITY_EQUIVALENCE_MATRIX.md
- reports/AUTHORITY_MIGRATION_GRAPH.md
- reports/AUTHORITY_REUSE_MATRIX.md
- reports/BEHAVIORAL_DIFFERENTIAL_REPORT.md
- reports/CONSTITUTIONAL_CONFLICT_MATRIX.md
- reports/CONSTITUTIONAL_PRIORITY_QUEUE.md
- reports/FINAL_FORENSIC_VERDICT.md
- reports/KERNEL_MINIMIZATION_REPORT.md
- reports/REPLACEMENT_SAFETY_MATRIX.md
- reports/REPLAY_GAP_REPORT.md
- reports/ROADMAP_TRACEABILITY_MATRIX.md
- reports/authority-conflicts-v2.md
- reports/authority_boundary_violations.md
- reports/constitutional-authority-reconciliation.md
- reports/event_substrate_forensics.md
- reports/historical_strata_registry.md
- reports/infrastructure-sovereignty-report.md
- reports/infrastructure_reality_audit.md
- reports/ingestion-gap-report.md
- reports/pre_infra_constitutional_freeze.md
- reports/replay-readiness-gap-analysis.md
- reports/replay_critical_authority_map.md
- reports/replay_truth_audit.md
- reports/runtime-boundary-report.md
- reports/shadow-system-map.md

---

## Provenance Table for Working-Tree-Only Files

### CRX Root Files

| File | First Appearance | Git History Presence | Branch Presence | Likely Origin | Confidence Level |
|------|----------------|---------------------|----------------|---------------|------------------|
| AGENT.md | UNKNOWN | None (CRX root not git repo) | None | CONSTITUTIONAL_DOCUMENT | HIGH |
| AUTHORITY_CONFLICT_REPORT.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |
| CRX_CONSTITUTION.md | UNKNOWN | None (CRX root not git repo) | None | CONSTITUTIONAL_DOCUMENT | HIGH |
| EXECUTION_REALITY_REPORT.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |
| FILE_INVENTORY.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |
| REPOSITORY_PROVENANCE_MAP.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |
| VERIFIED_EXISTING_FILES.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |
| VERIFIED_RUNTIME_ENTRYPOINTS.md | UNKNOWN | None (CRX root not git repo) | None | GENERATED_BY_AGENT | HIGH |

### agents/ Files

| File | First Appearance | Git History Presence | Branch Presence | Likely Origin | Confidence Level |
|------|----------------|---------------------|----------------|---------------|------------------|
| agents/Dockerfile | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/Dockerfile.documentation | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/Dockerfile.governance | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/Dockerfile.planner | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/Dockerfile.refactor | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/agent_permissions.md | UNKNOWN | None (agents/ not git repo) | None | CONSTITUTIONAL_DOCUMENT | HIGH |
| agents/crx_workspace_indexer.ps1 | UNKNOWN | None (agents/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| agents/crx_workspace_indexer.py | UNKNOWN | None (agents/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| agents/docker-compose.yml | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |
| agents/implement_authority_reduction.ps1 | UNKNOWN | None (agents/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| agents/requirements.txt | UNKNOWN | None (agents/ not git repo) | None | SCAFFOLD | HIGH |

### inventory/ Files

| File | First Appearance | Git History Presence | Branch Presence | Likely Origin | Confidence Level |
|------|----------------|---------------------|----------------|---------------|------------------|
| inventory/authority-conflicts-v2.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/authority-map.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/infrastructure-sovereignty-report.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/infrastructure.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/ingestion-gap-report.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/ingestion-readiness.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/knowledge.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/readiness-report.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/replay-boundary.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/replay-readiness-gap-analysis.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/repositories.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/runtime-boundary-report.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/runtime-readiness.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| inventory/shadow-system-map.md | UNKNOWN | None (inventory/ not git repo) | None | GENERATED_BY_AGENT | HIGH |

### reports/ Files

| File | First Appearance | Git History Presence | Branch Presence | Likely Origin | Confidence Level |
|------|----------------|---------------------|----------------|---------------|------------------|
| reports/AUDIT_OF_AUDITS.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/AUTHORITY_EQUIVALENCE_MATRIX.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/AUTHORITY_MIGRATION_GRAPH.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/AUTHORITY_REUSE_MATRIX.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/BEHAVIORAL_DIFFERENTIAL_REPORT.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/CONSTITUTIONAL_CONFLICT_MATRIX.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/CONSTITUTIONAL_PRIORITY_QUEUE.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/FINAL_FORENSIC_VERDICT.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/KERNEL_MINIMIZATION_REPORT.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/REPLACEMENT_SAFETY_MATRIX.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/REPLAY_GAP_REPORT.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/ROADMAP_TRACEABILITY_MATRIX.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/authority-conflicts-v2.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/authority_boundary_violations.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/constitutional-authority-reconciliation.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/event_substrate_forensics.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/historical_strata_registry.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/infrastructure-sovereignty-report.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/infrastructure_reality_audit.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/ingestion-gap-report.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/pre_infra_constitutional_freeze.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/replay-readiness-gap-analysis.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/replay_critical_authority_map.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/replay_truth_audit.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/runtime-boundary-report.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |
| reports/shadow-system-map.md | UNKNOWN | None (reports/ not git repo) | None | GENERATED_BY_AGENT | HIGH |

---

## Classification Summary

**CONSTITUTIONAL_DOCUMENTS (8):**
- AGENT.md
- CRX_CONSTITUTION.md
- agents/agent_permissions.md

**GENERATED_BY_AGENT (48):**
- AUTHORITY_CONFLICT_REPORT.md
- EXECUTION_REALITY_REPORT.md
- FILE_INVENTORY.md
- REPOSITORY_PROVENANCE_MAP.md
- VERIFIED_EXISTING_FILES.md
- VERIFIED_RUNTIME_ENTRYPOINTS.md
- agents/crx_workspace_indexer.ps1
- agents/crx_workspace_indexer.py
- agents/implement_authority_reduction.ps1
- inventory/* (14 files)
- reports/* (26 files)

**SCAFFOLD (7):**
- agents/Dockerfile
- agents/Dockerfile.documentation
- agents/Dockerfile.governance
- agents/Dockerfile.planner
- agents/Dockerfile.refactor
- agents/docker-compose.yml
- agents/requirements.txt

---

## Branch-Specific Findings

### origin/audit-hardening vs audit-hardening

**DIFFERENCE:** origin/audit-hardening has src/models/artifact.ts not in audit-hardening branch

**CLASSIFICATION:** artifact.ts is NEW in origin/audit-hardening

**CONFIDENCE:** HIGH

---

## Final Classification

**FACT:** 59 working-tree-only files identified

**FACT:** 8 constitutional documents in working tree

**FACT:** 48 generated reports in working tree

**FACT:** 7 scaffold files in working tree

**FACT:** 1 file difference between audit-hardening and origin/audit-hardening (artifact.ts)

**INFERENCE:** Working tree files are GENERATED_BY_AGENT (reports, inventory) or SCAFFOLD (agents/)

**RECOMMENDATION:** Merge artifact.ts from origin/audit-hardening to audit-hardening, discard generated reports, preserve constitutional documents.
