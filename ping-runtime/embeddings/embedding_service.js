/**
 * Embedding Service — PING Core v1 (Priority: Phase C of Canonical Boundary)
 *
 * The single named instance for text → vector → Qdrant projection.
 * Replaces the dead `gateway/qdrant_integration.js` TODO stub. The Qdrant path
 * is the live `ping-runtime/search/qdrant_adapter.js` (768-d Cosine).
 *
 * Flow: event → EmbeddingService.projectToQdrant() → aiRuntime.embed()
 *       → qdrantAdapter.upsert('knowledge', point)
 *
 * Fallback: if Ollama is unreachable, a deterministic seeded vector (SHA-256 seed,
 * splitmix-style PRNG — no Math.random) keeps the pipeline moving, tagged
 * `embedding: 'fallback'` so retrieval can down-rank it.
 */

const { CanonicalBytes, CanonicalAuthority } = require('../../gateway/canonical_authority');

const DEFAULT_COLLECTION = 'knowledge';
const DEFAULT_MODEL = 'nomic-embed-text';
const VECTOR_SIZE = 768;
const DEFAULT_PROVIDER = 'ollama';

// Event types that carry knowledge-worthy text and may be projected to Qdrant.
// Everything else is structural (missions, workflow, system) — not embeddable.
const INDEXABLE_TYPES = new Set([
  'OBSERVATION_CREATED',
  'CLAIM_CREATED',
  'RECOMMENDATION_CREATED',
  'PROJECTION_CREATED',
  'REVIEW_RECEIVED',
  'REVIEW_RESPONDED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'ESTIMATE_CREATED',
  'ESTIMATE_SENT',
  'LEAD_CREATED',
  'LEAD_CONVERTED',
  'INVOICE_CREATED',
  'INVOICE_SENT',
  'INVOICE_PAID',
  'GITHUB_COMMIT_SYNCED',
  'GOOGLE_REVIEW_RECEIVED',
]);

function extractText(payload) {
  if (!payload || typeof payload !== 'object') return String(payload || '');
  const candidates = ['text', 'content', 'summary', 'observation', 'claim', 'recommendation', 'title', 'name', 'review', 'response'];
  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) return value;
    if (value && typeof value === 'object') {
      const nested = extractText(value);
      if (nested) return nested;
    }
  }
  try {
    return JSON.stringify(payload);
  } catch (err) {
    return '';
  }
}

function seededVector(seedHex, size) {
  let seed = parseInt(seedHex.slice(0, 16), 16) || 1;
  const vector = new Array(size);
  for (let i = 0; i < size; i++) {
    seed += 0x9e3779b9;
    let z = seed;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z ^= z >>> 15;
    vector[i] = (z >>> 0) / 4294967296;
  }
  return vector;
}

class EmbeddingService {
  /**
   * @param {object} options
   * @param {object} options.aiRuntime — AIRuntime with embed()
   * @param {object} options.qdrantAdapter — QdrantAdapter with ensureCollection/upsert/search
   * @param {string} [options.collection='knowledge']
   * @param {number} [options.vectorSize=768]
   * @param {string} [options.embeddingModel='nomic-embed-text']
   * @param {string} [options.provider='ollama']
   */
  constructor(options = {}) {
    if (!options.aiRuntime) throw new Error('EmbeddingService requires aiRuntime');
    this._aiRuntime = options.aiRuntime;
    this._qdrant = options.qdrantAdapter || null;
    this._collection = options.collection || DEFAULT_COLLECTION;
    this._vectorSize = options.vectorSize || VECTOR_SIZE;
    this._model = options.embeddingModel || DEFAULT_MODEL;
    this._provider = options.provider || DEFAULT_PROVIDER;
    this._indexableTypes = options.indexableTypes ? new Set(options.indexableTypes) : INDEXABLE_TYPES;
    this._stats = { embedded: 0, fallback: 0, failed: 0, projected: 0, subscribed: 0 };
  }

  /** Ensure the Qdrant collection exists. Best-effort. */
  async initialize() {
    if (!this._qdrant) return this;
    await this._qdrant.ensureCollection(this._collection, this._vectorSize);
    return this;
  }

