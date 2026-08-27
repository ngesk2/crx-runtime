// P7: Event Governance — ownership policy, namespace validation, enforcement

const { EventGovernance, NAMESPACE_OWNERS } = require('../ping-runtime/events/event_governance');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ✗ ${message}`);
  }
}

function registryEventCount() {
  const fs = require('fs');
  const registryPath = path.join(__dirname, '..', 'gateway', 'generated', 'event_registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  return registry.events.length;
}

function testLoading() {
  console.log('\n=== P7: Event Governance Loading ===');
  const gov = new EventGovernance(path.join(__dirname, '..'));
  gov.load();

  // The ownership policy is DERIVED from event_registry.json (one rule per
  // registered event). Assert governance/registry consistency, not a fixed
  // historical count, so registry growth does not require a brittle update.
  const expectedRules = registryEventCount();
  const policy = gov.getOwnershipPolicy();
  assert(policy.length === expectedRules, `Ownership rules == registry events (${expectedRules}): got ${policy.length}`);

  const namespaces = gov.getNamespacePolicy();
  assert(namespaces.length > 0, `Loaded ${namespaces.length} namespace rules`);

  const hash = gov.getHash();
  assert(hash && hash.length === 64, `Governance hash is deterministic (${hash.slice(0, 12)}...)`);

  const hash2 = gov.getHash();
  assert(hash === hash2, 'Governance hash is stable across calls');
}

function testOwnershipPolicy() {
  console.log('\n=== P7: Ownership Policy ===');
  const gov = new EventGovernance(path.join(__dirname, '..'));
  gov.load();

  const policy = gov.getPolicyForEvent('artifact_produced');
  assert(policy !== null, 'artifact_produced has ownership policy');
  assert(policy.authority_owner === 'ArtifactStore', 'artifact_produced owned by ArtifactStore');
  assert(policy.event_class === 'system', 'artifact_produced is system class');

  const unknown = gov.getPolicyForEvent('NONEXISTENT_EVENT');
  assert(unknown === null, 'Unknown event returns null policy');
}

function testNamespaceValidation() {
  console.log('\n=== P7: Namespace Validation ===');
  const gov = new EventGovernance(path.join(__dirname, '..'));
  gov.load();

  const result = gov.validateEvent({ event_type: 'artifact_produced', authority_owner: 'ArtifactStore' });
  assert(result.valid === true, 'Valid event passes governance');

  const badOwner = gov.validateEvent({ event_type: 'artifact_produced', authority_owner: 'WrongOwner' });
  assert(badOwner.valid === false, 'Wrong owner is rejected');
  assert(badOwner.code === 'OWNER_MISMATCH', `Rejection code is OWNER_MISMATCH (got ${badOwner.code})`);

  const unregistered = gov.validateEvent({ event_type: 'TOTALLY_FAKE_EVENT' });
  assert(unregistered.valid === false, 'Unregistered event is rejected');
  assert(unregistered.code === 'UNREGISTERED_EVENT', `Rejection code is UNREGISTERED_EVENT (got ${unregistered.code})`);

  const nullEvent = gov.validateEvent(null);
  assert(nullEvent.valid === false, 'Null event is rejected');

  const noType = gov.validateEvent({});
  assert(noType.valid === false, 'Event without type is rejected');
}

function testNamespaceOwners() {
  console.log('\n=== P7: Namespace Owners ===');
  const gov = new EventGovernance(path.join(__dirname, '..'));
  gov.load();

  assert(NAMESPACE_OWNERS.artifact === 'PING', 'artifact namespace owned by PING');
  assert(NAMESPACE_OWNERS.tenant === 'PING', 'tenant namespace owned by PING');
  assert(NAMESPACE_OWNERS.worker === 'PING', 'worker namespace owned by PING');

  const events = gov.getEventsForNamespace('artifact');
  assert(events.length > 0, `artifact namespace has ${events.length} events`);
  assert(events.includes('artifact_produced'), 'artifact_produced in artifact namespace');
}

function testStats() {
  console.log('\n=== P7: Governance Stats ===');
  const gov = new EventGovernance(path.join(__dirname, '..'));
  gov.load();

  const r1 = gov.validateEvent({ event_type: 'artifact_produced', authority_owner: 'ArtifactStore' });
  const r2 = gov.validateEvent({ event_type: 'artifact_produced', authority_owner: 'ArtifactStore' });
  const r3 = gov.validateEvent({ event_type: 'FAKE_EVENT' });

  assert(r1.valid === true, 'First valid event passes');
  assert(r2.valid === true, 'Second valid event passes');
  assert(r3.valid === false, 'Fake event is rejected');

  const stats = gov.getStats();
  assert(stats.total === 3, `Total validations: 3 (got ${stats.total})`);
  assert(stats.passed === 2, `Passed: 2 (got ${stats.passed})`);
  assert(stats.rejected === 1, `Rejected: 1 (got ${stats.rejected})`);

  const violations = gov.getViolations();
  assert(violations.length === 1, '1 violation recorded');
  assert(violations[0].code === 'UNREGISTERED_EVENT', 'Violation is UNREGISTERED_EVENT');
}

function testEventQueueGovernance() {
  console.log('\n=== P7: EventQueue Governance Integration ===');
  const fs = require('fs');
  const path = require('path');
  const { EventQueue } = require('../ping-runtime/orchestration/execution/event_queue');

  // Clear stale persisted event files from prior test runs to avoid
  // deterministic event_id collisions in the dedup check.
  const queueDir = path.join(__dirname, '..', 'ping-runtime', 'orchestration', 'event_queue');
  if (fs.existsSync(queueDir)) {
    for (const f of fs.readdirSync(queueDir)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(queueDir, f));
    }
  }

  const queue = new EventQueue();
  const governance = queue.getGovernance();

  assert(governance !== null, 'EventQueue has governance');
  assert(governance.getOwnershipPolicy().length === registryEventCount(), 'EventQueue governance rules == registry events');

  const result = queue.emit('COMPLETELY_UNKNOWN_EVENT', {});
  assert(result === null, 'Unknown event is rejected by queue (returns null)');

  const validResult = queue.emit('artifact_produced', { authority_owner: 'ArtifactStore' });
  assert(validResult !== null, 'Valid event is emitted');
}

function runAll() {
  console.log('=== P7: Event Governance ===\n');

  testLoading();
  testOwnershipPolicy();
  testNamespaceValidation();
  testNamespaceOwners();
  testStats();
  testEventQueueGovernance();

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log(`\nFailures:`);
    failures.forEach(f => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

runAll();
