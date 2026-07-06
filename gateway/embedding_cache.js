/**
 * Embedding Cache
 * 
 * Phase 3.6 — Embedding Cache
 * 
 * SQLite cache to avoid recomputing embeddings.
 * 
 * Schema:
 * - embeddings (hash, model, vector, created_at)
 * 
 * Workflow:
 * - Before embedding: lookup hash
 * - If identical: reuse vector
 * - Avoid recomputing
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class EmbeddingCache {
  constructor(config = {}) {
    this._dbPath = config.dbPath || './state/embeddings.db';
    this._db = null;
    this._maxAge = config.maxAge || 30 * 24 * 60 * 60 * 1000; // 30 days default
  }

  /**
   * Initialize cache
   */
  async initialize() {
    console.log('[EmbeddingCache] Initializing');
    
    // Ensure directory exists
    const dbDir = path.dirname(this._dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    this._db = new Database(this._dbPath);
    this._db.pragma('journal_mode = WAL');
    this._db.pragma('synchronous = NORMAL');

    // Create table
    this._createTable();

    // Create indexes
    this._createIndexes();

    console.log('[EmbeddingCache] Initialized');
  }

  /**
   * Create table
   */
  _createTable() {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        vector TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        accessed_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
  }

  /**
   * Create indexes
   */
  _createIndexes() {
    this._db.exec(`
      CREATE INDEX IF NOT EXISTS idx_embeddings_hash ON embeddings(hash);
      CREATE INDEX IF NOT EXISTS idx_embeddings_model ON embeddings(model);
      CREATE INDEX IF NOT EXISTS idx_embeddings_created_at ON embeddings(created_at);
    `);
  }

  /**
   * Compute hash of text
   */
  _computeHash(text, model) {
    // Phase 36F: Use CanonicalAuthority for hash computation
    const combined = text + model;
    return CanonicalAuthority.hash(combined);
  }

  /**
   * Get cached embedding
   */
  get(text, model) {
    try {
      const hash = this._computeHash(text, model);
      
      const row = this._db.prepare(
        'SELECT vector FROM embeddings WHERE hash = ? AND model = ?'
      ).get(hash, model);

      if (row) {
        // Update accessed_at
        this._db.prepare(
          'UPDATE embeddings SET accessed_at = strftime("%s", "now") WHERE hash = ?'
        ).run(hash);

        return JSON.parse(row.vector);
      }

      return null;
    } catch (error) {
      console.error('[EmbeddingCache] Error getting cache:', error.message);
      return null;
    }
  }

  /**
   * Set cached embedding
   */
  set(text, model, vector) {
    try {
      const hash = this._computeHash(text, model);
      const vectorJson = JSON.stringify(vector);

      const stmt = this._db.prepare(`
        INSERT INTO embeddings (hash, model, vector)
        VALUES (?, ?, ?)
        ON CONFLICT(hash) DO UPDATE SET
          vector = excluded.vector,
          accessed_at = strftime('%s', 'now')
      `);

      stmt.run(hash, model, vectorJson);

      return { success: true };
    } catch (error) {
      console.error('[EmbeddingCache] Error setting cache:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get multiple cached embeddings
   */
  getBatch(items) {
    const results = [];
    
    for (const item of items) {
      const cached = this.get(item.text, item.model);
      if (cached) {
        results.push({
          ...item,
          embedding: cached,
          cached: true
        });
      } else {
        results.push({
          ...item,
          embedding: null,
          cached: false
        });
      }
    }

    return results;
  }

  /**
   * Set multiple cached embeddings
   */
  setBatch(items) {
    for (const item of items) {
      if (item.embedding && !item.cached) {
        this.set(item.text, item.model, item.embedding);
      }
    }
  }

  /**
   * Clear old cache entries
   */
  clearOld() {
    try {
      const cutoffTime = Math.floor((constitutionalTimeAuthority.now() - this._maxAge) / 1000);
      
      const result = this._db.prepare(
        'DELETE FROM embeddings WHERE created_at < ?'
      ).run(cutoffTime);

      console.log(`[EmbeddingCache] Cleared ${result.changes} old entries`);
      return { success: true, deleted: result.changes };
    } catch (error) {
      console.error('[EmbeddingCache] Error clearing old entries:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache for specific model
   */
  clearModel(model) {
    try {
      const result = this._db.prepare(
        'DELETE FROM embeddings WHERE model = ?'
      ).run(model);

      console.log(`[EmbeddingCache] Cleared ${result.changes} entries for model ${model}`);
      return { success: true, deleted: result.changes };
    } catch (error) {
      console.error('[EmbeddingCache] Error clearing model entries:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    try {
      const total = this._db.prepare('SELECT COUNT(*) as count FROM embeddings').get().count;
      
      const byModel = this._db.prepare(`
        SELECT model, COUNT(*) as count 
        FROM embeddings 
        GROUP BY model
      `).all();

      const oldest = this._db.prepare('SELECT MIN(created_at) as oldest FROM embeddings').get().oldest;
      const newest = this._db.prepare('SELECT MAX(created_at) as newest FROM embeddings').get().newest;

      return {
        total_embeddings: total,
        by_model: byModel,
        oldest_entry: oldest,
        newest_entry: newest
      };
    } catch (error) {
      console.error('[EmbeddingCache] Error getting stats:', error.message);
      return { total_embeddings: 0, by_model: [] };
    }
  }

  /**
   * Close database
   */
  close() {
    if (this._db) {
      this._db.close();
      console.log('[EmbeddingCache] Closed');
    }
  }
}

const fs = require('fs');

module.exports = { EmbeddingCache };
