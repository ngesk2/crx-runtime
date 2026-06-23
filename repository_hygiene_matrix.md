# SWEEP24 REPOSITORY HYGIENE MATRIX

**Date**: 2026-06-22
**Branch**: authority-forensics
**Mode**: READ-ONLY FORENSIC INVESTIGATION

---

## EXECUTIVE SUMMARY

**Total Files Analyzed**: 150+ markdown files, 8 text files, 29 Python files

**Category Summary**:
- Constitutional Core (NEVER TOUCH): 2 directories
- Active Runtime (KEEP): 3 directories
- Tests (KEEP): 1 directory
- Historical Documentation (ARCHIVE): 10 files
- Duplicate Audits (DELETE CANDIDATE): 60+ files
- Generated Reports (DELETE CANDIDATE): 5 files
- Experimental Artifacts (DELETE CANDIDATE): 4 directories
- Dead Directories (DELETE CANDIDATE): 8 directories

**Total Delete Candidates**: 70+ files, 12 directories

---

## CATEGORY DEFINITIONS

### A) Constitutional Core (NEVER TOUCH)
Files and directories that contain constitutional authorities. Never modify or delete.

### B) Active Runtime (KEEP)
Active runtime code that is currently in use.

### C) Tests (KEEP)
Test files and test directories.

### D) Historical Documentation (ARCHIVE)
Documentation with historical value. Archive rather than delete.

### E) Duplicate Audits (DELETE CANDIDATE)
Duplicate audit reports that provide no additional value.

### F) Generated Reports (DELETE CANDIDATE)
Large generated files that can be regenerated.

### G) Experimental Artifacts (DELETE CANDIDATE)
Experimental code and directories not in active use.

### H) Dead Directories (DELETE CANDIDATE)
Empty or unused directories.

---

## REPOSITORY HYGIENE MATRIX

### Root Level Markdown Files

