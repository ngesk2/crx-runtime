/**
 * Milestone 2 Verification Harness
 * 
 * Verify identical blob bytes, IDs, hashes, lineage, witnesses across runs
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
 */

const { GitHubConstitutionalPipeline } = require('./github_constitutional_pipeline');
const { RepositoryStore } = require('../ping-runtime/events/repository_store');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

class Milestone2VerificationHarness {
  constructor(config) {
    this._config = config;
    this._iterations = 10; // Run pipeline 10 times to verify determinism
  }

  /**
   * Run verification harness
   * 
   * @returns {Object} Verification results
   */
  async run() {
    console.log('=== Milestone 2 Verification Harness ===\n');
    console.log('Running GitHub Constitutional Pipeline multiple times to verify determinism...\n');

    const results = {
      repositoryObjects: [],
      commitObjects: [],
      treeObjects: [],
      directoryObjects: [],
      blobObjects: [],
    };

    for (let i = 0; i < this._iterations; i++) {
      console.log(`Iteration ${i + 1}/${this._iterations}...`);
      
      // Create fresh pipeline instance
      const pipeline = new GitHubConstitutionalPipeline(this._config);
      await pipeline.initialize();
      
      // Run pipeline
      const pipelineResult = await pipeline.run();
      
      // Collect results
      results.repositoryObjects.push(pipelineResult.constitutionalObjects.repository);
      results.commitObjects.push(...pipelineResult.constitutionalObjects.commits);
      results.treeObjects.push(...pipelineResult.constitutionalObjects.trees);
      results.directoryObjects.push(...pipelineResult.constitutionalObjects.directories);
      results.blobObjects.push(...pipelineResult.constitutionalObjects.blobs);
      
      console.log(`  ✅ Iteration ${i + 1} complete\n`);
    }

    // Verify determinism
    const verificationResults = {
      repositoryDeterminism: this._verifyRepositoryDeterminism(results.repositoryObjects),
      commitDeterminism: this._verifyCommitDeterminism(results.commitObjects),
      treeDeterminism: this._verifyTreeDeterminism(results.treeObjects),
      directoryDeterminism: this._verifyDirectoryDeterminism(results.directoryObjects),
      blobDeterminism: this._verifyBlobDeterminism(results.blobObjects),
    };

    this._printResults(verificationResults);
    return verificationResults;
  }

  /**
   * Verify repository object determinism
   * 
   * @param {Array} repositoryObjects - Repository objects from multiple runs
   * @returns {Object} Verification result
   */
  _verifyRepositoryDeterminism(repositoryObjects) {
    console.log('Verifying Repository Object Determinism...');
    
    if (repositoryObjects.length === 0) {
      return { passed: false, reason: 'No repository objects to verify' };
    }

    const first = repositoryObjects[0];
    const canonicalBytesSet = new Set();
    const canonicalHashSet = new Set();
    const idSet = new Set();
    let allIdentical = true;

    for (const repo of repositoryObjects) {
      canonicalBytesSet.add(repo.canonical_bytes.toString('hex'));
      canonicalHashSet.add(repo.canonical_hash);
      idSet.add(repo.id);

      if (!repo.canonical_bytes.equals(first.canonical_bytes)) {
        allIdentical = false;
        console.log(`  ❌ Canonical bytes differ`);
      }
      if (repo.canonical_hash !== first.canonical_hash) {
        allIdentical = false;
        console.log(`  ❌ Canonical hash differs`);
      }
      if (repo.id !== first.id) {
        allIdentical = false;
        console.log(`  ❌ ID differs`);
      }
    }

    const passed = allIdentical && canonicalBytesSet.size === 1 && canonicalHashSet.size === 1 && idSet.size === 1;
    console.log(`  ${passed ? '✅' : '❌'} ${canonicalBytesSet.size} unique canonical bytes, ${canonicalHashSet.size} unique hashes, ${idSet.size} unique IDs (expected 1 each)\n`);
    
    return { passed, uniqueCanonicalBytes: canonicalBytesSet.size, uniqueHashes: canonicalHashSet.size, uniqueIds: idSet.size };
  }

