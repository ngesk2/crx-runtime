const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const filesystemIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8').replace(/^\uFEFF/, ''));
const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));
const executionGraphs = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', 'utf8').replace(/^\uFEFF/, ''));
const constitutionManifest = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryConstitutionManifest.json', 'utf8').replace(/^\uFEFF/, ''));
const hygieneReport = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryHygieneReport.json', 'utf8').replace(/^\uFEFF/, ''));

// Helper function to compute hash of JSON content
function computeHash(content) {
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

const architectureManifest = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  constitutionVersion: '1.0.0',
  repositoryVersion: '1.0.0',
  
  // Evidence hashes for verification
  evidenceHashes: {
    filesystem: computeHash(filesystemIndex),
    dependencyGraph: computeHash(dependencyGraph),
    executionGraphs: computeHash(executionGraphs),
    constitutionManifest: computeHash(constitutionManifest),
    hygieneReport: computeHash(hygieneReport)
  },
  
  // Runtime constitution
  runtime: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime')).length,
    kernelFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime/kernel')).length,
    replayFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime/replay')).length,
    commitServiceFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime/commit-service')).length,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Runtime directory structure identified' }
    ]
  },
  
  // Gateway constitution
  gateway: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('gateway')).length,
    httpGraph: executionGraphs.graphs.gatewayHTTP,
    cliGraph: executionGraphs.graphs.gatewayCLI,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Gateway directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'HTTP and CLI entrypoints identified' }
    ]
  },
  
  // Kernel constitution
  kernel: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime/kernel') || f.RelativePath.includes('orchestration')).length,
    executionGraph: executionGraphs.graphs.kernel,
    authorities: constitutionManifest.artifacts.filter(a => a.path.includes('authority')).length,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Kernel directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Kernel execution graph identified' },
      { level: 'L4', source: 'Constitution Manifest', finding: 'Authority artifacts counted' }
    ]
  },
  
  // Replay constitution
  replay: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('runtime/replay')).length,
    executionGraph: executionGraphs.graphs.replay,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Replay directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Replay execution graph identified' }
    ]
  },
  
  // Witness constitution
  witness: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('witness')).length,
    executionGraph: executionGraphs.graphs.witness,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Witness directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Witness execution graph identified' }
    ]
  },
  
  // Commit constitution
  commit: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('commit-service')).length,
    executionGraph: executionGraphs.graphs.commit,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Commit service directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Commit execution graph identified' }
    ]
  },
  
  // Workers constitution
  workers: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('worker')).length,
    executionGraph: executionGraphs.graphs.worker,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Worker directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Worker execution graph identified' }
    ]
  },
  
  // Knowledge Compiler constitution
  knowledgeCompiler: {
    totalFiles: filesystemIndex.filter(f => f.RelativePath.includes('knowledge_compiler')).length,
    executionGraph: executionGraphs.graphs.knowledgeCompiler,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Knowledge compiler directory structure identified' },
      { level: 'L2', source: 'Execution Graph', finding: 'Knowledge compiler execution graph identified' }
    ]
  },
  
  // Infrastructure constitution
  infrastructure: {
    dockerfiles: filesystemIndex.filter(f => f.RelativePath === 'Dockerfile' || f.RelativePath.endsWith('/Dockerfile')).length,
    dockerCompose: filesystemIndex.filter(f => f.RelativePath.startsWith('compose.') || f.RelativePath.endsWith('/compose.yaml') || f.RelativePath.endsWith('/docker-compose.yml')).length,
    packageJson: filesystemIndex.filter(f => f.RelativePath === 'package.json' || f.RelativePath.endsWith('/package.json')).length,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Infrastructure files counted' }
    ]
  },
  
  // Bootstraps constitution
  bootstraps: {
    totalBootstrapFiles: filesystemIndex.filter(f => f.RelativePath.toLowerCase().includes('bootstrap')).length,
    duplicateBootstraps: hygieneReport.findings.duplicateBootstraps.length,
    evidenceChain: [
      { level: 'L0', source: 'Filesystem', finding: 'Bootstrap files identified' },
      { level: 'L3', source: 'Hygiene Report', finding: 'Duplicate bootstraps detected' }
    ]
  },
  
  // Authorities constitution
  authorities: {
    totalAuthorityFiles: constitutionManifest.artifacts.filter(a => a.path.includes('authority')).length,
    authorityClusters: hygieneReport.findings.authorityClusters.length,
    canonicalImplementations: hygieneReport.findings.authorityClusters.reduce((sum, cluster) => sum + (cluster.canonical ? 1 : 0), 0),
    supportingImplementations: hygieneReport.findings.authorityClusters.reduce((sum, cluster) => sum + (cluster.supporting ? cluster.supporting.length : 0), 0),
    deprecatedImplementations: hygieneReport.findings.authorityClusters.reduce((sum, cluster) => sum + (cluster.deprecated ? cluster.deprecated.length : 0), 0),
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: 'Authority exports identified' },
      { level: 'L3', source: 'Hygiene Report', finding: 'Authority clusters analyzed' },
      { level: 'L4', source: 'Constitution Manifest', finding: 'Authority ownership recorded' }
    ]
  },
  
  // Canonical implementations
  canonicalImplementations: hygieneReport.findings.authorityClusters.map(cluster => ({
    clusterName: cluster.clusterName,
    canonical: cluster.canonical,
    evidenceChain: cluster.evidenceChain
  })),
  
  // Execution roots
  executionRoots: Object.keys(executionGraphs.graphs).map(graphType => ({
    graphName: executionGraphs.graphs[graphType].name,
    entrypoints: executionGraphs.graphs[graphType].entrypoints.length,
    reachableNodes: executionGraphs.graphs[graphType].reachableNodes.length,
    evidenceChain: executionGraphs.graphs[graphType].entrypoints.map(ep => ({
      level: 'L2',
      source: 'Runtime Metadata',
      finding: `${ep.type}: ${ep.command || ep.path || ep.name}`
    }))
  })),
  
  // Dependency roots
  dependencyRoots: {
    totalNodes: dependencyGraph.nodes.length,
    totalEdges: dependencyGraph.edges ? dependencyGraph.edges.length : 0,
    orphanNodes: hygieneReport.findings.orphanModules.length,
    evidenceChain: [
      { level: 'L1', source: 'Parser', finding: 'Dependency graph constructed' },
      { level: 'L3', source: 'Hygiene Report', finding: 'Orphan nodes identified' }
    ]
  },
  
  // Hygiene summary
  hygieneSummary: {
    authorityClusters: hygieneReport.findings.authorityClusters.length,
    duplicateRuntimes: hygieneReport.findings.duplicateRuntimes.length,
    duplicateBootstraps: hygieneReport.findings.duplicateBootstraps.length,
    orphanModules: hygieneReport.findings.orphanModules.length,
    oversizedModules: hygieneReport.findings.oversizedModules.length,
    deterministicViolations: hygieneReport.findings.deterministicViolations.length,
    evidenceChain: [
      { level: 'L3', source: 'Hygiene Report', finding: 'Repository hygiene analysis completed' }
    ]
  },
  
  // Constitutional fingerprint
  constitutionalFingerprint: {
    totalArtifacts: constitutionManifest.artifacts.length,
    unknownOwnership: constitutionManifest.artifacts.filter(a => a.owner === 'UNKNOWN').length,
    unknownLifecycle: constitutionManifest.artifacts.filter(a => a.lifecycle === 'UNKNOWN').length,
    evidenceChain: [
      { level: 'L4', source: 'Constitution Manifest', finding: 'Ownership and lifecycle status recorded' }
    ]
  },
  
  // Verification checksum
  verificationChecksum: computeHash({
    runtime: filesystemIndex.filter(f => f.RelativePath.includes('runtime')).length,
    gateway: filesystemIndex.filter(f => f.RelativePath.includes('gateway')).length,
    kernel: filesystemIndex.filter(f => f.RelativePath.includes('runtime/kernel') || f.RelativePath.includes('orchestration')).length,
    authorities: constitutionManifest.artifacts.filter(a => a.path.includes('authority')).length,
    executionGraphs: Object.keys(executionGraphs.graphs).length
  })
};

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\ArchitectureManifest.json', JSON.stringify(architectureManifest, null, 2));
console.log('Architecture manifest generated successfully.');
console.log(`Constitutional Fingerprint: ${architectureManifest.constitutionalFingerprint.totalArtifacts} artifacts`);
console.log(`Verification Checksum: ${architectureManifest.verificationChecksum}`);
console.log(`Evidence Hashes: ${Object.keys(architectureManifest.evidenceHashes).length} evidence sources hashed`);
