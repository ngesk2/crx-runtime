'use strict';

// Synthetic-only compatibility proof against a process-owned disposable schema.
// This does not establish a production owner, issuer or delegated entitlement.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Pool } = require('pg');
const { TenantRegistry } = require('../ping-runtime/runtime/tenant_registry');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { CanonicalEventEnvelope } = require('../gateway/canonical_event_envelope');
const { CustomerAuthority } = require('../ping-runtime/business/customer_authority');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { captureCommissioningBytes, admissionReceiptHandler } = require('../gateway/route_middleware');
const { PostgresAdapter } = require('../gateway/postgres_adapter');
const { GatewayRuntime } = require('../gateway/bootstrap/gateway_runtime');
const C = require('../ping-runtime/runtime/commissioning_contract');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.database, 'admission_proof');
assert.equal(config.host, '127.0.0.1');
const schema = `admitted_commands_${process.pid}`;
const otherSchema = `admitted_commands_other_${process.pid}`;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });
const contexts = new WeakMap();
const records = new Map();
const issuerKeys = crypto.generateKeyPairSync('ed25519');
const signerKeys = crypto.generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const operator = { actor_id: 'synthetic-operator' };
const owner = { actor_id: 'synthetic-owner' };
const agent = { actor_id: 'synthetic-agent' };
const stranger = { actor_id: 'synthetic-stranger' };
const trust = {
  issuers: new Map([['synthetic-issuer', {
    actor_id: operator.actor_id, public_key: pem(issuerKeys), active: true,
  }]]),
  allowedOidcIssuers: new Set(['https://synthetic-oidc.invalid']),
  resolveActor: async value => contexts.get(value) || null,
  resolveVerifiedOidcEvidence: async digest => records.get(digest),
  resolveIndependentBusinessEvidence: async digest => records.get(digest),
  resolveCommissioningConsentEvidence: async digest => records.get(digest),
};
// Shared admission row locks exercise the real race where the first receipt is
// not visible when a second identical command begins authorization.
const registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust,
  commissioningAdmissionLock: 'share' });
const runtime = new UnifiedEventRuntime({ pool });
const envelope = new CanonicalEventEnvelope(pool);
const customers = new CustomerAuthority(pool, envelope, { tenantRegistry: registry, eventRuntime: runtime });
const missions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry: registry });
let server, url, ownedSchema = false, ownedOtherSchema = false, seq = 0;
const delivered = { CUSTOMER_CREATED: 0, CUSTOMER_UPDATED: 0, MISSION_CREATED: 0 };
for (const type of Object.keys(delivered)) runtime.on(type, async () => { delivered[type]++; });

function record(value) {
  const digest = C.digest(C.bytes(value));
  records.set(digest, { ...value, digest, verified: true });
  return digest;
}
function signed(action, body) {
  const issuer_id = 'synthetic-issuer';
  return { issuer_id, body,
    signature: crypto.sign(null, C.bytes({ action, issuer_id, body }), issuerKeys.privateKey).toString('base64') };
}
function actorContext(value) {
  const context = {};
  contexts.set(context, { ...value, verified: true });
  return context;
}

