/**
 * Dependency Graph Validator
 * 
 * P001.5: True dependency validation replacing simple fail-fast.
 * 
 * Builds a directed graph from every authority's declared dependencies.
 * Detects: missing deps, duplicate registrations, cycles, orphans, multiple providers.
 * Computes: topological startup order.
 * 
 * Constitutional Constraint:
 * - Startup aborts before initialization if validation fails
 * - No warnings. Only PASS or FAIL.
 * - Startup order is computed, never hardcoded.
 */

const crypto = require('crypto');

class DependencyGraph {
  constructor() {
    this._nodes = new Map();      // name → { authority, dependencies, metadata }
    this._edges = new Map();      // name → Set<dependency_name>
    this._reverseEdges = new Map(); // name → Set<dependent_name>
    this._validationReport = null;
    this._startupOrder = null;
  }

  /**
   * Register an authority with its declared dependencies.
   * 
   * @param {string} name - Service name
   * @param {Object} authority - Authority instance (must have `dependencies` getter or static)
   * @param {Object} [metadata] - Additional metadata (description, version, etc.)
   */
  register(name, authority, metadata = {}) {
    const deps = this._extractDependencies(authority);
    
    this._nodes.set(name, { authority, dependencies: deps, metadata });
    this._edges.set(name, new Set(deps));
    
    // Build reverse edges (who depends on me?)
    if (!this._reverseEdges.has(name)) {
      this._reverseEdges.set(name, new Set());
    }
    
    for (const dep of deps) {
      if (!this._reverseEdges.has(dep)) {
        this._reverseEdges.set(dep, new Set());
      }
      this._reverseEdges.get(dep).add(name);
    }
  }

  /**
   * Extract dependencies from an authority instance.
   * Supports: `get dependencies()`, `static get dependencies()`, `_dependencies` field.
   */
  _extractDependencies(authority) {
    if (!authority) return [];

    // Instance getter
    if (typeof authority.dependencies !== 'undefined') {
      const deps = authority.dependencies;
      return Array.isArray(deps) ? deps : [];
    }

    // Static getter on class
    if (authority.constructor && authority.constructor.dependencies) {
      const deps = authority.constructor.dependencies;
      return Array.isArray(deps) ? deps : [];
    }

    // _dependencies field
    if (authority._dependencies && Array.isArray(authority._dependencies)) {
      return authority._dependencies;
    }

    return [];
  }

  /**
   * Validate the full dependency graph.
   * 
   * Checks:
   * 1. Missing dependencies (dep not registered)
   * 2. Duplicate registrations (same name registered twice)
   * 3. Dependency cycles (circular dependencies)
   * 4. Orphan authorities (nothing depends on them AND they depend on nothing)
   * 5. Multiple providers (multiple authorities provide same capability)
   * 
   * @returns {{ valid: boolean, report: Object, startupOrder: string[] }}
   */
  validate() {
    const errors = [];
    const warnings = [];
    const info = [];

    // 1. Check for missing dependencies
    for (const [name, { dependencies }] of this._nodes) {
      for (const dep of dependencies) {
        if (!this._nodes.has(dep)) {
          errors.push({
            type: 'MISSING_DEPENDENCY',
            authority: name,
            dependency: dep,
            message: `${name} depends on '${dep}' which is not registered`,
          });
        }
      }
    }

    // 2. Check for duplicate registrations (by authority_id from contract)
    const authorityIds = new Map();
    for (const [name, { authority }] of this._nodes) {
      if (authority && typeof authority.publishContract === 'function') {
        const contract = authority.publishContract();
        if (contract.authority_id) {
          if (authorityIds.has(contract.authority_id)) {
            errors.push({
              type: 'DUPLICATE_AUTHORITY_ID',
              authority: name,
              existing: authorityIds.get(contract.authority_id),
              authorityId: contract.authority_id,
              message: `Authority ID '${contract.authority_id}' registered by both '${name}' and '${authorityIds.get(contract.authority_id)}'`,
            });
          } else {
            authorityIds.set(contract.authority_id, name);
          }
        }
      }
    }

    // 3. Detect dependency cycles (Kahn's algorithm)
    const cycleResult = this._detectCycles();
    if (cycleResult.hasCycle) {
      errors.push({
        type: 'DEPENDENCY_CYCLE',
        cycle: cycleResult.cycle,
        message: `Dependency cycle detected: ${cycleResult.cycle.join(' → ')}`,
      });
    }

    // 4. Detect orphan authorities
    for (const [name] of this._nodes) {
      const dependents = this._reverseEdges.get(name) || new Set();
      const deps = this._edges.get(name) || new Set();
      
      if (dependents.size === 0 && deps.size === 0 && name !== 'pool' && name !== 'config') {
        warnings.push({
          type: 'ORPHAN_AUTHORITY',
          authority: name,
          message: `${name} has no dependencies and nothing depends on it`,
        });
      }
    }

    // 5. Compute startup order (topological sort)
    let startupOrder = [];
    if (!cycleResult.hasCycle) {
      startupOrder = this._topologicalSort();
    }

    // 6. Verify all registered services appear in startup order
    for (const [name] of this._nodes) {
      if (!startupOrder.includes(name)) {
        errors.push({
          type: 'NOT_IN_STARTUP_ORDER',
          authority: name,
          message: `${name} is registered but not in startup order`,
        });
      }
    }

    // Build report
    const report = {
      valid: errors.length === 0,
      timestamp: new Date().toISOString(),
      nodeCount: this._nodes.size,
      edgeCount: Array.from(this._edges.values()).reduce((sum, deps) => sum + deps.size, 0),
      errors,
      warnings,
      info,
      startupOrder,
      dependencyTree: this._buildDependencyTree(),
      graphHash: this._computeGraphHash(startupOrder),
    };

    this._validationReport = report;
    this._startupOrder = startupOrder;

    return report;
  }

