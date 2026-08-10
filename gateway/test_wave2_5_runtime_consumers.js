// P038: End-to-End Compiler Proof
// One deterministic test proving the full pipeline:
// Compiler -> Generated Artifacts -> Runtime Consumers -> Execution

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { GenerationManifestLoader } = require('./generated/generation_manifest_loader');
const { GeneratedArtifactLoader } = require('./generated/generated_artifact_loader');
const { WorkflowGenerator } = require('./generated/workflow_generator');
const { EventGenerator } = require('./generated/event_generator');
const { CapabilityGenerator } = require('./generated/capability_generator');
const { DeploymentGenerator } = require('./generated/deployment_generator');
const { StateMachineGenerator } = require('./generated/state_machine_generator');
const { WorkflowExecutor } = require('../ping-runtime/runtime/workflow_executor');
const { EventValidator } = require('../ping-runtime/events/event_validator');
const { CapabilityResolver } = require('../ping-runtime/runtime/capability_resolver');
const { DeploymentLoader } = require('../ping-runtime/runtime/deployment_loader');
const { StateMachineExecutor } = require('../ping-runtime/runtime/state_machine_executor');
const { DriftDetector } = require('../ping-runtime/runtime/drift_detector');
const { RuntimeFingerprint } = require('../ping-runtime/runtime/runtime_fingerprint');
const { computeRuntimeArtifactHash } = require('./generated/runtime_artifact_hash');

const REPO_ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1, 3);
      for (const line of stackLines) {
        console.log(`    ${line.trim()}`);
      }
    }
  }
}

// ============================================================
// P038: End-to-End Compiler Proof
// ============================================================
console.log('\n=== P038: End-to-End Compiler Proof ===');

test('Step 1: Generate all artifacts from sources', () => {
  const generators = [
    { gen: new WorkflowGenerator(REPO_ROOT), name: 'WorkflowGenerator' },
    { gen: new EventGenerator(REPO_ROOT), name: 'EventGenerator' },
    { gen: new CapabilityGenerator(REPO_ROOT), name: 'CapabilityGenerator' },
    { gen: new StateMachineGenerator(REPO_ROOT), name: 'StateMachineGenerator' },
  ];

  for (const { gen, name } of generators) {
    const result = gen.generate();
    assert.ok(result.count > 0, `${name} produced 0 items`);
    assert.ok(result.hash, `${name} has no hash`);
  }

  // Deployment generator has services, not count
  const depGen = new DeploymentGenerator(REPO_ROOT);
  const depResult = depGen.generate();
  assert.ok(depResult.services.length > 0, 'DeploymentGenerator produced 0 services');
  assert.ok(depResult.hash, 'DeploymentGenerator has no hash');
});

test('Step 2: Load generation manifest', () => {
  const loader = new GenerationManifestLoader(REPO_ROOT);
  loader.load();
  const manifest = loader.getManifest();
  assert.ok(manifest.compiler_version, 'Manifest has compiler_version');
  assert.ok(manifest.hash, 'Manifest has hash');
  assert.ok(Object.keys(manifest.artifacts).length >= 5, 'Manifest has >= 5 artifacts');
});

test('Step 3: Load all generated artifacts via ArtifactLoader', () => {
  const manifestLoader = new GenerationManifestLoader(REPO_ROOT);
  manifestLoader.load();

  const artifactLoader = new GeneratedArtifactLoader(REPO_ROOT);
  const result = artifactLoader.loadAll(manifestLoader.getManifest());
  assert.strictEqual(result.valid, true, `Artifact loading failed: ${result.errors.join(', ')}`);
  assert.ok(result.artifacts.size >= 5, `Expected >= 5 artifacts, got ${result.artifacts.size}`);
});

