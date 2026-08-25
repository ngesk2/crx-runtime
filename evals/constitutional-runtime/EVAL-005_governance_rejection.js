/**
 * EVAL-005: Governance Rejection Surfacing
 *
 * Proves INV-010 (reject invalid), INV-011 (unregistered type).
 *
 * Event with unregistered type → governance returns invalid with code.
 */

let pass = 0;
let fail = 0;
function assert(condition, msg) {
  if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
}

async function run() {
  const path = require('path');
  const { EventGovernance } = require('../../ping-runtime/events/event_governance');

  const repoRoot = path.resolve(__dirname, '../..');
  const governance = new EventGovernance(repoRoot);
  governance.load();

  // INV-010: Non-object rejected
  const r1 = governance.validateEvent(null);
  assert(!r1.valid, 'null rejected');
  assert(r1.code === 'INVALID_EVENT_OBJECT', `null code: ${r1.code}`);

  // INV-010: Missing event_type rejected
  const r2 = governance.validateEvent({ source: 'test' });
  assert(!r2.valid, 'missing type rejected');
  assert(r2.code === 'MISSING_EVENT_TYPE', `missing type code: ${r2.code}`);

  // INV-011: Unregistered event type rejected
  const r3 = governance.validateEvent({
    event_type: 'FAKE_EVENT_TYPE_999',
    source: 'eval-harness',
  });
  assert(!r3.valid, 'unregistered type rejected');
  assert(r3.code === 'UNREGISTERED_EVENT', `unregistered code: ${r3.code}`);

  // INV-011: Valid event type accepted
  const r4 = governance.validateEvent({
    event_type: 'REVIEW_RECEIVED',
    source: 'eval-harness',
  });
  assert(r4.valid, `REVIEW_RECEIVED accepted (got ${JSON.stringify(r4)}`);

  return { pass, fail };
}

module.exports = { run };
