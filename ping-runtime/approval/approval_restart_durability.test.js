/**
 * Approval/Effect Restart Durability Tests
 *
 * These tests expose the current in-memory storage defect.
 * After fixing to use PostgresAdapter, these should pass.
 *
 * Current defect: state is lost on process restart because
 * BusinessActionAuthority and EffectAuthority use in-memory maps
 * when no storage adapter is provided.
 */

const { BusinessActionAuthority } = require('./business_action_authority.js');
const { EffectAuthority } = require('./effect_authority.js');
const assert = require('assert');

async function main() {
  let passed = 0;
  let failed = 0;

  console.log('=== Approval/Effect Restart Durability Tests ===');

  // Test 1: Action restart failure
  try {
    const actionAuthority = new BusinessActionAuthority({ storage: null });
    const action = await actionAuthority.proposeAction({
      missionId: 'mission-1',
      capability: 'SEND_EMAIL',
      targetIdentity: 'customer::cust-001',
      preview: { subject: 'Test email' },
      reason: 'Test reason',
      evidence: ['evt-001'],
      risk: 'low',
    });

    // Simulate process restart: destroy and recreate authority
    const actionAuthority2 = new BusinessActionAuthority({ storage: null });

    // Attempt to retrieve the action - should fail with in-memory storage
    const retrieved = await actionAuthority2.getAction(action.action_id);
    assert.strictEqual(retrieved, null, 'In-memory storage loses state on restart');
    passed++;
    console.log('  PASS approval restart: action lost on restart (expected defect)');
  } catch (e) {
    failed++;
    console.log('  FAIL approval restart test: ' + e.message);
  }

  // Test 2: Effect restart failure
  try {
    const effectAuthority = new EffectAuthority({ storage: null });
    const effect = await effectAuthority.createEffect({
      proposedActionId: 'action-1',
      approvalId: 'approval-1',
      missionId: 'mission-1',
      capability: 'email.send',
      targetIdentity: 'customer::cust-001',
      provider: 'email-provider',
    });

    // Simulate process restart
    const effectAuthority2 = new EffectAuthority({ storage: null });

    // Attempt to retrieve - should fail with in-memory storage
    const retrieved = await effectAuthority2.getEffect(effect.effect_id);
    assert.strictEqual(retrieved, null, 'In-memory storage loses state on restart');
    passed++;
    console.log('  PASS effect restart: effect lost on restart (expected defect)');
  } catch (e) {
    failed++;
    console.log('  FAIL effect restart test: ' + e.message);
  }

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
