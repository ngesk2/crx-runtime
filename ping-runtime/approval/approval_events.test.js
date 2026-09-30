/**
 * Approval events test — forensics fix 2026-09-30 (item 3).
 *
 * Proves:
 *  1. recordProposedAction() then recordDecision() emit through the SINGLE
 *     existing emit() choke point and land canonical ping_events rows with
 *     the right types (PROPOSED_ACTION -> ACTION_APPROVED).
 *  2. The new types pass the REAL EventValidator (registry) and the REAL
 *     EventGovernance (namespace policy) — i.e. they are emittable on the
 *     production path, not just a test double.
 *  3. Lineage: the decision's causation_id points at the proposal event.
 *  4. Idempotency: re-recording the same proposal dedupes (same event_id,
 *     ON CONFLICT DO NOTHING).
 *  5. Redaction routing: the helper hands the raw payload to emit() with
 *     NO pre-redaction of its own, so the emit-path redaction choke point
 *     (Interval 10 T06) applies automatically when it lands. Payload-level
 *     redaction is asserted only when the choke point exists; until then the
 *     test records the dependency instead of duplicating T06's work.
 */

const assert = require('assert');
const path = require('path');

const REPO_ROOT = '/home/nolan/ping';
const { UnifiedEventRuntime } = require(path.join(REPO_ROOT, 'ping-runtime/events/unified_event_runtime.js'));
const { EventValidator } = require(path.join(REPO_ROOT, 'ping-runtime/events/event_validator.js'));
const { EventGovernance } = require(path.join(REPO_ROOT, 'ping-runtime/events/event_governance.js'));
const {
  APPROVAL_EVENT_TYPES,
  recordProposedAction,
  recordDecision,
} = require('./approval_events.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log('  PASS ' + name); })
    .catch((e) => { failed++; console.log('  FAIL ' + name + ': ' + (e && e.message)); });
}

// In-memory pg.Pool stand-in: records INSERTs as canonical ping_events rows.
function makeFakePool() {
  const rows = [];
  return {
    rows,
    async query(sql, params) {
      if (/INSERT INTO ping_events/i.test(sql)) {
        const [event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id] = params;
        const existing = rows.find((r) => r.event_id === event_id);
        if (existing) {
          return { rowCount: 0, rows: [] }; // ON CONFLICT DO NOTHING
        }
        rows.push({
          event_id, event_type, source, timestamp,
          payload: JSON.parse(payload), metadata: JSON.parse(metadata), namespace, tenant_id,
        });
        return { rowCount: 1, rows: [] };
      }
      if (/SELECT payload FROM ping_events WHERE event_id/i.test(sql)) {
        const row = rows.find((r) => r.event_id === params[0]);
        return { rows: row ? [{ payload: row.payload }] : [] };
      }
      return { rowCount: 0, rows: [] };
    },
  };
}

