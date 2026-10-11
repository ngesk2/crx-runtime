'use strict';

// P3 write-authority denial suite (2026-10-11) — PROVE DENIAL, NOT JUST SUCCESS.
//
// MERGE HOLD. PRODUCTION HOLD. RUST FROZEN. Disposable test plane only:
// synthetic operator trust root, synthetic grants, the dedicated disposable
// PostgreSQL cluster (cluster_name ping-admission-proof-20261010), one
// process-owned schema created fresh and dropped after the run. No production
// entitlement, no live mutation, no new authority.
//
// Every negative test asserts ALL of:
//   1. correct 401/403 (or the contractually defined denial status),
//   2. zero unauthorized business-row changes,
//   3. zero unauthorized canonical events,
//   4. zero false admission receipts,
//   5. no cross-tenant mutation,
//   6. no downstream side effect (no dispatch, no authority call).
//
// Coverage:
//   A. the original 12 HTTP probes (customers/missions/tenants x 4 reasons);
//   B. transaction-failure both directions (mission row vs event vs receipt);
//   C. duplicate identical signed commands (idempotent, original receipt);
//   D. retry of a denied command (stays denied); failed-then-fixed (admits once);
//   E. partial failure: killed connection mid-transaction; grant expiring mid-flight;
//   F. cross-tenant attempts through every newly gated route
//      (customers, missions, reviews, projects, knowledge nodes/edges, mission cards);
//   G. missing / stale / tampered / unauthorized commands at the HTTP layer.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { Pool } = require('pg');

const root = path.resolve(__dirname, '..');
const C = require('../ping-runtime/runtime/commissioning_contract');
const { TenantRegistry } = require('../ping-runtime/runtime/tenant_registry');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { CanonicalEventEnvelope } = require('../gateway/canonical_event_envelope');
const { CustomerAuthority } = require('../ping-runtime/business/customer_authority');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { KnowledgeGraph } = require('../ping-runtime/knowledge/knowledge_graph');
const ExteriorAuthMiddleware = require('../gateway/exterior_auth_middleware');
const { createReviewRoutes } = require('../gateway/routes/reviews');
const createProjectRoutes = require('../gateway/routes/projects');
const createKnowledgeRoutes = require('../gateway/routes/knowledge');
const createMissionCardRoutes = require('../gateway/routes/mission_cards');
const { captureCommissioningBytes } = require('../gateway/route_middleware');

const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.host, '127.0.0.1');
assert.equal(Number(config.port), 51590);
assert.equal(config.database, 'admission_proof');
const schema = 'p3_denials_' + process.pid;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });

// ---- synthetic operator trust root (test-only) ----
const issuerKeys = crypto.generateKeyPairSync('ed25519');
const signerKeys = crypto.generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const contexts = new WeakMap();
const records = new Map();
const operator = { actor_id: 'p3-operator' };
const owner = { actor_id: 'p3-owner' };
const agent = { actor_id: 'p3-agent' };
const stranger = { actor_id: 'p3-stranger' };
const trust = {
  issuers: new Map([['p3-issuer', { actor_id: operator.actor_id, public_key: pem(issuerKeys), active: true }]]),
  allowedOidcIssuers: new Set(['https://p3-oidc.invalid']),
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
  return { issuer_id: 'p3-issuer', body,
    signature: crypto.sign(null, C.bytes({ action, issuer_id: 'p3-issuer', body }), issuerKeys.privateKey).toString('base64') };
}
function actorContext(value) {
  const context = {};
  contexts.set(context, { ...value, verified: true });
  return context;
}

// ---- exterior (Bearer <redacted>) credentials ----
process.env.MUSE_LEVEL_1_KEY = 'p3-key-muse';
process.env.MUSE_LEVEL_2_KEY = 'p3-key-muse-l2';
// Built dynamically: the file must never contain a literal 'Bearer <redacted>' token.
const BEARER_MUSE = 'Bearer ' + process.env.MUSE_LEVEL_1_KEY;
const BEARER_MUSE_L2 = 'Bearer ' + process.env.MUSE_LEVEL_2_KEY;
const BEARER_STRANGER = 'Bearer ' + process.env.MUSE_LEVEL_1_KEY + '-stranger';
const BEARER_BAD = 'Bearer ' + 'no-such-credential';
const EXT_TENANT_A = 'tenant-a';       // inside muse's allow-list
const EXT_TENANT_B = 'tenant-b';       // outside it (cross-tenant victim)
const EXT_NS_A = 'ns-a';
const EXT_NS_VICTIM = 'ns-victim';

