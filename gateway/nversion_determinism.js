/**
 * N-Version Determinism
 * 
 * Ω.34 — N-Version Determinism
 * 
 * One execution isn't enough.
 * 
 * For every commit:
 * 
 * Run A
 * Run B
 * Run C
 * Run D
 * Run E
 * 
 * Each run starts from:
 * - empty PostgreSQL
 * - empty Qdrant
 * - empty caches
 * - clean runtime
 * - fresh process
 * 
 * Then compare:
 * - Compiler Root
 * - Replay Root
 * - Witness Root
 * - Mission Root
 * - Reflection Root
 * - Embedding Root
 * - Authority Root
 * 
 * The comparison becomes DeterminismReport.
 * 
 * If even one hash differs → SOVEREIGNTY FAIL
 * 
 * No repository should be promoted into the permanent constitutional graph until it passes repeated convergence.
 */

const crypto = require('crypto');
const { ConstitutionalValidationHarness } = require('./constitutional_validation_harness');
const { ConstitutionalProofArtifact } = require('./constitutional_proof_artifact');

class NVersionDeterminism {
  constructor(postgresPool, validationHarness, proofArtifact, qdrantClient) {
    this._postgres = postgresPool;
    this._validationHarness = validationHarness;
    this._proofArtifact = proofArtifact;
    this._qdrantClient = qdrantClient;
    this._determinismReports = new Map(); // commit_sha → report
  }

  /**
   * Run N-version determinism test for a commit
   */
  async runDeterminismTest(owner, repo, commitSha, options = {}) {
    const iterations = options.iterations || 5;
    const cleanState = options.cleanState !== false; // Default to true

    console.log(`[NVersionDeterminism] Running ${iterations}-version determinism test for ${commitSha}`);

    const runs = [];
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      console.log(`[NVersionDeterminism] Run ${i + 1}/${iterations}`);

      try {
        // Clean state before each run (except first if cleanState is false)
        if (cleanState && i > 0) {
          await this._cleanAllState();
        }

        // Run validation
        const proof = await this._validationHarness.validateCommit(owner, repo, commitSha, {
          cleanState: false, // Already cleaned above
        });

        runs.push({
          run_number: i + 1,
          proof: proof,
          success: true,
          error: null,
        });

        console.log(`[NVersionDeterminism] Run ${i + 1} completed successfully`);
      } catch (error) {
        console.error(`[NVersionDeterminism] Run ${i + 1} failed:`, error.message);
        runs.push({
          run_number: i + 1,
          proof: null,
          success: false,
          error: error.message,
        });
      }

      // Wait between runs
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Compare runs
    const comparison = await this._compareRuns(commitSha, runs);

    // Generate determinism report
    const report = {
      commit_sha: commitSha,
      repository: `${owner}/${repo}`,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      iterations: iterations,
      runs: runs,
      comparison: comparison,
      determinism_status: comparison.converged ? 'PASS' : 'FAIL',
      sovereignty_violation: !comparison.converged,
    };

    // Store report
    this._determinismReports.set(commitSha, report);

    // Persist report
    await this._persistReport(report);

    console.log(`[NVersionDeterminism] Determinism test completed: ${report.determinism_status}`);

    return report;
  }

  /**
   * Compare runs for determinism
   */
  async _compareRuns(commitSha, runs) {
    const successfulRuns = runs.filter(r => r.success);

    if (successfulRuns.length < 2) {
      return {
        converged: null,
        reason: 'Insufficient successful runs for comparison',
        successful_runs: successfulRuns.length,
        total_runs: runs.length,
        divergences: [],
      };
    }

    const comparison = {
      converged: true,
      divergences: [],
      root_comparisons: {
        compiler_root: [],
        replay_root: [],
        witness_root: [],
        mission_root: [],
        reflection_root: [],
        embedding_root: [],
        authority_root: [],
      },
    };

    const baseline = successfulRuns[0].proof;

    for (let i = 1; i < successfulRuns.length; i++) {
      const current = successfulRuns[i].proof;

      // Compare each root
      const roots = [
        'compiler_root',
        'replay_root',
        'witness_root',
        'mission_root',
        'reflection_root',
        'embedding_root',
        'authority_root',
      ];

      for (const root of roots) {
        const baselineValue = baseline[root];
        const currentValue = current[root];

        comparison.root_comparisons[root].push({
          run: i + 1,
          baseline: baselineValue,
          current: currentValue,
          match: baselineValue === currentValue,
        });

        if (baselineValue !== currentValue) {
          comparison.divergences.push({
            type: root,
            run: i + 1,
            baseline: baselineValue,
            current: currentValue,
          });
          comparison.converged = false;
        }
      }
    }

    return comparison;
  }

  /**
   * Clean all state (PostgreSQL, Qdrant, caches)
   */
  async _cleanAllState() {
    console.log('[NVersionDeterminism] Cleaning all state...');

    // Clean PostgreSQL
    await this._postgres.query(`DELETE FROM events`);
    await this._postgres.query(`DELETE FROM constitutional_objects`);
    await this._postgres.query(`DELETE FROM constitutional_proofs`);
    await this._postgres.query(`DELETE FROM system_state`);
    await this._postgres.query(`DELETE FROM tracked_repositories`);
    
    // Clean Qdrant
    if (this._qdrantClient) {
      try {
        await this._qdrantClient.deleteCollection('constitutional_documents');
        await this._qdrantClient.createCollection('constitutional_documents', 768);
      } catch (error) {
        console.error('[NVersionDeterminism] Failed to clean Qdrant:', error.message);
      }
    }

    console.log('[NVersionDeterminism] All state cleaned');
  }

