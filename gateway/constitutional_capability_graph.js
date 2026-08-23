/**
 * Constitutional Capability Graph
 * 
 * Ω.96.2 — Constitutional Capability Graph
 * 
 * Authorities should not know each other.
 * Dependencies become graph edges instead of imports.
 * 
 * Example:
 * Replay Authority produces ReplayEvidence
 * ↓
 * Capability Graph
 * ↓
 * Policy Engine
 * ↓
 * Runtime
 * ↓
 * Witness Authority
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalCapabilityGraph {
  constructor(postgresPool, authorityRegistry) {
    this._postgres = postgresPool;
    this._authorityRegistry = authorityRegistry;
    this._nodes = new Map(); // authority_id → node
    this._edges = new Map(); // edge_id → edge
  }

  /**
   * Initialize capability graph
   */
  async initialize() {
    console.log('[CapabilityGraph] Initializing constitutional capability graph');

    // Build graph from authority registry
    await this._buildGraph();

    console.log('[CapabilityGraph] Constitutional capability graph initialized');
  }

  /**
   * Build capability graph from authority registry
   */
  async _buildGraph() {
    const descriptors = this._authorityRegistry.getAllDescriptors();

    // Create nodes for each authority
    for (const descriptor of descriptors) {
      const node = {
        node_id: descriptor.authority_id,
        node_type: 'authority',
        authority_id: descriptor.authority_id,
        name: descriptor.name,
        version: descriptor.version,
        capabilities: descriptor.capabilities,
        required_inputs: descriptor.required_inputs,
        produced_artifacts: descriptor.produced_artifacts,
        metadata: {
          description: descriptor.description,
          implementation_module: descriptor.implementation_module,
        },
      };

      this._nodes.set(descriptor.authority_id, node);
    }

    // Create edges for dependencies
    for (const descriptor of descriptors) {
      for (const depId of descriptor.dependencies) {
        const edgeId = deterministicIdAuthority.generateIdFromObject({
          from: depId,
          to: descriptor.authority_id,
          type: 'dependency',
        });

        const edge = {
          edge_id: edgeId,
          edge_type: 'dependency',
          from: depId,
          to: descriptor.authority_id,
          created_at: constitutionalTimeAuthority.now(),
        };

        this._edges.set(edgeId, edge);
      }
    }

    // Create edges for artifact flow
    for (const descriptor of descriptors) {
      for (const artifactType of descriptor.produced_artifacts) {
        // Find authorities that require this artifact
        const consumers = descriptors.filter(d => 
          d.required_inputs.includes(artifactType) && d.authority_id !== descriptor.authority_id
        );

        for (const consumer of consumers) {
          const edgeId = deterministicIdAuthority.generateIdFromObject({
            from: descriptor.authority_id,
            to: consumer.authority_id,
            type: 'artifact_flow',
            artifact: artifactType,
          });

          const edge = {
            edge_id: edgeId,
            edge_type: 'artifact_flow',
            from: descriptor.authority_id,
            to: consumer.authority_id,
            artifact: artifactType,
            created_at: constitutionalTimeAuthority.now(),
          };

          this._edges.set(edgeId, edge);
        }
      }
    }

    console.log(`[CapabilityGraph] Built graph with ${this._nodes.size} nodes and ${this._edges.size} edges`);
  }

  /**
   * Get node
   * 
   * @param {string} nodeId - Node identifier
   * @returns {Object} Node
   */
  getNode(nodeId) {
    return this._nodes.get(nodeId);
  }

  /**
   * Get all nodes
   * 
   * @returns {Array} Nodes
   */
  getAllNodes() {
    return Array.from(this._nodes.values());
  }

  /**
   * Get edges
   * 
   * @param {string} from - From node
   * @param {string} to - To node
   * @returns {Array} Edges
   */
  getEdges(from, to) {
    return Array.from(this._edges.values())
      .filter(edge => {
        if (from && edge.from !== from) return false;
        if (to && edge.to !== to) return false;
        return true;
      });
  }

  /**
   * Get all edges
   * 
   * @returns {Array} Edges
   */
  getAllEdges() {
    return Array.from(this._edges.values());
  }

  /**
   * Get authorities by capability
   * 
   * @param {string} capability - Capability name
   * @returns {Array} Authorities with capability
   */
  getAuthoritiesByCapability(capability) {
    return Array.from(this._nodes.values())
      .filter(node => node.capabilities.includes(capability));
  }

  /**
   * Get authorities that produce artifact
   * 
   * @param {string} artifactType - Artifact type
   * @returns {Array} Authorities that produce artifact
   */
  getAuthoritiesByProducedArtifact(artifactType) {
    return Array.from(this._nodes.values())
      .filter(node => node.produced_artifacts.includes(artifactType));
  }

  /**
   * Get authorities that require artifact
   * 
   * @param {string} artifactType - Artifact type
   * @returns {Array} Authorities that require artifact
   */
  getAuthoritiesByRequiredArtifact(artifactType) {
    return Array.from(this._nodes.values())
      .filter(node => node.required_inputs.includes(artifactType));
  }

  /**
   * Get artifact flow path
   * 
   * @param {string} fromAuthority - From authority
   * @param {string} toAuthority - To authority
   * @returns {Array} Path of authorities
   */
  getArtifactFlowPath(fromAuthority, toAuthority) {
    const visited = new Set();
    const path = [];

    const bfs = (currentId, targetId, currentPath) => {
      if (currentId === targetId) {
        path.push(...currentPath);
        return true;
      }

      if (visited.has(currentId)) {
        return false;
      }

      visited.add(currentId);

      const outgoingEdges = this.getEdges(currentId, null)
        .filter(edge => edge.edge_type === 'artifact_flow');

      for (const edge of outgoingEdges) {
        if (bfs(edge.to, targetId, [...currentPath, edge.to])) {
          return true;
        }
      }

      return false;
    };

    bfs(fromAuthority, toAuthority, [fromAuthority]);
    return path;
  }

  /**
   * Get dependency chain
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Array} Dependency chain
   */
  getDependencyChain(authorityId) {
    const chain = [];
    const visited = new Set();

    const traverse = (id) => {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);

      const incomingEdges = this.getEdges(null, id)
        .filter(edge => edge.edge_type === 'dependency');

      for (const edge of incomingEdges) {
        traverse(edge.from);
      }

      chain.push(id);
    };

    traverse(authorityId);
    return chain;
  }

  /**
   * Get reverse dependency chain (dependents)
   * 
   * @param {string} authorityId - Authority identifier
   * @returns {Array} Dependent authorities
   */
  getDependents(authorityId) {
    const dependents = [];

    const outgoingEdges = this.getEdges(authorityId, null)
      .filter(edge => edge.edge_type === 'dependency');

    for (const edge of outgoingEdges) {
      dependents.push(edge.to);
    }

    return dependents;
  }

  /**
   * Find execution path for mission
   * 
   * @param {Object} mission - Mission specification
   * @returns {Array} Execution path
   */
  findExecutionPath(mission) {
    // Start with authorities that can handle the mission
    const startAuthorities = this.getAuthoritiesByCapability('handle_mission');

    if (startAuthorities.length === 0) {
      return [];
    }

    // Build execution path by following artifact flow
    const path = [];
    const visited = new Set();

    const traverse = (authorityId) => {
      if (visited.has(authorityId)) {
        return;
      }
      visited.add(authorityId);

      path.push(authorityId);

      const outgoingEdges = this.getEdges(authorityId, null)
        .filter(edge => edge.edge_type === 'artifact_flow');

      for (const edge of outgoingEdges) {
        traverse(edge.to);
      }
    };

    for (const authority of startAuthorities) {
      traverse(authority.node_id);
    }

    return path;
  }

  /**
   * Validate graph integrity
   * 
   * @returns {Object} Validation result
   */
  validateGraph() {
    const errors = [];

    // Check for cycles
    const visited = new Set();
    const visiting = new Set();

    const checkCycle = (nodeId) => {
      if (visiting.has(nodeId)) {
        errors.push(`Cycle detected at node ${nodeId}`);
        return;
      }
      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      const outgoingEdges = this.getEdges(nodeId, null);
      for (const edge of outgoingEdges) {
        checkCycle(edge.to);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    for (const nodeId of this._nodes.keys()) {
      checkCycle(nodeId);
    }

    // Check that all edges reference valid nodes
    for (const edge of this._edges.values()) {
      if (!this._nodes.has(edge.from)) {
        errors.push(`Edge references non-existent from node: ${edge.from}`);
      }
      if (!this._nodes.has(edge.to)) {
        errors.push(`Edge references non-existent to node: ${edge.to}`);
      }
    }

    // Check that all dependencies are satisfied
    for (const node of this._nodes.values()) {
      for (const input of node.required_inputs) {
        const producers = this.getAuthoritiesByProducedArtifact(input);
        if (producers.length === 0) {
          errors.push(`No authority produces required artifact: ${input} for ${node.authority_id}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Get graph statistics
   */
  getStatistics() {
    const byCapability = {};
    const byArtifactProduced = {};
    const byArtifactRequired = {};

    for (const node of this._nodes.values()) {
      for (const capability of node.capabilities) {
        byCapability[capability] = (byCapability[capability] || 0) + 1;
      }
      for (const artifact of node.produced_artifacts) {
        byArtifactProduced[artifact] = (byArtifactProduced[artifact] || 0) + 1;
      }
      for (const artifact of node.required_inputs) {
        byArtifactRequired[artifact] = (byArtifactRequired[artifact] || 0) + 1;
      }
    }

    const edgeTypes = {};
    for (const edge of this._edges.values()) {
      edgeTypes[edge.edge_type] = (edgeTypes[edge.edge_type] || 0) + 1;
    }

    return {
      total_nodes: this._nodes.size,
      total_edges: this._edges.size,
      by_capability: byCapability,
      by_artifact_produced: byArtifactProduced,
      by_artifact_required: byArtifactRequired,
      edge_types: edgeTypes,
    };
  }
}

module.exports = { ConstitutionalCapabilityGraph };
