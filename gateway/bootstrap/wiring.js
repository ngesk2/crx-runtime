/**
 * Dependency Wiring
 *
 * P001.5 — True dependency validation via DependencyGraph
 * Priority 4 — StorageAdapter abstraction
 *
 * Wire all dependencies into the container.
 * Validate via DependencyGraph (cycles, missing, orphans, duplicates).
 * Compute startup order via topological sort.
 *
 * Constitutional Constraint:
 * - All service registration happens here
 * - No service knows about other services during construction
 * - Dependencies are injected via container
 * - DependencyGraph is the single source of validation truth
 * - Startup order is computed, never hardcoded
 */

const { Container } = require('./container');
const { PostgresAdapter } = require('../postgres_adapter');
const { DependencyGraph } = require('./dependency_graph');
const { Persistence } = require('../persistence');
const { BackgroundWorkers } = require('../background_workers');
const { ConversationMemory } = require('../conversation_memory');
const { KnowledgeRetrieval } = require('../knowledge_retrieval');
const { DocumentIngestion } = require('../document_ingestion');
const { InferenceService } = require('../inference_service');
const { SystemAuthority } = require('../system_authority');
const { TemporalRuntime } = require('../temporal_runtime');
const { TemporalSchedulerProvider } = require('../temporal_scheduler_provider');
const { SchedulerPort } = require('../scheduler_port');
const { CanonicalEventEnvelope } = require('../canonical_event_envelope');
const { TenantRegistry } = require('../tenant_registry');
const { DeploymentRegistry } = require('../deployment_registry');
const { RuntimeRegistry } = require('../runtime_registry');

/**
 * Create and wire the dependency container.
 * Registers all authorities with their declared dependencies.
 * 
 * @param {Object} config - Configuration
 * @returns {{ container: Container, graph: DependencyGraph }}
 */
function wireContainer(config = {}) {
  const container = new Container();

  // Configuration
  container.register('config', () => config, true);

  // Postgres Pool (raw, for backward compat)
  container.register('pool', () => {
    const { Pool } = require('pg');
    return new Pool({
      host: config.postgresHost || process.env.POSTGRES_HOST || 'localhost',
      port: config.postgresPort || process.env.POSTGRES_PORT || 5432,
      database: config.postgresDb || process.env.POSTGRES_DB || 'crx_runtime',
      user: config.postgresUser || process.env.POSTGRES_USER || 'postgres',
      password: config.postgresPassword || process.env.POSTGRES_PASSWORD || '',
    });
  });

  // StorageAdapter (PostgresAdapter) — replaces direct pool access
  container.register('storage', (c) => {
    const { Pool } = require('pg');
    const pool = new Pool({
      host: config.postgresHost || process.env.POSTGRES_HOST || 'localhost',
      port: config.postgresPort || process.env.POSTGRES_PORT || 5432,
      database: config.postgresDb || process.env.POSTGRES_DB || 'crx_runtime',
      user: config.postgresUser || process.env.POSTGRES_USER || 'postgres',
      password: config.postgresPassword || process.env.POSTGRES_PASSWORD || '',
    });
    const adapter = new PostgresAdapter({
      host: config.postgresHost || process.env.POSTGRES_HOST || 'localhost',
      port: config.postgresPort || process.env.POSTGRES_PORT || 5432,
      database: config.postgresDb || process.env.POSTGRES_DB || 'crx_runtime',
      user: config.postgresUser || process.env.POSTGRES_USER || 'postgres',
      password: config.postgresPassword || process.env.POSTGRES_PASSWORD || '',
    });
    return adapter;
  });

  // System Authority (with injected repoRoot)
  container.register('systemAuthority', (c) => {
    const path = require('path');
    return new SystemAuthority(null, {
      repoRoot: config.repoRoot || path.resolve(__dirname, '..')
    });
  });

  // Persistence
  container.register('persistence', (c) => {
    return new Persistence({
      statePath: config.statePath || './state'
    });
  });

  // Background Workers (registry only - no lifecycle)
  container.register('backgroundWorkers', (c) => {
    return new BackgroundWorkers();
  });

  // Conversation Memory
  container.register('conversationMemory', (c) => {
    return new ConversationMemory({
      collectionName: 'conversations'
    });
  });

  // Knowledge Retrieval
  container.register('knowledgeRetrieval', (c) => {
    return new KnowledgeRetrieval({
      collectionName: 'documents',
      topK: 5,
      model: 'qwen2.5-coder:14b'
    });
  });

  // Document Ingestion
  container.register('documentIngestion', (c) => {
    return new DocumentIngestion({
      watchPath: config.documentsPath || './documents',
      collectionName: 'documents'
    });
  });

  // Inference Service
  container.register('inferenceService', (c) => {
    return new InferenceService({
      port: config.inferencePort || 3001
    });
  });

  // Temporal Runtime
  container.register('temporalRuntime', (c) => {
    const path = require('path');
    return new TemporalRuntime({
      address: config.temporalAddress || 'localhost:7233',
      namespace: config.temporalNamespace || 'default',
      taskQueue: config.temporalTaskQueue || 'constitutional-scheduler',
      workflowsPath: path.resolve(__dirname, '../temporal_workflows.js'),
      activitiesPath: path.resolve(__dirname, '../activities/index.js')
    });
  });

  // Temporal Scheduler Provider (depends on TemporalRuntime)
  container.register('temporalSchedulerProvider', (c) => {
    const temporalRuntime = c.resolve('temporalRuntime');
    const client = temporalRuntime.getClient();
    return new TemporalSchedulerProvider(client, {
      taskQueue: config.temporalTaskQueue || 'constitutional-scheduler'
    });
  });

  // Scheduler Port (depends on TemporalSchedulerProvider)
  container.register('schedulerPort', (c) => {
    const provider = c.resolve('temporalSchedulerProvider');
    return new SchedulerPort(provider);
  });

  // P001: Canonical Event Envelope (depends on storage)
  container.register('canonicalEventEnvelope', (c) => {
    const storage = c.resolve('storage');
    return new CanonicalEventEnvelope(storage);
  });

  // P003: Tenant Registry (depends on storage)
  container.register('tenantRegistry', (c) => {
    const storage = c.resolve('storage');
    return new TenantRegistry(storage);
  });

  // P004: Deployment Registry (depends on storage)
  container.register('deploymentRegistry', (c) => {
    const storage = c.resolve('storage');
    return new DeploymentRegistry(storage);
  });

  // P005: Runtime Registry (depends on storage)
  container.register('runtimeRegistry', (c) => {
    const storage = c.resolve('storage');
    return new RuntimeRegistry(storage);
  });

  return container;
}

