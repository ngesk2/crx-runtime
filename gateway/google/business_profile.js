/**
 * Google Business Profile Reviews Adapter
 *
 * Fetches reviews from Google Business Profile API,
 * maps them to CanonicalEventEnvelope format,
 * and emits REVIEW_RECEIVED events.
 *
 * Constitutional Constraint:
 * - All DB access via this._storage
 * - Events emitted via CanonicalEventEnvelope
 * - Authority operations, not CRUD
 * - Tenant isolation enforced
 */

const { google } = require('googleapis');
const { constitutionalTimeAuthority } = require('../../ping-runtime/authorities/constitutional_time_authority.js');

class BusinessProfileAdapter {
  constructor(storage, googleAuth, canonicalEventEnvelope) {
    this._storage = storage;
    this._auth = googleAuth;
    this._events = canonicalEventEnvelope;
    this._dependencies = ['storage', 'googleAuth', 'canonicalEventEnvelope'];
    this._authorityVersion = '1.0.0';
  }

  get dependencies() {
    return this._dependencies;
  }

  async initialize() {
    await this._storage.query(`
      CREATE TABLE IF NOT EXISTS google_reviews (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        reviewer_name TEXT,
        reviewer_profile_url TEXT,
        reviewer_photo_url TEXT,
        rating INTEGER,
        comment TEXT,
        review_reply TEXT,
        review_time TEXT NOT NULL,
        update_time TEXT,
        star_rating INTEGER,
        raw JSONB NOT NULL DEFAULT '{}',
        synced_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_google_reviews_tenant ON google_reviews (tenant_id);
      CREATE INDEX IF NOT EXISTS idx_google_reviews_location ON google_reviews (tenant_id, location_id);
    `);
    console.log('[BusinessProfileAdapter] Tables initialized');
  }

  _mybusiness() {
    const client = this._auth.getClient();
    return google.mybusiness({ version: 'v1', auth: client });
  }

  async executeFetchReviews(command) {
    const { tenantId, locationId, pageSize = 50, pageToken } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!locationId) throw new Error('locationId is required');

    const api = this._mybusiness();
    const params = {
      parent: `locations/${locationId}`,
      pageSize,
    };
    if (pageToken) params.pageToken = pageToken;

    const response = await api.locations.reviews.list(params);
    return response.data;
  }

  async executeSyncReviews(command) {
    const { tenantId, locationId } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!locationId) throw new Error('locationId is required');

    const data = await this.executeFetchReviews({ tenantId, locationId });
    const reviews = data.reviews || [];
    const stored = [];

    for (const review of reviews) {
      const mapped = this._mapReview(tenantId, locationId, review);
      await this._persist(mapped);
      await this._emitReviewReceived(tenantId, mapped);
      stored.push(mapped.review_id);
    }

    return {
      count: stored.length,
      reviews: stored,
      nextPageToken: data.nextPageToken || null,
    };
  }

  _mapReview(tenantId, locationId, raw) {
    return {
      review_id: raw.reviewId || raw.name?.split('/').pop(),
      tenant_id: tenantId,
      location_id: locationId,
      reviewer_name: raw.reviewer?.displayName || null,
      reviewer_profile_url: raw.reviewer?.profilePhotoUrl || null,
      star_rating: raw.starRating || null,
      rating: raw.starRating ? this._starToRating(raw.starRating) : null,
      comment: raw.comment || null,
      review_reply: raw.reviewReply?.comment || null,
      review_time: raw.createTime || constitutionalTimeAuthority.nowAsISOString(),
      update_time: raw.updateTime || null,
      raw,
    };
  }

  _starToRating(starRating) {
    const map = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
    };
    return map[starRating] || null;
  }

  async _persist(review) {
    await this._storage.query(
      `INSERT INTO google_reviews
       (id, tenant_id, location_id, reviewer_name, reviewer_profile_url,
        star_rating, comment, review_reply, review_time, update_time, rating, raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
        review_reply = EXCLUDED.review_reply,
        update_time = EXCLUDED.update_time,
        raw = EXCLUDED.raw,
        synced_at = NOW()`,
      [
        review.review_id, review.tenant_id, review.location_id,
        review.reviewer_name, review.reviewer_profile_url,
        review.star_rating, review.comment, review.review_reply,
        review.review_time, review.update_time, review.rating,
        JSON.stringify(review.raw),
      ],
    );
  }

  async _emitReviewReceived(tenantId, review) {
    await this._events.executeEmitEvent({
      tenantId,
      eventType: 'review.received',
      source: 'google-business-profile',
      actor: 'system',
      payload: {
        reviewId: review.review_id,
        locationId: review.location_id,
        reviewerName: review.reviewer_name,
        starRating: review.star_rating,
        rating: review.rating,
        comment: review.comment,
        reviewTime: review.review_time,
      },
      metadata: {
        adapter: 'google-business-profile',
        version: this._authorityVersion,
      },
    });
  }

  async executeListReviews(command) {
    const { tenantId, locationId, limit = 50 } = command;

    if (!tenantId) throw new Error('tenantId is required');

    let sql = 'SELECT * FROM google_reviews WHERE tenant_id = $1';
    const params = [tenantId];

    if (locationId) {
      params.push(locationId);
      sql += ` AND location_id = $${params.length}`;
    }

    sql += ' ORDER BY review_time DESC';
    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    const result = await this._storage.query(sql, params);
    return result.rows;
  }

  async executeGetReview(command) {
    const { tenantId, reviewId } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!reviewId) throw new Error('reviewId is required');

    const result = await this._storage.query(
      'SELECT * FROM google_reviews WHERE id = $1 AND tenant_id = $2',
      [reviewId, tenantId],
    );
    return result.rows[0] || null;
  }

  async executeReplyToReview(command) {
    const { tenantId, locationId, reviewId, replyText } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!locationId) throw new Error('locationId is required');
    if (!reviewId) throw new Error('reviewId is required');
    if (!replyText) throw new Error('replyText is required');

    const api = this._mybusiness();
    await api.locations.reviews.updateReply({
      name: `locations/${locationId}/reviews/${reviewId}`,
      requestBody: { comment: replyText },
    });

    await this._storage.query(
      `UPDATE google_reviews SET review_reply = $1, synced_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [replyText, reviewId, tenantId],
    );

    await this._events.executeEmitEvent({
      tenantId,
      eventType: 'review.replied',
      source: 'google-business-profile',
      actor: 'system',
      payload: {
        reviewId,
        locationId,
        replyText,
      },
      metadata: {
        adapter: 'google-business-profile',
        version: this._authorityVersion,
      },
    });

    return { reviewId, replyText };
  }

  async executeGetStats(command) {
    const { tenantId, locationId } = command;

    if (!tenantId) throw new Error('tenantId is required');

    let sql = `
      SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 2) as avg_rating,
        COUNT(*) FILTER (WHERE rating >= 4) as positive,
        COUNT(*) FILTER (WHERE rating <= 2) as negative,
        COUNT(*) FILTER (WHERE review_reply IS NOT NULL) as replied
      FROM google_reviews
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (locationId) {
      params.push(locationId);
      sql += ` AND location_id = $${params.length}`;
    }

    const result = await this._storage.query(sql, params);
    return result.rows[0];
  }
}

module.exports = { BusinessProfileAdapter };
