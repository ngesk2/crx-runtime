/**
 * PING Projection Rebuilder
 * Rebuilds ping_objects, ping_relationships, ping_transitions from canonical event history
 * 
 * These tables are PROJECTIONS / MATERIALIZED STATE
 * Canonical truth resides in the events table
 * These tables can be destroyed and rebuilt from canonical history
 */

import { Pool, PoolClient } from 'pg';

export interface PingProjectorConfig {
  connectionString: string;
}

export class PingProjector {
  private pool: Pool;

  constructor(config: PingProjectorConfig) {
    this.pool = new Pool({ connectionString: config.connectionString });
  }

  /**
   * Initialize projection tables
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Read and execute ping_objects.sql
      const schemaSql = await this.readSchemaSql();
      await client.query(schemaSql);
    } finally {
      client.release();
    }
  }

  /**
   * Rebuild all projections from canonical event history
   */
  async rebuildAll(): Promise<{
    objects: number;
    relationships: number;
    transitions: number;
  }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Clear existing projections
      await client.query('TRUNCATE TABLE ping_objects CASCADE');
      await client.query('TRUNCATE TABLE ping_relationships CASCADE');
      await client.query('TRUNCATE TABLE ping_transitions CASCADE');

      // Rebuild from canonical event history
      const objectCount = await this.rebuildObjects(client);
      const relationshipCount = await this.rebuildRelationships(client);
      const transitionCount = await this.rebuildTransitions(client);

      await client.query('COMMIT');

      return {
        objects: objectCount,
        relationships: relationshipCount,
        transitions: transitionCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rebuild ping_objects from canonical event history
   */
  private async rebuildObjects(client: PoolClient): Promise<number> {
    const result = await client.query(`
      INSERT INTO ping_objects (object_id, schema, controller, created_at, content, refs, visibility, status, metadata)
      SELECT 
        payload->>'object_id' as object_id,
        payload->>'schema' as schema,
        payload->>'controller' as controller,
        created_at,
        payload->'content' as content,
        COALESCE(payload->'refs', '[]') as refs,
        COALESCE(payload->>'visibility', 'public') as visibility,
        COALESCE(payload->>'status', 'active') as status,
        COALESCE(payload->'metadata', '{}') as metadata
      FROM events
      WHERE event_type = 'ping.create'
      ON CONFLICT (object_id) DO NOTHING
      RETURNING object_id
    `);

    return result.rowCount || 0;
  }

  /**
   * Rebuild ping_relationships from canonical event history
   */
  private async rebuildRelationships(client: PoolClient): Promise<number> {
    const result = await client.query(`
      INSERT INTO ping_relationships (relationship_id, subject, predicate, object, created_at, status, metadata)
      SELECT 
        payload->>'relationship_id' as relationship_id,
        payload->>'subject' as subject,
        payload->>'predicate' as predicate,
        payload->>'object' as object,
        created_at,
        COALESCE(payload->>'status', 'active') as status,
        COALESCE(payload->'metadata', '{}') as metadata
      FROM events
      WHERE event_type = 'ping.relate'
      ON CONFLICT (subject, predicate, object) DO NOTHING
      RETURNING relationship_id
    `);

    return result.rowCount || 0;
  }

  /**
   * Rebuild ping_transitions from canonical event history
   */
  private async rebuildTransitions(client: PoolClient): Promise<number> {
    const result = await client.query(`
      INSERT INTO ping_transitions (transition_id, object_id, operation, actor_id, sequence, previous_transition, payload_hash, timestamp, proof, metadata)
      SELECT 
        payload->>'transition_id' as transition_id,
        payload->>'object_id' as object_id,
        payload->>'operation' as operation,
        payload->>'actor_id' as actor_id,
        (payload->>'sequence')::BIGINT as sequence,
        payload->>'previous_transition' as previous_transition,
        payload->>'payload_hash' as payload_hash,
        created_at as timestamp,
        COALESCE(payload->'proof', '{}') as proof,
        COALESCE(payload->'metadata', '{}') as metadata
      FROM events
      WHERE event_type LIKE 'ping.%'
      ON CONFLICT (object_id, sequence) DO NOTHING
      RETURNING transition_id
    `);

    return result.rowCount || 0;
  }

  /**
   * Verify projection reproducibility
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
  async countProjections(): Promise<{
    objects: number;
    relationships: number;
    transitions: number;
  }> {
    const client = await this.pool.connect();
    try {
      const [objects, relationships, transitions] = await Promise.all([
        client.query('SELECT COUNT(*) FROM ping_objects'),
        client.query('SELECT COUNT(*) FROM ping_relationships'),
        client.query('SELECT COUNT(*) FROM ping_transitions')
      ]);

      return {
        objects: parseInt(objects.rows[0].count),
        relationships: parseInt(relationships.rows[0].count),
        transitions: parseInt(transitions.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Read schema SQL from file
   */
  private async readSchemaSql(): Promise<string> {
    // In production, read from database/ping_objects.sql
    // For now, return empty string (schema should be pre-created)
    return '';
  }
}
