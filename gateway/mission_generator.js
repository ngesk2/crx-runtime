/**
 * Mission Generator
 * 
 * Generates MissionObjects from ReflectionObjects.
 * 
 * Constitutional Constraint: Every mission includes priority, confidence, rationale, originating reflections, originating evidence, replay safety, witness requirements.
 * Constitutional Constraint: Planner consumes MissionObjects only.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class MissionGenerator {
  constructor() {
    this._namespace = 'mission';
  }

  async generate(reflectionObjects, options = {}) {
    /**
     * Generate MissionObject from ReflectionObjects.
     * 
     * Constitutional Constraint: Every mission includes priority, confidence, rationale, originating reflections, originating evidence, replay safety, witness requirements.
     * Constitutional Constraint: Planner consumes MissionObjects only.
     */
    if (!Array.isArray(reflectionObjects) || reflectionObjects.length === 0) {
      throw new Error('MissionGenerator.generate requires at least one ReflectionObject');
    }

    // Validate inputs
    for (const obj of reflectionObjects) {
      if (!obj.id || !obj.kind || !obj.payload) {
        throw new Error('Invalid ReflectionObject: missing id, kind, or payload');
      }
    }

    // Determine mission priority based on reflection content
    const priority = this._determinePriority(reflectionObjects, options);
    const confidence = this._calculateConfidence(reflectionObjects);
    const rationale = this._buildRationale(reflectionObjects);
    const replaySafety = this._assessReplaySafety(reflectionObjects);
    const witnessRequirements = this._determineWitnessRequirements(reflectionObjects);

    // Create MissionObject
    const missionId = deterministicIdAuthority.generateIdFromObject({
      namespace: this._namespace,
      rationale,
      reflection_ids: reflectionObjects.map(obj => obj.id)
    });
    const timestamp = constitutionalTimeAuthority.now();

    const missionObject = {
      id: missionId,
      kind: 'Mission',
      authority: 'MissionAuthority',
      identity: {
        namespace: this._namespace,
        version: 'v1',
        created_at: timestamp,
        created_by: 'MissionGenerator',
      },
      canonical_hash: CanonicalAuthority.hash(rationale),
      lineage: {
        source_id: reflectionObjects[0].id,
        derivation_path: ['ReflectionObject', 'MissionObject'],
        provenance_chain: reflectionObjects.map(obj => obj.id),
      },
      health: 'healthy',
      confidence,
      relationships: reflectionObjects.map(obj => ({
        target_id: obj.id,
        relation_type: 'originated_from',
        strength: 1.0,
        metadata: {},
      })),
      metadata: {
        priority,
        timestamp,
      },
      payload: {
        priority,
        confidence,
        rationale,
        originating_reflections: reflectionObjects.map(obj => obj.id),
        originating_evidence: this._extractEvidenceReferences(reflectionObjects),
        replay_safety: replaySafety,
        witness_requirements: witnessRequirements,
        status: 'pending',
        created_at: timestamp,
        updated_at: timestamp,
      },
    };

    return missionObject;
  }

  _determinePriority(reflectionObjects, options) {
    /**
     * Determine mission priority based on reflection content.
     * 
     * Priority levels: critical, high, medium, low
     */
    // Allow manual override
    if (options.priority) {
      return options.priority;
    }

    // Analyze reflection content for priority indicators
    const hasCriticalKeywords = reflectionObjects.some(obj => {
      const understanding = CanonicalBytes.serializeString(obj.payload.understanding || {});
      const rationale = CanonicalBytes.serializeString(obj.payload.rationale || {});
      const combined = understanding + rationale;
      return combined.toLowerCase().includes('critical') ||
             combined.toLowerCase().includes('urgent') ||
             combined.toLowerCase().includes('security') ||
             combined.toLowerCase().includes('vulnerability');
    });

    const hasHighKeywords = reflectionObjects.some(obj => {
      const understanding = CanonicalBytes.serializeString(obj.payload.understanding || {});
      const rationale = CanonicalBytes.serializeString(obj.payload.rationale || {});
      const combined = understanding + rationale;
      return combined.toLowerCase().includes('important') ||
             combined.toLowerCase().includes('priority') ||
             combined.toLowerCase().includes('blocker');
    });

    const avgConfidence = reflectionObjects.reduce((sum, obj) => sum + (obj.payload.confidence || 0.5), 0) / reflectionObjects.length;

    if (hasCriticalKeywords) return 'critical';
    if (hasHighKeywords) return 'high';
    if (avgConfidence > 0.7) return 'high';
    if (avgConfidence > 0.5) return 'medium';
    return 'low';
  }

  _calculateConfidence(reflectionObjects) {
    /**
     * Calculate confidence for the mission.
     * 
     * Confidence is based on:
     * - Average confidence of originating reflections
     * - Number of reflections
     * - Evidence count
     */
    const avgReflectionConfidence = reflectionObjects.reduce((sum, obj) => sum + (obj.payload.confidence || 0.5), 0) / reflectionObjects.length;
    const evidenceCount = reflectionObjects.reduce((sum, obj) => sum + (obj.payload.evidence_references || []).length, 0);
    
    let confidence = avgReflectionConfidence;
    confidence += Math.min(evidenceCount * 0.02, 0.2);
    confidence += Math.min(reflectionObjects.length * 0.05, 0.15);

    return Math.min(confidence, 1.0);
  }

  _buildRationale(reflectionObjects) {
    /**
     * Build rationale for the mission.
     * 
     * Rationale explains why the mission was generated and what it should accomplish.
     */
    const primaryReflection = reflectionObjects[0];
    const subject = primaryReflection.payload.subject_kind;
    const subjectId = primaryReflection.payload.subject_id;

    const rationale = {
      purpose: `Execute mission based on reflection on ${subject} (${subjectId})`,
      reflection_count: reflectionObjects.length,
      primary_subject: subject,
      reasoning: `Mission generated from ${reflectionObjects.length} reflection(s). The reflections indicate actionable understanding that should be executed through the constitutional lifecycle.`,
      originating_summary: reflectionObjects.map(obj => ({
        id: obj.id,
        subject: obj.payload.subject_kind,
        confidence: obj.payload.confidence,
        summary: obj.payload.understanding?.subject?.summary || 'No summary',
      })),
    };

    return rationale;
  }

  _extractEvidenceReferences(reflectionObjects) {
    /**
     * Extract all evidence references from reflection objects.
     */
    const evidenceSet = new Set();
    for (const obj of reflectionObjects) {
      for (const ref of (obj.payload.evidence_references || [])) {
        evidenceSet.add(ref);
      }
    }
    return Array.from(evidenceSet);
  }

  _assessReplaySafety(reflectionObjects) {
    /**
     * Assess whether the mission is replay-safe.
     * 
     * Replay safety is based on:
     * - All reflections have canonical hashes
     * - All evidence references are traceable
     * - No external dependencies that could change
     */
    const allHaveCanonicalHash = reflectionObjects.every(obj => obj.canonical_hash);
    const allHaveEvidence = reflectionObjects.every(obj => (obj.payload.evidence_references || []).length > 0);

    return allHaveCanonicalHash && allHaveEvidence;
  }

  _determineWitnessRequirements(reflectionObjects) {
    /**
     * Determine witness requirements for the mission.
     * 
     * Witness requirements specify what must be certified for the mission to be valid.
     */
    const requirements = [];

    // Always require evidence witness
    requirements.push('evidence_witness');

    // Require reflection witness if confidence is high
    const avgConfidence = reflectionObjects.reduce((sum, obj) => sum + (obj.payload.confidence || 0.5), 0) / reflectionObjects.length;
    if (avgConfidence > 0.7) {
      requirements.push('reflection_witness');
    }

    // Require analysis witness if analysis references exist
    const hasAnalysisReferences = reflectionObjects.some(obj => (obj.payload.analysis_references || []).length > 0);
    if (hasAnalysisReferences) {
      requirements.push('analysis_witness');
    }

    return requirements;
  }
}

module.exports = { MissionGenerator };
