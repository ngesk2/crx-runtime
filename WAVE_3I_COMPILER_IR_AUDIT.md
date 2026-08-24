# WAVE 3I — COMPILER / IR AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes. Compiler is FROZEN per FLEET_READ_ONLY_EXECUTION_DIRECTIVE.
**Basis:** `website/src/constitution/ir/types.ts` (IRDocument), `website/src/compiler/*` (parser/normalizer/validator/inspector), `website/src/generators/repository.ts` (built 6043ce6), `GENERATION_MANIFEST.yaml` (3da1eaf), `snapshot-v1.json` (13 aggregates), prior "compiler-readiness review" (15-point) this session.
**Role:** the compiler is the **HPP meaning-tier** — it owns generation; PING consumes generated artifacts. This is the constitutional source of truth (SPRINT4: HPP owns compiler/IR/knowledge).

---

## 1. Compiler Role (constitutional)

```
Constitution (business objects, authorities, capabilities)
   ↓ (HPP compiler)
Generation Manifest  ✅ (3da1eaf)
   ↓
IRDocument (Canonical IR v1)  ✅ (types.ts)
   ↓ (parser → normalizer → validator → inspector → generator)
Generated Runtime Artifacts  → consumed by PING (never redefine)
```

The compiler **never executes** (Law 1: execution never replans). It produces; PING runs.

---

## 2. IRDocument (Canonical IR v1)

| Element | Definition (evidence) | Status |
|---|---|---|
| Node | aggregate/entity/value-object/event/authority | ✅ in types.ts |
| Authority | owner of meaning (canonical ID) | ✅ in types.ts |
| Edge | relationship (pointer, not copy) | ✅ in types.ts |
| IRDocument | top-level spec (13 aggregates in snapshot-v1.json) | ✅ |

**Single-owner enforced at IR level:** every Node has exactly one Authority. Edges are *pointers*, not copies (resolves the "no duplicated ownership" rule from HAIOS).

---

## 3. Compiler Pipeline (determinism)

| Stage | Module (evidence) | Status |
|---|---|---|
| Parser | `compiler/parser.ts` | ✅ (prior review: front-end verified) |
| Normalizer | `compiler/normalizer.ts` | ✅ |
| Validator | `compiler/validator.ts` | ✅ |
| Inspector | `compiler/inspector.ts` | ✅ |
| Diagnostics | `compiler/diagnostics.ts` | ✅ (fixed import path earlier this session) |
| Determinism pipeline | parser→normalizer→validator→inspector | ✅ (prior review: 15-point pass) |

**Finding:** the compiler **front-end is complete and deterministic**. The prior "compiler-readiness review" confirmed all 15 points PASS. The gap is **generators** (downstream), not the front-end.

---

## 4. Generator Status

| Generator | Status | Evidence | Consumed by |
|---|---|---|---|
| Generation Manifest | ✅ BUILT | `GENERATION_MANIFEST.yaml` (3da1eaf) | all generators |
| **Repository Generator** | ✅ BUILT | `generators/repository.ts` (6043ce6); 10 repos + 10 tests; tsc 0 errors; jest 50 PASS | PING runtime consumers |
| Workflow Generator | ❌ MISSING | WAVE_3B P005 | PING runtime executor |
| Event Generator | ❌ MISSING | WAVE_3B P003 | PING delivery → PostHog |
| Capability Registry Generator | ❌ MISSING | WAVE_3B P002 | PING capability_resolver |
| State Machine Generator | ❌ MISSING | WAVE_3B P004 | PING execution_authority |
| Deployment Artifact Generator | ❌ MISSING | WAVE_3B P006 | PING deployment registry |

**Finding:** 1 of 6 generators built (Repository). The other 5 are the WAVE_3B gap. This is the **sole** compiler-side build work.

---

## 5. Snapshot (current IR state)

`snapshot-v1.json` = 13 aggregates (Customer, Crew, Vendor, Estimate, Job, Project, Photo, Video, Voice, PDF, +3). The Repository Generator emitted repos for 10 (the 3 not emitted = future domains). This is the live IR the generators consume.

---

## 6. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| Compiler owns meaning (HPP) | ✅ | SPRINT4; types.ts is IR |
| PING consumes, never redefines | ✅ | generated repos are read by PING runtime (WAVE_3A5) |
| Compiler never executes | ✅ | Law 1; PING executes |
| IR single-owner (pointer edges) | ✅ | types.ts Edge = pointer |
| Canonical events authoritative | ✅ | Event store (PING) = projection source (BI Boundary) |
| Freeze respected | ✅ | FLEET_READ_ONLY: no changes to frozen artifacts |

---

## 7. Freeze Status (compiler)

Per FLEET_READ_ONLY_EXECUTION_DIRECTIVE, these are **FROZEN** — do NOT modify:
- Four Primitive Model
- Generation Manifest
- Canonical IR v1
- Parser, AST, Validator, Normalizer, Inspector
- Determinism pipeline
- Governance specs
- Canonical object model, Authority model, Capability model

**The ONLY allowed compiler change** = building the 5 missing generators (they *consume* the frozen IR; they don't alter it). This is the WAVE_3B scope.

---

## 8. What Exists vs Missing

**Exists:** full compiler front-end (parser→inspector), Generation Manifest, IRDocument + 13-aggregate snapshot, Repository Generator (verified: 50 tests PASS, tsc 0 errors).

**Missing:** 5 generators (Workflow/Event/Capability/StateMachine/Deployment).

**Risk (STOP rule):** if a generator needs a **new IR node kind** (`IRWorkflow`/`IRTransition`/`IRCapability`), that changes Canonical IR v1 → triggers the freeze STOP rule. Must confirm before building (prior audit flagged this).

---

## 9. What NOT to Build (preserve freeze)

| Tempting compiler change | Verdict | Reason |
|---|---|---|
| New IR node kind (without exception) | ❌ DON'T | freeze STOP rule |
| Modify parser/validator/normalizer | ❌ DON'T | frozen |
| Business meaning in PING | ❌ DON'T | SPRINT4 (HPP owns) |
| New authority model | ❌ DON'T | frozen |
| Re-implement Repository Generator | ❌ DON'T | already built (6043ce6) |

---

## 10. Build Prerequisites (read-only dependency)

Compiler build work = the 5 generators (WAVE_3B order P002→P006). Before building:
1. Confirm no new IR node kind needed (or get freeze exception).
2. Repository Generator pattern is the template (it works: 50 tests PASS).
3. Each generator emits PING-consumable artifacts; PING reads, never redefines.

No architectural change to the frozen compiler.

---

## 11. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns the compiler/IR? | **HPP** (meaning-tier) |
| Is the front-end complete? | **YES** (15-point review PASS) |
| How many generators built? | **1 of 6** (Repository; 5 missing) |
| Does PING redefine generated artifacts? | **NO** (consumes only) |
| Is the compiler frozen? | **YES** (FLEET_READ_ONLY directive) |
| Any boundary violation? | **NO** — all checks PASS |
| What to build? | **5 generators** (consume frozen IR; no IR change) |

*Read-only audit. No code changed. Committed as WAVE_3I_COMPILER_IR_AUDIT.md.*
