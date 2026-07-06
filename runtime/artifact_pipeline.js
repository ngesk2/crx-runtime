/**
 * Artifact Pipeline
 * 
 * Phase 4.4 — ExecutionRuntime Refactoring
 * 
 * Responsible for:
 * - Freezing artifacts for immutability
 * - Computing canonical hashes
 * - Orchestrating artifact lifecycle
 * 
 * Pipeline:
 * Artifact → Freeze → Hash → Return
 */

class ArtifactPipeline {
  constructor(canonicalAuthority) {
    this._canonicalAuthority = canonicalAuthority;
  }

  /**
   * Process artifact through pipeline
   */
  async process(artifact) {
    // Step 1: Freeze artifact for immutability
    const frozenArtifact = this._freeze(artifact);

    // Step 2: Compute canonical hash using CanonicalAuthority
    if (!frozenArtifact.canonical_hash) {
      const canonicalSerialization = this._canonicalAuthority.serialize(frozenArtifact);
      frozenArtifact.canonical_hash = this._canonicalAuthority.hash(canonicalSerialization);
    }

    return frozenArtifact;
  }

  /**
   * Freeze object for immutability
   */
  _freeze(obj) {
    const freeze = (o) => {
      if (o === null || typeof o !== 'object') {
        return o;
      }

      if (Array.isArray(o)) {
        return Object.freeze(o.map(item => freeze(item)));
      }

      const frozen = {};
      for (const key of Object.keys(o)) {
        frozen[key] = freeze(o[key]);
      }
      return Object.freeze(frozen);
    };

    return freeze(obj);
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Artifact pipeline operational',
    };
  }
}

module.exports = { ArtifactPipeline };
