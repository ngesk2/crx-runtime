/**
 * PING Feed Projection
 * PATCH 6: Feed Is A Projection
 * PATCH 7B: visibility enforcement + deterministic ordering
 *
 * Derives feeds from canonical history (objects + relationships + visibility + ordering policy).
 * Feed can be destroyed and reconstructed from canonical history.
 *
 * Ordering contract: created_at DESC, then object_id DESC as the deterministic
 * tiebreak. Two derivations over the same canonical state always produce the
 * same order, regardless of input row order.
 *
 * Visibility contract:
 * - public: visible to everyone.
 * - followers: visible to the controller and to actors with an active
 *   follows relationship toward the controller.
 * - private: visible to the controller only.
 * - PING_ONLY is a recorded schema gap: it is NOT silently treated as
 *   followers or public. Objects carrying an unrecognized visibility are
 *   hidden from everyone except the controller (fail closed).
 */

import { PingObject, PingRelationship } from './schemas/ping-objects';

/**
 * Feed Entry
 */
export interface FeedEntry {
  object: PingObject;
  relationship?: PingRelationship;  // How this object entered the feed (e.g. "follows")
  score: number;  // For ordering
}

/**
 * PING Feed Projection
 */
export class PingFeedProjection {
  /**
   * Derive feed for an actor
   *
   * @param actorId - Actor to derive feed for (e.g. an identity ID)
   * @param objects - All objects in system
   * @param relationships - All relationships in system
   * @returns Feed entries in deterministic order (created_at DESC, object_id DESC)
   */
  static deriveFeed(
    actorId: string,
    objects: PingObject[],
    relationships: PingRelationship[]
  ): FeedEntry[] {
    const feed: FeedEntry[] = [];

    const activeRels = relationships.filter((r) => r.status === 'active');

    // Find all actors that the given actor follows
    const following = new Set(
      activeRels
        .filter((r) => r.subject === actorId && r.predicate === 'follows')
        .map((r) => r.object)
    );

    const followsController = (viewer: string, controller: string): boolean =>
      activeRels.some(
        (r) => r.subject === viewer && r.predicate === 'follows' && r.object === controller
      );

    for (const object of objects) {
      const own = object.controller === actorId;
      if (!this.isVisibleTo(object, actorId, own, followsController)) {
        continue;
      }
      if (own || following.has(object.controller)) {
        const relationship = activeRels.find(
          (r) => r.subject === actorId && r.predicate === 'follows' && r.object === object.controller
        );

        feed.push({
          object,
          relationship,
          score: this.computeScore(object, relationship)
        });
      }
    }

    // Deterministic order: newest first, object_id DESC breaks timestamp ties.
    feed.sort((a, b) => {
      const timeDiff =
        new Date(b.object.created_at).getTime() - new Date(a.object.created_at).getTime();
      if (timeDiff !== 0) {
        return timeDiff;
      }
      if (a.object.id === b.object.id) {
        return 0;
      }
      return a.object.id < b.object.id ? 1 : -1;
    });

    return feed;
  }

  /**
   * Visibility enforcement. Unknown visibility values fail closed: hidden
   * from everyone except the controller.
   */
  private static isVisibleTo(
    object: PingObject,
    actorId: string,
    own: boolean,
    followsController: (viewer: string, controller: string) => boolean
  ): boolean {
    const visibility = object.visibility ?? 'public';
    switch (visibility) {
      case 'public':
        return true;
      case 'followers':
        return own || followsController(actorId, object.controller);
      case 'private':
        return own;
      default:
        // PING_ONLY and any future value: fail closed until explicitly modeled.
        return own;
    }
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
