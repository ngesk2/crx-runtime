/**
 * Test: Capability + OAuth Framework
 *
 * Verifies:
 * 1. Capability contracts define all 9 categories
 * 2. Provider registration works
 * 3. Connection status tracking works
 * 4. Health tracking works
 * 5. Reasoning summaries are accurate
 * 6. OAuth authorization URL generation
 * 7. Token store management
 * 8. Full lifecycle: register → connect → health → reason → disconnect
 */

const assert = require('assert');

// ── Setup ────────────────────────────────────────────────────────

const { CapabilityRegistry } = require('./ping-runtime/connectors/capability_registry');
const { OAuthFlowManager, TokenStore, PROVIDER_OAUTH_CONFIGS } = require('./ping-runtime/connectors/oauth_provider');
const { listCategories, getContract, getProvidersForCapability, CAPABILITY_CONTRACTS } = require('./ping-runtime/connectors/constitutional_capability_contract');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS:', name);
  } catch (e) {
    failed++;
    console.log('  FAIL:', name, '-', e.message);
  }
}

// ── Test 1: Capability Contracts ─────────────────────────────────

console.log('\n=== Capability Contracts ===');

test('9 capability categories defined', () => {
  assert.strictEqual(listCategories().length, 9);
  const expected = ['communication', 'calendar', 'crm', 'accounting', 'payments', 'documents', 'reviews', 'analytics', 'scheduling'];
  assert.deepStrictEqual(listCategories().sort(), expected.sort());
});

test('each contract has operations and providers', () => {
  for (const cat of listCategories()) {
    const c = getContract(cat);
    assert.ok(c.operations, `${cat} missing operations`);
    assert.ok(Object.keys(c.operations).length > 0, `${cat} has no operations`);
    assert.ok(Array.isArray(c.providers), `${cat} providers not an array`);
  }
});

test('communication has 5 operations and 5 providers', () => {
  const c = getContract('communication');
  assert.strictEqual(Object.keys(c.operations).length, 5);
  assert.ok(c.operations.sendEmail, 'missing sendEmail');
  assert.ok(c.operations.sendSMS, 'missing sendSMS');
  assert.strictEqual(c.providers.length, 5);
});

// ── Test 2: Capability Registry ──────────────────────────────────

console.log('\n=== Capability Registry ===');

test('creates empty registry from contracts', () => {
  const reg = new CapabilityRegistry();
  const stats = reg.getStats();
  assert.strictEqual(stats.total, 9);
  assert.strictEqual(stats.connected, 0);
  assert.strictEqual(stats.healthy, 0);
  assert.strictEqual(stats.totalProviders, 0);
});

test('registers provider for capability', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail', {
    authenticationMethod: 'oauth2',
    requiredPermissions: ['email'],
  });
  const status = reg.getCapabilityStatus('communication');
  assert.strictEqual(status.providers.length, 1);
  assert.strictEqual(status.providers[0].name, 'gmail');
  assert.strictEqual(status.providers[0].connected, false);
});

test('rejects duplicate provider registration', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail');
  assert.throws(() => reg.registerProvider('communication', 'gmail'));
});

test('rejects unknown capability category', () => {
  const reg = new CapabilityRegistry();
  assert.throws(() => reg.registerProvider('nonexistent', 'x'));
});

test('tracks connection status', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail');
  reg.registerProvider('communication', 'twilio');

  assert.strictEqual(reg.getCapabilityStatus('communication').connected, false);

  reg.markConnected('communication', 'gmail');
  assert.strictEqual(reg.getCapabilityStatus('communication').connected, true);

  reg.markDisconnected('communication', 'gmail');
  assert.strictEqual(reg.getCapabilityStatus('communication').connected, false);
});

test('tracks health status', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail');
  reg.markConnected('communication', 'gmail');
  reg.updateHealth('communication', 'gmail', { status: 'healthy' });
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'healthy');
});

test('degraded health when some providers unhealthy', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail');
  reg.registerProvider('communication', 'twilio');
  reg.markConnected('communication', 'gmail');
  reg.markConnected('communication', 'twilio');
  reg.updateHealth('communication', 'gmail', { status: 'healthy' });
  reg.updateHealth('communication', 'twilio', { status: 'error', error: 'API unavailable' });
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'degraded');
});

test('findOperation returns available capability', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail', { operations: ['sendEmail'] });
  reg.markConnected('communication', 'gmail');
  reg.updateHealth('communication', 'gmail', { status: 'healthy' });

  const result = reg.findOperation('sendEmail');
  assert.ok(result.length > 0);
  assert.ok(result[0].available);
  assert.ok(result[0].providers.includes('gmail'));
});

