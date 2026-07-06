/**
 * Memory Authority
 * 
 * Phase 45 Patch 45.4 — Memory Facade
 * 
 * Constitutional Constraint: MemoryAuthority is a facade only.
 * 
 * Moved to MemoryPersistenceAuthority:
 * - PostgreSQL reads
 * - PostgreSQL writes
 * - table initialization
 * 
 * Moved to MemoryEmbeddingAuthority:
 * - embedding generation
 * 
 * Moved to MemoryVectorStoreAuthority:
 * - Qdrant collection creation
 * - vector storage
 * - vector search
 * 
 * MemoryAuthority now provides:
 * - Facade interface for memory operations
 * - Delegates to persistence, embedding, and vector store authorities
 * - ID generation
 * - Witness delegation
 * 
 * Removed:
 * - table creation
 * - Qdrant collection creation
 * - fake embedding
 * - SQL orchestration
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');

class MemoryAuthority {
  constructor(persistenceAuthority, embeddingAuthority, vectorStoreAuthority) {
    this._persistence = persistenceAuthority;
    this._embedding = embeddingAuthority;
    this._vectorStore = vectorStoreAuthority;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize authority (delegates to sub-authorities)
   */
  async initialize() {
    await this._persistence.initialize();
    await this._embedding.initialize();
    await this._vectorStore.initialize();
  }



  /**
   * Store fact
   * @param {Object} factData - Fact data
   * @returns {Object} Stored fact
   */
  async storeFact(factData) {
    const factId = this._generateFactId(factData.fact_text);
    const factHash = CanonicalAuthority.hash(factData);

    // Delegate to persistence authority
    const result = await this._persistence.storeMemory(
      'memory_facts',
      factId,
      {
        fact_id: factId,
        fact_text: factData.fact_text,
        fact_category: factData.fact_category || 'general',
        confidence: factData.confidence || 1.0,
        source_type: factData.source_type,
        source_id: factData.source_id
      },
      'fact'
    );

    // Store embedding
    const embedding = await this._embedding.generateEmbedding(factData.fact_text);
    await this._vectorStore.storeEmbedding('memory_facts', factId, embedding, { text: factData.fact_text });

    return { fact_id: factId, fact_hash: factHash, witness: result.witness };
  }

  /**
   * Store goal
   * @param {Object} goalData - Goal data
   * @returns {Object} Stored goal
   */
  async storeGoal(goalData) {
    const goalId = this._generateGoalId(goalData.goal_text);
    const goalHash = CanonicalAuthority.hash(goalData);

    const result = await this._persistence.storeMemory(
      'memory_goals',
      goalId,
      {
        goal_id: goalId,
        goal_text: goalData.goal_text,
        goal_status: goalData.goal_status || 'active',
        priority: goalData.priority || 5,
        project_id: goalData.project_id,
        due_date: goalData.due_date
      },
      'goal'
    );

    const embedding = await this._embedding.generateEmbedding(goalData.goal_text);
    await this._vectorStore.storeEmbedding('memory_goals', goalId, embedding, { text: goalData.goal_text });

    return { goal_id: goalId, goal_hash: goalHash, witness: result.witness };
  }

  /**
   * Store project
   * @param {Object} projectData - Project data
   * @returns {Object} Stored project
   */
  async storeProject(projectData) {
    const projectId = this._generateProjectId(projectData.project_name);
    const projectHash = CanonicalAuthority.hash(projectData);

    const result = await this._persistence.storeMemory(
      'memory_projects',
      projectId,
      {
        project_id: projectId,
        project_name: projectData.project_name,
        project_description: projectData.project_description,
        project_status: projectData.project_status || 'active',
        repository_id: projectData.repository_id
      },
      'project'
    );

    const embedding = await this._embedding.generateEmbedding(projectData.project_name + ' ' + (projectData.project_description || ''));
    await this._vectorStore.storeEmbedding('memory_projects', projectId, embedding, { text: projectData.project_name });

    return { project_id: projectId, project_hash: projectHash, witness: result.witness };
  }

  /**
   * Store repository
   * @param {Object} repoData - Repository data
   * @returns {Object} Stored repository
   */
  async storeRepository(repoData) {
    const repoId = this._generateRepositoryId(repoData.repository_name);
    const repoHash = CanonicalAuthority.hash(repoData);

    const result = await this._persistence.storeMemory(
      'memory_repositories',
      repoId,
      {
        repository_id: repoId,
        repository_name: repoData.repository_name,
        repository_url: repoData.repository_url,
        repository_type: repoData.repository_type,
        last_analyzed: repoData.last_analyzed
      },
      'repository'
    );

    const embedding = await this._embedding.generateEmbedding(repoData.repository_name + ' ' + (repoData.repository_url || ''));
    await this._vectorStore.storeEmbedding('memory_repositories', repoId, embedding, { text: repoData.repository_name });

    return { repository_id: repoId, repository_hash: repoHash, witness: result.witness };
  }

  /**
   * Store person
   * @param {Object} personData - Person data
   * @returns {Object} Stored person
   */
  async storePerson(personData) {
    const personId = this._generatePersonId(personData.person_name);
    const personHash = CanonicalAuthority.hash(personData);

    const result = await this._persistence.storeMemory(
      'memory_people',
      personId,
      {
        person_id: personId,
        person_name: personData.person_name,
        person_role: personData.person_role,
        person_email: personData.person_email,
        person_context: personData.person_context
      },
      'person'
    );

    const embedding = await this._embedding.generateEmbedding(personData.person_name + ' ' + (personData.person_context || ''));
    await this._vectorStore.storeEmbedding('memory_people', personId, embedding, { text: personData.person_name });

    return { person_id: personId, person_hash: personHash, witness: result.witness };
  }

  /**
   * Store API
   * @param {Object} apiData - API data
   * @returns {Object} Stored API
   */
  async storeAPI(apiData) {
    const apiId = this._generateAPIId(apiData.api_name);
    const apiHash = CanonicalAuthority.hash(apiData);

    const result = await this._persistence.storeMemory(
      'memory_apis',
      apiId,
      {
        api_id: apiId,
        api_name: apiData.api_name,
        api_endpoint: apiData.api_endpoint,
        api_method: apiData.api_method,
        api_description: apiData.api_description,
        authentication_type: apiData.authentication_type
      },
      'api'
    );

    const embedding = await this._embedding.generateEmbedding(apiData.api_name + ' ' + (apiData.api_description || ''));
    await this._vectorStore.storeEmbedding('memory_apis', apiId, embedding, { text: apiData.api_name });

    return { api_id: apiId, api_hash: apiHash, witness: result.witness };
  }

  /**
   * Store error
   * @param {Object} errorData - Error data
   * @returns {Object} Stored error
   */
  async storeError(errorData) {
    const errorId = this._generateErrorId(errorData.error_message);
    const errorHash = CanonicalAuthority.hash(errorData);

    const result = await this._persistence.storeMemory(
      'memory_errors',
      errorId,
      {
        error_id: errorId,
        error_message: errorData.error_message,
        error_type: errorData.error_type,
        error_stack: errorData.error_stack,
        error_context: CanonicalBytes.serialize(errorData.error_context),
        repository_id: errorData.repository_id,
        occurred_at: errorData.error_time || constitutionalTimeAuthority.now()
      },
      'error'
    );

    const embedding = await this._embedding.generateEmbedding(errorData.error_message + ' ' + (errorData.error_type || ''));
    await this._vectorStore.storeEmbedding('memory_errors', errorId, embedding, { text: errorData.error_message });

    return { error_id: errorId, error_hash: errorHash, witness: result.witness };
  }

  /**
   * Store fix
   * @param {Object} fixData - Fix data
   * @returns {Object} Stored fix
   */
  async storeFix(fixData) {
    const fixId = this._generateFixId(fixData.fix_description);
    const fixHash = CanonicalAuthority.hash(fixData);

    const result = await this._persistence.storeMemory(
      'memory_fixes',
      fixId,
      {
        fix_id: fixId,
        error_id: fixData.error_id,
        fix_description: fixData.fix_description,
        fix_code: fixData.fix_code,
        fix_applied_at: fixData.fix_applied_at,
        fix_verified: fixData.fix_verified || false
      },
      'fix'
    );

    const embedding = await this._embedding.generateEmbedding(fixData.fix_description + ' ' + (fixData.fix_code || ''));
    await this._vectorStore.storeEmbedding('memory_fixes', fixId, embedding, { text: fixData.fix_description });

    return { fix_id: fixId, fix_hash: fixHash, witness: result.witness };
  }

  /**
   * Store architecture
   * @param {Object} archData - Architecture data
   * @returns {Object} Stored architecture
   */
  async storeArchitecture(archData) {
    const archId = this._generateArchitectureId(archData.architecture_name);
    const archHash = CanonicalAuthority.hash(archData);

    const result = await this._persistence.storeMemory(
      'memory_architecture',
      archId,
      {
        architecture_id: archId,
        architecture_name: archData.architecture_name,
        architecture_type: archData.architecture_type,
        architecture_description: archData.architecture_description,
        architecture_diagram: archData.architecture_diagram,
        repository_id: archData.repository_id
      },
      'architecture'
    );

    const embedding = await this._embedding.generateEmbedding(archData.architecture_name + ' ' + (archData.architecture_description || ''));
    await this._vectorStore.storeEmbedding('memory_architecture', archId, embedding, { text: archData.architecture_name });

    return { architecture_id: archId, architecture_hash: archHash, witness: result.witness };
  }

  /**
   * Store preference
   * @param {Object} prefData - Preference data
   * @returns {Object} Stored preference
   */
  async storePreference(prefData) {
    const prefId = this._generatePreferenceId(prefData.preference_key);
    const prefHash = CanonicalAuthority.hash(prefData);

    const result = await this._persistence.storeMemory(
      'memory_preferences',
      prefId,
      {
        preference_id: prefId,
        preference_key: prefData.preference_key,
        preference_value: prefData.preference_value,
        preference_category: prefData.preference_category
      },
      'preference'
    );

    return { preference_id: prefId, preference_hash: prefHash, witness: result.witness };
  }

  /**
   * Store pattern
   * @param {Object} patternData - Pattern data
   * @returns {Object} Stored pattern
   */
  async storePattern(patternData) {
    const patternId = this._generatePatternId(patternData.pattern_name);
    const patternHash = CanonicalAuthority.hash(patternData);

    const result = await this._persistence.storeMemory(
      'memory_patterns',
      patternId,
      {
        pattern_id: patternId,
        pattern_name: patternData.pattern_name,
        pattern_type: patternData.pattern_type,
        pattern_description: patternData.pattern_description,
        pattern_code: patternData.pattern_code,
        pattern_frequency: patternData.pattern_frequency || 1,
        repository_id: patternData.repository_id
      },
      'pattern'
    );

    const embedding = await this._embedding.generateEmbedding(patternData.pattern_name + ' ' + (patternData.pattern_description || ''));
    await this._vectorStore.storeEmbedding('memory_patterns', patternId, embedding, { text: patternData.pattern_name });

    return { pattern_id: patternId, pattern_hash: patternHash, witness: result.witness };
  }

  /**
   * Store failure
   * @param {Object} failureData - Failure data
   * @returns {Object} Stored failure
   */
  async storeFailure(failureData) {
    const failureId = this._generateFailureId(failureData.failure_description);
    const failureHash = CanonicalAuthority.hash(failureData);

    const result = await this._persistence.storeMemory(
      'memory_failures',
      failureId,
      {
        failure_id: failureId,
        failure_description: failureData.failure_description,
        failure_type: failureData.failure_type,
        failure_context: CanonicalBytes.serialize(failureData.failure_context),
        repository_id: failureData.repository_id,
        occurred_at: failureData.failure_time || constitutionalTimeAuthority.now()
      },
      'failure'
    );

    const embedding = await this._embedding.generateEmbedding(failureData.failure_description + ' ' + (failureData.failure_type || ''));
    await this._vectorStore.storeEmbedding('memory_failures', failureId, embedding, { text: failureData.failure_description });

    return { failure_id: failureId, failure_hash: failureHash, witness: result.witness };
  }

  /**
   * Search memory by embedding
   * @param {string} query - Query text
   * @param {string} collection - Collection name
   * @param {number} limit - Result limit
   * @returns {Array} Search results
   */
  async searchMemory(query, collection, limit = 10) {
    const queryEmbedding = await this._embedding.generateEmbedding(query);
    return await this._vectorStore.searchMemory(collection, queryEmbedding, limit);
  }


  /**
   * Generate IDs
   */
  _generateFactId(text) { return `fact_${CanonicalAuthority.hash(text).substring(0, 16)}`; }
  _generateGoalId(text) { return `goal_${CanonicalAuthority.hash(text).substring(0, 16)}`; }
  _generateProjectId(name) { return `project_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generateRepositoryId(name) { return `repo_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generatePersonId(name) { return `person_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generateAPIId(name) { return `api_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generateErrorId(message) { return `error_${CanonicalAuthority.hash(message).substring(0, 16)}`; }
  _generateFixId(description) { return `fix_${CanonicalAuthority.hash(description).substring(0, 16)}`; }
  _generateArchitectureId(name) { return `arch_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generatePreferenceId(key) { return `pref_${CanonicalAuthority.hash(key).substring(0, 16)}`; }
  _generatePatternId(name) { return `pattern_${CanonicalAuthority.hash(name).substring(0, 16)}`; }
  _generateFailureId(description) { return `failure_${CanonicalAuthority.hash(description).substring(0, 16)}`; }

  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '45.4.0',
      constitutional_version: '45.4.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `memory_${hash.substring(0, 16)}`;
  }
}

module.exports = { MemoryAuthority };
