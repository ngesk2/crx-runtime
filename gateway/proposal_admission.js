/**
 * Proposal Admission
 * 
 * Ω.86.A — Constitutional Autonomous Analysis Runtime
 * 
 * Proposal objects must pass through admission exactly like repositories.
 * Rejected proposals never reach MissionAuthority.
 * Accepted proposals become immutable constitutional objects.
 * 
 * Constitutional Constraint: This is NOT an authority. This is an admission
 * gateway that validates proposals before they can become constitutional objects.
 */

const crypto = require('crypto');
const { OperationalEnvelope, ConstitutionalObjectFactory } = require('./operational_envelope');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class ProposalAdmission {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._operationalEnvelope = new OperationalEnvelope();
    this._constitutionalObjectFactory = new ConstitutionalObjectFactory();
    this._initialized = false;
  }

  /**
   * Initialize proposal admission
   */
  async initialize() {
    await this._createTables();
    this._initialized = true;
    console.log('[ProposalAdmission] Initialized');
  }

  /**
   * Create admission tables
   */
  async _createTables() {
    // Proposal quarantine table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS proposal_quarantine (
        proposal_id VARCHAR(255) PRIMARY KEY,
        proposal_data JSONB NOT NULL,
        submission_time TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        review_time TIMESTAMP,
        reviewed_by VARCHAR(255),
        metadata JSONB
      )
    `);

    // Create indexes
    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_proposal_quarantine_status 
      ON proposal_quarantine(status)
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_proposal_quarantine_submission 
      ON proposal_quarantine(submission_time DESC)
    `);
  }

  /**
   * Submit proposal for admission
   * 
   * @param {Object} proposal - Proposal object
   * @returns {Object} Admission result
   */
  async submit(proposal) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const proposalId = proposal.proposal_id || identityAuthority.generateId('proposal', { type: 'proposal' });
    const now = constitutionalTimeAuthority.now();

    const result = await this._postgres.query(`
      INSERT INTO proposal_quarantine (
        proposal_id,
        proposal_data,
        submission_time,
        status,
        metadata
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (proposal_id) DO UPDATE SET
        proposal_data = $2,
        submission_time = $3,
        status = $4,
        metadata = $5
      RETURNING *
    `, [
      proposalId,
      JSON.stringify(proposal.toJSON ? proposal.toJSON() : proposal),
      now,
      'pending',
      JSON.stringify({}),
    ]);

    console.log(`[ProposalAdmission] Submitted proposal: ${proposalId}`);
    return result.rows[0];
  }

  /**
   * Review proposal
   * 
   * @param {string} proposalId - Proposal ID
   * @param {string} reviewer - Reviewer ID
   * @returns {Object} Review result
   */
  async review(proposalId, reviewer = 'system') {
    const proposal = await this._getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    // Validate proposal
    const validation = await this._validateProposal(proposal.proposal_data);

    const now = new Date(constitutionalTimeAuthority.now()).toISOString();

    if (validation.valid) {
      // Accept proposal - admit as constitutional object
      await this._admitProposal(proposal.proposal_data);
      
      await this._postgres.query(`
        UPDATE proposal_quarantine
        SET status = 'accepted',
            review_time = $1,
            reviewed_by = $2
        WHERE proposal_id = $3
      `, [now, reviewer, proposalId]);

      console.log(`[ProposalAdmission] Accepted proposal: ${proposalId}`);
      return { status: 'accepted', proposal_id: proposalId };
    } else {
      // Reject proposal
      await this._postgres.query(`
        UPDATE proposal_quarantine
        SET status = 'rejected',
            rejection_reason = $1,
            review_time = $2,
            reviewed_by = $3
        WHERE proposal_id = $4
      `, [validation.reason, now, reviewer, proposalId]);

      console.log(`[ProposalAdmission] Rejected proposal: ${proposalId} - ${validation.reason}`);
      return { status: 'rejected', proposal_id: proposalId, reason: validation.reason };
    }
  }

  /**
   * Get proposal from quarantine
   * 
   * @param {string} proposalId - Proposal ID
   * @returns {Object|null} Proposal or null
   */
  async _getProposal(proposalId) {
    const result = await this._postgres.query(`
      SELECT * FROM proposal_quarantine
      WHERE proposal_id = $1
    `, [proposalId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Validate proposal
   * 
   * @param {Object} proposalData - Proposal data
   * @returns {Object} Validation result
   */
  async _validateProposal(proposalData) {
    // Check required fields
    const requiredFields = [
      'proposal_id',
      'source_object_id',
      'worker_type',
      'prompt_hash',
      'model_name',
      'response',
      'confidence',
      'authority',
    ];

    for (const field of requiredFields) {
      if (!proposalData[field]) {
        return {
          valid: false,
          reason: `Missing required field: ${field}`,
        };
      }
    }

    // Check authority
    if (proposalData.authority !== 'OllamaWorker') {
      return {
        valid: false,
        reason: `Invalid authority: ${proposalData.authority}`,
      };
    }

    // Check confidence range
    if (proposalData.confidence < 0 || proposalData.confidence > 1) {
      return {
        valid: false,
        reason: `Invalid confidence: ${proposalData.confidence}`,
      };
    }

    // Check response is not empty
    if (!proposalData.response || (typeof proposalData.response === 'object' && Object.keys(proposalData.response).length === 0)) {
      return {
        valid: false,
        reason: 'Empty response',
      };
    }

    // Check source object exists
    const sourceExists = await this._checkSourceObjectExists(proposalData.source_object_id);
    if (!sourceExists) {
      return {
        valid: false,
        reason: `Source object not found: ${proposalData.source_object_id}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if source object exists
   * 
   * @param {string} objectId - Object ID
   * @returns {boolean} Exists
   */
  async _checkSourceObjectExists(objectId) {
    const result = await this._postgres.query(`
      SELECT 1 FROM constitutional_objects
      WHERE object_id = $1
      LIMIT 1
    `, [objectId]);

    return result.rows.length > 0;
  }

  /**
   * Admit proposal as constitutional object
   * 
   * @param {Object} proposalData - Proposal data
   */
  async _admitProposal(proposalData) {
    // Create constitutional proposal object
    const proposalObject = this._constitutionalObjectFactory.createProposalObject(proposalData);

    // Wrap in operational envelope
    const wrappedProposal = this._operationalEnvelope.wrap(proposalObject);

    // Register as constitutional object
    await this._operationalEnvelope.register(wrappedProposal);

    // Persist to PostgreSQL
    await this._persistProposal(wrappedProposal);

    console.log(`[ProposalAdmission] Admitted proposal as constitutional object: ${proposalData.proposal_id}`);
  }

  /**
   * Persist proposal to PostgreSQL
   * 
   * @param {Object} wrappedProposal - Wrapped proposal
   */
  async _persistProposal(wrappedProposal) {
    await this._postgres.query(`
      INSERT INTO constitutional_objects (
        object_id,
        object_kind,
        object_data,
        canonical_hash,
        authority,
        lineage,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (object_id) DO UPDATE SET
        object_kind = $2,
        object_data = $3,
        canonical_hash = $4,
        authority = $5,
        lineage = $6,
        metadata = $7
    `, [
      wrappedProposal.object_id,
      wrappedProposal.constitutional_object.kind,
      JSON.stringify(wrappedProposal.constitutional_object),
      wrappedProposal.constitutional_object.canonical_hash,
      wrappedProposal.constitutional_object.authority,
      JSON.stringify(wrappedProposal.constitutional_object.lineage),
      JSON.stringify(wrappedProposal.operational_metadata),
    ]);
  }

  /**
   * Get pending proposals
   * 
   * @param {number} limit - Limit
   * @returns {Array} Pending proposals
   */
  async getPendingProposals(limit = 100) {
    const result = await this._postgres.query(`
      SELECT * FROM proposal_quarantine
      WHERE status = 'pending'
      ORDER BY submission_time ASC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Get proposal by ID
   * 
   * @param {string} proposalId - Proposal ID
   * @returns {Object|null} Proposal or null
   */
  async getProposal(proposalId) {
    return await this._getProposal(proposalId);
  }

  /**
   * Get proposals by status
   * 
   * @param {string} status - Status
   * @param {number} limit - Limit
   * @returns {Array} Proposals
   */
  async getProposalsByStatus(status, limit = 100) {
    const result = await this._postgres.query(`
      SELECT * FROM proposal_quarantine
      WHERE status = $1
      ORDER BY submission_time DESC
      LIMIT $2
    `, [status, limit]);

    return result.rows;
  }

  /**
   * Get admission statistics
   * 
   * @returns {Object} Statistics
   */
  async getStatistics() {
    const result = await this._postgres.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM proposal_quarantine
      GROUP BY status
    `);

    const stats = {};
    for (const row of result.rows) {
      stats[row.status] = parseInt(row.count, 10);
    }

    return stats;
  }

  /**
   * Clear old proposals
   * 
   * @param {number} olderThanDays - Clear proposals older than this many days
   */
  async clearOldProposals(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this._postgres.query(`
      DELETE FROM proposal_quarantine
      WHERE status IN ('accepted', 'rejected')
        AND review_time < $1
      RETURNING proposal_id
    `, [cutoffDate]);

    console.log(`[ProposalAdmission] Cleared ${result.rows.length} old proposals`);
    return result.rows.length;
  }
}

module.exports = { ProposalAdmission };
