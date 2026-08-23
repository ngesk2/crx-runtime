/**
 * Mission Authority V2
 *
 * Phase 36A — Autonomous Engineering Fabric
 *
 * Constitutional authority for mission lifecycle.
 *
 * Every external request becomes a Mission.
 * Nothing executes outside MissionAuthority.
 *
 * Constitutional Constraint:
 * - All work must be encapsulated as missions
 * - Missions are constitutional artifacts
 * - Mission lifecycle is event-sourced
 * - Missions have deterministic replay
 * - Missions have constitutional witnesses
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Mission Types
 *
 * Every external request maps to one mission type.
 */
const MissionTypes = {
  ARCHITECTURE_REVIEW: 'ArchitectureReview',
  BUG_FIX: 'BugFix',
  FEATURE_IMPLEMENTATION: 'FeatureImplementation',
  REFACTOR: 'Refactor',
  DEPENDENCY_UPGRADE: 'DependencyUpgrade',
  SECURITY_AUDIT: 'SecurityAudit',
  PERFORMANCE_OPTIMIZATION: 'PerformanceOptimization',
  DOCUMENTATION: 'Documentation',
  REGRESSION_REPAIR: 'RegressionRepair',
  INFRASTRUCTURE_PROVISION: 'InfrastructureProvision',
  RELEASE: 'Release',
  HOTFIX: 'Hotfix'
};

/**
 * Mission Priority Levels
 */
const MissionPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Execution Policies
 */
const ExecutionPolicy = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel',
  BEST_EFFORT: 'best_effort',
  STRICT: 'strict'
};

/**
 * Mission Schema
 *
 * Constitutional mission artifact.
 */
