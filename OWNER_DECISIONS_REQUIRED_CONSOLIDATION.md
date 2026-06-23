# OWNER_DECISIONS_REQUIRED_CONSOLIDATION.md

**Audit Type:** BRAINOS + PING CONSTITUTIONAL CONSOLIDATION AUDIT  
**Repository Root:** C:\Users\nolan\PING  
**Mode:** READ ONLY, NO REFACTORING, NO PATCHES, NO IMPLEMENTATION, NO CODE CHANGES, NO ARCHITECTURE PROPOSALS YET  

---

## EXECUTIVE SUMMARY

**Total Questions:** 6  
**Purpose:** Smallest set of questions needed to complete consolidation  
**Evidence:** All questions supported by repository evidence  

---

## QUESTION 1: Event Authority Consolidation

**Evidence:**
- PING has gateway/event_emitter.js (JavaScript) for event emission to PostgreSQL
- Brain has brain/src/constitutional/event_emitter.py (Python) for event emission to PostgreSQL
- Both implement identical semantics: event emission to PostgreSQL events table
- Both have catch-all error handling to prevent fatal exceptions
- Both use same environment variables (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)
- Applications (crx-digestion-worker, crx-newsletter-brain) use Brain's event_emitter.py instead of PING's event_emitter.js
- This is a constitutional violation (duplicate event emission implementations)

**Question:**
Should Brain's event_emitter.py be merged with PING's event_emitter.js (or vice versa) to eliminate duplicate event emission implementations?

**Options:**
A) Merge Brain's event_emitter.py into PING's event_emitter.js (keep JavaScript)
B) Merge PING's event_emitter.js into Brain's event_emitter.py (keep Python)
C) Keep both implementations (accept constitutional violation)
D) Create new unified implementation (TypeScript)

**Recommendation:** A (merge Brain's event_emitter.py into PING's event_emitter.js to keep JavaScript consistent with PING Gateway)

---

## QUESTION 2: Application Refactoring

**Evidence:**
- Applications (crx-digestion-worker, crx-newsletter-brain) depend on Brain's event_emitter.py
- Applications use SQLite for storage (not PostgreSQL events table)
- Applications use Ollama for summarization (not PING Gateway)
- Applications are application-specific, not constitutional
- Applications are separate projects in CascadeProjects

**Question:**
Should applications (crx-digestion-worker, crx-newsletter-brain) be refactored to use PING's constitutional primitives after consolidation?

**Options:**
A) Refactor applications to use PING's event_emitter.js (after consolidation)
B) Refactor applications to use PING Gateway for inference
C) Refactor applications to use PostgreSQL events table for storage
D) Keep applications as-is (separate from PING)

**Recommendation:** D (keep applications as-is, they are application-specific and not part of PING constitutional runtime)

---

## QUESTION 3: VOS Archival

**Evidence:**
- vos/ contains historical VOS (Versioned Operating System) documentation
- vos/ has 4 subfolders (archive, cos, proposals, viz) with 20+ files
- vos/ is not actively used
- vos/ has no runtime dependencies
- vos/ has no active references in PING Gateway or Runtime
- vos/ is historical documentation only

**Question:**
Should vos/ be archived or deleted?

**Options:**
A) Archive vos/ to archive/vos/ (keep for historical reference)
B) Delete vos/ (no historical value)
C) Keep vos/ in place (historical documentation)

**Recommendation:** A (archive vos/ to preserve historical documentation)

---

## QUESTION 4: Commit Service Absorption

**Evidence:**
- runtime/kernel/commit-service/ is defined but not actively used
- runtime/kernel/commit-service/ has subfolders (api, engines, events, models, persistence, server.ts, utils, validation) but no actual implementations
- runtime/kernel/commit-service/server.ts is only 387 bytes (minimal stub)
- runtime/kernel/commit-service/package.json defines dependencies but no actual code
- No runtime references in PING Gateway
- No applications use commit-service
- Defined but not executed

**Question:**
Should runtime/kernel/commit-service/ be absorbed into PING Runtime as an optional module or deleted?

**Options:**
A) Absorb into PING Runtime as optional module (keep for future use)
B) Delete (not actively used, can be re-implemented if needed)
C) Keep in place (not actively used)

**Recommendation:** B (delete, not actively used and can be re-implemented if needed)

---

## QUESTION 5: Workers Absorption

**Evidence:**
- workers/ has 5 YAML files (artifact-worker.yaml, gateway-worker.yaml, graph-worker.yaml, ollama-worker.yaml, research-worker.yaml)
- workers/ defines workers but no actual implementations
- workers/ has no runtime references in PING Gateway
- workers/ is not actively used
- workers/ is definitions only

**Question:**
Should workers/ be absorbed into PING Runtime as an optional module or deleted?

**Options:**
A) Absorb into PING Runtime as optional module (keep for future worker implementations)
B) Delete (definitions only, not actively used)
C) Keep in place (definitions only)

**Recommendation:** B (delete, definitions only and not actively used)

---

## QUESTION 6: Audit Directory

**Evidence:**
- audit/ contains 29 audit reports (constitutional audit documentation)
- audit/ is active constitutional documentation
- audit/ is referenced by constitutional compliance verification
- audit/ is not runtime code

**Question:**
Should audit/ be archived or kept as active constitutional documentation?

**Options:**
A) Keep audit/ in place (active constitutional documentation)
B) Archive audit/ to archive/audit/ (historical documentation)
C) Delete audit/ (no longer needed)

**Recommendation:** A (keep audit/ in place as active constitutional documentation)

---

## SUMMARY

**Total Questions:** 6  
**High Priority Questions:** 1 (Event Authority Consolidation)  
**Medium Priority Questions:** 2 (Application Refactoring, VOS Archival)  
**Low Priority Questions:** 3 (Commit Service Absorption, Workers Absorption, Audit Directory)

**Decision Timeline:**
- Question 1 (Event Authority Consolidation): HIGH (constitutional violation)
- Question 2 (Application Refactoring): MEDIUM (application-specific)
- Question 3 (VOS Archival): LOW (historical documentation)
- Question 4 (Commit Service Absorption): LOW (not actively used)
- Question 5 (Workers Absorption): LOW (not actively used)
- Question 6 (Audit Directory): LOW (documentation)

**Recommended Actions:**
1. Merge Brain's event_emitter.py into PING's event_emitter.js (Question 1: Option A)
2. Keep applications as-is (Question 2: Option D)
3. Archive vos/ to archive/vos/ (Question 3: Option A)
4. Delete runtime/kernel/commit-service/ (Question 4: Option B)
5. Delete workers/ (Question 5: Option B)
6. Keep audit/ in place (Question 6: Option A)
