/**
 * Memory Vector Store Authority
 * 
 * Phase 45 Patch 45.4 — Memory Vector Store Separation
 * 
 * Handles Qdrant vector store operations for memory types.
 * 
 * Responsibilities:
 * - Qdrant collection creation
 * - Vector storage
 * - Vector search
 * 
 * MemoryAuthority delegates vector operations to this authority.
 */

const { CanonicalAuthority } = require('./canonical_authority');

class MemoryVectorStoreAuthority {
  constructor(qdrantClient) {
    this._qdrant = qdrantClient;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize vector store authority
   */
  async initialize() {
    await this._createCollections();
  }

  /**
   * Create Qdrant collections
   */
  async _createCollections() {
    const collections = [
      'memory_facts',
      'memory_goals',
      'memory_projects',
      'memory_repositories',
      'memory_people',
      'memory_apis',
      'memory_errors',
      'memory_fixes',
      'memory_architecture',
      'memory_preferences',
      'memory_patterns',
      'memory_failures'
    ];

    for (const collection of collections) {
      try {
        await this._qdrant.createCollection({
          collection_name: collection,
          vectors: {
            size: 1536,
            distance: 'Cosine'
          }
        });
      } catch (error) {
        // Collection might already exist
        console.log(`Collection ${collection} might already exist`);
      }
    }
  }

  /**
   * Store embedding
   * 
   * @param {string} collection - Collection name
   * @param {string} id - ID
   * @param {Array} embedding - Embedding vector
   * @param {Object} payload - Payload data
   */
  async storeEmbedding(collection, id, embedding, payload) {
    await this._qdrant.upsert({
      collection_name: collection,
      points: [
        {
          id: id,
          vector: embedding,
          payload: payload
        }
      ]
    });
  }

  /**
   * Search memory by embedding
   * 
   * @param {string} query - Query text
   * @param {string} collection - Collection name
   * @param {Array} queryEmbedding - Query embedding vector
   * @param {number} limit - Result limit
   * @returns {Array} Search results
   */
  async searchMemory(collection, queryEmbedding, limit = 10) {
    const results = await this._qdrant.search({
      collection_name: collection,
      query_vector: queryEmbedding,
      limit: limit
    });

    return results.map(r => ({
      id: r.id,
      score: r.score,
      payload: r.payload
    }));
  }

  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '45.4.0',
      constitutional_version: '45.4.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `memory_vector_store_${hash.substring(0, 16)}`;
  }
}

module.exports = { MemoryVectorStoreAuthority };