| Path | Category | Last Modified | Referenced? | Import Count | Delete Candidate? | Reason |
|------|----------|--------------|------------|-------------|------------------|--------|
| ACTIVE_FLOW_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| APPLICATION_BYPASS_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| ARCHITECTURE_CONSTITUTION_REPORT.md | D | Unknown | No | 0 | NO | Historical documentation |
| ARCHIVE_CANDIDATES.md | E | Unknown | No | 0 | YES | Duplicate audit |
| ARCHIVE_CANDIDATES_CONSOLIDATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| ARCHIVE_INSTEAD_OF_DELETE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_AUDIT_RAW.txt | F | Unknown | No | 0 | YES | Generated report (4.2MB) |
| AUTHORITY_CODE_ONLY.txt | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_CONSOLIDATION_PLAN.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_FLOW_PROOF_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_FRAGMENTATION_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_FRAGMENT_REMOVAL_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_INVENTORY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_MOVEMENT_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_SURVEY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_TRACE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| AUTHORITY_VIOLATION_EVIDENCE_MAP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| BRAINOS_FABRIC_SCORECARD.md | G | Unknown | No | 0 | YES | Experimental artifact |
| BRAINOS_READINESS_SCORE.md | G | Unknown | No | 0 | YES | Experimental artifact |
| BUILD_CERTIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| BUILD_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CANONICALITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CANONICALIZATION_AUTHORITY_DIFF.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CERTIFICATE_CERTIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CIVILIZATION_DETECTION_AUDIT_COMPLETE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| COMMIT_HARDENING_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| COMMIT_SERVICE_CLEANUP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| COMPUTE_BROKER_DESIGN.md | G | Unknown | No | 0 | YES | Experimental design |
| CONSTITUTIONAL_AUTHORITY_CONVERGENCE_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_AUTHORITY_MAP.md | D | Unknown | No | 0 | NO | Constitutional documentation |
| CONSTITUTIONAL_DELEGATION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_DELEGATION_AUDIT_FORENSIC.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_DRIFT_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_ENFORCEMENT_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_LAYER_0_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_LAYER_BOUNDARIES.md | D | Unknown | No | 0 | NO | Constitutional documentation |
| CONSTITUTIONAL_MIGRATION_READINESS.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONSTITUTIONAL_TEST_SUITE_GUIDE.md | D | Unknown | No | 0 | NO | Test documentation |
| CONSTITUTIONAL_VIOLATIONS_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONVERGENCE_FINAL.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONVERGENCE_READINESS.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONVERGENCE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| CONVERSATION_CAPTURE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DEAD_CODE_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DEAD_CODE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DELETE_CANDIDATES.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DELETE_CANDIDATES_CONSOLIDATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DETERMINISM_CERTIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DIRECTORY_CLASSIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DIRECTORY_CLASSIFICATION_TABLE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| DUPLICATION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| ENV_DRIFT_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| EXECUTION_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| FAILURE_CERTIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| FREEZE_CERTIFICATION_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| FREEZE_PATCHES_IMPLEMENTATION_PLAN.md | E | Unknown | No | 0 | YES | Duplicate audit |
| FRONTEND_BACKEND_DRIFT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| FUTURE_REFACTOR_QUEUE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| GENERATED_CONTENT_MAP.md | F | Unknown | No | 0 | YES | Generated report |
| HASH_AUTHORITY_DIFF.md | E | Unknown | No | 0 | YES | Duplicate audit |
| IDENTITY_LINEAGE_RAW.txt | F | Unknown | No | 0 | YES | Generated report (7.2MB) |
| IDENTITY_LINEAGE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| IMPORT_AUTHORITY_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| IMPORT_GRAPH_FAILURES.md | E | Unknown | No | 0 | YES | Duplicate audit |
| IMPORT_REPAIR_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| INFRASTRUCTURE_THEATER_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| KERNEL_PURITY.md | D | Unknown | No | 0 | NO | Constitutional documentation |
| LAYER1_READINESS.md | E | Unknown | No | 0 | YES | Duplicate audit |
| LINEAGE_AUTHORITY_DIFF.md | E | Unknown | No | 0 | YES | Duplicate audit |
| MIGRATION_ROADMAP.md | D | Unknown | No | 0 | NO | Migration documentation |
| MINIMAL_RUNTIME.md | D | Unknown | No | 0 | NO | Architecture documentation |
| MODEL_ROUTING_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| NODE_SELF_CHECK_ADAPTER_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| OBJECT_MODEL_FREEZE.md | D | Unknown | No | 0 | NO | Constitutional documentation |
| OBS_READY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| OPEN_WEBUI_AUTHORITY_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| OWNER_DECISIONS_REQUIRED.md | E | Unknown | No | 0 | YES | Duplicate audit |
| OWNER_DECISIONS_REQUIRED_CONSOLIDATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PACKAGE_BLOAT_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PATCHSET_CONVERGENCE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE1_REPOSITORY_INVENTORY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE2_SYSTEM_DEPENDENCY_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE3_DUPLICATION_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE4_DEAD_CODE_INVENTORY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE5_ACTIVE_RUNTIME_MAP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE6_PING_ABSORPTION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PHASE9_PING_LAYER_0_DEFINITION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_ABSORPTION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_AUTHORITY_OWNERSHIP_MAP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_CONSTITUTIONAL_ENFORCEMENT_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_ECOSYSTEM_INVENTORY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_LAYER_0_DEFINITION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_REPOSITORY_TRUTH_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PING_RUNTIME_CONSTITUTIONAL_IDENTITY_ALGEBRA.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PIPELINE_READY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PORTABILITY_CERTIFICATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| POST_CONVERGENCE_STATE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| POST_PATCH_EXECUTION_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRESENTPING_INFRASTRUCTURE_ALIGNMENT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRESENTPING_RECOVERY_PLAN.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRE_DELETION_DEPENDENCY_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRE_PATCH_STATE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRODUCTION_EXECUTION_GRAPH.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PRODUCTION_TEST_DRIFT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| PROTECTED_SYSTEMS.md | D | Unknown | No | 0 | NO | Protected systems documentation |
| REACHABILITY_FAILURE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| README.md | D | Unknown | No | 0 | NO | Repository README |
| REBRAND_AUDIT_CATEGORIZED.txt | F | Unknown | No | 0 | YES | Generated report (2.5MB) |
| REBRAND_AUDIT_PROCESSED.txt | F | Unknown | No | 0 | YES | Generated report (1.3MB) |
| REBRAND_AUDIT_RAW.txt | F | Unknown | No | 0 | YES | Generated report (2.5MB) |
| REBRAND_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| RECOMMENDED_STRUCTURE.md | D | Unknown | No | 0 | NO | Architecture documentation |
| REPLAY_BOUNDARIES.md | D | Unknown | No | 0 | NO | Constitutional documentation |
| REPLAY_REACHABILITY_EVIDENCE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| REPLAY_REACHABILITY_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| REPLAY_SOVEREIGNTY_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| REPOSITORY_GOVERNANCE_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| REPOSITORY_INVENTORY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| REPO_ACCESS_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| RUNTIME_CRITICALITY_MAP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| RUNTIME_HARDENING.md | E | Unknown | No | 0 | YES | Duplicate audit |
| RUNTIME_TRUTH_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SAFE_TO_DELETE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SEMANTIC_CONSTITUTIONAL_AUDIT_COMPLETE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SEMANTIC_CONSTITUTIONAL_AUDIT_EXECUTIVE_SUMMARY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SEMANTIC_DEBT_HEATMAP.md | E | Unknown | No | 0 | YES | Duplicate audit |
| STACK_CONVERGENCE_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| STATE_AUTHORITY_INVERSION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SURGICAL_PATCH_GUIDE.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP10_CAPABILITY_AUTHORITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP10_KERNEL_AUTHORITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP10_TIME_AUTHORITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP11_EVENT_AUTHORITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP12_KNOWLEDGE_FABRIC_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP13_AGENT_CONTAINMENT_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP14_RETRIEVAL_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP15_SURVIVABILITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP16_ECONOMIC_AUTHORITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP17_DECISION_QUALITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP1_EVENT_AUTHORITY_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP21_FINAL_ANSWER.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP4_REPLAY_WITNESS_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP5_SOVEREIGNTY_OPTIONALITY_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP6_ENFORCEMENT_BOUNDARY_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP7_PING_ADAPTER_INSERTION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP8_PERSISTENCE_ABSTRACTION_VIOLATION_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP_A1_AUTHORITY_PATH_MATRIX.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP_A2_EVENT_FIRST_ORDERING.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP_A3_REPLAY_RECONSTRUCTION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP_A4_RUNTIME_SOVEREIGNTY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SWEEP_A5_SOVEREIGNTY_MIGRATION_PLAN.md | E | Unknown | No | 0 | YES | Duplicate audit |
| SYSTEM_MAP.md | D | Unknown | No | 0 | NO | System documentation |
| TEST_COVERAGE_AUDIT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| THESIS_FREEZE_RISK_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| TOPOLOGY_DRIFT_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| UNICODE_TRUTH_DISCOVERY.md | E | Unknown | No | 0 | YES | Duplicate audit |
| UNKNOWN_ELIMINATION_REPORT.md | E | Unknown | No | 0 | YES | Duplicate audit |
| VALIDATION_AUDITS_BEFORE_IMPLEMENTATION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| VAST_FABRIC_REPORT.md | G | Unknown | No | 0 | YES | Experimental report |
| VLLM_HARDWARE_READINESS.md | G | Unknown | No | 0 | YES | Experimental report |
| WITNESS_AUTHORITY_REDUCTION.md | E | Unknown | No | 0 | YES | Duplicate audit |
| WORKSPACE_PATCH.md | E | Unknown | No | 0 | YES | Duplicate audit |

