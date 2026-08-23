/**
 * Knowledge Retrieval Service
 * 
 * Phase A.3 — Knowledge Retrieval
 * 
 * Question → Embedding → Qdrant Search → Top K → Ollama → Answer
 * 
 * RAG (Retrieval-Augmented Generation) for Second Brain.
 */

const { QdrantClient } = require('./qdrant_client');
const { getInferenceAdapter } = require('../ping-runtime/ai/inference_adapter');

class KnowledgeRetrieval {
  constructor(config = {}) {
    this._qdrantClient = new QdrantClient();
    this._inferenceAdapter = null;
    this._collectionName = config.collectionName || 'documents';
    this._topK = config.topK || 5;
    this._model = config.model || 'qwen2.5-coder:14b';
  }

  /**
   * Initialize retrieval service
   */
  async initialize() {
    console.log('[KnowledgeRetrieval] Initializing');
    
    // Ensure Qdrant collection exists
    await this._qdrantClient.ensureCollection(this._collectionName, 768);
    console.log(`[KnowledgeRetrieval] Ensured Qdrant collection: ${this._collectionName}`);

    // Initialize inference adapter
    this._inferenceAdapter = getInferenceAdapter();
    console.log('[KnowledgeRetrieval] Initialized inference adapter');
  }

  /**
   * Answer question with RAG
   */
  async answerQuestion(question) {
    console.log(`[KnowledgeRetrieval] Answering question: ${question.substring(0, 100)}...`);
    
    try {
      // Step 1: Embed question
      const questionEmbedding = await this._embedQuestion(question);
      console.log('[KnowledgeRetrieval] Generated question embedding');
      
      // Step 2: Search Qdrant
      const relevantDocs = await this._searchQdrant(questionEmbedding);
      console.log(`[KnowledgeRetrieval] Found ${relevantDocs.length} relevant documents`);
      
      // Step 3: Build context
      const context = this._buildContext(relevantDocs);
      
      // Step 4: Generate answer
      const answer = await this._generateAnswer(question, context);
      console.log('[KnowledgeRetrieval] Generated answer');
      
      return {
        question: question,
        answer: answer,
        context: context,
        sources: relevantDocs.map(doc => ({
          text: doc.payload.text,
          file_path: doc.payload.file_path,
          chunk_index: doc.payload.chunk_index,
          score: doc.score
        }))
      };
    } catch (error) {
      console.error('[KnowledgeRetrieval] Error answering question:', error.message);
      throw error;
    }
  }

  /**
   * Embed question
   */
  async _embedQuestion(question) {
    try {
      const response = await this._inferenceAdapter.embed(question);
      
      if (response && response.embedding) {
        return response.embedding;
      } else {
        throw new Error('Failed to embed question');
      }
    } catch (error) {
      console.error('[KnowledgeRetrieval] Embedding error:', error.message);
      throw error;
    }
  }

  /**
   * Search Qdrant
   */
  async _searchQdrant(embedding) {
    try {
      const results = await this._qdrantClient.search(this._collectionName, embedding, this._topK);
      return results;
    } catch (error) {
      console.error('[KnowledgeRetrieval] Qdrant search error:', error.message);
      return [];
    }
  }

  /**
   * Build context from relevant documents
   */
  _buildContext(relevantDocs) {
    if (relevantDocs.length === 0) {
      return 'No relevant documents found.';
    }

    const contextParts = relevantDocs.map((doc, index) => {
      return `[Document ${index + 1}] (from ${doc.payload.file_path}):\n${doc.payload.text}`;
    });

    return contextParts.join('\n\n');
  }

  /**
   * Generate answer with context
   */
  async _generateAnswer(question, context) {
    const prompt = `You are a helpful assistant that answers questions based on the provided context.

Context:
${context}

Question: ${question}

Answer the question based on the context above. If the context doesn't contain enough information to answer the question, say so. Be concise and specific.`;

    try {
      const result = await this._inferenceAdapter.chat([
        { role: 'user', content: prompt }
      ], this._model);

      if (result && result.message && result.message.content) {
        return result.message.content;
      } else {
        throw new Error('Failed to generate answer');
      }
    } catch (error) {
      console.error('[KnowledgeRetrieval] Generation error:', error.message);
      throw error;
    }
  }

  /**
   * Get stats
   */
  async getStats() {
    const count = await this._qdrantClient.countPoints(this._collectionName);
    
    return {
      collection: this._collectionName,
      total_points: count,
      top_k: this._topK,
      model: this._model
    };
  }
}

module.exports = { KnowledgeRetrieval };
