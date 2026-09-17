'use strict';

const assert = require('assert');
const { test } = require('node:test');
const { ContextCompiler } = require('./context_compiler');

const EVENT_A = {
  event_id: 'evt_a',
  event_type: 'LEAD_CREATED',
  source: 'webhook',
  namespace: 'core::owner',
  timestamp: '2026-09-17T12:00:00Z',
  payload: {
    lead_id: 'lead_001',
    customer_id: 'cust_001',
    nested: { score: 10, labels: ['new', 'qualified'] },
  },
  metadata: {
    authority: 'event-authority',
    namespace: 'core::owner',
    correlation_id: 'corr_001',
    causation_id: null,
  },
};

const EVENT_B = {
  event_id: 'evt_b',
  event_type: 'CUSTOMER_CREATED',
  source: 'customer-authority',
  namespace: 'core::owner',
  timestamp: '2026-09-17T12:01:00Z',
  payload: { customer_id: 'cust_001', project_id: 'project_001' },
  metadata: {
    authority: 'customer-authority',
    namespace: 'core::owner',
    correlation_id: 'corr_001',
    causation_id: 'evt_a',
  },
};

const EVENT_C = {
  event_id: 'evt_c',
  event_type: 'CUSTOMER_CREATED',
  source: 'customer-authority',
  namespace: 'core::owner',
  timestamp: '2026-09-17T12:02:00Z',
  payload: { customer_id: 'cust_002' },
  metadata: {
    authority: 'customer-authority',
    namespace: 'core::owner',
    correlation_id: 'corr_001',
    causation_id: 'evt_a',
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compilerFor(events) {
  const eventRuntime = {
    async getCorrelationGroup(correlationId) {
      return { status: 'ok', correlation_id: correlationId, events };
    },
  };
  return new ContextCompiler({
    eventRuntime,
    evidenceAuthority: {
      async accumulate(ids) {
        return events.filter(event => ids.includes(event.event_id));
      },
    },
  });
}

async function compile(events) {
  return compilerFor(events).compile({
    missionId: 'mission_001',
    query: 'Follow up',
    correlationId: 'corr_001',
    namespace: 'core::owner',
  });
}

function stablePack(pack) {
  const copy = clone(pack);
  delete copy.compiled_at;
  return copy;
}

test('event selection is permutation-invariant in identity and payload', async () => {
  const forward = await compile([clone(EVENT_A), clone(EVENT_B)]);
  const reverse = await compile([clone(EVENT_B), clone(EVENT_A)]);

  assert.strictEqual(forward.context_pack_id, reverse.context_pack_id);
  assert.deepStrictEqual(stablePack(forward), stablePack(reverse));
});

test('retrieval manifest retains immutable selected-event references', async () => {
  const pack = await compile([clone(EVENT_A), clone(EVENT_B)]);

  assert.deepStrictEqual(
    pack.retrieval_manifest.selected_events.map(({ event_id }) => event_id),
    ['evt_a', 'evt_b']
  );
  for (const ref of pack.retrieval_manifest.selected_events) {
    assert.match(ref.content_hash, /^[0-9a-f]{64}$/);
  }
});

test('duplicate delivery of the same canonical event does not change context identity', async () => {
  const once = await compile([clone(EVENT_A)]);
  const twice = await compile([clone(EVENT_A), clone(EVENT_A)]);

  assert.strictEqual(once.context_pack_id, twice.context_pack_id);
  assert.deepStrictEqual(stablePack(once), stablePack(twice));
});

test('different selected event sets produce different identities', async () => {
  const ab = await compile([clone(EVENT_A), clone(EVENT_B)]);
  const ac = await compile([clone(EVENT_A), clone(EVENT_C)]);

  assert.notStrictEqual(ab.context_pack_id, ac.context_pack_id);
});

test('materially changed canonical event content changes context identity', async () => {
  const changed = clone(EVENT_A);
  changed.payload.nested.score = 11;

  const originalPack = await compile([clone(EVENT_A)]);
  const changedPack = await compile([changed]);
  assert.notStrictEqual(originalPack.context_pack_id, changedPack.context_pack_id);
});

test('conflicting contents under one event identity fail closed', async () => {
  const conflicting = clone(EVENT_A);
  conflicting.payload.nested.score = 11;

  await assert.rejects(
    compile([clone(EVENT_A), conflicting]),
    /Conflicting canonical event content for event_id 'evt_a'/
  );
});

test('object property insertion order does not change canonical identity', async () => {
  const reordered = {
    metadata: {
      causation_id: null,
      correlation_id: 'corr_001',
      namespace: 'core::owner',
      authority: 'event-authority',
    },
    payload: {
      nested: { labels: ['new', 'qualified'], score: 10 },
      customer_id: 'cust_001',
      lead_id: 'lead_001',
    },
    timestamp: '2026-09-17T12:00:00Z',
    source: 'webhook',
    namespace: 'core::owner',
    event_type: 'LEAD_CREATED',
    event_id: 'evt_a',
  };

  const originalPack = await compile([clone(EVENT_A)]);
  const reorderedPack = await compile([reordered]);
  assert.strictEqual(originalPack.context_pack_id, reorderedPack.context_pack_id);
});

test('nested canonical differences are deterministic', async () => {
  const first = clone(EVENT_A);
  first.payload.nested.labels = ['new', 'qualified'];
  const second = clone(EVENT_A);
  second.payload.nested.labels = ['qualified', 'new'];

  const firstPack = await compile([first]);
  const firstReplay = await compile([clone(first)]);
  const secondPack = await compile([second]);
  assert.strictEqual(firstPack.context_pack_id, firstReplay.context_pack_id);
  assert.notStrictEqual(firstPack.context_pack_id, secondPack.context_pack_id);
});

test('compilation does not mutate caller-owned events', async () => {
  const events = [clone(EVENT_B), clone(EVENT_A)];
  const before = clone(events);

  await compile(events);
  assert.deepStrictEqual(events, before);
});
