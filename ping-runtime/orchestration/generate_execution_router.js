const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const executionGraphs = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', 'utf8').replace(/^\uFEFF/, ''));
const capabilityRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));

const executionRouter = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  routingTables: {}
};

// Convert each execution graph to a routing table
Object.keys(executionGraphs.graphs).forEach(graphType => {
  const graph = executionGraphs.graphs[graphType];
  
  const routingTable = {
    name: graph.name,
    entrypoints: [],
    reachableUUIDs: [],
    capabilities: {},
    authorities: {},
    summary: {}
  };
  
  // Convert entrypoints to UUIDs
  graph.entrypoints.forEach(ep => {
    const uuid = uuidRegistry.pathToUUID[ep.path || ep.source];
    if (uuid) {
      const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
      routingTable.entrypoints.push({
        uuid: uuid,
        type: ep.type,
        path: ep.path || ep.source,
        command: ep.command,
        name: ep.name,
        service: ep.service
      });
    }
  });
  
  // Convert reachable nodes to UUIDs
  graph.reachableNodes.forEach(nodePath => {
    const uuid = uuidRegistry.pathToUUID[nodePath];
    if (uuid) {
      routingTable.reachableUUIDs.push(uuid);
    }
  });
  
  // Map capabilities in this graph
  Object.keys(capabilityRegistry.capabilities).forEach(capabilityName => {
    const capability = capabilityRegistry.capabilities[capabilityName];
    const reachableInGraph = capability.canonical && routingTable.reachableUUIDs.includes(capability.canonical.uuid);
    
    if (reachableInGraph || (capability.supporting && capability.supporting.some(s => routingTable.reachableUUIDs.includes(s.uuid)))) {
      routingTable.capabilities[capabilityName] = {
        canonical: capability.canonical && routingTable.reachableUUIDs.includes(capability.canonical.uuid) ? capability.canonical.uuid : null,
        supporting: capability.supporting ? capability.supporting.filter(s => routingTable.reachableUUIDs.includes(s.uuid)).map(s => s.uuid) : [],
        total: (capability.canonical && routingTable.reachableUUIDs.includes(capability.canonical.uuid) ? 1 : 0) + 
               (capability.supporting ? capability.supporting.filter(s => routingTable.reachableUUIDs.includes(s.uuid)).length : 0)
      };
    }
  });
  
  // Map authorities in this graph
  Object.keys(authorityResolver.authorities).forEach(authorityName => {
    const authority = authorityResolver.authorities[authorityName];
    const canonicalInGraph = authority.canonical && routingTable.reachableUUIDs.includes(authority.canonical.uuid);
    
    if (canonicalInGraph || (authority.supporting && authority.supporting.some(s => routingTable.reachableUUIDs.includes(s.uuid)))) {
      routingTable.authorities[authorityName] = {
        canonical: authority.canonical && routingTable.reachableUUIDs.includes(authority.canonical.uuid) ? authority.canonical.uuid : null,
        supporting: authority.supporting ? authority.supporting.filter(s => routingTable.reachableUUIDs.includes(s.uuid)).map(s => s.uuid) : [],
        total: (authority.canonical && routingTable.reachableUUIDs.includes(authority.canonical.uuid) ? 1 : 0) + 
               (authority.supporting ? authority.supporting.filter(s => routingTable.reachableUUIDs.includes(s.uuid)).length : 0)
      };
    }
  });
  
  // Generate summary
  routingTable.summary = {
    totalEntrypoints: routingTable.entrypoints.length,
    totalReachableUUIDs: routingTable.reachableUUIDs.length,
    totalCapabilities: Object.keys(routingTable.capabilities).length,
    totalAuthorities: Object.keys(routingTable.authorities).length,
    totalCapabilityImplementations: Object.values(routingTable.capabilities).reduce((sum, cap) => sum + cap.total, 0),
    totalAuthorityImplementations: Object.values(routingTable.authorities).reduce((sum, auth) => sum + auth.total, 0)
  };
  
  executionRouter.routingTables[graphType] = routingTable;
});

// Generate cross-graph summary
const crossGraphSummary = {
  totalGraphs: Object.keys(executionRouter.routingTables).length,
  totalEntrypoints: Object.values(executionRouter.routingTables).reduce((sum, table) => sum + table.summary.totalEntrypoints, 0),
  totalReachableUUIDs: Object.values(executionRouter.routingTables).reduce((sum, table) => sum + table.summary.totalReachableUUIDs, 0),
  capabilitiesByGraph: {},
  authoritiesByGraph: {}
};

Object.keys(executionRouter.routingTables).forEach(graphType => {
  const table = executionRouter.routingTables[graphType];
  crossGraphSummary.capabilitiesByGraph[graphType] = table.summary.totalCapabilities;
  crossGraphSummary.authoritiesByGraph[graphType] = table.summary.totalAuthorities;
});

executionRouter.crossGraphSummary = crossGraphSummary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\ExecutionRouter.json', JSON.stringify(executionRouter, null, 2));
console.log('Execution Router generated successfully.');
console.log(JSON.stringify(crossGraphSummary, null, 2));