/**
 * Build the dependency graph from all registered authorities.
 * 
 * @param {Container} container
 * @returns {DependencyGraph}
 */
function buildDependencyGraph(container) {
  const graph = new DependencyGraph();

  // Register all authorities with their dependencies
  const authorities = [
    { name: 'pool', authority: { dependencies: [] }, metadata: { description: 'Postgres connection pool' } },
    { name: 'config', authority: { dependencies: [] }, metadata: { description: 'Configuration' } },
    { name: 'storage', authority: { dependencies: [] }, metadata: { description: 'StorageAdapter (Postgres)' } },
    { name: 'systemAuthority', authority: { dependencies: [] }, metadata: { description: 'System authority' } },
    { name: 'persistence', authority: { dependencies: [] }, metadata: { description: 'File-based state persistence' } },
    { name: 'backgroundWorkers', authority: { dependencies: [] }, metadata: { description: 'Background workers' } },
    { name: 'conversationMemory', authority: { dependencies: ['pool'] }, metadata: { description: 'Conversation memory (Qdrant)' } },
    { name: 'knowledgeRetrieval', authority: { dependencies: ['pool'] }, metadata: { description: 'Knowledge retrieval (Qdrant)' } },
    { name: 'documentIngestion', authority: { dependencies: ['pool'] }, metadata: { description: 'Document ingestion pipeline' } },
    { name: 'inferenceService', authority: { dependencies: [] }, metadata: { description: 'Inference service (Ollama)' } },
    { name: 'temporalRuntime', authority: { dependencies: [] }, metadata: { description: 'Temporal workflow runtime' } },
    { name: 'temporalSchedulerProvider', authority: { dependencies: ['temporalRuntime'] }, metadata: { description: 'Temporal scheduler provider' } },
    { name: 'schedulerPort', authority: { dependencies: ['temporalSchedulerProvider'] }, metadata: { description: 'Scheduler port' } },
    { name: 'canonicalEventEnvelope', authority: { dependencies: ['storage'] }, metadata: { description: 'P001: Canonical event schema' } },
    { name: 'tenantRegistry', authority: { dependencies: ['storage'] }, metadata: { description: 'P003: Tenant registry' } },
    { name: 'deploymentRegistry', authority: { dependencies: ['storage'] }, metadata: { description: 'P004: Deployment registry' } },
    { name: 'runtimeRegistry', authority: { dependencies: ['storage'] }, metadata: { description: 'P005: Runtime registry' } },
  ];

  for (const { name, authority, metadata } of authorities) {
    graph.register(name, authority, metadata);
  }

  return graph;
}

/**
 * Validate the dependency graph and compute startup order.
 * Aborts if validation fails. No warnings. Only PASS or FAIL.
 * 
 * @param {Container} container
 * @returns {{ valid: boolean, startupOrder: string[], report: Object }}
 */
function validateWiring(container) {
  const graph = buildDependencyGraph(container);
  const report = graph.validate();

  if (!report.valid) {
    const errorMessages = report.errors.map(e => `  ✗ ${e.message}`).join('\n');
    throw new Error(
      `[DEPENDENCY GRAPH VALIDATION FAILED]\n` +
      `${errorMessages}\n` +
      `Startup aborted. No partial runtime.`
    );
  }

  console.log(`[DependencyGraph] PASS — ${report.nodeCount} nodes, ${report.edgeCount} edges`);
  console.log(`[DependencyGraph] Startup order: ${report.startupOrder.join(' → ')}`);
  console.log(`[DependencyGraph] Graph hash: ${report.graphHash}`);

  return {
    valid: true,
    startupOrder: report.startupOrder,
    report,
    graph,
  };
}

module.exports = { wireContainer, buildDependencyGraph, validateWiring };