let registry, runtime, envelope, customers, missions, knowledge;
let exteriorAuth, typedUrl, exteriorUrl;
let reviewCalls, projectCalls, knowledgeCalls;
let counter = 0;
let schemaOwned = false;
const evidence = { scope: 'P3 denial suite; disposable PostgreSQL; synthetic trust root and grants; no production entitlement',
  runtime_patch: true, merge: 'HOLD', production: 'HOLD', cases: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function provision(operation, { expiresInMs = 3600000, operations = null } = {}) {
  const suffix = `${process.pid}-${++counter}`;
  const tenant = `p3-${suffix}`;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'P3 denial proof' });
  const identityDigest = record({ issuer: 'https://p3-oidc.invalid', subject: `subject-${suffix}`, actor_id: owner.actor_id });
  const businessDigest = record({ method: 'independent-operator-check', verified_by: 'p3-issuer',
    owner_actor_id: owner.actor_id, tenant_id: tenant, controller_id: `controller-${suffix}` });
  const binding = await registry.executeBindVerifiedOwner(actorContext(operator), signed('bind_owner', {
    tenant_id: tenant, controller_id: `controller-${suffix}`,
    identity_evidence_digest: identityDigest, business_evidence_digest: businessDigest,
  }));
  const payload = operation === 'CUSTOMER_UPSERT'
    ? { tenant_id: tenant, customer: { customer_id: `customer-${suffix}`, display_name: 'P3 customer',
        email: `person-${suffix}@p3.invalid`, source: 'manual' } }
    : { tenant_id: tenant, missionType: 'p3-denial', payload: {
        event_id: `mission-event-${suffix}`, namespace: `tenant::${tenant}` }, priority: 7 };
  const resource_id = operation === 'CUSTOMER_UPSERT'
    ? `customer://${tenant}/${payload.customer.customer_id}`
    : `mission://${tenant}/${MissionRuntime.missionIdFor(tenant, payload.missionType, payload.payload)}`;
  const scope = { tenant_id: tenant, controller_id: binding.controller_id,
    commissioning_project_id: `project-${suffix}`, site_id: `site-${suffix}`, resource_id,
    delegated_actor: agent.actor_id, authorized_signer: C.keyId(pem(signerKeys)),
    operations: operations || [operation], purpose: 'p3-denial-test',
    valid_from: new Date(Date.now() - 60000).toISOString(),
    expires_at: new Date(Date.now() + expiresInMs).toISOString() };
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
  const intent = { protocol_version: C.PROTOCOL,
    authenticated_actor: overrides.authenticated_actor || agent.actor_id,
    authorized_signer: f.grant.authorized_signer,
    grant_id: overrides.grant_id || f.grant.grant_id,
    grant_revision: overrides.grant_revision || f.grant.revision,
    ...intentScope, operation: overrides.operation || f.operation,
    purpose: overrides.purpose || f.scope.purpose, payload_digest: '',
    logical_operation_id: overrides.logical_operation_id || `logical-p3-${f.tenant}` };
  intent.payload_digest = C.payloadDigest(payload, metadata);
  return { intent, payload, metadata,
    signature: crypto.sign(null, C.bytes(intent), signerKeys.privateKey).toString('base64') };
}

function stubAuthority(methods) {
  const calls = [];
  const stub = {};
  for (const m of methods) stub[m] = async (...args) => { calls.push([m, ...args]); return { ok: true }; };
  stub.calls = calls;
  return stub;
}

function typedApp() {
  const app = express();
  app.use(express.json({ verify: captureCommissioningBytes }));
  app.use((req, res, next) => {
    const h = req.get('authorization');
    const who = h === BEARER_MUSE ? agent : h === BEARER_STRANGER ? stranger : null;
    if (who) contexts.set(req, { ...who, verified: true });
    next();
  });
  app.use('/customers', require('../gateway/routes/customers')(customers));
  app.use('/missions', require('../gateway/routes/missions')(missions));
  app.use('/tenants', require('../gateway/routes/tenants')(registry));
  return app;
}

function exteriorApp() {
  const app = express();
  app.use(express.json());
  app.use('/reviews', createReviewRoutes(stubReviews(), exteriorAuth));
  app.use('/projects', createProjectRoutes(stubProjects(), exteriorAuth));
  app.use('/knowledge', createKnowledgeRoutes(knowledge, { auth: exteriorAuth }));
  app.use('/api/v1/missions', exteriorAuth.middleware(), createMissionCardRoutes({ missionRuntime: missions, pool }));
  return app;
}
let _stubReviews = null, _stubProjects = null;
function stubReviews() { _stubReviews = stubAuthority(['executeSyncReviews', 'executeReplyToReview']); return _stubReviews; }
function stubProjects() { _stubProjects = stubAuthority(['executeCreateProject', 'executeUpdateProject', 'executeAddArtifact']); return _stubProjects; }

async function listen(app) {
  const instance = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  return { instance, url: `http://127.0.0.1:${instance.address().port}` };
}