async function provision(operation, suffix) {
  const tenant = `command-proof-${suffix}`;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'Synthetic command proof' });
  const identityDigest = record({ issuer: 'https://synthetic-oidc.invalid', subject: `subject-${suffix}`, actor_id: owner.actor_id });
  const businessDigest = record({ method: 'independent-operator-check', verified_by: 'synthetic-issuer',
    owner_actor_id: owner.actor_id, tenant_id: tenant, controller_id: `controller-${suffix}` });
  const binding = await registry.executeBindVerifiedOwner(actorContext(operator), signed('bind_owner', {
    tenant_id: tenant, controller_id: `controller-${suffix}`,
    identity_evidence_digest: identityDigest, business_evidence_digest: businessDigest,
  }));
  const payload = operation === 'CUSTOMER_UPSERT'
    ? { tenant_id: tenant, customer: { customer_id: `customer-${suffix}`, display_name: 'Authorized customer',
        email: `person-${suffix}@synthetic.invalid` } }
    : { tenant_id: tenant, missionType: 'security-proof', payload: {
        event_id: `mission-event-${suffix}`, namespace: `tenant::${tenant}`,
      }, priority: 7 };
  const resource_id = operation === 'CUSTOMER_UPSERT'
    ? `customer://${tenant}/${payload.customer.customer_id}`
    : `mission://${tenant}/${MissionRuntime.missionIdFor(tenant, payload.missionType, payload.payload)}`;
  const scope = {
    tenant_id: tenant, controller_id: binding.controller_id,
    commissioning_project_id: `project-${suffix}`, site_id: `site-${suffix}`, resource_id,
    delegated_actor: agent.actor_id, authorized_signer: C.keyId(pem(signerKeys)),
    operations: [operation], purpose: 'bounded-command-test',
    valid_from: new Date(Date.now() - 60_000).toISOString(),
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  };
  const consentDigest = record({ owner_binding_id: binding.binding_id, owner_actor_id: owner.actor_id,
    scope_digest: C.digest(C.bytes(scope)) });
  const grant = await registry.executeIssueCommissioningGrant(actorContext(operator), signed('issue_grant', {
    ...scope, owner_binding_id: binding.binding_id, owner_binding_revision: binding.revision,
    signer_public_key: pem(signerKeys), consent_evidence_digest: consentDigest,
  }));
  return { tenant, operation, payload, scope, grant, binding };
}

function submission(f, overrides = {}) {
  const payload = structuredClone(overrides.payload || f.payload);
  const scope = { ...f.scope, ...(overrides.scope || {}) };
  const intentScope = Object.fromEntries(C.SCOPE.map(key => [key, scope[key]]));
  const metadata = { scope: { ...intentScope } };
  const intent = {
    protocol_version: C.PROTOCOL,
    authenticated_actor: overrides.authenticated_actor || agent.actor_id,
    authorized_signer: f.grant.authorized_signer,
    grant_id: overrides.grant_id || f.grant.grant_id,
    grant_revision: overrides.grant_revision || f.grant.revision,
    ...intentScope,
    operation: overrides.operation || f.operation,
    purpose: overrides.purpose || f.scope.purpose,
    payload_digest: '',
    logical_operation_id: overrides.logical_operation_id || `logical-${f.tenant}`,
  };
  intent.payload_digest = C.payloadDigest(payload, metadata);
  return { intent, payload, metadata,
    signature: crypto.sign(null, C.bytes(intent), signerKeys.privateKey).toString('base64') };
}
function resign(s) {
  s.signature = crypto.sign(null, C.bytes(s.intent), signerKeys.privateKey).toString('base64');
  return s;
}