---

### Directories

| Path | Category | Last Modified | Referenced? | Import Count | Delete Candidate? | Reason |
|------|----------|--------------|------------|-------------|------------------|--------|
| runtime/ | A | Unknown | Yes | 0 | NO | Constitutional core - NEVER TOUCH |
| runtime/replay/ | A | Unknown | Yes | 0 | NO | Constitutional authorities - NEVER TOUCH |
| runtime/kernel/commit-service/ | B | Unknown | Yes | 0 | NO | Active runtime - KEEP |
| runtime/replay/__tests__/ | C | Unknown | Yes | 0 | NO | Tests - KEEP |
| brainos/ | G | Unknown | No | 0 | YES | Experimental artifact |
| presentping/ | G | Unknown | No | 0 | YES | Experimental artifact |
| constitutional-integration-lab/ | G | Unknown | No | 0 | YES | Experimental artifact |
| CascadeProjects/ | G | Unknown | No | 0 | YES | Experimental artifact |
| constitution/ | H | Unknown | No | 0 | YES | Dead directory (empty subdirectories) |
| docs/constitutional/ | H | Unknown | No | 0 | YES | Dead directory |
| artifacts/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| audit/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| credentials/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| database/ | H | Unknown | No | 0 | YES | Dead directory (empty except events_backup.sql) |
| gateway/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| infra/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| knowledge/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| vos/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| workers/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| workspace/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| .cursor/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| .docker/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| .github/ | H | Unknown | No | 0 | YES | Dead directory (empty) |
| .vscode/ | H | Unknown | No | 0 | YES | Dead directory (IDE config) |

