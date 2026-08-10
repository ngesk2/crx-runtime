/**
 * Reflection Generator
 * 
 * Generates ReflectionObjects from KnowledgeObjects and AnalysisObjects.
 * 
 * Constitutional Constraint: Reflection represents understanding, not execution.
 * Constitutional Constraint: Reflection references KnowledgeObjects, Evidence, Analysis, Repository.
 * Constitutional Constraint: Reflection is replayable.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ReflectionGenerator {
  constructor() {
    this._namespace = 'reflection';
  }

  async generate(knowledgeObjects, analysisObjects, prompt) {
    /**
     * Generate ReflectionObject from KnowledgeObjects and AnalysisObjects.
     * 
     * Constitutional Constraint: Reflection represents understanding, not execution.
     * Constitutional Constraint: Reflection references KnowledgeObjects, Evidence, Analysis, Repository.
     * Constitutional Constraint: Reflection is replayable.
     */
    if (!Array.isArray(knowledgeObjects) || knowledgeObjects.length === 0) {
      throw new Error('ReflectionGenerator.generate requires at least one KnowledgeObject');
    }

    // Validate inputs
    for (const obj of knowledgeObjects) {
      if (!obj.id || !obj.kind || !obj.payload) {
        throw new Error('Invalid KnowledgeObject: missing id, kind, or payload');
      }
    }

    if (analysisObjects) {
      for (const obj of analysisObjects) {
        if (!obj.id || !obj.kind || !obj.payload) {
          throw new Error('Invalid AnalysisObject: missing id, kind, or payload');
        }
      }
    }

    // Build understanding from KnowledgeObjects and AnalysisObjects
    const understanding = this._buildUnderstanding(knowledgeObjects, analysisObjects, prompt);
    const rationale = this._buildRationale(knowledgeObjects, analysisObjects, prompt);
    const confidence = this._calculateConfidence(knowledgeObjects, analysisObjects);

    // Create ReflectionObject
    const reflectionId = deterministicIdAuthority.generateIdFromObject({
      namespace: this._namespace,
      subject_id: knowledgeObjects[0].id,
      understanding
    });
    const timestamp = constitutionalTimeAuthority.now();
    const subjectId = knowledgeObjects[0].id;
    const subjectKind = knowledgeObjects[0].kind;

    const reflectionObject = {
      id: reflectionId,
      kind: 'Reflection',
      authority: 'ReflectionAuthority',
      identity: {
        namespace: this._namespace,
        version: 'v1',
        created_at: timestamp,
        created_by: 'ReflectionGenerator',
      },
      canonical_hash: CanonicalAuthority.hash(understanding),
      lineage: {
        source_id: subjectId,
        derivation_path: ['KnowledgeObject', 'AnalysisObject', 'ReflectionObject'],
        provenance_chain: knowledgeObjects.map(obj => obj.id).concat(analysisObjects ? analysisObjects.map(obj => obj.id) : []),
      },
      health: 'healthy',
      confidence,
      relationships: [
        ...knowledgeObjects.map(obj => ({
          target_id: obj.id,
          relation_type: 'reflects_on',
          strength: 1.0,
          metadata: {},
        })),
        ...(analysisObjects ? analysisObjects.map(obj => ({
          target_id: obj.id,
          relation_type: 'incorporates_analysis',
          strength: 0.8,
          metadata: {},
        })) : []),
      ],
      metadata: {
        subject_id: subjectId,
        subject_kind: subjectKind,
        timestamp,
      },
      payload: {
        subject_id: subjectId,
        subject_kind: subjectKind,
        understanding,
        confidence,
        rationale,
        evidence_references: knowledgeObjects.map(obj => obj.id),
        analysis_references: analysisObjects ? analysisObjects.map(obj => obj.id) : [],
        timestamp,
      },
    };

    return reflectionObject;
  }

  _buildUnderstanding(knowledgeObjects, analysisObjects, prompt) {
    /**
     * Build understanding from KnowledgeObjects and AnalysisObjects.
     * 
     * Understanding is a structured representation of what the system knows
     * about the subject matter.
     */
    const understanding = {
      subject: {
        id: knowledgeObjects[0].id,
        kind: knowledgeObjects[0].kind,
        summary: this._summarizeObject(knowledgeObjects[0]),
      },
      context: knowledgeObjects.slice(1).map(obj => ({
        id: obj.id,
        kind: obj.kind,
        summary: this._summarizeObject(obj),
      })),
      analysis: analysisObjects ? analysisObjects.map(obj => ({
        id: obj.id,
        model: obj.payload.model,
        confidence: obj.payload.confidence,
        summary: this._summarizeAnalysis(obj),
      })) : [],
      prompt,
    };

    return understanding;
  }

  _buildRationale(knowledgeObjects, analysisObjects, prompt) {
    /**
     * Build rationale for the reflection.
     * 
     * Rationale explains why the reflection was generated and what it means.
     */
    const rationale = {
      purpose: prompt || 'Generate understanding of subject',
      evidence_count: knowledgeObjects.length,
      analysis_count: analysisObjects ? analysisObjects.length : 0,
      primary_subject: knowledgeObjects[0].kind,
      reasoning: `Reflection generated based on ${knowledgeObjects.length} knowledge objects${analysisObjects ? ` and ${analysisObjects.length} analysis objects` : ''}. Understanding synthesized from constitutional evidence.`,
    };

    return rationale;
  }

  _calculateConfidence(knowledgeObjects, analysisObjects) {
    /**
     * Calculate confidence for the reflection.
     * 
     * Confidence is based on:
     * - Number of knowledge objects
     * - Number of analysis objects
     * - Confidence of analysis objects
     */
    let confidence = 0.5;

    // Base confidence from knowledge objects
    confidence += Math.min(knowledgeObjects.length * 0.05, 0.3);

    // Boost from analysis objects
    if (analysisObjects && analysisObjects.length > 0) {
      const avgAnalysisConfidence = analysisObjects.reduce((sum, obj) => sum + (obj.payload.confidence || 0.5), 0) / analysisObjects.length;
      confidence += avgAnalysisConfidence * 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  _summarizeObject(obj) {
    /**
     * Summarize a KnowledgeObject for understanding.
     */
    switch (obj.kind) {
      case 'Repository':
        return `Repository: ${obj.payload.full_name} (${obj.payload.language})`;
      case 'Commit':
        return `Commit: ${obj.payload.sha.substring(0, 7)} - ${obj.payload.message.substring(0, 50)}`;
      case 'Issue':
        return `Issue #${obj.payload.number}: ${obj.payload.title}`;
      case 'PullRequest':
        return `PR #${obj.payload.number}: ${obj.payload.title}`;
      default:
        return `${obj.kind}: ${obj.id}`;
    }
  }

  _summarizeAnalysis(obj) {
    /**
     * Summarize an AnalysisObject for understanding.
     */
    return `Analysis by ${obj.payload.model}: ${obj.payload.result ? 'completed' : 'failed'}`;
  }
}

module.exports = { ReflectionGenerator };
