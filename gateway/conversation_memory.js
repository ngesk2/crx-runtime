/**
 * Conversation Memory Service
 * 
 * Phase A.4 — Conversation Memory
 * 
 * Transcript → Chunk → Embedding → Qdrant
 * 
 * Ollama remembers previous conversations.
 */

const { QdrantClient } = require('./qdrant_client');
const { getInferenceAdapter } = require('../ping-runtime/ai/inference_adapter');

class ConversationMemory {
  constructor(config = {}) {
    this._qdrantClient = new QdrantClient();
    this._inferenceAdapter = null;
    this._collectionName = config.collectionName || 'conversations';
    this._chunkSize = config.chunkSize || 300;
    this._pendingConversations = new Set();
  }

  /**
   * Initialize conversation memory
   */
  async initialize() {
    console.log('[ConversationMemory] Initializing');
    
    // Ensure Qdrant collection exists
    await this._qdrantClient.ensureCollection(this._collectionName, 768);
    console.log(`[ConversationMemory] Ensured Qdrant collection: ${this._collectionName}`);

    // Initialize inference adapter
    this._inferenceAdapter = getInferenceAdapter();
    console.log('[ConversationMemory] Initialized inference adapter');
  }

  /**
   * Store conversation
   */
  async storeConversation(conversationId, messages) {
    console.log(`[ConversationMemory] Storing conversation: ${conversationId}`);
    
    try {
      // Convert conversation to text
      const conversationText = this._messagesToText(messages);
      
      // Chunk conversation
      const chunks = this._chunkConversation(conversationText);
      console.log(`[ConversationMemory] Created ${chunks.length} chunks`);
      
      // Embed chunks
      const embeddings = await this._embedChunks(chunks);
      console.log(`[ConversationMemory] Generated ${embeddings.length} embeddings`);
      
      // Store in Qdrant
      await this._storeInQdrant(conversationId, chunks, embeddings);
      console.log(`[ConversationMemory] Stored conversation: ${conversationId}`);
      
      return {
        conversation_id: conversationId,
        chunks: chunks.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ConversationMemory] Error storing conversation:', error.message);
      // Mark as pending for retry
      this._pendingConversations.add(conversationId);
      throw error;
    }
  }

  /**
   * Retry pending conversations
   */
  async retryPendingConversations() {
    console.log(`[ConversationMemory] Retrying ${this._pendingConversations.size} pending conversations`);
    
    // Note: This would need the original messages to retry
    // For now, just clear pending conversations that are too old
    // In a real implementation, you'd store the original messages
    this._pendingConversations.clear();
  }

  /**
   * Retrieve relevant conversation history
   */
  async retrieveRelevantHistory(query, topK = 3) {
    console.log(`[ConversationMemory] Retrieving relevant history for: ${query.substring(0, 50)}...`);
    
    try {
      // Embed query
      const queryEmbedding = await this._embedQuery(query);
      
      // Search Qdrant
      const results = await this._qdrantClient.search(this._collectionName, queryEmbedding, topK);
      console.log(`[ConversationMemory] Found ${results.length} relevant conversation chunks`);
      
      return results.map(result => ({
        text: result.payload.text,
        conversation_id: result.payload.conversation_id,
        timestamp: result.payload.timestamp,
        score: result.score
      }));
    } catch (error) {
      console.error('[ConversationMemory] Error retrieving history:', error.message);
      return [];
    }
  }

  /**
   * Convert messages to text
   */
  _messagesToText(messages) {
    return messages.map(msg => {
      const role = msg.role || 'unknown';
      const content = msg.content || '';
      return `[${role.toUpperCase()}]: ${content}`;
    }).join('\n\n');
  }

  /**
   * Chunk conversation
   */
  _chunkConversation(text) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    let currentChunk = [];
    let currentLength = 0;
    
    for (const sentence of sentences) {
      if (currentLength + sentence.length > this._chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLength = 0;
      }
      
      currentChunk.push(sentence);
      currentLength += sentence.length;
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
        throw new Error('Failed to embed conversation chunk after retries');
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
        console.log(`[ConversationMemory] Retry embedding attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._embedChunkWithRetry(chunk, attempt + 1);
      } else {
        console.error('[ConversationMemory] Failed to embed chunk after retries:', error.message);
        return null;
      }
    }
  }

  /**
   * Embed query
   */
  async _embedQuery(query) {
    try {
      const response = await this._inferenceAdapter.embed(query);
      
      if (response && response.embedding) {
        return response.embedding;
      } else {
        throw new Error('Failed to embed query');
      }
    } catch (error) {
      console.error('[ConversationMemory] Query embedding error:', error.message);
      throw error;
    }
  }

  /**
   * Store in Qdrant
   */
  async _storeInQdrant(conversationId, chunks, embeddings) {
    const points = chunks.map((chunk, index) => ({
      id: `${conversationId}-${index}`,
      vector: embeddings[index],
      payload: {
        text: chunk,
        conversation_id: conversationId,
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
      total_points: count
    };
  }
}

module.exports = { ConversationMemory };
