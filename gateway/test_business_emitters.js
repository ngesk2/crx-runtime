const assert = require('assert');
const { ReviewEmitter, CustomerEmitter, ProjectEmitter, ConnectorEmitter, SystemEmitter } = require('../ping-runtime/business/business_emitters');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); } catch(e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// Mock event runtime that captures emissions
class MockEventRuntime {
  constructor() { this.events = []; }
  async emit(eventType, authority, payload) {
    this.events.push({ event_type: eventType, authority_owner: authority, payload });
    return { event_id: `evt-${this.events.length}` };
  }
}

console.log('=== Business Emitter Tests ===');

const er = new MockEventRuntime();
const review = new ReviewEmitter(er);
const customer = new CustomerEmitter(er);
const project = new ProjectEmitter(er);
const connector = new ConnectorEmitter(er);
const system = new SystemEmitter(er);

test('ReviewEmitter.received emits REVIEW_RECEIVED', async () => {
  await review.received({ review_id: 'r1', rating: 5, text: 'Great work!' });
  assert.strictEqual(er.events[0].event_type, 'REVIEW_RECEIVED');
  assert.strictEqual(er.events[0].authority_owner, 'review-authority');
  assert.strictEqual(er.events[0].payload.rating, 5);
});

test('ReviewEmitter.responded emits REVIEW_RESPONDED', async () => {
  await review.responded('r1', 'Thank you!');
  assert.strictEqual(er.events[1].event_type, 'REVIEW_RESPONDED');
  assert.strictEqual(er.events[1].payload.review_id, 'r1');
  assert.strictEqual(er.events[1].payload.response, 'Thank you!');
});

test('CustomerEmitter.created emits CUSTOMER_CREATED', async () => {
  await customer.created({ customer_id: 'c1', name: 'Test', email: 't@t.com' });
  assert.strictEqual(er.events[2].event_type, 'CUSTOMER_CREATED');
  assert.strictEqual(er.events[2].authority_owner, 'customer-authority');
  assert.strictEqual(er.events[2].payload.name, 'Test');
});

test('CustomerEmitter.updated emits CUSTOMER_UPDATED', async () => {
  await customer.updated('c1', { email: 'new@t.com' });
  assert.strictEqual(er.events[3].event_type, 'CUSTOMER_UPDATED');
  assert.strictEqual(er.events[3].payload.changes.email, 'new@t.com');
});

test('CustomerEmitter.leadCreated emits LEAD_CREATED', async () => {
  await customer.leadCreated({ lead_id: 'l1', source: 'website' });
  assert.strictEqual(er.events[4].event_type, 'LEAD_CREATED');
  assert.strictEqual(er.events[4].payload.source, 'website');
});

test('CustomerEmitter.leadConverted emits LEAD_CONVERTED', async () => {
  await customer.leadConverted('l1', 'p1');
  assert.strictEqual(er.events[5].event_type, 'LEAD_CONVERTED');
  assert.strictEqual(er.events[5].payload.project_id, 'p1');
});

test('ProjectEmitter.created emits PROJECT_CREATED', async () => {
  await project.created({ project_id: 'p1', name: 'Test Project' });
  assert.strictEqual(er.events[6].event_type, 'PROJECT_CREATED');
  assert.strictEqual(er.events[6].authority_owner, 'project-authority');
});

test('ProjectEmitter.completed emits PROJECT_COMPLETED', async () => {
  await project.completed('p1');
  assert.strictEqual(er.events[7].event_type, 'PROJECT_COMPLETED');
  assert.strictEqual(er.events[7].payload.project_id, 'p1');
});

test('ProjectEmitter.estimateCreated emits ESTIMATE_CREATED', async () => {
  await project.estimateCreated({ estimate_id: 'e1', amount: 10000 });
  assert.strictEqual(er.events[8].event_type, 'ESTIMATE_CREATED');
  assert.strictEqual(er.events[8].payload.amount, 10000);
});

test('ProjectEmitter.invoicePaid emits INVOICE_PAID', async () => {
  await project.invoicePaid('i1', 5000);
  assert.strictEqual(er.events[9].event_type, 'INVOICE_PAID');
  assert.strictEqual(er.events[9].payload.amount, 5000);
  assert.ok(er.events[9].payload.paid_at); // has timestamp
});

test('ConnectorEmitter.emailSent emits EMAIL_SENT', async () => {
  await connector.emailSent('test@test.com', 'Hello');
  assert.strictEqual(er.events[10].event_type, 'EMAIL_SENT');
  assert.strictEqual(er.events[10].authority_owner, 'email-connector');
});

test('ConnectorEmitter.smsSent emits SMS_SENT', async () => {
  await connector.smsSent('555-0101', 'Hi');
  assert.strictEqual(er.events[11].event_type, 'SMS_SENT');
  assert.strictEqual(er.events[11].authority_owner, 'sms-connector');
});

test('ConnectorEmitter.googleReview emits GOOGLE_REVIEW_RECEIVED', async () => {
  await connector.googleReview({ rating: 5, text: 'Excellent' });
  assert.strictEqual(er.events[12].event_type, 'GOOGLE_REVIEW_RECEIVED');
  assert.strictEqual(er.events[12].authority_owner, 'google-connector');
});

test('ConnectorEmitter.githubCommit emits GITHUB_COMMIT_SYNCED', async () => {
  await connector.githubCommit('abc123', 'Fix bug', 'dev');
  assert.strictEqual(er.events[13].event_type, 'GITHUB_COMMIT_SYNCED');
  assert.strictEqual(er.events[13].payload.sha, 'abc123');
});

test('SystemEmitter.healthCheck emits SYSTEM_HEALTH_CHECK', async () => {
  await system.healthCheck('gateway', 'healthy');
  assert.strictEqual(er.events[14].event_type, 'SYSTEM_HEALTH_CHECK');
  assert.strictEqual(er.events[14].authority_owner, 'health-authority');
});

test('SystemEmitter.workerCompleted emits WORKER_COMPLETED', async () => {
  await system.workerCompleted('observation', 'm1', { docs: 3 });
  assert.strictEqual(er.events[15].event_type, 'WORKER_COMPLETED');
  assert.strictEqual(er.events[15].payload.worker, 'observation');
});

test('SystemEmitter.workerFailed emits WORKER_FAILED', async () => {
  await system.workerFailed('claim', 'm2', 'timeout');
  assert.strictEqual(er.events[16].event_type, 'WORKER_FAILED');
  assert.strictEqual(er.events[16].payload.error, 'timeout');
});

test('All 17 emissions captured', () => {
  assert.strictEqual(er.events.length, 17);
});

test('All event types are unique', () => {
  const types = er.events.map(e => e.event_type);
  const unique = new Set(types);
  assert.strictEqual(unique.size, types.length);
});

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
process.exit(failed > 0 ? 1 : 0);
