/**
 * Constitutional Object Factory
 * 
 * Ω.49 — Constitutional Object Factory
 * 
 * Centralized factory for constitutional object envelope construction.
 * 
 * Eliminates duplicated object construction patterns across authorities.
 * Every constitutional object follows a single canonical schema.
 * 
 * Consolidation: Envelope construction delegated to the shared
 * canonical_object envelope (canonical_object.js). This factory keeps
 * domain-specific constructors (Symbol, Commit, Semantic) and delegates
 * the envelope to the single canonical field contract.
 */

const { createCanonicalObject } = require('../ping-runtime/canonicalization/canonical_object');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');

class ConstitutionalObjectFactory {
  constructor() {
    this._factoryVersion = '1.0.0';
    this._schemaVersion = '1.0.0';
  }

  /**
   * Create constitutional object envelope
   * @param {Object} config - Object configuration
   * @returns {Object} Constitutional object
   */
  createObject(config) {
    const {
      id,
      kind,
      payload,
      authority,
      sourceId = null,
      sourceKind = 'Unknown',
      relationships = [],
      metadata = {},
    } = config;

    const envelope = createCanonicalObject({
      kind,
      payload,
      authority,
      options: {
        id,
        source_id: sourceId,
        source_kind: sourceKind,
        relationships,
        metadata,
      },
    });

    // Identity envelope via identity authority (factory contract)
    envelope.identity = identityAuthority.generateIdentityEnvelope(id, this._factoryVersion);

    // Factory lineage contract uses source_id/source_kind naming
    envelope.lineage = {
      source_id: sourceId,
      source_kind: sourceKind,
    };

    return envelope;
  }

  /**
   * Create Symbol object
   * @param {Object} symbolData - Symbol data
   * @returns {Object} Symbol constitutional object
   */
  createSymbol(symbolData) {
    const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
    const symbolId = identityAuthority.generateSymbolId(
      symbolData.canonical_name,
      symbolData.language,
      symbolData.kind,
      symbolData.signature
    );

    return this.createObject({
      id: symbolId,
      kind: 'Symbol',
      payload: {
        canonical_name: symbolData.canonical_name,
        language: symbolData.language,
        visibility: symbolData.visibility || 'public',
        signature: symbolData.signature || null,
        generic_parameters: symbolData.generic_parameters || [],
        documentation: symbolData.documentation || null,
        hash: CanonicalAuthority.hash({
          canonical_name: symbolData.canonical_name,
          language: symbolData.language,
          kind: symbolData.kind,
          signature: symbolData.signature,
        }),
        span: symbolData.span || null,
        module: symbolData.module || null,
        repository: symbolData.repository || null,
      },
      authority: symbolData.authority || 'SymbolObjectAuthority',
      sourceId: symbolData.source_id || null,
      sourceKind: symbolData.source_kind || 'AST',
      relationships: symbolData.relationships || [],
      metadata: {
        schema_version: this._schemaVersion,
        language: symbolData.language,
        kind: symbolData.kind,
      },
    });
  }

  /**
   * Create Commit object
   * @param {Object} commitData - Commit data
   * @returns {Object} Commit constitutional object
   */
  createCommit(commitData) {
    return this.createObject({
      id: commitData.id,
      kind: 'Commit',
      payload: {
        sha: commitData.sha,
        message: commitData.message,
        author: commitData.author,
        timestamp: commitData.timestamp,
        repository: commitData.repository,
      },
      authority: commitData.authority || 'AcquisitionAuthority',
      sourceId: commitData.source_id || null,
      sourceKind: commitData.source_kind || 'Git',
      relationships: commitData.relationships || [],
      metadata: {
        schema_version: this._schemaVersion,
        repository: commitData.repository,
      },
    });
  }

  /**
   * Create Semantic object
   * @param {Object} semanticData - Semantic data
   * @returns {Object} Semantic constitutional object
   */
  createSemantic(semanticData) {
    return this.createObject({
      id: semanticData.id,
      kind: 'Semantic',
      payload: {
        commit_sha: semanticData.commit_sha,
        message_summary: semanticData.message_summary,
        author: semanticData.author,
        semantic_type: semanticData.semantic_type,
      },
      authority: semanticData.authority || 'SemanticAuthority',
      sourceId: semanticData.source_id || null,
      sourceKind: semanticData.source_kind || 'Commit',
      relationships: semanticData.relationships || [],
      metadata: {
        schema_version: this._schemaVersion,
      },
    });
  }

  /**
   * Get factory version
   * @returns {string} Factory version
   */
  getFactoryVersion() {
    return this._factoryVersion;
  }

  /**
   * Get schema version
   * @returns {string} Schema version
   */
  getSchemaVersion() {
    return this._schemaVersion;
  }
}

// Singleton instance
const constitutionalObjectFactory = new ConstitutionalObjectFactory();

module.exports = { ConstitutionalObjectFactory, constitutionalObjectFactory };
