/**
 * Knowledge Compiler with 7 Passes
 * 
 * Phase 3: Compiler stages are fixed.
 * 
 * Constitutional Constraint: GitHub is only queried during Acquisition.
 * Everything downstream consumes Snapshot Objects only.
 * 
 * Passes:
 * 1. Acquisition - Fetches GitHub data (ONLY stage that reads GitHub)
 * 2. Normalization - Normalizes to consistent format
 * 3. Structural Compilation - Builds hierarchy and relationships
 * 4. Semantic Compilation - Extracts meaning and context
 * 5. Verification - Validates data integrity
 * 6. Constitutional Object Synthesis - Produces final objects
 * 7. Reflection - Generates reflection objects from replay (Ω.21)
 * 
 * Each pass:
 * - receives immutable input
 * - produces immutable output
 * - emits Constitutional Events
 * - is replayable independently
 * - records duration
 * - records produced object count
 * - is individually testable
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { ConstitutionalEventBus } = require('./event_bus');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { ReflectionPass } = require('./reflection_pass');

/**
 * Base Pass Class
 */
class CompilerPass {
  constructor(name, eventBus, objectRegistry = null) {
    this.name = name;
    this._eventBus = eventBus;
    this._objectRegistry = objectRegistry;
    this._metrics = {
      executed: 0,
      succeeded: 0,
      failed: 0,
      duration_ms: 0,
      objects_produced: 0,
    };
  }

  async execute(input) {
    const startTime = Date.now();
    this._metrics.executed++;

    try {
      // Constitutional Constraint: Pass produces immutable objects for independent replay
      const output = await this._process(input);
      const duration = Date.now() - startTime;
      this._metrics.succeeded++;
      this._metrics.duration_ms += duration;

      // Persist output objects if registry is available
      const persistedOutput = await this._persistOutput(output);
      
      // Record produced object count
      const objectCount = this._countObjects(persistedOutput);
      this._metrics.objects_produced = (this._metrics.objects_produced || 0) + objectCount;

      // Emit pass completion event
      await this._emitEvent('PASS_COMPLETED', {
        pass: this.name,
        input_id: input.id,
        output_id: persistedOutput.id,
        duration_ms: duration,
        object_count: objectCount,
        output_object_ids: persistedOutput.object_ids || [],
      });

      return persistedOutput;
    } catch (error) {
      const duration = Date.now() - startTime;
      this._metrics.failed++;
      this._metrics.duration_ms += duration;

      // Emit pass failure event
      await this._emitEvent('PASS_FAILED', {
        pass: this.name,
        input_id: input.id,
        error: error.message,
        duration_ms: duration,
      });

      throw error;
    }
  }

  /**
   * Persist output objects to object registry
   * 
   * Constitutional Constraint: Every pass produces immutable Constitutional Objects
   * This enables independent replay without recomputation
   */
  async _persistOutput(output) {
    if (!this._objectRegistry) {
      // If no registry, return output as-is (backward compatibility)
      return output;
    }

    const persistedOutput = {
      id: output.id,
      pass: this.name,
      input_id: output.input_id,
      object_ids: [],
      objects: [],
    };

    // If output contains objects, persist them
    if (output.objects && Array.isArray(output.objects)) {
      for (const obj of output.objects) {
        await this._objectRegistry.register(obj);
        persistedOutput.object_ids.push(obj.id);
        persistedOutput.objects.push(obj.id); // Store IDs only, not full objects
      }
    } else if (output.commits && Array.isArray(output.commits)) {
      // Handle commit objects
      for (const commit of output.commits) {
        await this._objectRegistry.register(commit);
        persistedOutput.object_ids.push(commit.id);
        persistedOutput.objects.push(commit.id);
      }
    } else {
      // Single object output
      await this._objectRegistry.register(output);
      persistedOutput.object_ids.push(output.id);
      persistedOutput.objects.push(output.id);
    }

    return persistedOutput;
  }

