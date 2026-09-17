'use strict';

const assert = require('assert');
const { test } = require('node:test');
const { ContextIntegration } = require('./context_integration');
const externalAgentAdapter = require('../external-agent/external_agent_adapter');

const BASE = {
  agentId: 'hermes',
  capability: 'text.transform',
  namespace: 'core::owner',
  taskId: 'task-context-001',
  missionId: 'mission-context-001',
  correlationId: 'corr-context-001',
  contextPackId: 'ctx_authorized_001',
  input: { text: 'abc' },
  constraints: {
    read_only: true,
    no_writes: true,
    no_network: true,
    no_canonical_events: true,
    no_mission_state_writes: true,
    allowed_workspace: 'test.context-binding',
    allowed_toolsets: ['default'],
  },
  resultPath: '/results/context-001.json',
  deadline: '2099-09-17T03:00:00Z',
};

function completedResult(workOrder, contextPackId = workOrder.context_pack_id) {
  return {
    work_order_id: workOrder.work_order_id,
    context_pack_id: contextPackId,
    agent_id: workOrder.agent_id,
    capability: workOrder.capability,
    status: 'completed',
    output: 'ABC',
    evidence: { duration_ms: 1 },
    error: null,
  };
}

const VERIFY = {
  invokedAgentId: 'hermes',
  verifiedAt: '2099-09-17T02:59:59Z',
};

test('WorkOrder requires and binds the authorized ContextPack identity', () => {
  const workOrder = externalAgentAdapter.issueWorkOrder(BASE);
  assert.strictEqual(workOrder.context_pack_id, BASE.contextPackId);
  assert.throws(
    () => externalAgentAdapter.issueWorkOrder({ ...BASE, contextPackId: undefined }),
    /contextPackId must be a non-empty string/
  );
});

test('ResultEnvelope must echo the exact authorized ContextPack identity', () => {
  const workOrder = externalAgentAdapter.issueWorkOrder(BASE);
  const accepted = externalAgentAdapter.verifyResultEnvelope(
    completedResult(workOrder),
    workOrder,
    VERIFY
  );
  const substituted = externalAgentAdapter.verifyResultEnvelope(
    completedResult(workOrder, 'ctx_substituted'),
    workOrder,
    VERIFY
  );
  const missing = completedResult(workOrder);
  delete missing.context_pack_id;

  assert.strictEqual(accepted.valid, true);
  assert.strictEqual(substituted.valid, false);
  assert.match(substituted.reason, /context_pack_id mismatch/);
  assert.strictEqual(
    externalAgentAdapter.verifyResultEnvelope(missing, workOrder, VERIFY).valid,
    false
  );
});

test('result identity is bound to ContextPack identity', () => {
  const first = externalAgentAdapter.issueWorkOrder(BASE);
  const second = externalAgentAdapter.issueWorkOrder({
    ...BASE,
    contextPackId: 'ctx_authorized_002',
  });

  assert.notStrictEqual(
    externalAgentAdapter.resultIdentity(completedResult(first), first),
    externalAgentAdapter.resultIdentity(completedResult(second), second)
  );
});

test('canonical worker outcome retains the verified ContextPack binding', async () => {
  const workOrder = externalAgentAdapter.issueWorkOrder(BASE);
  const emitted = [];
  const result = await externalAgentAdapter.recordVerifiedResult({
    eventRuntime: {
      async emit(eventType, source, payload, options) {
        emitted.push({ eventType, source, payload, options });
        return { status: 'ok', eventId: 'evt_result_001', deduplicated: false };
      },
    },
    result: completedResult(workOrder),
    workOrder,
    ...VERIFY,
  });

  assert.strictEqual(result.valid, true);
  assert.strictEqual(emitted[0].payload.context_pack_id, BASE.contextPackId);
  assert.strictEqual(emitted[0].options.metadata.context_pack_id, BASE.contextPackId);
});

test('ContextIntegration binds compiled context at the WorkOrder boundary', async () => {
  const integration = new ContextIntegration({
    contextCompiler: {
      async compile() {
        return {
          context_pack_id: 'ctx_compiled_001',
          canonical_object_refs: ['lead:lead_001'],
          artifact_refs: [],
          evidence_refs: ['evt_a'],
          relationship_refs: [],
        };
      },
    },
    externalAgentAdapter,
  });

  const workOrder = await integration.issueWorkOrderWithContext({
    missionId: BASE.missionId,
    query: 'Follow up',
    correlationId: BASE.correlationId,
    workOrderParams: { ...BASE, contextPackId: 'ctx_caller_override' },
  });

  assert.strictEqual(workOrder.context_pack_id, 'ctx_compiled_001');
  assert.strictEqual(workOrder.input.context_pack_id, 'ctx_compiled_001');
  assert.deepStrictEqual(workOrder.input.context_refs.evidence, ['evt_a']);
});

test('JSON schemas require ContextPack identity on both envelopes', () => {
  const workOrderSchema = require('../external-agent/WORKORDER_SCHEMA.json');
  const resultSchema = require('../external-agent/RESULT_SCHEMA.json');

  assert(workOrderSchema.required.includes('context_pack_id'));
  assert(resultSchema.required.includes('context_pack_id'));
  assert.strictEqual(workOrderSchema.properties.context_pack_id.type, 'string');
  assert.strictEqual(resultSchema.properties.context_pack_id.type, 'string');
});
