/**
 * Compiler Authority
 *
 * Phase 2.7.5 — Constitutional Boundary Collapse
 *
 * Coordinates compilation by delegating to CompilationPolicy and constitutional authorities.
 *
 * Architecture:
 * Schema Compiler
 *   ↓
 * CanonicalIR (pure data)
 *   ↓
 * CompilerAuthority (coordinates)
 *   ↓
 * CompilationPolicy (rules)
 *   ↓
 * CanonicalAuthority (hashing)
 *   ↓
 * IdentityAuthority (ID generation)
 *   ↓
 * ConstitutionalObject
 *
 * Constitutional Constraints:
 * - CompilerAuthority only coordinates
 * - Compilation rules moved to CompilationPolicy
 * - No business logic in CompilerAuthority
 */

const { identityAuthority } = require('./identity_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { compilationPolicy } = require('./compilation_policy');
const { versionedSchemaCompiler } = require('./schema_compiler');

class CompilerAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '2.7.5';
  }

  /**
   * Compile source data and create ConstitutionalObject
   * @param {Object} sourceData - Source data to compile
   * @param {string} sourceType - Source type
   * @param {string} lifecycleId - Lifecycle ID
   * @returns {Object} ConstitutionalObject
   */
  async compileAndCreate(sourceData, sourceType, lifecycleId) {
    const ir = await versionedSchemaCompiler.compile(sourceData, sourceType);
    return this.createConstitutionalObject(ir, lifecycleId);
  }

  /**
   * Create ConstitutionalObject from CanonicalIR
   * @param {CanonicalIR} ir - Canonical Intermediate Representation
   * @param {string} lifecycleId - Lifecycle ID
   * @returns {Object} ConstitutionalObject
   */
  createConstitutionalObject(ir, lifecycleId) {
    const irData = ir.getData();
    const payload = irData.content || {};

    // Delegate to constitutional authorities
    const id = identityAuthority.generateId('constitutional_object', {
      source: irData.source,
      source_type: irData.source_type,
      source_id: irData.source_id,
    });

    const canonical = CanonicalBytes.serialize(payload);
    const canonicalHash = CanonicalAuthority.hash(canonical);

    // Delegate to CompilationPolicy for rules
    const kind = compilationPolicy.mapKind(irData.source_type);
    const relationships = compilationPolicy.buildRelationships(irData);
    const metadata = compilationPolicy.buildMetadata(irData, lifecycleId);
    const lineage = compilationPolicy.buildLineage(irData);
    const identity = compilationPolicy.buildIdentity(irData);

    return {
      id,
      kind,
      authority: 'CompilerAuthority',
      identity,
      canonical_hash: canonicalHash,
      lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships,
      metadata,
      payload,
    };
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `compiler_authority_v${this._authorityVersion}`;
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
}

// Singleton instance
const compilerAuthority = new CompilerAuthority();

module.exports = { CompilerAuthority, compilerAuthority };
