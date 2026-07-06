/**
 * Lifecycle Stage Enum
 * 
 * Formalized stage names to avoid typo bugs and enable type safety.
 */

const Stage = {
  SNAPSHOT: 'GitHubSnapshot',
  BUILD_OBJECTS: 'BuildConstitutionalObjects',
  PERSIST: 'PersistPostgres',
  EMBED: 'EmbedAndProject',
  ANALYZE: 'Analyze',
  REFLECT: 'Reflect',
  MISSION: 'Mission',
  REPLAY: 'Replay',
  WITNESS: 'Witness',
  EMIT_EVENTS: 'EmitEvents',
};

const LifecycleStatus = {
  PENDING: 'pending',
  PENDING_GITHUB_SNAPSHOT: 'pending_github_snapshot',
  PENDING_BUILD_OBJECTS: 'pending_build_objects',
  PENDING_PERSIST: 'pending_persist',
  PENDING_EMBEDDING: 'pending_embedding',
  PENDING_ANALYSIS: 'pending_analysis',
  PENDING_REFLECTION: 'pending_reflection',
  PENDING_MISSION: 'pending_mission',
  PENDING_REPLAY: 'pending_replay',
  PENDING_WITNESS: 'pending_witness',
  COMPLETE: 'complete',
  FAILED: 'failed',
};

module.exports = { Stage, LifecycleStatus };
