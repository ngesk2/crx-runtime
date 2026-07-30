/**
 * Tenant Registry Authority
 * 
 * P003: Central authority for all TenantOS tenants.
 * 
 * Every tenant registers here. PING consumes this registry.
 * No business logic lives in this authority.
 * 
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - Deterministic behavior
 * - Tenant isolation enforced
 */

const crypto = require('crypto');
const { validateRegistry, computeCanonicalHash } = require('./constitutional_validation');

class TenantRegistry {
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
   * Execute RegisterTenantCommand
   * 
   * @param {Object} command
   * @param {string} command.tenantId - Tenant identifier (URI: tenant://{id})
   * @param {string} command.name - Display name
   * @param {string[]} [command.domains] - Domains
   * @param {string} [command.healthEndpoint] - Health check URL
   * @param {string} [command.metricsEndpoint] - Metrics URL
   * @param {string} [command.logsEndpoint] - Logs URL
   * @param {string} [command.tracesEndpoint] - Traces URL
   * @param {string} [command.eventsEndpoint] - Events URL
   * @param {string[]} [command.capabilities] - Tenant capabilities
   * @param {Object} [command.metadata] - Additional metadata
   * @returns {Object} Registered tenant
   */
  async executeRegisterTenant(command) {
    const { tenantId, name, domains = [], healthEndpoint, metricsEndpoint,
      logsEndpoint, tracesEndpoint, eventsEndpoint, capabilities = [], metadata = {} } = command;

    // Input validation
    if (!tenantId) throw new Error('tenantId is required');
    if (!name) throw new Error('name is required');

    const result = await this._storage.query(
      `INSERT INTO tenant_registry 
       (tenant_id, name, domains, health_endpoint, metrics_endpoint, 
        logs_endpoint, traces_endpoint, events_endpoint, capabilities, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (tenant_id) DO UPDATE SET
        name = EXCLUDED.name,
        domains = EXCLUDED.domains,
        health_endpoint = EXCLUDED.health_endpoint,
        metrics_endpoint = EXCLUDED.metrics_endpoint,
        logs_endpoint = EXCLUDED.logs_endpoint,
        traces_endpoint = EXCLUDED.traces_endpoint,
        events_endpoint = EXCLUDED.events_endpoint,
        capabilities = EXCLUDED.capabilities,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
       RETURNING *`,
      [
        tenantId, name, domains,
        healthEndpoint || null, metricsEndpoint || null,
        logsEndpoint || null, tracesEndpoint || null,
        eventsEndpoint || null, capabilities,
        JSON.stringify(metadata),
      ]
    );

    return result.rows[0];
  }

  /**
   * Execute ResolveTenantQuery
   * 
   * @param {string} tenantId
   * @returns {Object|null} Tenant
   */
  async executeResolveTenant(tenantId) {
    const result = await this._storage.query(
      'SELECT * FROM tenant_registry WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Execute ListTenantsQuery
   * 
   * @param {Object} params
   * @param {string} [params.status] - Filter by status
   * @returns {Object[]} Tenants
   */
  async executeListTenants({ status } = {}) {
    let query = 'SELECT * FROM tenant_registry';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY registered_at ASC';

    const result = await this._storage.query(query, params);
    return result.rows;
  }

  /**
   * Execute UpdateTenantCommand
   * 
   * @param {string} tenantId
   * @param {Object} updates
   * @returns {Object} Updated tenant
   */
  async executeUpdateTenant(tenantId, updates) {
    const canonicalId = this.canonicalizeId(tenantId);
    const fields = [];
    const params = [canonicalId];
    let paramIndex = 2;

    const allowedFields = [
      'name', 'domains', 'health_endpoint', 'metrics_endpoint',
      'logs_endpoint', 'traces_endpoint', 'events_endpoint',
      'status', 'version', 'git_sha', 'deployment_id', 'environment',
      'capabilities', 'metadata',
    ];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        fields.push(`${dbField} = $${paramIndex++}`);
        params.push(dbField === 'metadata' ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return this.executeResolveTenant(tenantId);

    fields.push('updated_at = NOW()');

    const result = await this._storage.query(
      `UPDATE tenant_registry SET ${fields.join(', ')} 
       WHERE tenant_id = $1 RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * Execute RecordTenantHeartbeatCommand
   * 
   * @param {string} tenantId
   */
  async executeRecordHeartbeat(tenantId) {
    const canonicalId = this.canonicalizeId(tenantId);
    await this._postgres.query(
      'UPDATE tenant_registry SET last_heartbeat = NOW() WHERE tenant_id = $1',
      [canonicalId]
    );
  }

  /**
   * Execute RemoveTenantCommand
   * 
   * @param {string} tenantId
   */
  async executeRemoveTenant(tenantId) {
    const canonicalId = this.canonicalizeId(tenantId);
    await this._postgres.query(
      'DELETE FROM tenant_registry WHERE tenant_id = $1',
      [canonicalId]
    );
  }

  /**
   * Canonicalize tenant ID to URI format
   * 
   * @param {string} tenantId
   * @returns {string} Canonical URI
   */
  canonicalizeId(tenantId) {
    if (tenantId.startsWith('tenant://')) {
      return tenantId;
    }
    return `tenant://${tenantId}`;
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
      authority_id: 'tenant-registry',
      authority_name: 'TenantRegistry',
      version: this._authorityVersion,
      owner: 'ping',
      consumes: ['tenantId', 'name', 'domains', 'capabilities'],
      produces: ['tenant'],
      guarantees: ['single_source_of_truth', 'tenant_isolated', 'deterministic'],
      invariants: [
        'tenant_id is unique across all tenants (URI format: tenant://{id})',
        'tenant A cannot read tenant B data',
        'register is idempotent (upsert)',
        'tenant status transitions are deterministic',
      ],
      consumers: ['canonicalEventEnvelope', 'deploymentRegistry', 'runtimeRegistry', 'gateway'],
      requires: ['storage'],
      failure_modes: ['invalid_input', 'postgres_unavailable'],
      rollback: 'none',
      determinism: 'deterministic',
      uniqueness: [['tenant_id']],
      tenant_isolation: true,
      dependencies: this._dependencies,
      schema_version: '1.0.0',
      event_version: '1.0.0',
      authority_version: this._authorityVersion,
    };

    // Compute contract hash for drift detection
    contract.contract_hash = computeCanonicalHash(contract);

    return contract;
  }
}

module.exports = { TenantRegistry };
