/**
 * GitHub Normalizer
 * 
 * Milestone 2 — GitHub Constitutional Pipeline
 * 
 * Constitutional Constraint: Transform raw GitHub snapshot into constitutional objects.
 * 
 * Pipeline:
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
 */

const {
  GitHubRepositoryObject,
  GitHubCommitObject,
  GitHubTreeObject,
  GitHubDirectoryObject,
  GitHubBlobObject,
} = require('./github_constitutional_objects');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

class GitHubNormalizer {
  constructor() {
    this._namespace = 'github';
    this._version = '1.0.0';
  }

  /**
   * Normalize raw GitHub snapshot into constitutional objects
   * 
   * @param {Object} rawSnapshot - Raw GitHub snapshot from API
   * @returns {Object} Constitutional objects
   */
  normalize(rawSnapshot) {
    const constitutionalObjects = {
      repository: null,
      commits: [],
      trees: [],
      directories: [],
      blobs: [],
    };

    // Build repository object
    const repositoryBuilder = new GitHubRepositoryObject(rawSnapshot.repo);
    const repositoryObject = repositoryBuilder.build();
    
    // Verify repository object
    const repositoryVerification = constitutionalVerificationAuthority.verifyArtifact(repositoryObject);
    if (!repositoryVerification.valid) {
      throw new Error(`Repository verification failed: ${repositoryVerification.reason}`);
    }
    
    constitutionalObjects.repository = repositoryObject;

    // Build commit objects
    for (const commitDetail of rawSnapshot.commitDetails) {
      const commitBuilder = new GitHubCommitObject(commitDetail.commit, repositoryObject.id);
      const commitObject = commitBuilder.build();
      
      // Verify commit object
      const commitVerification = constitutionalVerificationAuthority.verifyArtifact(commitObject);
      if (!commitVerification.valid) {
        throw new Error(`Commit verification failed: ${commitVerification.reason}`);
      }
      
      constitutionalObjects.commits.push(commitObject);

      // Build tree object
      const treeBuilder = new GitHubTreeObject(
        {
          sha: commitDetail.tree_sha,
          tree: commitDetail.tree,
          truncated: false,
        },
        commitObject.id
      );
      const treeObject = treeBuilder.build();
      
      // Verify tree object
      const treeVerification = constitutionalVerificationAuthority.verifyArtifact(treeObject);
      if (!treeVerification.valid) {
        throw new Error(`Tree verification failed: ${treeVerification.reason}`);
      }
      
      constitutionalObjects.trees.push(treeObject);

      // Build directory and blob objects from tree entries
      const directoriesByPath = new Map();
      
      for (const entry of commitDetail.tree) {
        if (entry.type === 'tree') {
          // Directory object
          const path = entry.path;
          const dirEntries = commitDetail.tree.filter(e => {
            const entryPath = e.path;
            const entryDir = entryPath.substring(0, entryPath.lastIndexOf('/'));
            return entryDir === path || (entryDir.startsWith(path + '/') && entryDir.split('/').length === path.split('/').length + 1);
          });
          
          const directoryBuilder = new GitHubDirectoryObject(path, dirEntries, treeObject.id);
          const directoryObject = directoryBuilder.build();
          
          // Verify directory object
          const directoryVerification = constitutionalVerificationAuthority.verifyArtifact(directoryObject);
          if (!directoryVerification.valid) {
            throw new Error(`Directory verification failed: ${directoryVerification.reason}`);
          }
          
          constitutionalObjects.directories.push(directoryObject);
        } else if (entry.type === 'blob') {
          // Blob object
          const blobBuilder = new GitHubBlobObject(
            {
              sha: entry.sha,
              size: entry.size,
              content: '', // Content fetched separately
              encoding: 'utf-8',
            },
            entry.path,
            treeObject.id
          );
          const blobObject = blobBuilder.build();
          
          // Verify blob object
          const blobVerification = constitutionalVerificationAuthority.verifyArtifact(blobObject);
          if (!blobVerification.valid) {
            throw new Error(`Blob verification failed: ${blobVerification.reason}`);
          }
          
          constitutionalObjects.blobs.push(blobObject);
        }
      }
    }

    return constitutionalObjects;
  }

  /**
   * Normalize single commit with its tree
   * 
   * @param {Object} commitDetail - Commit detail from GitHub
   * @param {string} repositoryId - Repository object ID
   * @returns {Object} Constitutional objects for this commit
   */
  normalizeCommit(commitDetail, repositoryId) {
    const constitutionalObjects = {
      commit: null,
      tree: null,
      directories: [],
      blobs: [],
    };

    // Build commit object
    const commitBuilder = new GitHubCommitObject(commitDetail.commit, repositoryId);
    const commitObject = commitBuilder.build();
    
    const commitVerification = constitutionalVerificationAuthority.verifyArtifact(commitObject);
    if (!commitVerification.valid) {
      throw new Error(`Commit verification failed: ${commitVerification.reason}`);
    }
    
    constitutionalObjects.commit = commitObject;

    // Build tree object
    const treeBuilder = new GitHubTreeObject(
      {
        sha: commitDetail.tree_sha,
        tree: commitDetail.tree,
        truncated: false,
      },
      commitObject.id
    );
    const treeObject = treeBuilder.build();
    
    const treeVerification = constitutionalVerificationAuthority.verifyArtifact(treeObject);
    if (!treeVerification.valid) {
      throw new Error(`Tree verification failed: ${treeVerification.reason}`);
    }
    
    constitutionalObjects.tree = treeObject;

    // Build directory and blob objects
    for (const entry of commitDetail.tree) {
      if (entry.type === 'tree') {
        const directoryBuilder = new GitHubDirectoryObject(entry.path, [], treeObject.id);
        const directoryObject = directoryBuilder.build();
        
        const directoryVerification = constitutionalVerificationAuthority.verifyArtifact(directoryObject);
        if (!directoryVerification.valid) {
          throw new Error(`Directory verification failed: ${directoryVerification.reason}`);
        }
        
        constitutionalObjects.directories.push(directoryObject);
      } else if (entry.type === 'blob') {
        const blobBuilder = new GitHubBlobObject(
          {
            sha: entry.sha,
            size: entry.size,
            content: '',
            encoding: 'utf-8',
          },
          entry.path,
          treeObject.id
        );
        const blobObject = blobBuilder.build();
        
        const blobVerification = constitutionalVerificationAuthority.verifyArtifact(blobObject);
        if (!blobVerification.valid) {
          throw new Error(`Blob verification failed: ${blobVerification.reason}`);
        }
        
        constitutionalObjects.blobs.push(blobObject);
      }
    }

    return constitutionalObjects;
  }
}

module.exports = { GitHubNormalizer };