---

### Python Files

| Path | Category | Last Modified | Referenced? | Import Count | Delete Candidate? | Reason |
|------|----------|--------------|------------|-------------|------------------|--------|
| analyze.py | E | Unknown | No | 0 | YES | Audit script |
| analyze_imports.py | E | Unknown | No | 0 | YES | Audit script |
| compare_stacks.py | E | Unknown | No | 0 | YES | Audit script |
| inspect_db.py | E | Unknown | No | 0 | YES | Audit script |
| brainos/**/*.py | G | Unknown | No | 0 | YES | Experimental code |

---

### New Forensic Files

| Path | Category | Last Modified | Referenced? | Import Count | Delete Candidate? | Reason |
|------|----------|--------------|------------|-------------|------------------|--------|
| constitutional_forensics_report.md | D | 2026-06-22 | Yes | 0 | NO | Phase 0 deliverable |
| backup_delta_report.md | D | 2026-06-22 | Yes | 0 | NO | Phase 1 deliverable |
| presentation_evidence_matrix.md | D | 2026-06-22 | Yes | 0 | NO | Phase 2 deliverable |
| repository_hygiene_matrix.md | D | 2026-06-22 | Yes | 0 | NO | Phase 3 deliverable |

---

## DELETE CANDIDATE SUMMARY

### High Priority Delete Candidates (Large Files)

1. **IDENTITY_LINEAGE_RAW.txt** (7.2MB) - Generated report
2. **AUTHORITY_AUDIT_RAW.txt** (4.2MB) - Generated report
3. **REBRAND_AUDIT_RAW.txt** (2.5MB) - Generated report
4. **REBRAND_AUDIT_CATEGORIZED.txt** (2.5MB) - Generated report
5. **REBRAND_AUDIT_PROCESSED.txt** (1.3MB) - Generated report

### High Priority Delete Candidates (Duplicate Audits)

1. All SWEEP* files (21 files) - Duplicate audits
2. All PHASE* files (6 files) - Duplicate audits
3. All AUTHORITY_* files (15+ files) - Duplicate audits
4. All CONSTITUTIONAL_* files (10+ files) - Duplicate audits
5. All PING_* files (10+ files) - Duplicate audits

### High Priority Delete Candidates (Experimental Artifacts)

