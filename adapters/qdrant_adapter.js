/**
 * Qdrant Adapter
 * 
 * Infrastructure adapter for Qdrant vector database
 * 
 * Responsibilities:
 * - upsert(collection, points)
 * - delete(collection, ids)
 * - query(collection, vector, filter, limit)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class QdrantAdapter {
  constructor(url = 'http://localhost:6333', apiKey = null) {
    this._url = url;
    this._apiKey = apiKey;
  }

  /**
   * Upsert vectors
   * 
   * @param {string} collection - Collection name
   * @param {Array} points - Points to upsert
   * @returns {Object} Upsert response
   */
  async upsert(collection, points) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const response = await fetch(`${this._url}/collections/${collection}/points`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({
        points: points,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qdrant upsert failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete vectors
   * 
   * @param {string} collection - Collection name
   * @param {Array} ids - Point IDs to delete
   * @returns {Object} Delete response
   */
  async delete(collection, ids) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const response = await fetch(`${this._url}/collections/${collection}/points/delete`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        points: ids,
      }),
    });

    if (!response.ok) {
      throw new Error(`Qdrant delete failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Query vectors
   * 
   * @param {string} collection - Collection name
   * @param {Array} vector - Query vector
   * @param {Object} filter - Filter conditions
   * @param {number} limit - Number of results
   * @returns {Object} Query response
   */
  async query(collection, vector, filter = null, limit = 10) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const body = {
      vector: vector,
      limit: limit,
      with_payload: true,
    };

    if (filter) {
      body.filter = filter;
    }

    const response = await fetch(`${this._url}/collections/${collection}/points/search`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Qdrant query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create collection
   * 
   * @param {string} collection - Collection name
   * @param {number} dimension - Vector dimension
   * @returns {Object} Create response
   */
  async createCollection(collection, dimension) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const response = await fetch(`${this._url}/collections/${collection}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({
        vectors: {
          size: dimension,
          distance: 'Cosine',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Qdrant create collection failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete collection
   * 
   * @param {string} collection - Collection name
   * @returns {Object} Delete response
   */
  async deleteCollection(collection) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const response = await fetch(`${this._url}/collections/${collection}`, {
      method: 'DELETE',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Qdrant delete collection failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      const response = await fetch(`${this._url}/`);
      
      if (response.ok) {
        return {
          healthy: true,
        };
      }

      return {
        healthy: false,
        error: response.statusText,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * List collections
   * 
   * @returns {Array} Collection names
   */
  async listCollections() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this._apiKey) {
      headers['api-key'] = this._apiKey;
    }

    const response = await fetch(`${this._url}/collections`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`Qdrant list collections failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.collections.map(c => c.name);
  }
}

module.exports = { QdrantAdapter };
