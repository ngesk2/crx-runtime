const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class KnowledgeObject {
  constructor(kind, source, snapshot) {
    this.id = null;
    this.kind = kind;
    this.source = source;
    this.snapshot = snapshot;
    this.identity = null;
    this.canonical_hash = null;
    this.evidence = {
      source: source,
      verified_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
      status: 'pending',
    };
    this.relationships = { parent: null, children: [], related: [] };
    this.embedding = null;
    this.authority = { owner: null, level: 'source_artifact' };
    this.witness = { signature: null, witnessed_at: null };
    this.health = { status: 'created', last_verified: null };
    this.created_at = new Date(constitutionalTimeAuthority.now()).toISOString();
  }

  assignIdentity(id) {
    this.identity = { authority: 'IdentityAuthority', id };
    this.id = id;
  }

  hash() {
    const payload = JSON.stringify({ kind: this.kind, source: this.source, snapshot: this.snapshot });
    // Phase 36F: Use CanonicalAuthority for hash computation
    this.canonical_hash = CanonicalAuthority.hash(payload);
    return this.canonical_hash;
  }

  setAuthority(owner) {
    this.authority = { owner, level: 'source_artifact' };
  }

  addRelationship(type, targetId) {
    if (type === 'parent') this.relationships.parent = targetId;
    else this.relationships.children.push(targetId);
    if (type === 'related') this.relationships.related.push(targetId);
  }

  markVerified() {
    this.evidence.status = 'verified';
    this.evidence.verified_at = new Date(constitutionalTimeAuthority.now()).toISOString();
    this.health.status = 'ready';
    this.health.last_verified = this.evidence.verified_at;
  }

  toEvent() {
    return {
      event_type: 'KNOWLEDGE_OBJECT_CREATED',
      aggregate_type: 'KNOWLEDGE_OBJECT',
      aggregate_id: this.id,
      event_data: {
        knowledge_object: {
          id: this.id,
          kind: this.kind,
          source: this.source,
          identity: this.identity,
          canonical_hash: this.canonical_hash,
          evidence: this.evidence,
          relationships: this.relationships,
          authority: this.authority,
          witness: this.witness,
          health: this.health,
          created_at: this.created_at,
        },
        snapshot: this.snapshot,
      },
    };
  }

  toResponse() {
    return {
      id: this.id,
      kind: this.kind,
      source: this.source,
      identity: this.identity,
      canonical_hash: this.canonical_hash,
      evidence: this.evidence,
      relationships: this.relationships,
      authority: this.authority,
      witness: this.witness,
      health: this.health,
      created_at: this.created_at,
    };
  }

  static fromEvent(event) {
    const data = typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data;
    const ko = data.knowledge_object || data;
    const obj = new KnowledgeObject(ko.kind, ko.source, data.snapshot || {});
    obj.id = ko.id || event.event_id;
    obj.identity = ko.identity || { authority: 'IdentityAuthority', id: obj.id };
    obj.canonical_hash = ko.canonical_hash || event.event_data?.content_hash;
    obj.evidence = ko.evidence || { source: ko.source, verified_at: event.timestamp, status: 'pending' };
    obj.relationships = ko.relationships || { parent: null, children: [], related: [] };
    obj.authority = ko.authority || { owner: 'RepositoryAuthority', level: 'source_artifact' };
    obj.witness = ko.witness || { signature: null, witnessed_at: null };
    obj.health = ko.health || { status: 'ready', last_verified: event.timestamp };
    obj.created_at = event.timestamp;
    return obj;
  }
}

module.exports = { KnowledgeObject };
