/**
 * Repository Port
 *
 * Phase 3.3.3 — Constitutional OSS Continuation
 *
 * Port interface for repository operations.
 *
 * Constitutional Constraint:
 * - No git shell execution
 * - No direct child_process usage
 * - All git operations through this port
 */

class RepositoryPort {
  /**
   * Get repository remote URL
   * @returns {Promise<string|null>} Remote URL or null
   */
  async getRemoteUrl() {
    throw new Error('RepositoryPort.getRemoteUrl must be implemented by adapter');
  }

  /**
   * Get current branch
   * @returns {Promise<string>} Branch name
   */
  async getCurrentBranch() {
    throw new Error('RepositoryPort.getCurrentBranch must be implemented by adapter');
  }

  /**
   * Get recent commits
   * @param {number} limit - Number of commits
   * @returns {Promise<Array>} Commits
   */
  async getRecentCommits(limit = 10) {
    throw new Error('RepositoryPort.getRecentCommits must be implemented by adapter');
  }

  /**
   * Get git status
   * @returns {Promise<Object>} Git status
   */
  async getStatus() {
    throw new Error('RepositoryPort.getStatus must be implemented by adapter');
  }

  /**
   * Check if git is available
   * @returns {Promise<boolean>} Git availability
   */
  async isAvailable() {
    throw new Error('RepositoryPort.isAvailable must be implemented by adapter');
  }
}

module.exports = { RepositoryPort };