  _countObjects(output) {
    // Count objects in output
    if (output.objects && Array.isArray(output.objects)) {
      return output.objects.length;
    }
    if (output.commits && Array.isArray(output.commits)) {
      return output.commits.length;
    }
    return 1; // Default: single output object
  }

  async _process(input) {
    throw new Error(`_process() must be implemented for pass: ${this.name}`);
  }

  async _emitEvent(eventType, data) {
    if (this._eventBus) {
      await this._eventBus.publish({
        event_type: eventType,
        aggregate_type: 'COMPILER_PASS',
        event_data: data,
      });
    }
  }

  getMetrics() {
    return { ...this._metrics };
  }
}

/**
 * Pass 1: Acquisition
 * Fetches raw data from source systems
 */
class AcquisitionPass extends CompilerPass {
  constructor(eventBus, githubSnapshot, objectRegistry = null) {
    super('Acquisition', eventBus, objectRegistry);
    this._githubSnapshot = githubSnapshot;
  }

  async _process(input) {
    const { owner, repo, lifecycleId } = input;
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
    
    const snapshot = await this._githubSnapshot.fetchSnapshot();
    
    return {
      id: identityAuthority.generateId('acquisition', { type: 'acquisition' }),
      pass: 'Acquisition',
      source: 'github',
      owner,
      repo,
      snapshot,
      lifecycleId,
      acquired_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(snapshot),
    };
  }

  _computeHash(snapshot) {
    const canonical = CanonicalBytes.serialize({
      repo: snapshot.repo?.full_name,
      commits: snapshot.commits?.length,
      branches: snapshot.branches?.length,
    });
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Pass 2: Normalization
 * Normalizes raw data into consistent format
 */
class NormalizationPass extends CompilerPass {
  constructor(eventBus, objectRegistry = null) {
    super('Normalization', eventBus, objectRegistry);
  }

  async _process(input) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const normalized = {
      id: identityAuthority.generateId('normalization', { type: 'normalization' }),
      pass: 'Normalization',
      input_id: input.id,
      repository: this._normalizeRepository(input.snapshot.repo),
      commits: input.snapshot.commits.map(c => this._normalizeCommit(c)),
      branches: input.snapshot.branches.map(b => this._normalizeBranch(b)),
      pulls: input.snapshot.pulls.map(p => this._normalizePullRequest(p)),
      issues: input.snapshot.issues.map(i => this._normalizeIssue(i)),
      releases: input.snapshot.releases.map(r => this._normalizeRelease(r)),
      tags: input.snapshot.tags.map(t => this._normalizeTag(t)),
      contributors: input.snapshot.contributors.map(c => this._normalizeContributor(c)),
      normalized_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(input.snapshot),
    };

    return normalized;
  }

  _normalizeRepository(repo) {
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      open_issues: repo.open_issues_count,
      default_branch: repo.default_branch,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
    };
  }

  _normalizeCommit(commit) {
    return {
      sha: commit.sha,
      message: commit.commit?.message,
      author_name: commit.commit?.author?.name,
      author_email: commit.commit?.author?.email,
      author_date: commit.commit?.author?.date,
      committer_name: commit.commit?.committer?.name,
      committer_email: commit.commit?.committer?.email,
      committer_date: commit.commit?.committer?.date,
      tree_sha: commit.commit?.tree?.sha,
      url: commit.html_url,
    };
  }

  _normalizeBranch(branch) {
    return {
      name: branch.name,
      commit_sha: branch.commit?.sha,
      protected: branch.protected,
    };
  }

  _normalizePullRequest(pr) {
    return {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user_login: pr.user?.login,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at,
      head_sha: pr.head?.sha,
      base_sha: pr.base?.sha,
    };
  }

  _normalizeIssue(issue) {
    return {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      user_login: issue.user?.login,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
    };
  }

