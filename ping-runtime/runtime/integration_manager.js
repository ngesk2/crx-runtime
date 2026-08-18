// P051+P8: Integration Manager with Analytics Policy
// Uniform interface for all external integrations.
// Flow: Canonical Event → IntegrationManager → Policy Check → Redaction → Provider
// PING owns the plumbing. HPP owns the meaning.

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

class IntegrationManager {
  constructor(options = {}) {
    this._integrations = new Map();
    this._policy = options.policy || null;
    this._eventLog = [];
    this._maxLogSize = 1000;
    this._stats = { emitted: 0, policyBlocked: 0, sent: 0, errors: 0 };
  }

  registerIntegration(name, provider) {
    if (this._integrations.has(name)) {
      console.warn(`[IntegrationManager] Integration '${name}' already registered, overwriting`);
    }
    this._integrations.set(name, {
      provider,
      registeredAt: constitutionalTimeAuthority.nowAsISOString(),
      lastEventAt: null,
      eventCount: 0,
      errorCount: 0,
      status: 'healthy',
    });
    console.log(`[IntegrationManager] Registered integration: ${name}`);
    return true;
  }

  unregisterIntegration(name) {
    return this._integrations.delete(name);
  }

  setPolicy(policy) {
    this._policy = policy;
  }

  async emit(eventType, payload, options = {}) {
    this._stats.emitted++;
    const results = [];
    const eventClass = options.eventClass || 'system';
    const namespace = options.namespace || eventType.split('.')[0].split('_')[0].toLowerCase();

    for (const [name, integration] of this._integrations) {
      if (!this._shouldRoute(name, eventType)) continue;

      if (this._policy && !this._policy.isAllowedEventForIntegration(eventType, eventClass, namespace, name)) {
        this._stats.policyBlocked++;
        results.push({ integration: name, status: 'blocked', reason: 'policy' });
        this._logEvent(name, eventType, 'blocked', 'policy');
        continue;
      }

      let finalPayload = payload;
      if (this._policy) {
        finalPayload = this._policy.redactPayload(payload, name);
      }

      try {
        await integration.provider.send(eventType, finalPayload);
        integration.lastEventAt = constitutionalTimeAuthority.nowAsISOString();
        integration.eventCount++;
        integration.status = 'healthy';
        this._stats.sent++;
        results.push({ integration: name, status: 'sent' });
        this._logEvent(name, eventType, 'sent');
      } catch (err) {
        integration.errorCount++;
        integration.status = 'error';
        this._stats.errors++;
        results.push({ integration: name, status: 'error', error: err.message });
        this._logEvent(name, eventType, 'error', err.message);
      }
    }
    return results;
  }

  async getStatus() {
    const integrations = {};
    for (const [name, integration] of this._integrations) {
      let health = { status: integration.status };
      try {
        health = await integration.provider.health();
      } catch (_) {}
      integrations[name] = {
        status: integration.status,
        registeredAt: integration.registeredAt,
        lastEventAt: integration.lastEventAt,
        eventCount: integration.eventCount,
        errorCount: integration.errorCount,
        health,
      };
    }
    return {
      total: this._integrations.size,
      healthy: Object.values(integrations).filter(i => i.status === 'healthy').length,
      error: Object.values(integrations).filter(i => i.status === 'error').length,
      integrations,
      stats: { ...this._stats },
      policyActive: this._policy !== null,
    };
  }

  getIntegration(name) {
    return this._integrations.get(name) || null;
  }

  getStats() {
    return { ...this._stats };
  }

  _shouldRoute(integrationName, eventType) {
    const integration = this._integrations.get(integrationName);
    if (!integration) return false;
    if (integration.provider.capabilities && typeof integration.provider.capabilities === 'function') {
      const caps = integration.provider.capabilities();
      if (caps.eventTypes && caps.eventTypes.length > 0) {
        return caps.eventTypes.includes(eventType);
      }
    }
    return true;
  }

  _logEvent(integration, eventType, status, error) {
    this._eventLog.push({
      integration,
      eventType,
      status,
      error: error || null,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
      event_id: crypto.createHash('sha256').update(`${integration}:${eventType}:${constitutionalTimeAuthority.nowAsMillis()}`).digest('hex').slice(0, 16),
    });
    if (this._eventLog.length > this._maxLogSize) {
      this._eventLog = this._eventLog.slice(-this._maxLogSize);
    }
  }

  getEventLog(limit = 50) {
    return this._eventLog.slice(-limit);
  }
}

module.exports = { IntegrationManager };