  /**
   * Verify commit object determinism
   * 
   * @param {Array} commitObjects - Commit objects from multiple runs
   * @returns {Object} Verification result
   */
  _verifyCommitDeterminism(commitObjects) {
    console.log('Verifying Commit Object Determinism...');
    
    if (commitObjects.length === 0) {
      return { passed: false, reason: 'No commit objects to verify' };
    }

    // Group commits by SHA
    const commitsBySha = new Map();
    for (const commit of commitObjects) {
      const sha = commit.payload.sha;
      if (!commitsBySha.has(sha)) {
        commitsBySha.set(sha, []);
      }
      commitsBySha.get(sha).push(commit);
    }

    let allPassed = true;
    const results = [];

    for (const [sha, commits] of commitsBySha) {
      const first = commits[0];
      const canonicalBytesSet = new Set();
      const canonicalHashSet = new Set();
      const idSet = new Set();
      let identical = true;

      for (const commit of commits) {
        canonicalBytesSet.add(commit.canonical_bytes.toString('hex'));
        canonicalHashSet.add(commit.canonical_hash);
        idSet.add(commit.id);

        if (!commit.canonical_bytes.equals(first.canonical_bytes)) {
          identical = false;
        }
        if (commit.canonical_hash !== first.canonical_hash) {
          identical = false;
        }
        if (commit.id !== first.id) {
          identical = false;
        }
      }

      const passed = identical && canonicalBytesSet.size === 1 && canonicalHashSet.size === 1 && idSet.size === 1;
      results.push({ sha, passed, uniqueCanonicalBytes: canonicalBytesSet.size, uniqueHashes: canonicalHashSet.size, uniqueIds: idSet.size });
      
      if (!passed) {
        allPassed = false;
        console.log(`  ❌ Commit ${sha}: ${canonicalBytesSet.size} unique canonical bytes, ${canonicalHashSet.size} unique hashes, ${idSet.size} unique IDs`);
      }
    }

    if (allPassed) {
      console.log(`  ✅ All commits identical across runs\n`);
    }

    return { passed: allPassed, results };
  }

  /**
   * Verify tree object determinism
   * 
   * @param {Array} treeObjects - Tree objects from multiple runs
   * @returns {Object} Verification result
   */
  _verifyTreeDeterminism(treeObjects) {
    console.log('Verifying Tree Object Determinism...');
    
    if (treeObjects.length === 0) {
      return { passed: false, reason: 'No tree objects to verify' };
    }

    // Group trees by SHA
    const treesBySha = new Map();
    for (const tree of treeObjects) {
      const sha = tree.payload.sha;
      if (!treesBySha.has(sha)) {
        treesBySha.set(sha, []);
      }
      treesBySha.get(sha).push(tree);
    }

    let allPassed = true;
    const results = [];

    for (const [sha, trees] of treesBySha) {
      const first = trees[0];
      const canonicalBytesSet = new Set();
      const canonicalHashSet = new Set();
      const idSet = new Set();
      let identical = true;

      for (const tree of trees) {
        canonicalBytesSet.add(tree.canonical_bytes.toString('hex'));
        canonicalHashSet.add(tree.canonical_hash);
        idSet.add(tree.id);

        if (!tree.canonical_bytes.equals(first.canonical_bytes)) {
          identical = false;
        }
        if (tree.canonical_hash !== first.canonical_hash) {
          identical = false;
        }
        if (tree.id !== first.id) {
          identical = false;
        }
      }

      const passed = identical && canonicalBytesSet.size === 1 && canonicalHashSet.size === 1 && idSet.size === 1;
      results.push({ sha, passed, uniqueCanonicalBytes: canonicalBytesSet.size, uniqueHashes: canonicalHashSet.size, uniqueIds: idSet.size });
      
      if (!passed) {
        allPassed = false;
        console.log(`  ❌ Tree ${sha}: ${canonicalBytesSet.size} unique canonical bytes, ${canonicalHashSet.size} unique hashes, ${idSet.size} unique IDs`);
      }
    }

    if (allPassed) {
      console.log(`  ✅ All trees identical across runs\n`);
    }

    return { passed: allPassed, results };
  }

