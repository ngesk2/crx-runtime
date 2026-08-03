/**
 * Ollama Routes
 *
 * Bounded context for Ollama inference orchestration endpoints.
 * HTTP → AI Runtime → Provider (Ollama) → Result
 *
 * Fixed: previously called non-existent inferenceAdapter.inference();
 * now routes through the AIRuntime (chat) and OllamaProvider (health/model list).
 */

const express = require('express');
const { constitutionalTimeAuthority } = require('../constitutional_time_authority');

const ROUTER_MODEL_7B = 'qwen2.5-coder:7b';
const ROUTER_MODEL_14B = 'qwen2.5-coder:14b';

function promptFromMessages(messages) {
  if (typeof messages === 'string') return messages;
  if (!Array.isArray(messages)) return '';
  return messages
    .map((m) => (typeof m === 'string' ? m : m && typeof m.content === 'string' ? m.content : ''))
    .join('\n');
}

function createOllamaRoutes(aiRuntime, ollamaProvider) {
  const router = express.Router();

  async function invokeInference(messages, model) {
    const result = await aiRuntime.chat(promptFromMessages(messages), { model });

    if (!result || result.status === 'error') {
      throw new Error(result && result.error ? result.error : 'inference_failed_null_response');
    }

    return {
      content: result.text || result.content || '',
      provider: 'ollama',
      model: result.model || model,
      raw: result,
    };
  }

  router.post('/chat', async (req, res) => {
    try {
      const { messages = [] } = req.body;
      const started = constitutionalTimeAuthority.nowAsMillis();
      const result = await invokeInference(messages, ROUTER_MODEL_14B);
      const latency_ms = constitutionalTimeAuthority.nowAsMillis() - started;

      res.json({
        content: result.content,
        provider: result.provider,
        model: result.model,
        latency_ms,
        routing: { model: ROUTER_MODEL_7B, confidence: 0.8 },
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/models', async (req, res) => {
    const fallback = [
      { name: 'qwen2.5-coder:7b', provider: 'ollama' },
      { name: 'qwen2.5-coder:14b', provider: 'ollama' },
    ];
    try {
      const health = await ollamaProvider.health();
      if (health.status === 'healthy' && Array.isArray(health.models) && health.models.length > 0) {
        res.json({ models: health.models.map((name) => ({ name, provider: 'ollama' })) });
        return;
      }
      res.json({ models: fallback, note: 'ollama_unreachable_using_static_list' });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.post('/autocomplete', async (req, res) => {
    try {
      const { messages = [] } = req.body;
      const started = constitutionalTimeAuthority.nowAsMillis();
      const result = await invokeInference(messages, ROUTER_MODEL_7B);
      const latency_ms = constitutionalTimeAuthority.nowAsMillis() - started;

      res.json({
        content: result.content,
        provider: result.provider,
        model: result.model,
        latency_ms,
      });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

module.exports = createOllamaRoutes;
