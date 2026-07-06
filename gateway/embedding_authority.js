/**
 * Embedding Authority
 * 
 * Phase 3.2 — Authority Purification
 * Phase 36F: Entropy Sealing - Use CanonicalAuthority for hashing
 * 
 * Pure authority that returns contracts.
 * No infrastructure calls. No side effects.
 * 
 * Contract:
 * - artifacts: [...]
 * - lineage: [...]
 * - witnesses: [...]
 * - certifications: [...]
 * - publications: [...]
 * - events: [...]
 * - infrastructure: [...]
 */

const { CanonicalAuthority } = require('./canonical_authority');

class EmbeddingAuthority {
  constructor(dependencies) {
    this._constitutionalTimeAuthority = dependencies.constitutionalTimeAuthority;
    this._identityAuthority = dependencies.identityAuthority;
    this._canonicalAuthority = dependencies.canonicalAuthority;
    this._artifactBuilder = dependencies.artifactBuilder;
  }

  /**
   * Initialize embedding authority
   */
  async initialize() {
    console.log('[EmbeddingAuthority] Initializing embedding authority');
    console.log('[EmbeddingAuthority] Embedding authority initialized');
  }

  /**
   * Execute embedding (pure function, returns contract)
   * 
   * @param {Object} node - Execution node
   * @param {Object} inputArtifacts - Input artifacts
   * @returns {Object} Contract
   */
  async execute(node, inputArtifacts) {
    console.log(`[EmbeddingAuthority] Executing embedding for node ${node.node_id}`);

    const executionId = this._identityAuthority.generateId('execution', {
      node_id: node.node_id,
      timestamp: this._constitutionalTimeAuthority.now(),
    });

    try {
      // Step 1: Get artifact to embed
      const artifact = inputArtifacts[node.input_artifacts[0]];
      if (!artifact) {
        throw new Error('No input artifact found');
      }

      // Step 2: Chunk the artifact
      const chunks = this._chunkArtifact(artifact);

      // Step 3: Create infrastructure calls for embedding (deferred to ExecutionRuntime)
      const infrastructureCalls = chunks.map((chunk, i) => ({
        call_id: this._identityAuthority.generateId('infrastructure_call', {
          execution_id: executionId,
          chunk_id: chunk.id,
          operation: 'embed',
        }),
        artifact_id: vectorArtifact.artifact_id,
        adapter: node.provider || 'ollama',
        operation: 'embed',
        target_path: `embeddings[${i}].vector`,
        params: [chunk.text, node.model || 'nomic-embed-text'],
      }));

      // Step 4: Build Vector Artifact (placeholder, will be filled by ExecutionRuntime)
      const vectorArtifact = {
        artifact_id: this._identityAuthority.generateId('vector_artifact', {
          execution_id: executionId,
          timestamp: this._constitutionalTimeAuthority.now(),
        }),
        artifact_type: 'VectorArtifact',
        execution_id: executionId,
        source_artifact_id: artifact.artifact_id,
        provider: node.provider || 'ollama',
        model: node.model || 'nomic-embed-text',
        provider_version: null,
        dimensions: null,
        chunk_count: chunks.length,
        chunk_hashes: chunks.map(c => this._computeChunkHash(c.text)),
        canonical_hash: null,
        embeddings: chunks.map((c, i) => ({
          chunk_id: c.id,
          text: c.text,
          vector: null, // Will be filled by ExecutionRuntime after infrastructure call
          dimension: null,
          chunk_hash: this._computeChunkHash(c.text),
          vector_id: this._identityAuthority.generateId('vector', {
            chunk_id: c.id,
            source_artifact_id: artifact.artifact_id,
            timestamp: this._constitutionalTimeAuthority.now(),
          }),
        })),
        schema_version: '1.0.0',
        authority_version: '1.0.0',
        provider_version: null,
        policy_version: '1.0.0',
        canonical_version: '1.0.0',
        created_at: this._constitutionalTimeAuthority.now(),
      };

      // Step 5: Build lineage
      const lineage = [
        {
          parent_artifact_id: artifact.artifact_id,
          child_artifact_id: vectorArtifact.artifact_id,
          edge_type: 'embedding',
          authority: 'embedding-authority',
          execution_id: executionId,
        },
      ];

      // Step 6: Build witness request
      const witnessRequest = {
        data: vectorArtifact,
        metadata: {
          authority: 'embedding-authority',
          execution_id: executionId,
          authority_version: '1.0.0',
          deterministic_ids: {
            artifact_id: vectorArtifact.artifact_id,
            execution_id: executionId,
          },
          canonical_hashes: {
            canonical_hash: vectorArtifact.canonical_hash,
          },
          inputs: {
            source_artifact_id: artifact.artifact_id,
            chunk_count: chunks.length,
          },
        },
      };

      // Step 7: Build certification request
      const certificationRequest = {
        artifact: vectorArtifact,
        checks: ['replay_determinism', 'witness_valid', 'lineage_complete'],
      };

      // Step 8: Build publication request
      const publicationRequest = {
        artifact: vectorArtifact,
        checks: ['certification_valid', 'policy_approved'],
      };

      // Step 9: Build events
      const events = [
        {
          type: 'EmbeddingCreated',
          payload: {
            execution_id: executionId,
            artifact_id: vectorArtifact.artifact_id,
            source_artifact_id: artifact.artifact_id,
            chunks: chunks.length,
          },
        },
      ];

      console.log(`[EmbeddingAuthority] Contract generated: ${vectorArtifact.artifact_id}`);

      // Return contract
      return {
        artifacts: [vectorArtifact],
        lineage: lineage,
        witnesses: [witnessRequest],
        certifications: [certificationRequest],
        publications: [publicationRequest],
        events: events,
        infrastructure: infrastructureCalls,
      };
    } catch (error) {
      console.error(`[EmbeddingAuthority] Contract generation failed:`, error.message);

      const events = [
        {
          type: 'EmbeddingFailed',
          payload: {
            execution_id: executionId,
            error: error.message,
          },
        },
      ];

      return {
        artifacts: [],
        lineage: [],
        witnesses: [],
        certifications: [],
        publications: [],
        events: events,
        infrastructure: [],
      };
    }
  }