async function post(url, route, body, { auth = BEARER_MUSE, method = 'POST' } = {}) {
  const r = await fetch(url + route, { method,
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: r.status, json, text, error: json && (json.error || json.code) };
}

async function snapshot() {
  const names = (await pool.query('SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename', [schema])).rows;
  const rows = {};
  for (const { tablename } of names) {
    assert.match(tablename, /^[a-z_0-9]+$/);
    rows[tablename] = (await pool.query(`SELECT row_to_json(t) AS row FROM "${tablename}" t ORDER BY row_to_json(t)::text`)).rows;
  }
  return rows;
}
function changes(beforeRows, afterRows) {
  return [...new Set([...Object.keys(beforeRows), ...Object.keys(afterRows)])]
    .filter(name => name !== 'exterior_agent_credentials') // auth bookkeeping (last_used_at) is not business state
    .filter(name => JSON.stringify(beforeRows[name]) !== JSON.stringify(afterRows[name]))
    .map(table => ({ table, before: (beforeRows[table] || []).length, after: (afterRows[table] || []).length }));
}
async function tableCount(t) {
  return (await pool.query(`SELECT count(*)::int AS n FROM "${t}"`)).rows[0].n;
}

// The six denial conditions, asserted together for every negative case.
async function assertDenied({ name, response, before, statuses, error = null }) {
  assert.ok(statuses.includes(response.status),
    `${name}: expected denial status one of ${JSON.stringify(statuses)}, got ${response.status}: ${response.text.slice(0, 300)}`);
  if (error) assert.equal(response.error, error, `${name}: expected error ${error}, got ${response.error}`);
  const changed = changes(before.snap, await snapshot());
  assert.deepEqual(changed, [], `${name}: unauthorized persisted mutation: ${JSON.stringify(changed)}`);
  assert.equal(await tableCount('ping_events'), before.events, `${name}: unauthorized canonical event`);
  assert.equal(await tableCount('canonical_events'), before.canonical, `${name}: unauthorized canonical mirror event`);
  assert.equal(await tableCount('tenant_admission_receipts'), before.receipts, `${name}: false admission receipt`);
  assert.equal(runtime._stats.dispatched, before.dispatched, `${name}: downstream dispatch fired`);
  evidence.cases.push({ name, status: response.status, error: response.error, changed_tables: [] });
}

async function baseline() {
  return { snap: await snapshot(),
    events: await tableCount('ping_events'),
    canonical: await tableCount('canonical_events'),
    receipts: await tableCount('tenant_admission_receipts'),
    customers: await tableCount('customers'),
    missions: await tableCount('ping_missions'),
    dispatched: runtime._stats.dispatched };
}

async function installInsertFailure(table, tag) {
  const fn = `p3_fail_${tag}_${process.pid}`;
  const trg = `p3_trg_${tag}_${process.pid}`;
  await pool.query(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'p3 injected insert failure'; END $$`);
  await pool.query(`CREATE TRIGGER ${trg} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
  return async () => {
    await pool.query(`DROP TRIGGER ${trg} ON ${table}`);
    await pool.query(`DROP FUNCTION ${fn}()`);
  };
}

async function installSleepTrigger(table, tag, seconds) {
  const fn = `p3_sleep_${tag}_${process.pid}`;
  const trg = `p3_sleep_trg_${tag}_${process.pid}`;
  await pool.query(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(${seconds}); RETURN NEW; END $$`);
  await pool.query(`CREATE TRIGGER ${trg} BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION ${fn}()`);
  return async () => {
    await pool.query(`DROP TRIGGER ${trg} ON ${table}`);
    await pool.query(`DROP FUNCTION ${fn}()`);
  };
}

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name,
    'ping-admission-proof-20261010', 'Refuse DDL unless connected to the dedicated disposable cluster');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n,
    0, 'Refuse to reuse a schema not owned by this process');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  schemaOwned = true;
  await pool.query(`CREATE TABLE tenant_registry (
    tenant_id VARCHAR(64) PRIMARY KEY, name TEXT, domains TEXT[], health_endpoint TEXT,
    metrics_endpoint TEXT, logs_endpoint TEXT, traces_endpoint TEXT, events_endpoint TEXT,
    capabilities TEXT[], metadata JSONB, updated_at TIMESTAMPTZ)`);
  registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust });
  runtime = new UnifiedEventRuntime({ pool });
  envelope = new CanonicalEventEnvelope(pool);
  customers = new CustomerAuthority(pool, envelope, { tenantRegistry: registry, eventRuntime: runtime });
  missions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry: registry });
  knowledge = new KnowledgeGraph({ pool });
  knowledgeCalls = [];
  for (const m of ['addNode', 'addEdge']) {
    const orig = knowledge[m].bind(knowledge);
    knowledge[m] = async (...a) => { knowledgeCalls.push([m, ...a]); return orig(...a); };
  }
  await envelope.initialize();
  await runtime.initialize();
  await registry.initializeCommissioning();
  await customers.initialize();
  await missions.initialize();
  await knowledge.initialize();

  exteriorAuth = new ExteriorAuthMiddleware(pool);
  await exteriorAuth.initialize();
  await pool.query(`UPDATE exterior_agent_credentials SET tenant_allowlist = $1 WHERE agent_id = 'muse'`, [[EXT_TENANT_A]]);
  // muse-level-2 keeps an empty allow-list: tenant_scope_unconfigured.

  pool.on('error', () => { /* a terminated backend must not crash the suite */ });
  const t = await listen(typedApp());
  typedUrl = t.url;
  const e = await listen(exteriorApp());
  exteriorUrl = e.url;
  global.__p3servers = [t.instance, e.instance];
});

after(async () => {
  for (const s of (global.__p3servers || [])) await new Promise(r => s.close(r));
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/p3-denial-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  await pool.end();
  if (schemaOwned) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

// ==================== A. ORIGINAL 12 HTTP PROBES ====================
// The P0 baseline: all 12 returned 200 and changed rows. On the P2-closed
// candidate every one must fail closed with zero state change.

for (const route of ['/customers', '/missions', '/tenants']) {
  for (const reason of ['missing permission', 'revoked object grant', 'wrong tenant', 'unsupported business operation']) {
    test(`A: original probe ${route} / ${reason} fails closed`, async () => {
      const f = await provision('CUSTOMER_UPSERT', { operations: ['OBJECT_CREATED', 'OBJECT_UPDATED'] });
      let tenant = f.tenant;
      if (reason === 'revoked object grant') {
        await registry.executeRevokeCommissioningGrant(actorContext(owner), {
          grant_id: f.grant.grant_id, reason_digest: C.digest(Buffer.from('p3-revocation')) });
      }
      if (reason === 'wrong tenant') {
        tenant += '-other';
        await registry.executeRegisterTenant({ tenantId: tenant, name: 'P3 other tenant' });
      }
      // Real narrow OBJECT grants only, never invented legacy command grants.
      // The body carries no typed command intent at all.
      const body = { tenant_id: tenant, grant_id: f.grant.grant_id,
        customer: { customer_id: `customer-${counter}`, display_name: 'P3 probe' },
        missionType: 'security-probe', payload: { event_id: `event-${counter}` },
        name: 'Unauthorized registry change', operation: 'LEGACY_COMMAND_NOT_ADMITTED' };
      const before = await baseline();
      const r = await post(typedUrl, route, body, { auth: reason === 'missing permission' ? null : BEARER_MUSE });
      const expected = reason === 'missing permission' && route !== '/tenants' ? 401 : 403;
      const expectedError = expected === 401 ? 'unauthenticated_actor' : 'legacy_command_not_admitted';
      await assertDenied({ name: `A:${route}:${reason}`, response: r, before,
        statuses: [expected], error: expectedError });
    });
  }
}

// ==================== B. TRANSACTION FAILURE, BOTH DIRECTIONS ====================

test('B: mission row insert failure rolls back event, receipt and dispatch', async () => {
  const f = await provision('MISSION_CREATE');
  const remove = await installInsertFailure('ping_missions', 'missionrow');
  const before = await baseline();
  let r;
  try {
    r = await post(typedUrl, '/missions', submission(f));
  } finally { await remove(); }
  assert.notEqual(r.status, 201, `expected denial, got ${r.status}: ${r.text.slice(0, 200)}`);
  await assertDenied({ name: 'B:mission-row-failure', response: r, before, statuses: [r.status] });
});

test('B: receipt insert failure rolls back the admitted mission row and event', async () => {
  const f = await provision('MISSION_CREATE');
  const remove = await installInsertFailure('tenant_admission_receipts', 'missionreceipt');
  const before = await baseline();
  let r;
  try {
    r = await post(typedUrl, '/missions', submission(f));
  } finally { await remove(); }
  assert.notEqual(r.status, 201, `expected denial, got ${r.status}: ${r.text.slice(0, 200)}`);
  await assertDenied({ name: 'B:mission-receipt-failure', response: r, before, statuses: [r.status] });
  assert.equal(before.missions, await tableCount('ping_missions'), 'mission row survived receipt failure');
});

test('B: canonical mirror failure rolls back customer row, event and receipt', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const remove = await installInsertFailure('canonical_events', 'customermirror');
  const before = await baseline();
  let r;
  try {
    r = await post(typedUrl, '/customers', submission(f));
  } finally { await remove(); }
  assert.notEqual(r.status, 201, `expected denial, got ${r.status}: ${r.text.slice(0, 200)}`);
  await assertDenied({ name: 'B:customer-mirror-failure', response: r, before, statuses: [r.status] });
  assert.equal(before.customers, await tableCount('customers'), 'customer row survived mirror failure');
});

// ==================== C. DUPLICATE COMMANDS ====================

test('C: duplicate identical CUSTOMER_UPSERT returns the original receipt, no double mutation', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const s = submission(f);
  const r1 = await post(typedUrl, '/customers', s);
  assert.equal(r1.status, 201, r1.text);
  assert.equal(r1.json.status, 'ACCEPTED');
  const receipt1 = r1.json.receipt;
  assert.ok(receipt1 && receipt1.event_id, 'first admission produced no receipt');
  const before = await baseline();
  const r2 = await post(typedUrl, '/customers', s);
  assert.equal(r2.status, 201, r2.text);
  assert.deepEqual(r2.json.receipt, receipt1, 'duplicate did not return the original receipt');
  const changed = changes(before.snap, await snapshot());
  assert.deepEqual(changed, [], `duplicate mutated state: ${JSON.stringify(changed)}`);
  assert.equal(runtime._stats.dispatched, before.dispatched, 'duplicate redispatched the event');
  assert.equal(await tableCount('customers'), before.customers);
  assert.equal(await tableCount('ping_events'), before.events);
  assert.equal(await tableCount('tenant_admission_receipts'), before.receipts);
  evidence.cases.push({ name: 'C:duplicate-customer', status: r2.status, duplicate: true, changed_tables: [] });
});

test('C: duplicate identical MISSION_CREATE returns the original receipt, no double mission', async () => {
  const f = await provision('MISSION_CREATE');
  const s = submission(f);
  const r1 = await post(typedUrl, '/missions', s);
  assert.equal(r1.status, 201, r1.text);
  const receipt1 = r1.json.receipt;
  const before = await baseline();
  const r2 = await post(typedUrl, '/missions', s);
  assert.equal(r2.status, 201, r2.text);
  assert.deepEqual(r2.json.receipt, receipt1, 'duplicate did not return the original receipt');
  assert.deepEqual(changes(before.snap, await snapshot()), [], 'duplicate mutated state');
  assert.equal(runtime._stats.dispatched, before.dispatched, 'duplicate redispatched the event');
  evidence.cases.push({ name: 'C:duplicate-mission', status: r2.status, duplicate: true, changed_tables: [] });
});

test('C: same logical command ID with changed signed bytes conflicts without replaying effects', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const s = submission(f);
  const r1 = await post(typedUrl, '/customers', s);
  assert.equal(r1.status, 201, r1.text);
  const before = await baseline();
  const s2 = submission(f, { payload: { ...f.payload,
    customer: { ...f.payload.customer, display_name: 'conflicting bytes' } } });
  assert.notDeepEqual(s2.signature, s.signature);
  const r2 = await post(typedUrl, '/customers', s2);
  assert.equal(r2.status, 403, r2.text);
  assert.equal(r2.error, 'idempotency_conflict');
  await assertDenied({ name: 'C:idempotency-conflict', response: r2, before, statuses: [403], error: 'idempotency_conflict' });
});

// ==================== D. RETRY ====================

test('D: a denied command retried stays denied with zero state change', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const bad = submission(f, { scope: { tenant_id: 'p3-nope', controller_id: f.scope.controller_id,
    commissioning_project_id: f.scope.commissioning_project_id, site_id: f.scope.site_id,
    resource_id: `customer://p3-nope/customer-x` },
    payload: { tenant_id: 'p3-nope', customer: { customer_id: 'customer-x', display_name: 'retry probe' } } });
  const before = await baseline();
  for (let i = 0; i < 2; i++) {
    const r = await post(typedUrl, '/customers', bad);
    assert.equal(r.status, 403, `retry ${i}: ${r.text.slice(0, 200)}`);
    assert.equal(r.error, 'admission_denied');
  }
  await assertDenied({ name: 'D:denied-retry', response: { status: 403, error: 'admission_denied', text: '' },
    before, statuses: [403], error: 'admission_denied' });
});

