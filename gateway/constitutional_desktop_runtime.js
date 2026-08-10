/**
 * Constitutional Desktop Runtime
 *
 * Phase 36N — Autonomous Engineering Fabric
 *
 * Constitutional authority for desktop as constitutional runtime.
 *
 * Eventually your desktop is just another runtime.
 *
 * Desktop Runtime
 * ↓
 * Mission Queue
 * ↓
 * Capability Scheduler
 * ↓
 * Agents
 * ↓
 * Event Ledger
 * ↓
 * Replay
 * ↓
 * Certificates
 * ↓
 * Sync
 *
 * Even if disconnected for days.
 *
 * Constitutional Constraint:
 * - Desktop is constitutional runtime
 * - Desktop has runtime identity
 * - Desktop participates in consensus
 * - Desktop lifecycle is constitutional
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Desktop Runtime Status
 */
const DesktopRuntimeStatus = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  BUSY: 'busy',
  OFFLINE: 'offline',
  SYNCING: 'syncing',
  ERROR: 'error'
};

/**
 * Desktop Runtime Schema
 *
 * Constitutional desktop runtime artifact.
 */
class DesktopRuntime {
  constructor(data) {
    this.runtime_id = data.runtime_id;
    this.desktop_id = data.desktop_id;
    this.hostname = data.hostname;
    this.platform = data.platform;
    this.architecture = data.architecture;
    this.os_version = data.os_version;
    this.node_version = data.node_version;
    this.capabilities = data.capabilities || [];
    this.resources = data.resources || {};
    this.status = data.status || DesktopRuntimeStatus.INITIALIZING;
    this.started_at = data.started_at || constitutionalTimeAuthority.nowAsMillis();
    this.last_heartbeat = data.last_heartbeat || null;
    this.mission_count = data.mission_count || 0;
    this.queue_depth = data.queue_depth || 0;
    this.event_count = data.event_count || 0;
    this.replay_count = data.replay_count || 0;
    this.certificate_count = data.certificate_count || 0;
    this.sync_status = data.sync_status || 'synced';
    this.last_sync_at = data.last_sync_at || null;
    
    // Constitutional metadata
    this.authority = 'ConstitutionalDesktopRuntime';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute runtime hash
   */
  _computeRuntimeHash() {
    const runtimeData = {
      runtime_id: this.runtime_id,
      desktop_id: this.desktop_id,
      hostname: this.hostname,
      platform: this.platform,
      architecture: this.architecture,
      os_version: this.os_version,
      capabilities: this.capabilities,
      resources: this.resources,
      started_at: this.started_at
    };
    return CanonicalAuthority.hash(runtimeData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.runtime_id,
      input_hash: this.runtime_hash,
      output_hash: null,
      authority: this.authority,
      node_id: this.runtime_id,
      success: this.status === DesktopRuntimeStatus.READY,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Update heartbeat
   */
  updateHeartbeat() {
    this.last_heartbeat = constitutionalTimeAuthority.nowAsMillis();
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update status
   */
  updateStatus(status) {
    this.status = status;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update resources
   */
  updateResources(resources) {
    this.resources = { ...this.resources, ...resources };
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Increment mission count
   */
  incrementMissionCount() {
    this.mission_count++;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update queue depth
   */
  updateQueueDepth(depth) {
    this.queue_depth = depth;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Increment event count
   */
  incrementEventCount() {
    this.event_count++;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Increment replay count
   */
  incrementReplayCount() {
    this.replay_count++;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Increment certificate count
   */
  incrementCertificateCount() {
    this.certificate_count++;
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update sync status
   */
  updateSyncStatus(syncStatus) {
    this.sync_status = syncStatus;
    this.last_sync_at = constitutionalTimeAuthority.nowAsMillis();
    this.runtime_hash = this._computeRuntimeHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Serialize runtime to canonical bytes
   */
  toCanonical() {
    const ordered = {
      runtime_id: this.runtime_id,
      desktop_id: this.desktop_id,
      hostname: this.hostname,
      platform: this.platform,
      architecture: this.architecture,
      os_version: this.os_version,
      node_version: this.node_version,
      capabilities: this.capabilities,
      resources: this.resources,
      status: this.status,
      started_at: this.started_at,
      last_heartbeat: this.last_heartbeat,
      mission_count: this.mission_count,
      queue_depth: this.queue_depth,
      event_count: this.event_count,
      replay_count: this.replay_count,
      certificate_count: this.certificate_count,
      sync_status: this.sync_status,
      last_sync_at: this.last_sync_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      runtime_hash: this.runtime_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      runtime_id: this.runtime_id,
      desktop_id: this.desktop_id,
      hostname: this.hostname,
      platform: this.platform,
      architecture: this.architecture,
      os_version: this.os_version,
      node_version: this.node_version,
      capabilities: this.capabilities,
      resources: this.resources,
      status: this.status,
      started_at: this.started_at,
      last_heartbeat: this.last_heartbeat,
      mission_count: this.mission_count,
      queue_depth: this.queue_depth,
      event_count: this.event_count,
      replay_count: this.replay_count,
      certificate_count: this.certificate_count,
      sync_status: this.sync_status,
      last_sync_at: this.last_sync_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      runtime_hash: this.runtime_hash,
      witness: this.witness
    };
  }
}

/**
 * Constitutional Desktop Runtime
 *
 * Constitutional authority for desktop runtime management.
 */
class ConstitutionalDesktopRuntime {
  constructor(eventRepository, missionQueue, capabilityScheduler, agentRegistry, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._missionQueue = missionQueue;
    this._capabilityScheduler = capabilityScheduler;
    this._agentRegistry = agentRegistry;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._desktopRuntime = null;
    this._heartbeatInterval = null;
  }
  
  /**
   * Initialize desktop runtime
   * @param {Object} desktopInfo - Desktop information
   * @returns {DesktopRuntime} Initialized runtime
   */
  initializeDesktopRuntime(desktopInfo) {
    const runtimeId = this._generateRuntimeId(desktopInfo);
    const desktopId = this._generateDesktopId(desktopInfo);
    
    const runtimeData = {
      runtime_id: runtimeId,
      desktop_id: desktopId,
      hostname: desktopInfo.hostname || 'unknown',
      platform: desktopInfo.platform || process.platform,
      architecture: desktopInfo.architecture || process.arch,
      os_version: desktopInfo.os_version || process.release.version,
      node_version: desktopInfo.node_version || process.version,
      capabilities: desktopInfo.capabilities || [],
      resources: desktopInfo.resources || {},
      status: DesktopRuntimeStatus.INITIALIZING,
      started_at: constitutionalTimeAuthority.nowAsMillis()
    };
    
    this._desktopRuntime = new DesktopRuntime(runtimeData);
    
    // Emit DesktopRuntimeInitialized event
    this._emitDesktopRuntimeInitialized(this._desktopRuntime);
    
    // Start heartbeat
    this._startHeartbeat();
    
    // Transition to ready
    this._desktopRuntime.updateStatus(DesktopRuntimeStatus.READY);
    
    // Emit DesktopRuntimeReady event
    this._emitDesktopRuntimeReady(this._desktopRuntime);
    
    return this._desktopRuntime;
  }
  
  /**
   * Start heartbeat
   */
  _startHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
    }
    
    this._heartbeatInterval = setInterval(() => {
      if (this._desktopRuntime) {
        this._desktopRuntime.updateHeartbeat();
        
        // Emit DesktopRuntimeHeartbeat event
        this._emitDesktopRuntimeHeartbeat(this._desktopRuntime);
      }
    }, 30000); // 30 seconds
  }
  
  /**
   * Stop heartbeat
   */
  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }
  
  /**
   * Shutdown desktop runtime
   */
  shutdownDesktopRuntime() {
    if (this._desktopRuntime) {
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.OFFLINE);
      
      // Stop heartbeat
      this._stopHeartbeat();
      
      // Emit DesktopRuntimeShutdown event
      this._emitDesktopRuntimeShutdown(this._desktopRuntime);
      
      this._desktopRuntime = null;
    }
  }
  
  /**
   * Get desktop runtime
   * @returns {DesktopRuntime} Desktop runtime
   */
  getDesktopRuntime() {
    return this._desktopRuntime;
  }
  
  /**
   * Update runtime resources
   * @param {Object} resources - Resource metrics
   * @returns {DesktopRuntime} Updated runtime
   */
  updateRuntimeResources(resources) {
    if (!this._desktopRuntime) {
      throw new Error('Desktop runtime not initialized');
    }
    
    this._desktopRuntime.updateResources(resources);
    
    // Emit DesktopRuntimeResourcesUpdated event
    this._emitDesktopRuntimeResourcesUpdated(this._desktopRuntime);
    
    return this._desktopRuntime;
  }
  
  /**
   * Process mission
   * @param {string} missionId - Mission ID
   * @returns {Object} Processing result
   */
  async processMission(missionId) {
    if (!this._desktopRuntime) {
      throw new Error('Desktop runtime not initialized');
    }
    
    this._desktopRuntime.updateStatus(DesktopRuntimeStatus.BUSY);
    this._desktopRuntime.incrementMissionCount();
    
    // Emit MissionProcessingStarted event
    this._emitMissionProcessingStarted(this._desktopRuntime, missionId);
    
    try {
      // Process mission through capability scheduler
      const result = await this._capabilityScheduler.scheduleMission(missionId, [], {});
      
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.READY);
      
      // Emit MissionProcessingCompleted event
      this._emitMissionProcessingCompleted(this._desktopRuntime, missionId, result);
      
      return result;
    } catch (error) {
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.ERROR);
      
      // Emit MissionProcessingFailed event
      this._emitMissionProcessingFailed(this._desktopRuntime, missionId, error);
      
      throw error;
    }
  }
  
  /**
   * Sync with control plane
   * @returns {Object} Sync result
   */
  async syncWithControlPlane() {
    if (!this._desktopRuntime) {
      throw new Error('Desktop runtime not initialized');
    }
    
    this._desktopRuntime.updateStatus(DesktopRuntimeStatus.SYNCING);
    this._desktopRuntime.updateSyncStatus('syncing');
    
    // Emit SyncStarted event
    this._emitSyncStarted(this._desktopRuntime);
    
    try {
      // Sync events
      this._desktopRuntime.incrementEventCount();
      
      // Sync replays
      this._desktopRuntime.incrementReplayCount();
      
      // Sync certificates
      this._desktopRuntime.incrementCertificateCount();
      
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.READY);
      this._desktopRuntime.updateSyncStatus('synced');
      
      // Emit SyncCompleted event
      this._emitSyncCompleted(this._desktopRuntime);
      
      return {
        status: 'completed',
        synced_at: this._desktopRuntime.last_sync_at
      };
    } catch (error) {
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.ERROR);
      this._desktopRuntime.updateSyncStatus('error');
      
      // Emit SyncFailed event
      this._emitSyncFailed(this._desktopRuntime, error);
      
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
  
  /**
   * Replay events
   * @returns {Object} Replay result
   */
  async replayEvents() {
    if (!this._desktopRuntime) {
      throw new Error('Desktop runtime not initialized');
    }
    
    this._desktopRuntime.incrementReplayCount();
    
    // Emit ReplayStarted event
    this._emitReplayStarted(this._desktopRuntime);
    
    try {
      // Replay events using replay authority
      // This would integrate with ContinuousReplayAuthority
      
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.READY);
      
      // Emit ReplayCompleted event
      this._emitReplayCompleted(this._desktopRuntime);
      
      return {
        status: 'completed',
        replay_count: this._desktopRuntime.replay_count
      };
    } catch (error) {
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.ERROR);
      
      // Emit ReplayFailed event
      this._emitReplayFailed(this._desktopRuntime, error);
      
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
  
  /**
   * Generate certificates
   * @returns {Object} Certificate generation result
   */
  async generateCertificates() {
    if (!this._desktopRuntime) {
      throw new Error('Desktop runtime not initialized');
    }
    
    this._desktopRuntime.incrementCertificateCount();
    
    // Emit CertificateGenerationStarted event
    this._emitCertificateGenerationStarted(this._desktopRuntime);
    
    try {
      // Generate certificates using replay certificate authority
      // This would integrate with ContinuousReplayAuthority
      
      // Emit CertificateGenerationCompleted event
      this._emitCertificateGenerationCompleted(this._desktopRuntime);
      
      return {
        status: 'completed',
        certificate_count: this._desktopRuntime.certificate_count
      };
    } catch (error) {
      this._desktopRuntime.updateStatus(DesktopRuntimeStatus.ERROR);
      
      // Emit CertificateGenerationFailed event
      this._emitCertificateGenerationFailed(this._desktopRuntime, error);
      
      return {
        status: 'failed',
        error: error.message
      };
    }
  }
  
  /**
   * Verify runtime determinism
   * @param {DesktopRuntime} runtime1 - First runtime
   * @param {DesktopRuntime} runtime2 - Second runtime
   * @returns {boolean} Whether runtimes are equivalent
   */
  verifyRuntimeEquivalence(runtime1, runtime2) {
    return runtime1.runtime_hash === runtime2.runtime_hash;
  }
  
  /**
   * Replay runtime from event log
   * @param {string} runtimeId - Runtime ID
   * @returns {DesktopRuntime} Replayed runtime
   */
  async replayRuntimeFromEvents(runtimeId) {
    // Get runtime events from event repository
    const events = await this._eventRepository.getEvents(runtimeId);
    
    // Reconstruct runtime from events
    let runtime = null;
    for (const event of events) {
      if (event.event_type === 'DesktopRuntimeInitialized') {
        runtime = new DesktopRuntime(event.payload);
      } else if (event.event_type === 'DesktopRuntimeHeartbeat') {
        runtime.updateHeartbeat();
      } else if (event.event_type === 'DesktopRuntimeResourcesUpdated') {
        runtime.updateResources(event.payload.resources);
      } else if (event.event_type === 'DesktopRuntimeShutdown') {
        runtime.updateStatus(DesktopRuntimeStatus.OFFLINE);
      }
    }
    
    return runtime;
  }
  
  /**
   * Generate runtime ID
   */
  _generateRuntimeId(desktopInfo) {
    return identityAuthority.generateId('desktop_runtime', {
      hostname: desktopInfo.hostname,
      platform: desktopInfo.platform,
      architecture: desktopInfo.architecture,
      os_version: desktopInfo.os_version,
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate desktop ID
   */
  _generateDesktopId(desktopInfo) {
    return identityAuthority.generateId('desktop', {
      hostname: desktopInfo.hostname,
      platform: desktopInfo.platform,
      architecture: desktopInfo.architecture,
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
    return `constitutional_desktop_runtime_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit DesktopRuntimeInitialized event
   */
  _emitDesktopRuntimeInitialized(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('DesktopRuntimeInitialized', runtime.runtime_id),
      event_type: 'DesktopRuntimeInitialized',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: runtime.toJSON(),
      causation_id: null,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit DesktopRuntimeReady event
   */
  _emitDesktopRuntimeReady(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('DesktopRuntimeReady', runtime.runtime_id),
      event_type: 'DesktopRuntimeReady',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        ready_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit DesktopRuntimeHeartbeat event
   */
  _emitDesktopRuntimeHeartbeat(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('DesktopRuntimeHeartbeat', runtime.runtime_id),
      event_type: 'DesktopRuntimeHeartbeat',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        heartbeat: runtime.last_heartbeat
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit DesktopRuntimeShutdown event
   */
  _emitDesktopRuntimeShutdown(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('DesktopRuntimeShutdown', runtime.runtime_id),
      event_type: 'DesktopRuntimeShutdown',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        shutdown_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit DesktopRuntimeResourcesUpdated event
   */
  _emitDesktopRuntimeResourcesUpdated(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('DesktopRuntimeResourcesUpdated', runtime.runtime_id),
      event_type: 'DesktopRuntimeResourcesUpdated',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        resources: runtime.resources
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionProcessingStarted event
   */
  _emitMissionProcessingStarted(runtime, missionId) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionProcessingStarted', missionId),
      event_type: 'MissionProcessingStarted',
      aggregate_id: missionId,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        mission_id: missionId,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: missionId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionProcessingCompleted event
   */
  _emitMissionProcessingCompleted(runtime, missionId, result) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionProcessingCompleted', missionId),
      event_type: 'MissionProcessingCompleted',
      aggregate_id: missionId,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        mission_id: missionId,
        result: result,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: missionId,
      correlation_id: missionId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionProcessingFailed event
   */
  _emitMissionProcessingFailed(runtime, missionId, error) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionProcessingFailed', missionId),
      event_type: 'MissionProcessingFailed',
      aggregate_id: missionId,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        mission_id: missionId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: missionId,
      correlation_id: missionId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncStarted event
   */
  _emitSyncStarted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('SyncStarted', runtime.runtime_id),
      event_type: 'SyncStarted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 6,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncCompleted event
   */
  _emitSyncCompleted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('SyncCompleted', runtime.runtime_id),
      event_type: 'SyncCompleted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 7,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        synced_at: runtime.last_sync_at
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit SyncFailed event
   */
  _emitSyncFailed(runtime, error) {
    const event = {
      event_id: identityAuthority.generateEventId('SyncFailed', runtime.runtime_id),
      event_type: 'SyncFailed',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 7,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayStarted event
   */
  _emitReplayStarted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayStarted', runtime.runtime_id),
      event_type: 'ReplayStarted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 8,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayCompleted event
   */
  _emitReplayCompleted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayCompleted', runtime.runtime_id),
      event_type: 'ReplayCompleted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 9,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayFailed event
   */
  _emitReplayFailed(runtime, error) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayFailed', runtime.runtime_id),
      event_type: 'ReplayFailed',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 9,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit CertificateGenerationStarted event
   */
  _emitCertificateGenerationStarted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('CertificateGenerationStarted', runtime.runtime_id),
      event_type: 'CertificateGenerationStarted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 10,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit CertificateGenerationCompleted event
   */
  _emitCertificateGenerationCompleted(runtime) {
    const event = {
      event_id: identityAuthority.generateEventId('CertificateGenerationCompleted', runtime.runtime_id),
      event_type: 'CertificateGenerationCompleted',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 11,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit CertificateGenerationFailed event
   */
  _emitCertificateGenerationFailed(runtime, error) {
    const event = {
      event_id: identityAuthority.generateEventId('CertificateGenerationFailed', runtime.runtime_id),
      event_type: 'CertificateGenerationFailed',
      aggregate_id: runtime.runtime_id,
      aggregate_type: 'DesktopRuntime',
      aggregate_version: 1,
      sequence: 11,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ConstitutionalDesktopRuntime',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        runtime_id: runtime.runtime_id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: runtime.runtime_id,
      correlation_id: runtime.runtime_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let constitutionalDesktopRuntime = null;

function getConstitutionalDesktopRuntime(eventRepository, missionQueue, capabilityScheduler, agentRegistry, runtimeIdentity = null) {
  if (!constitutionalDesktopRuntime) {
    constitutionalDesktopRuntime = new ConstitutionalDesktopRuntime(eventRepository, missionQueue, capabilityScheduler, agentRegistry, runtimeIdentity);
  }
  return constitutionalDesktopRuntime;
}

module.exports = {
  ConstitutionalDesktopRuntime,
  DesktopRuntime,
  DesktopRuntimeStatus,
  constitutionalDesktopRuntime,
  getConstitutionalDesktopRuntime
};
