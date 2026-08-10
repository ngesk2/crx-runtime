/**
 * Canonical Event Envelope Authority
 * 
 * P001: The standardized event schema for all TenantOS events.
 * 
 * Every tenant (HPP, future) emits events through this envelope.
 * PING observes events through this envelope.
 * No business logic lives in this authority.
 * 
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - Deterministic event IDs (UUID v5)
 * - Immutability enforced
 * - Tenant isolation enforced
 * - Canonical identity: event://{eventId}
 */

const crypto = require('crypto');
const { computeCanonicalHash } = require('../ping-runtime/authorities/constitutional_validation');

class CanonicalEventEnvelope {
  constructor(storage) {
    this._storage = storage;
    this._sequences = new Map();
    this._dependencies = ['storage'];
    this._authorityVersion = '1.0.0';
  }

  /**
   * Declare dependencies for computed startup ordering
   * 
   * @returns {string[]} Required service names
   */
  get dependencies() {
    return this._dependencies;
  }

  /**
   * Initialize tables
   */
  async initialize() {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '..', 'database', 'canonical_events.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await this._storage.query(schema);
    console.log('[CanonicalEventEnvelope] Tables initialized');
  }

  /**
   * Canonicalize event ID to URI format
   * 
   * @param {string} eventId - Raw event ID
   * @returns {string} Canonical URI
   */
  canonicalizeId(eventId) {
    if (eventId.startsWith('event://')) return eventId;
    return `event://${eventId}`;
  }

  /**
   * Generate deterministic event ID
   * 
   * @param {string} tenantId
   * @param {string} eventType
   * @param {string} timestamp
   * @param {number} sequence
   * @returns {string} UUID v5
   */
  generateEventId(tenantId, eventType, timestamp, sequence) {
    const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID v5 DNS namespace
    const name = `${tenantId}:${eventType}:${timestamp}:${sequence}`;
    
    // Deterministic UUID v5
    const hash = crypto.createHash('sha1')
      .update(namespace.replace(/-/g, ''), 'hex')
      .update(name)
      .digest();
    
    hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
    hash[8] = (hash[8] & 0x3f) | 0x80; // Variant 10
    
    return [
      hash.slice(0, 4).toString('hex'),
      hash.slice(4, 6).toString('hex'),
      hash.slice(6, 8).toString('hex'),
      hash.slice(8, 10).toString('hex'),
      hash.slice(10, 16).toString('hex'),
    ].join('-');
  }

