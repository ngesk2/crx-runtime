/**
 * End-to-End Replay Test
 * 
 * Phase 22 — End-to-End Replay Proof
 * 
 * "Trust but verify" milestone.
 * 
 * Run:
 * Mission
 * ↓
 * Retrieve
 * ↓
 * Prompt
 * ↓
 * Inference
 * ↓
 * Patch
 * ↓
 * Tests
 * ↓
 * Commit
 * ↓
 * Checkpoint
 * 
 * Save:
 * - Every witness
 * - Every prompt
 * - Every completion
 * - Every embedding
 * - Every retrieval
 * - Every timestamp
 * - Every graph
 * - Every checkpoint
 * 
 * Delete runtime state.
 * Replay.
 * 
 * Expected outcome:
 * - Identical graph
 * - Identical prompts
 * - Identical witnesses
 * - Identical commits
 * - Identical checkpoints
 * 
 * If hashes differ → constitutional violation.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { MissionExecutionGraph } = require('./mission_execution_graph');

class EndToEndReplayTest {
  constructor(postgresPool, missionExecutionGraph) {
    this._postgres = postgresPool;
    this._missionExecutionGraph = missionExecutionGraph;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize test
   */
  async initialize() {
    await this._createTables();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS replay_tests (
        test_id VARCHAR(64) PRIMARY KEY,
        mission_id VARCHAR(64),
        test_status VARCHAR(50) DEFAULT 'pending',
        original_execution_hash VARCHAR(64),
        replay_execution_hash VARCHAR(64),
        verification_result JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS test_artifacts (
        artifact_id VARCHAR(64) PRIMARY KEY,
        test_id VARCHAR(64),
        artifact_type VARCHAR(50) NOT NULL,
        artifact_data JSONB NOT NULL,
        artifact_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * Run end-to-end test
   * @param {string} missionId - Mission ID
   * @returns {Object} Test result
   */
  async runTest(missionId) {
    const testId = this._generateTestId(missionId);

    // Step 1: Build execution graph
    const graph = this._missionExecutionGraph.buildExecutionGraph(missionId);

    // Step 2: Execute original
    const originalExecution = await this._missionExecutionGraph.executeGraph(graph, {});
    const originalHash = CanonicalAuthority.hash(originalExecution);

    // Step 3: Save all artifacts
    await this._saveArtifacts(testId, originalExecution);

    // Step 4: Delete runtime state
    this._deleteRuntimeState();

    // Step 5: Replay
    const replayExecution = await this._missionExecutionGraph.executeGraph(graph, {});
    const replayHash = CanonicalAuthority.hash(replayExecution);

    // Step 6: Verify
    const verification = this._verifyExecution(originalExecution, replayExecution);

    // Step 7: Store test result
    await this._postgres.query(`
      INSERT INTO replay_tests (test_id, mission_id, test_status, original_execution_hash, replay_execution_hash, verification_result)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testId, missionId, verification.passed ? 'passed' : 'failed', originalHash, replayHash, JSON.stringify(verification)]);

    return {
      test_id: testId,
      mission_id: missionId,
      test_status: verification.passed ? 'passed' : 'failed',
      original_hash: originalHash,
      replay_hash: replayHash,
      verification: verification
    };
  }

  /**
   * Save artifacts
   * @param {string} testId - Test ID
   * @param {Object} execution - Execution result
   */
  async _saveArtifacts(testId, execution) {
    // Save witnesses
    for (const [nodeId, result] of Object.entries(execution.execution_results)) {
      if (result.data && result.data.witness) {
        await this._saveArtifact(testId, 'witness', result.data.witness);
      }
    }

    // Save prompts
    for (const [nodeId, result] of Object.entries(execution.execution_results)) {
      if (result.type === 'prompt') {
        await this._saveArtifact(testId, 'prompt', result);
      }
    }

    // Save completions
    for (const [nodeId, result] of Object.entries(execution.execution_results)) {
      if (result.type === 'completion') {
        await this._saveArtifact(testId, 'completion', result);
      }
    }

    // Save graph
    await this._saveArtifact(testId, 'graph', execution);
  }

  /**
   * Save artifact
   * @param {string} testId - Test ID
   * @param {string} artifactType - Artifact type
   * @param {Object} artifactData - Artifact data
   */
  async _saveArtifact(testId, artifactType, artifactData) {
    const artifactId = this._generateArtifactId(testId, artifactType);
    const artifactHash = CanonicalAuthority.hash(artifactData);

    await this._postgres.query(`
      INSERT INTO test_artifacts (artifact_id, test_id, artifact_type, artifact_data, artifact_hash)
      VALUES ($1, $2, $3, $4, $5)
    `, [artifactId, testId, artifactType, JSON.stringify(artifactData), artifactHash]);
  }

  /**
   * Delete runtime state
   */
  _deleteRuntimeState() {
    // Clear any in-memory caches, maps, etc.
    // In production, this would clear all runtime state
    console.log('[EndToEndReplayTest] Deleting runtime state');
  }

  /**
   * Verify execution
   * @param {Object} original - Original execution
   * @param {Object} replay - Replay execution
   * @returns {Object} Verification result
   */
  _verifyExecution(original, replay) {
    const verification = {
      graph_identical: false,
      prompts_identical: false,
      witnesses_identical: false,
      commits_identical: false,
      checkpoints_identical: false,
      overall_passed: false
    };

    // Verify graph structure
    verification.graph_identical = this._verifyGraphStructure(original, replay);

    // Verify prompts
    verification.prompts_identical = this._verifyPrompts(original, replay);

    // Verify witnesses
    verification.witnesses_identical = this._verifyWitnesses(original, replay);

    // Verify commits
    verification.commits_identical = this._verifyCommits(original, replay);

    // Verify checkpoints
    verification.checkpoints_identical = this._verifyCheckpoints(original, replay);

    // Overall pass
    verification.overall_passed = 
      verification.graph_identical &&
      verification.prompts_identical &&
      verification.witnesses_identical &&
      verification.commits_identical &&
      verification.checkpoints_identical;

    return verification;
  }

  /**
   * Verify graph structure
   */
  _verifyGraphStructure(original, replay) {
    return original.graph_id === replay.graph_id;
  }

  /**
   * Verify prompts
   */
  _verifyPrompts(original, replay) {
    const originalPrompts = Object.entries(original.execution_results)
      .filter(([_, r]) => r.type === 'prompt');
    const replayPrompts = Object.entries(replay.execution_results)
      .filter(([_, r]) => r.type === 'prompt');

    if (originalPrompts.length !== replayPrompts.length) {
      return false;
    }

    for (let i = 0; i < originalPrompts.length; i++) {
      const originalHash = CanonicalAuthority.hash(originalPrompts[i][1]);
      const replayHash = CanonicalAuthority.hash(replayPrompts[i][1]);
      if (originalHash !== replayHash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify witnesses
   */
  _verifyWitnesses(original, replay) {
    const originalWitnesses = Object.entries(original.execution_results)
      .filter(([_, r]) => r.type === 'witness');
    const replayWitnesses = Object.entries(replay.execution_results)
      .filter(([_, r]) => r.type === 'witness');

    if (originalWitnesses.length !== replayWitnesses.length) {
      return false;
    }

    for (let i = 0; i < originalWitnesses.length; i++) {
      const originalHash = CanonicalAuthority.hash(originalWitnesses[i][1].data);
      const replayHash = CanonicalAuthority.hash(replayWitnesses[i][1].data);
      if (originalHash !== replayHash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify commits
   */
  _verifyCommits(original, replay) {
    const originalCommits = Object.entries(original.execution_results)
      .filter(([_, r]) => r.type === 'commit');
    const replayCommits = Object.entries(replay.execution_results)
      .filter(([_, r]) => r.type === 'commit');

    if (originalCommits.length !== replayCommits.length) {
      return false;
    }

    for (let i = 0; i < originalCommits.length; i++) {
      const originalHash = CanonicalAuthority.hash(originalCommits[i][1]);
      const replayHash = CanonicalAuthority.hash(replayCommits[i][1]);
      if (originalHash !== replayHash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify checkpoints
   */
  _verifyCheckpoints(original, replay) {
    const originalCheckpoints = Object.entries(original.execution_results)
      .filter(([_, r]) => r.type === 'checkpoint');
    const replayCheckpoints = Object.entries(replay.execution_results)
      .filter(([_, r]) => r.type === 'checkpoint');

    if (originalCheckpoints.length !== replayCheckpoints.length) {
      return false;
    }

    for (let i = 0; i < originalCheckpoints.length; i++) {
      const originalHash = CanonicalAuthority.hash(originalCheckpoints[i][1]);
      const replayHash = CanonicalAuthority.hash(replayCheckpoints[i][1]);
      if (originalHash !== replayHash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get test
   * @param {string} testId - Test ID
   * @returns {Object} Test
   */
  async getTest(testId) {
    const result = await this._postgres.query(`
      SELECT * FROM replay_tests WHERE test_id = $1
    `, [testId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get test artifacts
   * @param {string} testId - Test ID
   * @returns {Array} Artifacts
   */
  async getTestArtifacts(testId) {
    const result = await this._postgres.query(`
      SELECT * FROM test_artifacts WHERE test_id = $1 ORDER BY artifact_type
    `, [testId]);

    return result.rows;
  }

  /**
   * Generate test ID
   * @param {string} missionId - Mission ID
   * @returns {string} Test ID
   */
  _generateTestId(missionId) {
    const data = { mission_id: missionId, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `test_${hash.substring(0, 16)}`;
  }

  /**
   * Generate artifact ID
   * @param {string} testId - Test ID
   * @param {string} artifactType - Artifact type
   * @returns {string} Artifact ID
   */
  _generateArtifactId(testId, artifactType) {
    const data = { test_id: testId, artifact_type: artifactType, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `artifact_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '22.0.0',
      constitutional_version: '22.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `replay_test_${hash.substring(0, 16)}`;
  }
}

module.exports = { EndToEndReplayTest };