  /**
   * Chunk artifact (semantic chunking)
   */
  _chunkArtifact(artifact) {
    const chunks = [];
    const text = CanonicalAuthority.serialize(artifact.data);
    
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    
    let chunkIndex = 0;
    const maxChunkSize = 500; // characters
    const overlap = 50; // characters
    
    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxChunkSize) {
        // Small paragraph fits in one chunk
        chunks.push({
          id: `chunk-${artifact.artifact_id}-${chunkIndex++}`,
          text: paragraph,
          start_index: text.indexOf(paragraph),
          end_index: text.indexOf(paragraph) + paragraph.length,
        });
      } else {
        // Large paragraph needs sentence-level chunking
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        let chunkStart = 0;
        
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= maxChunkSize) {
            currentChunk += sentence + ' ';
          } else {
            if (currentChunk) {
              chunks.push({
                id: `chunk-${artifact.artifact_id}-${chunkIndex++}`,
                text: currentChunk.trim(),
                start_index: chunkStart,
                end_index: chunkStart + currentChunk.length,
              });
              chunkStart += currentChunk.length - overlap;
              currentChunk = sentence + ' ';
            } else {
              // Sentence is too long, force split
              for (let i = 0; i < sentence.length; i += maxChunkSize - overlap) {
                const chunkText = sentence.substring(i, i + maxChunkSize);
                chunks.push({
                  id: `chunk-${artifact.artifact_id}-${chunkIndex++}`,
                  text: chunkText,
                  start_index: chunkStart + i,
                  end_index: chunkStart + i + chunkText.length,
                });
              }
              currentChunk = '';
            }
          }
        }
        
        // Add remaining content
        if (currentChunk) {
          chunks.push({
            id: `chunk-${artifact.artifact_id}-${chunkIndex++}`,
            text: currentChunk.trim(),
            start_index: chunkStart,
            end_index: chunkStart + currentChunk.length,
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Compute chunk hash
   */
  _computeChunkHash(text) {
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(text);
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Embedding authority operational',
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'embedding-authority',
      authority_name: 'EmbeddingAuthority',
      version: '1.0.0',
      consumes: ['ArtifactCreated'],
      produces: ['EmbeddingCreated'],
      replay_inputs: ['ArtifactHash', 'EmbeddingModelVersion', 'EmbeddingPolicyVersion'],
      requires: ['canonicalAuthority', 'artifactBuilder'],
      guarantees: ['pure_function', 'contract_based', 'no_side_effects'],
      failure_modes: ['invalid_input', 'missing_dependencies'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { EmbeddingAuthority };




