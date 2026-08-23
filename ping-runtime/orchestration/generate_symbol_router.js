const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));
const executionRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\ExecutionRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));

const symbolRouter = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  symbolToUUID: {},
  uuidToSymbols: {},
  symbolToAuthority: {},
  symbolToCapability: {},
  symbolToExecutionGraphs: {},
  symbolToCallers: {},
  symbolToDependents: {}
};

// Build symbol to UUID mapping
dependencyGraph.nodes.forEach(node => {
  const uuid = uuidRegistry.pathToUUID[node.path];
  if (uuid) {
    if (node.exports) {
      const exports = Array.isArray(node.exports) ? node.exports : [node.exports];
      exports.forEach(exp => {
        if (exp && typeof exp === 'string') {
          if (!symbolRouter.symbolToUUID[exp]) {
            symbolRouter.symbolToUUID[exp] = [];
          }
          if (!Array.isArray(symbolRouter.symbolToUUID[exp])) {
            symbolRouter.symbolToUUID[exp] = [];
          }
          symbolRouter.symbolToUUID[exp].push(uuid);
        }
      });
    }
  }
});

// Build UUID to symbols mapping (reverse lookup)
Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
  const uuids = symbolRouter.symbolToUUID[symbol];
  uuids.forEach(uuid => {
    if (!symbolRouter.uuidToSymbols[uuid]) {
      symbolRouter.uuidToSymbols[uuid] = [];
    }
    symbolRouter.uuidToSymbols[uuid].push(symbol);
  });
});

// Build symbol to authority mapping
Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
  const uuids = symbolRouter.symbolToUUID[symbol];
  const authorities = [];
  
  uuids.forEach(uuid => {
    const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
    if (uuidEntry && uuidEntry.type === 'AUTH') {
      const fileName = path.basename(uuidEntry.path, '.js');
      if (!authorities.includes(fileName)) {
        authorities.push(fileName);
      }
    }
  });
  
  if (authorities.length > 0) {
    symbolRouter.symbolToAuthority[symbol] = authorities;
  }
});

// Build symbol to capability mapping
const capabilityKeywords = {
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
};

Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
  const lowerSymbol = symbol.toLowerCase();
  const capabilities = [];
  
  Object.keys(capabilityKeywords).forEach(capability => {
    const keywords = capabilityKeywords[capability];
    if (keywords.some(keyword => lowerSymbol.includes(keyword))) {
      capabilities.push(capability);
    }
  });
  
  if (capabilities.length > 0) {
    symbolRouter.symbolToCapability[symbol] = capabilities;
  }
});

// Build symbol to execution graphs mapping
Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
  const uuids = symbolRouter.symbolToUUID[symbol];
  const graphs = [];
  
  uuids.forEach(uuid => {
    Object.keys(executionRouter.routingTables).forEach(graphType => {
      const table = executionRouter.routingTables[graphType];
      if (table.reachableUUIDs.includes(uuid)) {
        if (!graphs.includes(graphType)) {
          graphs.push(graphType);
        }
      }
    });
  });
  
  if (graphs.length > 0) {
    symbolRouter.symbolToExecutionGraphs[symbol] = graphs;
  }
});

// Build symbol to callers mapping (which files import this symbol)
dependencyGraph.nodes.forEach(node => {
  const uuid = uuidRegistry.pathToUUID[node.path];
  if (uuid && node.imports) {
    node.imports.forEach(imp => {
      // Find the UUID that exports this symbol
      const exportingUUIDs = symbolRouter.symbolToUUID[imp];
      if (exportingUUIDs && exportingUUIDs.length > 0) {
        exportingUUIDs.forEach(exportingUUID => {
          if (!symbolRouter.symbolToCallers[imp]) {
            symbolRouter.symbolToCallers[imp] = [];
          }
          if (!symbolRouter.symbolToCallers[imp].includes(uuid)) {
            symbolRouter.symbolToCallers[imp].push(uuid);
          }
        });
      }
    });
  }
});

// Build symbol to dependents mapping (which symbols this symbol depends on)
dependencyGraph.nodes.forEach(node => {
  const uuid = uuidRegistry.pathToUUID[node.path];
  if (uuid && node.imports) {
    const symbols = node.imports.filter(imp => symbolRouter.symbolToUUID[imp]);
    const exportedSymbols = symbolRouter.uuidToSymbols[uuid] || [];
    
    exportedSymbols.forEach(symbol => {
      if (!symbolRouter.symbolToDependents[symbol]) {
        symbolRouter.symbolToDependents[symbol] = [];
      }
      if (!Array.isArray(symbolRouter.symbolToDependents[symbol])) {
        symbolRouter.symbolToDependents[symbol] = [];
      }
      symbols.forEach(dep => {
        if (!symbolRouter.symbolToDependents[symbol].includes(dep)) {
          symbolRouter.symbolToDependents[symbol].push(dep);
        }
      });
    });
  }
});

// Generate summary
const summary = {
  totalSymbols: Object.keys(symbolRouter.symbolToUUID).length,
  symbolsWithMultipleImplementations: Object.values(symbolRouter.symbolToUUID).filter(uuids => uuids.length > 1).length,
  symbolsWithAuthority: Object.keys(symbolRouter.symbolToAuthority).length,
  symbolsWithCapability: Object.keys(symbolRouter.symbolToCapability).length,
  symbolsInExecutionGraphs: Object.keys(symbolRouter.symbolToExecutionGraphs).length,
  symbolsWithCallers: Object.keys(symbolRouter.symbolToCallers).length,
  symbolsWithDependents: Object.keys(symbolRouter.symbolToDependents).length
};

symbolRouter.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\SymbolRouter.json', JSON.stringify(symbolRouter, null, 2));
console.log('Symbol Router generated successfully.');
console.log(JSON.stringify(summary, null, 2));
