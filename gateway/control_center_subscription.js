/**
 * Control Center Subscription
 * 
 * Phase 21 — Control Center Subscription Mechanism
 * 
 * Provides real-time updates to the Control Center dashboard.
 * 
 * Subscribes to mission events and pushes updates via WebSocket/Redis.
 * 
 * Events subscribed:
 * - MissionGenerated
 * - MissionScheduled
 * - MissionStarted
 * - MissionCompleted
 * - PatchGenerated
 * - ReplayPassed
 * - CommitApproved
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');

class ControlCenterSubscription {
  constructor(postgresPool, eventBus, redisClient = null, materializedViews = null) {
    this._postgres = postgresPool;
    this._eventBus = eventBus;
    this._redis = redisClient;
    this._materializedViews = materializedViews;
    this._websocketClients = new Map();
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize subscription
   */
  async initialize() {
    await this._subscribeToEvents();
    await this._startPollingFallback();
    console.log('[ControlCenterSubscription] Initialized');
  }

  /**
   * Start polling fallback
   */
  async _startPollingFallback() {
    // Poll every 5 seconds as fallback if events aren't being published
    setInterval(async () => {
      await this._pollAndNotify();
    }, 5000);
  }

  /**
   * Poll and notify
   */
  async _pollAndNotify() {
    // Use materialized views if available for better performance
    let recentMissions;
    if (this._materializedViews) {
      const dashboardData = await this._materializedViews.getDashboardData();
      recentMissions = dashboardData.recent_activity.filter(a => a.activity_type === 'mission');
    } else {
      recentMissions = await this.getAllMissions(null, 10);
    }
    
    // Push to WebSocket clients
    const message = {
      event_type: 'PollUpdate',
      event_data: {
        mission_count: recentMissions.length,
        missions: recentMissions
      },
      timestamp: constitutionalTimeAuthority.now()
    };

    await this._pushToWebSocketClients(message);
  }

  /**
   * Subscribe to mission events
   */
  async _subscribeToEvents() {
    // MissionGenerated
    this._eventBus.subscribe('MissionGenerated', async (data) => {
      await this._publishToControlCenter('MissionGenerated', data);
    });

    // MissionScheduled
    this._eventBus.subscribe('MissionScheduled', async (data) => {
      await this._publishToControlCenter('MissionScheduled', data);
    });

    // MissionStarted
    this._eventBus.subscribe('MissionStarted', async (data) => {
      await this._publishToControlCenter('MissionStarted', data);
    });

    // MissionCompleted
    this._eventBus.subscribe('MissionCompleted', async (data) => {
      await this._publishToControlCenter('MissionCompleted', data);
    });

    // PatchGenerated
    this._eventBus.subscribe('PatchGenerated', async (data) => {
      await this._publishToControlCenter('PatchGenerated', data);
    });

    // ReplayPassed
    this._eventBus.subscribe('ReplayPassed', async (data) => {
      await this._publishToControlCenter('ReplayPassed', data);
    });

    // CommitApproved
    this._eventBus.subscribe('CommitApproved', async (data) => {
      await this._publishToControlCenter('CommitApproved', data);
    });
  }

  /**
   * Publish to Control Center
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  async _publishToControlCenter(eventType, data) {
    const message = {
      event_type: eventType,
      event_data: data,
      timestamp: constitutionalTimeAuthority.now()
    };

    // Publish via Redis if available
    if (this._redis) {
      await this._redis.publish('control_center', JSON.stringify(message));
    }

    // Push to WebSocket clients
    await this._pushToWebSocketClients(message);

    console.log(`[ControlCenterSubscription] Published to Control Center: ${eventType}`);
  }

  /**
   * Register WebSocket client
   * @param {string} clientId - Client ID
   * @param {Object} socket - WebSocket socket
   */
  registerWebSocketClient(clientId, socket) {
    this._websocketClients.set(clientId, socket);
    console.log(`[ControlCenterSubscription] Registered WebSocket client: ${clientId}`);
  }

  /**
   * Unregister WebSocket client
   * @param {string} clientId - Client ID
   */
  unregisterWebSocketClient(clientId) {
    this._websocketClients.delete(clientId);
    console.log(`[ControlCenterSubscription] Unregistered WebSocket client: ${clientId}`);
  }

  /**
   * Push to WebSocket clients
   * @param {Object} message - Message
   */
  async _pushToWebSocketClients(message) {
    for (const [clientId, socket] of this._websocketClients) {
      try {
        if (socket.readyState === 1) { // OPEN
          socket.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error(`[ControlCenterSubscription] WebSocket error for ${clientId}:`, error.message);
      }
    }
  }

  /**
   * Get mission status for Control Center
   * @param {string} missionId - Mission ID
   * @returns {Object} Mission status
   */
  async getMissionStatus(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM missions WHERE mission_id = $1
    `, [missionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const mission = result.rows[0];

    // Get latest execution
    const executionResult = await this._postgres.query(`
      SELECT * FROM mission_executions
      WHERE mission_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [missionId]);

    return {
      mission: mission,
      latest_execution: executionResult.rows.length > 0 ? executionResult.rows[0] : null
    };
  }

  /**
   * Get all missions for Control Center
   * @param {string} status - Status filter (optional)
   * @param {number} limit - Result limit
   * @returns {Array} Missions
   */
  async getAllMissions(status = null, limit = 100) {
    let query = `
      SELECT * FROM missions
    `;
    const params = [];

    if (status) {
      query += ` WHERE mission_status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this._postgres.query(query, params);
    return result.rows;
  }

  /**
   * Get mission statistics for Control Center
   * @returns {Object} Statistics
   */
  async getMissionStatistics() {
    // Use materialized views if available
    if (this._materializedViews) {
      const missionSummary = await this._materializedViews.getMissionSummary();
      const stats = {};
      for (const row of missionSummary) {
        stats[row.mission_status] = parseInt(row.count);
      }
      return stats;
    }

    // Fallback to direct query
    const result = await this._postgres.query(`
      SELECT 
        mission_status,
        COUNT(*) as count
      FROM missions
      GROUP BY mission_status
    `, []);

    const stats = {};
    for (const row of result.rows) {
      stats[row.mission_status] = parseInt(row.count);
    }

    return stats;
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
    return `control_center_${hash.substring(0, 16)}`;
  }
}

module.exports = { ControlCenterSubscription };
