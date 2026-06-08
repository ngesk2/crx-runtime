# REPORT_RETENTION_POLICY

**Policy Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** 61 generated reports exist across CRX root, inventory/, and reports/.

**FACT:** All generated reports should be consolidated into reports/generated/.

**FACT:** No reports should be deleted (all should be preserved).

**INFERENCE:** Report cleanup is required to consolidate generated reports.

**RECOMMENDATION:** Move all generated reports to reports/generated/ directory.

---

## Current Report Locations

### CRX Root Reports

**Location:** `C:\Users\nolan\CRX\`

**Status:** SCATTERED

**Generated Reports:**
- AUTHORITY_CONFLICT_REPORT.md
- EXECUTION_REALITY_REPORT.md
- FILE_INVENTORY.md
- REPOSITORY_PROVENANCE_MAP.md
- VERIFIED_EXISTING_FILES.md
- VERIFIED_RUNTIME_ENTRYPOINTS.md

**Total:** 6 files

**Classification:** GENERATED

**Migration Required:** YES (move to reports/generated/)

---

### inventory/ Reports

**Location:** `C:\Users\nolan\CRX\inventory\`

**Status:** SCATTERED

**Generated Reports:**
- authority-conflicts-v2.md
- authority-map.md
- infrastructure-sovereignty-report.md
- infrastructure.md
- ingestion-gap-report.md
- ingestion-readiness.md
- knowledge.md
- readiness-report.md
- replay-boundary.md
- replay-readiness-gap-analysis.md
- repositories.md
- runtime-boundary-report.md
- runtime-readiness.md
- shadow-system-map.md

**Total:** 14 files

**Classification:** GENERATED

**Migration Required:** YES (move to reports/generated/)

---

### reports/ Reports

**Location:** `C:\Users\nolan\CRX\reports\`

**Status:** SCATTERED

**Generated Reports:**
- AUDIT_OF_AUDITS.md
- AUTHORITY_EQUIVALENCE_MATRIX.md
- AUTHORITY_MIGRATION_GRAPH.md
- AUTHORITY_REUSE_MATRIX.md
- BEHAVIORAL_DIFFERENTIAL_REPORT.md
- CANONICAL_INFRA_REMEDIATION_PLAN.md
- CONSTITUTIONAL_CONFLICT_MATRIX.md
- CONSTITUTIONAL_PRIORITY_QUEUE.md
- FINAL_FORENSIC_VERDICT.md
- INFRA_GAP_REPORT.md
- KERNEL_MINIMIZATION_REPORT.md
- REPLACEMENT_SAFETY_MATRIX.md
- REPLAY_GAP_REPORT.md
- ROADMAP_TRACEABILITY_MATRIX.md
- archive_to_runtime_mapping.md
- authority-conflicts-v2.md
- authority_boundary_violations.md
- authority_classification_map.md
- constitutional-authority-reconciliation.md
- constitutional_relevance_map.md
- continuity_breaks.md
- duplicate_authority_systems.md
- event_substrate_forensics.md
- floating_module_inventory.md
- historical_strata_registry.md
- infrastructure-sovereignty-report.md
- infrastructure_reality_audit.md
- ingestion-gap-report.md
- local_corpus_topology.md
- master_corpus_inventory.md
- mergeability-report.md
- orphaned_modules.md
- pre_infra_constitutional_freeze.md
- provenance-report.md
- replay-readiness-gap-analysis.md
- replay_capability_matrix.md
- replay_critical_authority_map.md
- replay_truth_audit.md
- runtime-boundary-report.md
- shadow-system-map.md
- sovereignty-gap-report.md

**Total:** 41 files

**Classification:** GENERATED

**Migration Required:** YES (move to reports/generated/)

---

## Report Cleanup Plan

### Step 1: Create reports/generated/ Directory

**Command:** `mkdir -p C:\Users\nolan\CRX\reports\generated`

**Classification:** PREPARATION

---

### Step 2: Move CRX Root Reports to reports/generated/

**Files to Move:**
- AUTHORITY_CONFLICT_REPORT.md → reports/generated/AUTHORITY_CONFLICT_REPORT.md
- EXECUTION_REALITY_REPORT.md → reports/generated/EXECUTION_REALITY_REPORT.md
- FILE_INVENTORY.md → reports/generated/FILE_INVENTORY.md
- REPOSITORY_PROVENANCE_MAP.md → reports/generated/REPOSITORY_PROVENANCE_MAP.md
- VERIFIED_EXISTING_FILES.md → reports/generated/VERIFIED_EXISTING_FILES.md
- VERIFIED_RUNTIME_ENTRYPOINTS.md → reports/generated/VERIFIED_RUNTIME_ENTRYPOINTS.md

**Migration Commands:**
- `mv C:\Users\nolan\CRX\AUTHORITY_CONFLICT_REPORT.md C:\Users\nolan\CRX\reports\generated\AUTHORITY_CONFLICT_REPORT.md`
- `mv C:\Users\nolan\CRX\EXECUTION_REALITY_REPORT.md C:\Users\nolan\CRX\reports\generated\EXECUTION_REALITY_REPORT.md`
- `mv C:\Users\nolan\CRX\FILE_INVENTORY.md C:\Users\nolan\CRX\reports\generated\FILE_INVENTORY.md`
- `mv C:\Users\nolan\CRX\REPOSITORY_PROVENANCE_MAP.md C:\Users\nolan\CRX\reports\generated\REPOSITORY_PROVENANCE_MAP.md`
- `mv C:\Users\nolan\CRX\VERIFIED_EXISTING_FILES.md C:\Users\nolan\CRX\reports\generated\VERIFIED_EXISTING_FILES.md`
- `mv C:\Users\nolan\CRX\VERIFIED_RUNTIME_ENTRYPOINTS.md C:\Users\nolan\CRX\reports\generated\VERIFIED_RUNTIME_ENTRYPOINTS.md`

**Classification:** MIGRATION

**Files Moved:** 6

**Risk:** LOW

---

### Step 3: Move inventory/ Reports to reports/generated/

**Files to Move:**
- inventory/authority-conflicts-v2.md → reports/generated/authority-conflicts-v2-inventory.md
- inventory/authority-map.md → reports/generated/authority-map-inventory.md
- inventory/infrastructure-sovereignty-report.md → reports/generated/infrastructure-sovereignty-report-inventory.md
- inventory/infrastructure.md → reports/generated/infrastructure-inventory.md
- inventory/ingestion-gap-report.md → reports/generated/ingestion-gap-report-inventory.md
- inventory/ingestion-readiness.md → reports/generated/ingestion-readiness-inventory.md
- inventory/knowledge.md → reports/generated/knowledge-inventory.md
- inventory/readiness-report.md → reports/generated/readiness-report-inventory.md
- inventory/replay-boundary.md → reports/generated/replay-boundary-inventory.md
- inventory/replay-readiness-gap-analysis.md → reports/generated/replay-readiness-gap-analysis-inventory.md
- inventory/repositories.md → reports/generated/repositories-inventory.md
- inventory/runtime-boundary-report.md → reports/generated/runtime-boundary-report-inventory.md
- inventory/runtime-readiness.md → reports/generated/runtime-readiness-inventory.md
- inventory/shadow-system-map.md → reports/generated/shadow-system-map-inventory.md

**Migration Commands:**
- `mv C:\Users\nolan\CRX\inventory\*.md C:\Users\nolan\CRX\reports\generated\`

**Classification:** MIGRATION

**Files Moved:** 14

**Risk:** LOW

---

### Step 4: Move reports/ Reports to reports/generated/

**Files to Move:**
- All 41 files in reports/ → reports/generated/

**Migration Commands:**
- `mv C:\Users\nolan\CRX\reports\*.md C:\Users\nolan\CRX\reports\generated`

**Classification:** MIGRATION

**Files Moved:** 41

**Risk:** LOW

---

### Step 5: Delete Empty inventory/ Directory

**Command:** `rmdir C:\Users\nolan\CRX\inventory`

**Classification:** CLEANUP

---

### Step 6: Verify reports/generated/ Directory

**Verification Command:** `ls -la C:\Users\nolan\CRX\reports\generated\`

**Expected Result:** 61 generated reports

**Classification:** VERIFICATION

---

## Report Retention Policy

### Retention Period

**Policy:** All generated reports are retained indefinitely

**Reason:** Reports provide historical audit trail and reference material

**Classification:** PERMANENT_RETENTION

---

### Report Classification

### Audit Reports

**Classification:** AUDIT

**Retention:** PERMANENT

**Examples:**
- AUDIT_OF_AUDITS.md
- AUTHORITY_CONFLICT_REPORT.md
- INFRA_GAP_REPORT.md
- sovereignty-gap-report.md

---

### Gap Analysis Reports

**Classification:** GAP_ANALYSIS

**Retention:** PERMANENT

**Examples:**
- ingestion-gap-report.md
- REPLAY_GAP_REPORT.md
- replay-readiness-gap-analysis.md

---

### Forensic Reports

**Classification:** FORENSIC

**Retention:** PERMANENT

**Examples:**
- FINAL_FORENSIC_VERDICT.md
- event_substrate_forensics.md
- provenance-report.md

---

### Infrastructure Reports

**Classification:** INFRASTRUCTURE

**Retention:** PERMANENT

**Examples:**
- infrastructure-sovereignty-report.md
- infrastructure_reality_audit.md
- CANONICAL_INFRA_REMEDIATION_PLAN.md

---

### Authority Reports

**Classification:** AUTHORITY

**Retention:** PERMANENT

**Examples:**
- AUTHORITY_EQUIVALENCE_MATRIX.md
- AUTHORITY_MIGRATION_GRAPH.md
- AUTHORITY_REUSE_MATRIX.md
- constitutional-authority-reconciliation.md

---

### Planning Reports

**Classification:** PLANNING

**Retention:** PERMANENT

**Examples:**
- CONSTITUTIONAL_PRIORITY_QUEUE.md
- ROADMAP_TRACEABILITY_MATRIX.md
- mergeability-report.md

---

## Report Cleanup Summary

**Total Reports to Move:** 61 files

**Total Reports to Delete:** 0 files

**Total Reports to Keep:** 61 files

**Migration Time Estimate:** 10 minutes

**Risk Level:** LOW

**Blocking Issues:** None

---

## Final Classification

**FACT:** 6 generated reports exist in CRX root

**FACT:** 14 generated reports exist in inventory/

**FACT:** 41 generated reports exist in reports/

**FACT:** All 61 generated reports should be moved to reports/generated/

**FACT:** No reports should be deleted

**FACT:** inventory/ directory should be deleted after migration

**INFERENCE:** Report cleanup is straightforward with no blocking issues

**RECOMMENDATION:** Execute report cleanup to consolidate all generated reports
