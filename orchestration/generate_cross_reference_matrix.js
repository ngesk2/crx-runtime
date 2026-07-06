const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));
const executionRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\ExecutionRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const capabilityRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));
const symbolRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\SymbolRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const lawRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\LawRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));

const crossReferenceMatrix = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  uuidToRelations: {},
  summary: {}
};

// Build cross-reference matrix for each UUID
uuidRegistry.uuids.forEach(uuidEntry => {
  const uuid = uuidEntry.uuid;
  const relations = {
    uuid: uuid,
    path: uuidEntry.path,
    type: uuidEntry.type,
    owner: uuidEntry.owner || 'UNKNOWN',
    subsystem: uuidEntry.subsystem || 'UNKNOWN',
    authorityType: uuidEntry.authorityType || 'UNKNOWN',
    lifecycle: uuidEntry.lifecycle || 'UNKNOWN',
    dependencies: [],
    dependents: [],
    exports: [],
    imports: [],
    executionGraphs: [],
    capabilities: [],
    authorities: [],
    laws: [],
    symbols: [],
    callers: [],
    risks: []
  };
  
  // Dependencies (what this UUID imports)
  const depNode = dependencyGraph.nodes.find(n => n.path === uuidEntry.path);
  if (depNode && depNode.imports) {
    depNode.imports.forEach(imp => {
      const impUUIDs = symbolRouter.symbolToUUID[imp] || [];
      impUUIDs.forEach(impUUID => {
        if (!relations.dependencies.includes(impUUID)) {
          relations.dependencies.push(impUUID);
        }
      });
    });
  }
  
  // Dependents (what imports this UUID)
  Object.keys(symbolRouter.symbolToUUID).forEach(symbol => {
    const symbolUUIDs = symbolRouter.symbolToUUID[symbol];
    if (symbolUUIDs.includes(uuid)) {
      const callers = symbolRouter.symbolToCallers[symbol] || [];
      if (Array.isArray(callers)) {
        callers.forEach(callerUUID => {
          if (!relations.dependents.includes(callerUUID)) {
            relations.dependents.push(callerUUID);
          }
        });
      }
    }
  });
  
  // Exports
  if (depNode && depNode.exports) {
    const exports = Array.isArray(depNode.exports) ? depNode.exports : [depNode.exports];
    exports.forEach(exp => {
      if (exp && typeof exp === 'string') {
        relations.exports.push(exp);
      }
    });
  }
  
  // Imports
  if (depNode && depNode.imports) {
    depNode.imports.forEach(imp => {
      if (imp && typeof imp === 'string') {
        relations.imports.push(imp);
      }
    });
  }
  
  // Execution graphs
  Object.keys(executionRouter.routingTables).forEach(graphType => {
    const table = executionRouter.routingTables[graphType];
    if (table.reachableUUIDs.includes(uuid)) {
      relations.executionGraphs.push(graphType);
    }
  });
  
  // Capabilities
  Object.keys(capabilityRegistry.capabilities).forEach(capabilityName => {
    const capability = capabilityRegistry.capabilities[capabilityName];
    if (capability.canonical && capability.canonical.uuid === uuid) {
      relations.capabilities.push({ name: capabilityName, role: 'canonical' });
    }
    capability.supporting.forEach(supporting => {
      if (supporting.uuid === uuid) {
        relations.capabilities.push({ name: capabilityName, role: 'supporting' });
      }
    });
    capability.deprecated.forEach(deprecated => {
      if (deprecated.uuid === uuid) {
        relations.capabilities.push({ name: capabilityName, role: 'deprecated' });
      }
    });
  });
  
  // Authorities
  Object.keys(authorityResolver.authorities).forEach(authorityName => {
    const authority = authorityResolver.authorities[authorityName];
    if (authority.canonical && authority.canonical.uuid === uuid) {
      relations.authorities.push({ name: authorityName, role: 'canonical' });
    }
    authority.supporting.forEach(supporting => {
      if (supporting.uuid === uuid) {
        relations.authorities.push({ name: authorityName, role: 'supporting' });
      }
    });
  });
  
  // Laws
  Object.keys(lawRouter.laws).forEach(lawName => {
    const law = lawRouter.laws[lawName];
    law.implementations.forEach(impl => {
      if (impl.uuid === uuid) {
        relations.laws.push({ name: lawName, severity: law.severity, category: law.category });
      }
    });
  });
  
  // Symbols
  relations.symbols = symbolRouter.uuidToSymbols[uuid] || [];
  
  // Callers
  relations.symbols.forEach(symbol => {
    const callers = symbolRouter.symbolToCallers[symbol] || [];
    if (Array.isArray(callers)) {
      callers.forEach(callerUUID => {
        if (!relations.callers.includes(callerUUID)) {
          relations.callers.push(callerUUID);
        }
      });
    }
  });
  
  // Risks (from manifest deletion risk)
  const manifestEntry = constitutionManifest.artifacts.find(a => a.path === uuidEntry.path);
  if (manifestEntry && manifestEntry.deletionRisk) {
    relations.risks.push({ type: 'deletion', level: manifestEntry.deletionRisk });
  }
  
  crossReferenceMatrix.uuidToRelations[uuid] = relations;
});

// Generate summary
const summary = {
  totalUUIDs: Object.keys(crossReferenceMatrix.uuidToRelations).length,
  totalDependencies: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.dependencies.length, 0),
  totalDependents: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.dependents.length, 0),
  totalExports: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.exports.length, 0),
  totalImports: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.imports.length, 0),
  totalExecutionGraphMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.executionGraphs.length, 0),
  totalCapabilityMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.capabilities.length, 0),
  totalAuthorityMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.authorities.length, 0),
  totalLawMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.laws.length, 0),
  totalSymbolMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.symbols.length, 0),
  totalCallerMappings: Object.values(crossReferenceMatrix.uuidToRelations).reduce((sum, r) => sum + r.callers.length, 0)
};

crossReferenceMatrix.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\CrossReferenceMatrix.json', JSON.stringify(crossReferenceMatrix, null, 2));
console.log('Cross-Reference Matrix generated successfully.');
console.log(JSON.stringify(summary, null, 2));