async function startServer() {
  const app = express();
  app.use(express.json({ verify: captureCommissioningBytes }));
  app.use((req, res, next) => {
    const actor = req.get('authorization') === 'Bearer synthetic-agent' ? agent
      : req.get('authorization') === 'Bearer synthetic-stranger' ? stranger : null;
    if (actor) contexts.set(req, { ...actor, verified: true });
    next();
  });
  app.use('/customers', require('../gateway/routes/customers')(customers));
  app.use('/missions', require('../gateway/routes/missions')(missions));
  app.post('/receipt', admissionReceiptHandler(registry));
  server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  url = `http://127.0.0.1:${server.address().port}`;
}
async function post(route, body, auth = 'Bearer synthetic-agent') {
  return fetch(url + route, { method: 'POST', headers: { 'content-type': 'application/json',
    ...(auth ? { authorization: auth } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body) });
}
async function snapshot() {
  const names = (await pool.query('SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename', [schema])).rows;
  const rows = {};
  for (const { tablename } of names) {
    assert.match(tablename, /^[a-z_]+$/);
    rows[tablename] = (await pool.query(`SELECT row_to_json(t) AS row FROM "${tablename}" t ORDER BY row_to_json(t)::text`)).rows;
  }
  return { rows, delivered: { ...delivered } };
}
async function waitForAdvisoryBlocker(blockingPid) {
  for (let attempt = 0; attempt < 250; attempt++) {
    const waiting = await pool.query(`SELECT l.pid FROM pg_locks l
      WHERE l.locktype='advisory' AND NOT l.granted
        AND $1=ANY(pg_blocking_pids(l.pid))`, [blockingPid]);
    if (waiting.rows.length) return waiting.rows[0].pid;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('request never reached a PostgreSQL advisory-lock wait');
}
function receiptQuery(s) {
  return { ...Object.fromEntries(C.SCOPE.map(key => [key, s.intent[key]])),
    logical_operation_id: s.intent.logical_operation_id, operation_digest: C.digest(C.bytes(s.intent)) };
}
function routeFor(operation) { return operation === 'CUSTOMER_UPSERT' ? '/customers' : '/missions'; }
async function proveAccepted(f) {
  const s = submission(f), route = routeFor(f.operation), before = await snapshot();
  const first = await post(route, s);
  assert.equal(first.status, 201, await first.clone().text());
  const accepted = await first.json();
  assert.equal(accepted.status, 'ACCEPTED');
  assert.ok(accepted.receipt.event_id);
  const afterFirst = await snapshot();
  assert.notDeepEqual(afterFirst, before);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM tenant_admission_receipts WHERE logical_operation_id=$1',
    [s.intent.logical_operation_id])).rows[0].n, 1);
  const retry = await post(route, s);
  assert.equal(retry.status, 201, await retry.clone().text());
  assert.deepEqual((await retry.json()).receipt, accepted.receipt);
  assert.deepEqual(await snapshot(), afterFirst, 'identical command retry repeated a mutation or dispatch');
  return { s, accepted, afterFirst };
}

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name, 'ping-admission-proof-20261010');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n, 0,
    'refuse reuse of a non-owned schema');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [otherSchema])).rows[0].n, 0,
    'refuse reuse of a non-owned comparison schema');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  ownedSchema = true;
  await pool.query(`CREATE TABLE tenant_registry (
    tenant_id VARCHAR(64) PRIMARY KEY, name TEXT, domains TEXT[], health_endpoint TEXT,
    metrics_endpoint TEXT, logs_endpoint TEXT, traces_endpoint TEXT, events_endpoint TEXT,
    capabilities TEXT[], metadata JSONB, updated_at TIMESTAMPTZ)`);
  await envelope.initialize();
  await runtime.initialize();
  await registry.initializeCommissioning();
  await customers.initialize();
  await missions.initialize();
  await startServer();
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
  if (ownedOtherSchema) await adminPool.query(`DROP SCHEMA "${otherSchema}" CASCADE`);
  if (ownedSchema) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

