# ARCHIVE INSTEAD OF DELETE

**Repository**: CRX (Constitutional Runtime eXtension)
**Date**: 2026-06-13
**Authority**: EXECUTION TRUTH ONLY

---

## ARCHIVAL PRINCIPLES

**Archive IF**:
- Historically valuable (documents evolution of thought)
- Emotionally valuable (represents significant effort)
- Technically valuable (contains useful patterns or insights)
- NOT runtime valuable (not imported or executed)

**DO NOT Archive**:
- Runtime code (keep in repository)
- Active configuration (keep in repository)
- Executing scripts (keep in repository)

**Archive TO**:
- `archive/` directory in same repository
- Separate documentation repository
- Git tag snapshots

---

## CATEGORY 1: CONSTITUTIONAL DOCUMENTS

### constitution/
**Value**: Historically valuable + Emotionally valuable
**Reason**: Represents constitutional governance framework, significant intellectual effort
**Runtime Value**: NONE (reference only, not enforced in code)
**Files**: 10 .md files
- authority_model.md
- invariant_law.md
- layer0_kernel.md
- layering_law.md
- mutation_law.md
- replay_law.md
- retrieval_law.md
- source_of_truth_law.md
- terminology.md
- witness_law.md

**Recommendation**: Archive to `archive/constitution/`
**Command**: `mkdir -p archive/constitution && mv constitution/* archive/constitution/ && rmdir constitution`

---

## CATEGORY 2: KNOWLEDGE BASE

### knowledge/
**Value**: Historically valuable + Technically valuable
**Reason**: Contains extensive architecture documentation, represents significant planning effort
**Runtime Value**: NONE (96% documentation, 4% schema)
**Files**: 106 files
- authoritative/ (36 files - constitutional schemas)
- derived/ (67 files - documentation and analysis)
- experimental/ (3 files - test documentation)
- inventory.json (file inventory)
- README.md (workspace architecture)

**Recommendation**: Archive to `archive/knowledge/`
**Command**: `mkdir -p archive/knowledge && mv knowledge/* archive/knowledge/ && rmdir knowledge`

---

## CATEGORY 3: ROOT AUDIT REPORTS

### Root Directory *.md Audit Reports
**Value**: Historically valuable
**Reason**: Documents forensic audit process, represents significant analysis effort
**Runtime Value**: NONE (documentation only)
**Files**: 45 files
- AUTHORITY_SURVEY.md
- AUTHORITY_TRACE_REPORT.md
- AUTHORITY_VIOLATION_EVIDENCE_MAP.md
- BUILD_CERTIFICATION.md
- BUILD_GRAPH.md
- CERTIFICATE_CERTIFICATION.md
- CIVILIZATION_DETECTION_AUDIT_COMPLETE.md
- CONSTITUTIONAL_DRIFT_MATRIX.md
- CONSTITUTIONAL_LAYER_0_AUDIT.md
- CONSTITUTIONAL_LAYER_BOUNDARIES.md
- CONSTITUTIONAL_TEST_SUITE_GUIDE.md
- CONVERGENCE_READINESS.md
- DETERMINISM_CERTIFICATION.md
- DUPLICATE_STACK_EVIDENCE.md
- FAILURE_CERTIFICATION.md
- FREEZE_CERTIFICATION_REPORT.md
- FREEZE_PATCHES_IMPLEMENTATION_PLAN.md
- IMPORT_GRAPH_FAILURES.md
- IMPORT_REPAIR_REPORT.md
- KERNEL_PURITY.md
- LAYER1_READINESS.md
- OBJECT_MODEL_FREEZE.md
- PATCHSET_CONVERGENCE.md
- PORTABILITY_CERTIFICATION.md
- POST_CONVERGENCE_STATE.md
- POST_PATCH_EXECUTION_GRAPH.md
- PRE_PATCH_STATE.md
- PRODUCTION_EXECUTION_GRAPH.md
- PRODUCTION_TEST_DRIFT.md
- REACHABILITY_FAILURE_REPORT.md
- REPLAY_BOUNDARIES.md
- REPLAY_REACHABILITY_EVIDENCE.md
- REPLAY_REACHABILITY_REPORT.md
- REPO_ACCESS_REPORT.md
- SEMANTIC_CONSTITUTIONAL_AUDIT_COMPLETE.md
- SEMANTIC_CONSTITUTIONAL_AUDIT_EXECUTIVE_SUMMARY.md
- SEMANTIC_DEBT_HEATMAP.md
- STACK_CONVERGENCE_REPORT.md
- SURGICAL_PATCH_GUIDE.md
- TEST_COVERAGE_AUDIT.md
- UNICODE_TRUTH_DISCOVERY.md
- UNKNOWN_ELIMINATION_REPORT.md
- VALIDATION_AUDITS_BEFORE_IMPLEMENTATION.md
- WORKSPACE_PATCH.md

**Recommendation**: Archive to `archive/audits/root/`
**Command**: `mkdir -p archive/audits/root && mv *.md archive/audits/root/`

**Note**: Keep README.md in root (runtime documentation)

---

## CATEGORY 4: VOS DOCUMENTATION

