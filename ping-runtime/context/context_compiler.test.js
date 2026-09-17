/**
 * Context Compiler Tests
 */

const assert = require('assert');
const { ContextCompiler } = require('./context_compiler');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

const mockEventRuntime = {
  getCorrelationGroup: async (correlationId, limit) => {
    return {
      correlation_id: correlationId,
      events: [
        {
          event_id: 'evt_001',
          event_type: 'LEAD_CREATED',
          source: 'webhook',
          timestamp: '2026-09-17T12:00:00Z',
          payload: {
            lead_id: 'lead_001',
            customer_id: 'cust_001',
            customerEmail: 'jane@example.com',
          },
          metadata: {
            authority: 'customer-authority',
          },
        },
        {
          event_id: 'evt_002',
          event_type: 'CUSTOMER_CREATED',
          source: 'customer-authority',
          timestamp: '2026-09-17T12:01:00Z',
          payload: {
            customer_id: 'cust_001',
            customerId: 'cust_001',
          },
          metadata: {},
        },
      ],
    };
  },
};

const compiler = new ContextCompiler({
  eventRuntime: mockEventRuntime,
});

async function main() {
  console.log('=== Context Compiler Tests ===');

  test('compile requires missionId', async () => {
    try {
      await compiler.compile({ query: 'test' });
      failed++;
      console.log('  FAIL compile requires missionId: should have thrown');
    } catch (e) {
      if (e.message.includes('missionId is required')) {
        passed++;
        console.log('  PASS compile requires missionId');
      } else {
        failed++;
        console.log('  FAIL compile requires missionId: ' + e.message);
      }
    }
  });

  test('compile requires query', async () => {
    try {
      await compiler.compile({ missionId: 'mission_001' });
      failed++;
      console.log('  FAIL compile requires query: should have thrown');
    } catch (e) {
      if (e.message.includes('query is required')) {
        passed++;
        console.log('  PASS compile requires query');
      } else {
        failed++;
        console.log('  FAIL compile requires query: ' + e.message);
      }
    }
  });

  test('compile produces ContextPack', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.strictEqual(typeof pack, 'object');
    assert.strictEqual(pack.mission_id, 'mission_001');
    assert.strictEqual(pack.query, 'Follow up on lead');
    assert.ok(pack.context_pack_id);
    console.log('  PASS compile produces ContextPack');
  });

  test('context_pack_id is deterministic', async () => {
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    const pack2 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.strictEqual(pack1.context_pack_id, pack2.context_pack_id);
    console.log('  PASS context_pack_id is deterministic');
  });

  test('context_pack_id changes with query', async () => {
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    const pack2 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Different query',
      correlationId: 'corr_001',
    });
    assert.notStrictEqual(pack1.context_pack_id, pack2.context_pack_id);
    console.log('  PASS context_pack_id changes with query');
  });

  test('extracts canonical object refs', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.ok(pack.canonical_object_refs.includes('customer:cust_001'));
    assert.ok(pack.canonical_object_refs.includes('lead:lead_001'));
    console.log('  PASS extracts canonical object refs');
  });

  test('extracts evidence refs', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.ok(pack.evidence_refs.includes('evt_001'));
    assert.ok(pack.evidence_refs.includes('evt_002'));
    console.log('  PASS extracts evidence refs');
  });

  test('builds source metadata', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.ok(pack.source_metadata.sources.includes('webhook'));
    assert.ok(pack.source_metadata.sources.includes('customer-authority'));
    assert.strictEqual(pack.source_metadata.event_count, 2);
    console.log('  PASS builds source metadata');
  });

  test('builds retrieval manifest with hash', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.ok(pack.retrieval_manifest.hash);
    assert.strictEqual(pack.retrieval_manifest.inputs.mission_id, 'mission_001');
    assert.strictEqual(pack.retrieval_manifest.inputs.query, 'Follow up on lead');
    console.log('  PASS builds retrieval manifest with hash');
  });

  test('compilation timestamp uses constitutional time', async () => {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
    });
    assert.ok(pack.compiled_at);
    assert.ok(new Date(pack.compiled_at).toISOString() === pack.compiled_at);
    console.log('  PASS compilation timestamp uses constitutional time');
  });

  test('health returns dependency status', async () => {
    const health = await compiler.health();
    assert.strictEqual(health.healthy, true);
    assert.strictEqual(health.eventRuntime, true);
    assert.strictEqual(health.knowledgeGraph, false);
    console.log('  PASS health returns dependency status');
  });

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
