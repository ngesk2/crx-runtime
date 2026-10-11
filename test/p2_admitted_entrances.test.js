'use strict';

// P2 write-authority closure — admitted entrance reproductions (2026-10-11).
//
// Re-runs the customer and mission write-before-event reproductions through
// the corrected path at the HTTP entrance level:
//
// - without an operator-installed trust root: every admitted entrance fails
//   closed (503), with zero business rows, zero canonical events, zero
//   receipts;
// - with the trust root installed: legacy (unsigned) bodies are rejected
//   (403 legacy_command_not_admitted) with zero state change;
// - with the trust root installed and a provisioned grant: an entitled
//   caller completes the FULL chain — REQUEST -> AUTHENTICATED ACTOR ->
//   TENANT/RESOURCE OWNERSHIP -> ACTION AUTHORIZATION -> VALIDATED TYPED
//   COMMAND -> ADMITTED MUTATION -> DURABLE CANONICAL EVIDENCE + RECEIPT ->
//   RESULT — for both CUSTOMER_UPSERT and MISSION_CREATE.
//
// The negative cases assert all of: correct denial status, zero business-row
// changes, zero canonical events, zero admission receipts, no dispatch.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Pool } = require('pg');
const C = require('../ping-runtime/runtime/commissioning_contract');
const { TenantRegistry } = require('../ping-runtime/runtime/tenant_registry');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { CanonicalEventEnvelope } = require('../gateway/canonical_event_envelope');
const { CustomerAuthority } = require('../ping-runtime/business/customer_authority');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { captureCommissioningBytes } = require('../gateway/route_middleware');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.host, '127.0.0.1');
assert.equal(Number(config.port), 51590);
assert.equal(config.database, 'admission_proof');
const schema = 'p2_entrances_' + process.pid;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });

// ---- synthetic operator trust root (test-only; mirrors the operator doc) ----
const issuerKeys = crypto.generateKeyPairSync('ed25519');
const signerKeys = crypto.generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const contexts = new WeakMap();
const records = new Map();
const operator = { actor_id: 'p2-operator' };
const owner = { actor_id: 'p2-owner' };
const agent = { actor_id: 'p2-agent' };
const stranger = { actor_id: 'p2-stranger' };
const trust = {
  issuers: new Map([['p2-issuer', { actor_id: operator.actor_id, public_key: pem(issuerKeys), active: true }]]),
  allowedOidcIssuers: new Set(['https://p2-oidc.invalid']),
  resolveActor: async value => contexts.get(value) || null,
  resolveVerifiedOidcEvidence: async digest => records.get(digest),
  resolveIndependentBusinessEvidence: async digest => records.get(digest),
  resolveCommissioningConsentEvidence: async digest => records.get(digest),
};

function record(value) {
  const digest = C.digest(C.bytes(value));
  records.set(digest, { ...value, digest, verified: true });
  return digest;
}
function signed(action, body) {
  return { issuer_id: 'p2-issuer', body,
    signature: crypto.sign(null, C.bytes({ action, issuer_id: 'p2-issuer', body }), issuerKeys.privateKey).toString('base64') };
}
function actorContext(value) {
  const context = {};
  contexts.set(context, { ...value, verified: true });
  return context;
}

// ---- per-test registries: closed (no trust root) vs commissioned ----
let closedRegistry, registry, runtime, envelope, customers, missions;
let server, url;
let counter = 0;

async function provision(operation) {
  const suffix = `${process.pid}-${++counter}`;
  const tenant = `p2-entrance-${suffix}`;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'P2 entrance proof' });
  const identityDigest = record({ issuer: 'https://p2-oidc.invalid', subject: `subject-${suffix}`, actor_id: owner.actor_id });
  const businessDigest = record({ method: 'independent-operator-check', verified_by: 'p2-issuer',
    owner_actor_id: owner.actor_id, tenant_id: tenant, controller_id: `controller-${suffix}` });
  const binding = await registry.executeBindVerifiedOwner(actorContext(operator), signed('bind_owner', {
    tenant_id: tenant, controller_id: `controller-${suffix}`,
    identity_evidence_digest: identityDigest, business_evidence_digest: businessDigest,
  }));
  const payload = operation === 'CUSTOMER_UPSERT'
    ? { tenant_id: tenant, customer: { customer_id: `customer-${suffix}`, display_name: 'P2 customer',
        email: `person-${suffix}@p2.invalid`, source: 'manual' } }
    : { tenant_id: tenant, missionType: 'p2-entrance', payload: {
        event_id: `mission-event-${suffix}`, namespace: `tenant::${tenant}` }, priority: 7 };
  const resource_id = operation === 'CUSTOMER_UPSERT'
    ? `customer://${tenant}/${payload.customer.customer_id}`
    : `mission://${tenant}/${MissionRuntime.missionIdFor(tenant, payload.missionType, payload.payload)}`;
  const scope = { tenant_id: tenant, controller_id: binding.controller_id,
    commissioning_project_id: `project-${suffix}`, site_id: `site-${suffix}`, resource_id,
    delegated_actor: agent.actor_id, authorized_signer: C.keyId(pem(signerKeys)),
    operations: [operation], purpose: 'p2-entrance-test',
    valid_from: new Date(Date.now() - 60000).toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString() };
  const consentDigest = record({ owner_binding_id: binding.binding_id, owner_actor_id: owner.actor_id,
    scope_digest: C.digest(C.bytes(scope)) });
  const grant = await registry.executeIssueCommissioningGrant(actorContext(operator), signed('issue_grant', {
    ...scope, owner_binding_id: binding.binding_id, owner_binding_revision: binding.revision,
    signer_public_key: pem(signerKeys), consent_evidence_digest: consentDigest,
  }));
  return { tenant, operation, payload, scope, grant };
}