### vos/cos/
**Value**: Historically valuable + Emotionally valuable
**Reason**: Represents VOS (Constitutional Operating System) concept, significant intellectual effort
**Runtime Value**: NONE (documentation only)
**Files**: 10+ .md files + empty subdirectories

**Recommendation**: Archive to `archive/vos/`
**Command**: `mkdir -p archive/vos && mv vos/* archive/vos/ && rmdir vos`

---

## CATEGORY 5: RUNTIME/REPLAY AUDIT REPORTS

### runtime/replay/*.md
**Value**: Historically valuable
**Reason**: Documents replay system audit process
**Runtime Value**: NONE (documentation only)
**Files**: 20 files
- ADR-000Y-FREEZE-READINESS-AUDIT.md
- CANONICALIZATION_AUTHORITY_REPORT.md
- COMMITMENT_COMPLETENESS_AUDIT.md
- CONSTITUTIONAL_AUTHORITY_AUDIT.md
- CONSTITUTIONAL_BLOCKERS_ADR-000Y.md
- CONSTITUTIONAL_FREEZE_VERDICT.md
- FINAL_CONSTITUTIONAL_AUDIT.md
- FORENSIC_PHASE2_AUTHORITY_RECONCILIATION.md
- FORENSIC_PHASE3_AUTHORITY_BINDING.md
- FORENSIC_PHASE4_WITNESS_AUTHORITY_TRACE.md
- FORENSIC_PROVENANCE_MAP.md
- MAP_SET_ORDERING_AUDIT.md
- PHASE1A_RUNTIME_DEPENDENCY_AUDIT.md
- PHASE9_RECERTIFICATION_REPORT.md
- REPLAY_CORPUS_IMPROVEMENT_AUDIT.md

**Recommendation**: Archive to `archive/audits/replay/`
**Command**: `mkdir -p archive/audits/replay && mv runtime/replay/*.md archive/audits/replay/`

---

## CATEGORY 6: CASCADEPROJECTS INFRA DOCUMENTATION

### CascadeProjects/infra/*.md
**Value**: Historically valuable
**Reason**: Documents infrastructure planning
**Runtime Value**: NONE (documentation only)
**Files**: 7 files
- AUTHORITY_ALIGNMENT_AUDIT.md
- COGNITION_STACK_EXPANSION.md
- GATEWAY_INSERTION_PLAN.md
- INFRA_AUDIT.md
- LOCAL_EXECUTION_SUBSTRATE_PROPOSAL.md
- OLLAMA_READINESS.md
- UI_INSERTION_PLAN.md

**Recommendation**: Archive to `archive/audits/infra/`
**Command**: `mkdir -p archive/audits/infra && mv CascadeProjects/infra/*.md archive/audits/infra/`

---

## CATEGORY 7: CONSTITUTIONAL INTEGRATION LAB

### constitutional-integration-lab/
**Value**: Historically valuable
**Reason**: Represents integration planning effort
**Runtime Value**: NONE (empty or minimal)
**Files**: 3 empty directories + 5 empty subdirectories in extracted/

**Recommendation**: Archive to `archive/labs/constitutional-integration/`
**Command**: `mkdir -p archive/labs/constitutional-integration && mv constitutional-integration-lab/* archive/labs/constitutional-integration/ && rmdir constitutional-integration-lab`

---

## CATEGORY 8: CONSTITUTIONAL EXTRACTION LAB

### CascadeProjects/constitutional-extraction-lab/
**Value**: Historically valuable
**Reason**: Represents extraction planning effort
**Runtime Value**: NONE (empty directories)
**Files**: 3 empty directories

**Recommendation**: Archive to `archive/labs/constitutional-extraction/`
**Command**: `mkdir -p archive/labs/constitutional-extraction && mv CascadeProjects/constitutional-extraction-lab/* archive/labs/constitutional-extraction/ && rmdir CascadeProjects/constitutional-extraction-lab`

---

## CATEGORY 9: FORENSIC AUDIT REPORTS

### Forensic Audit Reports (10 files generated during this audit)
**Value**: Historically valuable
**Reason**: Documents forensic audit process
**Runtime Value**: NONE (documentation only)
**Files**:
- EXECUTION_GRAPH.md
- DEAD_CODE_REPORT.md
- PACKAGE_BLOAT_REPORT.md
- TOPOLOGY_DRIFT_REPORT.md
- ENV_DRIFT_MATRIX.md
- IMPORT_AUTHORITY_REPORT.md
- FRONTEND_BACKEND_DRIFT.md
- INFRASTRUCTURE_THEATER_REPORT.md
- RUNTIME_TRUTH_REPORT.md
- CONVERGENCE_REPORT.md

**Recommendation**: Archive to `archive/audits/forensic-2026-06-13/`
**Command**: `mkdir -p archive/audits/forensic-2026-06-13 && mv EXECUTION_GRAPH.md DEAD_CODE_REPORT.md PACKAGE_BLOAT_REPORT.md TOPOLOGY_DRIFT_REPORT.md ENV_DRIFT_MATRIX.md IMPORT_AUTHORITY_REPORT.md FRONTEND_BACKEND_DRIFT.md INFRASTRUCTURE_THEATER_REPORT.md RUNTIME_TRUTH_REPORT.md CONVERGENCE_REPORT.md archive/audits/forensic-2026-06-13/`