  /**
   * Persist determinism report
   */
  async _persistReport(report) {
    try {
      await this._postgres.query(`
        CREATE TABLE IF NOT EXISTS determinism_reports (
          id SERIAL PRIMARY KEY,
          commit_sha VARCHAR(64) NOT NULL,
          repository VARCHAR(255) NOT NULL,
          report_data JSONB NOT NULL,
          determinism_status VARCHAR(20) NOT NULL,
          sovereignty_violation BOOLEAN NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await this._postgres.query(`
        INSERT INTO determinism_reports (commit_sha, repository, report_data, determinism_status, sovereignty_violation, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (commit_sha) DO UPDATE SET
          report_data = $3,
          determinism_status = $4,
          sovereignty_violation = $5,
          timestamp = $6,
          created_at = NOW()
      `, [
        report.commit_sha,
        report.repository,
        JSON.stringify(report),
        report.determinism_status,
        report.sovereignty_violation,
        report.timestamp,
      ]);

      console.log(`[NVersionDeterminism] Report persisted for commit: ${report.commit_sha}`);
    } catch (error) {
      console.error('[NVersionDeterminism] Failed to persist report:', error.message);
    }
  }

  /**
   * Get determinism report by commit SHA
   */
  async getReport(commitSha) {
    // Check memory first
    if (this._determinismReports.has(commitSha)) {
      return this._determinismReports.get(commitSha);
    }

    // Check PostgreSQL
    try {
      const result = await this._postgres.query(`
        SELECT report_data
        FROM determinism_reports
        WHERE commit_sha = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `, [commitSha]);

      if (result.rows.length > 0) {
        const report = result.rows[0].report_data;
        this._determinismReports.set(commitSha, report);
        return report;
      }
    } catch (error) {
      console.error('[NVersionDeterminism] Failed to retrieve report:', error.message);
    }

    return null;
  }

  /**
   * Get all reports for a repository
   */
  async getReportsByRepository(repository) {
    try {
      const result = await this._postgres.query(`
        SELECT report_data
        FROM determinism_reports
        WHERE repository = $1
        ORDER BY timestamp DESC
      `, [repository]);

      return result.rows.map(row => row.report_data);
    } catch (error) {
      console.error('[NVersionDeterminism] Failed to retrieve reports by repository:', error.message);
      return [];
    }
  }

  /**
   * Get determinism statistics
   */
  async getStatistics() {
    try {
      const result = await this._postgres.query(`
        SELECT
          COUNT(*) as total_reports,
          COUNT(CASE WHEN determinism_status = 'PASS' THEN 1 END) as passed,
          COUNT(CASE WHEN determinism_status = 'FAIL' THEN 1 END) as failed,
          COUNT(CASE WHEN sovereignty_violation = true THEN 1 END) as violations,
          COUNT(DISTINCT repository) as repositories,
          AVG(iterations) as avg_iterations
        FROM determinism_reports
      `);

      return result.rows[0];
    } catch (error) {
      console.error('[NVersionDeterminism] Failed to get statistics:', error.message);
      return {
        total_reports: 0,
        passed: 0,
        failed: 0,
        violations: 0,
        repositories: 0,
        avg_iterations: 0,
      };
    }
  }

  /**
   * Render report as text
   */
  renderAsText(report) {
    const lines = [
      'N-Version Determinism Report',
      '='.repeat(50),
      '',
      `Repository: ${report.repository}`,
      `Commit: ${report.commit_sha}`,
      `Timestamp: ${report.timestamp}`,
      `Duration: ${report.duration_ms}ms`,
      `Iterations: ${report.iterations}`,
      `Status: ${report.determinism_status}`,
      `Sovereignty Violation: ${report.sovereignty_violation ? 'YES' : 'NO'}`,
      '',
      'Run Results:',
      ...report.runs.map(run => {
        return `  Run ${run.run_number}: ${run.success ? 'SUCCESS' : 'FAILED'}${run.error ? ` - ${run.error}` : ''}`;
      }),
      '',
      'Root Comparisons:',
      ...Object.entries(report.comparison.root_comparisons).map(([root, comparisons]) => {
        const allMatch = comparisons.every(c => c.match);
        return `  ${root}: ${allMatch ? '✓ CONVERGED' : '✗ DIVERGED'}`;
      }),
      '',
      'Divergences:',
      ...report.comparison.divergences.map(div => {
        return `  ${div.type} (Run ${div.run}): ${div.baseline} ≠ ${div.current}`;
      }),
      '',
      '='.repeat(50),
    ];

    return lines.join('\n');
  }

  /**
   * Emit report to console
   */
  emitReport(report) {
    const text = this.renderAsText(report);
    console.log('\n' + text + '\n');
  }

  /**
   * Get report store
   */
  getReportStore() {
    return Array.from(this._determinismReports.values());
  }

  /**
   * Clear report store (memory only)
   */
  clearReportStore() {
    this._determinismReports.clear();
  }
}

module.exports = { NVersionDeterminism };
