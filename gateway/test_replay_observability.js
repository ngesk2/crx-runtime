/**
 * test_replay_observability.js
 *
 * P0-1 golden test - replay/witness observability via the LIVE /mc/* routes.
 * Exercises the real express router over HTTP (no supertest dependency).
 *
 * Proves (against the exact contracts of the live spine):
 *   - /mc/replay/stats reaches the LIVE KernelReplayExecutionProvider singleton
 *     (services.replayProvider) and surfaces its real getStats() counters, in
 *     addition to the event-derived projection from ping_events.
 *   - Provider-absent (PG-down degraded boot) hides the provider block entirely,
 *     never fabricates counters.
 *   - Empty replay state is handled cleanly (zero counts, provider at zero, no 500).
 *   - /mc/replay/trace/:correlationId projects the replay+witness tail for a
 *     correlation chain (event-derived), 404 when no replay present.
 *   - /mc/witness/stats surfaces event-derived attestation (WITNESS_CREATED) and
 *     refusal (WITNESS_REJECTED) counts - the honest witness status surface.
 *
 * WitnessAuthority is a pure createWitness hashing function with NO runtime
 * counters; the honest witness status is the emitted attestation stream, read
 * from ping_events. No stranded-system touch, no new subsystem, no new worker.
 */

const assert = require('assert');
const http = require('http');
const express = require('express');

let passed = 0, failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log(`  PASS ${name}`); })
    .catch((e) => { failed++; console.log(`  FAIL ${name}: ${e && e.message}`); });
}

// Live provider contract: KernelReplayExecutionProvider.getStats()
// returns { replays, events, failures }; _engineVersion = 'v1'.
function makeReplayProvider({ replays = 0, events = 0, failures = 0, engineVersion = 'v1' } = {}) {
  return {
    _engineVersion: engineVersion,
    getStats() { return { replays, events, failures }; },
  };
}

// Live spine contract: UnifiedEventRuntime.query({eventType,limit}) -> {events},
// getCorrelationGroup(correlationId, limit) -> {events}.
function makeEventRuntime(eventsByType) {
  const all = [];
  Object.entries(eventsByType || {}).forEach(([t, evts]) => {
    (evts || []).forEach((e) => all.push({ event_type: t, ...e }));
  });
  return {
    async query({ eventType, limit = 1000 }) {
      return { events: all.filter((e) => e.event_type === eventType).slice(0, limit) };
    },
    async getCorrelationGroup(id, limit = 200) {
      return {
        events: all
          .filter((e) => (e.metadata && e.metadata.correlation_id) === id || e.correlation_id === id)
          .slice(0, limit),
      };
    },
  };
}