test('authorized CUSTOMER_UPSERT inserts once and recovers its receipt from a fresh registry after revocation', async () => {
  const f = await provision('CUSTOMER_UPSERT', `customer-${++seq}`);
  const { s, accepted, afterFirst } = await proveAccepted(f);
  const row = (await pool.query('SELECT tenant_id,customer_id,source,display_name FROM customers WHERE tenant_id=$1', [f.tenant])).rows[0];
  assert.deepEqual(row, { tenant_id: f.tenant, customer_id: f.payload.customer.customer_id, source: 'manual', display_name: 'Authorized customer' });
  const event = (await pool.query('SELECT event_type,payload FROM ping_events WHERE event_id=$1', [accepted.receipt.event_id])).rows[0];
  assert.equal(event.event_type, 'CUSTOMER_CREATED');
  assert.equal(event.payload.customer_id, f.payload.customer.customer_id);
  const update = submission(f, { logical_operation_id: `update-${f.tenant}`,
    payload: { ...f.payload, customer: { ...f.payload.customer, display_name: 'Updated customer' } } });
  const updateResponse = await post('/customers', update);
  assert.equal(updateResponse.status, 201, await updateResponse.clone().text());
  const updateResult = await updateResponse.json();
  assert.equal((await pool.query('SELECT display_name FROM customers WHERE tenant_id=$1 AND customer_id=$2',
    [f.tenant, f.payload.customer.customer_id])).rows[0].display_name, 'Updated customer');
  assert.equal((await pool.query('SELECT event_type FROM ping_events WHERE event_id=$1',
    [updateResult.receipt.event_id])).rows[0].event_type, 'CUSTOMER_UPDATED');
  const createdEvent = (await pool.query('SELECT payload FROM ping_events WHERE event_id=$1',
    [accepted.receipt.event_id])).rows[0].payload;
  const updatedEvent = (await pool.query('SELECT payload FROM ping_events WHERE event_id=$1',
    [updateResult.receipt.event_id])).rows[0].payload;
  assert.deepEqual(createdEvent.command, f.payload);
  assert.deepEqual(updatedEvent.command, update.payload);
  const reconstructed = { ...createdEvent.command.customer };
  for (const [key, value] of Object.entries(updatedEvent.command.customer)) {
    if (key !== 'customer_id' && value != null) reconstructed[key] = value;
  }
  const current = (await pool.query('SELECT customer_id,display_name,email,source FROM customers WHERE tenant_id=$1 AND customer_id=$2',
    [f.tenant, f.payload.customer.customer_id])).rows[0];
  assert.deepEqual({ customer_id: current.customer_id, display_name: current.display_name, email: current.email },
    { customer_id: reconstructed.customer_id, display_name: reconstructed.display_name, email: reconstructed.email });
  assert.equal(current.source, 'manual');
  const mirror = (await pool.query('SELECT payload,metadata,processed,worker FROM canonical_events WHERE event_id=$1',
    [accepted.receipt.compatibility_event_id])).rows[0];
  assert.equal(mirror.processed, true);
  assert.equal(mirror.worker, 'admission-compatibility');
  assert.equal(mirror.payload.ping_event_id, accepted.receipt.event_id);
  assert.equal(mirror.payload.operation_digest, accepted.receipt.operation_digest);
  await registry.executeRevokeCommissioningGrant(actorContext(owner), {
    grant_id: f.grant.grant_id, reason_digest: C.digest(Buffer.from('synthetic revoke')),
  });
  const afterRevocation = await snapshot();
  const denied = await post('/customers', submission(f, { logical_operation_id: 'new-after-revoke' }));
  assert.equal(denied.status, 403);
  const persistedRegistry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust });
  assert.deepEqual(await persistedRegistry.executeGetAdmissionReceipt(actorContext(agent), receiptQuery(s)),
    { status: 'ACCEPTED', receipt: accepted.receipt });
  for (const [label, auth, query] of [
    ['wrong actor', 'Bearer synthetic-stranger', receiptQuery(s)],
    ['wrong scope', 'Bearer synthetic-agent', { ...receiptQuery(s), site_id: 'unrelated-site' }],
  ]) {
    const read = await post('/receipt', query, auth);
    assert.equal(read.status, 200, `${label}: ${await read.clone().text()}`);
    assert.deepEqual(await read.json(), { status: 'UNKNOWN' }, label);
  }
  assert.deepEqual(await snapshot(), afterRevocation, 'denial or receipt recovery performed a mutation');
  assert.equal(afterFirst.rows.tenant_admission_receipts.length, 1);
});

test('authorized MISSION_CREATE retries against existing mission/evidence without duplicate dispatch', async () => {
  const f = await provision('MISSION_CREATE', `mission-${++seq}`);
  const { accepted } = await proveAccepted(f);
  const missionId = MissionRuntime.missionIdFor(f.tenant, f.payload.missionType, f.payload.payload);
  const mission = (await pool.query('SELECT mission_id,mission_type,payload,priority,created_by,tenant_id FROM ping_missions WHERE mission_id=$1', [missionId])).rows[0];
  assert.equal(mission.created_by, agent.actor_id);
  assert.equal(mission.tenant_id, f.tenant);
  const evidence = (await pool.query("SELECT event_type,payload FROM ping_events WHERE event_id=$1", [accepted.receipt.event_id])).rows[0];
  assert.equal(evidence.event_type, 'MISSION_CREATED');
  assert.equal(evidence.payload.missionId, missionId);
  const newLogicalRetry = submission(f, { logical_operation_id: `same-mission-${f.tenant}` });
  const before = await snapshot();
  const additional = await post('/missions', newLogicalRetry);
  assert.equal(additional.status, 201, await additional.clone().text());
  const additionalReceipt = (await additional.json()).receipt;
  assert.equal(additionalReceipt.command_result.mission_id, missionId);
  const duplicate = await post('/missions', newLogicalRetry);
  assert.equal(duplicate.status, 201, await duplicate.clone().text());
  assert.deepEqual((await duplicate.json()).receipt, additionalReceipt);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM ping_events WHERE event_type=$1 AND payload->>\'missionId\'=$2',
    ['MISSION_CREATED', missionId])).rows[0].n, 1);
  assert.equal((await snapshot()).rows.ping_missions.length, before.rows.ping_missions.length);
});

