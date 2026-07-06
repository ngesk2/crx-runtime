/**
 * Mission Rule Authority
 * 
 * Ω.83 — Mission Authority Policy Separation
 * 
 * Manages constitutional mission rule sets.
 * MissionAuthority consumes mission rules instead of hardcoded policy.
 * 
 * Constitutional Constraint: Policy should never live in MissionAuthority.
 * MissionAuthority should consume a constitutional mission rule set.
 */

const { ConstitutionalObjectFactory, OperationalEnvelope, OperationalMetadataCollector } = require('./operational_envelope');

class MissionRuleAuthority {
  constructor(postgresPool, objectRegistry, witnessChain) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._operationalMetadataCollector = new OperationalMetadataCollector();
    this._ruleCache = new Map(); // rule_id → mission rule
    this._initialized = false;
  }

  /**
   * Initialize mission rule authority
   */
  async initialize() {
    await this._loadRuleCache();
    this._initialized = true;
    console.log('[MissionRuleAuthority] Initialized');
  }

  /**
   * Create mission rule constitutional object
   * 
   * @param {Object} ruleSpec - Mission rule specification
   * @returns {Object} Wrapped mission rule object (constitutional + envelope)
   */
  async createRule(ruleSpec) {
    console.log(`[MissionRuleAuthority] Creating mission rule: ${ruleSpec.rule_id}`);

    try {
      // Create MissionRule constitutional object
      const ruleObject = this._constitutionalObjectFactory.createMissionRuleObject({
        rule_id: ruleSpec.rule_id,
        rule_name: ruleSpec.rule_name,
        rule_type: ruleSpec.rule_type, // 'priority', 'mission_type', 'task_generation'
        conditions: ruleSpec.conditions, // Constitutional conditions for rule application
        actions: ruleSpec.actions, // Constitutional actions when conditions match
        confidence_threshold: ruleSpec.confidence_threshold,
        pattern_matchers: ruleSpec.pattern_matchers,
        priority_mapping: ruleSpec.priority_mapping,
        task_templates: ruleSpec.task_templates,
        authority: 'MissionRuleAuthority',
      });

      // Wrap in operational envelope
      const operationalMetadata = this._operationalMetadataCollector.collect({
        pipeline_stage: 'mission_rule',
        source: 'MissionRuleAuthority',
      });
      const envelope = OperationalEnvelope.wrap(ruleObject, operationalMetadata);

      // Register constitutional object
      await this._objectRegistry.register(ruleObject);

      const wrappedRule = {
        constitutional_object: ruleObject,
        operational_envelope: envelope,
      };

      // Cache rule
      this._ruleCache.set(ruleSpec.rule_id, wrappedRule);
      await this._persistRuleCache(ruleSpec.rule_id, wrappedRule);

      console.log(`[MissionRuleAuthority] Created mission rule: ${ruleSpec.rule_id}`);
      return wrappedRule;
    } catch (error) {
      console.error(`[MissionRuleAuthority] Failed to create mission rule: ${ruleSpec.rule_id}`, error.message);
      throw error;
    }
  }

  /**
   * Get rule by ID
   * 
   * @param {string} ruleId - Rule ID
   * @returns {Object} Wrapped mission rule object
   */
  getRule(ruleId) {
    return this._ruleCache.get(ruleId);
  }

  /**
   * Get rules by type
   * 
   * @param {string} ruleType - Rule type
   * @returns {Array} Array of wrapped mission rule objects
   */
  getRulesByType(ruleType) {
    const allRules = Array.from(this._ruleCache.values());
    return allRules.filter(r => r.constitutional_object.payload.rule_type === ruleType);
  }

  /**
   * Get all rules
   * 
   * @returns {Array} Array of all wrapped mission rule objects
   */
  getAllRules() {
    return Array.from(this._ruleCache.values());
  }

  /**
   * Apply priority rules to determine mission priority
   * 
   * @param {number} confidence - Confidence score
   * @param {Object} context - Additional context
   * @returns {string} Priority
   */
  applyPriorityRules(confidence, context = {}) {
    const priorityRules = this.getRulesByType('priority');
    
    for (const wrappedRule of priorityRules) {
      const rule = wrappedRule.constitutional_object.payload;
      
      if (this._evaluateConditions(rule.conditions, { confidence, ...context })) {
        return rule.actions.priority;
      }
    }

    // Default priority if no rules match
    return 'medium';
  }

  /**
   * Apply mission type rules to determine mission type
   * 
   * @param {Array} patterns - Detected patterns
   * @param {Object} context - Additional context
   * @returns {string} Mission type
   */
  applyMissionTypeRules(patterns, context = {}) {
    const missionTypeRules = this.getRulesByType('mission_type');
    
    for (const wrappedRule of missionTypeRules) {
      const rule = wrappedRule.constitutional_object.payload;
      
      if (this._evaluateConditions(rule.conditions, { patterns, ...context })) {
        return rule.actions.mission_type;
      }
    }

    // Default mission type if no rules match
    return 'improvement';
  }

  /**
   * Apply task generation rules to build tasks
   * 
   * @param {Array} recommendations - Recommendations
   * @param {Object} context - Additional context
   * @returns {Array} Array of tasks
   */
  applyTaskGenerationRules(recommendations, context = {}) {
    const taskRules = this.getRulesByType('task_generation');
    const tasks = [];

    // Generate tasks from recommendations
    for (const recommendation of recommendations) {
      tasks.push(recommendation);
    }

    // Apply task generation rules
    for (const wrappedRule of taskRules) {
      const rule = wrappedRule.constitutional_object.payload;
      
      if (this._evaluateConditions(rule.conditions, { recommendations, ...context })) {
        if (rule.actions.tasks) {
          tasks.push(...rule.actions.tasks);
        }
        if (rule.actions.task_templates) {
          for (const template of rule.actions.task_templates) {
            tasks.push(this._renderTaskTemplate(template, context));
          }
        }
      }
    }

    return tasks;
  }

  /**
   * Evaluate rule conditions
   * 
   * @param {Object} conditions - Rule conditions
   * @param {Object} context - Evaluation context
   * @returns {boolean} Whether conditions match
   */
  _evaluateConditions(conditions, context) {
    if (!conditions) {
      return true;
    }

    for (const [key, condition] of Object.entries(conditions)) {
      if (typeof condition === 'object' && condition !== null) {
        // Nested condition
        if (!this._evaluateConditions(condition, context[key])) {
          return false;
        }
      } else if (Array.isArray(condition)) {
        // Array condition (e.g., pattern matching)
        if (!condition.includes(context[key])) {
          return false;
        }
      } else if (typeof condition === 'function') {
        // Function condition
        if (!condition(context[key], context)) {
          return false;
        }
      } else {
        // Simple equality
        if (context[key] !== condition) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Render task template with context
   * 
   * @param {string} template - Task template
   * @param {Object} context - Template context
   * @returns {string} Rendered task
   */
  _renderTaskTemplate(template, context) {
    let rendered = template;
    
    for (const [key, value] of Object.entries(context)) {
      rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return rendered;
  }

  /**
   * Persist rule cache
   * 
   * @param {string} ruleId - Rule ID
   * @param {Object} wrappedRule - Wrapped mission rule object
   */
  async _persistRuleCache(ruleId, wrappedRule) {
    try {
      await this._postgres.query(`
        INSERT INTO mission_rule_cache (rule_id, constitutional_id, constitutional_hash, operational_metadata, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (rule_id) DO UPDATE SET
          constitutional_id = $2,
          constitutional_hash = $3,
          operational_metadata = $4,
          updated_at = NOW()
      `, [
        ruleId,
        wrappedRule.constitutional_object.id,
        wrappedRule.constitutional_object.canonical_hash,
        JSON.stringify(wrappedRule.operational_envelope.getOperationalMetadata()),
      ]);
    } catch (error) {
      console.error('[MissionRuleAuthority] Failed to persist rule cache:', error.message);
    }
  }

  /**
   * Load rule cache
   */
  async _loadRuleCache() {
    try {
      const result = await this._postgres.query(`
        SELECT rule_id, constitutional_id, constitutional_hash, operational_metadata
        FROM mission_rule_cache
        ORDER BY updated_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._ruleCache.set(row.rule_id, {
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
      console.error('[MissionRuleAuthority] Failed to load rule cache:', error.message);
    }
  }

  /**
   * Clear rule cache (memory only)
   */
  clearRuleCache() {
    this._ruleCache.clear();
  }
}

module.exports = { MissionRuleAuthority };
