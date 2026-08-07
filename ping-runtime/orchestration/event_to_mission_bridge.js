/**
 * Event-to-Mission Bridge — PING Core v1
 *
 * Listens to business events on UnifiedEventRuntime and creates missions
 * that workers can process. This is the missing link between "event emitted"
 * and "worker executes."
 *
 * Flow:
 *   Business event → Bridge → Mission created → Scheduler dispatches → Worker executes
 *
 * Each business event type maps to a mission type and worker.
 * The bridge does NOT modify state — it only creates missions.
 */

// Business event → mission type → worker mapping
const EVENT_MISSION_MAP = {
  // Customer events
  CUSTOMER_CREATED: { missionType: 'CUSTOMER_ONBOARD', worker: 'observation', priority: 2 },
  CUSTOMER_UPDATED: { missionType: 'CUSTOMER_UPDATE', worker: 'observation', priority: 1 },

  // Lead events
  LEAD_CREATED: { missionType: 'LEAD_FOLLOWUP', worker: 'observation', priority: 3 },
  LEAD_CONVERTED: { missionType: 'LEAD_CONVERT', worker: 'observation', priority: 2 },

  // Project events
  PROJECT_CREATED: { missionType: 'PROJECT_SETUP', worker: 'observation', priority: 2 },
  PROJECT_UPDATED: { missionType: 'PROJECT_UPDATE', worker: 'observation', priority: 1 },
  PROJECT_COMPLETED: { missionType: 'PROJECT_CLOSEOUT', worker: 'observation', priority: 3 },

  // Estimate events
  ESTIMATE_CREATED: { missionType: 'ESTIMATE_PREPARE', worker: 'observation', priority: 2 },
  ESTIMATE_SENT: { missionType: 'ESTIMATE_FOLLOWUP', worker: 'observation', priority: 3 },
  ESTIMATE_ACCEPTED: { missionType: 'ESTIMATE_CONVERT', worker: 'observation', priority: 3 },

  // Invoice events
  INVOICE_CREATED: { missionType: 'INVOICE_TRACK', worker: 'observation', priority: 2 },
  INVOICE_SENT: { missionType: 'INVOICE_FOLLOWUP', worker: 'observation', priority: 3 },
  INVOICE_PAID: { missionType: 'INVOICE_CLOSE', worker: 'observation', priority: 1 },

  // Review events
  REVIEW_RECEIVED: { missionType: 'REVIEW_RESPONSE', worker: 'observation', priority: 3 },
  REVIEW_RESPONDED: { missionType: 'REVIEW_ACK', worker: 'observation', priority: 1 },

  // Connector events
  EMAIL_RECEIVED: { missionType: 'EMAIL_PROCESS', worker: 'observation', priority: 2 },
  GOOGLE_REVIEW_RECEIVED: { missionType: 'REVIEW_RESPONSE', worker: 'observation', priority: 3 },

  // Worker events (downstream pipeline)
  OBSERVATION_CREATED: { missionType: 'CLAIM_GENERATE', worker: 'claim', priority: 2 },
  CLAIM_CREATED: { missionType: 'CLASSIFICATION_CREATE', worker: 'classification', priority: 2 },
  CLASSIFICATION_CREATED: { missionType: 'RECOMMENDATION_CREATE', worker: 'recommendation', priority: 2 },
  RECOMMENDATION_CREATED: { missionType: 'PROJECTION_CREATE', worker: 'projection', priority: 1 },
  REPLAY_COMPLETED: { missionType: 'WITNESS_CREATE', worker: 'witness', priority: 1 },
  WITNESS_CREATED: { missionType: 'LINEAGE_CREATE', worker: 'lineage', priority: 1 },
  LINEAGE_CREATED: { missionType: 'PROJECTION_CREATE', worker: 'projection', priority: 1 },

  // System events
  SYSTEM_HEALTH_CHECK: { missionType: 'SYSTEM_AUDIT', worker: 'observation', priority: 0 },
};

class EventToMissionBridge {
  /**
   * @param {object} options
   * @param {object} options.eventRuntime — UnifiedEventRuntime
   * @param {object} options.missionRuntime — MissionRuntime
   */
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._missionRuntime = options.missionRuntime || null;
    this._stats = { listened: 0, missionsCreated: 0, skipped: 0, failed: 0 };
  }

  /**
   * Start listening to business events and creating missions.
   */
  start() {
    if (!this._eventRuntime || !this._missionRuntime) {
      console.log('[EventToMissionBridge] Degraded — missing eventRuntime or missionRuntime');
      return;
    }

    // Subscribe to all mapped event types
    for (const eventType of Object.keys(EVENT_MISSION_MAP)) {
      this._eventRuntime.on(eventType, async (event) => {
        await this._handleEvent(event);
      });
    }

    console.log(`[EventToMissionBridge] Listening to ${Object.keys(EVENT_MISSION_MAP).length} event types`);
  }

  /**
   * Handle an incoming event — create a mission for it.
   */
  async _handleEvent(event) {
    const mapping = EVENT_MISSION_MAP[event.event_type];
    if (!mapping) {
      this._stats.skipped++;
      return;
    }

    this._stats.listened++;

    try {
      const missionId = await this._missionRuntime.create(mapping.missionType, {
        event_id: event.event_id,
        event_type: event.event_type,
        source: event.source,
        namespace: event.namespace,
        canonical_hash: (event.metadata && event.metadata.canonical_hash) || null,
        payload: event.payload,
      }, {
        priority: mapping.priority,
        createdBy: 'event-to-mission-bridge',
      });

      this._stats.missionsCreated++;
      console.log(`[EventToMissionBridge] ${event.event_type} → mission ${missionId} (${mapping.missionType})`);
    } catch (err) {
      this._stats.failed++;
      console.error(`[EventToMissionBridge] Failed to create mission for ${event.event_type}: ${err.message}`);
    }
  }

  /**
   * Get stats.
   */
  getStats() {
    return { ...this._stats };
  }
}

module.exports = { EventToMissionBridge, EVENT_MISSION_MAP };
