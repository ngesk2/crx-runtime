const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const routingIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

const capabilityRegistry = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  capabilities: {}
};

// Define capability categories with their routing keywords
const capabilityDefinitions = {
  Hash: {
    keywords: ['hash', 'canonical', 'digest', 'checksum', 'sha256', 'crypto'],
    description: 'Cryptographic hashing and canonical serialization',
    canonicalCriteria: ['canonical', 'hash_authority']
  },
  Replay: {
    keywords: ['replay', 'replay_log', 'replay_entry', 'replay_proof'],
    description: 'Replay verification and log management',
    canonicalCriteria: ['replay_authority', 'replay_log']
  },
  Witness: {
    keywords: ['witness', 'witness_chain', 'witness_proof', 'witness_graph'],
    description: 'Witness generation and verification',
    canonicalCriteria: ['witness_authority']
  },
  Serialization: {
    keywords: ['serialize', 'deserialize', 'canonical_bytes', 'encoder', 'decoder'],
    description: 'Data serialization and deserialization',
    canonicalCriteria: ['canonical_bytes', 'serializer']
  },
  Identity: {
    keywords: ['id', 'identity', 'uuid', 'identifier', 'generate_id'],
    description: 'Identity generation and management',
    canonicalCriteria: ['identity_authority', 'id_generator']
  },
  Commit: {
    keywords: ['commit', 'commit_service', 'persistence', 'store'],
    description: 'Commit service and persistence',
    canonicalCriteria: ['commit_service', 'commit_authority']
  },
  Persistence: {
    keywords: ['store', 'storage', 'persist', 'save', 'database'],
    description: 'Data persistence and storage',
    canonicalCriteria: ['persistence_authority', 'storage']
  },
  Knowledge: {
    keywords: ['knowledge', 'compiler', 'index', 'knowledge_compiler'],
    description: 'Knowledge compilation and indexing',
    canonicalCriteria: ['knowledge_compiler', 'knowledge_authority']
  },
  Search: {
    keywords: ['search', 'query', 'find', 'lookup'],
    description: 'Search and query capabilities',
    canonicalCriteria: ['search', 'query_engine']
  },
  Metrics: {
    keywords: ['metric', 'telemetry', 'measurement', 'stats'],
    description: 'Metrics and telemetry collection',
    canonicalCriteria: ['metrics', 'telemetry']
  },
  Configuration: {
    keywords: ['config', 'settings', 'options', 'configuration'],
    description: 'Configuration management',
    canonicalCriteria: ['config', 'settings']
  },
  Authorization: {
    keywords: ['auth', 'authorize', 'permission', 'access'],
    description: 'Authorization and access control',
    canonicalCriteria: ['auth_authority', 'authorization']
  },
  Normalization: {
    keywords: ['normalize', 'canonical', 'standardize'],
    description: 'Data normalization',
    canonicalCriteria: ['normalizer', 'canonical']
  },
  Validation: {
    keywords: ['validate', 'verify', 'check', 'validator'],
    description: 'Data validation',
    canonicalCriteria: ['validator', 'verification']
  },
  Embedding: {
    keywords: ['embed', 'vector', 'embedding'],
    description: 'Vector embeddings',
    canonicalCriteria: ['embedding', 'vector']
  },
  Inference: {
    keywords: ['infer', 'predict', 'model', 'inference'],
    description: 'Model inference',
    canonicalCriteria: ['inference', 'model']
  },
  Scheduling: {
    keywords: ['schedule', 'dispatch', 'assign', 'scheduler'],
    description: 'Task scheduling',
    canonicalCriteria: ['scheduler', 'dispatch']
  },
  Notification: {
    keywords: ['notify', 'emit', 'event', 'notification'],
    description: 'Event notification',
    canonicalCriteria: ['event_queue', 'notification']
  },
  Logging: {
    keywords: ['log', 'logger', 'record'],
    description: 'Logging infrastructure',
    canonicalCriteria: ['logger', 'logging']
  },
  Clock: {
    keywords: ['time', 'clock', 'timestamp', 'date'],
    description: 'Time and clock management',
    canonicalCriteria: ['clock', 'timestamp']
  },
  Filesystem: {
    keywords: ['file', 'fs', 'filesystem'],
    description: 'Filesystem operations',
    canonicalCriteria: ['filesystem', 'file']
  },
  Database: {
    keywords: ['db', 'database', 'storage'],
    description: 'Database operations',
    canonicalCriteria: ['database', 'db']
  },
  VectorStorage: {
    keywords: ['vector', 'embedding', 'index'],
    description: 'Vector storage and indexing',
    canonicalCriteria: ['vector_storage', 'embedding_index']
  },
  Migration: {
    keywords: ['migrate', 'migration', 'schema'],
    description: 'Database and schema migrations',
    canonicalCriteria: ['migration', 'migrate']
  }
};

// Build capability registry
Object.keys(capabilityDefinitions).forEach(capabilityName => {
  const definition = capabilityDefinitions[capabilityName];
  const matchingUUIDs = routingIndex.capability.capabilityToUUIDs[capabilityName] || [];
  
  // Classify implementations
  const implementations = matchingUUIDs.map(uuid => {
    const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
    return {
      uuid: uuid,
      path: uuidEntry.path,
      type: uuidEntry.type,
      size: uuidEntry.size,
      lifecycle: uuidEntry.lifecycle || 'UNKNOWN'
    };
  });
  
  // Identify canonical implementation
  const canonical = implementations.find(impl => {
    const lowerPath = impl.path.toLowerCase();
    return definition.canonicalCriteria.some(criteria => lowerPath.includes(criteria));
  }) || implementations.find(impl => impl.lifecycle === 'Active') || implementations[0];
  
  // Classify others
  const supporting = implementations.filter(impl => impl !== canonical && impl.lifecycle !== 'Dead' && impl.lifecycle !== 'Deprecated');
  const deprecated = implementations.filter(impl => impl.lifecycle === 'Dead' || impl.lifecycle === 'Deprecated');
  const experimental = implementations.filter(impl => impl !== canonical && impl.lifecycle === 'UNKNOWN');
  
  capabilityRegistry.capabilities[capabilityName] = {
    name: capabilityName,
    description: definition.description,
    keywords: definition.keywords,
    canonical: canonical,
    supporting: supporting,
    deprecated: deprecated,
    experimental: experimental,
    totalImplementations: implementations.length,
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: `Keywords matched: ${definition.keywords.join(', ')}` },
      { level: 'L3', source: 'Routing Index', finding: `${implementations.length} implementations identified` },
      { level: 'L4', source: 'Constitution Manifest', finding: `Canonical: ${canonical ? canonical.uuid : 'none'}` }
    ]
  };
});

// Generate summary
const summary = {
  totalCapabilities: Object.keys(capabilityRegistry.capabilities).length,
  totalImplementations: Object.values(capabilityRegistry.capabilities).reduce((sum, cap) => sum + cap.totalImplementations, 0),
  capabilitiesWithCanonical: Object.values(capabilityRegistry.capabilities).filter(cap => cap.canonical).length,
  capabilitiesWithMultiple: Object.values(capabilityRegistry.capabilities).filter(cap => cap.totalImplementations > 1).length
};

capabilityRegistry.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', JSON.stringify(capabilityRegistry, null, 2));
console.log('Capability Registry generated successfully.');
console.log(JSON.stringify(summary, null, 2));
