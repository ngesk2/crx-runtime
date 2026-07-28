import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';
import { CertificateAuthority } from '../replay/certificate_authority';
import { PostgresEventStore } from '../../adapters/postgres_event_store';
import { CanonicalEventEnvelope } from '../replay/canonical_event_envelope';
import { IRepositoryAuthority, CanonicalObject, Snapshot, Projection, ProjectionResult, Merge, MergeResult, Index, SearchQuery, SearchResult, MergeStrategy, Conflict } from './repository-authority-interface';

export class RepositoryAuthority implements IRepositoryAuthority {
  private store: PostgresEventStore;
  private cache: Map<string, CanonicalObject> = new Map();
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();

  constructor(store: PostgresEventStore) {
    this.store = store;
  }

  async append(object: CanonicalObject): Promise<void> {
    const id = object.id || this.identityService.generateUUIDv5('object', JSON.stringify(object.data));
    const version = ((object.metadata.version as number) || 0) + 1;

    const canonical: CanonicalObject = {
      ...object,
      id,
      metadata: { ...object.metadata, version, stored_at: this.clock.now() },
    };

    const envelope = new CanonicalEventEnvelope({
      event_id: id,
      event_type: `object.${object.kind}`,
      aggregate_id: id,
      aggregate_type: object.kind,
      event_data: canonical,
      created_at: this.clock.now(),
    });

    await this.store.append(envelope);
    this.cache.set(id, canonical);
  }

  async load(id: string): Promise<CanonicalObject | null> {
    if (this.cache.has(id)) return this.cache.get(id) || null;

    const stream = await this.store.loadStream();
    for (const envelope of stream.getEvents()) {
      const payload = envelope.getEventData?.() || envelope.toJSON();
      if (payload.event_id === id || payload.aggregate_id === id) {
        const obj = payload.event_data as CanonicalObject;
        this.cache.set(id, obj);
        return obj;
      }
    }
    return null;
  }

  async loadMany(ids: string[]): Promise<CanonicalObject[]> {
    const results: CanonicalObject[] = [];
    for (const id of ids) {
      const obj = await this.load(id);
      if (obj) results.push(obj);
    }
    return results;
  }

  async snapshot(): Promise<Snapshot> {
    const objects = Array.from(this.cache.values());
    if (objects.length === 0) {
      const stream = await this.store.loadStream();
      for (const envelope of stream.getEvents()) {
        const payload = envelope.getEventData?.() || envelope.toJSON();
        if (payload.event_data) {
          this.cache.set(payload.event_id, payload.event_data as CanonicalObject);
        }
      }
    }
    return {
      snapshotId: this.identityService.generateUUIDv5('snapshot', this.clock.now()),
      timestamp: this.clock.now(),
      objects: Array.from(this.cache.values()),
    };
  }

  async restore(snapshot: Snapshot): Promise<void> {
    this.cache.clear();
    for (const obj of snapshot.objects) {
      this.cache.set(obj.id, obj);
    }
  }

  async project(projection: Projection): Promise<ProjectionResult> {
    const source = this.cache.get(projection.sourceId);
    if (!source) {
      return { projectionId: projection.projectionId, result: null, metadata: { error: 'Source not found' } };
    }
    const result = { source: source.data, parameters: projection.parameters };
    return { projectionId: projection.projectionId, result, metadata: { source_kind: source.kind } };
  }

  async merge(merge: Merge): Promise<MergeResult> {
    const sources = merge.sourceIds.map(id => this.cache.get(id)).filter((o): o is CanonicalObject => o !== undefined);
    const conflicts: Conflict[] = [];

    if (merge.strategy === MergeStrategy.Constitutional) {
      const merged: CanonicalObject = {
        id: this.identityService.generateUUIDv5('merge', merge.sourceIds.join(':')),
        kind: merge.targetKind,
        data: { sources: sources.map(s => s.data) },
        metadata: { merge_strategy: merge.strategy, source_count: sources.length, merged_at: this.clock.now() },
      };
      return { mergeId: merge.mergeId, result: merged, conflicts };
    }

    if (sources.length === 0) {
      return { mergeId: merge.mergeId, result: { id: '', kind: merge.targetKind, data: null, metadata: {} }, conflicts };
    }

    const latest = sources.reduce((a, b) => {
      const aVer = (a.metadata.version as number) || 0;
      const bVer = (b.metadata.version as number) || 0;
      return aVer >= bVer ? a : b;
    });

    return { mergeId: merge.mergeId, result: latest, conflicts };
  }

  async index(index: Index): Promise<void> {
    for (const [id, obj] of this.cache) {
      await this.append(obj);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    let results = Array.from(this.cache.values());

    if (query.kind) {
      results = results.filter(o => o.kind === query.kind);
    }

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(o =>
        JSON.stringify(o.data).toLowerCase().includes(q) ||
        JSON.stringify(o.metadata).toLowerCase().includes(q)
      );
    }

    for (const [field, value] of Object.entries(query.filters)) {
      results = results.filter(o => (o.data as Record<string, unknown>)?.[field] === value);
    }

    const total = results.length;
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return { results, total, metadata: { query: query.query, kind: query.kind, limit: query.limit } };
  }
}
