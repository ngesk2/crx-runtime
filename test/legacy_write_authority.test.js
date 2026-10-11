'use strict';
// Real persisted-state requirements for bounded legacy and signed command entrances.
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
const C = require('../ping-runtime/runtime/commissioning_contract');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.database, 'admission_proof');
assert.equal(config.host, '127.0.0.1');
const schema = 'legacy_write_proof_' + process.pid;
const brokenSchema = 'legacy_event_failure_' + process.pid;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: '-c search_path=' + schema });
const brokenPool = new Pool({ ...config, options: '-c search_path=' + brokenSchema });
const contexts = new WeakMap(), records = new Map();
const issuer = crypto.generateKeyPairSync('ed25519');
const signer = crypto.generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ format: 'pem', type: 'spki' }).toString();
function context(actor_id) {
  const value = {}; contexts.set(value, { actor_id, verified: true }); return value;
}
const operator = context('synthetic-operator'), owner = context('synthetic-owner');
const trust = {
  issuers: new Map([['synthetic-issuer', { actor_id: 'synthetic-operator', public_key: pem(issuer), active: true }]]),
  allowedOidcIssuers: new Set(['https://synthetic-oidc.invalid']),
  resolveActor: async value => contexts.get(value) || null,
  resolveVerifiedOidcEvidence: async digest => records.get(digest),
  resolveIndependentBusinessEvidence: async digest => records.get(digest),
  resolveCommissioningConsentEvidence: async digest => records.get(digest),
};
const registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust });
const runtime = new UnifiedEventRuntime({ pool });
const envelope = new CanonicalEventEnvelope(pool);
const customers = new CustomerAuthority(pool, envelope, {tenantRegistry:registry,eventRuntime:runtime});
const missions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry:registry });
const evidence = { scope: 'Disposable PostgreSQL; synthetic object and typed command grants only; no production entitlement',
  runtime_patch: true, merge: 'HOLD', production: 'HOLD', cases: [] };
