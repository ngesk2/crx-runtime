/**
 * Temporal Integration Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  PASS ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + ': ' + e.message); }
}

async function main() {
  console.log('=== Temporal Integration Tests ===');

  test('workflow file exists', () => {
    const workflowPath = path.join(__dirname, 'workflows/mission_workflow.js');
    assert.strictEqual(fs.existsSync(workflowPath), true);
  });

  test('activity file exists', () => {
    const activityPath = path.join(__dirname, 'activities/mission_activities.js');
    assert.strictEqual(fs.existsSync(activityPath), true);
  });

  test('index file exists', () => {
    const indexPath = path.join(__dirname, 'index.js');
    assert.strictEqual(fs.existsSync(indexPath), true);
  });

  test('activities export executeWorkOrder', () => {
    const { executeWorkOrder } = require('./activities/mission_activities');
    assert.strictEqual(typeof executeWorkOrder, 'function');
  });

  test('activities export recordMissionOutcome', () => {
    const { recordMissionOutcome } = require('./activities/mission_activities');
    assert.strictEqual(typeof recordMissionOutcome, 'function');
  });

  test('executeWorkOrder stub returns expected structure', async () => {
    const { executeWorkOrder } = require('./activities/mission_activities');
    const result = await executeWorkOrder({
      missionId: 'mission_001',
      capability: 'text.summarize',
      input: {},
      constraints: { read_only: true },
      externalAgentId: 'hermes',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.requiresApproval, false);
    assert.ok(result.outcome);
  });

  test('executeWorkOrder stub requires approval for email.send', async () => {
    const { executeWorkOrder } = require('./activities/mission_activities');
    const result = await executeWorkOrder({
      missionId: 'mission_001',
      capability: 'email.send',
      input: {},
      constraints: { read_only: true },
      externalAgentId: 'hermes',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.requiresApproval, true);
  });

  test('executeWorkOrder stub requires approval for sms.send', async () => {
    const { executeWorkOrder } = require('./activities/mission_activities');
    const result = await executeWorkOrder({
      missionId: 'mission_001',
      capability: 'sms.send',
      input: {},
      constraints: { read_only: true },
      externalAgentId: 'hermes',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.requiresApproval, true);
  });

  test('recordMissionOutcome stub returns expected structure', async () => {
    const { recordMissionOutcome } = require('./activities/mission_activities');
    const result = await recordMissionOutcome({
      missionId: 'mission_001',
      status: 'completed',
      outcome: {},
      approval: null,
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.recorded, true);
  });

  test('workflow file contains missionExecution function', () => {
    const workflowPath = path.join(__dirname, 'workflows/mission_workflow.js');
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('missionExecution'));
    assert.ok(content.includes('approvalSignal'));
    assert.ok(content.includes('approvalStatusQuery'));
  });

  test('index file exports expected structure', () => {
    const indexPath = path.join(__dirname, 'index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    assert.ok(content.includes('missionExecution'));
    assert.ok(content.includes('executeWorkOrder'));
    assert.ok(content.includes('recordMissionOutcome'));
  });

  console.log('');
  console.log(passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
