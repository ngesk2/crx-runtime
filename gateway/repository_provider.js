/**
 * Repository Provider Interface
 * 
 * Ω.49 — Repository Provider Interface
 * 
 * Abstract interface for repository snapshot providers.
 * 
 * Separates repository access from implementation.
 * Allows for multiple providers (GitHub, GitLab, local git, etc.).
 */

class RepositoryProvider {
  /**
   * Fetch repository snapshot
   * @returns {Object} Repository snapshot data
   */
  async fetchSnapshot() {
    throw new Error('fetchSnapshot() must be implemented by subclass');
  }

  /**
   * Fetch commit details
   * @param {Array} commits - Array of commit objects
   * @returns {Array} Commit details with tree information
   */
  async fetchCommitDetails(commits) {
    throw new Error('fetchCommitDetails() must be implemented by subclass');
  }

  /**
   * Build constitutional objects from snapshot data
   * @param {Object} data - Snapshot data
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Array} Constitutional objects
   */
  buildConstitutionalObjects(data, lifecycleId = null) {
    throw new Error('buildConstitutionalObjects() must be implemented by subclass');
  }

  /**
   * Get provider namespace
   * @returns {string} Provider namespace
   */
  getNamespace() {
    throw new Error('getNamespace() must be implemented by subclass');
  }

  /**
   * Get provider version
   * @returns {string} Provider version
   */
  getVersion() {
    throw new Error('getVersion() must be implemented by subclass');
  }

  /**
   * Check if provider is configured
   * @returns {boolean} Provider is configured
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented by subclass');
  }

  /**
   * Get repository identifier
   * @returns {string} Repository identifier
   */
  getRepositoryIdentifier() {
    throw new Error('getRepositoryIdentifier() must be implemented by subclass');
  }

  /**
   * Get rate limit information
   * @returns {Object} Rate limit information
   */
  getRateLimit() {
    throw new Error('getRateLimit() must be implemented by subclass');
  }

  /**
   * Check rate limit
   * @returns {boolean} Rate limit exceeded
   */
  isRateLimited() {
    throw new Error('isRateLimited() must be implemented by subclass');
  }

  /**
   * Fetch single branch
   * @param {string} branchName - Branch name
   * @returns {Object} Branch data
   */
  async fetchBranch(branchName) {
    throw new Error('fetchBranch() must be implemented by subclass');
  }

  /**
   * Fetch single commit
   * @param {string} commitSha - Commit SHA
   * @returns {Object} Commit data
   */
  async fetchCommit(commitSha) {
    throw new Error('fetchCommit() must be implemented by subclass');
  }

  /**
   * Fetch file content
   * @param {string} path - File path
   * @param {string} ref - Git reference (branch, tag, or SHA)
   * @returns {string} File content
   */
  async fetchFile(path, ref) {
    throw new Error('fetchFile() must be implemented by subclass');
  }

  /**
   * Fetch repository tree
   * @param {string} ref - Git reference
   * @param {boolean} recursive - Recursive tree
   * @returns {Object} Tree data
   */
  async fetchTree(ref, recursive = false) {
    throw new Error('fetchTree() must be implemented by subclass');
  }
}

module.exports = { RepositoryProvider };
