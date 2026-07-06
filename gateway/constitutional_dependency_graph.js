const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { stepRegistry } = require('./step_registry');

/**
 * Constitutional Dependency Graph
 * 
 * Phase 6.4 — Constitutional Dependency Graph
 * 
 * Replace linear replay plans with a constitutional dependency graph.
 * 
 * Current replay plan:
 * Step 1 → Step 2 → Step 3 → Step 4
 * 
 * Target replay graph:
 * Runtime Witness
 *           │
 *           ▼
 * Prompt Witness
 *           │
 *           ▼
 * Inference Witness
 *         ┌──────┴──────┐
 *         ▼             ▼
 * Streaming Witness   Tool Witnesses
 *         └──────┬──────┘
 *                ▼
 * Completion Witness
 *                ▼
 * State Witness
 * 
 * Enables:
 * - Independent witness verification
 * - Parallel replay execution
 * - Merkle subproof generation
 * - Partial replay
 * - Incremental verification
 * - Distributed replay execution
 * - Replay caching
 * - Dependency-aware scheduling
 */

class ConstitutionalDependencyGraph {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._stepRegistry = stepRegistry;
    this._graphId = this._generateGraphId();
    this._graphVersion = '6.0.0';
    this._nodes = new Map();
    this._edges = new Map();
  }

  /**
   * Create dependency graph from transcript
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Dependency graph
   */
  createGraphFromTranscript(transcript) {
    const graphId = this._generateGraphId();
    
    // Create nodes
    const nodes = this._createNodes(transcript);
    
    // Create edges (dependencies)
    const edges = this._createEdges(transcript, nodes);
    
    const graph = {
      graph_id: graphId,
      graph_version: this._graphVersion,
      transcript_id: transcript.transcript_id,
      transcript_hash: transcript.transcript_metadata.hash,
      nodes: nodes,
      edges: edges,
      graph_metadata: {
        frozen: true,
        hash: null
      }
    };
    
    // Compute graph hash
    const graphForHash = { ...graph };
    delete graphForHash.graph_metadata.hash;
    graph.graph_metadata.hash = CanonicalAuthority.hash(graphForHash);
    
    // Create graph witness
    const graphWitness = this._witnessAuthority.createWitness(graph, {
      authority: 'ConstitutionalDependencyGraph',
      authority_version: this._graphVersion
    });
    graph.graph_witness = graphWitness;
    
    // Deep freeze
    const frozenGraph = this._freezeGraph(graph);
    
    return frozenGraph;
  }

  /**
   * Create nodes from transcript
   * @param {Object} transcript - Replay transcript
   * @returns {Array} Array of nodes
   */
  _createNodes(transcript) {
    const nodes = [];
    
    // Runtime witness node
    nodes.push({
      node_id: 'runtime_witness',
      node_type: 'verify_witness',
      witness_type: 'runtime',
      dependencies: [],
      data: transcript.runtime
    });
    
    // Prompt witness node
    nodes.push({
      node_id: 'prompt_witness',
      node_type: 'verify_witness',
      witness_type: 'prompt',
      dependencies: ['runtime_witness'],
      data: transcript.prompt
    });
    
    // Inference witness node
    nodes.push({
      node_id: 'inference_witness',
      node_type: 'verify_witness',
      witness_type: 'inference',
      dependencies: ['prompt_witness'],
      data: transcript.inference
    });
    
    // Model witness node
    nodes.push({
      node_id: 'model_witness',
      node_type: 'verify_witness',
      witness_type: 'model',
      dependencies: ['inference_witness'],
      data: transcript.model
    });
    
    // Streaming witness node
    nodes.push({
      node_id: 'streaming_witness',
      node_type: 'verify_witness',
      witness_type: 'streaming',
      dependencies: ['inference_witness'],
      data: transcript.streaming
    });
    
    // Tool witness nodes
    for (let i = 0; i < transcript.tools.length; i++) {
      nodes.push({
        node_id: `tool_witness_${i}`,
        node_type: 'verify_witness',
        witness_type: 'tool',
        dependencies: ['inference_witness'],
        data: transcript.tools[i]
      });
    }
    
    // Completion witness node
    nodes.push({
      node_id: 'completion_witness',
      node_type: 'verify_witness',
      witness_type: 'completion',
      dependencies: ['streaming_witness', ...this._getToolNodeIds(transcript.tools.length)],
      data: transcript.completion
    });
    
    // State witness node
    nodes.push({
      node_id: 'state_witness',
      node_type: 'verify_witness',
      witness_type: 'state',
      dependencies: ['completion_witness'],
      data: transcript.state
    });
    
    // Relationship proof node
    nodes.push({
      node_id: 'relationship_proofs',
      node_type: 'prove_relationships',
      dependencies: ['state_witness'],
      data: transcript
    });
    
    return nodes;
  }

  /**
   * Create edges from nodes
   * @param {Object} transcript - Replay transcript
   * @param {Array} nodes - Array of nodes
   * @returns {Array} Array of edges
   */
  _createEdges(transcript, nodes) {
    const edges = [];
    
    for (const node of nodes) {
      for (const depId of node.dependencies) {
        edges.push({
          from: depId,
          to: node.node_id,
          edge_type: 'dependency'
        });
      }
    }
    
    return edges;
  }

  /**
   * Get tool node IDs
   * @param {number} count - Number of tools
   * @returns {Array} Array of tool node IDs
   */
  _getToolNodeIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      ids.push(`tool_witness_${i}`);
    }
    return ids;
  }

  /**
   * Execute dependency graph
   * @param {Object} graph - Dependency graph
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Execution result
   */
  async executeGraph(graph, transcript) {
    const executionId = this._generateExecutionId(graph, transcript);
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    
    const executionState = {
      execution_id: executionId,
      graph_id: graph.graph_id,
      transcript_id: transcript.transcript_id,
      started_at: constitutionalTimeAuthority.nowAsMillis(),
      nodes_executed: 0,
      nodes_failed: 0,
      node_results: new Map(),
      overall_success: true,
      execution_metadata: {
        executor_id: this._graphId,
        executor_version: this._graphVersion
      }
    };
    
    // Build dependency map
    const dependencyMap = this._buildDependencyMap(graph);
    const reverseDependencyMap = this._buildReverseDependencyMap(graph);
    
    // Execute nodes in topological order
    const executionOrder = this._topologicalSort(graph);
    
    for (const nodeId of executionOrder) {
      const node = graph.nodes.find(n => n.node_id === nodeId);
      
      // Check if dependencies are satisfied
      const dependenciesSatisfied = this._checkDependencies(node, executionState.node_results);
      
      if (!dependenciesSatisfied) {
        executionState.nodes_failed++;
        executionState.overall_success = false;
        executionState.node_results.set(nodeId, {
          node_id: nodeId,
          success: false,
          reason: 'Dependencies not satisfied'
        });
        continue;
      }
      
      // Execute node
      const nodeResult = await this._executeNode(node, transcript);
      
      executionState.nodes_executed++;
      executionState.node_results.set(nodeId, nodeResult);
      
      if (!nodeResult.success) {
        executionState.nodes_failed++;
        executionState.overall_success = false;
      }
    }
    
    executionState.completed_at = constitutionalTimeAuthority.nowAsMillis();
    
    // Convert node results Map to Array for serialization
    executionState.node_results = Array.from(executionState.node_results.values());
    
    // Constitutional replay witness
    const replayWitness = this._createReplayWitness(graph, transcript, executionState);
    
    return {
      operational: executionState,
      constitutional: replayWitness
    };
  }

  /**
   * Build dependency map
   * @param {Object} graph - Dependency graph
   * @returns {Map} Dependency map
   */
  _buildDependencyMap(graph) {
    const depMap = new Map();
    for (const node of graph.nodes) {
      depMap.set(node.node_id, node.dependencies);
    }
    return depMap;
  }

  /**
   * Build reverse dependency map
   * @param {Object} graph - Dependency graph
   * @returns {Map} Reverse dependency map
   */
  _buildReverseDependencyMap(graph) {
    const reverseDepMap = new Map();
    for (const edge of graph.edges) {
      if (!reverseDepMap.has(edge.from)) {
        reverseDepMap.set(edge.from, []);
      }
      reverseDepMap.get(edge.from).push(edge.to);
    }
    return reverseDepMap;
  }

  /**
   * Topological sort
   * @param {Object} graph - Dependency graph
   * @returns {Array} Topologically sorted node IDs
   */
  _topologicalSort(graph) {
    const visited = new Set();
    const temp = new Set();
    const order = [];
    
    const visit = (nodeId) => {
      if (temp.has(nodeId)) {
        throw new Error('Cycle detected in dependency graph');
      }
      if (visited.has(nodeId)) {
        return;
      }
      
      temp.add(nodeId);
      
      const node = graph.nodes.find(n => n.node_id === nodeId);
      for (const depId of node.dependencies) {
        visit(depId);
      }
      
      temp.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };
    
    for (const node of graph.nodes) {
      visit(node.node_id);
    }
    
    return order;
  }

  /**
   * Check if dependencies are satisfied
   * @param {Object} node - Node definition
   * @param {Map} nodeResults - Node results map
   * @returns {boolean} Dependencies satisfied
   */
  _checkDependencies(node, nodeResults) {
    for (const depId of node.dependencies) {
      const depResult = nodeResults.get(depId);
      if (!depResult || !depResult.success) {
        return false;
      }
    }
    return true;
  }

  /**
   * Execute single node
   * @param {Object} node - Node definition
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Node result
   */
  async _executeNode(node, transcript) {
    const step = {
      step_id: node.node_id,
      step_type: node.node_type,
      witness_type: node.witness_type,
      required: true
    };
    
    const context = { transcript };
    return await this._stepRegistry.executeStep(step, context);
  }

  /**
   * Create constitutional replay witness
   * @param {Object} graph - Dependency graph
   * @param {Object} transcript - Replay transcript
   * @param {Object} executionState - Operational execution state
   * @returns {Object} Constitutional replay witness
   */
  _createReplayWitness(graph, transcript, executionState) {
    const constitutionalData = {
      graph_id: graph.graph_id,
      graph_hash: graph.graph_metadata.hash,
      transcript_id: transcript.transcript_id,
      transcript_hash: transcript.transcript_metadata.hash,
      nodes_executed: executionState.nodes_executed,
      nodes_failed: executionState.nodes_failed,
      overall_success: executionState.overall_success,
      executor_id: this._graphId,
      executor_version: this._graphVersion
    };
    
    const witness = this._witnessAuthority.createWitness(constitutionalData, {
      authority: 'ConstitutionalDependencyGraph',
      authority_version: this._graphVersion
    });
    
    return witness;
  }

  /**
   * Get graph ID
   * @returns {string} Graph ID
   */
  getGraphId() {
    return this._graphId;
  }

  /**
   * Get graph version
   * @returns {string} Graph version
   */
  getGraphVersion() {
    return this._graphVersion;
  }

  /**
   * Generate graph ID
   * @returns {string} Graph ID
   */
  _generateGraphId() {
    const graphData = {
      graph_version: this._graphVersion,
      constitutional_version: '6.0.0'
    };
    const hash = CanonicalAuthority.hash(graphData);
    return `dependency_graph_${hash.substring(0, 16)}`;
  }

  /**
   * Generate execution ID
   * @param {Object} graph - Dependency graph
   * @param {Object} transcript - Replay transcript
   * @returns {string} Execution ID
   */
  _generateExecutionId(graph, transcript) {
    const idData = {
      graph_id: graph.graph_id,
      transcript_id: transcript.transcript_id,
      executor_version: this._graphVersion
    };
    const hash = CanonicalAuthority.hash(idData);
    return `exec_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze graph
   * @param {Object} graph - Dependency graph
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
}

// Singleton instance
const constitutionalDependencyGraph = new ConstitutionalDependencyGraph();

module.exports = { ConstitutionalDependencyGraph, constitutionalDependencyGraph };
