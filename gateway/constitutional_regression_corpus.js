/**
 * Constitutional Regression Corpus
 * 
 * Ω.89 — Regression Repository Corpus with Expected Outcomes
 * 
 * Build a corpus of known repositories with expected outcomes.
 * Every change to the acquisition pipeline should be run against this corpus
 * to detect regressions in parsing, replay, embeddings, or compatibility scoring.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class ConstitutionalRegressionCorpus {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._corpus = new Map(); // repo_id → expected outcomes
  }

  /**
   * Initialize regression corpus with known repositories
   */
  async initialize() {
    console.log('[RegressionCorpus] Initializing regression corpus');

    // Add known repositories with expected outcomes
    await this._addCorpusEntry({
      repo_id: 'ping/gateway',
      repository_path: './',
      expected: {
        object_count_range: [100, 1000],
        embedding_count_range: [100, 1000],
        expected_kinds: ['FileObject', 'ASTObject', 'CanonicalSymbol', 'GraphNode', 'RepositoryObject', 'ReflectionObject', 'MissionObject', 'ProofObject'],
        expected_authorities: ['FilesystemAuthority', 'ParserAuthority', 'CanonicalSymbolAuthority', 'CanonicalGraphAuthority', 'RepositoryAuthority', 'ReflectionAuthority', 'MissionAuthority', 'ProofAuthority'],
        expected_languages: ['javascript'],
        min_architectural_similarity: 0.8,
        min_replay_compatibility: 0.9,
      },
    });

    await this._addCorpusEntry({
      repo_id: 'ping/test-typescript-repo',
      repository_path: './test/fixtures/typescript',
      expected: {
        object_count_range: [10, 100],
        embedding_count_range: [10, 100],
        expected_kinds: ['FileObject', 'ASTObject', 'CanonicalSymbol'],
        expected_authorities: ['FilesystemAuthority', 'ParserAuthority', 'CanonicalSymbolAuthority'],
        expected_languages: ['typescript'],
        min_architectural_similarity: 0.5,
        min_replay_compatibility: 0.7,
      },
    });

    await this._addCorpusEntry({
      repo_id: 'ping/test-rust-repo',
      repository_path: './test/fixtures/rust',
      expected: {
        object_count_range: [10, 100],
        embedding_count_range: [10, 100],
        expected_kinds: ['FileObject', 'ASTObject', 'CanonicalSymbol'],
        expected_authorities: ['FilesystemAuthority', 'ParserAuthority', 'CanonicalSymbolAuthority'],
        expected_languages: ['rust'],
        min_architectural_similarity: 0.5,
        min_replay_compatibility: 0.7,
      },
    });

    await this._addCorpusEntry({
      repo_id: 'ping/test-python-repo',
      repository_path: './test/fixtures/python',
      expected: {
        object_count_range: [10, 100],
        embedding_count_range: [10, 100],
        expected_kinds: ['FileObject', 'ASTObject', 'CanonicalSymbol'],
        expected_authorities: ['FilesystemAuthority', 'ParserAuthority', 'CanonicalSymbolAuthority'],
        expected_languages: ['python'],
        min_architectural_similarity: 0.5,
        min_replay_compatibility: 0.7,
      },
    });

    console.log(`[RegressionCorpus] Initialized with ${this._corpus.size} corpus entries`);
  }

  /**
   * Add corpus entry
   */
  async _addCorpusEntry(entry) {
    this._corpus.set(entry.repo_id, entry);
    await this._persistCorpusEntry(entry);
  }

  /**
   * Persist corpus entry to PostgreSQL
   */
  async _persistCorpusEntry(entry) {
    try {
      await this._postgres.query(`
        INSERT INTO regression_corpus (repo_id, corpus_entry, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          corpus_entry = $2,
          updated_at = NOW()
      `, [entry.repo_id, JSON.stringify(entry)]);
    } catch (error) {
      console.error(`[RegressionCorpus] Failed to persist corpus entry for ${entry.repo_id}:`, error.message);
    }
  }

  /**
   * Run regression tests against corpus
   */
  async runRegressionTests(acquisitionResults) {
    console.log('[RegressionCorpus] Running regression tests');

    const regressionResults = {
      total: this._corpus.size,
      passed: 0,
      failed: 0,
      regressions: [],
    };

    for (const [repoId, corpusEntry] of this._corpus) {
      const result = await this._testCorpusEntry(repoId, corpusEntry, acquisitionResults.get(repoId));
      
      if (result.passed) {
        regressionResults.passed++;
      } else {
        regressionResults.failed++;
        regressionResults.regressions.push(result);
      }
    }

    console.log(`[RegressionCorpus] Regression tests complete: ${regressionResults.passed}/${regressionResults.total} passed`);
    return regressionResults;
  }

  /**
   * Test individual corpus entry
   */
  async _testCorpusEntry(repoId, corpusEntry, acquisitionResult) {
    const result = {
      repo_id: repoId,
      passed: true,
      failures: [],
    };

    if (!acquisitionResult) {
      result.passed = false;
      result.failures.push('No acquisition result found');
      return result;
    }

    const expected = corpusEntry.expected;
    const actual = acquisitionResult;

    // Test object count range
    if (actual.object_count < expected.object_count_range[0] || actual.object_count > expected.object_count_range[1]) {
      result.passed = false;
      result.failures.push(`Object count ${actual.object_count} outside expected range [${expected.object_count_range[0]}, ${expected.object_count_range[1]}]`);
    }

    // Test embedding count range
    if (actual.embedding_count < expected.embedding_count_range[0] || actual.embedding_count > expected.embedding_count_range[1]) {
      result.passed = false;
      result.failures.push(`Embedding count ${actual.embedding_count} outside expected range [${expected.embedding_count_range[0]}, ${expected.embedding_count_range[1]}]`);
    }

    // Test expected kinds
    if (actual.kinds) {
      for (const kind of expected.expected_kinds) {
        if (!actual.kinds.includes(kind)) {
          result.passed = false;
          result.failures.push(`Expected kind ${kind} not found`);
        }
      }
    }

    // Test expected authorities
    if (actual.authorities) {
      for (const authority of expected.expected_authorities) {
        if (!actual.authorities.includes(authority)) {
          result.passed = false;
          result.failures.push(`Expected authority ${authority} not found`);
        }
      }
    }

    // Test expected languages
    if (actual.languages) {
      for (const language of expected.expected_languages) {
        if (!actual.languages.includes(language)) {
          result.passed = false;
          result.failures.push(`Expected language ${language} not found`);
        }
      }
    }

    return result;
  }

  /**
   * Get corpus entry
   */
  getCorpusEntry(repoId) {
    return this._corpus.get(repoId);
  }

  /**
   * Get all corpus entries
   */
  getAllCorpusEntries() {
    return Array.from(this._corpus.values());
  }

  /**
   * Add new corpus entry
   */
  async addCorpusEntry(repoId, repositoryPath, expected) {
    const entry = {
      repo_id: repoId,
      repository_path: repositoryPath,
      expected: expected,
      added_at: constitutionalTimeAuthority.now(),
    };

    await this._addCorpusEntry(entry);
    return entry;
  }

  /**
   * Remove corpus entry
   */
  async removeCorpusEntry(repoId) {
    this._corpus.delete(repoId);
    
    try {
      await this._postgres.query(`
        DELETE FROM regression_corpus
        WHERE repo_id = $1
      `, [repoId]);
    } catch (error) {
      console.error(`[RegressionCorpus] Failed to remove corpus entry for ${repoId}:`, error.message);
    }
  }

  /**
   * Update corpus entry expected outcomes
   */
  async updateCorpusEntry(repoId, expected) {
    const entry = this._corpus.get(repoId);
    if (!entry) {
      throw new Error(`Corpus entry ${repoId} not found`);
    }

    entry.expected = expected;
    await this._persistCorpusEntry(entry);
    return entry;
  }
}

module.exports = { ConstitutionalRegressionCorpus };
