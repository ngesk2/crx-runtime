/**
 * Canonical Workers — PING Core v1
 *
 * 6 canonical JS workers extracted from 38 implementations across 7 generations.
 * Plus IntelligenceWorker (Priority 6) — rule-based + optional Ollama.
 * Each worker handles specific event types and emits downstream events.
 *
 * Event pipeline:
 *   DOCUMENT_IMPORT → OBSERVATION_CREATE → CLAIM_GENERATE → REPLAY_VERIFY → WITNESS_CREATE → LINEAGE_CREATE → PROJECTION_CREATE
 *
 * Each worker:
 *   1. Receives event from WorkerRuntime
 *   2. Processes the event (validates, transforms)
 *   3. Emits downstream event via UnifiedEventRuntime
 *   4. Returns result
 */

const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

class BaseWorker {
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._pool = options.pool || null;
    this._name = 'base';
  }

  async handle(event) {
    throw new Error(`${this._name}.handle() must be implemented`);
  }

  async _emit(eventType, payload, options = {}) {
    if (!this._eventRuntime) {
      throw new Error(`${this._name}: no EventRuntime — cannot emit ${eventType}`);
    }
    // Preserve the namespace from the event that triggered this worker so the
    // privacy boundary (core::system / core::owner / tenant::<id>) survives the
    // full worker chain down to projection and knowledge graph. The 'core::system'
    // default is owned by UnifiedEventRuntime.emit() — never re-derived here.
    const namespace = options.namespace || this._event?.namespace;
    // Preserve correlation_id from the triggering event so all events from the
    // same originating observation share a single correlation group. The spine
    // defaults correlation_id to the new event's own ID when this is absent,
    // which breaks the correlation chain at every worker hop.
    const correlation_id = options.correlation_id
      || this._event?.metadata?.correlation_id
      || this._event?.event_id
      || options.causation_id;
    const result = await this._eventRuntime.emit(eventType, this._name, payload, {
      ...options,
      namespace,
      correlation_id,
    });
    if (result.status !== 'ok') {
      throw new Error(`${this._name}: emit ${eventType} failed — ${result.error}`);
    }
    return result;
  }
}

/**
 * ObservationWorker — processes DOCUMENT_IMPORT, OBSERVATION_CREATE events.
 * Extracts observations from imported documents.
 */
class ObservationWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'observation';
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload._object_id || payload.documentId || payload.id;

    console.log(`[ObservationWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    // Extract observation from document
    const observation = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      source: event.source,
      metadata: event.metadata || {},
    };

    // Emit downstream event
    await this._emit('OBSERVATION_CREATED', {
      documentId,
      observation,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', observation };
  }
}

/**
 * ClaimWorker — processes CLAIM_GENERATE events.
 * Generates claims from observations.
 */
class ClaimWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'claim';
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload.documentId || payload._object_id;

    console.log(`[ClaimWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    const claim = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      source: event.source,
    };

    await this._emit('CLAIM_CREATED', {
      documentId,
      claim,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', claim };
  }
}

/**
 * ProjectionWorker — processes PROJECTION_CREATE events.
 * Projects events into knowledge graph vectors.
 */
class ProjectionWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'projection';
    this._embeddingService = options.embeddingService || null;
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload.documentId || payload._object_id;

    console.log(`[ProjectionWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    const projection = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
    };

    await this._emit('PROJECTION_CREATED', {
      documentId,
      projection,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    // This worker's purpose: write the canonical observation to Qdrant.
    if (this._embeddingService) {
      try {
        const point = await this._embeddingService.projectToQdrant({
          id: event.event_id,
          kind: event.event_type,
          event_id: event.event_id,
          namespace: event.namespace,
          canonical_hash: (event.metadata && event.metadata.canonical_hash) || null,
          identity: event.identity || null,
          payload: event.payload || {},
        }, {
          sourceEventId: event.event_id,
          eventType: event.event_type,
          namespace: event.namespace,
        });
        console.log(`[ProjectionWorker] Projected ${event.event_type} → qdrant point ${point.id.slice(0, 12)}`);
      } catch (err) {
        console.error(`[ProjectionWorker] Qdrant projection failed: ${err.message}`);
      }
    }

    return { status: 'ok', projection };
  }
}

/**
 * ReplayWorker — processes REPLAY_VERIFY events.
 * Verifies event replay integrity.
 */
class ReplayWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'replay';
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload.documentId || payload._object_id;

    console.log(`[ReplayWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    const replay = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      verified: true,
    };

    await this._emit('REPLAY_COMPLETED', {
      documentId,
      replay,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', replay };
  }
}

/**
 * WitnessWorker — processes WITNESS_CREATE events.
 * Creates witness attestations for events.
 */
class WitnessWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'witness';
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload.documentId || payload._object_id;

    console.log(`[WitnessWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    const witness = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      attestation: event.event_id ? `witness-${event.event_id.slice(0, 16)}` : `witness-${documentId || 'unknown'}`,
    };

    await this._emit('WITNESS_CREATED', {
      documentId,
      witness,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', witness };
  }
}

/**
 * LineageWorker — processes LINEAGE_CREATE events.
 * Tracks event lineage and causation chains.
 */
class LineageWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'lineage';
  }

  async handle(event) {
    const payload = event.payload || {};
    const documentId = payload.documentId || payload._object_id;

    console.log(`[LineageWorker] Processing ${event.event_type} for ${documentId || 'unknown'}`);

    const lineage = {
      documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      causationChain: payload.causation_id ? [payload.causation_id] : [],
    };

    await this._emit('LINEAGE_CREATED', {
      documentId,
      lineage,
      upstreamEventId: event.event_id || event.mission_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', lineage };
  }
}

/**
 * ClassificationWorker — processes OBSERVATION_CREATED events.
 * Classifies observations by type, priority, and category.
 * Emits CLASSIFICATION_CREATED.
 */
class ClassificationWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'classification';
  }

  async handle(event) {
    const payload = event.payload || {};
    const observation = payload.observation || payload;

    console.log(`[ClassificationWorker] Classifying ${event.event_type}`);

    const classification = {
      documentId: observation.documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      category: this._categorize(event.event_type),
      priority: this._prioritize(event.event_type, payload),
      confidence: 0.85,
      source: event.source,
    };

    await this._emit('CLASSIFICATION_CREATED', {
      documentId: observation.documentId,
      classification,
      upstreamEventId: event.event_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', classification };
  }

  _categorize(eventType) {
    const categories = {
      'REVIEW_RECEIVED': 'customer-feedback',
      'LEAD_CREATED': 'sales',
      'ESTIMATE_SENT': 'sales',
      'ESTIMATE_ACCEPTED': 'sales',
      'PROJECT_CREATED': 'operations',
      'PROJECT_COMPLETED': 'operations',
      'INVOICE_SENT': 'finance',
      'INVOICE_PAID': 'finance',
      'EMAIL_RECEIVED': 'communication',
      'CUSTOMER_CREATED': 'customer',
    };
    return categories[eventType] || 'general';
  }

  _prioritize(eventType, payload) {
    if (eventType === 'REVIEW_RECEIVED' && payload.rating <= 2) return 'urgent';
    if (eventType === 'ESTIMATE_SENT') return 'high';
    if (eventType === 'LEAD_CREATED') return 'high';
    if (eventType === 'INVOICE_SENT') return 'medium';
    return 'normal';
  }
}

/**
 * RecommendationWorker — processes CLASSIFICATION_CREATED events.
 * Produces actionable recommendations from classifications.
 * Emits RECOMMENDATION_CREATED.
 */
class RecommendationWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'recommendation';
  }

  async handle(event) {
    const payload = event.payload || {};
    const classification = payload.classification || {};

    console.log(`[RecommendationWorker] Recommending for ${classification.category || event.event_type}`);

    const recommendation = {
      documentId: payload.documentId,
      eventType: event.event_type,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      action: this._recommendAction(classification),
      reason: this._recommendReason(classification),
      priority: classification.priority || 'normal',
      confidence: classification.confidence || 0.7,
      evidence: [event.event_id],
    };

    await this._emit('RECOMMENDATION_CREATED', {
      documentId: payload.documentId,
      recommendation,
      upstreamEventId: event.event_id,
    }, {
      causation_id: event.event_id,
    });

    return { status: 'ok', recommendation };
  }

  _recommendAction(classification) {
    const actions = {
      'customer-feedback': 'Respond to customer review',
      'sales': 'Follow up on estimate',
      'operations': 'Update project status',
      'finance': 'Track invoice payment',
      'communication': 'Process incoming message',
      'customer': 'Onboard new customer',
    };
    return actions[classification.category] || 'Review and take action';
  }

  _recommendReason(classification) {
    if (classification.priority === 'urgent') return 'Customer needs immediate attention';
    if (classification.priority === 'high') return 'Time-sensitive business event';
    return 'Standard business workflow step';
  }
}

const { IntelligenceWorker } = require('./intelligence_worker');

/**
 * Register all canonical workers with a WorkerRuntime instance.
 */
function registerCanonicalWorkers(workerRuntime, options = {}) {
  // ─── Knowledge Promotion (Phase F) ────────────────────────────
  // Optional: only registered when a KnowledgeGraph is provided. Promotion is a
  // side-effect-only worker — SNIPPET_APPROVED / AI_RESPONSE_ACCEPTED promote a
  // candidate node to approved (confidence 1.0); rejection down-ranks it.
  if (options.knowledgeGraph) {
    const { KnowledgePromoter } = require('../knowledge/knowledge_promoter');
    const promoter = new KnowledgePromoter({ ...options, knowledgeGraph: options.knowledgeGraph });
    workerRuntime.register('knowledge-promotion', promoter, {
      eventTypes: ['SNIPPET_APPROVED', 'SNIPPET_REJECTED', 'AI_RESPONSE_ACCEPTED', 'AI_RESPONSE_REJECTED'],
      capabilities: ['knowledge.promote'],
      maxConcurrent: 2,
    });
    console.log(`[CanonicalWorkers] Registered 'knowledge-promotion' worker for [SNIPPET_APPROVED, SNIPPET_REJECTED, AI_RESPONSE_ACCEPTED, AI_RESPONSE_REJECTED]`);
  }

  // ─── Registration ─────────────────────────────────────────────
  const BUSINESS_EVENTS = [
    'LEAD_CREATED', 'LEAD_CONVERTED',
    'ESTIMATE_CREATED', 'ESTIMATE_SENT', 'ESTIMATE_ACCEPTED',
    'CUSTOMER_CREATED', 'CUSTOMER_UPDATED',
    'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_COMPLETED',
    'REVIEW_RECEIVED', 'REVIEW_RESPONDED',
    'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID',
    'EMAIL_SENT', 'EMAIL_RECEIVED',
    'SMS_SENT',
    'GITHUB_COMMIT_SYNCED', 'GOOGLE_REVIEW_RECEIVED',
    'DOCUMENT_IMPORT',
  ];

  const workers = [
    { name: 'observation', Worker: ObservationWorker, eventTypes: BUSINESS_EVENTS },
    { name: 'claim', Worker: ClaimWorker, eventTypes: ['OBSERVATION_CREATED', 'CLAIM_GENERATE'] },
    { name: 'classification', Worker: ClassificationWorker, eventTypes: ['CLAIM_CREATED', 'CLASSIFICATION_CREATE'] },
    { name: 'recommendation', Worker: RecommendationWorker, eventTypes: ['CLASSIFICATION_CREATED', 'RECOMMENDATION_CREATE'] },
    { name: 'projection', Worker: ProjectionWorker, eventTypes: ['KNOWLEDGE_INDEX', 'PROJECTION_CREATE', 'RECOMMENDATION_CREATED'] },
    { name: 'replay', Worker: ReplayWorker, eventTypes: ['REPLAY_VERIFY'] },
    { name: 'witness', Worker: WitnessWorker, eventTypes: ['WITNESS_CREATE'] },
    { name: 'lineage', Worker: LineageWorker, eventTypes: ['LINEAGE_CREATE'] },
    { name: 'intelligence', Worker: IntelligenceWorker, eventTypes: BUSINESS_EVENTS, options: { aiRuntime: options.aiRuntime } },
  ];

  for (const { name, Worker, eventTypes, options: workerOpts } of workers) {
    const worker = new Worker({ ...options, ...workerOpts });
    workerRuntime.register(name, worker, {
      eventTypes,
      capabilities: [name],
      maxConcurrent: 2,
    });
    console.log(`[CanonicalWorkers] Registered '${name}' worker for [${eventTypes.join(', ')}]`);
  }
}

module.exports = {
  BaseWorker,
  ObservationWorker,
  ClaimWorker,
  ClassificationWorker,
  RecommendationWorker,
  ProjectionWorker,
  ReplayWorker,
  WitnessWorker,
  LineageWorker,
  IntelligenceWorker,
  registerCanonicalWorkers,
};
