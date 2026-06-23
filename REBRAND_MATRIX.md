# REBRAND_MATRIX.md

**Audit Date:** 2026-06-21
**Audit Type:** Global CRX Rebrand Audit
**Purpose:** Identify all CRX/crx/Crx occurrences for PING rebrand
**Total Matches Found:** 7610 lines across 175+ files

---

## Executive Summary

The repository contains extensive CRX terminology requiring systematic rebrand to PING. The audit identified:

- **Documentation references:** 6500+ matches (historical audits, phase reports, constitutional documents)
- **Application names:** 800+ matches (crx-newsletter-brain, crx-digestion-worker)
- **File path references:** 200+ matches (C:\Users\nolan\CRX paths)
- **Code references:** 110+ matches (import paths, configuration)

**Primary Risk:** Historical audit documents contain CRX terminology that should be preserved as historical artifacts, not modified.

---

## Category Breakdown

### Documentation (6500+ matches)

**Risk Level:** LOW (historical preservation)
**Migration Required:** NO (preserve as historical artifacts)

Most CRX references exist in historical audit documents that should be preserved as-is to maintain audit trail integrity.

**Examples:**
- SWEEP_A1_AUTHORITY_PATH_MATRIX.md
- SWEEP_A2_EVENT_FIRST_ORDERING.md
- SWEEP_A3_REPLAY_RECONSTRUCTION.md
- CONSOLIDATION_AUDIT_PHASE*.md
- AUTHORITY_TRACE_REPORT.md
- BUILD_CERTIFICATION.md

**Recommendation:** Do NOT modify historical audit documents. These are constitutional artifacts documenting the CRX research era.

---

### Application Names (800+ matches)

**Risk Level:** HIGH (runtime dependencies)
**Migration Required:** YES

**Current Term:** crx-newsletter-brain
**Replacement:** brainos/newsletter
**Risk Level:** HIGH
**Migration Required:** YES
**Notes:** Active application with docker-compose.yml, worker processes, database dependencies

**Current Term:** crx-digestion-worker
**Replacement:** brainos/rss
**Risk Level:** HIGH
**Migration Required:** YES
**Notes:** Active application with docker-compose.yml, worker processes, database dependencies

