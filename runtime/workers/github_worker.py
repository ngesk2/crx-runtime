"""GitHubWorker — persistent worker that syncs GitHub data into constitutional events.

Keeps a persistent HTTP client to the GitHub API.
Loops continuously, fetching repository metadata, commits, PRs, branches,
and emitting REPOSITORY_DISCOVERED, COMMIT_CREATED, FILE_INDEXED events.
"""

import json
import time
from typing import Optional, Dict, Any, List
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from runtime.workers.worker_base import WorkerBase
from runtime.config import config
from runtime.authorities.repository_authority import RepositoryAuthority
from runtime.authorities.identity_authority import IdentityAuthority


class GitHubWorker(WorkerBase):
    """Persistent GitHub sync worker. Runs inside the worker pool."""

    name = 'GitHubWorker'
    poll_interval = 300.0  # 5 minutes

    def __init__(self):
        super().__init__()
        self._owner: str = ''
        self._repo: str = ''
        self._token: str = ''
        self._last_data: Optional[dict] = None
        self._prev_commits: set = set()

    def setup(self):
        gcfg = config().get_github_config()
        self._owner = gcfg.get('owner', '')
        self._repo = gcfg.get('repo', '')
        self._token = gcfg.get('token', '')
        if not self._owner or not self._repo:
            self.log.warning('No GITHUB_OWNER / GITHUB_REPO configured — worker idle')

    def poll(self) -> List[Dict[str, Any]]:
        """Return GitHub API responses as work items."""
        if not self._owner or not self._repo:
            time.sleep(self.poll_interval)
            return []
        try:
            meta = self._github_get(f'/repos/{self._owner}/{self._repo}')
            commits = self._github_get(f'/repos/{self._owner}/{self._repo}/commits?per_page=10') or []
            prs = self._github_get(f'/repos/{self._owner}/{self._repo}/pulls?state=open&per_page=5') or []
            branches = self._github_get(f'/repos/{self._owner}/{self._repo}/branches?per_page=10') or []
            contributors = self._github_get(f'/repos/{self._owner}/{self._repo}/contributors?per_page=5') or []
            languages = self._github_get(f'/repos/{self._owner}/{self._repo}/languages') or {}

            new_commits = {c['sha'] for c in commits if isinstance(c, dict)}
            has_new = new_commits - self._prev_commits
            self._prev_commits = new_commits

            if meta and has_new:
                self._last_data = {
                    'metadata': meta,
                    'commits': commits,
                    'pull_requests': prs,
                    'branches': branches,
                    'contributors': contributors,
                    'languages': languages,
                    'new_commits': list(has_new)[:10],
                }
                return [self._last_data]
        except Exception as e:
            self.log.error(f'GitHub fetch error: {e}')
        return []

    def process_event(self, event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Emit constitutional events from GitHub data."""
        meta = event.get('metadata', {})
        full_name = meta.get('full_name', f'{self._owner}/{self._repo}')

        # Emit REPOSITORY_DISCOVERED
        self._emit_event('REPOSITORY_DISCOVERED', full_name, {
            'full_name': full_name,
            'description': meta.get('description', ''),
            'default_branch': meta.get('default_branch', 'main'),
            'stars': meta.get('stargazers_count', 0),
            'forks': meta.get('forks_count', 0),
            'language': meta.get('language', ''),
            'topics': meta.get('topics', []),
        })

        # Emit COMMIT_CREATED for new commits
        for commit in (event.get('commits') or []):
            sha = commit.get('sha', '')
            if sha in (event.get('new_commits') or []):
                self._emit_event('COMMIT_CREATED', sha, {
                    'sha': sha[:7],
                    'message': (commit.get('commit', {}) or {}).get('message', '').split('\n')[0],
                    'author': (commit.get('commit', {}) or {}).get('author', {}).get('name', 'unknown'),
                    'date': (commit.get('commit', {}) or {}).get('author', {}).get('date', ''),
                })

        # Emit FILE_INDEXED for each branch
        for branch in (event.get('branches') or []):
            self._emit_event('FILE_INDEXED', branch.get('name', ''), {
                'branch': branch.get('name', ''),
                'commit_sha': (branch.get('commit', {}) or {}).get('sha', '')[:7],
                'protected': branch.get('protected', False),
            })

        return {'full_name': full_name, 'events_emitted': 1 + len(event.get('new_commits', [])) + len(event.get('branches', []))}

    def _emit_event(self, event_type: str, aggregate_id: str, payload: dict):
        """Emit a constitutional event via RepositoryAuthority."""
        event_id = IdentityAuthority.generate_id()
        with RepositoryAuthority._get_adapter().get_cursor() as cur:
            cur.execute("""
                INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
                VALUES (%s, %s, NOW(), %s, %s, %s)
            """, (event_id, event_type, aggregate_id, 'GITHUB', json.dumps(payload)))

    def _github_get(self, path: str) -> Any:
        """Fetch from GitHub REST API."""
        url = f'https://api.github.com{path}'
        req = Request(url)
        req.add_header('User-Agent', 'ping-worker/1.0')
        req.add_header('Accept', 'application/vnd.github.v3+json')
        if self._token:
            req.add_header('Authorization', f'token {self._token}')
        try:
            with urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            if e.code == 403:
                self.log.warning('GitHub API rate limited')
            elif e.code == 404:
                self.log.warning(f'GitHub path not found: {path}')
            return None
        except Exception as e:
            self.log.error(f'GitHub HTTP error: {e}')
            return None


if __name__ == '__main__':
    worker = GitHubWorker()
    worker.run_forever()