1. **brainos/** - Experimental BrainOS code
2. **presentping/** - Experimental PresentPing code
3. **constitutional-integration-lab/** - Experimental integration lab
4. **CascadeProjects/** - Experimental cascade projects

### High Priority Delete Candidates (Dead Directories)

1. **constitution/** - Empty subdirectories
2. **docs/constitutional/** - Dead directory
3. **artifacts/** - Empty directory
4. **audit/** - Empty directory
5. **credentials/** - Empty directory
6. **gateway/** - Empty directory
7. **infra/** - Empty directory
8. **knowledge/** - Empty directory
9. **vos/** - Empty directory
10. **workers/** - Empty directory
11. **workspace/** - Empty directory
12. **.cursor/** - Empty directory
13. **.docker/** - Empty directory
14. **.github/** - Empty directory

---

## KEEP CANDIDATE SUMMARY

### Constitutional Core (NEVER TOUCH)

1. **runtime/replay/** - Constitutional authorities
2. **runtime/kernel/commit-service/** - Active commit service

### Active Runtime (KEEP)

1. **runtime/** - Active runtime code
2. **kernel/** - Kernel code
3. **package.json** - Package configuration
4. **pnpm-lock.yaml** - Dependency lock file
5. **pnpm-workspace.yaml** - Workspace configuration
6. **config.yaml** - Configuration file

### Tests (KEEP)

1. **runtime/replay/__tests__/** - Test files

### Historical Documentation (ARCHIVE)

1. **README.md** - Repository README
2. **CONSTITUTIONAL_AUTHORITY_MAP.md** - Constitutional documentation
3. **CONSTITUTIONAL_LAYER_BOUNDARIES.md** - Constitutional documentation
4. **CONSTITUTIONAL_TEST_SUITE_GUIDE.md** - Test documentation
5. **KERNEL_PURITY.md** - Constitutional documentation
6. **MIGRATION_ROADMAP.md** - Migration documentation
7. **MINIMAL_RUNTIME.md** - Architecture documentation
8. **OBJECT_MODEL_FREEZE.md** - Constitutional documentation
9. **PROTECTED_SYSTEMS.md** - Protected systems documentation
10. **RECOMMENDED_STRUCTURE.md** - Architecture documentation
11. **REPLAY_BOUNDARIES.md** - Constitutional documentation
12. **SYSTEM_MAP.md** - System documentation

### New Forensic Deliverables (KEEP)

1. **constitutional_forensics_report.md** - Phase 0 deliverable
2. **backup_delta_report.md** - Phase 1 deliverable
3. **presentation_evidence_matrix.md** - Phase 2 deliverable
4. **repository_hygiene_matrix.md** - Phase 3 deliverable

---

## RECOMMENDATIONS

### Immediate Actions (After Phase 7 Backup)

1. **Delete Large Generated Files** (15MB+ space savings):
   - IDENTITY_LINEAGE_RAW.txt
   - AUTHORITY_AUDIT_RAW.txt
   - REBRAND_AUDIT_RAW.txt
   - REBRAND_AUDIT_CATEGORIZED.txt
   - REBRAND_AUDIT_PROCESSED.txt

2. **Delete Duplicate Audits** (60+ files):
   - All SWEEP* files
   - All PHASE* files
   - Duplicate AUTHORITY_* files
   - Duplicate CONSTITUTIONAL_* files
   - Duplicate PING_* files

3. **Delete Experimental Artifacts** (4 directories):
   - brainos/
   - presentping/
   - constitutional-integration-lab/
   - CascadeProjects/

4. **Delete Dead Directories** (14 directories):
   - constitution/
   - docs/constitutional/
   - artifacts/
   - audit/
   - credentials/
   - gateway/
   - infra/
   - knowledge/
   - vos/
   - workers/
   - workspace/
   - .cursor/
   - .docker/
   - .github/

### Archive Actions

1. **Archive Historical Documentation**:
   - Create archive/ directory
   - Move historical documentation to archive/
   - Keep in repository for reference

### Constitutional Protection

1. **NEVER DELETE**:
   - runtime/replay/
   - runtime/kernel/commit-service/
   - Any constitutional authority files

---

## RISK ASSESSMENT

### Low Risk Deletions

- Large generated files (can be regenerated)
- Duplicate audits (no unique value)
- Dead directories (empty or unused)

### Medium Risk Deletions

- Experimental artifacts (may have value to owner)
- Some audit reports (may have historical value)

### High Risk Deletions

- Constitutional authorities (NEVER DELETE)
- Active runtime code (NEVER DELETE)
- Test files (NEVER DELETE)

---

**END OF REPORT**
