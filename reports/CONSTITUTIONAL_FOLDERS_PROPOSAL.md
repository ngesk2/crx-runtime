# CONSTITUTIONAL FOLDERS PROPOSAL

**Proposal Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Current repository lacks constitutional folder structure.

**FACT:** Files are mixed across constitutional, runtime, generated, legacy, and scaffold categories.

**FACT:** No clear authority boundary separation exists.

**INFERENCE:** Constitutional folder structure must be established before infrastructure implementation.

**RECOMMENDATION:** Create proposed constitutional folder structure as specified below.

---

## Target Repository Layout

### CRX/

```
CRX/
├── constitutional/
│   ├── AGENT.md
│   ├── CRX_CONSTITUTION.md
│   └── policies/
│       └── (future policy documents)
├── knowledge/
│   ├── authoritative/
│   │   ├── UCIA-CONSTITUTION-v1.0.md
│   │   ├── claim-decision-model-v0.1.md
│   │   ├── claim-lifecycle-model.md
│   │   ├── claim.schema.json
│   │   ├── constitutional-agent-infrastructure.md
│   │   ├── constitutional-attention-runtime.md
│   │   ├── constitutional-computation-pipeline-v0.1.md
│   │   ├── constitutional-database-spec.md
│   │   ├── constitutional-governance-model.md
│   │   ├── constitutional-knowledge-graph-model.md
│   │   ├── constitutional-media-infrastructure.md
│   │   ├── constitutional-mutation-model.md
│   │   ├── constitutional-narrative-runtime.md
│   │   ├── constitutional-rule-system-v0.1.md
│   │   ├── constitutional-runtime-model.md
│   │   ├── constitutional-runtime-objects.md
│   │   ├── constitutional-state-hash-model.md
│   │   ├── constitutional-threat-model.md
│   │   ├── constitutional-verdict.md
│   │   ├── decision-reconstruction.md
│   │   ├── decision.schema.json
│   │   ├── distributed-constitutional-sync.md
│   │   ├── evaluator-upgrade-protocol.md
│   │   ├── fact-reconstruction.md
│   │   ├── meaning-continuity-final-verdict.md
│   │   ├── minimal-kernel-reconstruction.md
│   │   ├── missing-primitive-analysis.md
│   │   ├── mutation-governance-model.md
│   │   ├── persistence-constitution.md
│   │   ├── primitive-compression.md
│   │   ├── primitive-minimum-proof.md
│   │   ├── replay-reconstruction.md
│   │   ├── rule-reconstruction.md
│   │   ├── semantic-lineage-final-verdict.md
│   │   ├── semantic-threat-model.md
│   │   └── vos-reconstruction.md
│   └── derived/
│       ├── 100-year-survivability-assessment.md
│       ├── UCIA_v1.0.md
│       ├── agent-workflow-topology.md
│       ├── ai-memory-architecture.md
│       ├── ai-retrieval-architecture.md
│       ├── automation-boundary-audit.md
│       ├── canon-formation-engine.md
│       ├── civilization-fork-analysis.md
│       ├── civilization-kernel.md
│       ├── civilization-memory-survivability.md
│       ├── compression-proof.md
│       ├── constitutional-primitive-reduction-audit.md
│       ├── context-assembly-system.md
│       ├── cos-mapping.md
│       ├── creator-canonical-storage-spec-v1.md
│       ├── creator-computed-state-audit.md
│       ├── creator-intelligence-runtime.md
│       ├── creator-primitive-reduction-audit.md
│       ├── creator-projection-generation-model.md
│       ├── creator-retrieval-architecture.md
│       ├── creator-state-closure-model.md
│       ├── cvm-instruction-set-v0.1.md
│       ├── cvm-reference-architecture-v0.1.md
│       ├── cvm-state-transition-model.md
│       ├── derived-state-audit.md
│       ├── deterministic-replay-infrastructure.md
│       ├── distributed-cvm-model.md
│       ├── evaluator-dependency-audit.md
│       ├── evaluator-drift-analysis.md
│       ├── evaluator-execution-runtime.md
│       ├── evaluator-fork-analysis.md
│       ├── falsification-audit-final-verdict.md
│       ├── identity-continuity-rules.md
│       ├── identity-persistence-audit.md
│       ├── knowledge-closure-model.md
│       ├── local-ai-survivability-assessment.md
│       ├── mandatory-questions-answers-creator.md
│       ├── mandatory-questions-answers-p1.2.md
│       ├── mandatory-questions-answers-p1.3.md
│       ├── mandatory-questions-answers-p1.4.md
│       ├── mandatory-questions-answers-p2.0.md
│       ├── mandatory-questions-answers-p3.0.md
│       ├── mandatory-questions-answers.md
│       ├── meaning-compression-proof.md
│       ├── meaning-drift-model.md
│       ├── meaning-preservation-attack.md
│       ├── meaning-primitive-audit.md
│       ├── multi-agent-runtime-model.md
│       ├── multi-generational-replay.md
│       ├── narrative-continuity.md
│       ├── narrative-identity-continuity.md
│       ├── primitive-removal-audit.md
│       ├── prompt-system-reduction-audit.md
│       ├── replay-boundary-audit.md
│       ├── replay-sufficiency-proof.md
│       ├── replay-verification-model.md
│       ├── script-generation-pipeline-v2.md
│       ├── semantic-lineage-formal-specification.md
│       ├── signal-ingestion-architecture-v0.1.md
│       ├── trend-runtime-model.md
│       ├── trust-anchor-analysis.md
│       ├── twenty-year-survivability-audit.md
│       ├── ucia-civilization-reference-stack-v1.md
│       ├── unified-creator-intelligence-runtime.md
│       ├── unified-object-ontology.md
│       ├── universal-replay-semantics.md
│       └── universal-state-equation.md
├── runtime/
│   ├── kernel/
│   │   └── commit-service/
│   │       ├── package.json
│   │       ├── package-lock.json
│   │       ├── tsconfig.json
│   │       └── src/
│   │           ├── api/
│   │           │   ├── audit_controller.ts
│   │           │   └── commit_controller.ts
│   │           ├── engines/
│   │           │   ├── canonical_engine.ts
│   │           │   └── identity_engine.ts
│   │           ├── events/
│   │           │   └── event_log.ts
│   │           ├── persistence/
│   │           │   ├── artifact_store.ts
│   │           │   ├── db.ts
│   │           │   ├── ledger_schema.sql
│   │           │   └── lineage_store.ts
│   │           ├── server.ts
│   │           ├── utils/
│   │           │   └── logger.ts
│   │           └── validation/
│   │               └── dag_validator.ts
│   └── services/
│       └── (future services)
├── infra/
│   ├── compose/
│   │   └── docker-compose.yml
│   ├── postgres/
│   │   └── init/
│   │       ├── 01-artifacts.sql
│   │       ├── 02-lineage_edges.sql
│   │       ├── 03-execution_events.sql
│   │       ├── 04-assertions.sql
│   │       └── 05-relations.sql
│   ├── redis/
│   │   └── redis.conf
│   ├── ollama/
│   │   └── bootstrap.sh
│   ├── observability/
│   │   ├── prometheus.yml
│   │   ├── loki-config.yml
│   │   └── tempo-config.yml
│   ├── scripts/
│   │   └── (infrastructure scripts)
│   └── volumes/
│       └── (volume definitions)
├── agents/
│   ├── runtime/
│   │   ├── crx_workspace_indexer.ps1
│   │   ├── crx_workspace_indexer.py
│   │   └── implement_authority_reduction.ps1
│   ├── templates/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.documentation
│   │   ├── Dockerfile.governance
│   │   ├── Dockerfile.planner
│   │   ├── Dockerfile.refactor
│   │   ├── docker-compose.yml
│   │   └── requirements.txt
│   └── permissions/
│       └── agent_permissions.md
├── reports/
│   └── generated/
│       ├── AUDIT_OF_AUDITS.md
│       ├── AUTHORITY_EQUIVALENCE_MATRIX.md
│       ├── AUTHORITY_MIGRATION_GRAPH.md
│       ├── AUTHORITY_REUSE_MATRIX.md
│       ├── BEHAVIORAL_DIFFERENTIAL_REPORT.md
│       ├── CANONICAL_INFRA_REMEDIATION_PLAN.md
│       ├── CONSTITUTIONAL_CONFLICT_MATRIX.md
│       ├── CONSTITUTIONAL_PRIORITY_QUEUE.md
│       ├── FINAL_FORENSIC_VERDICT.md
│       ├── INFRA_GAP_REPORT.md
│       ├── KERNEL_MINIMIZATION_REPORT.md
│       ├── REPLACEMENT_SAFETY_MATRIX.md
│       ├── REPLAY_GAP_REPORT.md
│       ├── ROADMAP_TRACEABILITY_MATRIX.md
│       ├── archive_to_runtime_mapping.md
│       ├── authority-conflicts-v2.md
│       ├── authority_boundary_violations.md
│       ├── authority_classification_map.md
│       ├── constitutional-authority-reconciliation.md
│       ├── constitutional_relevance_map.md
│       ├── continuity_breaks.md
│       ├── duplicate_authority_systems.md
│       ├── event_substrate_forensics.md
│       ├── floating_module_inventory.md
│       ├── historical_strata_registry.md
│       ├── infrastructure-sovereignty-report.md
│       ├── infrastructure_reality_audit.md
│       ├── ingestion-gap-report.md
│       ├── local_corpus_topology.md
│       ├── master_corpus_inventory.md
│       ├── mergeability-report.md
│       ├── orphaned_modules.md
│       ├── pre_infra_constitutional_freeze.md
│       ├── provenance-report.md
│       ├── replay-readiness-gap-analysis.md
│       ├── replay_capability_matrix.md
│       ├── replay_critical_authority_map.md
│       ├── replay_truth_audit.md
│       ├── runtime-boundary-report.md
│       ├── shadow-system-map.md
│       └── sovereignty-gap-report.md
├── legacy/
│   ├── audits/
│   │   └── (old audit reports)
│   ├── abandoned/
│   │   └── (abandoned projects)
│   ├── historical/
│   │   └── (historical artifacts)
│   ├── constitutional-integration-lab/
│   │   ├── comparisons/
│   │   ├── duplicate_matrix/
│   │   ├── extracted/
│   │   ├── inventories/
│   │   ├── mappings/
│   │   ├── reports/
│   │   └── temporary/
│   ├── ai-stack/
│   │   ├── api/
│   │   └── python-env/
│   └── CascadeProjects/
│       ├── AGENT.md
│       ├── README.md
│       ├── agents/
│       ├── constitutional-extraction-lab/
│       ├── events/
│       ├── infra/
│       ├── kernel/
│       ├── policies/
│       ├── prompts/
│       ├── replay/
│       ├── runtime/
│       ├── schemas/
│       └── tests/
├── misc/
│   ├── uncategorized/
│   │   └── (files with unclear ownership)
│   ├── imports/
│   │   └── (imported artifacts)
│   └── recovery/
│       └── (recovery artifacts)
├── docs/
│   ├── architecture/
│   │   └── (architecture documentation)
│   ├── operations/
│   │   └── (operations documentation)
│   └── onboarding/
│       └── (onboarding documentation)
└── vos/
    ├── cos/
    │   ├── ARCHITECTURE.md
    │   ├── CONSTITUTION.md
    │   ├── STRUCTURE.md
    │   ├── audit/
    │   ├── checklists/
    │   ├── engines/
    │   ├── frameworks/
    │   ├── governance/
    │   ├── lifecycle/
    │   ├── protocols/
    │   ├── refactoring/
    │   ├── schema/
    │   ├── templates/
    │   └── versioning/
    ├── proposals/
    │   └── prop-20260604-audit-schema-enforcement/
    └── viz/
        ├── VOS.md
        ├── concepts/
        ├── schema/
        ├── themes/
        └── index.json
```

