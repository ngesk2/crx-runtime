/**
 * Constitutional Reflection Authority
 * 
 * Ω.97.8 — Reflection Consumes Only Immutable Artifacts
 * 
 * Reflection should never touch runtime.
 * 
 * Instead:
 * Authorities → Descriptors → Reflection
 * 
 * Reflection shouldn't care if an authority is even running.
 * It should inspect constitutional metadata only.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalReflectionAuthority {
  constructor(postgresPool, authorityRegistry, schemaAuthority, artifactTypeRegistry, policyCompiler, capabilityGraph, artifactAuthority) {
    this._postgres = postgresPool;
    this._authorityRegistry = authorityRegistry;
    this._schemaAuthority = schemaAuthority;
    this._artifactTypeRegistry = artifactTypeRegistry;
    this._policyCompiler = policyCompiler;
    this._capabilityGraph = capabilityGraph;
    this._artifactAuthority = artifactAuthority;
  }

  /**
   * Initialize reflection authority
   */
  async initialize() {
    console.log('[ReflectionAuthority] Initializing constitutional reflection authority');

    console.log('[ReflectionAuthority] Constitutional reflection authority initialized');
  }

  /**
   * List all authorities
   * 
   * @returns {Object} Authority list
   */
  listAuthorities() {
    console.log('[ReflectionAuthority] Listing authorities');

    const descriptors = this._authorityRegistry.getAllDescriptors();

    return {
      reflection_type: 'authorities',
      reflected_at: constitutionalTimeAuthority.now(),
      total_authorities: descriptors.length,
      authorities: descriptors.map(d => ({
        authority_id: d.authority_id,
        name: d.name,
        version: d.version,
        capabilities: d.capabilities,
        produced_artifacts: d.produced_artifacts,
        dependencies: d.dependencies,
      })),
    };
  }

  /**
   * List all policies
   * 
   * @returns {Object} Policy list
   */
  listPolicies() {
    console.log('[ReflectionAuthority] Listing policies');

    const compiledPolicies = this._policyCompiler.getAllCompiledPolicies();

    return {
      reflection_type: 'policies',
      reflected_at: constitutionalTimeAuthority.now(),
      total_policies: compiledPolicies.length,
      policies: compiledPolicies.map(p => ({
        policy_id: p.policy_id,
        policy_type: p.policy_type,
        version: p.version,
        description: p.description,
        compiled_at: p.compiled_at,
        executable: p.executable,
      })),
    };
  }

  /**
   * List all schemas
   * 
   * @returns {Object} Schema list
   */
  listSchemas() {
    console.log('[ReflectionAuthority] Listing schemas');

    const schemas = this._schemaAuthority.getAllSchemas();

    return {
      reflection_type: 'schemas',
      reflected_at: constitutionalTimeAuthority.now(),
      total_schemas: schemas.length,
      schemas: schemas.map(s => ({
        schema_id: s.schema_id,
        name: s.name,
        version: s.version,
        description: s.description,
      })),
    };
  }

  /**
   * List all artifact types
   * 
   * @returns {Object} Artifact type list
   */
  listArtifactTypes() {
    console.log('[ReflectionAuthority] Listing artifact types');

    const artifactTypes = this._artifactTypeRegistry.getAllArtifactTypes();

    return {
      reflection_type: 'artifact_types',
      reflected_at: constitutionalTimeAuthority.now(),
      total_artifact_types: artifactTypes.length,
      artifact_types: artifactTypes.map(t => ({
        artifact_type: t.artifact_type,
        version: t.version,
        description: t.description,
        serializer: t.serializer,
        validator: t.validator,
        canonicalizer: t.canonicalizer,
      })),
    };
  }

  /**
   * List capability graph
   * 
   * @returns {Object} Capability graph
   */
  listCapabilityGraph() {
    console.log('[ReflectionAuthority] Listing capability graph');

    const nodes = this._capabilityGraph.getAllNodes();
    const edges = this._capabilityGraph.getAllEdges();
    const statistics = this._capabilityGraph.getStatistics();

    return {
      reflection_type: 'capability_graph',
      reflected_at: constitutionalTimeAuthority.now(),
      total_nodes: nodes.length,
      total_edges: edges.length,
      nodes: nodes.map(n => ({
        node_id: n.node_id,
        node_type: n.node_type,
        authority_id: n.authority_id,
        name: n.name,
        capabilities: n.capabilities,
        produced_artifacts: n.produced_artifacts,
      })),
      edges: edges.map(e => ({
        edge_id: e.edge_id,
        edge_type: e.edge_type,
        from: e.from,
        to: e.to,
        artifact: e.artifact,
      })),
      statistics: statistics,
    };
  }

  /**
   * List execution plans
   * 
   * @param {Object} filters - Optional filters
   * @returns {Object} Execution plan list
   */
  async listExecutionPlans(filters = {}) {
    console.log('[ReflectionAuthority] Listing execution plans');

    // Query execution plans from database
    try {
      const result = await this._postgres.query(`
        SELECT plan_id, plan_data
        FROM execution_plans
        ORDER BY created_at DESC
        LIMIT 100
      `);

      const plans = result.rows.map(row => ({
        plan_id: row.plan_id,
        mission_id: row.plan_data.mission_id,
        version: row.plan_data.version,
        created_at: row.plan_data.created_at,
        total_nodes: row.plan_data.nodes.length,
        total_edges: row.plan_data.edges.length,
      }));

      return {
        reflection_type: 'execution_plans',
        reflected_at: constitutionalTimeAuthority.now(),
        total_plans: plans.length,
        plans: plans,
      };
    } catch (error) {
      console.error('[ReflectionAuthority] Failed to list execution plans:', error.message);
      return {
        reflection_type: 'execution_plans',
        reflected_at: constitutionalTimeAuthority.now(),
        total_plans: 0,
        plans: [],
        error: error.message,
      };
    }
  }

  /**
   * List artifacts
   * 
   * @param {Object} filters - Optional filters
   * @returns {Object} Artifact list
   */
  async listArtifacts(filters = {}) {
    console.log('[ReflectionAuthority] Listing artifacts (immutable metadata only)');

    const limit = filters.limit || 100;
    const artifactType = filters.artifact_type || null;

    try {
      const artifacts = await this._artifactAuthority.listArtifacts(artifactType, limit);

      return {
        reflection_type: 'artifacts',
        reflected_at: constitutionalTimeAuthority.now(),
        total_artifacts: artifacts.length,
        artifacts: artifacts.map(a => ({
          artifact_id: a.artifact_id,
          artifact_type: a.artifact_type,
          canonical_hash: a.canonical_hash,
          witness_hash: a.witness_hash,
          created_at: a.created_at,
        })),
      };
    } catch (error) {
      console.error('[ReflectionAuthority] Failed to list artifacts:', error.message);
      return {
        reflection_type: 'artifacts',
        reflected_at: constitutionalTimeAuthority.now(),
        total_artifacts: 0,
        artifacts: [],
        error: error.message,
      };
    }
  }

  /**
   * Get authority details
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Object} Authority details
   */
  getAuthorityDetails(authorityId) {
    console.log(`[ReflectionAuthority] Getting authority details for ${authorityId}`);

    const descriptor = this._authorityRegistry.getDescriptor(authorityId);
    if (!descriptor) {
      return {
        reflection_type: 'authority_details',
        authority_id: authorityId,
        found: false,
      };
    }

    const dependencyChain = this._authorityRegistry.resolveDependencies(authorityId);
    const dependents = this._capabilityGraph.getDependents(authorityId);

    return {
      reflection_type: 'authority_details',
      reflected_at: constitutionalTimeAuthority.now(),
      authority_id: authorityId,
      found: true,
      descriptor: descriptor,
      dependency_chain: dependencyChain,
      dependents: dependents,
    };
  }

  /**
   * Get policy details
   * 
   * @param {string} policyId - Policy identifier
   * @returns {Object} Policy details
   */
  getPolicyDetails(policyId) {
    console.log(`[ReflectionAuthority] Getting policy details for ${policyId}`);

    const compiledPolicy = this._policyCompiler.getCompiledPolicy(policyId);
    if (!compiledPolicy) {
      return {
        reflection_type: 'policy_details',
        policy_id: policyId,
        found: false,
      };
    }

    return {
      reflection_type: 'policy_details',
      reflected_at: constitutionalTimeAuthority.now(),
      policy_id: policyId,
      found: true,
      policy: compiledPolicy,
    };
  }

  /**
   * Get schema details
   * 
   * @param {string} schemaId - Schema identifier
   * @returns {Object} Schema details
   */
  getSchemaDetails(schemaId) {
    console.log(`[ReflectionAuthority] Getting schema details for ${schemaId}`);

    const schema = this._schemaAuthority.getSchema(schemaId);
    if (!schema) {
      return {
        reflection_type: 'schema_details',
        schema_id: schemaId,
        found: false,
      };
    }

    return {
      reflection_type: 'schema_details',
      reflected_at: constitutionalTimeAuthority.now(),
      schema_id: schemaId,
      found: true,
      schema: schema,
    };
  }

  /**
   * Get constitutional state (from immutable metadata only)
   * 
   * @returns {Object} Constitutional state
   */
  getConstitutionalState() {
    console.log('[ReflectionAuthority] Getting constitutional state (from immutable metadata only)');

    const authorityStats = this._authorityRegistry.getStatistics();
    const schemaStats = this._schemaAuthority.getStatistics();
    const artifactTypeStats = this._artifactTypeRegistry.getStatistics();
    const policyStats = this._policyCompiler.getStatistics();
    const capabilityGraphStats = this._capabilityGraph.getStatistics();
    const artifactStats = this._artifactAuthority.getStatistics();

    return {
      reflection_type: 'constitutional_state',
      reflected_at: constitutionalTimeAuthority.now(),
      authority_registry: authorityStats,
      schema_authority: schemaStats,
      artifact_type_registry: artifactTypeStats,
      policy_compiler: policyStats,
      capability_graph: capabilityGraphStats,
      artifact_authority: artifactStats,
    };
  }

  /**
   * Get constitutional health
   * 
   * @returns {Object} Constitutional health
   */
  getConstitutionalHealth() {
    console.log('[ReflectionAuthority] Getting constitutional health');

    const healthChecks = [];

    // Check authority registry health
    const authorityDescriptors = this._authorityRegistry.getAllDescriptors();
    healthChecks.push({
      component: 'authority_registry',
      status: authorityDescriptors.length > 0 ? 'healthy' : 'degraded',
      details: { total_authorities: authorityDescriptors.length },
    });

    // Check schema authority health
    const schemas = this._schemaAuthority.getAllSchemas();
    healthChecks.push({
      component: 'schema_authority',
      status: schemas.length > 0 ? 'healthy' : 'degraded',
      details: { total_schemas: schemas.length },
    });

    // Check artifact type registry health
    const artifactTypes = this._artifactTypeRegistry.getAllArtifactTypes();
    healthChecks.push({
      component: 'artifact_type_registry',
      status: artifactTypes.length > 0 ? 'healthy' : 'degraded',
      details: { total_artifact_types: artifactTypes.length },
    });

    // Check policy compiler health
    const compiledPolicies = this._policyCompiler.getAllCompiledPolicies();
    healthChecks.push({
      component: 'policy_compiler',
      status: compiledPolicies.length > 0 ? 'healthy' : 'degraded',
      details: { total_compiled_policies: compiledPolicies.length },
    });

    // Check capability graph health
    const graphValidation = this._capabilityGraph.validateGraph();
    healthChecks.push({
      component: 'capability_graph',
      status: graphValidation.valid ? 'healthy' : 'unhealthy',
      details: { validation: graphValidation },
    });

    const overallHealth = healthChecks.every(h => h.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      reflection_type: 'constitutional_health',
      reflected_at: constitutionalTimeAuthority.now(),
      overall_health: overallHealth,
      health_checks: healthChecks,
    };
  }

  /**
   * Get reflection summary
   * 
   * @returns {Object} Reflection summary
   */
  getReflectionSummary() {
    console.log('[ReflectionAuthority] Getting reflection summary');

    return {
      reflection_type: 'summary',
      reflected_at: constitutionalTimeAuthority.now(),
      capabilities: [
        'list_authorities',
        'list_policies',
        'list_schemas',
        'list_artifact_types',
        'list_capability_graph',
        'list_execution_plans',
        'list_artifacts',
        'get_authority_details',
        'get_policy_details',
        'get_schema_details',
        'get_constitutional_state',
        'get_constitutional_health',
      ],
      note: 'Reflection consumes only immutable artifacts, never touches runtime',
    };
  }
}

module.exports = { ConstitutionalReflectionAuthority };
