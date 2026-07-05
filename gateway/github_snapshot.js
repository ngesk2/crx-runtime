const { CanonicalAuthority } = require('./canonical_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { RepositoryProvider } = require('./repository_provider');

const GITHUB_OWNER = process.env.GITHUB_OWNER || '';
const GITHUB_REPO = process.env.GITHUB_REPO || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

class GitHubSnapshot extends RepositoryProvider {
  constructor() {
    super();
    this._namespace = 'github';
    this._rateLimitRemaining = 5000;
    this._rateLimitReset = null;
    this._version = '1.0.0';
  }

  getNamespace() {
    return this._namespace;
  }

  getVersion() {
    return this._version;
  }

  isConfigured() {
    return !!(GITHUB_OWNER && GITHUB_REPO && GITHUB_TOKEN);
  }

  getRepositoryIdentifier() {
    return `${GITHUB_OWNER}/${GITHUB_REPO}`;
  }

  getRateLimit() {
    return {
      remaining: this._rateLimitRemaining,
      reset: this._rateLimitReset,
    };
  }

  isRateLimited() {
    return this._rateLimitRemaining <= 0;
  }

  async fetchBranch(branchName) {
    return this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches/${branchName}`);
  }

  async fetchCommit(commitSha) {
    return this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${commitSha}`);
  }

  async fetchFile(path, ref) {
    const result = await this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${ref}`);
    if (result.encoding === 'base64') {
      return Buffer.from(result.content, 'base64').toString('utf-8');
    }
    return result.content;
  }

  async fetchTree(ref, recursive = false) {
    const recursiveParam = recursive ? '?recursive=1' : '';
    return this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${ref}${recursiveParam}`);
  }

  async fetchSnapshot() {
    const repo = await this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
    const branches = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches`);
    const commits = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`);
    const pulls = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=all`);
    const issues = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&filter=all`);
    const releases = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`);
    const tags = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/tags`);
    const contributors = await this._paginate(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contributors`);

    // Fetch tree and blobs for each commit (immutable snapshot)
    const commitDetails = await this._fetchCommitDetails(commits);

    return { repo, branches, commits, pulls, issues, releases, tags, contributors, commitDetails };
  }

  async _fetchCommitDetails(commits) {
    const details = [];
    
    for (const commit of commits.slice(0, 50)) { // Limit to 50 commits for initial snapshot
      try {
        // Fetch commit tree
        const tree = await this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${commit.sha}?recursive=1`);
        
        // Fetch commit metadata
        const commitMeta = await this._api(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${commit.sha}`);
        
        details.push({
          sha: commit.sha,
          tree: tree.tree,
          tree_sha: tree.sha,
          commit: commitMeta,
          canonical_hash: this._computeCommitHash(commit.sha, tree.sha),
        });
      } catch (error) {
        console.error(`Failed to fetch details for commit ${commit.sha}:`, error.message);
      }
    }
    
    return details;
  }

  _computeCommitHash(commitSha, treeSha) {
    const input = `${GITHUB_OWNER}/${GITHUB_REPO}/commit/${commitSha}/tree/${treeSha}`;
    return CanonicalAuthority.hash(input);
  }

  buildConstitutionalObjects(data, lifecycleId = null) {
    const objects = [];
    const now = constitutionalTimeAuthority.nowISO();

    const repoId = this._generateId('repository', data.repo.full_name || data.repo.name);
    const repoObj = this._createConstitutionalObject('Repository', repoId, {
      name: data.repo.name,
      full_name: data.repo.full_name,
      description: data.repo.description,
      url: data.repo.html_url,
      language: data.repo.language,
      stars: data.repo.stargazers_count,
      forks: data.repo.forks_count,
      open_issues: data.repo.open_issues_count,
      default_branch: data.repo.default_branch,
      created_at: data.repo.created_at,
      updated_at: data.repo.updated_at,
      owner: {
        login: data.repo.owner.login,
        type: data.repo.owner.type,
      },
    }, now, lifecycleId);
    objects.push(repoObj);

    for (const branch of data.branches) {
      const branchId = this._generateId('branch', branch.name);
      const bObj = this._createConstitutionalObject('Branch', branchId, {
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url,
        },
        protected: branch.protected,
      }, now, lifecycleId);
      bObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(bObj);
    }

    for (const commit of data.commits) {
      const commitId = this._generateId('commit', commit.sha);
      const cObj = this._createConstitutionalObject('Commit', commitId, {
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          date: commit.commit.committer.date,
        },
        tree: {
          sha: commit.commit.tree.sha,
          url: commit.commit.tree.url,
        },
        parents: commit.parents.map(p => ({
          sha: p.sha,
          url: p.url,
        })),
        url: commit.html_url,
        // Immutable snapshot data
        tree_sha: commit.commit.tree.sha,
        canonical_hash: this._computeCommitHash(commit.sha, commit.commit.tree.sha),
      }, now, lifecycleId);
      cObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(cObj);
    }

    for (const pr of data.pulls) {
      const prId = this._generateId('pull_request', String(pr.number));
      const pObj = this._createConstitutionalObject('PullRequest', prId, {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        user: {
          login: pr.user.login,
        },
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
        },
        mergeable: pr.mergeable,
        merged: pr.merged,
      }, now, lifecycleId);
      pObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(pObj);
    }

    for (const issue of data.issues) {
      if (issue.pull_request) continue;
      const issueId = this._generateId('issue', String(issue.number));
      const iObj = this._createConstitutionalObject('Issue', issueId, {
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        user: {
          login: issue.user.login,
        },
        assignees: issue.assignees.map(a => ({ login: a.login })),
        labels: issue.labels.map(l => ({
          name: l.name,
          color: l.color,
        })),
      }, now, lifecycleId);
      iObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(iObj);
    }

    for (const release of data.releases) {
      const releaseId = this._generateId('release', release.tag_name);
      const rObj = this._createConstitutionalObject('Release', releaseId, {
        tag_name: release.tag_name,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease,
        created_at: release.created_at,
        published_at: release.published_at,
        author: {
          login: release.author.login,
        },
        assets: release.assets.map(a => ({
          name: a.name,
          size: a.size,
          download_count: a.download_count,
        })),
      }, now, lifecycleId);
      rObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(rObj);
    }

    for (const tag of data.tags) {
      const tagId = this._generateId('tag', tag.name);
      const tObj = this._createConstitutionalObject('Tag', tagId, {
        name: tag.name,
        commit: {
          sha: tag.commit.sha,
          url: tag.commit.url,
        },
        zipball_url: tag.zipball_url,
        tarball_url: tag.tarball_url,
      }, now, lifecycleId);
      tObj.relationships.push({
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      });
      objects.push(tObj);
    }

    for (const contributor of data.contributors) {
      const contributorId = this._generateId('contributor', contributor.login);
      const cObj = this._createConstitutionalObject('Contributor', contributorId, {
        login: contributor.login,
        id: contributor.id,
        avatar_url: contributor.avatar_url,
        type: contributor.type,
        contributions: contributor.contributions,
      }, now, lifecycleId);
      cObj.relationships.push({
        target_id: repoId,
        relation_type: 'contributes_to_repository',
        strength: contributor.contributions / Math.max(...data.contributors.map(c => c.contributions)),
        metadata: {},
      });
      objects.push(cObj);
    }

    return objects;
  }

  _createConstitutionalObject(kind, id, payload, timestamp, lifecycleId = null) {
    const canonicalHash = CanonicalAuthority.hash(payload);

    return {
      id,
      kind,
      authority: 'RepositoryAuthority',
      identity: {
        namespace: this._namespace,
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubSnapshot',
      },
      canonical_hash: canonicalHash,
      lineage: {
        source_id: id,
        derivation_path: [kind],
        provenance_chain: [],
      },
      health: 'healthy',
      confidence: 1.0,
      relationships: [],
      metadata: {
        lifecycle_id: lifecycleId,
        timestamp,
        schema_version: '1.0.0',
        constitution_version: '1.0.0',
        runtime_version: '1.0.0',
      },
      payload,
    };
  }

  _generateId(kind, identifier) {
    // Generate deterministic ID using CanonicalAuthority
    const input = `${GITHUB_OWNER}/${GITHUB_REPO}/${kind}/${identifier}`;
    return CanonicalAuthority.hash(input);
  }

  async _paginate(path) {
    // Automatic pagination for GitHub API
    const results = [];
    let page = 1;
    const perPage = 100; // Maximum allowed by GitHub
    let hasMore = true;

    while (hasMore) {
      const url = `${path}?per_page=${perPage}&page=${page}`;
      const data = await this._api(url);
      
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        results.push(...data);
        if (data.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    return results;
  }

  async _api(path) {
    // Check rate limit and wait if necessary
    await this._checkRateLimit();

    const url = `https://api.github.com${path}`;
    const headers = {
      'User-Agent': 'crx-gateway/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });

    // Update rate limit from response headers
    const remaining = resp.headers.get('X-RateLimit-Remaining');
    const reset = resp.headers.get('X-RateLimit-Reset');
    if (remaining !== null) this._rateLimitRemaining = parseInt(remaining, 10);
    if (reset !== null) this._rateLimitReset = parseInt(reset, 10) * 1000;

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`GitHub API ${resp.status} for ${path}: ${text.substring(0, 200)}`);
    }
    return resp.json();
  }

  async _checkRateLimit() {
    if (this._rateLimitRemaining <= 1 && this._rateLimitReset) {
      const now = constitutionalTimeAuthority.nowAsMillis();
      const waitTime = this._rateLimitReset - now;
      if (waitTime > 0) {
        console.log(`GitHub rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this._rateLimitRemaining = 5000; // Reset after waiting
      }
    }
  }
}

module.exports = { GitHubSnapshot };
