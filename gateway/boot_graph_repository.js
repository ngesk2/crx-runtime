/**
 * Boot Graph Repository
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Centralizes boot graph storage and retrieval.
 * 
 * Responsibilities:
 * - Load boot graph
 * - Store boot graph
 * - Verify boot graph integrity
 * 
 * Eventually boot graphs will live inside PostgreSQL or constitutional manifests.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

class BootGraphRepository {
  constructor() {
    this._bootGraphs = new Map();
  }

  /**
   * Load boot graph from file
   * @param {string} graphPath - Path to boot graph file
   * @returns {Object} Boot graph
   */
  loadBootGraph(graphPath) {
    const fs = require('fs');
    const path = require('path');
    
    const fullPath = path.join(__dirname, graphPath);
    const graphData = fs.readFileSync(fullPath, 'utf8');
    const graph = JSON.parse(graphData);
    
    // Verify boot graph integrity
    const integrityCheck = this._verifyBootGraphIntegrity(graph);
    if (!integrityCheck.valid) {
      throw new Error(`Boot graph integrity failed: ${integrityCheck.reason}`);
    }
    
    return graph;
  }

  /**
   * Load boot graph by name
   * @param {string} graphName - Boot graph name
   * @returns {Object} Boot graph
   */
  loadBootGraphByName(graphName) {
    const graphPath = `${graphName}.json`;
    return this.loadBootGraph(graphPath);
  }

  /**
   * Store boot graph
   * @param {string} graphId - Graph ID
   * @param {Object} graph - Boot graph
   */
  storeBootGraph(graphId, graph) {
    this._bootGraphs.set(graphId, graph);
  }

  /**
   * Get boot graph
   * @param {string} graphId - Graph ID
   * @returns {Object|null} Boot graph
   */
  getBootGraph(graphId) {
    return this._bootGraphs.get(graphId) || null;
  }

  /**
   * Verify boot graph integrity
   * @param {Object} graph - Boot graph
   * @returns {Object} Verification result
   */
  _verifyBootGraphIntegrity(graph) {
    // Verify graph hash
    const graphForHash = { ...graph };
    if (graphForHash.graph_metadata && graphForHash.graph_metadata.hash) {
      delete graphForHash.graph_metadata.hash;
      const computedHash = CanonicalAuthority.hash(graphForHash);
      
      if (graph.graph_metadata.hash && graph.graph_metadata.hash !== computedHash) {
        return {
          valid: false,
          reason: 'Boot graph hash mismatch'
        };
      }
    }
    
    // Verify constitutional version
    const currentVersion = this._constitutionVersionAuthority.getCurrentManifest();
    if (graph.constitutional_version && currentVersion) {
      if (graph.constitutional_version !== currentVersion.versions.constitutional) {
        return {
          valid: false,
          reason: `Constitutional version mismatch: expected ${currentVersion.versions.constitutional}, got ${graph.constitutional_version}`
        };
      }
    }
    
    return {
      valid: true,
      reason: 'Boot graph integrity verified'
    };
  }

  /**
   * List stored boot graphs
   * @returns {Array} Boot graph IDs
   */
  listBootGraphs() {
    return Array.from(this._bootGraphs.keys());
  }

  /**
   * Remove boot graph
   * @param {string} graphId - Graph ID
   */
  removeBootGraph(graphId) {
    this._bootGraphs.delete(graphId);
  }
}

// Singleton instance
const bootGraphRepository = new BootGraphRepository();

module.exports = {
  BootGraphRepository,
  bootGraphRepository,
};