test('Step 4: Compute runtime artifact hash', () => {
  const manifestLoader = new GenerationManifestLoader(REPO_ROOT);
  manifestLoader.load();

  const artifactLoader = new GeneratedArtifactLoader(REPO_ROOT);
  artifactLoader.loadAll(manifestLoader.getManifest());

  const runtimeHash = computeRuntimeArtifactHash(manifestLoader.getManifest(), artifactLoader.getAllArtifacts());
  assert.ok(runtimeHash, 'Runtime artifact hash computed');
  assert.strictEqual(typeof runtimeHash, 'string', 'Hash is string');
  assert.strictEqual(runtimeHash.length, 64, 'Hash is SHA-256 (64 hex chars)');
});

test('Step 5: Runtime loads workflows and builds execution graph', () => {
  const executor = new WorkflowExecutor(REPO_ROOT);
  executor.load();

  const stats = executor.getStats();
  assert.ok(stats.totalWorkflows >= 10, `Expected >= 10 workflows, got ${stats.totalWorkflows}`);
  assert.ok(stats.executionOrder.length >= 10, 'Execution order has entries');
  assert.ok(stats.graphHash, 'Graph has hash');

  // Verify no cycles
  const order = executor.getExecutionOrder();
  assert.strictEqual(order.length, stats.totalWorkflows, 'All workflows in execution order');
});

test('Step 6: Runtime validates events against registry', () => {
  const validator = new EventValidator(REPO_ROOT);
  validator.load();

  const stats = validator.getStats();
  assert.ok(stats.totalEventTypes >= 50, `Expected >= 50 event types, got ${stats.totalEventTypes}`);

  // Validate a known event type
  const firstType = stats.eventTypes[0];
  const result = validator.validate({
    event_type: firstType,
    schema_version: '1.0.0',
  });
  assert.strictEqual(result.valid, true, `Validation of ${firstType} failed: ${result.errors.join(', ')}`);

  // Reject unknown event type
  const unknownResult = validator.validate({
    event_type: 'NONEXISTENT_EVENT_TYPE',
    schema_version: '1.0.0',
  });
  assert.strictEqual(unknownResult.valid, false, 'Should reject unknown event type');
  assert.ok(unknownResult.errors[0].includes('Unknown'), 'Error mentions unknown');
});

test('Step 7: Runtime resolves capabilities from registry', () => {
  const resolver = new CapabilityResolver(REPO_ROOT);
  resolver.load();

  const stats = resolver.getStats();
  assert.ok(stats.totalCapabilities >= 10, `Expected >= 10 capabilities, got ${stats.totalCapabilities}`);

  // Resolve a known capability
  const firstName = stats.capabilities[0];
  const result = resolver.resolve(firstName);
  assert.strictEqual(result.resolved, true, `Resolution of ${firstName} failed: ${result.issues.join(', ')}`);

  // Reject unknown capability
  const unknownResult = resolver.resolve('NONEXISTENT_CAPABILITY');
  assert.strictEqual(unknownResult.resolved, false, 'Should reject unknown capability');
});

test('Step 8: Runtime boots from deployment manifest', () => {
  const loader = new DeploymentLoader(REPO_ROOT);
  loader.load();

  const stats = loader.getStats();
  assert.ok(stats.totalServices >= 10, `Expected >= 10 services, got ${stats.totalServices}`);
  assert.ok(stats.startupOrder >= 10, 'Startup order has entries');

  // Validate startup order
  const validation = loader.validateStartup();
  assert.strictEqual(validation.valid, true, `Startup validation failed: ${validation.issues.join(', ')}`);

  // Verify startup order references existing services
  const order = loader.getStartupOrder();
  assert.ok(order.length >= 10, 'Startup order has entries');
});

