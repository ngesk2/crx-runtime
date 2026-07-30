// P035: Deployment Runtime Loader
// Runtime boots exclusively from deployment_manifest.json
// No manual startup configuration beyond infrastructure bootstrap.
// Manifest determines: enabled services, startup sequence, feature flags, runtime dependencies.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DeploymentLoader {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._manifest = null;
    this._services = new Map();
    this._hash = null;
  }

  load() {
    const manifestPath = path.join(this._repoRoot, 'gateway', 'generated', 'deployment_manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`[DeploymentLoader] deployment_manifest.json not found at ${manifestPath}`);
    }

    const raw = fs.readFileSync(manifestPath, 'utf8');
    this._manifest = JSON.parse(raw);

    this._validateManifest();
    this._indexServices();
    this._hash = this._computeHash();

    console.log(`[DeploymentLoader] Loaded ${this._services.size} services, startup order: ${this._manifest.startup_order.length} steps`);
    return this;
  }

  _validateManifest() {
    const required = ['schema_version', 'generator', 'services', 'startup_order'];
    for (const field of required) {
      if (!this._manifest[field]) {
        throw new Error(`[DeploymentLoader] Missing required field: ${field}`);
      }
    }
    if (!Array.isArray(this._manifest.services)) {
      throw new Error(`[DeploymentLoader] services must be an array`);
    }
    if (!Array.isArray(this._manifest.startup_order)) {
      throw new Error(`[DeploymentLoader] startup_order must be an array`);
    }
  }

  _indexServices() {
    for (const service of this._manifest.services) {
      if (!service.name) {
        throw new Error(`[DeploymentLoader] Service missing name: ${JSON.stringify(service).slice(0, 100)}`);
      }
      if (this._services.has(service.name)) {
        throw new Error(`[DeploymentLoader] Duplicate service: ${service.name}`);
      }
      this._services.set(service.name, service);
    }
  }

  getStartupOrder() {
    return [...this._manifest.startup_order];
  }

  getShutdownOrder() {
    return [...this._manifest.startup_order].reverse();
  }

  getService(serviceName) {
    return this._services.get(serviceName) || null;
  }

  getEnabledServices() {
    return Array.from(this._services.values())
      .filter(s => s.status !== 'disabled')
      .map(s => s.name);
  }

  getFeatureFlags() {
    return this._manifest.feature_flags || {};
  }

  getDependencies(serviceName) {
    const service = this._services.get(serviceName);
    if (!service) return [];
    return service.consumes || [];
  }

  validateStartup() {
    const issues = [];
    const serviceNames = new Set(this._services.keys());

    // Check all startup_order entries exist as services
    for (const name of this._manifest.startup_order) {
      if (!serviceNames.has(name)) {
        issues.push(`Startup order references unknown service: ${name}`);
      }
    }

    // Check service-to-service dependencies exist
    // Conceptual deps (e.g. "IdentityAuthority") are authority-level, not service-level
    for (const [name, service] of this._services) {
      for (const dep of (service.consumes || [])) {
        const looksLikeService = dep.endsWith('_service') || dep.includes('-');
        const depServiceName = dep.endsWith('_service') ? dep : `${dep}_service`;
        if (looksLikeService && !serviceNames.has(depServiceName) && !serviceNames.has(dep)) {
          issues.push(`Service '${name}' depends on unknown service: ${dep}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      serviceCount: this._services.size,
      startupOrderLength: this._manifest.startup_order.length,
    };
  }

  getHash() {
    return this._hash;
  }

  getStats() {
    return {
      totalServices: this._services.size,
      startupOrder: this._manifest.startup_order.length,
      featureFlags: Object.keys(this._manifest.feature_flags || {}).length,
      hash: this._hash,
    };
  }

  _computeHash() {
    const data = {
      services: Array.from(this._services.keys()).sort(),
      startupOrder: this._manifest.startup_order,
      featureFlags: Object.keys(this._manifest.feature_flags || {}).sort(),
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

module.exports = { DeploymentLoader };
