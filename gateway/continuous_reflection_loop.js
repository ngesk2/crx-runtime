/**
 * Continuous Reflection Loop
 * 
 * Ω.25 — Continuous Reflection Loop
 * 
 * Reflection should never run once.
 * 
 * Instead:
 * new replay → reflection → new constitutional objects → mission planner → new missions → execution → new replay → reflection
 * 
 * The runtime literally learns from itself.
 * 
 * Constitutional Constraint: Every replay triggers reflection, which produces new objects and missions.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ContinuousReflectionLoop {
  constructor(postgresPool, objectRegistry, replayLog, reflectionPass, missionPlanner, ollamaAnalyst) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._replayLog = replayLog;
    this._reflectionPass = reflectionPass;
    this._missionPlanner = missionPlanner;
    this._ollamaAnalyst = ollamaAnalyst;
    this._loopInterval = 30000; // 30 seconds default
    this._loopTimer = null;
    this._lastProcessedReplayId = null;
    this._initialized = false;
    this._loopCount = 0;
    this._learningMetrics = {
      reflections_generated: 0,
      objects_produced: 0,
      missions_generated: 0,
      loop_iterations: 0,
    };
  }

  /**
   * Initialize continuous reflection loop
   */
  async initialize() {
    // Load last processed replay ID
    await this._loadLastProcessedReplayId();
    
    // Start the loop
    this._startLoop();
    
    this._initialized = true;
    console.log('[ContinuousReflectionLoop] Initialized');
  }

  /**
   * Start the reflection loop
   */
  _startLoop() {
    if (this._loopTimer) {
      clearInterval(this._loopTimer);
    }

    this._loopTimer = setInterval(async () => {
      await this._runReflectionCycle();
    }, this._loopInterval);

    console.log('[ContinuousReflectionLoop] Loop started with interval:', this._loopInterval, 'ms');
  }

  /**
   * Run a single reflection cycle
   */
  async _runReflectionCycle() {
    try {
      this._loopCount++;
      console.log('[ContinuousReflectionLoop] Starting cycle:', this._loopCount);

      // Get new replay events since last processed
      const newReplayEvents = await this._getNewReplayEvents();

      if (newReplayEvents.length === 0) {
        console.log('[ContinuousReflectionLoop] No new replay events to process');
        return;
      }

      console.log('[ContinuousReflectionLoop] Processing', newReplayEvents.length, 'new replay events');

      // Process each replay event through reflection
      for (const replayEvent of newReplayEvents) {
        await this._processReplayEvent(replayEvent);
      }

      // Update last processed replay ID
      if (newReplayEvents.length > 0) {
        this._lastProcessedReplayId = newReplayEvents[newReplayEvents.length - 1].id;
        await this._saveLastProcessedReplayId();
      }

      console.log('[ContinuousReflectionLoop] Cycle completed:', this._loopCount);
    } catch (error) {
      console.error('[ContinuousReflectionLoop] Cycle failed:', error.message);
    }
  }

  /**
   * Get new replay events since last processed
   */
  async _getNewReplayEvents() {
    try {
      let query = `
        SELECT event_data
        FROM events
        WHERE event_type = 'REPLAY_LOG_ENTRY'
      `;

      const params = [];

      if (this._lastProcessedReplayId) {
        query += ` AND event_id > $1`;
        params.push(this._lastProcessedReplayId);
      }

      query += ` ORDER BY timestamp ASC LIMIT 100`;

      const result = await this._postgres.query(query, params);
      return result.rows.map(row => row.event_data);
    } catch (error) {
      console.error('[ContinuousReflectionLoop] Failed to get new replay events:', error.message);
      return [];
    }
  }

  /**
   * Process a single replay event through reflection
   */
  async _processReplayEvent(replayEvent) {
    console.log('[ContinuousReflectionLoop] Processing replay event:', replayEvent.id);

    // Step 1: Reflection
    const reflectionOutput = await this._reflectionPass.execute({
      id: `reflection-input-${replayEvent.id}`,
      replay_events: [replayEvent],
    });

    // Step 2: Collect reflection objects
    const reflectionObjects = reflectionOutput.objects || [];
    this._learningMetrics.reflections_generated += reflectionObjects.length;
    this._learningMetrics.objects_produced += reflectionObjects.length;

    console.log('[ContinuousReflectionLoop] Generated', reflectionObjects.length, 'reflection objects');

    // Step 3: Ollama analysis of reflection (if available)
    if (this._ollamaAnalyst && reflectionObjects.length > 0) {
      for (const reflectionObj of reflectionObjects) {
        try {
          const analysis = await this._ollamaAnalyst.analyze(
            `Analyze this reflection: ${reflectionObj.kind} - ${reflectionObj.id}`,
            {
              object_ids: [reflectionObj.id],
              source_id: replayEvent.id,
              source_kind: 'ReplayEvent',
              metadata: {
                reflection_type: 'loop_reflection',
              },
            }
          );
          this._learningMetrics.objects_produced++; // Analysis object
        } catch (error) {
          console.error('[ContinuousReflectionLoop] Ollama analysis failed:', error.message);
        }
      }
    }

    // Step 4: Mission Planner on reflection objects
    if (this._missionPlanner && reflectionObjects.length > 0) {
      const missions = await this._missionPlanner.generateMissions(reflectionObjects);
      this._learningMetrics.missions_generated += missions.length;

      console.log('[ContinuousReflectionLoop] Generated', missions.length, 'missions from reflection');

      // Step 5: Execute missions (would trigger new replay events)
      for (const mission of missions) {
        await this._executeMission(mission, replayEvent.id);
      }
    }

    // Step 6: Witness the reflection
    await this._witnessReflection(replayEvent, reflectionObjects);

    console.log('[ContinuousReflectionLoop] Completed processing for:', replayEvent.id);
  }

  /**
   * Execute a mission (would trigger new replay events)
   */
  async _executeMission(mission, sourceReplayId) {
    // This would execute the mission and generate new replay events
    // For now, just log and append to replay log
    console.log('[ContinuousReflectionLoop] Executing mission:', mission.id);

    // Append mission execution to replay log
    await this._replayLog.append({
      type: 'mission_execution',
      mission_id: mission.id,
      source_replay_id: sourceReplayId,
      priority: mission.priority,
      reasoning: mission.reasoning,
    });
  }

  /**
   * Witness the reflection
   */
  async _witnessReflection(replayEvent, reflectionObjects) {
    // This would use WitnessChain to attest to the reflection
    // For now, just log
    console.log('[ContinuousReflectionLoop] Witnessing reflection for:', replayEvent.id);
  }

  /**
   * Load last processed replay ID
   */
  async _loadLastProcessedReplayId() {
    try {
      const result = await this._postgres.query(`
        SELECT value
        FROM system_state
        WHERE key = 'last_processed_replay_id'
      `);

      if (result.rows.length > 0) {
        this._lastProcessedReplayId = result.rows[0].value;
        console.log('[ContinuousReflectionLoop] Loaded last processed replay ID:', this._lastProcessedReplayId);
      }
    } catch (error) {
      console.error('[ContinuousReflectionLoop] Failed to load last processed replay ID:', error.message);
    }
  }

  /**
   * Save last processed replay ID
   */
  async _saveLastProcessedReplayId() {
    try {
      await this._postgres.query(`
        INSERT INTO system_state (key, value, updated_at)
        VALUES ('last_processed_replay_id', $1, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = $1,
          updated_at = NOW()
      `, [this._lastProcessedReplayId]);
    } catch (error) {
      console.error('[ContinuousReflectionLoop] Failed to save last processed replay ID:', error.message);
    }
  }

  /**
   * Stop the reflection loop
   */
  stopLoop() {
    if (this._loopTimer) {
      clearInterval(this._loopTimer);
      this._loopTimer = null;
    }
    console.log('[ContinuousReflectionLoop] Loop stopped');
  }

  /**
   * Trigger manual reflection cycle
   */
  async triggerManualCycle() {
    console.log('[ContinuousReflectionLoop] Triggering manual cycle');
    await this._runReflectionCycle();
  }

  /**
   * Get learning metrics
   */
  getLearningMetrics() {
    return { ...this._learningMetrics };
  }

  /**
   * Get loop status
   */
  getLoopStatus() {
    return {
      initialized: this._initialized,
      running: this._loopTimer !== null,
      loop_count: this._loopCount,
      interval_ms: this._loopInterval,
      last_processed_replay_id: this._lastProcessedReplayId,
      metrics: this.getLearningMetrics(),
    };
  }

  /**
   * Reset learning metrics
   */
  resetLearningMetrics() {
    this._learningMetrics = {
      reflections_generated: 0,
      objects_produced: 0,
      missions_generated: 0,
      loop_iterations: 0,
    };
    this._loopCount = 0;
  }

  /**
   * Set loop interval
   */
  setLoopInterval(intervalMs) {
    this._loopInterval = intervalMs;
    if (this._loopTimer) {
      this._startLoop();
    }
    console.log('[ContinuousReflectionLoop] Loop interval set to:', intervalMs, 'ms');
  }
}

module.exports = { ContinuousReflectionLoop };
