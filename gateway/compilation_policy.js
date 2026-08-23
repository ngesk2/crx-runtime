/**
 * Compilation Policy
 *
 * Phase 2.7.5 — Constitutional Boundary Collapse
 *
 * Owns compilation rules and mappings.
 *
 * Constitutional Constraint:
 * - Compilation rules belong here
 * - CompilerAuthority only coordinates
 * - No business logic in CompilerAuthority
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class CompilationPolicy {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '2.7.5';
  }

  /**
   * Map source type to constitutional kind
   * @param {string} sourceType - Source type
   * @returns {string} Constitutional kind
   */
  mapKind(sourceType) {
    const mapping = {
      'repository': 'Repository',
      'commit': 'Commit',
      'branch': 'Branch',
      'pull_request': 'PullRequest',
      'issue': 'Issue',
      'release': 'Release',
      'tag': 'Tag',
      'contributor': 'Contributor',
    };
    return mapping[sourceType] || 'Unknown';
  }

  /**
   * Build relationships from IR data
   * @param {Object} irData - IR data
   * @returns {Array} Relationships
   */
  buildRelationships(irData) {
    return (irData.relationships || []).map(rel => ({
      target_id: rel.target,
      relation_type: rel.type,
      strength: 1.0,
      metadata: {},
    }));
  }

  /**
   * Build metadata for ConstitutionalObject
   * @param {Object} irData - IR data
   * @param {string} lifecycleId - Lifecycle ID
   * @returns {Object} Metadata
   */
  buildMetadata(irData, lifecycleId) {
    return {
      lifecycle_id: lifecycleId,
      timestamp: irData.timestamp || new Date(constitutionalTimeAuthority.now()).toISOString(),
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      runtime_version: '1.0.0',
      source: irData.source,
      source_type: irData.source_type,
    };
  }

  /**
   * Build lineage for ConstitutionalObject
   * @param {Object} irData - IR data
   * @returns {Object} Lineage
   */
  buildLineage(irData) {
    return {
      source_id: irData.source_id,
      derivation_path: [irData.source, 'DTO', 'CanonicalIR', 'ConstitutionalObject'],
      provenance_chain: [irData.source],
    };
  }

  /**
   * Build identity for ConstitutionalObject
   * @param {Object} irData - IR data
   * @returns {Object} Identity
   */
  buildIdentity(irData) {
    return {
      namespace: 'constitutional',
      version: 'v1',
      created_at: irData.timestamp || new Date(constitutionalTimeAuthority.now()).toISOString(),
      created_by: 'CompilerAuthority',
    };
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `compilation_policy_v${this._authorityVersion}`;
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
const compilationPolicy = new CompilationPolicy();

module.exports = { CompilationPolicy, compilationPolicy };
