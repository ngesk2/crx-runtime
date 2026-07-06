/**
 * Ollama Routes
 * 
 * Bounded context for Ollama inference orchestration endpoints.
 * HTTP → InferenceAuthority → Result
 */

const express = require('express');
const router = express.Router();
const { getInferenceAdapter } = require('../inference_adapter');
const { asyncHandler } = require('../route_middleware');
const { constitutionalTimeAuthority } = require('../constitutional_time_authority');

const ROUTER_MODEL_7B = 'qwen2.5-coder:7b';
const ROUTER_MODEL_14B = 'qwen2.5-coder:14b';

async function invokeInference(messages, model) {
  const inferenceAdapter = getInferenceAdapter();
  const result = await inferenceAdapter.inference(messages, model);
  
  if (!result) {
    throw new Error('inference_failed_null_response');
  }

  return {
    content: result.message?.content || '',
    provider: inferenceAdapter.provider,
    model: model,
    raw: result
  };
}

router.post('/chat', asyncHandler('/api/v1/chat', async (req) => {
  const { messages = [] } = req.body;
  const started = constitutionalTimeAuthority.nowAsMillis();
  const result = await invokeInference(messages, ROUTER_MODEL_14B);
  const latency_ms = constitutionalTimeAuthority.nowAsMillis() - started;
  
  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
    latency_ms,
    routing: { model: ROUTER_MODEL_7B, confidence: 0.8 }
  };
}));

router.get('/models', asyncHandler('/api/v1/models', async (req) => {
  return {
    models: [
      { name: 'qwen2.5-coder:7b', provider: 'ollama' },
      { name: 'qwen2.5-coder:14b', provider: 'ollama' }
    ]
  };
}));

router.post('/autocomplete', asyncHandler('/api/v1/autocomplete', async (req) => {
  const { messages = [] } = req.body;
  const started = constitutionalTimeAuthority.nowAsMillis();
  const result = await invokeInference(messages, ROUTER_MODEL_7B);
  const latency_ms = constitutionalTimeAuthority.nowAsMillis() - started;
  
  return {
    content: result.content,
    provider: result.provider,
    model: result.model,
    latency_ms
  };
}));

module.exports = router;
