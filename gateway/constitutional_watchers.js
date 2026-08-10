/**
 * Constitutional Watchers
 *
 * Phase 36G — Autonomous Engineering Fabric
 *
 * Constitutional authority for continuous monitoring event emitters.
 *
 * Watchers continuously monitor the system and emit events.
 * They do NOT execute. They only emit events.
 *
 * Watcher Types:
 * - DependencyWatcher: Monitors dependencies for CVEs, updates
 * - SchemaWatcher: Monitors schema changes, migrations
 * - ReplayWatcher: Monitors replay failures, determinism violations
 * - ConsensusWatcher: Monitors consensus failures, replica divergence
 * - PerformanceWatcher: Monitors performance degradation, bottlenecks
 * - SecurityWatcher: Monitors security vulnerabilities, breaches
 * - CostWatcher: Monitors cost anomalies, budget overruns
 * - InfrastructureWatcher: Monitors infrastructure health, capacity
 *
 * Constitutional Constraint:
 * - Watchers only emit events
 * - Watchers do NOT execute
 * - Watchers are event-driven
 * - Watcher lifecycle is constitutional
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Watcher Types
 */
const WatcherTypes = {
  DEPENDENCY_WATCHER: 'DependencyWatcher',
  SCHEMA_WATCHER: 'SchemaWatcher',
  REPLAY_WATCHER: 'ReplayWatcher',
  CONSENSUS_WATCHER: 'ConsensusWatcher',
  PERFORMANCE_WATCHER: 'PerformanceWatcher',
  SECURITY_WATCHER: 'SecurityWatcher',
  COST_WATCHER: 'CostWatcher',
  INFRASTRUCTURE_WATCHER: 'InfrastructureWatcher'
};

/**
 * Watcher Event Types
 */
const WatcherEventTypes = {
  DEPENDENCY_CVE_DETECTED: 'DependencyCVEDetected',
  DEPENDENCY_UPDATE_AVAILABLE: 'DependencyUpdateAvailable',
  SCHEMA_CHANGE_DETECTED: 'SchemaChangeDetected',
  SCHEMA_MIGRATION_REQUIRED: 'SchemaMigrationRequired',
  REPLAY_FAILURE_DETECTED: 'ReplayFailureDetected',
  DETERMINISM_VIOLATION_DETECTED: 'DeterminismViolationDetected',
  CONSENSUS_FAILURE_DETECTED: 'ConsensusFailureDetected',
  REPLICA_DIVERGENCE_DETECTED: 'ReplicaDivergenceDetected',
  PERFORMANCE_DEGRADATION_DETECTED: 'PerformanceDegradationDetected',
  BOTTLENECK_DETECTED: 'BottleneckDetected',
  SECURITY_VULNERABILITY_DETECTED: 'SecurityVulnerabilityDetected',
  SECURITY_BREACH_DETECTED: 'SecurityBreachDetected',
  COST_ANOMALY_DETECTED: 'CostAnomalyDetected',
  BUDGET_OVERRUN_DETECTED: 'BudgetOverrunDetected',
  INFRASTRUCTURE_UNHEALTHY: 'InfrastructureUnhealthy',
  CAPACITY_EXCEEDED: 'CapacityExceeded'
};

/**
 * Watcher Event Schema
 *
 * Constitutional watcher event artifact.
 */
