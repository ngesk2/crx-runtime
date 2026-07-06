/**
 * Trigger Authority
 *
 * Phase 36B — Autonomous Engineering Fabric
 *
 * Constitutional authority for event-driven triggers.
 *
 * Every external request becomes a TriggerEvent.
 * Every TriggerEvent becomes a Mission.
 *
 * Constitutional Constraint:
 * - No polling
 * - No scattered cron
 * - Everything is event-driven
 * - Triggers are constitutional artifacts
 * - Trigger lifecycle is event-sourced
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Trigger Types
 *
 * Every external system maps to a trigger type.
 */
const TriggerTypes = {
  GITHUB_PUSH: 'GitHubPush',
  GITHUB_ISSUE: 'GitHubIssue',
  PR_OPENED: 'PROpened',
  PR_MERGED: 'PRMerged',
  CI_FAILURE: 'CIFailure',
  DEPENDENCY_CVE: 'DependencyCVE',
  NEW_RELEASE: 'NewRelease',
  CRON: 'Cron',
  FILESYSTEM_CHANGE: 'FilesystemChange',
  EMAIL: 'Email',
  SLACK: 'Slack',
  WEBHOOK: 'Webhook',
  CALENDAR: 'Calendar',
  HUMAN_PROMPT: 'HumanPrompt',
  SENSOR: 'Sensor',
  MONITORING_ALERT: 'MonitoringAlert',
  AGENT_FINISHED: 'AgentFinished',
  CONSENSUS_FAILED: 'ConsensusFailed',
  REPLAY_FAILED: 'ReplayFailed'
};

/**
 * Trigger Priority Levels
 */
const TriggerPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Trigger Schema
 *
 * Constitutional trigger artifact.
 */
