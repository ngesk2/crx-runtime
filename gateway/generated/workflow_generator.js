// Workflow Generator
// P023: Compiler generates workflow_registry.json from intent manifests.
// Input: intents/*/intent-manifest.yaml
// Output: generated/workflow_registry.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

const WORKFLOW_VERSION = '1.0.0';

class WorkflowGenerator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  generate() {
    const intentsDir = path.join(this._repoRoot, 'intents');
    const intentFiles = this._findIntentManifests(intentsDir);

    const workflows = [];
    for (const filePath of intentFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const manifest = yaml.parse(raw);
      const workflow = this._intentToWorkflow(manifest, filePath);
      workflows.push(workflow);
    }

    workflows.sort((a, b) => a.workflow_id.localeCompare(b.workflow_id));
    const hash = this._computeHash(workflows);

    return {
      schema_version: '1.0.0',
      generator: 'WorkflowGenerator',
      generator_version: WORKFLOW_VERSION,
      generated_at: new Date().toISOString(),
      count: workflows.length,
      hash,
      workflows,
    };
  }

  write(outputPath) {
    const registry = this.generate();
    const json = JSON.stringify(registry, null, 2);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`[WorkflowGenerator] Wrote ${registry.count} workflows to ${outputPath}`);
    return registry;
  }

  _intentToWorkflow(manifest, filePath) {
    const intent = manifest.intent || path.basename(path.dirname(filePath));
    const authority = manifest.authority || `${intent}Authority`;
    const capabilities = manifest.capabilities || [];
    const produces = manifest.produces || [];
    const consumes = manifest.consumes || [];

    const eventInputs = this._deriveEventInputs(consumes, intent);
    const eventOutputs = this._deriveEventOutputs(produces, intent);

    const workflow = {
      workflow_id: this._computeWorkflowId(intent, authority),
      workflow_type: intent,
      authority,
      version: WORKFLOW_VERSION,
      event_inputs: eventInputs,
      event_outputs: eventOutputs,
      state_machine_ref: `${intent}_state_machine`,
      capability_requirements: capabilities,
      consumes: Array.isArray(consumes) ? consumes : [consumes],
      produces,
      owns: manifest.owns || [],
      specifications: manifest.specifications || [],
      status: manifest.status || 'unknown',
      source_file: path.relative(this._repoRoot, filePath),
    };

    workflow.hash = this._computeWorkflowHash(workflow);
    return workflow;
  }

  _deriveEventInputs(consumes, intent) {
    const inputs = Array.isArray(consumes) ? consumes : [consumes];
    return inputs.filter(Boolean).map(c => `${intent}.${c.toLowerCase()}_received`);
  }

  _deriveEventOutputs(produces, intent) {
    const outputs = Array.isArray(produces) ? produces : [produces];
    return outputs.filter(Boolean).map(p => `${intent}.${p.toLowerCase()}_produced`);
  }

  _computeWorkflowId(intent, authority) {
    const input = `workflow:${intent}:${authority}`;
    return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
  }

  _computeWorkflowHash(workflow) {
    const canonical = JSON.stringify(workflow, Object.keys(workflow).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  _computeHash(workflows) {
    const stable = { schema_version: '1.0.0', generator: 'WorkflowGenerator', generator_version: WORKFLOW_VERSION, workflows };
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  _findIntentManifests(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(dir, entry.name, 'intent-manifest.yaml');
        if (fs.existsSync(manifestPath)) {
          results.push(manifestPath);
        }
      }
    }
    return results.sort();
  }
}

module.exports = { WorkflowGenerator };
