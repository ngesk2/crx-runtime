/**
 * Google Connector — PING Core v1
 * 
 * Implements the standardized Connector interface for Google services.
 * Wraps existing Google adapters (Auth, BusinessProfile, People, Gmail, Calendar).
 * 
 * Capabilities: reviews, contacts, email, calendar, drive
 */

class GoogleConnector {
  /**
   * @param {object} options
   * @param {object} options.googleAuth — GoogleAuth instance
   * @param {object} options.businessProfile — BusinessProfileAdapter instance
   * @param {object} options.peopleAdapter — GooglePeopleAdapter instance
   * @param {object} options.gmailAdapter — GmailAdapter instance
   * @param {object} options.calendarAdapter — GoogleCalendarAdapter instance
   */
  constructor(options = {}) {
    this._googleAuth = options.googleAuth || null;
    this._businessProfile = options.businessProfile || null;
    this._peopleAdapter = options.peopleAdapter || null;
    this._gmailAdapter = options.gmailAdapter || null;
    this._calendarAdapter = options.calendarAdapter || null;
    this._authenticated = false;
  }

  /**
   * Authenticate with Google OAuth2.
   * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars.
   */
  async authenticate() {
    if (!this._googleAuth) {
      return { status: 'error', error: 'GoogleAuth not configured' };
    }
    try {
      const client = await this._googleAuth.getClient();
      this._authenticated = !!client;
      return { status: this._authenticated ? 'ok' : 'error' };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Discover available Google services and resources.
   */
  async discover() {
    const services = [];
    if (this._businessProfile) {
      services.push({ name: 'business-profile', capabilities: ['reviews', 'listings'] });
    }
    if (this._peopleAdapter) {
      services.push({ name: 'people', capabilities: ['contacts'] });
    }
    if (this._gmailAdapter) {
      services.push({ name: 'gmail', capabilities: ['email'] });
    }
    if (this._calendarAdapter) {
      services.push({ name: 'calendar', capabilities: ['events'] });
    }
    return { status: 'ok', services };
  }

  /**
   * Health check — verify Google API access.
   */
  async health() {
    if (!this._googleAuth) {
      return { status: 'not_configured', provider: 'google' };
    }
    try {
      await this._googleAuth.getClient();
      return { status: 'healthy', provider: 'google', authenticated: this._authenticated };
    } catch (err) {
      return { status: 'error', provider: 'google', error: err.message };
    }
  }

  /**
   * Sync data from Google services.
   * @param {string} service — 'business-profile' | 'people' | 'gmail' | 'calendar'
   * @param {object} options — service-specific sync options
   */
  async sync(service, options = {}) {
    switch (service) {
      case 'business-profile':
        return this._syncBusinessProfile(options);
      case 'people':
        return this._syncPeople(options);
      case 'gmail':
        return this._syncGmail(options);
      case 'calendar':
        return this._syncCalendar(options);
      default:
        return { status: 'error', error: `Unknown service: ${service}` };
    }
  }

  /**
   * Get events from Google services (canonical format).
   */
  async events(service, options = {}) {
    const syncResult = await this.sync(service, options);
    if (syncResult.status !== 'ok') return syncResult;

    // Convert to canonical events
    return {
      status: 'ok',
      events: (syncResult.data || []).map(item => ({
        source: `google.${service}`,
        type: this._inferEventType(service, item),
        timestamp: item.updated || item.created || new Date().toISOString(),
        payload: item,
      })),
    };
  }

  /**
   * Get objects from Google services (normalized format).
   */
  async objects(service, options = {}) {
    const syncResult = await this.sync(service, options);
    return syncResult;
  }

  /**
   * Search across Google services.
   */
  async search(q, options = {}) {
    // Google APIs don't have a universal search — delegate to specific service
    return this.sync(options.service || 'business-profile', { ...options, query: q });
  }

  /**
   * Get permissions/scopes for this connector.
   */
  async permissions() {
    return {
      scopes: [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      services: ['business-profile', 'people', 'gmail', 'calendar'],
    };
  }

  // --- Private sync methods ---

  async _syncBusinessProfile(options) {
    if (!this._businessProfile) {
      return { status: 'error', error: 'BusinessProfileAdapter not configured' };
    }
    try {
      const command = { tenantId: options.tenantId || 'default', locationId: options.locationId };
      const reviews = await this._businessProfile.executeFetchReviews(command);
      const items = reviews.reviews || reviews.data || (Array.isArray(reviews) ? reviews : []);
      return { status: 'ok', data: items, count: items.length };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async _syncPeople(options) {
    if (!this._peopleAdapter) {
      return { status: 'error', error: 'GooglePeopleAdapter not configured' };
    }
    try {
      const contacts = await this._peopleAdapter.executeFetchContacts(options);
      const items = contacts.connections || (Array.isArray(contacts) ? contacts : []);
      return { status: 'ok', data: items, count: items.length };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async _syncGmail(options) {
    if (!this._gmailAdapter) {
      return { status: 'error', error: 'GmailAdapter not configured' };
    }
    try {
      const threads = await this._gmailAdapter.executeFetchThreads(options);
      const items = threads.threads || (Array.isArray(threads) ? threads : []);
      return { status: 'ok', data: items, count: items.length };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  async _syncCalendar(options) {
    if (!this._calendarAdapter) {
      return { status: 'error', error: 'GoogleCalendarAdapter not configured' };
    }
    try {
      const events = await this._calendarAdapter.executeFetchEvents(options);
      const items = events.items || (Array.isArray(events) ? events : []);
      return { status: 'ok', data: items, count: items.length };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  _inferEventType(service, item) {
    switch (service) {
      case 'business-profile': return 'REVIEW_RECEIVED';
      case 'people': return 'CONTACT_SYNCED';
      case 'gmail': return 'EMAIL_SYNCED';
      case 'calendar': return 'EVENT_SYNCED';
      default: return 'DATA_SYNCED';
    }
  }
}

module.exports = { GoogleConnector };