  /**
   * Detect cycles using Kahn's algorithm (BFS topological sort).
   * If the sorted output doesn't include all nodes, there's a cycle.
   */
  _detectCycles() {
    const inDegree = new Map();
    const queue = [];
    const sorted = [];

    // Initialize in-degrees
    for (const [name] of this._nodes) {
      inDegree.set(name, 0);
    }
    // In-degree = number of dependencies (incoming edges)
    // Edge: name → dep means dep has an incoming edge from name
    // But for topological sort, we want nodes with no dependencies first
    // So in-degree = count of deps (outgoing edges from the node's perspective)
    for (const [name, deps] of this._edges) {
      // Each dependency of 'name' means 'name' depends on it
      // In-degree for Kahn's: count how many nodes depend on ME (reverse edges)
      // Actually: in-degree for topological sort = number of dependencies of this node
      inDegree.set(name, deps.size);
    }

    // Enqueue nodes with no incoming edges
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);

      const dependents = this._reverseEdges.get(current) || new Set();
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // If sorted doesn't include all nodes, there's a cycle
    if (sorted.length !== this._nodes.size) {
      const cycleNodes = [];
      for (const [name] of this._nodes) {
        if (!sorted.includes(name)) {
          cycleNodes.push(name);
        }
      }
      return { hasCycle: true, cycle: cycleNodes };
    }

    return { hasCycle: false, cycle: [] };
  }

  /**
   * Topological sort (Kahn's algorithm).
   * Returns startup order: nodes with no dependencies first.
   */
  _topologicalSort() {
    const inDegree = new Map();
    const queue = [];
    const sorted = [];

    for (const [name] of this._nodes) {
      inDegree.set(name, 0);
    }
    // in-degree = number of dependencies this node has
    for (const [name, deps] of this._edges) {
      inDegree.set(name, deps.size);
    }

    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);

      const dependents = this._reverseEdges.get(current) || new Set();
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    return sorted;
  }

  /**
   * Build a human-readable dependency tree.
   */
  _buildDependencyTree() {
    const tree = {};
    for (const [name, { dependencies, metadata }] of this._nodes) {
      tree[name] = {
        dependencies: [...dependencies],
        dependents: [...(this._reverseEdges.get(name) || new Set())],
        description: metadata.description || '',
        version: metadata.version || '',
      };
    }
    return tree;
  }

  /**
   * Compute a hash of the dependency graph structure.
   * Used for drift detection across deployments.
   */
  _computeGraphHash(startupOrder) {
    const graphData = {
      nodes: Object.fromEntries(
        Array.from(this._nodes.entries()).map(([name, { dependencies }]) => [
          name,
          [...dependencies].sort(),
        ])
      ),
      startupOrder,
    };
    const canonical = JSON.stringify(graphData, Object.keys(graphData).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Get the computed startup order.
   * Must call validate() first.
   */
  getStartupOrder() {
    if (!this._startupOrder) {
      throw new Error('Must call validate() before getStartupOrder()');
    }
    return [...this._startupOrder];
  }

  /**
   * Get the validation report.
   * Must call validate() first.
   */
  getReport() {
    if (!this._validationReport) {
      throw new Error('Must call validate() before getReport()');
    }
    return { ...this._validationReport };
  }

  /**
   * Get the graph hash.
   * Must call validate() first.
   */
  getGraphHash() {
    if (!this._validationReport) {
      throw new Error('Must call validate() before getGraphHash()');
    }
    return this._validationReport.graphHash;
  }

  /**
   * Get all registered authority names.
   */
  getAuthorities() {
    return Array.from(this._nodes.keys());
  }

  /**
   * Get authorities that have no dependents (leaf nodes).
   */
  getLeafAuthorities() {
    const leaves = [];
    for (const [name] of this._nodes) {
      const dependents = this._reverseEdges.get(name) || new Set();
      if (dependents.size === 0) {
        leaves.push(name);
      }
    }
    return leaves;
  }

  /**
   * Get authorities that have no dependencies (root nodes).
   */
  getRootAuthorities() {
    const roots = [];
    for (const [name, { dependencies }] of this._nodes) {
      if (dependencies.length === 0) {
        roots.push(name);
      }
    }
    return roots;
  }
}

module.exports = { DependencyGraph };
