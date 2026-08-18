// P8: Analytics Policy Engine
// Determines: allowed operational metrics, forbidden business metrics,
// redaction rules, projection rules, retention class.
// IntegrationManager consults this policy before forwarding.

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');

const ALLOWED_OPERATIONAL_METRICS = [
  'event_count',
  'event_latency',
  'event_throughput',
  'event_error_rate',
  'worker_utilization',
  'worker_latency',
  'worker_throughput',
  'queue_depth',
  'queue_latency',
  'replay_duration',
  'replay_coverage',
  'health_status',
  'health_uptime',
  'health_memory',
  'drift_detected',
  'drift_hash_mismatch',
  'deployment_status',
  'deployment_duration',
  'capability_resolution_count',
  'capability_rejection_count',
  'schema_validation_count',
  'schema_validation_errors',
  'governance_violation_count',
  'integration_send_count',
  'integration_error_count',
  'integration_latency',
  'compiler_version',
  'runtime_artifact_hash',
  'platform_hash',
];

const FORBIDDEN_BUSINESS_METRICS = [
  'customer_id',
  'customer_email',
  'customer_name',
  'customer_phone',
  'customer_address',
  'payment_amount',
  'payment_currency',
  'payment_method',
  'order_total',
  'order_items',
  'revenue',
  'profit_margin',
  'marketing_campaign_id',
  'marketing_segment',
  'sales_pipeline_stage',
  'deal_value',
  'lead_score',
  'conversion_rate',
  'churn_rate',
  'lifetime_value',
  'acquisition_cost',
];

const REDACTION_RULES = {
  'payload.email': { action: 'redact', replacement: '[EMAIL]' },
  'payload.phone': { action: 'redact', replacement: '[PHONE]' },
  'payload.ssn': { action: 'redact', replacement: '[SSN]' },
  'payload.credit_card': { action: 'redact', replacement: '[CARD]' },
  'payload.password': { action: 'redact', replacement: '[REDACTED]' },
  'payload.token': { action: 'redact', replacement: '[TOKEN]' },
  'payload.api_key': { action: 'redact', replacement: '[KEY]' },
  'payload.secret': { action: 'redact', replacement: '[SECRET]' },
  'payload.ip_address': { action: 'hash', replacement: '[HASH]' },
  'payload.user_agent': { action: 'truncate', maxLength: 50 },
};

const PROJECTION_RULES = {
  posthog: {
    allowedEventClasses: ['system', 'observation'],
    allowedNamespaces: ['tenant', 'deployment', 'runtime', 'worker', 'capability', 'workflow', 'health', 'integration'],
    maxPayloadSize: 4096,
    redactPII: true,
    retentionDays: 90,
  },
  email: {
    allowedEventClasses: ['system'],
    allowedNamespaces: ['tenant', 'deployment'],
    maxPayloadSize: 2048,
    redactPII: true,
    retentionDays: 30,
  },
  sms: {
    allowedEventClasses: ['system'],
    allowedNamespaces: ['runtime', 'deployment'],
    maxPayloadSize: 256,
    redactPII: true,
    retentionDays: 7,
  },
  webhook: {
    allowedEventClasses: ['system', 'inference', 'observation'],
    allowedNamespaces: ['*'],
    maxPayloadSize: 8192,
    redactPII: false,
    retentionDays: 365,
  },
};

const RETENTION_CLASSES = {
  operational: { days: 90, description: 'Operational metrics and health data' },
  audit: { days: 365, description: 'Audit trail and governance violations' },
  transient: { days: 7, description: 'Transient state and debugging data' },
  permanent: { days: -1, description: 'Permanent records (events, certificates)' },
};

