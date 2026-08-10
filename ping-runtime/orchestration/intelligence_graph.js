const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const GATEWAY = path.join(ROOT, 'gateway');
const RUNTIME = path.join(ROOT, 'runtime');

class IntelligenceGraph {
  constructor() {
    this._nodes = [];
    this._edges = [];
    this._authorities = [];
    this._entryPoints = [];
    this._summary = null;
  }

  async build() {
    console.log('[IntelligenceGraph] Scanning module graph...');
    this._scanDirectories();
    console.log('[IntelligenceGraph] Indexing authorities...');
    this._indexAuthorities();
    console.log('[IntelligenceGraph] Classifying modules...');
    this._classifyModules();
    console.log('[IntelligenceGraph] Computing scores...');
    this._computeScores();
    console.log('[IntelligenceGraph] Building dependency edges...');
    this._buildEdges();
    console.log('[IntelligenceGraph] Gathering git history...');
    this._gatherGitHistory();
    return this._produceGraph();
  }

  _scanDirectories() {
    this._scanEntryPoints();
    this._scanModuleGraph(GATEWAY, 'gateway');
    if (fs.existsSync(RUNTIME)) {
      this._scanModuleGraph(RUNTIME, 'runtime');
    }
    this._scanModuleGraph(ROOT + '/ping-runtime/orchestration', 'ping-runtime/orchestration');
  }