---

## Folder Classification

### constitutional/

**Purpose:** Constitutional documents (supreme authority)

**Contents:**
- AGENT.md (supreme law for agent execution)
- CRX_CONSTITUTION.md (constitutional kernel specification)
- policies/ (future policy documents)

**Classification:** AUTHORITATIVE

**Authority Level:** SUPREME

---

### knowledge/

**Purpose:** Knowledge repository (authoritative and derived)

**Contents:**
- authoritative/ (constitutional knowledge specifications)
- derived/ (derived knowledge from authoritative sources)

**Classification:** AUTHORITATIVE (authoritative/), DERIVED (derived/)

**Authority Level:** HIGH (authoritative/), MEDIUM (derived/)

---

### runtime/

**Purpose:** Runtime code (kernel and services)

**Contents:**
- kernel/ (kernel implementation)
- services/ (future services)

**Classification:** RUNTIME

**Authority Level:** MEDIUM

---

### infra/

**Purpose:** Infrastructure (compose, postgres, redis, ollama, observability)

**Contents:**
- compose/ (docker-compose.yml)
- postgres/ (postgres configuration)
- redis/ (redis configuration)
- ollama/ (ollama configuration)
- observability/ (observability configuration)
- scripts/ (infrastructure scripts)
- volumes/ (volume definitions)