class AnalyticsPolicy {
  constructor() {
    this._allowedMetrics = new Set(ALLOWED_OPERATIONAL_METRICS);
    this._forbiddenMetrics = new Set(FORBIDDEN_BUSINESS_METRICS);
    this._redactionRules = new Map(Object.entries(REDACTION_RULES));
    this._projectionRules = new Map(Object.entries(PROJECTION_RULES));
    this._retentionClasses = new Map(Object.entries(RETENTION_CLASSES));
    this._violations = [];
    this._stats = { checked: 0, allowed: 0, blocked: 0, redacted: 0 };
  }

  isAllowedMetric(metricName) {
    this._stats.checked++;
    if (this._forbiddenMetrics.has(metricName)) {
      this._stats.blocked++;
      this._recordViolation('FORBIDDEN_METRIC', metricName);
      return false;
    }
    if (this._allowedMetrics.has(metricName)) {
      this._stats.allowed++;
      return true;
    }
    this._stats.allowed++;
    return true;
  }

  isAllowedEventForIntegration(eventType, eventClass, namespace, integrationName) {
    const rule = this._projectionRules.get(integrationName);
    if (!rule) return false;

    if (!rule.allowedEventClasses.includes(eventClass) && !rule.allowedEventClasses.includes('*')) {
      return false;
    }

    if (!rule.allowedNamespaces.includes(namespace) && !rule.allowedNamespaces.includes('*')) {
      return false;
    }

    return true;
  }

  redactPayload(payload, integrationName) {
    if (!payload || typeof payload !== 'object') return payload;

    const rule = this._projectionRules.get(integrationName);
    if (!rule || !rule.redactPII) return payload;

    const redacted = JSON.parse(JSON.stringify(payload));
    let redactedCount = 0;

    for (const [path, rRule] of this._redactionRules) {
      const parts = path.split('.');
      let current = redacted;
      let found = true;

      for (let i = 1; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
          found = false;
          break;
        }
        current = current[parts[i]];
      }

      if (found && current[parts[parts.length - 1]] !== undefined) {
        const field = parts[parts.length - 1];
        if (rRule.action === 'redact') {
          current[field] = rRule.replacement;
          redactedCount++;
        } else if (rRule.action === 'hash') {
          current[field] = crypto.createHash('sha256').update(String(current[field])).digest('hex').slice(0, 16);
          redactedCount++;
        } else if (rRule.action === 'truncate') {
          if (typeof current[field] === 'string' && current[field].length > rRule.maxLength) {
            current[field] = current[field].slice(0, rRule.maxLength) + '...';
            redactedCount++;
          }
        }
      }
    }

    if (redactedCount > 0) this._stats.redacted++;
    return redacted;
  }

  getProjectionRule(integrationName) {
    return this._projectionRules.get(integrationName) || null;
  }

  getRetentionClass(className) {
    return this._retentionClasses.get(className) || null;
  }

  getRedactionRules() {
    return Array.from(this._redactionRules.entries()).map(([path, rule]) => ({ path, ...rule }));
  }

  getAllowedMetrics() {
    return Array.from(this._allowedMetrics).sort();
  }

  getForbiddenMetrics() {
    return Array.from(this._forbiddenMetrics).sort();
  }

  getViolations(limit = 50) {
    return this._violations.slice(-limit);
  }

  getStats() {
    return { ...this._stats };
  }

  _recordViolation(code, detail) {
    this._violations.push({
      code,
      detail,
      timestamp: constitutionalTimeAuthority.nowAsISOString(),
    });
  }

  getHash() {
    const data = {
      allowed: Array.from(this._allowedMetrics).sort(),
      forbidden: Array.from(this._forbiddenMetrics).sort(),
      redaction: this._getRedactionRules().sort((a, b) => a.path.localeCompare(b.path)),
      projection: Array.from(this._projectionRules.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  _getRedactionRules() {
    return Array.from(this._redactionRules.entries()).map(([path, rule]) => ({ path, ...rule }));
  }
}

module.exports = { AnalyticsPolicy, ALLOWED_OPERATIONAL_METRICS, FORBIDDEN_BUSINESS_METRICS, REDACTION_RULES, PROJECTION_RULES, RETENTION_CLASSES };
