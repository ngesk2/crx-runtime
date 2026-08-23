const fs = require('fs');
const path = require('path');

const filesystemContent = fs.readFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_Filesystem.json', 'utf8');
const filesystemIndex = JSON.parse(filesystemContent.replace(/^\uFEFF/, ''));

const dependencyGraph = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  evidenceLevel: 'L1 - Parser',
  totalFiles: filesystemIndex.length,
  nodes: [],
  edges: []
};

const jsFiles = filesystemIndex.filter(f => f.Language === 'JavaScript' || f.Extension === '.js');

console.log(`Processing ${jsFiles.length} JavaScript files...`);

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file.AbsolutePath, 'utf8');
    const imports = extractImports(content);
    const exports = extractExports(content);
    
    const node = {
      path: file.RelativePath,
      absolutePath: file.AbsolutePath,
      language: file.Language,
      imports: imports,
      exports: exports,
      importedBy: [],
      reachable: false
    };
    
    dependencyGraph.nodes.push(node);
    
    imports.forEach(imp => {
      dependencyGraph.edges.push({
        from: file.RelativePath,
        to: imp,
        type: 'import'
      });
    });
  } catch (error) {
    // Skip files that can't be read or parsed
  }
});

// Build reverse references (importedBy)
dependencyGraph.nodes.forEach(node => {
  node.importedBy = dependencyGraph.edges
    .filter(edge => edge.to === node.path)
    .map(edge => edge.from);
});

fs.writeFileSync('c:\\Users\\nolan\\PING\\orchestration\\RepositoryKnowledgeIndex_DependencyGraph.json', JSON.stringify(dependencyGraph, null, 2));
console.log('Dependency graph generated successfully.');

function extractImports(content) {
  const imports = [];
  const patterns = [
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g,
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  });
  
  return imports;
}

function extractExports(content) {
  const exports = [];
  const patterns = [
    /module\.exports\s*=\s*(.+)/g,
    /exports\.(\w+)\s*=/g,
    /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g,
    /export\s*\{([^}]+)\}/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      exports.push(match[1] || match[0]);
    }
  });
  
  return exports;
}
