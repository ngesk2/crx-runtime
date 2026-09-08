# Stash Preservation Forensics

> **Status:** PRESERVED — forensic evidence. Not applied. Not dropped.
> **Date:** 2026-08-24
> **Rule:** `git stash pop` and `git stash drop` are PROHIBITED.

---

## Stash Inventory

| Ref | Message | Files | +/- | Classification |
|-----|---------|-------|-----|----------------|
| `stash@{0}` | On constitutional-trunk: pre-merge cleanup | 735 | 6226+/2905003- | MIXED — unique kernel bugs + noise |
| `stash@{1}` | WIP on main: 6c4b531 | 0 | 0/0 | EMPTY |
| `stash@{2}` | WIP on constitutional-boundary-reconstruction: bd83e7f | 159 | 5131+/1900- | MIXED — ~60% discardable, ~10% unique |
| `stash@{3}` | On constitutional-trunk: wip: save before rebase/push | 68 | 3929+/954- | SUBSET of stash@{2} |
| `stash@{4}` | WIP on main: 6c4b531 | 1 | 0/0 | GENERATED_OR_DERIVABLE |

---

## stash@{0} — "pre-merge cleanup"

### Unique Work Items

| File | Trunk State | Unique Behavior | Classification | Recovery Dependency |
|------|-------------|-----------------|----------------|---------------------|
| `gateway/canonical_authority.js` (kernel) | LIVE BUGS: array join produces `"a,b,c"` without commas; UTF-16 sort | UTF-8 byte comparison, comma-delimited join | **UNIQUE_WORK** | Extract behind golden-hash tests |
| `gateway/identity_authority.js` (kernel) | Event-ID collision for same type+aggregate | Optional `canonicalPayloadHash` parameter | **UNIQUE_WORK** | Extract optional param |
| `claim_worker.py` | EXISTS in trunk (older version) | NEWER remediation version | UNIQUE_NEWER_REMEDIATION | Harvest pattern, don't blind-apply |
| `observation_worker.py` | EXISTS in trunk (older version) | NEWER remediation version | UNIQUE_NEWER_REMEDIATION | Same |
| `lineage_worker.py` | EXISTS in trunk (older version) | NEWER remediation version | UNIQUE_NEWER_REMEDIATION | Same |
| `replay_worker.py` | EXISTS in trunk (older version) | NEWER remediation version | UNIQUE_NEWER_REMEDIATION | Same |
| `witness_worker.py` | EXISTS in trunk (older version) | Authority refactor pattern | UNIQUE_NEWER_REMEDIATION | Same |
| `filesystem_worker.py` | EXISTS in trunk (older version) | Removes phantom `payload_hash` | UNIQUE_NEWER_REMEDIATION | Same |
| `worker_runtime.py` | EXISTS in trunk (111 lines) | Health server, HTTP timeouts, `verify_canonical_event` | UNIQUE_HARDENING | Apply after kernel unfrozen |
| `repository_client.py` | EXISTS in trunk (51 lines) | Imports nonexistent `canonical_bytes` | BLOCKED_DEP | Harvest AFTER creating `canonical_bytes.py` |

### Additive Documents

| File | Lines | Classification |
|------|-------|----------------|
| `constitution/TRUTH_LAW.md` | 171 | ADDITIVE_UNIQUE — trivial merge |
| `constitution/witness_law.md` | 179 | ADDITIVE_UNIQUE — trivial merge |
| `constitution/CONTINUITY.md` | 217 | SUPPRESSED_BY_SPEC — safe with SPEC v2.0 |
| `constitution/authority_model.md` | 205 | SUPPRESSED_BY_SPEC — accept or archive per policy |

### Infrastructure Notes

| File | Trunk State | Classification |
|------|-------------|----------------|
| `compose.yaml` (+50 lines) | Trunk lacks Redis/Temporal | UNIQUE_ADDITIVE — review before P8/P9 backlog |
| `.env.base` | **LIVE QDRANT_API_KEY JWT** | SECURITY_VALUABLE — apply secret-strip + rotate key |

### Recovery Procedure

Kernel bug fixes are the highest-value extractable items. To harvest:

1. `git stash show -p stash@{0} -- gateway/canonical_authority.js` → extract fixes
2. Write golden-hash tests proving correct behavior
3. Apply fixes behind test gates
4. Do NOT apply worker Python blindly — harvest patterns only