// Boot a real express router on an ephemeral port and issue a GET.
function boot(services) {
  const createMissionControlRoutes = require('./routes/mission_control.js');
  const app = express();
  app.use('/mc', createMissionControlRoutes(services));
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

function get(server, path) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    http.get({ host: '127.0.0.1', port, path }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) { /* non-JSON */ }
        resolve({ status: res.statusCode, body: json });
      });
    }).on('error', reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

function makeServices(eventsByType, replayProvider, extra = {}) {
  return {
    unifiedEventRuntime: makeEventRuntime(eventsByType),
    missionRuntime: {},
    replayProvider, // may be undefined (PG-down)
    ...extra,
  };
}

async function run() {
  console.log('=== P0-1 Replay / Witness Observability (live /mc routes) ===');

  const replayEvt = {
    event_id: 'sha-aaaa',
    timestamp: '2026-08-27T00:00:00Z',
    event_type: 'REPLAY_COMPLETED',
    correlation_id: 'trace-1',
    metadata: { correlation_id: 'trace-1' },
    payload: {
      documentId: 'doc-1',
      replay: { verified: true, reason: 'kernel_verified', fingerprint: 'fp-1' },
    },
  };
  const witnessEvt = {
    event_id: 'sha-w1',
    timestamp: '2026-08-27T00:00:01Z',
    event_type: 'WITNESS_CREATED',
    correlation_id: 'trace-1',
    payload: { documentId: 'doc-1', upstreamEventId: 'sha-aaaa', witness: { attestation: 'witness-sha-aaaa' } },
  };
  const witnessRejected = {
    event_id: 'sha-r1',
    timestamp: '2026-08-27T00:00:02Z',
    event_type: 'WITNESS_REJECTED',
    correlation_id: 'trace-1',
    payload: { documentId: 'doc-bad', replay: { verified: false }, reason: 'unverified_replay:replay_not_verified' },
  };
  const baseEvents = {
    REPLAY_COMPLETED: [replayEvt],
    WITNESS_CREATED: [witnessEvt],
    WITNESS_REJECTED: [witnessRejected],
  };

  // ---- OB-1: /mc/replay/stats reaches LIVE provider + event-derived counts ----
  await test('OB-1 replay/stats surfaces live provider counters + event-derived projection', async () => {
    const srv = await boot(makeServices(baseEvents, makeReplayProvider({ replays: 3, events: 5, failures: 1 })));
    try {
      const { status, body } = await get(srv, '/mc/replay/stats');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.stats.total_replays, 1);
      assert.strictEqual(body.stats.verified, 1);
      assert.strictEqual(body.stats.unverified, 0);
      assert.strictEqual(body.stats.witness_rejected, 1);
      assert.ok(body.provider, 'provider block must be present when provider injected');
      assert.strictEqual(body.provider.engine_version, 'v1');
      assert.strictEqual(body.provider.replays_processed, 3);
      assert.strictEqual(body.provider.events_replayed, 5);
      assert.strictEqual(body.provider.failures, 1);
    } finally { await close(srv); }
  });

  // ---- OB-2: provider absent (PG-down) => provider hidden, not fabricated ----
  await test('OB-2 replay/stats hides provider block when provider not injected', async () => {
    const srv = await boot(makeServices(baseEvents, undefined));
    try {
      const { status, body } = await get(srv, '/mc/replay/stats');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(!('provider' in body), 'provider omitted, never fabricated');
      assert.strictEqual(body.stats.total_replays, 1);
    } finally { await close(srv); }
  });

  // ---- OB-3: empty replay state => clean zero counts, no 500 ----
  await test('OB-3 replay/stats handles empty state with zero counts and zero provider', async () => {
    const srv = await boot(makeServices({}, makeReplayProvider()));
    try {
      const { status, body } = await get(srv, '/mc/replay/stats');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.stats.total_replays, 0);
      assert.strictEqual(body.stats.verified, 0);
      assert.strictEqual(body.stats.witness_rejected, 0);
      assert.strictEqual(body.provider.replays_processed, 0);
      assert.strictEqual(body.provider.failures, 0);
    } finally { await close(srv); }
  });

  // ---- OB-4: replay/trace projects replay + witness tail from correlation chain ----
  await test('OB-4 replay/trace/:correlationId projects replay + witness tail', async () => {
    const srv = await boot(makeServices(baseEvents, makeReplayProvider({ replays: 1, events: 2 })));
    try {
      const { status, body } = await get(srv, '/mc/replay/trace/trace-1');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.correlationId, 'trace-1');
      assert.strictEqual(body.replays.length, 1);
      assert.strictEqual(body.replays[0].replay.verified, true);
      assert.strictEqual(body.replays[0].witness.length, 1);
      assert.strictEqual(body.replays[0].witness[0].event_type, 'WITNESS_CREATED');
    } finally { await close(srv); }
  });

  // ---- OB-5: replay/trace 404 when no replay in chain ----
  await test('OB-5 replay/trace 404 when correlation chain has no replay', async () => {
    const srv = await boot(makeServices(
      { OBSERVATION_CREATED: [{ event_id: 'x', event_type: 'OBSERVATION_CREATED' }] },
      undefined
    ));
    try {
      const { status, body } = await get(srv, '/mc/replay/trace/none');
      assert.strictEqual(status, 404);
      assert.strictEqual(body.status, 'not_found');
    } finally { await close(srv); }
  });

  // ---- OB-6: witness/stats reports attestation + refusal counts (event-derived) ----
  await test('OB-6 witness/stats surfaces attestations + refusals from ping_events', async () => {
    const srv = await boot(makeServices(baseEvents, makeReplayProvider({ replays: 2, events: 3 })));
    try {
      const { status, body } = await get(srv, '/mc/witness/stats');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.stats.attestations, 1); // WITNESS_CREATED
      assert.strictEqual(body.stats.refusals, 1);     // WITNESS_REJECTED
      assert.strictEqual(body.stats.total, 2);
    } finally { await close(srv); }
  });

  // ---- OB-7: workerRuntime still surfaces via /mc/workers (guard intact) ----
  await test('OB-7 workers endpoint unaffected by observability additions', async () => {
    const srv = await boot(makeServices(baseEvents, makeReplayProvider(), {
      workerRuntime: { getStats: () => ({ status: 'running', processed: 5, failed: 0 }) },
    }));
    try {
      const { status, body } = await get(srv, '/mc/workers');
      assert.strictEqual(status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.strictEqual(body.workers.processed, 5);
    } finally { await close(srv); }
  });

  // ---- OB-8: gateway_runtime.js wiring actually exposes services.replayProvider ----
  await test('OB-8 gateway_runtime services object carries replayProvider', async () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, 'bootstrap/gateway_runtime.js'), 'utf8');
    assert.ok(/deadLetterAuthority, replayProvider,/.test(src), 'services must include replayProvider alongside deadLetterAuthority');
    assert.ok(/replayProvider = new KernelReplayExecutionProvider\(\);/.test(src), 'replayProvider constructed as hoisted assignment');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

module.exports = { run };

if (require.main === module) {
  run().then((ok) => process.exit(ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(1); });
}
