/**
 * PingProjector integration tests (Patch 7B)
 *
 * Proves, against a real PostgreSQL carrying the real projection schema
 * (database/ping_objects.sql, including its append-only row triggers):
 *  - rebuilds objects/relationships/transitions from ping_events in acceptance order
 *  - same-ID/different-semantics collision is REJECTED with zero projection writes
 *  - exact duplicate events cause no second fanout
 *  - rebuild is deterministic (identical digests across rebuilds)
 *  - TRUNCATE-based rebuild works under the append-only row-level triggers
 *  - rebuild fails closed when a consumed event lacks payload_hash
 *
 * Requires TEST_DATABASE_URL pointing at a throwaway PostgreSQL.
 * Skipped when unset so unit runs stay hermetic.
 *
 * The pg driver is test-only scaffolding: the projector itself takes an
 * injected ProjectorDb and the package does not depend on pg.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { Pool } from 'pg';
import { PingProjector } from './ping-projector';

const DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIntegration = DATABASE_URL ? describe : describe.skip;

function sha256hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

interface ObjectEventInput {
  event_id: string;
  object_id: string;
  controller: string;
  content: Record<string, any>;
  visibility?: string;
  sequence: number;
  payload_hash?: string | null;
}

interface RelEventInput {
  event_id: string;
  relationship_id: string;
  subject: string;
  predicate: string;
  object: string;
  status?: string;
  sequence: number;
}

describeIntegration('PingProjector integration (live PostgreSQL)', () => {
  let pool: Pool;
  let projector: PingProjector;

  async function insertObjectEvent(e: ObjectEventInput): Promise<void> {
    const payload: Record<string, any> = {
      object_id: e.object_id,
      schema: 'ping.social.post@1',
      controller: e.controller,
      created_at: '2026-09-21T12:00:00.000Z',
      content: e.content,
      refs: [],
      visibility: e.visibility ?? 'public',
      status: 'active',
      metadata: {},
      proof: {},
    };
    if (e.payload_hash !== null) {
      payload.payload_hash = e.payload_hash ?? sha256hex(JSON.stringify(e.content));
    }
    await pool.query(
      `INSERT INTO ping_events (event_id, event_type, payload, sequence)
       VALUES ($1, 'OBJECT_CREATED', $2::jsonb, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [e.event_id, JSON.stringify(payload), e.sequence]
    );
  }

  async function insertRelEvent(e: RelEventInput): Promise<void> {
    const content = { subject: e.subject, predicate: e.predicate, object: e.object };
    const payload = {
      relationship_id: e.relationship_id,
      subject: e.subject,
      predicate: e.predicate,
      object: e.object,
      created_at: '2026-09-21T12:05:00.000Z',
      status: e.status ?? 'active',
      metadata: {},
      proof: {},
      payload_hash: sha256hex(JSON.stringify(content)),
    };
    await pool.query(
      `INSERT INTO ping_events (event_id, event_type, payload, sequence)
       VALUES ($1, 'RELATIONSHIP_CREATED', $2::jsonb, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [e.event_id, JSON.stringify(payload), e.sequence]
    );
  }

  async function insertUpdateEvent(e: {
    event_id: string;
    object_id: string;
    changes: Record<string, any>;
    updated_by: string;
    sequence: number | null;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const payload = {
      object_id: e.object_id,
      changes: e.changes,
      updated_by: e.updated_by,
      created_at: '2026-09-21T12:10:00.000Z',
      metadata: e.metadata ?? {},
      proof: {},
      payload_hash: sha256hex(JSON.stringify(e.changes ?? null)),
    };
    await pool.query(
      `INSERT INTO ping_events (event_id, event_type, payload, sequence)
       VALUES ($1, 'OBJECT_UPDATED', $2::jsonb, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [e.event_id, JSON.stringify(payload), e.sequence]
    );
  }

  async function clearJournal(): Promise<void> {
    await pool.query('DELETE FROM ping_events');
  }

  async function projectionDigest(): Promise<string> {
    // updated_at is intentionally volatile (refresh marker); the semantic
    // projection content is what must be deterministic.
    const [o, r, t] = await Promise.all([
      pool.query(
        'SELECT object_id, schema, controller, created_at, content, refs, visibility, status, metadata FROM ping_objects ORDER BY object_id'
      ),
      pool.query(
        'SELECT relationship_id, subject, predicate, object, created_at, status, metadata FROM ping_relationships ORDER BY relationship_id'
      ),
      pool.query(
        'SELECT transition_id, object_id, operation, actor_id, sequence, previous_transition, payload_hash, proof, metadata FROM ping_transitions ORDER BY object_id, sequence'
      ),
    ]);
    return sha256hex(JSON.stringify([o.rows, r.rows, t.rows]));
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    // Minimal canonical journal shape the projector reads.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ping_events (
        event_id varchar(64) PRIMARY KEY,
        event_type varchar(255) NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}',
        sequence bigint,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    // The schema file grants to the ping_app role; it must exist.
    await pool.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ping_app') THEN
        CREATE ROLE ping_app;
      END IF;
    END $$`);
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'database', 'ping_objects.sql'),
      'utf8'
    );
    projector = new PingProjector({ db: pool });
    await projector.initialize(schemaSql);
  }, 30000);

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await clearJournal();
    // Journal is empty here, so this only truncates projections to a clean state.
    await projector.rebuildAll();
  });

  it('rebuilds objects, relationships and transitions in acceptance order', async () => {
    await insertObjectEvent({ event_id: 'ev-o1', object_id: 'object_post1', controller: 'identity_alice', content: { text: 'hello' }, sequence: 1 });
    await insertObjectEvent({ event_id: 'ev-o2', object_id: 'object_post2', controller: 'identity_bob', content: { text: 'world' }, sequence: 2 });
    await insertRelEvent({ event_id: 'ev-r1', relationship_id: 'relationship_f1', subject: 'identity_bob', predicate: 'follows', object: 'identity_alice', sequence: 3 });

    const counts = await projector.rebuildAll();
    expect(counts).toEqual({ objects: 2, relationships: 1, transitions: 3 });

    const obj = await pool.query('SELECT object_id, controller, content FROM ping_objects WHERE object_id = $1', ['object_post1']);
    expect(obj.rows[0].controller).toBe('identity_alice');
    expect(obj.rows[0].content).toEqual({ text: 'hello' });

    const rel = await pool.query('SELECT subject, predicate, object, status FROM ping_relationships');
    expect(rel.rows).toHaveLength(1);
    expect(rel.rows[0]).toMatchObject({ subject: 'identity_bob', predicate: 'follows', object: 'identity_alice', status: 'active' });

    const tr = await pool.query(
      'SELECT object_id, operation, actor_id, sequence, previous_transition, payload_hash FROM ping_transitions ORDER BY object_id, sequence'
    );
    expect(tr.rows).toHaveLength(3);
    expect({ ...tr.rows[0], sequence: Number(tr.rows[0].sequence) }).toMatchObject({ object_id: 'object_post1', operation: 'create', actor_id: 'identity_alice', sequence: 1, previous_transition: null });
    expect(tr.rows[0].payload_hash).toBe(sha256hex(JSON.stringify({ text: 'hello' })));
    expect({ ...tr.rows[2], sequence: Number(tr.rows[2].sequence) }).toMatchObject({ object_id: 'relationship_f1', operation: 'relate', actor_id: 'identity_bob', sequence: 1 });
  });

  it('rejects same-ID/different-semantics collisions with zero projection writes', async () => {
    await insertObjectEvent({ event_id: 'ev-c1', object_id: 'object_dup', controller: 'identity_alice', content: { text: 'first' }, sequence: 1, payload_hash: sha256hex('first') });
    await insertObjectEvent({ event_id: 'ev-c2', object_id: 'object_dup', controller: 'identity_alice', content: { text: 'second' }, sequence: 2, payload_hash: sha256hex('second') });

    const conflicts = await projector.detectConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].object_id).toBe('object_dup');
    expect(conflicts[0].distinct_hashes).toBe(2);

    await expect(projector.rebuildAll()).rejects.toThrow(/FAIL CLOSED/);

    // Zero fanout after rejection: nothing was projected.
    const counts = await projector.countProjections();
    expect(counts).toEqual({ objects: 0, relationships: 0, transitions: 0 });
  });

  it('exact duplicate events cause no second fanout', async () => {
    await insertObjectEvent({ event_id: 'ev-d1', object_id: 'object_once', controller: 'identity_alice', content: { text: 'once' }, sequence: 1 });

    const first = await projector.rebuildAll();
    expect(first).toEqual({ objects: 1, relationships: 0, transitions: 1 });

    // Re-emit the identical event: event_id dedupes at the journal (ON CONFLICT DO NOTHING).
    await insertObjectEvent({ event_id: 'ev-d1', object_id: 'object_once', controller: 'identity_alice', content: { text: 'once' }, sequence: 1 });
    const journal = await pool.query('SELECT COUNT(*) AS c FROM ping_events');
    expect(Number(journal.rows[0].c)).toBe(1);

    const second = await projector.rebuildAll();
    expect(second).toEqual({ objects: 1, relationships: 0, transitions: 1 });

    const digestBefore = await projectionDigest();
    await projector.rebuildAll();
    expect(await projectionDigest()).toBe(digestBefore);
  });

  it('rebuild is deterministic: identical digests across rebuilds', async () => {
    await insertObjectEvent({ event_id: 'ev-x1', object_id: 'object_b', controller: 'identity_alice', content: { text: 'b' }, sequence: 2 });
    await insertObjectEvent({ event_id: 'ev-x2', object_id: 'object_a', controller: 'identity_alice', content: { text: 'a' }, sequence: 1 });
    await insertRelEvent({ event_id: 'ev-x3', relationship_id: 'relationship_x', subject: 'identity_bob', predicate: 'follows', object: 'identity_alice', sequence: 3 });

    await projector.rebuildAll();
    const d1 = await projectionDigest();
    await projector.rebuildAll();
    const d2 = await projectionDigest();
    expect(d2).toBe(d1);
  });

  it('later revocation supersedes: inactive relationship wins, transitions chain', async () => {
    // A status change is a new event about the SAME relationship entity:
    // event_id differs, relationship_id is stable.
    await insertRelEvent({ event_id: 'ev-u1', relationship_id: 'relationship_u', subject: 'identity_bob', predicate: 'follows', object: 'identity_alice', status: 'active', sequence: 1 });
    await insertRelEvent({ event_id: 'ev-u2', relationship_id: 'relationship_u', subject: 'identity_bob', predicate: 'follows', object: 'identity_alice', status: 'inactive', sequence: 2 });

    await projector.rebuildAll();

    const rel = await pool.query('SELECT relationship_id, status FROM ping_relationships');
    expect(rel.rows).toHaveLength(1);
    expect(rel.rows[0]).toMatchObject({ relationship_id: 'relationship_u', status: 'inactive' });

    const tr = await pool.query(
      'SELECT operation, sequence, previous_transition FROM ping_transitions ORDER BY sequence'
    );
    expect(tr.rows.map((r: any) => [r.operation, Number(r.sequence)])).toEqual([['relate', 1], ['relate', 2]]);
    const metas = await pool.query('SELECT metadata FROM ping_transitions ORDER BY sequence');
    expect(metas.rows[0].metadata.relationship_status).toBe('active');
    expect(metas.rows[1].metadata.relationship_status).toBe('inactive');
    expect(tr.rows[1].previous_transition).toBeTruthy();
  });

  it('fails closed when a consumed event lacks payload_hash', async () => {
    await insertObjectEvent({ event_id: 'ev-h1', object_id: 'object_nohash', controller: 'identity_alice', content: { text: 'x' }, sequence: 1, payload_hash: null });

    await expect(projector.rebuildAll()).rejects.toThrow(/lacks payload_hash/);

    const counts = await projector.countProjections();
    expect(counts).toEqual({ objects: 0, relationships: 0, transitions: 0 });
  });

  it('OBJECT_UPDATED applies shallow content merges in acceptance order', async () => {
    await insertObjectEvent({ event_id: 'ev-m1', object_id: 'object_m', controller: 'identity_alice', content: { display_name: 'Alice', handle: 'x' }, sequence: 1 });
    await insertUpdateEvent({ event_id: 'ev-m2', object_id: 'object_m', changes: { handle: 'alice' }, updated_by: 'identity_alice', sequence: 2 });
    await insertUpdateEvent({ event_id: 'ev-m3', object_id: 'object_m', changes: { bio: 'dev' }, updated_by: 'identity_alice', sequence: 3 });

    const counts = await projector.rebuildAll();
    expect(counts.objects).toBe(3); // 1 create + 2 updates applied
    expect(counts.transitions).toBe(3);

    const obj = await pool.query('SELECT content FROM ping_objects WHERE object_id = $1', ['object_m']);
    expect(obj.rows[0].content).toEqual({ display_name: 'Alice', handle: 'alice', bio: 'dev' });

    const tr = await pool.query(
      'SELECT operation, actor_id, sequence, previous_transition FROM ping_transitions WHERE object_id = $1 ORDER BY sequence',
      ['object_m']
    );
    expect(tr.rows.map((r: any) => [r.operation, r.actor_id, Number(r.sequence)])).toEqual([
      ['create', 'identity_alice', 1],
      ['update', 'identity_alice', 2],
      ['update', 'identity_alice', 3],
    ]);
    expect(tr.rows[1].previous_transition).toBeTruthy();
    expect(tr.rows[2].previous_transition).not.toBe(tr.rows[1].previous_transition);
  });

  it('OBJECT_UPDATED fails closed on unknown target', async () => {
    await insertUpdateEvent({ event_id: 'ev-u9', object_id: 'object_ghost', changes: { handle: 'x' }, updated_by: 'identity_alice', sequence: 1 });
    await expect(projector.rebuildAll()).rejects.toThrow(/unknown object/);
    expect(await projector.countProjections()).toEqual({ objects: 0, relationships: 0, transitions: 0 });
  });

  it('OBJECT_UPDATED fails closed when signer is not the controller', async () => {
    await insertObjectEvent({ event_id: 'ev-a1', object_id: 'object_owned', controller: 'identity_alice', content: { text: 'mine' }, sequence: 1 });
    await insertUpdateEvent({ event_id: 'ev-a2', object_id: 'object_owned', changes: { text: 'yours' }, updated_by: 'identity_bob', sequence: 2 });
    await expect(projector.rebuildAll()).rejects.toThrow(/is controlled by/);
    expect(await projector.countProjections()).toEqual({ objects: 0, relationships: 0, transitions: 0 });
  });

  it('OBJECT_UPDATED fails closed on malformed changes', async () => {
    await insertObjectEvent({ event_id: 'ev-b1', object_id: 'object_bm', controller: 'identity_alice', content: { text: 't' }, sequence: 1 });
    await insertUpdateEvent({ event_id: 'ev-b2', object_id: 'object_bm', changes: null as any, updated_by: 'identity_alice', sequence: 2 });
    await expect(projector.rebuildAll()).rejects.toThrow(/malformed changes/);
  });

  it('rebuild fails closed when any consumed event lacks an acceptance sequence', async () => {
    await insertObjectEvent({ event_id: 'ev-s1', object_id: 'object_s', controller: 'identity_alice', content: { text: 's' }, sequence: 1 });
    await insertUpdateEvent({ event_id: 'ev-s2', object_id: 'object_s', changes: { text: 's2' }, updated_by: 'identity_alice', sequence: null });
    await expect(projector.rebuildAll()).rejects.toThrow(/acceptance sequence/);
    expect(await projector.countProjections()).toEqual({ objects: 0, relationships: 0, transitions: 0 });
  });

  it('row-level append-only triggers still reject direct row mutation', async () => {
    // The repo schema guards the transition history (the tamper-evident
    // audit trail). Current-state projection tables are rebuildable and
    // intentionally carry no row-mutation guard.
    await insertObjectEvent({ event_id: 'ev-t1', object_id: 'object_trig', controller: 'identity_alice', content: { text: 't' }, sequence: 1 });
    await projector.rebuildAll();

    await expect(pool.query(`UPDATE ping_transitions SET operation = 'x'`)).rejects.toThrow(/append-only/);
    await expect(pool.query(`DELETE FROM ping_transitions`)).rejects.toThrow(/append-only/);
  });
});
