/**
 * Constitutional Capability Contract
 *
 * Defines stable capability categories that PING depends on.
 * Providers (Gmail, Outlook, Twilio, etc.) implement these contracts.
 * PING never depends on a provider — only on capabilities.
 *
 * Capabilities are constitutional — they don't change when providers change.
 */

const CAPABILITY_CONTRACTS = {

  // ── Communication ──────────────────────────────────────────────
  communication: {
    category: 'communication',
    description: 'Send and receive messages across channels',
    operations: {
      sendEmail: { params: { to: 'string', subject: 'string', body: 'string' }, returns: 'messageId' },
      readInbox: { params: { maxResults: 'number', folder: 'string' }, returns: 'messages[]' },
      sendSMS: { params: { to: 'string', body: 'string' }, returns: 'messageId' },
      sendPush: { params: { title: 'string', body: 'string', target: 'string' }, returns: 'notificationId' },
      sendSlack: { params: { channel: 'string', text: 'string', blocks: 'object' }, returns: 'messageTs' },
    },
    providers: ['gmail', 'outlook', 'twilio', 'slack', 'discord'],
    defaultProvider: null,
  },

  // ── Calendar ───────────────────────────────────────────────────
  calendar: {
    category: 'calendar',
    description: 'Manage schedules and appointments',
    operations: {
      listCalendars: { params: {}, returns: 'calendars[]' },
      listEvents: { params: { calendarId: 'string', timeMin: 'string', timeMax: 'string' }, returns: 'events[]' },
      createEvent: { params: { calendarId: 'string', summary: 'string', start: 'string', end: 'string' }, returns: 'eventId' },
      updateEvent: { params: { calendarId: 'string', eventId: 'string', changes: 'object' }, returns: 'eventId' },
      cancelEvent: { params: { calendarId: 'string', eventId: 'string' }, returns: 'ok' },
    },
    providers: ['google-calendar', 'outlook-calendar'],
    defaultProvider: null,
  },

  // ── CRM ────────────────────────────────────────────────────────
  crm: {
    category: 'crm',
    description: 'Manage customer relationships and pipeline',
    operations: {
      listContacts: { params: { query: 'string', limit: 'number' }, returns: 'contacts[]' },
      createContact: { params: { name: 'string', email: 'string', phone: 'string' }, returns: 'contactId' },
      updateContact: { params: { contactId: 'string', changes: 'object' }, returns: 'contactId' },
      logActivity: { params: { contactId: 'string', type: 'string', description: 'string' }, returns: 'activityId' },
      listDeals: { params: { pipeline: 'string', stage: 'string' }, returns: 'deals[]' },
    },
    providers: ['hubspot', 'salesforce', 'service-titan'],
    defaultProvider: null,
  },

  // ── Accounting ─────────────────────────────────────────────────
  accounting: {
    category: 'accounting',
    description: 'Invoicing, payments, and financial reports',
    operations: {
      createInvoice: { params: { customerId: 'string', items: 'object[]', dueDate: 'string' }, returns: 'invoiceId' },
      sendInvoice: { params: { invoiceId: 'string' }, returns: 'ok' },
      listInvoices: { params: { status: 'string', limit: 'number' }, returns: 'invoices[]' },
      getPaymentStatus: { params: { invoiceId: 'string' }, returns: 'status' },
      listTransactions: { params: { startDate: 'string', endDate: 'string' }, returns: 'transactions[]' },
    },
    providers: ['quickbooks', 'xero'],
    defaultProvider: null,
  },

  // ── Payments ───────────────────────────────────────────────────
  payments: {
    category: 'payments',
    description: 'Process and manage payments',
    operations: {
      processPayment: { params: { amount: 'number', currency: 'string', source: 'string' }, returns: 'paymentId' },
      refundPayment: { params: { paymentId: 'string', amount: 'number' }, returns: 'refundId' },
      listPayments: { params: { limit: 'number', status: 'string' }, returns: 'payments[]' },
      getPaymentMethod: { params: { customerId: 'string' }, returns: 'paymentMethods[]' },
    },
    providers: ['stripe', 'square'],
    defaultProvider: null,
  },

  // ── Documents ──────────────────────────────────────────────────
  documents: {
    category: 'documents',
    description: 'Store, search, and manage documents',
    operations: {
      uploadFile: { params: { name: 'string', mimeType: 'string', content: 'buffer' }, returns: 'fileId' },
      downloadFile: { params: { fileId: 'string' }, returns: 'buffer' },
      searchFiles: { params: { query: 'string', limit: 'number' }, returns: 'files[]' },
      createDocument: { params: { title: 'string', content: 'string', mimeType: 'string' }, returns: 'docId' },
      listFolder: { params: { folderId: 'string' }, returns: 'files[]' },
    },
    providers: ['google-drive', 'onedrive'],
    defaultProvider: null,
  },

  // ── Reviews ────────────────────────────────────────────────────
  reviews: {
    category: 'reviews',
    description: 'Collect, monitor, and respond to reviews',
    operations: {
      listReviews: { params: { platform: 'string', limit: 'number' }, returns: 'reviews[]' },
      respondToReview: { params: { reviewId: 'string', response: 'string' }, returns: 'ok' },
      getReviewStats: { params: { platform: 'string', period: 'string' }, returns: 'stats' },
      requestReview: { params: { customerId: 'string', platform: 'string' }, returns: 'requestId' },
    },
    providers: ['google-business-profile', 'facebook', 'yelp'],
    defaultProvider: null,
  },

  // ── Analytics ──────────────────────────────────────────────────
  analytics: {
    category: 'analytics',
    description: 'Track events, metrics, and business intelligence',
    operations: {
      trackEvent: { params: { event: 'string', properties: 'object' }, returns: 'ok' },
      queryMetrics: { params: { metric: 'string', timeRange: 'object', filters: 'object' }, returns: 'dataPoints[]' },
      createReport: { params: { title: 'string', metrics: 'string[]', filters: 'object' }, returns: 'reportId' },
      listDashboards: { params: {}, returns: 'dashboards[]' },
    },
    providers: ['posthog', 'google-analytics', 'mixpanel'],
    defaultProvider: null,
  },

  // ── Scheduling ─────────────────────────────────────────────────
  scheduling: {
    category: 'scheduling',
    description: 'Job scheduling, dispatch, and field service',
    operations: {
      createJob: { params: { customerId: 'string', description: 'string', scheduledDate: 'string' }, returns: 'jobId' },
      dispatchTechnician: { params: { jobId: 'string', technicianId: 'string' }, returns: 'ok' },
      updateJobStatus: { params: { jobId: 'string', status: 'string' }, returns: 'ok' },
      getSchedule: { params: { date: 'string', technicianId: 'string' }, returns: 'jobs[]' },
    },
    providers: ['service-titan', 'housecall-pro', 'jobber'],
    defaultProvider: null,
  },
};

/**
 * Get a capability contract by category.
 */
function getContract(category) {
  return CAPABILITY_CONTRACTS[category] || null;
}

/**
 * Get all operations for a capability category.
 */
function getOperations(category) {
  const contract = CAPABILITY_CONTRACTS[category];
  if (!contract) return null;
  return Object.keys(contract.operations);
}

/**
 * List all capability categories.
 */
function listCategories() {
  return Object.keys(CAPABILITY_CONTRACTS);
}

/**
 * Get all providers that can fulfill a capability.
 */
function getProvidersForCapability(category) {
  const contract = CAPABILITY_CONTRACTS[category];
  if (!contract) return [];
  return contract.providers;
}

/**
 * Check if a provider supports a capability.
 */
function providerSupportsCapability(category, providerName) {
  const contract = CAPABILITY_CONTRACTS[category];
  if (!contract) return false;
  return contract.providers.includes(providerName);
}

module.exports = {
  CAPABILITY_CONTRACTS,
  getContract,
  getOperations,
  listCategories,
  getProvidersForCapability,
  providerSupportsCapability,
};
