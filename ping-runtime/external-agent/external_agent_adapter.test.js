'use strict';
/**
 * Fail-closed tests for ExternalAgentAdapter authorization/issuance/verification.
 * Run: node external-agent/external_agent_adapter.test.js  (from worktree root)
 */
const assert = require('assert');
const {
  AGENT_PROFILES, workOrderId, authorizeWorkOrder,
  issueWorkOrder, verifyResultEnvelope, resultIdentity,
  recordVerifiedResult, canonicalEventId,
} = require('./external_agent_adapter');

const BASE = {
  agentId: 'hermes',
  capability: 'text.transform',
  namespace: 'core::owner',
  taskId: 'task-uppercase-001',
  missionId: 'mission-agent-exec-001',
  correlationId: 'sprint-2026-09-16',
  input: { text: 'abc' },
  constraints: {
    read_only: true, no_writes: true, no_network: true,
    no_canonical_events: true, no_mission_state_writes: true,
    allowed_workspace: 'test.agent-exec', allowed_toolsets: ['default'],
  },
  resultPath: '/results/0d598aef352b9a8a.json',
  deadline: '2026-09-17T03:00:00Z',
};

let n = 0;
function ok(cond, name) { n++; assert(cond, `FAIL: ${name}`); console.log(`ok ${n} - ${name}`); }

// 1. Deterministic work order ID matches tonight's proven live run.
ok(workOrderId('task-uppercase-001') === '0d598aef352b9a8a',
  'work_order_id deterministic and equals live value 0d598aef352b9a8a');

// 2. authorizeWorkOrder grants the exact shape of tonight's successful order.
const g = authorizeWorkOrder({ agentId: BASE.agentId, capability: BASE.capability, namespace: BASE.namespace, constraints: BASE.constraints });
ok(g.granted === true, 'authorizeWorkOrder grants hermes/text.transform under read-only constraints');

// 3. Fail-closed: unknown agent.
const u = authorizeWorkOrder({ ...BASE, agentId: 'mystery-agent' });
ok(u.granted === false && /Unknown exterior agent/.test(u.reason), 'denies unknown agent');

// 4. Fail-closed: capability not in agent allowlist.
const c = authorizeWorkOrder({ ...BASE, capability: 'shell.exec' });
ok(c.granted === false && /not allowed/.test(c.reason), 'denies unlisted capability');

// 5. Fail-closed: blockedExternal agent (codex quota, opencode no-CLI).
const b = authorizeWorkOrder({ ...BASE, agentId: 'codex', capability: 'fixture.read' });
ok(b.granted === false && /unavailable/.test(b.reason), 'denies agent under external block');

// 6. Fail-closed: invalid namespace shape.
const ns = authorizeWorkOrder({ ...BASE, namespace: 'test.agent-exec' });
ok(ns.granted === false && /Invalid namespace/.test(ns.reason), 'denies non-canonical namespace');

// 7. Fail-closed: loosened constraints (writes allowed).
const w = authorizeWorkOrder({ ...BASE, constraints: { ...BASE.constraints, no_writes: false } });
ok(w.granted === false && /must be true/.test(w.reason), 'denies write-enabled constraints for hermes');

// 8. Fail-closed: missing canonical-event/mission-state prohibitions.
const p = authorizeWorkOrder({ ...BASE, constraints: { ...BASE.constraints, no_canonical_events: false } });
ok(p.granted === false && /forbid canonical events/.test(p.reason), 'denies order that permits canonical events');

// 9. issueWorkOrder builds the full envelope; throws on denial.
const wo = issueWorkOrder(BASE);
ok(wo.work_order_id === '0d598aef352b9a8a' && wo.agent_id === 'hermes' && wo.principal === 'ping:external-agent-adapter' && wo.attempt === 1,
  'issueWorkOrder binds deterministic envelope to authorized agent');
assert.throws(() => issueWorkOrder({ ...BASE, agentId: 'nobody' }), /Work order denied/, 'issueWorkOrder throws on denial');
n++; console.log(`ok ${n} - issueWorkOrder throws on denial`);

