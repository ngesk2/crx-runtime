/**
 * Embedding Batcher
 * 
 * Phase 3.5 — Embedding Batching
 * 
 * Configurable batch size, parallel but rate limited.
 * 
 * Features:
 * - Configurable batch size
 * - Parallel processing with rate limiting
 * - Request queuing
 * - Progress tracking
 * - Error handling with retry
 */

const { getInferenceAdapter } = require('./inference_adapter');

class EmbeddingBatcher {
  constructor(config = {}) {
    this._batchSize = config.batchSize || 10;
    this._maxParallel = config.maxParallel || 3;
    this._rateLimitDelay = config.rateLimitDelay || 100; // ms between batches
    this._maxRetries = config.maxRetries || 3;
    this._retryDelay = config.retryDelay || 1000;
    
    this._queue = [];
    this._activeBatches = 0;
    this._inferenceAdapter = null;
    this._stats = {
      total: 0,
      processed: 0,
      failed: 0,
      batches: 0
    };
  }

  /**
   * Initialize batcher
   */
  async initialize() {
    console.log('[EmbeddingBatcher] Initializing');
    this._inferenceAdapter = getInferenceAdapter();
    console.log('[EmbeddingBatcher] Initialized');
  }

  /**
   * Add items to queue
   */
  enqueue(items) {
    if (!Array.isArray(items)) {
      items = [items];
    }

    this._queue.push(...items);
    this._stats.total += items.length;
    
    console.log(`[EmbeddingBatcher] Enqueued ${items.length} items (queue: ${this._queue.length})`);
  }

  /**
   * Process queue
   */
  async processQueue() {
    console.log(`[EmbeddingBatcher] Processing queue (${this._queue.length} items)`);

    while (this._queue.length > 0) {
      // Wait for available parallel slots
      while (this._activeBatches >= this._maxParallel) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get next batch
      const batch = this._queue.splice(0, this._batchSize);
      this._activeBatches++;

      // Process batch
      this._processBatch(batch).finally(() => {
        this._activeBatches--;
      });

      // Rate limit between batches
      if (this._queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this._rateLimitDelay));
      }
    }

    // Wait for all active batches to complete
    while (this._activeBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[EmbeddingBatcher] Queue processing complete');
    return this._stats;
  }

  /**
   * Process single batch
   */
  async _processBatch(batch) {
    this._stats.batches++;
    console.log(`[EmbeddingBatcher] Processing batch ${this._stats.batches} (${batch.length} items)`);

    try {
      const embeddings = await this._embedBatchWithRetry(batch);
      
      this._stats.processed += embeddings.length;
      console.log(`[EmbeddingBatcher] Batch ${this._stats.batches} complete (${embeddings.length} embeddings)`);

      return embeddings;
    } catch (error) {
      this._stats.failed += batch.length;
      console.error(`[EmbeddingBatcher] Batch ${this._stats.batches} failed:`, error.message);
      throw error;
    }
  }

  /**
   * Embed batch with retry
   */
  async _embedBatchWithRetry(batch, attempt = 0) {
    try {
      const embeddings = await Promise.all(
        batch.map(item => this._embedItem(item))
      );
      return embeddings;
    } catch (error) {
      if (attempt < this._maxRetries) {
        const delay = this._retryDelay * Math.pow(2, attempt);
        console.log(`[EmbeddingBatcher] Retry batch attempt ${attempt + 1}/${this._maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._embedBatchWithRetry(batch, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Embed single item
   */
  async _embedItem(item) {
    try {
      const response = await this._inferenceAdapter.embed(item.text);
      
      if (response && response.embedding) {
        return {
          ...item,
          embedding: response.embedding,
          success: true
        };
      } else {
        throw new Error('Embedding returned null');
      }
    } catch (error) {
      return {
        ...item,
        embedding: null,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this._stats,
      queue_size: this._queue.length,
      active_batches: this._activeBatches,
      success_rate: this._stats.total > 0 ? (this._stats.processed / this._stats.total) : 0
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this._queue = [];
    console.log('[EmbeddingBatcher] Queue cleared');
  }

  /**
   * Reset stats
   */
  resetStats() {
    this._stats = {
      total: 0,
      processed: 0,
      failed: 0,
      batches: 0
    };
    console.log('[EmbeddingBatcher] Stats reset');
  }
}

module.exports = { EmbeddingBatcher };
