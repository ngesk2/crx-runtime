"use strict";
/**
 * REPLAY EVENT STREAM
 *
 * Pure TypeScript implementation of replay event stream.
 *
 * Requirements:
 * - deterministic event streaming
 * - immutable event stream
 * - no side effects
 * - pure functional execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayEventStream = void 0;
const canonical_event_envelope_1 = require("./canonical_event_envelope");
class ReplayEventStream {
    events;
    streamVersion;
    constructor(events, streamVersion = '1.0') {
        this.events = [...events]; // Immutable copy
        this.streamVersion = streamVersion;
    }
    /**
     * Get all events in stream
     */
    getEvents() {
        return [...this.events]; // Immutable copy
    }
    /**
     * Get event by ID
     */
    getEventById(eventId) {
        return this.events.find(e => e.getEventId() === eventId) || null;
    }
    /**
     * Get events by type
     */
    getEventsByType(eventType) {
        return this.events.filter(e => e.getEventType() === eventType);
    }
    /**
     * Get events by actor
     */
    getEventsByActor(actorId) {
        return this.events.filter(e => e.getActorId() === actorId);
    }
    /**
     * Get events in lineage chain
     */
    getLineageChain(eventId) {
        const chain = [];
        const visited = new Set();
        const traverse = (currentId) => {
            if (visited.has(currentId))
                return;
            visited.add(currentId);
            const event = this.getEventById(currentId);
            if (event) {
                chain.push(event);
                const lineage = event.getLineage();
                for (const parentId of lineage.parent_event_ids) {
                    traverse(parentId);
                }
            }
        };
        traverse(eventId);
        return chain.reverse(); // Return in chronological order
    }
    /**
     * Get stream version
     */
    getStreamVersion() {
        return this.streamVersion;
    }
    /**
     * Get stream size
     */
    getStreamSize() {
        return this.events.length;
    }
    /**
     * Append event to stream (returns new stream)
     */
    appendEvent(event) {
        return new ReplayEventStream([...this.events, event], this.streamVersion);
    }
    /**
     * Create stream from JSON
     */
    static fromJSON(json) {
        if (!Array.isArray(json)) {
            throw new Error('Invalid event stream JSON');
        }
        const events = json.map((item) => {
            if (!item || typeof item !== 'object') {
                throw new Error('Invalid event in stream');
            }
            return new canonical_event_envelope_1.CanonicalEventEnvelope(item);
        });
        return new ReplayEventStream(events);
    }
    /**
     * Convert stream to JSON
     */
    toJSON() {
        return this.events.map(e => e.toJSON());
    }
}
exports.ReplayEventStream = ReplayEventStream;