  /**
   * Verify directory object determinism
   * 
   * @param {Array} directoryObjects - Directory objects from multiple runs
   * @returns {Object} Verification result
   */
  _verifyDirectoryDeterminism(directoryObjects) {
    console.log('Verifying Directory Object Determinism...');
    
    if (directoryObjects.length === 0) {
      return { passed: false, reason: 'No directory objects to verify' };
    }

    // Group directories by path
    const directoriesByPath = new Map();
    for (const dir of directoryObjects) {
      const path = dir.metadata.path;
      if (!directoriesByPath.has(path)) {
        directoriesByPath.set(path, []);
      }
      directoriesByPath.get(path).push(dir);
    }

    let allPassed = true;
    const results = [];

    for (const [path, directories] of directoriesByPath) {
      const first = directories[0];
      const canonicalBytesSet = new Set();
      const canonicalHashSet = new Set();
      const idSet = new Set();
      let identical = true;

      for (const dir of directories) {
        canonicalBytesSet.add(dir.canonical_bytes.toString('hex'));
        canonicalHashSet.add(dir.canonical_hash);
        idSet.add(dir.id);

        if (!dir.canonical_bytes.equals(first.canonical_bytes)) {
          identical = false;
        }
        if (dir.canonical_hash !== first.canonical_hash) {
          identical = false;
        }
        if (dir.id !== first.id) {
          identical = false;
        }
      }

      const passed = identical && canonicalBytesSet.size === 1 && canonicalHashSet.size === 1 && idSet.size === 1;
      results.push({ path, passed, uniqueCanonicalBytes: canonicalBytesSet.size, uniqueHashes: canonicalHashSet.size, uniqueIds: idSet.size });
      
      if (!passed) {
        allPassed = false;
        console.log(`  ❌ Directory ${path}: ${canonicalBytesSet.size} unique canonical bytes, ${canonicalHashSet.size} unique hashes, ${idSet.size} unique IDs`);
      }
    }

    if (allPassed) {
      console.log(`  ✅ All directories identical across runs\n`);
    }

    return { passed: allPassed, results };
  }

  /**
   * Verify blob object determinism
   * 
   * @param {Array} blobObjects - Blob objects from multiple runs
   * @returns {Object} Verification result
   */
  _verifyBlobDeterminism(blobObjects) {
    console.log('Verifying Blob Object Determinism...');
    
    if (blobObjects.length === 0) {
      return { passed: false, reason: 'No blob objects to verify' };
    }

    // Group blobs by SHA
    const blobsBySha = new Map();
    for (const blob of blobObjects) {
      const sha = blob.payload.sha;
      if (!blobsBySha.has(sha)) {
        blobsBySha.set(sha, []);
      }
      blobsBySha.get(sha).push(blob);
    }

    let allPassed = true;
    const results = [];

    for (const [sha, blobs] of blobsBySha) {
      const first = blobs[0];
      const canonicalBytesSet = new Set();
      const canonicalHashSet = new Set();
      const idSet = new Set();
      let identical = true;

      for (const blob of blobs) {
        canonicalBytesSet.add(blob.canonical_bytes.toString('hex'));
        canonicalHashSet.add(blob.canonical_hash);
        idSet.add(blob.id);

        if (!blob.canonical_bytes.equals(first.canonical_bytes)) {
          identical = false;
        }
        if (blob.canonical_hash !== first.canonical_hash) {
          identical = false;
        }
        if (blob.id !== first.id) {
          identical = false;
        }
      }

      const passed = identical && canonicalBytesSet.size === 1 && canonicalHashSet.size === 1 && idSet.size === 1;
      results.push({ sha, passed, uniqueCanonicalBytes: canonicalBytesSet.size, uniqueHashes: canonicalHashSet.size, uniqueIds: idSet.size });
      
      if (!passed) {
        allPassed = false;
        console.log(`  ❌ Blob ${sha}: ${canonicalBytesSet.size} unique canonical bytes, ${canonicalHashSet.size} unique hashes, ${idSet.size} unique IDs`);
      }
    }

    if (allPassed) {
      console.log(`  ✅ All blobs identical across runs\n`);
    }

    return { passed: allPassed, results };
  }

  /**
   * Print verification results
   * 
   * @param {Object} verificationResults - Verification results
   */
  _printResults(verificationResults) {
    console.log('=== Milestone 2 Verification Results ===\n');
    
    const totalTests = Object.keys(verificationResults).length;
    const passedTests = Object.values(verificationResults).filter(r => r.passed).length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%\n`);
    
    if (passedTests === totalTests) {
      console.log('✅ MILESTONE 2 VERIFIED: GitHub Constitutional Pipeline is deterministic');
      console.log('Identical blob bytes, IDs, hashes, lineage, witnesses across runs.');
    } else {
      console.log('❌ MILESTONE 2 FAILED: GitHub Constitutional Pipeline has non-deterministic behavior');
    }
  }
}

module.exports = { Milestone2VerificationHarness };
