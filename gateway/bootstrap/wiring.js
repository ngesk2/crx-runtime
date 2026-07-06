/**
 * Dependency Wiring
 *
 * Phase 2.7.1 — Constitutional Boundary Collapse
 * Phase 3.1 — Temporal Integration
 *
 * Wire all dependencies into the container.
 *
 * Constitutional Constraint:
 * - All service registration happens here
 * - No service knows about other services during construction
 * - Dependencies are injected via container
 */

const { Container } = require('./container');
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

/**
 * Create and wire the dependency container
 * @param {Object} config - Configuration
 * @returns {Container} Wired container
 */
function wireContainer(config = {}) {
  const container = new Container();

  // Configuration
  container.register('config', () => config, true);

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

  return container;
}

module.exports = { wireContainer };