let server, url, sequence = 0, schemasOwned = false;
function record(value) {
  const digest = C.digest(C.bytes(value)); records.set(digest, { ...value, digest, verified: true }); return digest;
}
function signed(action, body) {
  const issuer_id = 'synthetic-issuer';
  return { issuer_id, body, signature: crypto.sign(null, C.bytes({ action, issuer_id, body }), issuer.privateKey).toString('base64') };
}
async function fixture(operation, customerId) {
  const suffix = String(++sequence), tenant = 'legacy-proof-' + suffix;
  await registry.executeRegisterTenant({ tenantId: tenant, name: 'Synthetic fixture' });
  const identity = record({ issuer: 'https://synthetic-oidc.invalid', subject: 'synthetic-subject', actor_id: 'synthetic-owner' });
  const business = record({ method: 'independent-operator-check', verified_by: 'synthetic-issuer',
    owner_actor_id: 'synthetic-owner', tenant_id: tenant, controller_id: 'controller-' + suffix });
  const binding = await registry.executeBindVerifiedOwner(operator, signed('bind_owner', {
    tenant_id: tenant, controller_id: 'controller-' + suffix,
    identity_evidence_digest: identity, business_evidence_digest: business,
  }));
  const scope = { tenant_id: tenant, controller_id: binding.controller_id,
    commissioning_project_id: 'project-' + suffix, site_id: 'site-' + suffix, resource_id: operation==='CUSTOMER_UPSERT'?`customer://${tenant}/${customerId}`:'object-' + suffix,
    delegated_actor: 'synthetic-agent', authorized_signer: C.keyId(pem(signer)),
    operations: operation?[operation]:['OBJECT_CREATED', 'OBJECT_UPDATED'], purpose: 'harvest-test',
    valid_from: new Date(Date.now() - 60000).toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString() };
  const consent = record({ owner_binding_id: binding.binding_id, owner_actor_id: 'synthetic-owner', scope_digest: C.digest(C.bytes(scope)) });
  const grant = await registry.executeIssueCommissioningGrant(operator, signed('issue_grant', {
    ...scope, owner_binding_id: binding.binding_id, owner_binding_revision: binding.revision,
    signer_public_key: pem(signer), consent_evidence_digest: consent,
  }));
  return { tenant, grant };
}
async function snapshot() {
  const names = (await pool.query('SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename', [schema])).rows;
  const rows = {};
  for (const { tablename } of names) {
    assert.match(tablename, /^[a-z_]+$/);
    rows[tablename] = (await pool.query(`SELECT row_to_json(t) AS row FROM "${tablename}" t ORDER BY row_to_json(t)::text`)).rows;
  }
  return rows;
}
function changes(beforeRows, afterRows) {
  return [...new Set([...Object.keys(beforeRows), ...Object.keys(afterRows)])]
    .filter(name => JSON.stringify(beforeRows[name]) !== JSON.stringify(afterRows[name]))
    .map(table => ({ table, before: beforeRows[table]?.length || 0, after: afterRows[table]?.length || 0 }));
}
async function post(route, body, authenticated = false) {
  return fetch(url + route, { method: 'POST', headers: { 'Content-Type': 'application/json',
    ...(authenticated ? { authorization: 'Bearer synthetic-agent' } : {}) }, body: JSON.stringify(body) });
}
before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name, 'ping-admission-proof-20261010');
  // Only create fresh, process-owned test schemas. Never reset public or reuse an unknown schema.
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=ANY($1)', [[schema, brokenSchema]])).rows[0].n, 0);
  await adminPool.query(`CREATE SCHEMA "${schema}"; CREATE SCHEMA "${brokenSchema}"`);
  schemasOwned = true;
  await envelope.initialize(); await runtime.initialize(); await registry.initializeCommissioning();
  await customers.initialize(); await missions.initialize();
  const app = express(); app.use(express.json({verify:require('../gateway/route_middleware').captureCommissioningBytes}));
  // Mirrors the three actual bootstrap mounts. No invented entitlement middleware.
  // This server-side identity fixture lets negative cases remain authenticated;
  // a bearer label alone never grants a business, mission or registry operation.
  app.use((req, res, next) => {
    if (req.get('authorization') === 'Bearer synthetic-agent') {
      contexts.set(req, { actor_id: 'synthetic-agent', verified: true });
      req.authenticatedAgent = { agentId: 'synthetic-agent' };
    }
    next();
  });
  app.use('/customers', require('../gateway/routes/customers')(customers));
  app.use('/missions', require('../gateway/routes/missions')(missions));
  app.use('/tenants', require('../gateway/routes/tenants')(registry));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  url = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/legacy-write-authority.json'), JSON.stringify(evidence, null, 2) + '\n');
  await pool.end(); await brokenPool.end();
  if (schemasOwned) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE; DROP SCHEMA "${brokenSchema}" CASCADE`);
  await adminPool.end();
});

for (const route of ['/customers', '/missions', '/tenants']) {
  for (const reason of ['missing permission', 'revoked object grant', 'wrong tenant', 'unsupported business operation']) {
    test(route + ' rejects ' + reason + ' before any persisted mutation', async () => {
      const f = await fixture(); let tenant = f.tenant;
      if (reason === 'revoked object grant') {
        await registry.executeRevokeCommissioningGrant(owner, { grant_id: f.grant.grant_id,
          reason_digest: C.digest(Buffer.from('synthetic-revocation')) });
        assert.equal((await pool.query('SELECT status FROM tenant_commissioning_grants WHERE grant_id=$1', [f.grant.grant_id])).rows[0].status, 'revoked');
      }
      if (reason === 'wrong tenant') {
        tenant += '-other'; await registry.executeRegisterTenant({ tenantId: tenant, name: 'Other synthetic tenant' });
      }
      // These are real, narrow OBJECT grants, never made-up legacy command grants.
      // Even an active grant cannot promote an unsupported command into authority.
      const body = { tenant_id: tenant, grant_id: f.grant.grant_id,
        customer: { customer_id: 'customer-' + sequence, display_name: 'Synthetic probe' },
        missionType: 'security-probe', payload: { event_id: 'event-' + sequence },
        name: 'Unauthorized registry change', operation: 'LEGACY_COMMAND_NOT_ADMITTED' };
      const beforeRows = await snapshot();
      const dispatchedBefore=runtime._stats.dispatched;
      const response = await post(route, body, reason !== 'missing permission');
      await response.text();
      const changed = changes(beforeRows, await snapshot());
      const receiptChange = changed.find(x => x.table === 'tenant_admission_receipts');
      evidence.cases.push({ entrance: route, reason, http_status: response.status, changed_tables: changed,
        grant_fixture: 'Synthetic OBJECT_CREATED/OBJECT_UPDATED only',
        admitted_receipts_added: receiptChange ? receiptChange.after - receiptChange.before : 0,
        downstream_dispatches: runtime._stats.dispatched-dispatchedBefore });
      assert.equal(runtime._stats.dispatched,dispatchedBefore);
      assert.deepEqual(changed, [], 'Unauthorized persisted mutation: ' + JSON.stringify(changed));
      assert.ok(response.status >= 400 && response.status < 500, 'Expected authorization denial, got ' + response.status);
    });
  }
}

function command(f, operation, payload) {
  const metadata={scope:Object.fromEntries(C.SCOPE.map(k=>[k,f.grant[k]]))};
  const intent={protocol_version:C.PROTOCOL,authenticated_actor:'synthetic-agent',authorized_signer:f.grant.authorized_signer,
    grant_id:f.grant.grant_id,grant_revision:f.grant.revision,...metadata.scope,operation,purpose:f.grant.purpose,
    payload_digest:C.payloadDigest(payload,metadata),logical_operation_id:'logical-'+sequence};
  return {intent,payload,metadata,signature:crypto.sign(null,C.bytes(intent),signer.privateKey).toString('base64')};
}
async function failTable(table, run) {
  assert.ok(['canonical_events','ping_events','customers','tenant_admission_receipts'].includes(table));
  await pool.query(`CREATE FUNCTION injected_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected append failure'; END $$`);
  await pool.query(`CREATE TRIGGER injected_failure BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION injected_failure()`);
  try { await run(); }
  finally { await pool.query(`DROP TRIGGER injected_failure ON ${table}`); await pool.query('DROP FUNCTION injected_failure()'); }
}
for (const table of ['customers','ping_events','canonical_events','tenant_admission_receipts']) {
  test('customer '+table+' failure rolls back business, events, mirror and receipt', async () => {
    const f=await fixture('CUSTOMER_UPSERT','append-failure-'+sequence);
    const submission=command(f,'CUSTOMER_UPSERT',{tenant_id:f.tenant,customer:{customer_id:f.grant.resource_id.split('/').pop(),display_name:'Synthetic failure probe'}});
    const beforeRows=await snapshot(); let dispatches=0;
    const handler=()=>{dispatches++;};runtime.on('CUSTOMER_CREATED',handler);
    try {
      await failTable(table,async()=>{
        const response=await post('/customers',submission,true);const outcome=await response.json();
        assert.ok(response.status>=400); assert.notEqual(outcome.status,'ACCEPTED');
      });
      const changed=changes(beforeRows,await snapshot());
      evidence.cases.push({entrance:'CustomerAuthority.executeAdmittedUpsert',reason:table+' insert trigger fails',changed_tables:changed,downstream_dispatches:dispatches});
      assert.deepEqual(changed,[]); assert.equal(dispatches,0);
    } finally {runtime._handlers.delete('CUSTOMER_CREATED');}
  });
}
test('mission event-store failure cannot acknowledge an unrecorded mission', async () => {
  const f=await fixture(),beforeRows=await snapshot();let acknowledged=false;
  await failTable('ping_events',async()=>{
    await assert.rejects(async()=>{await missions.create('security-probe',{event_id:'append-failure'},{tenant_id:f.tenant});acknowledged=true;},error=>error.code==='mission_event_persist_failed');
  });
  const changed=changes(beforeRows,await snapshot());
  evidence.cases.push({entrance:'MissionRuntime.create',reason:'Real PostgreSQL event trigger fails',acknowledged,changed_tables:changed});
  assert.equal(acknowledged,false);assert.deepEqual(changed,[]);
});

test('unauthorized customer import must not call the provider', async () => {
  const f = await fixture(), beforeRows = await snapshot(); let providerCalls = 0;
  // Fake only the external provider boundary; production CustomerAuthority runs unchanged.
  const customerAuthority = new CustomerAuthority(pool, envelope, { peopleAdapter: {
    async executeFetchContacts() { providerCalls++; return { contacts: [] }; },
  } });
  try { await customerAuthority.executeImportCustomers({ tenantId: f.tenant }); } catch (_) { /* denial may throw */ }
  const changed = changes(beforeRows, await snapshot());
  evidence.cases.push({ entrance: 'CustomerAuthority.executeImportCustomers', reason: 'No authenticated actor or permission',
    provider_calls: providerCalls, changed_tables: changed });
  assert.deepEqual(changed, []);
  assert.equal(providerCalls, 0, 'Provider boundary reached before authorization');
});
