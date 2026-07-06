/**
 * Semantic Authority
 * 
 * Ω.48 — Semantic Authority
 * 
 * Centralized semantic classification for constitutional objects.
 * 
 * Separates semantic inference from acquisition logic.
 * Acquisition should never interpret commits - SemanticAuthority does.
 */

class SemanticAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '1.0.0';
  }

  /**
   * Classify commit type from message
   * @param {string} message - Commit message
   * @returns {string} Semantic type
   */
  classifyCommitType(message) {
    if (!message) return 'other';
    
    const msg = message.toLowerCase();
    
    if (msg.includes('fix') || msg.includes('bug')) return 'fix';
    if (msg.includes('feat') || msg.includes('feature')) return 'feature';
    if (msg.includes('refactor')) return 'refactor';
    if (msg.includes('test')) return 'test';
    if (msg.includes('docs') || msg.includes('documentation')) return 'documentation';
    if (msg.includes('chore') || msg.includes('maintenance')) return 'maintenance';
    if (msg.includes('perf') || msg.includes('performance')) return 'performance';
    
    return 'other';
  }

  /**
   * Classify symbol type from signature
   * @param {string} kind - Symbol kind
   * @param {string} signature - Symbol signature
   * @returns {string} Semantic type
   */
  classifySymbolType(kind, signature) {
    if (!kind) return 'unknown';
    
    const kindLower = kind.toLowerCase();
    
    if (kindLower.includes('function') || kindLower.includes('method')) return 'function';
    if (kindLower.includes('class') || kindLower.includes('interface') || kindLower.includes('struct')) return 'type';
    if (kindLower.includes('variable') || kindLower.includes('const') || kindLower.includes('let')) return 'variable';
    if (kindLower.includes('import') || kindLower.includes('export')) return 'module';
    
    return kindLower;
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

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `semantic_authority_${this._authorityVersion}`;
  }
}

// Singleton instance
const semanticAuthority = new SemanticAuthority();

module.exports = { SemanticAuthority, semanticAuthority };
