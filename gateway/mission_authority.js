/**
 * Mission Authority
 * 
 * Ω.70 — Mission Authority
 * 
 * Compiles Mission constitutional objects from ReflectionObjects and RepositoryGraphs.
 * 
 * Constitutional Constraint: Mission Authority owns Mission object creation.
 * Mission generation consumes ReflectionObjects and RepositoryGraphs, not hardcoded policy.
 * Mission Authority consumes constitutional mission rule set instead of hardcoded policy.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');
const { MissionRuleAuthority } = require('./mission_rule_authority');

class MissionAuthority {
  constructor(postgresPool, objectRegistry, witnessChain, missionRuleAuthority) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._missionRuleAuthority = missionRuleAuthority || new MissionRuleAuthority(postgresPool, objectRegistry, witnessChain);
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._missionCache = new Map(); // source_id → mission objects
    this._initialized = false;
  }

  /**
   * Initialize mission authority
   */
  async initialize() {
    await this._missionRuleAuthority.initialize();
    await this._loadMissionCache();
    this._initialized = true;
    console.log('[MissionAuthority] Initialized');
  }

  /**
   * Compile Mission constitutional objects from ReflectionObjects and RepositoryGraphs
   * 
   * @param {Array} wrappedReflections - Array of wrapped reflection objects
   * @param {Object} repositoryGraphs - Repository graph roots
   * @param {Object} repositoryRoot - Repository root object
   * @returns {Array} Array of wrapped mission objects (constitutional + envelope)
   */
  async compile(wrappedReflections, repositoryGraphs, repositoryRoot) {
    console.log(`[MissionAuthority] Compiling missions from ${wrappedReflections.length} reflections`);

    const wrappedMissions = [];

    for (const wrappedReflection of wrappedReflections) {
      const reflectionObject = wrappedReflection.constitutional_object;

      try {
        // Generate mission from reflection and repository graphs
        const missionData = await this._generateMissionFromReflection(reflectionObject, repositoryGraphs, repositoryRoot);
        
        if (!missionData) {
          continue;
        }

        // Create Mission constitutional object
        const missionObject = this._constitutionalObjectFactory.createMissionObject({
          reasoning: missionData.reasoning,
          tasks: missionData.tasks,
          priority: missionData.priority,
          target_id: repositoryRoot.constitutional_object.id,
          target_kind: 'Repository',
          authority: 'MissionAuthority',
          mission_type: missionData.mission_type || 'improvement',
        });

        // Wrap in operational envelope
        const operationalMetadata = this._operationalMetadataCollector.collect({
          pipeline_stage: 'mission',
          source: 'MissionAuthority',
        });
        const envelope = OperationalEnvelope.wrap(missionObject, operationalMetadata);

        // Register constitutional object
        await this._objectRegistry.register(missionObject);

        wrappedMissions.push({
          constitutional_object: missionObject,
          operational_envelope: envelope,
          source_reflection_id: reflectionObject.id,
        });

        // Cache mission
        this._missionCache.set(missionObject.id, {
          constitutional_object: missionObject,
          operational_envelope: envelope,
        });
      } catch (error) {
        console.error(`[MissionAuthority] Failed to generate mission from reflection: ${reflectionObject.id}`, error.message);
      }
    }

    await this._persistMissionCache();

    console.log(`[MissionAuthority] Compiled ${wrappedMissions.length} missions`);
    return wrappedMissions;
  }

  /**
   * Generate mission from reflection and repository graphs
   * 
   * Constitutional Constraint: Mission generation derives from constitutional graphs, not hardcoded policy.
   * Mission Authority consumes constitutional mission rule set instead of hardcoded policy.
   * 
   * @param {Object} reflectionObject - Reflection constitutional object
   * @param {Object} repositoryGraphs - Repository graph roots
   * @param {Object} repositoryRoot - Repository root object
   * @returns {Object} Mission data
   */
  async _generateMissionFromReflection(reflectionObject, repositoryGraphs, repositoryRoot) {
    const insights = reflectionObject.payload.insights || [];
    const confidence = reflectionObject.payload.confidence || 0;
    const patterns = reflectionObject.payload.patterns || [];
    const recommendations = reflectionObject.payload.recommendations || [];

    // Generate mission reasoning from reflection insights
    const reasoning = this._buildReasoning(insights, patterns, recommendations);

    // Generate tasks using mission rule authority instead of hardcoded policy
    const context = {
      repository_graphs: repositoryGraphs,
      reflection_confidence: confidence,
    };
    const tasks = this._missionRuleAuthority.applyTaskGenerationRules(recommendations, context);

    // Determine priority using mission rule authority instead of hardcoded policy
    const priority = this._missionRuleAuthority.applyPriorityRules(confidence, context);

    // Determine mission type using mission rule authority instead of hardcoded policy
    const missionType = this._missionRuleAuthority.applyMissionTypeRules(patterns, context);

    if (tasks.length === 0) {
      return null;
    }

    return {
      reasoning: reasoning,
      tasks: tasks,
      priority: priority,
      mission_type: missionType,
    };
  }

  /**
   * Build reasoning from reflection data
   * 
   * @param {Array} insights - Reflection insights
   * @param {Array} patterns - Detected patterns
   * @param {Array} recommendations - Recommendations
   * @returns {string} Reasoning
   */
  _buildReasoning(insights, patterns, recommendations) {
    const parts = [];

    if (insights.length > 0) {
      parts.push('Insights: ' + insights.join('; '));
    }

    if (patterns.length > 0) {
      parts.push('Patterns: ' + patterns.join(', '));
    }

    if (recommendations.length > 0) {
      parts.push('Recommendations: ' + recommendations.join('; '));
    }

    return parts.join('. ');
  }

  /**
   * Get mission by ID
   * 
   * @param {string} missionId - Mission ID
   * @returns {Object} Wrapped mission object
   */
  getMission(missionId) {
    return this._missionCache.get(missionId);
  }

  /**
   * Get missions by source reflection
   * 
   * @param {string} reflectionId - Reflection ID
   * @returns {Array} Array of wrapped mission objects
   */
  getMissionsByReflection(reflectionId) {
    const allMissions = Array.from(this._missionCache.values());
    return allMissions.filter(m => m.constitutional_object.lineage.source_id === reflectionId);
  }

  /**
   * Get all missions
   * 
   * @returns {Array} Array of all wrapped mission objects
   */
  getAllMissions() {
    return Array.from(this._missionCache.values());
  }

  /**
   * Get missions by priority
   * 
   * @param {string} priority - Priority level
   * @returns {Array} Array of wrapped mission objects
   */
  getMissionsByPriority(priority) {
    const allMissions = this.getAllMissions();
    return allMissions.filter(m => m.constitutional_object.payload.priority === priority);
  }

  /**
   * Get statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    const missions = this.getAllMissions();
    
    const stats = {
      total_missions: missions.length,
      by_priority: {},
      by_mission_type: {},
      average_tasks_per_mission: 0,
      total_tasks: 0,
    };

    for (const mission of missions) {
      const priority = mission.constitutional_object.payload.priority;
      const missionType = mission.constitutional_object.payload.mission_type;
      const taskCount = mission.constitutional_object.payload.tasks.length;

      stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
      stats.by_mission_type[missionType] = (stats.by_mission_type[missionType] || 0) + 1;
      stats.total_tasks += taskCount;
    }

    if (missions.length > 0) {
      stats.average_tasks_per_mission = stats.total_tasks / missions.length;
    }

    return stats;
  }

  /**
   * Persist mission cache
   */
  async _persistMissionCache() {
    try {
      const missionData = Array.from(this._missionCache.entries()).map(([missionId, wrappedMission]) => ({
        mission_id: missionId,
        constitutional_id: wrappedMission.constitutional_object.id,
        constitutional_hash: wrappedMission.constitutional_object.canonical_hash,
        operational_metadata: wrappedMission.operational_envelope.getOperationalMetadata(),
      }));

      // Batch upsert
      for (const data of missionData) {
        await this._postgres.query(`
          INSERT INTO mission_cache (mission_id, constitutional_id, constitutional_hash, operational_metadata, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (mission_id) DO UPDATE SET
            constitutional_id = $2,
            constitutional_hash = $3,
            operational_metadata = $4,
            updated_at = NOW()
        `, [data.mission_id, data.constitutional_id, data.constitutional_hash, JSON.stringify(data.operational_metadata)]);
      }
    } catch (error) {
      console.error('[MissionAuthority] Failed to persist mission cache:', error.message);
    }
  }

  /**
   * Load mission cache
   */
  async _loadMissionCache() {
    try {
      const result = await this._postgres.query(`
        SELECT mission_id, constitutional_id, constitutional_hash, operational_metadata
        FROM mission_cache
        ORDER BY updated_at DESC
        LIMIT 10000
      `);

      for (const row of result.rows) {
        this._missionCache.set(row.mission_id, {
          constitutional_object: {
            id: row.constitutional_id,
            canonical_hash: row.constitutional_hash,
          },
          operational_envelope: {
            getOperationalMetadata: () => row.operational_metadata,
          },
        });
      }
    } catch (error) {
      console.error('[MissionAuthority] Failed to load mission cache:', error.message);
    }
  }

  /**
   * Clear mission cache (memory only)
   */
  clearMissionCache() {
    this._missionCache.clear();
  }
}

module.exports = { MissionAuthority };
