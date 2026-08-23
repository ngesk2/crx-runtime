// Generation Manifest Loader
// P022: Makes GENERATION_MANIFEST.yaml executable.
// Responsibilities: load/validate manifest schema, compute hash,
// expose compiler version and generation timestamp, expose artifact inventory.
// Manifest is immutable runtime input. Hash is deterministic. Startup rejects invalid manifests.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const yaml = require('yaml');

const MANIFEST_SCHEMA = {
  required: ['schema_version', 'compiler_version', 'sources', 'artifacts', 'invariants'],
  artifactFields: ['path', 'description', 'generator'],
};

class GenerationManifestLoader {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._manifest = null;
    this._manifestHash = null;
  }

  /**
   * Load the generation manifest from GENERATION_MANIFEST.yaml.
   * Validates schema, computes hash.
   */
  load() {
    const manifestPath = path.join(this._repoRoot, 'GENERATION_MANIFEST.yaml');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`[GenerationManifest] GENERATION_MANIFEST.yaml not found at ${manifestPath}`);
    }

    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = yaml.parse(raw);

    this._validateSchema(manifest);
    this._manifest = manifest;
    this._manifestHash = this._computeHash(manifest);
    this._manifest.hash = this._manifestHash;

    console.log(`[GenerationManifest] Loaded — compiler ${manifest.compiler_version}, hash ${this._manifestHash.slice(0, 12)}...`);
    console.log(`[GenerationManifest] ${Object.keys(manifest.artifacts).length} artifacts registered`);

    return this;
  }

  /**
   * Validate manifest against required schema.
   */
  _validateSchema(manifest) {
    for (const field of MANIFEST_SCHEMA.required) {
      if (!manifest[field]) {
        throw new Error(`[GenerationManifest] Missing required field: ${field}`);
      }
    }

    for (const [name, artifact] of Object.entries(manifest.artifacts)) {
      for (const field of MANIFEST_SCHEMA.artifactFields) {
        if (!artifact[field]) {
          throw new Error(`[GenerationManifest] Artifact '${name}' missing field: ${field}`);
        }
      }
    }
  }

  /**
   * Compute deterministic hash of manifest content.
   */
  _computeHash(manifest) {
    const canonical = JSON.stringify(manifest, Object.keys(manifest).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Get the full manifest.
   */
  getManifest() {
    if (!this._manifest) throw new Error('Manifest not loaded. Call load() first.');
    return this._manifest;
  }

  /**
   * Get manifest hash.
   */
  getHash() {
    if (!this._manifestHash) throw new Error('Manifest not loaded. Call load() first.');
    return this._manifestHash;
  }

  /**
   * Get compiler version.
   */
  getCompilerVersion() {
    return this._manifest.compiler_version;
  }

  /**
   * Get generation timestamp.
   */
  getGenerationTimestamp() {
    return this._manifest.generation_timestamp;
  }

  /**
   * Get artifact inventory (name → path mapping).
   */
  getArtifactInventory() {
    const inventory = {};
    for (const [name, artifact] of Object.entries(this._manifest.artifacts)) {
      inventory[name] = {
        path: artifact.path,
        generator: artifact.generator,
        description: artifact.description,
      };
    }
    return inventory;
  }

  /**
   * Get the absolute path for a generated artifact.
   */
  getArtifactPath(artifactName) {
    const artifact = this._manifest.artifacts[artifactName];
    if (!artifact) throw new Error(`Unknown artifact: ${artifactName}`);
    return path.join(this._repoRoot, artifact.path);
  }

  /**
   * Check if a generated artifact file exists on disk.
   */
  artifactExists(artifactName) {
    const artifactPath = this.getArtifactPath(artifactName);
    return fs.existsSync(artifactPath);
  }

  /**
   * Get schema version.
   */
  getSchemaVersion() {
    return this._manifest.schema_version;
  }
}

module.exports = { GenerationManifestLoader };
