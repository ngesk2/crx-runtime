/**
 * Business Event Emitters — PING Core v1
 *
 * Thin wrappers that emit business events through the canonical UnifiedEventRuntime.
 * Each emitter integrates an existing business authority with the event pipeline.
 * No new infrastructure — just wiring.
 */

class ReviewEmitter {
  constructor(eventRuntime) { this._er = eventRuntime; }
  async received(review) {
    return this._er.emit('REVIEW_RECEIVED', 'review-authority', review);
  }
  async responded(reviewId, response) {
    return this._er.emit('REVIEW_RESPONDED', 'review-authority', { review_id: reviewId, response });
  }
}

class CustomerEmitter {
  constructor(eventRuntime) { this._er = eventRuntime; }
  async created(customer) {
    return this._er.emit('CUSTOMER_CREATED', 'customer-authority', customer);
  }
  async updated(customerId, changes) {
    return this._er.emit('CUSTOMER_UPDATED', 'customer-authority', { customer_id: customerId, changes });
  }
  async leadCreated(lead) {
    return this._er.emit('LEAD_CREATED', 'customer-authority', lead);
  }
  async leadConverted(leadId, projectId) {
    return this._er.emit('LEAD_CONVERTED', 'customer-authority', { lead_id: leadId, project_id: projectId });
  }
}

class ProjectEmitter {
  constructor(eventRuntime) { this._er = eventRuntime; }
  async created(project) {
    return this._er.emit('PROJECT_CREATED', 'project-authority', project);
  }
  async updated(projectId, status, changes) {
    return this._er.emit('PROJECT_UPDATED', 'project-authority', { project_id: projectId, status, changes });
  }
  async completed(projectId) {
    return this._er.emit('PROJECT_COMPLETED', 'project-authority', { project_id: projectId, completed_at: new Date().toISOString() });
  }
  async estimateCreated(estimate) {
    return this._er.emit('ESTIMATE_CREATED', 'project-authority', estimate);
  }
  async estimateSent(estimateId, sentTo) {
    return this._er.emit('ESTIMATE_SENT', 'project-authority', { estimate_id: estimateId, sent_to: sentTo });
  }
  async estimateAccepted(estimateId) {
    return this._er.emit('ESTIMATE_ACCEPTED', 'project-authority', { estimate_id: estimateId, accepted_at: new Date().toISOString() });
  }
  async invoiceCreated(invoice) {
    return this._er.emit('INVOICE_CREATED', 'project-authority', invoice);
  }
  async invoiceSent(invoiceId, sentTo) {
    return this._er.emit('INVOICE_SENT', 'project-authority', { invoice_id: invoiceId, sent_to: sentTo });
  }
  async invoicePaid(invoiceId, amount) {
    return this._er.emit('INVOICE_PAID', 'project-authority', { invoice_id: invoiceId, amount, paid_at: new Date().toISOString() });
  }
}

class ConnectorEmitter {
  constructor(eventRuntime) { this._er = eventRuntime; }
  async emailSent(to, subject) {
    return this._er.emit('EMAIL_SENT', 'email-connector', { to, subject });
  }
  async emailReceived(from, subject, body) {
    return this._er.emit('EMAIL_RECEIVED', 'email-connector', { from, subject, body });
  }
  async smsSent(to, body) {
    return this._er.emit('SMS_SENT', 'sms-connector', { to, body });
  }
  async googleReview(review) {
    return this._er.emit('GOOGLE_REVIEW_RECEIVED', 'google-connector', review);
  }
  async githubCommit(sha, message, author) {
    return this._er.emit('GITHUB_COMMIT_SYNCED', 'github-connector', { sha, message, author });
  }
}

class SystemEmitter {
  constructor(eventRuntime) { this._er = eventRuntime; }
  async healthCheck(component, status) {
    return this._er.emit('SYSTEM_HEALTH_CHECK', 'health-authority', { component, status });
  }
  async workerCompleted(worker, missionId, result) {
    return this._er.emit('WORKER_COMPLETED', 'worker-runtime', { worker, mission_id: missionId, result });
  }
  async workerFailed(worker, missionId, error) {
    return this._er.emit('WORKER_FAILED', 'worker-runtime', { worker, mission_id: missionId, error });
  }
}

module.exports = { ReviewEmitter, CustomerEmitter, ProjectEmitter, ConnectorEmitter, SystemEmitter };
