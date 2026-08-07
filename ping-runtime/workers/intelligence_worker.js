/**
 * IntelligenceWorker — PING Core v1 (Priority 6)
 *
 * One new worker. Uses existing AIRuntime when available.
 * Degrades to deterministic rule-based logic when Ollama is unavailable.
 * Never mutates business state. Never bypasses constitutional authority.
 * Only emits: CLASSIFICATION_CREATED, RECOMMENDATION_CREATED, EVIDENCE_CREATED.
 */

// Inline BaseWorker to avoid circular dependency with canonical_workers.js
class BaseWorker {
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._pool = options.pool || null;
    this._name = 'base';
  }
  async handle(event) { throw new Error(`${this._name}.handle() must be implemented`); }
  async _emit(eventType, payload, options = {}) {
    if (!this._eventRuntime) throw new Error(`${this._name}: no EventRuntime — cannot emit ${eventType}`);
    // Preserve the triggering event's namespace so the privacy boundary survives
    // the intelligence hop (mirrors canonical_workers.js BaseWorker._emit). The
    // 'core::system' default is owned by UnifiedEventRuntime.emit() only.
    const namespace = options.namespace || this._event?.namespace;
    const result = await this._eventRuntime.emit(eventType, this._name, payload, { ...options, namespace });
    if (result.status !== 'ok') throw new Error(`${this._name}: emit ${eventType} failed — ${result.error}`);
    return result;
  }
}

const BUSINESS_EVENT_CATEGORIES = {
  'LEAD_CREATED': { category: 'sales', priority: 'high', action: 'Follow up on new lead', reason: 'New lead requires immediate response' },
  'LEAD_CONVERTED': { category: 'sales', priority: 'normal', action: 'Update lead status', reason: 'Lead converted — update records' },
  'ESTIMATE_CREATED': { category: 'sales', priority: 'normal', action: 'Prepare estimate', reason: 'Estimate needs preparation' },
  'ESTIMATE_SENT': { category: 'sales', priority: 'high', action: 'Follow up on estimate', reason: 'Estimate sent — follow up within 48h' },
  'ESTIMATE_ACCEPTED': { category: 'sales', priority: 'normal', action: 'Start project', reason: 'Estimate accepted — begin project setup' },
  'REVIEW_RECEIVED': { category: 'customer-feedback', priority: 'high', action: 'Respond to customer review', reason: 'Customer review requires response' },
  'REVIEW_RESPONDED': { category: 'customer-feedback', priority: 'normal', action: 'Acknowledge review response', reason: 'Review response recorded' },
  'PROJECT_CREATED': { category: 'operations', priority: 'normal', action: 'Set up project', reason: 'New project requires setup' },
  'PROJECT_COMPLETED': { category: 'operations', priority: 'normal', action: 'Close out project', reason: 'Project completed — close out tasks' },
  'INVOICE_SENT': { category: 'finance', priority: 'high', action: 'Track invoice payment', reason: 'Invoice sent — monitor for payment' },
  'INVOICE_PAID': { category: 'finance', priority: 'normal', action: 'Record payment', reason: 'Payment received' },
  'EMAIL_RECEIVED': { category: 'communication', priority: 'normal', action: 'Process incoming message', reason: 'Email received' },
  'CUSTOMER_CREATED': { category: 'customer', priority: 'normal', action: 'Onboard new customer', reason: 'New customer requires onboarding' },
  'OBSERVATION_CREATED': { category: 'pipeline', priority: 'normal', action: 'Analyze observation', reason: 'Observation from upstream worker' },
};

class IntelligenceWorker extends BaseWorker {
  constructor(options = {}) {
    super(options);
    this._name = 'intelligence';
    this._aiRuntime = options.aiRuntime || null;
  }

  async handle(event) {
    const payload = event.payload || {};
    const eventType = event.event_type;

    // Step 1: Extract business context
    const context = this._extractContext(eventType, payload);

    // Step 2: Attempt AI analysis (degrade gracefully)
    let aiAnalysis = null;
    if (this._aiRuntime) {
      try {
        aiAnalysis = await this._aiRuntime.chat({
          model: 'qwen2.5-coder:7b',
          messages: [
            { role: 'system', content: 'You are a business intelligence assistant. Analyze the event and provide a brief classification and recommendation. Return JSON with { category, priority, action, reason, confidence }.' },
            { role: 'user', content: `Event: ${eventType}\nContext: ${JSON.stringify(context)}` },
          ],
        });
        if (aiAnalysis && aiAnalysis.content) {
          try { aiAnalysis = JSON.parse(aiAnalysis.content); } catch (_) { aiAnalysis = null; }
        }
      } catch (_) {
        aiAnalysis = null; // Ollama unavailable — use rule-based
      }
    }

    // Step 3: Merge AI analysis with rule-based defaults
    const ruleBased = BUSINESS_EVENT_CATEGORIES[eventType] || { category: 'general', priority: 'normal', action: 'Review event', reason: 'Unclassified business event' };
    const classification = {
      documentId: payload._object_id || payload.documentId || payload.review_id || payload.lead_id || payload.estimate_id || payload.invoice_id || payload.project_id || payload.customer_id,
      eventType,
      timestamp: new Date().toISOString(),
      category: aiAnalysis?.category || ruleBased.category,
      priority: aiAnalysis?.priority || ruleBased.priority,
      confidence: aiAnalysis?.confidence || 0.85,
      source: event.source,
      aiAnalyzed: !!aiAnalysis,
    };

    const recommendation = {
      documentId: classification.documentId,
      eventType,
      timestamp: new Date().toISOString(),
      action: aiAnalysis?.action || ruleBased.action,
      reason: aiAnalysis?.reason || ruleBased.reason,
      priority: classification.priority,
      confidence: classification.confidence,
      evidence: [event.event_id],
    };

    // Step 4: Emit CLASSIFICATION_CREATED
    await this._emit('CLASSIFICATION_CREATED', {
      documentId: classification.documentId,
      classification,
      upstreamEventId: event.event_id,
    }, { causation_id: event.event_id });

    // Step 5: Emit RECOMMENDATION_CREATED
    await this._emit('RECOMMENDATION_CREATED', {
      documentId: recommendation.documentId,
      recommendation,
      upstreamEventId: event.event_id,
    }, { causation_id: event.event_id });

    return { status: 'ok', classification, recommendation, aiAnalyzed: !!aiAnalysis };
  }

  _extractContext(eventType, payload) {
    return {
      eventType,
      source: payload.source,
      customerId: payload.customer_id,
      projectId: payload.project_id,
      estimateId: payload.estimate_id,
      reviewId: payload.review_id,
      invoiceId: payload.invoice_id,
      amount: payload.amount,
      rating: payload.rating,
      text: payload.text,
      description: payload.description,
    };
  }
}

module.exports = { IntelligenceWorker };
