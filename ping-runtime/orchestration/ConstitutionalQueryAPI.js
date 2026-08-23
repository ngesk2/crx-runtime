const fs = require('fs');
const path = require('path');

// Load routing artifacts
const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const routingIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', 'utf8').replace(/^\uFEFF/, ''));
const capabilityRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\CapabilityRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const authorityResolver = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', 'utf8').replace(/^\uFEFF/, ''));
const executionRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\ExecutionRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const symbolRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\SymbolRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const lawRouter = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\LawRouter.json', 'utf8').replace(/^\uFEFF/, ''));
const contextPackets = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\ContextPackets.json', 'utf8').replace(/^\uFEFF/, ''));
const routingCache = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingCache.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));

class ConstitutionalQueryAPI {
  constructor() {
    this.uuidRegistry = uuidRegistry;
    this.routingIndex = routingIndex;
    this.capabilityRegistry = capabilityRegistry;
    this.authorityResolver = authorityResolver;
    this.executionRouter = executionRouter;
    this.symbolRouter = symbolRouter;
    this.lawRouter = lawRouter;
    this.contextPackets = contextPackets;
    this.routingCache = routingCache;
    this.constitutionManifest = constitutionManifest;
  }

  // Resolve Authority by name
  ResolveAuthority(authorityName) {
    const authority = this.authorityResolver.authorities[authorityName];
    if (!authority) {
      return { error: 'Authority not found', authorityName };
    }
    return {
      name: authorityName,
      canonical: authority.canonical,
      supporting: authority.supporting,
      deprecated: authority.deprecated,
      experimental: authority.experimental,
      unreachable: authority.unreachable,
      totalImplementations: authority.totalImplementations,
      executionGraphs: authority.executionGraphs,
      tests: authority.tests,
      laws: authority.laws
    };
  }

  // Resolve Capability by name
  ResolveCapability(capabilityName) {
    const capability = this.capabilityRegistry.capabilities[capabilityName];
    if (!capability) {
      return { error: 'Capability not found', capabilityName };
    }
    return {
      name: capabilityName,
      description: capability.description,
      keywords: capability.keywords,
      canonical: capability.canonical,
      supporting: capability.supporting,
      deprecated: capability.deprecated,
      experimental: capability.experimental,
      totalImplementations: capability.totalImplementations,
      evidenceChain: capability.evidenceChain
    };
  }

  // Resolve Symbol by name
  ResolveSymbol(symbolName) {
    const uuids = this.symbolRouter.symbolToUUID[symbolName];
    if (!uuids) {
      return { error: 'Symbol not found', symbolName };
    }
    return {
      symbol: symbolName,
      uuids: uuids,
      authority: this.symbolRouter.symbolToAuthority[symbolName] || null,
      capability: this.symbolRouter.symbolToCapability[symbolName] || null,
      executionGraphs: this.symbolRouter.symbolToExecutionGraphs[symbolName] || [],
      callers: this.symbolRouter.symbolToCallers[symbolName] || [],
      dependents: this.symbolRouter.symbolToDependents[symbolName] || []
    };
  }

  // Resolve Execution Graph by type
  ResolveExecutionGraph(graphType) {
    const table = this.executionRouter.routingTables[graphType];
    if (!table) {
      return { error: 'Execution graph not found', graphType };
    }
    return {
      name: table.name,
      entrypoints: table.entrypoints,
      reachableUUIDs: table.reachableUUIDs,
      capabilities: table.capabilities,
      authorities: table.authorities,
      summary: table.summary
    };
  }

  // Resolve Owner by name
  ResolveOwner(ownerName) {
    const uuids = this.routingIndex.owner.ownerToUUIDs[ownerName];
    if (!uuids) {
      return { error: 'Owner not found', ownerName };
    }
    return {
      owner: ownerName,
      uuids: uuids,
      totalArtifacts: uuids.length
    };
  }

  // Resolve Law by name
  ResolveLaw(lawName) {
    const law = this.lawRouter.laws[lawName];
    if (!law) {
      return { error: 'Law not found', lawName };
    }
    return {
      name: lawName,
      description: law.description,
      severity: law.severity,
      category: law.category,
      keywords: law.keywords,
      implementations: law.implementations,
      authorities: law.authorities,
      tests: law.tests,
      violations: law.violations,
      totalImplementations: law.totalImplementations,
      totalAuthorities: law.totalAuthorities,
      totalViolations: law.totalViolations
    };
  }

  // Resolve UUID to path and metadata
  ResolveUUID(uuid) {
    const path = this.routingCache.uuidToPath[uuid];
    if (!path) {
      return { error: 'UUID not found', uuid };
    }
    const type = this.routingCache.uuidToType[uuid];
    const uuidEntry = this.uuidRegistry.uuids.find(u => u.uuid === uuid);
    return {
      uuid: uuid,
      path: path,
      type: type,
      size: uuidEntry?.size,
      checksum: uuidEntry?.checksum,
      language: uuidEntry?.language,
      owner: uuidEntry?.owner,
      subsystem: uuidEntry?.subsystem,
      lifecycle: uuidEntry?.lifecycle
    };
  }

  // Find Tests for a UUID
  FindTests(uuid) {
    // Placeholder - would need test graph data
    return {
      uuid: uuid,
      tests: [],
      totalTests: 0
    };
  }

  // Find Callers for a UUID
  FindCallers(uuid) {
    const symbols = this.routingCache.uuidToSymbols[uuid] || [];
    const callers = [];
    symbols.forEach(symbol => {
      const symbolCallers = this.symbolRouter.symbolToCallers[symbol] || [];
      symbolCallers.forEach(callerUUID => {
        if (!callers.includes(callerUUID)) {
          callers.push(callerUUID);
        }
      });
    });
    return {
      uuid: uuid,
      symbols: symbols,
      callers: callers,
      totalCallers: callers.length
    };
  }

