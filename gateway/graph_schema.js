/**
 * Graph Schema
 * 
 * Phase 21 — Declarative Graph Schema + Graph Compiler
 * 
 * Replaces hand-written DAG with declarative constitutional objects.
 * 
 * Graph Schema:
 * - Defines node types
 * - Defines node connections
 * - Defines execution constraints
 * 
 * Graph Compiler:
 * - Compiles schema to executable graph
 * - Validates graph structure
 * - Detects cycles
 * - Optimizes execution order
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');

class GraphSchema {
  constructor() {
    this._nodeTypes = new Map();
    this._connectionRules = new Map();
    this._executionConstraints = new Map();
    this._registerDefaultSchema();
  }

  /**
   * Register default schema
   */
  _registerDefaultSchema() {
    // Register node types
    this.registerNodeType('retrieve', {
      inputs: [],
      outputs: ['repository', 'memory', 'context', 'mission'],
      config: { source: 'string' }
    });

    this.registerNodeType('compress', {
      inputs: ['context'],
      outputs: ['compressed'],
      config: {}
    });

    this.registerNodeType('construct', {
      inputs: ['mission', 'context'],
      outputs: ['prompt'],
      config: {}
    });

    this.registerNodeType('generate', {
      inputs: ['prompt', 'context'],
      outputs: ['completion'],
      config: { model: 'string' }
    });

    this.registerNodeType('validate', {
      inputs: ['completion', 'repository'],
      outputs: ['validation'],
      config: {}
    });

    this.registerNodeType('test', {
      inputs: ['validation'],
      outputs: ['test'],
      config: {}
    });

    this.registerNodeType('replay', {
      inputs: ['prompt', 'completion'],
      outputs: ['replay'],
      config: {}
    });

    this.registerNodeType('approve', {
      inputs: ['validation', 'test', 'replay'],
      outputs: ['approval'],
      config: {}
    });

    this.registerNodeType('commit', {
      inputs: ['approval', 'validation'],
      outputs: ['commit'],
      config: {}
    });

    this.registerNodeType('witness', {
      inputs: ['*'],
      outputs: ['witness'],
      config: {}
    });

    this.registerNodeType('checkpoint', {
      inputs: ['*'],
      outputs: ['checkpoint'],
      config: {}
    });

    // Register connection rules
    this.registerConnectionRule('retrieve', 'compress');
    this.registerConnectionRule('compress', 'construct');
    this.registerConnectionRule('construct', 'generate');
    this.registerConnectionRule('generate', 'validate');
    this.registerConnectionRule('validate', 'test');
    this.registerConnectionRule('validate', 'replay');
    this.registerConnectionRule('test', 'approve');
    this.registerConnectionRule('replay', 'approve');
    this.registerConnectionRule('approve', 'commit');
    this.registerConnectionRule('commit', 'witness');
    this.registerConnectionRule('witness', 'checkpoint');
  }

  /**
   * Register node type
   * @param {string} nodeType - Node type
   * @param {Object} definition - Node type definition
   */
  registerNodeType(nodeType, definition) {
    this._nodeTypes.set(nodeType, definition);
  }

  /**
   * Register connection rule
   * @param {string} fromType - From node type
   * @param {string} toType - To node type
   */
  registerConnectionRule(fromType, toType) {
    if (!this._connectionRules.has(fromType)) {
      this._connectionRules.set(fromType, new Set());
    }
    this._connectionRules.get(fromType).add(toType);
  }

  /**
   * Register execution constraint
   * @param {string} constraintName - Constraint name
   * @param {Function} validator - Constraint validator
   */
  registerExecutionConstraint(constraintName, validator) {
    this._executionConstraints.set(constraintName, validator);
  }

  /**
   * Get node type definition
   * @param {string} nodeType - Node type
   * @returns {Object} Node type definition
   */
  getNodeType(nodeType) {
    return this._nodeTypes.get(nodeType);
  }

  /**
   * Check if connection is valid
   * @param {string} fromType - From node type
   * @param {string} toType - To node type
   * @returns {boolean} True if valid
   */
  isValidConnection(fromType, toType) {
    const allowed = this._connectionRules.get(fromType);
    return allowed ? allowed.has(toType) : false;
  }

  /**
   * Validate graph structure
   * @param {Object} graph - Graph
   * @returns {Object} Validation result
   */
  validateGraph(graph) {
    const errors = [];
    const warnings = [];

    // Check all node types are registered
    for (const node of graph.nodes) {
      if (!this._nodeTypes.has(node.type)) {
        errors.push(`Unknown node type: ${node.type}`);
      }
    }

    // Check connections
    for (const node of graph.nodes) {
      for (const depId of node.dependencies) {
        const depNode = graph.nodes.find(n => n.id === depId);
        if (!depNode) {
          errors.push(`Dependency not found: ${depId}`);
        } else if (!this.isValidConnection(depNode.type, node.type)) {
          warnings.push(`Unusual connection: ${depNode.type} -> ${node.type}`);
        }
      }
    }

    // Check execution constraints
    for (const [name, validator] of this._executionConstraints) {
      const result = validator(graph);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
}

class GraphCompiler {
  constructor(schema, nodeRegistry) {
    this._schema = schema;
    this._nodeRegistry = nodeRegistry;
  }

  /**
   * Compile schema to executable graph
   * @param {string} graphType - Graph type
   * @param {Object} context - Compilation context
   * @returns {Object} Compiled graph
   */
  compile(graphType, context = {}) {
    const graph = this._buildGraphFromSchema(graphType, context);
    
    // Validate graph
    const validation = this._schema.validateGraph(graph);
    if (!validation.valid) {
      throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`);
    }

    // Detect cycles
    this._detectCycles(graph);

    // Optimize execution order
    const executionOrder = this._optimizeExecutionOrder(graph);

    return {
      ...graph,
      execution_order: executionOrder,
      validation: validation
    };
  }

  /**
   * Build graph from schema
   * @param {string} graphType - Graph type
   * @param {Object} context - Compilation context
   * @returns {Object} Graph
   */
  _buildGraphFromSchema(graphType, context) {
    const graphId = this._generateGraphId(graphType, context);
    const nodes = [];
    const edges = [];

    // Build mission execution graph
    if (graphType === 'mission_execution') {
      nodes.push(
        { id: 'retrieve_mission', type: 'retrieve', config: { source: 'mission' }, dependencies: [] },
        { id: 'retrieve_repository', type: 'retrieve', config: { source: 'repository' }, dependencies: [] },
        { id: 'retrieve_memory', type: 'retrieve', config: { source: 'memory' }, dependencies: [] },
        { id: 'retrieve_context', type: 'retrieve', config: { source: 'context' }, dependencies: ['retrieve_repository', 'retrieve_memory'] },
        { id: 'compress_context', type: 'compress', config: {}, dependencies: ['retrieve_context'] },
        { id: 'construct_prompt', type: 'construct', config: {}, dependencies: ['retrieve_mission', 'compress_context'] },
        { id: 'invoke_ollama', type: 'generate', config: { model: 'llama3' }, dependencies: ['construct_prompt', 'compress_context'] },
        { id: 'validate_patch', type: 'validate', config: {}, dependencies: ['invoke_ollama', 'retrieve_repository'] },
        { id: 'run_tests', type: 'test', config: {}, dependencies: ['validate_patch'] },
        { id: 'run_replay', type: 'replay', config: {}, dependencies: ['construct_prompt', 'invoke_ollama'] },
        { id: 'request_approval', type: 'approve', config: {}, dependencies: ['validate_patch', 'run_tests', 'run_replay'] },
        { id: 'commit_changes', type: 'commit', config: {}, dependencies: ['request_approval', 'validate_patch'] },
        { id: 'create_witness', type: 'witness', config: {}, dependencies: ['commit_changes'] },
        { id: 'create_checkpoint', type: 'checkpoint', config: {}, dependencies: ['create_witness'] }
      );
    }

    return {
      graph_id: graphId,
      graph_type: graphType,
      nodes: nodes,
      edges: edges,
      context: context
    };
  }

  /**
   * Detect cycles in graph
   * @param {Object} graph - Graph
   */
  _detectCycles(graph) {
    const visited = new Set();
    const visiting = new Set();

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Cycle detected in graph involving node: ${nodeId}`);
      }

      visiting.add(nodeId);

      const node = graph.nodes.find(n => n.id === nodeId);
      for (const dep of node.dependencies) {
        visit(dep);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    for (const node of graph.nodes) {
      visit(node.id);
    }
  }

  /**
   * Optimize execution order
   * @param {Object} graph - Graph
   * @returns {Array} Optimized execution order
   */
  _optimizeExecutionOrder(graph) {
    const visited = new Set();
    const order = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = graph.nodes.find(n => n.id === nodeId);
      for (const dep of node.dependencies) {
        visit(dep);
      }

      order.push(nodeId);
    };

    for (const node of graph.nodes) {
      visit(node.id);
    }

    return order;
  }

  /**
   * Generate graph ID
   * @param {string} graphType - Graph type
   * @param {Object} context - Context
   * @returns {string} Graph ID
   */
  _generateGraphId(graphType, context) {
    const data = { graph_type: graphType, context: context, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `graph_${hash.substring(0, 16)}`;
  }
}

module.exports = { GraphSchema, GraphCompiler };