test('findOperation returns unavailable for unconnected', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail');
  const result = reg.findOperation('sendEmail');
  assert.ok(!result[0].available);
});

// ── Test 3: Reasoning Summary ────────────────────────────────────

console.log('\n=== Reasoning Summary ===');

test('reasoning summary shows what is available and missing', () => {
  const reg = new CapabilityRegistry();
  reg.registerProvider('communication', 'gmail', { authenticationMethod: 'oauth2', requiredPermissions: ['email'] });
  reg.registerProvider('calendar', 'google-calendar', { authenticationMethod: 'oauth2', requiredPermissions: ['calendar'] });
  reg.markConnected('communication', 'gmail');
  reg.updateHealth('communication', 'gmail', { status: 'healthy' });

  const summary = reg.getReasoningSummary();

  // Can communicate
  assert.ok(summary.can.some(s => s.includes('sendEmail') && s.includes('gmail')));

  // Cannot do other things (string includes 'cannot' not 'connected')
  assert.ok(summary.cannot.some(s => s.includes('calendar')));
  assert.ok(summary.cannot.some(s => s.includes('accounting')));
  assert.ok(summary.cannot.some(s => s.includes('payments')));
});

// ── Test 4: OAuth Config ─────────────────────────────────────────

console.log('\n=== OAuth Provider Configs ===');

test('all capability providers have OAuth configs', () => {
  for (const cat of listCategories()) {
    const contract = getContract(cat);
    for (const provider of contract.providers) {
      const config = PROVIDER_OAUTH_CONFIGS[provider];
      assert.ok(config, `Missing OAuth config for provider: ${provider}`);
    }
  }
});

test('OAuth configs have required fields', () => {
  for (const [name, config] of Object.entries(PROVIDER_OAUTH_CONFIGS)) {
    // Skip aliases — they resolve to parent config
    if (config._alias) continue;
    assert.ok(config.authType, `${name} missing authType`);
    assert.ok(['oauth2', 'api_key', 'basic_auth'].includes(config.authType), `${name} invalid authType: ${config.authType}`);
    assert.ok(typeof config.supportsPKCE === 'boolean', `${name} missing supportsPKCE`);
  }
});

// ── Test 5: Token Store ──────────────────────────────────────────

console.log('\n=== Token Store ===');

test('token store set/get', () => {
  const ts = new TokenStore();
  ts.set('gmail', {
    access_token: 'abc123',
    refresh_token: 'refresh_xyz',
    expires_in: 3600,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  });
  const token = ts.get('gmail');
  assert.ok(token);
  assert.strictEqual(token.access_token, 'abc123');
  assert.strictEqual(token.refresh_token, 'refresh_xyz');
  assert.ok(token.connected_at);
});

test('token store hasValidToken for non-expiring tokens', () => {
  const ts = new TokenStore();
  ts.set('stripe', {
    access_token: 'sk_live_xxx',
    expires_in: null,
  });
  assert.ok(ts.hasValidToken('stripe'));
});

test('token store list shows connections', () => {
  const ts = new TokenStore();
  ts.set('gmail', { access_token: 'x', expires_in: 3600 });
  ts.set('stripe', { access_token: 'y', expires_in: null });
  const list = ts.list();
  assert.ok(list.gmail);
  assert.ok(list.stripe);
  assert.strictEqual(list.gmail.connected, true);
});

test('token store update refreshes token', () => {
  const ts = new TokenStore();
  ts.set('gmail', { access_token: 'old', expires_in: -10 }); // already expired
  ts.update('gmail', { access_token: 'new', expires_in: 3600 });
  assert.strictEqual(ts.get('gmail').access_token, 'new');
});

test('token store remove disconnects', () => {
  const ts = new TokenStore();
  ts.set('gmail', { access_token: 'x', expires_in: 3600 });
  ts.remove('gmail');
  assert.strictEqual(ts.get('gmail'), null);
});

// ── Test 6: OAuth Flow Manager ───────────────────────────────────

console.log('\n=== OAuth Flow Manager ===');

test('getConfig returns provider config', () => {
  const oauth = new OAuthFlowManager();
  const config = oauth.getConfig('google');
  assert.ok(config);
  assert.strictEqual(config.authType, 'oauth2');
});

test('getAuthorizationUrl for API key type returns instructions', () => {
  const oauth = new OAuthFlowManager();
  const result = oauth.getAuthorizationUrl('stripe');
  assert.strictEqual(result.type, 'api_key');
  assert.ok(result.instructions);
  assert.strictEqual(result.url, null);
});

