/**
 * Canonical Runtime Hash
 * 
 * Priority 5: Platform hash = hash(Constitution + Contracts + Startup Order + Compiler Version)
 * 
 * Deterministic across identical deployments.
 * Used for fleet drift detection.
 */

const { computeCanonicalHash } = require('./constitutional_validation');

// Lazy import — only needed by computeLivePlatformHash
let _buildDependencyGraph = null;
function getBuildDependencyGraph() {
  if (!_buildDependencyGraph) {
    _buildDependencyGraph = require('./bootstrap/wiring').buildDependencyGraph;
  }
  return _buildDependencyGraph;
}

/**
 * Compute the canonical platform hash.
 * 
 * Same inputs → same hash. Always.
 * 
 * @param {Object} options
 * @param {Object} options.contracts - Map of { name: contract_hash }
 * @param {string[]} options.startupOrder - Computed startup order
 * @param {string} options.graphHash - Dependency graph hash
 * @param {string} options.compilerVersion - Compiler version
 * @returns {string} SHA-256 platform hash
 */
function computePlatformHash({ contracts, startupOrder, graphHash, compilerVersion = '1.0.0' }) {
  const input = {
    contracts: Object.entries(contracts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, hash]) => `${name}:${hash}`)
      .join('|'),
    startupOrder: startupOrder.join('|'),
    graphHash: graphHash || 'none',
    compilerVersion,
  };

  return computeCanonicalHash(input);
}

/**
 * Compute platform hash from live registries.
 * 
 * @param {Object} registries - { canonicalEventEnvelope, tenantRegistry, deploymentRegistry, runtimeRegistry }
 * @param {Object} container - DI container
 * @returns {{ platformHash: string, details: Object }}
 */
function computeLivePlatformHash(registries, container) {
  const contracts = {};
  const registryMap = {
    canonicalEventEnvelope: registries.canonicalEventEnvelope,
    tenantRegistry: registries.tenantRegistry,
    deploymentRegistry: registries.deploymentRegistry,
    runtimeRegistry: registries.runtimeRegistry,
  };

  for (const [name, instance] of Object.entries(registryMap)) {
    if (instance && typeof instance.publishContract === 'function') {
      const contract = instance.publishContract();
      contracts[name] = contract.contract_hash;
    }
  }

  let startupOrder = [];
  let graphHash = null;

  if (container) {
    const buildDependencyGraph = getBuildDependencyGraph();
    const graph = buildDependencyGraph(container);
    const report = graph.validate();
    startupOrder = report.startupOrder || [];
    graphHash = report.graphHash || null;
  }

  const platformHash = computePlatformHash({
    contracts,
    startupOrder,
    graphHash,
  });

  return {
    platformHash,
    details: {
      contracts,
      startupOrder,
      graphHash,
    },
  };
}

module.exports = { computePlatformHash, computeLivePlatformHash };
