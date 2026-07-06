/**
 * Continuous Background Analyst
 * 
 * Ω.40 — Continuous Background Analyst
 * 
 * The runtime should never wait for someone to ask a question.
 * 
 * Instead a scheduler continuously asks:
 * 
 * New commits?
 * ↓
 * analyze
 * 
 * New reflections?
 * ↓
 * analyze
 * 
 * New missions?
 * ↓
 * analyze
 * 
 * Compiler drift?
 * ↓
 * analyze
 * 
 * Witness failures?
 * ↓
 * analyze
 * 
 * Repository evolution?
 * ↓
 * analyze
 * 
 * It should effectively behave like:
 * 
 * while (alive)
 *   discover
 *   retrieve
 *   analyze
 *   persist
 *   witness
 *   repeat
 * 
 * Constitutional Constraint: Autonomous continuous analysis without human prompts.
 */

const crypto = require('crypto');
const { PersistentOllamaAnalyst } = require('./persistent_ollama_analyst');
const { CanonicalAuthority } = require('./canonical_authority');

class ContinuousBackgroundAnalyst {
  constructor(postgresPool, ollamaAnalyst, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._ollamaAnalyst = ollamaAnalyst;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._schedulerInterval = 60000; // 1 minute default
    this._schedulerTimer = null;
    this._initialized = false;
    this._analysisQueue = new Map(); // analysis_id → analysis task
    this._analysisHistory = new Map(); // analysis_id → result
    this._lastAnalysisTimestamps = new Map(); // analysis_type → timestamp
    this._running = false;
  }

  /**
   * Initialize continuous background analyst
   */
  async initialize() {
    await this._loadAnalysisHistory();
    await this._loadLastAnalysisTimestamps();
    this._startScheduler();
    this._initialized = true;
    this._running = true;
    console.log('[BackgroundAnalyst] Initialized with continuous analysis scheduler');
  }

  /**
   * Start the scheduler
   */
  _startScheduler() {
    if (this._schedulerTimer) {
      clearInterval(this._schedulerTimer);
    }

    this._schedulerTimer = setInterval(async () => {
      await this._runAnalysisCycle();
    }, this._schedulerInterval);

    console.log('[BackgroundAnalyst] Scheduler started with interval:', this._schedulerInterval, 'ms');
  }

  /**
   * Run a single analysis cycle
   */
  async _runAnalysisCycle() {
    if (!this._running) {
      return;
    }

    console.log('[BackgroundAnalyst] Starting analysis cycle');

    try {
      // Discover new commits
      await this._analyzeNewCommits();

      // Discover new reflections
      await this._analyzeNewReflections();

      // Discover new missions
      await this._analyzeNewMissions();

      // Analyze compiler drift
      await this._analyzeCompilerDrift();

      // Analyze witness failures
      await this._analyzeWitnessFailures();

      // Analyze repository evolution
      await this._analyzeRepositoryEvolution();

      console.log('[BackgroundAnalyst] Analysis cycle completed');
    } catch (error) {
      console.error('[BackgroundAnalyst] Analysis cycle failed:', error.message);
    }
  }

  /**
   * Analyze new commits
   */
  async _analyzeNewCommits() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'COMMIT_ACQUIRED'
        AND timestamp > COALESCE(
          (SELECT value FROM system_state WHERE key = 'last_commits_analysis'),
          '1970-01-01'
        )
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Found ${result.rows.length} new commits to analyze`);

      for (const row of result.rows) {
        const commit = row.event_data;
        
        const query = `
Analyze this new commit:
- Repository: ${commit.repo_id}
- Commit SHA: ${commit.commit_sha}
- Message: ${commit.payload.message}
- Author: ${commit.payload.author?.name}

Evaluate:
1. Code quality impact
2. Potential risks
3. Architectural implications
4. Recommended actions
`;

        const analysis = await this._ollamaAnalyst.analyze(query, {
          object_ids: [commit.id],
          source_id: commit.id,
          source_kind: 'Commit',
          metadata: {
            analysis_type: 'new_commit',
          },
        });

        await this._persistAnalysis(analysis);
        await this._witnessAnalysis(analysis);
      }

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_commits_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze new commits:', error.message);
    }
  }

  /**
   * Analyze new reflections
   */
  async _analyzeNewReflections() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'REFLECTION_CREATED'
        AND timestamp > COALESCE(
          (SELECT value FROM system_state WHERE key = 'last_reflections_analysis'),
          '1970-01-01'
        )
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Found ${result.rows.length} new reflections to analyze`);

      for (const row of result.rows) {
        const reflection = row.event_data;
        
        const query = `
Analyze this new reflection:
- Reflection ID: ${reflection.id}
- Type: ${reflection.kind}
- Payload: ${JSON.stringify(reflection.payload, null, 2)}

Evaluate:
1. Reflection quality
2. Actionability
3. Integration with existing knowledge
4. Follow-up recommendations
`;

        const analysis = await this._ollamaAnalyst.analyze(query, {
          object_ids: [reflection.id],
          source_id: reflection.id,
          source_kind: 'Reflection',
          metadata: {
            analysis_type: 'new_reflection',
          },
        });

        await this._persistAnalysis(analysis);
        await this._witnessAnalysis(analysis);
      }

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_reflections_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze new reflections:', error.message);
    }
  }

  /**
   * Analyze new missions
   */
  async _analyzeNewMissions() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'MISSION_CREATED'
        AND timestamp > COALESCE(
          (SELECT value FROM system_state WHERE key = 'last_missions_analysis'),
          '1970-01-01'
        )
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Found ${result.rows.length} new missions to analyze`);

      for (const row of result.rows) {
        const mission = row.event_data;
        
        const query = `
