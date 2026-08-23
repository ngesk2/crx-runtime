/**
 * ConstitutionalAuthority (Weighted Governance)
 * 
 * Constitutional authority for weighted governance evaluation.
 * Proposals receive constitutional scores rather than binary pass/fail.
 * Weights: Replay determinism 25%, Canonical identity 20%, Capability isolation 15%, Security 15%, Replay witness integrity 10%, Migration compatibility 5%, Operational simplicity 5%, Performance 3%, Developer ergonomics 2%
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ConstitutionalAuthority {
  constructor() {
    this._principleWeights = {
      replay_determinism: 0.25,
      canonical_identity: 0.20,
      capability_isolation: 0.15,
      security: 0.15,
      replay_witness_integrity: 0.10,
      migration_compatibility: 0.05,
      operational_simplicity: 0.05,
      performance: 0.03,
      developer_ergonomics: 0.02
    };
    
    this._approvalThreshold = 80;
    this._evaluations = new Map(); // proposal_id -> evaluation
  }

  /**
   * Evaluate proposal with weighted scoring
   * @param {Object} proposal - Proposal to evaluate
   * @returns {Object} Evaluation result
   */
  async evaluateProposal(proposal) {
    const principleScores = await this._scorePrinciples(proposal);
    const weightedScore = this._calculateWeightedScore(principleScores);
    const approved = weightedScore >= this._approvalThreshold;

    const evaluation = {
      proposal: proposal.name,
      proposal_id: proposal.id || this._generateProposalId(),
      principle_scores: principleScores,
      weighted_score: weightedScore,
      threshold: this._approvalThreshold,
      approved: approved,
      evaluation_date: new Date(constitutionalTimeAuthority.now()).toISOString()
    };

    this._evaluations.set(evaluation.proposal_id, evaluation);

    return evaluation;
  }

  /**
   * Score individual principles
   * @param {Object} proposal - Proposal to score
   * @returns {Object} Principle scores
   */
  async _scorePrinciples(proposal) {
    const scores = {};

    for (const [principle, weight] of Object.entries(this._principleWeights)) {
      scores[principle] = await this._scorePrinciple(principle, proposal);
    }

    return scores;
  }

  /**
   * Score individual principle
   * @param {string} principle - Principle name
   * @param {Object} proposal - Proposal to score
   * @returns {Object} Principle score
   */
  async _scorePrinciple(principle, proposal) {
    const score = {
      overall_score: 0,
      criteria: [],
      weight: this._principleWeights[principle],
      weighted_score: 0
    };

    switch (principle) {
      case 'replay_determinism':
        score.overall_score = await this._scoreReplayDeterminism(proposal);
        score.criteria = [
          { name: 'deterministic_execution', score: score.overall_score },
          { name: 'event_ordering', score: score.overall_score },
          { name: 'state_reconstruction', score: score.overall_score },
          { name: 'timestamp_handling', score: score.overall_score }
        ];
        break;
      case 'canonical_identity':
        score.overall_score = await this._scoreCanonicalIdentity(proposal);
        score.criteria = [
          { name: 'artifact_hashing', score: score.overall_score },
          { name: 'artifact_freezing', score: score.overall_score },
          { name: 'artifact_traceability', score: score.overall_score },
          { name: 'artifact_immutability', score: score.overall_score }
        ];
        break;
      case 'capability_isolation':
        score.overall_score = await this._scoreCapabilityIsolation(proposal);
        score.criteria = [
          { name: 'vendor_abstraction', score: score.overall_score },
          { name: 'capability_contracting', score: score.overall_score },
          { name: 'adapter_generation', score: score.overall_score }
        ];
        break;
      case 'security':
        score.overall_score = await this._scoreSecurity(proposal);
        score.criteria = [
          { name: 'vulnerability_scan', score: score.overall_score },
          { name: 'credential_management', score: score.overall_score },
          { name: 'access_control', score: score.overall_score },
          { name: 'encryption', score: score.overall_score }
        ];
        break;
      case 'replay_witness_integrity':
        score.overall_score = await this._scoreReplayWitnessIntegrity(proposal);
        score.criteria = [
          { name: 'witness_validity', score: score.overall_score },
          { name: 'witness_traceability', score: score.overall_score },
          { name: 'witness_immutability', score: score.overall_score }
        ];
        break;
      case 'migration_compatibility':
        score.overall_score = await this._scoreMigrationCompatibility(proposal);
        score.criteria = [
          { name: 'data_migration', score: score.overall_score },
          { name: 'api_compatibility', score: score.overall_score },
          { name: 'rollback_capability', score: score.overall_score }
        ];
        break;
      case 'operational_simplicity':
        score.overall_score = await this._scoreOperationalSimplicity(proposal);
        score.criteria = [
          { name: 'deployment_complexity', score: score.overall_score },
          { name: 'monitoring_complexity', score: score.overall_score },
          { name: 'troubleshooting_complexity', score: score.overall_score }
        ];
        break;
      case 'performance':
        score.overall_score = await this._scorePerformance(proposal);
        score.criteria = [
          { name: 'latency', score: score.overall_score },
          { name: 'throughput', score: score.overall_score },
          { name: 'resource_utilization', score: score.overall_score }
        ];
        break;
      case 'developer_ergonomics':
        score.overall_score = await this._scoreDeveloperErgonomics(proposal);
        score.criteria = [
          { name: 'api_design', score: score.overall_score },
          { name: 'documentation', score: score.overall_score },
          { name: 'debugging_experience', score: score.overall_score }
        ];
        break;
      default:
        score.overall_score = 0;
    }

    score.weighted_score = score.overall_score * score.weight;

    return score;
  }

  /**
   * Score replay determinism
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreReplayDeterminism(proposal) {
    if (proposal.replay_determinism_score !== undefined) {
      return proposal.replay_determinism_score;
    }
    return 100; // Default score
  }

  /**
   * Score canonical identity
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreCanonicalIdentity(proposal) {
    if (proposal.canonical_identity_score !== undefined) {
      return proposal.canonical_identity_score;
    }
    return 100; // Default score
  }

  /**
   * Score capability isolation
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreCapabilityIsolation(proposal) {
    if (proposal.capability_isolation_score !== undefined) {
      return proposal.capability_isolation_score;
    }
    return 100; // Default score
  }

  /**
   * Score security
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreSecurity(proposal) {
    if (proposal.security_score !== undefined) {
      return proposal.security_score;
    }
    return 100; // Default score
  }

  /**
   * Score replay witness integrity
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreReplayWitnessIntegrity(proposal) {
    if (proposal.replay_witness_integrity_score !== undefined) {
      return proposal.replay_witness_integrity_score;
    }
    return 100; // Default score
  }

  /**
   * Score migration compatibility
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreMigrationCompatibility(proposal) {
    if (proposal.migration_compatibility_score !== undefined) {
      return proposal.migration_compatibility_score;
    }
    return 100; // Default score
  }

  /**
   * Score operational simplicity
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreOperationalSimplicity(proposal) {
    if (proposal.operational_simplicity_score !== undefined) {
      return proposal.operational_simplicity_score;
    }
    return 100; // Default score
  }

  /**
   * Score performance
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scorePerformance(proposal) {
    if (proposal.performance_score !== undefined) {
      return proposal.performance_score;
    }
    return 100; // Default score
  }

  /**
   * Score developer ergonomics
   * @param {Object} proposal - Proposal to score
   * @returns {number} Score (0-100)
   */
  async _scoreDeveloperErgonomics(proposal) {
    if (proposal.developer_ergonomics_score !== undefined) {
      return proposal.developer_ergonomics_score;
    }
    return 100; // Default score
  }

  /**
   * Calculate weighted score
   * @param {Object} principleScores - Principle scores
   * @returns {number} Weighted score
   */
  _calculateWeightedScore(principleScores) {
    let weightedScore = 0;

    for (const [principle, score] of Object.entries(principleScores)) {
      weightedScore += score.weighted_score;
    }

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Get evaluation by proposal ID
   * @param {string} proposalId - Proposal ID
   * @returns {Object} Evaluation
   */
  getEvaluation(proposalId) {
    return this._evaluations.get(proposalId);
  }

  /**
   * Set approval threshold
   * @param {number} threshold - Approval threshold (0-100)
   */
  setApprovalThreshold(threshold) {
    if (threshold < 0 || threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }
    this._approvalThreshold = threshold;
  }

  /**
   * Get approval threshold
   * @returns {number} Approval threshold
   */
  getApprovalThreshold() {
    return this._approvalThreshold;
  }

  /**
   * Get principle weights
   * @returns {Object} Principle weights
   */
  getPrincipleWeights() {
    return { ...this._principleWeights };
  }

  /**
   * Generate proposal ID
   * @returns {string} Proposal ID
   */
  _generateProposalId() {
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
    const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
    const timestamp = constitutionalTimeAuthority.nowAsMillis();
    const randomPart = deterministicIdAuthority.generateId({ timestamp });
    return `proposal_${timestamp}_${randomPart.substring(0, 7)}`;
  }
}

module.exports = { ConstitutionalAuthority };