  // Find Dependents for a UUID
  FindDependents(uuid) {
    const symbols = this.routingCache.uuidToSymbols[uuid] || [];
    const dependents = [];
    symbols.forEach(symbol => {
      const symbolDependents = this.symbolRouter.symbolToDependents[symbol] || [];
      symbolDependents.forEach(dep => {
        const depUUIDs = this.symbolRouter.symbolToUUID[dep] || [];
        depUUIDs.forEach(depUUID => {
          if (!dependents.includes(depUUID)) {
            dependents.push(depUUID);
          }
        });
      });
    });
    return {
      uuid: uuid,
      symbols: symbols,
      dependents: dependents,
      totalDependents: dependents.length
    };
  }

  // Find Safe Mutation Boundary for a UUID
  FindSafeMutationBoundary(uuid) {
    const uuidEntry = this.uuidRegistry.uuids.find(u => u.uuid === uuid);
    if (!uuidEntry) {
      return { error: 'UUID not found', uuid };
    }
    
    const manifestEntry = this.constitutionManifest.artifacts.find(a => a.path === uuidEntry.path);
    
    return {
      uuid: uuid,
      path: uuidEntry.path,
      deletionRisk: manifestEntry?.deletionRisk || 'UNKNOWN',
      lifecycle: manifestEntry?.lifecycle || 'UNKNOWN',
      owner: manifestEntry?.owner || 'UNKNOWN',
      canonicalReplacement: manifestEntry?.canonicalReplacement || null,
      safeToModify: manifestEntry?.deletionRisk !== 'HIGH',
      safeToDelete: manifestEntry?.deletionRisk === 'SAFE'
    };
  }

  // Check if UUID can be deleted
  CanDelete(uuid) {
    const boundary = this.FindSafeMutationBoundary(uuid);
    const callers = this.FindCallers(uuid);
    
    return {
      uuid: uuid,
      canDelete: boundary.safeToDelete && callers.totalCallers === 0,
      safeToDelete: boundary.safeToDelete,
      hasCallers: callers.totalCallers > 0,
      totalCallers: callers.totalCallers,
      deletionRisk: boundary.deletionRisk,
      lifecycle: boundary.lifecycle
    };
  }

  // Check if UUID can be modified
  CanModify(uuid) {
    const boundary = this.FindSafeMutationBoundary(uuid);
    
    return {
      uuid: uuid,
      canModify: boundary.safeToModify,
      safeToModify: boundary.safeToModify,
      deletionRisk: boundary.deletionRisk,
      lifecycle: boundary.lifecycle
    };
  }

  // Get Context Packet by type
  GetContextPacket(packetType) {
    const packet = this.contextPackets.packets[packetType];
    if (!packet) {
      return { error: 'Context packet not found', packetType };
    }
    return packet;
  }

  // Get all available context packets
  ListContextPackets() {
    return {
      totalPackets: this.contextPackets.summary.totalPackets,
      packetTypes: this.contextPackets.summary.packetTypes,
      packets: Object.keys(this.contextPackets.packets).map(type => ({
        type: type,
        name: this.contextPackets.packets[type].name,
        description: this.contextPackets.packets[type].description
      }))
    };
  }

  // Search by capability keyword
  SearchByCapability(keyword) {
    const results = [];
    Object.keys(this.capabilityRegistry.capabilities).forEach(capabilityName => {
      const capability = this.capabilityRegistry.capabilities[capabilityName];
      if (capability.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))) {
        results.push({
          name: capabilityName,
          description: capability.description,
          canonical: capability.canonical,
          totalImplementations: capability.totalImplementations
        });
      }
    });
    return {
      keyword: keyword,
      results: results,
      totalResults: results.length
    };
  }

  // Search by law category
  SearchByLawCategory(category) {
    const results = [];
    Object.keys(this.lawRouter.laws).forEach(lawName => {
      const law = this.lawRouter.laws[lawName];
      if (law.category.toLowerCase() === category.toLowerCase()) {
        results.push({
          name: lawName,
          description: law.description,
          severity: law.severity,
          totalViolations: law.totalViolations
        });
      }
    });
    return {
      category: category,
      results: results,
      totalResults: results.length
    };
  }

  // Get API summary
  GetSummary() {
    return {
      version: '1.0.0',
      totalUUIDs: this.uuidRegistry.uuids.length,
      totalCapabilities: Object.keys(this.capabilityRegistry.capabilities).length,
      totalAuthorities: Object.keys(this.authorityResolver.authorities).length,
      totalSymbols: Object.keys(this.symbolRouter.symbolToUUID).length,
      totalLaws: Object.keys(this.lawRouter.laws).length,
      totalExecutionGraphs: Object.keys(this.executionRouter.routingTables).length,
      totalContextPackets: Object.keys(this.contextPackets.packets).length,
      availableQueries: [
        'ResolveAuthority',
        'ResolveCapability',
        'ResolveSymbol',
        'ResolveExecutionGraph',
        'ResolveOwner',
        'ResolveLaw',
        'ResolveUUID',
        'FindTests',
        'FindCallers',
        'FindDependents',
        'FindSafeMutationBoundary',
        'CanDelete',
        'CanModify',
        'GetContextPacket',
        'ListContextPackets',
        'SearchByCapability',
        'SearchByLawCategory'
      ]
    };
  }
}

// Export singleton instance
const api = new ConstitutionalQueryAPI();

// If run directly, execute a sample query
if (require.main === module) {
  console.log('Constitutional Query API initialized');
  console.log(JSON.stringify(api.GetSummary(), null, 2));
}

module.exports = api;