class TriggerEvent {
  constructor(data) {
    this.trigger_id = data.trigger_id;
    this.trigger_type = data.trigger_type;
    this.source = data.source;
    this.payload = data.payload || {};
    this.priority = data.priority || TriggerPriority.MEDIUM;
    this.metadata = data.metadata || {};
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.timestamp = data.timestamp || constitutionalTimeAuthority.nowAsMillis();
    this.received_at = data.received_at || constitutionalTimeAuthority.nowAsMillis();
    this.authority = 'TriggerAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // State
    this.status = data.status || 'pending';
    this.mission_id = data.mission_id || null;
    this.processed_at = data.processed_at || null;
    
    // Constitutional hashes
    this.trigger_hash = this._computeTriggerHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute trigger hash
   */
  _computeTriggerHash() {
    const triggerData = {
      trigger_id: this.trigger_id,
      trigger_type: this.trigger_type,
      source: this.source,
      payload: this.payload,
      priority: this.priority,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp
    };
    return CanonicalAuthority.hash(triggerData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.trigger_id,
      input_hash: this.trigger_hash,
      output_hash: this.mission_id ? CanonicalAuthority.hash(this.mission_id) : null,
      authority: this.authority,
      node_id: this.trigger_id,
      success: this.status === 'processed',
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Serialize trigger to canonical bytes
   */
  toCanonical() {
    const ordered = {
      trigger_id: this.trigger_id,
      trigger_type: this.trigger_type,
      source: this.source,
      payload: this.payload,
      priority: this.priority,
      metadata: this.metadata,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp,
      received_at: this.received_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      mission_id: this.mission_id,
      processed_at: this.processed_at,
      trigger_hash: this.trigger_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      trigger_id: this.trigger_id,
      trigger_type: this.trigger_type,
      source: this.source,
      payload: this.payload,
      priority: this.priority,
      metadata: this.metadata,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp,
      received_at: this.received_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      mission_id: this.mission_id,
      processed_at: this.processed_at,
      trigger_hash: this.trigger_hash,
      witness: this.witness
    };
  }
}

/**
 * Trigger Authority
 *
 * Constitutional authority for trigger lifecycle.
 */
class TriggerAuthority {
  constructor(eventRepository, missionAuthority, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._missionAuthority = missionAuthority;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._triggers = new Map();
    this._triggerHandlers = new Map();
  }
  
  /**
   * Register trigger handler
   * @param {string} triggerType - Trigger type
   * @param {Function} handler - Handler function
   */
  registerTriggerHandler(triggerType, handler) {
    this._triggerHandlers.set(triggerType, handler);
  }
  
  /**
   * Receive trigger
   * @param {string} triggerType - Trigger type
   * @param {string} source - Trigger source
   * @param {Object} payload - Trigger payload
   * @param {Object} options - Trigger options
   * @returns {TriggerEvent} Received trigger
   */
  receiveTrigger(triggerType, source, payload, options = {}) {
    const triggerId = this._generateTriggerId(triggerType, source, payload);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const triggerData = {
      trigger_id: triggerId,
      trigger_type: triggerType,
      source: source,
      payload: payload,
      priority: options.priority || this._getDefaultPriority(triggerType),
      metadata: options.metadata || {},
      runtime_id: runtimeId,
      timestamp: options.timestamp || constitutionalTimeAuthority.nowAsMillis(),
      received_at: constitutionalTimeAuthority.nowAsMillis(),
      status: 'pending'
    };
    
    const trigger = new TriggerEvent(triggerData);
    this._triggers.set(triggerId, trigger);
    
    // Emit TriggerReceived event
    this._emitTriggerReceived(trigger);
    
    return trigger;
  }
  
  /**
   * Process trigger
   * @param {string} triggerId - Trigger ID
   * @returns {Object} Processing result
   */
  async processTrigger(triggerId) {
    const trigger = this._triggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger not found: ${triggerId}`);
    }
    
    // Get trigger handler
    const handler = this._triggerHandlers.get(trigger.trigger_type);
    if (!handler) {
      throw new Error(`No handler registered for trigger type: ${trigger.trigger_type}`);
    }
    
    // Call handler to generate mission
    const missionResult = await handler(trigger);
    
    // Update trigger
    trigger.status = 'processed';
    trigger.mission_id = missionResult.mission_id;
    trigger.processed_at = constitutionalTimeAuthority.nowAsMillis();
    
    // Recompute witness
    trigger.witness = trigger._createWitness();
    
    // Emit TriggerProcessed event
    this._emitTriggerProcessed(trigger, missionResult);
    
    return {
      trigger: trigger,
      mission: missionResult.mission
    };
  }
  
  /**
   * Get trigger
   * @param {string} triggerId - Trigger ID
   * @returns {TriggerEvent} Trigger
   */
  getTrigger(triggerId) {
    return this._triggers.get(triggerId);
  }
  
  /**
   * Get all triggers
   * @returns {Array<TriggerEvent>} All triggers
   */
  getAllTriggers() {
    return Array.from(this._triggers.values());
  }
  
  /**
   * Get triggers by type
   * @param {string} triggerType - Trigger type
   * @returns {Array<TriggerEvent>} Triggers of type
   */
  getTriggersByType(triggerType) {
    return this.getAllTriggers().filter(t => t.trigger_type === triggerType);
  }
  
  /**
   * Get triggers by status
   * @param {string} status - Trigger status
   * @returns {Array<TriggerEvent>} Triggers with status
   */
  getTriggersByStatus(status) {
    return this.getAllTriggers().filter(t => t.status === status);
  }
  
  /**
   * Get pending triggers
   * @returns {Array<TriggerEvent>} Pending triggers
   */
  getPendingTriggers() {
    return this.getTriggersByStatus('pending');
  }
  
  /**
   * Get triggers by source
   * @param {string} source - Trigger source
   * @returns {Array<TriggerEvent>} Triggers from source
   */
  getTriggersBySource(source) {
    return this.getAllTriggers().filter(t => t.source === source);
  }
  
  /**
   * Get trigger count
   * @returns {number} Trigger count
   */
  getTriggerCount() {
    return this._triggers.size;
  }
  
  /**
   * Check if trigger exists
   * @param {string} triggerId - Trigger ID
   * @returns {boolean} Trigger exists
   */
  hasTrigger(triggerId) {
    return this._triggers.has(triggerId);
  }
  
  /**
   * Verify trigger determinism
   * @param {TriggerEvent} trigger1 - First trigger
   * @param {TriggerEvent} trigger2 - Second trigger
   * @returns {boolean} Whether triggers are equivalent
   */
  verifyTriggerEquivalence(trigger1, trigger2) {
    return trigger1.trigger_hash === trigger2.trigger_hash;
  }
  
  /**
   * Replay trigger from event log
   * @param {string} triggerId - Trigger ID
   * @returns {TriggerEvent} Replayed trigger
   */
  async replayTrigger(triggerId) {
    // Get trigger events from event repository
    const events = await this._eventRepository.getEvents(triggerId);
    
    // Reconstruct trigger from events
    let trigger = null;
    for (const event of events) {
      if (event.event_type === 'TriggerReceived') {
        trigger = new TriggerEvent(event.payload);
      } else if (event.event_type === 'TriggerProcessed') {
        trigger.status = 'processed';
        trigger.mission_id = event.payload.mission_id;
        trigger.processed_at = event.payload.processed_at;
      }
    }
    
    return trigger;
  }
  
  /**
   * Get default priority for trigger type
   */
  _getDefaultPriority(triggerType) {
    const priorityMap = {
      [TriggerTypes.GITHUB_PUSH]: TriggerPriority.MEDIUM,
      [TriggerTypes.GITHUB_ISSUE]: TriggerPriority.MEDIUM,
      [TriggerTypes.PR_OPENED]: TriggerPriority.HIGH,
      [TriggerTypes.PR_MERGED]: TriggerPriority.HIGH,
      [TriggerTypes.CI_FAILURE]: TriggerPriority.CRITICAL,
      [TriggerTypes.DEPENDENCY_CVE]: TriggerPriority.CRITICAL,
      [TriggerTypes.NEW_RELEASE]: TriggerPriority.MEDIUM,
      [TriggerTypes.CRON]: TriggerPriority.LOW,
      [TriggerTypes.FILESYSTEM_CHANGE]: TriggerPriority.LOW,
      [TriggerTypes.EMAIL]: TriggerPriority.MEDIUM,
      [TriggerTypes.SLACK]: TriggerPriority.MEDIUM,
      [TriggerTypes.WEBHOOK]: TriggerPriority.MEDIUM,
      [TriggerTypes.CALENDAR]: TriggerPriority.MEDIUM,
      [TriggerTypes.HUMAN_PROMPT]: TriggerPriority.HIGH,
      [TriggerTypes.SENSOR]: TriggerPriority.MEDIUM,
      [TriggerTypes.MONITORING_ALERT]: TriggerPriority.HIGH,
      [TriggerTypes.AGENT_FINISHED]: TriggerPriority.MEDIUM,
      [TriggerTypes.CONSENSUS_FAILED]: TriggerPriority.CRITICAL,
      [TriggerTypes.REPLAY_FAILED]: TriggerPriority.CRITICAL
    };
    
    return priorityMap[triggerType] || TriggerPriority.MEDIUM;
  }
  
  /**
   * Generate trigger ID
   */
  _generateTriggerId(triggerType, source, payload) {
    return identityAuthority.generateId('trigger', {
      trigger_type: triggerType,
      source: source,
      payload_hash: CanonicalAuthority.hash(payload),
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '36.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `trigger_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit TriggerReceived event
   */
  _emitTriggerReceived(trigger) {
    const event = {
      event_id: identityAuthority.generateEventId('TriggerReceived', trigger.trigger_id),
      event_type: 'TriggerReceived',
      aggregate_id: trigger.trigger_id,
      aggregate_type: 'Trigger',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'TriggerAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: trigger.toJSON(),
      causation_id: null,
      correlation_id: trigger.trigger_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit TriggerProcessed event
   */
  _emitTriggerProcessed(trigger, missionResult) {
    const event = {
      event_id: identityAuthority.generateEventId('TriggerProcessed', trigger.trigger_id),
      event_type: 'TriggerProcessed',
      aggregate_id: trigger.trigger_id,
      aggregate_type: 'Trigger',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'TriggerAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        trigger_id: trigger.trigger_id,
        mission_id: trigger.mission_id,
        processed_at: trigger.processed_at,
        mission_result: missionResult
      },
      causation_id: trigger.trigger_id,
      correlation_id: trigger.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let triggerAuthority = null;

function getTriggerAuthority(eventRepository, missionAuthority, runtimeIdentity = null) {
  if (!triggerAuthority) {
    triggerAuthority = new TriggerAuthority(eventRepository, missionAuthority, runtimeIdentity);
  }
  return triggerAuthority;
}

module.exports = {
  TriggerAuthority,
  TriggerEvent,
  TriggerTypes,
  TriggerPriority,
  triggerAuthority,
  getTriggerAuthority
};
