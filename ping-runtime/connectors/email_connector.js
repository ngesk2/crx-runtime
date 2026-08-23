/**
 * Email Connector — PING Core v1
 *
 * Implements the standardized Connector interface for email delivery.
 * Wraps existing EmailIntegration.
 *
 * Capabilities: email, notifications
 */

const { EmailIntegration } = require('./email_integration');

class EmailConnector {
  constructor(options = {}) {
    this._integration = new EmailIntegration(options);
  }

  async authenticate() {
    const health = await this._integration.health();
    return { status: health.status === 'healthy' ? 'ok' : 'error', error: health.smtpHost === 'not configured' ? 'SMTP not configured' : null };
  }

  async discover() {
    const caps = this._integration.capabilities();
    return {
      status: 'ok',
      services: [{ name: 'email', capabilities: ['email', 'notifications'] }],
      eventTypes: caps.eventTypes,
    };
  }

  async health() {
    return this._integration.health();
  }

  async sync(service, options = {}) {
    const sent = this._integration.getSentEmails();
    return { status: 'ok', data: sent, count: sent.length };
  }

  async events(service, options = {}) {
    const syncResult = await this.sync(service, options);
    return {
      status: 'ok',
      events: (syncResult.data || []).map(e => ({
        source: 'email',
        type: 'EMAIL_SENT',
        timestamp: e.timestamp,
        payload: { to: e.to, subject: e.subject },
      })),
    };
  }

  async objects(service, options = {}) {
    return this.sync(service, options);
  }

  async search(q, options = {}) {
    const all = this._integration.getSentEmails();
    const query = q.toLowerCase();
    const results = all.filter(e => JSON.stringify(e).toLowerCase().includes(query));
    return { status: 'ok', results, count: results.length };
  }

  async permissions() {
    return {
      scopes: ['email:send'],
      services: ['email'],
    };
  }
}

module.exports = { EmailConnector };
