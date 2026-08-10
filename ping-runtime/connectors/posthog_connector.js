/**
 * PostHog Connector — PING Core v1
 *
 * Implements the standardized Connector interface for PostHog analytics.
 * Wraps existing PostHogIntegration.
 *
 * Capabilities: analytics, events, metrics
 */

const { PostHogIntegration } = require('./posthog_integration');

class PostHogConnector {
  constructor(options = {}) {
    this._integration = new PostHogIntegration(options);
    this._lastSync = null;
  }

  async authenticate() {
    const health = await this._integration.health();
    return { status: health.status === 'healthy' ? 'ok' : 'error', error: health.apiKey === 'not configured' ? 'API key not configured' : null };
  }

  async discover() {
    const caps = this._integration.capabilities();
    return {
      status: 'ok',
      services: [{ name: 'posthog', capabilities: ['analytics', 'events'] }],
      eventTypes: caps.eventTypes,
    };
  }

  async health() {
    return this._integration.health();
  }

  async sync(service, options = {}) {
    const sentEvents = this._integration._sentEvents || [];
    this._lastSync = new Date().toISOString();
    return { status: 'ok', data: sentEvents, count: sentEvents.length };
  }

  async events(service, options = {}) {
    const syncResult = await this.sync(service, options);
    return {
      status: 'ok',
      events: (syncResult.data || []).map(e => ({
        source: 'posthog',
        type: e.event || 'ANALYTICS_EVENT',
        timestamp: e.timestamp,
        payload: e.properties,
      })),
    };
  }

  async objects(service, options = {}) {
    return this.sync(service, options);
  }

  async search(q, options = {}) {
    const all = this._integration._sentEvents || [];
    const query = q.toLowerCase();
    const results = all.filter(e => JSON.stringify(e).toLowerCase().includes(query));
    return { status: 'ok', results, count: results.length };
  }

  async permissions() {
    return {
      scopes: ['analytics:write'],
      services: ['posthog'],
    };
  }
}

module.exports = { PostHogConnector };
