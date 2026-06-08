# INFRA_EXTRACTION PLAN

**Extraction Date:** 2026-06-07  
**Protocol:** CRX-REPOSITORY-CONSOLIDATION-V2  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** infra/ directory exists but is completely empty (no files).

**FACT:** Infrastructure files exist in CascadeProjects/infra/ (5 files).

**FACT:** Agent infrastructure exists in agents/docker-compose.yml (not canonical infrastructure).

**FACT:** No other infrastructure files exist outside infra/ directory.

**INFERENCE:** Infrastructure extraction is required (CascadeProjects/infra/ files should be moved to infra/).

**RECOMMENDATION:** Extract infrastructure files from CascadeProjects/infra/ to infra/ directory.

---

## Current Infrastructure Location

### infra/ Directory

**Location:** `C:\Users\nolan\CRX\infra\`

**Status:** EMPTY

**Contents:**
- infra/api/ (0 files)
- infra/observability/ (0 files)
- infra/ollama/ (0 files)
- infra/postgres/ (0 files)
- infra/postgres/init/ (0 files)
- infra/redis/ (0 files)
- infra/scripts/ (0 files)
- infra/volumes/ (0 files)
- infra/worker/ (0 files)

**Total:** 9 directories (0 files)

**Classification:** INFRASTRUCTURE

**Authority Level:** MEDIUM

**Migration Required:** YES (populate with infrastructure files)

---

## Infrastructure Files Outside infra/

### CascadeProjects/infra/ Directory

**Location:** `C:\Users\nolan\CRX\CascadeProjects\infra\`

**Status:** LEGACY (shadow repository)

**Infrastructure Files:**
- CascadeProjects/infra/docker-compose.yml (canonical infrastructure stack)
- CascadeProjects/infra/observability/loki-config.yml (Loki configuration)
- CascadeProjects/infra/observability/prometheus.yml (Prometheus configuration)
- CascadeProjects/infra/observability/tempo-config.yml (Tempo configuration)
- CascadeProjects/infra/scripts/init-db.sql (database initialization script)

**Total:** 5 files

**Classification:** INFRASTRUCTURE (legacy)

**Authority Level:** NONE (legacy)

**Migration Required:** YES (move to infra/ directory)

---

### agents/docker-compose.yml

**Location:** `C:\Users\nolan\CRX\agents\docker-compose.yml`

**Status:** AGENT INFRASTRUCTURE (not canonical)

**Purpose:** Agent service orchestration

**Classification:** SCAFFOLD (agent infrastructure)

**Authority Level:** LOW

**Migration Required:** NO (keep in agents/templates/)

---

## Extraction Plan

### Step 1: Extract Infrastructure Files from CascadeProjects/infra/

**Current Location:** `CascadeProjects/infra/`

**Target Location:** `infra/`

**Files to Extract:**
- CascadeProjects/infra/docker-compose.yml → infra/compose/docker-compose.yml
- CascadeProjects/infra/observability/loki-config.yml → infra/observability/loki-config.yml
- CascadeProjects/infra/observability/prometheus.yml → infra/observability/prometheus.yml
- CascadeProjects/infra/observability/tempo-config.yml → infra/observability/tempo-config.yml
- CascadeProjects/infra/scripts/init-db.sql → infra/postgres/init/01-init-db.sql

**Migration Commands:**
- `mkdir -p C:\Users\nolan\CRX\infra\compose`
- `mkdir -p C:\Users\nolan\CRX\infra\observability`
- `mkdir -p C:\Users\nolan\CRX\infra\postgres\init`
- `mkdir -p C:\Users\nolan\CRX\infra\scripts`
- `cp C:\Users\nolan\CRX\CascadeProjects\infra\docker-compose.yml C:\Users\nolan\CRX\infra\compose\docker-compose.yml`
- `cp C:\Users\nolan\CRX\CascadeProjects\infra\observability\loki-config.yml C:\Users\nolan\CRX\infra\observability\loki-config.yml`
- `cp C:\Users\nolan\CRX\CascadeProjects\infra\observability\prometheus.yml C:\Users\nolan\CRX\infra\observability\prometheus.yml`
- `cp C:\Users\nolan\CRX\CascadeProjects\infra\observability\tempo-config.yml C:\Users\nolan\CRX\infra\observability\tempo-config.yml`
- `cp C:\Users\nolan\CRX\CascadeProjects\infra\scripts\init-db.sql C:\Users\nolan\CRX\infra\postgres\init\01-init-db.sql`

**Classification:** EXTRACTION

**Files Extracted:** 5

**Risk:** LOW

---

### Step 2: Reorganize Agent Infrastructure

**Current Location:** `agents/docker-compose.yml`

**Target Location:** `agents/templates/docker-compose.yml`

**Files to Reorganize:**
- agents/docker-compose.yml → agents/templates/docker-compose.yml

**Migration Commands:**
- `mkdir -p C:\Users\nolan\CRX\agents\templates`
- `mv C:\Users\nolan\CRX\agents\docker-compose.yml C:\Users\nolan\CRX\agents\templates\docker-compose.yml`

**Classification:** REORGANIZATION

**Files Reorganized:** 1

**Risk:** LOW

---

### Step 3: Verify Infrastructure Directory Structure

**Verification Command:** `ls -la C:\Users\nolan\CRX\infra\`

**Expected Result:** 9 directories with extracted files

**Classification:** VERIFICATION

---

### Step 4: Verify Infrastructure Files

**Verification Command:** `ls -la C:\Users\nolan\CRX\infra\compose\`

**Expected Result:** docker-compose.yml present

**Classification:** VERIFICATION

---

## Infrastructure File Inventory

### infra/compose/

**Files:**
- docker-compose.yml (canonical infrastructure stack)

**Total:** 1 file

**Classification:** INFRASTRUCTURE

**Status:** EXTRACTION REQUIRED

---

### infra/observability/

**Files:**
- loki-config.yml (Loki configuration)
- prometheus.yml (Prometheus configuration)
- tempo-config.yml (Tempo configuration)

**Total:** 3 files

**Classification:** INFRASTRUCTURE

**Status:** EXTRACTION REQUIRED

---

### infra/postgres/init/

**Files:**
- 01-init-db.sql (database initialization script)

**Total:** 1 file

**Classification:** INFRASTRUCTURE

**Status:** EXTRACTION REQUIRED

---

### infra/scripts/

**Files:**
- (empty after extraction)

**Total:** 0 files

**Classification:** INFRASTRUCTURE

**Status:** EMPTY

---

### agents/templates/

**Files:**
- docker-compose.yml (agent infrastructure)

**Total:** 1 file

**Classification:** SCAFFOLD

**Status:** REORGANIZATION REQUIRED

---

## Extraction Summary

**Total Infrastructure Files Outside infra/:** 6 files

**Total Infrastructure Files in infra/:** 0 files

**Total Infrastructure Files to Extract:** 5 files (from CascadeProjects/infra/)

**Total Infrastructure Files to Reorganize:** 1 file (agents/docker-compose.yml)

**Total Infrastructure Files to Keep:** 0 files

**Migration Time Estimate:** 5 minutes

**Risk Level:** LOW

**Blocking Issues:** None

---

## Final Classification

**FACT:** 5 infrastructure files exist in CascadeProjects/infra/ (legacy)

**FACT:** 1 infrastructure file exists in agents/ (agent infrastructure)

**FACT:** 0 infrastructure files exist in infra/ (empty)

**FACT:** Infrastructure extraction is required (5 files from legacy)

**FACT:** Agent infrastructure reorganization is required (1 file)

**INFERENCE:** Infrastructure extraction is straightforward with no blocking issues

**RECOMMENDATION:** Execute infrastructure extraction from CascadeProjects/infra/ to infra/
