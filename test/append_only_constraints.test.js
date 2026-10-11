'use strict';

// Storage-layer append-only proof for ping_events and tenant_admission_receipts.
//
// Oracle parity (Q143/Q144): Oracle crx_runtime.public.ping_events enforces
//   trg_ping_events_append_only            BEFORE DELETE OR UPDATE -> ping_events_no_mutation()
//   trg_ping_events_append_only_truncate   BEFORE TRUNCATE         -> ping_events_no_mutation()
// The candidate applies the equivalent (plus the receipts table, which Oracle
// does not have, at the same standard) in
// ping-runtime/runtime/commissioning_schema.sql, applied by
// initializeCommissioning(). This test proves the STORAGE layer itself rejects
// UPDATE/DELETE/TRUNCATE using direct SQL that bypasses all application code.
//
// Synthetic-only proof against a process-owned disposable schema.
// This does not establish a production owner, issuer or delegated entitlement.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { TenantRegistry } = require('../ping-runtime/runtime/tenant_registry');
const { UnifiedEventRuntime } = require('../ping-runtime/events/unified_event_runtime');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.test-database.json'), 'utf8'));
assert.equal(config.database, 'admission_proof');
assert.equal(config.host, '127.0.0.1');
const schema = `append_only_${process.pid}`;
const adminPool = new Pool(config);
const pool = new Pool({ ...config, options: `-c search_path=${schema}` });
const runtime = new UnifiedEventRuntime({ pool });
// initializeCommissioning only needs a configured pool and a trust object.
const registry = new TenantRegistry(pool, { commissioningPool: pool, commissioningTrust: {} });
let ownedSchema = false;

const EVENT_ID = 'appendonly-ev-1';
const TENANT = 'appendonly-tenant';
const BINDING = 'appendonly-binding';
const GRANT = 'appendonly-grant';

async function insertParents() {
  await pool.query(`INSERT INTO tenant_registry (tenant_id, name) VALUES ($1, 'append-only proof')`, [TENANT]);
  await pool.query(`INSERT INTO tenant_owner_bindings
    (binding_id, tenant_id, controller_id, owner_actor_id, oidc_issuer, oidc_subject,
     issuer_id, identity_evidence_digest, business_evidence_digest, issuance)
    VALUES ($1, $2, 'ctrl-1', 'owner-1', 'https://synthetic-oidc.invalid', 'sub-1',
     'issuer-1', 'digest-id', 'digest-biz', '{}')`, [BINDING, TENANT]);
  await pool.query(`INSERT INTO tenant_commissioning_grants
    (grant_id, owner_binding_id, owner_binding_revision, issuer_id, tenant_id, controller_id,
     commissioning_project_id, site_id, resource_id, delegated_actor, authorized_signer,
     signer_public_key, operations, purpose, consent_evidence_digest,
     valid_from, expires_at, issuance)
    VALUES ($1, $2, 1, 'issuer-1', $3, 'ctrl-1', 'proj-1', 'site-1', 'res-1',
     'agent-1', 'signer-1', 'pubkey-1', ARRAY['CUSTOMER_UPSERT'], 'append-only-proof',
     'digest-consent', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour', '{}')`,
  [GRANT, BINDING, TENANT]);
}

before(async () => {
  assert.equal((await adminPool.query('SHOW cluster_name')).rows[0].cluster_name, 'ping-admission-proof-20261010');
  assert.equal((await adminPool.query('SELECT count(*)::int AS n FROM pg_namespace WHERE nspname=$1', [schema])).rows[0].n, 0,
    'refuse reuse of a non-owned schema');
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  ownedSchema = true;
  await pool.query(`CREATE TABLE tenant_registry (
    tenant_id VARCHAR(64) PRIMARY KEY, name TEXT, domains TEXT[], health_endpoint TEXT,
    metrics_endpoint TEXT, logs_endpoint TEXT, traces_endpoint TEXT, events_endpoint TEXT,
    capabilities TEXT[], metadata JSONB, updated_at TIMESTAMPTZ)`);
  await runtime.initialize();
  await registry.initializeCommissioning();
  await insertParents();
});

after(async () => {
  await pool.end();
  if (ownedSchema) await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
  await adminPool.end();
});