test('D: failed-then-fixed command admits exactly once on retry', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const s = submission(f);
  const remove = await installInsertFailure('ping_events', 'retryfix');
  let r1;
  try {
    r1 = await post(typedUrl, '/customers', s);
  } finally { await remove(); }
  assert.notEqual(r1.status, 201, `faulted attempt should deny, got ${r1.status}`);
  const before = await baseline();
  const r2 = await post(typedUrl, '/customers', s);
  assert.equal(r2.status, 201, r2.text);
  assert.equal(r2.json.status, 'ACCEPTED');
  assert.ok(r2.json.receipt && r2.json.receipt.event_id);
  assert.equal(await tableCount('customers'), before.customers + 1, 'fixed retry did not insert exactly one customer');
  assert.equal(await tableCount('ping_events'), before.events + 1, 'fixed retry did not append exactly one event');
  assert.equal(await tableCount('tenant_admission_receipts'), before.receipts + 1, 'fixed retry did not persist exactly one receipt');
  // A third identical submission is the duplicate case again: same receipt, no more rows.
  const r3 = await post(typedUrl, '/customers', s);
  assert.equal(r3.status, 201);
  assert.deepEqual(r3.json.receipt, r2.json.receipt);
  assert.equal(await tableCount('customers'), before.customers + 1);
  evidence.cases.push({ name: 'D:failed-then-fixed', status: r2.status, admitted_once: true, changed_tables: [] });
});

