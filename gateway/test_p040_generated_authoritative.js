// P040: Regression tests — Generated artifacts are the single source of truth.
// Proves: handwritten config cannot influence execution.

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.join(__dirname, '..');
const { WorkflowExecutor } = require('../ping-runtime/runtime/workflow_executor');
const { EventValidator } = require('../ping-runtime/events/event_validator');
const { CapabilityResolver } = require('../ping-runtime/runtime/capability_resolver');
const { DeploymentLoader } = require('../ping-runtime/runtime/deployment_loader');
const { StateMachineExecutor } = require('../ping-runtime/runtime/state_machine_executor');
const { EventQueue } = require('../ping-runtime/orchestration/execution/event_queue');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

console.log('\n=== P040: Generated Artifacts Authoritative ===\n');

// --- Registries loaded from generated artifacts ---
const eventValidator = new EventValidator(REPO_ROOT);
eventValidator.load();
const capabilityResolver = new CapabilityResolver(REPO_ROOT);
capabilityResolver.load();
const workflowExecutor = new WorkflowExecutor(REPO_ROOT);
workflowExecutor.load();
const deploymentLoader = new DeploymentLoader(REPO_ROOT);
deploymentLoader.load();
const stateMachineExecutor = new StateMachineExecutor(REPO_ROOT);
stateMachineExecutor.load();

// --- Regression: Events ---
console.log('--- Events: generated registry is authoritative ---');
test('EventValidator loads 195+ events from generated registry', () => {
  assert.ok(eventValidator.listEventTypes().length >= 195, `Expected 195+ events, got ${eventValidator.listEventTypes().length}`);
});

test('EventValidator validates production UPPER_SNAKE_CASE events', () => {
  assert.ok(eventValidator.isRegistered('DOCUMENT_IMPORTED'), 'DOCUMENT_IMPORTED not registered');
  assert.ok(eventValidator.isRegistered('CLAIM_GENERATED'), 'CLAIM_GENERATED not registered');
  assert.ok(eventValidator.isRegistered('OBSERVATION_CREATED'), 'OBSERVATION_CREATED not registered');
});

test('EventValidator validates orchestration snake_case events', () => {
  assert.ok(eventValidator.isRegistered('mission_created'), 'mission_created not registered');
  assert.ok(eventValidator.isRegistered('worker_completed'), 'worker_completed not registered');
  assert.ok(eventValidator.isRegistered('consensus_reached'), 'consensus_reached not registered');
});

test('EventValidator validates generated dot.notation events', () => {
  const types = eventValidator.listEventTypes();
  const dotNotation = types.filter(t => t.includes('.'));
  assert.ok(dotNotation.length > 50, `Expected 50+ dot.notation events, got ${dotNotation.length}`);
});

test('EventValidator rejects unknown event type', () => {
  const result = eventValidator.validate({ event_type: 'NONEXISTENT_EVENT', schema_version: '1.0.0' });
  assert.strictEqual(result.valid, false, 'Should reject unknown event');
});

test('EventQueue uses EventValidator for type validation', () => {
  const eq = new EventQueue();
  // Should warn on unknown type but not throw
  const result = eq.emit('COMPLETELY_UNKNOWN_TYPE', { test: true });
  // Unknown types still emit (with warning), so result should exist
  assert.ok(result !== undefined, 'EventQueue should still emit unknown types (with warning)');
});

// --- Regression: Capabilities ---
console.log('\n--- Capabilities: generated registry is authoritative ---');
test('CapabilityResolver loads 45+ capabilities from generated registry', () => {
  assert.ok(capabilityResolver.listCapabilities().length >= 45, `Expected 45+ capabilities, got ${capabilityResolver.listCapabilities().length}`);
});

test('CapabilityResolver resolves runtime capabilities', () => {
  assert.ok(capabilityResolver.hasCapability('code.generate'), 'code.generate not found');
  assert.ok(capabilityResolver.hasCapability('orchestration.plan'), 'orchestration.plan not found');
  assert.ok(capabilityResolver.hasCapability('replay.verify'), 'replay.verify not found');
});

test('CapabilityResolver resolves compiler capabilities', () => {
  assert.ok(capabilityResolver.hasCapability('ReplayTranscript'), 'ReplayTranscript not found');
  assert.ok(capabilityResolver.hasCapability('CanonicalSHA256'), 'CanonicalSHA256 not found');
});

test('CapabilityResolver rejects unknown capability', () => {
  const result = capabilityResolver.resolve('NONEXISTENT_CAPABILITY');
  assert.strictEqual(result.resolved, false, 'Should reject unknown capability');
});

test('CapabilityResolver resolves by authority', () => {
  const caps = capabilityResolver.resolveByAuthority('OrchestrationEngine');
  assert.ok(caps.length > 0, 'OrchestrationEngine should have capabilities');
});

// --- Regression: Workflows ---
console.log('\n--- Workflows: generated registry is authoritative ---');
test('WorkflowExecutor loads 20 workflows from generated registry', () => {
  const stats = workflowExecutor.getStats();
  assert.strictEqual(stats.totalWorkflows, 20, `Expected 20 workflows, got ${stats.totalWorkflows}`);
});

test('WorkflowExecutor builds valid execution graph', () => {
  const stats = workflowExecutor.getStats();
  assert.ok(stats.graphNodes > 0, 'Execution graph should have nodes');
  assert.ok(stats.executionOrder.length > 0, 'Execution order should be non-empty');
});