  /**
   * Subscribe to indexable event types on a UnifiedEventRuntime.
   * Mirrors the established graph-projection subscriber pattern
   * (gateway_runtime.js GRAPH_PROJECTION_EVENTS loop): each matching event is
   * embedded and upserted to Qdrant. Async — a failed projection is logged and
   * counted, never thrown onto the emitter.
   * @param {object} eventRuntime — UnifiedEventRuntime exposing .on(type, handler)
   * @returns {this}
   */
  subscribe(eventRuntime) {
    if (!eventRuntime || typeof eventRuntime.on !== 'function') {
      console.warn('[EmbeddingService] subscribe: no eventRuntime — async projection disabled');
      this._stats.failed++;
      return this;
    }
    let registered = 0;
    for (const type of this._indexableTypes) {
      try {
        eventRuntime.on(type, async (event) => {
          try {
            await this.projectToQdrant(
              {
                id: event.event_id,
                kind: event.event_type,
                namespace: event.namespace,
                identity: event.identity || null,
                canonical_hash: (event.metadata && event.metadata.canonical_hash) || null,
                payload: event.payload || {},
              },
              {
                sourceEventId: event.event_id,
                eventType: event.event_type,
                namespace: event.namespace,
              }
            );
          } catch (err) {
            this._stats.failed++;
            console.error(`[EmbeddingService] Projection failed for ${event.event_type}: ${err.message}`);
          }
        });
        registered++;
      } catch (err) {
        this._stats.failed++;
        console.error(`[EmbeddingService] subscribe failed for ${type}: ${err.message}`);
      }
    }
    this._stats.subscribed = registered;
    console.log(`[EmbeddingService] Subscribed to ${registered} indexable event types`);
    return this;
  }

  /** Is this event type knowledge-worthy? */
  isIndexable(eventType) {
    return this._indexableTypes.has(eventType);
  }

  /**
   * Embed text via the AI Runtime. Falls back to a deterministic seeded vector
   * when Ollama is unreachable (never silently halts).
   * @returns {Promise<{embedding:number[], model:string, fallback:boolean}>}
   */
  async embed(text, options = {}) {
    const model = options.model || this._model;
    const result = await this._aiRuntime.embed(text, { model, provider: this._provider });
    if (result && result.status === 'ok' && Array.isArray(result.embedding) && result.embedding.length === this._vectorSize) {
      this._stats.embedded++;
      return { embedding: result.embedding, model: result.model || model, fallback: false };
    }
    return this._fallbackEmbed(text, model);
  }

  _fallbackEmbed(text, model) {
    const seed = CanonicalAuthority.hashBytes(CanonicalBytes.serialize({ text, model })).slice(0, 32);
    const embedding = seededVector(seed, this._vectorSize);
    this._stats.fallback++;
    return { embedding, model, fallback: true, seed };
  }

  /**
   * Project a canonical object (or event-derived canonical-shaped object) to Qdrant.
   * @param {object} canonicalObject — { id, kind, canonical_hash, namespace?, identity?, payload }
   * @param {object} [options] — { text, namespace, sourceEventId, eventType, model }
   */
  async projectToQdrant(canonicalObject, options = {}) {
    if (!this._qdrant) throw new Error('EmbeddingService: no qdrantAdapter');
    const id = canonicalObject.id || canonicalObject.event_id;
    if (!id) throw new Error('EmbeddingService: canonicalObject requires id or event_id');

    const kind = options.eventType || canonicalObject.kind || 'Event';
    const namespace =
      options.namespace ||
      (canonicalObject.identity && canonicalObject.identity.namespace) ||
      canonicalObject.namespace ||
      'core::system';
    const canonicalHash = canonicalObject.canonical_hash || canonicalObject.canonicalHash || null;
    const sourceEventId = options.sourceEventId || canonicalObject.event_id || id;

    const text = options.text || extractText(canonicalObject.payload || canonicalObject);
    const { embedding, fallback, model } = await this.embed(text, { model: options.model });

    const point = {
      id,
      vector: embedding,
      payload: {
        kind,
        namespace,
        canonical_hash: canonicalHash,
        source_event_id: sourceEventId,
        event_type: kind,
        text,
        embedding: fallback ? 'fallback' : 'ollama',
        model,
        projected_at: null,
      },
    };

    await this._qdrant.upsert(this._collection, [point]);
    this._stats.projected++;
    return point;
  }

  /** Semantic search over the projected collection. */
  async search(text, options = {}) {
    if (!this._qdrant) throw new Error('EmbeddingService: no qdrantAdapter');
    const { embedding } = await this.embed(text, { model: options.model });
    return this._qdrant.search(this._collection, embedding, options.limit || 10);
  }

  /** Diagnostic counters. */
  getStats() {
    return {
      ...this._stats,
      collection: this._collection,
      vectorSize: this._vectorSize,
      model: this._model,
      indexableTypes: this._indexableTypes.size,
    };
  }
}

module.exports = { EmbeddingService, DEFAULT_COLLECTION, DEFAULT_MODEL, VECTOR_SIZE, INDEXABLE_TYPES };