// ==================== E. PARTIAL FAILURE ====================

test('E: connection killed mid-transaction leaves no orphaned rows, events or receipts', async () => {
  const remove = await installSleepTrigger('ping_events', 'killconn', 3);
  const f = await provision('CUSTOMER_UPSERT');
  const before = await baseline();
  const pending = post(typedUrl, '/customers', submission(f));
  let pid = null;
  for (let i = 0; i < 150 && !pid; i++) {
    const r = await adminPool.query(
      `SELECT pid FROM pg_stat_activity WHERE datname='admission_proof' AND pid <> pg_backend_pid() AND wait_event = 'PgSleep'`);
    if (r.rows.length) pid = r.rows[0].pid;
    else await sleep(100);
  }
  assert.ok(pid, 'stuck admission backend not found');
  const killed = await adminPool.query('SELECT pg_terminate_backend($1) AS killed', [pid]);
  assert.equal(killed.rows[0].killed, true);
  let response;
  try {
    response = await pending;
  } finally { await remove(); }
  assert.notEqual(response.status, 201, `killed admission must not report success, got ${response.status}`);
  assert.notEqual(response.json && response.json.status, 'ACCEPTED');
  await assertDenied({ name: 'E:killed-connection', response, before, statuses: [response.status] });
  assert.equal(await tableCount('customers'), before.customers, 'orphaned customer row after kill');
  assert.equal(await tableCount('ping_events'), before.events, 'orphaned event after kill');
  assert.equal(await tableCount('tenant_admission_receipts'), before.receipts, 'orphaned receipt after kill');
});

test('E: grant expiring while the request waits on the logical-operation lock is denied', async () => {
  const f = await provision('CUSTOMER_UPSERT', { expiresInMs: 1500 });
  const logicalId = `logical-p3-midflight-${f.tenant}`;
  // Hold the same advisory lock the admission path takes, at session level,
  // so the in-flight request cannot pass it until the grant has expired.
  const holder = await pool.connect();
  const key = ['commissioning-logical-operation', JSON.stringify([f.tenant, agent.actor_id, logicalId])];
  try {
    await holder.query('SELECT pg_advisory_lock(hashtext($1), hashtext($2))', key);
    const before = await baseline();
    const pending = post(typedUrl, '/customers', submission(f, { logical_operation_id: logicalId }));
    await sleep(2600); // grant (1.5s) expires while the request is blocked
    await holder.query('SELECT pg_advisory_unlock(hashtext($1), hashtext($2))', key);
    const r = await pending;
    assert.equal(r.status, 403, `mid-flight expiry must deny, got ${r.status}: ${r.text.slice(0, 200)}`);
    assert.equal(r.error, 'admission_denied');
    await assertDenied({ name: 'E:midflight-expiry', response: r, before, statuses: [403], error: 'admission_denied' });
  } finally {
    try { await holder.query('SELECT pg_advisory_unlock_all()'); } catch (_) {}
    holder.release();
  }
});

// ==================== F. CROSS-TENANT THROUGH EVERY NEWLY GATED ROUTE ====================
// Victim tenant B holds real rows; the attacker only ever holds tenant-A authority.
// Every attempt must 403 with zero cross-tenant writes.

