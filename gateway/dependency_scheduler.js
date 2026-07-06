/**
 * Dependency Scheduler
 * 
 * Phase 11.1 — Dependency Scheduling Utility
 * 
 * Stateless utility for computing execution order from dependency graphs.
 * 
 * This is NOT an Authority. It is a pure algorithmic utility because:
 * - It is stateless (no immutable state)
 * - It is a pure algorithm (computes order from graph)
 * - It does not produce witnesses (graph produces witnesses)
 * - It does not own constitutional data
 * 
 * Responsibilities:
 * - Topological sort computation
 * - Ready node computation
 * - Circular dependency detection
 * - Dependency satisfaction tracking
 */

class DependencyScheduler {
  constructor() {
    // No state - this is a stateless utility
  }

  /**
   * Compute execution order from dependency graph
   * @param {Object} graph - Dependency graph with nodes and dependencies
   * @returns {Object} Execution order result
   */
  computeExecutionOrder(graph) {
    const nodes = graph.nodes || {};
    const executionOrder = this._topologicalSort(nodes);
    
    return {
      execution_order: executionOrder,
      total_nodes: Object.keys(nodes).length,
      has_circular_dependencies: false
    };
  }

  /**
   * Get ready nodes (nodes with all dependencies satisfied)
   * @param {Object} graph - Dependency graph
   * @param {Set} completedNodes - Completed node IDs
   * @param {Set} failedNodes - Failed node IDs
   * @returns {Array} Ready node IDs
   */
  getReadyNodes(graph, completedNodes, failedNodes) {
    const nodes = graph.nodes || {};
    const readyNodes = [];
    
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (completedNodes.has(nodeId) || failedNodes.has(nodeId)) {
        continue; // Already processed
      }
      
      // Skip external nodes during constitutional replay
      if (graph.external_nodes && graph.external_nodes.includes(nodeId)) {
        continue;
      }
      
      const dependencies = node.dependencies || [];
      const allDepsSatisfied = dependencies.every(depId => completedNodes.has(depId));
      
      if (allDepsSatisfied) {
        readyNodes.push(nodeId);
      }
    }
    