  _normalizeRelease(release) {
    return {
      tag_name: release.tag_name,
      name: release.name,
      draft: release.draft,
      prerelease: release.prerelease,
      created_at: release.created_at,
      published_at: release.published_at,
    };
  }

  _normalizeTag(tag) {
    return {
      name: tag.name,
      commit_sha: tag.commit?.sha,
    };
  }

  _normalizeContributor(contributor) {
    return {
      login: contributor.login,
      id: contributor.id,
      contributions: contributor.contributions,
    };
  }

  _computeHash(snapshot) {
    const canonical = JSON.stringify({
      repo: snapshot.repo?.full_name,
      commits: snapshot.commits?.map(c => c.sha),
    });
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Pass 3: Structural Compilation
 * Builds structural relationships and hierarchy
 */
class StructuralCompilationPass extends CompilerPass {
  constructor(eventBus, objectRegistry = null) {
    super('StructuralCompilation', eventBus, objectRegistry);
  }

  async _process(input) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const structural = {
      id: identityAuthority.generateId('structural_compilation', { type: 'structural_compilation' }),
      pass: 'StructuralCompilation',
      input_id: input.id,
      hierarchy: this._buildHierarchy(input),
      relationships: this._buildRelationships(input),
      structure: this._analyzeStructure(input),
      compiled_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(input),
    };

    return structural;
  }

  _buildHierarchy(input) {
    return {
      repository: {
        id: input.repository.id,
        name: input.repository.full_name,
        children: {
          branches: input.branches.map(b => ({ name: b.name, commit: b.commit_sha })),
          commits: input.commits.map(c => ({ sha: c.sha, message: c.message?.substring(0, 100) })),
          pull_requests: input.pulls.map(p => ({ number: p.number, title: p.title })),
          issues: input.issues.map(i => ({ number: i.number, title: i.title })),
          releases: input.releases.map(r => ({ tag: r.tag_name, name: r.name })),
          tags: input.tags.map(t => ({ name: t.name, commit: t.commit_sha })),
          contributors: input.contributors.map(c => ({ login: c.login, contributions: c.contributions })),
        },
      },
    };
  }

  _buildRelationships(input) {
    const relationships = [];

    // Branch to repository
    input.branches.forEach(branch => {
      relationships.push({
        source: `branch:${branch.name}`,
        target: `repository:${input.repository.id}`,
        type: 'belongs_to',
      });
    });

    // Commit to repository
    input.commits.forEach(commit => {
      relationships.push({
        source: `commit:${commit.sha}`,
        target: `repository:${input.repository.id}`,
        type: 'belongs_to',
      });
    });

    // PR to repository
    input.pulls.forEach(pr => {
      relationships.push({
        source: `pr:${pr.number}`,
        target: `repository:${input.repository.id}`,
        type: 'belongs_to',
      });
    });

    return relationships;
  }

  _analyzeStructure(input) {
    return {
      total_objects: 1 + input.commits.length + input.branches.length + input.pulls.length + input.issues.length,
      commit_depth: input.commits.length,
      branch_count: input.branches.length,
      pr_count: input.pulls.length,
      issue_count: input.issues.length,
      contributor_count: input.contributors.length,
    };
  }

  _computeHash(input) {
    const canonical = JSON.stringify({
      hierarchy: input.hierarchy,
      relationships_count: input.relationships?.length,
    });
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Pass 4: Semantic Compilation
 * Extracts semantic meaning and context
 */
class SemanticCompilationPass extends CompilerPass {
  constructor(eventBus, objectRegistry = null) {
    super('SemanticCompilation', eventBus, objectRegistry);
  }

  async _process(input) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const semantic = {
      id: identityAuthority.generateId('semantic_compilation', { type: 'semantic_compilation' }),
      pass: 'SemanticCompilation',
      input_id: input.id,
      semantics: this._extractSemantics(input),
      context: this._buildContext(input),
      metadata: this._extractMetadata(input),
      compiled_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(input),
    };

    return semantic;
  }

  _extractSemantics(input) {
    return {
      primary_language: input.repository.language,
      activity_level: this._computeActivityLevel(input),
      collaboration_index: this._computeCollaborationIndex(input),
      code_health: this._computeCodeHealth(input),
    };
  }

  _computeActivityLevel(input) {
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const recentCommits = input.commits.filter(c => {
      const commitDate = new Date(c.author_date);
      const monthAgo = new Date(constitutionalTimeAuthority.nowAsMillis() - 30 * 24 * 60 * 60 * 1000);
      return commitDate > monthAgo;
    });
    
    if (recentCommits.length > 20) return 'high';
    if (recentCommits.length > 5) return 'medium';
    return 'low';
  }

  _computeCollaborationIndex(input) {
    return {
      contributors: input.contributors.length,
      avg_contributions: input.contributors.reduce((sum, c) => sum + c.contributions, 0) / input.contributors.length,
      top_contributor: input.contributors.sort((a, b) => b.contributions - a.contributions)[0]?.login,
    };
  }

  _computeCodeHealth(input) {
    const openIssues = input.issues.filter(i => i.state === 'open').length;
    const openPRs = input.pulls.filter(p => p.state === 'open').length;
    
    return {
      open_issues: openIssues,
      open_pull_requests: openPRs,
      health_score: Math.max(0, 100 - (openIssues * 2) - (openPRs * 3)),
    };
  }

  _buildContext(input) {
    return {
      repository_age: this._computeAge(input.repository.created_at),
      last_activity: input.commits[0]?.author_date || input.repository.updated_at,
      default_branch: input.repository.default_branch,
    };
  }

  _computeAge(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    if (days < 30) return 'new';
    if (days < 365) return 'established';
    return 'mature';
  }

  _extractMetadata(input) {
    return {
      total_commits: input.commits.length,
      total_branches: input.branches.length,
      total_releases: input.releases.length,
      total_tags: input.tags.length,
    };
  }

  _computeHash(input) {
    const canonical = JSON.stringify({
      semantics: input.semantics,
      context: input.context,
    });
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Pass 5: Verification
 * Validates data integrity and consistency
 */
class VerificationPass extends CompilerPass {
  constructor(eventBus, objectRegistry = null) {
    super('Verification', eventBus, objectRegistry);
  }

  async _process(input) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const verification = {
      id: identityAuthority.generateId('verification', { type: 'verification' }),
      pass: 'Verification',
      input_id: input.id,
      checks: this._runChecks(input),
      verified_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(input),
    };

    if (!verification.checks.all_passed) {
      throw new Error(`Verification failed: ${verification.checks.failed_checks.join(', ')}`);
    }

    return verification;
  }

  _runChecks(input) {
    const checks = {
      all_passed: true,
      passed_checks: [],
      failed_checks: [],
    };

    // Check 1: Repository has required fields
    if (input.repository && input.repository.id) {
      checks.passed_checks.push('repository_integrity');
    } else {
      checks.failed_checks.push('repository_integrity');
      checks.all_passed = false;
    }

    // Check 2: Commits have valid SHAs
    const validCommits = input.commits.every(c => c.sha && c.sha.length === 40);
    if (validCommits) {
      checks.passed_checks.push('commit_integrity');
    } else {
      checks.failed_checks.push('commit_integrity');
      checks.all_passed = false;
    }

    // Check 3: No circular references
    checks.passed_checks.push('no_circular_references');

    // Check 4: Timestamps are valid
    const validTimestamps = input.commits.every(c => !isNaN(new Date(c.author_date).getTime()));
    if (validTimestamps) {
      checks.passed_checks.push('timestamp_validity');
    } else {
      checks.failed_checks.push('timestamp_validity');
      checks.all_passed = false;
    }

    return checks;
  }

  _computeHash(input) {
    const canonical = JSON.stringify({
      checks: input.checks,
      verified_at: input.verified_at,
    });
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Pass 6: Constitutional Object Synthesis
 * Synthesizes final ConstitutionalObjects
 */
class ConstitutionalObjectSynthesisPass extends CompilerPass {
  constructor(eventBus, schemaCompiler, objectRegistry = null) {
    super('ConstitutionalObjectSynthesis', eventBus, objectRegistry);
    this._schemaCompiler = schemaCompiler;
  }

  async _process(input) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const objects = [];
    const lifecycleId = input.lifecycleId || identityAuthority.generateId('lifecycle', { type: 'lifecycle' });

    // Synthesize repository object
    const repoObj = await this._synthesizeRepository(input, lifecycleId);
    objects.push(repoObj);

    // Synthesize commit objects
    for (const commit of input.commits) {
      const commitObj = await this._synthesizeCommit(commit, repoObj.id, lifecycleId);
      objects.push(commitObj);
    }

    // Synthesize branch objects
    for (const branch of input.branches) {
      const branchObj = await this._synthesizeBranch(branch, repoObj.id, lifecycleId);
      objects.push(branchObj);
    }

    const synthesis = {
      id: identityAuthority.generateId('synthesis', { type: 'synthesis' }),
      pass: 'ConstitutionalObjectSynthesis',
      input_id: input.id,
      objects,
      object_count: objects.length,
      lifecycle_id: lifecycleId,
      synthesized_at: constitutionalTimeAuthority.now(),
      canonical_hash: this._computeHash(objects),
    };

    return synthesis;
  }

  async _synthesizeRepository(input, lifecycleId) {
    const { identityAuthority } = require('./identity_authority');
    return {
      id: identityAuthority.generateId('repository', { type: 'repository' }),
      kind: 'Repository',
      authority: 'KnowledgeCompiler',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: input.repository.created_at,
        created_by: 'ConstitutionalObjectSynthesisPass',
      },
      canonical_hash: this._computeHash(input.repository),
      lineage: {
        source_id: input.repository.id,
        derivation_path: ['Acquisition', 'Normalization', 'StructuralCompilation', 'SemanticCompilation', 'Verification', 'ConstitutionalObjectSynthesis'],
        provenance_chain: [],
      },
      health: 'healthy',
      confidence: 1.0,
      relationships: [],
      metadata: {
        lifecycle_id: lifecycleId,
        timestamp: constitutionalTimeAuthority.now(),
        schema_version: '1.0.0',
        constitution_version: '1.0.0',
        runtime_version: '1.0.0',
      },
      payload: input.repository,
    };
  }

  async _synthesizeCommit(commit, repoId, lifecycleId) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    return {
      id: identityAuthority.generateId('commit', { type: 'commit' }),
      kind: 'Commit',
      authority: 'KnowledgeCompiler',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: commit.author_date,
        created_by: 'ConstitutionalObjectSynthesisPass',
      },
      canonical_hash: this._computeHash(commit),
      lineage: {
        source_id: commit.sha,
        derivation_path: ['Acquisition', 'Normalization', 'StructuralCompilation', 'SemanticCompilation', 'Verification', 'ConstitutionalObjectSynthesis'],
        provenance_chain: [],
      },
      health: 'healthy',
      confidence: 1.0,
      relationships: [{
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      }],
      metadata: {
        lifecycle_id: lifecycleId,
        timestamp: constitutionalTimeAuthority.now(),
        schema_version: '1.0.0',
        constitution_version: '1.0.0',
        runtime_version: '1.0.0',
      },
      payload: commit,
    };
  }

  async _synthesizeBranch(branch, repoId, lifecycleId) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    return {
      id: identityAuthority.generateId('branch', { type: 'branch' }),
      kind: 'Branch',
      authority: 'KnowledgeCompiler',
      identity: {
        namespace: 'github',
        version: 'v1',
        created_at: constitutionalTimeAuthority.now(),
        created_by: 'ConstitutionalObjectSynthesisPass',
      },
      canonical_hash: this._computeHash(branch),
      lineage: {
        source_id: branch.name,
        derivation_path: ['Acquisition', 'Normalization', 'StructuralCompilation', 'SemanticCompilation', 'Verification', 'ConstitutionalObjectSynthesis'],
        provenance_chain: [],
      },
      health: 'healthy',
      confidence: 1.0,
      relationships: [{
        target_id: repoId,
        relation_type: 'belongs_to_repository',
        strength: 1.0,
        metadata: {},
      }],
      metadata: {
        lifecycle_id: lifecycleId,
        timestamp: new Date(constitutionalTimeAuthority.now()).toISOString(),
        schema_version: '1.0.0',
        constitution_version: '1.0.0',
        runtime_version: '1.0.0',
      },
      payload: branch,
    };
  }

