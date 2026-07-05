/**
 * Prompt Objects
 * 
 * Milestone 7 — Prompt Runtime
 * 
 * Constitutional Constraint: Introduce Prompt Object.
 * 
 * Pipeline:
 * Knowledge
 *       ↓
 * Mission Context
 *       ↓
 * Prompt Object
 *       ↓
 * CanonicalBytes
 *       ↓
 * Prompt Hash
 *       ↓
 * Identity
 *       ↓
 * Witness
 *       ↓
 * Certificate
 * 
 * Prompt evolution now becomes replayable.
 */

const { CanonicalBytes, CanonicalAuthority } = require('./canonical_authority');
const { identityAuthority } = require('./identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { constitutionalVerificationAuthority } = require('./constitutional_verification_authority');

/**
 * Prompt Object
 * 
 * Constitutional representation of a prompt
 */
class PromptObject {
  constructor(missionContext, knowledgeGraphId, template, variables) {
    this._missionContext = missionContext;
    this._knowledgeGraphId = knowledgeGraphId;
    this._template = template;
    this._variables = variables;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional prompt object
   * @returns {Object} Constitutional prompt object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Generate prompt text from template and variables
    const promptText = this._renderPrompt(this._template, this._variables);

    // Extract canonical fields
    const canonicalData = {
      mission_context: this._missionContext,
      knowledge_graph_id: this._knowledgeGraphId,
      template: this._template,
      variables: this._variables,
      prompt_text: promptText,
      prompt_type: this._determinePromptType(this._template),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'Prompt');

    // Build lineage
    this._lineage = {
      source_id: this._knowledgeGraphId,
      derivation_path: ['KnowledgeGraph', 'MissionContext', 'Prompt'],
      provenance_chain: [this._knowledgeGraphId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'Prompt',
      authority: 'PromptRuntime',
      identity: {
        namespace: 'prompt',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PromptRuntime',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._knowledgeGraphId,
          relation_type: 'derived_from',
          strength: 1.0,
          metadata: { kind: 'knowledgegraph' },
        },
      ],
      metadata: {
        knowledge_graph_id: this._knowledgeGraphId,
        prompt_type: canonicalData.prompt_type,
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

  /**
   * Render prompt from template and variables
   * @param {string} template - Prompt template
   * @param {Object} variables - Template variables
   * @returns {string} Rendered prompt
   */
  _renderPrompt(template, variables) {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(`{{${key}}}`, value);
    }
    
    return rendered;
  }

  /**
   * Determine prompt type from template
   * @param {string} template - Prompt template
   * @returns {string} Prompt type
   */
  _determinePromptType(template) {
    const lowerTemplate = template.toLowerCase();
    
    if (lowerTemplate.includes('analyze') || lowerTemplate.includes('analysis')) {
      return 'analysis';
    } else if (lowerTemplate.includes('summarize') || lowerTemplate.includes('summary')) {
      return 'summary';
    } else if (lowerTemplate.includes('generate') || lowerTemplate.includes('generation')) {
      return 'generation';
    } else if (lowerTemplate.includes('question') || lowerTemplate.includes('query')) {
      return 'question';
    } else if (lowerTemplate.includes('explain') || lowerTemplate.includes('explanation')) {
      return 'explanation';
    } else {
      return 'general';
    }
  }
}

/**
 * Reflection Object
 * 
 * Constitutional representation of an LLM reflection/response
 */
class ReflectionObject {
  constructor(promptId, llmResponse, llmModel, llmParameters) {
    this._promptId = promptId;
    this._llmResponse = llmResponse;
    this._llmModel = llmModel;
    this._llmParameters = llmParameters;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build constitutional reflection object
   * @returns {Object} Constitutional reflection object
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      prompt_id: this._promptId,
      llm_model: this._llmModel,
      llm_parameters: this._llmParameters,
      response_text: this._llmResponse,
      response_type: this._determineResponseType(this._llmResponse),
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'Reflection');

    // Build lineage
    this._lineage = {
      source_id: this._promptId,
      derivation_path: ['Prompt', 'Reflection'],
      provenance_chain: [this._promptId],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'Reflection',
      authority: 'PromptRuntime',
      identity: {
        namespace: 'reflection',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PromptRuntime',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._promptId,
          relation_type: 'response_to',
          strength: 1.0,
          metadata: { kind: 'prompt' },
        },
      ],
      metadata: {
        prompt_id: this._promptId,
        llm_model: this._llmModel,
        response_type: canonicalData.response_type,
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

  /**
   * Determine response type from LLM response
   * @param {string} response - LLM response
   * @returns {string} Response type
   */
  _determineResponseType(response) {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('```') && (lowerResponse.includes('javascript') || lowerResponse.includes('js'))) {
      return 'code';
    } else if (lowerResponse.includes('```')) {
      return 'code';
    } else if (lowerResponse.includes('json') || response.trim().startsWith('{')) {
      return 'json';
    } else if (lowerResponse.includes('error') || lowerResponse.includes('failed')) {
      return 'error';
    } else if (lowerResponse.split('\n').length > 5) {
      return 'long_text';
    } else {
      return 'short_text';
    }
  }
}

module.exports = {
  PromptObject,
  ReflectionObject,
};
