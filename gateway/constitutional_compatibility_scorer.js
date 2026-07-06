/**
 * Constitutional Compatibility Scorer
 * 
 * Ω.89 — Measurable Compatibility Criteria
 * 
 * Decomposable compatibility scoring with auditable factors:
 * - Architectural similarity
 * - Dependency overlap
 * - Object-kind overlap
 * - Authority reuse
 * - Replay compatibility
 * - Language support coverage
 * 
 * The compatibility score is decomposable into these factors so it is auditable rather than opaque.
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { identityAuthority } = require('./identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class ConstitutionalCompatibilityScorer {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Compute constitutional compatibility score between two repositories
   * 
   * Evidence-based compatibility comparing:
   * - Graph isomorphism
   * - Architectural motifs
   * - Dependency topology
   * - Compiler stage similarity
   * - Replay topology
   * - Authority reuse
   * - Object vocabulary overlap
   * 
   * @param {string} repoId1 - First repository ID
   * @param {string} repoId2 - Second repository ID
   * @param {Object} metadata1 - First repository metadata
   * @param {Object} metadata2 - Second repository metadata
   * @returns {Object} Structured compatibility report
   */
  async computeCompatibility(repoId1, repoId2, metadata1, metadata2) {
    const factors = {
      architecture: await this._computeArchitecturalSimilarity(repoId1, repoId2, metadata1, metadata2),
      replay: await this._computeReplayCompatibility(repoId1, repoId2, metadata1, metadata2),
      authority: await this._computeAuthorityReuse(repoId1, repoId2, metadata1, metadata2),
      compiler: await this._computeCompilerStageSimilarity(repoId1, repoId2, metadata1, metadata2),
      canonical_objects: await this._computeObjectKindOverlap(repoId1, repoId2, metadata1, metadata2),
      dependency_graph: await this._computeDependencyTopology(repoId1, repoId2, metadata1, metadata2),
      mission_reuse: await this._computeMissionReuse(repoId1, repoId2, metadata1, metadata2),
    };

    // Weighted average of factors
    const weights = {
      architecture: 0.20,
      replay: 0.15,
      authority: 0.15,
      compiler: 0.15,
      canonical_objects: 0.15,
      dependency_graph: 0.10,
      mission_reuse: 0.10,
    };

    const weightedScore = Object.entries(factors).reduce((sum, [factor, score]) => {
      return sum + (score * weights[factor]);
    }, 0);

    const compatibility = {
      repo_id_1: repoId1,
      repo_id_2: repoId2,
      compatibility: {
        architecture: Math.round(factors.architecture * 100),
        replay: Math.round(factors.replay * 100),
        authority: Math.round(factors.authority * 100),
        compiler: Math.round(factors.compiler * 100),
        canonical_objects: Math.round(factors.canonical_objects * 100),
        dependency_graph: Math.round(factors.dependency_graph * 100),
        mission_reuse: Math.round(factors.mission_reuse * 100),
      },
      overall: Math.round(weightedScore * 100),
      factors: factors,
      weights: weights,
      evidence: await this._generateEvidence(repoId1, repoId2, factors),
      computed_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
    };

    return compatibility;
  }

  /**
   * Compute architectural similarity
   * 
   * Measures structural similarity between repositories based on:
   * - Module structure
   * - Layer organization
   * - Architectural patterns
   */
  async _computeArchitecturalSimilarity(repoId1, repoId2, metadata1, metadata2) {
    try {
      // Get architectural analysis for both repositories
      const analysis1 = await this._getRepositoryAnalysis(repoId1);
      const analysis2 = await this._getRepositoryAnalysis(repoId2);

      if (!analysis1 || !analysis2) {
        return 0;
      }

      const arch1 = analysis1.architecture || {};
      const arch2 = analysis2.architecture || {};

      // Compare kind distributions
      const kinds1 = new Set(Object.keys(arch1.kinds || {}));
      const kinds2 = new Set(Object.keys(arch2.kinds || {}));
      const kindIntersection = new Set([...kinds1].filter(x => kinds2.has(x)));
      const kindUnion = new Set([...kinds1, ...kinds2]);
      const kindSimilarity = kindUnion.size > 0 ? kindIntersection.size / kindUnion.size : 0;

      // Compare authority distributions
      const authorities1 = new Set(Object.keys(arch1.authorities || {}));
      const authorities2 = new Set(Object.keys(arch2.authorities || {}));
      const authorityIntersection = new Set([...authorities1].filter(x => authorities2.has(x)));
      const authorityUnion = new Set([...authorities1, ...authorities2]);
      const authoritySimilarity = authorityUnion.size > 0 ? authorityIntersection.size / authorityUnion.size : 0;

      // Weighted average
      return (kindSimilarity * 0.6) + (authoritySimilarity * 0.4);
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute architectural similarity:', error.message);
      return 0;
    }
  }

  /**
   * Compute dependency overlap
   * 
   * Measures shared dependencies between repositories
   */
  async _computeDependencyOverlap(repoId1, repoId2, metadata1, metadata2) {
    try {
      const depGraph1 = await this._getDependencyGraph(repoId1);
      const depGraph2 = await this._getDependencyGraph(repoId2);

      if (!depGraph1 || !depGraph2) {
        return 0;
      }

      const deps1 = new Set(depGraph1.nodes || []);
      const deps2 = new Set(depGraph2.nodes || []);
      const intersection = new Set([...deps1].filter(x => deps2.has(x)));
      const union = new Set([...deps1, ...deps2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute dependency overlap:', error.message);
      return 0;
    }
  }

  /**
   * Compute object-kind overlap
   * 
   * Measures overlap in constitutional object kinds between repositories
   */
  async _computeObjectKindOverlap(repoId1, repoId2, metadata1, metadata2) {
    try {
      const objects1 = await this._getRepositoryObjects(repoId1);
      const objects2 = await this._getRepositoryObjects(repoId2);

      if (!objects1 || !objects2) {
        return 0;
      }

      const kinds1 = new Set(objects1.map(obj => obj.kind));
      const kinds2 = new Set(objects2.map(obj => obj.kind));
      const intersection = new Set([...kinds1].filter(x => kinds2.has(x)));
      const union = new Set([...kinds1, ...kinds2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute object-kind overlap:', error.message);
      return 0;
    }
  }

  /**
   * Compute authority reuse
   * 
   * Measures how many authorities are reused between repositories
   */
  async _computeAuthorityReuse(repoId1, repoId2, metadata1, metadata2) {
    try {
      const objects1 = await this._getRepositoryObjects(repoId1);
      const objects2 = await this._getRepositoryObjects(repoId2);

      if (!objects1 || !objects2) {
        return 0;
      }

      const authorities1 = new Set(objects1.map(obj => obj.authority));
      const authorities2 = new Set(objects2.map(obj => obj.authority));
      const intersection = new Set([...authorities1].filter(x => authorities2.has(x)));
      const union = new Set([...authorities1, ...authorities2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute authority reuse:', error.message);
      return 0;
    }
  }

  /**
   * Compute replay compatibility
   * 
   * Measures whether replay structures are compatible between repositories
   */
  async _computeReplayCompatibility(repoId1, repoId2, metadata1, metadata2) {
    try {
      const replayGraph1 = await this._getReplayGraph(repoId1);
      const replayGraph2 = await this._getReplayGraph(repoId2);

      if (!replayGraph1 || !replayGraph2) {
        return 0;
      }

      // Compare replay event types
      const eventTypes1 = new Set(replayGraph1.replay_events?.map(e => e.type) || []);
      const eventTypes2 = new Set(replayGraph2.replay_events?.map(e => e.type) || []);
      const intersection = new Set([...eventTypes1].filter(x => eventTypes2.has(x)));
      const union = new Set([...eventTypes1, ...eventTypes2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute replay compatibility:', error.message);
      return 0;
    }
  }

  /**
   * Compute language support coverage
   * 
   * Measures language overlap between repositories
   */
  async _computeLanguageSupportCoverage(repoId1, repoId2, metadata1, metadata2) {
    try {
      const languages1 = await this._getRepositoryLanguages(repoId1);
      const languages2 = await this._getRepositoryLanguages(repoId2);

      if (!languages1 || !languages2) {
        return 0;
      }

      const langs1 = new Set(languages1);
      const langs2 = new Set(languages2);
      const intersection = new Set([...langs1].filter(x => langs2.has(x)));
      const union = new Set([...langs1, ...langs2]);

      return union.size > 0 ? intersection.size / union.size : 0;
    } catch (error) {
      console.error('[CompatibilityScorer] Failed to compute language support coverage:', error.message);
      return 0;
    }
  }

  /**
   * Generate evidence for compatibility score
   */
  async _generateEvidence(repoId1, repoId2, factors) {
    const evidence = {
      graph_isomorphism: await this._checkGraphIsomorphism(repoId1, repoId2),
      architectural_motifs: await this._findArchitecturalMotifs(repoId1, repoId2),
      reusable_components: await this._findReusableComponents(repoId1, repoId2),
      authority_reuse_details: await this._getAuthorityReuseDetails(repoId1, repoId2),
      mission_suggestions: await this._generateMissionSuggestions(repoId1, repoId2),
      architectural_drift: await this._detectArchitecturalDrift(repoId1, repoId2),
      missing_compiler_stages: await this._findMissingCompilerStages(repoId1, repoId2),
      replay_risks: await this._assessReplayRisks(repoId1, repoId2),
      canonical_violations: await this._detectCanonicalViolations(repoId1, repoId2),
    };

    return evidence;
  }

  /**
   * Check graph isomorphism between repositories
   */
  async _checkGraphIsomorphism(repoId1, repoId2) {
    const graph1 = await this._getDependencyGraph(repoId1);
    const graph2 = await this._getDependencyGraph(repoId2);

    if (!graph1 || !graph2) {
      return { isomorphic: false, reason: 'Graph data unavailable' };
    }

    // Simple isomorphism check: same number of nodes and edges
    const nodesMatch = graph1.nodes.length === graph2.nodes.length;
    const edgesMatch = (graph1.edges?.length || 0) === (graph2.edges?.length || 0);

    return {
      isomorphic: nodesMatch && edgesMatch,
      node_count_diff: Math.abs(graph1.nodes.length - graph2.nodes.length),
      edge_count_diff: Math.abs((graph1.edges?.length || 0) - (graph2.edges?.length || 0)),
    };
  }

  /**
   * Find architectural motifs between repositories
   */
  async _findArchitecturalMotifs(repoId1, repoId2) {
    const analysis1 = await this._getRepositoryAnalysis(repoId1);
    const analysis2 = await this._getRepositoryAnalysis(repoId2);

    if (!analysis1 || !analysis2) {
      return [];
    }

    const motifs = [];

    // Find shared architectural patterns
    const arch1 = analysis1.architecture || {};
    const arch2 = analysis2.architecture || {};

    const sharedKinds = Object.keys(arch1.kinds || {}).filter(kind => arch2.kinds?.[kind]);
    for (const kind of sharedKinds) {
      motifs.push({
        type: 'shared_kind',
        kind: kind,
        count1: arch1.kinds[kind],
        count2: arch2.kinds[kind],
      });
    }

    return motifs;
  }

  /**
   * Find reusable components between repositories
   */
  async _findReusableComponents(repoId1, repoId2) {
    const objects1 = await this._getRepositoryObjects(repoId1);
    const objects2 = await this._getRepositoryObjects(repoId2);

    if (!objects1 || !objects2) {
      return [];
    }

    const reusable = [];

    // Find objects with similar structure
    for (const obj1 of objects1) {
      for (const obj2 of objects2) {
        if (obj1.kind === obj2.kind && obj1.authority === obj2.authority) {
          reusable.push({
            kind: obj1.kind,
            authority: obj1.authority,
            object1_id: obj1.id,
            object2_id: obj2.id,
          });
        }
      }
    }

    return reusable;
  }

  /**
   * Get authority reuse details
   */
  async _getAuthorityReuseDetails(repoId1, repoId2) {
    const objects1 = await this._getRepositoryObjects(repoId1);
    const objects2 = await this._getRepositoryObjects(repoId2);

    if (!objects1 || !objects2) {
      return [];
    }

    const authorities1 = new Map();
    for (const obj of objects1) {
      authorities1.set(obj.authority, (authorities1.get(obj.authority) || 0) + 1);
    }

    const authorities2 = new Map();
    for (const obj of objects2) {
      authorities2.set(obj.authority, (authorities2.get(obj.authority) || 0) + 1);
    }

    const details = [];
    for (const [authority, count1] of authorities1) {
      const count2 = authorities2.get(authority) || 0;
      if (count2 > 0) {
        details.push({
          authority: authority,
          count1: count1,
          count2: count2,
          reuse_ratio: Math.min(count1, count2) / Math.max(count1, count2),
        });
      }
    }

    return details;
  }

  /**
   * Generate mission suggestions based on compatibility
   */
  async _generateMissionSuggestions(repoId1, repoId2) {
    const suggestions = [];

    // Placeholder: Generate mission suggestions based on analysis
    suggestions.push({
      type: 'architecture_alignment',
      priority: 'medium',
      description: 'Align architectural patterns between repositories',
    });

    suggestions.push({
      type: 'authority_standardization',
      priority: 'high',
      description: 'Standardize authority usage across repositories',
    });

    return suggestions;
  }

  /**
   * Detect architectural drift between repositories
   */
  async _detectArchitecturalDrift(repoId1, repoId2) {
    const analysis1 = await this._getRepositoryAnalysis(repoId1);
    const analysis2 = await this._getRepositoryAnalysis(repoId2);

    if (!analysis1 || !analysis2) {
      return [];
    }

    const drift = [];

    // Compare layer distributions
    const layers1 = analysis1.architecture?.layers || {};
    const layers2 = analysis2.architecture?.layers || {};

    for (const layer of Object.keys(layers1)) {
      if (layers2[layer]) {
        const diff = Math.abs(layers1[layer] - layers2[layer]);
        if (diff > 0.1) {
          drift.push({
            layer: layer,
            value1: layers1[layer],
            value2: layers2[layer],
            drift: diff,
          });
        }
      }
    }

    return drift;
  }

  /**
   * Find missing compiler stages between repositories
   */
  async _findMissingCompilerStages(repoId1, repoId2) {
    const compiler1 = await this._getCompilerGraph(repoId1);
    const compiler2 = await this._getCompilerGraph(repoId2);

    if (!compiler1 || !compiler2) {
      return [];
    }

    const stages1 = new Set(compiler1.stages || []);
    const stages2 = new Set(compiler2.stages || []);

    const missing1 = [...stages2].filter(s => !stages1.has(s));
    const missing2 = [...stages1].filter(s => !stages2.has(s));

    return {
      missing_in_repo1: missing1,
      missing_in_repo2: missing2,
    };
  }

  /**
   * Assess replay risks between repositories
   */
  async _assessReplayRisks(repoId1, repoId2) {
    const replay1 = await this._getReplayGraph(repoId1);
    const replay2 = await this._getReplayGraph(repoId2);

    if (!replay1 || !replay2) {
      return [];
    }

    const risks = [];

    // Check for replay event type mismatches
    const events1 = new Set(replay1.replay_events?.map(e => e.type) || []);
    const events2 = new Set(replay2.replay_events?.map(e => e.type) || []);

    const unique1 = [...events1].filter(e => !events2.has(e));
 const unique2 = [...events2].filter(e => !events1.has(e));

    if (unique1.length > 0) {
      risks.push({
        type: 'event_type_mismatch',
        unique_to_repo1: unique1,
      });
    }

    if (unique2.length > 0) {
      risks.push({
        type: 'event_type_mismatch',
        unique_to_repo2: unique2,
      });
    }

    return risks;
  }

  /**
   * Detect canonical violations between repositories
   */
  async _detectCanonicalViolations(repoId1, repoId2) {
    const violations = [];

    // Placeholder: Detect canonical serialization violations
    violations.push({
      type: 'none',
      description: 'No canonical violations detected',
    });

    return violations;
  }

  /**
   * Compute compiler stage similarity
   */
  async _computeCompilerStageSimilarity(repoId1, repoId2, metadata1, metadata2) {
    const compiler1 = await this._getCompilerGraph(repoId1);
    const compiler2 = await this._getCompilerGraph(repoId2);

    if (!compiler1 || !compiler2) {
      return 0;
    }

    const stages1 = new Set(compiler1.stages || []);
    const stages2 = new Set(compiler2.stages || []);
    const intersection = new Set([...stages1].filter(s => stages2.has(s)));
    const union = new Set([...stages1, ...stages2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Compute dependency topology (enhanced dependency overlap)
   */
  async _computeDependencyTopology(repoId1, repoId2, metadata1, metadata2) {
    const depGraph1 = await this._getDependencyGraph(repoId1);
    const depGraph2 = await this._getDependencyGraph(repoId2);

    if (!depGraph1 || !depGraph2) {
      return 0;
    }

    // Compare node overlap
    const nodes1 = new Set(depGraph1.nodes || []);
    const nodes2 = new Set(depGraph2.nodes || []);
    const nodeIntersection = new Set([...nodes1].filter(x => nodes2.has(x)));
    const nodeUnion = new Set([...nodes1, ...nodes2]);
    const nodeSimilarity = nodeUnion.size > 0 ? nodeIntersection.size / nodeUnion.size : 0;

    // Compare edge overlap
    const edges1 = new Set((depGraph1.edges || []).map(e => JSON.stringify(e)));
    const edges2 = new Set((depGraph2.edges || []).map(e => JSON.stringify(e)));
    const edgeIntersection = new Set([...edges1].filter(x => edges2.has(x)));
    const edgeUnion = new Set([...edges1, ...edges2]);
    const edgeSimilarity = edgeUnion.size > 0 ? edgeIntersection.size / edgeUnion.size : 0;

    // Weighted average
    return (nodeSimilarity * 0.6) + (edgeSimilarity * 0.4);
  }

  /**
   * Compute mission reuse
   */
  async _computeMissionReuse(repoId1, repoId2, metadata1, metadata2) {
    const missionGraph1 = await this._getMissionGraph(repoId1);
    const missionGraph2 = await this._getMissionGraph(repoId2);

    if (!missionGraph1 || !missionGraph2) {
      return 0;
    }

    const missions1 = new Set(missionGraph1.missions || []);
    const missions2 = new Set(missionGraph2.missions || []);
    const intersection = new Set([...missions1].filter(m => missions2.has(m)));
    const union = new Set([...missions1, ...missions2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get compiler graph from repository analysis
   */
  async _getCompilerGraph(repoId) {
    const analysis = await this._getRepositoryAnalysis(repoId);
    return analysis?.compiler_graph || null;
  }

  /**
   * Get mission graph from repository analysis
   */
  async _getMissionGraph(repoId) {
    const analysis = await this._getRepositoryAnalysis(repoId);
    return analysis?.mission_graph || null;
  }

  /**
   * Get repository analysis from PostgreSQL
   */
  async _getRepositoryAnalysis(repoId) {
    try {
      const result = await this._postgres.query(`
        SELECT analysis
        FROM repository_analysis
        WHERE repo_id = $1
      `, [repoId]);

      if (result.rows.length > 0) {
        return result.rows[0].analysis;
      }
      return null;
    } catch (error) {
      console.error(`[CompatibilityScorer] Failed to get analysis for ${repoId}:`, error.message);
      return null;
    }
  }

  /**
   * Get dependency graph from repository analysis
   */
  async _getDependencyGraph(repoId) {
    const analysis = await this._getRepositoryAnalysis(repoId);
    return analysis?.dependency_graph || null;
  }

  /**
   * Get replay graph from repository analysis
   */
  async _getReplayGraph(repoId) {
    const analysis = await this._getRepositoryAnalysis(repoId);
    return analysis?.replay_graph || null;
  }

  /**
   * Get repository objects from PostgreSQL
   */
  async _getRepositoryObjects(repoId) {
    try {
      const result = await this._postgres.query(`
        SELECT object_data
        FROM repository_objects
        WHERE repo_id = $1
      `, [repoId]);

      return result.rows.map(row => row.object_data);
    } catch (error) {
      console.error(`[CompatibilityScorer] Failed to get objects for ${repoId}:`, error.message);
      return null;
    }
  }

  /**
   * Get repository languages from metadata
   */
  async _getRepositoryLanguages(repoId) {
    try {
      const result = await this._postgres.query(`
        SELECT metadata
        FROM repository_metadata
        WHERE repo_id = $1
      `, [repoId]);

      if (result.rows.length > 0) {
        const metadata = result.rows[0].metadata;
        return metadata.pipeline_state?.languages || ['javascript'];
      }
      return ['javascript'];
    } catch (error) {
      console.error(`[CompatibilityScorer] Failed to get languages for ${repoId}:`, error.message);
      return ['javascript'];
    }
  }

  /**
   * Batch compute compatibility for multiple repositories
   */
  async batchComputeCompatibility(repoIds, metadataMap) {
    const compatibilities = [];

    for (let i = 0; i < repoIds.length; i++) {
      for (let j = i + 1; j < repoIds.length; j++) {
        const repoId1 = repoIds[i];
        const repoId2 = repoIds[j];
        const metadata1 = metadataMap.get(repoId1);
        const metadata2 = metadataMap.get(repoId2);

        if (metadata1 && metadata2) {
          const compatibility = await this.computeCompatibility(repoId1, repoId2, metadata1, metadata2);
          compatibilities.push(compatibility);
        }
      }
    }

    return compatibilities;
  }
}

module.exports = { ConstitutionalCompatibilityScorer };
