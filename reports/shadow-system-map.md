# Shadow System Map

**Audit Date:** 2026-06-07  
**Protocol:** CRX Layer 0B — Sovereignty Stabilization Audit  
**Mode:** READ-ONLY  
**Classification:** FACT, INFERENCE, UNKNOWN

---

## Executive Summary

**FACT:** Two CRX repository locations exist with overlapping content.

**FACT:** CascadeProjects is identified as GENERATED_BY_AGENT in wrong location per REPOSITORY_PROVENANCE_MAP.md.

**FACT:** Multiple duplicate files exist across locations.

**INFERENCE:** Shadow systems create authority risk and must be eliminated or clearly marked as non-authoritative.

---

## Canonical Repository Root

**FACT:** `C:\Users\nolan\CRX\` is the canonical repository root.

**FACT:** Repository structure is multi-repo workspace:
```
CRX/                          ← Constitutional workspace root (no root .git yet)
├── AGENT.md                  ← Constitutional directive (Priority 1)
├── knowledge/                ← Sub-repo (branch: master)
├── vos/                      ← Sub-repo (branch: main)
├── runtime/                  ← Sub-repo (branch: audit-hardening)
└── agents/                   ← Scaffold (no .git)
```

---

## Shadow Repository Location

**FACT:** `C:\Users\nolan\CascadeProjects\` exists with infrastructure structure.

**FACT:** Per REPOSITORY_PROVENANCE_MAP.md, CascadeProjects is GENERATED_BY_AGENT (wrong location created during confusion).

**FACT:** CascadeProjects contains:
- README.md
- AGENT.md (duplicate)
- infra/docker-compose.yml (infrastructure stack)
- infra/.env (configuration)
- agents/, events/, kernel/, policies/, prompts/, replay/, runtime/, schemas/, tests/ directories

---

## Duplicate File Inventory

### Constitutional Documents

| File | Canonical Location | Shadow Location | Status |
|------|-------------------|-----------------|--------|
| AGENT.md | C:\Users\nolan\CRX\AGENT.md | C:\Users\nolan\CascadeProjects\AGENT.md | DUPLICATE |
| README.md | C:\Users\nolan\CRX\knowledge\README.md | C:\Users\nolan\CascadeProjects\README.md | DIFFERENT CONTENT |

### Infrastructure Files

| File | Canonical Location | Shadow Location | Status |
|------|-------------------|-----------------|--------|
| docker-compose.yml | MISSING (infra/ does not exist) | C:\Users\nolan\CascadeProjects\infra\docker-compose.yml | SHADOW ONLY |
| .env | MISSING (infra/ does not exist) | C:\Users\nolan\CascadeProjects\infra\.env | SHADOW ONLY |

### Agent Files

| File | Canonical Location | Shadow Location | Status |
|------|-------------------|-----------------|--------|
| docker-compose.yml | C:\Users\nolan\CRX\agents\docker-compose.yml | MISSING | CANONICAL ONLY |
| agent_permissions.md | C:\Users\nolan\CRX\agents\agent_permissions.md | MISSING | CANONICAL ONLY |

---

## Shadow System Classification

### Shadow System 1: CascadeProjects Infrastructure

**Location:** `C:\Users\nolan\CascadeProjects\infra\`

**Components:**
- docker-compose.yml (postgres, redis, ollama, prometheus, grafana, loki, tempo)
- .env (configuration)
- volumes/ (data persistence)
- observability/ (prometheus.yml, loki-config.yml, tempo-config.yaml)
- scripts/ (init-db.sql)

**Status:** SHADOW AUTHORITY

**Constitutional Compliance:** PARTIAL (matches AGENT.md service requirements but in wrong location)

**Risk:** HIGH (future agents may mistake for canonical infrastructure)

**Resolution:** Move to CRX/infra/ or delete

---

### Shadow System 2: CascadeProjects AGENT.md

**Location:** `C:\Users\nolan\CascadeProjects\AGENT.md`

**Status:** DUPLICATE CONSTITUTIONAL DOCUMENT

**Constitutional Compliance:** IDENTICAL to canonical (older version)

**Risk:** HIGH (shadow constitutional authority)

**Resolution:** Delete

---

### Shadow System 3: CascadeProjects Directory Structure

**Location:** `C:\Users\nolan\CascadeProjects\`

**Components:**
- agents/ (empty scaffold)
- events/ (README only)
- kernel/ (README only)
- policies/ (README only)
- prompts/ (README only)
- replay/ (README only)
- runtime/ (README only)
- schemas/ (README only)
- tests/ (README only)

**Status:** GENERATED SCAFFOLD

**Constitutional Compliance:** UNKNOWN (scaffold only, no implementation)

**Risk:** MEDIUM (confusing directory structure)

**Resolution:** Delete entire CascadeProjects directory

---

### Shadow System 4: Agents Docker Compose

**Location:** `C:\Users\nolan\CRX\agents\docker-compose.yml`

**Status:** BROKEN SCAFFOLD

**Components:**
- planner-agent (Dockerfile.planner)
- refactor-agent (Dockerfile.refactor)
- documentation-agent (Dockerfile.documentation)
- governance-agent (Dockerfile.governance)

**Constitutional Compliance:** VIOLATION (references non-existent directories)

**Risk:** MEDIUM (broken infrastructure, cannot boot)

**Resolution:** Delete (agent runtime not implemented per AGENT.md)

---

## Canonical vs Shadow Comparison

### Infrastructure Stack

| Component | Canonical (CRX) | Shadow (CascadeProjects) | Constitutional Mandate |
|-----------|----------------|--------------------------|----------------------|
| docker-compose.yml | MISSING | EXISTS (infra/) | MUST exist in infra/ |
| .env | MISSING | EXISTS (infra/) | MUST exist in infra/ |
| postgres | MISSING | EXISTS | REQUIRED per AGENT.md |
| redis | MISSING | EXISTS | REQUIRED per AGENT.md |
| ollama | MISSING | EXISTS | REQUIRED per AGENT.md |
| prometheus | MISSING | EXISTS | REQUIRED per AGENT.md |
| grafana | MISSING | EXISTS | REQUIRED per AGENT.md |
| loki | MISSING | EXISTS | REQUIRED per AGENT.md |
| tempo | MISSING | EXISTS | REQUIRED per AGENT.md |

**INFERENCE:** CascadeProjects infrastructure stack matches AGENT.md requirements but is in wrong location.

**RECOMMENDATION:** Move CascadeProjects/infra/ to CRX/infra/ to satisfy constitutional mandate.

---

### Constitutional Documents

| Document | Canonical (CRX) | Shadow (CascadeProjects) | Status |
|----------|----------------|--------------------------|--------|
| AGENT.md | EXISTS (Priority 1) | EXISTS (duplicate) | DUPLICATE |
| UCIA-CONSTITUTION-v1.0.md | EXISTS (knowledge/authoritative/) | MISSING | CANONICAL ONLY |
| COS CONSTITUTION.md | EXISTS (vos/cos/) | MISSING | CANONICAL ONLY |

**INFERENCE:** Only AGENT.md is duplicated. Other constitutional documents exist only in canonical location.

**RECOMMENDATION:** Delete CascadeProjects/AGENT.md.

---

## Shadow System Risk Assessment

### Risk 1: Repository Location Confusion

**SEVERITY:** HIGH

**EVIDENCE:** Two CRX repository locations exist (CRX and CascadeProjects).

**RISK:** Future agents may mistake CascadeProjects for canonical repository.

**MITIGATION:** Delete CascadeProjects or clearly mark as non-authoritative.

---

### Risk 2: Infrastructure Authority Drift

**SEVERITY:** HIGH

**EVIDENCE:** Constitutional infrastructure exists in CascadeProjects/infra/ but AGENT.md mandates infra/ in CRX/.

**RISK:** Agents may implement infrastructure in wrong location.

**MITIGATION:** Move CascadeProjects/infra/ to CRX/infra/ or delete.

---

### Risk 3: Duplicate Constitutional Document

**SEVERITY:** HIGH

**EVIDENCE:** AGENT.md exists in both CRX/ and CascadeProjects/.

**RISK:** Constitutional authority confusion.

**MITIGATION:** Delete CascadeProjects/AGENT.md.

---

### Risk 4: Broken Agent Infrastructure

**SEVERITY:** MEDIUM

**EVIDENCE:** agents/docker-compose.yml exists but is broken (references non-existent directories).

**RISK:** Agents may attempt to use broken infrastructure.

**MITIGATION:** Delete agents/docker-compose.yml.

---

## Shadow System Elimination Plan

### Phase 1: Eliminate CascadeProjects

**ACTION:** Delete entire `C:\Users\nolan\CascadeProjects\` directory.

**JUSTIFICATION:** Per REPOSITORY_PROVENANCE_MAP.md, CascadeProjects is GENERATED_BY_AGENT in wrong location.

**RISK:** LOW (no canonical content in CascadeProjects)

---

### Phase 2: Create Canonical Infrastructure

**ACTION:** Create `C:\Users\nolan\CRX\infra\` directory.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\docker-compose.yml` to `C:\Users\nolan\CRX\infra\docker-compose.yml`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\.env` to `C:\Users\nolan\CRX\infra\.env`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\volumes\` to `C:\Users\nolan\CRX\infra\volumes\`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\observability\` to `C:\Users\nolan\CRX\infra\observability\`.

**ACTION:** Move `C:\Users\nolan\CascadeProjects\infra\scripts\` to `C:\Users\nolan\CRX\infra\scripts\`.

**JUSTIFICATION:** AGENT.md mandates canonical infrastructure in infra/.

**RISK:** LOW (content matches constitutional requirements)

---

### Phase 3: Delete Broken Agent Infrastructure

**ACTION:** Delete `C:\Users\nolan\CRX\agents\docker-compose.yml`.

**ACTION:** Delete `C:\Users\nolan\CRX\agents\Dockerfile.planner`.

**ACTION:** Delete `C:\Users\nolan\CRX\agents\Dockerfile.refactor`.

**ACTION:** Delete `C:\Users\nolan\CRX\agents\Dockerfile.documentation`.

**ACTION:** Delete `C:\Users\nolan\CRX\agents\Dockerfile.governance`.

**JUSTIFICATION:** Agent runtime not implemented per AGENT.md, infrastructure is broken.

**RISK:** LOW (agent runtime is future work, not current priority)

---

### Phase 4: Update REPOSITORY_PROVENANCE_MAP.md

**ACTION:** Update REPOSITORY_PROVENANCE_MAP.md to reflect elimination of CascadeProjects.

**ACTION:** Update REPOSITORY_PROVENANCE_MAP.md to reflect creation of CRX/infra/.

**JUSTIFICATION:** Maintain accurate provenance documentation.

**RISK:** LOW (documentation update only)

---

## Canonical System Inventory

### Canonical Repository: C:\Users\nolan\CRX\

**Constitutional Documents:**
- AGENT.md (Priority 1) - CANONICAL
- CRX_CONSTITUTION.md - FROZEN
- knowledge/authoritative/UCIA-CONSTITUTION-v1.0.md (Priority 2) - AUTHORITATIVE
- vos/cos/CONSTITUTION.md (Priority 3) - AUTHORITATIVE
- agents/agent_permissions.md (Priority 4) - AUTHORITATIVE

**Sub-repositories:**
- knowledge/ (branch: master) - UCIA specifications
- vos/ (branch: main) - COS governance + VOS diagrams
- runtime/ (branch: audit-hardening) - Kernel commit-service

**Runtime Components:**
- runtime/kernel/commit-service/src/ (8 verified components)
- server.ts, commit_controller.ts, audit_controller.ts
- identity_engine.ts, canonical_engine.ts, dag_validator.ts
- artifact_store.ts, lineage_store.ts, event_log.ts
- ledger_schema.sql

**Scaffolds:**
- agents/ (agent_permissions.md only, broken docker-compose.yml)

**Missing Canonical Infrastructure:**
- infra/ (TARGET: canonical infrastructure, not yet created)

---

## Final Classification

**FACT:** 1 shadow repository location identified (CascadeProjects).

**FACT:** 1 duplicate constitutional document identified (AGENT.md).

**FACT:** 1 shadow infrastructure stack identified (CascadeProjects/infra/).

**FACT:** 1 broken agent infrastructure identified (agents/docker-compose.yml).

**INFERENCE:** Shadow systems create HIGH authority risk.

**RECOMMENDATION:** Execute Shadow System Elimination Plan before Layer 1 implementation.