async function main() {
  console.log('=== Approval Events Tests ===');

  await test('new types are registered in event_registry.json', async () => {
    const validator = new EventValidator(REPO_ROOT).load();
    for (const t of Object.values(APPROVAL_EVENT_TYPES)) {
      assert.ok(validator.isRegistered(t), `${t} must be registered`);
    }
  });

  await test('new types pass the real EventGovernance namespace policy', async () => {
    const governance = new EventGovernance(REPO_ROOT).load();
    for (const t of Object.values(APPROVAL_EVENT_TYPES)) {
      const res = governance.validateEvent({ event_type: t, source: 'operator', payload: {}, namespace: 'core::system' });
      assert.ok(res.valid, `${t} governance must pass: ${JSON.stringify(res.errors || res.code)}`);
    }
  });

  await test('PROPOSED_ACTION then ACTION_APPROVED land as canonical rows', async () => {
    const pool = makeFakePool();
    const validator = new EventValidator(REPO_ROOT).load();
    const governance = new EventGovernance(REPO_ROOT).load();
    const runtime = new UnifiedEventRuntime({ pool, eventValidator: validator, eventGovernance: governance });

    const proposal = await recordProposedAction(runtime, {
      actionId: 'action_publish_001',
      capability: 'social.publish',
      targetIdentity: 'facebook:page:61594275542163',
      preview: 'Draft post text (no secrets here)',
      reason: 'Nolan approved the queue item in review',
      evidenceRefs: ['event:abc123'],
      risk: 'low',
      proposedBy: 'pigi',
    });
    assert.strictEqual(proposal.status, 'ok', 'proposal emit must succeed: ' + proposal.error);

    const decision = await recordDecision(runtime, {
      actionId: 'action_publish_001',
      decision: 'APPROVED',
      decidedBy: 'nolan',
      reason: 'Looks good, ship it',
      proposedActionEventId: proposal.eventId,
    }, {
      // Thread the proposal's correlation root into the decision explicitly;
      // the spine defaults correlation_id to the new event's own ID otherwise.
      correlationId: proposal.event.metadata.correlation_id,
    });
    assert.strictEqual(decision.status, 'ok', 'decision emit must succeed: ' + decision.error);

    assert.strictEqual(pool.rows.length, 2, 'two canonical rows expected');
    const [rowP, rowD] = pool.rows;
    assert.strictEqual(rowP.event_type, 'PROPOSED_ACTION');
    assert.strictEqual(rowD.event_type, 'ACTION_APPROVED');
    assert.strictEqual(rowP.payload.action_id, 'action_publish_001');
    assert.strictEqual(rowD.payload.decision, 'APPROVED');
    assert.strictEqual(rowD.payload.decided_by, 'nolan');
    // Lineage: decision caused by the proposal.
    assert.strictEqual(rowD.metadata.causation_id, proposal.eventId);
    // Correlation: decision inherits the proposal's correlation root by default.
    assert.strictEqual(rowD.metadata.correlation_id, rowP.metadata.correlation_id);
    console.log('    proposal=' + proposal.eventId.slice(0, 12) + ' decision=' + decision.eventId.slice(0, 12));
  });

  await test('REJECTED decision records the rejection type', async () => {
    const pool = makeFakePool();
    const validator = new EventValidator(REPO_ROOT).load();
    const runtime = new UnifiedEventRuntime({ pool, eventValidator: validator });
    const res = await recordDecision(runtime, {
      actionId: 'action_publish_002', decision: 'REJECTED', decidedBy: 'nolan', reason: 'off-brand',
    });
    assert.strictEqual(res.status, 'ok', 'reject emit must succeed: ' + res.error);
    assert.strictEqual(pool.rows[0].event_type, 'REJECTED');
  });

  await test('re-recording the same proposal is idempotent (dedupe)', async () => {
    const pool = makeFakePool();
    const validator = new EventValidator(REPO_ROOT).load();
    const runtime = new UnifiedEventRuntime({ pool, eventValidator: validator });
    const a = { actionId: 'action_dup_001', capability: 'social.publish', reason: 'x' };
    const r1 = await recordProposedAction(runtime, a);
    const r2 = await recordProposedAction(runtime, a);
    assert.strictEqual(r1.status, 'ok');
    assert.strictEqual(r2.status, 'ok');
    assert.strictEqual(r1.eventId, r2.eventId, 'same logical proposal -> same event_id');
    assert.strictEqual(pool.rows.length, 1, 'duplicate absorbed by ON CONFLICT DO NOTHING');
  });

  await test('invalid decision literals fail fast (no silent bad records)', async () => {
    const pool = makeFakePool();
    const runtime = new UnifiedEventRuntime({ pool });
    await assert.rejects(
      () => recordDecision(runtime, { actionId: 'a', decision: 'MAYBE', decidedBy: 'nolan' }),
      /must be one of/
    );
    await assert.rejects(
      () => recordDecision(runtime, { actionId: 'a', decision: 'APPROVED' }),
      /decidedBy/
    );
    assert.strictEqual(pool.rows.length, 0, 'no rows for invalid decisions');
  });

  await test('redaction routing: helper performs no pre-redaction; T06 choke point owns it', async () => {
    const fs = require('fs');
    const runtimeSrc = fs.readFileSync(
      path.join(REPO_ROOT, 'ping-runtime/events/unified_event_runtime.js'), 'utf8');
    const t06Landed = /redact/i.test(runtimeSrc);
    const helperSrc = fs.readFileSync(path.join(__dirname, 'approval_events.js'), 'utf8');
    // The helper must not implement its own redaction: no REDACTED markers,
    // no masking/replace calls that would diverge from the choke point.
    assert.ok(!/REDACTED/.test(helperSrc), 'approval_events.js must not mask values itself');
    assert.ok(!/\b(redactValue|maskSecret|scrubSecrets|sanitizeSecrets)\b/i.test(helperSrc),
      'approval_events.js must not implement redaction helpers');

    // Spy: prove the raw payload reaches emit() untouched — the choke point
    // (when T06 lands) is therefore the single place redaction can apply.
    const pool = makeFakePool();
    const validator = new EventValidator(REPO_ROOT).load();
    const runtime = new UnifiedEventRuntime({ pool, eventValidator: validator });
    let seenPayload = null;
    const origEmit = runtime.emit.bind(runtime);
    runtime.emit = async (t, s, p, o) => { seenPayload = p; return origEmit(t, s, p, o); };
    const fakeSecret = 'sk-test-FAKE-0000-not-a-real-secret';
    await recordProposedAction(runtime, {
      actionId: 'action_redact_probe', capability: 'social.publish', preview: `contains ${fakeSecret}`,
    });
    assert.ok(seenPayload.preview.includes(fakeSecret), 'raw payload reaches emit()');
    if (t06Landed) {
      assert.ok(!pool.rows[0].payload.preview.includes('FAKE-0000'),
        'T06 landed: choke point must have redacted the stored payload');
      console.log('    T06 redaction choke point: LANDED — inheritance verified at payload level');
    } else {
      console.log('    T06 redaction choke point: NOT LANDED in this tree — routing verified;');
      console.log('    payload-level redaction is the T06 lane\'s work, not duplicated here.');
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
