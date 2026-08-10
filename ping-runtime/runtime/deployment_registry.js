/**
 * Deployment Registry Authority
 * 
 * P004: Central authority for all TenantOS deployments.
 * 
 * Every deployment registers here. PING consumes this registry.
 * No business logic lives in this authority.
 * 
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - Deterministic behavior
 * - Tenant isolation enforced
 * - Canonical identity: deployment://{tenant}/{version}
 */

const crypto = require('crypto');
const { computeCanonicalHash } = require('../authorities/constitutional_validation');

class DeploymentRegistry {
  constructor(storage) {
    this._storage = storage;
    this._dependencies = ['storage'];
    this._authorityVersion = '1.0.0';
  }

  /**
   * Declare dependencies for computed startup ordering
   * 
   * @returns {string[]} Required service names
   */
  get dependencies() {
    return this._dependencies;
  }

  /**
   * Canonicalize deployment ID to URI format
   * 
   * @param {string} tenantId
   * @param {string} version
   * @returns {string} Canonical URI
   */
  canonicalizeId(tenantId, version) {
    const tenant = tenantId.startsWith('tenant://') ? tenantId.replace('tenant://', '') : tenantId;
    return `deployment://${tenant}/${version}`;
  }

  /**
   * Execute RegisterDeploymentCommand
   * 
   * @param {Object} command
   * @param {string} command.tenantId - Tenant identifier
   * @param {string} command.version - Version string
   * @param {string} command.gitSha - Git commit SHA
   * @param {string} [command.containerImage] - Container image
   * @param {string} [command.oracleRegion] - Oracle region
   * @param {string} [command.environment] - Environment
   * @param {Object} [command.metadata] - Additional metadata
   * @returns {Object} Registered deployment
   */
  async executeRegisterDeployment(command) {
    const { tenantId, version, gitSha, containerImage, oracleRegion,
      environment = 'production', metadata = {} } = command;

    // Input validation
    if (!tenantId) throw new Error('tenantId is required');
    if (!version) throw new Error('version is required');
    if (!gitSha) throw new Error('gitSha is required');

    const deploymentId = this.canonicalizeId(tenantId, version);

    const result = await this._storage.query(
      `INSERT INTO deployment_registry 
       (deployment_id, tenant_id, version, git_sha, build_timestamp,
        container_image, oracle_region, environment, status, health)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'deploying', 'unknown')
       ON CONFLICT (tenant_id, version) DO UPDATE SET
        git_sha = EXCLUDED.git_sha,
        container_image = EXCLUDED.container_image,
        oracle_region = EXCLUDED.oracle_region,
        environment = EXCLUDED.environment,
        updated_at = NOW()
       RETURNING *`,
      [
        deploymentId, tenantId, version, gitSha,
        containerImage || null, oracleRegion || null, environment,
      ]
    );

    return result.rows[0];
  }

  /**
   * Execute ResolveDeploymentQuery
   * 
   * @param {string} deploymentId - Canonical URI or legacy ID
   * @returns {Object|null} Deployment
   */
  async executeResolveDeployment(deploymentId) {
    const result = await this._storage.query(
      'SELECT * FROM deployment_registry WHERE deployment_id = $1',
      [deploymentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Execute ListDeploymentsQuery
   * 
   * @param {string} tenantId
   * @param {Object} params
   * @param {number} [params.limit] - Max results
   * @param {string} [params.status] - Filter by status
   * @returns {Object[]} Deployments
   */
  async executeListDeployments(tenantId, { limit = 50, status } = {}) {
    let query = 'SELECT * FROM deployment_registry WHERE tenant_id = $1';
    const params = [tenantId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY deployed_at DESC';
    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this._storage.query(query, params);
    return result.rows;
  }

  /**
   * Execute TransitionDeploymentStatusCommand
   * 
   * @param {string} deploymentId
   * @param {Object} updates
   * @returns {Object} Updated deployment
   */
  async executeTransitionStatus(deploymentId, updates) {
    const fields = [];
    const params = [deploymentId];
    let paramIndex = 2;

    const allowedFields = [
      'status', 'health', 'active_slot', 'blue_version', 'green_version',
      'rollback_target', 'completed_at', 'rolled_back_at', 'metadata',
    ];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        fields.push(`${dbField} = $${paramIndex++}`);
        params.push(dbField === 'metadata' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return this.executeResolveDeployment(deploymentId);

    const result = await this._storage.query(
      `UPDATE deployment_registry SET ${fields.join(', ')} 
       WHERE deployment_id = $1 RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * Execute CompleteDeploymentCommand
   * 
   * @param {string} deploymentId
   * @param {string} health
   * @returns {Object} Updated deployment
   */
  async executeCompleteDeployment(deploymentId, health = 'healthy') {
    return this.executeTransitionStatus(deploymentId, {
      status: 'running',
      health,
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Execute FailDeploymentCommand
   * 
   * @param {string} deploymentId
   * @param {string} error
   * @returns {Object} Updated deployment
   */
  async executeFailDeployment(deploymentId, error) {
    return this.executeTransitionStatus(deploymentId, {
      status: 'failed',
      metadata: { error },
    });
  }

  /**
   * Execute RollbackDeploymentCommand
   * 
   * @param {string} deploymentId
   * @returns {Object} Updated deployment
   */
  async executeRollbackDeployment(deploymentId) {
    return this.executeTransitionStatus(deploymentId, {
      status: 'rolled_back',
      rolled_back_at: new Date().toISOString(),
    });
  }

  /**
   * Execute ResolveActiveDeploymentQuery
   * 
   * @param {string} tenantId
   * @returns {Object|null} Active deployment
   */
  async executeResolveActiveDeployment(tenantId) {
    const result = await this._storage.query(
      `SELECT * FROM deployment_registry 
       WHERE tenant_id = $1 AND status = 'running'
       ORDER BY deployed_at DESC LIMIT 1`,
      [tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Health check
   */
  async health() {
    try {
      await this._postgres.query('SELECT 1');
      return { healthy: true, storage: { healthy: true } };
    } catch (error) {
      return { healthy: false, storage: { healthy: false, error: error.message } };
    }
  }

  /**
   * Publish contract with hash
   */
  publishContract() {
    const contract = {
      authority_id: 'deployment-registry',
      authority_name: 'DeploymentRegistry',
      version: this._authorityVersion,
      owner: 'ping',
      consumes: ['tenantId', 'version', 'gitSha', 'containerImage'],
      produces: ['deployment'],
      guarantees: ['single_source_of_truth', 'tenant_isolated', 'deterministic'],
      invariants: [
        'deployment_id is canonical URI: deployment://{tenant}/{version}',
        'tenant A cannot read tenant B deployments',
        'register is idempotent (upsert)',
        'status transitions are deterministic (deploying → running → failed/rolled_back)',
        'rollback sets status to rolled_back',
      ],
      consumers: ['tenantRegistry', 'runtimeRegistry', 'gateway'],
      requires: ['storage'],
      failure_modes: ['invalid_input', 'postgres_unavailable'],
      rollback: 'supported',
      determinism: 'deterministic',
      uniqueness: [['tenant_id', 'version']],
      tenant_isolation: true,
      dependencies: this._dependencies,
      schema_version: '1.0.0',
      event_version: '1.0.0',
      authority_version: this._authorityVersion,
    };

    contract.contract_hash = computeCanonicalHash(contract);

    return contract;
  }
}

module.exports = { DeploymentRegistry };
