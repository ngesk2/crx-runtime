/**
 * Review Moderation Authority
 *
 * Delegates to BusinessProfileAdapter for Google Business Profile reviews.
 * Single point of entry for all review operations in HPP.
 *
 * Constitutional Constraint:
 * - Authority operations, not CRUD
 * - Tenant isolation enforced
 * - All DB access via this._storage
 * - Events emitted via CanonicalEventEnvelope
 */

class ReviewAuthority {
  constructor(storage, canonicalEventEnvelope, businessProfileAdapter) {
    this._storage = storage;
    this._events = canonicalEventEnvelope;
    this._adapter = businessProfileAdapter;
    this._dependencies = ['storage', 'canonicalEventEnvelope', 'businessProfileAdapter'];
    this._authorityVersion = '1.0.0';
  }

  get dependencies() {
    return this._dependencies;
  }

  async initialize() {
    await this._adapter.initialize();
    await this._storage.query(`
      CREATE TABLE IF NOT EXISTS review_flags (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        review_id TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT 'manual',
        flagged_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, review_id)
      );
      CREATE INDEX IF NOT EXISTS idx_review_flags_tenant ON review_flags (tenant_id);
    `);
    console.log('[ReviewAuthority] Initialized');
  }

  async executeSyncReviews(command) {
    return this._adapter.executeSyncReviews(command);
  }

  async executeListReviews(command) {
    return this._adapter.executeListReviews(command);
  }

  async executeGetReview(command) {
    return this._adapter.executeGetReview(command);
  }

  async executeReplyToReview(command) {
    return this._adapter.executeReplyToReview(command);
  }

  async executeGetStats(command) {
    return this._adapter.executeGetStats(command);
  }

  async executeFlagReview(command) {
    const { tenantId, reviewId, reason } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!reviewId) throw new Error('reviewId is required');

    await this._storage.query(
      `INSERT INTO review_flags (id, tenant_id, review_id, reason, flagged_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (tenant_id, review_id) DO UPDATE SET
        reason = EXCLUDED.reason,
        flagged_at = NOW()`,
      [`flag_${tenantId}_${reviewId}`, tenantId, reviewId, reason || 'manual'],
    );

    await this._events.executeEmitEvent({
      tenantId,
      eventType: 'review.flagged',
      source: 'review-authority',
      actor: 'system',
      payload: {
        reviewId,
        reason: reason || 'manual',
      },
      metadata: {
        authority: 'review-authority',
        version: this._authorityVersion,
      },
    });

    return { reviewId, flagged: true };
  }

  async executeDismissFlag(command) {
    const { tenantId, reviewId } = command;

    if (!tenantId) throw new Error('tenantId is required');
    if (!reviewId) throw new Error('reviewId is required');

    await this._storage.query(
      'DELETE FROM review_flags WHERE tenant_id = $1 AND review_id = $2',
      [tenantId, reviewId],
    );

    return { reviewId, dismissed: true };
  }
}

module.exports = { ReviewAuthority };