async function victimTenant() {
  // A second tenant with one admitted customer and one admitted mission.
  const suffix = `${process.pid}-victim-${++counter}`;
  const tenant = `p3-victim-${suffix}`;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'P3 victim tenant' });
  const identityDigest = record({ issuer: 'https://p3-oidc.invalid', subject: `victim-subject-${suffix}`, actor_id: owner.actor_id });
  const businessDigest = record({ method: 'independent-operator-check', verified_by: 'p3-issuer',
    owner_actor_id: owner.actor_id, tenant_id: tenant, controller_id: `victim-controller-${suffix}` });
  const binding = await registry.executeBindVerifiedOwner(actorContext(operator), signed('bind_owner', {
    tenant_id: tenant, controller_id: `victim-controller-${suffix}`,
    identity_evidence_digest: identityDigest, business_evidence_digest: businessDigest,
  }));
  async function grantFor(operation) {
    const opSuffix = `${suffix}-${operation}`;
    const payload = operation === 'CUSTOMER_UPSERT'
      ? { tenant_id: tenant, customer: { customer_id: `victim-cust-${opSuffix}`, display_name: 'Victim customer',
          email: `victim-${opSuffix}@p3.invalid`, source: 'manual' } }
      : { tenant_id: tenant, missionType: 'p3-victim', payload: { event_id: `victim-evt-${opSuffix}`,
          namespace: `tenant::${tenant}` }, priority: 3 };
    const resource_id = operation === 'CUSTOMER_UPSERT'
      ? `customer://${tenant}/${payload.customer.customer_id}`
      : `mission://${tenant}/${MissionRuntime.missionIdFor(tenant, payload.missionType, payload.payload)}`;
    const scope = { tenant_id: tenant, controller_id: binding.controller_id,
      commissioning_project_id: `victim-project-${opSuffix}`, site_id: `victim-site-${opSuffix}`, resource_id,
      delegated_actor: agent.actor_id, authorized_signer: C.keyId(pem(signerKeys)),
      operations: [operation], purpose: 'p3-victim',
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
  const fc = await grantFor('CUSTOMER_UPSERT');
  const rc = await post(typedUrl, '/customers', submission(fc, { logical_operation_id: `logical-p3-victim-cust-${suffix}` }));
  assert.equal(rc.status, 201, 'victim customer setup: ' + rc.text);
  const fm = await grantFor('MISSION_CREATE');
  const rm = await post(typedUrl, '/missions', submission(fm, { logical_operation_id: `logical-p3-victim-mission-${suffix}` }));
  assert.equal(rm.status, 201, 'victim mission setup: ' + rm.text);
  const custRow = (await pool.query('SELECT row_to_json(t) AS j FROM customers t WHERE tenant_id=$1',
    [tenant])).rows[0].j;
  const missionRow = (await pool.query('SELECT row_to_json(t) AS j FROM ping_missions t WHERE tenant_id=$1',
    [tenant])).rows[0].j;
  return { tenant, custRow, missionRow,
    missionId: (await pool.query('SELECT mission_id FROM ping_missions WHERE tenant_id=$1', [tenant])).rows[0].mission_id };
}

async function victimRowsUnchanged(v) {
  const cust = (await pool.query('SELECT row_to_json(t) AS j FROM customers t WHERE tenant_id=$1', [v.tenant])).rows[0].j;
  const miss = (await pool.query('SELECT row_to_json(t) AS j FROM ping_missions t WHERE tenant_id=$1', [v.tenant])).rows[0].j;
  assert.deepEqual(cust, v.custRow, 'victim customer row changed');
  assert.deepEqual(miss, v.missionRow, 'victim mission row changed');
}

test('F: cross-tenant CUSTOMER_UPSERT with a tenant-A grant is denied', async () => {
  const v = await victimTenant();
  const f = await provision('CUSTOMER_UPSERT'); // grant scoped to tenant A
  const cross = submission(f, { scope: { tenant_id: v.tenant, controller_id: f.scope.controller_id,
    commissioning_project_id: f.scope.commissioning_project_id, site_id: f.scope.site_id,
    resource_id: `customer://${v.tenant}/attacker-cust` },
    payload: { tenant_id: v.tenant, customer: { customer_id: 'attacker-cust', display_name: 'cross-tenant probe' } } });
  const before = await baseline();
  const r = await post(typedUrl, '/customers', cross);
  assert.equal(r.status, 403, r.text);
  await assertDenied({ name: 'F:cross-tenant-customer', response: r, before, statuses: [403] });
  await victimRowsUnchanged(v);
});

test('F: cross-tenant MISSION_CREATE with a tenant-A grant is denied', async () => {
  const v = await victimTenant();
  const f = await provision('MISSION_CREATE'); // grant scoped to tenant A
  const cross = submission(f, { scope: { tenant_id: v.tenant, controller_id: f.scope.controller_id,
    commissioning_project_id: f.scope.commissioning_project_id, site_id: f.scope.site_id,
    resource_id: `mission://${v.tenant}/attacker-mission` },
    payload: { tenant_id: v.tenant, missionType: 'p3-attack', payload: { event_id: 'atk', namespace: `tenant::${v.tenant}` }, priority: 1 } });
  const before = await baseline();
  const r = await post(typedUrl, '/missions', cross);
  assert.equal(r.status, 403, r.text);
  await assertDenied({ name: 'F:cross-tenant-mission', response: r, before, statuses: [403] });
  await victimRowsUnchanged(v);
});

test('F: cross-tenant POST /reviews/sync is denied before the authority', async () => {
  const before = await baseline();
  const callsBefore = _stubReviews.calls.length;
  const r = await post(exteriorUrl, '/reviews/sync',
    { tenant_id: EXT_TENANT_B, location_id: 'loc-victim' }, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  assert.equal(_stubReviews.calls.length, callsBefore, 'review authority was called');
  await assertDenied({ name: 'F:cross-tenant-reviews', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
});

test('F: cross-tenant POST /projects is denied before the authority', async () => {
  const before = await baseline();
  const callsBefore = _stubProjects.calls.length;
  const r = await post(exteriorUrl, '/projects',
    { tenant_id: EXT_TENANT_B, name: 'attacker project' }, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  assert.equal(_stubProjects.calls.length, callsBefore, 'project authority was called');
  await assertDenied({ name: 'F:cross-tenant-projects', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
});

test('F: cross-tenant PUT /projects/:id is denied before the authority', async () => {
  const before = await baseline();
  const callsBefore = _stubProjects.calls.length;
  const r = await post(exteriorUrl, '/projects/victim-proj-1',
    { tenant_id: EXT_TENANT_B, name: 'hijacked' }, { auth: BEARER_MUSE, method: 'PUT' });
  assert.equal(r.status, 403, r.text);
  assert.equal(_stubProjects.calls.length, callsBefore, 'project authority was called');
  await assertDenied({ name: 'F:cross-tenant-projects-put', response: r, before, statuses: [403] });
});

test('F: cross-tenant POST /knowledge/nodes is denied before the graph', async () => {
  const before = await baseline();
  const callsBefore = knowledgeCalls.length;
  const r = await post(exteriorUrl, '/knowledge/nodes',
    { nodeType: 'business', label: 'attacker node', namespace: EXT_NS_VICTIM }, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  assert.equal(knowledgeCalls.length, callsBefore, 'knowledge graph was called');
  assert.equal(await tableCount('knowledge_nodes'), before.snap.knowledge_nodes.length,
    'knowledge node written cross-namespace');
  await assertDenied({ name: 'F:cross-tenant-knowledge-node', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
});

test('F: cross-namespace POST /knowledge/edges resolves the source namespace server-side and denies', async () => {
  const victimNode = await knowledge.addNode('business', 'victim node', {}, { namespace: EXT_NS_VICTIM });
  knowledgeCalls.length = 0;
  const before = await baseline();
  const r = await post(exteriorUrl, '/knowledge/edges',
    { sourceId: victimNode, targetId: 'attacker-target', edgeType: 'RELATED_TO' }, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  assert.equal(knowledgeCalls.length, 0, 'knowledge graph addEdge was called');
  await assertDenied({ name: 'F:cross-tenant-knowledge-edge', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
});

test('F: cross-tenant mission card approve is denied; the mission is untouched', async () => {
  const v = await victimTenant();
  const before = await baseline();
  const r = await post(exteriorUrl, `/api/v1/missions/cards/${v.missionId}/approve`, {}, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  const status = (await pool.query('SELECT status FROM ping_missions WHERE mission_id=$1', [v.missionId])).rows[0].status;
  assert.equal(status, 'created', 'victim mission transitioned');
  await assertDenied({ name: 'F:cross-tenant-card-approve', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
  await victimRowsUnchanged(v);
});

test('F: cross-tenant mission card reject is denied; the mission is untouched', async () => {
  const v = await victimTenant();
  const before = await baseline();
  const r = await post(exteriorUrl, `/api/v1/missions/cards/${v.missionId}/reject`,
    { reason: 'attacker reject' }, { auth: BEARER_MUSE });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'tenant_not_authorized');
  const status = (await pool.query('SELECT status FROM ping_missions WHERE mission_id=$1', [v.missionId])).rows[0].status;
  assert.equal(status, 'created', 'victim mission transitioned');
  await assertDenied({ name: 'F:cross-tenant-card-reject', response: r, before,
    statuses: [403], error: 'tenant_not_authorized' });
  await victimRowsUnchanged(v);
});

test('F: agent with no operator allow-list fails closed on every exterior mutation', async () => {
  const before = await baseline();
  const rc = _stubReviews.calls.length, pc = _stubProjects.calls.length, kc = knowledgeCalls.length;
  const key = BEARER_MUSE_L2; // muse-level-2: valid credential, empty allow-list
  const r1 = await post(exteriorUrl, '/reviews/sync', { tenant_id: EXT_TENANT_A, location_id: 'x' }, { auth: key });
  const r2 = await post(exteriorUrl, '/projects', { tenant_id: EXT_TENANT_A, name: 'x' }, { auth: key });
  const r3 = await post(exteriorUrl, '/knowledge/nodes', { nodeType: 't', label: 'x', namespace: EXT_NS_A }, { auth: key });
  for (const [n, r] of [['reviews', r1], ['projects', r2], ['knowledge', r3]]) {
    assert.equal(r.status, 403, `${n}: ${r.text}`);
    assert.equal(r.error, 'tenant_scope_unconfigured', n);
  }
  assert.equal(_stubReviews.calls.length, rc);
  assert.equal(_stubProjects.calls.length, pc);
  assert.equal(knowledgeCalls.length, kc);
  await assertDenied({ name: 'F:unconfigured-allowlist', response: r3, before,
    statuses: [403], error: 'tenant_scope_unconfigured' });
});

test('F: mission card fabricated decider identity is rejected', async () => {
  const v = await victimTenant();
  // The fabricated-identity check runs before the tenant gate, so any mission works.
  const f = await provision('MISSION_CREATE');
  const rf = await post(typedUrl, '/missions', submission(f));
  assert.equal(rf.status, 201, rf.text);
  const missionId = (await pool.query('SELECT mission_id FROM ping_missions WHERE tenant_id=$1', [f.tenant])).rows[0].mission_id;
  assert.ok(missionId, 'mission id missing: ' + rf.text);
  const before = await baseline();
  const r = await post(exteriorUrl, `/api/v1/missions/cards/${missionId}/approve`,
    { approved_by: 'mallory' }, { auth: BEARER_MUSE });
  assert.equal(r.status, 400, r.text);
  assert.equal(r.error, 'fabricated_identity');
  await assertDenied({ name: 'F:fabricated-identity', response: r, before,
    statuses: [400], error: 'fabricated_identity' });
  await victimRowsUnchanged(v);
});

// ==================== G. MISSING / STALE / TAMPERED / UNAUTHORIZED ====================

test('G: missing command signature rejects with zero state change (customers + missions)', async () => {
  for (const [route, op] of [['/customers', 'CUSTOMER_UPSERT'], ['/missions', 'MISSION_CREATE']]) {
    const f = await provision(op);
    const s = submission(f);
    delete s.signature;
    const before = await baseline();
    const r = await post(typedUrl, route, s);
    assert.equal(r.status, 400, `${route}: ${r.text}`);
    assert.equal(r.error, 'invalid_wire_fields');
    await assertDenied({ name: `G:missing-signature:${route}`, response: r, before,
      statuses: [400], error: 'invalid_wire_fields' });
  }
});

test('G: tampered canonical payload rejects with zero state change (customers + missions)', async () => {
  for (const [route, op] of [['/customers', 'CUSTOMER_UPSERT'], ['/missions', 'MISSION_CREATE']]) {
    const f = await provision(op);
    const s = submission(f);
    if (op === 'CUSTOMER_UPSERT') s.payload.customer.display_name = 'TAMPERED AFTER SIGNING';
    else s.payload.priority = 999;
    const before = await baseline();
    const r = await post(typedUrl, route, s);
    assert.equal(r.status, 403, `${route}: ${r.text}`);
    assert.equal(r.error, 'payload_digest_mismatch');
    await assertDenied({ name: `G:tampered-payload:${route}`, response: r, before,
      statuses: [403], error: 'payload_digest_mismatch' });
  }
});

test('G: stranger cannot ride a valid grant (customers + missions)', async () => {
  for (const [route, op] of [['/customers', 'CUSTOMER_UPSERT'], ['/missions', 'MISSION_CREATE']]) {
    const f = await provision(op);
    const s = submission(f, { authenticated_actor: stranger.actor_id });
    const before = await baseline();
    const r = await post(typedUrl, route, s, { auth: BEARER_STRANGER });
    assert.equal(r.status, 403, `${route}: ${r.text}`);
    assert.equal(r.error, 'admission_denied');
    await assertDenied({ name: `G:stranger:${route}`, response: r, before,
      statuses: [403], error: 'admission_denied' });
  }
});

test('G: expired grant rejects with zero state change (customers + missions)', async () => {
  for (const [route, op] of [['/customers', 'CUSTOMER_UPSERT'], ['/missions', 'MISSION_CREATE']]) {
    const f = await provision(op, { expiresInMs: 1200 });
    await sleep(2200);
    const before = await baseline();
    const r = await post(typedUrl, route, submission(f));
    assert.equal(r.status, 403, `${route}: ${r.text}`);
    assert.equal(r.error, 'admission_denied');
    await assertDenied({ name: `G:expired-grant:${route}`, response: r, before,
      statuses: [403], error: 'admission_denied' });
  }
});

test('G: revoked grant rejects with zero state change (customers + missions)', async () => {
  for (const [route, op] of [['/customers', 'CUSTOMER_UPSERT'], ['/missions', 'MISSION_CREATE']]) {
    const f = await provision(op);
    await registry.executeRevokeCommissioningGrant(actorContext(owner), {
      grant_id: f.grant.grant_id, reason_digest: C.digest(Buffer.from('p3-revoke')) });
    const before = await baseline();
    const r = await post(typedUrl, route, submission(f));
    assert.equal(r.status, 403, `${route}: ${r.text}`);
    assert.equal(r.error, 'admission_denied');
    await assertDenied({ name: `G:revoked-grant:${route}`, response: r, before,
      statuses: [403], error: 'admission_denied' });
  }
});

test('G: unsupported operation rejects with zero state change', async () => {
  const f = await provision('CUSTOMER_UPSERT');
  const s = submission(f, { operation: 'OBJECT_CREATED' });
  const before = await baseline();
  const r = await post(typedUrl, '/customers', s);
  assert.equal(r.status, 400, r.text);
  assert.equal(r.error, 'invalid_operation');
  await assertDenied({ name: 'G:unsupported-operation', response: r, before,
    statuses: [400], error: 'invalid_operation' });
});

test('G: unsigned legacy bodies are rejected on every typed entrance', async () => {
  for (const route of ['/customers', '/missions', '/tenants']) {
    const before = await baseline();
    const r = await post(typedUrl, route, { tenant_id: 'p3-legacy', customer: { customer_id: 'x' } });
    assert.equal(r.status, 403, `${route}: ${r.text}`);
    assert.equal(r.error, 'legacy_command_not_admitted');
    await assertDenied({ name: `G:legacy-body:${route}`, response: r, before,
      statuses: [403], error: 'legacy_command_not_admitted' });
  }
  const before = await baseline();
  const r = await post(typedUrl, '/customers/import', { tenant_id: 'p3-legacy' });
  assert.equal(r.status, 403, r.text);
  assert.equal(r.error, 'legacy_command_not_admitted');
  await assertDenied({ name: 'G:legacy-import', response: r, before,
    statuses: [403], error: 'legacy_command_not_admitted' });
});

test('G: missing credential is 401 on the typed entrances', async () => {
  for (const route of ['/customers', '/missions']) {
    const f = await provision('CUSTOMER_UPSERT');
    const before = await baseline();
    const r = await post(typedUrl, route, submission(f), { auth: null });
    assert.equal(r.status, 401, `${route}: ${r.text}`);
    assert.equal(r.error, 'unauthenticated_actor');
    await assertDenied({ name: `G:missing-auth:${route}`, response: r, before,
      statuses: [401], error: 'unauthenticated_actor' });
  }
});

test('G: missing or bad exterior credential is 401 with zero authority calls', async () => {
  const before = await baseline();
  const rc = _stubReviews.calls.length;
  const r1 = await post(exteriorUrl, '/reviews/sync',
    { tenant_id: EXT_TENANT_A, location_id: 'x' }, { auth: null });
  assert.equal(r1.status, 401, r1.text);
  assert.equal(r1.error, 'MISSING_AUTH');
  const r2 = await post(exteriorUrl, '/projects',
    { tenant_id: EXT_TENANT_A, name: 'x' }, { auth: BEARER_BAD });
  assert.equal(r2.status, 401, r2.text);
  assert.equal(r2.error, 'INVALID_CREDENTIAL');
  assert.equal(_stubReviews.calls.length, rc, 'authority called without credential');
  await assertDenied({ name: 'G:exterior-auth', response: r2, before, statuses: [401] });
});
