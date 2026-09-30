/**
 * Contradiction detection test — forensics fix 2026-09-30 (item 5b).
 *
 * Proves the bounded behavior fires:
 *  1. Two claims about the same subject with opposing verdicts
 *     (CONFIRMED vs REFUTED) surface ONE CONTRADICTION_SURFACED event with
 *     both claims in the payload, causation_id = the newer claim event,
 *     correlation lineage preserved.
 *  2. Agreeing claims do NOT surface anything (no false positives).
 *  3. An explicit contradicts_event_id link surfaces the pair even
 *     without verdicts.
 *  4. Re-detection of the same pair is idempotent (logical_id dedupe).
 *  5. The surfaced event type is registered and passes governance.
 */

const assert = require('assert');
const path = require('path');

const REPO_ROOT = '/home/nolan/ping';
const { EventValidator } = require(path.join(REPO_ROOT, 'ping-runtime/events/event_validator.js'));
const { EventGovernance } = require(path.join(REPO_ROOT, 'ping-runtime/events/event_governance.js'));
const {
  CONTRADICTION_SURFACED,
  findContradiction,
  ContradictionDetector,
} = require('./contradiction_detection.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('  PASS ' + name); })
    .catch((e) => { failed++; console.log('  FAIL ' + name + ': ' + (e && e.message)); });
}

function makeHarness() {
  const handlers = {};
  const emitted = [];
  const eventRuntime = {
    on: (type, h) => { handlers[type] = h; },
    emit: async (eventType, source, payload, options) => {
      emitted.push({ eventType, source, payload, options });
      return { status: 'ok', eventId: 'evt_surf_' + emitted.length };
    },
  };
  const detector = new ContradictionDetector({ eventRuntime, windowSize: 50 });
  detector.start();
  return { handlers, emitted, detector };
}

function claimEvent(id, claim, extra = {}) {
  return {
    event_id: id,
    event_type: 'CLAIM_CREATED',
    source: 'claim',
    namespace: 'core::system',
    tenant_id: 'UNKNOWN',
    metadata: { correlation_id: 'corr_x', confidence: 0.5 },
    payload: { documentId: 'doc_1', claim, upstreamEventId: 'evt_obs_1' },
    ...extra,
  };
}

async function main() {
  console.log('=== Contradiction Detection Tests ===');

  await test('CONTRADICTION_SURFACED is registered and passes governance', async () => {
    const validator = new EventValidator(REPO_ROOT).load();
    assert.ok(validator.isRegistered(CONTRADICTION_SURFACED), 'must be registered');
    const governance = new EventGovernance(REPO_ROOT).load();
    const res = governance.validateEvent({ event_type: CONTRADICTION_SURFACED, source: 'x', payload: {}, namespace: 'core::system' });
    assert.ok(res.valid, 'governance must pass: ' + JSON.stringify(res.errors || res.code));
  });

  await test('opposing verdicts on the same subject surface one event', async () => {
    const { handlers, emitted } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent('evt_c1', { text: 'Typesafe has a public metrics API.', verdict: 'CONFIRMED' }));
    await handlers.CLAIM_CREATED(claimEvent('evt_c2', { text: 'Typesafe has a public metrics API.', verdict: 'REFUTED' }));
    assert.strictEqual(emitted.length, 1, 'exactly one surfaced event');
    const e = emitted[0];
    assert.strictEqual(e.eventType, CONTRADICTION_SURFACED);
    assert.strictEqual(e.source, 'contradiction-detector');
    assert.strictEqual(e.payload.claim_a.event_id, 'evt_c1');
    assert.strictEqual(e.payload.claim_b.event_id, 'evt_c2');
    assert.strictEqual(e.payload.review, 'human', 'surfaced for review, never decided');
    assert.strictEqual(e.options.causation_id, 'evt_c2', 'causation = newer claim');
    assert.strictEqual(e.options.correlation_id, 'corr_x', 'correlation threaded');
    assert.ok(e.options.logical_id.startsWith('contradiction:'), 'logical_id for dedupe');
  });

  await test('agreeing claims do not surface', async () => {
    const { handlers, emitted, detector } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent('evt_a1', { text: 'The sky is blue.', verdict: 'CONFIRMED' }));
    await handlers.CLAIM_CREATED(claimEvent('evt_a2', { text: 'The sky is blue.', verdict: 'SUPPORTED' }));
    await handlers.CLAIM_CREATED(claimEvent('evt_a3', { text: 'Grass is green.', verdict: 'CONFIRMED' }));
    assert.strictEqual(emitted.length, 0, 'no false positives');
    assert.strictEqual(detector.getStats().claimsSeen, 3);
  });

  await test('explicit contradicts link surfaces the pair', async () => {
    const { handlers, emitted } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent('evt_b1', { text: 'The new pricing is live.' }));
    await handlers.CLAIM_CREATED(claimEvent('evt_b2', {
      text: 'Pricing page still shows old tiers.', contradicts_event_id: 'evt_b1',
    }));
    assert.strictEqual(emitted.length, 1);
    assert.strictEqual(emitted[0].payload.claim_a.event_id, 'evt_b1');
    assert.strictEqual(emitted[0].payload.claim_b.event_id, 'evt_b2');
  });

  await test('same pair re-detected uses the same logical_id (idempotent)', async () => {
    const { handlers, emitted } = makeHarness();
    await handlers.CLAIM_CREATED(claimEvent('evt_d1', { text: 'X is true.', verdict: 'CONFIRMED' }));
    await handlers.CLAIM_CREATED(claimEvent('evt_d2', { text: 'X is true.', verdict: 'REFUTED' }));
    // A third claim re-triggers comparison against the window; the pair's
    // logical_id must be identical so the spine dedupes it.
    const first = emitted[0].options.logical_id;
    await handlers.CLAIM_CREATED(claimEvent('evt_d3', { text: 'X is true.', verdict: 'REFUTED' }));
    const pairIds = emitted.map((e) => e.options.logical_id);
    const unique = new Set(pairIds);
    assert.ok(pairIds.every((id) => id === first || id.includes('evt_d3')),
      're-detection reuses the same logical_id for the same pair: ' + JSON.stringify(pairIds));
    assert.ok(unique.size <= 2, 'no unbounded fan-out');
  });

  await test('pure rule: verified true vs false on same subject conflicts', async () => {
    const w = [
      claimEvent('evt_v1', { text: 'Deploy completed.', verified: true }),
    ];
    const hit = findContradiction(
      claimEvent('evt_v2', { text: 'Deploy completed.', verified: false }), w);
    assert.ok(hit && hit.event_id === 'evt_v1');
    const miss = findContradiction(
      claimEvent('evt_v3', { text: 'Deploy completed.' }), w);
    assert.strictEqual(miss, null, 'no verdict/verified signal, no conflict');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