test('getAuthorizationUrl for OAuth requires client_id', () => {
  const oauth = new OAuthFlowManager({ redirectBase: 'http://localhost:8080/connectors' });
  assert.throws(() => oauth.getAuthorizationUrl('google'), /No client_id configured/);
});

test('getAuthorizationUrl with secrets returns URL', () => {
  const oauth = new OAuthFlowManager({
    redirectBase: 'http://localhost:8080/connectors',
    secrets: { 'google': { clientId: 'test-client-id', clientSecret: 'test-secret' } },
  });
  const result = oauth.getAuthorizationUrl('google', { scopes: ['email', 'calendar'] });
  assert.ok(result.url);
  assert.ok(result.url.includes('accounts.google.com'));
  assert.ok(result.url.includes('test-client-id'));
  assert.ok(result.url.includes('offline'));
  assert.ok(result.url.includes('consent'));
  assert.ok(result.url.includes('code_challenge')); // PKCE
  assert.ok(result.state);
  assert.ok(result.codeVerifier);
});

test('getAuthorizationUrl with PKCE disabled works', () => {
  const oauth = new OAuthFlowManager({
    redirectBase: 'http://localhost:8080/connectors',
    secrets: { 'github': { clientId: 'test-id', clientSecret: 'test-secret' } },
  });
  const result = oauth.getAuthorizationUrl('github', { usePKCE: false });
  assert.ok(result.url);
  assert.ok(!result.url.includes('code_challenge')); // Not PKCE
});

test('handleCallback with error returns error', async () => {
  const oauth = new OAuthFlowManager();
  const result = await oauth.handleCallback('google', { error: 'access_denied' });
  assert.strictEqual(result.status, 'error');
  assert.ok(result.error);
});

test('getStatus returns connection state', () => {
  const ts = new TokenStore();
  const oauth = new OAuthFlowManager({ tokenStore: ts });
  let status = oauth.getStatus('google');
  assert.strictEqual(status.connected, false);

  ts.set('google', { access_token: 'tok', expires_in: 3600 });
  status = oauth.getStatus('google');
  assert.strictEqual(status.connected, true);
});

// ── Test 7: Full Lifecycle ───────────────────────────────────────

console.log('\n=== Full Lifecycle ===');

test('end-to-end lifecycle: register → connect → health → reason → disconnect', () => {
  const reg = new CapabilityRegistry();

  // Register providers
  reg.registerProvider('communication', 'gmail', {
    authenticationMethod: 'oauth2',
    requiredPermissions: ['email'],
  });
  reg.registerProvider('communication', 'twilio', {
    authenticationMethod: 'api_key',
    requiredPermissions: ['sms'],
  });
  reg.registerProvider('calendar', 'google-calendar', {
    authenticationMethod: 'oauth2',
    requiredPermissions: ['calendar'],
  });

  // Initially nothing connected
  assert.strictEqual(reg.getCapabilityStatus('communication').connected, false);
  assert.strictEqual(reg.getCapabilityStatus('calendar').connected, false);

  // Connect Gmail only
  reg.markConnected('communication', 'gmail');
  reg.updateHealth('communication', 'gmail', { status: 'healthy' });

  assert.strictEqual(reg.getCapabilityStatus('communication').connected, true);
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'healthy');

  // Connect Twilio with error → degrade
  reg.markConnected('communication', 'twilio');
  reg.updateHealth('communication', 'twilio', { status: 'error', error: 'API unavailable' });
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'degraded');

  // Disconnect Gmail → only twilio (error) remains
  reg.markDisconnected('communication', 'gmail');
  assert.strictEqual(reg.getCapabilityStatus('communication').connected, true);
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'error');

  // Fix twilio health
  reg.updateHealth('communication', 'twilio', { status: 'healthy' });
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'healthy');

  // Reconnect gmail then give it error
  reg.markConnected('communication', 'gmail');
  reg.updateHealth('communication', 'gmail', { status: 'error', error: 'down' });
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'degraded'); // one healthy, one error

  // Disconnect both
  reg.markDisconnected('communication', 'gmail');
  reg.markDisconnected('communication', 'twilio');
  assert.strictEqual(reg.getCapabilityStatus('communication').connected, false);
  assert.strictEqual(reg.getCapabilityStatus('communication').health, 'disconnected');

  // Reasoning summary
  const summary = reg.getReasoningSummary();
  assert.ok(summary.cannot.some(s => s.includes('communication') && s.includes('no communication provider')));
  assert.ok(summary.cannot.some(s => s.includes('calendar') && s.includes('no calendar provider')));
});

// ── Results ──────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===`);
if (failed > 0) process.exit(1);
