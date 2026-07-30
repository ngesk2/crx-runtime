/**
 * Runtime Registry Authority
 * 
 * P005: Central authority for all TenantOS runtime components.
 * 
 * Every runtime component registers here. PING consumes this registry.
 * No business logic lives in this authority.
 * 
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - Deterministic behavior
 * - Tenant isolation enforced
 * - Canonical identity: runtime://{tenant}/{type}/{name}
 * - Observability fields included from registration
 */

const crypto = require('crypto');
const { computeCanonicalHash } = require('./constitutional_validation');

class RuntimeRegistry {
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
   * Canonicalize runtime ID to URI format
   * 
   * @param {string} tenantId
   * @param {string} componentType
   * @param {string} componentName
   * @returns {string} Canonical URI
   */
  canonicalizeId(tenantId, componentType, componentName) {
    const tenant = tenantId.startsWith('tenant://') ? tenantId.replace('tenant://', '') : tenantId;
    return `runtime://${tenant}/${componentType}/${componentName}`;
  }

  /**
   * Execute RegisterComponentCommand
   * 
   * @param {Object} command
   * @param {string} command.tenantId - Tenant identifier
   * @param {string} command.componentType - Type (e.g., "worker", "api", "database")
   * @param {string} command.componentName - Name (e.g., "estimate-worker", "hpp-api")
   * @param {string} [command.version] - Version string
   * @param {string} [command.buildSha] - Build commit SHA
   * @param {string} [command.compilerSha] - Compiler commit SHA
   * @param {string} [command.contractHash] - Contract hash for drift detection
   * @param {string} [command.deploymentId] - Associated deployment ID
   * @param {string} [command.nodeId] - Node identifier (for distributed systems)
   * @param {string} [command.healthEndpoint] - Health check URL
   * @param {string} [command.metricsEndpoint] - Metrics URL
   * @param {Object} [command.metadata] - Additional metadata
   * @returns {Object} Registered component
   */
  async executeRegisterComponent(command) {
    const { tenantId, componentType, componentName, version, buildSha,
      compilerSha, contractHash, deploymentId, nodeId,
      healthEndpoint, metricsEndpoint,
      authorityVersion, eventVersion, schemaVersion, startedAt,
      metadata = {} } = command;

    // Input validation
    if (!tenantId) throw new Error('tenantId is required');
    if (!componentType) throw new Error('componentType is required');
    if (!componentName) throw new Error('componentName is required');

    const runtimeId = this.canonicalizeId(tenantId, componentType, componentName);

    const result = await this._storage.query(
      `INSERT INTO runtime_registry 
       (runtime_id, tenant_id, component_type, component_name, version,
        build_sha, compiler_sha, contract_hash, deployment_id, node_id,
        health_endpoint, metrics_endpoint, status, health, authority_version,
        event_version, schema_version, started_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'registered', 'unknown', $13, $14, $15, NOW(), $16)
       ON CONFLICT (tenant_id, component_type, component_name) DO UPDATE SET
        version = EXCLUDED.version,
        build_sha = EXCLUDED.build_sha,
        compiler_sha = EXCLUDED.compiler_sha,
        contract_hash = EXCLUDED.contract_hash,
        deployment_id = EXCLUDED.deployment_id,
        node_id = EXCLUDED.node_id,
        health_endpoint = EXCLUDED.health_endpoint,
        metrics_endpoint = EXCLUDED.metrics_endpoint,
        authority_version = EXCLUDED.authority_version,
        event_version = EXCLUDED.event_version,
        schema_version = EXCLUDED.schema_version,
        started_at = EXCLUDED.started_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
       RETURNING *`,
      [
        runtimeId, tenantId, componentType, componentName,
        version || null, buildSha || null, compilerSha || null,
        contractHash || null, deploymentId || null, nodeId || null,
        healthEndpoint || null, metricsEndpoint || null,
        authorityVersion || this._authorityVersion, eventVersion || '1.0.0', schemaVersion || '1.0.0',
        JSON.stringify(metadata),
      ]
    );

    return result.rows[0];
  }

  /**
   * Execute ResolveComponentQuery
   * 
   * @param {string} runtimeId - Canonical URI or legacy ID
   * @returns {Object|null} Component
   */
  async executeResolveComponent(runtimeId) {
    const result = await this._storage.query(
      'SELECT * FROM runtime_registry WHERE runtime_id = $1',
      [runtimeId]
    );
    return result.rows[0] || null;
  }

