const fs = require('fs');
const path = require('path');

const filesystemIndex = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8').replace(/^\uFEFF/, ''));

const dependencyGraph = JSON.parse(fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', 'utf8').replace(/^\uFEFF/, ''));

// Separate constitutional execution graphs
const executionGraphs = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  evidenceLevel: 'L2 - Runtime Metadata',
  graphs: {
    gatewayHTTP: { name: 'Gateway HTTP Graph', entrypoints: [], reachableNodes: [] },
    gatewayCLI: { name: 'Gateway CLI Graph', entrypoints: [], reachableNodes: [] },
    kernel: { name: 'Kernel Graph', entrypoints: [], reachableNodes: [] },
    replay: { name: 'Replay Graph', entrypoints: [], reachableNodes: [] },
    witness: { name: 'Witness Graph', entrypoints: [], reachableNodes: [] },
    commit: { name: 'Commit Graph', entrypoints: [], reachableNodes: [] },
    worker: { name: 'Worker Graph', entrypoints: [], reachableNodes: [] },
    migration: { name: 'Migration Graph', entrypoints: [], reachableNodes: [] },
    knowledgeCompiler: { name: 'Knowledge Compiler Graph', entrypoints: [], reachableNodes: [] },
    build: { name: 'Build Graph', entrypoints: [], reachableNodes: [] },
    test: { name: 'Test Graph', entrypoints: [], reachableNodes: [] }
  }
};

// Helper function to categorize entrypoint into graph type
function categorizeEntrypoint(entrypoint, pkgPath) {
  const script = entrypoint.command || entrypoint.path || '';
  
  // Gateway HTTP: HTTP server entrypoints
  if (script.includes('http') || script.includes('server') || script.includes('listen') || entrypoint.type === 'main') {
    if (pkgPath.includes('gateway')) {
      return 'gatewayHTTP';
    }
  }
  
  // Gateway CLI: CLI entrypoints
  if (entrypoint.type === 'bin' || script.includes('cli') || script.includes('command')) {
    if (pkgPath.includes('gateway')) {
      return 'gatewayCLI';
    }
  }
  
  // Kernel: Core execution engine
  if (pkgPath.includes('runtime/kernel') || script.includes('kernel') || script.includes('engine')) {
    return 'kernel';
  }
  
  // Replay: Replay-specific entrypoints
  if (pkgPath.includes('runtime/replay') || script.includes('replay')) {
    return 'replay';
  }
  
  // Witness: Witness-specific entrypoints
  if (script.includes('witness')) {
    return 'witness';
  }
  
  // Commit: Commit service entrypoints
  if (pkgPath.includes('commit-service') || script.includes('commit')) {
    return 'commit';
  }
  
  // Worker: Worker-related entrypoints
  if (script.includes('worker') || script.includes('port')) {
    return 'worker';
  }
  
  // Migration: Database/schema migrations
  if (script.includes('migrate') || script.includes('migration')) {
    return 'migration';
  }
  
  // Knowledge Compiler: Knowledge compilation
  if (script.includes('knowledge') || script.includes('compiler')) {
    return 'knowledgeCompiler';
  }
  
  // Build: Build scripts
  if (entrypoint.name === 'build' || script.includes('build') || script.includes('compile')) {
    return 'build';
  }
  
  // Test: Test scripts
  if (entrypoint.name === 'test' || script.includes('test') || script.includes('spec')) {
    return 'test';
  }
  
  // Default to kernel for unknown entrypoints in runtime
  if (pkgPath.includes('runtime')) {
    return 'kernel';
  }
  
  // Default to gateway HTTP for unknown entrypoints in gateway
  if (pkgPath.includes('gateway')) {
    return 'gatewayHTTP';
  }
  
  return 'kernel'; // Default fallback
}

// Identify package.json files
const packageJsonFiles = filesystemIndex.filter(f => f.RelativePath === 'package.json' || f.RelativePath.endsWith('/package.json'));

