const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));
const executionGraphs = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

const routingIndex = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  
  // Dimension 1: Filesystem routing
  filesystem: {
    pathToUUID: uuidRegistry.pathToUUID,
    directoryToUUIDs: {},
    extensionToUUIDs: {}
  },
  
  // Dimension 2: Authority routing
  authority: {
    authorityNameToUUIDs: {},
    authorityTypeToUUIDs: {}
  },
  
  // Dimension 3: Capability routing
  capability: {
    capabilityToUUIDs: {},
    capabilityMapping: {
      Hash: ['hash', 'canonical', 'digest', 'checksum'],
      Replay: ['replay', 'replay_log', 'replay_entry'],
      Witness: ['witness', 'witness_chain', 'witness_proof'],
      Serialization: ['serialize', 'deserialize', 'canonical_bytes'],
      Identity: ['id', 'identity', 'uuid', 'identifier'],
      Commit: ['commit', 'commit_service', 'persistence'],
      Persistence: ['store', 'storage', 'persist', 'save'],
      Knowledge: ['knowledge', 'compiler', 'index'],
      Search: ['search', 'query', 'find'],
      Metrics: ['metric', 'telemetry', 'measurement'],
      Configuration: ['config', 'settings', 'options'],
      Authorization: ['auth', 'authorize', 'permission'],
      Normalization: ['normalize', 'canonical', 'standardize'],
      Validation: ['validate', 'verify', 'check'],
      Embedding: ['embed', 'vector', 'embedding'],
      Inference: ['infer', 'predict', 'model'],
      Scheduling: ['schedule', 'dispatch', 'assign'],
      Notification: ['notify', 'emit', 'event'],
      Logging: ['log', 'logger', 'record'],
      Clock: ['time', 'clock', 'timestamp'],
      Filesystem: ['file', 'fs', 'filesystem'],
      Database: ['db', 'database', 'storage'],
      VectorStorage: ['vector', 'embedding', 'index'],
      Migration: ['migrate', 'migration', 'schema']
    }
  },
  
  // Dimension 4: Owner routing
  owner: {
    ownerToUUIDs: {},
    unknownOwnerUUIDs: []
  },
  
  // Dimension 5: Execution Graph routing
  executionGraph: {
    graphTypeToUUIDs: {},
    graphTypeToEntrypointUUIDs: {}
  },
  
  // Dimension 6: Replay Graph routing
  replayGraph: {
    replayVisibleUUIDs: [],
    replayInvisibleUUIDs: []
  },
  
  // Dimension 7: Witness Graph routing
  witnessGraph: {
    witnessVisibleUUIDs: [],
    witnessInvisibleUUIDs: []
  },
  
  // Dimension 8: Subsystem routing
  subsystem: {
    subsystemToUUIDs: {},
    unknownSubsystemUUIDs: []
  },
  
  // Dimension 9: Lifecycle routing
  lifecycle: {
    lifecycleToUUIDs: {},
    unknownLifecycleUUIDs: []
  },
  
  // Dimension 10: Safety routing
  safety: {
    safeToModifyUUIDs: [],
    safeToDeleteUUIDs: [],
    riskyUUIDs: []
  },
  
  // Dimension 11: Symbol routing
  symbol: {
    symbolToUUIDs: {},
    exportToUUIDs: {}
  },
  
  // Dimension 12: Law routing
  law: {
    lawToUUIDs: {},
    lawMapping: {
      ReplayEquivalence: ['replay', 'deterministic', 'equivalence'],
      HashLaw: ['hash', 'canonical', 'digest'],
      WitnessLaw: ['witness', 'proof', 'chain'],
      OrderingLaw: ['order', 'sequence', 'sort'],
      FailureLaw: ['error', 'failure', 'exception'],
      UnicodeLaw: ['unicode', 'encoding', 'string'],
      MutationLaw: ['immutable', 'mutation', 'mutate'],
      ClockLaw: ['time', 'clock', 'timestamp', 'date'],
      SerializationLaw: ['serialize', 'deserialize', 'canonical'],
      IdentityLaw: ['id', 'identity', 'uuid'],
      KnowledgeLaw: ['knowledge', 'index', 'search']
    }
  },
  
  // Dimension 13: Risk routing
  risk: {
    lowRiskUUIDs: [],
    mediumRiskUUIDs: [],
    highRiskUUIDs: []
  }
};

