const https = require('https');
const { repositoryDiscoveryAuthority } = require('./repository_discovery_authority');

function parseGithubUrl(url) {
  if (!url) return null;
  // Handle git@github.com:owner/repo.git and https://github.com/owner/repo.git
  const m = url.match(/github\.com[:\/](.+?)\/(.+?)(?:\.git)?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

function githubFetch(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos${path}`,
      headers: { 'User-Agent': 'crx-gateway/1.0', 'Accept': 'application/vnd.github.v3+json' },
      timeout: 10000
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('JSON parse error')); }
        } else if (res.statusCode === 403) {
          resolve(null); // Rate limited
        } else {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

let _overrides = null;
function setGithubOverrides(owner, repo) {
  _overrides = { owner, repo };
}

async function getGithubMetadata() {
  const identity = await repositoryDiscoveryAuthority.discoverRepositoryIdentity();
  if (identity.status === 'unavailable') {
    return identity;
  }

  const { owner, repo } = identity;

  const [repoData, commits, prs, branches, contributors, languages] = await Promise.all([
    githubFetch(`/${owner}/${repo}`).catch(() => null),
    githubFetch(`/${owner}/${repo}/commits?per_page=10`).catch(() => null),
    githubFetch(`/${owner}/${repo}/pulls?state=open&per_page=5`).catch(() => null),
    githubFetch(`/${owner}/${repo}/branches?per_page=10`).catch(() => null),
    githubFetch(`/${owner}/${repo}/contributors?per_page=5`).catch(() => null),
    githubFetch(`/${owner}/${repo}/languages`).catch(() => null),
  ]);

  if (!repoData) {
    return { status: 'unavailable', error: 'GitHub API rate limited or unreachable' };
  }

  const recentCommits = (commits || []).map(c => ({
    sha: c.sha?.substring(0, 7),
    message: c.commit?.message?.split('\n')[0] || '',
    author: c.commit?.author?.name || 'unknown',
    date: c.commit?.author?.date || null,
  }));

  const openPRs = (prs || []).map(p => ({
    number: p.number,
    title: p.title,
    author: p.user?.login || 'unknown',
    state: p.state,
    created_at: p.created_at,
    labels: (p.labels || []).map(l => l.name),
  }));

  const branchList = (branches || []).map(b => ({
    name: b.name,
    commit_sha: b.commit?.sha?.substring(0, 7),
    protected: b.protected || false,
  }));

  const topContributors = (contributors || []).map(c => ({
    login: c.login,
    contributions: c.contributions,
    avatar_url: c.avatar_url,
  }));

  const langBytes = languages || {};

  return {
    status: 'available',
    metadata: {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description || '',
      default_branch: repoData.default_branch,
      private: repoData.private,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      open_issues: repoData.open_issues_count || 0,
      watchers: repoData.subscribers_count || 0,
      language: repoData.language || '',
      topics: repoData.topics || [],
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      pushed_at: repoData.pushed_at,
      size_kb: repoData.size || 0,
      license: repoData.license?.spdx_id || null,
    },
    recent_commits: recentCommits,
    open_pull_requests: openPRs,
    branches: branchList,
    top_contributors: topContributors,
    languages: langBytes,
  };
}

module.exports = { getGithubMetadata, parseGithubUrl, setGithubOverrides };
