/**
 * Snapshot Authority
 * 
 * Ω.49 — Snapshot Authority
 * 
 * Constitutional snapshot creation authority.
 * 
 * Separates snapshot creation from acquisition orchestration.
 * This authority handles creating immutable snapshots from Git data.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalObjectFactory } = require('./constitutional_object_factory');

class SnapshotAuthority {
  constructor() {
    this._authorityVersion = '1.0.0';
  }

  /**
   * Create repository snapshot object
   * @param {Object} repoData - Repository data from Git provider
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Object} Repository snapshot object
   */
  createRepositorySnapshot(repoData, repoId, lifecycleId = null) {
    const snapshotId = identityAuthority.generateId('repository_snapshot', {
      repo_id: repoId,
      timestamp: constitutionalTimeAuthority.now(),
    });

    return constitutionalObjectFactory.createObject({
      id: snapshotId,
      kind: 'RepositorySnapshot',
      schema: '1.0.0',
      authority: 'SnapshotAuthority',
      payload: {
        repo_id: repoId,
        name: repoData.name,
        full_name: repoData.full_name,
        description: repoData.description,
        url: repoData.html_url,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
        default_branch: repoData.default_branch,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        owner: {
          login: repoData.owner.login,
          type: repoData.owner.type,
        },
      },
      metadata: {
        created_at: constitutionalTimeAuthority.nowISO(),
        version: '1.0.0',
        lifecycle_id: lifecycleId,
      },
    });
  }

  /**
   * Create commit snapshot object
   * @param {Object} commitData - Commit data from Git provider
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Object} Commit snapshot object
   */
  createCommitSnapshot(commitData, repoId, lifecycleId = null) {
    const snapshotId = identityAuthority.generateId('commit_snapshot', {
      repo_id: repoId,
      commit_sha: commitData.sha,
      timestamp: constitutionalTimeAuthority.now(),
    });

    return constitutionalObjectFactory.createObject({
      id: snapshotId,
      kind: 'CommitSnapshot',
      schema: '1.0.0',
      authority: 'SnapshotAuthority',
      payload: {
        repo_id: repoId,
        sha: commitData.sha,
        message: commitData.commit?.message || '',
        author: {
          name: commitData.commit?.author?.name || '',
          email: commitData.commit?.author?.email || '',
          date: commitData.commit?.author?.date || '',
        },
        committer: {
          name: commitData.commit?.committer?.name || '',
          email: commitData.commit?.committer?.email || '',
          date: commitData.commit?.committer?.date || '',
        },
        tree_sha: commitData.commit?.tree?.sha || '',
        parents: commitData.parents?.map(p => p.sha) || [],
        url: commitData.url || '',
      },
      metadata: {
        created_at: constitutionalTimeAuthority.nowISO(),
        version: '1.0.0',
        lifecycle_id: lifecycleId,
      },
    });
  }

  /**
   * Create tree snapshot object
   * @param {Object} treeData - Tree data from Git provider
   * @param {string} commitSha - Parent commit SHA
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Object} Tree snapshot object
   */
  createTreeSnapshot(treeData, commitSha, repoId, lifecycleId = null) {
    const snapshotId = identityAuthority.generateId('tree_snapshot', {
      repo_id: repoId,
      tree_sha: treeData.sha,
      commit_sha: commitSha,
      timestamp: constitutionalTimeAuthority.now(),
    });

    return constitutionalObjectFactory.createObject({
      id: snapshotId,
      kind: 'TreeSnapshot',
      schema: '1.0.0',
      authority: 'SnapshotAuthority',
      payload: {
        repo_id: repoId,
        commit_sha: commitSha,
        tree_sha: treeData.sha,
        entries: treeData.tree || [],
      },
      metadata: {
        created_at: constitutionalTimeAuthority.nowISO(),
        version: '1.0.0',
        lifecycle_id: lifecycleId,
      },
    });
  }

  /**
   * Create blob snapshot object
   * @param {Object} blobData - Blob data from Git provider
   * @param {string} treeSha - Parent tree SHA
   * @param {string} commitSha - Parent commit SHA
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Object} Blob snapshot object
   */
  createBlobSnapshot(blobData, treeSha, commitSha, repoId, lifecycleId = null) {
    const snapshotId = identityAuthority.generateId('blob_snapshot', {
      repo_id: repoId,
      blob_sha: blobData.sha,
      tree_sha: treeSha,
      commit_sha: commitSha,
      timestamp: constitutionalTimeAuthority.now(),
    });

    return constitutionalObjectFactory.createObject({
      id: snapshotId,
      kind: 'BlobSnapshot',
      schema: '1.0.0',
      authority: 'SnapshotAuthority',
      payload: {
        repo_id: repoId,
        commit_sha: commitSha,
        tree_sha: treeSha,
        blob_sha: blobData.sha,
        path: blobData.path || '',
        size: blobData.size || 0,
        mode: blobData.mode || '',
        type: blobData.type || '',
      },
      metadata: {
        created_at: constitutionalTimeAuthority.nowISO(),
        version: '1.0.0',
        lifecycle_id: lifecycleId,
      },
    });
  }

  /**
   * Create branch snapshot object
   * @param {Object} branchData - Branch data from Git provider
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Object} Branch snapshot object
   */
  createBranchSnapshot(branchData, repoId, lifecycleId = null) {
    const snapshotId = identityAuthority.generateId('branch_snapshot', {
      repo_id: repoId,
      branch_name: branchData.name,
      timestamp: constitutionalTimeAuthority.now(),
    });

    return constitutionalObjectFactory.createObject({
      id: snapshotId,
      kind: 'BranchSnapshot',
      schema: '1.0.0',
      authority: 'SnapshotAuthority',
      payload: {
        repo_id: repoId,
        name: branchData.name,
        commit_sha: branchData.commit?.sha || '',
        protected: branchData.protected || false,
      },
      metadata: {
        created_at: constitutionalTimeAuthority.nowISO(),
        version: '1.0.0',
        lifecycle_id: lifecycleId,
      },
    });
  }

  /**
   * Create full repository snapshot with all objects
   * @param {Object} snapshotData - Full snapshot data from Git provider
   * @param {string} repoId - Repository identifier
   * @param {string} lifecycleId - Optional lifecycle ID
   * @returns {Array} Array of snapshot objects
   */
  createFullSnapshot(snapshotData, repoId, lifecycleId = null) {
    const objects = [];

    // Repository snapshot
    objects.push(this.createRepositorySnapshot(snapshotData.repo, repoId, lifecycleId));

    // Branch snapshots
    for (const branch of snapshotData.branches || []) {
      objects.push(this.createBranchSnapshot(branch, repoId, lifecycleId));
    }

    // Commit snapshots
    for (const commit of snapshotData.commits || []) {
      objects.push(this.createCommitSnapshot(commit, repoId, lifecycleId));
    }

    // Commit details with trees and blobs
    for (const commitDetail of snapshotData.commitDetails || []) {
      if (commitDetail.tree) {
        objects.push(this.createTreeSnapshot(commitDetail.tree, commitDetail.sha, repoId, lifecycleId));

        // Blob snapshots
        for (const entry of commitDetail.tree.tree || []) {
          if (entry.type === 'blob') {
            objects.push(this.createBlobSnapshot(entry, commitDetail.tree.sha, commitDetail.sha, repoId, lifecycleId));
          }
        }
      }
    }

    return objects;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }
}

// Singleton instance
const snapshotAuthority = new SnapshotAuthority();

module.exports = { SnapshotAuthority, snapshotAuthority };
