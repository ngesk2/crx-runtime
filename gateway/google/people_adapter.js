/**
 * Google People Adapter
 *
 * Thin adapter over Google People API (Contacts).
 * Normalizes Google contact records to a canonical Customer shape.
 * No storage, no events — pure data retrieval.
 *
 * Constitutional Constraint:
 * - Adapters contain no reasoning
 * - Adapters contain no storage
 * - Adapters contain no event emission
 * - Pure data normalization only
 */

const { google } = require('googleapis');

class GooglePeopleAdapter {
  /**
   * @param {Object} auth - OAuth2 credentials (access_token, refresh_token, etc.)
   * @param {Object} [options]
   * @param {string} [options.resourceName] - "people/me" or specific resource
   * @param {string[]} [options.personFields] - Fields to request
   */
  constructor(auth, options = {}) {
    this._auth = auth;
    this._resourceName = options.resourceName || 'people/me';
    this._personFields = options.personFields || [
      'names', 'emailAddresses', 'phoneNumbers', 'addresses',
      'organizations', 'birthdays', 'urls', 'biographies',
      'metadata', 'photos',
    ].join(',');
    this._dependencies = [];
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Fetch all contacts from Google People API.
   *
   * @param {Object} [params]
   * @param {number} [params.pageSize] - Results per page (max 1000)
   * @param {string} [params.pageToken] - Pagination token
   * @param {string} [params.syncToken] - Incremental sync token
   * @returns {Object} { contacts: Object[], nextPageToken: string|null, syncToken: string|null }
   */
  async executeFetchContacts({ pageSize = 100, pageToken, syncToken } = {}) {
    const people = google.people({ version: 'v1', auth: this._auth });

    const params = {
      resourceName: this._resourceName,
      personFields: this._personFields,
      pageSize,
    };

    if (pageToken) params.pageToken = pageToken;
    if (syncToken) params.syncToken = syncToken;

    const response = await people.people.connections.list(params);
    const connections = response.data.connections || [];

    const contacts = connections.map(c => this._normalizeContact(c));

    return {
      contacts,
      nextPageToken: response.data.nextPageToken || null,
      syncToken: response.data.nextSyncToken || null,
      totalEstimatedSize: response.data.totalPeople || contacts.length,
    };
  }

  /**
   * Fetch a single contact by resource name.
   *
   * @param {string} resourceName - e.g. "people/c1234567890"
   * @returns {Object|null} Normalized contact or null
   */
  async executeFetchContact(resourceName) {
    const people = google.people({ version: 'v1', auth: this._auth });

    try {
      const response = await people.people.get({
        resourceName,
        personFields: this._personFields,
      });
      return this._normalizeContact(response.data);
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Normalize a raw Google People contact to canonical shape.
   *
   * @param {Object} person - Raw Google People API response
   * @returns {Object} Normalized contact
   */
  _normalizeContact(person) {
    const names = person.names || [];
    const emails = person.emailAddresses || [];
    const phones = person.phoneNumbers || [];
    const addresses = person.addresses || [];
    const orgs = person.organizations || [];
    const birthdays = person.birthdays || [];
    const urls = person.urls || [];
    const bios = person.biographies || [];
    const photos = person.photos || [];
    const metadata = person.metadata || {};

    const primaryName = names.find(n => n.metadata?.primary) || names[0] || {};
    const primaryEmail = emails.find(e => e.metadata?.primary) || emails[0] || {};
    const primaryPhone = phones.find(p => p.metadata?.primary) || phones[0] || {};
    const primaryPhoto = photos.find(p => p.metadata?.primary) || photos[0] || {};
    const primaryOrg = orgs.find(o => o.metadata?.primary) || orgs[0] || {};

    return {
      source: 'google_people',
      source_id: person.resourceName,
      source_url: person.url || null,
      display_name: primaryName.displayName || null,
      given_name: primaryName.givenName || null,
      family_name: primaryName.familyName || null,
      email: primaryEmail.value || null,
      emails: emails.map(e => ({ value: e.value, type: e.type, primary: e.metadata?.primary || false })),
      phone: primaryPhone.value || null,
      phones: phones.map(p => ({ value: p.value, type: p.type, primary: p.metadata?.primary || false })),
      addresses: addresses.map(a => ({
        formatted_value: a.formattedValue || null,
        street: a.streetAddress || null,
        city: a.city || null,
        region: a.region || null,
        postal_code: a.postalCode || null,
        country: a.country || null,
        type: a.type || null,
      })),
      company: primaryOrg.name || null,
      title: primaryOrg.title || null,
      department: primaryOrg.department || null,
      photo_url: primaryPhoto.url || null,
      birthday: this._formatBirthday(birthdays[0]) || null,
      website: urls[0]?.value || null,
      biography: bios[0]?.value || null,
      etag: person.etag || null,
      metadata: {
        sources: (metadata.sources || []).map(s => ({
          type: s.type || null,
          id: s.id || null,
        })),
      },
    };
  }

  /**
   * Format birthday to ISO date string (YYYY-MM-DD).
   *
   * @param {Object} birthday
   * @returns {string|null}
   */
  _formatBirthday(birthday) {
    if (!birthday) return null;
    const date = birthday.date;
    if (!date) return null;
    const y = date.year || '0000';
    const m = String(date.month || 1).padStart(2, '0');
    const d = String(date.day || 1).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Health check — verify Google API is reachable.
   *
   * @returns {Object}
   */
  async health() {
    try {
      const people = google.people({ version: 'v1', auth: this._auth });
      await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names',
        pageSize: 1,
      });
      return { healthy: true, provider: 'google_people' };
    } catch (error) {
      return { healthy: false, provider: 'google_people', error: error.message };
    }
  }

  /**
   * Publish contract.
   */
  publishContract() {
    return {
      adapter_id: 'google-people',
      adapter_name: 'GooglePeopleAdapter',
      version: '1.0.0',
      owner: 'hpp',
      consumes: ['google_oauth_credentials'],
      produces: ['normalized_contacts'],
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

module.exports = { GooglePeopleAdapter };
