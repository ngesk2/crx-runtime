/**
 * Agent Registry V2
 *
 * Phase 36D — Autonomous Engineering Fabric
 *
 * Constitutional registry for agent runtime state.
 *
 * Every agent becomes runtime state.
 * Replaces WorkerRegistry.
 *
 * Constitutional Constraint:
 * - Agent state is event-sourced
 * - Agent registration is constitutional
 * - Agent capabilities are constitutional
 * - Agent health is constitutional
 * - Agent assignments are constitutional
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Agent Types
 */
const AgentTypes = {
  CODE_GENERATION: 'CodeGeneration',
  REVIEW: 'Review',
  TESTING: 'Testing',
  DEPLOYMENT: 'Deployment',
  MONITORING: 'Monitoring',
  DOCUMENTATION: 'Documentation',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
  INFRASTRUCTURE: 'Infrastructure'
};

/**
 * Agent Health Status
 */
const AgentHealth = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  OFFLINE: 'offline'
};

/**
 * Agent Capabilities
 */
const AgentCapabilities = {
  READ_REPOSITORY: 'ReadRepository',
  WRITE_REPOSITORY: 'WriteRepository',
  EXECUTE_TESTS: 'ExecuteTests',
  RUN_OLLAMA: 'RunOllama',
  OPEN_PR: 'OpenPR',
  DEPLOY_PREVIEW: 'DeployPreview',
  CODE_GENERATION: 'CodeGeneration',
  CODE_REVIEW: 'CodeReview',
  SECURITY_AUDIT: 'SecurityAudit',
  PERFORMANCE_ANALYSIS: 'PerformanceAnalysis',
  DOCUMENTATION_GENERATION: 'DocumentationGeneration'
};

/**
 * Agent Schema
 *
 * Constitutional agent runtime state.
 */