**Classification:** INFRASTRUCTURE

**Authority Level:** MEDIUM

---

### agents/

**Purpose:** Agent runtime and templates

**Contents:**
- runtime/ (agent runtime scripts)
- templates/ (agent Dockerfiles and templates)
- permissions/ (agent permissions)

**Classification:** SCAFFOLD (templates/), RUNTIME (runtime/), AUTHORITATIVE (permissions/)

**Authority Level:** LOW

---

### reports/

**Purpose:** Generated reports (audit outputs)

**Contents:**
- generated/ (all generated reports)

**Classification:** GENERATED

**Authority Level:** LOW

---

### legacy/

**Purpose:** Legacy artifacts (old audits, abandoned projects, historical artifacts)

**Contents:**
- audits/ (old audit reports)
- abandoned/ (abandoned projects)
- historical/ (historical artifacts)
- constitutional-integration-lab/ (legacy integration lab)
- ai-stack/ (legacy AI stack)
- CascadeProjects/ (legacy cascade projects)

**Classification:** LEGACY

**Authority Level:** NONE

---

### misc/

**Purpose:** Miscellaneous artifacts (uncategorized, imports, recovery)

**Contents:**
- uncategorized/ (files with unclear ownership)
- imports/ (imported artifacts)
- recovery/ (recovery artifacts)

