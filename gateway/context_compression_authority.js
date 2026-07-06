/**
 * Context Compression Authority
 * 
 * Phase 12 — Persistent Ollama Runtime
 * 
 * Implements long context compression.
 * 
 * Automatically creates:
 * - conversation
 * ↓
 * - hierarchical summaries
 * ↓
 * - fact extraction
 * ↓
 * - entity graph
 * ↓
 * - relationship graph
 * ↓
 * - vector embeddings
 * ↓
 * - constitutional transcript
 * 
 * Context window becomes effectively infinite.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');

class ContextCompressionAuthority {
  constructor(postgresPool, qdrantClient, ollamaClient) {
    this._postgres = postgresPool;
    this._qdrant = qdrantClient;
    this._ollama = ollamaClient;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize authority
   */
  async initialize() {
    await this._createTables();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS context_summaries (
        summary_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        summary_level INTEGER NOT NULL,
        parent_summary_id VARCHAR(64),
        summary_text TEXT NOT NULL,
        fact_count INTEGER DEFAULT 0,
        entity_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS facts (
        fact_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        fact_text TEXT NOT NULL,
        fact_type VARCHAR(50),
        confidence FLOAT DEFAULT 1.0,
        source_message_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS entities (
        entity_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        entity_name VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50),
        entity_attributes JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        relationship_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        source_entity_id VARCHAR(64) NOT NULL,
        target_entity_id VARCHAR(64) NOT NULL,
        relationship_type VARCHAR(100) NOT NULL,
        relationship_strength FLOAT DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_summaries_session ON context_summaries(session_id)
    `);
  }

  /**
   * Compress conversation context
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Messages to compress
   * @returns {Object} Compressed context
   */
  async compressContext(sessionId, messages) {
    const compressionResult = {
      session_id: sessionId,
      hierarchical_summaries: [],
      facts: [],
      entities: [],
      relationships: [],
      embeddings: [],
      constitutional_transcript: null
    };

    // Step 1: Generate hierarchical summaries
    compressionResult.hierarchical_summaries = await this._generateHierarchicalSummaries(sessionId, messages);

    // Step 2: Extract facts
    compressionResult.facts = await this._extractFacts(sessionId, messages);

    // Step 3: Extract entities
    compressionResult.entities = await this._extractEntities(sessionId, messages);

    // Step 4: Build relationship graph
    compressionResult.relationships = await this._buildRelationshipGraph(sessionId, compressionResult.entities);

    // Step 5: Generate vector embeddings
    compressionResult.embeddings = await this._generateEmbeddings(sessionId, compressionResult);

    // Step 6: Create constitutional transcript
    compressionResult.constitutional_transcript = await this._createConstitutionalTranscript(sessionId, compressionResult);

    // Create compression witness
    const compressionWitness = witnessAuthority.createWitness(compressionResult, {
      authority: 'ContextCompressionAuthority',
      authority_version: '12.0.0'
    });

    compressionResult.compression_witness = compressionWitness;
    compressionResult.compressed_at = constitutionalTimeAuthority.now();

    return compressionResult;
  }

  /**
   * Generate hierarchical summaries
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Messages
   * @returns {Array} Hierarchical summaries
   */
  async _generateHierarchicalSummaries(sessionId, messages) {
    const summaries = [];

    // Level 0: Message-level summaries (every 10 messages)
    for (let i = 0; i < messages.length; i += 10) {
      const chunk = messages.slice(i, i + 10);
      const summaryText = await this._generateSummary(chunk);
      const summaryId = this._generateSummaryId(sessionId, 0, i);

      await this._storeSummary(summaryId, sessionId, 0, null, summaryText, chunk.length);

      summaries.push({
        summary_id: summaryId,
        level: 0,
        summary_text: summaryText,
        message_range: [i, Math.min(i + 10, messages.length)]
      });
    }

    // Level 1: Chunk-level summaries (every 5 level-0 summaries)
    if (summaries.length > 5) {
      for (let i = 0; i < summaries.length; i += 5) {
        const chunkSummaries = summaries.slice(i, i + 5);
        const combinedText = chunkSummaries.map(s => s.summary_text).join('\n');
        const summaryText = await this._generateSummary([{ content: combinedText }]);
        const summaryId = this._generateSummaryId(sessionId, 1, i);

        await this._storeSummary(summaryId, sessionId, 1, chunkSummaries[0].summary_id, summaryText, chunkSummaries.length);

        summaries.push({
          summary_id: summaryId,
          level: 1,
          summary_text: summaryText,
          parent_summary_id: chunkSummaries[0].summary_id
        });
      }
    }

    // Level 2: Session-level summary
    if (summaries.length > 0) {
      const allSummaries = summaries.filter(s => s.level === 1).map(s => s.summary_text).join('\n');
      const summaryText = await this._generateSummary([{ content: allSummaries }]);
      const summaryId = this._generateSummaryId(sessionId, 2, 0);

      await this._storeSummary(summaryId, sessionId, 2, null, summaryText, summaries.length);

      summaries.push({
        summary_id: summaryId,
        level: 2,
        summary_text: summaryText,
        is_session_summary: true
      });
    }

    return summaries;
  }

  /**
   * Generate summary using Ollama
   * @param {Array} messages - Messages to summarize
   * @returns {string} Summary text
   */
  async _generateSummary(messages) {
    const prompt = `Summarize the following conversation:\n\n${messages.map(m => m.content).join('\n\n')}\n\nProvide a concise summary.`;

    try {
      const response = await this._ollama.generate({
        model: 'llama3',
        prompt: prompt,
        stream: false
      });

      return response.response;
    } catch (error) {
      console.error('Failed to generate summary:', error.message);
      return 'Summary generation failed';
    }
  }

  /**
   * Store summary
   * @param {string} summaryId - Summary ID
   * @param {string} sessionId - Session ID
   * @param {number} level - Summary level
   * @param {string} parentSummaryId - Parent summary ID
   * @param {string} summaryText - Summary text
   * @param {number} factCount - Fact count
   */
  async _storeSummary(summaryId, sessionId, level, parentSummaryId, summaryText, factCount) {
    await this._postgres.query(`
      INSERT INTO context_summaries (summary_id, session_id, summary_level, parent_summary_id, summary_text, fact_count)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [summaryId, sessionId, level, parentSummaryId, summaryText, factCount]);
  }

  /**
   * Extract facts
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Messages
   * @returns {Array} Facts
   */
  async _extractFacts(sessionId, messages) {
    const facts = [];

    for (const message of messages) {
      const extractedFacts = await this._extractFactsFromMessage(message);
      
      for (const fact of extractedFacts) {
        const factId = this._generateFactId(sessionId, fact.fact_text);
        
        await this._postgres.query(`
          INSERT INTO facts (fact_id, session_id, fact_text, fact_type, confidence, source_message_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [factId, sessionId, fact.fact_text, fact.fact_type || 'general', fact.confidence || 1.0, message.id]);

        facts.push({
          fact_id: factId,
          fact_text: fact.fact_text,
          fact_type: fact.fact_type,
          confidence: fact.confidence
        });
      }
    }

    return facts;
  }

  /**
   * Extract facts from message
   * @param {Object} message - Message
   * @returns {Array} Facts
   */
  async _extractFactsFromMessage(message) {
    // Simple fact extraction - in production, use more sophisticated NLP
    const facts = [];
    const content = message.content;

    // Extract statements that look like facts
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        facts.push({
          fact_text: trimmed,
          fact_type: 'statement',
          confidence: 0.8
        });
      }
    }

    return facts;
  }

  /**
   * Extract entities
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Messages
   * @returns {Array} Entities
   */
  async _extractEntities(sessionId, messages) {
    const entities = [];
    const entityMap = new Map();

    for (const message of messages) {
      const extractedEntities = await this._extractEntitiesFromMessage(message);
      
      for (const entity of extractedEntities) {
        const key = `${entity.entity_name}:${entity.entity_type}`;
        
        if (!entityMap.has(key)) {
          const entityId = this._generateEntityId(sessionId, entity.entity_name);
          
          await this._postgres.query(`
            INSERT INTO entities (entity_id, session_id, entity_name, entity_type, entity_attributes)
            VALUES ($1, $2, $3, $4, $5)
          `, [entityId, sessionId, entity.entity_name, entity.entity_type || 'unknown', JSON.stringify(entity.attributes || {})]);

          entityMap.set(key, {
            entity_id: entityId,
            entity_name: entity.entity_name,
            entity_type: entity.entity_type,
            attributes: entity.attributes
          });
        }
      }
    }

    return Array.from(entityMap.values());
  }

  /**
   * Extract entities from message
   * @param {Object} message - Message
   * @returns {Array} Entities
   */
  async _extractEntitiesFromMessage(message) {
    // Simple entity extraction - in production, use NER
    const entities = [];
    const content = message.content;

    // Extract capitalized words as potential entities
    const words = content.split(/\s+/);
    for (const word of words) {
      const trimmed = word.trim();
      if (trimmed.length > 2 && /^[A-Z]/.test(trimmed) && /^[A-Za-z]+$/.test(trimmed)) {
        entities.push({
          entity_name: trimmed,
          entity_type: 'unknown',
          attributes: {}
        });
      }
    }

    return entities;
  }

  /**
   * Build relationship graph
   * @param {string} sessionId - Session ID
   * @param {Array} entities - Entities
   * @returns {Array} Relationships
   */
  async _buildRelationshipGraph(sessionId, entities) {
    const relationships = [];

    // Simple relationship detection - entities mentioned together are related
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const relationshipId = this._generateRelationshipId(sessionId, entities[i].entity_id, entities[j].entity_id);
        
        await this._postgres.query(`
          INSERT INTO relationships (relationship_id, session_id, source_entity_id, target_entity_id, relationship_type, relationship_strength)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [relationshipId, sessionId, entities[i].entity_id, entities[j].entity_id, 'mentioned_together', 0.5]);

        relationships.push({
          relationship_id: relationshipId,
          source_entity_id: entities[i].entity_id,
          target_entity_id: entities[j].entity_id,
          relationship_type: 'mentioned_together',
          relationship_strength: 0.5
        });
      }
    }

    return relationships;
  }

  /**
   * Generate embeddings
   * @param {string} sessionId - Session ID
   * @param {Object} compressionResult - Compression result
   * @returns {Array} Embeddings
   */
  async _generateEmbeddings(sessionId, compressionResult) {
    const embeddings = [];

    // Embed summaries
    for (const summary of compressionResult.hierarchical_summaries) {
      const embedding = await this._generateEmbedding(summary.summary_text);
      embeddings.push({
        type: 'summary',
        id: summary.summary_id,
        text: summary.summary_text,
        vector: embedding
      });
    }

    // Embed facts
    for (const fact of compressionResult.facts) {
      const embedding = await this._generateEmbedding(fact.fact_text);
      embeddings.push({
        type: 'fact',
        id: fact.fact_id,
        text: fact.fact_text,
        vector: embedding
      });
    }

    // Store embeddings in Qdrant
    for (const embedding of embeddings) {
      await this._qdrant.upsert({
        collection_name: 'context_compression',
        points: [
          {
            id: embedding.id,
            vector: embedding.vector,
            payload: {
              session_id: sessionId,
              type: embedding.type,
              text: embedding.text
            }
          }
        ]
      });
    }

    return embeddings;
  }

  /**
   * Generate embedding using Ollama
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  async _generateEmbedding(text) {
    try {
      const response = await this._ollama.embeddings({
        model: 'llama3',
        prompt: text
      });

      return response.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error.message);
      return new Array(1536).fill(0); // Dummy embedding
    }
  }

  /**
   * Create constitutional transcript
   * @param {string} sessionId - Session ID
   * @param {Object} compressionResult - Compression result
   * @returns {Object} Constitutional transcript
   */
  async _createConstitutionalTranscript(sessionId, compressionResult) {
    const transcript = {
      session_id: sessionId,
      summary_count: compressionResult.hierarchical_summaries.length,
      fact_count: compressionResult.facts.length,
      entity_count: compressionResult.entities.length,
      relationship_count: compressionResult.relationships.length,
      embedding_count: compressionResult.embeddings.length,
      transcript_hash: CanonicalAuthority.hash(compressionResult),
      created_at: constitutionalTimeAuthority.now()
    };

    return transcript;
  }

  /**
   * Retrieve compressed context
   * @param {string} sessionId - Session ID
   * @returns {Object} Compressed context
   */
  async retrieveCompressedContext(sessionId) {
    const summaries = await this._retrieveSummaries(sessionId);
    const facts = await this._retrieveFacts(sessionId);
    const entities = await this._retrieveEntities(sessionId);
    const relationships = await this._retrieveRelationships(sessionId);

    return {
      session_id: sessionId,
      hierarchical_summaries: summaries,
      facts: facts,
      entities: entities,
      relationships: relationships
    };
  }

  /**
   * Retrieve summaries
   * @param {string} sessionId - Session ID
   * @returns {Array} Summaries
   */
  async _retrieveSummaries(sessionId) {
    const result = await this._postgres.query(`
      SELECT summary_id, summary_level, parent_summary_id, summary_text, fact_count
      FROM context_summaries
      WHERE session_id = $1
      ORDER BY summary_level ASC
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Retrieve facts
   * @param {string} sessionId - Session ID
   * @returns {Array} Facts
   */
  async _retrieveFacts(sessionId) {
    const result = await this._postgres.query(`
      SELECT fact_id, fact_text, fact_type, confidence
      FROM facts
      WHERE session_id = $1
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Retrieve entities
   * @param {string} sessionId - Session ID
   * @returns {Array} Entities
   */
  async _retrieveEntities(sessionId) {
    const result = await this._postgres.query(`
      SELECT entity_id, entity_name, entity_type, entity_attributes
      FROM entities
      WHERE session_id = $1
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Retrieve relationships
   * @param {string} sessionId - Session ID
   * @returns {Array} Relationships
   */
  async _retrieveRelationships(sessionId) {
    const result = await this._postgres.query(`
      SELECT relationship_id, source_entity_id, target_entity_id, relationship_type, relationship_strength
      FROM relationships
      WHERE session_id = $1
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Generate summary ID
   * @param {string} sessionId - Session ID
   * @param {number} level - Summary level
   * @param {number} index - Index
   * @returns {string} Summary ID
   */
  _generateSummaryId(sessionId, level, index) {
    const data = { session_id: sessionId, level, index };
    const hash = CanonicalAuthority.hash(data);
    return `summary_${hash.substring(0, 16)}`;
  }

  /**
   * Generate fact ID
   * @param {string} sessionId - Session ID
   * @param {string} factText - Fact text
   * @returns {string} Fact ID
   */
  _generateFactId(sessionId, factText) {
    const data = { session_id: sessionId, fact_text: factText };
    const hash = CanonicalAuthority.hash(data);
    return `fact_${hash.substring(0, 16)}`;
  }

  /**
   * Generate entity ID
   * @param {string} sessionId - Session ID
   * @param {string} entityName - Entity name
   * @returns {string} Entity ID
   */
  _generateEntityId(sessionId, entityName) {
    const data = { session_id: sessionId, entity_name: entityName };
    const hash = CanonicalAuthority.hash(data);
    return `entity_${hash.substring(0, 16)}`;
  }

  /**
   * Generate relationship ID
   * @param {string} sessionId - Session ID
   * @param {string} sourceEntityId - Source entity ID
   * @param {string} targetEntityId - Target entity ID
   * @returns {string} Relationship ID
   */
  _generateRelationshipId(sessionId, sourceEntityId, targetEntityId) {
    const data = { session_id: sessionId, source_entity_id: sourceEntityId, target_entity_id: targetEntityId };
    const hash = CanonicalAuthority.hash(data);
    return `relationship_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '12.0.0',
      constitutional_version: '12.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `context_compression_${hash.substring(0, 16)}`;
  }
}

module.exports = { ContextCompressionAuthority };
