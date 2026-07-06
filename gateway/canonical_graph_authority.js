/**
 * Canonical Graph Authority
 * 
 * Ω.68 — Canonical Graph Authority
 * 
 * Compiles GraphRoot constitutional objects from graph specifications.
 * 
 * Constitutional Constraint: Canonical Graph Authority owns GraphRoot object creation.
 * Pipeline only produces graph specifications.
 */

const { CanonicalGraphCompiler } = require('./canonical_graph_compiler');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class CanonicalGraphAuthority {
  constructor(postgresPool, objectRegistry, witnessChain, canonicalGraphCompiler) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._canonicalGraphCompiler = canonicalGraphCompiler;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._graphCache = new Map(); // graph_spec_hash → GraphRoot
    this._initialized = false;
  }

  /**
   * Initialize canonical graph authority
   */
  async initialize() {
    if (this._canonicalGraphCompiler) {
      await this._canonicalGraphCompiler.initialize();
    }
    await this._loadGraphCache();
    this._initialized = true;
    console.log('[CanonicalGraphAuthority] Initialized');
  }

  /**
   * Compile GraphRoot constitutional object from graph specification
   * 
   * @param {Object} graphSpec - Graph specification
   * @returns {Object} Wrapped GraphRoot object (constitutional + envelope)
   */
  async compile(graphSpec) {
    console.log(`[CanonicalGraphAuthority] Compiling graph: ${graphSpec.graph_type}`);

    if (!this._canonicalGraphCompiler) {
      console.warn('[CanonicalGraphAuthority] CanonicalGraphCompiler not initialized');
      return null;
    }

    try {
      // Compile graph using CanonicalGraphCompiler
      const graphRoot = await this._canonicalGraphCompiler.compileGraph(graphSpec);
      
      // Convert to constitutional GraphRoot object
      const graphRootObject = this._constitutionalObjectFactory.createGraphObject({
        graph_type: graphSpec.graph_type,
        node_ids: graphRoot.payload.node_ids,
        edge_ids: graphRoot.payload.edge_ids,
        node_root: graphRoot.payload.node_root,
        edge_root: graphRoot.payload.edge_root,
        node_count: graphRoot.payload.node_count,
        edge_count: graphRoot.payload.edge_count,
        graph_root: graphRoot.payload.graph_root,
      });

      // Wrap in operational envelope
      const operationalMetadata = this._operationalMetadataCollector.collect({
        pipeline_stage: 'graph_compiler',
        source: 'CanonicalGraphAuthority',
      });
      const envelope = OperationalEnvelope.wrap(graphRootObject, operationalMetadata);

      // Register constitutional object
      await this._objectRegistry.register(graphRootObject);

      const wrappedGraphRoot = {
        constitutional_object: graphRootObject,
        operational_envelope: envelope,
      };

      // Cache graph root
      const specHash = this._computeSpecHash(graphSpec);
      this._graphCache.set(specHash, wrappedGraphRoot);
      await this._persistGraphCache(specHash, wrappedGraphRoot);

      console.log(`[CanonicalGraphAuthority] Compiled graph: ${graphSpec.graph_type}`);
      return wrappedGraphRoot;
    } catch (error) {
      console.error(`[CanonicalGraphAuthority] Failed to compile graph: ${graphSpec.graph_type}`, error.message);
      throw error;
    }
  }

  /**
   * Compile Import Graph from wrapped symbols
   * 
   * Constitutional Constraint: Graph semantics belong entirely inside CanonicalGraphAuthority.
   * Pipeline should never understand imports, calls, implements, extends.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Wrapped GraphRoot object
   */
  async compileImportGraph(wrappedSymbols) {
    console.log('[CanonicalGraphAuthority] Compiling import graph');

    // Build import graph specification internally
    const graphSpec = this._buildImportGraphSpecification(wrappedSymbols);
    
    if (!graphSpec) {
      return null;
    }

    return await this.compile(graphSpec);
  }

  /**
   * Compile Call Graph from wrapped symbols
   * 
   * Constitutional Constraint: Graph semantics belong entirely inside CanonicalGraphAuthority.
   * Pipeline should never understand imports, calls, implements, extends.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Wrapped GraphRoot object
   */
  async compileCallGraph(wrappedSymbols) {
    console.log('[CanonicalGraphAuthority] Compiling call graph');

    // Build call graph specification internally
    const graphSpec = this._buildCallGraphSpecification(wrappedSymbols);
    
    if (!graphSpec) {
      return null;
    }

    return await this.compile(graphSpec);
  }

  /**
   * Compile Type Graph from wrapped symbols
   * 
   * Constitutional Constraint: Graph semantics belong entirely inside CanonicalGraphAuthority.
   * Pipeline should never understand imports, calls, implements, extends.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Wrapped GraphRoot object
   */
  async compileTypeGraph(wrappedSymbols) {
    console.log('[CanonicalGraphAuthority] Compiling type graph');

    // Build type graph specification internally
    const graphSpec = this._buildTypeGraphSpecification(wrappedSymbols);
    
    if (!graphSpec) {
      return null;
    }

    return await this.compile(graphSpec);
  }

  /**
   * Build Import Graph Specification
   * 
   * Graph semantics belong entirely inside CanonicalGraphAuthority.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Import graph specification
   */
  _buildImportGraphSpecification(wrappedSymbols) {
    const nodes = [];
    const edges = [];

    for (const wrappedSymbol of wrappedSymbols) {
      const symbol = wrappedSymbol.constitutional_object;

      if (symbol.payload.canonical_kind === 'Import') {
        nodes.push({
          kind: 'Import',
          canonical_name: symbol.payload.canonical_name,
          properties: symbol.payload.properties,
        });

        edges.push({
          source_id: symbol.lineage.source_id,
          target_id: symbol.payload.canonical_name,
          relation: 'imports',
          properties: {},
        });
      }
    }

    if (nodes.length === 0) {
      return null;
    }

    return {
      graph_type: 'ImportGraph',
      nodes,
      edges,
      source_id: wrappedSymbols[0]?.constitutional_object.lineage.source_id,
    };
  }

  /**
   * Build Call Graph Specification
   * 
   * Graph semantics belong entirely inside CanonicalGraphAuthority.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Call graph specification
   */
  _buildCallGraphSpecification(wrappedSymbols) {
    const nodes = [];
    const edges = [];

    for (const wrappedSymbol of wrappedSymbols) {
      const symbol = wrappedSymbol.constitutional_object;

      if (symbol.payload.canonical_kind === 'Function') {
        nodes.push({
          kind: 'Function',
          canonical_name: symbol.payload.canonical_name,
          properties: symbol.payload.properties,
        });

        const calls = symbol.payload.relationships?.calls || [];
        for (const call of calls) {
          edges.push({
            source_id: symbol.id,
            target_id: call,
            relation: 'calls',
            properties: {},
          });
        }
      }
    }

    if (nodes.length === 0) {
      return null;
    }

    return {
      graph_type: 'CallGraph',
      nodes,
      edges,
      source_id: wrappedSymbols[0]?.constitutional_object.lineage.source_id,
    };
  }

  /**
   * Build Type Graph Specification
   * 
   * Graph semantics belong entirely inside CanonicalGraphAuthority.
   * 
   * @param {Array} wrappedSymbols - Array of wrapped symbol objects
   * @returns {Object} Type graph specification
   */
  _buildTypeGraphSpecification(wrappedSymbols) {
    const nodes = [];
    const edges = [];

    for (const wrappedSymbol of wrappedSymbols) {
      const symbol = wrappedSymbol.constitutional_object;

      if (['Class', 'Interface', 'Struct'].includes(symbol.payload.canonical_kind)) {
        nodes.push({
          kind: symbol.payload.canonical_kind,
          canonical_name: symbol.payload.canonical_name,
          properties: symbol.payload.properties,
        });

        const relationships = symbol.payload.relationships || {};

        for (const impl of relationships.implements || []) {
          edges.push({
            source_id: symbol.id,
            target_id: impl,
            relation: 'implements',
            properties: {},
          });
        }

        for (const ext of relationships.extends || []) {
          edges.push({
            source_id: symbol.id,
            target_id: ext,
            relation: 'extends',
            properties: {},
          });
        }
      }
    }

    if (nodes.length === 0) {
      return null;
    }

    return {
      graph_type: 'TypeGraph',
      nodes,
      edges,
      source_id: wrappedSymbols[0]?.constitutional_object.lineage.source_id,
    };
  }

  /**
   * Get graph root by specification hash
   * 
   * @param {string} specHash - Specification hash
   * @returns {Object} Wrapped GraphRoot object
   */
  getGraphRoot(specHash) {
    return this._graphCache.get(specHash);
  }

  /**
   * Get all graph roots
   * 
   * @returns {Array} Array of all wrapped GraphRoot objects
   */
  getAllGraphRoots() {
    return Array.from(this._graphCache.values());
  }

  /**
   * Get graph roots by type
   * 
   * @param {string} graphType - Graph type
   * @returns {Array} Array of wrapped GraphRoot objects
   */
  getGraphRootsByType(graphType) {
    const allGraphs = this.getAllGraphRoots();
    return allGraphs.filter(g => g.constitutional_object.payload.graph_type === graphType);
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const graphs = this.getAllGraphRoots();
    
    const stats = {
      total_graphs: graphs.length,
      by_graph_type: {},
      average_nodes_per_graph: 0,
      average_edges_per_graph: 0,
      total_nodes: 0,
      total_edges: 0,
    };

    for (const graph of graphs) {
      const graphType = graph.constitutional_object.payload.graph_type;
      const nodeCount = graph.constitutional_object.payload.node_count;
      const edgeCount = graph.constitutional_object.payload.edge_count;

      stats.by_graph_type[graphType] = (stats.by_graph_type[graphType] || 0) + 1;
      stats.total_nodes += nodeCount;
      stats.total_edges += edgeCount;
    }

    if (graphs.length > 0) {
      stats.average_nodes_per_graph = stats.total_nodes / graphs.length;
      stats.average_edges_per_graph = stats.total_edges / graphs.length;
    }

    return stats;
  }

  /**
   * Persist graph cache
   * 
   * @param {string} specHash - Specification hash
   * @param {Object} wrappedGraphRoot - Wrapped GraphRoot object
   */
  async _persistGraphCache(specHash, wrappedGraphRoot) {
    try {
      await this._postgres.query(`
        INSERT INTO graph_cache (spec_hash, constitutional_id, constitutional_hash, operational_metadata, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (spec_hash) DO UPDATE SET
          constitutional_id = $2,
          constitutional_hash = $3,
          operational_metadata = $4,
          updated_at = NOW()
      `, [
        specHash,
        wrappedGraphRoot.constitutional_object.id,
        wrappedGraphRoot.constitutional_object.canonical_hash,
        JSON.stringify(wrappedGraphRoot.operational_envelope.getOperationalMetadata()),
      ]);
    } catch (error) {
      console.error('[CanonicalGraphAuthority] Failed to persist graph cache:', error.message);
    }
  }

  /**
   * Load graph cache
   */
  async _loadGraphCache() {
    try {
      const result = await this._postgres.query(`
        SELECT spec_hash, constitutional_id, constitutional_hash, operational_metadata
        FROM graph_cache
        ORDER BY updated_at DESC
        LIMIT 10000
      `);

      for (const row of result.rows) {
        this._graphCache.set(row.spec_hash, {
          constitutional_object: {
            id: row.constitutional_id,
            canonical_hash: row.constitutional_hash,
          },
          operational_envelope: {
            getOperationalMetadata: () => row.operational_metadata,
          },
        });
      }
    } catch (error) {
      console.error('[CanonicalGraphAuthority] Failed to load graph cache:', error.message);
    }
  }

  /**
   * Clear graph cache (memory only)
   */
  clearGraphCache() {
    this._graphCache.clear();
  }
}

module.exports = { CanonicalGraphAuthority };
