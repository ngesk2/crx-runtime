/**
 * Capability Registry — PING Core v1
 *
 * Every capability has full metadata so PING can reason about it:
 *   "I can send email."
 *   "I cannot schedule Google Calendar because authorization is missing."
 *   "Stripe is connected."
 *   "QuickBooks needs OAuth."
 *
 * Capabilities are stable. Providers are interchangeable.
 * PING depends only on capability contracts, never on providers.
 */

const { CAPABILITY_CONTRACTS, getContract } = require('./constitutional_capability_contract');

class CapabilityRegistry {
  constructor(options = {}) {
    this._oauthManager = options.oauthManager || null;
    this._connectorRegistry = options.connectorRegistry || null;

    // capability → provider → entry
    this._capabilities = new Map();

    // provider → capability[] (reverse index)
    this._providerCapabilities = new Map();

    // Initialize from constitutional contracts
    this._initContracts();
  }

  _initContracts() {
    for (const [category, contract] of Object.entries(CAPABILITY_CONTRACTS)) {
      const capEntry = {
        category,
        description: contract.description,
        operations: contract.operations,
        providers: [], // populated as providers register
        defaultProvider: contract.defaultProvider,
        connected: false,
        lastVerified: null,
        health: 'unknown',
      };
      this._capabilities.set(category, capEntry);
    }
  }

  /**
   * Register a provider for a capability.
   *
   * @param {string} capability — capability category (e.g., 'communication')
   * @param {string} providerName — provider identifier (e.g., 'gmail')
   * @param {object} metadata
   * @param {string} metadata.authenticationMethod — 'oauth2' | 'api_key' | 'basic_auth'
   * @param {string[]} metadata.requiredPermissions — scopes or permissions needed
   * @param {object} metadata.operations — which operations this provider implements
   */
  registerProvider(capability, providerName, metadata = {}) {
    if (!this._capabilities.has(capability)) {
      throw new Error(`Unknown capability: ${capability}. Must be one of: ${Array.from(this._capabilities.keys()).join(', ')}`);
    }

    const capEntry = this._capabilities.get(capability);

    // Check for duplicate
    const existing = capEntry.providers.find(p => p.name === providerName);
    if (existing) {
      throw new Error(`Provider '${providerName}' already registered for capability '${capability}'`);
    }

    const providerEntry = {
      name: providerName,
      authenticationMethod: metadata.authenticationMethod || 'oauth2',
      requiredPermissions: metadata.requiredPermissions || [],
      operations: metadata.operations || Object.keys(capEntry.operations),
      connected: false,
      connectedAt: null,
      lastVerified: null,
      health: 'unknown',
      lastHealthCheck: null,
      healthError: null,
    };

    capEntry.providers.push(providerEntry);

    // Update reverse index
    if (!this._providerCapabilities.has(providerName)) {
      this._providerCapabilities.set(providerName, []);
    }
    this._providerCapabilities.get(providerName).push(capability);

    return providerEntry;
  }

  /**
   * Mark a provider as connected (after successful OAuth or API key verification).
   */
  markConnected(capability, providerName) {
    const provider = this._getProvider(capability, providerName);
    if (!provider) throw new Error(`Provider '${providerName}' not found for capability '${capability}'`);
    provider.connected = true;
    provider.connectedAt = Date.now();
    this._recomputeCapabilityStatus(capability);
  }

  /**
   * Mark a provider as disconnected.
   */
  markDisconnected(capability, providerName) {
    const provider = this._getProvider(capability, providerName);
    if (!provider) return;
    provider.connected = false;
    provider.connectedAt = null;
    provider.lastVerified = null;
    provider.health = 'unknown';
    this._recomputeCapabilityStatus(capability);
  }

  /**
   * Update health status for a provider.
   */
  updateHealth(capability, providerName, healthStatus) {
    const provider = this._getProvider(capability, providerName);
    if (!provider) return;
    provider.health = healthStatus.status || 'unknown';
    provider.lastHealthCheck = Date.now();
    if (healthStatus.status === 'error') {
      provider.healthError = healthStatus.error || null;
    } else {
      provider.healthError = null;
    }
    provider.lastVerified = Date.now();
    this._recomputeCapabilityStatus(capability);
  }

