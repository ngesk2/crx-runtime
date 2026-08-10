// P8: Analytics Policy Engine — allowed/forbidden metrics, redaction, projection, retention

const { AnalyticsPolicy, ALLOWED_OPERATIONAL_METRICS, FORBIDDEN_BUSINESS_METRICS, REDACTION_RULES, PROJECTION_RULES, RETENTION_CLASSES } = require('../ping-runtime/runtime/analytics_policy');

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

function testAllowedMetrics() {
  console.log('\n=== P8: Allowed Metrics ===');
  const policy = new AnalyticsPolicy();

  assert(policy.isAllowedMetric('event_count') === true, 'event_count is allowed');
  assert(policy.isAllowedMetric('worker_utilization') === true, 'worker_utilization is allowed');
  assert(policy.isAllowedMetric('queue_depth') === true, 'queue_depth is allowed');
  assert(policy.isAllowedMetric('health_status') === true, 'health_status is allowed');
  assert(policy.isAllowedMetric('runtime_artifact_hash') === true, 'runtime_artifact_hash is allowed');

  const metrics = policy.getAllowedMetrics();
  assert(metrics.length >= 29, `${metrics.length} allowed metrics registered`);
}

function testForbiddenMetrics() {
  console.log('\n=== P8: Forbidden Metrics ===');
  const policy = new AnalyticsPolicy();

  assert(policy.isAllowedMetric('customer_id') === false, 'customer_id is forbidden');
  assert(policy.isAllowedMetric('payment_amount') === false, 'payment_amount is forbidden');
  assert(policy.isAllowedMetric('revenue') === false, 'revenue is forbidden');
  assert(policy.isAllowedMetric('customer_email') === false, 'customer_email is forbidden');
  assert(policy.isAllowedMetric('order_total') === false, 'order_total is forbidden');

  const forbidden = policy.getForbiddenMetrics();
  assert(forbidden.length > 20, `${forbidden.length} forbidden metrics registered`);
}

function testRedaction() {
  console.log('\n=== P8: Redaction Rules ===');
  const policy = new AnalyticsPolicy();

  const payload = {
    name: 'test',
    email: 'user@example.com',
    phone: '555-1234',
    secret: 'my-secret-key',
    ip_address: '192.168.1.1',
    nested: {
      password: 'hunter2',
      token: 'abc123',
    },
  };

  const redacted = policy.redactPayload(payload, 'posthog');
  assert(redacted.name === 'test', 'Non-PII field preserved');
  assert(redacted.email === '[EMAIL]', 'Email redacted');
  assert(redacted.phone === '[PHONE]', 'Phone redacted');
  assert(redacted.secret === '[SECRET]', 'Secret redacted');
  assert(redacted.ip_address && redacted.ip_address !== '192.168.1.1', 'IP address hashed');
  assert(redacted.nested.password === '[REDACTED]', 'Nested password redacted');
  assert(redacted.nested.token === '[TOKEN]', 'Nested token redacted');

  const noRedact = policy.redactPayload(payload, 'webhook');
  assert(noRedact.email === 'user@example.com', 'Webhook does not redact (redactPII: false)');
}

function testProjectionRules() {
  console.log('\n=== P8: Projection Rules ===');
  const policy = new AnalyticsPolicy();

  assert(policy.isAllowedEventForIntegration('tenant.created', 'system', 'tenant', 'posthog') === true, 'PostHog accepts system/tenant events');
  assert(policy.isAllowedEventForIntegration('deployment.failed', 'system', 'deployment', 'email') === true, 'Email accepts system/deployment events');
  assert(policy.isAllowedEventForIntegration('runtime.component_unhealthy', 'system', 'runtime', 'sms') === true, 'SMS accepts system/runtime events');
  assert(policy.isAllowedEventForIntegration('inference.completed', 'inference', 'inference', 'posthog') === false, 'PostHog rejects inference events');
  assert(policy.isAllowedEventForIntegration('inference.completed', 'inference', 'inference', 'webhook') === true, 'Webhook accepts inference events');

  const posthogRule = policy.getProjectionRule('posthog');
  assert(posthogRule !== null, 'PostHog projection rule exists');
  assert(posthogRule.retentionDays === 90, 'PostHog retention is 90 days');
  assert(posthogRule.redactPII === true, 'PostHog redacts PII');

  const smsRule = policy.getProjectionRule('sms');
  assert(smsRule.retentionDays === 7, 'SMS retention is 7 days');
}

function testRetentionClasses() {
  console.log('\n=== P8: Retention Classes ===');
  const policy = new AnalyticsPolicy();

  const operational = policy.getRetentionClass('operational');
  assert(operational !== null, 'operational retention class exists');
  assert(operational.days === 90, 'operational retention is 90 days');

  const audit = policy.getRetentionClass('audit');
  assert(audit.days === 365, 'audit retention is 365 days');

  const permanent = policy.getRetentionClass('permanent');
  assert(permanent.days === -1, 'permanent retention is unlimited');
}

function testHash() {
  console.log('\n=== P8: Policy Hash ===');
  const policy = new AnalyticsPolicy();

  const hash = policy.getHash();
  assert(hash && hash.length === 64, `Policy hash is deterministic (${hash.slice(0, 12)}...)`);

  const hash2 = policy.getHash();
  assert(hash === hash2, 'Policy hash is stable');
}

function testStats() {
  console.log('\n=== P8: Policy Stats ===');
  const policy = new AnalyticsPolicy();

  policy.isAllowedMetric('event_count');
  policy.isAllowedMetric('customer_id');
  policy.isAllowedMetric('worker_utilization');

  const stats = policy.getStats();
  assert(stats.checked === 3, `Checked: 3 (got ${stats.checked})`);
  assert(stats.allowed === 2, `Allowed: 2 (got ${stats.allowed})`);
  assert(stats.blocked === 1, `Blocked: 1 (got ${stats.blocked})`);

  const violations = policy.getViolations();
  assert(violations.length === 1, '1 violation recorded');
  assert(violations[0].code === 'FORBIDDEN_METRIC', 'Violation is FORBIDDEN_METRIC');
}

async function testIntegrationManagerPolicy() {
  console.log('\n=== P8: IntegrationManager + Policy ===');
  const { IntegrationManager } = require('../ping-runtime/runtime/integration_manager');
  const { PostHogIntegration } = require('../ping-runtime/connectors/posthog_integration');

  const policy = new AnalyticsPolicy();
  const manager = new IntegrationManager({ policy });
  manager.registerIntegration('posthog', new PostHogIntegration());

  const result = await manager.emit('tenant.created', { tenant_id: 't1', email: 'test@example.com' });
  assert(result.length === 1, 'Event routed to PostHog');
  assert(result[0].status === 'sent', 'Event sent successfully');

  const stats = manager.getStats();
  assert(stats.policyActive === true, 'Policy is active');
}

async function runAll() {
  console.log('=== P8: Analytics Policy Engine ===\n');

  testAllowedMetrics();
  testForbiddenMetrics();
  testRedaction();
  testProjectionRules();
  testRetentionClasses();
  testHash();
  testStats();
  await testIntegrationManagerPolicy();

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