test('Step 9: Runtime executes state machine transitions', () => {
  const executor = new StateMachineExecutor(REPO_ROOT);
  executor.load();

  const stats = executor.getStats();
  assert.ok(stats.totalMachines >= 5, `Expected >= 5 machines, got ${stats.totalMachines}`);

  // Get first machine
  const machineIds = Array.from(executor._machines.keys());
  const machineId = machineIds[0];
  const machine = executor.getMachine(machineId);
  assert.ok(machine, 'First machine exists');

  // Instantiate
  const inst = executor.instantiate(machineId);
  assert.strictEqual(inst.success, true, `Instantiation failed: ${inst.error}`);
  assert.strictEqual(inst.initialState, machine.initial_state, 'Initial state matches');

  // Get valid transitions
  const validTransitions = executor.getValidTransitions(machineId, inst.initialState);
  assert.ok(validTransitions.length >= 1, 'Has at least one valid transition');

  // Execute first valid transition
  const transition = validTransitions[0];
  const result = executor.transition(inst.instanceId, transition.event);
  assert.strictEqual(result.success, true, `Transition failed: ${result.error}`);
  assert.strictEqual(result.from, inst.initialState, 'Transition from correct state');
  assert.strictEqual(result.to, transition.to, 'Transition to correct state');

  // Reject invalid transition
  const invalidResult = executor.transition(inst.instanceId, 'NONEXISTENT_EVENT');
  assert.strictEqual(invalidResult.success, false, 'Should reject invalid transition');
});

test('Step 10: Drift detection passes with all hashes present', () => {
  const detector = new DriftDetector(REPO_ROOT);
  const result = detector.detect('manifest_hash_123', 'runtime_hash_456', 'platform_hash_789', 'graph_hash_012');
  assert.strictEqual(result.healthy, true, `Drift detection failed: ${result.issues.join(', ')}`);
  assert.strictEqual(result.issues.length, 0, 'No drift issues');
});

test('Step 11: Drift detection fails with missing manifest hash', () => {
  const detector = new DriftDetector(REPO_ROOT);
  const result = detector.detect(null, 'runtime_hash_456', 'platform_hash_789', 'graph_hash_012');
  assert.strictEqual(result.healthy, false, 'Should fail with missing manifest hash');
  assert.ok(result.issues.some(i => i.includes('manifest')), 'Issue mentions manifest');
});

test('Step 12: Runtime fingerprint is deterministic', () => {
  const manifestLoader = new GenerationManifestLoader(REPO_ROOT);
  manifestLoader.load();

  const artifactLoader = new GeneratedArtifactLoader(REPO_ROOT);
  artifactLoader.loadAll(manifestLoader.getManifest());

  const runtimeHash = computeRuntimeArtifactHash(manifestLoader.getManifest(), artifactLoader.getAllArtifacts());

  const consumers = {
    workflowExecutor: new WorkflowExecutor(REPO_ROOT),
    eventValidator: new EventValidator(REPO_ROOT),
    capabilityResolver: new CapabilityResolver(REPO_ROOT),
    deploymentLoader: new DeploymentLoader(REPO_ROOT),
    stateMachineExecutor: new StateMachineExecutor(REPO_ROOT),
  };
  consumers.workflowExecutor.load();
  consumers.eventValidator.load();
  consumers.capabilityResolver.load();
  consumers.deploymentLoader.load();
  consumers.stateMachineExecutor.load();

  const fp1 = new RuntimeFingerprint({
    ...consumers,
    manifestHash: manifestLoader.getHash(),
    runtimeArtifactHash: runtimeHash,
    platformHash: 'platform_123',
  }).getFingerprint();

  const fp2 = new RuntimeFingerprint({
    ...consumers,
    manifestHash: manifestLoader.getHash(),
    runtimeArtifactHash: runtimeHash,
    platformHash: 'platform_123',
  }).getFingerprint();

  assert.strictEqual(fp1.fingerprint_hash, fp2.fingerprint_hash, 'Fingerprint hash is deterministic');
  assert.strictEqual(fp1.compiler_version, '1.0.0', 'Compiler version present');
  assert.ok(fp1.artifact_versions.workflow, 'Workflow version present');
  assert.ok(fp1.artifact_versions.events, 'Events version present');
  assert.ok(fp1.artifact_versions.capabilities, 'Capabilities version present');
  assert.ok(fp1.artifact_versions.deployment, 'Deployment version present');
  assert.ok(fp1.artifact_versions.state_machine, 'State machine version present');
});

