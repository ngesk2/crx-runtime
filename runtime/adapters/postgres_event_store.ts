/**
 * POSTGRES EVENT STORE ADAPTER
 *
 * CONSTITUTIONAL ROLE
 *
 * Authority: YES
 * Creates Truth: YES (Event Persistence)
 * Derives Truth: NO
 * Stores Truth: YES (PostgreSQL)
 * Presents Truth: NO
 *
 * Constitutional Authority Class: EVENT_PERSISTENCE
 *
 * Truth Source:
 * runtime/kernel/replay/replay_event_stream.ts (constitutional event stream)
 *
 * Constitutional Flow:
 * 1. Receives events from ReplayEventStream via append()
 * 2. Persists events to PostgreSQL events table
 * 3. Provides events to ReplayStateMachine via loadStream()
 * 4. Supports range queries via loadRange()
 * 5. Verifies event integrity via verifyHash()
 *
 * This component DOES create constitutional truth (event persistence).
 * It is the constitutional event persistence authority.
 *
 * Infrastructure adapter for PostgreSQL event storage.
 * Depends on kernel/replay/ for canonicalization.
 * kernel/replay/ NEVER depends on this adapter.
 */

import { Pool, PoolClient } from 'pg';
import { CanonicalEventEnvelope } from '../kernel/replay/canonical_event_envelope';
import { ReplayEventStream } from '../kernel/replay/replay_event_stream';
import { CertificateAuthority } from '../kernel/replay/certificate_authority';

export class PostgresEventStore {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  /**
   * Initialize event store schema
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          event_id BIGSERIAL PRIMARY KEY,
          event_hash TEXT NOT NULL UNIQUE,
          event_type TEXT NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_events_event_hash ON events(event_hash);
        CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
        CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

        CREATE TABLE IF NOT EXISTS projection_status (
          event_id BIGINT PRIMARY KEY REFERENCES events(event_id) ON DELETE CASCADE,
          projected_qdrant BOOLEAN DEFAULT FALSE,
          projected_obsidian BOOLEAN DEFAULT FALSE,
          projected_newsletter BOOLEAN DEFAULT FALSE,
          projected_rss BOOLEAN DEFAULT FALSE
        );

        CREATE INDEX IF NOT EXISTS idx_projection_qdrant ON projection_status(projected_qdrant) WHERE projected_qdrant = FALSE;
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Append event to event store
   */
  async append(event: CanonicalEventEnvelope): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const eventHash = this.computeEventHash(event);

      await client.query(
        `INSERT INTO events (event_hash, event_type, payload)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_hash) DO NOTHING`,
        [eventHash, event.getEventType(), event.toJSON()]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Load complete event stream
   */
  async loadStream(): Promise<ReplayEventStream> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT payload FROM events ORDER BY event_id ASC`
      );

      const events = result.rows.map(row => new CanonicalEventEnvelope(row.payload));
      return new ReplayEventStream(events, '1.0');
    } finally {
      client.release();
    }
  }

  /**
   * Load event stream range
   */
  async loadRange(fromEventId: number, toEventId: number): Promise<ReplayEventStream> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT payload FROM events
         WHERE event_id >= $1 AND event_id <= $2
         ORDER BY event_id ASC`,
        [fromEventId, toEventId]
      );

      const events = result.rows.map(row => new CanonicalEventEnvelope(row.payload));
      return new ReplayEventStream(events, '1.0');
    } finally {
      client.release();
    }
  }

  /**
   * Verify event hash integrity
   */
  async verifyHash(eventId: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT event_hash, payload FROM events WHERE event_id = $1`,
        [eventId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const storedHash = result.rows[0].event_hash;
      const computedHash = this.computeEventHash(new CanonicalEventEnvelope(result.rows[0].payload));

      return storedHash === computedHash;
    } finally {
      client.release();
    }
  }

  /**
   * Mark event as projected to Qdrant
   */
  async markQdrantProjected(eventId: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO projection_status (event_id, projected_qdrant)
       VALUES ($1, TRUE)
       ON CONFLICT (event_id) DO UPDATE SET projected_qdrant = TRUE`,
      [eventId]
    );
  }

  /**
   * Get unprojected events for Qdrant
   */
  async getUnprojectedQdrantEvents(limit: number = 100): Promise<CanonicalEventEnvelope[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT e.payload
         FROM events e
         LEFT JOIN projection_status ps ON e.event_id = ps.event_id
         WHERE ps.projected_qdrant IS NULL OR ps.projected_qdrant = FALSE
         ORDER BY e.event_id ASC
         LIMIT $1`,
        [limit]
      );

      return result.rows.map(row => new CanonicalEventEnvelope(row.payload));
    } finally {
      client.release();
    }
  }

  /**
   * Compute event hash via canonical CertificateAuthority
   */
  private computeEventHash(event: CanonicalEventEnvelope): string {
    const payload = event.toJSON();
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return CertificateAuthority.sha256(canonical);
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
