/**
 * Qdrant Adapter — PING Core v1 (Priority 7)
 *
 * Thin REST adapter. Reuses the proven REST client pattern from gateway/qdrant_client.js.
 * No npm dependency. Exposes search + upsert only. Nothing more.
 */

class QdrantAdapter {
  constructor(options = {}) {
    this._url = options.url || process.env.QDRANT_URL || 'http://localhost:6333';
    this._apiKey = options.apiKey || process.env.QDRANT_API_KEY || '';
    this._headers = { 'Content-Type': 'application/json' };
    if (this._apiKey) this._headers['api-key'] = this._apiKey;
  }

  async _fetch(path, opts = {}) {
    const resp = await fetch(`${this._url}${path}`, {
      ...opts,
      headers: { ...this._headers, ...opts.headers },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Qdrant ${resp.status}: ${text.substring(0, 200)}`);
    }
    return resp.json();
  }

  /**
   * Ensure a collection exists. Creates it if missing.
   */
  async ensureCollection(name, vectorSize = 768) {
    const existing = await this._fetch('/collections').catch(() => ({ result: { collections: [] } }));
    const names = (existing.result?.collections || []).map(c => c.name);
    if (names.includes(name)) return;
    await this._fetch(`/collections/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ vectors: { size: vectorSize, distance: 'Cosine' } }),
    });
  }

  /**
   * Upsert points into a collection.
   */
  async upsert(collection, points) {
    return this._fetch(`/collections/${collection}/points`, {
      method: 'PUT',
      body: JSON.stringify({ points }),
    });
  }

  /**
   * Search by vector.
   */
  async search(collection, vector, limit = 10) {
    const result = await this._fetch(`/collections/${collection}/points/search`, {
      method: 'POST',
      body: JSON.stringify({ vector, limit, with_payload: true }),
    });
    return result.result || [];
  }

  /**
   * Health check.
   */
  async health() {
    try {
      const result = await this._fetch('/');
      return { status: 'healthy', version: result.version || 'unknown' };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
}

module.exports = { QdrantAdapter };
