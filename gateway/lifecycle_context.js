/**
 * LifecycleContext
 * 
 * Transactional context for constitutional lifecycle execution.
 * 
 * Ensures atomicity: either all stages commit or none do.
 * Enables rollback from failed stages.
 * Provides idempotency through context tracking.
 */

const crypto = require('crypto');

class LifecycleContext {
  constructor(lifecycleId, postgresPool) {
    this.lifecycleId = lifecycleId;
    this._postgres = postgresPool;
    this._transaction = null;
    
    // Context state
    this.objects = [];
    this.embeddings = [];
    this.vectors = [];
    this.reflections = [];
    this.missions = [];
    this.replay = null;
    this.witness = null;
    
    // Stage tracking
    this.completedStages = new Set();
    this.currentStage = null;
    
    // Transaction state
    this.isCommitted = false;
    this.isRolledBack = false;
  }

  async beginTransaction() {
    if (this._transaction) return this._transaction;
    
    this._transaction = await this._postgres.connect();
    await this._transaction.query('BEGIN');
    return this._transaction;
  }

  async commit() {
    if (!this._transaction || this.isCommitted) return;
    
    await this._transaction.query('COMMIT');
    this._transaction.release();
    this.isCommitted = true;
  }

  async rollback() {
    if (!this._transaction || this.isRolledBack) return;
    
    await this._transaction.query('ROLLBACK');
    this._transaction.release();
    this.isRolledBack = true;
  }

  addObject(obj) {
    this.objects.push(obj);
  }

  addEmbedding(embedding) {
    this.embeddings.push(embedding);
  }

  addVector(vector) {
    this.vectors.push(vector);
  }

  addReflection(reflection) {
    this.reflections.push(reflection);
  }

  addMission(mission) {
    this.missions.push(mission);
  }

  setReplay(replay) {
    this.replay = replay;
  }

  setWitness(witness) {
    this.witness = witness;
  }

  markStageComplete(stageName) {
    this.completedStages.add(stageName);
    this.currentStage = null;
  }

  setCurrentStage(stageName) {
    this.currentStage = stageName;
  }

  isStageComplete(stageName) {
    return this.completedStages.has(stageName);
  }

  getSummary() {
    return {
      lifecycle_id: this.lifecycleId,
      current_stage: this.currentStage,
      completed_stages: Array.from(this.completedStages),
      object_count: this.objects.length,
      embedding_count: this.embeddings.length,
      vector_count: this.vectors.length,
      reflection_count: this.reflections.length,
      mission_count: this.missions.length,
      has_replay: !!this.replay,
      has_witness: !!this.witness,
      is_committed: this.isCommitted,
      is_rolled_back: this.isRolledBack,
    };
  }
}

module.exports = { LifecycleContext };
