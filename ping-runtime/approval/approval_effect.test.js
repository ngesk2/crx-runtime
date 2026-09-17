/**
 * Approval + Effect Identity Tests
 */

const assert = require('assert');
const { BusinessActionAuthority } = require('./business_action_authority');
const { EffectAuthority } = require('./effect_authority');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

async function main() {
  console.log('=== Approval + Effect Identity Tests ===');

  const actionAuthority = new BusinessActionAuthority();
  const effectAuthority = new EffectAuthority();

  test('generateActionId is deterministic', () => {
    const id1 = actionAuthority.generateActionId({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
    });
    const id2 = actionAuthority.generateActionId({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
    });
    assert.strictEqual(id1, id2);
  });

  test('generateActionId changes with capability', () => {
    const id1 = actionAuthority.generateActionId({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
    });
    const id2 = actionAuthority.generateActionId({
      missionId: 'mission_001',
      capability: 'sms.send',
      targetIdentity: 'customer:cust_001',
    });
    assert.notStrictEqual(id1, id2);
  });

  test('proposeAction creates pending action', async () => {
    const action = await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
      evidence: ['evt_001'],
      risk: 'low',
    });
    assert.strictEqual(action.status, 'PENDING_HUMAN');
    assert.ok(action.action_id);
    assert.strictEqual(action.capability, 'email.send');
  });

  test('approveAction changes status to APPROVED', async () => {
    const action = await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
    });
    const approved = await actionAuthority.approveAction(action.action_id, 'user_001');
    assert.strictEqual(approved.status, 'APPROVED');
    assert.strictEqual(approved.decided_by, 'user_001');
  });

  test('rejectAction changes status to REJECTED', async () => {
    const action = await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
    });
    const rejected = await actionAuthority.rejectAction(action.action_id, 'user_001');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.decided_by, 'user_001');
  });

  test('approveAction fails for non-pending action', async () => {
    const action = await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
    });
    await actionAuthority.approveAction(action.action_id, 'user_001');
    try {
      await actionAuthority.approveAction(action.action_id, 'user_001');
      failed++;
      console.log('  FAIL approveAction fails for non-pending action: should have thrown');
    } catch (e) {
      if (e.message.includes('not pending')) {
        passed++;
        console.log('  PASS approveAction fails for non-pending action');
      } else {
        failed++;
        console.log('  FAIL approveAction fails for non-pending action: ' + e.message);
      }
    }
  });

  test('listPendingActions returns only pending', async () => {
    await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
    });
    const action2 = await actionAuthority.proposeAction({
      missionId: 'mission_002',
      capability: 'sms.send',
      targetIdentity: 'customer:cust_002',
      preview: { text: 'Message...' },
      reason: 'Reminder',
    });
    await actionAuthority.approveAction(action2.action_id, 'user_001');
    const pending = await actionAuthority.listPendingActions();
    assert.strictEqual(pending.length, 1);
  });

  test('generateEffectId is deterministic', () => {
    const id1 = effectAuthority.generateEffectId({
      eventType: 'EMAIL_SENT',
      aggregateId: 'customer:cust_001',
      actionType: 'send',
    });
    const id2 = effectAuthority.generateEffectId({
      eventType: 'EMAIL_SENT',
      aggregateId: 'customer:cust_001',
      actionType: 'send',
    });
    assert.strictEqual(id1, id2);
  });

  test('generateEffectId changes with aggregateId', () => {
    const id1 = effectAuthority.generateEffectId({
      eventType: 'EMAIL_SENT',
      aggregateId: 'customer:cust_001',
      actionType: 'send',
    });
    const id2 = effectAuthority.generateEffectId({
      eventType: 'EMAIL_SENT',
      aggregateId: 'customer:cust_002',
      actionType: 'send',
    });
    assert.notStrictEqual(id1, id2);
  });

  test('createEffect creates authorized effect', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    assert.strictEqual(effect.status, 'AUTHORIZED');
    assert.ok(effect.effect_id);
    assert.strictEqual(effect.capability, 'email.send');
  });

  test('isEffectCompleted returns false for new effect', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    const completed = await effectAuthority.isEffectCompleted(effect.effect_id);
    assert.strictEqual(completed, false);
  });

  test('markExecuting changes status to EXECUTING', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    const executing = await effectAuthority.markExecuting(effect.effect_id, 'req_001');
    assert.strictEqual(executing.status, 'EXECUTING');
    assert.strictEqual(executing.provider_request_id, 'req_001');
  });

  test('markSucceeded changes status to SUCCEEDED', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    await effectAuthority.markExecuting(effect.effect_id, 'req_001');
    const succeeded = await effectAuthority.markSucceeded(effect.effect_id, { sent: true });
    assert.strictEqual(succeeded.status, 'SUCCEEDED');
    assert.ok(succeeded.result);
  });

  test('markFailed changes status to FAILED', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    await effectAuthority.markExecuting(effect.effect_id, 'req_001');
    const failed = await effectAuthority.markFailed(effect.effect_id, 'Provider error');
    assert.strictEqual(failed.status, 'FAILED');
    assert.strictEqual(failed.error, 'Provider error');
  });

  test('isEffectCompleted returns true for succeeded effect', async () => {
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action_001',
      approvalId: 'approval_001',
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    await effectAuthority.markExecuting(effect.effect_id, 'req_001');
    await effectAuthority.markSucceeded(effect.effect_id, { sent: true });
    const completed = await effectAuthority.isEffectCompleted(effect.effect_id);
    assert.strictEqual(completed, true);
  });

  test('approval + effect integration flow', async () => {
    const action = await actionAuthority.proposeAction({
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      preview: { draft: 'Hi Jane...' },
      reason: 'Follow up on lead',
    });

    const approved = await actionAuthority.approveAction(action.action_id, 'user_001');
    assert.strictEqual(approved.status, 'APPROVED');

    const effect = await effectAuthority.createEffect({
      proposedActionId: action.action_id,
      approvalId: approved.action_id,
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });

    const effect2 = await effectAuthority.createEffect({
      proposedActionId: action.action_id,
      approvalId: approved.action_id,
      missionId: 'mission_001',
      capability: 'email.send',
      targetIdentity: 'customer:cust_001',
      provider: 'gmail',
    });
    assert.strictEqual(effect.effect_id, effect2.effect_id);

    await effectAuthority.markExecuting(effect.effect_id, 'req_001');
    await effectAuthority.markSucceeded(effect.effect_id, { sent: true });

    const completed = await effectAuthority.isEffectCompleted(effect.effect_id);
    assert.strictEqual(completed, true);
  });

  test('BusinessActionAuthority health', async () => {
    const health = await actionAuthority.health();
    assert.strictEqual(health.healthy, true);
    assert.strictEqual(health.storage, false);
  });

  test('EffectAuthority health', async () => {
    const health = await effectAuthority.health();
    assert.strictEqual(health.healthy, true);
    assert.strictEqual(health.storage, false);
  });

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
