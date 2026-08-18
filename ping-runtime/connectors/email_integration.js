// P054: Email Integration Stub
// Stub for email delivery — not functional until SMTP provider configured.

const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

class EmailIntegration {
  constructor(options = {}) {
    this._smtpHost = options.smtpHost || process.env.SMTP_HOST || null;
    this._fromAddress = options.fromAddress || process.env.EMAIL_FROM || 'noreply@tenantos.local';
    this._enabled = options.enabled !== false;
    this._sentEmails = [];
  }

  async send(eventType, payload) {
    if (!this._enabled) {
      throw new Error('Email integration is disabled');
    }
    const email = {
      to: payload.to || 'admin@tenantos.local',
      from: this._fromAddress,
      subject: `[TenantOS] ${eventType}`,
      body: JSON.stringify({ eventType, payload }),
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
    };
    this._sentEmails.push(email);
    return { status: 'queued', email };
  }

  async health() {
    return {
      status: this._enabled ? 'healthy' : 'disabled',
      smtpHost: this._smtpHost || 'not configured',
      queuedEmails: this._sentEmails.length,
    };
  }

  capabilities() {
    return {
      name: 'email',
      eventTypes: [
        'tenant.created',
        'tenant.removed',
        'deployment.failed',
        'capability.unknown',
      ],
    };
  }

  getSentEmails() {
    return this._sentEmails;
  }

  flush() {
    const emails = this._sentEmails;
    this._sentEmails = [];
    return emails;
  }
}

module.exports = { EmailIntegration };
