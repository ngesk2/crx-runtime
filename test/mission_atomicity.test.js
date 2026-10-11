'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { MissionRuntime } = require('../ping-runtime/orchestration/mission_runtime');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');
const { TenantRegistry } = require('../ping-runtime/runtime/tenant_registry');
const C = require('../ping-runtime/runtime/commissioning_contract');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.host, '127.0.0.1');
assert.equal(Number(config.port), 51590);
assert.equal(config.database, 'admission_proof');
const schema = 'mission_atomicity_' + process.pid;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });
let schemaOwned = false;
let counter = 0;

const issuerKeys = crypto.generateKeyPairSync('ed25519');
const signerKeys = crypto.generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ format: 'pem', type: 'spki' }).toString();
const contexts = new WeakMap();
const records = new Map();
const operator = {};
const agent = {};
contexts.set(operator, { actor_id: 'atomicity-operator', verified: true });
contexts.set(agent, { actor_id: 'atomicity-agent', verified: true });
const trust = {
  issuers: new Map([['atomicity-issuer', {
    actor_id: 'atomicity-operator', public_key: pem(issuerKeys), active: true,
  }]]),
  allowedOidcIssuers: new Set(['https://atomicity.invalid']),
  resolveActor: async value => contexts.get(value) || null,
  resolveVerifiedOidcEvidence: async digest => records.get(digest),
  resolveIndependentBusinessEvidence: async digest => records.get(digest),
  resolveCommissioningConsentEvidence: async digest => records.get(digest),
};

