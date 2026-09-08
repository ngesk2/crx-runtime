# P0-2 Decision Record — `event_outbox` Classification

- **Branch:** `constitutional-convergence-v2` @ `828520ea`
- **Date:** 2026-08-27
- **Scope:** CLASSIFICATION ONLY. No implementation, no publisher, no consumer, no migration, no cleanup, no deletion.
- **Recommendation:** **B — DOCUMENTED DEPRECATION**

This record answers the 7 P0-2 classification questions. Every finding is first-hand
source-verified (file:line) or live-Postgres-probed (Docker UP; `ping-postgres` healthy
on 5433).

---

## Verdict (one line)

Live-spine evidence shows **NO reliability gap** for `event_outbox` to solve: the event
store **is** the database (`ping_events`), delivery is in-process handlers plus a durable
cursor bridge, and there is **no external broker boundary** requiring transactional
DB+publish atomicity. `event_outbox` has zero importers, zero instantiations, a
self-disabled `publish()`, and an incompatible table schema. **DEPRECATE (B).**

---

## Q1 — Who writes event_outbox?

**Nobody (runtime).** Zero `require('…event_outbox')` / `new EventOutbox(` anywhere in the
repo (excl. node_modules/dormant/archive). The only would-be caller is
`gateway/mission_event_bus.js:34,36,93` → `this._eventOutbox.publish()` — but that file is
itself stranded (zero importers; grep hits only in AGENTS.md, dormant JSON, docs). The
live table has **0 rows** (docker exec probe), so nothing ever wrote to it in practice.

## Q2 — Who reads / publishes / consumes?

**Nobody.** No runtime reads `event_outbox`, no publisher invoked it, no consumer exists.
`event_outbox.js` `publish()` **throws `ConstitutionalViolation`** (self-disabled). The
only code that ever touches the table on-disk is the `EventOutbox` class itself
(`SELECT * FROM event_outbox` at :173,:246,:261) — dead-on-arrival.

## Q3 — Table created by live migration only vs live code depends?

The `event_outbox` table is created **only** by `migration_engine.js` `_migration002`
(:191–210, + 4 indexes). `migration_engine.js` is required **only** by
`gateway/authority_registry.js:47`. **Neither is on the live boot path**:
`gateway_runtime.js` (live boot) references NONE of authority_registry / migration_engine /
event_outbox / mission_event_bus (grep = none). Therefore no live runtime code depends on
this table; the stale table is a leftover from an early/sandbox migration run.

## Q4 — Exact failure gap vs `unified_event_runtime` + `event_bridge`?

**No gap exists.** The live spine (`ping-runtime/events/unified_event_runtime.js`) is
**durable by construction**: `INSERT INTO ping_events … ON CONFLICT (event_id) DO NOTHING`
(:148) — the event store **is** the database, so an event is never "in memory but not
persisted." Delivery is in-process dispatch to `_handlers` (:165–170) plus a **durable
cursor bridge** (`ping_bridge_cursors` table, live). The redelivery/survive-restart
guarantee that a transaction-outbox would provide is **already native** to the live
architecture. There is no Redis/WebSocket/Kafka external broker boundary that needs
atomic DB+send semantics.

## Q5 — Atomic DB-state + external-publish path?

**Not present, and not needed.** No external publish exists anywhere on the live path, so
there is no DB-commit + broker-send atomicity problem to solve. The outbox pattern only
earns its keep when a transactional database must reliably fan out to an external broker
that can fail independently. That condition does not hold here.

## Q6 — Caller expects outbox IDs / delivery / retries / ack?

**No live caller expects anything.** `EventOutbox` internal DDL references
`outbox_id, event_id, authority, authority_version, payload_version, canonical_event,
error_message, published_at, publish_attempts` — a schema that is **incompatible** with the
migration-created table (`id SERIAL, aggregate_id, aggregate_type, event_type, event_data,
published, created_at, correlation_id, causation_id`). Verified: **`publish_attempts`
column does not exist in migration_engine.js and errors on the live table**
(`column publish_attempts does not exist`). Even if wired, the class could not run against
its own table. No delivery/retry/ack contract is consumed anywhere.