// Build filesystem routing
uuidRegistry.uuids.forEach(uuidEntry => {
  const dirPath = path.dirname(uuidEntry.path);
  const ext = uuidEntry.path.split('.').pop();
  
  if (!routingIndex.filesystem.directoryToUUIDs[dirPath]) {
    routingIndex.filesystem.directoryToUUIDs[dirPath] = [];
  }
  routingIndex.filesystem.directoryToUUIDs[dirPath].push(uuidEntry.uuid);
  
  if (!routingIndex.filesystem.extensionToUUIDs[ext]) {
    routingIndex.filesystem.extensionToUUIDs[ext] = [];
  }
  routingIndex.filesystem.extensionToUUIDs[ext].push(uuidEntry.uuid);
});

// Build authority routing
uuidRegistry.uuids.filter(u => u.type === 'AUTH').forEach(uuidEntry => {
  const fileName = path.basename(uuidEntry.path, '.js');
  
  if (!routingIndex.authority.authorityNameToUUIDs[fileName]) {
    routingIndex.authority.authorityNameToUUIDs[fileName] = [];
  }
  routingIndex.authority.authorityNameToUUIDs[fileName].push(uuidEntry.uuid);
  
  if (uuidEntry.authorityType) {
    if (!routingIndex.authority.authorityTypeToUUIDs[uuidEntry.authorityType]) {
      routingIndex.authority.authorityTypeToUUIDs[uuidEntry.authorityType] = [];
    }
    routingIndex.authority.authorityTypeToUUIDs[uuidEntry.authorityType].push(uuidEntry.uuid);
  }
});

// Build capability routing
Object.keys(routingIndex.capability.capabilityMapping).forEach(capability => {
  const keywords = routingIndex.capability.capabilityMapping[capability];
  routingIndex.capability.capabilityToUUIDs[capability] = [];
  
  uuidRegistry.uuids.forEach(uuidEntry => {
    const lowerPath = uuidEntry.path.toLowerCase();
    const matches = keywords.some(keyword => lowerPath.includes(keyword));
    if (matches) {
      routingIndex.capability.capabilityToUUIDs[capability].push(uuidEntry.uuid);
    }
  });
});

// Build owner routing
uuidRegistry.uuids.forEach(uuidEntry => {
  if (uuidEntry.owner && uuidEntry.owner !== 'UNKNOWN') {
    if (!routingIndex.owner.ownerToUUIDs[uuidEntry.owner]) {
      routingIndex.owner.ownerToUUIDs[uuidEntry.owner] = [];
    }
    routingIndex.owner.ownerToUUIDs[uuidEntry.owner].push(uuidEntry.uuid);
  } else {
    routingIndex.owner.unknownOwnerUUIDs.push(uuidEntry.uuid);
  }
});

// Build execution graph routing
Object.keys(executionGraphs.graphs).forEach(graphType => {
  const graph = executionGraphs.graphs[graphType];
  routingIndex.executionGraph.graphTypeToUUIDs[graphType] = [];
  
  graph.reachableNodes.forEach(nodePath => {
    const uuid = uuidRegistry.pathToUUID[nodePath];
    if (uuid) {
      routingIndex.executionGraph.graphTypeToUUIDs[graphType].push(uuid);
    }
  });
  
  routingIndex.executionGraph.graphTypeToEntrypointUUIDs[graphType] = [];
  graph.entrypoints.forEach(ep => {
    const uuid = uuidRegistry.pathToUUID[ep.path || ep.source];
    if (uuid) {
      routingIndex.executionGraph.graphTypeToEntrypointUUIDs[graphType].push(uuid);
    }
  });
});

// Build replay graph routing
uuidRegistry.uuids.forEach(uuidEntry => {
  const manifestEntry = constitutionManifest.artifacts.find(a => a.path === uuidEntry.path);
  if (manifestEntry) {
    if (manifestEntry.replayVisible === true) {
      routingIndex.replayGraph.replayVisibleUUIDs.push(uuidEntry.uuid);
    } else {
      routingIndex.replayGraph.replayInvisibleUUIDs.push(uuidEntry.uuid);
    }
  }
});

// Build witness graph routing
uuidRegistry.uuids.forEach(uuidEntry => {
  const manifestEntry = constitutionManifest.artifacts.find(a => a.path === uuidEntry.path);
  if (manifestEntry) {
    if (manifestEntry.witnessVisible === true) {
      routingIndex.witnessGraph.witnessVisibleUUIDs.push(uuidEntry.uuid);
    } else {
      routingIndex.witnessGraph.witnessInvisibleUUIDs.push(uuidEntry.uuid);
    }
  }
});