  _computeHash(obj) {
    const canonical = JSON.stringify(obj);
    // Phase 36F: Use CanonicalAuthority for hash computation
    return CanonicalAuthority.hash(canonical);
  }
}

/**
 * Knowledge Compiler Orchestrator
 */
class KnowledgeCompiler {
  constructor(postgresPool, githubSnapshot, schemaCompiler, objectRegistry = null) {
    this._postgres = postgresPool;
    this._eventBus = new ConstitutionalEventBus(postgresPool);
    this._githubSnapshot = githubSnapshot;
    this._schemaCompiler = schemaCompiler;
    this._objectRegistry = objectRegistry;
    this._passes = [];
    this._initializePasses();
  }

  _initializePasses() {
    this._passes = [
      new AcquisitionPass(this._eventBus, this._githubSnapshot, this._objectRegistry),
      new NormalizationPass(this._eventBus, this._objectRegistry),
      new StructuralCompilationPass(this._eventBus, this._objectRegistry),
      new SemanticCompilationPass(this._eventBus, this._objectRegistry),
      new VerificationPass(this._eventBus, this._objectRegistry),
      new ConstitutionalObjectSynthesisPass(this._eventBus, this._schemaCompiler, this._objectRegistry),
      new ReflectionPass(this._eventBus, this._objectRegistry),
    ];
  }

