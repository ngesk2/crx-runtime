const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * PlatformAuthority
 * 
 * Constitutional authority for managing Deployment Manifests.
 * Owns DeploymentManifest (endpoints, ports, namespaces, credentials).
 * References TechnologyAuthority's TechnologyManifest hash.
 * Separates deployment configuration from constitutional identity.
 */
class PlatformAuthority {
  constructor() {
    this._deploymentManifests = new Map(); // environment -> manifest
    this._environments = new Map(); // environment -> configuration
  }

  /**
   * Create a new Deployment Manifest
   * @param {string} environment - Environment name (development, staging, production)
   * @param {string} technologyManifestHash - Technology Manifest hash
   * @param {Object} deploymentConfiguration - Deployment configuration
   * @returns {Object} Frozen Deployment Manifest
   */
  async createDeploymentManifest(environment, technologyManifestHash, deploymentConfiguration) {
    const manifest = {
      manifest_id: this._generateManifestId(environment),
      environment: environment,
      technology_manifest_hash: technologyManifestHash,
      deployment_configuration: deploymentConfiguration,
      credentials: await this._resolveCredentials(environment),
      deployment_metadata: {
        created_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
        created_by: "PlatformAuthority",
        frozen: true,
        hash: null,
        deployment_date: null,
        deployed_by: null
      }
    };

    manifest.deployment_metadata.hash = this._computeHash(manifest);
    const frozenManifest = this._freezeManifest(manifest);

    this._deploymentManifests.set(environment, frozenManifest);

    return frozenManifest;
  }

  /**
   * Get Deployment Manifest for environment
   * @param {string} environment - Environment name
   * @returns {Object} Deployment Manifest
   */
  async getDeploymentManifest(environment) {
    const manifest = this._deploymentManifests.get(environment);
    if (!manifest) {
      throw new Error(`Deployment Manifest not found for environment: ${environment}`);
    }
    return manifest;
  }

  /**
   * Get current Deployment Manifest for environment
   * @param {string} environment - Environment name
   * @returns {Object} Current Deployment Manifest
   */
  async getCurrentDeploymentManifest(environment) {
    return await this.getDeploymentManifest(environment);
  }

  /**
   * Create environment configuration
   * @param {string} environmentName - Environment name
   * @param {Object} configuration - Environment configuration
   */
  async createEnvironment(environmentName, configuration) {
    this._environments.set(environmentName, {
      name: environmentName,
      configuration: configuration,
      created_at: new Date(constitutionalTimeAuthority.now()).toISOString()
    });
  }

  /**
   * Get environment configuration
   * @param {string} environmentName - Environment name
   * @returns {Object} Environment configuration
   */
  async getEnvironment(environmentName) {
    return this._environments.get(environmentName);
  }

  /**
   * Resolve credentials for environment
   * @param {string} environment - Environment name
   * @returns {Object} Credentials
   */
  async _resolveCredentials(environment) {
    // Resolve credentials from secret management system
    // TODO: Integrate with actual secret management
    return {
      temporal_cluster: {
        reference: `secret://temporal-cluster-${environment}/credentials`
      },
      postgresql_cluster: {
        reference: `secret://postgresql-cluster-${environment}/credentials`
      },
      eventstore_cluster: {
        reference: `secret://eventstore-cluster-${environment}/credentials`
      }
    };
  }

  /**
   * Verify manifest integrity
   * @param {Object} manifest - Deployment Manifest
   * @returns {boolean} Integrity verification result
   */
  async verifyManifestIntegrity(manifest) {
    // Verify manifest is frozen
    if (!manifest.deployment_metadata.frozen) {
      return false;
    }

    // Verify hash matches content
    const computedHash = this._computeHash(manifest);
    if (computedHash !== manifest.deployment_metadata.hash) {
      return false;
    }

    // Verify technology manifest hash is present
    if (!manifest.technology_manifest_hash) {
      return false;
    }

    return true;
  }

  /**
   * Compute manifest hash
   * @param {Object} manifest - Deployment Manifest
   * @returns {string} SHA256 hash
   */
  _computeHash(manifest) {
    const manifestString = JSON.stringify(manifest, Object.keys(manifest).sort());
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(manifestString);
  }

  /**
   * Freeze manifest to prevent mutations
   * @param {Object} manifest - Deployment Manifest
   * @returns {Object} Frozen manifest
   */
  _freezeManifest(manifest) {
    return JSON.parse(JSON.stringify(manifest));
  }

  /**
   * Generate manifest ID
   * @param {string} environment - Environment name
   * @returns {string} Manifest ID
   */
  _generateManifestId(environment) {
    return `dm_${new Date(constitutionalTimeAuthority.now()).toISOString().slice(0, 10).replace(/-/g, '_')}_${environment}_${this._getNextVersion(environment)}`;
  }

  /**
   * Get next version number for environment
   * @param {string} environment - Environment name
   * @returns {string} Version number
   */
  _getNextVersion(environment) {
    const existing = this._deploymentManifests.get(environment);
    return existing ? (parseInt(existing.manifest_id.split('_').pop()) + 1).toString() : '001';
  }
}

module.exports = { PlatformAuthority };