**Files requiring modification:**
- brainos/newsletter/docker-compose.yml
- brainos/rss/docker-compose.yml
- brainos/newsletter/docs/constitutional/*.md
- ACTIVE_FLOW_AUDIT.md
- CANONICALITY_AUDIT.md
- Runtime dependency graphs
- Service utilization reports

---

### File Path References (200+ matches)

**Risk Level:** MEDIUM (documentation accuracy)
**Migration Required:** YES

**Current Term:** C:\Users\nolan\CRX
**Replacement:** C:\Users\nolan\PING
**Risk Level:** MEDIUM
**Migration Required:** YES
**Notes:** Historical file paths in audit documents

**Current Term:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain
**Replacement:** C:\Users\nolan\PING\brainos\newsletter
**Risk Level:** MEDIUM
**Migration Required:** YES
**Notes:** Mirror location references

**Current Term:** C:\Users\nolan\CascadeProjects\crx-digestion-worker
**Replacement:** C:\Users\nolan\PING\brainos\rss
**Risk Level:** MEDIUM
**Migration Required:** YES
**Notes:** Mirror location references

**Files requiring modification:**
- analyze.py
- analyze_imports.py
- CANONICALITY_AUDIT.md
- AUTHORITY_SURVEY.md
- BUILD_CERTIFICATION.md
- Various audit documents

---

### Code References (110+ matches)

**Risk Level:** HIGH (runtime behavior)
**Migration Required:** YES

**Current Term:** CRX (in code comments, strings)
**Replacement:** PING
**Risk Level:** HIGH
**Migration Required:** YES
**Notes:** May affect runtime behavior if hardcoded

**Files requiring modification:**
- runtime/kernel/commit-service/src/engines/canonical_engine.ts
- runtime/kernel/commit-service/src/server.ts
- gateway/event_emitter.js
- gateway/server.js
- gateway/package.json
- runtime/replay/package.json

---

### Constitutional References (100+ matches)

**Risk Level:** CRITICAL (constitutional authority)
**Migration Required:** YES

**Current Term:** CRX_CONSTITUTION.md
**Replacement:** PING_CONSTITUTION.md (or constitution/KNOWLEDGE.md)
**Risk Level:** CRITICAL
**Migration Required:** YES
**Notes:** Constitutional authority document

**Current Term:** CRX Phase 8
**Replacement:** PING Phase 8
**Risk Level:** CRITICAL
**Migration Required:** YES
**Notes:** Constitutional phase references

**Current Term:** Constitutional Runtime eXtension
**Replacement:** Protocol Substrate Native Object Metadata Routing Ecosystem
**Risk Level:** CRITICAL
**Migration Required:** YES
**Notes:** Definition of platform identity

---

## Rebrand Priority Matrix

### Priority 1: CRITICAL (Constitutional Authority)

| Current Term | Replacement | Risk Level | Migration Required? |
|--------------|-------------|------------|-------------------|
| CRX_CONSTITUTION.md | constitution/KNOWLEDGE.md | CRITICAL | YES |
| CRX Phase X | PING Phase X | CRITICAL | YES |
| Constitutional Runtime eXtension | Protocol Substrate Native Object Metadata Routing Ecosystem | CRITICAL | YES |
| CRX Runtime | PING Runtime | CRITICAL | YES |
| CRX Kernel | PING Kernel | CRITICAL | YES |
| CRX Protocol | PING Protocol | CRITICAL | YES |

### Priority 2: HIGH (Runtime Dependencies)

| Current Term | Replacement | Risk Level | Migration Required? |
|--------------|-------------|------------|-------------------|
| crx-newsletter-brain | brainos/newsletter | HIGH | YES |
| crx-digestion-worker | brainos/rss | HIGH | YES |
| C:\Users\nolan\CRX (in code) | C:\Users\nolan\PING | HIGH | YES |

### Priority 3: MEDIUM (Documentation Accuracy)

| Current Term | Replacement | Risk Level | Migration Required? |
|--------------|-------------|------------|-------------------|
| C:\Users\nolan\CRX (in docs) | C:\Users\nolan\PING | MEDIUM | YES |
| CascadeProjects\crx-newsletter-brain | PING\brainos\newsletter | MEDIUM | YES |
| CascadeProjects\crx-digestion-worker | PING\brainos\rss | MEDIUM | YES |

### Priority 4: LOW (Historical Preservation)

| Current Term | Replacement | Risk Level | Migration Required? |
|--------------|-------------|------------|-------------------|
| CRX (in historical audit documents) | Preserve as-is | LOW | NO |
| CRX Phase X (in historical audits) | Preserve as-is | LOW | NO |
| CRX Runtime (in historical audits) | Preserve as-is | LOW | NO |

---

## Migration Strategy

### Phase 1: Constitutional Authority (CRITICAL)

1. Rename CRX_CONSTITUTION.md → constitution/KNOWLEDGE.md (already completed)
2. Replace "Constitutional Runtime eXtension" with "Protocol Substrate Native Object Metadata Routing Ecosystem" in:
   - README.md
   - ARCHIVE_INSTEAD_OF_DELETE.md
   - CIVILIZATION_DETECTION_AUDIT_COMPLETE.md
3. Replace "CRX Phase X" with "PING Phase X" in active constitutional documents
4. Replace "CRX Runtime" with "PING Runtime" in active documentation

### Phase 2: Application Names (HIGH)

1. Rename directories:
   - brainos/newsletter → brainos/newsletter (already correct)
   - brainos/rss → brainos/rss (already correct)
2. Update docker-compose.yml files
3. Update documentation references
4. Update runtime dependency graphs

### Phase 3: File Path References (MEDIUM)

1. Update analyze.py and analyze_imports.py
2. Update CANONICALITY_AUDIT.md
3. Update AUTHORITY_SURVEY.md
4. Update BUILD_CERTIFICATION.md

### Phase 4: Code References (HIGH)

1. Update code comments and strings
2. Update package.json files
3. Update configuration files

### Phase 5: Historical Preservation (LOW)

1. Add header to historical audit documents: "HISTORICAL ARTIFACT - CRX RESEARCH ERA - DO NOT MODIFY"
2. Preserve all CRX terminology in historical documents

---

## Risk Assessment

### High Risk Items

1. **Application directory names:** crx-newsletter-brain and crx-digestion-worker are referenced in docker-compose.yml files, runtime dependency graphs, and service utilization reports. Changing these requires coordinated updates across multiple files.

2. **Constitutional references:** CRX_CONSTITUTION.md references appear in multiple constitutional authority audits. Changing these requires careful verification that all references are updated consistently.

3. **Code file paths:** Hardcoded file paths in Python scripts (analyze.py, analyze_imports.py) may break if not updated correctly.

### Medium Risk Items

1. **Documentation file paths:** Historical file path references in audit documents should be updated for accuracy, but this is less critical than runtime dependencies.

2. **Mirror location references:** CascadeProjects references should be updated to reflect the converged PING structure.

### Low Risk Items

1. **Historical audit documents:** These should be preserved as-is to maintain audit trail integrity. No modification required.

---

## Success Criteria

Rebrand is complete when:

1. All constitutional authority documents reference PING terminology
2. All active applications use PING naming convention
3. All runtime code references use PING file paths
4. All active documentation uses PING terminology
5. Historical audit documents are marked as preserved artifacts
6. No CRX references remain in:
   - Active code
   - Active configuration
   - Active documentation
   - Docker compose files
   - Package.json files

---

## Notes

- Historical audit documents (SWEEP_*.md, CONSOLIDATION_AUDIT_*.md, etc.) should be preserved as constitutional artifacts documenting the CRX research era
- The transition from CRX to PING represents the transition from research era to constitutional platform era
- Some CRX references may be intentional (e.g., in historical context sections) and should be preserved
- The rebrand should not break existing runtime functionality
- The rebrand should not break existing audit trails
