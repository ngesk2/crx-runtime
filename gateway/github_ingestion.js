const crypto = require('crypto');
const { emitEvent } = require('./event_emitter');

async function ingestGithubData(githubData) {
  if (!githubData || githubData.status !== 'available') return { ingested: 0, events: [] };
  const meta = githubData.metadata || {};
  const events = [];

  const repoEvent = await emitEvent('github', 'REPOSITORY_DISCOVERED', {
    name: meta.full_name || meta.name || 'unknown',
    owner: meta.full_name?.split('/')[0] || 'unknown',
    description: meta.description || '',
    default_branch: meta.default_branch || 'main',
    private: !!meta.private,
    stars: meta.stars || 0,
    forks: meta.forks || 0,
    language: meta.language || '',
    topics: meta.topics || [],
    url: `https://github.com/${meta.full_name || ''}`,
    license: meta.license || null,
    created_at: meta.created_at,
    updated_at: meta.updated_at,
    pushed_at: meta.pushed_at,
  });
  if (repoEvent) events.push({ type: 'REPOSITORY_DISCOVERED', id: meta.full_name });

  for (const commit of (githubData.recent_commits || []).slice(0, 10)) {
    const ok = await emitEvent('github', 'COMMIT_CREATED', {
      sha: commit.sha,
      message: commit.message,
      author: commit.author,
      date: commit.date,
      repository: meta.full_name,
      branch: meta.default_branch || 'main',
    });
    if (ok) events.push({ type: 'COMMIT_CREATED', id: commit.sha });
  }

  for (const pr of (githubData.open_pull_requests || []).slice(0, 5)) {
    const ok = await emitEvent('github', 'FILE_INDEXED', {
      type: 'pull_request',
      number: pr.number,
      title: pr.title,
      author: pr.author,
      state: pr.state,
      labels: pr.labels,
      repository: meta.full_name,
      created_at: pr.created_at,
    });
    if (ok) events.push({ type: 'PULL_REQUEST_INDEXED', id: `pr_${pr.number}` });
  }

  for (const branch of (githubData.branches || []).slice(0, 10)) {
    const ok = await emitEvent('github', 'FILE_DISCOVERED', {
      type: 'branch',
      name: branch.name,
      commit_sha: branch.commit_sha,
      protected: branch.protected,
      repository: meta.full_name,
    });
    if (ok) events.push({ type: 'BRANCH_DISCOVERED', id: branch.name });
  }

  const ok2 = await emitEvent('github', 'FILE_INDEXED', {
    type: 'languages',
    languages: githubData.languages || {},
    repository: meta.full_name,
  });
  if (ok2) events.push({ type: 'LANGUAGES_INDEXED' });

  return { ingested: events.length, events };
}

module.exports = { ingestGithubData };
