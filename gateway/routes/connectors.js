/**
 * Connector Routes — PING Core v1
 *
 * Connector interface + Capability introspection + OAuth onboarding.
 */

function createConnectorRoutes(connectorRegistry, capabilityRegistry, oauthManager) {
  const express = require('express');
  const router = express.Router();

  // ── Capability Introspection ───────────────────────────────────

  router.get('/capabilities', async (req, res) => {
    try {
      if (!capabilityRegistry) {
        return res.json({ status: 'degraded', message: 'CapabilityRegistry not initialized' });
      }
      const capabilities = capabilityRegistry.listCapabilities();
      res.json({ status: 'ok', capabilities, stats: capabilityRegistry.getStats() });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/capabilities/:category', async (req, res) => {
    try {
      if (!capabilityRegistry) {
        return res.status(503).json({ status: 'error', error: 'CapabilityRegistry not initialized' });
      }
      const status = capabilityRegistry.getCapabilityStatus(req.params.category);
      if (!status) return res.status(404).json({ status: 'error', error: `Unknown capability: ${req.params.category}` });
      res.json({ status: 'ok', capability: status });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/capabilities/reasoning/summary', async (req, res) => {
    try {
      if (!capabilityRegistry) {
        return res.status(503).json({ status: 'error', error: 'CapabilityRegistry not initialized' });
      }
      const summary = capabilityRegistry.getReasoningSummary();
      res.json({ status: 'ok', summary });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/capabilities/operation/:operation', async (req, res) => {
    try {
      if (!capabilityRegistry) {
        return res.status(503).json({ status: 'error', error: 'CapabilityRegistry not initialized' });
      }
      const results = capabilityRegistry.findOperation(req.params.operation);
      res.json({ status: 'ok', operation: req.params.operation, results });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ── Connector Interface ────────────────────────────────────────

  router.get('/', async (req, res) => {
    try {
      if (!connectorRegistry) {
        return res.json({ status: 'degraded', message: 'ConnectorRegistry not initialized' });
      }
      const connectors = connectorRegistry.list();
      const results = [];
      for (const entry of connectors) {
        const conn = connectorRegistry.get(entry.name);
        const health = await conn.health();
        results.push({ name: entry.name, provider: entry.provider, capabilities: entry.capabilities, health });
      }
      res.json({ status: 'ok', connectors: results, stats: connectorRegistry.getStats() });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/discover', async (req, res) => {
    try {
      const conn = getConnector(req.params.name, connectorRegistry);
      const result = await conn.discover();
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/health', async (req, res) => {
    try {
      const conn = getConnector(req.params.name, connectorRegistry);
      const result = await conn.health();
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.post('/:name/sync', async (req, res) => {
    try {
      const conn = getConnector(req.params.name, connectorRegistry);
      const { service, ...options } = req.body;
      const result = await conn.sync(service, options);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/events/:service', async (req, res) => {
    try {
      const conn = getConnector(req.params.name, connectorRegistry);
      const result = await conn.events(req.params.service, req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/search', async (req, res) => {
    try {
      const conn = getConnector(req.params.name, connectorRegistry);
      const result = await conn.search(req.query.q || '', req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ── OAuth Onboarding ───────────────────────────────────────────

  router.get('/:name/oauth/url', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const result = oauthManager.getAuthorizationUrl(req.params.name, {
        scopes: req.query.scopes ? req.query.scopes.split(',') : undefined,
        redirectTo: req.query.redirect_to || '/',
      });
      res.json({ status: 'ok', ...result });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/oauth/callback', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const result = await oauthManager.handleCallback(req.params.name, req.query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.post('/:name/oauth/refresh', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const result = await oauthManager.refreshToken(req.params.name);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.post('/:name/oauth/revoke', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const result = await oauthManager.revokeToken(req.params.name);
      res.json(result);
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  router.get('/:name/oauth/status', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const status = oauthManager.getStatus(req.params.name);
      res.json({ status: 'ok', connection: status });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ── API Key provisioning ───────────────────────────────────────

  router.post('/:name/apikey', async (req, res) => {
    try {
      if (!oauthManager) {
        return res.status(503).json({ status: 'error', error: 'OAuthManager not initialized' });
      }
      const { apiKey, apiSecret } = req.body;
      if (!apiKey) return res.status(400).json({ status: 'error', error: 'apiKey is required' });

      const config = oauthManager.getConfig(req.params.name);
      if (config && config.authType === 'api_key') {
        const tokenStore = oauthManager.getTokenStore();
        tokenStore.set(req.params.name, {
          access_token: apiKey,
          refresh_token: apiSecret || null,
          token_type: 'api_key',
          expires_in: null,
        });
        res.json({ status: 'ok', provider: req.params.name, message: 'API key stored' });
      } else {
        res.json({ status: 'error', error: 'Provider does not use API key auth or unknown provider' });
      }
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  return router;
}

function getConnector(name, registry) {
  if (!registry) throw new Error('ConnectorRegistry not initialized');
  const conn = registry.get(name);
  if (!conn) throw new Error(`Unknown connector: ${name}`);
  return conn;
}

module.exports = createConnectorRoutes;
