/**
 * Google Calendar Adapter
 *
 * Thin adapter over Google Calendar API (events).
 * Normalizes Google calendar events to a canonical shape.
 * No storage, no events — pure data retrieval.
 *
 * Constitutional Constraint:
 * - Adapters contain no reasoning
 * - Adapters contain no storage
 * - Adapters contain no event emission
 * - Pure data normalization only
 */

const { google } = require('googleapis');

class GoogleCalendarAdapter {
  /**
   * @param {Object} auth - OAuth2 credentials (access_token, refresh_token, etc.)
   * @param {Object} [options]
   * @param {string} [options.calendarId] - Calendar ID ("primary" default)
   */
  constructor(auth, options = {}) {
    this._auth = auth;
    this._calendarId = options.calendarId || 'primary';
    this._dependencies = [];
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Fetch events from a calendar within a time range.
   *
   * @param {Object} [params]
   * @param {string} [params.timeMin] - ISO 8601 lower bound
   * @param {string} [params.timeMax] - ISO 8601 upper bound
   * @param {number} [params.maxResults] - Max events (max 2500)
   * @param {string} [params.pageToken] - Pagination token
   * @param {string} [params.query] - Free text search
   * @returns {Object} { events: Object[], nextPageToken: string|null }
   */
  async executeFetchEvents({ timeMin, timeMax, maxResults = 250, pageToken, query } = {}) {
    const calendar = google.calendar({ version: 'v3', auth: this._auth });

    const params = {
      calendarId: this._calendarId,
      maxResults: Math.min(maxResults, 2500),
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;
    if (pageToken) params.pageToken = pageToken;
    if (query) params.q = query;

    const response = await calendar.events.list(params);
    const items = response.data.items || [];

    return {
      events: items.map(e => this._normalizeEvent(e)),
      nextPageToken: response.data.nextPageToken || null,
    };
  }

  /**
   * Fetch events for a specific attendee email.
   *
   * @param {string} email - Attendee email
   * @param {Object} [params]
   * @param {string} [params.timeMin]
   * @param {string} [params.timeMax]
   * @param {number} [params.maxResults]
   * @returns {Object} { events: Object[], nextPageToken: string|null }
   */
  async executeFetchEventsByEmail(email, { timeMin, timeMax, maxResults = 250 } = {}) {
    const calendar = google.calendar({ version: 'v3', auth: this._auth });

    const params = {
      calendarId: this._calendarId,
      maxResults: Math.min(maxResults, 2500),
      singleEvents: true,
      orderBy: 'startTime',
      q: email,
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const response = await calendar.events.list(params);
    const items = response.data.items || [];

    const filtered = items.filter(e => {
      const attendees = (e.attendees || []).map(a => a.email.toLowerCase());
      return attendees.includes(email.toLowerCase());
    });

    return {
      events: filtered.map(e => this._normalizeEvent(e)),
      nextPageToken: response.data.nextPageToken || null,
    };
  }

  /**
   * Fetch a single event by ID.
   *
   * @param {string} eventId
   * @returns {Object|null}
   */
  async executeFetchEvent(eventId) {
    const calendar = google.calendar({ version: 'v3', auth: this._auth });

    try {
      const response = await calendar.events.get({
        calendarId: this._calendarId,
        eventId,
      });
      return this._normalizeEvent(response.data);
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Normalize a raw Google Calendar event to canonical shape.
   *
   * @param {Object} event - Raw Google Calendar event
   * @returns {Object} Normalized event
   */
  _normalizeEvent(event) {
    const start = this._parseDateTime(event.start);
    const end = this._parseDateTime(event.end);
    const attendees = (event.attendees || []).map(a => ({
      email: a.email,
      display_name: a.displayName || null,
      response_status: a.responseStatus || 'needsAction',
      is_organizer: a.organizer || false,
      is_resource: a.resource || false,
    }));

    return {
      source: 'google_calendar',
      source_id: event.id,
      calendar_id: event.organizer?.email || this._calendarId,
      summary: event.summary || null,
      description: event.description || null,
      location: event.location || null,
      start,
      end,
      duration_minutes: this._computeDuration(start, end),
      all_day: !event.start?.dateTime,
      status: event.status || 'confirmed',
      visibility: event.visibility || 'default',
      recurrence: event.recurrence || [],
      organizer: event.organizer ? {
        email: event.organizer.email,
        display_name: event.organizer.displayName || null,
        self: event.organizer.self || false,
      } : null,
      attendees,
      attendee_count: attendees.length,
      confirmed_count: attendees.filter(a => a.response_status === 'accepted').length,
      tentative_count: attendees.filter(a => a.response_status === 'tentative').length,
      declined_count: attendees.filter(a => a.response_status === 'declined').length,
      html_link: event.htmlLink || null,
      ical_uid: event.iCalUID || null,
      etag: event.etag || null,
      created: event.created || null,
      updated: event.updated || null,
    };
  }

  /**
   * Parse Google Calendar dateTime or date field.
   *
   * @param {Object} dt - start or end object
   * @returns {string|null} ISO 8601 string
   */
  _parseDateTime(dt) {
    if (!dt) return null;
    return dt.dateTime || dt.date || null;
  }

  /**
   * Compute duration in minutes between two ISO timestamps.
   *
   * @param {string} start
   * @param {string} end
   * @returns {number|null}
   */
  _computeDuration(start, end) {
    if (!start || !end) return null;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (isNaN(startMs) || isNaN(endMs)) return null;
    return Math.round((endMs - startMs) / 60000);
  }

  /**
   * Health check — verify Calendar API is reachable.
   *
   * @returns {Object}
   */
  async health() {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this._auth });
      await calendar.calendarList.get({ calendarId: this._calendarId });
      return { healthy: true, provider: 'google_calendar' };
    } catch (error) {
      return { healthy: false, provider: 'google_calendar', error: error.message };
    }
  }

  /**
   * Publish contract.
   */
  publishContract() {
    return {
      adapter_id: 'google-calendar',
      adapter_name: 'GoogleCalendarAdapter',
      version: '1.0.0',
      owner: 'hpp',
      consumes: ['google_oauth_credentials'],
      produces: ['normalized_calendar_events'],
      guarantees: ['thin_adapter', 'no_storage', 'no_events'],
      invariants: [
        'adapter contains no reasoning',
        'adapter contains no storage writes',
        'adapter contains no event emission',
        'output shape is stable across versions',
      ],
    };
  }
}

module.exports = { GoogleCalendarAdapter };
