// Capability Registry Generator
// P025: Compiler generates capability_registry.json from capabilities YAML.
// Input: capabilities/registry.yaml
// Output: generated/capability_registry.json
//
// Each capability includes: capability_id (deterministic SHA-256), provider,
// authority, required_secrets, runtime_dependencies, version, compatibility, hash.
// No handwritten capability registries. PING consumes only generated output.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

const CAPABILITY_VERSION = '1.0.0';

class CapabilityGenerator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  /**
   * Generate capability_registry.json from capabilities YAML.
   * @returns {{ capabilities: Object[], hash: string, count: number }}
   */
  generate() {
    const capabilitiesPath = path.join(this._repoRoot, 'capabilities', 'registry.yaml');
    const capabilities = [];

    if (fs.existsSync(capabilitiesPath)) {
      const raw = fs.readFileSync(capabilitiesPath, 'utf8');
      const data = yaml.parse(raw);

      if (data.capabilities) {
        for (const [name, cap] of Object.entries(data.capabilities)) {
          capabilities.push(this._yamlToCapability(name, cap));
        }
      }
    }

    // Phase 2: Runtime capabilities from worker scheduling domain
    const runtimeCaps = this._runtimeCapabilities();
    for (const cap of runtimeCaps) {
      if (!capabilities.some(c => c.name === cap.name)) {
        capabilities.push(cap);
      }
    }

    // Sort by capability_id for deterministic output
    capabilities.sort((a, b) => a.capability_id.localeCompare(b.capability_id));

    const hash = this._computeHash(capabilities);
    const modelMappings = this._modelMappings();

    return {
      schema_version: '1.0.0',
      generator: 'CapabilityGenerator',
      generator_version: CAPABILITY_VERSION,
      generated_at: new Date().toISOString(),
      count: capabilities.length,
      hash,
      capabilities,
      model_mappings: modelMappings,
    };
  }

  write(outputPath) {
    const registry = this.generate();
    const json = JSON.stringify(registry, null, 2);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`[CapabilityGenerator] Wrote ${registry.count} capabilities to ${outputPath}`);
    return registry;
  }

  _yamlToCapability(name, cap) {
    const capability = {
      capability_id: this._computeCapabilityId(name),
      name,
      intent: cap.intent || 'unknown',
      authority: cap.authority || 'unknown',
      status: cap.status || 'unknown',
      owner: cap.owner || null,
      provider: cap.authority || 'unknown',
      required_secrets: [],
      runtime_dependencies: [],
      version: CAPABILITY_VERSION,
      compatibility: 'backward',
      source_file: 'capabilities/registry.yaml',
    };

    capability.hash = this._computeCapabilityHash(capability);
    return capability;
  }

  _computeCapabilityId(name) {
    const input = `capability:${name}`;
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  _computeCapabilityHash(capability) {
    const canonical = JSON.stringify(capability, Object.keys(capability).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  _computeHash(capabilities) {
    const stable = { schema_version: '1.0.0', generator: 'CapabilityGenerator', generator_version: CAPABILITY_VERSION, capabilities };
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Phase 2: Runtime capabilities — worker scheduling and orchestration.
   * Source: worker_port.js, ollama_provider.js hardcoded capabilities.
   * These are the capabilities the runtime uses for worker dispatch.
   */
  _runtimeCapabilities() {
    const runtimeCaps = [
      { name: 'code.generate', intent: 'code_generation', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'code.refactor', intent: 'code_refactoring', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'code.test', intent: 'test_generation', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'orchestration.plan', intent: 'planning', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'orchestration.review', intent: 'review', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'orchestration.merge', intent: 'merge', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit', intent: 'authority_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit.time', intent: 'time_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit.identity', intent: 'identity_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit.hash', intent: 'hash_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit.serialization', intent: 'serialization_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'authority.audit.subprocess', intent: 'subprocess_audit', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
      { name: 'replay.verify', intent: 'replay_verification', authority: 'ReplayAuthority', owner: 'WorkerPort' },
      { name: 'documentation.write', intent: 'documentation', authority: 'OrchestrationEngine', owner: 'WorkerPort' },
    ];

    return runtimeCaps.map(c => {
      const cap = {
        capability_id: this._computeCapabilityId(c.name),
        name: c.name,
        intent: c.intent,
        authority: c.authority,
        status: 'active',
        owner: c.owner,
        provider: c.authority,
        required_secrets: [],
        runtime_dependencies: [],
        version: CAPABILITY_VERSION,
        compatibility: 'backward',
        source_file: 'worker_scheduling',
        source: 'runtime',
      };
      cap.hash = this._computeCapabilityHash(cap);
      return cap;
    });
  }

  /**
   * Model-to-capability mappings for OllamaProvider and OpenCode registration.
   * Source: ollama_provider.js _inferCapabilities/_inferSpecialization/_inferContextWindow.
   * Generated once, consumed at runtime. No handwritten model inference.
   */
  _modelMappings() {
    return {
      provider_models: [
        {
          pattern: 'coder',
          capabilities: ['authority.audit.time', 'authority.audit.hash', 'authority.audit.identity', 'dead_code.analyze', 'replay.verify', 'test.generate'],
          specialization: 'code_audit',
          context_window: 32768,
          replay_compatibility: true,
          max_load: 4
        },
        {
          pattern: 'deepseek',
          capabilities: ['authority.audit.time', 'authority.audit.hash', 'authority.audit.identity', 'dead_code.analyze', 'replay.verify', 'test.generate', 'documentation.generate', 'graph.audit.dependency'],
          specialization: 'analysis',
          context_window: 128000,
          replay_compatibility: false,
          max_load: 2
        },
        {
          pattern: 'qwen',
          capabilities: ['documentation.generate', 'graph.audit.dependency'],
          specialization: 'general_purpose',
          context_window: 32768,
          replay_compatibility: false,
          max_load: 4
        },
        {
          pattern: 'mixtral',
          capabilities: ['documentation.generate', 'graph.audit.dependency'],
          specialization: 'analysis',
          context_window: 32768,
          replay_compatibility: false,
          max_load: 4
        }
      ],
      fallback: {
        capabilities: ['serialization.audit', 'certificate.generate'],
        specialization: 'general_purpose',
        context_window: 4096,
        replay_compatibility: false,
        max_load: 4
      },
      opencode: {
        capabilities: ['authority.audit.time', 'authority.audit.identity', 'authority.audit.hash', 'graph.audit.dependency', 'dead_code.analyze', 'replay.verify', 'documentation.generate', 'test.generate', 'certificate.generate', 'orchestration.plan', 'orchestration.review', 'orchestration.merge'],
        specialization: 'orchestration',
        context_window: 128000,
        replay_compatibility: true,
        max_load: 10
      }
    };
  }
}

module.exports = { CapabilityGenerator };