test('concurrent identical CUSTOMER_UPSERT submissions commit one customer and one admitted event', async () => {
  const f = await provision('CUSTOMER_UPSERT', `concurrent-${++seq}`);
  const s = submission(f);
  const before = await snapshot();
  const responses = await Promise.all(Array.from({ length: 2 }, () => post('/customers', s)));
  const bodies = await Promise.all(responses.map(async response => {
    const text = await response.clone().text();
    assert.equal(response.status, 201, text);
    return response.json();
  }));
  assert.deepEqual(bodies[0].receipt, bodies[1].receipt);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM customers WHERE tenant_id=$1 AND customer_id=$2',
    [f.tenant, f.payload.customer.customer_id])).rows[0].n, 1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM ping_events WHERE event_type='CUSTOMER_CREATED' AND payload->>'customer_id'=$1",
    [f.payload.customer.customer_id])).rows[0].n, 1);
  const allCustomerEvents = (await pool.query(`SELECT event_type,payload FROM ping_events
    WHERE tenant_id=$1 AND payload->>'customer_id'=$2 ORDER BY event_type`,
    [f.tenant, f.payload.customer.customer_id])).rows;
  assert.equal(allCustomerEvents.length, 1, 'concurrent duplicate caused an unaccounted customer update');
  assert.equal(allCustomerEvents[0].event_type, 'CUSTOMER_CREATED');
  assert.deepEqual(allCustomerEvents[0].payload.command, f.payload);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM canonical_events WHERE tenant_id=$1 AND payload->>'customer_id'=$2",
    [f.tenant, f.payload.customer.customer_id])).rows[0].n, 1);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM tenant_admission_receipts WHERE tenant_id=$1 AND logical_operation_id=$2',
    [f.tenant, s.intent.logical_operation_id])).rows[0].n, 1);
  const after = await snapshot();
  assert.equal(after.delivered.CUSTOMER_CREATED - before.delivered.CUSTOMER_CREATED, 1);
  assert.equal(after.delivered.CUSTOMER_UPDATED - before.delivered.CUSTOMER_UPDATED, 0);
});

test('unrelated actor, tenant/resource scope, digest tampering and caller-createdBy fail without state change', async () => {
  const f = await provision('MISSION_CREATE', `denial-${++seq}`);
  const cases = [
    ['unrelated actor', submission(f), 'Bearer synthetic-stranger'],
    ['wrong payload tenant', submission(f, { payload: { ...f.payload, tenant_id: f.tenant + '-other' } })],
    ['wrong intent tenant', submission(f, { scope: { tenant_id: f.tenant + '-other' } })],
    ['wrong controller', submission(f, { scope: { controller_id: 'other-controller' } })],
    ['wrong commissioning project', submission(f, { scope: { commissioning_project_id: 'other-project' } })],
    ['wrong site', submission(f, { scope: { site_id: 'other-site' } })],
    ['wrong resource', submission(f, { scope: { resource_id: 'mission://other/not-this-mission' } })],
    ['caller-createdBy', submission(f, { payload: { ...f.payload, createdBy: 'synthetic-owner' } })],
    ['unsupported business field', submission(f, { payload: { ...f.payload, bodyActor: 'synthetic-owner' } })],
  ];
  for (const [label, signedBody, auth] of cases) {
    const before = await snapshot();
    const response = await post('/missions', signedBody, auth);
    assert.ok(response.status >= 400 && response.status < 500, `${label}: ${response.status} ${await response.text()}`);
    assert.deepEqual(await snapshot(), before, label);
  }
  const valid = submission(f);
  const tampered = { ...valid, payload: { ...valid.payload, priority: 99 } };
  const before = await snapshot();
  const response = await post('/missions', tampered);
  assert.ok(response.status >= 400 && response.status < 500);
  assert.deepEqual(await snapshot(), before, 'payload digest/signature tampering');
});

