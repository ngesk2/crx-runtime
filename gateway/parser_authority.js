/**
 * Parser Authority
 * 
 * Ω.66 — Parser Authority
 * 
 * Compiles AST constitutional objects from File objects.
 * 
 * Constitutional Constraint: Parser Authority owns AST object creation.
 * Pipeline only coordinates authorities.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class ParserAuthority {
  constructor(postgresPool, objectRegistry, witnessChain, multiLanguageParser) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._multiLanguageParser = multiLanguageParser;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._astCache = new Map(); // file_id → AST objects
    this._initialized = false;
  }

  /**
   * Initialize parser authority
   */
  async initialize() {
    await this._loadASTCache();
    this._initialized = true;
    console.log('[ParserAuthority] Initialized');
  }

  /**
   * Compile AST constitutional objects from File objects
   * 
   * @param {Array} wrappedFiles - Array of wrapped file objects
   * @returns {Array} Array of wrapped AST objects (constitutional + envelope)
   */
  async compile(wrappedFiles) {
    console.log(`[ParserAuthority] Compiling ASTs for ${wrappedFiles.length} files`);

    const wrappedASTs = [];

    for (const wrappedFile of wrappedFiles) {
      const fileObject = wrappedFile.constitutional_object;

      // Skip non-source files
      if (fileObject.payload.file_type !== 'source') {
        continue;
      }

      try {
        // Parse file using multi-language parser
        const astData = await this._parseFile(fileObject);
        
        if (!astData) {
          continue;
        }

        // Create AST constitutional object
        const astObject = this._constitutionalObjectFactory.createASTObject({
          language: fileObject.payload.language,
          root_hash: astData.root_hash,
          node_count: astData.node_count,
          tree_structure: astData.tree_structure,
          parser_type: astData.parser_type,
          ast_version: '1.0.0',
        });

        // Wrap in operational envelope
        const operationalMetadata = this._operationalMetadataCollector.collect({
          pipeline_stage: 'parser',
          parser_version: this._operationalMetadataCollector.getParserVersion(fileObject.payload.language),
          source: 'ParserAuthority',
        });
        const envelope = OperationalEnvelope.wrap(astObject, operationalMetadata);

        // Register constitutional object
        await this._objectRegistry.register(astObject);

        wrappedASTs.push({
          constitutional_object: astObject,
          operational_envelope: envelope,
          source_file_id: fileObject.id,
        });

        // Cache AST
        this._astCache.set(fileObject.id, {
          constitutional_object: astObject,
          operational_envelope: envelope,
        });
      } catch (error) {
        console.error(`[ParserAuthority] Failed to parse file: ${fileObject.payload.path}`, error.message);
      }
    }

    await this._persistASTCache();

    console.log(`[ParserAuthority] Compiled ${wrappedASTs.length} ASTs`);
    return wrappedASTs;
  }

  /**
   * Parse file using multi-language parser
   * 
   * @param {Object} fileObject - File constitutional object
   * @returns {Object} AST data
   */
  async _parseFile(fileObject) {
    if (!this._multiLanguageParser) {
      console.warn('[ParserAuthority] MultiLanguageParser not initialized');
      return null;
    }

    // Use multi-language parser to parse file
    const ast = await this._multiLanguageParser.parseFile(fileObject);
    
    if (!ast) {
      return null;
    }

    // Compute AST root hash
    const rootHash = this._computeASTRootHash(ast);

    return {
      root_hash: rootHash,
      node_count: ast.node_count || 0,
      tree_structure: ast.tree_structure || {},
      parser_type: ast.parser_type || 'unknown',
    };
  }

  /**
   * Compute AST root hash
   * 
   * @param {Object} ast - AST data
   * @returns {string} Root hash
   */
  _computeASTRootHash(ast) {
    // Use domain-separated hash function
    return CanonicalAuthority.hashAST(
      ast.language || 'unknown',
      ast.root_hash || CanonicalAuthority.hash(ast),
      ast.node_count || 0
    );
  }

  /**
   * Get AST by file ID
   * 
   * @param {string} fileId - File ID
   * @returns {Object} Wrapped AST object
   */
  getAST(fileId) {
    return this._astCache.get(fileId);
  }

  /**
   * Get all ASTs
   * 
   * @returns {Array} Array of all wrapped AST objects
   */
  getAllASTs() {
    return Array.from(this._astCache.values());
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const asts = this.getAllASTs();
    
    const stats = {
      total_asts: asts.length,
      by_language: {},
      by_parser_type: {},
      total_nodes: 0,
      average_nodes_per_ast: 0,
    };

    let totalNodes = 0;

    for (const ast of asts) {
      const language = ast.constitutional_object.payload.language;
      const parserType = ast.constitutional_object.payload.parser_type;
      const nodeCount = ast.constitutional_object.payload.node_count;

      stats.by_language[language] = (stats.by_language[language] || 0) + 1;
      stats.by_parser_type[parserType] = (stats.by_parser_type[parserType] || 0) + 1;
      totalNodes += nodeCount;
    }

    if (asts.length > 0) {
      stats.average_nodes_per_ast = totalNodes / asts.length;
    }

    stats.total_nodes = totalNodes;

    return stats;
  }

  /**
   * Persist AST cache
   */
  async _persistASTCache() {
    try {
      const astData = Array.from(this._astCache.entries()).map(([fileId, wrappedAST]) => ({
        file_id: fileId,
        constitutional_id: wrappedAST.constitutional_object.id,
        constitutional_hash: wrappedAST.constitutional_object.canonical_hash,
        operational_metadata: wrappedAST.operational_envelope.getOperationalMetadata(),
      }));

      // Batch upsert
      for (const data of astData) {
        await this._postgres.query(`
          INSERT INTO ast_cache (file_id, constitutional_id, constitutional_hash, operational_metadata, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (file_id) DO UPDATE SET
            constitutional_id = $2,
            constitutional_hash = $3,
            operational_metadata = $4,
            updated_at = NOW()
        `, [data.file_id, data.constitutional_id, data.constitutional_hash, JSON.stringify(data.operational_metadata)]);
      }
    } catch (error) {
      console.error('[ParserAuthority] Failed to persist AST cache:', error.message);
    }
  }

  /**
   * Load AST cache
   */
  async _loadASTCache() {
    try {
      const result = await this._postgres.query(`
        SELECT file_id, constitutional_id, constitutional_hash, operational_metadata
        FROM ast_cache
        ORDER BY updated_at DESC
        LIMIT 10000
      `);

      for (const row of result.rows) {
        this._astCache.set(row.file_id, {
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
      console.error('[ParserAuthority] Failed to load AST cache:', error.message);
    }
  }

  /**
   * Clear AST cache (memory only)
   */
  clearASTCache() {
    this._astCache.clear();
  }
}

module.exports = { ParserAuthority };
