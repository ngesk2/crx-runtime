/**
 * Git Transport
 * 
 * Ω.49 — Git Transport
 * 
 * Transport layer for Git repository acquisition.
 * 
 * Separates Git transport operations from acquisition orchestration.
 * This transport handles fetching from Git providers (GitHub, GitLab, etc.).
 */

const { GitHubSnapshot } = require('./github_snapshot');

class GitTransport {
  constructor() {
    this._githubSnapshot = new GitHubSnapshot();
    this._transportVersion = '1.0.0';
  }

  /**
   * Fetch repository snapshot
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Object} Repository snapshot
   */
  async fetchRepository(owner, repo) {
    if (!this._githubSnapshot.isConfigured()) {
      throw new Error('GitHub provider not configured');
    }

    // Use direct API calls with owner/repo instead of mutating process.env
    const repoData = await this._githubSnapshot._api(`/repos/${owner}/${repo}`);
    const branches = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/branches`);
    const commits = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/commits`);
    const pulls = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/pulls?state=all`);
    const issues = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/issues?state=all&filter=all`);
    const releases = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/releases`);
    const tags = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/tags`);
    const contributors = await this._githubSnapshot._paginate(`/repos/${owner}/${repo}/contributors`);

    const commitDetails = await this._fetchCommitDetails(commits, owner, repo);

    return { repo: repoData, branches, commits, pulls, issues, releases, tags, contributors, commitDetails };
  }

  async _fetchCommitDetails(commits, owner, repo) {
    const details = [];
    
    for (const commit of commits.slice(0, 50)) {
      try {
        const tree = await this._githubSnapshot._api(`/repos/${owner}/${repo}/git/trees/${commit.sha}?recursive=1`);
        const commitMeta = await this._githubSnapshot._api(`/repos/${owner}/${repo}/commits/${commit.sha}`);
        
        details.push({
          sha: commit.sha,
          tree: tree.tree,
          tree_sha: tree.sha,
          commit: commitMeta,
          canonical_hash: this._computeCommitHash(owner, repo, commit.sha, tree.sha),
        });
      } catch (error) {
        console.error(`Failed to fetch details for commit ${commit.sha}:`, error.message);
      }
    }
    
    return details;
  }

  _computeCommitHash(owner, repo, commitSha, treeSha) {
    const input = `${owner}/${repo}/commit/${commitSha}/tree/${treeSha}`;
    const { CanonicalAuthority } = require('./canonical_authority');
    return CanonicalAuthority.hash(input);
  }

  /**
   * Fetch single commit
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} commitSha - Commit SHA
   * @returns {Object} Commit data
   */
  async fetchCommit(owner, repo, commitSha) {
    const commit = await this._githubSnapshot._api(`/repos/${owner}/${repo}/commits/${commitSha}`);
    return commit;
  }

  /**
   * Fetch commit tree
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} treeSha - Tree SHA
   * @param {boolean} recursive - Recursive tree
   * @returns {Object} Tree data
   */
  async fetchTree(owner, repo, treeSha, recursive = false) {
    const recursiveParam = recursive ? '?recursive=1' : '';
    const tree = await this._githubSnapshot._api(`/repos/${owner}/${repo}/git/trees/${treeSha}${recursiveParam}`);
    return tree;
  }

  /**
   * Fetch file content
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} ref - Git reference
   * @returns {string} File content
   */
  async fetchFile(owner, repo, path, ref) {
    const result = await this._githubSnapshot._api(`/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
    if (result.encoding === 'base64') {
      return Buffer.from(result.content, 'base64').toString('utf-8');
    }
    return result.content;
  }

  /**
   * Fetch branch
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branchName - Branch name
   * @returns {Object} Branch data
   */
  async fetchBranch(owner, repo, branchName) {
    const branch = await this._githubSnapshot._api(`/repos/${owner}/${repo}/branches/${branchName}`);
    return branch;
  }

  /**
   * Get repository identifier
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {string} Repository identifier
   */
  getRepositoryIdentifier(owner, repo) {
    return `${owner}/${repo}`;
  }

  /**
   * Check if provider is configured
   * @returns {boolean} Provider is configured
   */
  isConfigured() {
    return this._githubSnapshot.isConfigured();
  }

  /**
   * Get rate limit information
   * @returns {Object} Rate limit information
   */
  getRateLimit() {
    return this._githubSnapshot.getRateLimit();
  }

  /**
   * Check if rate limited
   * @returns {boolean} Rate limited
   */
  isRateLimited() {
    return this._githubSnapshot.isRateLimited();
  }

  /**
   * Get transport version
   * @returns {string} Transport version
   */
  getTransportVersion() {
    return this._transportVersion;
  }

  /**
   * Get provider namespace
   * @returns {string} Provider namespace
   */
  getProviderNamespace() {
    return this._githubSnapshot.getNamespace();
  }
}

module.exports = { GitTransport };
