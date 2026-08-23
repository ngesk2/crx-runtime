/**
 * ConstitutionalEventBus
 * 
 * Central event bus for all constitutional lifecycle events.
 * 
 * Responsibilities:
 * - publish(event) - Emit events
 * - subscribe(pattern, handler) - Subscribe to events
 * - persist(event) - Persist events to storage
 * - replay(lifecycleId) - Replay events for a lifecycle
 * 
 * Constitutional Constraint: All stage communication must go through the bus.
 * No direct event emission allowed.
 */

const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ConstitutionalEventBus {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._subscribers = new Map(); // pattern -> Set of handlers
    this._eventLog = []; // In-memory event log for replay
  }

  async publish(event) {
    // Add metadata
    const enrichedEvent = {
      ...event,
      event_id: event.event_id || identityAuthority.generateId('event', { type: 'event' }),
      timestamp: event.timestamp || constitutionalTimeAuthority.now(),
      correlation_id: event.correlation_id || identityAuthority.generateId('correlation', { type: 'correlation' }),
    };

    // Persist to storage
    await this.persist(enrichedEvent);

    // Emit to subscribers
    await this._emit(enrichedEvent);

    // Add to in-memory log
    this._eventLog.push(enrichedEvent);

    return enrichedEvent;
  }

  subscribe(pattern, handler) {
    if (!this._subscribers.has(pattern)) {
      this._subscribers.set(pattern, new Set());
    }
    this._subscribers.get(pattern).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this._subscribers.get(pattern);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this._subscribers.delete(pattern);
        }
      }
    };
  }

  async persist(event) {
    await this._postgres.query(`
      INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (event_id) DO UPDATE SET event_data = $6, timestamp = $3
    `, [
      event.event_id,
      event.event_type,
      event.timestamp,
      event.aggregate_id || event.event_id,
      event.aggregate_type || 'EVENT',
      JSON.stringify(event),
    ]);
  }

  async replay(lifecycleId) {
    const result = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_data->'metadata'->>'lifecycle_id' = $1
      ORDER BY timestamp ASC
    `, [lifecycleId]);

    return result.rows.map(row => row.event_data);
  }

  async replayFromEvent(eventId) {
    // Get event and all subsequent events in the same lifecycle
    const eventResult = await this._postgres.query(`
      SELECT event_data 
      FROM events 
      WHERE event_id = $1
      LIMIT 1
    `, [eventId]);

    if (eventResult.rows.length === 0) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const event = eventResult.rows[0].event_data;
    const lifecycleId = event.metadata?.lifecycle_id;

    if (!lifecycleId) {
      throw new Error(`Event does not have lifecycle_id: ${eventId}`);
    }

    return this.replay(lifecycleId);
  }

  async query(filter = {}) {
    let query = 'SELECT event_data FROM events WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filter.event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(filter.event_type);
      paramIndex++;
    }

    if (filter.aggregate_type) {
      query += ` AND aggregate_type = $${paramIndex}`;
      params.push(filter.aggregate_type);
      paramIndex++;
    }

    if (filter.lifecycle_id) {
      query += ` AND event_data->'metadata'->>'lifecycle_id' = $${paramIndex}`;
      params.push(filter.lifecycle_id);
      paramIndex++;
    }

    if (filter.kind) {
      query += ` AND aggregate_type = $${paramIndex}`;
      params.push(filter.kind);
      paramIndex++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filter.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filter.limit);
      paramIndex++;
    }

    if (filter.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filter.offset);
    }

    const result = await this._postgres.query(query, params);
    return result.rows.map(row => row.event_data);
  }

  async _emit(event) {
    // Find matching subscribers
    for (const [pattern, handlers] of this._subscribers) {
      if (this._matchesPattern(event, pattern)) {
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            console.error(`Event handler error for pattern ${pattern}:`, error.message);
          }
        }
      }
    }
  }

  _matchesPattern(event, pattern) {
    // Simple pattern matching: exact match or wildcard
    if (pattern === '*') return true;
    if (pattern === event.event_type) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return event.event_type.startsWith(prefix);
    }
    return false;
  }

  getEventLog() {
    return [...this._eventLog];
  }

  clearEventLog() {
    this._eventLog = [];
  }

  getSubscriberCount() {
    let total = 0;
    for (const handlers of this._subscribers.values()) {
      total += handlers.size;
    }
    return total;
  }
}

module.exports = { ConstitutionalEventBus };
