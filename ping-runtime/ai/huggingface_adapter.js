/**
 * HuggingFace Adapter — Subordinate to InferenceAdapter
 *
 * PING adapter layer for HuggingFace Inference API.
 * Provides sentiment analysis, zero-shot classification, translation,
 * summarization, and invoice parsing using free-tier HF models.
 *
 * Constitutional Constraint:
 *   - Adapter, not authority. Contains zero reasoning.
 *   - All calls route through InferenceAdapter for observability.
 *   - No direct pool.query(). All persistence via storage adapter.
 *   - No new npm dependencies. Uses Node.js global fetch.
 */

const HF_API_BASE = process.env.HF_API_BASE || 'https://api-inference.huggingface.co/models';
const HF_TOKEN = process.env.HF_TOKEN || '';
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

const MODELS = {
  sentiment:    'IberaSoft/customer-sentiment-analyzer',
  zeroShot:     'facebook/bart-large-mnli',
  invoiceParse: 'Kapilydv6/layoutlmv3-invoice-parser',
  enToEs:       'Helsinki-NLP/opus-mt-en-es',
  esToEn:       'Helsinki-NLP/opus-mt-es-en',
  summarization:'google/flan-t5-base',
};

class HuggingFaceAdapter {
  constructor(storage, options = {}) {
    this._storage = storage;
    this._apiBase = options.apiBase || HF_API_BASE;
    this._token = options.token || HF_TOKEN;
    this._models = { ...MODELS, ...options.models };
    this._dependencies = ['storage'];
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Build Authorization header for HuggingFace API
   */
  _authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }
    return headers;
  }

  /**
   * POST to a HuggingFace model endpoint with timeout and retry
   *
   * @param {string} modelKey - Key into MODELS map
   * @param {Object|string|Array} payload - Request body
   * @param {Object} [options]
   * @param {number} [options.timeoutMs=30000]
   * @param {number} [options.retries=1]
   * @returns {Promise<Object>}
   */
  async _infer(modelKey, payload, options = {}) {
    const { timeoutMs = 30000, retries = 1 } = options;
    const model = this._models[modelKey];
    if (!model) throw new Error(`Unknown model key: ${modelKey}`);

    const url = `${this._apiBase}/${model}`;
    const body = JSON.stringify(payload);
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this._authHeaders(),
          body,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HF API ${response.status}: ${text}`);
        }

        const result = await response.json();
        return { ok: true, model, result, latencyMs: timeoutMs - controller.signal.aborted ? timeoutMs : 0 };
      } catch (err) {
        clearTimeout(timer);
        lastError = err;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    return { ok: false, model, error: lastError.message };
  }

  /**
   * ExecuteSentimentCommand — Analyze review sentiment
   *
   * @param {Object} command
   * @param {string} command.text - Review text
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { sentiment, confidence, model }
   */
  async executeSentiment({ text, tenantId = 'hpp' } = {}) {
    if (!text) throw new Error('text is required');

    const result = await this._infer('sentiment', { inputs: text });
    if (!result.ok) {
      return { tenantId, sentiment: 'unknown', confidence: 0, error: result.error, model: result.model };
    }

    const raw = Array.isArray(result.result) ? result.result[0] : result.result;
    const label = raw?.label || 'unknown';
    const score = raw?.score || 0;

    return {
      tenantId,
      sentiment: label.toLowerCase(),
      confidence: score,
      model: result.model,
      analyzedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * ExecuteClassifyCommand — Zero-shot content classification
   *
   * @param {Object} command
   * @param {string} command.text - Content to classify
   * @param {string[]} command.labels - Candidate labels
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { classification, scores, model }
   */
  async executeClassify({ text, labels, tenantId = 'hpp' } = {}) {
    if (!text) throw new Error('text is required');
    if (!labels || !labels.length) throw new Error('labels array is required');

    const result = await this._infer('zeroShot', {
      inputs: text,
      parameters: { candidate_labels: labels },
    });
    if (!result.ok) {
      return { tenantId, classification: null, scores: [], error: result.error, model: result.model };
    }

    const raw = result.result;
    const classification = Array.isArray(raw?.labels) ? raw.labels[0] : null;
    const confidence = Array.isArray(raw?.scores) ? raw.scores[0] : 0;

    return {
      tenantId,
      classification,
      confidence,
      labels: raw?.labels || [],
      scores: raw?.scores || [],
      model: result.model,
      classifiedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * ExecuteTranslateCommand — English ↔ Spanish translation
   *
   * @param {Object} command
   * @param {string} command.text - Text to translate
   * @param {'en-to-es'|'es-to-en'} [command.direction='en-to-es']
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { translation, direction, model }
   */
  async executeTranslate({ text, direction = 'en-to-es', tenantId = 'hpp' } = {}) {
    if (!text) throw new Error('text is required');

    const modelKey = direction === 'es-to-en' ? 'esToEn' : 'enToEs';
    const result = await this._infer(modelKey, { inputs: text });
    if (!result.ok) {
      return { tenantId, translation: null, direction, error: result.error, model: result.model };
    }

    const translation = Array.isArray(result.result)
      ? result.result[0]?.translation_text || ''
      : result.result?.translation_text || '';

    return {
      tenantId,
      translation,
      direction,
      model: result.model,
      translatedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * ExecuteSummarizeCommand — Summarize project updates
   *
   * @param {Object} command
   * @param {string} command.text - Text to summarize
   * @param {number} [command.maxLength=150]
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { summary, model }
   */
  async executeSummarize({ text, maxLength = 150, tenantId = 'hpp' } = {}) {
    if (!text) throw new Error('text is required');

    const result = await this._infer('summarization', {
      inputs: text,
      parameters: { max_length: maxLength },
    });
    if (!result.ok) {
      return { tenantId, summary: null, error: result.error, model: result.model };
    }

    const summary = Array.isArray(result.result)
      ? result.result[0]?.summary_text || ''
      : result.result?.summary_text || '';

    return {
      tenantId,
      summary,
      model: result.model,
      summarizedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * ExecuteParseInvoiceCommand — Extract structured data from invoice image/text
   *
   * @param {Object} command
   * @param {string} command.input - Base64 image or extracted text
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { fields, model }
   */
  async executeParseInvoice({ input, tenantId = 'hpp' } = {}) {
    if (!input) throw new Error('input is required');

    const result = await this._infer('invoiceParse', { inputs: input });
    if (!result.ok) {
      return { tenantId, fields: {}, error: result.error, model: result.model };
    }

    const fields = {};
    const raw = result.result;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (item?.entity_group && item?.word) {
          const key = item.entity_group.toLowerCase();
          fields[key] = fields[key] ? `${fields[key]}, ${item.word}` : item.word;
        }
      }
    } else if (raw && typeof raw === 'object') {
      Object.assign(fields, raw);
    }

    return {
      tenantId,
      fields,
      model: result.model,
      parsedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * ExecuteBatchClassifyCommand — Classify multiple texts in one call
   *
   * @param {Object} command
   * @param {string[]} command.texts - Array of texts
   * @param {string[]} command.labels - Candidate labels
   * @param {string} [command.tenantId='hpp']
   * @returns {Promise<Object>} { results: Array, model }
   */
  async executeBatchClassify({ texts, labels, tenantId = 'hpp' } = {}) {
    if (!texts || !texts.length) throw new Error('texts array is required');
    if (!labels || !labels.length) throw new Error('labels array is required');

    const results = [];
    for (const text of texts) {
      const r = await this.executeClassify({ text, labels, tenantId });
      results.push(r);
    }

    return {
      tenantId,
      results,
      count: results.length,
      batchClassifiedAt: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  /**
   * Model health check
   *
   * @returns {Promise<Object>} { models: { key: status } }
   */
  async healthCheck() {
    const models = {};
    for (const [key, model] of Object.entries(this._models)) {
      models[key] = { model, status: 'configured' };
    }
    return { models, tokenConfigured: !!this._token };
  }
}

module.exports = { HuggingFaceAdapter };
