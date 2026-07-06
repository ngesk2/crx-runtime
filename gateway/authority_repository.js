/**
 * Authority Repository
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Central repository for all constitutional storage.
 * 
 * Owns:
 * - Map/Set abstractions
 * - Registry storage
 * - Manifest storage
 * - Proposal storage
 * - Authority storage
 * - Approval storage
 * - Execution storage
 * 
 * Eventually can become persistent storage without changing callers.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class AuthorityRepository {
  constructor() {
    // Authority storage
    this._authorities = new Map();
    
    // Manifest storage
    this._manifests = new Map();
    
    // Proposal storage
    this._proposals = new Map();
    
    // Approval storage
    this._approvals = new Map();
    
    // Execution storage
    this._executions = new Map();
    
    // Capability registry
    this._capabilities = new Map();
    
    // Object registry
    this._objects = new Map();
    
    // Witness storage
    this._witnesses = new Map();
    
    // Boot state
    this._bootState = new Map();
    
    // Processed files tracking
    this._processedFiles = new Set();
    
    // Conversations
    this._conversations = new Map();
    
    // Backup metadata
    this._lastBackup = null;
  }

  // Authority storage
  registerAuthority(authorityId, authority) {
    this._authorities.set(authorityId, authority);
  }

  getAuthority(authorityId) {
    return this._authorities.get(authorityId);
  }

  listAuthorities() {
    return Array.from(this._authorities.values());
  }

  // Manifest storage
  storeManifest(manifestId, manifest) {
    this._manifests.set(manifestId, manifest);
  }

  getManifest(manifestId) {
    return this._manifests.get(manifestId);
  }

  listManifests() {
    return Array.from(this._manifests.values());
  }

  // Proposal storage
  storeProposal(proposalId, proposal) {
    this._proposals.set(proposalId, proposal);
  }

  getProposal(proposalId) {
    return this._proposals.get(proposalId);
  }

  listProposals() {
    return Array.from(this._proposals.values());
  }

  // Approval storage
  storeApproval(approvalId, approval) {
    this._approvals.set(approvalId, approval);
  }

  getApproval(approvalId) {
    return this._approvals.get(approvalId);
  }

  listApprovals() {
    return Array.from(this._approvals.values());
  }

  // Execution storage
  storeExecution(executionId, execution) {
    this._executions.set(executionId, execution);
  }

  getExecution(executionId) {
    return this._executions.get(executionId);
  }

  listExecutions() {
    return Array.from(this._executions.values());
  }

  // Capability registry
  registerCapability(capabilityId, capability) {
    this._capabilities.set(capabilityId, capability);
  }

  getCapability(capabilityId) {
    return this._capabilities.get(capabilityId);
  }

  listCapabilities() {
    return Array.from(this._capabilities.values());
  }

  // Object registry
  registerObject(objectId, object) {
    this._objects.set(objectId, object);
  }

  getObject(objectId) {
    return this._objects.get(objectId);
  }

  listObjects() {
    return Array.from(this._objects.values());
  }

  // Witness storage
  storeWitness(witnessId, witness) {
    this._witnesses.set(witnessId, witness);
  }

  getWitness(witnessId) {
    return this._witnesses.get(witnessId);
  }

  listWitnesses() {
    return Array.from(this._witnesses.values());
  }

  // Boot state
  storeBootState(bootId, bootState) {
    this._bootState.set(bootId, bootState);
  }

  getBootState(bootId) {
    return this._bootState.get(bootId);
  }

  // Processed files tracking
  addProcessedFile(filePath) {
    this._processedFiles.add(filePath);
  }

  isFileProcessed(filePath) {
    return this._processedFiles.has(filePath);
  }

  removeProcessedFile(filePath) {
    this._processedFiles.delete(filePath);
  }

  getProcessedFiles() {
    return Array.from(this._processedFiles);
  }

  // Conversations
  addConversation(conversationId, metadata = {}) {
    if (!this._conversations.has(conversationId)) {
      this._conversations.set(conversationId, {
        id: conversationId,
        timestamp: new Date(constitutionalTimeAuthority.now()).toISOString(),
        metadata: metadata || {}
      });
    }
  }

  getConversation(conversationId) {
    return this._conversations.get(conversationId);
  }

  getConversations() {
    return Array.from(this._conversations.values());
  }

  deleteConversation(conversationId) {
    this._conversations.delete(conversationId);
  }

  // Backup metadata
  updateLastBackup() {
    this._lastBackup = new Date(constitutionalTimeAuthority.now()).toISOString();
  }

  getLastBackup() {
    return this._lastBackup;
  }

  // Clear all storage (for testing)
  clear() {
    this._authorities.clear();
    this._manifests.clear();
    this._proposals.clear();
    this._approvals.clear();
    this._executions.clear();
    this._capabilities.clear();
    this._objects.clear();
    this._witnesses.clear();
    this._bootState.clear();
    this._processedFiles.clear();
    this._conversations.clear();
    this._lastBackup = null;
  }
}

// Singleton instance
const authorityRepository = new AuthorityRepository();

module.exports = {
  AuthorityRepository,
  authorityRepository,
};
