// Compiler Compatibility Verification
// P029: At startup, verify the full chain:
// compiler_version -> generation_manifest -> workflow_registry -> event_registry
// -> capability_registry -> deployment_manifest -> runtime
// If versions differ: FAIL STARTUP. Never run partially generated artifacts.
// All artifacts must be from the same compiler version.

class CompilerCompatibility {
  constructor(compilerVersion) {
    this._compilerVersion = compilerVersion;
    this._chain = [];
  }

  /**
   * Verify the full compatibility chain.
   *
   * @param {Object} manifest - Generation manifest
   * @param {Map<string, Object>} artifacts - Loaded artifacts
   * @returns {{ valid: boolean, chain: Object[], errors: string[] }}
   */
  verify(manifest, artifacts) {
    this._chain = [];
    const errors = [];

    // Link 1: Manifest → Compiler version
    this._chain.push({
      link: 'compiler → manifest',
      expected: this._compilerVersion,
      actual: manifest.compiler_version,
      match: manifest.compiler_version === this._compilerVersion,
    });
    if (manifest.compiler_version !== this._compilerVersion) {
      errors.push(`Manifest compiler_version ${manifest.compiler_version} != runtime ${this._compilerVersion}`);
    }

    // Link 2: Manifest → Each artifact
    for (const [name, artifactDef] of Object.entries(manifest.artifacts)) {
      const artifact = artifacts.get(name);
      if (!artifact) {
        errors.push(`Artifact '${name}' not loaded`);
        this._chain.push({
          link: `manifest → ${name}`,
          expected: 'present',
          actual: 'missing',
          match: false,
        });
        continue;
      }

      const chainLink = {
        link: `manifest → ${name}`,
        expected: this._compilerVersion,
        actual: artifact.generator_version || 'unknown',
        match: artifact.generator_version === this._compilerVersion,
      };
      this._chain.push(chainLink);

      if (artifact.generator_version !== this._compilerVersion) {
        errors.push(`Artifact '${name}' generator_version ${artifact.compiler_version} != compiler ${this._compilerVersion}`);
      }

      // Link 3: Artifact hash verification
      if (artifact.hash) {
        const { computeArtifactHash } = require('./runtime_artifact_hash');
        const contentForHash = { ...artifact };
        delete contentForHash.hash;
        const canonical = JSON.stringify(contentForHash, Object.keys(contentForHash).sort());
        const computedHash = require('crypto').createHash('sha256').update(canonical).digest('hex');
        const hashMatch = computedHash === artifact.hash;

        this._chain.push({
          link: `hash(${name})`,
          expected: artifact.hash.slice(0, 12) + '...',
          actual: computedHash.slice(0, 12) + '...',
          match: hashMatch,
        });

        if (!hashMatch) {
          errors.push(`Artifact '${name}' hash mismatch`);
        }
      }
    }

    const valid = errors.length === 0;

    if (valid) {
      console.log(`[CompilerCompatibility] PASS — ${this._chain.length} links verified, all match compiler ${this._compilerVersion}`);
    } else {
      console.error(`[CompilerCompatibility] FAIL — ${errors.length} mismatch(es)`);
      for (const err of errors) {
        console.error(`  ✗ ${err}`);
      }
    }

    return { valid, chain: this._chain, errors };
  }

  /**
   * Get the compatibility chain (must call verify first).
   */
  getChain() {
    return [...this._chain];
  }

  /**
   * Get compiler version.
   */
  getCompilerVersion() {
    return this._compilerVersion;
  }
}

module.exports = { CompilerCompatibility };
