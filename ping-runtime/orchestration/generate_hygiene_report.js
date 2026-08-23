const fs = require('fs');
const path = require('path');

const filesystemIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));
const executionGraphs = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));

const hygieneReport = {
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  evidenceLevel: 'L3 - Graph Analysis',
  evidenceChain: 'Filesystem (L0) → Parser (L1) → Runtime Metadata (L2) → Graph (L3) → Manifest (L4)',
  findings: {
    authorityClusters: [],
    duplicateRuntimes: [],
    duplicateBootstraps: [],
    orphanModules: [],
    unreachableModules: [],
    oversizedModules: [],
    deterministicViolations: [],
    reachabilityAnalysis: []
  },
  summary: {}
};

// Build authority clusters (graph-based canonicalization)
function buildAuthorityClusters() {
  const clusters = {};
  
  // Group by semantic naming patterns
  dependencyGraph.nodes.forEach(node => {
    const fileName = path.basename(node.path, '.js');
    
    // Extract authority type from filename
    let authorityType = null;
    if (fileName.includes('authority')) {
      authorityType = fileName.replace(/_authority.*$/, '').replace(/.*_authority$/, 'authority');
    } else if (fileName.includes('Authority')) {
      authorityType = fileName.replace(/Authority.*$/, '').replace(/.*Authority$/, 'Authority');
    }
    
    if (authorityType) {
      if (!clusters[authorityType]) {
        clusters[authorityType] = {
          name: authorityType,
          implementations: [],
          evidenceChain: []
        };
      }
      
      // Check execution graph reachability
      const reachableIn = [];
      Object.keys(executionGraphs.graphs).forEach(graphType => {
        const graph = executionGraphs.graphs[graphType];
        if (graph.reachableNodes.includes(node.path)) {
          reachableIn.push(graphType);
        }
      });
      
      // Check manifest ownership
      const manifestEntry = constitutionManifest.artifacts.find(a => a.path === node.path);
      
      clusters[authorityType].implementations.push({
        path: node.path,
        size: filesystemIndex.find(f => f.AbsolutePath === node.absolutePath)?.Size || 0,
        reachableIn: reachableIn,
        manifestOwnership: manifestEntry?.owner || 'UNKNOWN',
        manifestLifecycle: manifestEntry?.lifecycle || 'UNKNOWN'
      });
      
      clusters[authorityType].evidenceChain.push({
        level: 'L1',
        source: 'Parser',
        finding: `Export detected: ${fileName}`
      });
      
      if (reachableIn.length > 0) {
        clusters[authorityType].evidenceChain.push({
          level: 'L3',
          source: 'Execution Graph',
          finding: `Reachable in: ${reachableIn.join(', ')}`
        });
      }
      
      if (manifestEntry) {
        clusters[authorityType].evidenceChain.push({
          level: 'L4',
          source: 'Constitution Manifest',
          finding: `Owner: ${manifestEntry.owner}, Lifecycle: ${manifestEntry.lifecycle}`
        });
      }
    }
  });
  
  return clusters;
}

const authorityClusters = buildAuthorityClusters();

Object.keys(authorityClusters).forEach(clusterName => {
  const cluster = authorityClusters[clusterName];
  
  if (cluster.implementations.length > 1) {
    // Classify implementations based on evidence
    const canonical = cluster.implementations.find(impl => 
      impl.manifestLifecycle === 'Active' || 
      impl.reachableIn.includes('kernel') ||
      impl.reachableIn.includes('gatewayHTTP')
    ) || cluster.implementations[0];
    
    const supporting = cluster.implementations.filter(impl => 
      impl !== canonical && 
      (impl.reachableIn.length > 0 || impl.manifestLifecycle === 'Transitional')
    );
    
    const deprecated = cluster.implementations.filter(impl => 
      impl.manifestLifecycle === 'Dead' || 
      impl.manifestLifecycle === 'Deprecated'
    );
    
    const experimental = cluster.implementations.filter(impl => 
      impl !== canonical && 
      impl.manifestLifecycle === 'UNKNOWN' && 
      impl.reachableIn.length === 0
    );
    
    hygieneReport.findings.authorityClusters.push({
      clusterName: clusterName,
      canonical: canonical,
      supporting: supporting,
      experimental: experimental,
      deprecated: deprecated,
      evidenceChain: cluster.evidenceChain,
      recommendation: 'Canonicalization required - multiple implementations detected'
    });
  }
});