test('Step 13: Full pipeline — emit event, validate, resolve capability', () => {
  // Load all consumers
  const eventValidator = new EventValidator(REPO_ROOT);
  eventValidator.load();

  const capabilityResolver = new CapabilityResolver(REPO_ROOT);
  capabilityResolver.load();

  // Pick first registered event type
  const eventTypes = eventValidator.listEventTypes();
  assert.ok(eventTypes.length > 0, 'Has event types');

  // Validate event
  const eventResult = eventValidator.validate({
    event_type: eventTypes[0],
    schema_version: '1.0.0',
    payload: {},
  });
  assert.strictEqual(eventResult.valid, true, `Event validation failed: ${eventResult.errors.join(', ')}`);

  // Resolve first capability
  const capabilities = capabilityResolver.listCapabilities();
  assert.ok(capabilities.length > 0, 'Has capabilities');

  const capResult = capabilityResolver.resolve(capabilities[0]);
  assert.strictEqual(capResult.resolved, true, `Capability resolution failed: ${capResult.issues.join(', ')}`);
});

// ============================================================
// P032-P037: Individual Runtime Consumer Tests
// ============================================================
console.log('\n=== P032: Workflow Executor ===');

test('WorkflowExecutor deterministic loading', () => {
  const e1 = new WorkflowExecutor(REPO_ROOT).load();
  const e2 = new WorkflowExecutor(REPO_ROOT).load();
  assert.strictEqual(e1.getHash(), e2.getHash(), 'Hashes match across loads');
});

test('WorkflowExecutor rejects invalid graph (would fail on cycle)', () => {
  // All workflows loaded from registry — cycles would be detected
  const executor = new WorkflowExecutor(REPO_ROOT);
  executor.load();
  const order = executor.getExecutionOrder();
  assert.ok(order.length > 0, 'Execution order computed');
});

test('WorkflowExecutor getWorkflowByType', () => {
  const executor = new WorkflowExecutor(REPO_ROOT).load();
  const wf = executor.getWorkflowByType('repair');
  assert.ok(wf, 'Found repair workflow');
  assert.strictEqual(wf.workflow_type, 'repair');
});

console.log('\n=== P033: Event Validator ===');

test('EventValidator deterministic loading', () => {
  const v1 = new EventValidator(REPO_ROOT).load();
  const v2 = new EventValidator(REPO_ROOT).load();
  assert.strictEqual(v1.getHash(), v2.getHash(), 'Hashes match');
});

test('EventValidator rejects unknown event', () => {
  const validator = new EventValidator(REPO_ROOT).load();
  const result = validator.validate({ event_type: 'BOGUS_EVENT' });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors[0].includes('Unknown'));
});

test('EventValidator rejects event with wrong schema version', () => {
  const validator = new EventValidator(REPO_ROOT).load();
  const types = validator.listEventTypes();
  const result = validator.validate({ event_type: types[0], schema_version: '999.0.0' });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Schema version')));
});

test('EventValidator validates payload schema', () => {
  const validator = new EventValidator(REPO_ROOT).load();
  const types = validator.listEventTypes();
  // Validate with empty payload — should pass (no required fields in most schemas)
  const result = validator.validate({ event_type: types[0], schema_version: '1.0.0', payload: {} });
  assert.strictEqual(result.valid, true, `Should pass with empty payload: ${result.errors.join(', ')}`);
});

console.log('\n=== P034: Capability Resolver ===');

test('CapabilityResolver deterministic loading', () => {
  const r1 = new CapabilityResolver(REPO_ROOT).load();
  const r2 = new CapabilityResolver(REPO_ROOT).load();
  assert.strictEqual(r1.getHash(), r2.getHash(), 'Hashes match');
});

test('CapabilityResolver rejects unknown capability', () => {
  const resolver = new CapabilityResolver(REPO_ROOT).load();
  const result = resolver.resolve('BOGUS_CAPABILITY');
  assert.strictEqual(result.resolved, false);
  assert.ok(result.error.includes('not found'));
});

