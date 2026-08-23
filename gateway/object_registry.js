/**
 * Global Object Registry
 * 
 * Central authority for all ConstitutionalObject lookups.
 * Phase 36F: Entropy Sealing - Use constitutional time for cache expiry
 * 
 * Responsibilities:
 * - lookup(id)
 * - lookup(hash)
 * - lookup(kind)
 * - lookup(lineage)
 * - lookup(version)
 * - lookup(authority)
 * - lookup(children)
 * - lookup(parents)
 * 
 * Constitutional Constraint: All object access must go through the registry.
 * No direct table access allowed.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ObjectRegistry {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._cache = new Map(); // In-memory cache for frequently accessed objects
    this._cacheTTL = 60000; // 60 seconds cache TTL
  }

  async lookupById(id) {
    // Check cache first
    const cached = this._getFromCache(id);
    if (cached) return cached;

    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) return null;

    const obj = result.rows[0].event_data;
    this._addToCache(id, obj);
    return obj;
  }

  async lookupByHash(canonicalHash) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->>'canonical_hash' = $1
      LIMIT 1
    `, [canonicalHash]);

    if (result.rows.length === 0) return null;

    return result.rows[0].event_data;
  }

  async lookupByKind(kind, limit = 100, offset = 0) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE aggregate_type = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `, [kind, limit, offset]);

    return result.rows.map(row => row.event_data);
  }

  async lookupByLineage(sourceId) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'lineage'->>'source_id' = $1
      ORDER BY timestamp DESC
    `, [sourceId]);

    return result.rows.map(row => row.event_data);
  }

  async lookupByVersion(schemaVersion) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'metadata'->>'schema_version' = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `, [schemaVersion]);

    return result.rows.map(row => row.event_data);
  }

  async lookupByAuthority(authority) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->>'authority' = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `, [authority]);

    return result.rows.map(row => row.event_data);
  }

  async lookupChildren(parentId) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'relationships' @> $1
      ORDER BY timestamp DESC
    `, [JSON.stringify([{ target_id: parentId }])]);

    return result.rows.map(row => row.event_data);
  }

  async lookupParents(childId) {
    // Find objects that reference this object in their relationships
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'relationships' @> $1
      ORDER BY timestamp DESC
    `, [JSON.stringify([{ target_id: childId }])]);

    return result.rows.map(row => row.event_data);
  }

  async lookupByLifecycle(lifecycleId) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'metadata'->>'lifecycle_id' = $1
      ORDER BY timestamp ASC
    `, [lifecycleId]);

    return result.rows.map(row => row.event_data);
  }

  async lookupByKindAndLifecycle(kind, lifecycleId) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE aggregate_type = $1 
      AND event_data->'metadata'->>'lifecycle_id' = $2
      ORDER BY timestamp ASC
    `, [kind, lifecycleId]);

    return result.rows.map(row => row.event_data);
  }

  async register(obj) {
    // Register object in cache
    this._addToCache(obj.id, obj);
    return obj;
  }

  async exists(id) {
    const cached = this._getFromCache(id);
    if (cached) return true;

    const result = await this._postgres.query(`
      SELECT 1 
      FROM events 
      WHERE event_id = $1
      LIMIT 1
    `, [id]);

    return result.rows.length > 0;
  }

  async count(kind = null) {
    if (kind) {
      const result = await this._postgres.query(`
        SELECT COUNT(*) 
        FROM events 
        WHERE aggregate_type = $1
      `, [kind]);
      return parseInt(result.rows[0].count, 10);
    }

    const result = await this._postgres.query(`
      SELECT COUNT(*) 
      FROM events
    `);
    return parseInt(result.rows[0].count, 10);
  }

  _getFromCache(id) {
    const cached = this._cache.get(id);
    if (cached && cached.expiry > constitutionalTimeAuthority.nowAsMillis()) {
      return cached.data;
    }
    if (cached) {
      this._cache.delete(id);
    }
    return null;
  }

  _addToCache(id, data) {
    this._cache.set(id, {
      data,
      expiry: constitutionalTimeAuthority.nowAsMillis() + this._cacheTTL,
    });
  }

  clearCache() {
    this._cache.clear();
  }
}

module.exports = { ObjectRegistry };
