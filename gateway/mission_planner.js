/**
 * Mission Planner
 * 
 * Phase 8: Mission Planner consumes Constitutional Objects
 * 
 * Constitutional Constraint: Mission generation should never score directly from runtime state.
 * 
 * Ideal pipeline:
 * Compiler → Objects → Replay → Witness → Evidence Graph → Mission Planner
 * 
 * Every score should cite immutable evidence IDs.
 * 
 * Planner output:
 * Mission → Priority → Reasoning → Evidence → Expected Replay
 * 
 * Mission ranking uses configurable weights:
 * - Replay Weight
 * - Risk
 * - Novelty
 * - Technical Debt
 * - ROI
 * - Confidence
 * 
 * Constitutional Constraint: These weights must come from configuration rather than code.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class MissionPlanner {
  constructor(postgresPool, config = {}) {
    this._postgres = postgresPool;
    this._weights = {
      replay_weight: config.replay_weight || 0.2,
      risk: config.risk || 0.15,
      novelty: config.novelty || 0.2,
      technical_debt: config.technical_debt || 0.15,
      roi: config.roi || 0.2,
      confidence: config.confidence || 0.1,
    };
  }

  /**
   * Update mission weights from configuration
   */
  updateWeights(config) {
    this._weights = {
      replay_weight: config.replay_weight ?? this._weights.replay_weight,
      risk: config.risk ?? this._weights.risk,
      novelty: config.novelty ?? this._weights.novelty,
      technical_debt: config.technical_debt ?? this._weights.technical_debt,
      roi: config.roi ?? this._weights.roi,
      confidence: config.confidence ?? this._weights.confidence,
    };
  }

  /**
   * Generate missions from Constitutional Objects
   * 
   * Constitutional Constraint: Only uses immutable evidence from Constitutional Objects
   */
  async generateMissions(objects) {
    const missions = [];

    for (const obj of objects) {
      const mission = await this._analyzeObjectForMission(obj);
      if (mission) {
        missions.push(mission);
      }
    }

    // Rank missions by score
    const rankedMissions = this._rankMissions(missions);

    return rankedMissions;
  }

  /**
   * Analyze a Constitutional Object to determine if it should generate a mission
   * 
   * Constitutional Constraint: All metrics derived from immutable object data
   */
  async _analyzeObjectForMission(obj) {
    // Only certain object kinds generate missions
    const missionKinds = ['Commit', 'PullRequest', 'Issue', 'Repository'];
    if (!missionKinds.includes(obj.kind)) {
      return null;
    }

    // Calculate mission metrics from immutable object data
    const metrics = this._calculateMissionMetrics(obj);

    // Calculate mission score using configured weights
    const score = this._calculateMissionScore(metrics);

    // Only generate mission if score exceeds threshold
    if (score < 0.3) {
      return null;
    }

    // Generate evidence IDs for each metric
    const evidenceIds = this._generateEvidenceIds(obj, metrics);

    return {
      id: this._generateMissionId(obj),
      kind: 'Mission',
      source_object_id: obj.id,
      source_object_kind: obj.kind,
      source_object_hash: obj.canonical_hash,
      priority: this._calculatePriority(score),
      reasoning: this._generateReasoning(obj, metrics),
      evidence: {
        object_id: obj.id,
        object_hash: obj.canonical_hash,
        evidence_ids: evidenceIds,
        metrics: metrics,
      },
      expected_replay: this._generateExpectedReplay(obj),
      score: score,
      weights: { ...this._weights },
      authority: 'MissionPlanner',
      // Constitutional Constraint: No timestamp - deterministic from object + weights
      status: 'queued',
    };
  }

  /**
   * Calculate mission metrics from immutable Constitutional Object
   * 
   * Constitutional Constraint: All metrics derived from object data only
   */
  _calculateMissionMetrics(obj) {
    return {
      replay_weight: this._calculateReplayWeight(obj),
      risk: this._calculateRisk(obj),
      novelty: this._calculateNovelty(obj),
      technical_debt: this._calculateTechnicalDebt(obj),
      roi: this._calculateROI(obj),
      confidence: this._calculateConfidence(obj),
    };
  }

  /**
   * Generate evidence IDs for each metric
   * 
   * Constitutional Constraint: Every score cites immutable evidence IDs
   */
  _generateEvidenceIds(obj, metrics) {
    const evidenceIds = {
      replay_weight_evidence: obj.id,
      risk_evidence: obj.id,
      novelty_evidence: obj.id,
      technical_debt_ecidence: obj.id,
      roi_evidence: obj.id,
      confidence_evidence: obj.canonical_hash,
    };

    // Add relationship evidence
    if (obj.relationships && obj.relationships.length > 0) {
      evidenceIds.relationship_evidence = obj.relationships.map(r => r.target_id);
    }

    return evidenceIds;
  }

  /**
   * Calculate individual metric scores (0-1)
   */
  _calculateReplayWeight(obj) {
    // Objects with more relationships have higher replay value
    const relationships = obj.relationships?.length || 0;
    return Math.min(relationships / 10, 1);
  }

  _calculateRisk(obj) {
    // PRs and Issues have higher risk
    if (obj.kind === 'PullRequest' || obj.kind === 'Issue') {
      return 0.7;
    }
    return 0.3;
  }

  _calculateNovelty(obj) {
    // Recent objects are more novel
    const created = new Date(obj.identity?.created_at || obj.created_at);
    const daysSinceCreation = (constitutionalTimeAuthority.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSinceCreation / 30);
  }

  _calculateTechnicalDebt(obj) {
    // Commits with many changes indicate technical debt
    if (obj.kind === 'Commit') {
      const changes = obj.payload?.files_changed || 1;
      return Math.min(changes / 20, 1);
    }
    return 0.5;
  }

  _calculateROI(obj) {
    // Repository objects have high ROI
    if (obj.kind === 'Repository') {
      return 0.8;
    }
    return 0.5;
  }

  _calculateConfidence(obj) {
    // Objects with canonical hashes have high confidence
    return obj.canonical_hash ? 0.9 : 0.5;
  }

  /**
   * Calculate mission score using configured weights
   */
  _calculateMissionScore(metrics) {
    return (
      metrics.replay_weight * this._weights.replay_weight +
      metrics.risk * this._weights.risk +
      metrics.novelty * this._weights.novelty +
      metrics.technical_debt * this._weights.technical_debt +
      metrics.roi * this._weights.roi +
      metrics.confidence * this._weights.confidence
    );
  }

  /**
   * Calculate priority level from score
   */
  _calculatePriority(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate reasoning for the mission
   * 
   * Constitutional Constraint: Reasoning cites evidence IDs
   */
  _generateReasoning(obj, metrics) {
    const reasons = [];

    if (metrics.novelty > 0.7) reasons.push(`Recent activity detected (evidence: ${obj.id})`);
    if (metrics.risk > 0.6) reasons.push(`High risk changes (evidence: ${obj.id})`);
    if (metrics.technical_debt > 0.6) reasons.push(`Significant code changes (evidence: ${obj.id})`);
    if (metrics.roi > 0.7) reasons.push(`High impact on repository (evidence: ${obj.id})`);
    if (metrics.replay_weight > 0.5) reasons.push(`Multiple dependencies (evidence: ${obj.relationships?.length || 0} relationships)`);

    return reasons.join('; ') || 'Routine analysis required';
  }

  /**
   * Generate evidence for the mission
   * 
   * Constitutional Constraint: Evidence cites immutable object IDs
   */
  _generateEvidence(obj) {
    return {
      object_kind: obj.kind,
      object_id: obj.id,
      canonical_hash: obj.canonical_hash,
      created_at: obj.identity?.created_at || obj.created_at,
      relationships: obj.relationships?.length || 0,
      payload_summary: this._summarizePayload(obj.payload),
    };
  }

  /**
   * Generate expected replay for the mission
   */
  _generateExpectedReplay(obj) {
    return {
      replay_id: this._generateReplayId(obj),
      expected_stages: ['Acquisition', 'Normalization', 'StructuralCompilation', 'SemanticCompilation', 'Verification', 'ObjectSynthesis'],
      object_version: obj.canonical_hash,
      estimated_duration_ms: 5000,
    };
  }

  /**
   * Rank missions by score
   */
  _rankMissions(missions) {
    return missions.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate mission ID
   * 
   * Constitutional Constraint: Deterministic from object hash + weights
   * No timestamps, no randomness
   */
  _generateMissionId(obj) {
    const { CanonicalAuthority } = require('./canonical_authority');
    const missionInput = {
      object_id: obj.id,
      object_hash: obj.canonical_hash,
      weights: this._weights,
    };
    const missionHash = CanonicalAuthority.hash(missionInput);
    return `mission-${missionHash.substring(0, 16)}`;
  }

  /**
   * Generate replay ID
   * 
   * Constitutional Constraint: Deterministic from object hash
   */
  _generateReplayId(obj) {
    const { CanonicalAuthority } = require('./canonical_authority');
    return CanonicalAuthority.hash(obj.canonical_hash);
  }

  /**
   * Summarize payload for evidence
   */
  _summarizePayload(payload) {
    if (!payload) return 'No payload';
    const keys = Object.keys(payload).slice(0, 5);
    return keys.join(', ');
  }

  /**
   * Get current weights
   */
  getWeights() {
    return { ...this._weights };
  }

  /**
   * Get mission queue status
   */
  async getQueueStatus() {
    const result = await this._postgres.query(`
      SELECT COUNT(*) as count,
             SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
             SUM(CASE WHEN status = 'executing' THEN 1 ELSE 0 END) as executing,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM events
      WHERE aggregate_type = 'Mission'
    `);

    const row = result.rows[0];
    return {
      total: parseInt(row.count, 10),
      queued: parseInt(row.queued, 10),
      executing: parseInt(row.executing, 10),
      completed: parseInt(row.completed, 10),
      failed: parseInt(row.failed, 10),
    };
  }
}

module.exports = { MissionPlanner };