test('missing command signature rejects without changing rows, events, receipts or dispatch', async () => {
  const f = await provision('CUSTOMER_UPSERT', `missing-signature-${++seq}`);
  const body = submission(f); delete body.signature;
  const before = await snapshot();
  const response = await post('/customers', body);
  assert.equal(response.status, 400, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
});

test('invalid command signature rejects without changing rows, events, receipts or dispatch', async () => {
  const f = await provision('MISSION_CREATE', `invalid-signature-${++seq}`);
  const body = submission(f); body.signature = Buffer.alloc(64, 0x5a).toString('base64');
  const before = await snapshot();
  const response = await post('/missions', body);
  assert.equal(response.status, 400, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
});

test('a signed command rejects when its canonical payload bytes change before arrival', async () => {
  const f = await provision('CUSTOMER_UPSERT', `changed-payload-${++seq}`);
  const body = submission(f);
  body.payload.customer.display_name = 'Changed after signature';
  const before = await snapshot();
  const response = await post('/customers', body);
  assert.ok(response.status >= 400 && response.status < 500, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
});

test('expired typed command grant and unsupported operation reject before effects', async () => {
  const f = await provision('CUSTOMER_UPSERT', `expired-${++seq}`);
  await pool.query("UPDATE tenant_commissioning_grants SET expires_at=clock_timestamp()-interval '1 second' WHERE grant_id=$1",
    [f.grant.grant_id]);
  const expiredBefore = await snapshot();
  const expired = await post('/customers', submission(f));
  assert.equal(expired.status, 403, await expired.clone().text());
  assert.deepEqual(await snapshot(), expiredBefore);

  const active = await provision('MISSION_CREATE', `unsupported-${++seq}`);
  const unsupported = submission(active, { operation: 'OBJECT_CREATED' });
  resign(unsupported);
  const before = await snapshot();
  const response = await post('/missions', unsupported);
  assert.ok(response.status >= 400 && response.status < 500, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
});

test('typed-command duplicate wire fields reject with zero persisted effect', async () => {
  const f = await provision('MISSION_CREATE', `duplicate-wire-${++seq}`);
  const body = JSON.stringify(submission(f)).replace('"intent":{', '"intent":{},"intent":{');
  const before = await snapshot();
  const response = await post('/missions', body);
  assert.ok(response.status >= 400 && response.status < 500, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
});

test('same logical command ID with changed signed bytes conflicts without replaying effects', async () => {
  const f = await provision('CUSTOMER_UPSERT', `logical-conflict-${++seq}`);
  const original = submission(f);
  const first = await post('/customers', original);
  assert.equal(first.status, 201, await first.clone().text());
  const accepted = (await first.json()).receipt;
  const changed = submission(f, { payload: { ...f.payload,
    customer: { ...f.payload.customer, display_name: 'Different bytes' } } });
  const before = await snapshot();
  const response = await post('/customers', changed);
  assert.equal(response.status, 403, await response.clone().text());
  assert.deepEqual(await snapshot(), before);
  assert.equal((await pool.query('SELECT receipt FROM tenant_admission_receipts WHERE tenant_id=$1 AND logical_operation_id=$2',
    [f.tenant, original.intent.logical_operation_id])).rows[0].receipt.operation_digest, accepted.operation_digest);
});

test('a real OBJECT grant cannot authorize CUSTOMER_UPSERT or MISSION_CREATE', async () => {
  const tenant = `command-object-${++seq}`;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'Synthetic object-grant fixture' });
  const identity = record({ issuer: 'https://synthetic-oidc.invalid', subject: tenant, actor_id: owner.actor_id });
  const business = record({ method: 'independent-operator-check', verified_by: 'synthetic-issuer', owner_actor_id: owner.actor_id,
    tenant_id: tenant, controller_id: `controller-${tenant}` });
  const binding = await registry.executeBindVerifiedOwner(actorContext(operator), signed('bind_owner', {
    tenant_id: tenant, controller_id: `controller-${tenant}`, identity_evidence_digest: identity, business_evidence_digest: business,
  }));
  const scope = { tenant_id: tenant, controller_id: binding.controller_id, commissioning_project_id: `project-${tenant}`,
    site_id: `site-${tenant}`, resource_id: `object-${tenant}`, delegated_actor: agent.actor_id,
    authorized_signer: C.keyId(pem(signerKeys)), operations: ['OBJECT_CREATED'], purpose: 'object-only',
    valid_from: new Date(Date.now() - 60_000).toISOString(), expires_at: new Date(Date.now() + 3_600_000).toISOString() };
  const consent = record({ owner_binding_id: binding.binding_id, owner_actor_id: owner.actor_id, scope_digest: C.digest(C.bytes(scope)) });
  const grant = await registry.executeIssueCommissioningGrant(actorContext(operator), signed('issue_grant', {
    ...scope, owner_binding_id: binding.binding_id, owner_binding_revision: binding.revision,
    signer_public_key: pem(signerKeys), consent_evidence_digest: consent,
  }));
  const fCommand = await provision('CUSTOMER_UPSERT', `separate-${++seq}`);
  const s = submission(fCommand, { grant_id: grant.grant_id, grant_revision: grant.revision,
    scope: { ...fCommand.scope, ...Object.fromEntries(C.SCOPE.map(key => [key, grant[key]])) } });
  // Even a correctly signed command cannot be admitted by executeWithCommissioningGrant,
  // whose parser/allowlist remains exclusively for OBJECT operations.
  const before = await snapshot();
  await assert.rejects(() => registry.executeWithCommissioningGrant(actorContext(agent), s, async () => {
    assert.fail('OBJECT grant reached command callback');
  }), error => ['invalid_intent', 'invalid_operation', 'resource_scope_mismatch'].includes(error.code));
  assert.deepEqual(await snapshot(), before);
});

test('separate legacy PostgresAdapter pool is admitted only when gateway proves the same physical customer and mirror tables', async () => {
  const f = await provision('CUSTOMER_UPSERT', `adapter-same-${++seq}`);
  const adapter = new PostgresAdapter({ ...config, options: `-c search_path=${schema}` });
  await adapter.initialize();
  try {
    const gateway = new GatewayRuntime(pool, { commissioningTrust: trust });
    const identity = await gateway._verifyCustomerAdmissionStorage(adapter, registry);
    assert.ok(identity, 'same physical schema must be accepted by the actual bootstrap verifier');
    assert.equal(identity.storage, adapter);
    assert.equal(identity.admissionPool, pool);
    const separateEnvelope = new CanonicalEventEnvelope(adapter);
    const authority = new CustomerAuthority(adapter, separateEnvelope, {
      tenantRegistry: registry, eventRuntime: runtime, admissionStorageIdentity: identity,
    });
    const before = await snapshot();
    const result = await authority.executeAdmittedUpsert(actorContext(agent), submission(f));
    assert.equal(result.commandResult.customer_id, f.payload.customer.customer_id);
    assert.ok(result.receipt.event_id);
    assert.notDeepEqual(await snapshot(), before);
    assert.equal((await pool.query('SELECT customer_id FROM customers WHERE tenant_id=$1', [f.tenant])).rows[0].customer_id,
      f.payload.customer.customer_id);
    const mirror = (await pool.query('SELECT payload,processed,worker FROM canonical_events WHERE event_id=$1',
      [result.receipt.compatibility_event_id])).rows[0];
    assert.equal(mirror.processed, true);
    assert.equal(mirror.worker, 'admission-compatibility');
    assert.equal(mirror.payload.ping_event_id, result.receipt.event_id);
  } finally {
    await adapter.close();
  }
});

test('different customer and canonical mirror relations fail closed without business/event/receipt writes', async () => {
  await adminPool.query(`CREATE SCHEMA "${otherSchema}"`);
  ownedOtherSchema = true;
  const adapter = new PostgresAdapter({ ...config, options: `-c search_path=${otherSchema}` });
  await adapter.initialize();
  try {
    await adapter.query('CREATE TABLE customers (customer_id TEXT)');
    await adapter.query('CREATE TABLE canonical_events (event_id TEXT)');
    const gateway = new GatewayRuntime(pool, { commissioningTrust: trust });
    const identity = await gateway._verifyCustomerAdmissionStorage(adapter, registry);
    assert.equal(identity, null, 'different relation OIDs must fail bootstrap verification');
    const f = await provision('CUSTOMER_UPSERT', `adapter-other-${++seq}`);
    const authority = new CustomerAuthority(adapter, new CanonicalEventEnvelope(adapter), {
      tenantRegistry: registry, eventRuntime: runtime, admissionStorageIdentity: identity,
    });
    const before = await snapshot();
    await assert.rejects(() => authority.executeAdmittedUpsert(actorContext(agent), submission(f)),
      error => error.code === 'commissioning_pool_mismatch');
    assert.deepEqual(await snapshot(), before);
    assert.equal((await adapter.query('SELECT count(*)::int AS n FROM customers')).rows[0].n, 0);
    assert.equal((await adapter.query('SELECT count(*)::int AS n FROM canonical_events')).rows[0].n, 0);
  } finally {
    await adapter.close();
  }
});

test('stale relation OID attestation fails inside the admitted transaction before customer SQL or event append', async () => {
  const f = await provision('CUSTOMER_UPSERT', `adapter-stale-${++seq}`);
  const adapter = new PostgresAdapter({ ...config, options: `-c search_path=${schema}` });
  await adapter.initialize();
  try {
    const gateway = new GatewayRuntime(pool, { commissioningTrust: trust });
    const identity = await gateway._verifyCustomerAdmissionStorage(adapter, registry);
    assert.ok(identity);
    const tamperedIdentity = Object.freeze({ ...identity, customers_oid: identity.customers_oid + 1 });
    const authority = new CustomerAuthority(adapter, new CanonicalEventEnvelope(adapter), {
      tenantRegistry: registry, eventRuntime: runtime, admissionStorageIdentity: tamperedIdentity,
    });
    const before = await snapshot();
    await assert.rejects(() => authority.executeAdmittedUpsert(actorContext(agent), submission(f)),
      error => error.code === 'commissioning_pool_mismatch');
    assert.deepEqual(await snapshot(), before);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM customers WHERE tenant_id=$1', [f.tenant])).rows[0].n, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM tenant_admission_receipts WHERE tenant_id=$1', [f.tenant])).rows[0].n, 0);
  } finally {
    await adapter.close();
  }
});

