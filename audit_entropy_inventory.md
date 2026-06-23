# AUDIT ENTROPY INVENTORY

**Date:** 2026-06-22  
**Phase:** SWEEP27 Phase 3 - Audit Entropy Isolation  
**Purpose:** Inventory audit artifacts and recommend archive candidates  
**Mode:** INVENTORY ONLY - NO DELETIONS

---

## INVENTORY SCOPE

**Patterns:**
- SWEEP*
- PHASE*
- AUDIT*
- AUTHORITY*
- CONSTITUTIONAL*
- *CERTIFICATION*

---

## FILE COUNTS

### SWEEP* Files
**Total:** 39 files

**Distribution:**
- Root: 23 files
- brainos/orchestration/docs/constitutional/: 6 files
- docs/constitutional/: 8 files
- brainos/orchestration/docs/constitutional/ (duplicates): 2 files

**Duplicate Groups:**
- SWEEP_A1_AUTHORITY_PATH_MATRIX.md (3 copies)
- SWEEP_A2_EVENT_FIRST_ORDERING.md (3 copies)
- SWEEP_A3_REPLAY_RECONSTRUCTION.md (3 copies)
- SWEEP_A4_RUNTIME_SOVEREIGNTY.md (3 copies)
- SWEEP_A5_SOVEREIGNTY_MIGRATION_PLAN.md (3 copies)

---

### PHASE* Files
**Total:** 21 files

**Distribution:**
- Root: 8 files
- brainos/newsletter/: 8 files
- runtime/replay/: 2 files
- backup_test/replay/: 2 files (backup artifacts)
- backup_verify/replay/: 2 files (backup artifacts)

**Duplicate Groups:**
- PHASE1A_RUNTIME_DEPENDENCY_AUDIT.md (3 copies)
- PHASE9_RECERTIFICATION_REPORT.md (3 copies)

**Backup Artifacts:**
- backup_test/ (4 files)
- backup_verify/ (4 files)

---

### AUDIT* Files
**Total:** 0 files with exact AUDIT* pattern

**Note:** Many files contain "AUDIT" in name but don't match exact pattern. These are captured in other categories.

---

### AUTHORITY* Files
**Total:** 17 files

**Distribution:**
- Root: 13 files
- CascadeProjects/infra/: 1 file
- backup_test/vault/: 1 file (backup artifact)
- backup_verify/vault/: 1 file (backup artifact)
- vault/: 1 file (canonical)

**Backup Artifacts:**
- backup_test/vault/AUTHORITY_MAP.md (backup artifact)
- backup_verify/vault/AUTHORITY_MAP.md (backup artifact)

**Canonical:**
- vault/AUTHORITY_MAP.md (canonical authority)

---

### CONSTITUTIONAL* Files
**Total:** 42 files

**Distribution:**
- Root: 13 files
- backup_test/replay/: 3 files (backup artifacts)
- backup_verify/replay/: 3 files (backup artifacts)
- brainos/newsletter/docs/constitutional/: 7 files
- brainos/orchestration/docs/architecture/: 2 files
- brainos/orchestration/docs/audit/: 7 files
- brainos/orchestration/docs/protocol/: 2 files
- docs/constitutional/: 8 files
- runtime/replay/: 3 files (canonical)

**Backup Artifacts:**
- backup_test/replay/ (3 files)
- backup_verify/replay/ (3 files)

**Canonical:**
- runtime/replay/ (3 files)

---

### *CERTIFICATION* Files
**Total:** 29 files

**Distribution:**
- Root: 18 files
- backup_test/replay/: 2 files (backup artifacts)
- backup_test/replay/corpus/: 1 file (backup artifact)
- backup_test/vault/audits/: 1 file (backup artifact)
- backup_verify/replay/: 2 files (backup artifacts)
- backup_verify/replay/corpus/: 1 file (backup artifact)
- backup_verify/vault/audits/: 1 file (backup artifact)
- docs/adr/: 1 file
- runtime/replay/: 2 files (canonical)
- runtime/replay/corpus/: 1 file (canonical)
- vault/audits/: 1 file (canonical)

**Backup Artifacts:**
- backup_test/ (5 files)
- backup_verify/ (5 files)

**Canonical:**
- runtime/replay/ (3 files)
- vault/audits/ (1 file)

---

## TOTAL COUNTS

**Pattern-Based Files:** 148 files

**Breakdown:**
- SWEEP*: 39
- PHASE*: 21
- AUTHORITY*: 17
- CONSTITUTIONAL*: 42
- CERTIFICATION*: 29