// 10. Result verification binds authorization, invocation, capability, outcome,
// and deadline. These are independent fail-closed checks.
const VERIFY = { invokedAgentId: 'hermes', verifiedAt: '2026-09-17T02:59:59Z' };
const res = {
  work_order_id: '0d598aef352b9a8a',
  agent_id: 'hermes',
  capability: 'text.transform',
  status: 'completed',
  output: 'ABC',
  evidence: { durationMs: 1 },
  error: null,
};
const verified = verifyResultEnvelope(res, wo, VERIFY);
ok(verified.valid === true && /^[0-9a-f]{64}$/.test(verified.result_id), 'accepts bound result and assigns canonical result identity');
ok(verifyResultEnvelope(res, wo, { ...VERIFY, invokedAgentId: 'codex' }).valid === false, 'rejects wrong invoked executor');
ok(verifyResultEnvelope({ ...res, agent_id: 'codex' }, wo, VERIFY).valid === false, 'rejects wrong result executor');
ok(verifyResultEnvelope({ ...res, work_order_id: 'deadbeefdeadbeef' }, wo, VERIFY).valid === false, 'rejects wrong work_order_id');
ok(verifyResultEnvelope({ ...res, capability: 'text.summarize' }, wo, VERIFY).valid === false, 'rejects wrong capability');
ok(verifyResultEnvelope({ ...res, status: 'maybe' }, wo, VERIFY).valid === false, 'rejects invalid status');
ok(verifyResultEnvelope({ ...res, error: 'contradiction' }, wo, VERIFY).valid === false, 'rejects completed result with error');
ok(verifyResultEnvelope({ ...res, status: 'failed', error: 'boom' }, wo, VERIFY).valid === false, 'rejects failed result with output');
ok(verifyResultEnvelope({ ...res, status: 'failed', output: null, error: 'boom' }, wo, VERIFY).valid === true, 'accepts internally consistent failed result');
ok(verifyResultEnvelope(res, wo, { ...VERIFY, verifiedAt: '2026-09-17T03:00:01Z' }).valid === false, 'rejects result after deadline');
ok(verifyResultEnvelope(res, wo).valid === false, 'rejects result without invocation/time authority context');
ok(verifyResultEnvelope({ output: 'x' }, wo, VERIFY).valid === false, 'rejects missing fields');

const reordered = { error: null, evidence: { durationMs: 1 }, output: 'ABC', status: 'completed', capability: 'text.transform', agent_id: 'hermes', work_order_id: '0d598aef352b9a8a' };
ok(resultIdentity(res, wo) === resultIdentity(reordered, wo), 'result identity is stable across object key order');
const conflicting = { ...res, output: 'DIFFERENT', evidence: { durationMs: 999 } };
ok(resultIdentity(res, wo) === resultIdentity(conflicting, wo), 'one WorkOrder attempt has exactly one terminal result identity');
const retryWorkOrder = issueWorkOrder({ ...BASE, attempt: 2 });
ok(resultIdentity(res, wo) !== resultIdentity(res, retryWorkOrder), 'a deliberate retry attempt receives a distinct result identity');

// 11. canonicalEventId pins the LIVE identity rule:
//   logical_id = JSON.stringify(payload minus VOLATILE_FIELDS)
//   identity   = { eventType, source, namespace, logical_id }
//   event_id   = sha256(JSON.stringify(identity))
// Byte-exactness against Oracle was verified live 2026-09-16
// (persisted event f326ea70d7cf16ce85c4cc56a23bc147ce0273984023c123b8b5467ea6d507de,
//  ENTITY_CREATED / api:muse-level-2 / core::owner). This test pins the rule.
const eidArgs = {
  eventType: 'ENTITY_CREATED',
  source: 'api:muse-level-2',
  namespace: 'core::owner',
  payload: { entity_type: 'evidence', logical_id: 'ev-hermes-001', work_order_id: '0d598aef352b9a8a', timestamp: '2026-09-17T02:25:23Z' },
};
const eid1 = canonicalEventId(eidArgs);
ok(typeof eid1 === 'string' && /^[0-9a-f]{64}$/.test(eid1), 'canonicalEventId returns a 64-hex deterministic id');
const eid2 = canonicalEventId({ ...eidArgs, payload: { ...eidArgs.payload, timestamp: '2099-01-01T00:00:00Z' } });
ok(eid1 === eid2, 'volatile timestamp fields do not change the canonical id');
const eid3 = canonicalEventId({ ...eidArgs, payload: { ...eidArgs.payload, logical_id: 'ev-other' } });
ok(eid1 !== eid3, 'payload changes change the canonical id');
const eid4 = canonicalEventId({ ...eidArgs, namespace: 'core::someone-else' });
ok(eid1 !== eid4, 'namespace is part of the canonical id');

async function verifyCanonicalReentry() {
  const events = [];
  const ids = new Set();
  const eventRuntime = {
    async emit(eventType, source, payload, options) {
      const eventId = canonicalEventId({ eventType, source, namespace: options.namespace, payload: { result_id: options.logical_id } });
      const deduplicated = ids.has(eventId);
      ids.add(eventId);
      if (!deduplicated) events.push({ eventType, source, payload, options, eventId });
      return { status: 'ok', eventId, deduplicated };
    },
  };

  const first = await recordVerifiedResult({ eventRuntime, result: res, workOrder: wo, ...VERIFY });
  const retry = await recordVerifiedResult({ eventRuntime, result: res, workOrder: wo, ...VERIFY });
  ok(first.valid && first.event_type === 'WORKER_COMPLETED', 'verified completion reenters through canonical worker event');
  ok(retry.valid && retry.deduplicated === true && events.length === 1, 'retry preserves one canonical result event');
  ok(events[0].source === 'worker-runtime:external-agent-adapter' && events[0].options.logical_id === first.result_id,
    'PING authority emits deterministic result identity; exterior agent never emits');

  const rejected = await recordVerifiedResult({
    eventRuntime,
    result: { ...res, agent_id: 'codex' },
    workOrder: wo,
    ...VERIFY,
  });
  ok(rejected.valid === false && events.length === 1, 'invalid result cannot reach canonical event authority');
}

verifyCanonicalReentry()
  .then(() => console.log(`\nPASS: ${n} assertions`))
  .catch((err) => { console.error(err); process.exitCode = 1; });