test('grant expiring while waiting on the logical-operation advisory lock is denied using database time', async () => {
  const f = await provision('CUSTOMER_UPSERT', `expiry-lock-${++seq}`);
  const s = submission(f);
  const holder = await pool.connect();
  let holderOpen = false;
  try {
    await holder.query('BEGIN');
    holderOpen = true;
    const holderPid = (await holder.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    const logicalLockKey = JSON.stringify([s.intent.tenant_id, s.intent.authenticated_actor, s.intent.logical_operation_id]);
    await holder.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',
      ['commissioning-logical-operation', logicalLockKey]);
    const expiry = (await pool.query(`UPDATE tenant_commissioning_grants
      SET expires_at=clock_timestamp()+interval '2 seconds' WHERE grant_id=$1 RETURNING expires_at`,
      [f.grant.grant_id])).rows[0].expires_at;
    const before = await snapshot();
    const pending = post('/customers', s);
    const waitingPid = await waitForAdvisoryBlocker(holderPid);
    const atWait = (await pool.query('SELECT clock_timestamp() AS now')).rows[0].now;
    assert.ok(atWait < expiry, 'grant should still be active when the admission is observed waiting');
    // Database-derived duration keeps the waiter blocked until after its grant
    // expires; no application-clock sleep assumption controls the decision.
    await holder.query(`SELECT pg_sleep(GREATEST(0.05, EXTRACT(EPOCH FROM ($1::timestamptz-clock_timestamp()))+0.1))`, [expiry]);
    const afterExpiry = (await pool.query('SELECT clock_timestamp() AS now')).rows[0].now;
    assert.ok(afterExpiry >= expiry, 'holder released before the database grant expiry');
    await holder.query('COMMIT');
    holderOpen = false;
    const response = await pending;
    assert.equal(response.status, 403, await response.clone().text());
    assert.deepEqual(await snapshot(), before, `waiter ${waitingPid} mutated state after expiry`);
  } finally {
    if (holderOpen) { try { await holder.query('ROLLBACK'); } catch (_) {} }
    holder.release();
  }
});
