/**
 * Stage Registry
 * 
 * Central registry for all lifecycle stages.
 * 
 * Each stage implements:
 * - execute(context) - Run the stage
 * - rollback(context) - Undo the stage
 * - resume(context) - Resume from checkpoint
 * - validate(context) - Validate inputs
 * - verify(context) - Verify outputs
 * 
 * Runtime becomes:
 * for (stage of registry) {
 *   await stage.execute(context)
 * }
 * 
 * Enables:
 * - Parallel stages
 * - Dynamic stages
 * - Plugin stages
 */

const { Stage } = require('./stages');

class LifecycleStage {
  constructor(name, dependencies = []) {
    this.name = name;
    this.dependencies = dependencies;
  }

  async execute(context) {
    throw new Error(`execute() not implemented for stage: ${this.name}`);
  }

  async rollback(context) {
    throw new Error(`rollback() not implemented for stage: ${this.name}`);
  }

  async resume(context) {
    throw new Error(`resume() not implemented for stage: ${this.name}`);
  }

  async validate(context) {
    // Default validation: check context exists
    if (!context) {
      throw new Error(`Context is required for stage: ${this.name}`);
    }
    return true;
  }

  async verify(context) {
    // Default verification: check stage completed
    return context.isStageComplete(this.name);
  }
}

class GitHubSnapshotStage extends LifecycleStage {
  constructor(githubSnapshot) {
    super(Stage.SNAPSHOT);
    this._githubSnapshot = githubSnapshot;
  }

  async execute(context) {
    const data = await this._githubSnapshot.fetchSnapshot();
    context.githubData = data;
    return { success: true, data };
  }

  async rollback(context) {
    context.githubData = null;
    return { success: true };
  }

  async validate(context) {
    await super.validate(context);
    if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables required');
    }
    return true;
  }
}

class BuildObjectsStage extends LifecycleStage {
  constructor(githubSnapshot) {
    super(Stage.BUILD_OBJECTS, [Stage.SNAPSHOT]);
    this._githubSnapshot = githubSnapshot;
  }

  async execute(context) {
    const objects = this._githubSnapshot.buildConstitutionalObjects(
      context.githubData,
      context.lifecycleId
    );
    objects.forEach(obj => context.addObject(obj));
    return { success: true, data: objects };
  }

  async rollback(context) {
    context.objects = [];
    return { success: true };
  }

  async validate(context) {
    await super.validate(context);
    if (!context.githubData) {
      throw new Error('GitHub data required from previous stage');
    }
    return true;
  }
}

class PersistStage extends LifecycleStage {
  constructor(postgresPool) {
    super(Stage.PERSIST, [Stage.BUILD_OBJECTS]);
    this._postgres = postgresPool;
  }

  async execute(context) {
    const client = await context.beginTransaction();
    const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
    for (const obj of context.objects) {
      await client.query(`
        INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
        VALUES ($1, $2, NOW(), $3, $4, $5)
        ON CONFLICT (event_id) DO UPDATE SET event_data = $5, timestamp = NOW()
      `, [obj.id, 'CONSTITUTIONAL_OBJECT_CREATED', obj.id, obj.kind, CanonicalBytes.serialize(obj)]);
    }
    return { success: true, data: context.objects };
  }

  async rollback(context) {
    // Transaction will be rolled back by context
    return { success: true };
  }

  async validate(context) {
    await super.validate(context);
    if (context.objects.length === 0) {
      throw new Error('No objects to persist');
    }
    return true;
  }
}

class EmbeddingStage extends LifecycleStage {
  constructor(embeddingAuthority, qdrantClient) {
    super(Stage.EMBED, [Stage.PERSIST]);
    this._embeddingAuthority = embeddingAuthority;
    this._qdrantClient = qdrantClient;
  }

  async execute(context) {
    const embeddings = [];
    for (const obj of context.objects) {
      const text = JSON.stringify(obj.payload);
      const embedding = await this._embeddingAuthority.embed(text);
      if (embedding) {
        embeddings.push({ id: obj.id, vector: embedding.vector, payload: obj });
        context.addEmbedding(embedding);
        context.addVector(embedding.vector);
        
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
    return { success: true, data: { count: embeddings.length, embeddings } };
  }

  async rollback(context) {
    // Remove embeddings from Qdrant
    for (const embedding of context.embeddings) {
      try {
        await this._qdrantClient.delete('constitutional_documents', [embedding.id]);
      } catch (error) {
        console.error(`Failed to rollback embedding for ${embedding.id}:`, error.message);
      }
    }
    context.embeddings = [];
    context.vectors = [];
    return { success: true };
  }

  async validate(context) {
    await super.validate(context);
    if (context.objects.length === 0) {
      throw new Error('No objects to embed');
    }
    return true;
  }
}

class StageRegistry {
  constructor() {
    this._stages = new Map();
  }

  register(stage) {
    this._stages.set(stage.name, stage);
  }

  get(name) {
    return this._stages.get(name);
  }

  getAll() {
    return Array.from(this._stages.values());
  }

  getExecutionOrder() {
    // Topological sort based on dependencies
    const stages = this.getAll();
    const visited = new Set();
    const order = [];

    const visit = (stage) => {
      if (visited.has(stage.name)) return;
      visited.add(stage.name);
      
      for (const dep of stage.dependencies) {
        const depStage = this.get(dep);
        if (depStage) visit(depStage);
      }
      
      order.push(stage);
    };

    for (const stage of stages) {
      visit(stage);
    }

    return order;
  }

  async executeAll(context) {
    const order = this.getExecutionOrder();
    const results = [];

    for (const stage of order) {
      try {
        await stage.validate(context);
        context.setCurrentStage(stage.name);
        const result = await stage.execute(context);
        context.markStageComplete(stage.name);
        results.push({ stage: stage.name, success: true, result });
      } catch (error) {
        // Rollback all completed stages in reverse order
        for (let i = results.length - 1; i >= 0; i--) {
          const completedStage = this.get(results[i].stage);
          try {
            await completedStage.rollback(context);
          } catch (rollbackError) {
            console.error(`Rollback failed for ${completedStage.name}:`, rollbackError.message);
          }
        }
        throw error;
      }
    }

    return results;
  }
}

module.exports = {
  LifecycleStage,
  GitHubSnapshotStage,
  BuildObjectsStage,
  PersistStage,
  EmbeddingStage,
  StageRegistry,
};