class Agent {
  constructor(data) {
    this.agent_id = data.agent_id;
    this.agent_type = data.agent_type;
    this.capabilities = data.capabilities || [];
    this.health = data.health || AgentHealth.OFFLINE;
    this.current_mission = data.current_mission || null;
    this.mission_history = data.mission_history || [];
    this.runtime_identity = data.runtime_identity || null;
    this.replay_certificate = data.replay_certificate || null;
    this.heartbeat = data.heartbeat || null;
    this.cost = data.cost || { total: 0, currency: 'USD' };
    this.load = data.load || { cpu: 0, memory: 0, queue: 0 };
    this.queue_depth = data.queue_depth || 0;
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.registered_at = data.registered_at || constitutionalTimeAuthority.nowAsMillis();
    this.registered_by = data.registered_by || 'AgentRegistry';
    this.authority = 'AgentRegistry';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // State
    this.status = data.status || 'registered';
    this.last_heartbeat = data.last_heartbeat || null;
    this.last_mission_completed = data.last_mission_completed || null;
    
    // Constitutional hashes
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute agent hash
   */
  _computeAgentHash() {
    const agentData = {
      agent_id: this.agent_id,
      agent_type: this.agent_type,
      capabilities: this.capabilities,
      runtime_identity: this.runtime_identity,
      runtime_id: this.runtime_id,
      registered_at: this.registered_at
    };
    return CanonicalAuthority.hash(agentData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.agent_id,
      input_hash: this.agent_hash,
      output_hash: null,
      authority: this.authority,
      node_id: this.agent_id,
      success: this.health === AgentHealth.HEALTHY,
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
    this.heartbeat = constitutionalTimeAuthority.nowAsMillis();
    this.last_heartbeat = this.heartbeat;
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update health
   */
  updateHealth(health) {
    this.health = health;
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update load
   */
  updateLoad(load) {
    this.load = { ...this.load, ...load };
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Update cost
   */
  updateCost(cost) {
    this.cost = { ...this.cost, ...cost };
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Assign mission
   */
  assignMission(missionId) {
    this.current_mission = missionId;
    this.queue_depth = Math.max(0, this.queue_depth - 1);
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Complete mission
   */
  completeMission(missionId) {
    this.current_mission = null;
    this.mission_history.push({
      mission_id: missionId,
      completed_at: constitutionalTimeAuthority.nowAsMillis()
    });
    this.last_mission_completed = constitutionalTimeAuthority.nowAsMillis();
    this.agent_hash = this._computeAgentHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Serialize agent to canonical bytes
   */
  toCanonical() {
    const ordered = {
      agent_id: this.agent_id,
      agent_type: this.agent_type,
      capabilities: this.capabilities,
      health: this.health,
      current_mission: this.current_mission,
      mission_history: this.mission_history,
      runtime_identity: this.runtime_identity,
      replay_certificate: this.replay_certificate,
      heartbeat: this.heartbeat,
      cost: this.cost,
      load: this.load,
      queue_depth: this.queue_depth,
      runtime_id: this.runtime_id,
      registered_at: this.registered_at,
      registered_by: this.registered_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      last_heartbeat: this.last_heartbeat,
      last_mission_completed: this.last_mission_completed,
      agent_hash: this.agent_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      agent_id: this.agent_id,
      agent_type: this.agent_type,
      capabilities: this.capabilities,
      health: this.health,
      current_mission: this.current_mission,
      mission_history: this.mission_history,
      runtime_identity: this.runtime_identity,
      replay_certificate: this.replay_certificate,
      heartbeat: this.heartbeat,
      cost: this.cost,
      load: this.load,
      queue_depth: this.queue_depth,
      runtime_id: this.runtime_id,
      registered_at: this.registered_at,
      registered_by: this.registered_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      status: this.status,
      last_heartbeat: this.last_heartbeat,
      last_mission_completed: this.last_mission_completed,
      agent_hash: this.agent_hash,
      witness: this.witness
    };
  }
}

/**
 * Agent Registry
 *
 * Constitutional authority for agent runtime state.
 */
class AgentRegistry {
  constructor(eventRepository, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._agents = new Map();
  }
  
  /**
   * Register agent
   * @param {string} agentType - Agent type
   * @param {Array<string>} capabilities - Agent capabilities
   * @param {Object} runtimeIdentity - Agent runtime identity
   * @returns {Agent} Registered agent
   */
  registerAgent(agentType, capabilities, runtimeIdentity = null) {
    const agentId = this._generateAgentId(agentType, capabilities);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const agentData = {
      agent_id: agentId,
      agent_type: agentType,
      capabilities: capabilities,
      health: AgentHealth.HEALTHY,
      runtime_identity: runtimeIdentity,
      runtime_id: runtimeId,
      registered_at: constitutionalTimeAuthority.nowAsMillis(),
      registered_by: 'AgentRegistry',
      status: 'registered'
    };
    
    const agent = new Agent(agentData);
    this._agents.set(agentId, agent);
    
    // Emit AgentRegistered event
    this._emitAgentRegistered(agent);
    
    return agent;
  }
  
  /**
   * Unregister agent
   * @param {string} agentId - Agent ID
   * @returns {Agent} Unregistered agent
   */
  unregisterAgent(agentId) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.status = 'unregistered';
    agent.health = AgentHealth.OFFLINE;
    
    // Emit AgentUnregistered event
    this._emitAgentUnregistered(agent);
    
    this._agents.delete(agentId);
    
    return agent;
  }
  
  /**
   * Get agent
   * @param {string} agentId - Agent ID
   * @returns {Agent} Agent
   */
  getAgent(agentId) {
    return this._agents.get(agentId);
  }
  
  /**
   * Get all agents
   * @returns {Array<Agent>} All agents
   */
  getAllAgents() {
    return Array.from(this._agents.values());
  }
  
  /**
   * Get agents by type
   * @param {string} agentType - Agent type
   * @returns {Array<Agent>} Agents of type
   */
  getAgentsByType(agentType) {
    return this.getAllAgents().filter(a => a.agent_type === agentType);
  }
  
  /**
   * Get agents by capability
   * @param {string} capability - Required capability
   * @returns {Array<Agent>} Agents with capability
   */
  getAgentsByCapability(capability) {
    return this.getAllAgents().filter(a => a.capabilities.includes(capability));
  }
  
  /**
   * Get agents by health
   * @param {string} health - Health status
   * @returns {Array<Agent>} Agents with health
   */
  getAgentsByHealth(health) {
    return this.getAllAgents().filter(a => a.health === health);
  }
  
  /**
   * Get available agents
   * @returns {Array<Agent>} Available agents (healthy, no current mission)
   */
  getAvailableAgents() {
    return this.getAllAgents().filter(a => 
      a.health === AgentHealth.HEALTHY && 
      a.current_mission === null
    );
  }
  
  /**
   * Get agents by capabilities
   * @param {Array<string>} requiredCapabilities - Required capabilities
   * @returns {Array<Agent>} Agents with all required capabilities
   */
  getAgentsByCapabilities(requiredCapabilities) {
    return this.getAllAgents().filter(a => 
      requiredCapabilities.every(cap => a.capabilities.includes(cap))
    );
  }
  
  /**
   * Update agent heartbeat
   * @param {string} agentId - Agent ID
   * @returns {Agent} Updated agent
   */
  updateHeartbeat(agentId) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.updateHeartbeat();
    
    // Emit AgentHeartbeat event
    this._emitAgentHeartbeat(agent);
    
    return agent;
  }
  
  /**
   * Update agent health
   * @param {string} agentId - Agent ID
   * @param {string} health - Health status
   * @returns {Agent} Updated agent
   */
  updateAgentHealth(agentId, health) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.updateHealth(health);
    
    // Emit AgentHealthUpdated event
    this._emitAgentHealthUpdated(agent);
    
    return agent;
  }
  
  /**
   * Update agent load
   * @param {string} agentId - Agent ID
   * @param {Object} load - Load metrics
   * @returns {Agent} Updated agent
   */
  updateAgentLoad(agentId, load) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.updateLoad(load);
    
    // Emit AgentLoadUpdated event
    this._emitAgentLoadUpdated(agent);
    
    return agent;
  }
  
  /**
   * Update agent cost
   * @param {string} agentId - Agent ID
   * @param {Object} cost - Cost metrics
   * @returns {Agent} Updated agent
   */
  updateAgentCost(agentId, cost) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.updateCost(cost);
    
    // Emit AgentCostUpdated event
    this._emitAgentCostUpdated(agent);
    
    return agent;
  }
  
  /**
   * Assign mission to agent
   * @param {string} agentId - Agent ID
   * @param {string} missionId - Mission ID
   * @returns {Agent} Updated agent
   */
  assignMissionToAgent(agentId, missionId) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.assignMission(missionId);
    
    // Emit AgentMissionAssigned event
    this._emitAgentMissionAssigned(agent, missionId);
    
    return agent;
  }
  
  /**
   * Complete mission for agent
   * @param {string} agentId - Agent ID
   * @param {string} missionId - Mission ID
   * @returns {Agent} Updated agent
   */
  completeMissionForAgent(agentId, missionId) {
    const agent = this._agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    agent.completeMission(missionId);
    
    // Emit AgentMissionCompleted event
    this._emitAgentMissionCompleted(agent, missionId);
    
    return agent;
  }
  
  /**
   * Get agent count
   * @returns {number} Agent count
   */
  getAgentCount() {
    return this._agents.size;
  }
  
  /**
   * Check if agent exists
   * @param {string} agentId - Agent ID
   * @returns {boolean} Agent exists
   */
  hasAgent(agentId) {
    return this._agents.has(agentId);
  }
  
  /**
   * Clear all agents
   */
  clearAllAgents() {
    this._agents.clear();
  }
  
  /**
   * Verify agent determinism
   * @param {Agent} agent1 - First agent
   * @param {Agent} agent2 - Second agent
   * @returns {boolean} Whether agents are equivalent
   */
  verifyAgentEquivalence(agent1, agent2) {
    return agent1.agent_hash === agent2.agent_hash;
  }
  
  /**
   * Replay agent from event log
   * @param {string} agentId - Agent ID
   * @returns {Agent} Replayed agent
   */
  async replayAgent(agentId) {
    // Get agent events from event repository
    const events = await this._eventRepository.getEvents(agentId);
    
    // Reconstruct agent from events
    let agent = null;
    for (const event of events) {
      if (event.event_type === 'AgentRegistered') {
        agent = new Agent(event.payload);
      } else if (event.event_type === 'AgentHeartbeat') {
        agent.updateHeartbeat();
      } else if (event.event_type === 'AgentHealthUpdated') {
        agent.updateHealth(event.payload.health);
      } else if (event.event_type === 'AgentLoadUpdated') {
        agent.updateLoad(event.payload.load);
      } else if (event.event_type === 'AgentCostUpdated') {
        agent.updateCost(event.payload.cost);
      } else if (event.event_type === 'AgentMissionAssigned') {
        agent.assignMission(event.payload.mission_id);
      } else if (event.event_type === 'AgentMissionCompleted') {
        agent.completeMission(event.payload.mission_id);
      } else if (event.event_type === 'AgentUnregistered') {
        agent.status = 'unregistered';
        agent.health = AgentHealth.OFFLINE;
      }
    }
    
    return agent;
  }
  
  /**
   * Generate agent ID
   */
  _generateAgentId(agentType, capabilities) {
    return identityAuthority.generateId('agent', {
      agent_type: agentType,
      capabilities_hash: CanonicalAuthority.hash(capabilities),
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
    return `agent_registry_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit AgentRegistered event
   */
  _emitAgentRegistered(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentRegistered', agent.agent_id),
      event_type: 'AgentRegistered',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: agent.toJSON(),
      causation_id: null,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentUnregistered event
   */
  _emitAgentUnregistered(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentUnregistered', agent.agent_id),
      event_type: 'AgentUnregistered',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        unregistered_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: agent.agent_id,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentHeartbeat event
   */
  _emitAgentHeartbeat(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentHeartbeat', agent.agent_id),
      event_type: 'AgentHeartbeat',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        heartbeat: agent.heartbeat
      },
      causation_id: agent.agent_id,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentHealthUpdated event
   */
  _emitAgentHealthUpdated(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentHealthUpdated', agent.agent_id),
      event_type: 'AgentHealthUpdated',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        health: agent.health
      },
      causation_id: agent.agent_id,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentLoadUpdated event
   */
  _emitAgentLoadUpdated(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentLoadUpdated', agent.agent_id),
      event_type: 'AgentLoadUpdated',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        load: agent.load
      },
      causation_id: agent.agent_id,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentCostUpdated event
   */
  _emitAgentCostUpdated(agent) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentCostUpdated', agent.agent_id),
      event_type: 'AgentCostUpdated',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 6,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        cost: agent.cost
      },
      causation_id: agent.agent_id,
      correlation_id: agent.agent_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentMissionAssigned event
   */
  _emitAgentMissionAssigned(agent, missionId) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentMissionAssigned', agent.agent_id),
      event_type: 'AgentMissionAssigned',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 7,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        mission_id: missionId,
        assigned_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: agent.agent_id,
      correlation_id: missionId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit AgentMissionCompleted event
   */
  _emitAgentMissionCompleted(agent, missionId) {
    const event = {
      event_id: identityAuthority.generateEventId('AgentMissionCompleted', agent.agent_id),
      event_type: 'AgentMissionCompleted',
      aggregate_id: agent.agent_id,
      aggregate_type: 'Agent',
      aggregate_version: 1,
      sequence: 8,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'AgentRegistry',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        agent_id: agent.agent_id,
        mission_id: missionId,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: agent.agent_id,
      correlation_id: missionId
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let agentRegistryV2 = null;

function getAgentRegistryV2(eventRepository, runtimeIdentity = null) {
  if (!agentRegistryV2) {
    agentRegistryV2 = new AgentRegistry(eventRepository, runtimeIdentity);
  }
  return agentRegistryV2;
}

module.exports = {
  AgentRegistry,
  Agent,
  AgentTypes,
  AgentHealth,
  AgentCapabilities,
  agentRegistryV2,
  getAgentRegistryV2
};
