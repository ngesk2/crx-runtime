/**
 * Execution Plan Authority
 * 
 * Ω.95.2 — Execution Plan Authority
 * 
 * Immutable plans, canonical serialized, replayable, witness signed, content addressed.
 * 
 * Structure:
 * {
 *   plan_id,
 *   mission_id,
 *   version,
 *   created_at,
 *   inputs: [],
 *   nodes: [],
 *   edges: [],
 *   rollback_nodes: [],
 *   expected_artifacts: [],
 *   policies: [],
 *   canonical_hash,
 *   witness_hash
 * }
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

class ExecutionPlanAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._plans = new Map(); // plan_id → plan
    this._planVersions = new Map(); // mission_id → [plan_ids]
  }

  /**
   * Initialize execution plan authority
   */
  async initialize() {
    console.log('[ExecutionPlanAuthority] Initializing execution plan authority');

    // Load existing plans
    await this._loadPlans();

    console.log('[ExecutionPlanAuthority] Execution plan authority initialized');
  }

  /**
   * Load plans
   */
  async _loadPlans() {
    try {
      const result = await this._postgres.query(`
        SELECT plan_id, plan_data
        FROM execution_plans
      `);

      for (const row of result.rows) {
        this._plans.set(row.plan_id, row.plan_data);
        
        // Track versions by mission
        const missionId = row.plan_data.mission_id;
        if (!this._planVersions.has(missionId)) {
          this._planVersions.set(missionId, []);
        }
        this._planVersions.get(missionId).push(row.plan_id);
      }

      console.log(`[ExecutionPlanAuthority] Loaded ${this._plans.size} execution plans`);
    } catch (error) {
      console.error('[ExecutionPlanAuthority] Failed to load plans:', error.message);
    }
  }

  /**
   * Register execution plan
   * 
   * @param {Object} executionPlan - Execution plan
   * @returns {Object} Registered plan
   */
  async registerPlan(executionPlan) {
    console.log(`[ExecutionPlanAuthority] Registering execution plan ${executionPlan.plan_id}`);

    // Canonical serialize
    const canonicalBytes = this._canonicalSerialize(executionPlan);
    executionPlan.canonical_bytes = canonicalBytes;
    executionPlan.canonical_hash = CanonicalAuthority.hash(canonicalBytes);

    // Witness sign (placeholder - would use actual witness authority)
    executionPlan.witness_hash = this._witnessSign(executionPlan);

    // Content address
    executionPlan.content_address = this._contentAddress(executionPlan);

    // Store plan
    this._plans.set(executionPlan.plan_id, executionPlan);
    
    // Track version
    const missionId = executionPlan.mission_id;
    if (!this._planVersions.has(missionId)) {
      this._planVersions.set(missionId, []);
    }
    this._planVersions.get(missionId).push(executionPlan.plan_id);

    // Persist
    await this._persistPlan(executionPlan.plan_id, executionPlan);

    console.log(`[ExecutionPlanAuthority] Registered execution plan ${executionPlan.plan_id}`);
    return executionPlan;
  }

  /**
   * Canonical serialize execution plan
   */
  _canonicalSerialize(executionPlan) {
    const canonical = {
      plan_id: executionPlan.plan_id,
      mission_id: executionPlan.mission_id,
      version: executionPlan.version,
      created_at: executionPlan.created_at,
      inputs: executionPlan.inputs,
      nodes: executionPlan.nodes.map(node => ({
        node_id: node.node_id,
        node_type: node.node_type,
        authority: node.authority,
        input_artifacts: node.input_artifacts.sort(),
        output_artifacts: node.output_artifacts.sort(),
        dependencies: node.dependencies.sort(),
      })),
      edges: executionPlan.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
      })),
      rollback_nodes: executionPlan.rollback_nodes.map(node => ({
        node_id: node.node_id,
        node_type: node.node_type,
        authority: node.authority,
        input_artifacts: node.input_artifacts.sort(),
        output_artifacts: node.output_artifacts.sort(),
        dependencies: node.dependencies.sort(),
      })),
      expected_artifacts: executionPlan.expected_artifacts.sort(),
      artifact_dependencies: executionPlan.artifact_dependencies,
      execution_order: executionPlan.execution_order,
      policies: executionPlan.policies,
    };

    return CanonicalBytes.encode(canonical);
  }

  /**
   * Witness sign execution plan
   */
  _witnessSign(executionPlan) {
    // Placeholder: Would use actual witness authority to sign
    return CanonicalAuthority.hash({
      plan_id: executionPlan.plan_id,
      canonical_hash: executionPlan.canonical_hash,
      timestamp: constitutionalTimeAuthority.now(),
    });
  }

  /**
   * Content address execution plan
   */
  _contentAddress(executionPlan) {
    return `ipfs://${executionPlan.canonical_hash}`;
  }

  /**
   * Get execution plan
   * 
   * @param {string} planId - Plan identifier
   * @returns {Object} Execution plan
   */
  getPlan(planId) {
    return this._plans.get(planId);
  }

  /**
   * Get execution plan by mission
   * 
   * @param {string} missionId - Mission identifier
   * @returns {Array} Execution plans for mission
   */
  getPlansByMission(missionId) {
    const planIds = this._planVersions.get(missionId) || [];
    return planIds.map(planId => this._plans.get(planId)).filter(Boolean);
  }

  /**
   * Get latest execution plan for mission
   * 
   * @param {string} missionId - Mission identifier
   * @returns {Object} Latest execution plan
   */
  getLatestPlan(missionId) {
    const planIds = this._planVersions.get(missionId) || [];
    if (planIds.length === 0) {
      return null;
    }
    const latestPlanId = planIds[planIds.length - 1];
    return this._plans.get(latestPlanId);
  }

  /**
   * Verify execution plan integrity
   * 
   * @param {Object} executionPlan - Execution plan
   * @returns {Object} Verification result
   */
  verifyPlanIntegrity(executionPlan) {
    const errors = [];

    // Verify canonical hash
    const canonicalBytes = this._canonicalSerialize(executionPlan);
    const computedHash = CanonicalAuthority.hash(canonicalBytes);
    if (computedHash !== executionPlan.canonical_hash) {
      errors.push('Canonical hash mismatch');
    }

    // Verify witness hash
    const computedWitnessHash = this._witnessSign(executionPlan);
    if (computedWitnessHash !== executionPlan.witness_hash) {
      errors.push('Witness hash mismatch');
    }

    // Verify content address
    const computedContentAddress = this._contentAddress(executionPlan);
    if (computedContentAddress !== executionPlan.content_address) {
      errors.push('Content address mismatch');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Replay execution plan
   * 
   * @param {string} planId - Plan identifier
   * @returns {Object} Replay result
   */
  async replayPlan(planId) {
    console.log(`[ExecutionPlanAuthority] Replaying execution plan ${planId}`);

    const executionPlan = this._plans.get(planId);
    if (!executionPlan) {
      throw new Error(`Execution plan not found: ${planId}`);
    }

    // Verify integrity
    const integrity = this.verifyPlanIntegrity(executionPlan);
    if (!integrity.valid) {
      throw new Error(`Execution plan integrity verification failed: ${integrity.errors.join(', ')}`);
    }

    // Replay would be handled by Constitutional Runtime
    // This authority only provides the immutable plan

    return {
      plan_id: planId,
      integrity: integrity,
      replayable: true,
    };
  }

  /**
   * Persist execution plan
   */
  async _persistPlan(planId, executionPlan) {
    try {
      await this._postgres.query(`
        INSERT INTO execution_plans (plan_id, plan_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (plan_id) DO UPDATE SET
          plan_data = $2,
          updated_at = NOW()
      `, [planId, JSON.stringify(executionPlan)]);
    } catch (error) {
      console.error(`[ExecutionPlanAuthority] Failed to persist plan ${planId}:`, error.message);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total_plans: this._plans.size,
      total_missions: this._planVersions.size,
      by_mission: Object.fromEntries(this._planVersions),
    };
  }
}

module.exports = { ExecutionPlanAuthority };
