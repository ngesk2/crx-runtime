/**
 * Canonical Boundary Tests — POST /ingest + CanonicalizationService
 *
 * Verifies the Canonicalization Boundary law:
 * - every event crosses the boundary (canonical envelope) before it exists
 * - namespace resolved BEFORE persistence (core:: / tenant::)
 * - deterministic, timestamp-stripped logical identity → retries never duplicate
 * - envelope carries schema_version / constitution_version / canonical_version
 * - /ingest is a thin REST adapter over the service
 *
 * Run: node test_ingest_boundary.js
 */

const assert = require('assert');
const express = require('express');
const http = require('http');

const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { CanonicalizationService, DEFAULT_NAMESPACE, CANONICAL_VERSION } = require('../ping-runtime/canonicalization/canonicalization_service');
const { verifyCanonicalObject } = require('./canonical_object');
const createIngestRoutes = require('./routes/ingest');

// ── Test runner (async) ───────────────────────────────────────────────
let passed = 0, failed = 0;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
  console.log('=== Canonical Boundary Tests ===\n');
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${name}`);
      console.log(`  ${err.message}`);
      failed++;
    }
  }
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

// ── Fixtures ──────────────────────────────────────────────────────────
class MockValidator {
  constructor(types) { this._types = new Set(types); }
  validateEventType(eventType) {
    if (this._types.has(eventType)) return { valid: true, error: null };
    return { valid: false, error: `Unknown event_type: ${eventType}` };
  }
}

const ACCEPTED_TYPES = ['REVIEW_RECEIVED', 'CUSTOMER_CREATED', 'PROJECT_CREATED', 'OBSERVATION_CREATED'];

function buildService(namespaces) {
  const runtime = new UnifiedEventRuntime({ eventValidator: new MockValidator(ACCEPTED_TYPES) });
  const service = new CanonicalizationService({ eventRuntime: runtime, namespaces });
  return { runtime, service };
}

// ── Boundary service tests ────────────────────────────────────────────

test('canonicalizeAndEmit produces a verified canonical envelope', async () => {
  const { service } = buildService();
  const result = await service.canonicalizeAndEmit({
    source: 'review-authority',
    eventType: 'REVIEW_RECEIVED',
    payload: { review_id: 'r1', rating: 5, text: 'Great work!' },
  });
  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(typeof result.eventId, 'string');
  assert.ok(result.objectId);
  assert.ok(result.canonicalHash);
  assert.deepStrictEqual(result.verified, { valid: true, error: null });
  const env = result.envelope;
  assert.strictEqual(env.schema_version, '1.0.0');
  assert.strictEqual(env.constitution_version, '1.0.0');
  assert.strictEqual(env.canonical_version, '1.0.0');
  assert.strictEqual(env.canonical_version, env.schema_version);
  assert.ok(env.metadata.canonical_version);
  assert.strictEqual(env.metadata.lifecycle_stage, 'observation');
});

test('observation confidence defaults to 0.5 (not knowledge)', async () => {
  const { service } = buildService();
  const result = await service.canonicalizeAndEmit({
    source: 'review-authority',
    eventType: 'REVIEW_RECEIVED',
    payload: { review_id: 'r2' },
  });
  assert.strictEqual(result.envelope.confidence, 0.5);
});

test('same logical event twice → identical event_id (idempotent retry)', async () => {
  const { service } = buildService();
  const input = {
    source: 'customer-authority',
    eventType: 'CUSTOMER_CREATED',
    payload: { customer_id: 'c1', name: 'Test' },
  };
  const first = await service.canonicalizeAndEmit(input);
  const second = await service.canonicalizeAndEmit(input);
  assert.strictEqual(first.eventId, second.eventId);
  assert.strictEqual(first.objectId, second.objectId);
});

test('payloads differing only in timestamps → identical event_id', async () => {
  const { service } = buildService();
  const a = await service.canonicalizeAndEmit({
    source: 'project-authority',
    eventType: 'PROJECT_CREATED',
    payload: { project_id: 'p1', paid_at: '2026-01-01T00:00:00Z', timestamp: '2026-01-01T00:00:00Z' },
  });
  const b = await service.canonicalizeAndEmit({
    source: 'project-authority',
    eventType: 'PROJECT_CREATED',
    payload: { project_id: 'p1', paid_at: '2026-01-02T00:00:00Z', timestamp: '2026-01-02T00:00:00Z' },
  });
  assert.strictEqual(a.eventId, b.eventId);
});

test('payloads with different meaningful content → different event_id', async () => {
  const { service } = buildService();
  const a = await service.canonicalizeAndEmit({ source: 's', eventType: 'REVIEW_RECEIVED', payload: { review_id: 'x' } });
  const b = await service.canonicalizeAndEmit({ source: 's', eventType: 'REVIEW_RECEIVED', payload: { review_id: 'y' } });
  assert.notStrictEqual(a.eventId, b.eventId);
});

test('namespace defaults to core::owner when no map/override', async () => {
  const { service } = buildService();
  const result = await service.canonicalizeAndEmit({ source: 'unmapped-source', eventType: 'OBSERVATION_CREATED', payload: { id: 1 } });
  assert.strictEqual(result.namespace, DEFAULT_NAMESPACE);
  assert.strictEqual(result.event.namespace, 'core::owner');
});

test('per-source namespace map resolves (review-authority → tenant::hpp)', async () => {
  const { service } = buildService({ 'review-authority': 'tenant::hpp' });
  const result = await service.canonicalizeAndEmit({ source: 'review-authority', eventType: 'REVIEW_RECEIVED', payload: { review_id: 'r3' } });
  assert.strictEqual(result.namespace, 'tenant::hpp');
  assert.strictEqual(result.envelope.identity.namespace, 'tenant::hpp');
});

test('explicit namespace overrides source map', async () => {
  const { service } = buildService({ 'review-authority': 'tenant::hpp' });
  const result = await service.canonicalizeAndEmit({ source: 'review-authority', eventType: 'REVIEW_RECEIVED', payload: { review_id: 'r4' }, namespace: 'core::system' });
  assert.strictEqual(result.namespace, 'core::system');
});

test('invalid namespace is rejected', async () => {
  const { service } = buildService();
  await assert.rejects(() => service.canonicalizeAndEmit({
    source: 'review-authority', eventType: 'REVIEW_RECEIVED', payload: { review_id: 'r5' }, namespace: 'hpp',
  }), /Invalid namespace/);
});

test('unknown event type returns status error (not throw)', async () => {
  const { service } = buildService();
  const result = await service.canonicalizeAndEmit({ source: 's', eventType: 'NOT_REGISTERED', payload: { id: 1 } });
  assert.strictEqual(result.status, 'error');
  assert.match(result.error, /Unknown event_type/);
});

test('missing source / eventType / payload throws', async () => {
  const { service } = buildService();
  await assert.rejects(() => service.canonicalizeAndEmit({ source: '', eventType: 'REVIEW_RECEIVED', payload: {} }), /source/);
  await assert.rejects(() => service.canonicalizeAndEmit({ source: 's', eventType: '', payload: {} }), /eventType/);
  await assert.rejects(() => service.canonicalizeAndEmit({ source: 's', eventType: 'REVIEW_RECEIVED' }), /payload/);
});

test('duck-typed emit() works for existing emitters (compat path)', async () => {
  const { service } = buildService({ 'review-authority': 'tenant::hpp' });
  const result = await service.emit('REVIEW_RECEIVED', 'review-authority', { review_id: 'r6' });
  assert.strictEqual(result.status, 'ok');
  assert.strictEqual(result.namespace, 'tenant::hpp');
  assert.strictEqual(result.envelope.kind, 'REVIEW_RECEIVED');
  assert.strictEqual(result.envelope.authority, 'review-authority');
});

test('emitted event carries namespace + canonical metadata', async () => {
  const { service, runtime } = buildService({ 'customer-authority': 'tenant::hpp' });
  let captured = null;
  runtime.on('CUSTOMER_CREATED', (event) => { captured = event; });
  await service.canonicalizeAndEmit({ source: 'customer-authority', eventType: 'CUSTOMER_CREATED', payload: { customer_id: 'c9' } });
  assert.ok(captured);
  assert.strictEqual(captured.namespace, 'tenant::hpp');
  assert.ok(captured.metadata.canonical_object_id);
  assert.ok(captured.metadata.canonical_hash);
  assert.strictEqual(captured.metadata.namespace, 'tenant::hpp');
});

// ── /ingest route tests ───────────────────────────────────────────────

function startServer(service) {
  const app = express();
  app.use(express.json());
  app.use('/ingest', createIngestRoutes(service));
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function post(port, path, body) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('POST /ingest returns 201 with eventId/objectId/canonicalHash/namespace', async () => {
  const { service } = buildService({ 'review-authority': 'tenant::hpp' });
  const { server, port } = await startServer(service);
  try {
    const resp = await post(port, '/ingest', {
      source: 'review-authority',
      eventType: 'REVIEW_RECEIVED',
      payload: { review_id: 'r10', rating: 5 },
    });
    assert.strictEqual(resp.status, 201);
    const body = await resp.json();
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.eventId);
    assert.ok(body.objectId);
    assert.ok(body.canonicalHash);
    assert.strictEqual(body.namespace, 'tenant::hpp');
  } finally {
    server.close();
  }
});

test('POST /ingest idempotent replay → same eventId', async () => {
  const { service } = buildService();
  const { server, port } = await startServer(service);
  try {
    const payload = { source: 's', eventType: 'OBSERVATION_CREATED', payload: { id: 'obs-1' } };
    const a = await (await post(port, '/ingest', payload)).json();
    const b = await (await post(port, '/ingest', payload)).json();
    assert.strictEqual(a.eventId, b.eventId);
  } finally {
    server.close();
  }
});

test('POST /ingest 400 on missing payload', async () => {
  const { service } = buildService();
  const { server, port } = await startServer(service);
  try {
    const resp = await post(port, '/ingest', { source: 's', eventType: 'REVIEW_RECEIVED' });
    assert.strictEqual(resp.status, 400);
  } finally {
    server.close();
  }
});

test('POST /ingest 400 on invalid namespace', async () => {
  const { service } = buildService();
  const { server, port } = await startServer(service);
  try {
    const resp = await post(port, '/ingest', { source: 's', eventType: 'REVIEW_RECEIVED', payload: {}, namespace: 'bad' });
    assert.strictEqual(resp.status, 400);
  } finally {
    server.close();
  }
});

test('POST /ingest 422 on unregistered event type', async () => {
  const { service } = buildService();
  const { server, port } = await startServer(service);
  try {
    const resp = await post(port, '/ingest', { source: 's', eventType: 'UNREGISTERED_TYPE', payload: {} });
    assert.strictEqual(resp.status, 422);
  } finally {
    server.close();
  }
});

test('CANONICAL_VERSION constant is 1.0.0', () => {
  assert.strictEqual(CANONICAL_VERSION, '1.0.0');
});

test('envelope verifies after canonicalize (tamper detection intact)', async () => {
  const { service } = buildService();
  const result = await service.canonicalizeAndEmit({ source: 's', eventType: 'REVIEW_RECEIVED', payload: { review_id: 't1' } });
  const env = result.envelope;
  env.payload.review_id = 'TAMPERED';
  assert.strictEqual(verifyCanonicalObject(env).valid, false);
});

run();