  /**
   * Get next sequence number for tenant
   * 
   * @param {string} tenantId
   * @returns {number}
   */
  async getNextSequence(tenantId) {
    const result = await this._storage.query(
      `SELECT COALESCE(MAX(sequence), 0) + 1 as next_seq 
       FROM canonical_events 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(result.rows[0].next_seq);
  }

  /**
   * Execute EmitEventCommand
   * 
   * Creates and persists an event envelope. Deterministic ID generation.
   * 
   * @param {Object} command
   * @param {string} command.tenantId - Tenant identifier
   * @param {string} command.eventType - Event type (e.g., "estimate.submitted")
   * @param {string} command.source - Source service (e.g., "hpp-api")
   * @param {string} command.actor - Actor (user ID or "system")
   * @param {Object} command.payload - Event payload
   * @param {string} [command.causationId] - Event that caused this
   * @param {string} [command.correlationId] - Business transaction ID
   * @param {Object} [command.metadata] - Additional metadata
   * @returns {Object} Persisted event
   */
  async executeEmitEvent(command) {
    const {
      tenantId,
      eventType,
      source,
      actor,
      payload,
      causationId = null,
      correlationId = null,
      metadata = {}
    } = command;

    const sequence = await this.getNextSequence(tenantId);
    const timestamp = new Date().toISOString();
    const eventId = this.generateEventId(tenantId, eventType, timestamp, sequence);

    const event = {
      event_id: eventId,
      event_type: eventType,
      event_version: '1.0.0',
      tenant_id: tenantId,
      timestamp,
      sequence,
      source,
      actor,
      causation_id: causationId,
      correlation_id: correlationId,
      payload,
      metadata: {
        ...metadata,
        created_at: timestamp,
      },
      processed: false,
      processed_at: null,
      worker: null,
      retries: 0,
      last_error: null,
      created_at: timestamp,
    };

    // Validate
    const validation = this.executeValidateEvent(event);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    // Persist
    await this._storage.query(
      `INSERT INTO canonical_events 
       (event_id, event_type, event_version, tenant_id, timestamp, sequence, 
        source, actor, causation_id, correlation_id, payload, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (tenant_id, sequence) DO NOTHING`,
      [
        event.event_id, event.event_type, event.event_version, event.tenant_id,
        event.timestamp, event.sequence, event.source, event.actor,
        event.causation_id, event.correlation_id,
        JSON.stringify(event.payload), JSON.stringify(event.metadata),
      ]
    );

    return event;
  }

  /**
   * Execute ValidateEventQuery
   * 
   * @param {Object} event
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  executeValidateEvent(event) {
    const errors = [];

    if (!event.event_id) errors.push('event_id required');
    if (!event.event_type) errors.push('event_type required');
    if (!event.event_version) errors.push('event_version required');
    if (!event.tenant_id) errors.push('tenant_id required');
    if (!event.timestamp) errors.push('timestamp required');
    if (event.sequence === undefined || event.sequence === null) errors.push('sequence required');
    if (!event.source) errors.push('source required');
    if (!event.actor) errors.push('actor required');
    if (!event.payload) errors.push('payload required');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute QueryEventsQuery
   * 
   * @param {Object} params
   * @param {string} [params.tenantId] - Filter by tenant
   * @param {string} [params.eventType] - Filter by event type
   * @param {string} [params.correlationId] - Filter by correlation ID
   * @param {string} [params.from] - Start timestamp
   * @param {string} [params.to] - End timestamp
   * @param {number} [params.limit] - Max results
   * @param {number} [params.offset] - Skip results
   * @returns {Object[]} Events
   */
  async executeQueryEvents({
    tenantId,
    eventType,
    correlationId,
    from,
    to,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = 'SELECT * FROM canonical_events WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (tenantId) {
      query += ` AND tenant_id = $${paramIndex++}`;
      params.push(tenantId);
    }

    if (eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(eventType);
    }

    if (correlationId) {
      query += ` AND correlation_id = $${paramIndex++}`;
      params.push(correlationId);
    }

    if (from) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(from);
    }

    if (to) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(to);
    }

    query += ` ORDER BY tenant_id, sequence ASC`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this._storage.query(query, params);
    return result.rows;
  }

  /**
   * Execute GetEventStatsQuery
   * 
   * @param {string} [tenantId] - Filter by tenant
   * @returns {Object} Stats
   */
  async executeGetStats(tenantId) {
    let query = `
      SELECT 
        tenant_id,
        COUNT(*) as total_events,
        COUNT(DISTINCT event_type) as event_types,
        MIN(timestamp) as first_event,
        MAX(timestamp) as last_event,
        COUNT(CASE WHEN NOT processed THEN 1 END) as unprocessed
      FROM canonical_events`;
    
    const params = [];
    if (tenantId) {
      query += ' WHERE tenant_id = $1';
      params.push(tenantId);
    }
    
    query += ' GROUP BY tenant_id';
    
    const result = await this._storage.query(query, params);
    return result.rows;
  }

  /**
   * Execute MarkEventProcessedCommand
   * 
   * @param {string} eventId
   * @param {string} worker
   */
  async executeMarkProcessed(eventId, worker) {
    await this._storage.query(
      `UPDATE canonical_events 
       SET processed = TRUE, processed_at = NOW(), worker = $1 
       WHERE event_id = $2`,
      [worker, eventId]
    );
  }

  /**
   * Execute MarkEventFailedCommand
   * 
   * @param {string} eventId
   * @param {string} worker
   * @param {string} error
   */
  async executeMarkFailed(eventId, worker, error) {
    await this._storage.query(
      `UPDATE canonical_events 
       SET retries = retries + 1, last_error = $1 
       WHERE event_id = $2`,
      [error, eventId]
    );
  }

  /**
   * Execute GetUnprocessedEventsQuery
   * 
   * @param {string} tenantId
   * @param {number} limit
   * @returns {Object[]} Events
   */
  async executeGetUnprocessed(tenantId, limit = 100) {
    const result = await this._storage.query(
      `SELECT * FROM canonical_events 
       WHERE NOT processed AND tenant_id = $1 
       ORDER BY tenant_id, sequence ASC 
       LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  }

  /**
   * Health check
   */
  async health() {
    try {
      await this._storage.query('SELECT 1');
      return { healthy: true, storage: { healthy: true } };
    } catch (error) {
      return { healthy: false, storage: { healthy: false, error: error.message } };
    }
  }

  /**
   * Publish contract with hash
   */
  publishContract() {
    const contract = {
      authority_id: 'canonical-event-envelope',
      authority_name: 'CanonicalEventEnvelope',
      version: this._authorityVersion,
      owner: 'ping',
      consumes: ['tenantId', 'eventType', 'source', 'actor', 'payload'],
      produces: ['event'],
      guarantees: ['deterministic_id', 'immutable', 'ordered', 'tenant_isolated'],
      invariants: [
        'event_id is deterministic UUID v5 from (tenant_id, event_type, timestamp, sequence)',
        'event cannot be modified after creation',
        'tenant A cannot read tenant B events',
        'sequence is monotonically increasing per tenant',
        'event_id is canonical URI: event://{eventId}',
      ],
      consumers: ['tenantRegistry', 'deploymentRegistry', 'runtimeRegistry', 'workerRuntime'],
      requires: ['storage'],
      failure_modes: ['invalid_input', 'postgres_unavailable', 'sequence_collision'],
      rollback: 'none',
      determinism: 'deterministic',
      dependencies: this._dependencies,
      schema_version: '1.0.0',
      event_version: '1.0.0',
      authority_version: this._authorityVersion,
    };

    contract.contract_hash = computeCanonicalHash(contract);

    return contract;
  }
}

module.exports = { CanonicalEventEnvelope };
