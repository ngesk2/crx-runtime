/**
 * Context Compiler — PING Core v1
 *
 * Assembles verified, deterministic ContextPacks for mission execution.
 * Executors receive bounded context instead of rummaging through stores.
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../authorities/canonical_authority.js');

class ContextCompiler {
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._knowledgeGraph = options.knowledgeGraph || null;
    this._customerAuthority = options.customerAuthority || null;
    this._projectAuthority = options.projectAuthority || null;
    this._dependencies = ['eventRuntime'];
    if (this._knowledgeGraph) this._dependencies.push('knowledgeGraph');
    if (this._customerAuthority) this._dependencies.push('customerAuthority');
    if (this._projectAuthority) this._dependencies.push('projectAuthority');
  }

  get dependencies() {
    return this._dependencies;
  }

  async compile({ missionId, query, correlationId } = {}) {
    if (!missionId) throw new Error('missionId is required');
    if (!query) throw new Error('query is required');

    const correlationGroup = await this._getCorrelationGroup(missionId, correlationId);
    const events = correlationGroup.events || [];

    const canonicalObjectRefs = this._extractCanonicalObjectRefs(events);
    const artifactRefs = this._extractArtifactRefs(events);
    const evidenceRefs = events.map(e => e.event_id);
    const relationshipRefs = this._extractRelationshipRefs(events);
    const sourceMetadata = this._buildSourceMetadata(events);
    const retrievalManifest = this._buildRetrievalManifest({
      missionId,
      query,
      correlationId: correlationGroup.correlation_id,
      eventCount: events.length,
    });
    const contextPackId = this._generateContextPackId({
      missionId,
      query,
      correlationId: correlationGroup.correlation_id,
      retrievalManifest,
    });

    return {
      context_pack_id: contextPackId,
      mission_id: missionId,
      query,
      canonical_object_refs: canonicalObjectRefs,
      artifact_refs: artifactRefs,
      evidence_refs: evidenceRefs,
      relationship_refs: relationshipRefs,
      source_metadata: sourceMetadata,
      retrieval_manifest: retrievalManifest,
      compiled_at: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  async _getCorrelationGroup(missionId, correlationId) {
    if (!this._eventRuntime) {
      return { correlation_id: correlationId || missionId, events: [] };
    }

    if (correlationId) {
      const group = await this._eventRuntime.getCorrelationGroup(correlationId, 100);
      return group;
    }

    return { correlation_id: missionId, events: [] };
  }

  _extractCanonicalObjectRefs(events) {
    const refs = new Set();
    for (const event of events) {
      const payload = event.payload || {};
      if (payload.customer_id) refs.add('customer:' + payload.customer_id);
      if (payload.customerId) refs.add('customer:' + payload.customerId);
      if (payload.project_id) refs.add('project:' + payload.project_id);
      if (payload.project_id) refs.add('project:' + payload.project_id);
      if (payload.lead_id) refs.add('lead:' + payload.lead_id);
      if (payload.lead_id) refs.add('lead:' + payload.lead_id);
      if (payload.invoice_id) refs.add('invoice:' + payload.invoice_id);
      if (payload.invoice_id) refs.add('invoice:' + payload.invoice_id);
    }
    return Array.from(refs);
  }

  _extractArtifactRefs(events) {
    const refs = new Set();
    for (const event of events) {
      const payload = event.payload || {};
      const metadata = event.metadata || {};
      if (payload.artifact_id) refs.add('artifact:' + payload.artifact_id);
      if (payload.artifact_id) refs.add('artifact:' + payload.artifact_id);
      if (metadata.artifact_id) refs.add('artifact:' + metadata.artifact_id);
    }
    return Array.from(refs);
  }

  _extractRelationshipRefs(events) {
    const refs = new Set();
    for (const event of events) {
      const payload = event.payload || {};
      if (payload.customer_id && payload.project_id) {
        refs.add('customer:' + payload.customer_id + '→project:' + payload.project_id);
      }
      if (payload.customerId && payload.project_id) {
        refs.add('customer:' + payload.customerId + '→project:' + payload.project_id);
      }
    }
    return Array.from(refs);
  }

  _buildSourceMetadata(events) {
    const sources = new Set();
    const authorities = new Set();
    for (const event of events) {
      sources.add(event.source);
      if (event.metadata && event.metadata.authority) {
        authorities.add(event.metadata.authority);
      }
    }
    return {
      sources: Array.from(sources),
      authorities: Array.from(authorities),
      event_count: events.length,
      earliest_event: events.length > 0 ? events[0].timestamp : null,
      latest_event: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  }

  _buildRetrievalManifest(inputs) {
    const stable = { ...inputs };
    delete stable.eventCount;
    return {
      hash: CanonicalAuthority.hash(stable),
      inputs: {
        mission_id: inputs.missionId,
        query: inputs.query,
        correlation_id: inputs.correlationId,
      },
    };
  }

  _generateContextPackId({ missionId, query, correlationId, retrievalManifest }) {
    const identity = {
      mission_id: missionId,
      query,
      correlationId,
      retrieval_hash: retrievalManifest.hash,
    };
    const hash = CanonicalAuthority.hash(identity);
    return 'ctx_' + hash.substring(0, 16);
  }

  async health() {
    return {
      healthy: !!this._eventRuntime,
      eventRuntime: !!this._eventRuntime,
      knowledgeGraph: !!this._knowledgeGraph,
      customerAuthority: !!this._customerAuthority,
      projectAuthority: !!this._projectAuthority,
    };
  }
}

module.exports = { ContextCompiler };
