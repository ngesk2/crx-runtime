const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const QUEUE_DIR = path.join(__dirname, '..', 'event_queue');

const VALID_EVENT_TYPES = [
  'git_diff',
  'knowledge_compiled',
  'mission_created',
  'worker_assigned',
  'worker_started',
  'worker_heartbeat',
  'worker_progress',
  'worker_completed',
  'worker_failed',
  'consensus_started',
  'consensus_completed',
  'consensus_reached',
  'consensus_failed',
  'artifact_produced',
  'artifact_stored',
  'merge_gate_started',
  'merge_gate_passed',
  'merge_gate_failed',
  'merge_decision_created',
  'mission_accepted',
  'mission_rejected',
  'mission_archived',
  'replay_generated',
  'witness_generated',
  'system_heartbeat',
  'context_built',
  'prompt_generated',
  'worker_registered',
  'worker_state_changed',
  'worker_execution_started',
  'worker_execution_completed'
];

const SCHEMA_VERSION = '3.0.0';

class EventQueue {
  constructor() {
    this._events = [];
    this._subscriptions = new Map();
    this._emittedIds = new Set();
    this._globalSequence = 0;
    if (!fs.existsSync(QUEUE_DIR)) {
      fs.mkdirSync(QUEUE_DIR, { recursive: true });
    }
    this._load();
  }

  _sortKeys(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this._sortKeys(v));
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = this._sortKeys(obj[key]);
      return acc;
    }, {});
  }

  _deterministicJson(obj) {
    return JSON.stringify(this._sortKeys(obj));
  }

  emit(eventType, data = {}, causation = {}) {
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      console.warn(`[EventQueue] Unknown event type: ${eventType}`);
    }

    const sortedData = this._sortKeys(data);
    const rawId = `${eventType}_${this._deterministicJson(data)}`;
    const eventId = crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 16);

    if (this._emittedIds.has(eventId)) {
      return null;
    }
    this._emittedIds.add(eventId);

    const globalSequence = ++this._globalSequence;
    const correlationId = data.correlationId || causation.correlation_id || crypto.createHash('sha256').update(eventType + globalSequence.toString()).digest('hex').substring(0, 12);

    const event = {
      event_id: eventId,
      type: eventType,
      schema_version: SCHEMA_VERSION,
      data: sortedData,
      mission_id: data.missionId || null,
      worker_id: data.workerId || null,
      artifact_id: data.artifactId || null,
      witness_id: data.witnessId || null,
      replay_certificate_id: data.replayCertificateId || null,
      causation_id: causation.event_id || null,
      correlation_id: correlationId,
      parent_event_id: causation.parentEventId || null,
      global_sequence: globalSequence
    };

    this._events.push(event);

    this._persist(event);

    Object.freeze(event);
    const handlers = this._subscriptions.get(eventType) || [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (e) {
        console.error(`[EventQueue] Handler error for ${eventType}:`, e.message);
      }
    }

    return event;
  }

  emitChain(eventType, data, parentEvent) {
    return this.emit(eventType, data, {
      event_id: parentEvent?.event_id || null,
      correlation_id: parentEvent?.correlation_id || null,
      parentEventId: parentEvent?.event_id || null
    });
  }

  isDuplicate(eventId) {
    return this._emittedIds.has(eventId);
  }

  subscribe(eventType, handler) {
    if (!this._subscriptions.has(eventType)) {
      this._subscriptions.set(eventType, []);
    }
    this._subscriptions.get(eventType).push(handler);
    return () => {
      const handlers = this._subscriptions.get(eventType);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    };
  }

  subscribeMany(eventTypes, handler) {
    const unsubs = eventTypes.map(t => this.subscribe(t, handler));
    return () => unsubs.forEach(fn => fn());
  }

  getEventsByType(eventType, limit = 50) {
    return this._events.filter(e => e.type === eventType).slice(-limit);
  }

  getChain(correlationId) {
    return this._events.filter(e => e.correlation_id === correlationId);
  }

  getDescendants(eventId) {
    return this._events.filter(e => e.causation_id === eventId || e.parent_event_id === eventId);
  }

  getEventsSince(timestamp) {
    console.warn('[EventQueue] getEventsSince is deprecated - use getEventsSinceSequence instead');
    const sinceSequence = this._globalSequence - 100;
    return this._events.filter(e => e.global_sequence >= sinceSequence);
  }

  getEventsSinceSequence(sequence) {
    return this._events.filter(e => e.global_sequence > sequence);
  }

  getStats() {
    const byType = {};
    for (const event of this._events) {
      if (!byType[event.type]) byType[event.type] = 0;
      byType[event.type]++;
    }
    const recentSequenceThreshold = Math.max(0, this._globalSequence - 100);
    return {
      total: this._events.length,
      uniqueIds: this._emittedIds.size,
      byType,
      recentRate: this._events.filter(e => {
        return e.global_sequence >= recentSequenceThreshold;
      }).length,
      chains: this._countChains()
    };
  }

  _countChains() {
    const correlations = new Set(this._events.map(e => e.correlation_id).filter(Boolean));
    return correlations.size;
  }

  _persist(event) {
    const filePath = path.join(QUEUE_DIR, `${event.event_id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
  }

  _load() {
    if (!fs.existsSync(QUEUE_DIR)) return;
    const files = fs.readdirSync(QUEUE_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .slice(-5000);
    let maxSeq = 0;
    for (const file of files) {
      try {
        const event = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8'));
        this._events.push(event);
        if (event.event_id) this._emittedIds.add(event.event_id);
        if (event.global_sequence && event.global_sequence > maxSeq) {
          maxSeq = event.global_sequence;
        }
      } catch (e) { }
    }
    this._globalSequence = maxSeq;
  }
}

module.exports = { EventQueue, VALID_EVENT_TYPES };