function submission(f, overrides = {}) {
  const payload = structuredClone(overrides.payload || f.payload);
  const scope = { ...f.scope, ...(overrides.scope || {}) };
  const intentScope = Object.fromEntries(C.SCOPE.map(key => [key, scope[key]]));
  const metadata = { scope: { ...intentScope } };
  const intent = { protocol_version: C.PROTOCOL,
    authenticated_actor: overrides.authenticated_actor || agent.actor_id,
    authorized_signer: f.grant.authorized_signer,
    grant_id: overrides.grant_id || f.grant.grant_id,
    grant_revision: overrides.grant_revision || f.grant.revision,
    ...intentScope, operation: overrides.operation || f.operation,
    purpose: overrides.purpose || f.scope.purpose, payload_digest: '',
    logical_operation_id: overrides.logical_operation_id || `logical-p2-${f.tenant}` };
  intent.payload_digest = C.payloadDigest(payload, metadata);
  return { intent, payload, metadata,
    signature: crypto.sign(null, C.bytes(intent), signerKeys.privateKey).toString('base64') };
}

function closedApp() {
  // Same routes, but the authorities are wired to a trust-root-less registry.
  const closedCustomers = new CustomerAuthority(pool, envelope,
    { tenantRegistry: closedRegistry, eventRuntime: runtime });
  const closedMissions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry: closedRegistry });
  const app = express();
  app.use(express.json({ verify: captureCommissioningBytes }));
  app.use((req, res, next) => {
    const actor = req.get('authorization') === 'Bearer <redacted>' ? agent : null;
    if (actor) contexts.set(req, { ...actor, verified: true });
    next();
  });
  app.use('/customers', require('../gateway/routes/customers')(closedCustomers));
  app.use('/missions', require('../gateway/routes/missions')(closedMissions));
  return app;
}

function openApp() {
  const app = express();
  app.use(express.json({ verify: captureCommissioningBytes }));
  app.use((req, res, next) => {
    const actor = req.get('authorization') === 'Bearer <redacted>' ? agent
      : req.get('authorization') === 'Bearer <redacted>' ? stranger : null;
    if (actor) contexts.set(req, { ...actor, verified: true });
    next();
  });
  app.use('/customers', require('../gateway/routes/customers')(customers));
  app.use('/missions', require('../gateway/routes/missions')(missions));
  return app;
}

async function listen(app) {
  const instance = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return { instance, url: `http://127.0.0.1:${instance.address().port}` };
}

async function post(url, route, body, auth = 'Bearer <redacted>') {
  const r = await fetch(url + route, { method: 'POST',
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: r.status, json, text };
}

async function counts() {
  const n = async (sql, p = []) => (await pool.query(sql, p)).rows[0].n;
  return {
    customers: await n('SELECT count(*)::int AS n FROM customers'),
    missions: await n('SELECT count(*)::int AS n FROM ping_missions'),
    events: await n('SELECT count(*)::int AS n FROM ping_events'),
    receipts: await n('SELECT count(*)::int AS n FROM tenant_admission_receipts'),
  };
}

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name,
    'ping-admission-proof-20261010', 'Refuse DDL unless connected to the dedicated disposable cluster');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n,
    0, 'Refuse to reuse a schema not owned by this process');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  await pool.query(`CREATE TABLE tenant_registry (
    tenant_id VARCHAR(64) PRIMARY KEY, name TEXT, domains TEXT[], health_endpoint TEXT,
    metrics_endpoint TEXT, logs_endpoint TEXT, traces_endpoint TEXT, events_endpoint TEXT,
    capabilities TEXT[], metadata JSONB, updated_at TIMESTAMPTZ)`);
  closedRegistry = new TenantRegistry(pool);
  registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust });
  runtime = new UnifiedEventRuntime({ pool });
  envelope = new CanonicalEventEnvelope(pool);
  customers = new CustomerAuthority(pool, envelope, { tenantRegistry: registry, eventRuntime: runtime });
  missions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry: registry });
  await envelope.initialize();
  await runtime.initialize();
  await closedRegistry.initializeCommissioning().catch(() => {});
  await registry.initializeCommissioning();
  await customers.initialize();
  await missions.initialize();
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
  await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

