/**
 * Continuous Replay Authority
 *
 * Phase 36J — Autonomous Engineering Fabric
 *
 * Constitutional authority for automatic replay on branches and PRs.
 *
 * Every important branch continuously replayed:
 * Main → Replay → Certificate → Store
 *
 * Every PR:
 * Replay → Compare → Accept
 *
 * Constitutional Constraint:
 * - Replay is automatic
 * - Replay certificates are constitutional
 * - Replay comparison is constitutional
 * - Replay lifecycle is event-sourced
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Replay Status
 */
const ReplayStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  COMPARING: 'comparing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

/**
 * Replay Certificate Schema
 *
 * Constitutional replay certificate artifact.
 */
class ReplayCertificate {
  constructor(data) {
    this.certificate_id = data.certificate_id;
    this.replay_id = data.replay_id;
    this.runtime_id = data.runtime_id;
    this.branch = data.branch;
    this.commit = data.commit;
    this.execution_graph_hash = data.execution_graph_hash || null;
    this.reducer_hash = data.reducer_hash || null;
    this.snapshot_hash = data.snapshot_hash || null;
    this.state_hash = data.state_hash || null;
    this.event_root = data.event_root || null;
    this.merkle_root = data.merkle_root || null;
    this.witness_hash = data.witness_hash || null;
    this.replay_hash = data.replay_hash || null;
    this.certificate_version = data.certificate_version || '1.0.0';
    this.signature = data.signature || null;
    this.created_at = data.created_at || constitutionalTimeAuthority.nowAsMillis();
    
    // Constitutional metadata
    this.authority = 'ContinuousReplayAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.certificate_hash = this._computeCertificateHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute certificate hash
   */
  _computeCertificateHash() {
    const certificateData = {
      certificate_id: this.certificate_id,
      replay_id: this.replay_id,
      runtime_id: this.runtime_id,
      branch: this.branch,
      commit: this.commit,
      execution_graph_hash: this.execution_graph_hash,
      reducer_hash: this.reducer_hash,
      snapshot_hash: this.snapshot_hash,
      state_hash: this.state_hash,
      event_root: this.event_root,
      merkle_root: this.merkle_root,
      witness_hash: this.witness_hash,
      certificate_version: this.certificate_version
    };
    return CanonicalAuthority.hash(certificateData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.certificate_id,
      input_hash: this.certificate_hash,
      output_hash: this.signature ? CanonicalAuthority.hash(this.signature) : null,
      authority: this.authority,
      node_id: this.certificate_id,
      success: true,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Serialize certificate to canonical bytes
   */
  toCanonical() {
    const ordered = {
      certificate_id: this.certificate_id,
      replay_id: this.replay_id,
      runtime_id: this.runtime_id,
      branch: this.branch,
      commit: this.commit,
      execution_graph_hash: this.execution_graph_hash,
      reducer_hash: this.reducer_hash,
      snapshot_hash: this.snapshot_hash,
      state_hash: this.state_hash,
      event_root: this.event_root,
      merkle_root: this.merkle_root,
      witness_hash: this.witness_hash,
      replay_hash: this.replay_hash,
      certificate_version: this.certificate_version,
      signature: this.signature,
      created_at: this.created_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      certificate_hash: this.certificate_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      certificate_id: this.certificate_id,
      replay_id: this.replay_id,
      runtime_id: this.runtime_id,
      branch: this.branch,
      commit: this.commit,
      execution_graph_hash: this.execution_graph_hash,
      reducer_hash: this.reducer_hash,
      snapshot_hash: this.snapshot_hash,
      state_hash: this.state_hash,
      event_root: this.event_root,
      merkle_root: this.merkle_root,
      witness_hash: this.witness_hash,
      replay_hash: this.replay_hash,
      certificate_version: this.certificate_version,
      signature: this.signature,
      created_at: this.created_at,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      certificate_hash: this.certificate_hash,
      witness: this.witness
    };
  }
}

/**
 * Continuous Replay Authority
 *
 * Constitutional authority for automatic replay.
 */
class ContinuousReplayAuthority {
  constructor(eventRepository, replayAuthority, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._replayAuthority = replayAuthority;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._replays = new Map();
    this._certificates = new Map();
    this._monitoredBranches = new Set();
    this._monitoredPRs = new Map();
  }
  
  /**
   * Monitor branch for continuous replay
   * @param {string} branch - Branch name
   * @param {Object} options - Monitoring options
   */
  monitorBranch(branch, options = {}) {
    this._monitoredBranches.add(branch);
    
    // Emit BranchMonitored event
    this._emitBranchMonitored(branch, options);
  }
  
  /**
   * Unmonitor branch
   * @param {string} branch - Branch name
   */
  unmonitorBranch(branch) {
    this._monitoredBranches.delete(branch);
    
    // Emit BranchUnmonitored event
    this._emitBranchUnmonitored(branch);
  }
  
  /**
   * Monitor PR for replay
   * @param {number} prNumber - PR number
   * @param {string} branch - PR branch
   * @param {string} baseBranch - Base branch
   * @param {Object} options - Monitoring options
   */
  monitorPR(prNumber, branch, baseBranch, options = {}) {
    this._monitoredPRs.set(prNumber, {
      pr_number: prNumber,
      branch: branch,
      base_branch: baseBranch,
      options: options
    });
    
    // Emit PRMonitored event
    this._emitPRMonitored(prNumber, branch, baseBranch, options);
  }
  
  /**
   * Unmonitor PR
   * @param {number} prNumber - PR number
   */
  unmonitorPR(prNumber) {
    this._monitoredPRs.delete(prNumber);
    
    // Emit PRUnmonitored event
    this._emitPRUnmonitored(prNumber);
  }
  
  /**
   * Trigger replay for branch
   * @param {string} branch - Branch name
   * @param {string} commit - Commit hash
   * @returns {Object} Replay result
   */
  async replayBranch(branch, commit) {
    const replayId = this._generateReplayId(branch, commit);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const replayData = {
      replay_id: replayId,
      branch: branch,
      commit: commit,
      status: ReplayStatus.RUNNING,
      started_at: constitutionalTimeAuthority.nowAsMillis(),
      runtime_id: runtimeId
    };
    
    this._replays.set(replayId, replayData);
    
    // Emit ReplayStarted event
    this._emitReplayStarted(replayData);
    
    try {
      // Execute replay using replay authority
      const replayResult = await this._replayAuthority.replayBranch(branch, commit);
      
      replayData.status = ReplayStatus.COMPLETED;
      replayData.completed_at = constitutionalTimeAuthority.nowAsMillis();
      replayData.result = replayResult;
      
      // Create certificate
      const certificate = this._createCertificate(replayId, branch, commit, replayResult);
      this._certificates.set(certificate.certificate_id, certificate);
      
      // Emit ReplayCompleted event
      this._emitReplayCompleted(replayData, certificate);
      
      return {
        replay: replayData,
        certificate: certificate
      };
    } catch (error) {
      replayData.status = ReplayStatus.FAILED;
      replayData.completed_at = constitutionalTimeAuthority.nowAsMillis();
      replayData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      
      // Emit ReplayFailed event
      this._emitReplayFailed(replayData);
      
      return {
        replay: replayData,
        certificate: null
      };
    }
  }
  
  /**
   * Replay PR and compare with base
   * @param {number} prNumber - PR number
   * @param {string} branch - PR branch
   * @param {string} commit - Commit hash
   * @returns {Object} Replay comparison result
   */
  async replayPR(prNumber, branch, commit) {
    const prConfig = this._monitoredPRs.get(prNumber);
    if (!prConfig) {
      throw new Error(`PR not monitored: ${prNumber}`);
    }
    
    // Replay PR branch
    const prReplayResult = await this.replayBranch(branch, commit);
    
    if (!prReplayResult.certificate) {
      return {
        pr_replay: prReplayResult.replay,
        comparison: null,
        accepted: false
      };
    }
    
    // Replay base branch
    const baseReplayResult = await this.replayBranch(prConfig.base_branch, prConfig.base_commit);
    
    if (!baseReplayResult.certificate) {
      return {
        pr_replay: prReplayResult.replay,
        comparison: null,
        accepted: false
      };
    }
    
    // Compare certificates
    const comparison = this._compareCertificates(
      prReplayResult.certificate,
      baseReplayResult.certificate
    );
    
    // Update replay status
    const replayData = this._replays.get(prReplayResult.replay.replay_id);
    replayData.status = ReplayStatus.COMPARING;
    
    // Emit ReplayComparing event
    this._emitReplayComparing(replayData, comparison);
    
    // Accept or reject based on comparison
    if (comparison.equivalent) {
      replayData.status = ReplayStatus.ACCEPTED;
      
      // Emit ReplayAccepted event
      this._emitReplayAccepted(replayData, comparison);
    } else {
      replayData.status = ReplayStatus.REJECTED;
      
      // Emit ReplayRejected event
      this._emitReplayRejected(replayData, comparison);
    }
    
    return {
      pr_replay: prReplayResult.replay,
      base_replay: baseReplayResult.replay,
      comparison: comparison,
      accepted: comparison.equivalent
    };
  }
  
  /**
   * Create replay certificate
   */
  _createCertificate(replayId, branch, commit, replayResult) {
    const certificateId = this._generateCertificateId(replayId);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const certificateData = {
      certificate_id: certificateId,
      replay_id: replayId,
      runtime_id: runtimeId,
      branch: branch,
      commit: commit,
      execution_graph_hash: replayResult.execution_graph_hash,
      reducer_hash: replayResult.reducer_hash,
      snapshot_hash: replayResult.snapshot_hash,
      state_hash: replayResult.state_hash,
      event_root: replayResult.event_root,
      merkle_root: replayResult.merkle_root,
      witness_hash: replayResult.witness_hash,
      replay_hash: replayResult.replay_hash,
      certificate_version: '1.0.0',
      signature: replayResult.signature,
      created_at: constitutionalTimeAuthority.nowAsMillis()
    };
    
    const certificate = new ReplayCertificate(certificateData);
    
    // Emit CertificateCreated event
    this._emitCertificateCreated(certificate);
    
    return certificate;
  }
  
  /**
   * Compare certificates
   */
  _compareCertificates(certificate1, certificate2) {
    const comparison = {
      equivalent: true,
      differences: []
    };
    
    // Compare all fields
    const fields = [
      'execution_graph_hash',
      'reducer_hash',
      'snapshot_hash',
      'state_hash',
      'event_root',
      'merkle_root',
      'witness_hash',
      'replay_hash'
    ];
    
    for (const field of fields) {
      if (certificate1[field] !== certificate2[field]) {
        comparison.equivalent = false;
        comparison.differences.push({
          field: field,
          value1: certificate1[field],
          value2: certificate2[field]
        });
      }
    }
    
    return comparison;
  }
  
  /**
   * Get replay
   * @param {string} replayId - Replay ID
   * @returns {Object} Replay
   */
  getReplay(replayId) {
    return this._replays.get(replayId);
  }
  
  /**
   * Get certificate
   * @param {string} certificateId - Certificate ID
   * @returns {ReplayCertificate} Certificate
   */
  getCertificate(certificateId) {
    return this._certificates.get(certificateId);
  }
  
  /**
   * Get certificates by branch
   * @param {string} branch - Branch name
   * @returns {Array<ReplayCertificate>} Certificates for branch
   */
  getCertificatesByBranch(branch) {
    return Array.from(this._certificates.values())
      .filter(c => c.branch === branch);
  }
  
  /**
   * Get latest certificate for branch
   * @param {string} branch - Branch name
   * @returns {ReplayCertificate|null} Latest certificate
   */
  getLatestCertificateForBranch(branch) {
    const certificates = this.getCertificatesByBranch(branch);
    if (certificates.length === 0) {
      return null;
    }
    
    return certificates.sort((a, b) => b.created_at - a.created_at)[0];
  }
  
  /**
   * Get monitored branches
   * @returns {Array<string>} Monitored branches
   */
  getMonitoredBranches() {
    return Array.from(this._monitoredBranches);
  }
  
  /**
   * Get monitored PRs
   * @returns {Array<Object>} Monitored PRs
   */
  getMonitoredPRs() {
    return Array.from(this._monitoredPRs.values());
  }
  
  /**
   * Get replay count
   * @returns {number} Replay count
   */
  getReplayCount() {
    return this._replays.size;
  }
  
  /**
   * Get certificate count
   * @returns {number} Certificate count
   */
  getCertificateCount() {
    return this._certificates.size;
  }
  
  /**
   * Verify certificate determinism
   * @param {ReplayCertificate} certificate1 - First certificate
   * @param {ReplayCertificate} certificate2 - Second certificate
   * @returns {boolean} Whether certificates are equivalent
   */
  verifyCertificateEquivalence(certificate1, certificate2) {
    return certificate1.certificate_hash === certificate2.certificate_hash;
  }
  
  /**
   * Generate replay ID
   */
  _generateReplayId(branch, commit) {
    return identityAuthority.generateId('replay', {
      branch: branch,
      commit: commit,
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate certificate ID
   */
  _generateCertificateId(replayId) {
    return identityAuthority.generateId('replay_certificate', {
      replay_id: replayId,
      timestamp: constitutionalTimeAuthority.nowAsMillis()
    });
  }
  
  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '36.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `continuous_replay_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit BranchMonitored event
   */
  _emitBranchMonitored(branch, options) {
    const event = {
      event_id: identityAuthority.generateEventId('BranchMonitored', branch),
      event_type: 'BranchMonitored',
      aggregate_id: branch,
      aggregate_type: 'Branch',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        branch: branch,
        options: options,
        monitored_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: null,
      correlation_id: branch
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit BranchUnmonitored event
   */
  _emitBranchUnmonitored(branch) {
    const event = {
      event_id: identityAuthority.generateEventId('BranchUnmonitored', branch),
      event_type: 'BranchUnmonitored',
      aggregate_id: branch,
      aggregate_type: 'Branch',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        branch: branch,
        unmonitored_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: branch,
      correlation_id: branch
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PRMonitored event
   */
  _emitPRMonitored(prNumber, branch, baseBranch, options) {
    const event = {
      event_id: identityAuthority.generateEventId('PRMonitored', prNumber.toString()),
      event_type: 'PRMonitored',
      aggregate_id: prNumber.toString(),
      aggregate_type: 'PR',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        pr_number: prNumber,
        branch: branch,
        base_branch: baseBranch,
        options: options,
        monitored_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: null,
      correlation_id: prNumber.toString()
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PRUnmonitored event
   */
  _emitPRUnmonitored(prNumber) {
    const event = {
      event_id: identityAuthority.generateEventId('PRUnmonitored', prNumber.toString()),
      event_type: 'PRUnmonitored',
      aggregate_id: prNumber.toString(),
      aggregate_type: 'PR',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        pr_number: prNumber,
        unmonitored_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: prNumber.toString(),
      correlation_id: prNumber.toString()
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayStarted event
   */
  _emitReplayStarted(replayData) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayStarted', replayData.replay_id),
      event_type: 'ReplayStarted',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: replayData,
      causation_id: null,
      correlation_id: replayData.replay_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayCompleted event
   */
  _emitReplayCompleted(replayData, certificate) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayCompleted', replayData.replay_id),
      event_type: 'ReplayCompleted',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        replay_id: replayData.replay_id,
        certificate_id: certificate.certificate_id,
        completed_at: replayData.completed_at
      },
      causation_id: replayData.replay_id,
      correlation_id: certificate.certificate_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayFailed event
   */
  _emitReplayFailed(replayData) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayFailed', replayData.replay_id),
      event_type: 'ReplayFailed',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        replay_id: replayData.replay_id,
        error: replayData.error,
        failed_at: replayData.completed_at
      },
      causation_id: replayData.replay_id,
      correlation_id: replayData.replay_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit CertificateCreated event
   */
  _emitCertificateCreated(certificate) {
    const event = {
      event_id: identityAuthority.generateEventId('CertificateCreated', certificate.certificate_id),
      event_type: 'CertificateCreated',
      aggregate_id: certificate.certificate_id,
      aggregate_type: 'ReplayCertificate',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: certificate.toJSON(),
      causation_id: certificate.replay_id,
      correlation_id: certificate.certificate_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayComparing event
   */
  _emitReplayComparing(replayData, comparison) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayComparing', replayData.replay_id),
      event_type: 'ReplayComparing',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        replay_id: replayData.replay_id,
        comparison: comparison,
        compared_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: replayData.replay_id,
      correlation_id: replayData.replay_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayAccepted event
   */
  _emitReplayAccepted(replayData, comparison) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayAccepted', replayData.replay_id),
      event_type: 'ReplayAccepted',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        replay_id: replayData.replay_id,
        comparison: comparison,
        accepted_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: replayData.replay_id,
      correlation_id: replayData.replay_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit ReplayRejected event
   */
  _emitReplayRejected(replayData, comparison) {
    const event = {
      event_id: identityAuthority.generateEventId('ReplayRejected', replayData.replay_id),
      event_type: 'ReplayRejected',
      aggregate_id: replayData.replay_id,
      aggregate_type: 'Replay',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'ContinuousReplayAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        replay_id: replayData.replay_id,
        comparison: comparison,
        rejected_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: replayData.replay_id,
      correlation_id: replayData.replay_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let continuousReplayAuthority = null;

function getContinuousReplayAuthority(eventRepository, replayAuthority, runtimeIdentity = null) {
  if (!continuousReplayAuthority) {
    continuousReplayAuthority = new ContinuousReplayAuthority(eventRepository, replayAuthority, runtimeIdentity);
  }
  return continuousReplayAuthority;
}

module.exports = {
  ContinuousReplayAuthority,
  ReplayCertificate,
  ReplayStatus,
  continuousReplayAuthority,
  getContinuousReplayAuthority
};
