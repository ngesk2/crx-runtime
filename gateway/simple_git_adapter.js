/**
 * SimpleGit Adapter
 *
 * Phase 3.3.3 — Constitutional OSS Continuation
 *
 * simple-git implementation of RepositoryPort.
 *
 * Constitutional Constraint:
 * - No shell execution
 * - No direct child_process usage
 * - All git operations through simple-git
 */

const simpleGit = require('simple-git');
const { RepositoryPort } = require('./repository_port');

class SimpleGitAdapter extends RepositoryPort {
  constructor(options = {}) {
    super();
    this._git = simpleGit(options.basePath || process.cwd());
  }

  /**
   * Get repository remote URL
   * @returns {Promise<string|null>} Remote URL or null
   */
  async getRemoteUrl() {
    try {
      const remotes = await this._git.getRemotes(true);
      const origin = remotes.find(r => r.name === 'origin');
      return origin ? origin.refs.fetch : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current branch
   * @returns {Promise<string>} Branch name
   */
  async getCurrentBranch() {
    try {
      const summary = await this._git.status();
      return summary.current || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get recent commits
   * @param {number} limit - Number of commits
   * @returns {Promise<Array>} Commits
   */
  async getRecentCommits(limit = 10) {
    try {
      const log = await this._git.log({ maxCount: limit });
      return log.all.map(commit => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get git status
   * @returns {Promise<Object>} Git status
   */
  async getStatus() {
    try {
      const status = await this._git.status();
      return {
        branch: status.current,
        files: status.files.map(f => ({
          path: f.path,
          status: f.working_dir,
        })),
        staged: status.staged.length,
        modified: status.modified.length,
        untracked: status.not_added.length,
      };
    } catch (error) {
      return { branch: 'unknown', files: [], staged: 0, modified: 0, untracked: 0 };
    }
  }

  /**
   * Check if git is available
   * @returns {Promise<boolean>} Git availability
   */
  async isAvailable() {
    try {
      await this._git.version();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const simpleGitAdapter = new SimpleGitAdapter();

module.exports = { SimpleGitAdapter, simpleGitAdapter };
