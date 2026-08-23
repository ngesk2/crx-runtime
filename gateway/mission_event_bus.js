/**
 * Mission Event Bus
 * 
 * Phase 21 — Event Bus for State Transitions
 * 
 * Orchestrates state transitions through events:
 * 
 * MissionGenerated
 * ↓
 * MissionQueued
 * ↓
 * MissionPrioritized
 * ↓
 * MissionScheduled
 * ↓
 * MissionStarted
 * ↓
 * MissionCompleted
 * ↓
 * PatchGenerated
 * ↓
 * ReplayPassed
 * ↓
 * CommitApproved
 * 
 * Replaces synchronous direct calls with event-driven architecture.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');

class MissionEventBus {
  constructor(postgresPool, eventOutbox = null) {
    this._postgres = postgresPool;
    this._eventOutbox = eventOutbox;
    this._subscribers = new Map();
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize event bus
   */
  async initialize() {
    await this._createTables();
    await this._startEventProcessor();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS mission_events (
        event_id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB NOT NULL,
        event_hash VARCHAR(64) NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_events_type ON mission_events(event_type)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_events_processed ON mission_events(processed)
    `);
  }

  /**
   * Start event processor
   */
  async _startEventProcessor() {
    // Process events every second
    setInterval(async () => {
      await this._processEvents();
    }, 1000);
  }

  /**
   * Publish event
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @returns {Object} Published event
   */
  async publish(eventType, eventData) {
    // Use outbox if available for durability
    if (this._eventOutbox) {
      await this._eventOutbox.publish(eventType, eventData);
    }

    const eventId = this._generateEventId(eventType);
    const eventHash = CanonicalAuthority.hash({ event_type: eventType, event_data: eventData });

    const event = {
      event_id: eventId,
      event_type: eventType,
      event_data: eventData,
      event_hash: eventHash,
      created_at: constitutionalTimeAuthority.now()
    };

    // Store event
    await this._postgres.query(`
      INSERT INTO mission_events (event_id, event_type, event_data, event_hash)
      VALUES ($1, $2, $3, $4)
    `, [eventId, eventType, JSON.stringify(eventData), eventHash]);

    // Create event witness
    const witness = witnessAuthority.createWitness(event, {
      authority: 'MissionEventBus',
      authority_version: '21.0.0'
    });

    event.witness = witness;

    console.log(`[MissionEventBus] Published event: ${eventType} (${eventId})`);

    return event;
  }

  /**
   * Subscribe to event type
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   */
  subscribe(eventType, handler) {
    if (!this._subscribers.has(eventType)) {
      this._subscribers.set(eventType, []);
    }
    this._subscribers.get(eventType).push(handler);
    console.log(`[MissionEventBus] Subscribed to: ${eventType}`);
  }

  /**
   * Process events
   */
  async _processEvents() {
    // Get unprocessed events
    const result = await this._postgres.query(`
      SELECT * FROM mission_events
      WHERE processed = FALSE
      ORDER BY created_at ASC
      LIMIT 10
    `, []);

    for (const event of result.rows) {
      await this._processEvent(event);
    }
  }

  /**
   * Process single event
   * @param {Object} event - Event
   */
  async _processEvent(event) {
    const handlers = this._subscribers.get(event.event_type) || [];

    for (const handler of handlers) {
      try {
        await handler(event.event_data);
      } catch (error) {
        console.error(`[MissionEventBus] Handler error for ${event.event_type}:`, error.message);
      }
    }

    // Mark as processed
    await this._postgres.query(`
      UPDATE mission_events
      SET processed = TRUE, processed_at = NOW()
      WHERE event_id = $1
    `, [event.event_id]);

    console.log(`[MissionEventBus] Processed event: ${event.event_type} (${event.event_id})`);
  }

  /**
   * Get events
   * @param {string} eventType - Event type filter
   * @param {number} limit - Result limit
   * @returns {Array} Events
   */
  async getEvents(eventType = null, limit = 100) {
    let query = `
      SELECT * FROM mission_events
    `;
    const params = [];

    if (eventType) {
      query += ` WHERE event_type = $1`;
      params.push(eventType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this._postgres.query(query, params);
    return result.rows;
  }

  /**
   * Get event
   * @param {string} eventId - Event ID
   * @returns {Object} Event
   */
  async getEvent(eventId) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_events WHERE event_id = $1
    `, [eventId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Verify event hash
   * @param {string} eventId - Event ID
   * @returns {Object} Verification result
   */
  async verifyEventHash(eventId) {
    const result = await this._postgres.query(`
      SELECT event_data, event_hash FROM mission_events WHERE event_id = $1
    `, [eventId]);

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Event not found' };
    }

    const event = result.rows[0];
    const computedHash = CanonicalAuthority.hash(event.event_data);
    const valid = computedHash === event.event_hash;

    return {
      valid: valid,
      reason: valid ? 'Hash verified' : 'Hash mismatch'
    };
  }

  /**
   * Generate event ID
   * @param {string} eventType - Event type
   * @returns {string} Event ID
   */
  _generateEventId(eventType) {
    const data = { event_type: eventType, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `event_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '21.0.0',
      constitutional_version: '21.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `event_bus_${hash.substring(0, 16)}`;
  }
}

module.exports = { MissionEventBus };
