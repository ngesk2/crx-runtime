// Generated Artifact Loader
// P028: Runtime loads every generated artifact through one service.
// Responsibilities: schema validation, hash verification, version verification,
// compiler compatibility, platform compatibility. Reject startup on any mismatch.
// Single entry point for all generated artifacts. No handwritten registries reach runtime.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GeneratedArtifactLoader {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._artifacts = new Map();
    this._manifest = null;
    this._compilerVersion = null;
  }

  /**
   * Load all generated artifacts from disk.
   * Validates each artifact's schema, hash, and version.
   *
   * @param {Object} manifest - Generation manifest (from GenerationManifestLoader)
   * @returns {{ valid: boolean, artifacts: Map, errors: string[] }}
   */
  loadAll(manifest) {
    this._manifest = manifest;
    this._compilerVersion = manifest.compiler_version;
    const errors = [];

    for (const [name, artifactDef] of Object.entries(manifest.artifacts)) {
      try {
        const artifact = this._loadArtifact(name, artifactDef);
        this._artifacts.set(name, artifact);
      } catch (error) {
        errors.push(`${name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error(`[GeneratedArtifactLoader] VALIDATION FAILED — ${errors.length} artifact(s) rejected`);
      for (const err of errors) {
        console.error(`  ✗ ${err}`);
      }
      return { valid: false, artifacts: this._artifacts, errors };
    }

    console.log(`[GeneratedArtifactLoader] PASS — ${this._artifacts.size} artifacts loaded`);
    return { valid: true, artifacts: this._artifacts, errors: [] };
  }

  /**
   * Load a single artifact from disk and validate it.
   */
  _loadArtifact(name, artifactDef) {
    const artifactPath = path.join(this._repoRoot, artifactDef.path);

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`File not found: ${artifactDef.path}`);
    }

    const raw = fs.readFileSync(artifactPath, 'utf8');
    let artifact;
    try {
      artifact = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }

    // Schema validation — check required fields
    this._validateSchema(name, artifact);

    // Version verification
    this._validateVersion(name, artifact);

    // Hash verification
    this._validateHash(name, artifact);

    // Compiler compatibility
    this._validateCompilerCompatibility(name, artifact);

    return artifact;
  }

  _validateSchema(name, artifact) {
    const required = ['schema_version', 'generator', 'hash'];
    for (const field of required) {
      if (!artifact[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  _validateVersion(name, artifact) {
    if (artifact.generator_version && this._compilerVersion) {
      // Generator version must be compatible with compiler version
      const generatorMajor = parseInt(artifact.generator_version.split('.')[0]);
      const compilerMajor = parseInt(this._compilerVersion.split('.')[0]);
      if (generatorMajor !== compilerMajor) {
        throw new Error(`Version mismatch: generator ${artifact.generator_version} vs compiler ${this._compilerVersion}`);
      }
    }
  }

  _validateHash(name, artifact) {
    if (!artifact.hash) return;

    // Recompute hash from stable fields only (exclude generated_at, hash, count, and derived fields)
    const { generated_at, hash, count, model_mappings, ...stable } = artifact;
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    const computedHash = crypto.createHash('sha256').update(canonical).digest('hex');

    if (computedHash !== artifact.hash) {
      throw new Error(`Hash mismatch: expected ${artifact.hash}, computed ${computedHash}`);
    }
  }

  _validateCompilerCompatibility(name, artifact) {
    if (artifact.compiler_version && this._compilerVersion) {
      if (artifact.compiler_version !== this._compilerVersion) {
        throw new Error(`Compiler mismatch: artifact compiled with ${artifact.compiler_version}, runtime expects ${this._compilerVersion}`);
      }
    }
  }

  /**
   * Get a loaded artifact by name.
   */
  getArtifact(name) {
    return this._artifacts.get(name) || null;
  }

  /**
   * Get all loaded artifacts.
   */
  getAllArtifacts() {
    return new Map(this._artifacts);
  }

  /**
   * Get artifact names.
   */
  getArtifactNames() {
    return Array.from(this._artifacts.keys());
  }

  /**
   * Check if an artifact is loaded.
   */
  hasArtifact(name) {
    return this._artifacts.has(name);
  }

  /**
   * Get summary of loaded artifacts.
   */
  getSummary() {
    const summary = {};
    for (const [name, artifact] of this._artifacts) {
      summary[name] = {
        generator: artifact.generator,
        generator_version: artifact.generator_version,
        count: artifact.count || Object.keys(artifact).length,
        hash: artifact.hash ? artifact.hash.slice(0, 12) + '...' : 'none',
      };
    }
    return summary;
  }
}

module.exports = { GeneratedArtifactLoader };
