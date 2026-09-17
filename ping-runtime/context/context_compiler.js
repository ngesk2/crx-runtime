/**
 * Context Compiler — PING Core v1
 *
 * Assembles verified, deterministic ContextPacks for mission execution.
 * Executors receive bounded context instead of rummaging through stores.
 */

const crypto = require('crypto');
const { constitutionalTimeAuthority } = require('../authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../authorities/canonical_authority.js');

const NAMESPACE_RE = /^(core|tenant)::[a-zA-Z0-9_.-]+$/;
const MAX_CONTEXT_EVENTS = 100;

class ContextCompiler {
  constructor(options = {}) {
    this._eventRuntime = options.eventRuntime || null;
    this._evidenceAuthority = options.evidenceAuthority || null;
    this._knowledgeGraph = options.knowledgeGraph || null;
    this._customerAuthority = options.customerAuthority || null;
    this._projectAuthority = options.projectAuthority || null;
    this._dependencies = ['eventRuntime'];
    if (this._evidenceAuthority) this._dependencies.push('evidenceAuthority');
    if (this._knowledgeGraph) this._dependencies.push('knowledgeGraph');
    if (this._customerAuthority) this._dependencies.push('customerAuthority');
    if (this._projectAuthority) this._dependencies.push('projectAuthority');
  }

  get dependencies() {
    return this._dependencies;
  }

  async compile({ missionId, query, correlationId, namespace } = {}) {
    if (!missionId) throw new Error('missionId is required');
    if (!query) throw new Error('query is required');
    if (!namespace || !NAMESPACE_RE.test(namespace)) {
      throw new Error('namespace is required and must be canonical');
    }
    if (!this._eventRuntime || typeof this._eventRuntime.getCorrelationGroup !== 'function') {
      throw new Error('ContextCompiler requires the canonical event runtime');
    }
    if (!this._evidenceAuthority || typeof this._evidenceAuthority.accumulate !== 'function') {
      throw new Error('ContextCompiler requires EvidenceAuthority');
    }

    const resolvedCorrelationId = correlationId || missionId;
    const correlationGroup = await this._getCorrelationGroup(resolvedCorrelationId, namespace);
    if (correlationGroup.events.length > MAX_CONTEXT_EVENTS) {
      throw new Error(`Context selection exceeds the ${MAX_CONTEXT_EVENTS}-event bound`);
    }
    const events = this._canonicalizeEvents(correlationGroup.events, {
      namespace,
      correlationId: resolvedCorrelationId,
    });
    this._validateLineage(events);
    await this._verifyEvidenceBacking(events, namespace, resolvedCorrelationId);

    const canonicalObjectRefs = this._extractCanonicalObjectRefs(events);
    const artifactRefs = this._extractArtifactRefs(events);
    const evidenceRefs = events.map(e => e.event_id);
    const relationshipRefs = this._extractRelationshipRefs(events);
    const sourceMetadata = this._buildSourceMetadata(events);
    const retrievalManifest = this._buildRetrievalManifest({
      missionId,
      query,
      namespace,
      correlationId: resolvedCorrelationId,
      eventCount: events.length,
      events,
    });
    const contextPackId = this._generateContextPackId({
      missionId,
      query,
      namespace,
      correlationId: resolvedCorrelationId,
      retrievalManifest,
    });

    return {
      context_pack_id: contextPackId,
      mission_id: missionId,
      query,
      namespace,
      canonical_object_refs: canonicalObjectRefs,
      artifact_refs: artifactRefs,
      evidence_refs: evidenceRefs,
      relationship_refs: relationshipRefs,
      source_metadata: sourceMetadata,
      retrieval_manifest: retrievalManifest,
      compiled_at: constitutionalTimeAuthority.nowAsISOString(),
    };
  }

  async _getCorrelationGroup(correlationId, namespace) {
    const group = await this._eventRuntime.getCorrelationGroup(
      correlationId,
      MAX_CONTEXT_EVENTS + 1,
      namespace
    );
    if (!group || group.status !== 'ok' || !Array.isArray(group.events)) {
      throw new Error(`Canonical event retrieval failed for correlation '${correlationId}'`);
    }
    return group;
  }