test('append-only triggers exist with Oracle-parity names and timing', async () => {
  // tgtype bitmask: ROW=1 BEFORE=2 INSERT=4 DELETE=8 UPDATE=16 TRUNCATE=32.
  // Oracle's own values: 27 = BEFORE DELETE OR UPDATE FOR EACH ROW,
  // 34 = BEFORE TRUNCATE FOR EACH STATEMENT (verified read-only 2026-10-11).
  const { rows } = await pool.query(`
    SELECT c.relname AS table_name, t.tgname, t.tgtype FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = $1 AND c.relname IN ('ping_events', 'tenant_admission_receipts')
      AND NOT t.tgisinternal
    ORDER BY t.tgname`, [schema]);
  const byName = Object.fromEntries(rows.map(r => [r.tgname, r]));
  const expected = {
    trg_ping_events_append_only: ['ping_events', 27],
    trg_ping_events_append_only_truncate: ['ping_events', 34],
    trg_tenant_admission_receipts_append_only: ['tenant_admission_receipts', 27],
    trg_tenant_admission_receipts_append_only_truncate: ['tenant_admission_receipts', 34],
  };
  for (const [name, [table, tgtype]] of Object.entries(expected)) {
    assert.ok(byName[name], `missing trigger ${name}; found: ${rows.map(r => r.tgname).join(',')}`);
    assert.equal(byName[name].table_name, table, `${name} on wrong table`);
    assert.equal(byName[name].tgtype, tgtype, `${name} has wrong timing/events (tgtype)`);
  }
});

test('legitimate INSERTs succeed on both tables', async () => {
  const ev = await pool.query(
    `INSERT INTO ping_events (event_id, event_type, source, payload, tenant_id)
     VALUES ($1, 'PROOF_EVENT', 'append-only-test', '{}', $2) RETURNING event_id`,
    [EVENT_ID, TENANT]);
  assert.equal(ev.rows[0].event_id, EVENT_ID);
  const rc = await pool.query(
    `INSERT INTO tenant_admission_receipts
     (tenant_id, actor_id, logical_operation_id, operation_digest, grant_id,
      grant_revision, event_id, receipt)
     VALUES ($1, 'agent-1', 'logical-1', 'digest-op', $2, 1, $3, '{"proof":true}')
     RETURNING logical_operation_id`,
    [TENANT, GRANT, EVENT_ID]);
  assert.equal(rc.rows[0].logical_operation_id, 'logical-1');
});

test('UPDATE on ping_events is rejected by the storage layer', async () => {
  await assert.rejects(
    pool.query(`UPDATE ping_events SET source='tampered' WHERE event_id=$1`, [EVENT_ID]),
    /append-only/);
  const { rows } = await pool.query(`SELECT source FROM ping_events WHERE event_id=$1`, [EVENT_ID]);
  assert.equal(rows[0].source, 'append-only-test');
});

test('DELETE on ping_events is rejected by the storage layer', async () => {
  await assert.rejects(
    pool.query(`DELETE FROM ping_events WHERE event_id=$1`, [EVENT_ID]),
    /is append-only: DELETE not permitted/);
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ping_events WHERE event_id=$1`, [EVENT_ID]);
  assert.equal(rows[0].n, 1);
});

test('TRUNCATE on ping_events is rejected by the storage layer', async () => {
  // The FK from tenant_admission_receipts fires first ("cannot truncate a table
  // referenced in a foreign key constraint"); either way the storage layer
  // rejects the TRUNCATE. The BEFORE TRUNCATE trigger itself is proven wired
  // with Oracle-parity timing in the trigger-existence test above, and its
  // function body is proven raising by the receipts TRUNCATE test below.
  await assert.rejects(pool.query(`TRUNCATE ping_events`));
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ping_events`);
  assert.ok(rows[0].n >= 1);
});

test('UPDATE on tenant_admission_receipts is rejected by the storage layer', async () => {
  await assert.rejects(
    pool.query(`UPDATE tenant_admission_receipts SET receipt='{"tampered":true}'
                WHERE tenant_id=$1 AND logical_operation_id='logical-1'`, [TENANT]),
    /is append-only: UPDATE not permitted/);
  const { rows } = await pool.query(
    `SELECT receipt FROM tenant_admission_receipts WHERE tenant_id=$1 AND logical_operation_id='logical-1'`, [TENANT]);
  assert.deepEqual(rows[0].receipt, { proof: true });
});

test('DELETE on tenant_admission_receipts is rejected by the storage layer', async () => {
  await assert.rejects(
    pool.query(`DELETE FROM tenant_admission_receipts WHERE tenant_id=$1`, [TENANT]),
    /is append-only: DELETE not permitted/);
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM tenant_admission_receipts WHERE tenant_id=$1`, [TENANT]);
  assert.equal(rows[0].n, 1);
});

test('TRUNCATE on tenant_admission_receipts is rejected by the storage layer', async () => {
  await assert.rejects(pool.query(`TRUNCATE tenant_admission_receipts`), /TRUNCATE not permitted/);
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM tenant_admission_receipts`);
  assert.equal(rows[0].n, 1);
});

test('tables remain usable for INSERT after rejected mutations', async () => {
  const ev = await pool.query(
    `INSERT INTO ping_events (event_id, event_type, source, payload, tenant_id)
     VALUES ('appendonly-ev-2', 'PROOF_EVENT', 'append-only-test', '{}', $1) RETURNING event_id`,
    [TENANT]);
  assert.equal(ev.rows[0].event_id, 'appendonly-ev-2');
});
