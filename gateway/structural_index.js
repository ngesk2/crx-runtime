/**
 * Structural Index Adapter
 * 
 * Priority 4: codebase-memory-mcp as primary structural index
 * 
 * Order:
 * Snapshot → Structural Index → Canonical IR → Knowledge Objects → Embeddings
 * 
 * Constitutional Constraint: Embeddings must never be generated from raw files.
 * Only Constitutional Objects.
 */

const { identityAuthority } = require('./identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class StructuralIndexAdapter {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._index = new Map(); // In-memory structural index
  }

  async indexSnapshot(snapshot, lifecycleId) {
    // Build structural index from GitHub snapshot
    const index = {
      id: identityAuthority.generateId('structural_index', { type: 'structural_index' }),
      lifecycle_id: lifecycleId,
      repository: this._indexRepository(snapshot.repo),
      files: this._indexFiles(snapshot),
      structure: this._indexStructure(snapshot),
      dependencies: this._indexDependencies(snapshot),
      metadata: {
        indexed_at: constitutionalTimeAuthority.now(),
        source: 'github',
        snapshot_hash: this._computeSnapshotHash(snapshot),
      },
    };

    // Persist to storage
    await this._persistIndex(index);

    // Update in-memory cache
    this._index.set(index.id, index);

    return index;
  }

  _indexRepository(repo) {
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      language: repo.language,
      default_branch: repo.default_branch,
      structure: {
        root: '/',
        branches: [],
        tags: [],
      },
    };
  }

  _indexFiles(snapshot) {
    // Extract file information from commit trees
    const files = [];
    
    if (snapshot.commitDetails) {
      for (const commitDetail of snapshot.commitDetails) {
        if (commitDetail.tree) {
          for (const treeItem of commitDetail.tree) {
            if (treeItem.type === 'blob') {
              files.push({
                path: treeItem.path,
                sha: treeItem.sha,
                size: treeItem.size || 0,
                commit_sha: commitDetail.sha,
                language: this._detectLanguage(treeItem.path),
              });
            }
          }
        }
      }
    }

    return files;
  }

  _indexStructure(snapshot) {
    // Build hierarchical structure
    const structure = {
      directories: new Map(),
      files: new Map(),
    };

    const files = this._indexFiles(snapshot);
    
    for (const file of files) {
      const pathParts = file.path.split('/');
      let currentDir = structure.directories;

      // Build directory hierarchy
      for (let i = 0; i < pathParts.length - 1; i++) {
        const dirName = pathParts[i];
        if (!currentDir.has(dirName)) {
          currentDir.set(dirName, {
            name: dirName,
            path: pathParts.slice(0, i + 1).join('/'),
            files: [],
            subdirectories: new Map(),
          });
        }
        currentDir = currentDir.get(dirName).subdirectories;
      }

      // Add file to parent directory
      const fileName = pathParts[pathParts.length - 1];
      structure.files.set(file.path, file);
    }

    return structure;
  }

  _indexDependencies(snapshot) {
    // Extract dependency information from files
    const dependencies = {
      imports: [],
      exports: [],
      requires: [],
    };

    // This would be enhanced with actual parsing
    // For now, placeholder structure
    return dependencies;
  }

  _detectLanguage(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shell',
      'md': 'markdown',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
    };

    return languageMap[ext] || 'unknown';
  }

  _computeSnapshotHash(snapshot) {
    const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
    const canonical = CanonicalBytes.serialize({
      repo: snapshot.repo?.full_name,
      commits: snapshot.commits?.map(c => c.sha),
    });
    return CanonicalAuthority.hash(canonical);
  }

  async _persistIndex(index) {
    const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
    await this._postgres.query(`
      INSERT INTO structural_indices (id, lifecycle_id, repository, files, structure, dependencies, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET files = $4, structure = $5, dependencies = $6, metadata = $7
    `, [
      index.id,
      index.lifecycle_id,
      CanonicalBytes.serialize(index.repository),
      CanonicalBytes.serialize(index.files),
      CanonicalBytes.serialize(index.structure),
      CanonicalBytes.serialize(index.dependencies),
      CanonicalBytes.serialize(index.metadata),
    ]);
  }

  async getIndex(indexId) {
    const cached = this._index.get(indexId);
    if (cached) return cached;

    const result = await this._postgres.query(`
      SELECT repository, files, structure, dependencies, metadata
      FROM structural_indices
      WHERE id = $1
      LIMIT 1
    `, [indexId]);

    if (result.rows.length === 0) return null;

    return {
      id: indexId,
      repository: result.rows[0].repository,
      files: result.rows[0].files,
      structure: result.rows[0].structure,
      dependencies: result.rows[0].dependencies,
      metadata: result.rows[0].metadata,
    };
  }

  async getIndexByLifecycle(lifecycleId) {
    const result = await this._postgres.query(`
      SELECT id, repository, files, structure, dependencies, metadata
      FROM structural_indices
      WHERE lifecycle_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [lifecycleId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      repository: row.repository,
      files: row.files,
      structure: row.structure,
      dependencies: row.dependencies,
      metadata: row.metadata,
    };
  }

  async searchFiles(query, indexId) {
    const index = await this.getIndex(indexId);
    if (!index) return [];

    const results = index.files.filter(file => 
      file.path.toLowerCase().includes(query.toLowerCase()) ||
      file.language.toLowerCase().includes(query.toLowerCase())
    );

    return results;
  }

  async getFileStructure(indexId, path = '/') {
    const index = await this.getIndex(indexId);
    if (!index) return null;

    // Navigate to path in structure
    const pathParts = path.split('/').filter(p => p);
    let current = index.structure.directories;

    for (const part of pathParts) {
      if (current.has(part)) {
        current = current.get(part).subdirectories;
      } else {
        return null;
      }
    }

    return current;
  }

  async getStatistics(indexId) {
    const index = await this.getIndex(indexId);
    if (!index) return null;

    const files = index.files || [];
    const languageStats = {};

    for (const file of files) {
      const lang = file.language || 'unknown';
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    }

    return {
      total_files: files.length,
      total_size: files.reduce((sum, f) => sum + (f.size || 0), 0),
      languages: languageStats,
      directories: this._countDirectories(index.structure),
    };
  }

  _countDirectories(structure) {
    let count = 0;
    const traverse = (map) => {
      for (const [name, dir] of map) {
        count++;
        if (dir.subdirectories) {
          traverse(dir.subdirectories);
        }
      }
    };
    traverse(structure.directories);
    return count;
  }
}

module.exports = { StructuralIndexAdapter };