class Mission {
  constructor(data) {
    this.mission_id = data.mission_id;
    this.mission_type = data.mission_type;
    this.intent = data.intent;
    this.priority = data.priority || MissionPriority.MEDIUM;
    this.constraints = data.constraints || {};
    this.dependencies = data.dependencies || [];
    this.required_capabilities = data.required_capabilities || [];
    this.execution_policy = data.execution_policy || ExecutionPolicy.SEQUENTIAL;
    this.timeout = data.timeout || 3600000; // 1 hour default
    this.retry_policy = data.retry_policy || { max_retries: 3, backoff: 'exponential' };
    this.replay_policy = data.replay_policy || { enabled: true, verify: true };
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.created_at = data.created_at || constitutionalTimeAuthority.nowAsMillis();
    this.created_by = data.created_by || 'MissionAuthority';
    this.authority = 'MissionAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // State
    this.status = data.status || 'pending';
    this.assigned_agent = data.assigned_agent || null;
    this.started_at = data.started_at || null;
    this.completed_at = data.completed_at || null;
    this.result = data.result || null;
    this.error = data.error || null;
    
    // Constitutional hashes
    this.mission_hash = this._computeMissionHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute mission hash
   */
  _computeMissionHash() {
    const missionData = {
      mission_id: this.mission_id,
      mission_type: this.mission_type,
      intent: this.intent,
      priority: this.priority,
      constraints: this.constraints,
      dependencies: this.dependencies,
      required_capabilities: this.required_capabilities,
      execution_policy: this.execution_policy,
      timeout: this.timeout,
      retry_policy: this.retry_policy,
      replay_policy: this.replay_policy,
      runtime_id: this.runtime_id,
      created_at: this.created_at
    };
    return CanonicalAuthority.hash(missionData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.mission_id,
      input_hash: this.mission_hash,
      output_hash: this.result ? CanonicalAuthority.hash(this.result) : null,
      authority: this.authority,
      node_id: this.mission_id,
      success: this.status === 'completed',
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Serialize mission to canonical bytes
   */
  toCanonical() {
    const ordered = {
      mission_id: this.mission_id,
      mission_type: this.mission_type,
      intent: this.intent,
      priority: this.priority,
      constraints: this.constraints,
      dependencies: this.dependencies,
      required_capabilities: this.required_capabilities,
      execution_policy: this.execution_policy,
      timeout: this.timeout,
      retry_policy: this.retry_policy,
      replay_policy: this.replay_policy,
      runtime_id: this.runtime_id,
      created_at: this.created_at,
      created_by: this.created_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      assigned_agent: this.assigned_agent,
      started_at: this.started_at,
      completed_at: this.completed_at,
      result: this.result,
      error: this.error,
      mission_hash: this.mission_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      mission_id: this.mission_id,
      mission_type: this.mission_type,
      intent: this.intent,
      priority: this.priority,
      constraints: this.constraints,
      dependencies: this.dependencies,
      required_capabilities: this.required_capabilities,
      execution_policy: this.execution_policy,
      timeout: this.timeout,
      retry_policy: this.retry_policy,
      replay_policy: this.replay_policy,
      runtime_id: this.runtime_id,
      created_at: this.created_at,
      created_by: this.created_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      assigned_agent: this.assigned_agent,
      started_at: this.started_at,
      completed_at: this.completed_at,
      result: this.result,
      error: this.error,
      mission_hash: this.mission_hash,
      witness: this.witness
    };
  }
}

/**
 * Mission Authority
 *
 * Constitutional authority for mission lifecycle.
 */
class MissionAuthority {
  constructor(eventRepository, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._missions = new Map();
  }
  
  /**
   * Create mission from intent
   * @param {string} missionType - Mission type
   * @param {string} intent - Mission intent
   * @param {Object} options - Mission options
   * @returns {Mission} Created mission
   */
  createMission(missionType, intent, options = {}) {
    const missionId = this._generateMissionId(missionType, intent);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const missionData = {
      mission_id: missionId,
      mission_type: missionType,
      intent: intent,
      priority: options.priority || MissionPriority.MEDIUM,
      constraints: options.constraints || {},
      dependencies: options.dependencies || [],
      required_capabilities: options.required_capabilities || [],
      execution_policy: options.execution_policy || ExecutionPolicy.SEQUENTIAL,
      timeout: options.timeout || 3600000,
      retry_policy: options.retry_policy || { max_retries: 3, backoff: 'exponential' },
      replay_policy: options.replay_policy || { enabled: true, verify: true },
      runtime_id: runtimeId,
      created_at: constitutionalTimeAuthority.nowAsMillis(),
      created_by: options.created_by || 'MissionAuthority',
      status: 'pending'
    };
    
    const mission = new Mission(missionData);
    this._missions.set(missionId, mission);
    
    // Emit MissionCreated event
    this._emitMissionCreated(mission);
    
    return mission;
  }
  
  /**
   * Assign mission to agent
   * @param {string} missionId - Mission ID
   * @param {string} agentId - Agent ID
   * @returns {Mission} Updated mission
   */
  assignMission(missionId, agentId) {
    const mission = this._missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }
    
    mission.assigned_agent = agentId;
    mission.status = 'assigned';
    mission.started_at = constitutionalTimeAuthority.nowAsMillis();
    
    // Emit MissionAssigned event
    this._emitMissionAssigned(mission, agentId);
    
    return mission;
  }
  
  /**
   * Complete mission
   * @param {string} missionId - Mission ID
   * @param {Object} result - Mission result
   * @returns {Mission} Completed mission
   */
  completeMission(missionId, result) {
    const mission = this._missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }
    
    mission.status = 'completed';
    mission.completed_at = constitutionalTimeAuthority.nowAsMillis();
    mission.result = result;
    
    // Recompute witness with result
    mission.witness = mission._createWitness();
    
    // Emit MissionCompleted event
    this._emitMissionCompleted(mission);
    
    return mission;
  }
  
  /**
   * Fail mission
   * @param {string} missionId - Mission ID
   * @param {Error} error - Mission error
   * @returns {Mission} Failed mission
   */
  failMission(missionId, error) {
    const mission = this._missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }
    
    mission.status = 'failed';
    mission.completed_at = constitutionalTimeAuthority.nowAsMillis();
    mission.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    
    // Recompute witness with error
    mission.witness = mission._createWitness();
    
    // Emit MissionFailed event
    this._emitMissionFailed(mission, error);
    
    return mission;
  }
  
  /**
   * Get mission
   * @param {string} missionId - Mission ID
   * @returns {Mission} Mission
   */
  getMission(missionId) {
    return this._missions.get(missionId);
  }
  
