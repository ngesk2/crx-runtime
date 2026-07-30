// P051-P054: Integration Manager + All Integrations
// Tests: IntegrationManager, PostHogIntegration, WebhookIntegration, EmailIntegration, SmsIntegration

const { IntegrationManager } = require('./runtime/integration_manager');
const { PostHogIntegration } = require('./runtime/integrations/posthog_integration');
const { WebhookIntegration } = require('./runtime/integrations/webhook_integration');
const { EmailIntegration } = require('./runtime/integrations/email_integration');
const { SmsIntegration } = require('./runtime/integrations/sms_integration');

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

async function testIntegrationManager() {
  console.log('\n=== P051: Integration Manager ===');

  const manager = new IntegrationManager();
  const posthog = new PostHogIntegration({ enabled: false });
  const email = new EmailIntegration({ enabled: false });

  manager.registerIntegration('posthog', posthog);
  manager.registerIntegration('email', email);

  assert(manager.getIntegration('posthog') !== null, 'PostHog integration registered');
  assert(manager.getIntegration('email') !== null, 'Email integration registered');
  assert(manager.getIntegration('nonexistent') === null, 'Non-existent integration returns null');

  const status = await manager.getStatus();
  assert(status.total === 2, 'Status shows 2 integrations');
  assert(status.integrations.posthog.status === 'healthy', 'PostHog status is healthy');
  assert(status.integrations.email.status === 'healthy', 'Email status is healthy');

  manager.unregisterIntegration('email');
  assert(manager.getIntegration('email') === null, 'Email integration unregistered');
}

async function testPostHogIntegration() {
  console.log('\n=== P052: PostHog Integration ===');

  const posthog = new PostHogIntegration({ enabled: true });
  assert(posthog._enabled === true, 'PostHog is enabled');

  const caps = posthog.capabilities();
  assert(caps.name === 'posthog', 'PostHog capability name is posthog');
  assert(caps.eventTypes.includes('tenant.created'), 'PostHog handles tenant.created');

  const result = await posthog.send('tenant.created', { tenant_id: 't1' });
  assert(result.status === 'queued', 'PostHog event queued');
  assert(posthog.getSentEvents().length === 1, 'PostHog has 1 sent event');
  assert(posthog.getSentEvents()[0].event === 'tenant.created', 'PostHog event type correct');

  const health = await posthog.health();
  assert(health.status === 'healthy', 'PostHog health is healthy');
  assert(health.apiKey.startsWith('not conf'), 'PostHog API key shown as not configured');

  const events = posthog.flush();
  assert(events.length === 1, 'PostHog flush returns 1 event');
  assert(posthog.getSentEvents().length === 0, 'PostHog events cleared after flush');

  const disabledPosthog = new PostHogIntegration({ enabled: false });
  try {
    await disabledPosthog.send('test', {});
    assert(false, 'Disabled PostHog should throw');
  } catch (err) {
    assert(err.message.includes('disabled'), 'Disabled PostHog throws error');
  }
}

async function testWebhookIntegration() {
  console.log('\n=== P053: Webhook Integration ===');

  const webhook = new WebhookIntegration();
  const registered = webhook.registerEndpoint('test', 'https://example.com/webhook', {
    eventTypes: ['tenant.created'],
  });
  assert(registered === true, 'Webhook endpoint registered');

  const endpoints = webhook.getEndpoints();
  assert(endpoints.length === 1, 'Webhook has 1 endpoint');
  assert(endpoints[0].name === 'test', 'Webhook endpoint name correct');
  assert(endpoints[0].enabled === true, 'Webhook endpoint enabled');

  const caps = webhook.capabilities();
  assert(caps.name === 'webhook', 'Webhook capability name is webhook');
  assert(caps.eventTypes.includes('*'), 'Webhook handles all event types');

  const health = await webhook.health();
  assert(health.status === 'healthy', 'Webhook health is healthy');
  assert(health.endpoints === 1, 'Webhook has 1 endpoint');
}