  _scanEntryPoints() {
    const serverPath = path.join(GATEWAY, 'server.js');
    if (fs.existsSync(serverPath)) {
      const content = fs.readFileSync(serverPath, 'utf8');
      const requireMatch = content.match(/require\(['"]([^'"]+)['"]\)/);
      this._entryPoints.push({
        file: 'server.js',
        requires: requireMatch ? requireMatch[1] : null,
        content
      });
    }

    const bootstrapDir = path.join(GATEWAY, 'bootstrap');
    if (fs.existsSync(bootstrapDir)) {
      const files = fs.readdirSync(bootstrapDir).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(bootstrapDir, file), 'utf8');
        const requires = [...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
        this._entryPoints.push({ file: `bootstrap/${file}`, requires, content });
      }
    }
  }

  _scanModuleGraph(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this._scanModuleGraph(fullPath, `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        const requires = [...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
        const localRequires = requires
          .filter(r => r.startsWith('.'))
          .map(r => {
            const resolved = path.resolve(dir, r);
            const resolvedPath = path.relative(ROOT, resolved).replace(/\\/g, '/');
            return resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js';
          });

        const exports = this._extractExports(content);

        this._nodes.push({
          path: `${prefix}/${entry.name}`,
          fullPath,
          dirPath: dir,
          lines: lines.length,
          content,
          requires: localRequires,
          allRequires: requires,
          exports,
          classification: 'unclassified',
          authority_owner: null,
          replay_visibility: 'none',
          constitutional_visibility: 'none',
          entropy_score: 0,
          serialization_score: 1,
          witness_score: 0,
          ownership: 'unowned',
          dependent_modules: [],
          git_commits: 0,
          git_churn: 0,
          constitutional_debt: false
        });
      }
    }
  }

  _extractExports(content) {
    const exports = [];
    const patterns = [
      ...content.matchAll(/module\.exports\s*=\s*\{?\s*(\w+)/g),
      ...content.matchAll(/module\.exports\s*=\s*(\w+)/g),
      ...content.matchAll(/exports\.(\w+)\s*=/g),
      ...content.matchAll(/class\s+(\w+)/g),
      ...content.matchAll(/function\s+(\w+)/g)
    ];
    const seen = new Set();
    for (const m of patterns) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        exports.push(m[1]);
      }
    }
    return exports;
  }

  _indexAuthorities() {
    const authorityKeywords = ['authority', 'Authority', 'runtime', 'Runtime', 'pipeline', 'Pipeline', 'adapter', 'Adapter'];
    for (const node of this._nodes) {
      const isAuthority = authorityKeywords.some(k => node.path.includes(k));
      if (isAuthority && node.classification !== 'dormant') {
        this._authorities.push({
          path: node.path,
          name: path.basename(node.path, '.js'),
          exports: node.exports,
          lines: node.lines,
          requires: node.requires
        });
        node.authority_owner = path.basename(node.path, '.js');
      }
    }
  }

  _classifyModules() {
    const pathToNode = new Map();
    for (const node of this._nodes) {
      pathToNode.set(node.fullPath, node);
      pathToNode.set(node.path, node);
    }

    const production = new Set();

    for (const ep of this._entryPoints) {
      if (ep.file === 'server.js') {
        const serverNode = pathToNode.get(path.join(GATEWAY, 'server.js'));
        if (serverNode) {
          production.add(serverNode.path);
          for (const req of serverNode.requires) {
            this._traceImports(req, pathToNode, production);
          }
        }
      }
      if (ep.file.startsWith('bootstrap/')) {
        for (const req of ep.requires) {
          const resolved = path.resolve(path.join(GATEWAY, 'bootstrap'), req);
          const relPath = path.relative(ROOT, resolved).replace(/\\/g, '/');
          const relPathJs = relPath.endsWith('.js') ? relPath : relPath + '.js';
          const node = pathToNode.get(resolved) || pathToNode.get(relPath) || pathToNode.get(relPathJs);
          if (node) {
            production.add(node.path);
            for (const r of node.requires) {
              this._traceImports(r, pathToNode, production);
            }
          }
        }
      }
    }

    for (const node of this._nodes) {
      if (production.has(node.path) || production.has(node.fullPath)) {
        node.classification = 'production';
      } else {
        node.classification = 'dormant';
        node.constitutional_debt = true;
      }
    }
  }

  _traceImports(filePath, pathToNode, visited) {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    const node = pathToNode.get(filePath);
    if (!node) return;
    for (const req of node.requires) {
      this._traceImports(req, pathToNode, visited);
    }
  }

  _computeScores() {
    for (const node of this._nodes) {
      const content = node.content;
      const lineCount = node.lines || 1;

      const datePatterns = (content.match(/Date\.now\(\)|new Date\(\)/g) || []).length;
      const randomPatterns = (content.match(/Math\.random\(\)|crypto\.randomUUID/g) || []).length;
      const hashPatterns = (content.match(/crypto\.createHash/g) || []).length;
      const subprocessPatterns = (content.match(/exec\(|execSync\(|spawn\(/g) || []).length;

      node.entropy_score = Math.min(1, (datePatterns + randomPatterns + hashPatterns + subprocessPatterns) / Math.max(1, lineCount / 10));

      const jsonClonePatterns = (content.match(/JSON\.parse\(JSON\.stringify/g) || []).length;
      const deepClonePatterns = (content.match(/structuredClone|deepClone|deepCopy/g) || []).length;
      node.serialization_score = Math.max(0, 1 - (jsonClonePatterns + deepClonePatterns) / Math.max(1, lineCount / 20));

      const witnessPatterns = (content.match(/witness|Witness/g) || []).length;
      const hashVerificationPatterns = (content.match(/verify|validate|check[HD]|integrity/g) || []).length;
      node.witness_score = Math.min(1, (witnessPatterns + hashVerificationPatterns) / Math.max(1, lineCount / 15));

      if (node.path.includes('replay') || node.path.includes('witness') || node.path.includes('certificate')) {
        node.replay_visibility = 'full';
      } else if (node.path.includes('event') || node.path.includes('authority') || node.path.includes('authorities')) {
        node.replay_visibility = 'event';
      } else if (node.path.includes('adapter') || node.path.includes('store') || node.path.includes('repository')) {
        node.replay_visibility = 'witness';
      }

      if (node.path.includes('constitutional') || node.path.includes('authority') || node.path.includes('runtime')) {
        node.constitutional_visibility = 'high';
      } else if (node.path.includes('adapter') || node.path.includes('gateway') || node.path.includes('worker')) {
        node.constitutional_visibility = 'medium';
      } else {
        node.constitutional_visibility = 'low';
      }

      if (node.ownership === 'unowned') {
        if (node.path.startsWith('gateway/authorities/') || node.path.startsWith('runtime/')) {
          node.ownership = 'constitutional-runtime';
        } else if (node.path.startsWith('gateway/bootstrap/')) {
          node.ownership = 'bootstrap';
        } else if (node.path.startsWith('gateway/routes/')) {
          node.ownership = 'routes';
        } else if (node.path.startsWith('ping-runtime/orchestration/')) {
          node.ownership = 'orchestration';
        } else {
          node.ownership = 'gateway';
        }
      }
    }
  }

  _buildEdges() {
    const pathToNode = new Map();
    for (const node of this._nodes) {
      pathToNode.set(node.fullPath, node);
      const reqKey = node.path;
      pathToNode.set(reqKey, node);
      const noPrefix = node.path.replace(/^(gateway|runtime|ping-runtime\/orchestration)\//, '');
      pathToNode.set(noPrefix, node);
    }

    for (const node of this._nodes) {
      for (const req of node.requires) {
        const target = pathToNode.get(req);
        if (target) {
          this._edges.push({
            from: node.path,
            to: target.path,
            type: 'import'
          });
          if (!target.dependent_modules.includes(node.path)) {
            target.dependent_modules.push(node.path);
          }
        }
      }
    }
  }

  _gatherGitHistory() {
    const index = new Map();
    for (const node of this._nodes) {
      const relPath = path.relative(ROOT, node.fullPath).replace(/\\/g, '/');
      index.set(relPath, node);
    }

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const recentCutoff = new Date(Date.now() - sevenDays).toISOString();
    const monthCutoff = new Date(Date.now() - thirtyDays).toISOString();

    try {
      const logOutput = execSync('git log --name-only --oneline --since="90 days ago" --format="%H %ct"', {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      }).trim();

      let currentCommit = null;
      let currentTime = 0;
      const fileCommits = {};
      const fileRecentChanges = {};

      for (const line of logOutput.split('\n')) {
        const commitMatch = line.match(/^([0-9a-f]+)\s+(\d+)$/);
        if (commitMatch) {
          currentCommit = commitMatch[1];
          currentTime = parseInt(commitMatch[2]) * 1000;
        } else if (line.trim() && currentCommit) {
          const fileName = line.trim().replace(/\\/g, '/');
          if (fileName.endsWith('.js') && !fileName.includes('node_modules')) {
            if (!fileCommits[fileName]) fileCommits[fileName] = new Set();
            fileCommits[fileName].add(currentCommit);
            if (currentTime > Date.now() - sevenDays) {
              if (!fileRecentChanges[fileName]) fileRecentChanges[fileName] = 0;
              fileRecentChanges[fileName]++;
            }
          }
        }
      }

      for (const [relPath, node] of index) {
        if (fileCommits[relPath]) {
          node.git_commits = fileCommits[relPath].size;
        }
        node.git_churn = fileRecentChanges[relPath] || 0;
      }
    } catch (err) {
      console.log('[IntelligenceGraph] Git history unavailable:', err.message);
    }
  }

  _produceGraph() {
    const productionNodes = this._nodes.filter(n => n.classification === 'production');
    const dormantNodes = this._nodes.filter(n => n.classification === 'dormant');
    const productionEdges = this._edges.filter(e =>
      productionNodes.some(n => n.path === e.from)
    );

    this._summary = {
      total_nodes: this._nodes.length,
      production: productionNodes.length,
      dormant: dormantNodes.length,
      authorities: this._authorities.length,
      entry_points: this._entryPoints.length,
      edges: this._edges.length,
      production_edges: productionEdges.length,
      total_lines: this._nodes.reduce((s, n) => s + n.lines, 0),
      production_lines: productionNodes.reduce((s, n) => s + n.lines, 0),
      dormant_lines: dormantNodes.reduce((s, n) => s + n.lines, 0)
    };

    return {
      generated_at: new Date().toISOString(),
      version: '2.0.0',
      summary: this._summary,
      entry_points: this._entryPoints.map(e => ({ file: e.file })),
      authorities: this._authorities.map(a => ({
        path: a.path,
        name: a.name,
        exports: a.exports,
        lines: a.lines
      })),
      nodes: this._nodes.map(n => this._sanitizeNode(n)),
      edges: this._edges,
      metadata: {
        ownership_distribution: this._computeOwnershipDistribution(),
        entropy_distribution: this._computeEntropyDistribution(),
        replay_coverage: this._computeReplayCoverage(),
        witness_coverage: this._computeWitnessCoverage(),
        constitutional_debt: this._computeDebtSummary()
      }
    };
  }

  _sanitizeNode(node) {
    return {
      path: node.path,
      lines: node.lines,
      requires: node.requires,
      exports: node.exports,
      classification: node.classification,
      authority_owner: node.authority_owner,
      replay_visibility: node.replay_visibility,
      constitutional_visibility: node.constitutional_visibility,
      entropy_score: node.entropy_score,
      serialization_score: node.serialization_score,
      witness_score: node.witness_score,
      ownership: node.ownership,
      dependent_modules: node.dependent_modules,
      git_commits: node.git_commits,
      git_churn: node.git_churn,
      constitutional_debt: node.constitutional_debt
    };
  }

  _computeOwnershipDistribution() {
    const dist = {};
    for (const node of this._nodes) {
      const key = node.ownership || 'unowned';
      if (!dist[key]) dist[key] = { files: 0, lines: 0 };
      dist[key].files++;
      dist[key].lines += node.lines;
    }
    return dist;
  }

  _computeEntropyDistribution() {
    const bins = { low: 0, medium: 0, high: 0 };
    for (const node of this._nodes) {
      if (node.classification !== 'production') continue;
      if (node.entropy_score < 0.1) bins.low++;
      else if (node.entropy_score < 0.3) bins.medium++;
      else bins.high++;
    }
    return bins;
  }

  _computeReplayCoverage() {
    return {
      full: this._nodes.filter(n => n.replay_visibility === 'full').length,
      event: this._nodes.filter(n => n.replay_visibility === 'event').length,
      witness: this._nodes.filter(n => n.replay_visibility === 'witness').length,
      none: this._nodes.filter(n => n.replay_visibility === 'none').length
    };
  }

  _computeWitnessCoverage() {
    const prod = this._nodes.filter(n => n.classification === 'production');
    const witnessed = prod.filter(n => n.witness_score > 0.5);
    return {
      witnessed: witnessed.length,
      total_production: prod.length,
      coverage_pct: prod.length ? Math.round(witnessed.length / prod.length * 100) : 0
    };
  }

  _computeDebtSummary() {
    const dormant = this._nodes.filter(n => n.classification === 'dormant');
    return {
      total_files: dormant.length,
      total_lines: dormant.reduce((s, n) => s + n.lines, 0),
      by_ownership: this._groupBy(dormant, 'ownership'),
      high_entropy: dormant.filter(n => n.entropy_score > 0.3).length,
      with_dependents: dormant.filter(n => n.dependent_modules.length > 0).length
    };
  }

  _groupBy(items, key) {
    const result = {};
    for (const item of items) {
      const k = item[key] || 'unknown';
      if (!result[k]) result[k] = 0;
      result[k]++;
    }
    return result;
  }

  getNode(path) {
    return this._nodes.find(n => n.path === path || n.fullPath === path);
  }

  getProductionNodes() {
    return this._nodes.filter(n => n.classification === 'production');
  }

  getDormantNodes() {
    return this._nodes.filter(n => n.classification === 'dormant');
  }

  getAuthorities() {
    return this._authorities;
  }
}

async function main() {
  const graph = new IntelligenceGraph();
  const intelligence = await graph.build();
  const outputPath = path.join(__dirname, 'intelligence_graph.json');
  fs.writeFileSync(outputPath, JSON.stringify(intelligence, null, 2));
  console.log(`Intelligence graph written to ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total nodes:      ${intelligence.summary.total_nodes}`);
  console.log(`  Production:       ${intelligence.summary.production}`);
  console.log(`  Dormant:          ${intelligence.summary.dormant}`);
  console.log(`  Authorities:      ${intelligence.summary.authorities}`);
  console.log(`  Edges:            ${intelligence.summary.edges}`);
  console.log(`  Total lines:      ${intelligence.summary.total_lines}`);
  console.log(`\nMetadata:`);
  console.log(`  Replay coverage:  ${JSON.stringify(intelligence.metadata.replay_coverage)}`);
  console.log(`  Witness coverage: ${intelligence.metadata.witness_coverage.coverage_pct}% of production`);
  console.log(`  Constitutional debt: ${intelligence.metadata.constitutional_debt.total_files} files`);
  console.log(`  Entropy (prod):   ${JSON.stringify(intelligence.metadata.entropy_distribution)}`);
  console.log(`\nOwnership distribution:`);
  for (const [owner, stats] of Object.entries(intelligence.metadata.ownership_distribution)) {
    console.log(`  ${owner}: ${stats.files} files, ${stats.lines} lines`);
  }
}

if (require.main === module) {
  main().catch(err => { console.error('Intelligence graph build failed:', err); process.exit(1); });
}

module.exports = { IntelligenceGraph };
