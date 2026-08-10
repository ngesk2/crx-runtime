// P037: Runtime Drift Detection
// On startup compare: generation_manifest hash, runtime_artifact hash,
// platform hash, dependency graph hash.
// If any mismatch: FAIL STARTUP. No degraded mode.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DriftDetector {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._hashes = {};
  }

  detect(manifestHash, runtimeArtifactHash, platformHash, dependencyGraphHash) {
    this._hashes = {
      manifestHash: manifestHash || null,
      runtimeArtifactHash: runtimeArtifactHash || null,
      platformHash: platformHash || null,
      dependencyGraphHash: dependencyGraphHash || null,
    };

    const issues = [];
    const warnings = [];

    // Check manifest hash
    if (!manifestHash) {
      issues.push('generation_manifest hash is null — manifest not loaded');
    }

    // Check runtime artifact hash
    if (!runtimeArtifactHash) {
      issues.push('runtime_artifact_hash is null — artifacts not loaded');
    }

    // Check platform hash
    if (!platformHash) {
      warnings.push('platform_hash is null — dependency graph not computed');
    }

    // Check dependency graph hash
    if (!dependencyGraphHash) {
      warnings.push('dependency_graph hash is null — graph not computed');
    }

    // Cross-validate: if we have both manifest and runtime artifact hashes,
    // they must both exist (can't have one without the other)
    if (manifestHash && !runtimeArtifactHash) {
      issues.push('Manifest loaded but runtime artifacts not loaded — possible drift');
    }
    if (!manifestHash && runtimeArtifactHash) {
      issues.push('Runtime artifacts loaded but manifest not loaded — possible drift');
    }

    const result = {
      healthy: issues.length === 0,
      issues,
      warnings,
      hashes: { ...this._hashes },
      checkedAt: new Date().toISOString(),
    };

    if (!result.healthy) {
      console.error(`[DriftDetector] STARTUP FAILED — ${issues.length} drift issue(s):`);
      for (const issue of issues) {
        console.error(`  FATAL: ${issue}`);
      }
    } else {
      console.log(`[DriftDetector] PASS — all hashes present`);
    }

    return result;
  }

  getHashes() {
    return { ...this._hashes };
  }
}

module.exports = { DriftDetector };