---

## CATEGORY 10: CONFIGURATION THEATER

### config.yaml
**Value**: Technically valuable
**Reason**: Contains research configuration patterns
**Runtime Value**: NONE (not used by runtime)
**Files**: 1 file

**Recommendation**: Archive to `archive/config/`
**Command**: `mkdir -p archive/config && mv config.yaml archive/config/`

---

### workspace/cache/config.yaml
**Value**: Technically valuable
**Reason**: Duplicate of config.yaml
**Runtime Value**: NONE (not used by runtime)
**Files**: 1 file

**Recommendation**: Archive to `archive/config/`
**Command**: `mv workspace/cache/config.yaml archive/config/`

---

## ARCHIVAL STRUCTURE RECOMMENDATION

### Option 1: Single Archive Directory
```
CRX/
├── archive/
│   ├── constitution/
│   ├── knowledge/
│   ├── audits/
│   │   ├── root/
│   │   ├── replay/
│   │   ├── infra/
│   │   └── forensic-2026-06-13/
│   ├── vos/
│   ├── labs/
│   │   ├── constitutional-integration/
│   │   └── constitutional-extraction/
│   └── config/
├── gateway/
├── runtime/
├── CascadeProjects/infra/ui-next/
└── [runtime files]
```

**Pros**: Single location for all archived content
**Cons**: Large archive directory

---

### Option 2: Separate Documentation Repository
```
crx-docs/
├── constitution/
├── knowledge/
├── audits/
├── vos/
├── labs/
└── config/

CRX/
├── gateway/
├── runtime/
├── CascadeProjects/infra/ui-next/
└── [runtime files]
```

**Pros**: Clean separation of concerns
**Cons**: Requires git submodule or separate repository management

---

### Option 3: Git Tag Snapshots
```
# Create tag before cleanup
git tag -a archive-2026-06-13 -m "Archive snapshot before convergence"

# Cleanup repository
[delete/archive commands]

# Archive remains accessible via git tag
git checkout archive-2026-06-13
```

**Pros**: No file movement, preserves history
**Cons**: Archived content still in repository (bloat)

---

## RECOMMENDED APPROACH

**Primary**: Option 1 (Single Archive Directory)
- Keeps archived content accessible
- Clean separation from runtime
- Easy to browse archived content
- Can be moved to separate repository later

**Secondary**: Option 3 (Git Tag Snapshot)
- Create tag before cleanup
- Provides historical reference
- Can recover deleted content if needed

**Combined Approach**:
1. Create git tag: `git tag -a archive-2026-06-13 -m "Archive snapshot before convergence"`
2. Move non-runtime content to `archive/` directory
3. If archive grows too large, move to separate repository

---

## VALUE CLASSIFICATION SUMMARY

| Category | Historical | Emotional | Technical | Runtime | Action |
|----------|------------|-----------|-----------|---------|--------|
| constitution/ | YES | YES | NO | NO | Archive |
| knowledge/ | YES | YES | YES | NO | Archive |
| Root audit reports | YES | NO | YES | NO | Archive |
| vos/ | YES | YES | NO | NO | Archive |
| Runtime/Replay audits | YES | NO | YES | NO | Archive |
| CascadeProjects/infra docs | YES | NO | YES | NO | Archive |
| Constitutional labs | YES | NO | NO | NO | Archive |
| Constitutional extraction lab | YES | NO | NO | NO | Archive |
| Forensic audit reports | YES | NO | YES | NO | Archive |
| config.yaml | NO | NO | YES | NO | Archive |

---

## WHAT TO KEEP IN ROOT

**DO NOT Archive**:
- README.md (runtime documentation)
- package.json (workspace configuration)
- pnpm-workspace.yaml (workspace configuration)
- MINIMAL_RUNTIME.md (new runtime documentation)
- SAFE_TO_DELETE.md (cleanup plan)
- ARCHIVE_INSTEAD_OF_DELETE.md (archive plan)
- RUNTIME_HARDENING.md (hardening plan)
- RECOMMENDED_STRUCTURE.md (structure plan)
- CLEANUP_COMMANDS.sh (execution commands)
- CONVERGENCE_FINAL.md (final report)

**Reason**: These are runtime-relevant or convergence-relevant documents

---

## ESTIMATED ARCHIVE SIZE

**Files to Archive**: ~200 files
**Estimated Size**: ~5-10 MB (mostly text files)
**Estimated Complexity Reduction**: Significant (removes 85% of repository bloat)

---

## EXECUTION ORDER

1. Create git tag snapshot
2. Create archive/ directory structure
3. Archive constitutional documents
4. Archive knowledge base
5. Archive root audit reports
6. Archive VOS documentation
7. Archive runtime/replay audits
8. Archive CascadeProjects/infra docs
9. Archive constitutional labs
10. Archive constitutional extraction lab
11. Archive forensic audit reports
12. Archive config files
13. Verify runtime still functions
14. Commit changes
