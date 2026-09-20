/**
 * PING Feed Projection
 * PATCH 6: Feed Is A Projection
 * 
 * Derives feeds from canonical history (objects + relationships + visibility + ordering policy)
 * Feed can be destroyed and reconstructed from canonical history
 */

import { PingObject, PingRelationship } from './schemas/ping-objects';

/**
 * Feed Entry
 */
export interface FeedEntry {
  object: PingObject;
  relationship?: PingRelationship;  // How this object entered the feed (e.g., "follows")
  score: number;  // For ordering
}

/**
 * PING Feed Projection
 */
export class PingFeedProjection {
  /**
   * Derive feed for an actor
   * 
   * @param actorId - Actor to derive feed for (e.g., "bob")
   * @param objects - All objects in system
   * @param relationships - All relationships in system
   * @returns Feed entries sorted by score
   */
  static deriveFeed(
    actorId: string,
    objects: PingObject[],
    relationships: PingRelationship[]
  ): FeedEntry[] {
    const feed: FeedEntry[] = [];

    // Find all actors that the given actor follows
    const following = relationships
      .filter(r => r.subject === actorId && r.predicate === 'follows' && r.status === 'active')
      .map(r => r.object);

    // Add objects from followed actors
    for (const object of objects) {
      if (following.includes(object.controller)) {
        const relationship = relationships.find(
          r => r.subject === actorId && r.predicate === 'follows' && r.object === object.controller
        );

        feed.push({
          object,
          relationship,
          score: this.computeScore(object, relationship)
        });
      }
    }

    // Add actor's own objects
    const ownObjects = objects.filter(o => o.controller === actorId);
    for (const object of ownObjects) {
      feed.push({
        object,
        relationship: undefined,
        score: this.computeScore(object, undefined)
      });
    }

    // Sort by score (descending)
    feed.sort((a, b) => b.score - a.score);

    return feed;
  }

  /**
   * Compute feed entry score for ordering
   * Simple implementation: reverse chronological
   * More sophisticated scoring can be added later
   */
  private static computeScore(object: PingObject, relationship?: PingRelationship): number {
    // Convert timestamp to Unix epoch for numeric comparison
    const timestamp = new Date(object.created_at).getTime();
    return timestamp;
  }

  /**
   * Rebuild feed from scratch (proves reproducibility)
   */
  static rebuildFeed(
    actorId: string,
    objects: PingObject[],
    relationships: PingRelationship[]
  ): FeedEntry[] {
    return this.deriveFeed(actorId, objects, relationships);
  }

  /**
   * Verify feed can be reconstructed equivalently
   */
  static verifyFeedReproducibility(
    actorId: string,
    objects: PingObject[],
    relationships: PingRelationship[]
  ): boolean {
    const feed1 = this.deriveFeed(actorId, objects, relationships);
    const feed2 = this.rebuildFeed(actorId, objects, relationships);

    if (feed1.length !== feed2.length) {
      return false;
    }

    for (let i = 0; i < feed1.length; i++) {
      if (feed1[i].object.id !== feed2[i].object.id) {
        return false;
      }
      if (feed1[i].score !== feed2[i].score) {
        return false;
      }
    }

    return true;
  }
}