  /**
   * Execute ListComponentsQuery
   * 
   * @param {string} tenantId
   * @param {Object} params
   * @param {string} [params.componentType] - Filter by type
   * @param {string} [params.status] - Filter by status
   * @returns {Object[]} Components
   */
  async executeListComponents(tenantId, { componentType, status } = {}) {
    let query = 'SELECT * FROM runtime_registry WHERE tenant_id = $1';
    const params = [tenantId];

    if (componentType) {
      query += ` AND component_type = $${params.length + 1}`;
      params.push(componentType);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY component_type, component_name ASC';

    const result = await this._storage.query(query, params);
    return result.rows;
  }

  /**
   * Execute TransitionComponentStatusCommand
   * 
   * @param {string} tenantId
   * @param {string} componentType
   * @param {string} componentName
   * @param {Object} updates
   * @returns {Object} Updated component
   */
  async executeTransitionStatus(tenantId, componentType, componentName, updates) {
    const fields = [];
    const params = [tenantId, componentType, componentName];
    let paramIndex = 4;

    const allowedFields = [
      'status', 'health', 'health_score', 'version', 'build_sha', 'compiler_sha',
      'contract_hash', 'deployment_id', 'node_id',
      'authority_version', 'event_version', 'schema_version',
      'uptime_seconds', 'memory_usage_bytes', 'cpu_usage_percent',
      'latency_ms', 'error_rate', 'queue_depth', 'metadata',
    ];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        fields.push(`${dbField} = $${paramIndex++}`);
        params.push(dbField === 'metadata' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) {
      return this.executeResolveComponent(
        this.canonicalizeId(tenantId, componentType, componentName)
      );
    }

    fields.push('updated_at = NOW()');

    const result = await this._storage.query(
      `UPDATE runtime_registry SET ${fields.join(', ')} 
       WHERE tenant_id = $1 AND component_type = $2 AND component_name = $3 
       RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * Execute RecordHeartbeatCommand
   * 
   * @param {string} tenantId
   * @param {string} componentType
   * @param {string} componentName
   * @param {Object} metrics - Optional metrics to update
   */
  async executeRecordHeartbeat(tenantId, componentType, componentName, metrics = {}) {
    const updates = {
      status: 'running',
      health: 'healthy',
      ...metrics,
    };

    await this.executeTransitionStatus(tenantId, componentType, componentName, updates);
    await this._storage.query(
      `UPDATE runtime_registry 
       SET last_heartbeat = NOW() 
       WHERE tenant_id = $1 AND component_type = $2 AND component_name = $3`,
      [tenantId, componentType, componentName]
    );
  }

  /**
   * Execute RemoveComponentCommand
   * 
   * @param {string} tenantId
   * @param {string} componentType
   * @param {string} componentName
   */
  async executeRemoveComponent(tenantId, componentType, componentName) {
    await this._storage.query(
      `DELETE FROM runtime_registry 
       WHERE tenant_id = $1 AND component_type = $2 AND component_name = $3`,
      [tenantId, componentType, componentName]
    );
  }

  /**
   * Execute DetectUnhealthyComponentsQuery
   * 
   * @param {string} tenantId
   * @param {number} thresholdMs - Heartbeat threshold in milliseconds
   * @returns {Object[]} Unhealthy components
   */
  async executeDetectUnhealthy(tenantId, thresholdMs = 60000) {
    const result = await this._storage.query(
      `SELECT * FROM runtime_registry 
       WHERE tenant_id = $1 
       AND (health != 'healthy' OR last_heartbeat < NOW() - INTERVAL '${thresholdMs} milliseconds')
       ORDER BY last_heartbeat ASC`,
      [tenantId]
    );
    return result.rows;
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
      authority_id: 'runtime-registry',
      authority_name: 'RuntimeRegistry',
      version: this._authorityVersion,
      owner: 'ping',
      consumes: ['tenantId', 'componentType', 'componentName', 'version'],
      produces: ['component'],
      guarantees: ['single_source_of_truth', 'tenant_isolated', 'deterministic'],
      invariants: [
        'component is unique by (tenant_id, component_type, component_name)',
        'runtime_id is canonical URI: runtime://{tenant}/{type}/{name}',
        'tenant A cannot read tenant B components',
        'register is idempotent (upsert)',
        'health status transitions are deterministic',
        'unhealthy detection uses configurable threshold',
        'contract_hash enables drift detection across fleet',
      ],
      consumers: ['tenantRegistry', 'deploymentRegistry', 'gateway'],
      requires: ['storage'],
      failure_modes: ['invalid_input', 'postgres_unavailable'],
      rollback: 'none',
      determinism: 'deterministic',
      uniqueness: [['tenant_id', 'component_type', 'component_name']],
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

module.exports = { RuntimeRegistry };
