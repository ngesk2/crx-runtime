/**
 * Connector Registry — PING Core v1
 * 
 * Every external provider implements the same interface.
 * PING doesn't know which provider it's using.
 * 
 * interface Connector {
 *   authenticate()
 *   discover()
 *   health()
 *   sync()
 *   events()
 *   objects()
 *   search()
 *   permissions()
 * }
 * 
 * Providers: Google, GitHub, Cloudflare, OCI, Stripe, Twilio,
 * Discord, Slack, Supabase, Neon, OpenAI, Anthropic, LiteLLM, Oracle, Resend
 */

class ConnectorRegistry {
  constructor() {
    this._connectors = new Map();
    this._byCapability = new Map();
    this._byProvider = new Map();
  }

  /**
   * Register a connector implementation.
   * @param {string} name — unique connector name (e.g., 'google-business-profile')
   * @param {object} connector — must implement Connector interface
   * @param {object} metadata — { provider, capabilities, version, description }
   */
  register(name, connector, metadata = {}) {
    if (this._connectors.has(name)) {
      throw new Error(`Connector '${name}' already registered`);
    }

    // Validate interface
    const required = ['authenticate', 'discover', 'health', 'sync', 'events', 'objects', 'search', 'permissions'];
    const missing = required.filter(method => typeof connector[method] !== 'function');
    if (missing.length > 0) {
      throw new Error(`Connector '${name}' missing methods: ${missing.join(', ')}`);
    }

    const entry = {
      name,
      connector,
      metadata: {
        provider: metadata.provider || 'unknown',
        capabilities: metadata.capabilities || [],
        version: metadata.version || '1.0.0',
        description: metadata.description || '',
        registeredAt: Date.now(),
        lastHealthCheck: null,
        healthStatus: 'unknown',
      },
    };

    this._connectors.set(name, entry);

    // Index by capability
    for (const cap of entry.metadata.capabilities) {
      if (!this._byCapability.has(cap)) {
        this._byCapability.set(cap, []);
      }
      this._byCapability.get(cap).push(name);
    }

    // Index by provider
    const provider = entry.metadata.provider;
    if (!this._byProvider.has(provider)) {
      this._byProvider.set(provider, []);
    }
    this._byProvider.get(provider).push(name);

    return entry;
  }

  /**
   * Get a connector by name.
   */
  get(name) {
    const entry = this._connectors.get(name);
    if (!entry) return null;
    return entry.connector;
  }

  /**
   * Get connector metadata.
   */
  getMetadata(name) {
    const entry = this._connectors.get(name);
    if (!entry) return null;
    return entry.metadata;
  }

  /**
   * Find connectors by capability.
   */
  findByCapability(capability) {
    const names = this._byCapability.get(capability) || [];
    return names.map(n => this._connectors.get(n));
  }

  /**
   * Find connectors by provider.
   */
  findByProvider(provider) {
    const names = this._byProvider.get(provider) || [];
    return names.map(n => this._connectors.get(n));
  }

  /**
   * List all registered connectors.
   */
  list() {
    return Array.from(this._connectors.values()).map(e => ({
      name: e.name,
      provider: e.metadata.provider,
      capabilities: e.metadata.capabilities,
      version: e.metadata.version,
      health: e.metadata.healthStatus,
    }));
  }

  /**
   * Run health checks on all connectors.
   */
  async healthCheckAll() {
    const results = {};
    for (const [name, entry] of this._connectors) {
      try {
        const health = await entry.connector.health();
        entry.metadata.lastHealthCheck = Date.now();
        entry.metadata.healthStatus = health.status || 'unknown';
        results[name] = health;
      } catch (err) {
        entry.metadata.healthStatus = 'error';
        results[name] = { status: 'error', error: err.message };
      }
    }
    return results;
  }

  /**
   * Get aggregate stats.
   */
  getStats() {
    const providers = {};
    let totalCapabilities = 0;
    for (const [, entry] of this._connectors) {
      const p = entry.metadata.provider;
      providers[p] = (providers[p] || 0) + 1;
      totalCapabilities += entry.metadata.capabilities.length;
    }
    return {
      totalConnectors: this._connectors.size,
      totalCapabilities,
      providers,
      capabilities: Array.from(this._byCapability.keys()),
    };
  }
}

module.exports = { ConnectorRegistry };
