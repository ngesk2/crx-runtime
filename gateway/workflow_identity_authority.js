/**
 * Workflow Identity Authority
 *
 * Phase 2.7.6 — Constitutional Boundary Collapse
 *
 * Owns workflow ID generation.
 *
 * Constitutional Constraint:
 * - Provider never generates IDs
 * - Workflow IDs are constitutional identifiers
 * - Provider receives IDs from this authority
 */

const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class WorkflowIdentityAuthority {
  constructor() {
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '2.7.6';
  }

  /**
   * Generate workflow ID from job
   * @param {Object} job - Job object
   * @returns {string} Workflow ID
   */
  generateWorkflowId(job) {
    return deterministicIdAuthority.generateIdFromObject({
      type: job.type,
      payload: job.payload,
      timestamp: job.timestamp || constitutionalTimeAuthority.nowAsMillis(),
    });
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    return `workflow_identity_authority_v${this._authorityVersion}`;
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }
}

// Singleton instance
const workflowIdentityAuthority = new WorkflowIdentityAuthority();

module.exports = { WorkflowIdentityAuthority, workflowIdentityAuthority };
