/**
 * Qdrant Adapter — PING Core v1 (Priority 7)
 *
 * Thin REST adapter. Reuses the proven REST client pattern from gateway/qdrant_client.js.
 * No npm dependency. Exposes search + upsert only. Nothing more.
 *
 * TENANT ISOLATION (TenantOS logical partitioning): every vector record
 * carries an immutable payload.namespace ("tenant::<id>", "core::*").
 * The namespace is the tenant boundary at this layer:
 *   - search REQUIRES options.namespace and enforces it server-side as a
 *     Qdrant payload filter ANDed under any caller filter. A caller can
 *     narrow results, never widen them past its own namespace.
 *   - upsert REQUIRES payload.namespace on every point; a batch that mixes
 *     namespaces (or omits them) is refused before anything is stored.
 *   - no namespace = fail closed (throw), never an unfiltered search.
 * A future high-isolation tenant can map to a dedicated collection through
 * the collection argument without changing these semantics.
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
   *
   * Tenant isolation: every point's payload.namespace must be present and,
   * when options.namespace is given, must equal it. Mixed-namespace batches
   * are refused before anything is stored — never partially applied.
   */
  async upsert(collection, points, options = {}) {
    const pts = Array.isArray(points) ? points : [];
    for (const p of pts) {
      const ns = p && p.payload ? p.payload.namespace : undefined;
      if (typeof ns !== 'string' || ns.length === 0) {
        throw new Error(
          'QdrantAdapter.upsert: every point requires payload.namespace (tenant isolation fail-closed)',
        );
      }
      if (options.namespace && ns !== options.namespace) {
        throw new Error(
          `QdrantAdapter.upsert: point namespace "${ns}" does not match batch namespace "${options.namespace}" (refused)`,
        );
      }
    }
    return this._fetch(`/collections/${collection}/points`, {
      method: 'PUT',
      body: JSON.stringify({ points: pts }),
    });
  }

  /**
   * Search by vector.
   *
   * Tenant isolation: options.namespace is REQUIRED. It is enforced
   * server-side as a Qdrant payload filter ANDed with any caller-supplied
   * filter conditions (caller conditions narrow, never widen). No namespace
   * = throw, never an unfiltered cross-namespace search.
   */
  async search(collection, vector, limit = 10, options = {}) {
    const namespace = options.namespace;
    if (typeof namespace !== 'string' || namespace.length === 0) {
      throw new Error(
        'QdrantAdapter.search: options.namespace is required (tenant isolation fail-closed)',
      );
    }
    const must = [{ key: 'namespace', match: { value: namespace } }];
    if (options.filter && Array.isArray(options.filter.must)) {
      must.push(...options.filter.must);
    }
    const result = await this._fetch(`/collections/${collection}/points/search`, {
      method: 'POST',
      body: JSON.stringify({ vector, limit, filter: { must }, with_payload: true }),
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
