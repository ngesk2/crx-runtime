/**
 * Local-First Execution Authority
 *
 * Phase 36K — Autonomous Engineering Fabric
 *
 * Constitutional authority for local-first execution with control plane vs execution plane separation.
 *
 * Architecture:
 * Control Plane (Online)
 * - Mission Queue
 * - Capability Scheduler
 * - Agent Registry
 * - Event Ledger
 *
 * Execution Plane (Offline)
 * - Mission Cache
 * - Local Agent Runtime
 * - Execute
 * - Store Events
 * - Sync Later
 *
 * Constitutional Constraint:
 * - Offline should never stop work
 * - Control plane and execution plane are separated
 * - Sync happens when online
 * - Replay verifies after sync
 * - Consensus achieved after sync
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Execution Plane Status
 */
const ExecutionPlaneStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  CONFLICT: 'conflict'
};

/**
 * Mission Cache Schema
 *
 * Constitutional mission cache artifact for offline execution.
 */
class MissionCache {
  constructor(data) {
    this.cache_id = data.cache_id;
    this.mission_id = data.mission_id;
    this.mission_data = data.mission_data;
    this.cached_at = data.cached_at || constitutionalTimeAuthority.nowAsMillis();
    this.expires_at = data.expires_at || null;
    this.executed = data.executed || false;
    this.executed_at = data.executed_at || null;
    this.result = data.result || null;
    this.error = data.error || null;
    this.synced = data.synced || false;
    this.synced_at = data.synced_at || null;
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.authority = 'LocalFirstExecutionAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.cache_hash = this._computeCacheHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute cache hash
   */
  _computeCacheHash() {
    const cacheData = {
      cache_id: this.cache_id,
      mission_id: this.mission_id,
      mission_data: this.mission_data,
      cached_at: this.cached_at,
      runtime_id: this.runtime_id
    };
    return CanonicalAuthority.hash(cacheData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.cache_id,
      input_hash: this.cache_hash,
      output_hash: this.result ? CanonicalAuthority.hash(this.result) : null,
      authority: this.authority,
      node_id: this.cache_id,
      success: this.executed && !this.error,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Execute mission
   */
  execute(result) {
    this.executed = true;
    this.executed_at = constitutionalTimeAuthority.nowAsMillis();
    this.result = result;
    this.cache_hash = this._computeCacheHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Fail execution
   */
  fail(error) {
    this.executed = true;
    this.executed_at = constitutionalTimeAuthority.nowAsMillis();
    this.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    this.cache_hash = this._computeCacheHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Sync mission
   */
  sync() {
    this.synced = true;
    this.synced_at = constitutionalTimeAuthority.nowAsMillis();
    this.cache_hash = this._computeCacheHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Serialize cache to canonical bytes
   */
  toCanonical() {
    const ordered = {
      cache_id: this.cache_id,
      mission_id: this.mission_id,
      mission_data: this.mission_data,
      cached_at: this.cached_at,
      expires_at: this.expires_at,
      executed: this.executed,
      executed_at: this.executed_at,
      result: this.result,
      error: this.error,
      synced: this.synced,
      synced_at: this.synced_at,
      runtime_id: this.runtime_id,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      cache_hash: this.cache_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      cache_id: this.cache_id,
      mission_id: this.mission_id,
      mission_data: this.mission_data,
      cached_at: this.cached_at,
      expires_at: this.expires_at,
      executed: this.executed,
      executed_at: this.executed_at,
      result: this.result,
      error: this.error,
      synced: this.synced,
      synced_at: this.synced_at,
      runtime_id: this.runtime_id,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      cache_hash: this.cache_hash,
      witness: this.witness
    };
  }
}

/**
 * Local-First Execution Authority
 *
 * Constitutional authority for local-first execution.
 */
class LocalFirstExecutionAuthority {
  constructor(eventRepository, missionQueue, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._missionQueue = missionQueue;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._missionCache = new Map();
    this._executionPlaneStatus = ExecutionPlaneStatus.ONLINE;
    this._localEvents = new Map(); // Events generated while offline
    this._lastSyncAt = null;
  }
  
  /**
   * Cache mission for offline execution
   * @param {string} missionId - Mission ID
   * @param {Object} missionData - Mission data
   * @param {Object} options - Cache options
   * @returns {MissionCache} Cached mission
   */
  cacheMission(missionId, missionData, options = {}) {
    const cacheId = this._generateCacheId(missionId);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const cacheData = {
      cache_id: cacheId,
      mission_id: missionId,
      mission_data: missionData,
      cached_at: constitutionalTimeAuthority.nowAsMillis(),
      expires_at: options.expires_at || null,
      runtime_id: runtimeId
    };
    
    const cache = new MissionCache(cacheData);
    this._missionCache.set(cacheId, cache);
    
    // Emit MissionCached event
    this._emitMissionCached(cache);
    
    return cache;
  }
  
  /**
   * Execute cached mission
   * @param {string} cacheId - Cache ID
   * @param {Function} executor - Executor function
   * @returns {MissionCache} Executed cache
   */
  async executeCachedMission(cacheId, executor) {
    const cache = this._missionCache.get(cacheId);
    if (!cache) {
      throw new Error(`Mission cache not found: ${cacheId}`);
    }
    
    if (cache.executed) {
      return cache;
    }
    
    try {
      // Execute mission
      const result = await executor(cache.mission_data);
      
      cache.execute(result);
      
      // Store local event
      this._storeLocalEvent({
        event_type: 'MissionExecuted',
        aggregate_id: cache.mission_id,
        payload: {
          mission_id: cache.mission_id,
          result: result,
          executed_at: cache.executed_at
        }
      });
      
      // Emit MissionExecutedOffline event
      this._emitMissionExecutedOffline(cache);
      
      return cache;
    } catch (error) {
      cache.fail(error);
      
      // Store local event
      this._storeLocalEvent({
        event_type: 'MissionFailed',
        aggregate_id: cache.mission_id,
        payload: {
          mission_id: cache.mission_id,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          failed_at: cache.executed_at
        }
      });
      
      // Emit MissionFailedOffline event
      this._emitMissionFailedOffline(cache);
      
      return cache;
    }
  }
  
  /**
   * Go offline
   */
  goOffline() {
    this._executionPlaneStatus = ExecutionPlaneStatus.OFFLINE;
    
    // Emit ExecutionPlaneOffline event
    this._emitExecutionPlaneOffline();
  }
  
  /**
   * Go online
   */
  goOnline() {
    this._executionPlaneStatus = ExecutionPlaneStatus.ONLINE;
    
    // Emit ExecutionPlaneOnline event
    this._emitExecutionPlaneOnline();
  }
  
  /**
   * Sync local events to control plane
   * @returns {Object} Sync result
   */
  async sync() {
    if (this._executionPlaneStatus === ExecutionPlaneStatus.OFFLINE) {
      throw new Error('Cannot sync while offline');
    }
    
    this._executionPlaneStatus = ExecutionPlaneStatus.SYNCING;
    
    // Emit SyncStarted event
    this._emitSyncStarted();
    
    try {
      // Sync all local events
      const syncResults = [];
      for (const [eventId, event] of this._localEvents.entries()) {
        try {
          // Append event to event repository
          await this._eventRepository.appendEvent(event);
          
          syncResults.push({
            event_id: eventId,
            synced: true
          });
        } catch (error) {
          syncResults.push({
            event_id: eventId,
            synced: false,
            error: error.message
          });
        }
      }
      
      // Clear local events
      this._localEvents.clear();
      
      // Sync all executed missions
      for (const [cacheId, cache] of this._missionCache.entries()) {
        if (cache.executed && !cache.synced) {
          cache.sync();
          
          // Emit MissionSynced event
          this._emitMissionSynced(cache);
        }
      }
      
      this._executionPlaneStatus = ExecutionPlaneStatus.SYNCED;
      this._lastSyncAt = constitutionalTimeAuthority.nowAsMillis();
      
      // Emit SyncCompleted event
      this._emitSyncCompleted(syncResults);
      
      return {
        status: 'completed',
        sync_results: syncResults,
        synced_at: this._lastSyncAt
      };
    } catch (error) {
      this._executionPlaneStatus = ExecutionPlaneStatus.CONFLICT;
      
      // Emit SyncFailed event
      this._emitSyncFailed(error);
      
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
  
  /**
   * Replay and verify after sync
   * @returns {Object} Verification result
   */
  async verifyAfterSync() {
    if (this._executionPlaneStatus !== ExecutionPlaneStatus.SYNCED) {
      throw new Error('Cannot verify before sync');
    }
    
    // Replay all executed missions
    const verificationResults = [];
    for (const [cacheId, cache] of this._missionCache.entries()) {
      if (cache.executed && cache.synced) {
        // Verify replay
        const verification = await this._verifyMissionReplay(cache);
        verificationResults.push(verification);
      }
    }
    
    const allVerified = verificationResults.every(v => v.verified);
    
    // Emit VerificationCompleted event
    this._emitVerificationCompleted(verificationResults);
    
    return {
      all_verified: allVerified,
      verification_results: verificationResults
    };
  }
  
  /**
   * Get mission cache
   * @param {string} cacheId - Cache ID
   * @returns {MissionCache} Mission cache
   */
  getMissionCache(cacheId) {
    return this._missionCache.get(cacheId);
  }
  
  /**
   * Get all mission caches
   * @returns {Array<MissionCache>} All mission caches
   */
  getAllMissionCaches() {
    return Array.from(this._missionCache.values());
  }
  
  /**
   * Get unsynced missions
   * @returns {Array<MissionCache>} Unsynced missions
   */
  getUnsyncedMissions() {
    return this.getAllMissionCaches().filter(c => c.executed && !c.synced);
  }
  
  /**
   * Get unexecuted missions
   * @returns {Array<MissionCache>} Unexecuted missions
   */
  getUnexecutedMissions() {
    return this.getAllMissionCaches().filter(c => !c.executed);
  }
  
  /**
   * Get execution plane status
   * @returns {string} Execution plane status
   */
  getExecutionPlaneStatus() {
    return this._executionPlaneStatus;
  }
  
  /**
   * Get local event count
   * @returns {number} Local event count
   */
  getLocalEventCount() {
    return this._localEvents.size;
  }
  
  /**
   * Clear expired missions
   */
  clearExpiredMissions() {
    const now = constitutionalTimeAuthority.nowAsMillis();
    
    for (const [cacheId, cache] of this._missionCache.entries()) {
      if (cache.expires_at && cache.expires_at < now) {
        this._missionCache.delete(cacheId);
        
        // Emit MissionCacheExpired event
        this._emitMissionCacheExpired(cache);
      }
    }
  }
  
  /**
   * Store local event
   */
  _storeLocalEvent(event) {
    const eventId = identityAuthority.generateEventId(event.event_type, event.aggregate_id);
    const fullEvent = {
      event_id: eventId,
      event_type: event.event_type,
      aggregate_id: event.aggregate_id,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: this._localEvents.size + 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: event.payload,
      causation_id: null,
      correlation_id: event.aggregate_id
    };
    
    this._localEvents.set(eventId, fullEvent);
  }
  
  /**
   * Verify mission replay
   */
  async _verifyMissionReplay(cache) {
    try {
      // Get events from event repository
      const events = await this._eventRepository.getEvents(cache.mission_id);
      
      // Verify result matches
      const lastEvent = events[events.length - 1];
      const verified = lastEvent && lastEvent.payload.result && 
                      CanonicalAuthority.hash(lastEvent.payload.result) === CanonicalAuthority.hash(cache.result);
      
      return {
        mission_id: cache.mission_id,
        verified: verified
      };
    } catch (error) {
      return {
        mission_id: cache.mission_id,
        verified: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate cache ID
   */
  _generateCacheId(missionId) {
    return identityAuthority.generateId('mission_cache', {
      mission_id: missionId,
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
    return `local_first_execution_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit MissionCached event
   */
  _emitMissionCached(cache) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionCached', cache.cache_id),
      event_type: 'MissionCached',
      aggregate_id: cache.cache_id,
      aggregate_type: 'MissionCache',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: cache.toJSON(),
      causation_id: cache.mission_id,
      correlation_id: cache.cache_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionExecutedOffline event
   */
  _emitMissionExecutedOffline(cache) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionExecutedOffline', cache.cache_id),
      event_type: 'MissionExecutedOffline',
      aggregate_id: cache.cache_id,
      aggregate_type: 'MissionCache',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        cache_id: cache.cache_id,
        mission_id: cache.mission_id,
        executed_at: cache.executed_at
      },
      causation_id: cache.cache_id,
      correlation_id: cache.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionFailedOffline event
   */
  _emitMissionFailedOffline(cache) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionFailedOffline', cache.cache_id),
      event_type: 'MissionFailedOffline',
      aggregate_id: cache.cache_id,
      aggregate_type: 'MissionCache',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        cache_id: cache.cache_id,
        mission_id: cache.mission_id,
        error: cache.error,
        failed_at: cache.executed_at
      },
      causation_id: cache.cache_id,
      correlation_id: cache.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ExecutionPlaneOffline event
   */
  _emitExecutionPlaneOffline() {
    const event = {
      event_id: identityAuthority.generateEventId('ExecutionPlaneOffline', this._authorityId),
      event_type: 'ExecutionPlaneOffline',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        status: ExecutionPlaneStatus.OFFLINE,
        offline_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: null,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ExecutionPlaneOnline event
   */
  _emitExecutionPlaneOnline() {
    const event = {
      event_id: identityAuthority.generateEventId('ExecutionPlaneOnline', this._authorityId),
      event_type: 'ExecutionPlaneOnline',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        status: ExecutionPlaneStatus.ONLINE,
        online_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: this._authorityId,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncStarted event
   */
  _emitSyncStarted() {
    const event = {
      event_id: identityAuthority.generateEventId('SyncStarted', this._authorityId),
      event_type: 'SyncStarted',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        local_event_count: this._localEvents.size,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: this._authorityId,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncCompleted event
   */
  _emitSyncCompleted(syncResults) {
    const event = {
      event_id: identityAuthority.generateEventId('SyncCompleted', this._authorityId),
      event_type: 'SyncCompleted',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        sync_results: syncResults,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: this._authorityId,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncFailed event
   */
  _emitSyncFailed(error) {
    const event = {
      event_id: identityAuthority.generateEventId('SyncFailed', this._authorityId),
      event_type: 'SyncFailed',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: this._authorityId,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionSynced event
   */
  _emitMissionSynced(cache) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionSynced', cache.cache_id),
      event_type: 'MissionSynced',
      aggregate_id: cache.cache_id,
      aggregate_type: 'MissionCache',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        cache_id: cache.cache_id,
        mission_id: cache.mission_id,
        synced_at: cache.synced_at
      },
      causation_id: cache.cache_id,
      correlation_id: cache.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit VerificationCompleted event
   */
  _emitVerificationCompleted(verificationResults) {
    const event = {
      event_id: identityAuthority.generateEventId('VerificationCompleted', this._authorityId),
      event_type: 'VerificationCompleted',
      aggregate_id: this._authorityId,
      aggregate_type: 'ExecutionPlane',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        verification_results: verificationResults,
        all_verified: verificationResults.every(v => v.verified),
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: this._authorityId,
      correlation_id: this._authorityId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionCacheExpired event
   */
  _emitMissionCacheExpired(cache) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionCacheExpired', cache.cache_id),
      event_type: 'MissionCacheExpired',
      aggregate_id: cache.cache_id,
      aggregate_type: 'MissionCache',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'LocalFirstExecutionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        cache_id: cache.cache_id,
        mission_id: cache.mission_id,
        expired_at: cache.expires_at
      },
      causation_id: cache.cache_id,
      correlation_id: cache.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let localFirstExecutionAuthority = null;

function getLocalFirstExecutionAuthority(eventRepository, missionQueue, runtimeIdentity = null) {
  if (!localFirstExecutionAuthority) {
    localFirstExecutionAuthority = new LocalFirstExecutionAuthority(eventRepository, missionQueue, runtimeIdentity);
  }
  return localFirstExecutionAuthority;
}

module.exports = {
  LocalFirstExecutionAuthority,
  MissionCache,
  ExecutionPlaneStatus,
  localFirstExecutionAuthority,
  getLocalFirstExecutionAuthority
};
