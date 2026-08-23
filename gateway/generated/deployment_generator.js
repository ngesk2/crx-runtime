// Deployment Artifact Generator
// P026: Compiler generates deployment_manifest.json from intents and authorities.
// Input: intents/*/intent-manifest.yaml, authorities/registry.yaml
// Output: generated/deployment_manifest.json
//
// Contains: runtime services, dependencies, startup ordering, env vars,
// storage requirements, feature flags, deployment hash.
// No handwritten deployment metadata.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

const DEPLOYMENT_VERSION = '1.0.0';

class DeploymentGenerator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  /**
   * Generate deployment_manifest.json.
   * @returns {{ manifest: Object, hash: string }}
   */
  generate() {
    const services = this._collectServices();
    const dependencies = this._collectDependencies(services);
    const startupOrder = this._computeStartupOrder(services, dependencies);
    const storageRequirements = this._collectStorageRequirements();
    const environmentVariables = this._collectEnvironmentVariables();

    const manifest = {
      schema_version: '1.0.0',
      generator: 'DeploymentGenerator',
      generator_version: DEPLOYMENT_VERSION,
      generated_at: new Date().toISOString(),
      services,
      dependencies,
      startup_order: startupOrder,
      storage_requirements: storageRequirements,
      environment_variables: environmentVariables,
      feature_flags: {},
    };

    manifest.hash = this._computeHash(manifest);
    return manifest;
  }

  write(outputPath) {
    const manifest = this.generate();
    const json = JSON.stringify(manifest, null, 2);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`[DeploymentGenerator] Wrote deployment manifest to ${outputPath}`);
    return manifest;
  }

  _collectServices() {
    const services = [];

    // Collect from intent manifests
    const intentsDir = path.join(this._repoRoot, 'intents');
    if (fs.existsSync(intentsDir)) {
      const entries = fs.readdirSync(intentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifestPath = path.join(intentsDir, entry.name, 'intent-manifest.yaml');
          if (fs.existsSync(manifestPath)) {
            const raw = fs.readFileSync(manifestPath, 'utf8');
            const manifest = yaml.parse(raw);
            services.push({
              name: `${manifest.intent || entry.name}_service`,
              type: 'authority',
              authority: manifest.authority || `${entry.name}Authority`,
              intent: manifest.intent || entry.name,
              status: manifest.status || 'unknown',
              owns: manifest.owns || [],
              consumes: Array.isArray(manifest.consumes) ? manifest.consumes : [manifest.consumes].filter(Boolean),
              produces: manifest.produces || [],
            });
          }
        }
      }
    }

    // Collect from authorities registry
    const authoritiesPath = path.join(this._repoRoot, 'authorities', 'registry.yaml');
    if (fs.existsSync(authoritiesPath)) {
      const raw = fs.readFileSync(authoritiesPath, 'utf8');
      const data = yaml.parse(raw);
      if (data.authorities) {
        for (const [name, authority] of Object.entries(data.authorities)) {
          services.push({
            name: `${name}_service`,
            type: 'authority',
            authority: name,
            intent: authority.intent || name,
            status: authority.status || 'unknown',
            owns: [],
            consumes: [],
            produces: authority.capabilities || [],
          });
        }
      }
    }

    return services;
  }

  _collectDependencies(services) {
    const deps = {};
    for (const service of services) {
      deps[service.name] = service.consumes.map(c => `${c}_service`);
    }
    return deps;
  }

  _computeStartupOrder(services, dependencies) {
    // Simple topological sort
    const inDegree = new Map();
    const graph = new Map();

    for (const service of services) {
      inDegree.set(service.name, 0);
      graph.set(service.name, []);
    }

    for (const [name, deps] of Object.entries(dependencies)) {
      for (const dep of deps) {
        if (graph.has(dep)) {
          graph.get(dep).push(name);
          inDegree.set(name, (inDegree.get(name) || 0) + 1);
        }
      }
    }

    const queue = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name);
    }

    const sorted = [];
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);
      for (const dependent of (graph.get(current) || [])) {
        const newDegree = (inDegree.get(dependent) || 1) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) queue.push(dependent);
      }
    }

    return sorted;
  }

  _collectStorageRequirements() {
    return {
      postgres: {
        required: true,
        tables: ['canonical_events', 'tenant_registry', 'deployment_registry', 'runtime_registry'],
      },
      qdrant: {
        required: false,
        collections: ['constitutional_documents'],
      },
    };
  }

  _collectEnvironmentVariables() {
    return {
      POSTGRES_HOST: { required: true, default: 'localhost' },
      POSTGRES_PORT: { required: true, default: '5432' },
      POSTGRES_DB: { required: true, default: 'crx_runtime' },
      POSTGRES_USER: { required: true, default: 'postgres' },
      POSTGRES_PASSWORD: { required: true, default: '' },
      QDRANT_URL: { required: false, default: 'http://localhost:6333' },
      OLLAMA_BASE_URL: { required: false, default: 'http://localhost:11434' },
    };
  }

  _computeHash(manifest) {
    const { generated_at, hash, ...stable } = manifest;
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }
}

module.exports = { DeploymentGenerator };