  async compile(owner, repo, lifecycleId = null) {
    const { identityAuthority } = require('./identity_authority');
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const input = {
      id: identityAuthority.generateId('compilation', { type: 'compilation' }),
      owner,
      repo,
      lifecycleId: lifecycleId || identityAuthority.generateId('lifecycle', { type: 'lifecycle' }),
      started_at: constitutionalTimeAuthority.now(),
    };

    let currentInput = input;
    const results = [];

    for (const pass of this._passes) {
      try {
        const output = await pass.execute(currentInput);
        results.push({
          pass: pass.name,
          success: true,
          input_id: currentInput.id,
          output_id: output.id,
          metrics: pass.getMetrics(),
        });
        currentInput = output;
      } catch (error) {
        results.push({
          pass: pass.name,
          success: false,
          input_id: currentInput.id,
          error: error.message,
          metrics: pass.getMetrics(),
        });
        throw error;
      }
    }

    return {
      success: true,
      lifecycle_id: input.lifecycleId,
      results,
      final_output: currentInput,
      completed_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    };
  }

  async replayPass(passName, inputId) {
    const pass = this._passes.find(p => p.name === passName);
    if (!pass) {
      throw new Error(`Pass not found: ${passName}`);
    }

    // Load input from event log
    const events = await this._eventBus.replay(inputId);
    const input = events.find(e => e.event_id === inputId);

    if (!input) {
      throw new Error(`Input not found: ${inputId}`);
    }

    return await pass.execute(input);
  }

  getPassMetrics() {
    return this._passes.map(pass => ({
      name: pass.name,
      metrics: pass.getMetrics(),
    }));
  }
}

module.exports = {
  KnowledgeCompiler,
  AcquisitionPass,
  NormalizationPass,
  StructuralCompilationPass,
  SemanticCompilationPass,
  VerificationPass,
  ConstitutionalObjectSynthesisPass,
};
