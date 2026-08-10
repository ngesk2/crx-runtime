const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');
const { StandardEventSchema } = require('../ping-runtime/events/standard_event_schema');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

/**
 * Execution Graph Authority
 * 
 * Phase 9.2 — Execution Graph Authority
 * 
 * Dependency graph becomes constitutional authority with ExecutionGraphWitness and Constitutional Hash.
 * 
 * Structural changes to execution order automatically become constitutional version changes.
 * 
 * Architecture:
 * ExecutionGraphAuthority
 *         ↓
 * Execution Graph
 *         ↓
 * ExecutionGraphWitness
 *         ↓
 * Constitutional Hash
 * 
 * Any structural change (e.g., introducing caching, branching, new dependency edges)
 * automatically becomes a constitutional version change.
 */

class ExecutionGraphAuthority {
  constructor(options = {}) {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._constitutionVersionAuthority = constitutionVersionAuthority;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '9.0.0';
    this._executionGraphs = new Map();
    this._currentGraph = null;
    this._defaultGraphPath = options.defaultGraphPath;
    // Phase 36 PATCH 4: Event sourcing support
    this._eventPort = options.eventPort;
    this._graphAggregateId = options.graphAggregateId || 'execution_graph';
  }

  /**
   * Load execution graph from event stream
   * Phase 36 PATCH 4: Event-sourced graph loading
   * Phase 36 Architectural Refinement: Remove witness ownership
   * @param {Object} graphData - Graph data (from event or initial state)
   * @returns {Object} Execution graph (without witness)
   */
  async loadExecutionGraph(graphData = null) {
    // Phase 36 PATCH 4: Event-sourced loading - no direct filesystem access
    if (!graphData) {
      throw this._failureAuthority.createFailure(
        'NO_GRAPH_DATA',
        'EXECUTION_GRAPH',
        { reason: 'Graph data must be provided for event-sourced loading' }
      );
    }

    const graph = graphData;
    
    // Phase 36 Architectural Refinement: ExecutionGraphAuthority does NOT create witnesses
    // Witness creation is delegated to WitnessAuthority via CanonicalBytes
    // Graph → CanonicalBytes → WitnessAuthority → Witness
    
    // Freeze graph
    const frozenGraph = this._freezeGraph(graph);
    
    // Store graph
    const graphId = frozenGraph.graph_metadata.hash || this._generateGraphId(frozenGraph);
    this._executionGraphs.set(graphId, frozenGraph);
    this._currentGraph = frozenGraph;
    
    // Phase 36 PATCH 4: Emit GraphLoaded event
    if (this._eventPort) {
      await this._emitGraphLoadedEvent(frozenGraph);
    }
    
    return frozenGraph;
  }

