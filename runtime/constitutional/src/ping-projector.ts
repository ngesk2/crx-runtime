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
 * Consumes only REGISTERED event types: OBJECT_CREATED, RELATIONSHIP_CREATED.
 * The legacy unregistered ping.create / ping.relate vocabulary is not read.
 *
 * Dependency inversion: the projector takes an injected minimal database
 * client. It does not import a database driver, so this package carries no
 * pg dependency. No SQL md5() fallbacks, no hand-rolled identity or hash
 * paths: IDs and hashes are produced by IdentityAuthority / HashAuthority
 * in TypeScript, never synthesized in SQL.
 */

import { IdentityAuthority } from './identity-authority';

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
   * Rebuild ping_objects from OBJECT_CREATED events, oldest acceptance first.
   * ON CONFLICT DO NOTHING keeps rebuilds idempotent; same-ID conflicts with
   * different content are a governance concern (rejected at ingestion), and
   * detectConflicts() surfaces them for inspection.
   */
  private async rebuildObjects(db: ProjectorDb): Promise<number> {
    const result = await db.query(`
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
      ORDER BY pe.sequence ASC NULLS LAST
      ON CONFLICT (object_id) DO NOTHING
    `);
    return result.rowCount ?? 0;
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
      ORDER BY payload->>'subject', payload->>'predicate', payload->>'object', pe.sequence DESC NULLS LAST
      ON CONFLICT (subject, predicate, object) DO NOTHING
    `);
    return result.rowCount ?? 0;
  }

  /**
   * Rebuild ping_transitions from the canonical journal in acceptance order.
   * Transition IDs are produced by IdentityAuthority in TypeScript, never
   * synthesized in SQL. Per-target sequence is derived from acceptance order;
   * previous_transition chains each target's transitions.
   * FAILS CLOSED when a consumed event lacks payload_hash.
   */
  private async rebuildTransitions(db: ProjectorDb): Promise<number> {
    const events = await db.query<CanonicalJournalEvent>(`
      SELECT event_id, event_type, payload, pe.sequence AS acceptance_sequence, pe.created_at
      FROM ping_events pe
      WHERE pe.event_type IN ('OBJECT_CREATED', 'RELATIONSHIP_CREATED')
      ORDER BY pe.sequence ASC NULLS LAST
    `);

    let inserted = 0;
    const lastTransitionByTarget = new Map<string, string>();
    const sequenceByTarget = new Map<string, number>();

    for (const event of events.rows) {
      const payload = event.payload ?? {};
      const isObject = event.event_type === 'OBJECT_CREATED';
      const targetId = isObject ? payload.object_id : payload.relationship_id;
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
      const operation = isObject ? 'create' : payload.status === 'inactive' ? 'unrelate' : 'relate';
      const actorId = isObject ? payload.controller : payload.subject;
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
          JSON.stringify(payload.metadata ?? {}),
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
