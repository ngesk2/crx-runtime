/**
 * Knowledge Promoter — PING Core v1 (Phase F of Canonical Boundary)
 *
 * Turns explicit human approval into knowledge. Raw capture is observation
 * evidence (confidence < 1, status candidate); only a human signal promotes
 * it to knowledge (confidence 1.0, status approved). Rejection feeds negative
 * weight into ranking (EvidenceAuthority.rank down-ranks rejected nodes).
 *
 * Handles:
 *   SNIPPET_APPROVED      → approved (confidence 1.0)
 *   SNIPPET_REJECTED      → rejected (confidence 0.2)
 *   AI_RESPONSE_ACCEPTED  → approved (confidence 1.0)
 *   AI_RESPONSE_REJECTED  → rejected (confidence 0.2)
 *
 * Side-effect only — promotion updates the knowledge graph node lifecycle
 * fields (ADD-only: data is never rewritten). Returns a result object so the
 * WorkerRuntime can record completion.
 */

const { BaseWorker } = require('../workers/canonical_workers');

const APPROVE_EVENTS = new Set(['SNIPPET_APPROVED', 'AI_RESPONSE_ACCEPTED']);
const REJECT_EVENTS = new Set(['SNIPPET_REJECTED', 'AI_RESPONSE_REJECTED']);

class KnowledgePromoter extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'knowledge-promotion';
    this._knowledgeGraph = options.knowledgeGraph || null;
    if (!this._knowledgeGraph) {
      throw new Error('KnowledgePromoter requires knowledgeGraph');
    }
    this._stats = { handled: 0, approved: 0, rejected: 0, notFound: 0 };
  }

  async handle(event) {
    const eventType = event.eventType || event.event_type;
    const payload = event.payload || {};
    const sourceEventId = payload.sourceEventId;
    if (!sourceEventId) {
      return { promoted: false, reason: 'no sourceEventId in payload', status: null };
    }

    const approve = APPROVE_EVENTS.has(eventType);
    const reject = REJECT_EVENTS.has(eventType);
    if (!approve && !reject) {
      return { promoted: false, reason: `unhandled event type ${eventType}`, status: null };
    }

    const status = approve ? 'approved' : 'rejected';
    const confidence = approve ? 1.0 : 0.2;

    const updated = await this._knowledgeGraph.updateNodeBySourceEvent(sourceEventId, {
      status,
      confidence,
      namespace: payload.namespace,
    });

    this._stats.handled++;
    if (approve) this._stats.approved++;
    else this._stats.rejected++;
    if (!updated) this._stats.notFound++;

    return { promoted: updated, status, sourceEventId };
  }

  getStats() {
    return { ...this._stats };
  }
}

module.exports = { KnowledgePromoter, APPROVE_EVENTS, REJECT_EVENTS };