class WatcherEvent {
  constructor(data) {
    this.event_id = data.event_id;
    this.watcher_type = data.watcher_type;
    this.event_type = data.event_type;
    this.source = data.source;
    this.payload = data.payload || {};
    this.severity = data.severity || 'info';
    this.metadata = data.metadata || {};
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.timestamp = data.timestamp || constitutionalTimeAuthority.nowAsMillis();
    this.authority = 'ConstitutionalWatchers';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.event_hash = this._computeEventHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute event hash
   */
  _computeEventHash() {
    const eventData = {
      event_id: this.event_id,
      watcher_type: this.watcher_type,
      event_type: this.event_type,
      source: this.source,
      payload: this.payload,
      severity: this.severity,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp
    };
    return CanonicalAuthority.hash(eventData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.event_id,
      input_hash: this.event_hash,
      output_hash: null,
      authority: this.authority,
      node_id: this.event_id,
      success: true,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Serialize event to canonical bytes
   */
  toCanonical() {
    const ordered = {
      event_id: this.event_id,
      watcher_type: this.watcher_type,
      event_type: this.event_type,
      source: this.source,
      payload: this.payload,
      severity: this.severity,
      metadata: this.metadata,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      event_hash: this.event_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      event_id: this.event_id,
      watcher_type: this.watcher_type,
      event_type: this.event_type,
      source: this.source,
      payload: this.payload,
      severity: this.severity,
      metadata: this.metadata,
      runtime_id: this.runtime_id,
      timestamp: this.timestamp,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      event_hash: this.event_hash,
      witness: this.witness
    };
  }
}

/**
 * Constitutional Watchers
 *
 * Constitutional authority for continuous monitoring.
 */
class ConstitutionalWatchers {
  constructor(eventRepository, triggerAuthority, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._triggerAuthority = triggerAuthority;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._watchers = new Map();
    this._watcherIntervals = new Map();
  }
  
  /**
   * Register watcher
   * @param {string} watcherType - Watcher type
   * @param {Function} watchFunction - Watch function (returns events)
   * @param {Object} options - Watcher options
   */
  registerWatcher(watcherType, watchFunction, options = {}) {
    const watcherId = this._generateWatcherId(watcherType);
    
    const watcher = {
      watcher_id: watcherId,
      watcher_type: watcherType,
      watch_function: watchFunction,
      interval: options.interval || 60000, // 1 minute default
      enabled: options.enabled !== false,
      last_run: null,
      last_event: null,
      event_count: 0
    };
    
    this._watchers.set(watcherId, watcher);
    
    if (watcher.enabled) {
      this._startWatcher(watcherId);
    }
    
    return watcherId;
  }
  
  /**
   * Unregister watcher
   * @param {string} watcherId - Watcher ID
   */
  unregisterWatcher(watcherId) {
    this._stopWatcher(watcherId);
    this._watchers.delete(watcherId);
  }
  
  /**
   * Start watcher
   * @param {string} watcherId - Watcher ID
   */
  _startWatcher(watcherId) {
    const watcher = this._watchers.get(watcherId);
    if (!watcher) {
      return;
    }
    
    if (this._watcherIntervals.has(watcherId)) {
      this._stopWatcher(watcherId);
    }
    
    const interval = setInterval(async () => {
      await this._runWatcher(watcherId);
    }, watcher.interval);
    
    this._watcherIntervals.set(watcherId, interval);
  }
  
  /**
   * Stop watcher
   * @param {string} watcherId - Watcher ID
   */
  _stopWatcher(watcherId) {
    const interval = this._watcherIntervals.get(watcherId);
    if (interval) {
      clearInterval(interval);
      this._watcherIntervals.delete(watcherId);
    }
  }
  
  /**
   * Run watcher
   * @param {string} watcherId - Watcher ID
   */
  async _runWatcher(watcherId) {
    const watcher = this._watchers.get(watcherId);
    if (!watcher) {
      return;
    }
    
    try {
      watcher.last_run = constitutionalTimeAuthority.nowAsMillis();
      
      // Call watch function to get events
      const events = await watcher.watch_function();
      
      // Emit each event
      for (const eventData of events) {
        await this._emitWatcherEvent(watcher, eventData);
        watcher.last_event = constitutionalTimeAuthority.nowAsMillis();
        watcher.event_count++;
      }
    } catch (error) {
      console.error(`Watcher ${watcherId} failed:`, error);
    }
  }
  
  /**
   * Emit watcher event
   * @param {Object} watcher - Watcher
   * @param {Object} eventData - Event data
   */
  async _emitWatcherEvent(watcher, eventData) {
    const eventId = this._generateWatcherEventId(watcher.watcher_type, eventData.event_type);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const event = new WatcherEvent({
      event_id: eventId,
      watcher_type: watcher.watcher_type,
      event_type: eventData.event_type,
      source: eventData.source || watcher.watcher_type,
      payload: eventData.payload || {},
      severity: eventData.severity || 'info',
      metadata: eventData.metadata || {},
      runtime_id: runtimeId,
      timestamp: eventData.timestamp || constitutionalTimeAuthority.nowAsMillis()
    });
    
    // Emit to trigger authority for mission generation
    if (this._triggerAuthority) {
      await this._triggerAuthority.receiveTrigger(
        eventData.event_type,
        watcher.watcher_type,
        event.toJSON()
      );
    }
    
    // Emit WatcherEventEmitted event
    this._emitWatcherEventEmitted(event);
  }
  
  /**
   * Get watcher
   * @param {string} watcherId - Watcher ID
   * @returns {Object} Watcher
   */
  getWatcher(watcherId) {
    return this._watchers.get(watcherId);
  }
  
  /**
   * Get all watchers
   * @returns {Array<Object>} All watchers
   */
  getAllWatchers() {
    return Array.from(this._watchers.values());
  }
  
  /**
   * Get watchers by type
   * @param {string} watcherType - Watcher type
   * @returns {Array<Object>} Watchers of type
   */
  getWatchersByType(watcherType) {
    return this.getAllWatchers().filter(w => w.watcher_type === watcherType);
  }
  
  /**
   * Get watcher count
   * @returns {number} Watcher count
   */
  getWatcherCount() {
    return this._watchers.size;
  }
  
  /**
   * Start all watchers
   */
  startAllWatchers() {
    for (const [watcherId, watcher] of this._watchers.entries()) {
      if (watcher.enabled) {
        this._startWatcher(watcherId);
      }
    }
  }
  
  /**
   * Stop all watchers
   */
  stopAllWatchers() {
    for (const watcherId of this._watchers.keys()) {
      this._stopWatcher(watcherId);
    }
  }
  
  /**
   * Generate watcher ID
   */
  _generateWatcherId(watcherType) {
    return identityAuthority.generateId('watcher', {
      watcher_type: watcherType,
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate watcher event ID
   */
  _generateWatcherEventId(watcherType, eventType) {
    return identityAuthority.generateId('watcher_event', {
      watcher_type: watcherType,
      event_type: eventType,
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
    return `constitutional_watchers_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit WatcherEventEmitted event
   */
  _emitWatcherEventEmitted(event) {
    const dbEvent = {
      event_id: identityAuthority.generateEventId('WatcherEventEmitted', event.event_id),
      event_type: 'WatcherEventEmitted',
      aggregate_id: event.event_id,
      aggregate_type: 'WatcherEvent',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalWatchers',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: event.toJSON(),
      causation_id: null,
      correlation_id: event.event_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(dbEvent);
    }
  }
}

// Singleton instance
let constitutionalWatchers = null;

function getConstitutionalWatchers(eventRepository, triggerAuthority, runtimeIdentity = null) {
  if (!constitutionalWatchers) {
    constitutionalWatchers = new ConstitutionalWatchers(eventRepository, triggerAuthority, runtimeIdentity);
  }
  return constitutionalWatchers;
}

module.exports = {
  ConstitutionalWatchers,
  WatcherEvent,
  WatcherTypes,
  WatcherEventTypes,
  constitutionalWatchers,
  getConstitutionalWatchers
};
