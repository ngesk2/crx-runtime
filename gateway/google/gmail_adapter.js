/**
 * Gmail Adapter
 *
 * Thin adapter over Gmail API (email threads).
 * Normalizes Gmail thread/message records to a canonical shape.
 * No storage, no events — pure data retrieval.
 *
 * Constitutional Constraint:
 * - Adapters contain no reasoning
 * - Adapters contain no storage
 * - Adapters contain no event emission
 * - Pure data normalization only
 */

const { google } = require('googleapis');

class GmailAdapter {
  /**
   * @param {Object} auth - OAuth2 credentials (access_token, refresh_token, etc.)
   * @param {Object} [options]
   * @param {string} [options.userId] - Gmail user ID ("me" for authenticated user)
   */
  constructor(auth, options = {}) {
    this._auth = auth;
    this._userId = options.userId || 'me';
    this._dependencies = [];
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Fetch email threads matching a query.
   *
   * @param {Object} [params]
   * @param {string} [params.query] - Gmail search query (e.g. "from:example.com")
   * @param {string} [params.labelIds] - Filter by label
   * @param {number} [params.maxResults] - Max threads (max 500)
   * @param {string} [params.pageToken] - Pagination token
   * @returns {Object} { threads: Object[], nextPageToken: string|null, totalEstimate: number }
   */
  async executeFetchThreads({ query, labelIds, maxResults = 100, pageToken } = {}) {
    const gmail = google.gmail({ version: 'v1', auth: this._auth });

    const listParams = {
      userId: this._userId,
      maxResults: Math.min(maxResults, 500),
    };

    if (query) listParams.q = query;
    if (labelIds) listParams.labelIds = labelIds;
    if (pageToken) listParams.pageToken = pageToken;

    const listResponse = await gmail.users.threads.list(listParams);
    const threadIds = listResponse.data.threads || [];

    const threads = await Promise.all(
      threadIds.map(t => this._fetchThread(gmail, t.id))
    );

    return {
      threads: threads.filter(Boolean),
      nextPageToken: listResponse.data.nextPageToken || null,
      totalEstimate: listResponse.data.resultSizeEstimate || threads.length,
    };
  }

  /**
   * Fetch a single thread by ID.
   *
   * @param {string} threadId
   * @returns {Object|null} Normalized thread or null
   */
  async executeFetchThread(threadId) {
    const gmail = google.gmail({ version: 'v1', auth: this._auth });
    return this._fetchThread(gmail, threadId);
  }

  /**
   * Fetch messages for a contact's email address.
   *
   * @param {string} email - Email address to search
   * @param {Object} [params]
   * @param {number} [params.maxResults]
   * @param {string} [params.after] - ISO date lower bound
   * @param {string} [params.before] - ISO date upper bound
   * @returns {Object} { threads: Object[], totalEstimate: number }
   */
  async executeFetchThreadsByEmail(email, { maxResults = 100, after, before } = {}) {
    const queryParts = [`from:${email} OR to:${email}`];
    if (after) queryParts.push(`after:${after}`);
    if (before) queryParts.push(`before:${before}`);

    return this.executeFetchThreads({
      query: queryParts.join(' '),
      maxResults,
    });
  }

  /**
   * Fetch a single thread and normalize it.
   *
   * @param {Object} gmail - Gmail API instance
   * @param {string} threadId
   * @returns {Object|null}
   */
  async _fetchThread(gmail, threadId) {
    try {
      const response = await gmail.users.threads.get({
        userId: this._userId,
        id: threadId,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date'],
      });
      return this._normalizeThread(response.data);
    } catch (error) {
      if (error.code === 404) return null;
      console.error(`[GmailAdapter] Failed to fetch thread ${threadId}:`, error.message);
      return null;
    }
  }

  /**
   * Normalize a raw Gmail thread to canonical shape.
   *
   * @param {Object} thread - Raw Gmail thread response
   * @returns {Object} Normalized thread
   */
  _normalizeThread(thread) {
    const messages = (thread.messages || []).map(m => this._normalizeMessage(m));
    const lastMessage = messages[messages.length - 1] || {};

    return {
      source: 'gmail',
      source_id: thread.id,
      thread_id: thread.id,
      subject: this._extractHeader(lastMessage._raw_headers, 'Subject') || '(no subject)',
      snippet: thread.snippet || null,
      message_count: messages.length,
      participants: this._extractParticipants(messages),
      last_message_at: lastMessage.date || null,
      last_sender: lastMessage.from || null,
      labels: lastMessage.labels || [],
      messages,
      etag: thread.etag || null,
    };
  }

  /**
   * Normalize a single Gmail message.
   *
   * @param {Object} message - Raw Gmail message
   * @returns {Object}
   */
  _normalizeMessage(message) {
    const headers = (message.payload?.headers || []);
    const headerMap = {};
    for (const h of headers) {
      headerMap[h.name.toLowerCase()] = h.value;
    }

    return {
      message_id: message.id,
      thread_id: message.threadId,
      date: headerMap.date || null,
      from: headerMap.from || null,
      to: headerMap.to || null,
      subject: headerMap.subject || null,
      labels: message.labelIds || [],
      snippet: message.snippet || null,
      _raw_headers: headers,
    };
  }

  /**
   * Extract unique participants from messages.
   *
   * @param {Object[]} messages
   * @returns {string[]}
   */
  _extractParticipants(messages) {
    const participants = new Set();
    for (const msg of messages) {
      if (msg.from) participants.add(msg.from);
      if (msg.to) {
        for (const addr of msg.to.split(',')) {
          participants.add(addr.trim());
        }
      }
    }
    return [...participants];
  }

  /**
   * Extract a header value by name.
   *
   * @param {Object[]} headers
   * @param {string} name
   * @returns {string|null}
   */
  _extractHeader(headers, name) {
    if (!headers) return null;
    const found = headers.find(h => h.name === name);
    return found ? found.value : null;
  }

  /**
   * Health check — verify Gmail API is reachable.
   *
   * @returns {Object}
   */
  async health() {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this._auth });
      await gmail.users.getProfile({ userId: this._userId });
      return { healthy: true, provider: 'gmail' };
    } catch (error) {
      return { healthy: false, provider: 'gmail', error: error.message };
    }
  }

  /**
   * Publish contract.
   */
  publishContract() {
    return {
      adapter_id: 'gmail',
      adapter_name: 'GmailAdapter',
      version: '1.0.0',
      owner: 'hpp',
      consumes: ['google_oauth_credentials'],
      produces: ['normalized_email_threads'],
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

module.exports = { GmailAdapter };
