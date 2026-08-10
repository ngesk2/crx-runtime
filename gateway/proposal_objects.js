/**
 * Proposal Objects
 * 
 * Ω.86.A — Constitutional Autonomous Analysis Runtime
 * 
 * Constitutional proposal objects produced by Ollama workers.
 * 
 * Every worker output becomes a constitutional proposal object.
 * 
 * Proposal types:
 * - ArchitectureSuggestion
 * - RepositorySuggestion
 * - MissionSuggestion
 * - PerformanceSuggestion
 * - SecuritySuggestion
 * - DependencySuggestion
 * - TestSuggestion
 * - DocumentationSuggestion
 * - ReplaySuggestion
 * - PatternSuggestion
 * - IntegrationSuggestion
 * 
 * Each proposal includes:
 * - proposal_id
 * - source_object_id
 * - worker_type
 * - prompt_hash
 * - model_name
 * - response
 * - confidence
 * - lineage
 * - authority = OllamaWorker
 * 
 * Constitutional Constraint: No hashes generated here. No witness generation.
 * These are proposals that must pass through admission before becoming constitutional.
 */

const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ProposalObject {
  constructor(data) {
    this.proposal_id = data.proposal_id || identityAuthority.generateId('proposal', { type: 'proposal' });
    this.source_object_id = data.source_object_id;
    this.worker_type = data.worker_type;
    this.prompt_hash = data.prompt_hash;
    this.model_name = data.model_name;
    this.response = data.response;
    this.confidence = data.confidence || 0.5;
    this.lineage = data.lineage || [];
    this.authority = 'OllamaWorker';
    this.created_at = constitutionalTimeAuthority.now();
    this.metadata = data.metadata || {};
  }

  toJSON() {
    return {
      proposal_id: this.proposal_id,
      source_object_id: this.source_object_id,
      worker_type: this.worker_type,
      prompt_hash: this.prompt_hash,
      model_name: this.model_name,
      response: this.response,
      confidence: this.confidence,
      lineage: this.lineage,
      authority: this.authority,
      created_at: this.created_at,
      metadata: this.metadata,
    };
  }
}

class ArchitectureSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'ArchitectureSuggestion';
    this.suggestion_type = data.suggestion_type || 'general';
    this.target_component = data.target_component;
    this.current_architecture = data.current_architecture;
    this.proposed_architecture = data.proposed_architecture;
    this.rationale = data.rationale;
    this.impact_analysis = data.impact_analysis;
    this.migration_path = data.migration_path;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      suggestion_type: this.suggestion_type,
      target_component: this.target_component,
      current_architecture: this.current_architecture,
      proposed_architecture: this.proposed_architecture,
      rationale: this.rationale,
      impact_analysis: this.impact_analysis,
      migration_path: this.migration_path,
    };
  }
}

class RepositorySuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'RepositorySuggestion';
    this.suggestion_type = data.suggestion_type || 'general';
    this.target_repository = data.target_repository;
    this.current_state = data.current_state;
    this.proposed_changes = data.proposed_changes;
    this.rationale = data.rationale;
    this.priority = data.priority || 'medium';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      suggestion_type: this.suggestion_type,
      target_repository: this.target_repository,
      current_state: this.current_state,
      proposed_changes: this.proposed_changes,
      rationale: this.rationale,
      priority: this.priority,
    };
  }
}

class MissionSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'MissionSuggestion';
    this.mission_type = data.mission_type || 'general';
    this.target_scope = data.target_scope;
    this.objectives = data.objectives;
    this.success_criteria = data.success_criteria;
    this.estimated_effort = data.estimated_effort;
    this.dependencies = data.dependencies || [];
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      mission_type: this.mission_type,
      target_scope: this.target_scope,
      objectives: this.objectives,
      success_criteria: this.success_criteria,
      estimated_effort: this.estimated_effort,
      dependencies: this.dependencies,
    };
  }
}

class PerformanceSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'PerformanceSuggestion';
    this.performance_area = data.performance_area;
    this.current_metrics = data.current_metrics;
    this.target_metrics = data.target_metrics;
    this.optimization_strategy = data.optimization_strategy;
    this.estimated_improvement = data.estimated_improvement;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      performance_area: this.performance_area,
      current_metrics: this.current_metrics,
      target_metrics: this.target_metrics,
      optimization_strategy: this.optimization_strategy,
      estimated_improvement: this.estimated_improvement,
    };
  }
}

class SecuritySuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'SecuritySuggestion';
    this.vulnerability_type = data.vulnerability_type;
    this.severity = data.severity || 'medium';
    this.affected_components = data.affected_components;
    this.current_state = data.current_state;
    this.proposed_fix = data.proposed_fix;
    this.security_impact = data.security_impact;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      vulnerability_type: this.vulnerability_type,
      severity: this.severity,
      affected_components: this.affected_components,
      current_state: this.current_state,
      proposed_fix: this.proposed_fix,
      security_impact: this.security_impact,
    };
  }
}

class DependencySuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'DependencySuggestion';
    this.dependency_type = data.dependency_type;
    this.current_dependency = data.current_dependency;
    this.proposed_dependency = data.proposed_dependency;
    this.rationale = data.rationale;
    this.compatibility_notes = data.compatibility_notes;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      dependency_type: this.dependency_type,
      current_dependency: this.current_dependency,
      proposed_dependency: this.proposed_dependency,
      rationale: this.rationale,
      compatibility_notes: this.compatibility_notes,
    };
  }
}

class TestSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'TestSuggestion';
    this.test_type = data.test_type;
    this.target_functionality = data.target_functionality;
    this.test_scenario = data.test_scenario;
    this.expected_behavior = data.expected_behavior;
    this.test_implementation = data.test_implementation;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      test_type: this.test_type,
      target_functionality: this.target_functionality,
      test_scenario: this.test_scenario,
      expected_behavior: this.expected_behavior,
      test_implementation: this.test_implementation,
    };
  }
}

class DocumentationSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'DocumentationSuggestion';
    this.documentation_type = data.documentation_type;
    this.target_component = data.target_component;
    this.current_documentation = data.current_documentation;
    this.proposed_documentation = data.proposed_documentation;
    this.audience = data.audience;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      documentation_type: this.documentation_type,
      target_component: this.target_component,
      current_documentation: this.current_documentation,
      proposed_documentation: this.proposed_documentation,
      audience: this.audience,
    };
  }
}

class ReplaySuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'ReplaySuggestion';
    this.replay_type = data.replay_type;
    this.target_lifecycle = data.target_lifecycle;
    this.current_replay_behavior = data.current_replay_behavior;
    this.proposed_replay_behavior = data.proposed_replay_behavior;
    this.determinism_impact = data.determinism_impact;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      replay_type: this.replay_type,
      target_lifecycle: this.target_lifecycle,
      current_replay_behavior: this.current_replay_behavior,
      proposed_replay_behavior: this.proposed_replay_behavior,
      determinism_impact: this.determinism_impact,
    };
  }
}

class PatternSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'PatternSuggestion';
    this.pattern_name = data.pattern_name;
    this.pattern_category = data.pattern_category;
    this.current_implementation = data.current_implementation;
    this.proposed_implementation = data.proposed_implementation;
    this.benefits = data.benefits;
    this.tradeoffs = data.tradeoffs;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      pattern_name: this.pattern_name,
      pattern_category: this.pattern_category,
      current_implementation: this.current_implementation,
      proposed_implementation: this.proposed_implementation,
      benefits: this.benefits,
      tradeoffs: this.tradeoffs,
    };
  }
}

class IntegrationSuggestion extends ProposalObject {
  constructor(data) {
    super(data);
    this.kind = 'IntegrationSuggestion';
    this.integration_type = data.integration_type;
    this.target_systems = data.target_systems;
    this.current_integration = data.current_integration;
    this.proposed_integration = data.proposed_integration;
    this.integration_complexity = data.integration_complexity;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      integration_type: this.integration_type,
      target_systems: this.target_systems,
      current_integration: this.current_integration,
      proposed_integration: this.proposed_integration,
      integration_complexity: this.integration_complexity,
    };
  }
}

module.exports = {
  ProposalObject,
  ArchitectureSuggestion,
  RepositorySuggestion,
  MissionSuggestion,
  PerformanceSuggestion,
  SecuritySuggestion,
  DependencySuggestion,
  TestSuggestion,
  DocumentationSuggestion,
  ReplaySuggestion,
  PatternSuggestion,
  IntegrationSuggestion,
};
