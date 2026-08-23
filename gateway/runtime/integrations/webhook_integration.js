// P053: Webhook Integration
// Generic webhook delivery for external system integration.

const https = require('https');
const http = require('http');

class WebhookIntegration {
  constructor(options = {}) {
    this._endpoints = options.endpoints || [];
    this._timeout = options.timeout || 5000;
    this._retries = options.retries || 0;
  }

  registerEndpoint(name, url, options = {}) {
    this._endpoints.push({
      name,
      url,
      headers: options.headers || {},
      eventTypes: options.eventTypes || [],
      enabled: options.enabled !== false,
    });
    return true;
  }

  async send(eventType, payload) {
    const activeEndpoints = this._endpoints.filter(
      e => e.enabled && (e.eventTypes.length === 0 || e.eventTypes.includes(eventType))
    );

    if (activeEndpoints.length === 0) {
      return { status: 'no_endpoints', eventType };
    }

    const results = [];
    for (const endpoint of activeEndpoints) {
      try {
        await this._deliverWebhook(endpoint, eventType, payload);
        results.push({ endpoint: endpoint.name, status: 'sent' });
      } catch (err) {
        results.push({ endpoint: endpoint.name, status: 'error', error: err.message });
      }
    }
    return { status: 'completed', results };
  }

  async health() {
    return {
      status: 'healthy',
      endpoints: this._endpoints.length,
      activeEndpoints: this._endpoints.filter(e => e.enabled).length,
    };
  }

  capabilities() {
    return {
      name: 'webhook',
      eventTypes: ['*'],
    };
  }

  async _deliverWebhook(endpoint, eventType, payload) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });
      const url = new URL(endpoint.url);
      const transport = url.protocol === 'https:' ? https : http;
      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...endpoint.headers,
          },
          timeout: this._timeout,
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: res.statusCode, body: data });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.write(body);
      req.end();
    });
  }

  getEndpoints() {
    return this._endpoints.map(e => ({
      name: e.name,
      url: e.url,
      enabled: e.enabled,
      eventTypes: e.eventTypes,
    }));
  }
}

module.exports = { WebhookIntegration };