// Find duplicate runtimes with evidence chain
const runtimeFiles = filesystemIndex.filter(f => f.RelativePath.toLowerCase().includes('runtime') && f.Language === 'JavaScript');
const runtimeMap = {};
runtimeFiles.forEach(file => {
  const name = path.basename(file.RelativePath, '.js');
  if (!runtimeMap[name]) {
    runtimeMap[name] = [];
  }
  runtimeMap[name].push({
    path: file.RelativePath,
    absolutePath: file.AbsolutePath,
    size: file.Size
  });
});

Object.keys(runtimeMap).forEach(runtimeName => {
  if (runtimeMap[runtimeName].length > 1) {
    const implementations = runtimeMap[runtimeName];
    
    // Check execution graph reachability for each
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
    
    hygieneReport.findings.duplicateRuntimes.push({
      runtime: runtimeName,
      implementations: implementations,
      evidenceChain: [
        { level: 'L0', source: 'Filesystem', finding: `Multiple files with runtime name: ${runtimeName}` },
        { level: 'L3', source: 'Execution Graph', finding: 'Reachability analysis performed' }
      ]
    });
  }
});

// Find duplicate bootstraps with evidence chain
const bootstrapFiles = filesystemIndex.filter(f => f.RelativePath.toLowerCase().includes('bootstrap') && f.Language === 'JavaScript');
const bootstrapMap = {};
bootstrapFiles.forEach(file => {
  const name = path.basename(file.RelativePath, '.js');
  if (!bootstrapMap[name]) {
    bootstrapMap[name] = [];
  }
  bootstrapMap[name].push({
    path: file.RelativePath,
    absolutePath: file.AbsolutePath,
    size: file.Size
  });
});

Object.keys(bootstrapMap).forEach(bootstrapName => {
  if (bootstrapMap[bootstrapName].length > 1) {
    const implementations = bootstrapMap[bootstrapName];
    
    // Check execution graph reachability for each
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
    
    hygieneReport.findings.duplicateBootstraps.push({
      bootstrap: bootstrapName,
      implementations: implementations,
      evidenceChain: [
        { level: 'L0', source: 'Filesystem', finding: `Multiple files with bootstrap name: ${bootstrapName}` },
        { level: 'L3', source: 'Execution Graph', finding: 'Reachability analysis performed' }
      ]
    });
  }
});

// Find orphan modules with evidence chain
const orphanNodes = dependencyGraph.nodes.filter(node => 
  node.imports.length === 0 && node.importedBy.length === 0
);

orphanNodes.forEach(node => {
  // Check execution graph reachability
  const reachableIn = [];
  Object.keys(executionGraphs.graphs).forEach(graphType => {
    const graph = executionGraphs.graphs[graphType];
    if (graph.reachableNodes.includes(node.path)) {
      reachableIn.push(graphType);
    }
  });
  
  // Check manifest
  const manifestEntry = constitutionManifest.artifacts.find(a => a.path === node.path);
  
  hygieneReport.findings.orphanModules.push({
    path: node.path,
    reachableIn: reachableIn,
    manifestOwnership: manifestEntry?.owner || 'UNKNOWN',
    manifestLifecycle: manifestEntry?.lifecycle || 'UNKNOWN',
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: 'No imports and not imported by anyone' },
      { level: 'L3', source: 'Execution Graph', finding: reachableIn.length > 0 ? `Reachable in: ${reachableIn.join(', ')}` : 'Not reachable in any execution graph' },
      { level: 'L4', source: 'Constitution Manifest', finding: `Owner: ${manifestEntry?.owner || 'UNKNOWN'}, Lifecycle: ${manifestEntry?.lifecycle || 'UNKNOWN'}` }
    ]
  });
});

// Find oversized modules with evidence chain
const oversizedFiles = filesystemIndex.filter(f => f.Size > 50000);

