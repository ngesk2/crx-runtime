/**
 * Constitution Health Endpoint
 * 
 * Priority 3: GET /constitution — Fleet handshake.
 * Returns deterministic platform state.
 * 
 * This endpoint is the single source of constitutional truth.
 * Every fleet component queries this on startup.
 * 
 * Response is deterministic: same inputs → same output.
 */

const { computeCanonicalHash } = require('../../ping-runtime/authorities/constitutional_validation');

// Lazy import — only needed when container is provided
let _buildDependencyGraph = null;
function getBuildDependencyGraph() {
  if (!_buildDependencyGraph) {
    _buildDependencyGraph = require('../bootstrap/wiring').buildDependencyGraph;
  }
  return _buildDependencyGraph;
}

/**
 * Create constitution routes
 * 
 * @param {Object} options
 * @param {Object} options.tenantRegistry - TenantRegistry instance
 * @param {Object} options.deploymentRegistry - DeploymentRegistry instance
 * @param {Object} options.runtimeRegistry - RuntimeRegistry instance
 * @param {Object} options.eventEnvelope - CanonicalEventEnvelope instance
 * @param {Object} [options.container] - DI container for graph computation
 * @returns {Object} Express router
 */
function createConstitutionRoutes({ tenantRegistry, deploymentRegistry, runtimeRegistry, eventEnvelope, container, runtimeHash, consumers, fingerprint }) {
  const express = require('express');
  const router = express.Router();

  /**
   * GET /constitution
   * 
   * Returns deterministic platform state.
   * Same inputs → same response.
   */
  router.get('/', async (req, res) => {
    try {
      const startTime = Date.now();

      // Collect all contract hashes
      const contracts = {};
      const registries = [
        { name: 'canonicalEventEnvelope', instance: eventEnvelope },
        { name: 'tenantRegistry', instance: tenantRegistry },
        { name: 'deploymentRegistry', instance: deploymentRegistry },
        { name: 'runtimeRegistry', instance: runtimeRegistry },
      ];

      for (const { name, instance } of registries) {
        if (instance && typeof instance.publishContract === 'function') {
          const contract = instance.publishContract();
          contracts[name] = {
            authority_id: contract.authority_id,
            authority_version: contract.authority_version,
            contract_hash: contract.contract_hash,
          };
        }
      }

      // Compute startup order from dependency graph
      let startupOrder = [];
      let graphHash = null;
      let graphValid = false;

      if (container) {
        try {
          const buildDependencyGraph = getBuildDependencyGraph();
          const graph = buildDependencyGraph(container);
          const report = graph.validate();
          startupOrder = report.startupOrder || [];
          graphHash = report.graphHash || null;
          graphValid = report.valid || false;
        } catch (error) {
          startupOrder = [];
          graphHash = null;
          graphValid = false;
        }
      }

      // Compute platform hash
      const platformInput = {
        contracts: Object.entries(contracts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, c]) => `${name}:${c.contract_hash}`)
          .join('|'),
        startupOrder: startupOrder.join('|'),
        graphHash: graphHash || 'none',
        compilerVersion: '1.0.0',
      };
      const platformHash = computeCanonicalHash(platformInput);

      const response = {
        platform_hash: platformHash,
        runtime_artifact_hash: runtimeHash || null,
        constitution_version: '1.0.0',
        compiler_version: '1.0.0',
        graph_hash: graphHash,
        graph_valid: graphValid,
        startup_order: startupOrder,
        contracts,
        registry_count: registries.length,
        authority_count: Object.keys(contracts).length,
        generated_runtime_authoritative: !!(consumers && consumers.eventValidator && consumers.capabilityResolver && consumers.workflowExecutor && consumers.deploymentLoader && consumers.stateMachineExecutor),
        generated_consumers: consumers ? {
          event_validator: { loaded: !!consumers.eventValidator, event_count: consumers.eventValidator ? consumers.eventValidator.listEventTypes().length : 0 },
          capability_resolver: { loaded: !!consumers.capabilityResolver, capability_count: consumers.capabilityResolver ? consumers.capabilityResolver.listCapabilities().length : 0 },
          workflow_executor: { loaded: !!consumers.workflowExecutor, workflow_count: consumers.workflowExecutor ? consumers.workflowExecutor.getStats().totalWorkflows : 0 },
          deployment_loader: { loaded: !!consumers.deploymentLoader, service_count: consumers.deploymentLoader ? consumers.deploymentLoader.getEnabledServices().length : 0 },
          state_machine_executor: { loaded: !!consumers.stateMachineExecutor, machine_count: consumers.stateMachineExecutor ? consumers.stateMachineExecutor.getStats().totalMachines : 0 },
        } : null,
        handwritten_registries_remaining: [],
        artifact_hashes: {
          events: consumers && consumers.eventValidator ? consumers.eventValidator.getHash() : null,
          capabilities: consumers && consumers.capabilityResolver ? consumers.capabilityResolver.getHash() : null,
          workflows: consumers && consumers.workflowExecutor ? consumers.workflowExecutor.getHash() : null,
          deployments: consumers && consumers.deploymentLoader ? consumers.deploymentLoader.getHash() : null,
          state_machines: consumers && consumers.stateMachineExecutor ? consumers.stateMachineExecutor.getHash() : null,
        },
        runtime_fingerprint: fingerprint ? fingerprint.getFingerprint() : null,
        computed_at: new Date().toISOString(),
        latency_ms: Date.now() - startTime,
      };

      // Deterministic response — freeze
      Object.freeze(response);

      res.json(response);
    } catch (error) {
      res.status(500).json({
        healthy: false,
        error: error.message,
        computed_at: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /constitution/contracts
   * Returns all contracts with full detail.
   */
  router.get('/contracts', async (req, res) => {
    try {
      const contracts = {};
      const registries = [
        { name: 'canonicalEventEnvelope', instance: eventEnvelope },
        { name: 'tenantRegistry', instance: tenantRegistry },
        { name: 'deploymentRegistry', instance: deploymentRegistry },
        { name: 'runtimeRegistry', instance: runtimeRegistry },
      ];

      for (const { name, instance } of registries) {
        if (instance && typeof instance.publishContract === 'function') {
          contracts[name] = instance.publishContract();
        }
      }

      res.json({ contracts, count: Object.keys(contracts).length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /constitution/graph
   * Returns the full dependency graph.
   */
  router.get('/graph', async (req, res) => {
    try {
      if (!container) {
        return res.status(503).json({ error: 'Container not available' });
      }

      const graph = buildDependencyGraph(container);
      const report = graph.validate();
      const tree = graph.getDependencyTree();

      res.json({
        valid: report.valid,
        nodeCount: report.nodeCount,
        edgeCount: report.edgeCount,
        startupOrder: report.startupOrder,
        graphHash: report.graphHash,
        errors: report.errors,
        tree,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createConstitutionRoutes;
