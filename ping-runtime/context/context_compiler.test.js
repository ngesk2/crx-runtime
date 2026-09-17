/**
 * Context Compiler Tests
 */

const assert = require('assert');
const { ContextCompiler } = require('./context_compiler');

let passed = 0, failed = 0;

const mockEventRuntime = {
  getCorrelationGroup: async (correlationId, limit) => {
    return {
      status: 'ok',
      correlation_id: correlationId,
      events: [
        {
          event_id: 'evt_001',
          event_type: 'LEAD_CREATED',
          source: 'webhook',
          namespace: 'core::owner',
          timestamp: '2026-09-17T12:00:00Z',
          payload: {
            lead_id: 'lead_001',
            customer_id: 'cust_001',
            customerEmail: 'jane@example.com',
          },
          metadata: {
            authority: 'customer-authority',
            namespace: 'core::owner',
            correlation_id: 'corr_001',
            causation_id: null,
          },
        },
        {
          event_id: 'evt_002',
          event_type: 'CUSTOMER_CREATED',
          source: 'customer-authority',
          namespace: 'core::owner',
          timestamp: '2026-09-17T12:01:00Z',
          payload: {
            customer_id: 'cust_001',
            customerId: 'cust_001',
          },
          metadata: {
            namespace: 'core::owner',
            correlation_id: 'corr_001',
            causation_id: 'evt_001',
          },
        },
      ],
    };
  },
};

function createCompiler(eventRuntime) {
  return new ContextCompiler({
    eventRuntime,
    evidenceAuthority: {
      async accumulate(ids) {
        const group = await eventRuntime.getCorrelationGroup(null, 101, null);
        return group.events.filter(event => ids.includes(event.event_id));
      },
    },
  });
}

const compiler = createCompiler(mockEventRuntime);

