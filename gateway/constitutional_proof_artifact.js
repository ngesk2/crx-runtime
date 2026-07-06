/**
 * Constitutional Proof Artifact
 * 
 * Ω.33 — Constitutional Proof CI
 * 
 * Every Git acquisition automatically executes the full sovereignty pipeline:
 * Git Commit → Acquire → Compile → Canonical Objects → Replay → Witness → Reflection → Mission → Embeddings → Constitutional Proof
 * 
 * The proof artifact is a first-class Constitutional Object with a Merkle root over every subsystem:
 * 
 * Proof Root
 * │
 * ├── Compiler Root
 * ├── Replay Root
 * ├── Witness Root
 * ├── Reflection Root
 * ├── Embedding Root
 * ├── Analysis Root
 * ├── Mission Root
 * ├── Git Root
 * └── Authority Root
 * 
 * Constitutional Constraint: Proofs are replayable, witnessed, and queryable like everything else.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');

class ConstitutionalProofArtifact {
  constructor(postgresPool, validationHarness, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._validationHarness = validationHarness;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._proofStore = new Map(); // commit_sha → proof object
  }

  /**
   * Generate proof Constitutional Object from validation result
   */
  async generateProofObject(proofData) {
    const { CanonicalAuthority } = require('./canonical_authority');
    
    // Compute Merkle root over all subsystem roots
    const proofRoot = this._computeMerkleRoot({
      compiler_root: proofData.compiler_root,
      replay_root: proofData.replay_root,
      witness_root: proofData.witness_root,
      mission_root: proofData.mission_root,
      reflection_root: proofData.reflection_root,
      embedding_root: proofData.embedding_root,
      analysis_root: proofData.analysis_root,
      git_root: proofData.git_root,
      authority_root: proofData.authority_root,
    });

    // Create ProofObject as Constitutional Object
    const proofObject = {
      id: `proof-${proofData.commit_sha}`,
      kind: 'Proof',
      canonical_hash: CanonicalAuthority.hash({
        proof_root: proofRoot,
        commit_sha: proofData.commit_sha,
        repository: proofData.repository,
        subsystem_roots: {
          compiler_root: proofData.compiler_root,
          replay_root: proofData.replay_root,
          witness_root: proofData.witness_root,
          mission_root: proofData.mission_root,
          reflection_root: proofData.reflection_root,
          embedding_root: proofData.embedding_root,
          analysis_root: proofData.analysis_root,
          git_root: proofData.git_root,
          authority_root: proofData.authority_root,
        },
      }),
      payload: {
        proof_root: proofRoot,
        commit_sha: proofData.commit_sha,
        repository: proofData.repository,
        timestamp: proofData.timestamp,
        duration_ms: proofData.duration_ms,
        subsystem_roots: {
          compiler_root: proofData.compiler_root,
          replay_root: proofData.replay_root,
          witness_root: proofData.witness_root,
          mission_root: proofData.mission_root,
          reflection_root: proofData.reflection_root,
          embedding_root: proofData.embedding_root,
          analysis_root: proofData.analysis_root,
          git_root: proofData.git_root,
          authority_root: proofData.authority_root,
        },
        validation: proofData.validation,
        hash_counts: {
          objects: proofData.object_hashes?.length || 0,
          replay: proofData.replay_hashes?.length || 0,
          witness: proofData.witness_hashes?.length || 0,
          mission: proofData.mission_hashes?.length || 0,
          reflection: proofData.reflection_hashes?.length || 0,
          ollama_evidence: proofData.ollama_evidence?.length || 0,
          embeddings: proofData.embedding_hashes?.length || 0,
        },
      },
      authority: 'ConstitutionalProofCI',
      identity: {
        created_at: proofData.timestamp,
        version: '1.0.0',
      },
      lineage: {
        source_id: proofData.commit_sha,
        source_kind: 'GitCommit',
      },
      relationships: [
        {
          target_id: proofData.commit_sha,
          relation: 'proves',
        },
        {
          target_id: proofData.compiler_root,
          relation: 'includes',
        },
        {
          target_id: proofData.replay_root,
          relation: 'includes',
        },
        {
          target_id: proofData.witness_root,
          relation: 'includes',
        },
        {
          target_id: proofData.mission_root,
          relation: 'includes',
        },
        {
          target_id: proofData.reflection_root,
          relation: 'includes',
        },
        {
          target_id: proofData.embedding_root,
          relation: 'includes',
        },
        {
          target_id: proofData.authority_root,
          relation: 'includes',
        },
      ],
      metadata: {
        schema_version: '1.0.0',
        merkle_root: proofRoot,
      },
    };

    // Register proof object
    await this._objectRegistry.register(proofObject);
    
    // Witness the proof
    if (this._witnessChain) {
      await this._witnessChain.append({
        proof_id: proofObject.id,
        proof_root: proofRoot,
        commit_sha: proofData.commit_sha,
        repository: proofData.repository,
        deterministic_pass: proofData.validation.runtime_sovereignty === 'PASS',
      });
    }

    // Store proof
    this._proofStore.set(proofData.commit_sha, proofObject);

    return proofObject;
  }

  /**
   * Compute Merkle root over subsystem roots
   */
  _computeMerkleRoot(roots) {
    const { CanonicalAuthority } = require('./canonical_authority');
    
    // Sort keys for canonical ordering
    const sortedKeys = Object.keys(roots).sort();
    const leafHashes = sortedKeys.map(key => CanonicalAuthority.hash(roots[key]));
    
    // Compute Merkle root from leaf hashes
    return this._computeMerkleRootFromLeaves(leafHashes);
  }

  /**
   * Compute Merkle root from leaf hashes
   */
  _computeMerkleRootFromLeaves(hashes) {
    if (hashes.length === 0) {
      return null;
    }
    
    if (hashes.length === 1) {
      return hashes[0];
    }
    
    // Pair and hash
    const nextLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = (i + 1 < hashes.length) ? hashes[i + 1] : hashes[i];
      const combined = left + right;
      const hash = CanonicalAuthority.hash(combined);
      nextLevel.push(hash);
    }
    
    return this._computeMerkleRootFromLeaves(nextLevel);
  }

  /**
   * Format check as ✓ or ✗
   */
  _formatCheck(value) {
    return value ? '✓' : '✗';
  }

  /**
   * Render proof object as text
   */
  renderAsText(proofObject) {
    const lines = [
      'Constitutional Proof',
      '='.repeat(50),
      '',
      `Repository: ${proofObject.payload.repository}`,
      `Commit: ${proofObject.payload.commit_sha}`,
      `Timestamp: ${proofObject.payload.timestamp}`,
      `Duration: ${proofObject.payload.duration_ms}ms`,
      '',
      'Proof Root:',
      `  ${proofObject.payload.proof_root}`,
      '',
      'Subsystem Roots:',
      `  Compiler Root: ${proofObject.payload.subsystem_roots.compiler_root}`,
      `  Replay Root: ${proofObject.payload.subsystem_roots.replay_root}`,
      `  Witness Root: ${proofObject.payload.subsystem_roots.witness_root}`,
      `  Mission Root: ${proofObject.payload.subsystem_roots.mission_root}`,
      `  Reflection Root: ${proofObject.payload.subsystem_roots.reflection_root}`,
      `  Embedding Root: ${proofObject.payload.subsystem_roots.embedding_root}`,
      `  Analysis Root: ${proofObject.payload.subsystem_roots.analysis_root}`,
      `  Git Root: ${proofObject.payload.subsystem_roots.git_root}`,
      `  Authority Root: ${proofObject.payload.subsystem_roots.authority_root}`,
      '',
      'Validation:',
      `  All hashes reproducible: ${this._formatCheck(proofObject.payload.validation.all_hashes_reproducible)}`,
      `  Replay deterministic: ${this._formatCheck(proofObject.payload.validation.replay_deterministic)}`,
      `  Witness deterministic: ${this._formatCheck(proofObject.payload.validation.witness_deterministic)}`,
      `  Mission deterministic: ${this._formatCheck(proofObject.payload.validation.mission_deterministic)}`,
      `  Reflection deterministic: ${this._formatCheck(proofObject.payload.validation.reflection_deterministic)}`,
      `  Embedding provenance complete: ${this._formatCheck(proofObject.payload.validation.embedding_provenance_complete)}`,
      '',
      'Hash Counts:',
      `  Objects: ${proofObject.payload.hash_counts.objects}`,
      `  Replay: ${proofObject.payload.hash_counts.replay}`,
      `  Witness: ${proofObject.payload.hash_counts.witness}`,
      `  Mission: ${proofObject.payload.hash_counts.mission}`,
      `  Reflection: ${proofObject.payload.hash_counts.reflection}`,
      `  Ollama Evidence: ${proofObject.payload.hash_counts.ollama_evidence}`,
      `  Embeddings: ${proofObject.payload.hash_counts.embeddings}`,
      '',
      `Runtime sovereignty: ${proofObject.payload.validation.runtime_sovereignty}`,
      '='.repeat(50),
    ];

    return lines.join('\n');
  }

  /**
   * Render proof object as JSON
   */
  renderAsJSON(proofObject) {
    return JSON.stringify(proofObject, null, 2);
  }

  /**
   * Emit proof object to console
   */
  async emitProof(proofData) {
    const proofObject = await this.generateProofObject(proofData);
    const text = this.renderAsText(proofObject);
    console.log('\n' + text + '\n');
    return proofObject;
  }

  /**
   * Persist proof object to PostgreSQL
   */
  async persistProof(proofObject) {
    try {
      await this._postgres.query(`
        CREATE TABLE IF NOT EXISTS constitutional_proofs (
          id SERIAL PRIMARY KEY,
          object_id VARCHAR(255) NOT NULL UNIQUE,
          commit_sha VARCHAR(64) NOT NULL,
          repository VARCHAR(255) NOT NULL,
          proof_root VARCHAR(64) NOT NULL,
          proof_data JSONB NOT NULL,
          proof_text TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          runtime_sovereignty VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await this._postgres.query(`
        INSERT INTO constitutional_proofs (object_id, commit_sha, repository, proof_root, proof_data, proof_text, timestamp, runtime_sovereignty)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (object_id) DO UPDATE SET
          proof_root = $4,
          proof_data = $5,
          proof_text = $6,
          timestamp = $7,
          runtime_sovereignty = $8,
          created_at = NOW()
      `, [
        proofObject.id,
        proofObject.payload.commit_sha,
        proofObject.payload.repository,
        proofObject.payload.proof_root,
        JSON.stringify(proofObject),
        this.renderAsText(proofObject),
        proofObject.payload.timestamp,
        proofObject.payload.validation.runtime_sovereignty,
      ]);

      console.log(`[ProofArtifact] Proof persisted for commit: ${proofObject.payload.commit_sha}`);
    } catch (error) {
      console.error('[ProofArtifact] Failed to persist proof:', error.message);
    }
  }

  /**
   * Retrieve proof object by commit SHA
   */
  async getProof(commitSha) {
    // Check memory first
    if (this._proofStore.has(commitSha)) {
      return this._proofStore.get(commitSha);
    }

    // Check PostgreSQL
    try {
      const result = await this._postgres.query(`
        SELECT proof_data
        FROM constitutional_proofs
        WHERE commit_sha = $1
      `, [commitSha]);

      if (result.rows.length > 0) {
        const proofObject = result.rows[0].proof_data;
        this._proofStore.set(commitSha, proofObject);
        return proofObject;
      }
    } catch (error) {
      console.error('[ProofArtifact] Failed to retrieve proof:', error.message);
    }

    // Check object registry
    const objectId = `proof-${commitSha}`;
    const obj = await this._objectRegistry.lookupById(objectId);
    if (obj && obj.kind === 'Proof') {
      this._proofStore.set(commitSha, obj);
      return obj;
    }

    return null;
  }

  /**
   * Get all proofs for a repository
   */
  async getProofsByRepository(repository) {
    try {
      const result = await this._postgres.query(`
        SELECT proof_data
        FROM constitutional_proofs
        WHERE repository = $1
        ORDER BY timestamp DESC
      `, [repository]);

      return result.rows.map(row => row.proof_data);
    } catch (error) {
      console.error('[ProofArtifact] Failed to retrieve proofs by repository:', error.message);
      return [];
    }
  }

  /**
   * Get proof statistics
   */
  async getProofStatistics() {
    try {
      const result = await this._postgres.query(`
        SELECT
          COUNT(*) as total_proofs,
          COUNT(CASE WHEN runtime_sovereignty = 'PASS' THEN 1 END) as passed,
          COUNT(CASE WHEN runtime_sovereignty != 'PASS' THEN 1 END) as failed,
          COUNT(DISTINCT repository) as repositories
        FROM constitutional_proofs
      `);

      return result.rows[0];
    } catch (error) {
      console.error('[ProofArtifact] Failed to get statistics:', error.message);
      return {
        total_proofs: 0,
        passed: 0,
        failed: 0,
        repositories: 0,
      };
    }
  }

  /**
   * Generate proof comparison report
   */
  generateComparisonReport(commitSha, proofs) {
    const comparison = {
      commit_sha: commitSha,
      proof_count: proofs.length,
      converged: true,
      divergences: [],
    };

    if (proofs.length < 2) {
      comparison.converged = null;
      return comparison;
    }

    const baseline = proofs[0];

    for (let i = 1; i < proofs.length; i++) {
      const current = proofs[i];

      // Compare proof roots
      if (baseline.payload.proof_root !== current.payload.proof_root) {
        comparison.divergences.push({ type: 'proof_root', run: i });
        comparison.converged = false;
      }

      // Compare subsystem roots
      if (baseline.payload.subsystem_roots.compiler_root !== current.payload.subsystem_roots.compiler_root) {
        comparison.divergences.push({ type: 'compiler_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.replay_root !== current.payload.subsystem_roots.replay_root) {
        comparison.divergences.push({ type: 'replay_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.witness_root !== current.payload.subsystem_roots.witness_root) {
        comparison.divergences.push({ type: 'witness_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.mission_root !== current.payload.subsystem_roots.mission_root) {
        comparison.divergences.push({ type: 'mission_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.reflection_root !== current.payload.subsystem_roots.reflection_root) {
        comparison.divergences.push({ type: 'reflection_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.embedding_root !== current.payload.subsystem_roots.embedding_root) {
        comparison.divergences.push({ type: 'embedding_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.analysis_root !== current.payload.subsystem_roots.analysis_root) {
        comparison.divergences.push({ type: 'analysis_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.git_root !== current.payload.subsystem_roots.git_root) {
        comparison.divergences.push({ type: 'git_root', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.subsystem_roots.authority_root !== current.payload.subsystem_roots.authority_root) {
        comparison.divergences.push({ type: 'authority_root', run: i });
        comparison.converged = false;
      }

      // Compare validation results
      if (baseline.payload.validation.all_hashes_reproducible !== current.payload.validation.all_hashes_reproducible) {
        comparison.divergences.push({ type: 'hash_reproducibility', run: i });
        comparison.converged = false;
      }

      if (baseline.payload.validation.runtime_sovereignty !== current.payload.validation.runtime_sovereignty) {
        comparison.divergences.push({ type: 'runtime_sovereignty', run: i });
        comparison.converged = false;
      }
    }

    return comparison;
  }

  /**
   * Export proof as file
   */
  exportProofAsFile(proofObject, format = 'text') {
    const content = format === 'json' 
      ? this.renderAsJSON(proofObject)
      : this.renderAsText(proofObject);
    
    const extension = format === 'json' ? 'json' : 'txt';
    const filename = `constitutional-proof-${proofObject.payload.commit_sha}.${extension}`;
    
    return {
      filename,
      content,
    };
  }

  /**
   * Get proof store
   */
  getProofStore() {
    return Array.from(this._proofStore.values());
  }

  /**
   * Clear proof store (memory only)
   */
  clearProofStore() {
    this._proofStore.clear();
  }
}

module.exports = { ConstitutionalProofArtifact };
