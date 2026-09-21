/**
 * PING Projection Rebuilder
 * PATCH 7B: reconciled to the live canonical journal.
 *
 * Rebuilds ping_objects, ping_relationships, ping_transitions from the LIVE
 * canonical event history in public.ping_events.
 *
 * These tables are PROJECTIONS / MATERIALIZED STATE.
 * Canonical truth resides in ping_events (append-only; the journal itself is
 * TRUNCATE-guarded and is never touched here).
 * These tables can be destroyed and rebuilt from canonical history.
 *
 * Consumes only REGISTERED event types: OBJECT_CREATED, OBJECT_UPDATED,
 * RELATIONSHIP_CREATED. The legacy unregistered ping.create / ping.relate
 * vocabulary is not read.
 *
 * Ordering contract: every journal scan orders by
 * (sequence ASC NULLS LAST, created_at ASC, event_id ASC), with the
 * sequence direction (and tiebreakers) reversed for last-wins scans.
 * created_at is a total order in this deployment; event_id is the
 * final unique tiebreaker. The assertNoNullSequences guard refuses
 * NULL-sequence consumed events outright, so the tiebreaker is
 * defense in depth, not a second ordering authority.
 *
 * Operation/predicate vocabulary is owned by ping-vocabulary.ts; the SQL
 * schema CHECK constraints in database/ping_objects.sql must mirror it
 * (enforced by ping-vocabulary.test.ts). This projector asserts every
 * operation it writes against the vocabulary before inserting.
 *
 * Dependency inversion: the projector takes an injected minimal database
 * client. It does not import a database driver, so this package carries no
 * pg dependency. No SQL md5() fallbacks, no hand-rolled identity or hash
 * paths: IDs and hashes are produced by IdentityAuthority / HashAuthority
 * in TypeScript, never synthesized in SQL.
 */

import { IdentityAuthority } from './identity-authority';
import { assertProjectorOperation } from './ping-vocabulary';

export interface ProjectorDb {
  query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface PingProjectorConfig {
  db: ProjectorDb;
}

export interface RebuildCounts {
  objects: number;
  relationships: number;
  transitions: number;
}

interface CanonicalJournalEvent {
  event_id: string;
  event_type: string;
  payload: any;
  acceptance_sequence: number | null;
  created_at: string;
}

/** The three registered journal event types this projector consumes. */
const CONSUMED_EVENT_TYPES = ['OBJECT_CREATED', 'OBJECT_UPDATED', 'RELATIONSHIP_CREATED'] as const;

export class PingProjector {
  constructor(private readonly config: PingProjectorConfig) {}

  /**
   * Create projection tables from schema SQL.
   * The caller reads database/ping_objects.sql from disk; empty schema is
   * refused loudly instead of silently "succeeding" with no tables.
   */
  async initialize(schemaSql: string): Promise<void> {
    if (!schemaSql || !schemaSql.trim()) {
      throw new Error(
        'PingProjector.initialize: schema SQL is required. Read database/ping_objects.sql ' +
          'from disk and pass it in; refusing to initialize with empty schema.'
      );
    }
    await this.config.db.query(schemaSql);
  }

  /**
   * FAIL-CLOSED invariant: every consumed journal event must carry a
   * PostgreSQL acceptance sequence. An event with unknown ordering cannot
   * be projected deterministically, so the rebuild is refused outright
   * rather than projecting it in an arbitrary position.
   */
  private async assertNoNullSequences(db: ProjectorDb): Promise<void> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ping_events
       WHERE event_type IN ('OBJECT_CREATED', 'OBJECT_UPDATED', 'RELATIONSHIP_CREATED')
         AND sequence IS NULL`
    );
    const missing = Number(result.rows[0]?.count ?? 0);
    if (missing > 0) {
      throw new Error(
        `PingProjector: FAIL CLOSED: ${missing} consumed event(s) lack an acceptance sequence; ` +
          'ordering is unknown and projection would be nondeterministic. Refusing rebuild.'
      );
    }
  }

  /**
   * Destroy ONLY disposable projection state and rebuild it from the
   * canonical journal, in PostgreSQL acceptance order.
   *
   * FAIL CLOSED on semantic collision: if two OBJECT_CREATED events claim
   * the same object_id with different payload hashes, the journal is
   * ambiguous and no projection is written (zero fanout after rejection).
   * Collisions are an ingestion-governance defect and must be rejected at
   * the governed path; detectConflicts() surfaces them for inspection.
   *
   * TRUNCATE note: ping_transitions has row-level BEFORE UPDATE / BEFORE
   * DELETE triggers, but TRUNCATE does not fire row-level triggers (and no
   * TRUNCATE trigger is defined), so projection rebuild works while the
   * append-only row guard stays intact. ping_events itself is never touched.
   */
  async rebuildAll(): Promise<RebuildCounts> {
    const db = this.config.db;
    await db.query('BEGIN');
    try {
      await this.assertNoNullSequences(db);
      const conflicts = await this.detectConflicts();
      if (conflicts.length > 0) {
        throw new Error(
          'PingProjector: FAIL CLOSED: same-ID/different-semantics collision in ping_events for ' +
            conflicts.map((c) => c.object_id).join(', ') +
            '; refusing to project an ambiguous journal. Reject the colliding event at ingestion governance.'
        );
      }

      await db.query('TRUNCATE TABLE ping_objects');
      await db.query('TRUNCATE TABLE ping_relationships');
      await db.query('TRUNCATE TABLE ping_transitions');

      const objects = await this.rebuildObjects(db);
      const relationships = await this.rebuildRelationships(db);
      const transitions = await this.rebuildTransitions(db);

      await db.query('COMMIT');
      return { objects, relationships, transitions };
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Rebuild ping_objects from OBJECT_CREATED events, then apply
   * OBJECT_UPDATED events in acceptance order. Each update is a shallow
   * content merge (right-wins) applied only when the update's `updated_by`
   * equals the object's controller; anything else fails closed.
   *
   * ON CONFLICT DO NOTHING keeps rebuilds idempotent; same-ID conflicts with
   * different content are a governance concern (rejected at ingestion), and
   * detectConflicts() surfaces them for inspection.
   */
  private async rebuildObjects(db: ProjectorDb): Promise<number> {
    const created = await db.query(`
      INSERT INTO ping_objects (object_id, schema, controller, created_at, content, refs, visibility, status, metadata)
      SELECT
        payload->>'object_id' AS object_id,
        payload->>'schema' AS schema,
        payload->>'controller' AS controller,
        COALESCE((payload->>'created_at')::timestamptz, pe.created_at) AS created_at,
        payload->'content' AS content,
        COALESCE(payload->'refs', '[]'::jsonb) AS refs,
        COALESCE(payload->>'visibility', 'public') AS visibility,
        COALESCE(payload->>'status', 'active') AS status,
        COALESCE(payload->'metadata', '{}'::jsonb) AS metadata
      FROM ping_events pe
      WHERE pe.event_type = 'OBJECT_CREATED'
      ORDER BY pe.sequence ASC NULLS LAST, pe.created_at ASC, pe.event_id ASC
      ON CONFLICT (object_id) DO NOTHING
    `);

    const updates = await db.query<CanonicalJournalEvent>(`
      SELECT event_id, event_type, payload, pe.sequence AS acceptance_sequence, pe.created_at
      FROM ping_events pe
      WHERE pe.event_type = 'OBJECT_UPDATED'
      ORDER BY pe.sequence ASC NULLS LAST, pe.created_at ASC, pe.event_id ASC
    `);

    let applied = 0;
    for (const event of updates.rows) {
      const payload = event.payload ?? {};
      const objectId = payload.object_id;
      const changes = payload.changes;
      const updatedBy = payload.updated_by;
      if (!objectId || typeof objectId !== 'string') {
        throw new Error(
          `PingProjector: FAIL CLOSED: OBJECT_UPDATED event ${event.event_id} has no object_id; refusing to project.`
        );
      }
      if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
        throw new Error(
          `PingProjector: FAIL CLOSED: OBJECT_UPDATED event ${event.event_id} has malformed changes; refusing to project.`
        );
      }
      if (!updatedBy || typeof updatedBy !== 'string') {
        throw new Error(
          `PingProjector: FAIL CLOSED: OBJECT_UPDATED event ${event.event_id} has no updated_by; refusing to project.`
        );
      }
      const target = await db.query<{ controller: string }>(
        'SELECT controller FROM ping_objects WHERE object_id = $1',
        [objectId]
      );
      if (target.rows.length === 0) {
        throw new Error(
          `PingProjector: FAIL CLOSED: OBJECT_UPDATED event ${event.event_id} targets unknown object ${objectId}; refusing to project.`
        );
      }
      if (target.rows[0].controller !== updatedBy) {
        throw new Error(
          `PingProjector: FAIL CLOSED: OBJECT_UPDATED event ${event.event_id} signed by ${updatedBy} ` +
            `but object ${objectId} is controlled by ${target.rows[0].controller}; refusing to project.`
        );
      }
      await db.query(
        `UPDATE ping_objects
         SET content = content || $2::jsonb,
             metadata = metadata || COALESCE($3::jsonb, '{}'::jsonb)
         WHERE object_id = $1`,
        [objectId, JSON.stringify(changes), JSON.stringify(payload.metadata ?? {})]
      );
      applied += 1;
    }

    return (created.rowCount ?? 0) + applied;
  }

  /**
   * Rebuild ping_relationships from RELATIONSHIP_CREATED events.
   * Last accepted event per (subject, predicate, object) wins, so a later
   * revocation (status 'inactive') supersedes the earlier active row.
   * DISTINCT ON pre-resolves "last wins" per key in acceptance order:
   * a single INSERT...SELECT must never try to upsert the same conflict
   * target twice ("ON CONFLICT DO UPDATE cannot affect row a second time").
   * NULL sequences (unknown acceptance order) sort after known ones.
   */
  private async rebuildRelationships(db: ProjectorDb): Promise<number> {
    const result = await db.query(`
      INSERT INTO ping_relationships (relationship_id, subject, predicate, object, created_at, status, metadata)
      SELECT DISTINCT ON (payload->>'subject', payload->>'predicate', payload->>'object')
        payload->>'relationship_id' AS relationship_id,
        payload->>'subject' AS subject,
        payload->>'predicate' AS predicate,
        payload->>'object' AS object,
        COALESCE((payload->>'created_at')::timestamptz, pe.created_at) AS created_at,
        COALESCE(payload->>'status', 'active') AS status,
        COALESCE(payload->'metadata', '{}'::jsonb) AS metadata
      FROM ping_events pe
      WHERE pe.event_type = 'RELATIONSHIP_CREATED'
      ORDER BY payload->>'subject', payload->>'predicate', payload->>'object', pe.sequence DESC NULLS LAST, pe.created_at DESC, pe.event_id DESC
      ON CONFLICT (subject, predicate, object) DO NOTHING
    `);
    return result.rowCount ?? 0;
  }

  /**
   * Rebuild ping_transitions from the canonical journal in acceptance order.
   * Operation vocabulary (create/update/relate) is asserted against
   * ping-vocabulary.ts before insert. For relationship events the operation
   * is always 'relate'; whether the event relates or revokes is carried in
   * the transition metadata as relationship_status (the revocation is a
   * status on the same predicate, never a separate operation).
   * Transition IDs are produced by IdentityAuthority in TypeScript, never
   * synthesized in SQL. Per-target sequence is derived from acceptance order;
   * previous_transition chains each target's transitions.
   * FAILS CLOSED when a consumed event lacks payload_hash.
   */
  private async rebuildTransitions(db: ProjectorDb): Promise<number> {
    const events = await db.query<CanonicalJournalEvent>(`
      SELECT event_id, event_type, payload, pe.sequence AS acceptance_sequence, pe.created_at
      FROM ping_events pe
      WHERE pe.event_type IN ('OBJECT_CREATED', 'OBJECT_UPDATED', 'RELATIONSHIP_CREATED')
      ORDER BY pe.sequence ASC NULLS LAST, pe.created_at ASC, pe.event_id ASC
    `);

    let inserted = 0;
    const lastTransitionByTarget = new Map<string, string>();
    const sequenceByTarget = new Map<string, number>();

    for (const event of events.rows) {
      const payload = event.payload ?? {};
      const targetId = payload.object_id ?? payload.relationship_id;
      if (!targetId) {
        throw new Error(
          `PingProjector: ${event.event_type} event ${event.event_id} has no target ID in payload; refusing to project.`
        );
      }
      const payloadHash = payload.payload_hash;
      if (!payloadHash) {
        throw new Error(
          `PingProjector: FAIL CLOSED: ${event.event_type} event ${event.event_id} lacks payload_hash; refusing to project.`
        );
      }

      let operation: string;
      let actorId: string;
      let transitionMetadata: Record<string, any>;
      if (event.event_type === 'OBJECT_CREATED') {
        operation = 'create';
        actorId = payload.controller;
        transitionMetadata = payload.metadata ?? {};
      } else if (event.event_type === 'OBJECT_UPDATED') {
        operation = 'update';
        actorId = payload.updated_by;
        transitionMetadata = payload.metadata ?? {};
      } else {
        operation = 'relate';
        actorId = payload.subject;
        transitionMetadata = { ...(payload.metadata ?? {}), relationship_status: payload.status ?? 'active' };
      }
      assertProjectorOperation(operation);
      if (!actorId) {
        throw new Error(
          `PingProjector: FAIL CLOSED: ${event.event_type} event ${event.event_id} has no actor; refusing to project.`
        );
      }

      const sequence = (sequenceByTarget.get(targetId) ?? 0) + 1;
      sequenceByTarget.set(targetId, sequence);
      const transitionId = IdentityAuthority.generateId('transition', { event_id: event.event_id });
      const previousTransition = lastTransitionByTarget.get(targetId) ?? null;

      await db.query(
        `INSERT INTO ping_transitions
           (transition_id, object_id, operation, actor_id, sequence, previous_transition, payload_hash, timestamp, proof, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (object_id, sequence) DO NOTHING`,
        [
          transitionId,
          targetId,
          operation,
          actorId,
          sequence,
          previousTransition,
          payloadHash,
          event.created_at,
          JSON.stringify(payload.proof ?? {}),
          JSON.stringify(transitionMetadata),
        ]
      );
      inserted += 1;
      lastTransitionByTarget.set(targetId, transitionId);
    }

    return inserted;
  }

  /**
   * Surface same-ID/different-semantics collisions present in the journal:
   * OBJECT_CREATED rows sharing an object_id with more than one distinct
   * payload_hash. Collisions must be rejected at ingestion governance; this
   * is the projection-side detector for the fail-before collision proof.
   */
  async detectConflicts(): Promise<Array<{ object_id: string; distinct_hashes: number; event_ids: string[] }>> {
    const result = await this.config.db.query(`
      SELECT payload->>'object_id' AS object_id,
             COUNT(DISTINCT payload->>'payload_hash') AS distinct_hashes,
             array_agg(event_id ORDER BY sequence ASC NULLS LAST) AS event_ids
      FROM ping_events
      WHERE event_type = 'OBJECT_CREATED'
      GROUP BY payload->>'object_id'
      HAVING COUNT(DISTINCT payload->>'payload_hash') > 1
    `);
    return result.rows.map((r) => ({
      object_id: r.object_id,
      distinct_hashes: Number(r.distinct_hashes),
      event_ids: r.event_ids ?? [],
    }));
  }

  /**
   * Verify projection reproducibility: counts before and after a rebuild.
   */
  async verifyReproducibility(): Promise<boolean> {
    const before = await this.countProjections();
    await this.rebuildAll();
    const after = await this.countProjections();
    return (
      before.objects === after.objects &&
      before.relationships === after.relationships &&
      before.transitions === after.transitions
    );
  }

  /**
   * Count current projections
   */
  async countProjections(): Promise<{ objects: number; relationships: number; transitions: number }> {
    const db = this.config.db;
    const [objects, relationships, transitions] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM ping_objects'),
      db.query('SELECT COUNT(*) AS count FROM ping_relationships'),
      db.query('SELECT COUNT(*) AS count FROM ping_transitions'),
    ]);
    return {
      objects: parseInt(objects.rows[0].count, 10),
      relationships: parseInt(relationships.rows[0].count, 10),
      transitions: parseInt(transitions.rows[0].count, 10),
    };
  }
}
