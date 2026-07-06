/**
 * Event Read Authority
 * 
 * Constitutional read-side authority for event queries (CQRS).
 * 
 * Responsibilities:
 * - Query events by type, stream, correlation ID
 * - Get event statistics
 * - Provide read models for context endpoints
 * 
 * Write operations are handled by EventWriteAuthority.
 * 
 * PATCH_003: Moved to runtime/kernel/
 */

const { CanonicalBytes } = require('./authorities/canonical_authority');
const { constitutionalTimeAuthority } = require('./authorities/constitutional_time_authority');

class EventReadAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Initialize event read authority
   */
  async initialize() {
    console.log('[EventReadAuthority] Initializing event read authority');
    console.log('[EventReadAuthority] Event read authority initialized');
  }

  /**
   * Get all events
   * 
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Array} Events
   */
  async getAllEvents(limit = 100, offset = 0) {
    try {
      const result = await this._postgres.query(`
        SELECT event_id, event_type, timestamp, object_id as stream, aggregate_type, payload
        FROM repository_events
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map(row => ({
        event_id: row.event_id,
        event_type: row.event_type,
        timestamp: row.timestamp,
        stream: row.stream,
        aggregate_type: row.aggregate_type,
        payload: row.payload,
      }));
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get all events:', error.message);
      return [];
    }
  }

  /**
   * Get recent events
   * 
   * @param {number} minutes - Minutes to look back
   * @param {number} limit - Limit
   * @returns {Array} Events
   */
  async getRecentEvents(minutes = 60, limit = 100) {
    try {
      const recentTimestamp = constitutionalTimeAuthority.now() - (minutes * 60 * 1000);
      const result = await this._postgres.query(`
        SELECT event_id, event_type, timestamp, object_id as stream, aggregate_type, payload
        FROM repository_events
        WHERE timestamp >= $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [recentTimestamp, limit]);

      return result.rows.map(row => ({
        event_id: row.event_id,
        event_type: row.event_type,
        timestamp: row.timestamp,
        stream: row.stream,
        aggregate_type: row.aggregate_type,
        payload: row.payload,
      }));
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get recent events:', error.message);
      return [];
    }
  }

  /**
   * Get event statistics
   * 
   * @returns {Object} Statistics
   */
  async getEventStats() {
    try {
      const result = await this._postgres.query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT aggregate_type) as streams,
          COUNT(DISTINCT event_type) as event_types,
          MIN(timestamp) as oldest_event,
          MAX(timestamp) as newest_event
        FROM repository_events
      `);

      return result.rows[0];
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get event stats:', error.message);
      return null;
    }
  }

  /**
   * Get events by stream
   * 
   * @param {string} stream - Stream name
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Array} Events
   */
  async getEventsByStream(stream, limit = 100, offset = 0) {
    try {
      const result = await this._postgres.query(`
        SELECT event_id, event_type, timestamp, object_id as stream, aggregate_type, payload
        FROM repository_events
        WHERE aggregate_type = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `, [stream, limit, offset]);

      return result.rows.map(row => ({
        event_id: row.event_id,
        event_type: row.event_type,
        timestamp: row.timestamp,
        stream: row.stream,
        aggregate_type: row.aggregate_type,
        payload: row.payload,
      }));
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get events by stream:', error.message);
      return [];
    }
  }

  /**
   * Get events by type
   * 
   * @param {string} eventType - Event type
   * @param {number} limit - Limit
   * @param {number} offset - Offset
   * @returns {Array} Events
   */
  async getEventsByType(eventType, limit = 100, offset = 0) {
    try {
      const result = await this._postgres.query(`
        SELECT event_id, event_type, payload, correlation_id, created_at
        FROM events
        WHERE event_type = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [eventType, limit, offset]);

      return result.rows.map(row => ({
        event_id: row.event_id,
        event_type: row.event_type,
        payload: row.payload,
        correlation_id: row.correlation_id,
        timestamp: row.created_at,
      }));
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get events:', error.message);
      return [];
    }
  }

  /**
   * Get events by correlation ID
   * 
   * @param {string} correlationId - Correlation ID
   * @returns {Array} Events
   */
  async getEventsByCorrelationId(correlationId) {
    try {
      const result = await this._postgres.query(`
        SELECT event_id, event_type, payload, correlation_id, created_at
        FROM events
        WHERE correlation_id = $1
        ORDER BY created_at ASC
      `, [correlationId]);

      return result.rows.map(row => ({
        event_id: row.event_id,
        event_type: row.event_type,
        payload: row.payload,
        correlation_id: row.correlation_id,
        timestamp: row.created_at,
      }));
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get events:', error.message);
      return [];
    }
  }

  /**
   * Get recent events for context
   * 
   * @param {number} limit - Limit
   * @returns {Array} Events
   */
  async getRecentEventsForContext(limit = 10) {
    try {
      const result = await this._postgres.query('SELECT * FROM get_recent_events_for_context($1)', [limit]);
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get recent events for context:', error.message);
      return [];
    }
  }

  /**
   * Get worker status for context
   * 
   * @returns {Array} Worker status
   */
  async getWorkerStatusForContext() {
    try {
      const result = await this._postgres.query('SELECT * FROM get_worker_status_for_context()');
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get worker status for context:', error.message);
      return [];
    }
  }

  /**
   * Get daily activity for context
   * 
   * @param {string} date - Date
   * @returns {Object} Daily activity
   */
  async getDailyActivityForContext(date) {
    try {
      const result = await this._postgres.query('SELECT * FROM get_daily_activity_for_context($1)', [date]);
      return result.rows[0];
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get daily activity for context:', error.message);
      return null;
    }
  }

  /**
   * Get latest summaries for context
   * 
   * @param {number} limit - Limit
   * @returns {Array} Summaries
   */
  async getLatestSummariesForContext(limit = 5) {
    try {
      const result = await this._postgres.query('SELECT * FROM get_latest_summaries_for_context($1)', [limit]);
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get latest summaries for context:', error.message);
      return [];
    }
  }

  /**
   * Get recent failures for context
   * 
   * @param {number} limit - Limit
   * @returns {Array} Failures
   */
  async getRecentFailuresForContext(limit = 5) {
    try {
      const result = await this._postgres.query('SELECT * FROM get_recent_failures_for_context($1)', [limit]);
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get recent failures for context:', error.message);
      return [];
    }
  }

  /**
   * Get model metrics for context
   * 
   * @returns {Array} Model metrics
   */
  async getModelMetricsForContext() {
    try {
      const result = await this._postgres.query('SELECT * FROM get_model_metrics_for_context()');
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get model metrics for context:', error.message);
      return [];
    }
  }

  async markProcessed(eventId, worker) {
    try {
      await this._postgres.query(`
        INSERT INTO event_processing (event_id, processed, processed_at, worker, retries)
        VALUES ($1, TRUE, NOW(), $2, 0)
        ON CONFLICT (event_id) DO UPDATE SET
          processed = TRUE, processed_at = NOW(), worker = $2, retries = event_processing.retries
      `, [eventId, worker || 'unknown']);
      return true;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to mark event processed:', error.message);
      return false;
    }
  }

  async markFailed(eventId, worker, error) {
    try {
      await this._postgres.query(`
        INSERT INTO event_processing (event_id, processed, processed_at, worker, retries, last_error)
        VALUES ($1, FALSE, NOW(), $2, 1, $3)
        ON CONFLICT (event_id) DO UPDATE SET
          processed = FALSE, processed_at = NOW(), worker = $2,
          retries = event_processing.retries + 1, last_error = $3
      `, [eventId, worker || 'unknown', error || 'unknown']);
      return true;
    } catch (err) {
      console.error('[EventReadAuthority] Failed to mark event failed:', err.message);
      return false;
    }
  }

  async getUnprocessedEvents(limit) {
    try {
      const result = await this._postgres.query(`
        SELECT e.event_id, e.event_type, e.aggregate_id, e.aggregate_type,
               e.payload, e.timestamp, e.causation_id, e.correlation_id,
               e.authority, e.authority_version
        FROM repository_events e
        LEFT JOIN event_processing ep ON e.event_id = ep.event_id
        WHERE ep.event_id IS NULL
        ORDER BY e.timestamp ASC
        LIMIT $1
      `, [limit || 100]);
      return result.rows;
    } catch (error) {
      console.error('[EventReadAuthority] Failed to get unprocessed events:', error.message);
      return [];
    }
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
      authority_id: 'event-read-authority',
      authority_name: 'EventReadAuthority',
      version: '1.0.0',
      consumes: ['events'],
      produces: ['event_queries', 'read_models'],
      requires: ['postgres'],
      guarantees: ['event_querying', 'read_model_consistency'],
      failure_modes: ['postgres_unavailable'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { EventReadAuthority };
