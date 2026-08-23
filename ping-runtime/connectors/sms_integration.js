// P054: SMS Integration Stub
// Stub for SMS delivery — not functional until Twilio/provider configured.

const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

class SmsIntegration {
  constructor(options = {}) {
    this._provider = options.provider || 'twilio';
    this._fromNumber = options.fromNumber || process.env.SMS_FROM || null;
    this._enabled = options.enabled !== false;
    this._sentSms = [];
  }

  async send(eventType, payload) {
    if (!this._enabled) {
      throw new Error('SMS integration is disabled');
    }
    const sms = {
      to: payload.to || '+10000000000',
      from: this._fromNumber || '+10000000000',
      body: `[TenantOS] ${eventType}: ${payload.message || JSON.stringify(payload)}`,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
    };
    this._sentSms.push(sms);
    return { status: 'queued', sms };
  }

  async health() {
    return {
      status: this._enabled ? 'healthy' : 'disabled',
      provider: this._provider,
      fromNumber: this._fromNumber || 'not configured',
      queuedSms: this._sentSms.length,
    };
  }

  capabilities() {
    return {
      name: 'sms',
      eventTypes: [
        'runtime.component_unhealthy',
        'deployment.failed',
      ],
    };
  }

  getSentSms() {
    return this._sentSms;
  }

  flush() {
    const sms = this._sentSms;
    this._sentSms = [];
    return sms;
  }
}

module.exports = { SmsIntegration };
