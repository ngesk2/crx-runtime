/**
 * Filesystem Authority
 * 
 * Ω.65 — Filesystem Authority
 * 
 * Compiles File constitutional objects from repository path.
 * 
 * Constitutional Constraint: Filesystem Authority owns File object creation.
 * Pipeline only coordinates authorities.
 */

const fs = require('fs').promises;
const path = require('path');
const { CanonicalAuthority } = require('./canonical_authority');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class FilesystemAuthority {
  constructor(postgresPool, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._fileCache = new Map(); // repo_id → file objects
    this._initialized = false;
  }

  /**
   * Initialize filesystem authority
   */
  async initialize() {
    await this._loadFileCache();
    this._initialized = true;
    console.log('[FilesystemAuthority] Initialized');
  }

  /**
   * Compile File constitutional objects from repository path
   * 
   * @param {string} repoId - Repository identifier
   * @param {string} repositoryPath - Path to repository
   * @returns {Array} Array of wrapped file objects (constitutional + envelope)
   */
  async compile(repoId, repositoryPath) {
    console.log(`[FilesystemAuthority] Compiling files for repository: ${repoId}`);

    const wrappedFiles = [];

    try {
      // Scan repository recursively
      const filePaths = await this._scanRepository(repositoryPath);

      // Create File constitutional objects
      for (const filePath of filePaths) {
        const relativePath = path.relative(repositoryPath, filePath);
        
        // Read file content
        const content = await fs.readFile(filePath, 'utf-8');
        const contentHash = CanonicalAuthority.hash(content);
        const size = Buffer.byteLength(content, 'utf-8');
        
        // Detect file type
        const fileType = this._detectFileType(filePath);
        const language = this._detectLanguage(filePath);

        // Create File constitutional object
        const fileObject = this._constitutionalObjectFactory.createFileObject({
          path: relativePath,
          content_hash: contentHash,
          size: size,
          encoding: 'utf-8',
          file_type: fileType,
          language: language,
        });

        // Wrap in operational envelope
        const operationalMetadata = this._operationalMetadataCollector.collect({
          pipeline_stage: 'filesystem',
          source: 'FilesystemAuthority',
        });
        const envelope = OperationalEnvelope.wrap(fileObject, operationalMetadata);

        // Register constitutional object
        await this._objectRegistry.register(fileObject);

        wrappedFiles.push({
          constitutional_object: fileObject,
          operational_envelope: envelope,
        });
      }

      // Cache file objects
      this._fileCache.set(repoId, wrappedFiles);
      await this._persistFileCache(repoId, wrappedFiles);

      console.log(`[FilesystemAuthority] Compiled ${wrappedFiles.length} files for repository: ${repoId}`);
      return wrappedFiles;
    } catch (error) {
      console.error(`[FilesystemAuthority] Failed to compile files for repository: ${repoId}`, error.message);
      throw error;
    }
  }

  /**
   * Scan repository recursively
   * 
   * @param {string} repositoryPath - Path to repository
   * @returns {Array<string>} Array of file paths
   */
  async _scanRepository(repositoryPath) {
    const filePaths = [];
    const queue = [repositoryPath];

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const stats = await fs.stat(currentPath);

      if (stats.isDirectory()) {
        // Skip common ignore directories
        const basename = path.basename(currentPath);
        if (['node_modules', '.git', 'target', 'build', 'dist', '__pycache__', '.venv', 'venv'].includes(basename)) {
          continue;
        }

        // Add directory contents to queue
        const entries = await fs.readdir(currentPath);
        for (const entry of entries) {
          queue.push(path.join(currentPath, entry));
        }
      } else if (stats.isFile()) {
        // Add file path
        filePaths.push(currentPath);
      }
    }

    return filePaths.sort();
  }

  /**
   * Detect file type
   * 
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  _detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const typeMap = {
      '.js': 'source',
      '.ts': 'source',
      '.jsx': 'source',
      '.tsx': 'source',
      '.rs': 'source',
      '.go': 'source',
      '.cs': 'source',
      '.java': 'source',
      '.py': 'source',
      '.c': 'source',
      '.cpp': 'source',
      '.h': 'source',
      '.hpp': 'source',
      '.zig': 'source',
      '.swift': 'source',
      '.kt': 'source',
      '.lua': 'source',
      '.rb': 'source',
      '.php': 'source',
      '.json': 'data',
      '.yaml': 'data',
      '.yml': 'data',
      '.toml': 'data',
      '.xml': 'data',
      '.md': 'documentation',
      '.txt': 'text',
      '.lock': 'lockfile',
      '.gitignore': 'config',
      '.env': 'config',
    };

    return typeMap[ext] || 'unknown';
  }

  /**
   * Detect programming language
   * 
   * @param {string} filePath - File path
   * @returns {string} Programming language
   */
  _detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.rs': 'rust',
      '.go': 'go',
      '.cs': 'csharp',
      '.java': 'java',
      '.py': 'python',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.zig': 'zig',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.lua': 'lua',
      '.rb': 'ruby',
      '.php': 'php',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Get file objects by repository
   * 
   * @param {string} repoId - Repository identifier
   * @returns {Array} Array of wrapped file objects
   */
  getFiles(repoId) {
    return this._fileCache.get(repoId) || [];
  }

  /**
   * Get file by path
   * 
   * @param {string} repoId - Repository identifier
   * @param {string} filePath - File path
   * @returns {Object} Wrapped file object
   */
  getFile(repoId, filePath) {
    const files = this.getFiles(repoId);
    return files.find(f => f.constitutional_object.payload.path === filePath);
  }

  /**
   * Get all file objects
   * 
   * @returns {Array} Array of all wrapped file objects
   */
  getAllFiles() {
    const allFiles = [];
    for (const files of this._fileCache.values()) {
      allFiles.push(...files);
    }
    return allFiles;
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const stats = {
      total_repositories: this._fileCache.size,
      total_files: 0,
      by_file_type: {},
      by_language: {},
      total_size: 0,
    };

    for (const files of this._fileCache.values()) {
      stats.total_files += files.length;

      for (const file of files) {
        const fileType = file.constitutional_object.payload.file_type;
        const language = file.constitutional_object.payload.language;
        const size = file.constitutional_object.payload.size;

        stats.by_file_type[fileType] = (stats.by_file_type[fileType] || 0) + 1;
        stats.by_language[language] = (stats.by_language[language] || 0) + 1;
        stats.total_size += size;
      }
    }

    return stats;
  }

  /**
   * Persist file cache
   * 
   * @param {string} repoId - Repository identifier
   * @param {Array} wrappedFiles - Array of wrapped file objects
   */
  async _persistFileCache(repoId, wrappedFiles) {
    try {
      const fileData = wrappedFiles.map(wf => ({
        constitutional_id: wf.constitutional_object.id,
        constitutional_hash: wf.constitutional_object.canonical_hash,
        operational_metadata: wf.operational_envelope.getOperationalMetadata(),
      }));

      await this._postgres.query(`
        INSERT INTO filesystem_cache (repo_id, file_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          file_data = $2,
          updated_at = NOW()
      `, [repoId, JSON.stringify(fileData)]);
    } catch (error) {
      console.error('[FilesystemAuthority] Failed to persist file cache:', error.message);
    }
  }

  /**
   * Load file cache
   */
  async _loadFileCache() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, file_data
        FROM filesystem_cache
        ORDER BY updated_at DESC
        LIMIT 10000
      `);

      for (const row of result.rows) {
        const wrappedFiles = row.file_data.map(fd => {
          // Reconstruct constitutional object from cache
          // In real implementation, would load from constitutional_objects table
          return {
            constitutional_object: {
              id: fd.constitutional_id,
              canonical_hash: fd.constitutional_hash,
            },
            operational_envelope: {
              getOperationalMetadata: () => fd.operational_metadata,
            },
          };
        });
        this._fileCache.set(row.repo_id, wrappedFiles);
      }
    } catch (error) {
      console.error('[FilesystemAuthority] Failed to load file cache:', error.message);
    }
  }

  /**
   * Clear file cache (memory only)
   */
  clearFileCache() {
    this._fileCache.clear();
  }
}

module.exports = { FilesystemAuthority };
