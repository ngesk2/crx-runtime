// P052: PostHog Integration
// Business events flow: HPP → Canonical Event Bus → IntegrationManager → PostHog
// PING owns the plumbing. HPP owns the meaning.

const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

class PostHogIntegration {
  constructor(options = {}) {
    this._apiKey = options.apiKey || process.env.POSTHOG_API_KEY || null;
    this._host = options.host || process.env.POSTHOG_HOST || 'https://app.posthog.com';
    this._enabled = options.enabled !== false;
    this._sentEvents = [];
  }

  async send(eventType, payload) {
    if (!this._enabled) {
      throw new Error('PostHog integration is disabled');
    }
    const event = {
      event: eventType,
      properties: payload,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
    };
    this._sentEvents.push(event);
    return { status: 'queued', event };
  }

  async health() {
    return {
      status: this._enabled ? 'healthy' : 'disabled',
      apiKey: this._apiKey ? `${this._apiKey.slice(0, 8)}...` : 'not configured',
      host: this._host,
      queuedEvents: this._sentEvents.length,
    };
  }

  capabilities() {
    return {
      name: 'posthog',
      eventTypes: [
        'tenant.created',
        'tenant.updated',
        'deployment.created',
        'deployment.status_changed',
        'runtime.component_registered',
        'runtime.component_removed',
        'capability.registered',
        'capability.resolved',
        'workflow.executed',
        'workflow.failed',
      ],
    };
  }

  getSentEvents() {
    return this._sentEvents;
  }

  flush() {
    const events = this._sentEvents;
    this._sentEvents = [];
    return events;
  }
}

module.exports = { PostHogIntegration };