  _canonicalizeEvents(events, expected = {}) {
    if (!Array.isArray(events)) {
      throw new Error('Correlation group events must be an array');
    }

    const byId = new Map();
    for (const event of events) {
      if (!event || typeof event !== 'object' || Array.isArray(event)) {
        throw new Error('Canonical event must be an object');
      }
      for (const field of ['event_id', 'event_type', 'source']) {
        if (typeof event[field] !== 'string' || event[field].length === 0) {
          throw new Error(`Canonical event ${field} must be a non-empty string`);
        }
      }

      const parsedTimestamp = event.timestamp instanceof Date
        ? event.timestamp
        : new Date(event.timestamp);
      if (!Number.isFinite(parsedTimestamp.getTime())) {
        throw new Error(`Canonical event '${event.event_id}' has an invalid timestamp`);
      }
      for (const field of ['payload', 'metadata']) {
        if (!event[field] || typeof event[field] !== 'object' || Array.isArray(event[field])) {
          throw new Error(`Canonical event '${event.event_id}' ${field} must be an object`);
        }
      }

      const canonicalEvent = {
        event_id: event.event_id,
        event_type: event.event_type,
        source: event.source,
        namespace: event.namespace ?? event.metadata.namespace ?? null,
        timestamp: parsedTimestamp.toISOString(),
        payload: event.payload,
        metadata: event.metadata,
      };
      if (expected.namespace && canonicalEvent.namespace !== expected.namespace) {
        throw new Error(
          `Canonical event '${canonicalEvent.event_id}' namespace mismatch`
        );
      }
      if (
        expected.correlationId &&
        canonicalEvent.metadata.correlation_id !== expected.correlationId
      ) {
        throw new Error(
          `Canonical event '${canonicalEvent.event_id}' correlation mismatch`
        );
      }
      const contentHash = CanonicalAuthority.hash(canonicalEvent);
      const previous = byId.get(canonicalEvent.event_id);
      if (previous && previous.content_hash !== contentHash) {
        throw new Error(
          `Conflicting canonical event content for event_id '${canonicalEvent.event_id}'`
        );
      }
      if (!previous) {
        byId.set(canonicalEvent.event_id, {
          event: canonicalEvent,
          content_hash: contentHash,
        });
      }
    }

    return Array.from(byId.values())
      .sort((left, right) => {
        if (left.event.event_id < right.event.event_id) return -1;
        if (left.event.event_id > right.event.event_id) return 1;
        return 0;
      })
      .map(({ event, content_hash }) => ({ ...event, content_hash }));
  }

  _validateLineage(events) {
    const selectedIds = new Set(events.map(event => event.event_id));
    for (const event of events) {
      const causationId = event.metadata.causation_id;
      if (causationId && !selectedIds.has(causationId)) {
        throw new Error(
          `Canonical event '${event.event_id}' causation_id '${causationId}' is not selected`
        );
      }
    }
  }

  async _verifyEvidenceBacking(events, namespace, correlationId) {
    const eventIds = events.map(event => event.event_id);
    const backing = await this._evidenceAuthority.accumulate(eventIds);
    const verified = this._canonicalizeEvents(backing, { namespace, correlationId });
    this._validateLineage(verified);

    const selectedRefs = events.map(event => [event.event_id, event.content_hash]);
    const verifiedRefs = verified.map(event => [event.event_id, event.content_hash]);
    if (CanonicalAuthority.hash(selectedRefs) !== CanonicalAuthority.hash(verifiedRefs)) {
      throw new Error('Evidence backing mismatch for selected canonical events');
    }
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
    return Array.from(refs).sort();
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
    return Array.from(refs).sort();
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
    return Array.from(refs).sort();
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
    const timestamps = events.map(event => event.timestamp).sort();
    return {
      sources: Array.from(sources).sort(),
      authorities: Array.from(authorities).sort(),
      event_count: events.length,
      earliest_event: timestamps[0] || null,
      latest_event: timestamps[timestamps.length - 1] || null,
    };
  }

  _buildRetrievalManifest(inputs) {
    const manifestInputs = {
      mission_id: inputs.missionId,
      query: inputs.query,
      namespace: inputs.namespace,
      correlation_id: inputs.correlationId,
    };
    const selectedEvents = inputs.events.map(event => ({
      event_id: event.event_id,
      content_hash: event.content_hash,
    }));
    const hash = CanonicalAuthority.hash({
      version: 1,
      inputs: manifestInputs,
      selected_events: selectedEvents,
    });
    return {
      version: 1,
      hash,
      inputs: manifestInputs,
      selected_events: selectedEvents,
    };
  }

  _generateContextPackId({ missionId, query, namespace, correlationId, retrievalManifest }) {
    const identity = {
      mission_id: missionId,
      query,
      namespace,
      correlationId,
      retrieval_hash: retrievalManifest.hash,
    };
    const hash = CanonicalAuthority.hash(identity);
    return 'ctx_' + hash.substring(0, 16);
  }

  async health() {
    return {
      healthy: !!this._eventRuntime && !!this._evidenceAuthority,
      eventRuntime: !!this._eventRuntime,
      evidenceAuthority: !!this._evidenceAuthority,
      knowledgeGraph: !!this._knowledgeGraph,
      customerAuthority: !!this._customerAuthority,
      projectAuthority: !!this._projectAuthority,
    };
  }
}

module.exports = { ContextCompiler };