oversizedFiles.forEach(file => {
  // Check execution graph reachability
  const reachableIn = [];
  Object.keys(executionGraphs.graphs).forEach(graphType => {
    const graph = executionGraphs.graphs[graphType];
    if (graph.reachableNodes.includes(file.RelativePath)) {
      reachableIn.push(graphType);
    }
  });
  
  // Check manifest
  const manifestEntry = constitutionManifest.artifacts.find(a => a.path === file.RelativePath);
  
  hygieneReport.findings.oversizedModules.push({
    path: file.RelativePath,
    size: file.Size,
    reachableIn: reachableIn,
    manifestOwnership: manifestEntry?.owner || 'UNKNOWN',
    manifestLifecycle: manifestEntry?.lifecycle || 'UNKNOWN',
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: `File size > 50KB (${file.Size} bytes)` },
      { level: 'L3', source: 'Execution Graph', finding: reachableIn.length > 0 ? `Reachable in: ${reachableIn.join(', ')}` : 'Not reachable in any execution graph' },
      { level: 'L4', source: 'Constitution Manifest', finding: `Owner: ${manifestEntry?.owner || 'UNKNOWN'}, Lifecycle: ${manifestEntry?.lifecycle || 'UNKNOWN'}` }
    ]
  });
});

// Find potential deterministic violations with evidence chain
dependencyGraph.nodes.forEach(node => {
  try {
    const content = fs.readFileSync(node.absolutePath, 'utf8');
    const violations = [];
    
    if (content.includes('new Date()') || content.includes('Date.now()')) {
      violations.push('wall-clock dependency');
    }
    if (content.includes('Math.random()')) {
      violations.push('non-deterministic random');
    }
    if (content.includes('crypto.randomUUID()')) {
      violations.push('non-deterministic UUID');
    }
    if (content.includes('JSON.stringify') && !content.includes('Object.keys')) {
      violations.push('potential JSON.stringify non-determinism');
    }
    
    if (violations.length > 0) {
      // Check execution graph reachability
      const reachableIn = [];
      Object.keys(executionGraphs.graphs).forEach(graphType => {
        const graph = executionGraphs.graphs[graphType];
        if (graph.reachableNodes.includes(node.path)) {
          reachableIn.push(graphType);
        }
      });
      
      // Check manifest
      const manifestEntry = constitutionManifest.artifacts.find(a => a.path === node.path);
      
      hygieneReport.findings.deterministicViolations.push({
        path: node.path,
        violations: violations,
        reachableIn: reachableIn,
        manifestOwnership: manifestEntry?.owner || 'UNKNOWN',
        manifestLifecycle: manifestEntry?.lifecycle || 'UNKNOWN',
        evidenceChain: [
          { level: 'L1', source: 'Parser', finding: `Detected patterns: ${violations.join(', ')}` },
          { level: 'L3', source: 'Execution Graph', finding: reachableIn.length > 0 ? `Reachable in: ${reachableIn.join(', ')}` : 'Not reachable in any execution graph' },
          { level: 'L4', source: 'Constitution Manifest', finding: `Owner: ${manifestEntry?.owner || 'UNKNOWN'}, Lifecycle: ${manifestEntry?.lifecycle || 'UNKNOWN'}` }
        ]
      });
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

// Add reachability analysis summary
Object.keys(executionGraphs.graphs).forEach(graphType => {
  const graph = executionGraphs.graphs[graphType];
  hygieneReport.findings.reachabilityAnalysis.push({
    graphName: graph.name,
    entrypoints: graph.entrypoints.length,
    reachableNodes: graph.reachableNodes.length,
    evidenceChain: [
      { level: 'L2', source: 'Runtime Metadata', finding: `${graph.entrypoints.length} entrypoints identified` },
      { level: 'L3', source: 'Execution Graph', finding: `${graph.reachableNodes.length} nodes reachable` }
    ]
  });
});

// Generate summary
hygieneReport.summary = {
  totalFiles: filesystemIndex.length,
  totalJavaScriptFiles: dependencyGraph.nodes.length,
  totalExecutionGraphs: Object.keys(executionGraphs.graphs).length,
  totalManifestArtifacts: constitutionManifest.artifacts.length,
  authorityClusters: hygieneReport.findings.authorityClusters.length,
  duplicateRuntimes: hygieneReport.findings.duplicateRuntimes.length,
  duplicateBootstraps: hygieneReport.findings.duplicateBootstraps.length,
  orphanModules: hygieneReport.findings.orphanModules.length,
  oversizedModules: hygieneReport.findings.oversizedModules.length,
  deterministicViolations: hygieneReport.findings.deterministicViolations.length,
  reachabilityAnalysis: hygieneReport.findings.reachabilityAnalysis.length
};

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', JSON.stringify(hygieneReport, null, 2));
console.log('Repository hygiene report generated successfully.');
console.log(JSON.stringify(hygieneReport.summary, null, 2));
