/**
 * Integration Intelligence
 * 
 * Ω.52 — Integration Intelligence
 * 
 * Given a New Repository:
 * 
 * CRX computes:
 * 
 * - Similarity
 * - Architecture
 * - Patterns
 * - Libraries
 * - Complexity
 * - Missing capabilities
 * - Potential integrations
 * - Mission candidates
 * - Risk
 * - Merge feasibility
 * 
 * Automatically.
 * 
 * Constitutional Constraint: Integration intelligence is computed deterministically from constitutional graphs.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class IntegrationIntelligence {
  constructor(postgresPool, objectRegistry, witnessChain, symbolGraph, fingerprinting, patternDatabase) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._symbolGraph = symbolGraph;
    this._fingerprinting = fingerprinting;
    this._patternDatabase = patternDatabase;
    this._intelligenceCache = new Map(); // repo_id → intelligence report
    this._initialized = false;
  }

  /**
   * Initialize integration intelligence
   */
  async initialize() {
    await this._loadIntelligenceCache();
    this._initialized = true;
    console.log('[IntegrationIntelligence] Initialized with', this._intelligenceCache.size, 'intelligence reports');
  }

  /**
   * Compute integration intelligence for repository
   */
  async computeIntelligence(repoId) {
    console.log(`[IntegrationIntelligence] Computing intelligence for: ${repoId}`);

    const intelligence = {
      repo_id: repoId,
      similarity: {},
      architecture: {},
      patterns: {},
      libraries: {},
      complexity: {},
      missing_capabilities: [],
      potential_integrations: [],
      mission_candidates: [],
      risk: {},
      merge_feasibility: {},
      generated_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    };

    // Get repository fingerprint
    const fingerprint = this._fingerprinting.getFingerprint(repoId);
    if (!fingerprint) {
      console.warn(`[IntegrationIntelligence] No fingerprint found for: ${repoId}`);
      return intelligence;
    }

    // Compute similarity to other repositories
    intelligence.similarity = await this._computeSimilarity(repoId, fingerprint);

    // Analyze architecture
    intelligence.architecture = await this._analyzeArchitecture(repoId, fingerprint);

    // Analyze patterns
    intelligence.patterns = await this._analyzePatterns(repoId, fingerprint);

    // Analyze libraries
    intelligence.libraries = await this._analyzeLibraries(repoId, fingerprint);

    // Analyze complexity
    intelligence.complexity = await this._analyzeComplexity(repoId, fingerprint);

    // Identify missing capabilities
    intelligence.missing_capabilities = await this._identifyMissingCapabilities(repoId, fingerprint);

    // Identify potential integrations
    intelligence.potential_integrations = await this._identifyPotentialIntegrations(repoId, fingerprint);

    // Generate mission candidates
    intelligence.mission_candidates = await this._generateMissionCandidates(repoId, fingerprint);

    // Assess risk
    intelligence.risk = await this._assessRisk(repoId, fingerprint);

    // Assess merge feasibility
    intelligence.merge_feasibility = await this._assessMergeFeasibility(repoId, fingerprint);

    // Cache intelligence
    this._intelligenceCache.set(repoId, intelligence);
    await this._persistIntelligence(intelligence);

    console.log(`[IntegrationIntelligence] Intelligence computed for: ${repoId}`);
    return intelligence;
  }

  /**
   * Compute similarity to other repositories
   */
  async _computeSimilarity(repoId, fingerprint) {
    const allFingerprints = this._fingerprinting.getAllFingerprints();
    const similarities = [];

    for (const otherFingerprint of allFingerprints) {
      if (otherFingerprint.repo_id === repoId) {
        continue;
      }

      const similarity = this._calculateFingerprintSimilarity(fingerprint, otherFingerprint);
      if (similarity > 0.3) {
        similarities.push({
          repo_id: otherFingerprint.repo_id,
          similarity: similarity,
          reasons: this._explainSimilarity(fingerprint, otherFingerprint),
        });
      }
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    return {
      top_similar: similarities.slice(0, 10),
      average_similarity: similarities.length > 0 ? similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length : 0,
      total_compared: allFingerprints.length - 1,
    };
  }

  /**
   * Calculate fingerprint similarity
   */
  _calculateFingerprintSimilarity(fp1, fp2) {
    let score = 0;
    let maxScore = 0;

    // Architectural style similarity
    maxScore += 0.3;
    const styleIntersection = fp1.architectural_style.filter(s => fp2.architectural_style.includes(s));
    score += (styleIntersection.length / Math.max(fp1.architectural_style.length, fp2.architectural_style.length)) * 0.3;

    // Library similarity
    maxScore += 0.3;
    const libIntersection = fp1.libraries.filter(l => fp2.libraries.some(l2 => l2.name === l.name));
    score += (libIntersection.length / Math.max(fp1.libraries.length, fp2.libraries.length)) * 0.3;

    // Pattern similarity
    maxScore += 0.2;
    const patternIntersection = fp1.patterns.filter(p => fp2.patterns.includes(p));
    score += (patternIntersection.length / Math.max(fp1.patterns.length, fp2.patterns.length)) * 0.2;

    // Complexity similarity
    maxScore += 0.2;
    const complexityDiff = Math.abs(fp1.complexity_metrics.coupling - fp2.complexity_metrics.coupling);
    const complexitySimilarity = Math.max(0, 1 - complexityDiff / 100);
    score += complexitySimilarity * 0.2;

    return score / maxScore;
  }

  /**
   * Explain similarity
   */
  _explainSimilarity(fp1, fp2) {
    const reasons = [];

    const styleIntersection = fp1.architectural_style.filter(s => fp2.architectural_style.includes(s));
    if (styleIntersection.length > 0) {
      reasons.push(`Shared architectural styles: ${styleIntersection.join(', ')}`);
    }

    const libIntersection = fp1.libraries.filter(l => fp2.libraries.some(l2 => l2.name === l.name));
    if (libIntersection.length > 0) {
      reasons.push(`Shared libraries: ${libIntersection.map(l => l.name).join(', ')}`);
    }

    const patternIntersection = fp1.patterns.filter(p => fp2.patterns.includes(p));
    if (patternIntersection.length > 0) {
      reasons.push(`Shared patterns: ${patternIntersection.join(', ')}`);
    }

    return reasons;
  }

  /**
   * Analyze architecture
   */
  async _analyzeArchitecture(repoId, fingerprint) {
    return {
      styles: fingerprint.architectural_style,
      style_confidence: this._calculateStyleConfidence(fingerprint),
      layer_count: this._estimateLayerCount(fingerprint),
      component_count: fingerprint.complexity_metrics.total_classes || 0,
      service_count: this._countServices(repoId),
    };
  }

  /**
   * Calculate style confidence
   */
  _calculateStyleConfidence(fingerprint) {
    // Simple heuristic based on pattern count
    return Math.min(0.5 + (fingerprint.patterns.length * 0.1), 1.0);
  }

  /**
   * Estimate layer count
   */
  _estimateLayerCount(fingerprint) {
    if (fingerprint.architectural_style.includes('Layered')) {
      return 3;
    }
    if (fingerprint.architectural_style.includes('Hexagonal')) {
      return 3;
    }
    if (fingerprint.architectural_style.includes('DDD')) {
      return 4;
    }
    return 2;
  }

  /**
   * Count services
   */
  _countServices(repoId) {
    const symbols = this._symbolGraph.getSymbolsByRepository(repoId);
    return symbols.filter(s => s.payload.canonical_name.toLowerCase().includes('service')).length;
  }

  /**
   * Analyze patterns
   */
  async _analyzePatterns(repoId, fingerprint) {
    const patterns = this._patternDatabase.getPatternsByRepository(repoId);
    
    return {
      detected: fingerprint.patterns,
      count: fingerprint.patterns.length,
      by_category: this._groupPatternsByCategory(patterns),
      confidence: this._calculatePatternConfidence(patterns),
    };
  }

  /**
   * Group patterns by category
   */
  _groupPatternsByCategory(patterns) {
    const grouped = {};
    for (const pattern of patterns) {
      const category = pattern.payload.category || 'unknown';
      grouped[category] = (grouped[category] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Calculate pattern confidence
   */
  _calculatePatternConfidence(patterns) {
    if (patterns.length === 0) {
      return 0;
    }
    const avgConfidence = patterns.reduce((sum, p) => sum + (p.payload.confidence || 0), 0) / patterns.length;
    return avgConfidence;
  }

  /**
   * Analyze libraries
   */
  async _analyzeLibraries(repoId, fingerprint) {
    return {
      detected: fingerprint.libraries,
      count: fingerprint.libraries.length,
      by_category: this._groupLibrariesByCategory(fingerprint.libraries),
      by_type: this._groupLibrariesByType(fingerprint.libraries),
      outdated: this._detectOutdatedLibraries(fingerprint.libraries),
    };
  }

  /**
   * Group libraries by category
   */
  _groupLibrariesByCategory(libraries) {
    const grouped = {};
    for (const lib of libraries) {
      const category = lib.category || 'unknown';
      grouped[category] = (grouped[category] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Group libraries by type
   */
  _groupLibrariesByType(libraries) {
    const grouped = {};
    for (const lib of libraries) {
      const type = lib.type || 'unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    }
    return grouped;
  }

  /**
   * Detect outdated libraries
   */
  _detectOutdatedLibraries(libraries) {
    // Placeholder for outdated library detection
    return [];
  }

  /**
   * Analyze complexity
   */
  async _analyzeComplexity(repoId, fingerprint) {
    const metrics = fingerprint.complexity_metrics;
    
    return {
      total_symbols: metrics.total_symbols,
      total_functions: metrics.total_functions,
      total_classes: metrics.total_classes,
      total_interfaces: metrics.total_interfaces,
      average_methods_per_class: metrics.average_methods_per_class,
      cyclomatic_complexity: metrics.cyclomatic_complexity,
      inheritance_depth: metrics.inheritance_depth,
      coupling: metrics.coupling,
      cohesion: metrics.cohesion,
      complexity_level: this._classifyComplexity(metrics),
    };
  }

  /**
   * Classify complexity
   */
  _classifyComplexity(metrics) {
    const score = metrics.coupling + metrics.inheritance_depth + metrics.total_symbols / 100;
    
    if (score < 10) {
      return 'Low';
    } else if (score < 30) {
      return 'Medium';
    } else if (score < 60) {
      return 'High';
    } else {
      return 'Very High';
    }
  }

  /**
   * Identify missing capabilities
   */
  async _identifyMissingCapabilities(repoId, fingerprint) {
    const missing = [];
    const allPatterns = this._patternDatabase.getAllPatterns();
    const repoPatterns = fingerprint.patterns;

    // Find common patterns not in this repository
    const topPatterns = this._patternDatabase.getTopPatternsByUsage(20);
    for (const pattern of topPatterns) {
      if (!repoPatterns.includes(pattern.payload.name)) {
        missing.push({
          pattern: pattern.payload.name,
          category: pattern.payload.category,
          usage_count: pattern.payload.usage_count,
          confidence: pattern.payload.confidence,
          recommendation: `Consider implementing ${pattern.payload.name} pattern for ${pattern.payload.problem}`,
        });
      }
    }

    return missing.slice(0, 10);
  }

  /**
   * Identify potential integrations
   */
  async _identifyPotentialIntegrations(repoId, fingerprint) {
    const integrations = [];
    const allFingerprints = this._fingerprinting.getAllFingerprints();

    for (const otherFingerprint of allFingerprints) {
      if (otherFingerprint.repo_id === repoId) {
        continue;
      }

      const integration = this._assessIntegrationPotential(fingerprint, otherFingerprint);
      if (integration.potential > 0.5) {
        integrations.push(integration);
      }
    }

    // Sort by potential
    integrations.sort((a, b) => b.potential - a.potential);

    return integrations.slice(0, 10);
  }

  /**
   * Assess integration potential
   */
  _assessIntegrationPotential(fp1, fp2) {
    let potential = 0;
    const reasons = [];

    // Shared libraries suggest compatibility
    const sharedLibs = fp1.libraries.filter(l => fp2.libraries.some(l2 => l2.name === l.name));
    if (sharedLibs.length > 0) {
      potential += 0.3;
      reasons.push(`Shared libraries: ${sharedLibs.map(l => l.name).join(', ')}`);
    }

    // Similar architectural style
    const sharedStyles = fp1.architectural_style.filter(s => fp2.architectural_style.includes(s));
    if (sharedStyles.length > 0) {
      potential += 0.2;
      reasons.push(`Shared architectural styles: ${sharedStyles.join(', ')}`);
    }

    // Complementary patterns
    const fp1Patterns = new Set(fp1.patterns);
    const fp2Patterns = new Set(fp2.patterns);
    const complementary = [...fp1Patterns].filter(p => !fp2Patterns.has(p));
    if (complementary.length > 0 && complementary.length < 5) {
      potential += 0.2;
      reasons.push(`Complementary patterns: ${complementary.join(', ')}`);
    }

    // Similar complexity
    const complexityDiff = Math.abs(fp1.complexity_metrics.coupling - fp2.complexity_metrics.coupling);
    if (complexityDiff < 20) {
      potential += 0.1;
      reasons.push('Similar complexity level');
    }

    return {
      repo_id: fp2.repo_id,
      potential: potential,
      reasons: reasons,
    };
  }

  /**
   * Generate mission candidates
   */
  async _generateMissionCandidates(repoId, fingerprint) {
    const missions = [];

    // Mission: Add missing patterns
    for (const missing of fingerprint.missing_capabilities || []) {
      missions.push({
        type: 'pattern_implementation',
        priority: 'medium',
        description: `Implement ${missing.pattern} pattern`,
        reasoning: missing.recommendation,
        estimated_complexity: missing.complexity || 'Medium',
      });
    }

    // Mission: Library updates
    for (const outdated of fingerprint.libraries.filter(l => l.outdated)) {
      missions.push({
        type: 'library_update',
        priority: 'high',
        description: `Update ${outdated.name} library`,
        reasoning: 'Security and performance improvements',
        estimated_complexity: 'Low',
      });
    }

    // Mission: Architecture improvement
    if (fingerprint.complexity_metrics.coupling > 50) {
      missions.push({
        type: 'architecture_improvement',
        priority: 'high',
        description: 'Reduce coupling between components',
        reasoning: 'High coupling detected, consider refactoring',
        estimated_complexity: 'High',
      });
    }

    // Mission: Integration with similar repositories
    const similarRepos = fingerprint.similarity?.top_similar?.slice(0, 3) || [];
    for (const similar of similarRepos) {
      missions.push({
        type: 'integration',
        priority: 'low',
        description: `Explore integration with ${similar.repo_id}`,
        reasoning: `High similarity (${(similar.similarity * 100).toFixed(1)}%)`,
        estimated_complexity: 'Medium',
      });
    }

    return missions.slice(0, 10);
  }

  /**
   * Assess risk
   */
  async _assessRisk(repoId, fingerprint) {
    const risks = [];
    let totalRisk = 0;

    // Risk: High complexity
    if (fingerprint.complexity_metrics.coupling > 50) {
      risks.push({
        type: 'complexity',
        level: 'high',
        description: 'High coupling detected',
        mitigation: 'Consider refactoring to reduce coupling',
      });
      totalRisk += 0.3;
    }

    // Risk: Outdated libraries
    const outdatedCount = (fingerprint.libraries || []).filter(l => l.outdated).length;
    if (outdatedCount > 0) {
      risks.push({
        type: 'dependencies',
        level: 'medium',
        description: `${outdatedCount} outdated libraries detected`,
        mitigation: 'Update libraries to latest stable versions',
      });
      totalRisk += 0.2;
    }

    // Risk: Missing security patterns
    const securityPatterns = ['Authentication', 'Authorization', 'Encryption'];
    const hasSecurity = fingerprint.patterns.some(p => securityPatterns.includes(p));
    if (!hasSecurity) {
      risks.push({
        type: 'security',
        level: 'high',
        description: 'Missing security patterns',
        mitigation: 'Implement authentication and authorization',
      });
      totalRisk += 0.4;
    }

    // Risk: Low test coverage (placeholder)
    risks.push({
      type: 'testing',
      level: 'unknown',
      description: 'Test coverage not analyzed',
      mitigation: 'Implement comprehensive test suite',
    });

    return {
      overall_risk: totalRisk,
      risk_level: this._classifyRisk(totalRisk),
      risks: risks,
    };
  }

  /**
   * Classify risk
   */
  _classifyRisk(riskScore) {
    if (riskScore < 0.3) {
      return 'Low';
    } else if (riskScore < 0.6) {
      return 'Medium';
    } else {
      return 'High';
    }
  }

  /**
   * Assess merge feasibility
   */
  async _assessMergeFeasibility(repoId, fingerprint) {
    const feasibility = {
      overall_feasibility: 0,
      factors: [],
      recommendations: [],
    };

    // Factor: Architectural compatibility
    const similarArch = fingerprint.similarity?.top_similar?.filter(s => s.similarity > 0.5) || [];
    if (similarArch.length > 0) {
      feasibility.overall_feasibility += 0.3;
      feasibility.factors.push({
        factor: 'architectural_compatibility',
        score: 0.8,
        description: 'Compatible architectures found in similar repositories',
      });
    } else {
      feasibility.factors.push({
        factor: 'architectural_compatibility',
        score: 0.4,
        description: 'Limited architectural compatibility',
      });
    }

    // Factor: Library compatibility
    const sharedLibs = fingerprint.libraries.length > 0 ? 0.7 : 0.3;
    feasibility.overall_feasibility += sharedLibs * 0.2;
    feasibility.factors.push({
      factor: 'library_compatibility',
      score: sharedLibs,
      description: sharedLibs > 0.5 ? 'Good library overlap' : 'Limited library overlap',
    });

    // Factor: Complexity
    const complexityScore = fingerprint.complexity_metrics.coupling < 30 ? 0.8 : 0.4;
    feasibility.overall_feasibility += complexityScore * 0.2;
    feasibility.factors.push({
      factor: 'complexity',
      score: complexityScore,
      description: complexityScore > 0.5 ? 'Manageable complexity' : 'High complexity',
    });

    // Factor: Risk
    const riskScore = 1 - (fingerprint.risk?.overall_risk || 0);
    feasibility.overall_feasibility += riskScore * 0.3;
    feasibility.factors.push({
      factor: 'risk',
      score: riskScore,
      description: riskScore > 0.5 ? 'Acceptable risk level' : 'High risk level',
    });

    // Generate recommendations
    if (feasibility.overall_feasibility > 0.7) {
      feasibility.recommendations.push('Proceed with integration');
    } else if (feasibility.overall_feasibility > 0.4) {
      feasibility.recommendations.push('Proceed with caution, address high-risk factors');
    } else {
      feasibility.recommendations.push('Not recommended for integration without significant refactoring');
    }

    feasibility.feasibility_level = this._classifyFeasibility(feasibility.overall_feasibility);

    return feasibility;
  }

  /**
   * Classify feasibility
   */
  _classifyFeasibility(score) {
    if (score > 0.7) {
      return 'High';
    } else if (score > 0.4) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Get intelligence by repository
   */
  getIntelligence(repoId) {
    return this._intelligenceCache.get(repoId);
  }

  /**
   * Get all intelligence reports
   */
  getAllIntelligence() {
    return Array.from(this._intelligenceCache.values());
  }

  /**
   * Get intelligence statistics
   */
  getStatistics() {
    const reports = Array.from(this._intelligenceCache.values());
    
    const stats = {
      total_repositories: reports.length,
      average_similarity: 0,
      average_risk: 0,
      average_feasibility: 0,
      high_risk_count: 0,
      low_feasibility_count: 0,
    };

    let totalSimilarity = 0;
    let totalRisk = 0;
    let totalFeasibility = 0;

    for (const report of reports) {
      totalSimilarity += report.similarity?.average_similarity || 0;
      totalRisk += report.risk?.overall_risk || 0;
      totalFeasibility += report.merge_feasibility?.overall_feasibility || 0;

      if (report.risk?.risk_level === 'High') {
        stats.high_risk_count++;
      }
      if (report.merge_feasibility?.feasibility_level === 'Low') {
        stats.low_feasibility_count++;
      }
    }

    if (reports.length > 0) {
      stats.average_similarity = totalSimilarity / reports.length;
      stats.average_risk = totalRisk / reports.length;
      stats.average_feasibility = totalFeasibility / reports.length;
    }

    return stats;
  }

  /**
   * Persist intelligence
   */
  async _persistIntelligence(intelligence) {
    try {
      await this._postgres.query(`
        INSERT INTO integration_intelligence (repo_id, intelligence_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          intelligence_data = $2,
          updated_at = NOW()
      `, [intelligence.repo_id, JSON.stringify(intelligence)]);
    } catch (error) {
      console.error('[IntegrationIntelligence] Failed to persist intelligence:', error.message);
    }
  }

  /**
   * Load intelligence cache
   */
  async _loadIntelligenceCache() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, intelligence_data
        FROM integration_intelligence
        ORDER BY repo_id
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._intelligenceCache.set(row.repo_id, row.intelligence_data);
      }
    } catch (error) {
      console.error('[IntegrationIntelligence] Failed to load intelligence cache:', error.message);
    }
  }

  /**
   * Clear intelligence cache (memory only)
   */
  clearIntelligenceCache() {
    this._intelligenceCache.clear();
  }
}

module.exports = { IntegrationIntelligence };
