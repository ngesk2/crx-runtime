const QDRANT_URL = process.env.QDRANT_URL || 'http://brain-qdrant:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

class QdrantClient {
  constructor(baseUrl = QDRANT_URL, apiKey = QDRANT_API_KEY) {
    this.baseUrl = baseUrl;
    this.headers = { 'Content-Type': 'application/json' };
    if (apiKey) this.headers['api-key'] = apiKey;
  }

  async _fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Qdrant ${resp.status}: ${text.substring(0, 200)}`);
    }
    return resp.json();
  }

  async ensureCollection(collectionName, vectorSize = 768) {
    const existing = await this._fetch('/collections').catch(() => ({ result: { collections: [] } }));
    const names = (existing.result?.collections || []).map(c => c.name);
    if (names.includes(collectionName)) return;
    await this._fetch('/collections', {
      method: 'PUT',
      body: JSON.stringify({
        name: collectionName,
        vectors: { size: vectorSize, distance: 'Cosine' },
      }),
    });
  }

  async upsert(collectionName, points) {
    return this._fetch(`/collections/${collectionName}/points`, {
      method: 'PUT',
      body: JSON.stringify({ points }),
    });
  }

  async search(collectionName, vector, limit = 10) {
    const result = await this._fetch(`/collections/${collectionName}/points/search`, {
      method: 'POST',
      body: JSON.stringify({ vector, limit, with_payload: true }),
    });
    return result.result || [];
  }

  async getCollectionInfo(collectionName) {
    const result = await this._fetch(`/collections/${collectionName}`);
    return result.result || null;
  }

  async listCollections() {
    const result = await this._fetch('/collections');
    return (result.result?.collections || []).map(c => c.name);
  }

  async countPoints(collectionName) {
    const info = await this.getCollectionInfo(collectionName);
    return info?.points_count || 0;
  }

  async deleteCollection(collectionName) {
    return this._fetch(`/collections/${collectionName}`, { method: 'DELETE' });
  }

  async getPoint(collectionName, pointId) {
    try {
      const result = await this._fetch(`/collections/${collectionName}/points/${pointId}`);
      return result.result || null;
    } catch (e) {
      return null;
    }
  }

  async healthCheck() {
    try {
      const result = await this._fetch('/');
      return {
        healthy: true,
        version: result.version || 'unknown',
        title: result.title || 'Qdrant',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async delete(collectionName, pointIds) {
    return this._fetch(`/collections/${collectionName}/points/delete`, {
      method: 'POST',
      body: JSON.stringify({ points: pointIds.map(id => ({ id })) }),
    });
  }
}

module.exports = { QdrantClient };