async function main() {
  console.log('=== Context Compiler Tests ===');

  try {
    await assert.rejects(
      async () => await compiler.compile({ query: 'test' }),
      /missionId is required/
    );
    passed++;
    console.log('  PASS compile requires missionId');
  } catch (e) {
    failed++;
    console.log('  FAIL compile requires missionId: ' + e.message);
  }

  try {
    await assert.rejects(
      async () => await compiler.compile({ missionId: 'mission_001' }),
      /query is required/
    );
    passed++;
    console.log('  PASS compile requires query');
  } catch (e) {
    failed++;
    console.log('  FAIL compile requires query: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.strictEqual(typeof pack, 'object');
    assert.strictEqual(pack.mission_id, 'mission_001');
    assert.strictEqual(pack.query, 'Follow up on lead');
    assert.ok(pack.context_pack_id);
    passed++;
    console.log('  PASS compile produces ContextPack');
  } catch (e) {
    failed++;
    console.log('  FAIL compile produces ContextPack: ' + e.message);
  }

  try {
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const pack2 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.strictEqual(pack1.context_pack_id, pack2.context_pack_id);
    passed++;
    console.log('  PASS context_pack_id is deterministic');
  } catch (e) {
    failed++;
    console.log('  FAIL context_pack_id is deterministic: ' + e.message);
  }

  try {
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const pack2 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Different query',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.notStrictEqual(pack1.context_pack_id, pack2.context_pack_id);
    passed++;
    console.log('  PASS context_pack_id changes with query');
  } catch (e) {
    failed++;
    console.log('  FAIL context_pack_id changes with query: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.ok(pack.canonical_object_refs.includes('customer:cust_001'));
    assert.ok(pack.canonical_object_refs.includes('lead:lead_001'));
    passed++;
    console.log('  PASS extracts canonical object refs');
  } catch (e) {
    failed++;
    console.log('  FAIL extracts canonical object refs: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.ok(pack.evidence_refs.includes('evt_001'));
    assert.ok(pack.evidence_refs.includes('evt_002'));
    passed++;
    console.log('  PASS extracts evidence refs');
  } catch (e) {
    failed++;
    console.log('  FAIL extracts evidence refs: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.ok(pack.source_metadata.sources.includes('webhook'));
    assert.ok(pack.source_metadata.sources.includes('customer-authority'));
    assert.strictEqual(pack.source_metadata.event_count, 2);
    passed++;
    console.log('  PASS builds source metadata');
  } catch (e) {
    failed++;
    console.log('  FAIL builds source metadata: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.ok(pack.retrieval_manifest.hash);
    assert.strictEqual(pack.retrieval_manifest.inputs.mission_id, 'mission_001');
    assert.strictEqual(pack.retrieval_manifest.inputs.query, 'Follow up on lead');
    passed++;
    console.log('  PASS builds retrieval manifest with hash');
  } catch (e) {
    failed++;
    console.log('  FAIL builds retrieval manifest with hash: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.ok(pack.compiled_at);
    assert.ok(new Date(pack.compiled_at).toISOString() === pack.compiled_at);
    passed++;
    console.log('  PASS compilation timestamp uses constitutional time');
  } catch (e) {
    failed++;
    console.log('  FAIL compilation timestamp uses constitutional time: ' + e.message);
  }

  try {
    const health = await compiler.health();
    assert.strictEqual(health.healthy, true);
    assert.strictEqual(health.eventRuntime, true);
    assert.strictEqual(health.knowledgeGraph, false);
    passed++;
    console.log('  PASS health returns dependency status');
  } catch (e) {
    failed++;
    console.log('  FAIL health returns dependency status: ' + e.message);
  }

  try {
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const pack2 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    assert.strictEqual(pack1.context_pack_id, pack2.context_pack_id);
    passed++;
    console.log('  PASS same canonical inputs produce same identity');
  } catch (e) {
    failed++;
    console.log('  FAIL same canonical inputs produce same identity: ' + e.message);
  }

  try {
    const mockEventRuntime2 = {
      getCorrelationGroup: async (correlationId, limit) => {
        return {
          status: 'ok',
          correlation_id: correlationId,
          events: [
            {
              event_id: 'evt_003',
              event_type: 'LEAD_CREATED',
              source: 'webhook',
              namespace: 'core::owner',
              timestamp: '2026-09-17T12:00:00Z',
              payload: {
                lead_id: 'lead_002',
                customer_id: 'cust_002',
              },
              metadata: {
                namespace: 'core::owner',
                correlation_id: 'corr_002',
                causation_id: null,
              },
            },
          ],
        };
      },
    };
    const compiler2 = createCompiler(mockEventRuntime2);
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const pack2 = await compiler2.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_002',
      namespace: 'core::owner',
    });
    assert.notStrictEqual(pack1.context_pack_id, pack2.context_pack_id);
    passed++;
    console.log('  PASS different evidence produces different identity');
  } catch (e) {
    failed++;
    console.log('  FAIL different evidence produces different identity: ' + e.message);
  }

  // REGRESSION: Event permutation determinism
  // This test FAILS currently and exposes a real determinism defect.
  // Same events in different input order produce different ContextPack identities.
  // DO NOT DELETE. Fix the implementation to make this pass.
  try {
    const mockEventRuntime2 = {
      getCorrelationGroup: async (correlationId, limit) => {
        return {
          status: 'ok',
          correlation_id: correlationId,
          events: [
            {
              event_id: 'evt_002',
              event_type: 'CUSTOMER_CREATED',
              source: 'customer-authority',
              namespace: 'core::owner',
              timestamp: '2026-09-17T12:01:00Z',
              payload: {
                customer_id: 'cust_001',
                customerId: 'cust_001',
              },
              metadata: {
                namespace: 'core::owner',
                correlation_id: 'corr_001',
                causation_id: 'evt_001',
              },
            },
            {
              event_id: 'evt_001',
              event_type: 'LEAD_CREATED',
              source: 'webhook',
              namespace: 'core::owner',
              timestamp: '2026-09-17T12:00:00Z',
              payload: {
                lead_id: 'lead_001',
                customer_id: 'cust_001',
                customerEmail: 'jane@example.com',
              },
              metadata: {
                authority: 'customer-authority',
                namespace: 'core::owner',
                correlation_id: 'corr_001',
                causation_id: null,
              },
            },
          ],
        };
      },
    };
    const compiler2 = createCompiler(mockEventRuntime2);
    const pack1 = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const pack2 = await compiler2.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    // Same events, different input order MUST produce same identity
    assert.strictEqual(pack1.context_pack_id, pack2.context_pack_id);
    passed++;
    console.log('  PASS event permutation produces same identity');
  } catch (e) {
    failed++;
    console.log('  FAIL event permutation produces same identity: ' + e.message);
  }

  try {
    const pack = await compiler.compile({
      missionId: 'mission_001',
      query: 'Follow up on lead',
      correlationId: 'corr_001',
      namespace: 'core::owner',
    });
    const customerRefs = pack.canonical_object_refs.filter(r => r.startsWith('customer:'));
    assert.strictEqual(customerRefs.length, 1);
    assert.strictEqual(customerRefs[0], 'customer:cust_001');
    passed++;
    console.log('  PASS duplicate references are canonical deduplicated');
  } catch (e) {
    failed++;
    console.log('  FAIL duplicate references are canonical deduplicated: ' + e.message);
  }

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
