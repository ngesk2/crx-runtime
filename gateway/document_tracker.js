/**
 * Document Tracker
 * 
 * Phase 3.1 — File Hash Tracking
 * 
 * SQLite database for persistent document tracking.
 * 
 * Schema:
 * - documents (filepath, sha256, last_modified, indexed_at)
 * 
 * Workflow:
 * - Compute SHA256
 * - If unchanged: skip
 * - If changed: delete previous vectors, reindex
 * - Never duplicate vectors
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const Database = require('better-sqlite3');

class DocumentTracker {
  constructor(config = {}) {
    this._dbPath = config.dbPath || './state/documents.db';
    this._db = null;
    this._maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this._allowedExtensions = config.allowedExtensions || [
      '.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css',
      '.java', '.c', '.cpp', '.h', '.go', '.rs', '.rb', '.php',
      '.sql', '.sh', '.bash', '.zsh', '.yaml', '.yml', '.xml',
      '.pdf', '.docx', '.doc', '.xlsx', '.xls'
    ];
  }

  /**
   * Initialize database
   */
  async initialize() {
    console.log('[DocumentTracker] Initializing');
    
    // Ensure directory exists
    const dbDir = path.dirname(this._dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    this._db = new Database(this._dbPath);
    this._db.pragma('journal_mode = WAL');
    this._db.pragma('synchronous = NORMAL');

    // Create tables
    this._createTables();

    // Create indexes
    this._createIndexes();

    console.log('[DocumentTracker] Initialized');
  }

  /**
   * Create tables
   */
  _createTables() {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filepath TEXT NOT NULL UNIQUE,
        sha256 TEXT NOT NULL,
        last_modified INTEGER NOT NULL,
        file_size INTEGER NOT NULL,
        indexed_at INTEGER NOT NULL,
        embedding_model TEXT,
        embedding_version TEXT,
        pipeline_version TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS deleted_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filepath TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        deleted_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
  }

  /**
   * Create indexes
   */
  _createIndexes() {
    this._db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_filepath ON documents(filepath);
      CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
      CREATE INDEX IF NOT EXISTS idx_documents_last_modified ON documents(last_modified);
      CREATE INDEX IF NOT EXISTS idx_documents_indexed_at ON documents(indexed_at);
    `);
  }

  /**
   * Compute SHA256 hash of file
   */
  _computeHash(filePath) {
    const buffer = fs.readFileSync(filePath);
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(buffer);
  }

  /**
   * Validate file path
   */
  _validatePath(filePath) {
    const resolvedPath = path.resolve(filePath);
    
    // Prevent directory traversal
    if (resolvedPath.includes('..')) {
      throw new Error('Invalid file path: directory traversal detected');
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!this._allowedExtensions.includes(ext)) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > this._maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes (max: ${this._maxFileSize})`);
    }

    // Check if file is binary (simple heuristic)
    if (this._isBinaryFile(filePath)) {
      throw new Error('Binary file not supported');
    }

    return resolvedPath;
  }

  /**
   * Check if file is binary
   */
  _isBinaryFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const binaryExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.exe', '.dll', '.so', '.dylib'];
    
    // Allow PDF and Office documents for future processing
    if (binaryExtensions.includes(ext)) {
      return false;
    }

    // Check first few bytes
    const buffer = Buffer.alloc(512);
    try {
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 512, 0);
      fs.closeSync(fd);
      
      // If null bytes present, likely binary
      if (buffer.includes(0)) {
        return true;
      }
    } catch (error) {
      // If we can't read, assume binary
      return true;
    }

    return false;
  }

  /**
   * Get document status
   */
  getDocumentStatus(filePath) {
    try {
      const resolvedPath = this._validatePath(filePath);
      
      if (!fs.existsSync(resolvedPath)) {
        return { status: 'not_found' };
      }

      const stats = fs.statSync(resolvedPath);
      const currentHash = this._computeHash(resolvedPath);
      const currentModified = Math.floor(stats.mtimeMs / 1000);

      // Check if document exists in database
      const existing = this._db.prepare(
        'SELECT * FROM documents WHERE filepath = ?'
      ).get(resolvedPath);

      if (!existing) {
        return {
          status: 'new',
          filepath: resolvedPath,
          sha256: currentHash,
          last_modified: currentModified,
          file_size: stats.size
        };
      }

      // Check if document changed
      if (existing.sha256 !== currentHash) {
        return {
          status: 'changed',
          filepath: resolvedPath,
          sha256: currentHash,
          last_modified: currentModified,
          file_size: stats.size,
          previous_sha256: existing.sha256,
          previous_indexed_at: existing.indexed_at
        };
      }

      // Document unchanged
      return {
        status: 'unchanged',
        filepath: resolvedPath,
        sha256: currentHash,
        last_modified: currentModified,
        file_size: stats.size,
        indexed_at: existing.indexed_at
      };
    } catch (error) {
      console.error('[DocumentTracker] Error getting document status:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Register document as indexed
   */
  registerDocument(filePath, metadata = {}) {
    try {
      const resolvedPath = this._validatePath(filePath);
      const stats = fs.statSync(resolvedPath);
      const hash = this._computeHash(resolvedPath);
      const lastModified = Math.floor(stats.mtimeMs / 1000);

      const stmt = this._db.prepare(`
        INSERT INTO documents 
        (filepath, sha256, last_modified, file_size, indexed_at, embedding_model, embedding_version, pipeline_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(filepath) DO UPDATE SET
          sha256 = excluded.sha256,
          last_modified = excluded.last_modified,
          file_size = excluded.file_size,
          indexed_at = excluded.indexed_at,
          embedding_model = excluded.embedding_model,
          embedding_version = excluded.embedding_version,
          pipeline_version = excluded.pipeline_version,
          updated_at = strftime('%s', 'now')
      `);

      stmt.run(
        resolvedPath,
        hash,
        lastModified,
        stats.size,
        Math.floor(constitutionalTimeAuthority.now() / 1000),
        metadata.embedding_model || null,
        metadata.embedding_version || null,
        metadata.pipeline_version || null
      );

      console.log(`[DocumentTracker] Registered document: ${resolvedPath}`);
      return { success: true, filepath: resolvedPath };
    } catch (error) {
      console.error('[DocumentTracker] Error registering document:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark document as deleted
   */
  markDocumentDeleted(filePath) {
    try {
      const existing = this._db.prepare(
        'SELECT * FROM documents WHERE filepath = ?'
      ).get(filePath);

      if (existing) {
        // Record deletion
        this._db.prepare(`
          INSERT INTO deleted_documents (filepath, sha256)
          VALUES (?, ?)
        `).run(filePath, existing.sha256);

        // Remove from documents table
        this._db.prepare(
          'DELETE FROM documents WHERE filepath = ?'
        ).run(filePath);

        console.log(`[DocumentTracker] Marked document as deleted: ${filePath}`);
      }

      return { success: true };
    } catch (error) {
      console.error('[DocumentTracker] Error marking document deleted:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all documents
   */
  getAllDocuments() {
    try {
      const rows = this._db.prepare('SELECT * FROM documents ORDER BY indexed_at DESC').all();
      return rows;
    } catch (error) {
      console.error('[DocumentTracker] Error getting all documents:', error.message);
      return [];
    }
  }

  /**
   * Get documents by embedding model
   */
  getDocumentsByModel(embeddingModel) {
    try {
      const rows = this._db.prepare(
        'SELECT * FROM documents WHERE embedding_model = ? ORDER BY indexed_at DESC'
      ).all(embeddingModel);
      return rows;
    } catch (error) {
      console.error('[DocumentTracker] Error getting documents by model:', error.message);
      return [];
    }
  }

  /**
   * Get stale documents (different embedding version)
   */
  getStaleDocuments(currentModel, currentVersion) {
    try {
      const rows = this._db.prepare(`
        SELECT * FROM documents 
-         WHERE embedding_model != ? OR embedding_version != ?
        ORDER BY indexed_at DESC
      `).all(currentModel, currentVersion);
      return rows;
    } catch (error) {
      console.error('[DocumentTracker] Error getting stale documents:', error.message);
      return [];
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    try {
      const total = this._db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
      const deleted = this._db.prepare('SELECT COUNT(*) as count FROM deleted_documents').get().count;
      
      const byModel = this._db.prepare(`
        SELECT embedding_model, COUNT(*) as count 
        FROM documents 
        GROUP BY embedding_model
      `).all();

      return {
        total_documents: total,
        deleted_documents: deleted,
        by_model: byModel
      };
    } catch (error) {
      console.error('[DocumentTracker] Error getting stats:', error.message);
      return { total_documents: 0, deleted_documents: 0, by_model: [] };
    }
  }

  /**
   * Close database
   */
  close() {
    if (this._db) {
      this._db.close();
      console.log('[DocumentTracker] Closed');
    }
  }
}

module.exports = { DocumentTracker };
