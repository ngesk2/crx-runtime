/**
 * Repository Discovery Authority
 *
 * Phase 3.3.4 — Constitutional OSS Continuation
 *
 * Discovers repository identity from git remote or environment.
 *
 * Constitutional Constraint:
 * - No shell execution
 * - Uses RepositoryPort for git operations
 * - GitHubAdapter consumes discovered identity
 */

const { simpleGitAdapter } = require('./simple_git_adapter');

class RepositoryDiscoveryAuthority {
  constructor() {
    this._cachedIdentity = null;
  }

  /**
   * Discover repository identity
   * @returns {Promise<Object>} Repository identity { owner, repo, source }
   */
  async discoverRepositoryIdentity() {
    if (this._cachedIdentity) {
      return this._cachedIdentity;
    }

    // Check environment overrides
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (owner && repo) {
      this._cachedIdentity = { owner, repo, source: 'environment' };
      return this._cachedIdentity;
    }

    // Discover from git remote
    const remoteUrl = await simpleGitAdapter.getRemoteUrl();
    if (!remoteUrl) {
      return { status: 'unavailable', error: 'No git remote found' };
    }

    const info = this._parseGitRemote(remoteUrl);
    if (!info) {
      return { status: 'unavailable', error: 'Could not parse git remote' };
    }

    this._cachedIdentity = { ...info, source: 'git' };
    return this._cachedIdentity;
  }

  /**
   * Parse git remote URL
   * @param {string} url - Git remote URL
   * @returns {Object|null} { owner, repo } or null
   */
  _parseGitRemote(url) {
    if (!url) return null;

    // Handle git@github.com:owner/repo.git
    const sshMatch = url.match(/git@github\.com[:\/](.+?)\/(.+?)(?:\.git)?$/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2].replace(/\.git$/, '') };
    }

    // Handle https://github.com/owner/repo.git
    const httpsMatch = url.match(/https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2].replace(/\.git$/, '') };
    }

    return null;
  }

  /**
   * Clear cached identity
   */
  clearCache() {
    this._cachedIdentity = null;
  }
}

// Singleton instance
const repositoryDiscoveryAuthority = new RepositoryDiscoveryAuthority();

module.exports = { RepositoryDiscoveryAuthority, repositoryDiscoveryAuthority };
