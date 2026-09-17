'use strict';

const assert = require('assert');
const { test } = require('node:test');
const { ContextCompiler } = require('./context_compiler');

function event(id, options = {}) {
  const namespace = options.namespace || 'tenant::acme';
  const correlationId = options.correlationId || 'corr_001';
  return {
    event_id: id,
    event_type: options.eventType || 'OBSERVATION_CREATED',
    source: options.source || 'worker-runtime:observation',
    namespace,
    timestamp: options.timestamp || '2026-09-17T12:00:00Z',
    payload: options.payload || { logical_id: id },
    metadata: {
      namespace,
      correlation_id: correlationId,
      causation_id: options.causationId || null,
      schema_version: '1.0.0',
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function harness(candidates, backing = candidates) {
  const calls = { correlation: [], evidence: [] };
  const eventRuntime = {
    async getCorrelationGroup(correlationId, limit, namespace) {
      calls.correlation.push({ correlationId, limit, namespace });
      return { status: 'ok', correlation_id: correlationId, events: clone(candidates) };
    },
  };
  const evidenceAuthority = {
    async accumulate(ids) {
      calls.evidence.push([...ids]);
      return clone(backing).filter(item => ids.includes(item.event_id));
    },
  };
  return {
    calls,
    compiler: new ContextCompiler({ eventRuntime, evidenceAuthority }),
  };
}

function compile(compiler, overrides = {}) {
  return compiler.compile({
    missionId: 'mission_001',
    query: 'Follow up',
    correlationId: 'corr_001',
    namespace: 'tenant::acme',
    ...overrides,
  });
}

test('context compilation requires an explicit authorized namespace', async () => {
  const { compiler } = harness([event('evt_root')]);
  await assert.rejects(
    compile(compiler, { namespace: undefined }),
    /namespace is required/
  );
});

test('canonical retrieval is namespace-filtered and evidence is re-resolved', async () => {
  const events = [event('evt_root'), event('evt_child', { causationId: 'evt_root' })];
  const { compiler, calls } = harness(events);
  const pack = await compile(compiler);

  assert.deepStrictEqual(calls.correlation, [{
    correlationId: 'corr_001',
    limit: 101,
    namespace: 'tenant::acme',
  }]);
  assert.deepStrictEqual(calls.evidence, [['evt_child', 'evt_root']]);
  assert.strictEqual(pack.namespace, 'tenant::acme');
  assert.strictEqual(pack.retrieval_manifest.inputs.namespace, 'tenant::acme');
});

test('candidate from another namespace fails closed', async () => {
  const { compiler } = harness([
    event('evt_root'),
    event('evt_foreign', { namespace: 'tenant::other' }),
  ]);

  await assert.rejects(compile(compiler), /namespace mismatch/);
});

test('missing backing evidence fails closed', async () => {
  const root = event('evt_root');
  const child = event('evt_child', { causationId: 'evt_root' });
  const { compiler } = harness([root, child], [root]);

  await assert.rejects(compile(compiler), /Evidence backing mismatch/);
});

test('materially altered backing evidence fails closed', async () => {
  const root = event('evt_root');
  const altered = clone(root);
  altered.payload.logical_id = 'tampered';
  const { compiler } = harness([root], [altered]);

  await assert.rejects(compile(compiler), /Evidence backing mismatch/);
});

test('correlation lineage mismatch fails closed', async () => {
  const { compiler } = harness([
    event('evt_root', { correlationId: 'corr_other' }),
  ]);

  await assert.rejects(compile(compiler), /correlation mismatch/);
});

test('dangling causation lineage fails closed', async () => {
  const { compiler } = harness([
    event('evt_child', { causationId: 'evt_missing' }),
  ]);

  await assert.rejects(compile(compiler), /causation_id 'evt_missing' is not selected/);
});

test('selection fails closed instead of silently truncating over 100 events', async () => {
  const events = Array.from({ length: 101 }, (_, index) => event(`evt_${String(index).padStart(3, '0')}`));
  const { compiler } = harness(events);

  await assert.rejects(compile(compiler), /exceeds the 100-event bound/);
});

test('compiler health requires both canonical reader and evidence authority', async () => {
  const healthy = await harness([]).compiler.health();
  const unverified = await new ContextCompiler({
    eventRuntime: { getCorrelationGroup: async () => ({ status: 'ok', events: [] }) },
  }).health();

  assert.strictEqual(healthy.healthy, true);
  assert.strictEqual(healthy.evidenceAuthority, true);
  assert.strictEqual(unverified.healthy, false);
});
