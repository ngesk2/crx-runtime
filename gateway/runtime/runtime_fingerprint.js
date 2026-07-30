// P039: Runtime Fingerprint
// Expose GET /runtime/fingerprint with full runtime state.
// Fleet will use this later for drift detection.

const crypto = require('crypto');

class RuntimeFingerprint {
  constructor(options = {}) {
    this._workflowExecutor = options.workflowExecutor || null;
    this._eventValidator = options.eventValidator || null;
    this._capabilityResolver = options.capabilityResolver || null;
    this._deploymentLoader = options.deploymentLoader || null;
    this._stateMachineExecutor = options.stateMachineExecutor || null;
    this._manifestHash = options.manifestHash || null;
    this._runtimeArtifactHash = options.runtimeArtifactHash || null;
    this._platformHash = options.platformHash || null;
  }

  getFingerprint() {
    const fingerprint = {
      platform_hash: this._platformHash,
      runtime_artifact_hash: this._runtimeArtifactHash,
      generation_manifest_hash: this._manifestHash,
      compiler_version: '1.0.0',
      artifact_versions: {
        workflow: this._workflowExecutor ? this._workflowExecutor.getHash() : null,
        events: this._eventValidator ? this._eventValidator.getHash() : null,
        capabilities: this._capabilityResolver ? this._capabilityResolver.getHash() : null,
        deployment: this._deploymentLoader ? this._deploymentLoader.getHash() : null,
        state_machine: this._stateMachineExecutor ? this._stateMachineExecutor.getHash() : null,
      },
      artifact_stats: {},
      computed_at: new Date().toISOString(),
    };

    // Add stats from each consumer
    if (this._workflowExecutor) {
      fingerprint.artifact_stats.workflows = this._workflowExecutor.getStats();
    }
    if (this._eventValidator) {
      fingerprint.artifact_stats.events = this._eventValidator.getStats();
    }
    if (this._capabilityResolver) {
      fingerprint.artifact_stats.capabilities = this._capabilityResolver.getStats();
    }
    if (this._deploymentLoader) {
      fingerprint.artifact_stats.deployment = this._deploymentLoader.getStats();
    }
    if (this._stateMachineExecutor) {
      fingerprint.artifact_stats.state_machines = this._stateMachineExecutor.getStats();
    }

    // Compute fingerprint hash
    const hashInput = JSON.stringify({
      platform_hash: fingerprint.platform_hash,
      runtime_artifact_hash: fingerprint.runtime_artifact_hash,
      generation_manifest_hash: fingerprint.generation_manifest_hash,
      artifact_versions: fingerprint.artifact_versions,
    });
    fingerprint.fingerprint_hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    Object.freeze(fingerprint);
    return fingerprint;
  }
}

module.exports = { RuntimeFingerprint };
