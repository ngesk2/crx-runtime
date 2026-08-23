/**
 * SMS Connector — PING Core v1
 *
 * Implements the standardized Connector interface for SMS delivery.
 * Wraps existing SmsIntegration.
 *
 * Capabilities: sms, alerts
 */

const { SmsIntegration } = require('./sms_integration');

class SMSConnector {
  constructor(options = {}) {
    this._integration = new SmsIntegration(options);
  }

  async authenticate() {
    const health = await this._integration.health();
    return { status: health.status === 'healthy' ? 'ok' : 'error', error: health.fromNumber === 'not configured' ? 'SMS not configured' : null };
  }

  async discover() {
    const caps = this._integration.capabilities();
    return {
      status: 'ok',
      services: [{ name: 'sms', capabilities: ['sms', 'alerts'] }],
      eventTypes: caps.eventTypes,
    };
  }

  async health() {
    return this._integration.health();
  }

  async sync(service, options = {}) {
    const sent = this._integration.getSentSms();
    return { status: 'ok', data: sent, count: sent.length };
  }

  async events(service, options = {}) {
    const syncResult = await this.sync(service, options);
    return {
      status: 'ok',
      events: (syncResult.data || []).map(e => ({
        source: 'sms',
        type: 'SMS_SENT',
        timestamp: e.timestamp,
        payload: { to: e.to, body: e.body },
      })),
    };
  }

  async objects(service, options = {}) {
    return this.sync(service, options);
  }

  async search(q, options = {}) {
    const all = this._integration.getSentSms();
    const query = q.toLowerCase();
    const results = all.filter(e => JSON.stringify(e).toLowerCase().includes(query));
    return { status: 'ok', results, count: results.length };
  }

  async permissions() {
    return {
      scopes: ['sms:send'],
      services: ['sms'],
    };
  }
}

module.exports = { SMSConnector };
