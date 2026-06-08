# LEGACY MIGRATION PLAN

**Migration Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** 80+ legacy files exist across 3 directories (constitutional-integration-lab, ai-stack, CascadeProjects).

**FACT:** These directories contain old audits, obsolete reports, superseded investigations, and abandoned scaffolds.

**FACT:** No files should be deleted - all should be moved to legacy/ for preservation.

**INFERENCE:** Legacy migration is required to establish clean repository structure.

**RECOMMENDATION:** Move all legacy directories to legacy/ subdirectory.

---

## Legacy Directory 1: constitutional-integration-lab/

### Classification: LEGACY

**Reason:** Superseded investigation, no longer authoritative

**File Count:** 41+ files

**Subdirectories:**
- comparisons/ (7 comparison documents)
- duplicate_matrix/ (1 duplicate matrix)
- extracted/ (50+ extracted files)
- inventories/ (2 inventory documents)
- mappings/ (1 mapping document)
- reports/ (13 report documents)
- temporary/ (4 temporary files)

**Migration Path:** `constitutional-integration-lab/` → `legacy/constitutional-integration-lab/`

**Files to Move:**
- constitutional-integration-lab/comparisons/canonical_engine_vs_canonical_fingerprint_service.md
- constitutional-integration-lab/comparisons/canonical_engine_vs_fingerprint_service.md
- constitutional-integration-lab/comparisons/commit_controller_vs_execution_integrity_auditor.md
- constitutional-integration-lab/comparisons/dag_validator_vs_formal_invariant_graph_verifier.md
- constitutional-integration-lab/comparisons/event_log_vs_deterministic_replay_harness.md
- constitutional-integration-lab/comparisons/identity_engine_vs_canonical_fingerprint_service.md
- constitutional-integration-lab/comparisons/identity_engine_vs_fingerprint_service.md
- constitutional-integration-lab/duplicate_matrix/constitutional_duplicate_matrix.md
- constitutional-integration-lab/extracted/js_txt/* (50+ files)
- constitutional-integration-lab/extracted/schemas/* (6 files)
- constitutional-integration-lab/inventories/js_txt_module_inventory.md
- constitutional-integration-lab/inventories/crx_repository_inventory.md
- constitutional-integration-lab/mappings/constitutional_authority_registry.md
- constitutional-integration-lab/reports/runtime_boot_audit.md
- constitutional-integration-lab/reports/reuse_before_create_report.md
- constitutional-integration-lab/reports/replay_kernel_stabilization.md
- constitutional-integration-lab/reports/replay_criticality_report.md
- constitutional-integration-lab/reports/lineage_authority_consolidation.md
- constitutional-integration-lab/reports/kernel_purity_violations.md
- constitutional-integration-lab/reports/kernel_purity_enforcement.md
- constitutional-integration-lab/reports/infra_collapse_plan.md
- constitutional-integration-lab/reports/fingerprint_authority_extraction.md
- constitutional-integration-lab/reports/event_authority_consolidation.md
- constitutional-integration-lab/reports/environment_drift_report.md
- constitutional-integration-lab/reports/duplicate_authority_collapse.md
- constitutional-integration-lab/reports/controlled_extraction_execution_plan.md
- constitutional-integration-lab/reports/constitutional_extraction_execution_plan.md
- constitutional-integration-lab/temporary/js_module_stats.csv
- constitutional-integration-lab/temporary/js_module_analysis.csv
- constitutional-integration-lab/temporary/crx_raw_inventory.csv
- constitutional-integration-lab/temporary/crx_classified.csv

**Total:** 41+ files

**Classification:** LEGACY

**Authority Level:** NONE

---

## Legacy Directory 2: ai-stack/

### Classification: LEGACY

**Reason:** Abandoned AI stack, superseded by constitutional architecture

**File Count:** 3 files

**Subdirectories:**
- api/ (1 Python file, 1 cache file)
- python-env/ (1 Dockerfile)

**Migration Path:** `ai-stack/` → `legacy/ai-stack/`

**Files to Move:**
- ai-stack/api/main.py
- ai-stack/api/__pycache__/main.cpython-311.pyc
- ai-stack/python-env/Dockerfile

**Total:** 3 files

**Classification:** LEGACY

**Authority Level:** NONE

---

## Legacy Directory 3: CascadeProjects/

### Classification: LEGACY

**Reason:** Shadow repository, superseded by canonical CRX repository

**File Count:** 36 files

**Subdirectories:**
- agents/ (1 README)
- constitutional-extraction-lab/ (17 files)
- events/ (2 files)
- infra/ (5 files)
- kernel/ (2 files)
- policies/ (2 files)
- prompts/ (2 files)
- replay/ (1 README)
- runtime/ (1 README)
- schemas/ (2 files)
- tests/ (1 README)
- AGENT.md (duplicate constitutional document)
- README.md (project overview)

**Migration Path:** `CascadeProjects/` → `legacy/CascadeProjects/`

**Files to Move:**
- CascadeProjects/AGENT.md
- CascadeProjects/README.md
- CascadeProjects/agents/README.md
- CascadeProjects/constitutional-extraction-lab/comparisons/canonical/canonical_comparison.md
- CascadeProjects/constitutional-extraction-lab/comparisons/event/event_comparison.md
- CascadeProjects/constitutional-extraction-lab/comparisons/hashing/hashing_comparison.md
- CascadeProjects/constitutional-extraction-lab/comparisons/lineage/lineage_comparison.md
- CascadeProjects/constitutional-extraction-lab/comparisons/replay/replay_comparison.md
- CascadeProjects/constitutional-extraction-lab/mappings/extraction-map.md
- CascadeProjects/constitutional-extraction-lab/mappings/js-to-kernel.md
- CascadeProjects/constitutional-extraction-lab/reports/duplicate-systems.md
- CascadeProjects/constitutional-extraction-lab/reports/execution-replay-separation.md
- CascadeProjects/constitutional-extraction-lab/reports/file-level-action-plan.md
- CascadeProjects/constitutional-extraction-lab/reports/infrastructure-drift.md
- CascadeProjects/constitutional-extraction-lab/reports/kernel-alignment.md
- CascadeProjects/constitutional-extraction-lab/reports/replay-risk.md
- CascadeProjects/constitutional-extraction-lab/reports/storage-authority-violations.md
- CascadeProjects/events/README.md
- CascadeProjects/events/canonical-event-envelope.json
- CascadeProjects/infra/docker-compose.yml
- CascadeProjects/infra/observability/loki-config.yml
- CascadeProjects/infra/observability/prometheus.yml
- CascadeProjects/infra/observability/tempo-config.yml
- CascadeProjects/infra/scripts/init-db.sql
- CascadeProjects/kernel/README.md
- CascadeProjects/kernel/doctrine/constitutional-principles.md
- CascadeProjects/kernel/invariants/system-invariants.md
- CascadeProjects/policies/README.md
- CascadeProjects/policies/constitutional/reuse-before-create.md
- CascadeProjects/prompts/README.md
- CascadeProjects/prompts/constitutional/audit-agent.md
- CascadeProjects/replay/README.md
- CascadeProjects/runtime/README.md
- CascadeProjects/schemas/README.md
- CascadeProjects/schemas/foundational-primitives.json
- CascadeProjects/tests/README.md

**Total:** 36 files

**Classification:** LEGACY

**Authority Level:** NONE

---

## Migration Commands

### Step 1: Create legacy/ directory structure

**Command:** `mkdir -p C:\Users\nolan\CRX\legacy\audits`
**Command:** `mkdir -p C:\Users\nolan\CRX\legacy\abandoned`
**Command:** `mkdir -p C:\Users\nolan\CRX\legacy\historical`

**Classification:** PREPARATION

---

### Step 2: Move constitutional-integration-lab/ to legacy/

**Command:** `mv C:\Users\nolan\CRX\constitutional-integration-lab C:\Users\nolan\CRX\legacy\constitutional-integration-lab`

**Classification:** MIGRATION

**Files Moved:** 41+

**Risk:** LOW

---

### Step 3: Move ai-stack/ to legacy/

**Command:** `mv C:\Users\nolan\CRX\ai-stack C:\Users\nolan\CRX\legacy\ai-stack`

**Classification:** MIGRATION

**Files Moved:** 3

**Risk:** LOW

---

### Step 4: Move CascadeProjects/ to legacy/

**Command:** `mv C:\Users\nolan\CRX\CascadeProjects C:\Users\nolan\CRX\legacy\CascadeProjects`

**Classification:** MIGRATION

**Files Moved:** 36

**Risk:** LOW

---

## Legacy Subdirectory Organization

### legacy/audits/

**Purpose:** Old audit reports

**Contents:** None (currently)

**Migration Path:** None (no old audits identified outside legacy directories)

---

### legacy/abandoned/

**Purpose:** Abandoned projects

**Contents:** 
- legacy/ai-stack/ (abandoned AI stack)
- legacy/CascadeProjects/ (abandoned shadow repository)

**Migration Path:** Already in legacy/

---

### legacy/historical/

**Purpose:** Historical artifacts

**Contents:**
- legacy/constitutional-integration-lab/ (historical investigation)

**Migration Path:** Already in legacy/

---

## Preservation Policy

**FACT:** No legacy files will be deleted

**FACT:** All legacy files will be preserved in legacy/ directory

**FACT:** Legacy files will remain accessible for reference

**FACT:** Legacy files will not be included in canonical repository structure

**Classification:** PRESERVATION

---

## Migration Summary

**Total Files to Move:** 80+ files

**Total Directories to Move:** 3 directories

**Migration Time Estimate:** 5 minutes

**Risk Level:** LOW

**Blocking Issues:** None

---

## Final Classification

**FACT:** 41+ files in constitutional-integration-lab/ to move to legacy/

**FACT:** 3 files in ai-stack/ to move to legacy/

**FACT:** 36 files in CascadeProjects/ to move to legacy/

**FACT:** 0 files to delete (all preserved)

**FACT:** 0 files to remain in current location (all legacy directories moved)

**INFERENCE:** Legacy migration is straightforward with no blocking issues

**RECOMMENDATION:** Execute legacy migration commands in sequence
