/**
 * EventStore Persistence Authority
 * 
 * Ω.93.7 — EventStoreDB Integration
 * 
 * Compare against current event persistence, import only ideas that simplify replay or persistence.
 * 
 * Goals:
 * - Compare against current event persistence
 * - Import only ideas that simplify replay or persistence
 * - Learn from EventStoreDB's event sourcing patterns
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

class EventStorePersistence {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._eventStreams = new Map(); // stream_id → stream
    this._events = new Map(); // event_id → event
  }

  /**
   * Initialize EventStore persistence
   */
  async initialize() {
    console.log('[EventStorePersistence] Initializing EventStore persistence');

    // Load event streams
    await this._loadEventStreams();

    // Compare with current persistence
    await this._compareWithCurrentPersistence();

    console.log('[EventStorePersistence] EventStore persistence initialized');
  }

  /**
   * Load event streams
   */
  async _loadEventStreams() {
    try {
      const result = await this._postgres.query(`
        SELECT stream_id, stream_data
        FROM event_streams
      `);

      for (const row of result.rows) {
        this._eventStreams.set(row.stream_id, row.stream_data);
      }

      console.log(`[EventStorePersistence] Loaded ${this._eventStreams.size} event streams`);
    } catch (error) {
      console.error('[EventStorePersistence] Failed to load event streams:', error.message);
    }
  }

  /**
   * Compare with current persistence
   */
  async _compareWithCurrentPersistence() {
    console.log('[EventStorePersistence] Comparing with current persistence');

    // Get current replay log
    const currentPersistence = await this._getCurrentPersistence();

    // Analyze differences
    const comparison = {
      current_events: currentPersistence.total_events,
      eventstore_events: this._events.size,
      simplification_opportunities: this._identifySimplificationOpportunities(currentPersistence),
      replay_improvements: this._identifyReplayImprovements(currentPersistence),
    };

    console.log('[EventStorePersistence] Comparison complete:', comparison);
    return comparison;
  }

  /**
   * Get current persistence
   */
  async _getCurrentPersistence() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as total_events
        FROM replay_log
      `);

      return {
        total_events: parseInt(result.rows[0].total_events || 0, 10),
      };
    } catch (error) {
      console.error('[EventStorePersistence] Failed to get current persistence:', error.message);
      return { total_events: 0 };
    }
  }

  /**
   * Identify simplification opportunities
   */
  _identifySimplificationOpportunities(currentPersistence) {
    const opportunities = [];

    // EventStoreDB concepts that could simplify current persistence:
    // - Stream-based organization
    // - Event versioning
    // - Optimistic concurrency control
    // - Event projections
    // - Subscription model

    opportunities.push({
      concept: 'stream_based_organization',
      description: 'Organize events by stream instead of flat log',
      benefit: 'Simplifies event querying and replay',
      complexity: 'medium',
    });

    opportunities.push({
      concept: 'event_versioning',
      description: 'Version events for schema evolution',
      benefit: 'Enables schema evolution without breaking replay',
      complexity: 'low',
    });

    opportunities.push({
      concept: 'optimistic_concurrency',
      description: 'Use optimistic concurrency for event appends',
      benefit: 'Improves concurrent event handling',
      complexity: 'medium',
    });

    return opportunities;
  }

  /**
   * Identify replay improvements
   */
  _identifyReplayImprovements(currentPersistence) {
    const improvements = [];

    // EventStoreDB concepts that could improve replay:
    // - Deterministic event ordering
    // - Event metadata for replay
    // - Event snapshots for faster replay
    // - Causal event relationships

    improvements.push({
      concept: 'deterministic_event_ordering',
      description: 'Ensure deterministic event ordering within streams',
      benefit: 'Improves replay determinism',
      complexity: 'low',
    });

    improvements.push({
      concept: 'event_metadata',
      description: 'Add replay metadata to events',
      benefit: 'Enables more precise replay',
      complexity: 'low',
    });

    improvements.push({
      concept: 'event_snapshots',
      description: 'Snapshot event stream state for faster replay',
      benefit: 'Reduces replay time for long streams',
      complexity: 'high',
    });

    return improvements;
  }

  /**
   * Create event stream
   * 
   * @param {string} streamId - Stream identifier
   * @param {Object} metadata - Stream metadata
   * @returns {Object} Event stream
   */
  async createEventStream(streamId, metadata = {}) {
    console.log(`[EventStorePersistence] Creating event stream ${streamId}`);

    const stream = {
      stream_id: streamId,
      metadata: metadata,
      created_at: constitutionalTimeAuthority.now(),
      version: 0,
    };

    this._eventStreams.set(streamId, stream);
    await this._persistEventStream(streamId, stream);

    console.log(`[EventStorePersistence] Created event stream ${streamId}`);
    return stream;
  }

  /**
   * Append event to stream
   * 
   * @param {string} streamId - Stream identifier
   * @param {Object} eventData - Event data
   * @param {number} expectedVersion - Expected stream version for optimistic concurrency
   * @returns {Object} Appended event
   */
  async appendEvent(streamId, eventData, expectedVersion = null) {
    console.log(`[EventStorePersistence] Appending event to stream ${streamId}`);

    const stream = this._eventStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    // Check optimistic concurrency
    if (expectedVersion !== null && stream.version !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected version ${expectedVersion}, actual version ${stream.version}`);
    }

    const eventId = deterministicIdAuthority.generateIdFromObject({
      stream_id: streamId,
      version: stream.version,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const event = {
      event_id: eventId,
      stream_id: streamId,
      version: stream.version,
      data: eventData,
      canonical_hash: CanonicalAuthority.hash({ stream_id: streamId, version: stream.version, data: eventData }),
      created_at: constitutionalTimeAuthority.now(),
    };

    // Store event
    this._events.set(eventId, event);
    await this._persistEvent(eventId, event);

    // Update stream version
    stream.version += 1;
    await this._persistEventStream(streamId, stream);

    console.log(`[EventStorePersistence] Appended event ${eventId} to stream ${streamId}`);
    return event;
  }

  /**
   * Read events from stream
   * 
   * @param {string} streamId - Stream identifier
   * @param {number} fromVersion - Start version
   * @param {number} toVersion - End version
   * @returns {Array} Events
   */
  async readEvents(streamId, fromVersion = 0, toVersion = null) {
    console.log(`[EventStorePersistence] Reading events from stream ${streamId}`);

    const stream = this._eventStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    const events = Array.from(this._events.values())
      .filter(event => event.stream_id === streamId)
      .filter(event => event.version >= fromVersion)
      .filter(event => toVersion === null || event.version <= toVersion)
      .sort((a, b) => a.version - b.version);

    console.log(`[EventStorePersistence] Read ${events.length} events from stream ${streamId}`);
    return events;
  }

  /**
   * Create stream snapshot
   * 
   * @param {string} streamId - Stream identifier
   * @param {Object} snapshotData - Snapshot data
   * @returns {Object} Snapshot
   */
  async createSnapshot(streamId, snapshotData) {
    console.log(`[EventStorePersistence] Creating snapshot for stream ${streamId}`);

    const stream = this._eventStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    const snapshotId = deterministicIdAuthority.generateIdFromObject({
      stream_id: streamId,
      version: stream.version,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const snapshot = {
      snapshot_id: snapshotId,
      stream_id: streamId,
      version: stream.version,
      data: snapshotData,
      canonical_hash: CanonicalAuthority.hash({ stream_id: streamId, version: stream.version, data: snapshotData }),
      created_at: constitutionalTimeAuthority.now(),
    };

    await this._persistSnapshot(snapshotId, snapshot);

    console.log(`[EventStorePersistence] Created snapshot ${snapshotId} for stream ${streamId}`);
    return snapshot;
  }

  /**
   * Read snapshot for stream
   * 
   * @param {string} streamId - Stream identifier
   * @returns {Object} Latest snapshot
   */
  async readSnapshot(streamId) {
    try {
      const result = await this._postgres.query(`
        SELECT snapshot_data
        FROM event_snapshots
        WHERE stream_id = $1
        ORDER BY version DESC
        LIMIT 1
      `, [streamId]);

      if (result.rows.length > 0) {
        return result.rows[0].snapshot_data;
      }
      return null;
    } catch (error) {
      console.error(`[EventStorePersistence] Failed to read snapshot for stream ${streamId}:`, error.message);
      return null;
    }
  }

  /**
   * Persist event stream
   */
  async _persistEventStream(streamId, stream) {
    try {
      await this._postgres.query(`
        INSERT INTO event_streams (stream_id, stream_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (stream_id) DO UPDATE SET
          stream_data = $2,
          updated_at = NOW()
      `, [streamId, JSON.stringify(stream)]);
    } catch (error) {
      console.error(`[EventStorePersistence] Failed to persist event stream ${streamId}:`, error.message);
    }
  }

  /**
   * Persist event
   */
  async _persistEvent(eventId, event) {
    try {
      await this._postgres.query(`
        INSERT INTO events (event_id, event_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (event_id) DO UPDATE SET
          event_data = $2,
          updated_at = NOW()
      `, [eventId, JSON.stringify(event)]);
    } catch (error) {
      console.error(`[EventStorePersistence] Failed to persist event ${eventId}:`, error.message);
    }
  }

  /**
   * Persist snapshot
   */
  async _persistSnapshot(snapshotId, snapshot) {
    try {
      await this._postgres.query(`
        INSERT INTO event_snapshots (snapshot_id, snapshot_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (snapshot_id) DO UPDATE SET
          snapshot_data = $2,
          updated_at = NOW()
      `, [snapshotId, JSON.stringify(snapshot)]);
    } catch (error) {
      console.error(`[EventStorePersistence] Failed to persist snapshot ${snapshotId}:`, error.message);
    }
  }

  /**
   * Get event stream
   */
  getEventStream(streamId) {
    return this._eventStreams.get(streamId);
  }

  /**
   * Get event
   */
  getEvent(eventId) {
    return this._events.get(eventId);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total_streams: this._eventStreams.size,
      total_events: this._events.size,
      by_stream: this._getStatsByStream(),
    };
  }

  /**
   * Get statistics by stream
   */
  _getStatsByStream() {
    const stats = {};

    for (const event of this._events.values()) {
      stats[event.stream_id] = (stats[event.stream_id] || 0) + 1;
    }

    return stats;
  }
}

module.exports = { EventStorePersistence };
