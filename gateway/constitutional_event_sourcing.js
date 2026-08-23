/**
 * Constitutional Event Sourcing
 * 
 * Ω.95.9 — Event Source Every State Change
 * 
 * Kernel state is reconstructed exclusively from events.
 * 
 * Events:
 * - MissionCreated
 * - MissionQueued
 * - MissionSelected
 * - ExecutionPlanned
 * - NodeExecuted
 * - ReplayVerified
 * - WitnessVerified
 * - PolicyApproved
 * - CommitCreated
 * - ArtifactStored
 * - MissionArchived
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalEventSourcing {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._eventStore = new Map(); // event_id → event
    this._snapshots = new Map(); // aggregate_id → snapshot
  }

  /**
   * Initialize event sourcing
   */
  async initialize() {
    console.log('[EventSourcing] Initializing constitutional event sourcing');

    // Load events
    await this._loadEvents();

    // Load snapshots
    await this._loadSnapshots();

    console.log('[EventSourcing] Constitutional event sourcing initialized');
  }

  /**
   * Load events
   */
  async _loadEvents() {
    try {
      const result = await this._postgres.query(`
        SELECT event_id, event_data
        FROM constitutional_events
        ORDER BY sequence_number ASC
      `);

      for (const row of result.rows) {
        this._eventStore.set(row.event_id, row.event_data);
      }

      console.log(`[EventSourcing] Loaded ${this._eventStore.size} events`);
    } catch (error) {
      console.error('[EventSourcing] Failed to load events:', error.message);
    }
  }

  /**
   * Load snapshots
   */
  async _loadSnapshots() {
    try {
      const result = await this._postgres.query(`
        SELECT aggregate_id, snapshot_data
        FROM constitutional_snapshots
      `);

      for (const row of result.rows) {
        this._snapshots.set(row.aggregate_id, row.snapshot_data);
      }

      console.log(`[EventSourcing] Loaded ${this._snapshots.size} snapshots`);
    } catch (error) {
      console.error('[EventSourcing] Failed to load snapshots:', error.message);
    }
  }

  /**
   * Emit event
   * 
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @param {string} aggregateId - Aggregate identifier
   * @returns {Object} Emitted event
   */
  async emitEvent(eventType, eventData, aggregateId) {
    const eventId = identityAuthority.generateId('event', {
      type: eventType,
      aggregate_id: aggregateId,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const sequenceNumber = await this._getNextSequenceNumber();

    const event = {
      event_id: eventId,
      event_type: eventType,
      aggregate_id: aggregateId,
      sequence_number: sequenceNumber,
      data: eventData,
      canonical_hash: CanonicalAuthority.hash({
        event_id: eventId,
        event_type: eventType,
        aggregate_id: aggregateId,
        sequence_number: sequenceNumber,
        data: eventData,
      }),
      witness_hash: CanonicalAuthority.hash({
        event_id: eventId,
        canonical_hash: CanonicalAuthority.hash({
          event_id: eventId,
          event_type: eventType,
        }),
        timestamp: constitutionalTimeAuthority.now(),
      }),
      occurred_at: constitutionalTimeAuthority.now(),
    };

    // Store event
    this._eventStore.set(eventId, event);
    await this._persistEvent(event);

    console.log(`[EventSourcing] Emitted event ${eventId} (${eventType})`);
    return event;
  }

  /**
   * Get next sequence number
   */
  async _getNextSequenceNumber() {
    try {
      const result = await this._postgres.query(`
        SELECT COALESCE(MAX(sequence_number), 0) as max_sequence
        FROM constitutional_events
      `);

      return parseInt(result.rows[0].max_sequence || 0, 10) + 1;
    } catch (error) {
      console.error('[EventSourcing] Failed to get next sequence number:', error.message);
      return 1;
    }
  }

  /**
   * Reconstruct state from events
   * 
   * @param {string} aggregateId - Aggregate identifier
   * @returns {Object} Reconstructed state
   */
  async reconstructState(aggregateId) {
    console.log(`[EventSourcing] Reconstructing state for ${aggregateId}`);

    // Check for snapshot
    const snapshot = this._snapshots.get(aggregateId);
    let state = snapshot ? snapshot.state : this._getInitialState(aggregateId);
    let fromSequence = snapshot ? snapshot.sequence_number : 0;

    // Replay events from snapshot point
    const events = await this._getEventsForAggregate(aggregateId, fromSequence);

    for (const event of events) {
      state = this._applyEvent(state, event);
    }

    console.log(`[EventSourcing] Reconstructed state for ${aggregateId} from ${events.length} events`);
    return state;
  }

  /**
   * Get initial state for aggregate
   */
  _getInitialState(aggregateId) {
    // Determine initial state based on aggregate type
    if (aggregateId.startsWith('mission-')) {
      return {
        mission_id: aggregateId,
        status: 'created',
        created_at: constitutionalTimeAuthority.now(),
        history: [],
      };
    }

    return {
      aggregate_id: aggregateId,
      created_at: constitutionalTimeAuthority.now(),
      state: {},
    };
  }

  /**
   * Get events for aggregate
   */
  async _getEventsForAggregate(aggregateId, fromSequence = 0) {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM constitutional_events
        WHERE aggregate_id = $1 AND sequence_number > $2
        ORDER BY sequence_number ASC
      `, [aggregateId, fromSequence]);

      return result.rows.map(row => row.event_data);
    } catch (error) {
      console.error('[EventSourcing] Failed to get events for aggregate:', error.message);
      return [];
    }
  }

  /**
   * Apply event to state
   */
  _applyEvent(state, event) {
    switch (event.event_type) {
      case 'MissionCreated':
        return this._applyMissionCreated(state, event);
      case 'MissionQueued':
        return this._applyMissionQueued(state, event);
      case 'MissionSelected':
        return this._applyMissionSelected(state, event);
      case 'ExecutionPlanned':
        return this._applyExecutionPlanned(state, event);
      case 'NodeExecuted':
        return this._applyNodeExecuted(state, event);
      case 'ReplayVerified':
        return this._applyReplayVerified(state, event);
      case 'WitnessVerified':
        return this._applyWitnessVerified(state, event);
      case 'PolicyApproved':
        return this._applyPolicyApproved(state, event);
      case 'CommitCreated':
        return this._applyCommitCreated(state, event);
      case 'ArtifactStored':
        return this._applyArtifactStored(state, event);
      case 'MissionArchived':
        return this._applyMissionArchived(state, event);
      default:
        console.warn(`[EventSourcing] Unknown event type: ${event.event_type}`);
        return state;
    }
  }

  /**
   * Apply MissionCreated event
   */
  _applyMissionCreated(state, event) {
    return {
      ...state,
      mission_id: event.data.mission_id,
      status: 'created',
      created_at: event.occurred_at,
      history: [...state.history, event],
    };
  }

  /**
   * Apply MissionQueued event
   */
  _applyMissionQueued(state, event) {
    return {
      ...state,
      status: 'queued',
      queued_at: event.occurred_at,
      history: [...state.history, event],
    };
  }

  /**
   * Apply MissionSelected event
   */
  _applyMissionSelected(state, event) {
    return {
      ...state,
      status: 'selected',
      selected_at: event.occurred_at,
      history: [...state.history, event],
    };
  }

  /**
   * Apply ExecutionPlanned event
   */
  _applyExecutionPlanned(state, event) {
    return {
      ...state,
      status: 'planned',
      plan_id: event.data.plan_id,
      planned_at: event.occurred_at,
      history: [...state.history, event],
    };
  }

  /**
   * Apply NodeExecuted event
   */
  _applyNodeExecuted(state, event) {
    return {
      ...state,
      status: 'executing',
      current_node: event.data.node_id,
      executed_nodes: [...(state.executed_nodes || []), event.data.node_id],
      history: [...state.history, event],
    };
  }

  /**
   * Apply ReplayVerified event
   */
  _applyReplayVerified(state, event) {
    return {
      ...state,
      replay_verified: true,
      replay_evidence_id: event.data.evidence_id,
      history: [...state.history, event],
    };
  }

  /**
   * Apply WitnessVerified event
   */
  _applyWitnessVerified(state, event) {
    return {
      ...state,
      witness_verified: true,
      witness_evidence_id: event.data.evidence_id,
      history: [...state.history, event],
    };
  }

  /**
   * Apply PolicyApproved event
   */
  _applyPolicyApproved(state, event) {
    return {
      ...state,
      policy_approved: true,
      decision_id: event.data.decision_id,
      history: [...state.history, event],
    };
  }

  /**
   * Apply CommitCreated event
   */
  _applyCommitCreated(state, event) {
    return {
      ...state,
      commit_created: true,
      commit_sha: event.data.commit_sha,
      history: [...state.history, event],
    };
  }

  /**
   * Apply ArtifactStored event
   */
  _applyArtifactStored(state, event) {
    return {
      ...state,
      artifacts: [...(state.artifacts || []), event.data.artifact_id],
      history: [...state.history, event],
    };
  }

  /**
   * Apply MissionArchived event
   */
  _applyMissionArchived(state, event) {
    return {
      ...state,
      status: 'archived',
      archived_at: event.occurred_at,
      history: [...state.history, event],
    };
  }

  /**
   * Create snapshot
   * 
   * @param {string} aggregateId - Aggregate identifier
   * @returns {Object} Snapshot
   */
  async createSnapshot(aggregateId) {
    console.log(`[EventSourcing] Creating snapshot for ${aggregateId}`);

    const state = await this.reconstructState(aggregateId);
    const latestEvent = await this._getLatestEventForAggregate(aggregateId);

    const snapshot = {
      aggregate_id: aggregateId,
      state: state,
      sequence_number: latestEvent ? latestEvent.sequence_number : 0,
      created_at: constitutionalTimeAuthority.now(),
    };

    this._snapshots.set(aggregateId, snapshot);
    await this._persistSnapshot(aggregateId, snapshot);

    console.log(`[EventSourcing] Created snapshot for ${aggregateId}`);
    return snapshot;
  }

  /**
   * Get latest event for aggregate
   */
  async _getLatestEventForAggregate(aggregateId) {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM constitutional_events
        WHERE aggregate_id = $1
        ORDER BY sequence_number DESC
        LIMIT 1
      `, [aggregateId]);

      return result.rows.length > 0 ? result.rows[0].event_data : null;
    } catch (error) {
      console.error('[EventSourcing] Failed to get latest event:', error.message);
      return null;
    }
  }

  /**
   * Persist event
   */
  async _persistEvent(event) {
    try {
      await this._postgres.query(`
        INSERT INTO constitutional_events (event_id, event_data, sequence_number, aggregate_id, event_type, occurred_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (event_id) DO UPDATE SET
          event_data = $2,
          occurred_at = NOW()
      `, [event.event_id, JSON.stringify(event), event.sequence_number, event.aggregate_id, event.event_type]);
    } catch (error) {
      console.error(`[EventSourcing] Failed to persist event ${event.event_id}:`, error.message);
    }
  }

  /**
   * Persist snapshot
   */
  async _persistSnapshot(aggregateId, snapshot) {
    try {
      await this._postgres.query(`
        INSERT INTO constitutional_snapshots (aggregate_id, snapshot_data, sequence_number, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (aggregate_id) DO UPDATE SET
          snapshot_data = $2,
          sequence_number = $3,
          created_at = NOW()
      `, [aggregateId, JSON.stringify(snapshot), snapshot.sequence_number]);
    } catch (error) {
      console.error(`[EventSourcing] Failed to persist snapshot for ${aggregateId}:`, error.message);
    }
  }

  /**
   * Get event
   * 
   * @param {string} eventId - Event identifier
   * @returns {Object} Event
   */
  getEvent(eventId) {
    return this._eventStore.get(eventId);
  }

  /**
   * Get events for aggregate
   * 
   * @param {string} aggregateId - Aggregate identifier
   * @returns {Array} Events
   */
  getEventsForAggregate(aggregateId) {
    return Array.from(this._eventStore.values())
      .filter(event => event.aggregate_id === aggregateId)
      .sort((a, b) => a.sequence_number - b.sequence_number);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const byType = {};
    const byAggregate = {};

    for (const event of this._eventStore.values()) {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;
      byAggregate[event.aggregate_id] = (byAggregate[event.aggregate_id] || 0) + 1;
    }

    return {
      total_events: this._eventStore.size,
      total_snapshots: this._snapshots.size,
      events_by_type: byType,
      events_by_aggregate: byAggregate,
    };
  }
}

module.exports = { ConstitutionalEventSourcing };