Analyze this new mission:
- Mission ID: ${mission.id}
- Priority: ${mission.priority}
- Reasoning: ${mission.reasoning}
- Tasks: ${JSON.stringify(mission.tasks, null, 2)}

Evaluate:
1. Mission feasibility
2. Resource requirements
3. Risk assessment
4. Execution strategy
`;

        const analysis = await this._ollamaAnalyst.analyze(query, {
          object_ids: [mission.id],
          source_id: mission.id,
          source_kind: 'Mission',
          metadata: {
            analysis_type: 'new_mission',
          },
        });

        await this._persistAnalysis(analysis);
        await this._witnessAnalysis(analysis);
      }

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_missions_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze new missions:', error.message);
    }
  }

  /**
   * Analyze compiler drift
   */
  async _analyzeCompilerDrift() {
    try {
      // Get recent compiler outputs
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'PASS_COMPLETED'
        AND timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        LIMIT 20
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Analyzing compiler drift from ${result.rows.length} compiler passes`);

      const compilerOutputs = result.rows.map(row => row.event_data);
      
      const query = `
Analyze compiler drift from recent compiler passes:
- Total passes: ${compilerOutputs.length}
- Passes: ${compilerOutputs.map(c => c.pass).join(', ')}
- Object counts: ${compilerOutputs.map(c => c.object_count).join(', ')}

Evaluate:
1. Compiler performance trends
2. Object generation consistency
3. Potential anomalies
4. Optimization opportunities
`;

      const analysis = await this._ollamaAnalyst.analyze(query, {
        object_ids: compilerOutputs.map(c => c.output_id),
        source_id: 'compiler_drift_analysis',
        source_kind: 'SystemAnalysis',
        metadata: {
          analysis_type: 'compiler_drift',
        },
      });

      await this._persistAnalysis(analysis);
      await this._witnessAnalysis(analysis);

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_compiler_drift_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze compiler drift:', error.message);
    }
  }

  /**
   * Analyze witness failures
   */
  async _analyzeWitnessFailures() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'WITNESS_FAILURE'
        AND timestamp > COALESCE(
          (SELECT value FROM system_state WHERE key = 'last_witness_analysis'),
          '1970-01-01'
        )
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Found ${result.rows.length} witness failures to analyze`);

      for (const row of result.rows) {
        const failure = row.event_data;
        
        const query = `
Analyze this witness failure:
- Failure ID: ${failure.id}
- Type: ${failure.failure_type}
- Details: ${JSON.stringify(failure.details, null, 2)}

