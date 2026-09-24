'use strict';
/**
 * Mission scheme convergence pins (2026-09-24, stream 2 Phase 0).
 *
 * Declared direction: `ping_missions` (MissionRuntime) is the single canonical
 * mission scheme; the bare `missions` scheme (MissionRepository + 5 gateway
 * readers) is dormant legacy. These tests pin that direction:
 *
 * 1. MissionRuntime.create writes INSERT INTO ping_missions with a
 *    deterministic, idempotent mission_id.
 * 2. MissionRuntime.create emits MISSION_CREATED through the injected
 *    UnifiedEventRuntime (the canonical event authority), not a side table.
 * 3. The dormant `missions`-scheme modules carry deprecation markers pointing
 *    at MissionRuntime (so the legacy scheme cannot be silently resurrected).
 * 4. The dormant modules are absent from the live gateway require graph
 *    (server.js -> bootstrap/gateway_runtime.js).
 *
 * Run: node --test mission_scheme_convergence.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { MissionRuntime } = require('./mission_runtime.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function mockPool(captured) {
  return {
    query: async (sql, params) => {
      captured.push({ sql, params });
      return { rowCount: 1, rows: [] };
    },
  };
}

test('MissionRuntime.create targets the canonical ping_missions table', async () => {
  const captured = [];
  const rt = new MissionRuntime({ pool: mockPool(captured) });
  const id = await rt.create('LEAD_FOLLOWUP', { event_id: 'evt_123' }, { priority: 3 });
  assert.equal(captured.length, 1);
  assert.match(captured[0].sql, /INSERT INTO ping_missions/);
  assert.match(captured[0].sql, /ON CONFLICT \(mission_id\) DO NOTHING/);
  assert.equal(typeof id, 'string');
  assert.equal(id.length, 16);
});

test('MissionRuntime mission_id is deterministic and idempotent by construction', async () => {
  const mk = () => new MissionRuntime({ pool: mockPool([]) });
  const payload = { event_id: 'evt_abc', source: 'email-connector' };
  const id1 = await mk().create('REVIEW_RESPONSE', payload);
  const id2 = await mk().create('REVIEW_RESPONSE', { ...payload });
  const id3 = await mk().create('REVIEW_RESPONSE', { event_id: 'evt_other' });
  assert.equal(id1, id2, 'same logical mission must hash to the same id');
  assert.notEqual(id1, id3, 'different events must hash to different ids');
});

test('MissionRuntime.create emits MISSION_CREATED through the injected event runtime (UER)', async () => {
  const emitted = [];
  const fakeUER = { emit: async (t, s, p) => { emitted.push({ t, s, p }); } };
  const rt = new MissionRuntime({ pool: mockPool([]), eventRuntime: fakeUER });
  const id = await rt.create('CUSTOMER_ONBOARD', { event_id: 'evt_1' });
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].t, 'MISSION_CREATED');
  assert.equal(emitted[0].s, 'mission-runtime');
  assert.equal(emitted[0].p.missionId, id);
});

const DORMANT_MISSION_MODULES = [
  'gateway/repositories/mission_repository.js',
  'gateway/control_center_subscription.js',
  'gateway/materialized_views.js',
  'gateway/self_improvement_loop.js',
  'gateway/context_retrieval_authority.js',
  'gateway/mission_execution_authority.js',
];

test('dormant missions-scheme modules carry deprecation markers pointing at MissionRuntime', () => {
  for (const rel of DORMANT_MISSION_MODULES) {
    const src = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    assert.ok(
      src.includes('mission/event-bus convergence stream'),
      `${rel} missing convergence deprecation marker`
    );
    assert.ok(
      src.includes('mission_runtime'),
      `${rel} marker must name the canonical MissionRuntime authority`
    );
  }
});

test('dormant missions-scheme modules are absent from the live gateway require graph', () => {
  const liveEntry = fs.readFileSync(path.join(REPO_ROOT, 'gateway/bootstrap/gateway_runtime.js'), 'utf8')
    + '\n' + fs.readFileSync(path.join(REPO_ROOT, 'gateway/server.js'), 'utf8');
  const basenames = DORMANT_MISSION_MODULES.map((p) => path.basename(p, '.js'));
  for (const base of basenames) {
    assert.ok(
      !liveEntry.includes(base),
      `live gateway must not reference dormant module ${base}`
    );
  }
});