// Build subsystem routing
uuidRegistry.uuids.forEach(uuidEntry => {
  if (uuidEntry.subsystem && uuidEntry.subsystem !== 'UNKNOWN') {
    if (!routingIndex.subsystem.subsystemToUUIDs[uuidEntry.subsystem]) {
      routingIndex.subsystem.subsystemToUUIDs[uuidEntry.subsystem] = [];
    }
    routingIndex.subsystem.subsystemToUUIDs[uuidEntry.subsystem].push(uuidEntry.uuid);
  } else {
    routingIndex.subsystem.unknownSubsystemUUIDs.push(uuidEntry.uuid);
  }
});

// Build lifecycle routing
uuidRegistry.uuids.forEach(uuidEntry => {
  if (uuidEntry.lifecycle && uuidEntry.lifecycle !== 'UNKNOWN') {
    if (!routingIndex.lifecycle.lifecycleToUUIDs[uuidEntry.lifecycle]) {
      routingIndex.lifecycle.lifecycleToUUIDs[uuidEntry.lifecycle] = [];
    }
    routingIndex.lifecycle.lifecycleToUUIDs[uuidEntry.lifecycle].push(uuidEntry.uuid);
  } else {
    routingIndex.lifecycle.unknownLifecycleUUIDs.push(uuidEntry.uuid);
  }
});

// Build safety routing
uuidRegistry.uuids.forEach(uuidEntry => {
  if (uuidEntry.deletionRisk === 'SAFE') {
    routingIndex.safety.safeToDeleteUUIDs.push(uuidEntry.uuid);
  } else if (uuidEntry.deletionRisk === 'VERIFY') {
    routingIndex.safety.riskyUUIDs.push(uuidEntry.uuid);
  } else {
    routingIndex.safety.safeToModifyUUIDs.push(uuidEntry.uuid);
  }
});

// Build symbol routing
dependencyGraph.nodes.forEach(node => {
  const uuid = uuidRegistry.pathToUUID[node.path];
  if (uuid) {
    if (node.exports) {
      const exports = Array.isArray(node.exports) ? node.exports : [node.exports];
      exports.forEach(exp => {
        if (exp && typeof exp === 'string') {
          if (!routingIndex.symbol.exportToUUIDs[exp]) {
            routingIndex.symbol.exportToUUIDs[exp] = [];
          }
          if (!Array.isArray(routingIndex.symbol.exportToUUIDs[exp])) {
            routingIndex.symbol.exportToUUIDs[exp] = [];
          }
          routingIndex.symbol.exportToUUIDs[exp].push(uuid);
        }
      });
    }
  }
});

// Build law routing
Object.keys(routingIndex.law.lawMapping).forEach(law => {
  const keywords = routingIndex.law.lawMapping[law];
  routingIndex.law.lawToUUIDs[law] = [];
  
  uuidRegistry.uuids.forEach(uuidEntry => {
    const lowerPath = uuidEntry.path.toLowerCase();
    const matches = keywords.some(keyword => lowerPath.includes(keyword));
    if (matches) {
      routingIndex.law.lawToUUIDs[law].push(uuidEntry.uuid);
    }
  });
});

// Build risk routing
hygieneReport.findings.deterministicViolations.forEach(violation => {
  const uuid = uuidRegistry.pathToUUID[violation.path];
  if (uuid) {
    routingIndex.risk.highRiskUUIDs.push(uuid);
  }
});

hygieneReport.findings.oversizedModules.forEach(oversized => {
  const uuid = uuidRegistry.pathToUUID[oversized.path];
  if (uuid) {
    routingIndex.risk.mediumRiskUUIDs.push(uuid);
  }
});

// Generate summary
const summary = {
  totalUUIDs: uuidRegistry.uuids.length,
  filesystemDirectories: Object.keys(routingIndex.filesystem.directoryToUUIDs).length,
  authorityNames: Object.keys(routingIndex.authority.authorityNameToUUIDs).length,
  capabilities: Object.keys(routingIndex.capability.capabilityToUUIDs).length,
  owners: Object.keys(routingIndex.owner.ownerToUUIDs).length,
  executionGraphs: Object.keys(routingIndex.executionGraph.graphTypeToUUIDs).length,
  subsystems: Object.keys(routingIndex.subsystem.subsystemToUUIDs).length,
  lifecycles: Object.keys(routingIndex.lifecycle.lifecycleToUUIDs).length,
  symbols: Object.keys(routingIndex.symbol.exportToUUIDs).length,
  laws: Object.keys(routingIndex.law.lawToUUIDs).length
};

routingIndex.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', JSON.stringify(routingIndex, null, 2));
console.log('Multi-dimensional Routing Index generated successfully.');
console.log(JSON.stringify(summary, null, 2));
