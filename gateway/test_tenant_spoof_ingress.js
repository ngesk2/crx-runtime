/**
 * Tenant routing and unconfigured HTTP admission regression.
 * Source maps are internal normalization context, not owner entitlement.
 * These HTTP tests prove that caller tenant/source claims cannot open an
 * unconfigured ingress or invoke its emitter. Authorized HTTP admission and
 * persisted zero-mutation denials are tested in commissioning_admission.test.js.
 *
 * Run: cd gateway && node test_tenant_spoof_ingress.js
 */

const assert = require('assert');
const express = require('express');
const http = require('http');

const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { CanonicalizationService, DEFAULT_NAMESPACE } = require('../ping-runtime/canonicalization/canonicalization_service');
const createIngestRoutes = require('./routes/ingest');

// ── Fixtures ──────────────────────────────────────────────────────────────
class MockValidator {
  constructor(types) { this._types = new Set(types); }
  validateEventType(eventType) {
    if (this._types.has(eventType)) return { valid: true, error: null };
    return { valid: false, error: 'Unknown event_type: ' + eventType };
  }
}

// Mirrors gateway_runtime.js: operator-registered per-source map (TRUSTED).
const OPERATOR_NAMESPACES = {
  'review-authority': 'tenant::hpp',
  'customer-authority': 'tenant::hpp',
  'project-authority': 'tenant::hpp',
  'email-connector': 'tenant::hpp',
  'sms-connector': 'tenant::hpp',
  'google-connector': 'tenant::hpp',
  'github-connector': 'tenant::hpp',
};

const TENANT_A_SOURCE = 'email-connector'; // Tenant A's operator (bound to tenant::hpp)
const TENANT_B = 'tenant::victim-b';       // the spoof target: must NEVER be selected

function buildService() {
  const runtime = new UnifiedEventRuntime({ eventValidator: new MockValidator(['OBSERVATION_CREATED']) });
  const service = new CanonicalizationService({ eventRuntime: runtime, namespaces: OPERATOR_NAMESPACES });
  return { runtime, service };
}

// Fake ONLY the persistence boundary (downstream of namespace selection).
function buildHttpService() {
  let seq = 0;
  const fakeRuntime = {
    emit: async (eventType, source, payload, options) => ({
      status: 'ok',
      eventId: 'evt-test-' + (++seq),
      event: { event_type: eventType, source, namespace: options.namespace },
    }),
  };
  const service = new CanonicalizationService({ eventRuntime: fakeRuntime, namespaces: OPERATOR_NAMESPACES });
  return { service, emissionCount: () => seq };
}

function startServer(service) {
  const app = express();
  app.use(express.json());
  app.use('/ingest', createIngestRoutes(service));
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function post(port, path, body, headers) {
  return fetch('http://127.0.0.1:' + port + path, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
    body: JSON.stringify(body),
  });
}

// ── Runner ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== P1 Hostile: tenant spoof at POST /ingest ===\n');
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log('PASS ' + name);
      passed++;
    } catch (err) {
      console.log('FAIL ' + name);
      console.log('     ' + err.message.split('\n')[0]);
      failed++;
    }
  }
  console.log('\n=== Summary: ' + passed + ' passed, ' + failed + ' failed ===');
  console.log(failed > 0 ? 'FAIL: ingress regression'
                         : 'PASS: tested unconfigured ingress rejects caller tenant claims');
  process.exit(failed > 0 ? 1 : 0);
}

// ── Service-level: untrusted requested namespace is never honored ──────────

test('resolveNamespace: Tenant A source + Tenant B override -> trusted per-source map, never Tenant B', () => {
  const { service } = buildService();
  const ns = service.resolveNamespace(TENANT_A_SOURCE, TENANT_B);
  assert.notStrictEqual(ns, TENANT_B, 'SPOOF: untrusted override was honored');
  assert.strictEqual(ns, 'tenant::hpp');
});

test('resolveNamespace: unmapped source + Tenant B override -> server default, never Tenant B', () => {
  const { service } = buildService();
  const ns = service.resolveNamespace('attacker-cli', TENANT_B);
  assert.notStrictEqual(ns, TENANT_B, 'SPOOF: untrusted override was honored');
  assert.strictEqual(ns, DEFAULT_NAMESPACE);
});

test('authorizeNamespace: Tenant B override for Tenant A source -> NOT authorized', () => {
  const { service } = buildService();
  const auth = service.authorizeNamespace(TENANT_A_SOURCE, TENANT_B);
  assert.strictEqual(auth.authorized, false, 'SPOOF: unbound override reported authorized');
  assert.match(auth.reason, /not bound/);
});

test('authorizeNamespace: bound override (source claims its own bound namespace) stays authorized', () => {
  const { service } = buildService();
  const auth = service.authorizeNamespace(TENANT_A_SOURCE, 'tenant::hpp');
  assert.deepStrictEqual(auth, { authorized: true, namespace: 'tenant::hpp' });
});

test('authorizeNamespace: no override -> trusted per-source map, authorized', () => {
  const { service } = buildService();
  const auth = service.authorizeNamespace(TENANT_A_SOURCE);
  assert.deepStrictEqual(auth, { authorized: true, namespace: 'tenant::hpp' });
});

test('resolveNamespace: falsy override (empty string) behaves as absent (byte-identical)', () => {
  const { service } = buildService();
  assert.strictEqual(service.resolveNamespace(TENANT_A_SOURCE, ''), 'tenant::hpp');
  assert.strictEqual(service.resolveNamespace('attacker-cli', ''), DEFAULT_NAMESPACE);
});

// HTTP source labels do not substitute for the existing admission authority.
const baseBody = { source: TENANT_A_SOURCE, eventType: 'OBSERVATION_CREATED', payload: { probe: 'untrusted' } };
const httpCases = [
  { name: 'body namespace', body: { ...baseBody, namespace: TENANT_B } },
  { name: 'second tenant namespace', body: { ...baseBody, namespace: 'tenant::other-corp' } },
  { name: 'query namespace', path: '/ingest?namespace=' + encodeURIComponent(TENANT_B), body: baseBody },
  { name: 'header tenant', body: baseBody, headers: { 'x-tenant-id': TENANT_B } },
  { name: 'body tenant', body: { ...baseBody, tenant_id: TENANT_B } },
  { name: 'mission tenant', body: { ...baseBody, payload: { mission: { tenant_id: TENANT_B, action: 'escalate' } } } },
  { name: 'no namespace', body: baseBody },
  { name: 'matching source namespace', body: { ...baseBody, namespace: 'tenant::hpp' } },
  { name: 'malformed namespace', body: { ...baseBody, namespace: 'not-a-namespace' } },
];
for (const request of httpCases) {
  test(`POST /ingest: ${request.name} cannot authorize an unconfigured writer`, async () => {
    const { service, emissionCount } = buildHttpService();
    const { server, port } = await startServer(service);
    try {
      const response = await post(port, request.path || '/ingest', request.body, request.headers);
      assert.strictEqual(response.status, 503);
      assert.strictEqual((await response.json()).error, 'commissioning_unconfigured');
      assert.strictEqual(emissionCount(), 0, 'no downstream emission before admission');
    } finally {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
}

run();
