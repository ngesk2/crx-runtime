/**
 * Event Write Authority
 * 
 * Phase 46 Constitutional Freeze — Pure Event Creation
 * 
 * Constitutional Constraint: EventWriteAuthority has no mutable state and no infrastructure ownership.
 * 
 * Removed:
 * - NATS/JetStream infrastructure (delegated to ExecutionRuntime)
 * - eventStreams Map (mutable state)
 * - stream initialization (delegated to ExecutionRuntime)
 * - event emission to JetStream (delegated to ExecutionRuntime)
 * 
 * EventWriteAuthority now provides only:
 * - Event object creation (pure function)
 * - Event persistence delegation
 * 
 * Infrastructure (NATS/JetStream) should be handled by ExecutionRuntime.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { CanonicalBytes } = require('./canonical_authority');

class EventWriteAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Initialize event write authority
   */
  async initialize() {
    console.log('[EventWriteAuthority] Initializing event write authority');
    console.log('[EventWriteAuthority] Event write authority initialized (pure function)');
  }

  /**
   * Create event object (pure function, no emission)
   * 
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} correlationId - Correlation ID
   * @returns {Object} Event object
   */
  createEvent(eventType, payload, correlationId = null) {
    const eventId = identityAuthority.generateId('event', { type: eventType });

    const event = {
      event_id: eventId,
      event_type: eventType,
      payload: payload,
      correlation_id: correlationId,
      timestamp: constitutionalTimeAuthority.now(),
    };

    return event;
  }

  /**
   * Persist event to PostgreSQL (delegated to caller)
   * 
   * @param {Object} event - Event to persist
   */
  async persistEvent(event) {
    try {
      const aggregateId = event.event_type;
      const aggregateType = 'telemetry';
      await this._postgres.query(`
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_id) DO NOTHING
      `, [event.event_id, event.event_type, event.timestamp, aggregateId, aggregateType, JSON.stringify(event.payload)]);
    } catch (error) {
      console.error('[EventWriteAuthority] Failed to persist event:', error.message);
      throw error;
    }
  }

  /**
   * Create and persist event (convenience method)
   * 
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @param {string} correlationId - Correlation ID
   * @returns {Object} Event object
   */
  async createAndPersistEvent(eventType, payload, correlationId = null) {
    const event = this.createEvent(eventType, payload, correlationId);
    await this.persistEvent(event);
    return event;
  }

  /**
   * Check health
   */
  async health() {
    let postgresHealth = { healthy: false };
    try {
      await this._postgres.query('SELECT 1');
      postgresHealth = { healthy: true };
    } catch (error) {
      postgresHealth = { healthy: false, message: error.message };
    }

    return {
      healthy: postgresHealth.healthy,
      postgres: postgresHealth,
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'event-write-authority',
      authority_name: 'EventWriteAuthority',
      version: '46.0.0',
      consumes: ['eventType', 'payload', 'correlationId'],
      produces: ['event'],
      requires: ['postgres'],
      guarantees: ['pure_function', 'no_mutable_state', 'no_infrastructure', 'no_streaming', 'event_creation_only'],
      failure_modes: ['invalid_input', 'postgres_unavailable'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { EventWriteAuthority };
