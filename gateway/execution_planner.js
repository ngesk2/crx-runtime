/**
 * Execution Planner
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Extracts planning logic from GraphExecutor.
 * 
 * Responsibilities:
 * - Dependency ordering
 * - Execution batches
 * - Parallel groups
 * - Deadlock detection
 * 
 * All execution planning flows through this service.
 */

const { dependencyScheduler } = require('./dependency_scheduler');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');

class ExecutionPlanner {
  constructor() {
    this._dependencyScheduler = dependencyScheduler;
    this._failureAuthority = runtimeFailureAuthority;
  }

  /**
   * Plan execution for graph
   * @param {Object} executionGraph - Execution graph
   * @returns {Object} Execution plan
   */
  planExecution(executionGraph) {
    const nodes = executionGraph.nodes;
    const executionOrder = executionGraph.execution_order;
    
    // Group nodes into parallel batches
    const batches = this._computeParallelBatches(executionGraph);
    
    return {
      graph_version: executionGraph.graph_version,
      total_nodes: Object.keys(nodes).length,
      execution_order: executionOrder,
      parallel_batches: batches,
      estimated_parallelism: this._estimateParallelism(batches)
    };
  }

  /**
   * Compute parallel execution batches
   * @param {Object} executionGraph - Execution graph
   * @returns {Array} Parallel batches
   */
  _computeParallelBatches(executionGraph) {
    const nodes = executionGraph.nodes;
    const completedNodes = new Set();
    const failedNodes = new Set();
    const batches = [];
    
    while (completedNodes.size + failedNodes.size < Object.keys(nodes).length) {
      const readyNodes = this._dependencyScheduler.getReadyNodes(executionGraph, completedNodes, failedNodes);
      
      if (readyNodes.length === 0) {
        // Check for deadlock
        if (failedNodes.size > 0) {
          throw this._failureAuthority.createFailure(
            'EXECUTION_DEADLOCK',
            'EXECUTION_PLANNING',
            { reason: 'No ready nodes but execution not complete' }
          );
        }
        break;
      }
      
      batches.push({
        batch_index: batches.length,
        node_ids: readyNodes,
        can_execute_parallel: this._canExecuteParallel(readyNodes, nodes, executionGraph)
      });
      
      // Mark as completed for planning purposes
      for (const nodeId of readyNodes) {
        completedNodes.add(nodeId);
      }
    }
    
    return batches;
  }

  /**
   * Check if nodes can execute in parallel
   * @param {Array} nodeIds - Node IDs
   * @param {Object} nodes - Node definitions
   * @param {Object} executionGraph - Execution graph
   * @returns {boolean} Can execute parallel
   */
  _canExecuteParallel(nodeIds, nodes, executionGraph) {
    // Check if any nodes have dependencies on each other
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      if (node.dependencies) {
        for (const dep of node.dependencies) {
          if (nodeIds.includes(dep)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Estimate parallelism
   * @param {Array} batches - Parallel batches
   * @returns {Object} Parallelism estimate
   */
  _estimateParallelism(batches) {
    const maxParallel = Math.max(...batches.map(b => b.node_ids.length));
    const avgParallel = batches.reduce((sum, b) => sum + b.node_ids.length, 0) / batches.length;
    
    return {
      max_parallel: maxParallel,
      average_parallel: avgParallel,
      total_batches: batches.length
    };
  }

  /**
   * Detect potential deadlocks
   * @param {Object} executionGraph - Execution graph
   * @returns {Object} Deadlock detection result
   */
  detectDeadlocks(executionGraph) {
    const nodes = executionGraph.nodes;
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
      has_deadlock: cycles.length > 0,
      cycles: cycles
    };
  }

  /**
   * Detect cycle in dependency graph
   * @param {string} nodeId - Node ID
   * @param {Object} nodes - Node definitions
   * @param {Set} visited - Visited nodes
   * @param {Set} recursionStack - Recursion stack
   * @param {Array} path - Current path
   * @returns {Array|null} Cycle path
   */
  _detectCycle(nodeId, nodes, visited, recursionStack, path) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const node = nodes[nodeId];
    if (node.dependencies) {
      for (const dep of node.dependencies) {
        if (!visited.has(dep)) {
          const cycle = this._detectCycle(dep, nodes, visited, recursionStack, path);
          if (cycle) {
            return cycle;
          }
        } else if (recursionStack.has(dep)) {
          // Found cycle
          const cycleStart = path.indexOf(dep);
          return path.slice(cycleStart);
        }
      }
    }
    
    recursionStack.delete(nodeId);
    path.pop();
    return null;
  }

  /**
   * Validate execution graph structure
   * @param {Object} executionGraph - Execution graph
   * @returns {Object} Validation result
   */
  validateGraph(executionGraph) {
    const requiredFields = ['graph_version', 'constitutional_version', 'nodes', 'execution_order'];
    const missingFields = requiredFields.filter(field => !executionGraph[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing fields: ${missingFields.join(', ')}`
      };
    }
    
    // Check for deadlocks
    const deadlockCheck = this.detectDeadlocks(executionGraph);
    if (deadlockCheck.has_deadlock) {
      return {
        valid: false,
        reason: 'Graph contains dependency cycles',
        cycles: deadlockCheck.cycles
      };
    }
    
    return {
      valid: true,
      reason: 'Graph structure valid'
    };
  }
}

// Singleton instance
const executionPlanner = new ExecutionPlanner();

module.exports = {
  ExecutionPlanner,
  executionPlanner,
};
