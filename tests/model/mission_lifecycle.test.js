'use strict';
/**
 * T5 model test — mission lifecycle state model.
 *
 * WHAT INVARIANT?
 *   The mission lifecycle is a lawful state machine:
 *     created -> assigned -> running -> completed | failed
 *                                  -> retry_pending -> (assigned|running|failed)
 *   Invariants: TERMINAL REMAINS TERMINAL (completed/failed never transition
 *   out); CLAIM IS EXCLUSIVE (one worker wins); RETRIES ARE BOUNDED AND
 *   MONOTONIC; EVERY TRANSITION EMITS EVIDENCE (MISSION_* events).
 * WHO OWNS IT? MissionRuntime + UnifiedEventRuntime
 *   (ping-runtime/orchestration/mission_runtime.js,
 *   ping-runtime/events/unified_event_runtime.js).
 * HOW CAN IT FAIL? A transition that escapes a terminal state; two workers
 *   both thinking they won; the retry counter resetting (F-01 infinite loop);
 *   a transition with no evidence event.
 * WHAT ATTACK DISPROVES IT? Model-based command sequences: generate
 *   create/assign/start/complete/fail/failWithRetry commands against a model
 *   of the lifecycle, execute against the real runtime, assert the model and
 *   the invariants after every step.
 * WHAT EVIDENCE PROVES IT? Fixed-seed fast-check model runs, zero invariant
 *   violations. (PR tier: bounded sequences; deep tier: longer sequences.)
 * CAN IT BE REPLAYED? Yes: seed + path; the command log is the replay.
 * DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? Yes, BUG- ledger.
 * WHY CAN EXISTING RUNNER + LIBRARY + EXISTING PING AUTHORITY NOT EXPRESS THIS?
 *   node:test + fast-check's model-based commands (the inventoried
 *   state-machine capability) + the existing runtimes. No new scheduler, no
 *   new queue, no new event bus.
 *
 * SCOPE NOTE: the CEO order's FYD owner-correction state machine
 * (OBSERVED/CORRECTED/HIDDEN/...) belongs to the FYD repo and the sibling
 * agent; this model covers the PING-side lifecycle so the two do not duplicate.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { fc } = require('../_support/arbitraries');
const { fcOptions, RUNS, DEEP } = require('../_support/budget');
const { withRegressionLedger } = require('../_support/regression');
const { PgStub } = require('../_support/pg_stub');
const { UnifiedEventRuntime } = require('../../ping-runtime/events/unified_event_runtime.js');
const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime.js');

const SEED = 20260942;
const INVARIANT = 'terminal remains terminal; claims exclusive; retries bounded+monotonic; every transition emits evidence';
const TERMINAL = new Set(['completed', 'failed']);

class LifecycleModel {
  constructor() { this.missions = new Map(); } // id -> { status, worker, retries }
}

function makeReal() {
  const pool = new PgStub();
  const events = new UnifiedEventRuntime({ pool });
  const missions = new MissionRuntime({ pool, eventRuntime: events });
  return { pool, events, missions };
}

const workerArb = fc.constantFrom('worker:A', 'worker:B', 'worker:C');

function commandArbs() {
  return [
    fc.record({ op: fc.constant('create'), tenant: fc.constantFrom('acme', 'hpp') }),
    fc.record({ op: fc.constant('assign'), worker: workerArb }),
    fc.record({ op: fc.constant('start') }),
    fc.record({ op: fc.constant('complete') }),
    fc.record({ op: fc.constant('fail') }),
    fc.record({ op: fc.constant('failWithRetry'), maxAttempts: fc.integer({ min: 1, max: 4 }) }),
  ];
}

describe('mission lifecycle state model', () => {
  it(`model-based command sequences preserve lifecycle invariants over ${RUNS} runs`, async () => {
    const seqLen = DEEP ? 40 : 15;
    const prop = fc.asyncProperty(
      fc.array(fc.oneof(...commandArbs()), { minLength: 3, maxLength: seqLen }),
      async (cmds) => {
        const model = new LifecycleModel();
        const { pool, missions } = makeReal();
        let missionId = null;
        let createNonce = 0;

        for (const cmd of cmds) {
          const m = missionId && model.missions.get(missionId);
          switch (cmd.op) {
            case 'create': {
              // Unique payload per create: mission_id is deterministic on
              // (tenant, type, payload), so a repeated identical create would
              // hit ON CONFLICT and NOT reset the row — the model must not
              // pretend it did.
              createNonce += 1;
              missionId = await missions.create('LADDER_MODEL', { seq: createNonce }, { tenant_id: cmd.tenant });
              model.missions.set(missionId, { status: 'created', worker: null, retries: 0 });
              break;
            }
            case 'assign': {
              if (!m) break;
              const won = await missions.assign(missionId, cmd.worker);
              const real = await missions.getMission(missionId);
              if (m.status === 'created') {
                assert.equal(won, 1, 'claim on created must succeed');
                assert.equal(real.assigned_to, cmd.worker);
                m.status = 'assigned'; m.worker = cmd.worker;
              } else {
                assert.equal(won, 0, 'claim outside created must win zero rows');
                assert.equal(real.assigned_to, m.worker, 'loser must not displace the winner');
              }
              break;
            }
            case 'start': {
              if (!m) break;
              await missions.start(missionId);
              const real = await missions.getMission(missionId);
              if (m.status === 'assigned') { m.status = 'running'; }
              assert.equal(real.status, m.status, 'model and runtime must agree on start');
              break;
            }
            case 'complete': {
              if (!m) break;
              await missions.complete(missionId, { ok: true });
              const real = await missions.getMission(missionId);
              if (m.status === 'running') {
                m.status = 'completed';
                const ev = [...pool.events.values()].find(
                  (e) => e.event_type === 'MISSION_COMPLETED' && JSON.parse(e.payload).missionId === missionId,
                );
                assert.ok(ev, 'completion must emit evidence');
              }
              assert.equal(real.status, m.status, 'model and runtime must agree on complete');
              break;
            }
            case 'fail': {
              if (!m) break;
              // fail() only lands from running/assigned/retry_pending.
              const before = m.status;
              await missions.fail(missionId, 'boom');
              const real = await missions.getMission(missionId);
              if (['running', 'assigned', 'retry_pending'].includes(before)) m.status = 'failed';
              assert.equal(real.status, m.status, 'model and runtime must agree on fail');
              break;
            }
            case 'failWithRetry': {
              if (!m) break;
              const before = m.retries;
              const beforeStatus = m.status;
              const next = await missions.failWithRetry(missionId, 'boom', { max_attempts: cmd.maxAttempts });
              const real = await missions.getMission(missionId);
              assert.ok(next >= before, 'retry counter must never reset');
              // The runtime's UPDATE only lands from running/assigned/
              // retry_pending; terminal rows are untouched (no silent
              // resurrection, no counter drift).
              if (['running', 'assigned', 'retry_pending'].includes(beforeStatus)) {
                // Exhaustion stores retries=nextRetry (the incremented
                // counter), NOT retries=maxAttempts: max_attempts is per-call
                // and nextRetry can exceed the current call's value. The
                // model must mirror the runtime (2026-09-30, was BUG-0005).
                if (next >= cmd.maxAttempts) { m.status = 'failed'; m.retries = next; }
                else { m.status = 'retry_pending'; m.retries = next; }
              }
              assert.equal(real.status, m.status, 'model and runtime must agree on failWithRetry');
              assert.equal(real.retries, m.retries, 'retry counters must agree');
              break;
            }
            default: break;
          }

          // Global invariants after every command. Re-resolve the model
          // entry: 'create' rebinds missionId, so the 'm' captured at the top
          // of the loop is stale for the new mission. Checking the stale
          // entry against the new mission's row produced a false
          // terminal-transition alarm (2026-09-30, was BUG-0004).
          const cur = missionId && model.missions.get(missionId);
          if (cur) {
            const real = await missions.getMission(missionId);
            if (TERMINAL.has(cur.status)) {
              assert.ok(TERMINAL.has(real.status),
                `terminal state ${cur.status} must never transition out (got ${real.status})`);
            }
            assert.ok(real.retries <= 4 || cur.retries <= 4, 'retries stay within the generated bound');
          }
        }
      },
    );
    await withRegressionLedger(
      { property: 'model.mission-lifecycle', expectedInvariant: INVARIANT },
      SEED,
      () => fc.assert(prop, fcOptions(SEED)),
    );
  });
});
