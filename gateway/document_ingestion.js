/**
 * Document Ingestion Pipeline
 * 
 * Phase A.2 — Embedding Pipeline
 * 
 * Watch folder → Chunk documents → Embedding → Qdrant
 * 
 * Automatic document ingestion for Second Brain.
 */

const fs = require('fs');
const path = require('path');
const { QdrantClient } = require('./qdrant_client');
const { getInferenceAdapter } = require('../ping-runtime/ai/inference_adapter');

class DocumentIngestion {
  constructor(config = {}) {
    this._watchPath = config.watchPath || './documents';
    this._qdrantClient = new QdrantClient();
    this._inferenceAdapter = null;
    this._collectionName = config.collectionName || 'documents';
    this._chunkSize = config.chunkSize || 500;
    this._chunkOverlap = config.chunkOverlap || 50;
    this._isRunning = false;
    this._watcher = null;
    this._processedFiles = new Set();
    this._pendingFiles = new Set();
  }

  /**
   * Get full file path
   * @param {string} filename - Filename
   * @returns {string} Full path
   */
  _getFilePath(filename) {
    return path.join(this._watchPath, filename);
  }

  /**
   * Get full directory path
   * @param {string} dir - Directory
   * @param {string} item - Item name
   * @returns {string} Full path
   */
  _getFullPath(dir, item) {
    return path.join(dir, item);
  }

  /**
   * Initialize ingestion pipeline
   */
  async initialize() {
    console.log('[DocumentIngestion] Initializing');
    
    // Ensure watch directory exists
    if (!fs.existsSync(this._watchPath)) {
      fs.mkdirSync(this._watchPath, { recursive: true });
      console.log(`[DocumentIngestion] Created watch directory: ${this._watchPath}`);
    }

    // Ensure Qdrant collection exists
    await this._qdrantClient.ensureCollection(this._collectionName, 768);
    console.log(`[DocumentIngestion] Ensured Qdrant collection: ${this._collectionName}`);

    // Initialize inference adapter
    this._inferenceAdapter = getInferenceAdapter();
    console.log('[DocumentIngestion] Initialized inference adapter');
  }

  /**
   * Start ingestion pipeline
   */
  async start() {
    if (this._isRunning) {
      console.log('[DocumentIngestion] Already running');
      return;
    }

    console.log('[DocumentIngestion] Starting');
    
    // Process existing files
    await this._processExistingFiles();
    
    // Start watching for new files
    this._startWatcher();
    
    this._isRunning = true;
    console.log('[DocumentIngestion] Started');
  }

  /**
   * Stop ingestion pipeline
   */
  async stop() {
    console.log('[DocumentIngestion] Stopping');
    
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
    }
    
