# CONTINUITY BREAKS REPORT

**Generated:** 2026-06-07
**Mode:** READ-ONLY

---

## BREAK 1: Fingerprint Authority Regression

**Severity:** CRITICAL
**Type:** Implementation regression (archive → runtime)

The archive `canonical_fingerprint_service.js` (479 LOC) provides:
- 14 fingerprint domains
- Unicode NFC normalization
- Circular reference detection
- Type rejection (BigInt, Symbol, Function, undefined)
- Hash verification (`verifyFingerprint`)
- Schema version tracking (`fingerprint.schema.3.0`)
- Length-prefixed preimage construction
- Negative zero preservation

The runtime `identity_engine.ts` (15 LOC) + `canonical_engine.ts` (18 LOC) provides:
- SHA-256 hash of JSON.stringify(keySort(input))
- No domain separation
- No normalization
- No verification
- No error handling

**Evidence:** `canonical_fingerprint_service.js` line 200: `val.normalize("NFC")` vs `identity_engine.ts`: zero normalization logic.

**Impact:** Two semantically identical strings with different Unicode compositions produce different hashes. Direct violation of Axiom 1.

---

## BREAK 2: Lineage Validation Regression

**Severity:** CRITICAL
**Type:** Implementation regression (archive → runtime)

The archive `formal_invariant_graph_verifier.js` (262 LOC) provides:
- Full DFS-based cycle detection
- Required edge verification (8 constitutional edges)
- Forbidden edge detection (5 bypass patterns)
- Invariant topology binding (9 nodes)
- Graph fingerprinting

The runtime `dag_validator.ts` (13 LOC) provides:
- Direct self-reference check only
- Duplicate parent check only

**Evidence:** `dag_validator.ts` line 2: `if (parentIds.includes(childId))` — no transitive traversal.

**Impact:** A cycle A→B→C→A would pass validation. Direct violation of Axiom 2.

---

## BREAK 3: Replay System Never Migrated

**Severity:** CRITICAL
**Type:** Missing implementation

The archive `deterministic_replay_harness.js` (296 LOC) is a complete double-execution replay proof engine. It has NO equivalent in the runtime.

**Evidence:** 296 LOC harness exists in `constitutional-integration-lab/extracted/js_txt/`. Zero LOC of replay logic in `CRX/runtime/`.

**Impact:** No replay capability. Axiom 4 (Replay Determinism) is completely unenforced.

---

## BREAK 4: Witness System Never Migrated

**Severity:** CRITICAL
**Type:** Missing implementation

15+ Merkle anchor modules (~3,800 LOC) exist in archive. Zero LOC in runtime.

**Evidence:** `merkle_anchor_chain_validator.js`, `merkle_anchor_replay_verifier.js`, `authority_boundary_prover.js` etc. exist in archive. No witness generation in runtime.

**Impact:** No witness attestation. Axiom 8 (Witness Is Verification) is completely unenforced.

---

## BREAK 5: Empty Shell Directories

**Severity:** HIGH
**Type:** Planned but never populated

Directories `replay/`, `witness/`, `verifier/`, `kernel/` in the primary archive are empty shells. They match the MCP0.txt proposed structure but were never populated with files.

**Evidence:** `find` returns zero files in each directory. MCP0.txt proposes these directories with detailed file listings.

**Impact:** Suggests a planned file organization that was abandoned or deferred.

---

## BREAK 6: models/artifact.ts Empty

**Severity:** MEDIUM
**Type:** Stale stub

`CRX/runtime/kernel/commit-service/src/models/artifact.ts` is 0 bytes. But `commit_controller.ts` references `artifact.artifact_type` and `artifact.content`.

**Evidence:** `wc -c` returns 0. `commit_controller.ts` line 12-13 accesses `artifact.artifact_type`.

**Impact:** TypeScript strict mode would fail. At runtime, `artifact.artifact_type` would be undefined.

---

## BREAK 7: MCP0.txt Design Tree vs Actual Files

**Severity:** HIGH
**Type:** Design-to-implementation gap

MCP0.txt proposes 50+ files in a detailed directory tree. None of these files exist on disk in the primary archive.

**Evidence:** MCP0.txt lists paths like `kernel/constitution/axioms.ts`, `kernel/event/event-envelope.ts`, `kernel/identity/actor.ts`. `find` confirms these paths don't exist.

**Impact:** The design tree was never implemented as filesystem artifacts.

---

## BREAK 8: Event Schema Fragmentation

**Severity:** HIGH
**Type:** Competing schemas

5 different event schemas exist across the corpus with no canonical selection:
1. `canonical-event-envelope.json` (CascadeProjects) — 7 required fields, replay-safe
2. `audit-event.schema.json` (CRX/vos) — 8 fields, audit domain
3. `claim.schema.json` (CRX/knowledge) — 9 fields, UCIA domain
4. `decision.schema.json` (CRX/knowledge) — 7 fields, UCIA domain
5. `event_log.ts` (runtime) — 2 fields, minimal

**Impact:** No single event schema governs all events. Replay substrate is fragmented.

---

## BREAK 9: Three Isolated Codebases

**Severity:** HIGH
**Type:** Architectural fragmentation

Three isolated implementation layers exist with no integration path:
1. **Archive (JS.txt):** 59 modules, ~18,409 LOC, complete but not integrated
2. **Active Runtime:** 12 files, ~179 LOC, minimal skeleton
3. **Legacy (Python):** ~15 .docx files, archived, not directly executable

**Impact:** No single codebase contains the complete CRX implementation.

---

## BREAK 10: Integration Lab Is a Copy, Not a Merge

**Severity:** MEDIUM
**Type:** Workflow artifact

The `constitutional-integration-lab/extracted/runtime/` directory contains a **copy** of the runtime source, not a working branch. Changes to the runtime are not reflected in the lab, and vice versa.

**Evidence:** File timestamps in the lab extraction differ from the runtime. The lab was created as a snapshot, not a live mirror.

**Impact:** The integration lab is a point-in-time analysis workspace, not an active development branch.

---

## BREAK 11: Git Remote Divergence

**Severity:** MEDIUM
**Type:** Version control

The `runtime/` sub-repo is on branch `audit-hardening`, which is **3 commits ahead** of `origin/audit-hardening`. These commits have not been pushed.

**Evidence:** `git status` shows "Your branch is ahead of 'origin/audit-hardening' by 3 commits."

**Impact:** Local changes to the runtime are not backed up to GitHub.

---

## BREAK 12: CRX Root Not a Git Repository

**Severity:** LOW
**Type:** Version control

The CRX root directory (`C:\Users\nolan\CRX`) is NOT a git repository. It is a filesystem assembly of 3 independent sub-repos (knowledge/, vos/, runtime/).

**Evidence:** `git rev-parse --is-inside-work-tree` returns false at CRX root.

**Impact:** No unified version control for the CRX workspace as a whole.

---

**Classification:** FACT (all breaks verified by direct inspection)
**Confidence:** HIGH
