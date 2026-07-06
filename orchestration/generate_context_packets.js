const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const executionRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\ExecutionRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const capabilityRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));
const lawRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\LawRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const routingIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

const contextPackets = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  packets: {}
};

// Define context packet types
const packetTypes = {
  kernel: {
    name: 'Kernel Packet',
    description: 'Core execution engine and constitutional authorities',
    executionGraphs: ['kernel'],
    capabilities: ['Hash', 'Serialization', 'Identity', 'Scheduling', 'Notification', 'Logging'],
    authorities: ['scheduler', 'consensus', 'event_queue', 'context_authority']
  },
  replay: {
    name: 'Replay Packet',
    description: 'Replay verification and log management',
    executionGraphs: ['replay'],
    capabilities: ['Replay', 'Hash', 'Serialization', 'Persistence'],
    authorities: ['replay_authority', 'replay_log']
  },
  witness: {
    name: 'Witness Packet',
    description: 'Witness generation and verification',
    executionGraphs: ['witness'],
    capabilities: ['Witness', 'Hash', 'Serialization'],
    authorities: ['witness_authority']
  },
  gateway: {
    name: 'Gateway Packet',
    description: 'HTTP and CLI gateway interfaces',
    executionGraphs: ['gatewayHTTP', 'gatewayCLI'],
    capabilities: ['Serialization', 'Configuration', 'Authorization', 'Logging'],
    authorities: ['gateway_authority']
  },
  commit: {
    name: 'Commit Packet',
    description: 'Commit service and persistence',
    executionGraphs: ['commit'],
    capabilities: ['Commit', 'Persistence', 'Database', 'Serialization'],
    authorities: ['commit_authority']
  },
  worker: {
    name: 'Worker Packet',
    description: 'Worker port and execution',
    executionGraphs: ['worker'],
    capabilities: ['Scheduling', 'Notification', 'Identity'],
    authorities: ['worker_port']
  },
  knowledge: {
    name: 'Knowledge Packet',
    description: 'Knowledge compilation and indexing',
    executionGraphs: ['knowledgeCompiler'],
    capabilities: ['Knowledge', 'Search', 'Index'],
    authorities: ['knowledge_compiler']
  },
  infrastructure: {
    name: 'Infrastructure Packet',
    description: 'Infrastructure and deployment',
    executionGraphs: ['build'],
    capabilities: ['Configuration', 'Filesystem', 'Migration'],
    authorities: []
  }
};

// Build each context packet
Object.keys(packetTypes).forEach(packetType => {
  const definition = packetTypes[packetType];
  
  const packet = {
    name: definition.name,
    description: definition.description,
    authorities: {},
    capabilities: {},
    executionGraph: {},
    safeMutationRules: [],
    laws: {},
    tests: [],
    knownRisks: [],
    canonicalFiles: [],
    summary: {}
  };
  
  // Map execution graph
  definition.executionGraphs.forEach(graphType => {
    const table = executionRouter.routingTables[graphType];
    if (table) {
      packet.executionGraph[graphType] = {
        entrypoints: table.entrypoints,
        reachableUUIDs: table.reachableUUIDs,
        totalCapabilities: table.summary.totalCapabilities,
        totalAuthorities: table.summary.totalAuthorities
      };
    }
  });
  
  // Map authorities
  definition.authorities.forEach(authorityName => {
    const authority = authorityResolver.authorities[authorityName];
    if (authority) {
      packet.authorities[authorityName] = {
        canonical: authority.canonical,
        supporting: authority.supporting,
        totalImplementations: authority.totalImplementations
      };
    }
  });
  
  // Map capabilities
  definition.capabilities.forEach(capabilityName => {
    const capability = capabilityRegistry.capabilities[capabilityName];
    if (capability) {
      packet.capabilities[capabilityName] = {
        canonical: capability.canonical,
        supporting: capability.supporting,
        totalImplementations: capability.totalImplementations
      };
    }
  });
  
  // Map laws
  Object.keys(lawRouter.laws).forEach(lawName => {
    const law = lawRouter.laws[lawName];
    const relevantUUIDs = [];
    
    definition.executionGraphs.forEach(graphType => {
      const table = executionRouter.routingTables[graphType];
      if (table) {
        law.implementations.forEach(impl => {
          if (table.reachableUUIDs.includes(impl.uuid)) {
            relevantUUIDs.push(impl.uuid);
          }
        });
      }
    });
    
    if (relevantUUIDs.length > 0) {
      packet.laws[lawName] = {
        severity: law.severity,
        category: law.category,
        relevantImplementations: relevantUUIDs.length,
        violations: law.violations.filter(v => relevantUUIDs.includes(v.uuid)).length
      };
    }
  });
  
  // Map known risks from hygiene report
  definition.executionGraphs.forEach(graphType => {
    const table = executionRouter.routingTables[graphType];
    if (table) {
      hygieneReport.findings.deterministicViolations.forEach(violation => {
        const uuid = uuidRegistry.pathToUUID[violation.path];
        if (uuid && table.reachableUUIDs.includes(uuid)) {
          packet.knownRisks.push({
            uuid: uuid,
            path: violation.path,
            violations: violation.violations,
            risk: 'HIGH'
          });
        }
      });
      
      hygieneReport.findings.oversizedModules.forEach(oversized => {
        const uuid = uuidRegistry.pathToUUID[oversized.path];
        if (uuid && table.reachableUUIDs.includes(uuid)) {
          packet.knownRisks.push({
            uuid: uuid,
            path: oversized.path,
            violations: ['oversized'],
            risk: 'MEDIUM'
          });
        }
      });
    }
  });
  
  // Identify canonical files
  Object.keys(packet.authorities).forEach(authorityName => {
    const authority = packet.authorities[authorityName];
    if (authority.canonical) {
      packet.canonicalFiles.push(authority.canonical.uuid);
    }
  });
  
  Object.keys(packet.capabilities).forEach(capabilityName => {
    const capability = packet.capabilities[capabilityName];
    if (capability.canonical) {
      packet.canonicalFiles.push(capability.canonical.uuid);
    }
  });
  
  // Generate summary
  packet.summary = {
    totalAuthorities: Object.keys(packet.authorities).length,
    totalCapabilities: Object.keys(packet.capabilities).length,
    totalExecutionGraphs: Object.keys(packet.executionGraph).length,
    totalLaws: Object.keys(packet.laws).length,
    totalKnownRisks: packet.knownRisks.length,
    totalCanonicalFiles: packet.canonicalFiles.length
  };
  
  contextPackets.packets[packetType] = packet;
});

// Generate overall summary
const summary = {
  totalPackets: Object.keys(contextPackets.packets).length,
  packetTypes: Object.keys(contextPackets.packets),
  totalAuthorities: Object.values(contextPackets.packets).reduce((sum, p) => sum + p.summary.totalAuthorities, 0),
  totalCapabilities: Object.values(contextPackets.packets).reduce((sum, p) => sum + p.summary.totalCapabilities, 0),
  totalKnownRisks: Object.values(contextPackets.packets).reduce((sum, p) => sum + p.summary.totalKnownRisks, 0)
};

contextPackets.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\ContextPackets.json', JSON.stringify(contextPackets, null, 2));
console.log('Context Packets generated successfully.');
console.log(JSON.stringify(summary, null, 2));