  _recomputeCapabilityStatus(capability) {
    const capEntry = this._capabilities.get(capability);
    if (!capEntry) return;
    capEntry.connected = capEntry.providers.some(p => p.connected);
    const healthStates = capEntry.providers.filter(p => p.connected).map(p => p.health);
    if (healthStates.length === 0) {
      capEntry.health = 'disconnected';
    } else if (healthStates.every(h => h === 'healthy')) {
      capEntry.health = 'healthy';
    } else if (healthStates.some(h => h === 'healthy')) {
      capEntry.health = 'degraded';
    } else {
      capEntry.health = 'error';
    }
    capEntry.lastVerified = Date.now();
  }

  _getProvider(capability, providerName) {
    const capEntry = this._capabilities.get(capability);
    if (!capEntry) return null;
    return capEntry.providers.find(p => p.name === providerName) || null;
  }

  // ── Query Methods ──────────────────────────────────────────────

  /**
   * Get all capabilities and their connection status.
   * This is the main introspection endpoint.
   */
  getCapabilityStatus(capability) {
    const capEntry = this._capabilities.get(capability);
    if (!capEntry) return null;

    return {
      category: capEntry.category,
      description: capEntry.description,
      connected: capEntry.connected,
      health: capEntry.health,
      lastVerified: capEntry.lastVerified,
      operations: capEntry.operations ? Object.keys(capEntry.operations) : [],
      providers: capEntry.providers.map(p => ({
        name: p.name,
        authenticationMethod: p.authenticationMethod,
        requiredPermissions: p.requiredPermissions,
        connected: p.connected,
        connectedAt: p.connectedAt,
        lastVerified: p.lastVerified,
        health: p.health,
        healthError: p.healthError,
        operations: p.operations,
      })),
    };
  }

  /**
   * List all capabilities.
   */
  listCapabilities() {
    const result = [];
    for (const [category, capEntry] of this._capabilities) {
      result.push(this.getCapabilityStatus(category));
    }
    return result;
  }

  /**
   * Find capabilities by provider.
   */
  findByProvider(providerName) {
    const capabilities = this._providerCapabilities.get(providerName) || [];
    return capabilities.map(cap => this.getCapabilityStatus(cap)).filter(Boolean);
  }

  /**
   * Check if a specific operation is available.
   * Returns the best provider for the operation.
   */
  findOperation(operationName) {
    const results = [];
    for (const [category, capEntry] of this._capabilities) {
      if (capEntry.operations && capEntry.operations[operationName]) {
        const connectedProviders = capEntry.providers.filter(p => p.connected && p.operations.includes(operationName));
        results.push({
          capability: category,
          operation: operationName,
          available: connectedProviders.length > 0,
          providers: connectedProviders.map(p => p.name),
          allProviders: capEntry.providers.map(p => p.name),
          health: capEntry.health,
        });
      }
    }
    return results;
  }

  /**
   * Get reasoning-friendly status string.
   * "I can send email via Gmail."
   * "I cannot schedule appointments — no Calendar provider connected."
   */
  getReasoningSummary() {
    const can = [];
    const cannot = [];
    const needsHelp = [];

    for (const [category, capEntry] of this._capabilities) {
      const connected = capEntry.providers.filter(p => p.connected);
      const available = capEntry.providers.filter(p => p.connected && p.health === 'healthy');

      const ops = Object.keys(capEntry.operations || {}).join(', ');

      if (available.length > 0) {
        can.push(`I can ${ops} via ${available.map(p => p.name).join(', ')}.`);
      } else if (connected.length > 0) {
        const unhealthy = connected.filter(p => p.health !== 'healthy');
        needsHelp.push(`I have ${connected.map(p => p.name).join(', ')} connected for ${category} but health is ${unhealthy.map(p => p.health).join(', ')}.`);
        can.push(`I can ${ops} (degraded).`);
      } else {
        const availableProviders = capEntry.providers.map(p => `${p.name} (${p.authenticationMethod})`).join(', ');
        cannot.push(`I cannot ${ops} — no ${category} provider connected. Available: ${availableProviders}`);
      }
    }

    return { can, cannot, needsHelp };
  }

  /**
   * Get aggregate stats.
   */
  getStats() {
    const total = this._capabilities.size;
    const connected = Array.from(this._capabilities.values()).filter(c => c.connected).length;
    const healthy = Array.from(this._capabilities.values()).filter(c => c.health === 'healthy').length;
    const totalProviders = Array.from(this._capabilities.values())
      .reduce((sum, c) => sum + c.providers.length, 0);
    const connectedProviders = Array.from(this._capabilities.values())
      .reduce((sum, c) => sum + c.providers.filter(p => p.connected).length, 0);

    return { total, connected, healthy, totalProviders, connectedProviders };
  }
}

module.exports = { CapabilityRegistry };
