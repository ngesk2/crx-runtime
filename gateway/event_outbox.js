/**
 * Event Outbox
 * 
 * Phase 21 — Durable Event Publication with Outbox Pattern
 * 
 * Ensures events are never lost by using the Outbox pattern:
 * 
 * DB Transaction
 * ↓
 * Write to Outbox
 * ↓
 * COMMIT
 * ↓
 * Publisher reads Outbox
 * ↓
 * Publish to Redis/WebSocket
 * ↓
 * Mark as published
 * 
 * If process dies after commit, events remain in outbox
 * and will be published on restart.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { StandardEventSchema } = require('../ping-runtime/events/standard_event_schema');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');

class EventOutbox {
  constructor(postgresPool, eventBus, redisClient = null, transactionBoundary = null) {
    this._postgres = postgresPool;
    this._eventBus = eventBus;
    this._redis = redisClient;
    this._transactionBoundary = transactionBoundary;
    this._authorityId = identityAuthority.generateId('outbox', { type: 'EventOutbox' });
  }

  /**
   * Initialize outbox
   */
  async initialize() {
    await this._createTables();
    await this._startPublisher();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS event_outbox (
        outbox_id VARCHAR(64) PRIMARY KEY,
        event_id VARCHAR(64) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        aggregate_id VARCHAR(64) NOT NULL,
        aggregate_type VARCHAR(100) NOT NULL,
        authority VARCHAR(100) NOT NULL,
        authority_version VARCHAR(20) NOT NULL,
        causation_id VARCHAR(64),
        correlation_id VARCHAR(64),
        payload_version INTEGER NOT NULL DEFAULT 1,
        canonical_event JSONB NOT NULL,
        published BOOLEAN DEFAULT FALSE,
        published_at TIMESTAMP,
        publish_attempts INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_published ON event_outbox(published)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_created ON event_outbox(created_at)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_aggregate ON event_outbox(aggregate_id, aggregate_type)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_correlation ON event_outbox(correlation_id)
    `);

    // Add unique constraint to prevent duplicate events
    await this._postgres.query(`
      ALTER TABLE event_outbox 
      ADD CONSTRAINT IF NOT EXISTS uq_outbox_event_id UNIQUE (event_id)
    `);
  }

  /**
   * Start publisher
   */
  async _startPublisher() {
    // Process outbox every second
    setInterval(async () => {
      await this._processOutbox();
    }, 1000);
  }

  /**
   * Write event to outbox (called within transaction)
   * @param {Object} client - PostgreSQL client (optional, for transactional writes)
   * @param {Object} event - Standard event object
   * @param {Object} witness - Witness object
   * @returns {string} Outbox ID
   */
  async write(client, event, witness = null) {
    // Validate event against StandardEventSchema
    const validatedEvent = StandardEventSchema.validate(event);
    
    const outboxId = identityAuthority.generateOutboxId(validatedEvent.event_type);

    // Use provided client or transaction context, otherwise direct query
    const queryFn = client ? client.query.bind(client) : 
                   (this._transactionBoundary?.getTransactionContext()?.query.bind(this._transactionBoundary.getTransactionContext())) ||
                   this._postgres.query.bind(this._postgres);

    const { CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

    // Attach witness to event before serialization
    const eventWithWitness = {
      ...validatedEvent,
      witness: witness
    };

    // Store canonical serialized event directly
    await queryFn(`
      INSERT INTO event_outbox (
        outbox_id, event_id, event_type, aggregate_id, aggregate_type,
        authority, authority_version, causation_id, correlation_id,
        payload_version, canonical_event
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      outboxId,
      validatedEvent.event_id,
      validatedEvent.event_type,
      validatedEvent.aggregate_id,
      validatedEvent.aggregate_type,
      validatedEvent.authority,
      validatedEvent.authority_version,
      validatedEvent.causation_id,
      validatedEvent.correlation_id,
      validatedEvent.payload_version,
      CanonicalBytes.serialize(eventWithWitness)
    ]);

    return outboxId;
  }

  /**
   * Publish event (immediate, non-durable)
   * @param {Object} event - Standard event object
   * @deprecated: Direct publishing violates constitutional outbox pattern. Use write() only.
   * OutboxWorker is the sole publisher of events.
   */
  async publish(event) {
    // Constitutional violation: Only OutboxWorker should publish events
    // EventOutbox should only write to the outbox table
    throw new Error('ConstitutionalViolation: EventOutbox.publish() is deprecated. Only OutboxWorker should publish events. Use write() to queue events for publication.');
  }

  /**
   * Process outbox
   */
  async _processOutbox() {
    // Get unpublished events with ordering guarantee
    const result = await this._postgres.query(`
      SELECT * FROM event_outbox
      WHERE published = FALSE
      AND publish_attempts < 5
      ORDER BY created_at ASC, outbox_id ASC
      LIMIT 10
    `, []);

    for (const event of result.rows) {
      await this._publishOutboxEvent(event);
    }
  }

  /**
   * Publish outbox event
   * @param {Object} event - Outbox event
   */
  async _publishOutboxEvent(event) {
    try {
      // Deserialize canonical event directly
      const { CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
      const standardEvent = CanonicalBytes.deserialize(event.canonical_event);

      // Publish to subscribers
      await this._publishToSubscribers(event.event_type, standardEvent);

      // Mark as published
      await this._postgres.query(`
        UPDATE event_outbox
        SET published = TRUE, published_at = NOW()
        WHERE outbox_id = $1
      `, [event.outbox_id]);

    } catch (error) {
      // Increment publish attempts
      await this._postgres.query(`
        UPDATE event_outbox
        SET publish_attempts = publish_attempts + 1, error_message = $1
        WHERE outbox_id = $2
      `, [error.message, event.outbox_id]);
    }
  }

  /**
   * Publish to subscribers
   * @param {string} eventType - Event type
   * @param {Object} event - Standard event object
   */
  async _publishToSubscribers(eventType, event) {
    // Publish via Redis if available
    if (this._redis) {
      await this._redis.publish('events', JSON.stringify(event));
    }

    // Trigger event bus subscribers
    if (this._eventBus) {
      // Get subscribers for this event type
      const handlers = this._eventBus._subscribers.get(eventType) || [];
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventOutbox] Handler error for ${eventType}:`, error.message);
        }
      }
    }
  }

  /**
   * Get unpublished events
   * @returns {Array} Unpublished events
   */
  async getUnpublishedEvents() {
    const result = await this._postgres.query(`
      SELECT * FROM event_outbox
      WHERE published = FALSE
      ORDER BY created_at ASC
      LIMIT 100
    `, []);

    return result.rows;
  }

  /**
   * Get failed events
   * @returns {Array} Failed events
   */
  async getFailedEvents() {
    const result = await this._postgres.query(`
      SELECT * FROM event_outbox
      WHERE published = FALSE
      AND publish_attempts >= 5
      ORDER BY created_at ASC
      LIMIT 100
    `, []);

    return result.rows;
  }

  /**
   * Retry failed event
   * @param {string} outboxId - Outbox ID
   */
  async retryFailedEvent(outboxId) {
    await this._postgres.query(`
      UPDATE event_outbox
      SET publish_attempts = 0, error_message = NULL
      WHERE outbox_id = $1
    `, [outboxId]);
  }

  /**
   * Clean old published events
   * @param {number} daysToKeep - Days to keep
   */
  async cleanOldEvents(daysToKeep = 7) {
    await this._postgres.query(`
      DELETE FROM event_outbox
      WHERE published = TRUE
      AND published_at < NOW() - INTERVAL '1 day' * $1
    `, [daysToKeep]);
  }
}

module.exports = { EventOutbox };
