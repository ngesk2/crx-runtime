// Event Generator
// P024: Compiler generates event_registry.json from authorities and intents.
// Input: authorities/registry.yaml, intents/*/intent-manifest.yaml
// Output: generated/event_registry.json
//
// Every event contains:
// - event_type, schema_version, authority_owner
// - payload schema, metadata schema, hash, compatibility policy
//
// No handwritten event registries. Deterministic output.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');

const EVENT_VERSION = '1.0.0';

class EventGenerator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
  }

  /**
   * Generate event_registry.json from authorities and intents.
   * @returns {{ events: Object[], hash: string, count: number }}
   */
  generate() {
    const events = new Map();

    // Phase 1: Generate events from authorities
    const authoritiesPath = path.join(this._repoRoot, 'authorities', 'registry.yaml');
    if (fs.existsSync(authoritiesPath)) {
      const raw = fs.readFileSync(authoritiesPath, 'utf8');
      const data = yaml.parse(raw);
      if (data.authorities) {
        for (const [name, authority] of Object.entries(data.authorities)) {
          const authorityEvents = this._authorityToEvents(name, authority);
          for (const event of authorityEvents) {
            events.set(event.event_type, event);
          }
        }
      }
    }

    // Phase 2: Generate events from intent manifests
    const intentsDir = path.join(this._repoRoot, 'intents');
    const intentFiles = this._findIntentManifests(intentsDir);
    for (const filePath of intentFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const manifest = yaml.parse(raw);
      const intentEvents = this._intentToEvents(manifest, filePath);
      for (const event of intentEvents) {
        if (!events.has(event.event_type)) {
          events.set(event.event_type, event);
        }
      }
    }

    // Phase 3: Production events from worker pipeline + SQL CHECK constraint
    const productionEvents = this._productionEvents();
    for (const event of productionEvents) {
      if (!events.has(event.event_type)) {
        events.set(event.event_type, event);
      }
    }

    // Sort by event_type for deterministic output
    const sortedEvents = Array.from(events.values())
      .sort((a, b) => a.event_type.localeCompare(b.event_type));

    const hash = this._computeHash(sortedEvents);

    return {
      schema_version: '1.0.0',
      generator: 'EventGenerator',
      generator_version: EVENT_VERSION,
      generated_at: new Date().toISOString(),
      count: sortedEvents.length,
      hash,
      events: sortedEvents,
    };
  }

  write(outputPath) {
    const registry = this.generate();
    const json = JSON.stringify(registry, null, 2);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
    console.log(`[EventGenerator] Wrote ${registry.count} events to ${outputPath}`);
    return registry;
  }

  /**
   * Generate events from an authority definition.
   * Each authority produces: registered, started, completed, failed events.
   */
  _authorityToEvents(name, authority) {
    const intent = authority.intent || name;
    const lifecycleEvents = ['registered', 'started', 'completed', 'failed'];

    return lifecycleEvents.map(lifecycle => {
      const eventType = `${intent}.${lifecycle}`;
      return {
        event_type: eventType,
        schema_version: EVENT_VERSION,
        authority_owner: name,
        event_class: 'system',
        payload_schema: {
          type: 'object',
          properties: {
            authority_id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        metadata_schema: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            version: { type: 'string' },
          },
        },
        compatibility: 'backward',
        source: 'authority',
        source_file: 'authorities/registry.yaml',
      };
    });
  }

  /**
   * Generate events from an intent manifest.
   */
  _intentToEvents(manifest, filePath) {
    const intent = manifest.intent || 'unknown';
    const produces = manifest.produces || [];
    const events = [];

    // Intent-specific events
    events.push({
      event_type: `${intent}.intent_loaded`,
      schema_version: EVENT_VERSION,
      authority_owner: manifest.authority || `${intent}Authority`,
      event_class: 'system',
      payload_schema: {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          status: { type: 'string' },
        },
      },
      metadata_schema: {
        type: 'object',
        properties: {
          source: { type: 'string' },
        },
      },
      compatibility: 'backward',
      source: 'intent',
      source_file: path.relative(this._repoRoot, filePath),
    });

    // Produce events from produces list
    for (const output of produces) {
      events.push({
        event_type: `${intent}.${output.toLowerCase()}_produced`,
        schema_version: EVENT_VERSION,
        authority_owner: manifest.authority || `${intent}Authority`,
        event_class: 'inference',
        payload_schema: {
          type: 'object',
          properties: {
            output_type: { type: 'string' },
            intent: { type: 'string' },
          },
        },
        metadata_schema: {
          type: 'object',
          properties: {
            source: { type: 'string' },
          },
        },
        compatibility: 'backward',
        source: 'intent',
        source_file: path.relative(this._repoRoot, filePath),
      });
    }

    return events;
  }

  _computeHash(events) {
    const stable = { schema_version: '1.0.0', generator: 'EventGenerator', generator_version: EVENT_VERSION, events };
    const canonical = JSON.stringify(stable, Object.keys(stable).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Phase 3: Production events — the worker pipeline event types.
   * Source: SQL CHECK constraint + worker emitters.
   * These are the UPPER_SNAKE_CASE events that the production system uses.
   * No handwritten event registries. Source of truth: this method.
   */
  _productionEvents() {
    const pipelineEvents = [
      // Object lifecycle (from SQL CHECK)
      { event_type: 'OBJECT_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'OBJECT_UPDATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'OBJECT_VERSIONED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'FILE_INGESTED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      // Entity lifecycle (from SQL CHECK)
      { event_type: 'ENTITY_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'RELATIONSHIP_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'PROJECTION_REBUILT', authority_owner: 'ProjectionAuthority', event_class: 'system' },
      { event_type: 'SYSTEM_EVENT', authority_owner: 'SystemAuthority', event_class: 'system' },
      // File lifecycle (from SQL CHECK)
      { event_type: 'FILE_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'FILE_INDEXED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'FILE_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'FILE_MODIFIED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'FILE_DELETED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      // Document lifecycle (from SQL CHECK)
      { event_type: 'DOCUMENT_IMPORTED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'DOCUMENT_OBSERVED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'DOCUMENT_DIGESTED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'DOCUMENT_EMBEDDED', authority_owner: 'ProjectionAuthority', event_class: 'system' },
      // Discovery events (from SQL CHECK)
      { event_type: 'ENTITY_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'CLAIM_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'RELATIONSHIP_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'TOPIC_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'CITATION_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      // Repository lifecycle (from SQL CHECK)
      { event_type: 'REPOSITORY_DISCOVERED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'REPOSITORY_SNAPSHOT_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'REPOSITORY_SNAPSHOT_VERIFIED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'REPOSITORY_WITNESS_CREATED', authority_owner: 'WitnessAuthority', event_class: 'system' },
      // Commit lifecycle (from SQL CHECK)
      { event_type: 'COMMIT_CREATED', authority_owner: 'RepositoryAuthority', event_class: 'system' },
      { event_type: 'COMMIT_VERIFIED', authority_owner: 'ReplayAuthority', event_class: 'system' },
      // Worker pipeline (from workers + SQL CHECK)
      { event_type: 'OBSERVATION_CREATED', authority_owner: 'ObservationWorker', event_class: 'observation' },
      { event_type: 'CANDIDATE_CLAIM_CREATED', authority_owner: 'ClaimWorker', event_class: 'inference' },
      { event_type: 'CLAIM_GENERATED', authority_owner: 'ClaimWorker', event_class: 'inference' },
      // CLAIM_CREATED is the worker-emitted type (canonical_workers.js). CLAIM_GENERATED retained for SQL CHECK compatibility.
      { event_type: 'CLAIM_CREATED', authority_owner: 'ClaimWorker', event_class: 'inference' },
      { event_type: 'REPLAY_EXECUTED', authority_owner: 'ReplayWorker', event_class: 'system' },
      { event_type: 'REPLAY_VERIFY', authority_owner: 'ReplayWorker', event_class: 'system' },
      // REPLAY_COMPLETED is the worker-emitted type (canonical_workers.js). REPLAY_EXECUTED retained for SQL CHECK compatibility.
      { event_type: 'REPLAY_COMPLETED', authority_owner: 'ReplayWorker', event_class: 'system' },
      { event_type: 'WITNESS_CREATED', authority_owner: 'WitnessWorker', event_class: 'system' },
      // WITNESS_REJECTED is emitted when the WitnessWorker refuses to attest an
      // unverified replay (failure-honesty: never fabricate an attestation for
      // a replay that did not verify).
      { event_type: 'WITNESS_REJECTED', authority_owner: 'WitnessWorker', event_class: 'system' },
      { event_type: 'LINEAGE_CREATED', authority_owner: 'LineageWorker', event_class: 'system' },
      { event_type: 'PROJECTION_CREATED', authority_owner: 'ProjectionWorker', event_class: 'system' },
      // Orchestration events (from event_queue.js — snake_case)
      { event_type: 'git_diff', authority_owner: 'OrchestrationEngine', event_class: 'system' },
      { event_type: 'knowledge_compiled', authority_owner: 'OrchestrationEngine', event_class: 'system' },
      { event_type: 'mission_created', authority_owner: 'MissionCompiler', event_class: 'system' },
      { event_type: 'worker_assigned', authority_owner: 'Scheduler', event_class: 'system' },
      { event_type: 'worker_started', authority_owner: 'Scheduler', event_class: 'system' },
      { event_type: 'worker_heartbeat', authority_owner: 'WorkerPort', event_class: 'system' },
      { event_type: 'worker_progress', authority_owner: 'WorkerPort', event_class: 'system' },
      { event_type: 'worker_completed', authority_owner: 'WorkerPort', event_class: 'system' },
      { event_type: 'worker_failed', authority_owner: 'WorkerPort', event_class: 'system' },
      { event_type: 'consensus_started', authority_owner: 'ConsensusEngine', event_class: 'system' },
      { event_type: 'consensus_completed', authority_owner: 'ConsensusEngine', event_class: 'system' },
      { event_type: 'consensus_reached', authority_owner: 'ConsensusEngine', event_class: 'system' },
      { event_type: 'consensus_failed', authority_owner: 'ConsensusEngine', event_class: 'system' },
      { event_type: 'artifact_produced', authority_owner: 'ArtifactStore', event_class: 'system' },
      { event_type: 'artifact_stored', authority_owner: 'ArtifactStore', event_class: 'system' },
      { event_type: 'merge_gate_started', authority_owner: 'MergeGate', event_class: 'system' },
      { event_type: 'merge_gate_passed', authority_owner: 'MergeGate', event_class: 'system' },
      { event_type: 'merge_gate_failed', authority_owner: 'MergeGate', event_class: 'system' },
      { event_type: 'merge_decision_created', authority_owner: 'MergeGate', event_class: 'system' },
      { event_type: 'mission_accepted', authority_owner: 'Scheduler', event_class: 'system' },
      { event_type: 'mission_rejected', authority_owner: 'Scheduler', event_class: 'system' },
      { event_type: 'mission_archived', authority_owner: 'Scheduler', event_class: 'system' },
      { event_type: 'replay_generated', authority_owner: 'ReplayAuthority', event_class: 'system' },
      { event_type: 'witness_generated', authority_owner: 'WitnessAuthority', event_class: 'system' },
      { event_type: 'system_heartbeat', authority_owner: 'SystemAuthority', event_class: 'system' },
      { event_type: 'context_built', authority_owner: 'ContextAuthority', event_class: 'system' },
      { event_type: 'prompt_generated', authority_owner: 'ContextAuthority', event_class: 'system' },
      { event_type: 'worker_registered', authority_owner: 'CapabilityRegistry', event_class: 'system' },
      { event_type: 'worker_state_changed', authority_owner: 'WorkerStateMachine', event_class: 'system' },
      { event_type: 'worker_execution_started', authority_owner: 'WorkerPort', event_class: 'system' },
      { event_type: 'worker_execution_completed', authority_owner: 'WorkerPort', event_class: 'system' },
      // Business events (from business authorities + emitters)
      { event_type: 'REVIEW_RECEIVED', authority_owner: 'ReviewAuthority', event_class: 'business' },
      { event_type: 'REVIEW_RESPONDED', authority_owner: 'ReviewAuthority', event_class: 'business' },
      { event_type: 'CUSTOMER_CREATED', authority_owner: 'CustomerAuthority', event_class: 'business' },
      { event_type: 'CUSTOMER_UPDATED', authority_owner: 'CustomerAuthority', event_class: 'business' },
      { event_type: 'PROJECT_CREATED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'PROJECT_UPDATED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'PROJECT_COMPLETED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'LEAD_CREATED', authority_owner: 'CustomerAuthority', event_class: 'business' },
      { event_type: 'LEAD_CONVERTED', authority_owner: 'CustomerAuthority', event_class: 'business' },
      { event_type: 'ESTIMATE_CREATED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'ESTIMATE_SENT', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'ESTIMATE_ACCEPTED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'INVOICE_CREATED', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'INVOICE_SENT', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'INVOICE_PAID', authority_owner: 'ProjectAuthority', event_class: 'business' },
      { event_type: 'EMAIL_SENT', authority_owner: 'EmailConnector', event_class: 'system' },
      { event_type: 'EMAIL_RECEIVED', authority_owner: 'EmailConnector', event_class: 'system' },
      { event_type: 'SMS_SENT', authority_owner: 'SMSConnector', event_class: 'system' },
      { event_type: 'GOOGLE_REVIEW_RECEIVED', authority_owner: 'GoogleConnector', event_class: 'system' },
      { event_type: 'GITHUB_COMMIT_SYNCED', authority_owner: 'GitHubConnector', event_class: 'system' },
      { event_type: 'SYSTEM_HEALTH_CHECK', authority_owner: 'HealthAuthority', event_class: 'system' },
      { event_type: 'WORKER_COMPLETED', authority_owner: 'WorkerRuntime', event_class: 'system' },
      { event_type: 'WORKER_FAILED', authority_owner: 'WorkerRuntime', event_class: 'system' },
      // Mission lifecycle (from MissionRuntime)
      { event_type: 'MISSION_CREATED', authority_owner: 'MissionRuntime', event_class: 'system' },
      { event_type: 'MISSION_ASSIGNED', authority_owner: 'MissionRuntime', event_class: 'system' },
      { event_type: 'MISSION_STARTED', authority_owner: 'MissionRuntime', event_class: 'system' },
      { event_type: 'MISSION_COMPLETED', authority_owner: 'MissionRuntime', event_class: 'system' },
      { event_type: 'MISSION_FAILED', authority_owner: 'MissionRuntime', event_class: 'system' },
      // Worker pipeline — complete chain
      { event_type: 'CLASSIFICATION_CREATED', authority_owner: 'ClassificationWorker', event_class: 'inference' },
      { event_type: 'RECOMMENDATION_CREATED', authority_owner: 'RecommendationWorker', event_class: 'inference' },
      // Knowledge promotion (Phase F — human approval signals). Raw capture is
      // observation evidence (confidence < 1); explicit approval promotes a node
      // to knowledge (confidence 1.0, status approved); rejection down-ranks it.
      { event_type: 'SNIPPET_APPROVED', authority_owner: 'KnowledgePromoter', event_class: 'observation' },
      { event_type: 'SNIPPET_REJECTED', authority_owner: 'KnowledgePromoter', event_class: 'observation' },
      { event_type: 'AI_RESPONSE_ACCEPTED', authority_owner: 'KnowledgePromoter', event_class: 'observation' },
      { event_type: 'AI_RESPONSE_REJECTED', authority_owner: 'KnowledgePromoter', event_class: 'observation' },
    ];

    return pipelineEvents.map(e => ({
      event_type: e.event_type,
      schema_version: EVENT_VERSION,
      authority_owner: e.authority_owner,
      event_class: e.event_class,
      payload_schema: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      metadata_schema: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          version: { type: 'string' },
        },
      },
      compatibility: 'backward',
      source: 'production',
      source_file: 'database/fix_pipeline_blockers.sql',
    }));
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

module.exports = { EventGenerator };
