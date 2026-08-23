/**
 * Knowledge Graph
 * 
 * Milestone 6 — Knowledge Graph
 * 
 * Constitutional Constraint: Construct deterministic graph roots.
 * 
 * Verify:
 * - Node IDs
 * - Edge IDs
 * - Topology Hash
 * - Graph Root
 * 
 * Running twice must produce identical graph roots.
 */

const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

/**
 * Knowledge Graph Object
 * 
 * Constitutional representation of the knowledge graph
 */
class KnowledgeGraphObject {
  constructor(nodes, edges) {
    this._nodes = nodes;
    this._edges = edges;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional knowledge graph object
   * @returns {Object} Constitutional knowledge graph object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Sort nodes deterministically
    const sortedNodes = [...this._nodes].sort((a, b) => a.id.localeCompare(b.id));

    // Sort edges deterministically
    const sortedEdges = [...this._edges].sort((a, b) => {
      if (a.payload.source_id !== b.payload.source_id) return a.payload.source_id.localeCompare(b.payload.source_id);
      if (a.payload.target_id !== b.payload.target_id) return a.payload.target_id.localeCompare(b.payload.target_id);
      return a.payload.edge_type.localeCompare(b.payload.edge_type);
    });

    // Extract canonical fields
    const canonicalData = {
      node_count: sortedNodes.length,
      edge_count: sortedEdges.length,
      nodes: sortedNodes.map(node => ({
        id: node.id,
        kind: node.kind,
        name: node.payload.name || null,
      })),
      edges: sortedEdges.map(edge => ({
        id: edge.id,
        source_id: edge.payload.source_id,
        target_id: edge.payload.target_id,
        edge_type: edge.payload.edge_type,
      })),
      topology_hash: this._calculateTopologyHash(sortedNodes, sortedEdges),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'KnowledgeGraph');

    // Build lineage
    this._lineage = {
      source_id: null,
      derivation_path: ['RelationshipRuntime', 'KnowledgeGraph'],
      provenance_chain: [...sortedNodes.map(n => n.id), ...sortedEdges.map(e => e.id)],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'KnowledgeGraph',
      authority: 'KnowledgeGraphRuntime',
      identity: {
        namespace: 'graph',
        version: 'v1',
        created_at: timestamp,
        created_by: 'KnowledgeGraphRuntime',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        ...sortedNodes.map(node => ({
          target_id: node.id,
          relation_type: 'contains',
          strength: 1.0,
          metadata: { kind: 'node' },
        })),
        ...sortedEdges.map(edge => ({
          target_id: edge.id,
          relation_type: 'contains',
          strength: 1.0,
          metadata: { kind: 'edge' },
        })),
      ],
      metadata: {
        node_count: sortedNodes.length,
        edge_count: sortedEdges.length,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }

  /**
   * Calculate topology hash
   * @param {Array} nodes - Sorted nodes
   * @param {Array} edges - Sorted edges
   * @returns {string} Topology hash
   */
  _calculateTopologyHash(nodes, edges) {
    // Build adjacency representation
    const adjacency = {};
    
    for (const node of nodes) {
      adjacency[node.id] = {
        kind: node.kind,
        neighbors: [],
      };
    }

    for (const edge of edges) {
      if (adjacency[edge.payload.source_id]) {
        adjacency[edge.payload.source_id].neighbors.push({
          target: edge.payload.target_id,
          type: edge.payload.edge_type,
        });
      }
    }

    // Sort neighbors deterministically
    for (const nodeId in adjacency) {
      adjacency[nodeId].neighbors.sort((a, b) => {
        if (a.target !== b.target) return a.target.localeCompare(b.target);
        return a.type.localeCompare(b.type);
      });
    }

    // Serialize adjacency deterministically
    const topologyData = {
      nodes: Object.keys(adjacency).sort().map(nodeId => ({
        id: nodeId,
        kind: adjacency[nodeId].kind,
        neighbors: adjacency[nodeId].neighbors,
      })),
    };

    return CanonicalAuthority.hash(CanonicalBytes.serialize(topologyData));
  }
}

/**
 * Knowledge Graph Runtime
 * 
 * Constructs deterministic knowledge graphs from nodes and edges
 */
class KnowledgeGraphRuntime {
  constructor() {
    this._namespace = 'graph';
    this._version = '1.0.0';
  }

  /**
   * Construct knowledge graph from knowledge objects and relationship edges
   * 
   * @param {Object} knowledgeObjects - Knowledge objects
   * @param {Object} relationshipProposal - Relationship proposal with edges
   * @returns {Object} Knowledge graph object
   */
  construct(knowledgeObjects, relationshipProposal) {
    // Collect all nodes from knowledge objects
    const nodes = [
      ...knowledgeObjects.functions,
      ...knowledgeObjects.classes,
      ...knowledgeObjects.interfaces,
      ...knowledgeObjects.apis,
      ...knowledgeObjects.dependencies,
      ...knowledgeObjects.concepts,
    ];

    // Collect all edges from relationship proposal
    const edges = relationshipProposal.edges;

    // Build knowledge graph
    const graphBuilder = new KnowledgeGraphObject(nodes, edges);
    const graphObject = graphBuilder.build();

    // Verify graph
    const graphVerification = constitutionalVerificationAuthority.verifyArtifact(graphObject);
    if (!graphVerification.valid) {
      throw new Error(`KnowledgeGraph verification failed: ${graphVerification.reason}`);
    }

    return graphObject;
  }

  /**
   * Verify graph determinism
   * 
   * @param {Object} graph1 - First graph
   * @param {Object} graph2 - Second graph
   * @returns {Object} Verification result
   */
  verifyDeterminism(graph1, graph2) {
    const results = {
      nodeIdsIdentical: true,
      edgeIdsIdentical: true,
      topologyHashIdentical: true,
      graphRootIdentical: true,
    };

    // Compare node IDs
    const nodes1 = graph1.payload.nodes.map(n => n.id).sort();
    const nodes2 = graph2.payload.nodes.map(n => n.id).sort();
    if (JSON.stringify(nodes1) !== JSON.stringify(nodes2)) {
      results.nodeIdsIdentical = false;
    }

    // Compare edge IDs
    const edges1 = graph1.payload.edges.map(e => e.id).sort();
    const edges2 = graph2.payload.edges.map(e => e.id).sort();
    if (JSON.stringify(edges1) !== JSON.stringify(edges2)) {
      results.edgeIdsIdentical = false;
    }

    // Compare topology hash
    if (graph1.payload.topology_hash !== graph2.payload.topology_hash) {
      results.topologyHashIdentical = false;
    }

    // Compare graph root (canonical hash)
    if (graph1.canonical_hash !== graph2.canonical_hash) {
      results.graphRootIdentical = false;
    }

    results.passed = results.nodeIdsIdentical && results.edgeIdsIdentical && 
                    results.topologyHashIdentical && results.graphRootIdentical;

    return results;
  }
}

module.exports = {
  KnowledgeGraphObject,
  KnowledgeGraphRuntime,
};
