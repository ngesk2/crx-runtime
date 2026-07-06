/**
 * Dependency Graph
 * 
 * Tracks relationships between ConstitutionalObjects.
 * 
 * Every ConstitutionalObject maintains:
 * - parents
 * - children
 * - references
 * - dependencies
 * - reverse dependencies
 * 
 * Enables queries like:
 * - "If Commit X changes, what breaks?"
 * - "What objects depend on this object?"
 * - "What are the transitive dependencies?"
 * 
 * Constitutional Constraint: Dependency tracking is automatic and complete.
 */

class DependencyGraph {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._graph = new Map(); // In-memory graph cache
    this._reverseGraph = new Map(); // Reverse dependency cache
  }

  async buildFromObjects(objects) {
    // Build dependency graph from a set of objects
    for (const obj of objects) {
      await this.addNode(obj);
      
      // Add relationships as dependencies
      if (obj.relationships) {
        for (const rel of obj.relationships) {
          await this.addDependency(obj.id, rel.target_id, rel.relation_type, rel.strength);
        }
      }
    }
  }

  async addNode(obj) {
    this._graph.set(obj.id, {
      id: obj.id,
      kind: obj.kind,
      data: obj,
      dependencies: new Set(),
      dependents: new Set(),
    });

    // Persist node
    await this._postgres.query(`
      INSERT INTO dependency_nodes (node_id, node_kind, node_data, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (node_id) DO UPDATE SET node_kind = $2, node_data = $3
    `, [obj.id, obj.kind, JSON.stringify(obj)]);
  }

  async addDependency(sourceId, targetId, relationType = 'depends_on', strength = 1.0) {
    // Add to in-memory graph
    const sourceNode = this._graph.get(sourceId);
    const targetNode = this._graph.get(targetId);

    if (sourceNode) {
      sourceNode.dependencies.add(targetId);
    }

    if (targetNode) {
      targetNode.dependents.add(sourceId);
    }

    // Add to reverse graph
    if (!this._reverseGraph.has(targetId)) {
      this._reverseGraph.set(targetId, new Set());
    }
    this._reverseGraph.get(targetId).add(sourceId);

    // Persist dependency
    await this._postgres.query(`
      INSERT INTO dependency_edges (source_id, target_id, relation_type, strength, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (source_id, target_id) DO UPDATE SET relation_type = $3, strength = $4
    `, [sourceId, targetId, relationType, strength]);
  }

  async getDependencies(nodeId, transitive = false) {
    if (transitive) {
      return this._getTransitiveDependencies(nodeId);
    }

    const node = this._graph.get(nodeId);
    if (!node) {
      return await this._loadDependencies(nodeId);
    }

    return Array.from(node.dependencies);
  }

  async _getTransitiveDependencies(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) {
      return [];
    }
    visited.add(nodeId);

    const directDeps = await this.getDependencies(nodeId, false);
    const transitiveDeps = new Set(directDeps);

    for (const depId of directDeps) {
      const depsOfDep = await this._getTransitiveDependencies(depId, visited);
      for (const depOfDepId of depsOfDep) {
        transitiveDeps.add(depOfDepId);
      }
    }

    return Array.from(transitiveDeps);
  }

  async getDependents(nodeId, transitive = false) {
    if (transitive) {
      return this._getTransitiveDependents(nodeId);
    }

    const node = this._graph.get(nodeId);
    if (!node) {
      return await this._loadDependents(nodeId);
    }

    return Array.from(node.dependents);
  }

  async _getTransitiveDependents(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) {
      return [];
    }
    visited.add(nodeId);

    const directDependents = await this.getDependents(nodeId, false);
    const transitiveDependents = new Set(directDependents);

    for (const depId of directDependents) {
      const dependentsOfDep = await this._getTransitiveDependents(depId, visited);
      for (const depOfDepId of dependentsOfDep) {
        transitiveDependents.add(depOfDepId);
      }
    }

    return Array.from(transitiveDependents);
  }

  async getImpactAnalysis(nodeId) {
    // "If this object changes, what breaks?"
    const dependents = await this.getDependents(nodeId, true);
    const impact = {
      direct_impact: await this.getDependents(nodeId, false),
      transitive_impact: dependents,
      total_affected: dependents.length,
      affected_kinds: await this._getAffectedKinds(dependents),
    };

    return impact;
  }

  async _getAffectedKinds(nodeIds) {
    const kinds = new Set();
    for (const nodeId of nodeIds) {
      const node = this._graph.get(nodeId);
      if (node) {
        kinds.add(node.kind);
      }
    }
    return Array.from(kinds);
  }

  async getPath(fromId, toId) {
    // Find shortest path between two nodes
    const visited = new Set();
    const queue = [[fromId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const currentId = path[path.length - 1];

      if (currentId === toId) {
        return path;
      }

      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const dependencies = await this.getDependencies(currentId, false);
      for (const depId of dependencies) {
        queue.push([...path, depId]);
      }
    }

    return null; // No path found
  }

  async getCycleDetection() {
    // Detect cycles in the dependency graph
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    for (const nodeId of this._graph.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = await this._detectCycle(nodeId, visited, recursionStack, []);
        if (cycle) {
          cycles.push(cycle);
        }
      }
    }

    return cycles;
  }

  async _detectCycle(nodeId, visited, recursionStack, path) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const dependencies = await this.getDependencies(nodeId, false);
    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        const cycle = await this._detectCycle(depId, visited, recursionStack, path);
        if (cycle) {
          return cycle;
        }
      } else if (recursionStack.has(depId)) {
        // Cycle detected
        const cycleStart = path.indexOf(depId);
        return path.slice(cycleStart);
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return null;
  }

  async getTopologicalOrder() {
    // Return nodes in topological order
    const inDegree = new Map();
    const nodes = Array.from(this._graph.keys());

    // Initialize in-degrees
    for (const nodeId of nodes) {
      inDegree.set(nodeId, 0);
    }

    // Calculate in-degrees
    for (const nodeId of nodes) {
      const dependencies = await this.getDependencies(nodeId, false);
      for (const depId of dependencies) {
        inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const order = [];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      order.push(nodeId);

      const dependents = await this.getDependents(nodeId, false);
      for (const depId of dependents) {
        inDegree.set(depId, inDegree.get(depId) - 1);
        if (inDegree.get(depId) === 0) {
          queue.push(depId);
        }
      }
    }

    return order;
  }

  async _loadDependencies(nodeId) {
    const result = await this._postgres.query(`
      SELECT target_id
      FROM dependency_edges
      WHERE source_id = $1
    `, [nodeId]);

    return result.rows.map(row => row.target_id);
  }

  async _loadDependents(nodeId) {
    const result = await this._postgres.query(`
      SELECT source_id
      FROM dependency_edges
      WHERE target_id = $1
    `, [nodeId]);

    return result.rows.map(row => row.source_id);
  }

  async getStatistics() {
    const nodeCount = this._graph.size;
    let edgeCount = 0;

    for (const node of this._graph.values()) {
      edgeCount += node.dependencies.size;
    }

    return {
      nodes: nodeCount,
      edges: edgeCount,
      average_degree: nodeCount > 0 ? edgeCount / nodeCount : 0,
    };
  }

  clearCache() {
    this._graph.clear();
    this._reverseGraph.clear();
  }
}

module.exports = { DependencyGraph };