async function testEmailIntegration() {
  console.log('\n=== P054a: Email Integration ===');

  const email = new EmailIntegration({ enabled: true });
  assert(email._enabled === true, 'Email is enabled');

  const caps = email.capabilities();
  assert(caps.name === 'email', 'Email capability name is email');
  assert(caps.eventTypes.includes('tenant.created'), 'Email handles tenant.created');
  assert(caps.eventTypes.includes('deployment.failed'), 'Email handles deployment.failed');

  const result = await email.send('tenant.created', { to: 'admin@test.com', tenant_id: 't1' });
  assert(result.status === 'queued', 'Email event queued');
  assert(result.email.to === 'admin@test.com', 'Email recipient correct');
  assert(result.email.subject.includes('tenant.created'), 'Email subject contains event type');
  assert(email.getSentEmails().length === 1, 'Email has 1 sent email');

  const health = await email.health();
  assert(health.status === 'healthy', 'Email health is healthy');

  const emails = email.flush();
  assert(emails.length === 1, 'Email flush returns 1 email');
  assert(email.getSentEmails().length === 0, 'Emails cleared after flush');

  const disabledEmail = new EmailIntegration({ enabled: false });
  try {
    await disabledEmail.send('test', {});
    assert(false, 'Disabled email should throw');
  } catch (err) {
    assert(err.message.includes('disabled'), 'Disabled email throws error');
  }
}

async function testSmsIntegration() {
  console.log('\n=== P054b: SMS Integration ===');

  const sms = new SmsIntegration({ enabled: true });
  assert(sms._enabled === true, 'SMS is enabled');

  const caps = sms.capabilities();
  assert(caps.name === 'sms', 'SMS capability name is sms');
  assert(caps.eventTypes.includes('runtime.component_unhealthy'), 'SMS handles component_unhealthy');
  assert(caps.eventTypes.includes('deployment.failed'), 'SMS handles deployment.failed');

  const result = await sms.send('runtime.component_unhealthy', { component: 'worker', message: 'Worker down' });
  assert(result.status === 'queued', 'SMS event queued');
  assert(result.sms.body.includes('runtime.component_unhealthy'), 'SMS body contains event type');
  assert(sms.getSentSms().length === 1, 'SMS has 1 sent message');

  const health = await sms.health();
  assert(health.status === 'healthy', 'SMS health is healthy');
  assert(health.provider === 'twilio', 'SMS provider is twilio');

  const messages = sms.flush();
  assert(messages.length === 1, 'SMS flush returns 1 message');
  assert(sms.getSentSms().length === 0, 'SMS cleared after flush');

  const disabledSms = new SmsIntegration({ enabled: false });
  try {
    await disabledSms.send('test', {});
    assert(false, 'Disabled SMS should throw');
  } catch (err) {
    assert(err.message.includes('disabled'), 'Disabled SMS throws error');
  }
}

async function testIntegrationEndToEnd() {
  console.log('\n=== P051-P054: Integration End-to-End ===');

  const manager = new IntegrationManager();
  const posthog = new PostHogIntegration({ enabled: true });
  const email = new EmailIntegration({ enabled: true });
  const sms = new SmsIntegration({ enabled: true });

  manager.registerIntegration('posthog', posthog);
  manager.registerIntegration('email', email);
  manager.registerIntegration('sms', sms);

  const status = await manager.getStatus();
  assert(status.total === 3, 'All 3 integrations registered');
  assert(status.healthy === 3, 'All 3 integrations healthy');

  const results = await manager.emit('tenant.created', { tenant_id: 't1' });
  assert(results.length === 2, '2 integrations received tenant.created (posthog + email)');
  assert(results.every(r => r.status === 'sent'), 'All sent successfully');

  const smsOnlyResults = await manager.emit('runtime.component_unhealthy', { component: 'worker' });
  assert(smsOnlyResults.length === 1, '1 integration received component_unhealthy (sms only)');
  assert(smsOnlyResults[0].integration === 'sms', 'SMS integration received component_unhealthy');

  const log = manager.getEventLog();
  assert(log.length === 3, 'Event log has 3 entries');
  assert(log[0].eventType === 'tenant.created', 'First log entry is tenant.created');
  assert(log[2].eventType === 'runtime.component_unhealthy', 'Last log entry is component_unhealthy');
}

async function runAll() {
  console.log('=== Wave 3A Phase 3: Integration Manager (P051-P054) ===\n');

  await testIntegrationManager();
  await testPostHogIntegration();
  await testWebhookIntegration();
  await testEmailIntegration();
  await testSmsIntegration();
  await testIntegrationEndToEnd();

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

runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