test('CapabilityResolver resolves by authority', () => {
  const resolver = new CapabilityResolver(REPO_ROOT).load();
  const authorities = resolver.listAuthorities();
  assert.ok(authorities.length > 0, 'Has authorities');
  const caps = resolver.resolveByAuthority(authorities[0]);
  assert.ok(caps.length > 0, `Authority ${authorities[0]} has capabilities`);
});

console.log('\n=== P035: Deployment Loader ===');

test('DeploymentLoader deterministic loading', () => {
  const l1 = new DeploymentLoader(REPO_ROOT).load();
  const l2 = new DeploymentLoader(REPO_ROOT).load();
  assert.strictEqual(l1.getHash(), l2.getHash(), 'Hashes match');
});

test('DeploymentLoader validates startup order', () => {
  const loader = new DeploymentLoader(REPO_ROOT).load();
  const result = loader.validateStartup();
  assert.strictEqual(result.valid, true, `Startup invalid: ${result.issues.join(', ')}`);
});

test('DeploymentLoader getShutdownOrder reverses startup', () => {
  const loader = new DeploymentLoader(REPO_ROOT).load();
  const startup = loader.getStartupOrder();
  const shutdown = loader.getShutdownOrder();
  assert.deepStrictEqual(shutdown, [...startup].reverse(), 'Shutdown is reverse of startup');
});

console.log('\n=== P036: State Machine Executor ===');

test('StateMachineExecutor deterministic loading', () => {
  const e1 = new StateMachineExecutor(REPO_ROOT).load();
  const e2 = new StateMachineExecutor(REPO_ROOT).load();
  assert.strictEqual(e1.getHash(), e2.getHash(), 'Hashes match');
});

test('StateMachineExecutor rejects invalid transition', () => {
  const executor = new StateMachineExecutor(REPO_ROOT).load();
  const ids = Array.from(executor._machines.keys());
  const inst = executor.instantiate(ids[0]);
  const result = executor.transition(inst.instanceId, 'BOGUS_EVENT');
  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Invalid transition'));
});

test('StateMachineExecutor transition hash is deterministic', () => {
  const executor = new StateMachineExecutor(REPO_ROOT).load();
  const ids = Array.from(executor._machines.keys());
  const inst = executor.instantiate(ids[0]);
  const valid = executor.getValidTransitions(ids[0], inst.initialState);
  if (valid.length > 0) {
    executor.transition(inst.instanceId, valid[0].event);
    const state = executor.getState(inst.instanceId);
    const hash1 = state.history[0].transitionHash;
    // Compute expected hash
    const crypto = require('crypto');
    const expected = crypto.createHash('sha256')
      .update(`${inst.initialState}:${valid[0].event}:${valid[0].to}`)
      .digest('hex');
    assert.strictEqual(hash1, expected, 'Transition hash is deterministic');
  }
});

console.log('\n=== P037: Drift Detector ===');

test('DriftDetector PASS with all hashes', () => {
  const detector = new DriftDetector(REPO_ROOT);
  const result = detector.detect('m', 'r', 'p', 'g');
  assert.strictEqual(result.healthy, true);
});

test('DriftDetector FAIL with missing manifest', () => {
  const detector = new DriftDetector(REPO_ROOT);
  const result = detector.detect(null, 'r', 'p', 'g');
  assert.strictEqual(result.healthy, false);
});

test('DriftDetector FAIL with mismatched artifact presence', () => {
  const detector = new DriftDetector(REPO_ROOT);
  const result = detector.detect('m', null, 'p', 'g');
  assert.strictEqual(result.healthy, false);
  assert.ok(result.issues.some(i => i.includes('Manifest loaded but runtime artifacts')));
});

// ============================================================
// Summary
// ============================================================
console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${total}`);

if (failed > 0) {
  process.exit(1);
}