  /**
   * Get all missions
   * @returns {Array<Mission>} All missions
   */
  getAllMissions() {
    return Array.from(this._missions.values());
  }
  
  /**
   * Get missions by status
   * @param {string} status - Mission status
   * @returns {Array<Mission>} Missions with status
   */
  getMissionsByStatus(status) {
    return this.getAllMissions().filter(m => m.status === status);
  }
  
  /**
   * Get missions by type
   * @param {string} missionType - Mission type
   * @returns {Array<Mission>} Missions of type
   */
  getMissionsByType(missionType) {
    return this.getAllMissions().filter(m => m.mission_type === missionType);
  }
  
  /**
   * Verify mission determinism
   * @param {Mission} mission1 - First mission
   * @param {Mission} mission2 - Second mission
   * @returns {boolean} Whether missions are equivalent
   */
  verifyMissionEquivalence(mission1, mission2) {
    return mission1.mission_hash === mission2.mission_hash;
  }
  
  /**
   * Replay mission from event log
   * @param {string} missionId - Mission ID
   * @returns {Mission} Replayed mission
   */
  async replayMission(missionId) {
    // Get mission events from event repository
    const events = await this._eventRepository.getEvents(missionId);
    
    // Reconstruct mission from events
    let mission = null;
    for (const event of events) {
      if (event.event_type === 'MissionCreated') {
        mission = new Mission(event.payload);
      } else if (event.event_type === 'MissionAssigned') {
        mission.assigned_agent = event.payload.agent_id;
        mission.status = 'assigned';
        mission.started_at = event.payload.started_at;
      } else if (event.event_type === 'MissionCompleted') {
        mission.status = 'completed';
        mission.completed_at = event.payload.completed_at;
        mission.result = event.payload.result;
      } else if (event.event_type === 'MissionFailed') {
        mission.status = 'failed';
        mission.completed_at = event.payload.completed_at;
        mission.error = event.payload.error;
      }
    }
    
    return mission;
  }
  
  /**
   * Generate mission ID
   */
  _generateMissionId(missionType, intent) {
    return identityAuthority.generateId('mission', {
      mission_type: missionType,
      intent_hash: CanonicalAuthority.hash(intent),
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
    return `mission_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit MissionCreated event
   */
  _emitMissionCreated(mission) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionCreated', mission.mission_id),
      event_type: 'MissionCreated',
      aggregate_id: mission.mission_id,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'MissionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: mission.toJSON(),
      causation_id: null,
      correlation_id: mission.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionAssigned event
   */
  _emitMissionAssigned(mission, agentId) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionAssigned', mission.mission_id),
      event_type: 'MissionAssigned',
      aggregate_id: mission.mission_id,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'MissionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        mission_id: mission.mission_id,
        agent_id: agentId,
        started_at: mission.started_at
      },
      causation_id: mission.mission_id,
      correlation_id: mission.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionCompleted event
   */
  _emitMissionCompleted(mission) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionCompleted', mission.mission_id),
      event_type: 'MissionCompleted',
      aggregate_id: mission.mission_id,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'MissionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        mission_id: mission.mission_id,
        result: mission.result,
        completed_at: mission.completed_at
      },
      causation_id: mission.mission_id,
      correlation_id: mission.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit MissionFailed event
   */
  _emitMissionFailed(mission, error) {
    const event = {
      event_id: identityAuthority.generateEventId('MissionFailed', mission.mission_id),
      event_type: 'MissionFailed',
      aggregate_id: mission.mission_id,
      aggregate_type: 'Mission',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'MissionAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        mission_id: mission.mission_id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        completed_at: mission.completed_at
      },
      causation_id: mission.mission_id,
      correlation_id: mission.mission_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let missionAuthorityV2 = null;

function getMissionAuthorityV2(eventRepository, runtimeIdentity = null) {
  if (!missionAuthorityV2) {
    missionAuthorityV2 = new MissionAuthority(eventRepository, runtimeIdentity);
  }
  return missionAuthorityV2;
}

module.exports = {
  MissionAuthority,
  Mission,
  MissionTypes,
  MissionPriority,
  ExecutionPolicy,
  missionAuthorityV2,
  getMissionAuthorityV2
};
