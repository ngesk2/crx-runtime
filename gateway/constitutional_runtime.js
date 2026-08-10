/**
 * Constitutional Runtime
 * 
 * Single orchestration service that owns the constitutional lifecycle execution.
 * 
 * Pipeline:
 * 1. GitHubSnapshot.fetchSnapshot()
 * 2. buildConstitutionalObjects()
 * 3. persist(Postgres)
 * 4. embed(EmbeddingAuthority)
 * 5. project(Qdrant)
 * 6. analyze(InferenceAuthority)
 * 7. reflect(ReflectionGenerator)
 * 8. mission(MissionGenerator)
 * 9. replay(ReplayRecorder)
 * 10. witness(WitnessRecorder)
 * 11. emit events
 * 12. return lifecycle report
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { GitHubSnapshot } = require('./github_snapshot');
const { EmbeddingAuthority } = require('./embedding_authority');
const { getInferenceAdapter } = require('../ping-runtime/ai/inference_adapter');
const { ReflectionGenerator } = require('./reflection_generator');
const { MissionGenerator } = require('./mission_generator');
const { ReplayAuthority } = require('./replay_authority');
const { WitnessRecorder } = require('./witness_recorder');
const { QdrantClient } = require('./qdrant_client');
const { LifecycleContext } = require('./lifecycle_context');
const { Stage, LifecycleStatus } = require('./stages');

class ConstitutionalRuntime {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._githubSnapshot = new GitHubSnapshot();
    this._embeddingAuthority = new EmbeddingAuthority();
    this._inferenceAdapter = getInferenceAdapter();
    this._reflectionGenerator = new ReflectionGenerator();
    this._missionGenerator = new MissionGenerator();
    this._replayAuthority = new ReplayAuthority({
      executionPort: null,
      persistencePort: null,
      verificationPort: null,
      transcriptPort: null
    });
    this._witnessRecorder = new WitnessRecorder();
    this._qdrantClient = new QdrantClient();
  }

  async run(options = {}) {
    /**
     * Execute complete constitutional lifecycle with transactional context.
     * 
     * Returns lifecycle report with all stages, objects, and status.
     */
    const lifecycleId = deterministicIdAuthority.generateIdFromObject({ repoId, repositoryPath });
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    const stages = [];
    
    // Create transactional context
    const context = new LifecycleContext(lifecycleId, this._postgres);

    try {
      // Initialize lifecycle checkpoint
      await this._initializeLifecycle(lifecycleId);

      // Begin transaction
      await context.beginTransaction();

      // Stage 1: GitHub Snapshot
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_GITHUB_SNAPSHOT);
      context.setCurrentStage(Stage.SNAPSHOT);
      const githubStage = await this._stageGitHubSnapshot(context);
      stages.push(githubStage);
      if (!githubStage.success) throw new Error('GitHub snapshot failed');
      context.markStageComplete(Stage.SNAPSHOT);

      // Stage 2: Build Constitutional Objects
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_BUILD_OBJECTS);
      context.setCurrentStage(Stage.BUILD_OBJECTS);
      const objectsStage = await this._stageBuildConstitutionalObjects(githubStage.data, context);
      stages.push(objectsStage);
      if (!objectsStage.success) throw new Error('Constitutional object creation failed');
      context.markStageComplete(Stage.BUILD_OBJECTS);

      // Stage 3: Persist to PostgreSQL (within transaction)
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_PERSIST);
      context.setCurrentStage(Stage.PERSIST);
      const persistStage = await this._stagePersist(context);
      stages.push(persistStage);
      if (!persistStage.success) throw new Error('Persistence failed');
      context.markStageComplete(Stage.PERSIST);

      // Stage 4: Embed and Project to Qdrant
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_EMBEDDING);
      context.setCurrentStage(Stage.EMBED);
      const embedStage = await this._stageEmbedAndProject(context);
      stages.push(embedStage);
      if (!embedStage.success) throw new Error('Embedding failed');
      context.markStageComplete(Stage.EMBED);

      // Stage 5: Analyze with InferenceAuthority
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_ANALYSIS);
      context.setCurrentStage(Stage.ANALYZE);
      const analyzeStage = await this._stageAnalyze(context);
      stages.push(analyzeStage);
      if (!analyzeStage.success) throw new Error('Analysis failed');
      context.markStageComplete(Stage.ANALYZE);

      // Stage 6: Generate Reflection
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_REFLECTION);
      context.setCurrentStage(Stage.REFLECT);
      const reflectStage = await this._stageReflect(context);
      stages.push(reflectStage);
      if (!reflectStage.success) throw new Error('Reflection failed');
      context.markStageComplete(Stage.REFLECT);

      // Stage 7: Generate Mission
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_MISSION);
      context.setCurrentStage(Stage.MISSION);
      const missionStage = await this._stageMission(context);
      stages.push(missionStage);
      if (!missionStage.success) throw new Error('Mission generation failed');
      context.markStageComplete(Stage.MISSION);

      // Stage 8: Record Replay
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_REPLAY);
      context.setCurrentStage(Stage.REPLAY);
      const replayStage = await this._stageRecordReplay(context);
      stages.push(replayStage);
      if (!replayStage.success) throw new Error('Replay recording failed');
      context.markStageComplete(Stage.REPLAY);

      // Stage 9: Record Witness
      await this._updateLifecycleStatus(lifecycleId, LifecycleStatus.PENDING_WITNESS);
      context.setCurrentStage(Stage.WITNESS);
      const witnessStage = await this._stageRecordWitness(context);
      stages.push(witnessStage);
      if (!witnessStage.success) throw new Error('Witness recording failed');
      context.markStageComplete(Stage.WITNESS);

      // Stage 10: Emit Events
      const eventStage = await this._stageEmitEvents(context);
      stages.push(eventStage);

      // Commit transaction (all stages succeeded)
      await context.commit();

      // Mark lifecycle as complete
      await this._completeLifecycle(lifecycleId);

      const duration = constitutionalTimeAuthority.nowAsMillis() - startTime;
      const success = stages.every(s => s.success);

      return {
        lifecycle_id: lifecycleId,
        success,
        duration_ms: duration,
        stages,
        context_summary: context.getSummary(),
        summary: {
          total_objects: context.objects.length,
          embeddings_generated: context.embeddings.length,
          vectors_created: context.vectors.length,
          reflections_created: context.reflections.length,
          missions_created: context.missions.length,
          replay_id: context.replay?.id,
          witness_id: context.witness?.id,
        },
      };
    } catch (error) {
      // Rollback transaction on failure
      await context.rollback();
      
      // Mark lifecycle as failed
      const { DeterministicFailureEnvelope, FailureCodes } = require('./deterministic_failure_envelope');
      const failureEnvelope = DeterministicFailureEnvelope.wrap(error, FailureCodes.RUNTIME_ERROR, 'LIFECYCLE');
      await this._failLifecycle(lifecycleId, failureEnvelope.getFailureCode());
      
      const duration = constitutionalTimeAuthority.nowAsMillis() - startTime;
      return {
        lifecycle_id: lifecycleId,
        success: false,
        duration_ms: duration,
        stages,
        context_summary: context.getSummary(),
        error: error.name,
      };
    }
  }

  async _initializeLifecycle(lifecycleId) {
    await this._postgres.query(`
      INSERT INTO lifecycles (id, status, current_stage, started_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET status = $2, current_stage = $3, started_at = NOW()
    `, [lifecycleId, LifecycleStatus.PENDING, LifecycleStatus.PENDING_GITHUB_SNAPSHOT]);
  }

  async _updateLifecycleStatus(lifecycleId, status) {
    await this._postgres.query(`
      UPDATE lifecycles SET status = $1, current_stage = $1, updated_at = NOW()
      WHERE id = $2
    `, [status, lifecycleId]);
  }

  async _completeLifecycle(lifecycleId) {
    await this._postgres.query(`
      UPDATE lifecycles SET status = $1, current_stage = $1, completed_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `, [LifecycleStatus.COMPLETE, lifecycleId]);
  }

  async _failLifecycle(lifecycleId, errorMessage) {
    await this._postgres.query(`
      UPDATE lifecycles SET status = $1, current_stage = $1, error_message = $2, updated_at = NOW()
      WHERE id = $3
    `, [LifecycleStatus.FAILED, errorMessage, lifecycleId]);
  }

  async _stageGitHubSnapshot(context) {
    const stageName = 'GitHubSnapshot';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const data = await this._githubSnapshot.fetchSnapshot();
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data,
        input_ids: [],
        output_ids: [],
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: [],
        output_ids: [],
      };
    }
  }

  async _stageBuildConstitutionalObjects(githubData, context) {
    const stageName = 'BuildConstitutionalObjects';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const objects = this._githubSnapshot.buildConstitutionalObjects(githubData, context.lifecycleId);
      objects.forEach(obj => context.addObject(obj));
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: objects,
        input_ids: [],
        output_ids: objects.map(o => o.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: [],
        output_ids: [],
      };
    }
  }

  async _stagePersist(context) {
    const stageName = 'PersistPostgres';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const client = await context.beginTransaction();
      for (const obj of context.objects) {
        await client.query(`
          INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
          VALUES ($1, $2, NOW(), $3, $4, $5)
          ON CONFLICT (event_id) DO UPDATE SET event_data = $5, timestamp = NOW()
        `, [obj.id, 'CONSTITUTIONAL_OBJECT_CREATED', obj.id, obj.kind, JSON.stringify(obj)]);
      }
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: context.objects,
        input_ids: context.objects.map(o => o.id),
        output_ids: context.objects.map(o => o.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: context.objects.map(o => o.id),
        output_ids: [],
      };
    }
  }

  async _stageEmbedAndProject(context) {
    const stageName = 'EmbedAndProject';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const embeddings = [];
      for (const obj of context.objects) {
        const text = JSON.stringify(obj.payload);
        const embedding = await this._embeddingAuthority.embed(text);
        if (embedding) {
          embeddings.push({
            id: obj.id,
            vector: embedding.vector,
            payload: obj,
          });
          context.addEmbedding(embedding);
          context.addVector(embedding.vector);
          // Project to Qdrant with full replay metadata
          await this._qdrantClient.upsert('constitutional_documents', [{
            id: obj.id,
            vector: embedding.vector,
            payload: {
              id: obj.id,
              kind: obj.kind,
              authority: obj.authority,
              canonical_hash: obj.canonical_hash,
              relationships: obj.relationships,
              payload: obj.payload,
              metadata: obj.metadata,
              lifecycle_id: context.lifecycleId,
              stage: context.currentStage,
              created_at: obj.identity.created_at,
              version: obj.metadata.schema_version,
              authority: obj.authority,
              confidence: obj.confidence,
              health: obj.health,
            },
          }]);
        }
      }
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: { count: embeddings.length, embeddings },
        input_ids: context.objects.map(o => o.id),
        output_ids: embeddings.map(e => e.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: context.objects.map(o => o.id),
        output_ids: [],
      };
    }
  }

  async _stageAnalyze(context) {
    const stageName = 'Analyze';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const analyses = [];
      for (const obj of context.objects.slice(0, 3)) { // Limit to first 3 for efficiency
        const analysis = await this._inferenceAdapter.analyze([obj], 'Analyze this constitutional object');
        if (analysis) {
          analyses.push(analysis);
        }
      }
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: analyses,
        input_ids: context.objects.slice(0, 3).map(o => o.id),
        output_ids: analyses.map(a => a.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: context.objects.map(o => o.id),
        output_ids: [],
      };
    }
  }

  async _stageReflect(context) {
    const stageName = 'Reflect';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const reflections = [];
      for (const obj of context.objects.slice(0, 1)) { // Limit to first object
        const reflection = await this._reflectionGenerator.generate([obj], [], 'Generate understanding');
        if (reflection) {
          reflections.push(reflection);
          context.addReflection(reflection);
        }
      }
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: reflections,
        input_ids: context.objects.slice(0, 1).map(o => o.id),
        output_ids: reflections.map(r => r.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: context.objects.map(o => o.id),
        output_ids: [],
      };
    }
  }

  async _stageMission(context) {
    const stageName = 'Mission';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const missions = [];
      for (const reflection of context.reflections) {
        const mission = await this._missionGenerator.generate([reflection]);
        if (mission) {
          missions.push(mission);
          context.addMission(mission);
        }
      }
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: missions,
        input_ids: context.reflections.map(r => r.id),
        output_ids: missions.map(m => m.id),
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: context.reflections.map(r => r.id),
        output_ids: [],
      };
    }
  }

  async _stageRecordReplay(context) {
    const stageName = 'Replay';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const replayObject = await this._replayAuthority.record(context.lifecycleId, []);
      context.setReplay(replayObject);
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: replayObject,
        input_ids: [],
        output_ids: [replayObject.id],
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: [],
        output_ids: [],
      };
    }
  }

  async _stageRecordWitness(context) {
    const stageName = 'Witness';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      const witnessObject = await this._witnessRecorder.record(context.replay);
      context.setWitness(witnessObject);
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: witnessObject,
        input_ids: [context.replay.id],
        output_ids: [witnessObject.id],
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: [context.replay?.id],
        output_ids: [],
      };
    }
  }

  async _stageEmitEvents(context) {
    const stageName = 'EmitEvents';
    const startTime = constitutionalTimeAuthority.nowAsMillis();
    try {
      // Event emission would go here
      return {
        stage_name: stageName,
        success: true,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        data: {},
        input_ids: [],
        output_ids: [],
      };
    } catch (error) {
      return {
        stage_name: stageName,
        success: false,
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
        error: error.name,
        input_ids: [],
        output_ids: [],
      };
    }
  }
}

module.exports = { ConstitutionalRuntime };
