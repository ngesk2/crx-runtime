const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ProjectionExecutor {
  constructor(postgresPool, qdrantClient) {
    this._postgres = postgresPool;
    this._qdrant = qdrantClient;
  }

  async execute(event, reducerResults) {
    const startedAt = constitutionalTimeAuthority.nowAsMillis();
    const results = {};

    if (this._canProjectSummary(event)) {
      results.summary = await this._projectSummary(event, reducerResults);
    }
    if (this._canProjectEmbedding(event)) {
      results.embedding = await this._projectEmbedding(event);
    }
    if (this._canProjectLineage(event)) {
      results.lineage = await this._projectLineage(event);
    }
    if (this._canProjectQdrant(event)) {
      results.qdrant = await this._projectQdrant(event);
    }

    results.durationMs = constitutionalTimeAuthority.nowAsMillis() - startedAt;
    return results;
  }

  _canProjectSummary(event) {
    return ['DOCUMENT_IMPORTED', 'CLAIM_CREATED', 'REPLAY_COMPLETED'].includes(event.event_type);
  }

  _canProjectEmbedding(event) {
    return ['DOCUMENT_IMPORTED', 'CLAIM_CREATED'].includes(event.event_type);
  }

  _canProjectLineage(event) {
    return ['DOCUMENT_IMPORTED', 'CLAIM_CREATED', 'OBSERVATION_PROCESSED', 'AGENT_REGISTERED'].includes(event.event_type);
  }

  _canProjectQdrant(event) {
    return ['DOCUMENT_IMPORTED', 'CLAIM_CREATED'].includes(event.event_type);
  }

  async _projectSummary(event, reducerResults) {
    const summaryState = reducerResults.find(r => r.name === 'summary');
    if (!summaryState || !summaryState.state) {
      return { projected: false, reason: 'No summary state from reducer' };
    }
    return { projected: true, type: 'summary' };
  }

  async _projectEmbedding(event) {
    return { projected: true, type: 'embedding' };
  }

  async _projectLineage(event) {
    if (!this._postgres) {
      return { projected: false, reason: 'No postgres pool' };
    }
    try {
      await this._postgres.query(`
        INSERT INTO lineage (event_id, event_type, aggregate_id, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (event_id) DO NOTHING
      `, [event.event_id, event.event_type, event.aggregate_id]);
      return { projected: true, type: 'lineage' };
    } catch (error) {
      return { projected: false, error: error.message };
    }
  }

  async _projectQdrant(event) {
    if (!this._qdrant) {
      return { projected: false, reason: 'No qdrant client' };
    }
    return { projected: true, type: 'qdrant' };
  }
}

module.exports = { ProjectionExecutor };