**Classification:** UNKNOWN

**Authority Level:** NONE

---

### docs/

**Purpose:** Documentation (architecture, operations, onboarding)

**Contents:**
- architecture/ (architecture documentation)
- operations/ (operations documentation)
- onboarding/ (onboarding documentation)

**Classification:** DERIVED

**Authority Level:** LOW

---

### vos/

**Purpose:** Visual Operating System (constitutional governance)

**Contents:**
- cos/ (constitutional governance)
- proposals/ (proposals)
- viz/ (visualizations)

**Classification:** AUTHORITATIVE (cos/), DERIVED (proposals/, viz/)

**Authority Level:** HIGH (cos/), MEDIUM (proposals/, viz/)

---

## Migration Summary

### Files to Move to constitutional/

- AGENT.md (CRX root → constitutional/)
- CRX_CONSTITUTION.md (CRX root → constitutional/)

**Total:** 2 files

---

### Files to Move to knowledge/

- knowledge/authoritative/* (no change)
- knowledge/derived/* (no change)

**Total:** 89 files (no movement required)

---

### Files to Move to runtime/

- runtime/* (no change)

**Total:** 17 files (no movement required)

---

### Files to Move to infra/

- infra/* (no change, currently empty)

**Total:** 0 files (no movement required)

---

### Files to Move to agents/

- agents/Dockerfile → agents/templates/Dockerfile
- agents/Dockerfile.documentation → agents/templates/Dockerfile.documentation
- agents/Dockerfile.governance → agents/templates/Dockerfile.governance
- agents/Dockerfile.planner → agents/templates/Dockerfile.planner
- agents/Dockerfile.refactor → agents/templates/Dockerfile.refactor
- agents/agent_permissions.md → agents/permissions/agent_permissions.md
- agents/crx_workspace_indexer.ps1 → agents/runtime/crx_workspace_indexer.ps1
- agents/crx_workspace_indexer.py → agents/runtime/crx_workspace_indexer.py
- agents/docker-compose.yml → agents/templates/docker-compose.yml
- agents/implement_authority_reduction.ps1 → agents/runtime/implement_authority_reduction.ps1
- agents/requirements.txt → agents/templates/requirements.txt

**Total:** 11 files

---

### Files to Move to reports/generated/

- inventory/* (14 files) → reports/generated/
- reports/* (41 files) → reports/generated/
- CRX root reports (6 files) → reports/generated/

**Total:** 61 files

---

### Files to Move to legacy/

- constitutional-integration-lab/* (41+ files) → legacy/constitutional-integration-lab/
- ai-stack/* (3 files) → legacy/ai-stack/
- CascadeProjects/* (36 files) → legacy/CascadeProjects/

**Total:** 80+ files

---

### Files to Move to misc/

- None (no files with unclear ownership identified)

**Total:** 0 files

---

### Files to Move to docs/

- None (no documentation files identified)

**Total:** 0 files

---

### Files to Keep in vos/

- vos/* (no change)

**Total:** 68 files (no movement required)

---

## Final Classification

**FACT:** 2 files to move to constitutional/

**FACT:** 89 files to keep in knowledge/ (no movement required)

**FACT:** 17 files to keep in runtime/ (no movement required)

**FACT:** 0 files to move to infra/ (currently empty)

**FACT:** 11 files to move to agents/ (reorganize within agents/)

**FACT:** 61 files to move to reports/generated/

**FACT:** 80+ files to move to legacy/

**FACT:** 0 files to move to misc/

**FACT:** 0 files to move to docs/

**FACT:** 68 files to keep in vos/ (no movement required)

**Total Files to Move:** 154+ files

**Total Files to Keep:** 174 files

**INFERENCE:** Constitutional folder structure proposal is complete

**RECOMMENDATION:** Proceed with PHASE 3-10 to execute migration plan
