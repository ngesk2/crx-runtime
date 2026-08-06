/**
 * Hybrid Search — PING Core v1 (Phase E.2 of Canonical Boundary)
 *
 * The retrieval front door. Combines:
 *   - Semantic: EmbeddingService.search() → Qdrant 768-d Cosine hits
 *   - Verification: EvidenceAuthority.verify() traces every hit back to a real
 *     ping_events row (canonical_hash + namespace + source_event_id chain).
 *   - Context: KnowledgeGraph.queryNodes() text search (approved/candidate nodes).
 *
 * Every result obeys RETRIEVAL_INTELLIGENCE_REPORT.md law #1 (trace on every
 * result): `{ canonical_hash, namespace, confidence, evidence:[eventIds], verified, source }`.
 *
 * ADD-only — reads Qdrant/Postgres, never writes. Namespace filtering happens
 * after the embedding search because the Qdrant adapter has no server-side filter;
 * results from a different namespace are structurally dropped.
 */

class HybridSearch {
  /**
   * @param {object} options
   * @param {object} [options.embeddingService] — EmbeddingService (semantic leg)
   * @param {object} [options.evidenceAuthority] — EvidenceAuthority (verify leg)
   * @param {object} [options.knowledgeGraph] — KnowledgeGraph (context leg)
   */
  constructor(options = {}) {
    this._embedding = options.embeddingService || null;
    this._evidence = options.evidenceAuthority || null;
    this._kg = options.knowledgeGraph || null;
    this._stats = { semanticHits: 0, kgHits: 0, verified: 0, rejected: 0 };
  }

  /**
   * @param {object} params
   * @param {string} params.query — free-text query
   * @param {string} params.namespace — required privacy boundary (core::* / tenant::<id>)
   * @param {number} [params.limit=10]
   * @returns {Promise<{status:'ok', results:object[], total:number, stats:object}>}
   */
  async search({ query, namespace, limit = 10 }) {
    if (!query || typeof query !== 'string') {
      return { status: 'ok', results: [], total: 0, stats: this.getStats(), error: 'query required' };
    }

    const results = [];

    // ─── Semantic leg ─────────────────────────────────────────────
    if (this._embedding) {
      let hits = [];
      try {
        hits = await this._embedding.search(query, { limit: limit * 3 });
      } catch (err) {
        this._stats.rejected++;
        console.error(`[HybridSearch] embedding search failed: ${err.message}`);
      }
      for (const hit of hits || []) {
        const payload = hit.payload || {};
        if (namespace && payload.namespace !== namespace) continue; // privacy boundary
        let verified = null;
        if (this._evidence) {
          const verification = await this._evidence.verify(hit);
          verified = verification.verified;
          if (verified) this._stats.verified++;
          else this._stats.rejected++;
        }
        this._stats.semanticHits++;
        results.push({
          id: hit.id,
          canonical_hash: payload.canonical_hash || null,
          namespace: payload.namespace || namespace,
          confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
          evidence: payload.source_event_id ? [payload.source_event_id] : [],
          verified,
          source: 'qdrant',
          score: typeof hit.score === 'number' ? hit.score : null,
          embedding: payload.embedding || null,
          text: payload.text || null,
          kind: payload.kind || null,
        });
      }
    }

    // ─── Knowledge graph context leg ─────────────────────────────
    if (this._kg) {
      try {
        const nodes = await this._kg.queryNodes({
          search: query,
          namespace,
          limit,
        });
        for (const node of nodes || []) {
          this._stats.kgHits++;
          results.push({
            id: node.node_id,
            canonical_hash: (node.data && node.data.canonical_hash) || null,
            namespace: node.namespace,
            confidence: node.confidence,
            evidence: node.source_event_id ? [node.source_event_id] : [],
            verified: true, // stored node — already passed the graph write path
            source: 'knowledge',
            status: node.status,
            node_type: node.node_type,
            label: node.label,
            entity_id: node.entity_id,
          });
        }
      } catch (err) {
        this._stats.rejected++;
        console.error(`[HybridSearch] knowledge graph query failed: ${err.message}`);
      }
    }

    // ─── Rank ─────────────────────────────────────────────────────
    let ranked = results;
    if (this._evidence) {
      ranked = this._evidence.rank(results);
    } else {
      ranked = results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    ranked = ranked.slice(0, limit);

    return { status: 'ok', results: ranked, total: ranked.length, stats: this.getStats() };
  }

  getStats() {
    return { ...this._stats };
  }
}

module.exports = { HybridSearch };