---

## stash@{1} — "WIP on main"

**Classification:** EMPTY — 0 files. No preservation needed.

---

## stash@{2} — "WIP on constitutional-boundary-reconstruction"

### Unique Work Items

| File(s) | Trunk State | Unique Behavior | Classification | Recovery Dependency |
|---------|-------------|-----------------|----------------|---------------------|
| `ir/node-types.ts` (+62 lines) | Trunk lacks additions | Zero imports needed | **UNIQUE_WORK** | Cherry-pick cleanly |
| 23 compiler TS files (serializers) | Trunk uses plain JSON | Imports `@ping/constitutional` (never committed) | BLOCKED_ON_PHANTOM_DEP | Do NOT merge — spec for future |
| `coverage/rule-coverage.ts` | Trunk has working version | Rewrites coverage engine | REWRITE_BLOCKED | Keep trunk engine |
| 8 kernel identity files | Pre-migration versions | Imports phantom dep | BLOCKED_ON_PHANTOM_DEP | Valuable as spec |
| `runtime/adapters/postgres_event_store.ts` (+46) | BIGSERIAL ordering | Sequence-counter concept | UNIQUE_SCHEMA_IDEA | Extract concept only |
| `gateway/server.js` (retry loop) | Trunk: 19L clean bootstrap | `waitForPostgres()` retry | **UNIQUE_SMALL** | Port retry loop |
| `ui-next/.../CockpitDashboard.tsx` (239→477L) | Smaller version | UI expansion | UNIQUE_UI_WORK | Needs backend audit first |
| `filesystem_worker.py` (+18) | Trunk lacks Assets subsystem | **UNIQUE_WORK** | Cherry-pick after event type verification |
| `workers/worker_runtime.py` (+1) | Trunk lacks fallback | object_id fallback | UNIQUE_SMALL | Cherry-pick |
| `AGENTS.md` | Trunk structurally newer | 215 log lines | UNIQUE_HISTORY | Manual merge |

### Generated/Derivable (ignore)

| File(s) | Classification |
|---------|----------------|
| `.next/**` (86 files) | GENERATED_OR_DERIVABLE — regenerate via `next build` |

### Security Notes

| File | Classification |
|------|----------------|
| `.env.base` (secret strip) | **SECURITY_VALUABLE** — apply + rotate |

---

## stash@{3} — "wip: save before rebase/push"

**Classification:** SUBSET of stash@{2}. All content included in stash@{2} analysis. No additional preservation needed.

---

## stash@{4} — "WIP on main"

**Classification:** GENERATED_OR_DERIVABLE — single file (`docker-compose.yml`), superseded by current `compose.yaml`.

---

## Recovery Priority

### Immediate (no architectural dependency)

| Item | Source | Method | Risk |
|------|--------|--------|------|
| `ir/node-types.ts` additions | stash@{2} | Cherry-pick | Zero — no imports |
| Kernel bug fixes | stash@{0} | Manual extraction + golden-hash tests | Low — behind tests |
| Constitution law sections | stash@{0} | Direct apply | Trivial merge |
| `server.js` retry loop | stash@{2} | Port to current bootstrap | Low |
| object_id fallback | stash@{2} | Cherry-pick | Low |

### Deferred (architectural dependency)

| Item | Source | Blocker | Classification |
|------|--------|---------|----------------|
| Compiler TS serializers | stash@{2} | `@ping/constitutional` phantom dep | PRESERVED_PENDING_ARCHITECTURAL_UNBLOCK |
| Kernel identity files | stash@{2} | Same phantom dep | PRESERVED_PENDING_ARCHITECTURAL_UNBLOCK |
| Worker Python remediation | stash@{0} | Kernel frozen; harvest patterns only | UNIQUE_NEWER_REMEDIATION |
| CockpitDashboard expansion | stash@{2} | Needs backend audit first | UNIQUE_UI_WORK |

---

## Hard Rules

1. **Do NOT `git stash pop`** — stashes are forensic preservation sources
2. **Do NOT `git stash drop`** — evidence must be retained
3. **Kernel bug fixes require golden-hash tests** — never blind-apply
4. **Python worker remediation = harvest patterns** — never blind-apply
5. **Compiler work blocked by phantom dep** = PRESERVED_PENDING_ARCHITECTURAL_UNBLOCK
6. **All security items** (.env.base secrets) = apply + rotate keys