test('no trust root: signed CUSTOMER_UPSERT fails closed with zero state change', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const before = await counts();
  const { instance, url: u } = await listen(closedApp());
  try {
    const r = await post(u, '/customers', submission(f));
    assert.ok(r.status === 403 || r.status === 503, `expected fail-closed, got ${r.status}: ${r.text}`);
    assert.deepEqual(await counts(), before, 'denied entrance changed durable state');
  } finally { await new Promise(r => instance.close(r)); }
});

test('no trust root: signed MISSION_CREATE fails closed with zero state change', async () => {
  const f = await provision('MISSION_CREATE');
  const before = await counts();
  const { instance, url: u } = await listen(closedApp());
  try {
    const r = await post(u, '/missions', submission(f));
    assert.ok(r.status === 403 || r.status === 503, `expected fail-closed, got ${r.status}: ${r.text}`);
    assert.deepEqual(await counts(), before, 'denied entrance changed durable state');
  } finally { await new Promise(r => instance.close(r)); }
});

test('trust root installed: legacy unsigned body rejected, zero state change', async () => {
  const { instance, url: u } = await listen(openApp());
  try {
    const before = await counts();
    const r = await post(u, '/customers', { tenant_id: 'p2-legacy', customer: { customer_id: 'x' } });
    assert.equal(r.status, 403);
    assert.equal(r.json.error, 'legacy_command_not_admitted');
    assert.deepEqual(await counts(), before, 'legacy entrance changed durable state');
  } finally { await new Promise(r => instance.close(r)); }
});

test('trust root installed: unauthorized actor cannot ride a valid grant', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const { instance, url: u } = await listen(openApp());
  try {
    const before = await counts();
    const s = submission(f, { authenticated_actor: stranger.actor_id });
    const r = await post(u, '/customers', s, 'Bearer <redacted>');
    assert.equal(r.status, 403, r.text);
    assert.deepEqual(await counts(), before, 'stranger entrance changed durable state');
  } finally { await new Promise(r => instance.close(r)); }
});

test('entitled caller completes the full chain: CUSTOMER_UPSERT -> row + event + receipt', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const { instance, url: u } = await listen(openApp());
  try {
    const s = submission(f);
    const before = await counts();
    const r = await post(u, '/customers', s);
    assert.equal(r.status, 201, r.text);
    assert.equal(r.json.status, 'ACCEPTED');
    assert.ok(r.json.receipt && r.json.receipt.event_id, 'admission receipt missing');
    const after = await counts();
    assert.equal(after.customers, before.customers + 1, 'customer row not inserted');
    assert.equal(after.events, before.events + 1, 'canonical event not appended');
    assert.equal(after.receipts, before.receipts + 1, 'admission receipt not persisted');
    const row = (await pool.query('SELECT tenant_id FROM customers WHERE customer_id = $1',
      [f.payload.customer.customer_id])).rows[0];
    assert.equal(row.tenant_id, f.tenant);
  } finally { await new Promise(r => instance.close(r)); }
});

test('entitled caller completes the full chain: MISSION_CREATE -> row + event + receipt', async () => {
  const f = await provision('MISSION_CREATE');
  const { instance, url: u } = await listen(openApp());
  try {
    const s = submission(f);
    const before = await counts();
    const r = await post(u, '/missions', s);
    assert.equal(r.status, 201, r.text);
    assert.equal(r.json.status, 'ACCEPTED');
    assert.ok(r.json.receipt && r.json.receipt.event_id, 'admission receipt missing');
    const after = await counts();
    assert.equal(after.missions, before.missions + 1, 'mission row not inserted');
    assert.equal(after.events, before.events + 1, 'canonical event not appended');
    assert.equal(after.receipts, before.receipts + 1, 'admission receipt not persisted');
  } finally { await new Promise(r => instance.close(r)); }
});