Evaluate:
1. Failure severity
2. Root cause analysis
3. Impact assessment
4. Remediation recommendations
`;

        const analysis = await this._ollamaAnalyst.analyze(query, {
          object_ids: [failure.id],
          source_id: failure.id,
          source_kind: 'WitnessFailure',
          metadata: {
            analysis_type: 'witness_failure',
          },
        });

        await this._persistAnalysis(analysis);
        await this._witnessAnalysis(analysis);
      }

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_witness_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze witness failures:', error.message);
    }
  }

  /**
   * Analyze repository evolution
   */
  async _analyzeRepositoryEvolution() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, COUNT(*) as commit_count, MAX(timestamp) as last_commit
        FROM events
        WHERE event_type = 'COMMIT_ACQUIRED'
        AND timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY repo_id
        ORDER BY commit_count DESC
        LIMIT 10
      `);

      if (result.rows.length === 0) {
        return;
      }

      console.log(`[BackgroundAnalyst] Analyzing evolution of ${result.rows.length} repositories`);

      const repositoryData = result.rows.map(row => ({
        repo_id: row.repo_id,
        commit_count: row.commit_count,
        last_commit: row.last_commit,
      }));

      const query = `
Analyze repository evolution over the last 24 hours:
- Active repositories: ${repositoryData.length}
- Most active: ${repositoryData[0].repo_id} (${repositoryData[0].commit_count} commits)
- Activity data: ${JSON.stringify(repositoryData, null, 2)}

Evaluate:
1. Development velocity trends
2. Repository health indicators
3. Collaboration patterns
4. Risk indicators
`;

      const analysis = await this._ollamaAnalyst.analyze(query, {
        source_id: 'repository_evolution_analysis',
        source_kind: 'SystemAnalysis',
        metadata: {
          analysis_type: 'repository_evolution',
        },
      });

      await this._persistAnalysis(analysis);
      await this._witnessAnalysis(analysis);

      // Update last analysis timestamp
      await this._updateLastAnalysisTimestamp('last_repository_evolution_analysis');
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to analyze repository evolution:', error.message);
    }
  }

  /**
   * Persist analysis
   */
  async _persistAnalysis(analysis) {
    this._analysisHistory.set(analysis.id, analysis);
    
    try {
      await this._postgres.query(`
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ($1, $2, NOW(), $3, $4, $5)
      `, [
        analysis.id,
        'BACKGROUND_ANALYSIS',
        analysis.id,
        'Analysis',
        JSON.stringify(analysis),
      ]);
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to persist analysis:', error.message);
    }
  }

  /**
   * Witness analysis
   */
  async _witnessAnalysis(analysis) {
    if (!this._witnessChain) {
      return;
    }

    try {
      await this._witnessChain.append({
        analysis_id: analysis.id,
        analysis_root: analysis.payload.analysis_root,
        model_id: analysis.payload.model_id,
        context_hash: analysis.payload.context_hash,
        response_hash: analysis.payload.response_hash,
      });
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to witness analysis:', error.message);
    }
  }

  /**
   * Update last analysis timestamp
   */
  async _updateLastAnalysisTimestamp(analysisType) {
    try {
      await this._postgres.query(`
        INSERT INTO system_state (key, value, updated_at)
        VALUES ($1, NOW(), NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = NOW(),
          updated_at = NOW()
      `, [analysisType]);
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to update analysis timestamp:', error.message);
    }
  }

  /**
   * Load analysis history
   */
  async _loadAnalysisHistory() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'BACKGROUND_ANALYSIS'
        ORDER BY timestamp DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        const analysis = row.event_data;
        this._analysisHistory.set(analysis.id, analysis);
      }
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to load analysis history:', error.message);
    }
  }

  /**
   * Load last analysis timestamps
   */
  async _loadLastAnalysisTimestamps() {
    try {
      const result = await this._postgres.query(`
        SELECT key, value
        FROM system_state
        WHERE key LIKE '%_analysis'
      `);

      for (const row of result.rows) {
        this._lastAnalysisTimestamps.set(row.key, row.value);
      }
    } catch (error) {
      console.error('[BackgroundAnalyst] Failed to load last analysis timestamps:', error.message);
    }
  }

  /**
   * Stop the scheduler
   */
  stopScheduler() {
    if (this._schedulerTimer) {
      clearInterval(this._schedulerTimer);
      this._schedulerTimer = null;
    }
    this._running = false;
    console.log('[BackgroundAnalyst] Scheduler stopped');
  }

  /**
   * Start the scheduler
   */
  startScheduler() {
    if (!this._running) {
      this._running = true;
      this._startScheduler();
    }
  }

  /**
   * Trigger manual analysis cycle
   */
  async triggerManualCycle() {
    console.log('[BackgroundAnalyst] Triggering manual analysis cycle');
    await this._runAnalysisCycle();
  }

  /**
   * Set scheduler interval
   */
  setSchedulerInterval(intervalMs) {
    this._schedulerInterval = intervalMs;
    if (this._schedulerTimer) {
      this._startScheduler();
    }
    console.log('[BackgroundAnalyst] Scheduler interval set to:', intervalMs, 'ms');
  }

  /**
   * Get analysis queue
   */
  getAnalysisQueue() {
    return Array.from(this._analysisQueue.values());
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(limit = 100) {
    return Array.from(this._analysisHistory.values())
      .sort((a, b) => new Date(b.identity.created_at) - new Date(a.identity.created_at))
      .slice(0, limit);
  }

  /**
   * Get analysis statistics
   */
  getStatistics() {
    const analyses = this.getAnalysisHistory();
    
    const stats = {
      total_analyses: analyses.length,
      by_type: {},
      by_model: {},
      average_confidence: 0,
    };

    let totalConfidence = 0;

    for (const analysis of analyses) {
      // Count by type
      const type = analysis.metadata?.analysis_type || 'unknown';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;

      // Count by model
      const model = analysis.payload.model_id || 'unknown';
      stats.by_model[model] = (stats.by_model[model] || 0) + 1;

      // Sum confidence
      totalConfidence += analysis.payload.confidence || 0;
    }

    if (analyses.length > 0) {
      stats.average_confidence = totalConfidence / analyses.length;
    }

    return stats;
  }

  /**
   * Clear analysis queue (memory only)
   */
  clearAnalysisQueue() {
    this._analysisQueue.clear();
  }

  /**
   * Clear analysis history (memory only)
   */
  clearAnalysisHistory() {
    this._analysisHistory.clear();
  }
}

module.exports = { ContinuousBackgroundAnalyst };