packageJsonFiles.forEach(pkgFile => {
  try {
    const pkgContent = fs.readFileSync(pkgFile.AbsolutePath, 'utf8');
    const pkg = JSON.parse(pkgContent);
    
    // Identify entrypoints from scripts
    if (pkg.scripts) {
      Object.keys(pkg.scripts).forEach(scriptName => {
        const script = pkg.scripts[scriptName];
        const entrypoint = {
          type: 'script',
          name: scriptName,
          command: script,
          source: pkgFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, pkgFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      });
    }
    
    // Identify main entrypoint
    if (pkg.main) {
      const entrypoint = {
        type: 'main',
        path: pkg.main,
        source: pkgFile.RelativePath
      };
      
      const graphType = categorizeEntrypoint(entrypoint, pkgFile.RelativePath);
      executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
    }
    
    // Identify bin entrypoints
    if (pkg.bin) {
      if (typeof pkg.bin === 'string') {
        const entrypoint = {
          type: 'bin',
          path: pkg.bin,
          source: pkgFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, pkgFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      } else if (typeof pkg.bin === 'object') {
        Object.keys(pkg.bin).forEach(name => {
          const entrypoint = {
            type: 'bin',
            name: name,
            path: pkg.bin[name],
            source: pkgFile.RelativePath
          };
          
          const graphType = categorizeEntrypoint(entrypoint, pkgFile.RelativePath);
          executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
        });
      }
    }
  } catch (error) {
    // Skip files that can't be parsed
  }
});

// Identify pnpm-workspace.yaml files (metadata only, not an execution graph)
const workspaceFiles = filesystemIndex.filter(f => f.RelativePath === 'pnpm-workspace.yaml' || f.RelativePath === 'pnpm-workspace.yml');

workspaceFiles.forEach(wsFile => {
  try {
    const wsContent = fs.readFileSync(wsFile.AbsolutePath, 'utf8');
    
    // Parse workspace packages for metadata
    const lines = wsContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*-\s*['"](.+)['"]/);
      if (match) {
        // Workspace packages are metadata, not execution entrypoints
      }
    });
  } catch (error) {
    // Skip files that can't be parsed
  }
});

// Identify Dockerfiles
const dockerfileFiles = filesystemIndex.filter(f => f.RelativePath === 'Dockerfile' || f.RelativePath.endsWith('/Dockerfile'));

dockerfileFiles.forEach(dockerFile => {
  try {
    const dockerContent = fs.readFileSync(dockerFile.AbsolutePath, 'utf8');
    
    // Parse Docker commands
    const lines = dockerContent.split('\n');
    lines.forEach(line => {
      const cmdMatch = line.match(/^CMD\s+(.+)/);
      const entrypointMatch = line.match(/^ENTRYPOINT\s+(.+)/);
      const nodeMatch = line.match(/^node\s+(.+)/);
      
      if (cmdMatch) {
        const entrypoint = {
          type: 'CMD',
          command: cmdMatch[1],
          source: dockerFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, dockerFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      }
      
      if (entrypointMatch) {
        const entrypoint = {
          type: 'ENTRYPOINT',
          command: entrypointMatch[1],
          source: dockerFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, dockerFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      }
      
      if (nodeMatch) {
        const entrypoint = {
          type: 'node',
          command: nodeMatch[1],
          source: dockerFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, dockerFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      }
    });
  } catch (error) {
    // Skip files that can't be parsed
  }
});

// Identify docker-compose files
const composeFiles = filesystemIndex.filter(f => f.RelativePath.startsWith('compose.') || f.RelativePath.endsWith('/compose.yaml') || f.RelativePath.endsWith('/docker-compose.yml'));

composeFiles.forEach(composeFile => {
  try {
    const composeContent = fs.readFileSync(composeFile.AbsolutePath, 'utf8');
    
    // Parse services
    const lines = composeContent.split('\n');
    let currentService = null;
    
    lines.forEach(line => {
      const serviceMatch = line.match(/^\s*(\w+):/);
      const commandMatch = line.match(/^\s*command:\s*(.+)/);
      
      if (serviceMatch) {
        currentService = serviceMatch[1];
      }
      
      if (commandMatch && currentService) {
        const entrypoint = {
          type: 'service',
          service: currentService,
          command: commandMatch[1],
          source: composeFile.RelativePath
        };
        
        const graphType = categorizeEntrypoint(entrypoint, composeFile.RelativePath);
        executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
      }
    });
  } catch (error) {
    // Skip files that can't be parsed
  }
});

// Identify shell scripts
const shellFiles = filesystemIndex.filter(f => f.Extension === '.sh');

shellFiles.forEach(shellFile => {
  const entrypoint = {
    type: 'shell-script',
    path: shellFile.RelativePath,
    source: shellFile.RelativePath
  };
  
  const graphType = categorizeEntrypoint(entrypoint, shellFile.RelativePath);
  executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
});

// Identify PowerShell scripts
const psFiles = filesystemIndex.filter(f => f.Extension === '.ps1');

psFiles.forEach(psFile => {
  const entrypoint = {
    type: 'powershell-script',
    path: psFile.RelativePath,
    source: psFile.RelativePath
  };
  
  const graphType = categorizeEntrypoint(entrypoint, psFile.RelativePath);
  executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
});

// Identify Python entrypoints
const pyFiles = filesystemIndex.filter(f => f.Extension === '.py' && (f.RelativePath.includes('main') || f.RelativePath.includes('__main__') || f.RelativePath.includes('run')));

pyFiles.forEach(pyFile => {
  const entrypoint = {
    type: 'python-entrypoint',
    path: pyFile.RelativePath,
    source: pyFile.RelativePath
  };
  
  const graphType = categorizeEntrypoint(entrypoint, pyFile.RelativePath);
  executionGraphs.graphs[graphType].entrypoints.push(entrypoint);
});

// Build reachable nodes for each graph using dependency graph and directory structure
function buildReachability(graphType) {
  const graph = executionGraphs.graphs[graphType];
  const reachable = new Set();
  const visited = new Set();
  
  // Directory-based categorization for kernel files
  const graphDirectories = {
    gatewayHTTP: ['gateway'],
    gatewayCLI: ['gateway'],
    kernel: ['runtime/kernel', 'runtime/replay', 'runtime/commit-service', 'orchestration'],
    replay: ['runtime/replay'],
    witness: ['orchestration/execution/witness'],
    commit: ['runtime/commit-service'],
    worker: ['runtime/workers', 'orchestration/execution/worker_port'],
    migration: [],
    knowledgeCompiler: ['orchestration/knowledge_compiler'],
    build: [],
    test: []
  };
  
  // Add all files in graph directories as initially reachable
  const dirs = graphDirectories[graphType] || [];
  dirs.forEach(dir => {
    const normalizedDir = dir.replace(/\\/g, '/');
    filesystemIndex.forEach(f => {
      const normalizedPath = f.RelativePath.replace(/\\/g, '/');
      if (normalizedPath.startsWith(normalizedDir + '/') || normalizedPath === normalizedDir) {
        reachable.add(f.RelativePath);
      }
    });
  });
  
  // Now use dependency graph for transitive reachability from JS entrypoints
  const queue = [...graph.entrypoints];
  
  while (queue.length > 0) {
    const entrypoint = queue.shift();
    
    // Resolve entrypoint to actual file path using filesystem index
    let filePath = null;
    if (entrypoint.path) {
      // Try to find the file in filesystem index
      const normalizedEntrypoint = entrypoint.path.replace(/\\/g, '/');
      const fsFile = filesystemIndex.find(f => 
        f.RelativePath.replace(/\\/g, '/') === normalizedEntrypoint ||
        f.RelativePath.replace(/\\/g, '/').endsWith(normalizedEntrypoint)
      );
      
      if (fsFile) {
        filePath = fsFile.AbsolutePath;
      }
    } else if (entrypoint.command) {
      // Extract file path from command
      const match = entrypoint.command.match(/(\S+\.js|\S+\.py|\S+\.sh)/);
      if (match) {
        const cmdPath = match[1];
        // Try to find in filesystem index
        const fsFile = filesystemIndex.find(f => 
          f.RelativePath.replace(/\\/g, '/') === cmdPath.replace(/\\/g, '/') ||
          f.RelativePath.replace(/\\/g, '/').endsWith(cmdPath.replace(/\\/g, '/'))
        );
        
        if (fsFile) {
          filePath = fsFile.AbsolutePath;
        }
      }
    }
    
    if (!filePath) continue;
    
    // Find corresponding node in dependency graph (only for JS files)
    const depNode = dependencyGraph.nodes.find(n => 
      n.absolutePath === filePath ||
      n.path === filePath ||
      n.absolutePath.replace(/\\/g, '/') === filePath.replace(/\\/g, '/') ||
      n.path.replace(/\\/g, '/') === filePath.replace(/\\/g, '/')
    );
    
    if (depNode && !visited.has(depNode.path)) {
      visited.add(depNode.path);
      reachable.add(depNode.path);
      
      // Add imports to queue
      if (depNode.imports) {
        depNode.imports.forEach(imp => {
          // Skip node modules and built-ins
          if (!imp.startsWith('.') && !imp.startsWith('/')) return;
          
          // Resolve relative import
          if (imp.startsWith('.')) {
            const importDir = path.dirname(depNode.path);
            const resolvedPath = path.resolve(importDir, imp);
            
            // Find matching file in filesystem index first
            const normalizedResolved = resolvedPath.replace(/\\/g, '/');
            const fsFile = filesystemIndex.find(f => 
              f.AbsolutePath.replace(/\\/g, '/') === normalizedResolved ||
              f.AbsolutePath.replace(/\\/g, '/').startsWith(normalizedResolved)
            );
            
            if (fsFile) {
              // Now find in dependency graph
              const matchingNode = dependencyGraph.nodes.find(n => 
                n.absolutePath === fsFile.AbsolutePath ||
                n.path === fsFile.AbsolutePath
              );
              
              if (matchingNode && !visited.has(matchingNode.path)) {
                queue.push({ path: matchingNode.path, source: depNode.path });
              }
            }
          }
        });
      }
    }
  }
  
  graph.reachableNodes = Array.from(reachable);
}

// Build reachability for each graph
Object.keys(executionGraphs.graphs).forEach(graphType => {
  buildReachability(graphType);
});

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_ExecutionGraphs.json', JSON.stringify(executionGraphs, null, 2));
console.log(`Execution graphs generated successfully.`);
Object.keys(executionGraphs.graphs).forEach(graphType => {
  const graph = executionGraphs.graphs[graphType];
  console.log(`  ${graph.name}: ${graph.entrypoints.length} entrypoints, ${graph.reachableNodes.length} reachable nodes`);
});