    return readyNodes;
  }

  /**
   * Detect circular dependencies
   * @param {Object} graph - Dependency graph
   * @returns {Object} Circular dependency detection result
   */
  detectCircularDependencies(graph) {
    const nodes = graph.nodes || {};
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    for (const nodeId of Object.keys(nodes)) {
      if (!visited.has(nodeId)) {
        const cycle = this._detectCycle(nodeId, nodes, visited, recursionStack, []);
        if (cycle) {
          cycles.push(cycle);
        }
      }
    }
    
    return {
      has_circular_dependencies: cycles.length > 0,
      cycles: cycles
    };
  }

  /**
   * Verify graph integrity
   * @param {Object} graph - Dependency graph
   * @returns {Object} Verification result
   */
  verifyGraphIntegrity(graph) {
    const nodes = graph.nodes || {};
    
    // Check for missing dependencies
    const missingDependencies = [];
    for (const [nodeId, node] of Object.entries(nodes)) {
      const dependencies = node.dependencies || [];
      for (const depId of dependencies) {
        if (!nodes[depId]) {
          missingDependencies.push({ node: nodeId, missing_dependency: depId });
        }
      }
    }
    
    // Check for circular dependencies
    const circularCheck = this.detectCircularDependencies(graph);
    
    return {
      valid: missingDependencies.length === 0 && !circularCheck.has_circular_dependencies,
      missing_dependencies: missingDependencies,
      circular_dependencies: circularCheck
    };
  }

  /**
   * Topological sort (Kahn's algorithm)
   * @param {Object} nodes - Node definitions
   * @returns {Array} Topologically sorted node IDs
   */
  _topologicalSort(nodes) {
    const inDegree = new Map();
    const adjacencyList = new Map();
    
    // Initialize in-degree and adjacency list
    for (const nodeId of Object.keys(nodes)) {
      inDegree.set(nodeId, 0);
      adjacencyList.set(nodeId, []);
    }
    
    // Build adjacency list and compute in-degrees
    for (const [nodeId, node] of Object.entries(nodes)) {
      const dependencies = node.dependencies || [];
      for (const depId of dependencies) {
        if (adjacencyList.has(depId)) {
          adjacencyList.get(depId).push(nodeId);
          inDegree.set(nodeId, inDegree.get(nodeId) + 1);
        }
      }
    }
    
    // Find nodes with zero in-degree
    const queue = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    
    // Process nodes
    const result = [];
    while (queue.length > 0) {
      // Sort queue for deterministic ordering (by node ID)
      queue.sort();
      const nodeId = queue.shift();
      result.push(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Check for cycle
    if (result.length !== Object.keys(nodes).length) {
      throw new Error('Circular dependency detected in graph');
    }
    
    return result;
  }

  /**
   * Detect cycle using DFS
   * @param {string} nodeId - Current node ID
   * @param {Object} nodes - Node definitions
   * @param {Set} visited - Visited nodes
   * @param {Set} recursionStack - Recursion stack
   * @param {Array} path - Current path
   * @returns {Array|null} Cycle path if found, null otherwise
   */
  _detectCycle(nodeId, nodes, visited, recursionStack, path) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const node = nodes[nodeId];
    const dependencies = node.dependencies || [];
    
    for (const depId of dependencies) {
      if (!nodes[depId]) {
        continue; // Missing dependency, skip
      }
      
      if (!visited.has(depId)) {
        const cycle = this._detectCycle(depId, nodes, visited, recursionStack, [...path]);
        if (cycle) {
          return cycle;
        }
      } else if (recursionStack.has(depId)) {
        // Found cycle
        const cycleStart = path.indexOf(depId);
        return [...path.slice(cycleStart), depId];
      }
    }
    
    recursionStack.delete(nodeId);
    return null;
  }

  /**
   * Compute parallel execution levels
   * @param {Object} graph - Dependency graph
   * @returns {Array} Array of execution levels (each level is an array of node IDs)
   */
  computeExecutionLevels(graph) {
    const nodes = graph.nodes || {};
    const levels = [];
    const completedNodes = new Set();
    const remainingNodes = new Set(Object.keys(nodes));
    
    while (remainingNodes.size > 0) {
      const readyNodes = this.getReadyNodes(
        { nodes, external_nodes: graph.external_nodes },
        completedNodes,
        new Set()
      );
      
      if (readyNodes.length === 0) {
        // No ready nodes but nodes remaining - circular dependency
        throw new Error('Cannot compute execution levels: circular dependency detected');
      }
      
      levels.push(readyNodes);
      
      for (const nodeId of readyNodes) {
        completedNodes.add(nodeId);
        remainingNodes.delete(nodeId);
      }
    }
    
    return levels;
  }

  /**
   * Estimate critical path length
   * @param {Object} graph - Dependency graph
   * @param {Object} nodeDurations - Optional node execution durations
   * @returns {Object} Critical path analysis
   */
  estimateCriticalPath(graph, nodeDurations = {}) {
    const nodes = graph.nodes || {};
    const executionOrder = this.computeExecutionOrder(graph).execution_order;
    
    // Reverse order for backward pass
    const reversedOrder = [...executionOrder].reverse();
    
    const earliestStart = new Map();
    const earliestFinish = new Map();
    const latestStart = new Map();
    const latestFinish = new Map();
    
    // Forward pass (earliest start/finish)
    for (const nodeId of executionOrder) {
      const node = nodes[nodeId];
      const dependencies = node.dependencies || [];
      const duration = nodeDurations[nodeId] || 1;
      
      const maxDepFinish = dependencies.length > 0
        ? Math.max(...dependencies.map(depId => earliestFinish.get(depId) || 0))
        : 0;
      
      earliestStart.set(nodeId, maxDepFinish);
      earliestFinish.set(nodeId, maxDepFinish + duration);
    }
    
    // Backward pass (latest start/finish)
    const projectDuration = Math.max(...Array.from(earliestFinish.values()));
    
    for (const nodeId of reversedOrder) {
      const node = nodes[nodeId];
      const duration = nodeDurations[nodeId] || 1;
      
      // Find successors
      const successors = [];
      for (const [otherNodeId, otherNode] of Object.entries(nodes)) {
        if (otherNode.dependencies && otherNode.dependencies.includes(nodeId)) {
          successors.push(otherNodeId);
        }
      }
      
      if (successors.length === 0) {
        latestFinish.set(nodeId, projectDuration);
      } else {
        const minSuccessorStart = Math.min(...successors.map(succId => latestStart.get(succId) || projectDuration));
        latestFinish.set(nodeId, minSuccessorStart);
      }
      
      latestStart.set(nodeId, latestFinish.get(nodeId) - duration);
    }
    
    // Identify critical path nodes (zero slack)
    const criticalPathNodes = [];
    for (const nodeId of executionOrder) {
      const slack = latestStart.get(nodeId) - earliestStart.get(nodeId);
      if (slack === 0) {
        criticalPathNodes.push(nodeId);
      }
    }
    
    return {
      project_duration: projectDuration,
      critical_path_nodes: criticalPathNodes,
      earliest_start: Object.fromEntries(earliestStart),
      earliest_finish: Object.fromEntries(earliestFinish),
      latest_start: Object.fromEntries(latestStart),
      latest_finish: Object.fromEntries(latestFinish)
    };
  }
}

// Singleton instance
const dependencyScheduler = new DependencyScheduler();

module.exports = { DependencyScheduler, dependencyScheduler };
