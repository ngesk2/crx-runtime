/**
 * AI Runtime Routes — PING Core v1
 * 
 * Universal model routing. Everything flows through this.
 */

function createAIRoutes(aiRuntime, ollamaProvider) {
  const express = require('express');
  const router = express.Router();

  // List providers and models
  router.get('/providers', (req, res) => {
    res.json({ status: 'ok', ...aiRuntime.list() });
  });

  // Health check all providers
  router.get('/health', async (req, res) => {
    try {
      const health = await aiRuntime.healthCheckAll();
      const allHealthy = Object.values(health).every(h => h.status === 'healthy');
      res.json({ status: allHealthy ? 'ok' : 'degraded', providers: health });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Chat completion
  router.post('/chat', async (req, res) => {
    try {
      const { prompt, model, provider, temperature, maxTokens } = req.body;
      const result = await aiRuntime.chat(prompt, { model, provider, temperature, maxTokens });
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Embed text
  router.post('/embed', async (req, res) => {
    try {
      const { text, model, provider, dimensions } = req.body;
      const result = await aiRuntime.embed(text, { model, provider, dimensions });
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Select best model for a task
  router.post('/select', (req, res) => {
    const { task, minTokens, preferProvider, preferLocal } = req.body;
    const selection = aiRuntime.selectModel({ task, minTokens, preferProvider, preferLocal });
    res.json({ status: 'ok', selection });
  });

  return router;
}

module.exports = createAIRoutes;
