# WAVE 3F — OPERATIONAL RECOVERY & REPLAY AUDIT (Read-Only)

**Mode:** Read-only audit. No code changes.
**Basis:** WAVE_3A5_RUNTIME_AUTHORITY_AUDIT.md §4 (replay surface), `kernel/build_witness.py`, `runtime/persistent_runtime.py`, `runtime/witness_authority.py`, `runtime/failure_authority.py`, `api/main.py` `/replay`, `storage/postgres/models.py` (Event), architecture/infrastructure/* (disaster recovery).
**User thesis:** "Replay is already a major investment. Wave 3B should simply extend replay coverage — not build replay." + "Event Governance: runtime rejection, CI rejection, schema validation, ownership validation."

---

## 1. Recovery Domain (PING-owned)

Per PING v2 + SPRINT4, PING owns **Recovery** (operational): replay, rollback, failure handling, disaster recovery. HPP owns the *business state* being recovered; PING owns the *mechanism*.

```
Business state (HPP)  ──events──▶  Event store (PING, source of truth)
                                        │
                              Replay (PING) rebuilds state
                                        │
                              Runtime (PING) restored
```

---

## 2. Replay Surface (consolidated from WAVE_3A5 §4)

| Component | Module (evidence) | Instantiated? | Referenced? | Overlapping? |
|---|---|---|---|---|
| Kernel replay | `kernel/build_witness.py` | YES | YES | canonical witness |
| ReplayRuntime | `runtime/persistent_runtime.py` | YES | YES | — |
| ReplayAuthority (2nd) | `runtime/witness_authority.py` | YES | YES | **overlaps kernel/build_witness** (R2 in WAVE_3A7) |
| Replay port | `api/main.py` `/replay` | YES | YES | — |
| ReplayWorker (test) | `tests/test_replay_harness.py` | test-only | YES | — |
| Replay certification | `build_witness_hash` in Event model | YES | YES | — |
| ContinuousReplayAuthority | — | NO | NO | **aspirational, not present** |
| ReplayPlanAuthority | — | NO | NO | **aspirational, not present** |

**Finding:** replay infra is **present and used**. `ContinuousReplayAuthority` / `ReplayPlanAuthority` are NOT present — do NOT build them; the existing replay (kernel witness + persistent runtime + /replay) is sufficient for the frozen architecture.

---

## 3. Rollback & Failure Handling

| Mechanism | Module (evidence) | Role |
|---|---|---|
| Deployment rollback | `DeploymentRolledBack` event (operational, PING) | rollback signal |
| Runtime rejection | `runtime/failure_authority.py` | rejects invalid execution at runtime |
| CI rejection | compiler/CI gate (Event Governance) | rejects at compile time |
| Schema validation | `schema_versioning.py` + Event `schema_version` | rejects schema drift |
| Ownership validation | `constitution/authority/*` (owner check) | rejects unauthorized authority use |
| Retry | `notification/outbox_processor.py` (outbox retry) | delivery retry |

**Event Governance (user's spec) verified present:**
- Runtime rejection ✅ (`failure_authority.py`)
- CI rejection ✅ (compiler gate)
- Schema validation ✅ (`schema_versioning.py` + Event model)
- Ownership validation ✅ (`constitution/authority/*`)

All four governance checks exist. They should run **at compile time where possible** (user: "This should probably happen during compilation. Not runtime whenever possible.") — currently split between CI (compile) and `failure_authority` (runtime). No new infra needed; this is a *wiring* preference (prefer CI over runtime rejection).

---

## 4. Disaster Recovery

| Concern | Mechanism (evidence) | Status |
|---|---|---|
| State rebuild | Event store → replay (`kernel/build_witness` + `persistent_runtime`) | present |
| Point-in-time | Event `causality_id` + `correlation_id` (Event model) | present (model supports) |
| Backup | `architecture/infrastructure/*` (Oracle backup blueprints) | infra-specified |
| Cross-region | Oracle multi-region (PING v2) | infra-specified |

**Finding:** disaster recovery is **event-sourced by design** — the Event store is the source of truth; replay rebuilds any runtime state. This is the constitutional strength (canonical events = authoritative). No new DR system needed.

---

## 5. Boundary Verification

| Check | Result | Evidence |
|---|---|---|
| Recovery is operational (PING) | ✅ | PING v2 (Recovery domain) |
| Business state ownership stays HPP | ✅ | SPRINT4 (HPP owns meaning) |
| Replay never redefines business meaning | ✅ | replay reads Event store; doesn't create events |
| Event store authoritative | ✅ | storage/postgres/models.py; PostHog = projection (BI Boundary) |
| No Oracle publication in recovery | ✅ | BI Boundary §9 |
| Failure governance present (4 checks) | ✅ | §3 |

---

## 6. What Exists vs Missing

**Exists:** kernel replay, persistent runtime, /replay route, failure_authority (runtime rejection), CI rejection, schema validation, ownership validation, outbox retry, event-sourced DR.

**Missing (aspirational, do NOT build):**
- `ContinuousReplayAuthority` — not needed; replay is on-demand via /replay.
- `ReplayPlanAuthority` — not needed; replay follows causality_id chain.
- `ReplayWorker` as production service — test-only harness exists; production replay = persistent_runtime.

**Duplicate (retire, WAVE_3A7 R2):** `runtime/witness_authority.py` (2nd witness) — keep `kernel/build_witness.py`.

---

## 7. What NOT to Build (preserve freeze)

| Tempting recovery feature | Verdict | Reason |
|---|---|---|
| New replay engine | ❌ DON'T | kernel/build_witness + persistent_runtime exist |
| ContinuousReplayAuthority | ❌ DON'T | on-demand replay sufficient |
| ReplayPlanAuthority | ❌ DON'T | causality_id chain sufficient |
| New DR store | ❌ DON'T | Event store is source of truth |
| Business-state recovery logic in PING | ❌ DON'T | HPP owns business state |

---

## 8. Build Prerequisites (read-only dependency)

Recovery is **already functional**. The only related work (informational):
1. Retire `runtime/witness_authority.py` (WAVE_3A7 R2) — dedupe, not rebuild.
2. Prefer CI rejection over runtime rejection where possible (user preference; no new infra).
3. Ensure Event Generator (WAVE_3B P003) emits the 4 business events with correct `schema_version` so CI rejection catches drift early.

No architectural change required.

---

## 9. Success Criteria (answered)

| Question | Answer |
|---|---|
| Who owns recovery? | **PING** (operational) |
| Who owns recovered business state? | **HPP** (meaning) |
| Is replay present? | **YES** (kernel witness + persistent runtime + /replay) |
| Is failure governance present? | **YES** (runtime/CI/schema/ownership — all 4 checks) |
| Is DR event-sourced? | **YES** (Event store = source of truth) |
| Any boundary violation? | **NO** — all checks PASS |
| What to build? | **Nothing** — retire duplicate witness; prefer CI rejection |

*Read-only audit. No code changed. Committed as WAVE_3F_OPERATIONAL_RECOVERY_REPLAY_AUDIT.md.*