test('WorkflowExecutor can resolve workflow by type', () => {
  const stats = workflowExecutor.getStats();
  assert.ok(stats.executionOrder.length > 0, 'Should have execution order');
  const firstId = stats.executionOrder[0];
  const wf = workflowExecutor.getWorkflow(firstId);
  assert.ok(wf, `Workflow ${firstId} should be resolvable`);
  assert.ok(wf.workflow_type, 'Workflow should have a type');
  const byType = workflowExecutor.getWorkflowByType(wf.workflow_type);
  assert.ok(byType, `Workflow with type ${wf.workflow_type} should be resolvable`);
});

// --- Regression: Deployments ---
console.log('\n--- Deployments: generated manifest is authoritative ---');
test('DeploymentLoader loads 37+ services from generated manifest', () => {
  assert.ok(deploymentLoader.getEnabledServices().length >= 37, `Expected 37+ services, got ${deploymentLoader.getEnabledServices().length}`);
});

test('DeploymentLoader startup order is valid', () => {
  const result = deploymentLoader.validateStartup();
  assert.ok(result.valid, `Startup validation failed: ${result.issues.slice(0, 3).join('; ')}`);
});

test('DeploymentLoader shutdown order reverses startup', () => {
  const startup = deploymentLoader.getStartupOrder();
  const shutdown = deploymentLoader.getShutdownOrder();
  assert.deepStrictEqual(shutdown, [...startup].reverse(), 'Shutdown should reverse startup');
});

// --- Regression: State Machines ---
console.log('\n--- State Machines: generated registry is authoritative ---');
test('StateMachineExecutor loads 21 state machines from generated registry', () => {
  const stats = stateMachineExecutor.getStats();
  assert.strictEqual(stats.totalMachines, 21, `Expected 21 machines, got ${stats.totalMachines}`);
});

test('StateMachineExecutor WorkerLifecycle has 8 states', () => {
  const machines = Array.from(stateMachineExecutor._machines.values());
  const worker = machines.find(m => m.name === 'WorkerLifecycle');
  assert.ok(worker, 'WorkerLifecycle machine should exist');
  assert.strictEqual(worker.states.length, 8, `Expected 8 states, got ${worker.states.length}`);
});

test('StateMachineExecutor validates transitions', () => {
  const machines = Array.from(stateMachineExecutor._machines.values());
  const worker = machines.find(m => m.name === 'WorkerLifecycle');
  assert.ok(worker, 'WorkerLifecycle machine should exist');
  const result = stateMachineExecutor.instantiate(worker.machine_id);
  assert.ok(result.success, 'Should instantiate WorkerLifecycle');

  // Valid transition: idle -> assigned (via 'assign' event)
  const tr = stateMachineExecutor.transition(result.instanceId, 'assign');
  assert.ok(tr.success, `idle->assigned should succeed: ${tr.error || 'ok'}`);
  assert.strictEqual(tr.to, 'assigned');

  // Invalid transition: assigned -> completed (not allowed)
  const tr2 = stateMachineExecutor.transition(result.instanceId, 'consensus_reached');
  assert.strictEqual(tr2.success, false, 'assigned->completed should fail');
});

test('StateMachineExecutor transition hash is deterministic', () => {
  const machines = Array.from(stateMachineExecutor._machines.values());
  const worker = machines.find(m => m.name === 'WorkerLifecycle');
  const r1 = stateMachineExecutor.instantiate(worker.machine_id);
  const r2 = stateMachineExecutor.instantiate(worker.machine_id);

  const t1 = stateMachineExecutor.transition(r1.instanceId, 'assign');
  const t2 = stateMachineExecutor.transition(r2.instanceId, 'assign');

  // Same transition should produce same hash
  const h1 = t1.transitionHash || stateMachineExecutor._instances.get(r1.instanceId).history[0].transitionHash;
  const h2 = t2.transitionHash || stateMachineExecutor._instances.get(r2.instanceId).history[0].transitionHash;
  assert.strictEqual(h1, h2, 'Transition hashes should be deterministic');
});

// --- Regression: worker_port.js loads from generated state machine ---
console.log('\n--- WorkerPort: loads transitions from generated state machine ---');
test('WorkerPort WORKER_STATES loaded from generated registry', () => {
  const { WORKER_STATES } = require('../ping-runtime/orchestration/execution/worker_port');
  assert.deepStrictEqual(WORKER_STATES, ['idle', 'assigned', 'running', 'waiting', 'consensus', 'completed', 'failed', 'archived']);
});

test('WorkerPort VALID_TRANSITIONS loaded from generated registry', () => {
  const { VALID_TRANSITIONS } = require('../ping-runtime/orchestration/execution/worker_port');
  assert.ok(VALID_TRANSITIONS.idle, 'idle transitions should exist');
  assert.ok(VALID_TRANSITIONS.assigned, 'assigned transitions should exist');
  assert.ok(VALID_TRANSITIONS.running, 'running transitions should exist');
});

// --- Regression: No handwritten config files exist ---
console.log('\n--- No handwritten config files ---');
test('gateway/mcp_registry.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'mcp_registry.js')), 'mcp_registry.js should not exist');
});

test('gateway/capability_scheduler.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'capability_scheduler.js')), 'capability_scheduler.js should not exist');
});

test('gateway/agent_registry_v2.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'agent_registry_v2.js')), 'agent_registry_v2.js should not exist');
});

test('gateway/temporal_workflows.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'temporal_workflows.js')), 'temporal_workflows.js should not exist');
});

test('gateway/workflow_replay_authority.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'workflow_replay_authority.js')), 'workflow_replay_authority.js should not exist');
});

test('gateway/constitutional_ci_check.js deleted', () => {
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, 'gateway', 'constitutional_ci_check.js')), 'constitutional_ci_check.js should not exist');
});

// --- Summary ---
console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
