const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GATEWAY = path.join(ROOT, 'gateway');
const RUNTIME = path.join(ROOT, 'runtime');

class KnowledgeCompiler {
  constructor() {
    this._moduleGraph = [];
    this._authorities = [];
    this._runtimes = [];
    this._entryPoints = [];
    this._dormant = [];
    this._violations = {};
  }

  async compile() {
    this._scanEntryPoints();
    this._scanModuleGraph(GATEWAY, 'gateway');
    if (fs.existsSync(RUNTIME)) {
      this._scanModuleGraph(RUNTIME, 'runtime');
    }
    this._indexAuthorities();
    this._classifyModules();
    return this._produceReport();
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
        const requires = [...content.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
        const lines = content.split('\n').length;

        const localRequires = requires
          .filter(r => r.startsWith('.'))
          .map(r => {
            const resolved = path.resolve(dir, r);
            const resolvedPath = path.relative(ROOT, resolved).replace(/\\/g, '/');
            return resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js';
          });

        this._moduleGraph.push({
          path: `${prefix}/${entry.name}`,
          fullPath,
          dirPath: dir,
          requires: localRequires,
          allRequires: requires,
          lines,
          content
        });
      }
    }
  }

  _indexAuthorities() {
    const authorityKeywords = ['authority', 'Authority', 'runtime', 'Runtime', 'pipeline', 'Pipeline'];
    for (const mod of this._moduleGraph) {
      const isAuthority = authorityKeywords.some(k => mod.path.includes(k));
      if (isAuthority) {
        const exports = [...mod.content.matchAll(/module\.exports\s*=\s*\{?\s*(\w+)/g)].map(m => m[1]);
        this._authorities.push({
          path: mod.path,
          name: path.basename(mod.path, '.js'),
          exports,
          lines: mod.lines,
          requires: mod.requires
        });
      }
    }
  }

  _classifyModules() {
    const pathToMod = new Map();
    for (const mod of this._moduleGraph) {
      pathToMod.set(mod.fullPath, mod);
      pathToMod.set(mod.path, mod);
    }

    const reachable = new Set();

    for (const ep of this._entryPoints) {
      if (ep.file === 'server.js') {
        const serverMod = pathToMod.get(path.join(GATEWAY, 'server.js'));
        if (serverMod) {
          reachable.add(serverMod.path);
          for (const req of serverMod.requires) {
            this._traceImports(req, pathToMod, reachable);
          }
        }
      }
    }

    for (const mod of this._moduleGraph) {
      if (reachable.has(mod.path) || reachable.has(mod.fullPath)) {
        this._runtimes.push({ ...mod, classification: 'production' });
      } else {
        this._dormant.push({ ...mod, classification: 'dormant' });
      }
    }
  }

  _traceImports(filePath, pathToMod, visited) {
    if (visited.has(filePath)) return;
    visited.add(filePath);

    const mod = pathToMod.get(filePath);
    if (!mod) return;

    for (const req of mod.requires) {
      this._traceImports(req, pathToMod, visited);
    }
  }

  _produceReport() {
    const productionFiles = this._runtimes.map(m => ({ path: m.path, lines: m.lines, classification: 'production' }));
    const dormantFiles = this._dormant.map(m => ({ path: m.path, lines: m.lines, classification: 'dormant' }));

    const violations = {
      time: this._findPattern(this._runtimes, /Date\.now\(\)|new Date\(\)\.toISOString/g, ['runtime_clock']),
      identity: this._findPattern(this._runtimes, /crypto\.randomUUID|Math\.random\(\)|uuidv4/g),
      hash: this._findPattern(this._runtimes, /crypto\.createHash/g, ['canonical_authority']),
      serialization: this._findPattern(this._runtimes, /JSON\.parse\(JSON\.stringify/g)
    };

    return {
      version: '1.0.0',
      summary: {
        total_modules: this._moduleGraph.length,
        production: this._runtimes.length,
        dormant: this._dormant.length,
        authorities: this._authorities.length,
        entry_points: this._entryPoints.length
      },
      entry_points: this._entryPoints.map(e => ({ file: e.file })),
      authorities: this._authorities.map(a => ({ path: a.path, exports: a.exports, lines: a.lines })),
      production_modules: productionFiles,
      dormant_modules: dormantFiles,
      violations: violations
    };
  }

  _findPattern(modules, pattern, excludeFiles = []) {
    const results = [];
    for (const mod of modules) {
      const basename = path.basename(mod.path, '.js');
      if (excludeFiles.includes(basename)) continue;
      const matches = [...mod.content.matchAll(pattern)];
      if (matches.length > 0) {
        results.push({
          file: mod.path,
          count: matches.length,
          lines: matches.map(m => {
            const content = mod.content;
            const idx = content.indexOf(m[0]);
            const lineNum = content.substring(0, idx).split('\n').length;
            return lineNum;
          })
        });
      }
    }
    return results;
  }
}

async function main() {
  const compiler = new KnowledgeCompiler();
  const report = await compiler.compile();

  const outputPath = path.join(__dirname, 'knowledge_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Knowledge report written to ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total modules scanned: ${report.summary.total_modules}`);
  console.log(`  Production modules:    ${report.summary.production}`);
  console.log(`  Dormant modules:       ${report.summary.dormant}`);
  console.log(`  Authorities indexed:   ${report.summary.authorities}`);
  console.log(`  Entry points:          ${report.summary.entry_points}`);
  console.log(`\nViolations (production path only):`);
  for (const [type, files] of Object.entries(report.violations)) {
    if (files.length > 0) {
      console.log(`  ${type}: ${files.length} files — ${files.map(f => `${f.file}(${f.count}x)`).join(', ')}`);
    } else {
      console.log(`  ${type}: CLEAN`);
    }
  }
}

if (require.main === module) {
  main().catch(err => { console.error('Knowledge compiler failed:', err); process.exit(1); });
}

module.exports = { KnowledgeCompiler };
