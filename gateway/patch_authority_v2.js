/**
 * Patch Authority V2
 *
 * Phase 36I — Autonomous Engineering Fabric
 *
 * Constitutional authority for patch artifacts with replay verification.
 *
 * Instead of Devin committing directly:
 * Mission → Patch → Patch Authority → Replay → Verification → OpenCode → Merge
 *
 * Patch becomes constitutional artifact.
 *
 * Constitutional Constraint:
 * - Patches are constitutional artifacts
 * - Patches have replay verification
 * - Patches have constitutional witnesses
 * - Patch lifecycle is event-sourced
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Patch Status
 */
const PatchStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REPLAYING: 'replaying',
  VERIFIED: 'verified',
  FAILED: 'failed',
  MERGED: 'merged',
  REJECTED: 'rejected'
};

/**
 * Patch Schema
 *
 * Constitutional patch artifact.
 */
class Patch {
  constructor(data) {
    this.patch_id = data.patch_id;
    this.mission_id = data.mission_id;
    this.agent_id = data.agent_id;
    this.repository = data.repository;
    this.branch = data.branch;
    this.base_commit = data.base_commit;
    this.head_commit = data.head_commit || null;
    this.changes = data.changes || [];
    this.files_added = data.files_added || [];
    this.files_modified = data.files_modified || [];
    this.files_deleted = data.files_deleted || [];
    this.description = data.description || '';
    this.status = data.status || PatchStatus.DRAFT;
    this.replay_result = data.replay_result || null;
    this.verification_result = data.verification_result || null;
    this.pr_number = data.pr_number || null;
    this.merged_at = data.merged_at || null;
    this.rejected_at = data.rejected_at || null;
    this.rejection_reason = data.rejection_reason || null;
    
    // Constitutional metadata
    this.runtime_id = data.runtime_id;
    this.created_at = data.created_at || constitutionalTimeAuthority.nowAsMillis();
    this.created_by = data.created_by || 'PatchAuthority';
    this.authority = 'PatchAuthority';
    this.authority_version = '36.0.0';
    this.constitutional_version = constitutionVersionAuthority.getCurrentVersions().constitutional_schema;
    
    // Constitutional hashes
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Compute patch hash
   */
  _computePatchHash() {
    const patchData = {
      patch_id: this.patch_id,
      mission_id: this.mission_id,
      agent_id: this.agent_id,
      repository: this.repository,
      branch: this.branch,
      base_commit: this.base_commit,
      changes: this.changes,
      files_added: this.files_added,
      files_modified: this.files_modified,
      files_deleted: this.files_deleted,
      runtime_id: this.runtime_id,
      created_at: this.created_at
    };
    return CanonicalAuthority.hash(patchData);
  }
  
  /**
   * Create witness
   */
  _createWitness() {
    const witnessData = {
      execution_id: this.patch_id,
      input_hash: this.patch_hash,
      output_hash: this.head_commit ? CanonicalAuthority.hash(this.head_commit) : null,
      authority: this.authority,
      node_id: this.patch_id,
      success: this.status === PatchStatus.VERIFIED || this.status === PatchStatus.MERGED,
      constitutional_version: this.constitutional_version
    };
    
    return witnessAuthority.createWitness(witnessData, {
      authority: this.authority,
      authority_version: this.authority_version
    });
  }
  
  /**
   * Submit patch for replay
   */
  submit() {
    this.status = PatchStatus.SUBMITTED;
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Start replay
   */
  startReplay() {
    this.status = PatchStatus.REPLAYING;
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Complete replay
   */
  completeReplay(replayResult) {
    this.status = PatchStatus.VERIFIED;
    this.replay_result = replayResult;
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Fail replay
   */
  failReplay(replayResult) {
    this.status = PatchStatus.FAILED;
    this.replay_result = replayResult;
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Merge patch
   */
  merge(prNumber) {
    this.status = PatchStatus.MERGED;
    this.pr_number = prNumber;
    this.merged_at = constitutionalTimeAuthority.nowAsMillis();
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Reject patch
   */
  reject(reason) {
    this.status = PatchStatus.REJECTED;
    this.rejection_reason = reason;
    this.rejected_at = constitutionalTimeAuthority.nowAsMillis();
    this.patch_hash = this._computePatchHash();
    this.witness = this._createWitness();
  }
  
  /**
   * Serialize patch to canonical bytes
   */
  toCanonical() {
    const ordered = {
      patch_id: this.patch_id,
      mission_id: this.mission_id,
      agent_id: this.agent_id,
      repository: this.repository,
      branch: this.branch,
      base_commit: this.base_commit,
      head_commit: this.head_commit,
      changes: this.changes,
      files_added: this.files_added,
      files_modified: this.files_modified,
      files_deleted: this.files_deleted,
      description: this.description,
      status: this.status,
      replay_result: this.replay_result,
      verification_result: this.verification_result,
      pr_number: this.pr_number,
      merged_at: this.merged_at,
      rejected_at: this.rejected_at,
      rejection_reason: this.rejection_reason,
      runtime_id: this.runtime_id,
      created_at: this.created_at,
      created_by: this.created_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      patch_hash: this.patch_hash
    };
    return CanonicalBytes.serialize(ordered);
  }
  
  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      patch_id: this.patch_id,
      mission_id: this.mission_id,
      agent_id: this.agent_id,
      repository: this.repository,
      branch: this.branch,
      base_commit: this.base_commit,
      head_commit: this.head_commit,
      changes: this.changes,
      files_added: this.files_added,
      files_modified: this.files_modified,
      files_deleted: this.files_deleted,
      description: this.description,
      status: this.status,
      replay_result: this.replay_result,
      verification_result: this.verification_result,
      pr_number: this.pr_number,
      merged_at: this.merged_at,
      rejected_at: this.rejected_at,
      rejection_reason: this.rejection_reason,
      runtime_id: this.runtime_id,
      created_at: this.created_at,
      created_by: this.created_by,
      authority: this.authority,
      authority_version: this.authority_version,
      constitutional_version: this.constitutional_version,
      patch_hash: this.patch_hash,
      witness: this.witness
    };
  }
}

/**
 * Patch Authority V2
 *
 * Constitutional authority for patch artifacts.
 */
class PatchAuthority {
  constructor(eventRepository, replayAuthority, runtimeIdentity = null) {
    this._eventRepository = eventRepository;
    this._replayAuthority = replayAuthority;
    this._runtimeIdentity = runtimeIdentity;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '36.0.0';
    this._patches = new Map();
  }
  
  /**
   * Create patch
   * @param {string} missionId - Mission ID
   * @param {string} agentId - Agent ID
   * @param {Object} patchData - Patch data
   * @returns {Patch} Created patch
   */
  createPatch(missionId, agentId, patchData) {
    const patchId = this._generatePatchId(missionId, agentId, patchData);
    const runtimeId = this._runtimeIdentity?.getRuntimeID() || 'unknown';
    
    const data = {
      patch_id: patchId,
      mission_id: missionId,
      agent_id: agentId,
      repository: patchData.repository,
      branch: patchData.branch,
      base_commit: patchData.base_commit,
      changes: patchData.changes || [],
      files_added: patchData.files_added || [],
      files_modified: patchData.files_modified || [],
      files_deleted: patchData.files_deleted || [],
      description: patchData.description || '',
      status: PatchStatus.DRAFT,
      runtime_id: runtimeId,
      created_at: constitutionalTimeAuthority.nowAsMillis(),
      created_by: patchData.created_by || 'PatchAuthority'
    };
    
    const patch = new Patch(data);
    this._patches.set(patchId, patch);
    
    // Emit PatchCreated event
    this._emitPatchCreated(patch);
    
    return patch;
  }
  
  /**
   * Submit patch for replay
   * @param {string} patchId - Patch ID
   * @returns {Patch} Submitted patch
   */
  submitPatch(patchId) {
    const patch = this._patches.get(patchId);
    if (!patch) {
      throw new Error(`Patch not found: ${patchId}`);
    }
    
    patch.submit();
    
    // Emit PatchSubmitted event
    this._emitPatchSubmitted(patch);
    
    return patch;
  }
  
  /**
   * Replay patch
   * @param {string} patchId - Patch ID
   * @returns {Patch} Replayed patch
   */
  async replayPatch(patchId) {
    const patch = this._patches.get(patchId);
    if (!patch) {
      throw new Error(`Patch not found: ${patchId}`);
    }
    
    patch.startReplay();
    
    // Emit PatchReplayStarted event
    this._emitPatchReplayStarted(patch);
    
    try {
      // Replay using replay authority
      const replayResult = await this._replayAuthority.replayPatch(patch);
      
      if (replayResult.success) {
        patch.completeReplay(replayResult);
        
        // Emit PatchReplayCompleted event
        this._emitPatchReplayCompleted(patch);
      } else {
        patch.failReplay(replayResult);
        
        // Emit PatchReplayFailed event
        this._emitPatchReplayFailed(patch);
      }
      
      return patch;
    } catch (error) {
      patch.failReplay({
        success: false,
        error: error.message
      });
      
      // Emit PatchReplayFailed event
      this._emitPatchReplayFailed(patch);
      
      return patch;
    }
  }
  
  /**
   * Merge patch
   * @param {string} patchId - Patch ID
   * @param {number} prNumber - PR number
   * @returns {Patch} Merged patch
   */
  mergePatch(patchId, prNumber) {
    const patch = this._patches.get(patchId);
    if (!patch) {
      throw new Error(`Patch not found: ${patchId}`);
    }
    
    if (patch.status !== PatchStatus.VERIFIED) {
      throw new Error(`Patch not verified: ${patchId}`);
    }
    
    patch.merge(prNumber);
    
    // Emit PatchMerged event
    this._emitPatchMerged(patch);
    
    return patch;
  }
  
  /**
   * Reject patch
   * @param {string} patchId - Patch ID
   * @param {string} reason - Rejection reason
   * @returns {Patch} Rejected patch
   */
  rejectPatch(patchId, reason) {
    const patch = this._patches.get(patchId);
    if (!patch) {
      throw new Error(`Patch not found: ${patchId}`);
    }
    
    patch.reject(reason);
    
    // Emit PatchRejected event
    this._emitPatchRejected(patch);
    
    return patch;
  }
  
  /**
   * Get patch
   * @param {string} patchId - Patch ID
   * @returns {Patch} Patch
   */
  getPatch(patchId) {
    return this._patches.get(patchId);
  }
  
  /**
   * Get all patches
   * @returns {Array<Patch>} All patches
   */
  getAllPatches() {
    return Array.from(this._patches.values());
  }
  
  /**
   * Get patches by mission
   * @param {string} missionId - Mission ID
   * @returns {Array<Patch>} Patches for mission
   */
  getPatchesByMission(missionId) {
    return this.getAllPatches().filter(p => p.mission_id === missionId);
  }
  
  /**
   * Get patches by agent
   * @param {string} agentId - Agent ID
   * @returns {Array<Patch>} Patches from agent
   */
  getPatchesByAgent(agentId) {
    return this.getAllPatches().filter(p => p.agent_id === agentId);
  }
  
  /**
   * Get patches by status
   * @param {string} status - Patch status
   * @returns {Array<Patch>} Patches with status
   */
  getPatchesByStatus(status) {
    return this.getAllPatches().filter(p => p.status === status);
  }
  
  /**
   * Get patches by repository
   * @param {string} repository - Repository
   * @returns {Array<Patch>} Patches for repository
   */
  getPatchesByRepository(repository) {
    return this.getAllPatches().filter(p => p.repository === repository);
  }
  
  /**
   * Get pending patches
   * @returns {Array<Patch>} Pending patches
   */
  getPendingPatches() {
    return this.getPatchesByStatus(PatchStatus.DRAFT);
  }
  
  /**
   * Get submitted patches
   * @returns {Array<Patch>} Submitted patches
   */
  getSubmittedPatches() {
    return this.getPatchesByStatus(PatchStatus.SUBMITTED);
  }
  
  /**
   * Get verified patches
   * @returns {Array<Patch>} Verified patches
   */
  getVerifiedPatches() {
    return this.getPatchesByStatus(PatchStatus.VERIFIED);
  }
  
  /**
   * Get patch count
   * @returns {number} Patch count
   */
  getPatchCount() {
    return this._patches.size;
  }
  
  /**
   * Verify patch determinism
   * @param {Patch} patch1 - First patch
   * @param {Patch} patch2 - Second patch
   * @returns {boolean} Whether patches are equivalent
   */
  verifyPatchEquivalence(patch1, patch2) {
    return patch1.patch_hash === patch2.patch_hash;
  }
  
  /**
   * Replay patch from event log
   * @param {string} patchId - Patch ID
   * @returns {Patch} Replayed patch
   */
  async replayPatchFromEvents(patchId) {
    // Get patch events from event repository
    const events = await this._eventRepository.getEvents(patchId);
    
    // Reconstruct patch from events
    let patch = null;
    for (const event of events) {
      if (event.event_type === 'PatchCreated') {
        patch = new Patch(event.payload);
      } else if (event.event_type === 'PatchSubmitted') {
        patch.submit();
      } else if (event.event_type === 'PatchReplayStarted') {
        patch.startReplay();
      } else if (event.event_type === 'PatchReplayCompleted') {
        patch.completeReplay(event.payload.replay_result);
      } else if (event.event_type === 'PatchReplayFailed') {
        patch.failReplay(event.payload.replay_result);
      } else if (event.event_type === 'PatchMerged') {
        patch.merge(event.payload.pr_number);
      } else if (event.event_type === 'PatchRejected') {
        patch.reject(event.payload.rejection_reason);
      }
    }
    
    return patch;
  }
  
  /**
   * Generate patch ID
   */
  _generatePatchId(missionId, agentId, patchData) {
    return identityAuthority.generateId('patch', {
      mission_id: missionId,
      agent_id: agentId,
      repository: patchData.repository,
      branch: patchData.branch,
      base_commit: patchData.base_commit,
      changes_hash: CanonicalAuthority.hash(patchData.changes),
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
    return `patch_authority_${hash.substring(0, 16)}`;
  }
  
  /**
   * Emit PatchCreated event
   */
  _emitPatchCreated(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchCreated', patch.patch_id),
      event_type: 'PatchCreated',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 1,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: patch.toJSON(),
      causation_id: patch.mission_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchSubmitted event
   */
  _emitPatchSubmitted(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchSubmitted', patch.patch_id),
      event_type: 'PatchSubmitted',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 2,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        submitted_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchReplayStarted event
   */
  _emitPatchReplayStarted(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchReplayStarted', patch.patch_id),
      event_type: 'PatchReplayStarted',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 3,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        started_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchReplayCompleted event
   */
  _emitPatchReplayCompleted(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchReplayCompleted', patch.patch_id),
      event_type: 'PatchReplayCompleted',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        replay_result: patch.replay_result,
        completed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchReplayFailed event
   */
  _emitPatchReplayFailed(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchReplayFailed', patch.patch_id),
      event_type: 'PatchReplayFailed',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 4,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        replay_result: patch.replay_result,
        failed_at: constitutionalTimeAuthority.nowAsMillis()
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchMerged event
   */
  _emitPatchMerged(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchMerged', patch.patch_id),
      event_type: 'PatchMerged',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        pr_number: patch.pr_number,
        merged_at: patch.merged_at
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
  
  /**
   * Emit PatchRejected event
   */
  _emitPatchRejected(patch) {
    const event = {
      event_id: identityAuthority.generateEventId('PatchRejected', patch.patch_id),
      event_type: 'PatchRejected',
      aggregate_id: patch.patch_id,
      aggregate_type: 'Patch',
      aggregate_version: 1,
      sequence: 5,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority: 'PatchAuthority',
      authority_version: this._authorityVersion,
      payload_version: 1,
      payload: {
        patch_id: patch.patch_id,
        rejection_reason: patch.rejection_reason,
        rejected_at: patch.rejected_at
      },
      causation_id: patch.patch_id,
      correlation_id: patch.patch_id
    };
    
    if (this._eventRepository) {
      this._eventRepository.appendEvent(event);
    }
  }
}

// Singleton instance
let patchAuthorityV2 = null;

function getPatchAuthorityV2(eventRepository, replayAuthority, runtimeIdentity = null) {
  if (!patchAuthorityV2) {
    patchAuthorityV2 = new PatchAuthority(eventRepository, replayAuthority, runtimeIdentity);
  }
  return patchAuthorityV2;
}

module.exports = {
  PatchAuthority,
  Patch,
  PatchStatus,
  patchAuthorityV2,
  getPatchAuthorityV2
};
