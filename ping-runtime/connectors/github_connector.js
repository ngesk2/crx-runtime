/**
 * GitHub Connector — PING Core v1
 *
 * Implements the standardized Connector interface for GitHub.
 * Wraps existing github_adapter.js (getGithubMetadata).
 *
 * Capabilities: repository, commits, pull-requests, branches, contributors
 */

const { getGithubMetadata } = require('./github_adapter');

class GitHubConnector {
  constructor(options = {}) {
    this._authenticated = false;
    this._lastSync = null;
  }

  async authenticate() {
    try {
      const meta = await getGithubMetadata();
      this._authenticated = meta.status === 'available';
      return { status: this._authenticated ? 'ok' : 'error', error: meta.error || null };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async discover() {
    return {
      status: 'ok',
      services: [
        { name: 'repository', capabilities: ['repository', 'commits', 'branches'] },
        { name: 'pull-requests', capabilities: ['pull-requests'] },
        { name: 'contributors', capabilities: ['contributors'] },
      ],
    };
  }

  async health() {
    try {
      const meta = await getGithubMetadata();
      return {
        status: meta.status === 'available' ? 'healthy' : 'error',
        provider: 'github',
        repository: meta.metadata?.full_name || null,
        error: meta.error || null,
      };
    } catch (err) {
      return { status: 'error', provider: 'github', error: err.message };
    }
  }

  async sync(service, options = {}) {
    try {
      const meta = await getGithubMetadata();
      if (meta.status !== 'available') {
        return { status: 'error', error: meta.error };
      }
      this._lastSync = new Date().toISOString();

      switch (service) {
        case 'repository':
          return { status: 'ok', data: meta.metadata, count: 1 };
        case 'commits':
          return { status: 'ok', data: meta.recent_commits, count: meta.recent_commits.length };
        case 'pull-requests':
          return { status: 'ok', data: meta.open_pull_requests, count: meta.open_pull_requests.length };
        case 'branches':
          return { status: 'ok', data: meta.branches, count: meta.branches.length };
        case 'contributors':
          return { status: 'ok', data: meta.top_contributors, count: meta.top_contributors.length };
        default:
          return { status: 'ok', data: meta, count: 1 };
      }
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async events(service, options = {}) {
    const syncResult = await this.sync(service, options);
    if (syncResult.status !== 'ok') return syncResult;

    return {
      status: 'ok',
      events: (Array.isArray(syncResult.data) ? syncResult.data : [syncResult.data]).map(item => ({
        source: `github.${service || 'repository'}`,
        type: this._inferEventType(service, item),
        timestamp: item.date || item.created_at || item.pushed_at || new Date().toISOString(),
        payload: item,
      })),
    };
  }

  async objects(service, options = {}) {
    return this.sync(service, options);
  }

  async search(q, options = {}) {
    const meta = await getGithubMetadata();
    if (meta.status !== 'available') {
      return { status: 'error', error: meta.error };
    }
    const query = q.toLowerCase();
    const results = [];

    for (const commit of (meta.recent_commits || [])) {
      if (commit.message?.toLowerCase().includes(query) || commit.author?.toLowerCase().includes(query)) {
        results.push({ type: 'commit', ...commit });
      }
    }
    for (const pr of (meta.open_pull_requests || [])) {
      if (pr.title?.toLowerCase().includes(query) || pr.author?.toLowerCase().includes(query)) {
        results.push({ type: 'pull-request', ...pr });
      }
    }
    return { status: 'ok', results, count: results.length };
  }

  async permissions() {
    return {
      scopes: ['repo', 'read:org', 'read:user'],
      services: ['repository', 'pull-requests', 'contributors'],
    };
  }

  _inferEventType(service, item) {
    switch (service) {
      case 'commits': return 'COMMIT_SYNCED';
      case 'pull-requests': return 'PR_SYNCED';
      case 'branches': return 'BRANCH_SYNCED';
      case 'contributors': return 'CONTRIBUTOR_SYNCED';
      default: return 'REPOSITORY_SYNCED';
    }
  }
}

module.exports = { GitHubConnector };