function tenant() { return `mission-proof-${process.pid}-${++counter}`; }
function record(value) {
  const digest = C.digest(C.bytes(value));
  records.set(digest, { ...value, digest, verified: true });
  return digest;
}
function signed(action, body) {
  const issuer_id = 'atomicity-issuer';
  return { issuer_id, body, signature: crypto.sign(null,
    C.bytes({ action, issuer_id, body }), issuerKeys.privateKey).toString('base64') };
}
async function createAdmittedFixture() {
  const t = tenant();
  const commandPayload = { tenant_id: t, missionType: 'atomicity-proof',
    payload: { namespace: `tenant::${t}`, event_id: `stable-${t}`, input: 'same bytes' }, priority: 4 };
  await registry.executeRegisterTenant({ tenantId: t, name: 'Disposable mission fixture' });
  const identity = record({ issuer: 'https://atomicity.invalid', subject: t, actor_id: 'atomicity-owner' });
  const business = record({ method: 'independent-operator-check', verified_by: 'atomicity-issuer',
    owner_actor_id: 'atomicity-owner', tenant_id: t, controller_id: `controller-${counter}` });
  const binding = await registry.executeBindVerifiedOwner(operator, signed('bind_owner', {
    tenant_id: t, controller_id: `controller-${counter}`,
    identity_evidence_digest: identity, business_evidence_digest: business,
  }));
  const scope = { tenant_id: t, controller_id: binding.controller_id,
    commissioning_project_id: `project-${counter}`, site_id: `site-${counter}`,
    resource_id: `mission://${t}/${MissionRuntime.missionIdFor(t, commandPayload.missionType, commandPayload.payload)}`,
    delegated_actor: 'atomicity-agent',
    authorized_signer: C.keyId(pem(signerKeys)), operations: ['MISSION_CREATE'], purpose: 'atomicity-test',
    valid_from: new Date(Date.now() - 60_000).toISOString(),
    expires_at: new Date(Date.now() + 3_600_000).toISOString() };
  const consent = record({ owner_binding_id: binding.binding_id, owner_actor_id: 'atomicity-owner',
    scope_digest: C.digest(C.bytes(scope)) });
  const grant = await registry.executeIssueCommissioningGrant(operator, signed('issue_grant', {
    ...scope, owner_binding_id: binding.binding_id, owner_binding_revision: binding.revision,
    signer_public_key: pem(signerKeys), consent_evidence_digest: consent,
  }));
  return { t, grant, commandPayload };
}
function missionSubmission(fixture, logicalOperationId) {
  const intentScope = Object.fromEntries(C.SCOPE.map(key => [key, fixture.grant[key]]));
  const payload = fixture.commandPayload;
  const metadata = { scope: intentScope };
  const intent = { protocol_version: C.PROTOCOL, authenticated_actor: 'atomicity-agent',
    authorized_signer: fixture.grant.authorized_signer, grant_id: fixture.grant.grant_id,
    grant_revision: fixture.grant.revision, ...intentScope, operation: 'MISSION_CREATE',
    purpose: fixture.grant.purpose, payload_digest: C.payloadDigest(payload, metadata), logical_operation_id: logicalOperationId };
  return { intent, payload, metadata,
    signature: crypto.sign(null, C.bytes(intent), signerKeys.privateKey).toString('base64') };
}
async function counts(t) {
  const result = await pool.query(`SELECT
    (SELECT count(*)::int FROM ping_missions WHERE tenant_id=$1) AS missions,
    (SELECT count(*)::int FROM ping_events WHERE tenant_id=$1) AS events,
    (SELECT count(*)::int FROM tenant_admission_receipts WHERE tenant_id=$1) AS receipts`, [t]);
  return result.rows[0];
}
async function installFailure(table, suffix) {
  const functionName = `fail_${suffix}_${process.pid}`;
  const triggerName = `trigger_${suffix}_${process.pid}`;
  await pool.query(`CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'synthetic ${suffix} insert failure'; END; $$`);
  await pool.query(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON ${table}
    FOR EACH ROW EXECUTE FUNCTION ${functionName}()`);
  return async () => {
    await pool.query(`DROP TRIGGER ${triggerName} ON ${table}`);
    await pool.query(`DROP FUNCTION ${functionName}()`);
  };
}

const runtime = new UnifiedEventRuntime({ pool });
const registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: trust });
const missions = new MissionRuntime({ pool, eventRuntime: runtime });

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name,
    'ping-admission-proof-20261010', 'Refuse DDL unless connected to the dedicated disposable cluster');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n,
    0, 'Refuse to reuse a schema not owned by this process');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  schemaOwned = true;
  await pool.query(`CREATE TABLE tenant_registry (
    tenant_id VARCHAR(64) PRIMARY KEY, name TEXT NOT NULL, domains TEXT[] DEFAULT '{}',
    health_endpoint TEXT, metrics_endpoint TEXT, logs_endpoint TEXT, traces_endpoint TEXT,
    events_endpoint TEXT, capabilities TEXT[] DEFAULT '{}', metadata JSONB DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT NOW())`);
  await runtime.initialize();
  await missions.initialize();
  await registry.initializeCommissioning();
});

after(async () => {
  await pool.end();
  if (schemaOwned) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

test('mission SQL trigger failure rolls back the internal create without evidence or success', async () => {
  const t = tenant();
  const beforeRows = await counts(t);
  const remove = await installFailure('ping_missions', 'mission_insert');
  try {
    await assert.rejects(() => missions.create('atomicity-proof', { event_id: t }, { tenant_id: t }));
  } finally { await remove(); }
  assert.deepEqual(await counts(t), beforeRows);
});

test('ping_events trigger failure rolls back the newly inserted mission', async () => {
  const t = tenant();
  const beforeRows = await counts(t);
  const remove = await installFailure('ping_events', 'event_insert');
  try {
    await assert.rejects(() => missions.create('atomicity-proof', { event_id: t }, { tenant_id: t }),
      error => error.code === 'mission_event_persist_failed');
  } finally { await remove(); }
  assert.deepEqual(await counts(t), beforeRows);
});

test('concurrent exact internal retries persist one mission and one event, and dispatch once', async () => {
  const t = tenant();
  let dispatches = 0;
  const localRuntime = new UnifiedEventRuntime({ pool });
  localRuntime.on('MISSION_CREATED', async () => { dispatches++; });
  const localMissions = new MissionRuntime({ pool, eventRuntime: localRuntime });
  const args = ['atomicity-proof', { event_id: t, body: 'same' }, { tenant_id: t, priority: 3 }];
  const ids = await Promise.all([localMissions.create(...args), localMissions.create(...args)]);
  assert.equal(ids[0], ids[1]);
  assert.deepEqual(await counts(t), { missions: 1, events: 1, receipts: 0 });
  assert.equal(dispatches, 1);
});

test('conflicting deterministic mission row rejects without appending event', async () => {
  const t = tenant(), missionType = 'atomicity-proof', payload = { event_id: t, original: true };
  const missionId = MissionRuntime.missionIdFor(t, missionType, payload);
  await pool.query(`INSERT INTO ping_missions (mission_id,mission_type,payload,priority,created_by,tenant_id)
    VALUES($1,$2,$3,0,NULL,$4)`, [missionId, missionType, JSON.stringify({ event_id: t, original: false }), t]);
  await assert.rejects(() => missions.create(missionType, payload, { tenant_id: t }),
    error => error.code === 'mission_id_conflict');
  const result = await counts(t);
  assert.equal(result.missions, 1);
  assert.equal(result.events, 0);
});

test('matching legacy mission row without durable event remains UNKNOWN and is not backfilled', async () => {
  const t = tenant(), missionType = 'atomicity-proof', payload = { event_id: t, legacy: true };
  const missionId = MissionRuntime.missionIdFor(t, missionType, payload);
  await pool.query(`INSERT INTO ping_missions (mission_id,mission_type,payload,priority,created_by,tenant_id)
    VALUES($1,$2,$3,0,NULL,$4)`, [missionId, missionType, JSON.stringify(payload), t]);
  await assert.rejects(() => missions.create(missionType, payload, { tenant_id: t }),
    error => error.code === 'mission_evidence_unproven' && error.status === 'UNKNOWN');
  const result = await counts(t);
  assert.equal(result.missions, 1);
  assert.equal(result.events, 0);
});

test('third logical MISSION_CREATE receipt accepts multiple verified receipts for the same event', async () => {
  const fixture = await createAdmittedFixture();
  const localMissions = new MissionRuntime({ pool, eventRuntime: runtime, tenantRegistry: registry });
  const first = await localMissions.createAdmitted(agent, missionSubmission(fixture, 'logical-1'));
  const second = await localMissions.createAdmitted(agent, missionSubmission(fixture, 'logical-2'));
  const third = await localMissions.createAdmitted(agent, missionSubmission(fixture, 'logical-3'));
  assert.equal(first.commandResult.mission_id, second.commandResult.mission_id);
  assert.equal(second.commandResult.mission_id, third.commandResult.mission_id);
  assert.equal(first.receipt.event_id, second.receipt.event_id);
  assert.equal(second.receipt.event_id, third.receipt.event_id);
  assert.deepEqual(await counts(fixture.t), { missions: 1, events: 1, receipts: 3 });
});

test('lost COMMIT acknowledgement reports UNKNOWN and fresh runtime reconciles without duplicate rows', async () => {
  const t = tenant();
  let loseAck = true;
  const ambiguousPool = {
    query: pool.query.bind(pool),
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sql, values) => {
          const result = await client.query(sql, values);
          if (loseAck && /^\s*COMMIT\s*$/i.test(sql)) {
            loseAck = false;
            throw new Error('synthetic lost COMMIT acknowledgement after server commit');
          }
          return result;
        },
        release: broken => client.release(broken),
      };
    },
  };
  const ambiguousRuntime = new UnifiedEventRuntime({ pool: ambiguousPool });
  const ambiguousMissions = new MissionRuntime({ pool: ambiguousPool, eventRuntime: ambiguousRuntime });
  const args = ['atomicity-proof', { event_id: t, committed: true }, { tenant_id: t }];
  await assert.rejects(() => ambiguousMissions.create(...args),
    error => error.code === 'mission_outcome_unknown' && error.status === 'UNKNOWN');
  assert.deepEqual(await counts(t), { missions: 1, events: 1, receipts: 0 });

  const freshRuntime = new UnifiedEventRuntime({ pool });
  const freshMissions = new MissionRuntime({ pool, eventRuntime: freshRuntime });
  const id = await freshMissions.create(...args);
  assert.equal(id, MissionRuntime.missionIdFor(t, 'atomicity-proof', args[1]));
  assert.deepEqual(await counts(t), { missions: 1, events: 1, receipts: 0 });
});
