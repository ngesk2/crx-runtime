/**
 * Canonical Graph Compiler
 * 
 * Ω.57 — Canonical Graph Compiler
 * 
 * Instead of each graph compiler independently generating nodes and hashes,
 * they should emit:
 * 
 * GraphNode
 * GraphEdge
 * GraphRoot
 * 
 * through one constitutional compiler.
 * 
 * Then:
 * 
 * CallGraph
 * ImportGraph
 * TypeGraph
 * MissionGraph
 * ReflectionGraph
 * 
 * become merely graph specifications.
 * Not separate graph implementations.
 * 
 * Constitutional Constraint: All graphs emit identical constitutional nodes through single compiler.
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');

class CanonicalGraphCompiler {
  constructor(postgresPool, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._nodeCache = new Map(); // node_id → GraphNode
    this._edgeCache = new Map(); // edge_id → GraphEdge
    this._graphCache = new Map(); // graph_id → GraphRoot
    this._initialized = false;
  }

  /**
   * Initialize canonical graph compiler
   */
  async initialize() {
    await this._loadNodeCache();
    await this._loadEdgeCache();
    await this._loadGraphCache();
    this._initialized = true;
    console.log('[CanonicalGraphCompiler] Initialized with', this._nodeCache.size, 'nodes,', this._edgeCache.size, 'edges,', this._graphCache.size, 'graphs');
  }

  /**
   * Create GraphNode
   * 
   * Schema: { id: string, kind: string, canonical_name: string, properties: Object }
   * 
   * Constitutional Constraint: Nodes are canonical and language-independent.
   * GraphNode is a constitutional object with kind, authority, lineage, payload, canonical_hash.
   */
  async createGraphNode(nodeSpec) {
    const nodeId = `node-${CanonicalAuthority.hash({
      kind: nodeSpec.kind,
      canonical_name: nodeSpec.canonical_name,
      properties: nodeSpec.properties,
    })}`;

    const graphNode = {
      id: nodeId,
      kind: 'GraphNode',
      canonical_hash: CanonicalAuthority.hash({
        kind: nodeSpec.kind,
        canonical_name: nodeSpec.canonical_name,
        properties: nodeSpec.properties,
      }),
      payload: {
        kind: nodeSpec.kind,
        canonical_name: nodeSpec.canonical_name,
        properties: this._canonicalizeProperties(nodeSpec.properties),
      },
      authority: 'CanonicalGraphCompiler',
      lineage: {
        source_id: nodeSpec.source_id || null,
        source_kind: nodeSpec.source_kind || 'GraphSpecification',
      },
      relationships: [],
      metadata: {
        schema_version: '1.0.0',
        graph_type: nodeSpec.graph_type || 'unknown',
      },
    };

    // Register node
    await this._objectRegistry.register(graphNode);
    this._nodeCache.set(nodeId, graphNode);
    await this._persistNode(graphNode);

    return graphNode;
  }

  /**
   * Create GraphEdge
   * 
   * Schema: { source_id: string, target_id: string, relation: string, properties: Object }
   * 
   * Constitutional Constraint: Edges are canonical and language-independent.
   * GraphEdge is a constitutional object with kind, authority, lineage, payload, canonical_hash.
   */
  async createGraphEdge(edgeSpec) {
    const edgeId = `edge-${CanonicalAuthority.hash({
      source_id: edgeSpec.source_id,
      target_id: edgeSpec.target_id,
      relation: edgeSpec.relation,
      properties: edgeSpec.properties,
    })}`;

    const graphEdge = {
      id: edgeId,
      kind: 'GraphEdge',
      canonical_hash: CanonicalAuthority.hash({
        source_id: edgeSpec.source_id,
        target_id: edgeSpec.target_id,
        relation: edgeSpec.relation,
        properties: edgeSpec.properties,
      }),
      payload: {
        source_id: edgeSpec.source_id,
        target_id: edgeSpec.target_id,
        relation: edgeSpec.relation,
        properties: this._canonicalizeProperties(edgeSpec.properties),
      },
      authority: 'CanonicalGraphCompiler',
      lineage: {
        source_id: edgeSpec.source_id || null,
        source_kind: 'GraphSpecification',
      },
      relationships: [
        {
          target_id: edgeSpec.source_id,
          relation: 'from',
        },
        {
          target_id: edgeSpec.target_id,
          relation: 'to',
        },
      ],
      metadata: {
        schema_version: '1.0.0',
        graph_type: edgeSpec.graph_type || 'unknown',
      },
    };

    // Register edge
    await this._objectRegistry.register(graphEdge);
    this._edgeCache.set(edgeId, graphEdge);
    await this._persistEdge(graphEdge);

    return graphEdge;
  }

  /**
   * Create GraphRoot
   * 
   * Schema: { graph_type: string, node_ids: Array<string>, edge_ids: Array<string> }
   * 
   * Constitutional Constraint: Graph roots use Merkle tree over canonical nodes and edges.
   * GraphRoot is a constitutional object with kind, authority, lineage, payload, canonical_hash.
   */
  async createGraphRoot(graphSpec) {
    const graphId = `graph-${CanonicalAuthority.hash({
      graph_type: graphSpec.graph_type,
      node_ids: graphSpec.node_ids,
      edge_ids: graphSpec.edge_ids,
    })}`;

    // Canonicalize node and edge IDs (sorted for determinism)
    const sortedNodeIds = [...graphSpec.node_ids].sort();
    const sortedEdgeIds = [...graphSpec.edge_ids].sort();

    // Compute Merkle root over nodes
    const nodeRoot = this._computeMerkleRoot(sortedNodeIds);

    // Compute Merkle root over edges
    const edgeRoot = this._computeMerkleRoot(sortedEdgeIds);

    // Compute overall graph root
    const graphRoot = CanonicalAuthority.hash({
      graph_type: graphSpec.graph_type,
      node_root: nodeRoot,
      edge_root: edgeRoot,
      node_count: sortedNodeIds.length,
      edge_count: sortedEdgeIds.length,
    });

    const graphRootObject = {
      id: graphId,
      kind: 'GraphRoot',
      canonical_hash: graphRoot,
      payload: {
        graph_type: graphSpec.graph_type,
        node_ids: sortedNodeIds,
        edge_ids: sortedEdgeIds,
        node_root: nodeRoot,
        edge_root: edgeRoot,
        node_count: sortedNodeIds.length,
        edge_count: sortedEdgeIds.length,
        graph_root: graphRoot,
      },
      authority: 'CanonicalGraphCompiler',
      lineage: {
        source_id: graphSpec.source_id || null,
        source_kind: graphSpec.source_kind || 'GraphSpecification',
      },
      relationships: [],
      metadata: {
        schema_version: '1.0.0',
        graph_type: graphSpec.graph_type || 'unknown',
      },
    };

    // Register graph root
    await this._objectRegistry.register(graphRootObject);
    this._graphCache.set(graphId, graphRootObject);
    await this._persistGraph(graphRootObject);

    return graphRootObject;
  }

  /**
   * Canonicalize properties
   * 
   * Convert Maps/Sets to sorted arrays for deterministic serialization.
   */
  _canonicalizeProperties(properties) {
    if (!properties) {
      return {};
    }

    const canonical = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value instanceof Map) {
        // Convert Map to sorted array of entries
        const entries = Array.from(value.entries()).sort((a, b) => 
          String(a[0]).localeCompare(String(b[0]))
        );
        canonical[key] = entries;
      } else if (value instanceof Set) {
        // Convert Set to sorted array
        canonical[key] = Array.from(value).sort();
      } else if (typeof value === 'object' && value !== null) {
        // Recursively canonicalize nested objects
        canonical[key] = this._canonicalizeProperties(value);
      } else {
        canonical[key] = value;
      }
    }

    // Sort keys for deterministic serialization
    const sortedCanonical = {};
    const sortedKeys = Object.keys(canonical).sort();
    for (const key of sortedKeys) {
      sortedCanonical[key] = canonical[key];
    }

    return sortedCanonical;
  }

  /**
   * Compute Merkle root over array of hashes
   * 
   * Constitutional Constraint: Merkle tree ensures deterministic graph roots.
   */
  _computeMerkleRoot(ids) {
    if (ids.length === 0) {
      return null;
    }

    if (ids.length === 1) {
      return ids[0];
    }

    // Build Merkle tree
    let level = ids;
    while (level.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          // Hash pair
          const pairHash = CanonicalAuthority.hash({
            left: level[i],
            right: level[i + 1],
          });
          nextLevel.push(pairHash);
        } else {
          // Odd number, carry forward
          nextLevel.push(level[i]);
        }
      }
      
      level = nextLevel;
    }

    return level[0];
  }

  /**
   * Compile graph from specification
   * 
   * Graph specification format:
   * {
   *   graph_type: string,
   *   nodes: Array<{ kind, canonical_name, properties }>,
   *   edges: Array<{ source_id, target_id, relation, properties }>
   * }
   */
  async compileGraph(graphSpec) {
    const nodeIds = [];
    const edgeIds = [];

    // Create nodes
    for (const nodeSpec of graphSpec.nodes) {
      const node = await this.createGraphNode({
        ...nodeSpec,
        graph_type: graphSpec.graph_type,
      });
      nodeIds.push(node.id);
    }

    // Create edges
    for (const edgeSpec of graphSpec.edges) {
      const edge = await this.createGraphEdge({
        ...edgeSpec,
        graph_type: graphSpec.graph_type,
      });
      edgeIds.push(edge.id);
    }

    // Create graph root
    const graphRoot = await this.createGraphRoot({
      graph_type: graphSpec.graph_type,
      node_ids: nodeIds,
      edge_ids: edgeIds,
      source_id: graphSpec.source_id,
    });

    return graphRoot;
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    return this._nodeCache.get(nodeId);
  }

  /**
   * Get edge by ID
   */
  getEdge(edgeId) {
    return this._edgeCache.get(edgeId);
  }

  /**
   * Get graph root by ID
   */
  getGraph(graphId) {
    return this._graphCache.get(graphId);
  }

  /**
   * Get graphs by type
   */
  getGraphsByType(graphType) {
    return Array.from(this._graphCache.values()).filter(g => g.payload.graph_type === graphType);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this._nodeCache.values());
  }

  /**
   * Get all edges
   */
  getAllEdges() {
    return Array.from(this._edgeCache.values());
  }

  /**
   * Get all graphs
   */
  getAllGraphs() {
    return Array.from(this._graphCache.values());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const graphs = Array.from(this._graphCache.values());
    
    const stats = {
      total_graphs: graphs.length,
      total_nodes: this._nodeCache.size,
      total_edges: this._edgeCache.size,
      by_graph_type: {},
      average_nodes_per_graph: 0,
      average_edges_per_graph: 0,
    };

    let totalNodes = 0;
    let totalEdges = 0;

    for (const graph of graphs) {
      const graphType = graph.payload.graph_type || 'unknown';
      stats.by_graph_type[graphType] = (stats.by_graph_type[graphType] || 0) + 1;
      
      totalNodes += graph.payload.node_count;
      totalEdges += graph.payload.edge_count;
    }

    if (graphs.length > 0) {
      stats.average_nodes_per_graph = totalNodes / graphs.length;
      stats.average_edges_per_graph = totalEdges / graphs.length;
    }

    return stats;
  }

  /**
   * Persist node
   */
  async _persistNode(graphNode) {
    try {
      await this._postgres.query(`
        INSERT INTO graph_nodes (node_id, node_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (node_id) DO UPDATE SET
          node_data = $2,
          updated_at = NOW()
      `, [graphNode.id, JSON.stringify(graphNode)]);
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to persist node:', error.message);
    }
  }

  /**
   * Persist edge
   */
  async _persistEdge(graphEdge) {
    try {
      await this._postgres.query(`
        INSERT INTO graph_edges (edge_id, edge_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (edge_id) DO UPDATE SET
          edge_data = $2,
          updated_at = NOW()
      `, [graphEdge.id, JSON.stringify(graphEdge)]);
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to persist edge:', error.message);
    }
  }

  /**
   * Persist graph
   */
  async _persistGraph(graphRoot) {
    try {
      await this._postgres.query(`
        INSERT INTO graph_roots (graph_id, graph_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (graph_id) DO UPDATE SET
          graph_data = $2,
          updated_at = NOW()
      `, [graphRoot.id, JSON.stringify(graphRoot)]);
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to persist graph:', error.message);
    }
  }

  /**
   * Load node cache
   */
  async _loadNodeCache() {
    try {
      const result = await this._postgres.query(`
        SELECT node_id, node_data
        FROM graph_nodes
        ORDER BY node_id
        LIMIT 100000
      `);

      for (const row of result.rows) {
        this._nodeCache.set(row.node_id, row.node_data);
      }
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to load node cache:', error.message);
    }
  }

  /**
   * Load edge cache
   */
  async _loadEdgeCache() {
    try {
      const result = await this._postgres.query(`
        SELECT edge_id, edge_data
        FROM graph_edges
        ORDER BY edge_id
        LIMIT 100000
      `);

      for (const row of result.rows) {
        this._edgeCache.set(row.edge_id, row.edge_data);
      }
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to load edge cache:', error.message);
    }
  }

  /**
   * Load graph cache
   */
  async _loadGraphCache() {
    try {
      const result = await this._postgres.query(`
        SELECT graph_id, graph_data
        FROM graph_roots
        ORDER BY graph_id
        LIMIT 10000
      `);

      for (const row of result.rows) {
        this._graphCache.set(row.graph_id, row.graph_data);
      }
    } catch (error) {
      console.error('[CanonicalGraphCompiler] Failed to load graph cache:', error.message);
    }
  }

  /**
   * Clear caches (memory only)
   */
  clearNodeCache() {
    this._nodeCache.clear();
  }

  clearEdgeCache() {
    this._edgeCache.clear();
  }

  clearGraphCache() {
    this._graphCache.clear();
  }
}

module.exports = { CanonicalGraphCompiler };