**Backup Artifacts:** 18 files
- backup_test/: 9 files
- backup_verify/: 9 files

**Canonical Files:** 130 files

---

## DUPLICATE GROUPS

### High-Priority Duplicates (3+ copies)
1. SWEEP_A1_AUTHORITY_PATH_MATRIX.md (3 copies)
2. SWEEP_A2_EVENT_FIRST_ORDERING.md (3 copies)
3. SWEEP_A3_REPLAY_RECONSTRUCTION.md (3 copies)
4. SWEEP_A4_RUNTIME_SOVEREIGNTY.md (3 copies)
5. SWEEP_A5_SOVEREIGNTY_MIGRATION_PLAN.md (3 copies)
6. PHASE1A_RUNTIME_DEPENDENCY_AUDIT.md (3 copies)
7. PHASE9_RECERTIFICATION_REPORT.md (3 copies)

### Medium-Priority Duplicates (2+ copies)
- Multiple constitutional audit reports across directories
- Certification documents in multiple locations

---

## FILE SIZE ANALYSIS

### Files > 5MB
**Status:** ⏳ PENDING

**Note:** Need to run size analysis on all 148 files.

---

## GENERATED ARTIFACTS

### Backup Artifacts (18 files)
**Location:** backup_test/, backup_verify/  
**Status:** DELETE CANDIDATES  
**Reason:** Temporary backup verification directories

**Files:**
- backup_test/replay/ (4 files)
- backup_test/vault/ (1 file)
- backup_test/replay/corpus/ (1 file)
- backup_test/replay/corpus/CORPUS_CERTIFICATION.md (1 file)
- backup_test/vault/audits/ (1 file)
- backup_test/vault/audits/HUMAN_OBSERVABILITY_CERTIFICATION.md (1 file)
- backup_verify/ (mirror of backup_test)

### Generated Reports
**Status:** REVIEW CANDIDATES  
**Reason:** Historical audit reports, may be archived

**Candidates:**
- SWEEP1-17 (17 historical sweep reports)
- SWEEP21, SWEEP28 (2 additional sweep reports)
- SWEEP_A1-A5 (5 sweep reports)
- PHASE1-9 (9 phase reports)
- PHASE_E (1 phase report)
- Multiple constitutional audit reports

---

## ARCHIVE RECOMMENDATIONS

### Immediate Archive Candidates (Safe to Delete)

1. **backup_test/ directory**
   - **Files:** 9 files
   - **Reason:** Temporary backup verification
   - **Action:** Delete entire directory

2. **backup_verify/ directory**
   - **Files:** 9 files
   - **Reason:** Temporary backup verification
   - **Action:** Delete entire directory

### Historical Archive Candidates (Move to Historical/)

1. **SWEEP1-17 Reports** (17 files)
   - **Reason:** Historical sweep audits
   - **Action:** Move to vault/Historical/SWEEPS/

2. **SWEEP_A1-A5 Reports** (5 files)
   - **Reason:** Historical sweep audits
   - **Action:** Move to vault/Historical/SWEEPS/

3. **PHASE1-9 Reports** (9 files)
   - **Reason:** Historical phase audits
   - **Action:** Move to vault/Historical/PHASES/

4. **Duplicate SWEEP Reports** (15 files)
   - **Reason:** Duplicates in docs/constitutional/ and brainos/orchestration/docs/constitutional/
   - **Action:** Keep canonical, archive duplicates

### Consolidation Candidates

1. **AUTHORITY_AUDIT_RAW.txt**
   - **Size:** 4.2MB
   - **Reason:** Large raw audit file
   - **Action:** Compress or archive

2. **IDENTITY_LINEAGE_RAW.txt**
   - **Size:** 6.9MB
   - **Reason:** Large raw lineage file
   - **Action:** Compress or archive

---

## NO DELETION POLICY

**Policy:** NO DELETIONS PERFORMED  
**Status:** INVENTORY ONLY

**Recommended Actions:**
1. Delete backup_test/ and backup_verify/ (safe)
2. Move historical reports to vault/Historical/
3. Consolidate duplicates
4. Compress large raw files

**All actions require user approval before execution.**

---

## SUMMARY

**Total Files:** 148  
**Duplicates:** 7 groups (3+ copies)  
**Backup Artifacts:** 18 files  
**Generated Reports:** ~100 files  
**Files > 5MB:** 2 identified (pending full scan)

**Archive Candidates:**
- Immediate: 18 files (backup artifacts)
- Historical: ~50 files (sweep/phase reports)
- Consolidation: 15 files (duplicates)

**Next Phase:** SWEEP27 Phase 4 - Memory Chain Validation