    this._isRunning = false;
    console.log('[DocumentIngestion] Stopped');
  }

  /**
   * Process existing files
   */
  async _processExistingFiles() {
    console.log('[DocumentIngestion] Processing existing files');
    
    const files = this._getFiles(this._watchPath);
    console.log(`[DocumentIngestion] Found ${files.length} files`);
    
    for (const file of files) {
      await this._processFile(file);
    }
  }

  /**
   * Start file watcher
   */
  _startWatcher() {
    this._watcher = fs.watch(this._watchPath, { recursive: true }, async (eventType, filename) => {
      if (!filename) return;

      const filePath = this._getFilePath(filename);
      
      // Only process new/modified files
      if (eventType === 'change' || eventType === 'rename') {
        console.log(`[DocumentIngestion] File changed: ${filename}`);
        await this._processFile(filePath);
      }
    });
    
    console.log(`[DocumentIngestion] Watching directory: ${this._watchPath}`);
  }

  /**
   * Get all files from directory
   */
  _getFiles(dir) {
    const files = [];
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...this._getFiles(fullPath));
      } else if (item.isFile() && this._isSupportedFile(item.name)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Check if file is supported
   */
  _isSupportedFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css'].includes(ext);
  }

  /**
   * Process file
   */
  async _processFile(filePath) {
    try {
      // Skip if already processed
      if (this._processedFiles.has(filePath)) {
        return;
      }

      console.log(`[DocumentIngestion] Processing file: ${filePath}`);
      
      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        console.log(`[DocumentIngestion] Skipping empty file: ${filePath}`);
        return;
      }

      // Chunk content
      const chunks = this._chunkContent(content);
      console.log(`[DocumentIngestion] Created ${chunks.length} chunks`);
      
      // Embed chunks
      const embeddings = await this._embedChunks(chunks);
      console.log(`[DocumentIngestion] Generated ${embeddings.length} embeddings`);
      
      // Store in Qdrant
      await this._storeInQdrant(filePath, chunks, embeddings);
      console.log(`[DocumentIngestion] Stored in Qdrant: ${filePath}`);
      
      // Mark as processed
      this._processedFiles.add(filePath);
    } catch (error) {
      console.error(`[DocumentIngestion] Error processing file ${filePath}:`, error.message);
      // Mark as pending for retry
      this._pendingFiles.add(filePath);
    }
  }

  /**
   * Chunk content
   */
  _chunkContent(content) {
    const chunks = [];
    const words = content.split(/\s+/);
    
    let currentChunk = [];
    let currentLength = 0;
    
    for (const word of words) {
      if (currentLength + word.length + 1 > this._chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
      
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }

  /**
   * Embed chunks with retry
   */
  async _embedChunks(chunks) {
    const embeddings = [];
    
    for (const chunk of chunks) {
      const embedding = await this._embedChunkWithRetry(chunk);
      if (embedding) {
        embeddings.push(embedding);
      } else {
        // If embedding fails after retries, throw error
        throw new Error('Failed to embed chunk after retries');
      }
    }
    
    return embeddings;
  }

  /**
   * Embed single chunk with retry
   */
  async _embedChunkWithRetry(chunk, attempt = 0) {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    try {
      const response = await this._inferenceAdapter.embed(chunk);
      
      if (response && response.embedding) {
        return response.embedding;
      } else {
        throw new Error('Embedding returned null');
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[DocumentIngestion] Retry embedding attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._embedChunkWithRetry(chunk, attempt + 1);
      } else {
        console.error('[DocumentIngestion] Failed to embed chunk after retries:', error.message);
        return null;
      }
    }
  }

  /**
   * Store in Qdrant
   */
  async _storeInQdrant(filePath, chunks, embeddings) {
    const points = chunks.map((chunk, index) => ({
      id: `${filePath}-${index}`,
      vector: embeddings[index],
      payload: {
        text: chunk,
        file_path: filePath,
        chunk_index: index,
        timestamp: new Date().toISOString()
      }
    }));
    
    await this._qdrantClient.upsert(this._collectionName, points);
  }

  /**
   * Get stats
   */
  async getStats() {
    const count = await this._qdrantClient.countPoints(this._collectionName);
    
    return {
      collection: this._collectionName,
      total_points: count,
      processed_files: this._processedFiles.size,
      pending_files: this._pendingFiles.size,
      watch_path: this._watchPath,
      is_running: this._isRunning
    };
  }

  /**
   * Retry pending files
   */
  async retryPendingFiles() {
    console.log(`[DocumentIngestion] Retrying ${this._pendingFiles.size} pending files`);
    
    const filesToRetry = Array.from(this._pendingFiles);
    
    for (const filePath of filesToRetry) {
      try {
        await this._processFile(filePath);
        if (this._processedFiles.has(filePath)) {
          this._pendingFiles.delete(filePath);
        }
      } catch (error) {
        console.error(`[DocumentIngestion] Retry failed for ${filePath}:`, error.message);
      }
    }
  }
}

// Start ingestion if run directly
if (require.main === module) {
  const ingestion = new DocumentIngestion({
    watchPath: process.env.DOCUMENTS_PATH || './documents',
    collectionName: 'documents'
  });
  
  ingestion.initialize().then(() => {
    return ingestion.start();
  }).then(() => {
    console.log('[DocumentIngestion] Running');
  }).catch((err) => {
    console.error('[DocumentIngestion] Failed to start:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[DocumentIngestion] SIGTERM received');
    await ingestion.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[DocumentIngestion] SIGINT received');
    await ingestion.stop();
    process.exit(0);
  });
}

module.exports = { DocumentIngestion };
