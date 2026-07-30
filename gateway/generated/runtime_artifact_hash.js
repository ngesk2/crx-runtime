// Runtime Artifact Hash
// P030: Compute Generated Runtime Hash.
// Generated Runtime Hash = Manifest + Workflow Registry + Event Registry +
// Capability Registry + Deployment Manifest + State Machines
// Expose from GET /constitution. Fleet compares this hash for drift detection.
// Deterministic: identical inputs -> identical hash. Hash changes iff any artifact changes.

const crypto = require('crypto');

/**
 * Compute the runtime artifact hash from all generated artifacts.
 *
 * @param {Object} manifest - Generation manifest
 * @param {Map<string, Object>} artifacts - Loaded artifacts
 * @returns {string} SHA-256 hash of the generated runtime
 */
function computeRuntimeArtifactHash(manifest, artifacts) {
  const parts = [];

  // Part 1: Manifest hash
  if (manifest && manifest.hash) {
    parts.push(`manifest:${manifest.hash}`);
  }

  // Part 2: Each artifact hash (sorted by name for determinism)
  const sortedNames = Array.from(artifacts.keys()).sort();
  for (const name of sortedNames) {
    const artifact = artifacts.get(name);
    if (artifact && artifact.hash) {
      parts.push(`${name}:${artifact.hash}`);
    }
  }

  // Compute final hash
  const input = parts.join('|');
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Get a detailed breakdown of the runtime artifact hash.
 *
 * @param {Object} manifest
 * @param {Map<string, Object>} artifacts
 * @returns {{ runtimeHash: string, breakdown: Object }}
 */
function getRuntimeArtifactBreakdown(manifest, artifacts) {
  const breakdown = {
    manifest_hash: manifest ? manifest.hash : null,
    compiler_version: manifest ? manifest.compiler_version : null,
    artifacts: {},
  };

  const sortedNames = Array.from(artifacts.keys()).sort();
  for (const name of sortedNames) {
    const artifact = artifacts.get(name);
    breakdown.artifacts[name] = {
      hash: artifact ? artifact.hash : null,
      generator: artifact ? artifact.generator : null,
      generator_version: artifact ? artifact.generator_version : null,
      count: artifact ? (artifact.count || 0) : 0,
    };
  }

  const runtimeHash = computeRuntimeArtifactHash(manifest, artifacts);

  return {
    runtimeHash,
    breakdown,
  };
}

module.exports = { computeRuntimeArtifactHash, getRuntimeArtifactBreakdown };