## Q7 — Every reference reachable / loaded / test / migration / stranded?

**Stranded** — all references are KEEP-DORMANT:
- `ping-runtime/orchestration/dormant_classifications/gateway_event_outbox.json`
- `gateway_mission_event_bus.json`
- `gateway_authority_registry.json` / `gateway_constitutional_authority_registry.json`
- `docs/CAPABILITY_LEDGER.md` (P0-2 S1: "event_outbox — table created via migration_engine
  002 but NO runtime publisher; migration_engine not invoked at boot")
- Prior `EVENT_RUNTIME_REPORT.md` / `PING_RUNTIME_UNIFICATION.md` list event persistence
  winner = `unified_event_runtime`; gateway event_bus/event_repository/event_outbox/
  mission_event_bus = stranded.

---

## Supporting evidence (strongest counter to any "wire" case)

1. **Zero importers / zero instantiations** of `event_outbox` repo-wide.
2. **Self-disabled** `publish()` (throws ConstitutionalViolation) — the code refuses to run.
3. **Incompatible schema**: class DDL (`publish_attempts` etc.) ≠ migration-created table
   (no `publish_attempts`); proven by live `SELECT MAX(publish_attempts)` → column error.
4. **0 rows** in live `event_outbox`; `outbox_messages` 0 rows; `mission_events` 0 rows.
5. **Live spine already durable + in-process** — no external publish boundary to atomicize.
6. **Prior classification across 4+ reports** already marks it stranded / KEEP-DORMANT.
7. Live boot path (`gateway_runtime.js`) is clean of all four related modules.

---

## Recommendation: **B — DOCUMENTED DEPRECATION**

`event_outbox` (plus `mission_event_bus`, the only would-be consumer) is non-functional,
unreferenced, schema-incompatible, and solves a problem the live spine does not have.
**Do not wire it.** Document as deprecated/stranded (KEEP-DORMANT, archive-candidate), in
line with the CAPABILITY_LEDGER S1 disposition and the no-new-subsystem / no-deletion
exit criteria.

*Implementation of this deprecation note (e.g. an AGENTS.md classification line or a
deprecation header) is pending explicit user approval — no edit made in this
classification pass.*

---

## FINAL — Classification: **DEPRECATED (KEEP-DORMANT, archive-candidate)**

**Recommendation ratified: B — DOCUMENTED DEPRECATION.** `event_outbox` is NOT to be
wired, revived, migrated, or adapted. It remains on disk as dormant/substrate, reviewable
under the Behavior Preservation Gate if a future concrete requirement ever appears
(no requirement exists today).

**Live winner** (the path that replaces/obviates `event_outbox`):
- `ping-runtime/events/unified_event_runtime.js` — durable `ping_events` INSERT + in-process handler dispatch (`ON CONFLICT (event_id) DO NOTHING`, dedup-native).
- `ping-runtime/events/event_bridge.js` — durable cursor-based re-delivery into the spine (`ping_bridge_cursors`), covering the restart/redelivery concern.
- `ping-runtime/events/event_read_authority.js` — post-convergence read surface for completed events.
- Worker chain: `mission_scheduler` → `worker_runtime` → `canonical_workers` (ReplayWorker → KernelReplayExecutionProvider, WitnessWorker).

**Live-runtime confirmation (2026-08-27, Docker UP).** A fresh `ping-gateway` container
booting from current source, connected to `ping-postgres` on
`constitutional-runtime_ping_internal`, drives real events through the spine with
**ZERO reliance on `event_outbox`**:
- `ping_events` = 1,050 rows (26 event types incl. `REVIEW_RECEIVED`, `RESPONSE`→worker chain, `REPLAY_COMPLETED`=31, `WITNESS_CREATED`=31).
- `event_outbox` = **0 rows** after all real traffic.
- `mission_events` = **0 rows** (confirms `mission_event_bus.js`, the only event_outbox consumer, never wrote).
- `/mc/replay/stats`, `/mc/witness/stats`, `/mc/dead-letters/stats` serve real runtime projections from `ping_events` only.

This proves the live winner handles the durable-event lifecycle end-to-end without a
transactional outbox — the transaction-outbox pattern has nothing to atomicize here.