  /**
   * Emit GraphLoaded event
   * Phase 36 PATCH 4
   * @param {Object} graph - Loaded graph
   */
  async _emitGraphLoadedEvent(graph) {
    const event = StandardEventSchema.create(
      'GraphLoaded',
      this._graphAggregateId,
      'ExecutionGraph',
      {
        graph_version: graph.graph_version,
        constitutional_version: graph.constitutional_version,
        graph_hash: graph.graph_metadata.hash,
        node_count: Object.keys(graph.nodes).length
      },
      'ExecutionGraphAuthority'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Reconstruct graph from event stream
   * Phase 36 PATCH 4 Refinement: Fully reducible from events
   * @param {Array} events - Event stream
   * @returns {Object} Reconstructed graph
   */
  reconstructFromEvents(events) {
    // Phase 36 PATCH 4 Refinement: Graph is fully reducible from granular events
    // Instead of relying on GraphLoaded snapshot, we reduce from:
    // - GraphNodeAdded
    // - GraphNodeRemoved
    // - DependencyAdded
    // - DependencyRemoved
    // - ExternalNodeRegistered
    // - ExecutionOrderFrozen
    
    const graph = {
      graph_version: '1.0.0',
      constitutional_version: '4.0.0',
      nodes: {},
      execution_order: [],
      parallel_groups: [],
      external_nodes: []
    };
    
    for (const event of events) {
      switch (event.event_type) {
        case 'GraphNodeAdded':
          graph.nodes[event.payload.node_id] = event.payload.node_data;
          break;
          
        case 'GraphNodeRemoved':
          delete graph.nodes[event.payload.node_id];
          break;
          
        case 'DependencyAdded':
          if (graph.nodes[event.payload.node_id]) {
            if (!graph.nodes[event.payload.node_id].dependencies) {
              graph.nodes[event.payload.node_id].dependencies = [];
            }
            graph.nodes[event.payload.node_id].dependencies.push(event.payload.depends_on);
          }
          break;
          
        case 'DependencyRemoved':
          if (graph.nodes[event.payload.node_id] && graph.nodes[event.payload.node_id].dependencies) {
            graph.nodes[event.payload.node_id].dependencies = 
              graph.nodes[event.payload.node_id].dependencies.filter(d => d !== event.payload.depends_on);
          }
          break;
          
        case 'ExternalNodeRegistered':
          graph.external_nodes.push(event.payload.node_id);
          break;
          
        case 'ExecutionOrderFrozen':
          graph.execution_order = event.payload.execution_order;
          graph.parallel_groups = event.payload.parallel_groups || [];
          break;
          
        case 'GraphLoaded':
          // Fallback for legacy events
          if (event.payload.graph) {
            Object.assign(graph, event.payload.graph);
          }
          break;
      }
    }
    
    if (Object.keys(graph.nodes).length === 0) {
      throw this._failureAuthority.createFailure(
        'NO_GRAPH_IN_EVENTS',
        'EXECUTION_GRAPH',
        { reason: 'No graph nodes found in event stream' }
      );
    }
    
    return graph;
  }

  /**
   * Get current execution graph
   * @returns {Object} Current execution graph
   */
  getCurrentGraph() {
    if (!this._currentGraph) {
      throw this._failureAuthority.createFailure(
        'NO_CURRENT_GRAPH',
        'EXECUTION_GRAPH',
        { reason: 'No execution graph loaded' }
      );
    }
    
    return this._currentGraph;
  }

  /**
   * Get execution graph by ID
   * @param {string} graphId - Graph ID
   * @returns {Object} Execution graph
   */
  getGraph(graphId) {
    return this._executionGraphs.get(graphId);
  }

  /**
   * Verify execution graph integrity
   * @param {Object} graph - Execution graph
   * @returns {Object} Verification result
   */
  verifyGraphIntegrity(graph) {
    // Verify graph structure
    const requiredFields = ['graph_version', 'constitutional_version', 'nodes', 'execution_order'];
    const missingFields = requiredFields.filter(field => !graph[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing fields: ${missingFields.join(', ')}`
      };
    }
    
    // Verify constitutional version compatibility
    const currentVersion = this._constitutionVersionAuthority.getCurrentManifest();
    if (graph.constitutional_version !== currentVersion.versions.constitutional) {
      return {
        valid: false,
        reason: `Constitutional version mismatch: expected ${currentVersion.versions.constitutional}, got ${graph.constitutional_version}`
      };
    }
    
    // Verify graph witness
    if (graph.graph_witness) {
      const witnessVerification = this._witnessAuthority.verifyWitness(graph.graph_witness);
      if (!witnessVerification.valid) {
        return witnessVerification;
      }
    }
    
    // Verify node dependencies
    const dependencyVerification = this._verifyDependencies(graph);
    if (!dependencyVerification.valid) {
      return dependencyVerification;
    }
    
    return {
      valid: true,
      reason: 'Execution graph verified'
    };
  }

  /**
   * Verify node dependencies
   * @param {Object} graph - Execution graph
   * @returns {Object} Verification result
   */
  _verifyDependencies(graph) {
    const nodes = graph.nodes;
    const nodeIds = Object.keys(nodes);
    
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      const dependencies = node.dependencies || [];
      
      // Verify all dependencies exist
      for (const depId of dependencies) {
        if (!nodes[depId]) {
          return {
            valid: false,
            reason: `Node ${nodeId} depends on non-existent node ${depId}`
          };
        }
      }
    }
    
    // Verify no circular dependencies
    const circularCheck = this._detectCircularDependencies(graph);
    if (circularCheck.has_cycle) {
      return {
        valid: false,
        reason: `Circular dependency detected: ${circularCheck.cycle.join(' → ')}`
      };
    }
    
    return {
      valid: true,
      reason: 'Dependencies verified'
    };
  }

  /**
   * Detect circular dependencies
   * @param {Object} graph - Execution graph
   * @returns {Object} Cycle detection result
   */
  _detectCircularDependencies(graph) {
    const nodes = graph.nodes;
    const visited = new Set();
    const recursionStack = new Set();
    
    const detectCycle = (nodeId, path) => {
      if (recursionStack.has(nodeId)) {
        return { has_cycle: true, cycle: [...path, nodeId] };
      }
      
      if (visited.has(nodeId)) {
        return { has_cycle: false };
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const node = nodes[nodeId];
      const dependencies = node.dependencies || [];
      
      for (const depId of dependencies) {
        const result = detectCycle(depId, [...path, nodeId]);
        if (result.has_cycle) {
          return result;
        }
      }
      
      recursionStack.delete(nodeId);
      return { has_cycle: false };
    };
    
    for (const nodeId of Object.keys(nodes)) {
      if (!visited.has(nodeId)) {
        const result = detectCycle(nodeId, []);
        if (result.has_cycle) {
          return result;
        }
      }
    }
    
    return { has_cycle: false };
  }

  /**
   * Create execution plan from graph
   * @param {Object} graph - Execution graph
   * @param {Object} context - Execution context
   * @returns {Object} Execution plan
   */
  createExecutionPlan(graph, context = {}) {
    const planId = this._generatePlanId(graph);
    
    const plan = {
      plan_id: planId,
      graph_version: graph.graph_version,
      constitutional_version: graph.constitutional_version,
      graph_hash: graph.graph_metadata.hash,
      
      // Execution order from graph
      execution_order: graph.execution_order,
      
      // Nodes with their dependencies
      nodes: graph.nodes,
      
      // Parallel groups for optimization
      parallel_groups: graph.parallel_groups,
      
      // External nodes (never execute during constitutional replay)
      external_nodes: graph.external_nodes,
      
      // Context for execution
      context: context,
      
      // Plan metadata
      plan_metadata: {
        frozen: true,
        hash: null,
        created_by: 'ExecutionGraphAuthority'
      }
    };
    
    // Compute plan hash
    const planForHash = { ...plan };
    delete planForHash.plan_metadata.hash;
    plan.plan_metadata.hash = CanonicalAuthority.hash(planForHash);
    
    // Create plan witness
    const planWitness = this._witnessAuthority.createWitness(plan, {
      authority: 'ExecutionGraphAuthority',
      authority_version: this._authorityVersion
    });
    plan.plan_witness = planWitness;
    
    // Freeze plan
    const frozenPlan = this._freezePlan(plan);
    
    return frozenPlan;
  }

  /**
   * Get topological execution order
   * @param {Object} graph - Execution graph
   * @returns {Array} Topological order
   */
  getTopologicalOrder(graph) {
    const nodes = graph.nodes;
    const nodeIds = Object.keys(nodes);
    const inDegree = new Map();
    const adjList = new Map();
    
    // Initialize
    for (const nodeId of nodeIds) {
      inDegree.set(nodeId, 0);
      adjList.set(nodeId, []);
    }
    
    // Build adjacency list and compute in-degrees
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId];
      const dependencies = node.dependencies || [];
      
      for (const depId of dependencies) {
        adjList.get(depId).push(nodeId);
        inDegree.set(nodeId, inDegree.get(nodeId) + 1);
      }
    }
    
    // Topological sort
    const queue = [];
    for (const nodeId of nodeIds) {
      if (inDegree.get(nodeId) === 0) {
        queue.push(nodeId);
      }
    }
    
    const order = [];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      order.push(nodeId);
      
      for (const neighbor of adjList.get(nodeId)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    return order;
  }

  /**
   * Get ready nodes (nodes with all dependencies satisfied)
   * @param {Object} graph - Execution graph
   * @param {Set} completedNodes - Completed node IDs
   * @returns {Array} Ready node IDs
   */
  getReadyNodes(graph, completedNodes) {
    const nodes = graph.nodes;
    const readyNodes = [];
    
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (completedNodes.has(nodeId)) {
        continue; // Already completed
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
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }

  /**
   * Generate graph ID
   * @param {Object} graph - Execution graph
   * @returns {string} Graph ID
   */
  _generateGraphId(graph) {
    const idData = {
      graph_version: graph.graph_version,
      constitutional_version: graph.constitutional_version
    };
    const hash = CanonicalAuthority.hash(idData);
    return `exec_graph_${hash.substring(0, 16)}`;
  }

  /**
   * Generate plan ID
   * @param {Object} graph - Execution graph
   * @returns {string} Plan ID
   */
  _generatePlanId(graph) {
    const planData = {
      graph_version: graph.graph_version,
      graph_hash: graph.graph_metadata.hash,
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    };
    const hash = CanonicalAuthority.hash(planData);
    return `exec_plan_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `execution_graph_authority_v${this._authorityVersion}`;
  }

  /**
   * Deep freeze graph
   * @param {Object} graph - Execution graph
   * @returns {Object} Frozen graph
   */
  _freezeGraph(graph) {
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        obj.forEach(freeze);
        Object.freeze(obj);
        return obj;
      }

      Object.keys(obj).forEach(key => {
        freeze(obj[key]);
      });

      Object.freeze(obj);
      return obj;
    };

    return freeze(graph);
  }

  /**
   * Deep freeze plan
   * @param {Object} plan - Execution plan
   * @returns {Object} Frozen plan
   */
  _freezePlan(plan) {
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        obj.forEach(freeze);
        Object.freeze(obj);
        return obj;
      }

      Object.keys(obj).forEach(key => {
        freeze(obj[key]);
      });

      Object.freeze(obj);
      return obj;
    };

    return freeze(plan);
  }
}

// Singleton instance
const executionGraphAuthority = new ExecutionGraphAuthority();

module.exports = { ExecutionGraphAuthority, executionGraphAuthority };
