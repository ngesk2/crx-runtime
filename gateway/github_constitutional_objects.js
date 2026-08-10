/**
 * GitHub Constitutional Objects
 * 
 * Milestone 2 — GitHub Constitutional Pipeline
 * 
 * Constitutional Constraint: GitHub data must be transformed into constitutional objects
 * before entering the runtime.
 * 
 * Pipeline:
 * GitHub API
 *       ↓
 * Raw Snapshot
 *       ↓
 * Normalizer
 *       ↓
 * Repository Object
 * Commit Object
 * Tree Object
 * Directory Object
 * Blob Object
 *       ↓
 * CanonicalBytes
 *       ↓
 * CanonicalHash
 *       ↓
 * Identity
 *       ↓
 * RepositoryStore
 * 
 * Verification:
 * - identical blob bytes
 * - identical IDs
 * - identical hashes
 * - identical lineage
 * - identical witnesses
 * 
 * across repeated runs.
 */

const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { canonicalObjectAuthority } = require('./canonical_object_authority');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

/**
 * GitHub Repository Object
 * 
 * Constitutional representation of a GitHub repository
 */
class GitHubRepositoryObject {
  constructor(rawRepositoryData) {
    this._raw = rawRepositoryData;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional repository object
   * @returns {Object} Constitutional repository object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields from raw GitHub data
    const canonicalData = {
      id: this._raw.id,
      node_id: this._raw.node_id,
      name: this._raw.name,
      full_name: this._raw.full_name,
      owner: {
        id: this._raw.owner.id,
        login: this._raw.owner.login,
        type: this._raw.owner.type,
      },
      private: this._raw.private,
      fork: this._raw.fork,
      created_at: this._raw.created_at,
      updated_at: this._raw.updated_at,
      pushed_at: this._raw.pushed_at,
      size: this._raw.size,
      stargazers_count: this._raw.stargazers_count,
      watchers_count: this._raw.watchers_count,
      language: this._raw.language,
      has_issues: this._raw.has_issues,
      has_projects: this._raw.has_projects,
      has_downloads: this._raw.has_downloads,
      has_wiki: this._raw.has_wiki,
      has_pages: this._raw.has_pages,
      forks_count: this._raw.forks_count,
      open_issues_count: this._raw.open_issues_count,
      default_branch: this._raw.default_branch,
      topics: this._raw.topics || [],
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'GitHubRepository');

    // Build lineage
    this._lineage = {
      source_id: null, // Root object
      derivation_path: ['GitHub', 'Repository'],
      provenance_chain: [],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'GitHubRepository',
      authority: 'GitHubConstitutionalPipeline',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubConstitutionalPipeline',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [],
      metadata: {
        github_id: this._raw.id,
        github_node_id: this._raw.node_id,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

/**
 * GitHub Commit Object
 * 
 * Constitutional representation of a GitHub commit
 */
class GitHubCommitObject {
  constructor(rawCommitData, repositoryId) {
    this._raw = rawCommitData;
    this._repositoryId = repositoryId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional commit object
   * @returns {Object} Constitutional commit object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields from raw GitHub data
    const canonicalData = {
      sha: this._raw.sha,
      node_id: this._raw.node_id,
      commit: {
        sha: this._raw.commit.sha,
        tree: {
          sha: this._raw.commit.tree.sha,
        },
        author: {
          name: this._raw.commit.author.name,
          email: this._raw.commit.author.email,
          date: this._raw.commit.author.date,
        },
        committer: {
          name: this._raw.commit.committer.name,
          email: this._raw.commit.committer.email,
          date: this._raw.commit.committer.date,
        },
        message: this._raw.commit.message,
      },
      parents: this._raw.parents.map(p => ({
        sha: p.sha,
      })),
      html_url: this._raw.html_url,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'GitHubCommit');

    // Build lineage
    this._lineage = {
      source_id: this._repositoryId,
      derivation_path: ['GitHub', 'Repository', 'Commit'],
      provenance_chain: [this._repositoryId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'GitHubCommit',
      authority: 'GitHubConstitutionalPipeline',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubConstitutionalPipeline',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._repositoryId,
          relation_type: 'belongs_to',
          strength: 1.0,
          metadata: { kind: 'repository' },
        },
      ],
      metadata: {
        github_sha: this._raw.sha,
        github_node_id: this._raw.node_id,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

/**
 * GitHub Tree Object
 * 
 * Constitutional representation of a GitHub tree
 */
class GitHubTreeObject {
  constructor(rawTreeData, commitId) {
    this._raw = rawTreeData;
    this._commitId = commitId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional tree object
   * @returns {Object} Constitutional tree object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields from raw GitHub data
    const canonicalData = {
      sha: this._raw.sha,
      tree: this._raw.tree.map(entry => ({
        path: entry.path,
        mode: entry.mode,
        type: entry.type,
        sha: entry.sha,
        size: entry.size,
      })),
      truncated: this._raw.truncated,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'GitHubTree');

    // Build lineage
    this._lineage = {
      source_id: this._commitId,
      derivation_path: ['GitHub', 'Commit', 'Tree'],
      provenance_chain: [this._commitId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'GitHubTree',
      authority: 'GitHubConstitutionalPipeline',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubConstitutionalPipeline',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._commitId,
          relation_type: 'belongs_to',
          strength: 1.0,
          metadata: { kind: 'commit' },
        },
      ],
      metadata: {
        github_sha: this._raw.sha,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

/**
 * GitHub Directory Object
 * 
 * Constitutional representation of a GitHub directory
 */
class GitHubDirectoryObject {
  constructor(path, treeEntries, treeId) {
    this._path = path;
    this._treeEntries = treeEntries;
    this._treeId = treeId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional directory object
   * @returns {Object} Constitutional directory object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      path: this._path,
      entries: this._treeEntries.map(entry => ({
        path: entry.path,
        mode: entry.mode,
        type: entry.type,
        sha: entry.sha,
      })),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'GitHubDirectory');

    // Build lineage
    this._lineage = {
      source_id: this._treeId,
      derivation_path: ['GitHub', 'Tree', 'Directory'],
      provenance_chain: [this._treeId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'GitHubDirectory',
      authority: 'GitHubConstitutionalPipeline',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubConstitutionalPipeline',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._treeId,
          relation_type: 'belongs_to',
          strength: 1.0,
          metadata: { kind: 'tree' },
        },
      ],
      metadata: {
        path: this._path,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

/**
 * GitHub Blob Object
 * 
 * Constitutional representation of a GitHub blob (file content)
 */
class GitHubBlobObject {
  constructor(rawBlobData, path, treeId) {
    this._raw = rawBlobData;
    this._path = path;
    this._treeId = treeId;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional blob object
   * @returns {Object} Constitutional blob object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      path: this._path,
      sha: this._raw.sha,
      size: this._raw.size,
      content: this._raw.content, // Base64 encoded content
      encoding: this._raw.encoding || 'utf-8',
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'GitHubBlob');

    // Build lineage
    this._lineage = {
      source_id: this._treeId,
      derivation_path: ['GitHub', 'Tree', 'Blob'],
      provenance_chain: [this._treeId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'GitHubBlob',
      authority: 'GitHubConstitutionalPipeline',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: timestamp,
        created_by: 'GitHubConstitutionalPipeline',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._treeId,
          relation_type: 'belongs_to',
          strength: 1.0,
          metadata: { kind: 'tree' },
        },
      ],
      metadata: {
        path: this._path,
        github_sha: this._raw.sha,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

module.exports = {
  GitHubRepositoryObject,
  GitHubCommitObject,
  GitHubTreeObject,
  GitHubDirectoryObject,
  GitHubBlobObject,
};
