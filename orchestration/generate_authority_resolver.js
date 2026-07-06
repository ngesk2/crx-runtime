const fs = require('fs');
const path = require('path');

const uuidRegistry = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\UUIDRegistry.json', 'utf8').replace(/^\uFEFF/, ''));
const routingIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RoutingIndex.json', 'utf8').replace(/^\uFEFF/, ''));
const executionGraphs = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

const authorityResolver = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  authorities: {}
};

// Group authority UUIDs by authority name
Object.keys(routingIndex.authority.authorityNameToUUIDs).forEach(authorityName => {
  const authorityUUIDs = routingIndex.authority.authorityNameToUUIDs[authorityName];
  
  // Get detailed info for each UUID
  const implementations = authorityUUIDs.map(uuid => {
    const uuidEntry = uuidRegistry.uuids.find(u => u.uuid === uuid);
    return {
      uuid: uuid,
      path: uuidEntry.path,
      type: uuidEntry.type,
      size: uuidEntry.size,
      lifecycle: uuidEntry.lifecycle || 'UNKNOWN',
      owner: uuidEntry.owner || 'UNKNOWN',
      authorityType: uuidEntry.authorityType || 'UNKNOWN'
    };
  });
  
  // Determine canonical implementation
  const canonical = implementations.find(impl => {
    const lowerPath = impl.path.toLowerCase();
    // Prefer files in execution/kernel paths
    return lowerPath.includes('execution') || lowerPath.includes('kernel') || impl.lifecycle === 'Active';
  }) || implementations[0];
  
  // Check execution graph reachability for each implementation
  implementations.forEach(impl => {
    const reachableIn = [];
    Object.keys(executionGraphs.graphs).forEach(graphType => {
      const graph = executionGraphs.graphs[graphType];
      if (graph.reachableNodes.includes(impl.path)) {
        reachableIn.push(graphType);
      }
    });
    impl.reachableIn = reachableIn;
  });
  
  // Classify implementations
  const supporting = implementations.filter(impl => 
    impl !== canonical && 
    impl.lifecycle !== 'Dead' && 
    impl.lifecycle !== 'Deprecated' &&
    impl.reachableIn.length > 0
  );
  
  const deprecated = implementations.filter(impl => 
    impl.lifecycle === 'Dead' || impl.lifecycle === 'Deprecated'
  );
  
  const experimental = implementations.filter(impl => 
    impl !== canonical && 
    impl.lifecycle === 'UNKNOWN' && 
    impl.reachableIn.length === 0
  );
  
  const unreachable = implementations.filter(impl => 
    impl !== canonical && 
    impl.reachableIn.length === 0 &&
    impl.lifecycle !== 'Dead' &&
    impl.lifecycle !== 'Deprecated'
  );
  
  authorityResolver.authorities[authorityName] = {
    name: authorityName,
    canonical: canonical ? {
      uuid: canonical.uuid,
      path: canonical.path,
      reachableIn: canonical.reachableIn,
      lifecycle: canonical.lifecycle,
      owner: canonical.owner
    } : null,
    supporting: supporting.map(impl => ({
      uuid: impl.uuid,
      path: impl.path,
      reachableIn: impl.reachableIn,
      lifecycle: impl.lifecycle
    })),
    deprecated: deprecated.map(impl => ({
      uuid: impl.uuid,
      path: impl.path,
      lifecycle: impl.lifecycle
    })),
    experimental: experimental.map(impl => ({
      uuid: impl.uuid,
      path: impl.path
    })),
    unreachable: unreachable.map(impl => ({
      uuid: impl.uuid,
      path: impl.path
    })),
    totalImplementations: implementations.length,
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: `Authority exports identified: ${authorityName}` },
      { level: 'L2', source: 'Execution Graph', finding: `Reachability analyzed for ${implementations.length} implementations` },
      { level: 'L4', source: 'Constitution Manifest', finding: `Canonical: ${canonical ? canonical.uuid : 'none'}` }
    ]
  };
});

// Add execution graph mappings for each authority
Object.keys(authorityResolver.authorities).forEach(authorityName => {
  const authority = authorityResolver.authorities[authorityName];
  
  authority.executionGraphs = {};
  Object.keys(executionGraphs.graphs).forEach(graphType => {
    const graph = executionGraphs.graphs[graphType];
    const reachableUUIDs = authority.implementations?.filter(impl => 
      graph.reachableNodes.includes(impl.path)
    ).map(impl => impl.uuid) || [];
    
    if (reachableUUIDs.length > 0) {
      authority.executionGraphs[graphType] = reachableUUIDs;
    }
  });
});

// Add test mappings (placeholder - would need test graph data)
Object.keys(authorityResolver.authorities).forEach(authorityName => {
  authorityResolver.authorities[authorityName].tests = [];
});

// Add law mappings (placeholder - would need law graph data)
Object.keys(authorityResolver.authorities).forEach(authorityName => {
  authorityResolver.authorities[authorityName].laws = [];
});

// Generate summary
const summary = {
  totalAuthorities: Object.keys(authorityResolver.authorities).length,
  totalImplementations: Object.values(authorityResolver.authorities).reduce((sum, auth) => sum + auth.totalImplementations, 0),
  authoritiesWithCanonical: Object.values(authorityResolver.authorities).filter(auth => auth.canonical).length,
  authoritiesWithMultiple: Object.values(authorityResolver.authorities).filter(auth => auth.totalImplementations > 1).length,
  totalSupporting: Object.values(authorityResolver.authorities).reduce((sum, auth) => sum + auth.supporting.length, 0),
  totalDeprecated: Object.values(authorityResolver.authorities).reduce((sum, auth) => sum + auth.deprecated.length, 0),
  totalExperimental: Object.values(authorityResolver.authorities).reduce((sum, auth) => sum + auth.experimental.length, 0),
  totalUnreachable: Object.values(authorityResolver.authorities).reduce((sum, auth) => sum + auth.unreachable.length, 0)
};

authorityResolver.summary = summary;

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\AuthorityResolver.json', JSON.stringify(authorityResolver, null, 2));
console.log('Authority Resolver generated successfully.');
console.log(JSON.stringify(summary, null, 2));
