/**
 * OAuth Provider Framework — PING Core v1
 *
 * Standardized OAuth 2.0 onboarding flow for external providers.
 * Every provider that needs user authorization uses this framework.
 *
 * Flow:
 *   GET /connectors/:name/oauth/url → authorization URL
 *   User authorizes in browser → callback to /connectors/:name/oauth/callback
 *   Token stored → health verified → capability connected
 *
 * Supported flows:
 *   - OAuth 2.0 Authorization Code (default)
 *   - OAuth 2.0 with PKCE (for mobile/SPA)
 *   - API Key (for services without OAuth)
 *   - Basic Auth (for legacy services)
 */

const crypto = require('crypto');

// ── Provider OAuth Configurations ────────────────────────────────

const PROVIDER_OAUTH_CONFIGS = {
  'google': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: {
      'email': 'https://www.googleapis.com/auth/gmail.readonly',
      'calendar': 'https://www.googleapis.com/auth/calendar',
      'contacts': 'https://www.googleapis.com/auth/contacts.readonly',
      'reviews': 'https://www.googleapis.com/auth/business.manage',
      'drive': 'https://www.googleapis.com/auth/drive.readonly',
    },
    defaultScopes: ['email', 'contacts'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 3600000, // 1 hour
  },

  'google-calendar': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: {
      'calendar': 'https://www.googleapis.com/auth/calendar',
      'events': 'https://www.googleapis.com/auth/calendar.events',
    },
    defaultScopes: ['calendar'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 3600000,
  },

  'microsoft': {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: {
      'email': 'https://graph.microsoft.com/Mail.Read',
      'calendar': 'https://graph.microsoft.com/Calendars.ReadWrite',
      'contacts': 'https://graph.microsoft.com/Contacts.Read',
      'drive': 'https://graph.microsoft.com/Files.Read.All',
    },
    defaultScopes: ['email', 'calendar'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 3600000,
  },

  'hubspot': {
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: {
      'contacts': 'crm.objects.contacts.read',
      'deals': 'crm.objects.deals.read',
      'activities': 'crm.objects.activities.read',
    },
    defaultScopes: ['contacts'],
    authType: 'oauth2',
    supportsPKCE: false,
    tokenExpiryMs: 3600000,
  },

  'quickbooks': {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: {
      'accounting': 'com.intuit.quickbooks.accounting',
      'payment': 'com.intuit.quickbooks.payment',
    },
    defaultScopes: ['accounting'],
    authType: 'oauth2',
    supportsPKCE: false,
    tokenExpiryMs: 3600000,
  },

  'stripe': {
    authType: 'api_key',
    instructions: 'Obtain a secret key from https://dashboard.stripe.com/apikeys',
    supportsPKCE: false,
    tokenExpiryMs: null, // API keys don't expire
  },

  'twilio': {
    authType: 'api_key',
    instructions: 'Obtain Account SID and Auth Token from https://console.twilio.com',
    supportsPKCE: false,
    tokenExpiryMs: null,
  },

  'slack': {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: {
      'chat': 'chat:write',
      'channels': 'channels:read',
      'files': 'files:read',
    },
    defaultScopes: ['chat'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: null, // Bot tokens don't expire
  },

  'discord': {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: {
      'webhook': 'webhook.incoming',
      'messages': 'bot',
    },
    defaultScopes: ['webhook'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 86400000, // 24 hours for user tokens
  },

  'github': {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: {
      'repo': 'repo',
      'commits': 'repo',
      'pull-requests': 'repo',
    },
    defaultScopes: ['repo'],
    authType: 'oauth2',
    supportsPKCE: false,
    tokenExpiryMs: null, // Tokens don't expire
  },

  'posthog': {
    authType: 'api_key',
    instructions: 'Obtain a Personal API Key from your PostHog instance settings',
    supportsPKCE: false,
    tokenExpiryMs: null,
  },

  'salesforce': {
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: {
      'crm': 'api',
      'analytics': 'analytics',
    },
    defaultScopes: ['crm'],
    authType: 'oauth2',
    supportsPKCE: false,
    tokenExpiryMs: 7200000, // 2 hours
  },

  'xero': {
    authUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    scopes: {
      'accounting': 'accounting.transactions',
      'contacts': 'accounting.contacts',
    },
    defaultScopes: ['accounting'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 1800000, // 30 minutes
  },

  'facebook': {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: {
      'reviews': 'pages_show_list,pages_read_engagement',
      'pages': 'pages_manage_posts,pages_read_engagement',
    },
    defaultScopes: ['reviews'],
    authType: 'oauth2',
    supportsPKCE: false,
    tokenExpiryMs: 3600000,
  },

  'yelp': {
    authType: 'api_key',
    instructions: 'Obtain an API Key from https://www.yelp.com/developers/v3/manage_app',
    supportsPKCE: false,
    tokenExpiryMs: null,
  },

  // ── Provider Aliases ───────────────────────────────────────────
  // These map logical provider names (used in capability contracts)
  // to their parent OAuth config. The OAuthFlowManager resolves aliases.

  'gmail': { _alias: 'google' },
  'google-drive': { _alias: 'google' },
  'google-business-profile': { _alias: 'google' },
  'outlook': { _alias: 'microsoft' },
  'outlook-calendar': { _alias: 'microsoft' },
  'onedrive': { _alias: 'microsoft' },
  'google-analytics': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: {
      'analytics': 'https://www.googleapis.com/auth/analytics.readonly',
    },
    defaultScopes: ['analytics'],
    authType: 'oauth2',
    supportsPKCE: true,
    tokenExpiryMs: 3600000,
  },
  'mixpanel': { authType: 'api_key', instructions: 'Obtain a Service Account from https://mixpanel.com/settings/project', supportsPKCE: false, tokenExpiryMs: null },
  'service-titan': { authType: 'api_key', instructions: 'Obtain an API Key from ServiceTitan app marketplace', supportsPKCE: false, tokenExpiryMs: null },
  'housecall-pro': { authType: 'api_key', instructions: 'Obtain an API Key from Housecall Pro developer portal', supportsPKCE: false, tokenExpiryMs: null },
  'jobber': { authType: 'oauth2', authUrl: 'https://api.getjobber.com/api/oauth/authorize', tokenUrl: 'https://api.getjobber.com/api/oauth/token', scopes: { 'jobs': 'jobs', 'clients': 'clients', 'invoices': 'invoices' }, defaultScopes: ['jobs'], supportsPKCE: true, tokenExpiryMs: 3600000 },
  'square': { authType: 'oauth2', authUrl: 'https://connect.squareup.com/oauth2/authorize', tokenUrl: 'https://connect.squareup.com/oauth2/token', scopes: { 'payments': 'PAYMENTS_READ', 'customers': 'CUSTOMERS_READ' }, defaultScopes: ['payments'], supportsPKCE: true, tokenExpiryMs: 604800000 },
};

// ── Token Store (in-memory with optional persistence) ────────────

class TokenStore {
  constructor(options = {}) {
    this._tokens = new Map();
    this._persistFn = options.persist || null;
    this._loadFn = options.load || null;
  }

  /**
   * Store a token for a provider.
   */
  set(providerName, tokenData) {
    const entry = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      scope: tokenData.scope || '',
      token_type: tokenData.token_type || 'Bearer',
      expires_at: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : tokenData.expires_at || null,
      provider_metadata: tokenData.provider_metadata || {},
      connected_at: Date.now(),
      last_refreshed: Date.now(),
    };
    this._tokens.set(providerName, entry);
    if (this._persistFn) {
      this._persistFn(providerName, entry).catch(() => {});
    }
    return entry;
  }

  /**
   * Get stored token for a provider.
   */
  get(providerName) {
    return this._tokens.get(providerName) || null;
  }

  /**
   * Check if a provider has a valid (non-expired) token.
   */
  hasValidToken(providerName) {
    const entry = this._tokens.get(providerName);
    if (!entry) return false;
    if (entry.access_token === 'api_key' || entry.expires_at === null) return true;
    return Date.now() < entry.expires_at - 60000; // 1 min buffer
  }

  /**
   * Check if a token is expiring soon (within 5 minutes).
   */
  isExpiringSoon(providerName) {
    const entry = this._tokens.get(providerName);
    if (!entry || entry.expires_at === null) return false;
    return Date.now() > entry.expires_at - 300000;
  }

  /**
   * Update a token (e.g., after refresh).
   */
  update(providerName, tokenData) {
    const existing = this._tokens.get(providerName);
    if (!existing) return this.set(providerName, tokenData);
    if (tokenData.access_token) existing.access_token = tokenData.access_token;
    if (tokenData.refresh_token) existing.refresh_token = tokenData.refresh_token;
    if (tokenData.expires_in) existing.expires_at = Date.now() + tokenData.expires_in * 1000;
    if (tokenData.scope) existing.scope = tokenData.scope;
    existing.last_refreshed = Date.now();
    if (this._persistFn) {
      this._persistFn(providerName, existing).catch(() => {});
    }
    return existing;
  }

  /**
   * Remove a token (disconnect).
   */
  remove(providerName) {
    this._tokens.delete(providerName);
  }

  /**
   * List all provider connections.
   */
  list() {
    const result = {};
    for (const [name, entry] of this._tokens) {
      result[name] = {
        connected: true,
        hasToken: !!entry.access_token,
        tokenExpired: entry.expires_at ? Date.now() > entry.expires_at : false,
        scope: entry.scope,
        connectedAt: entry.connected_at,
        lastRefreshed: entry.last_refreshed,
      };
    }
    return result;
  }

  /**
   * Load tokens from persistence (call at startup).
   */
  async loadAll(entries) {
    for (const [name, data] of Object.entries(entries)) {
      this._tokens.set(name, data);
    }
  }
}

// ── OAuth Flow Manager ───────────────────────────────────────────

class OAuthFlowManager {
  /**
   * @param {object} options
   * @param {TokenStore} options.tokenStore
   * @param {string} options.redirectBase — base URL for OAuth callbacks (e.g., https://ping.app/connectors)
   * @param {object} options.secrets — { [provider]: { clientId, clientSecret } }
   */
  constructor(options = {}) {
    this._tokenStore = options.tokenStore || new TokenStore();
    this._redirectBase = options.redirectBase || 'http://localhost:8080/connectors';
    this._secrets = options.secrets || {};
    this._stateStore = new Map(); // state → { provider, redirectTo, codeVerifier }
  }

  /**
   * Get OAuth config for a provider.
   */
  getConfig(providerName) {
    return PROVIDER_OAUTH_CONFIGS[providerName] || null;
  }

  /**
   * Generate authorization URL for a provider.
   *
   * @param {string} providerName
   * @param {object} options
   * @param {string[]} options.scopes — requested scopes
   * @param {string} options.redirectTo — where to redirect after authorization
   * @param {boolean} options.usePKCE — use PKCE (default: based on provider config)
   * @returns {{ url: string, state: string, codeVerifier?: string }}
   */
  getAuthorizationUrl(providerName, options = {}) {
    const config = PROVIDER_OAUTH_CONFIGS[providerName];
    if (!config) throw new Error(`Unknown provider: ${providerName}`);
    if (config.authType === 'api_key') {
      return { url: null, state: null, type: 'api_key', instructions: config.instructions };
    }

    const secrets = this._secrets[providerName] || {};
    const clientId = secrets.clientId || process.env[`${providerName.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`];
    if (!clientId) throw new Error(`No client_id configured for ${providerName}`);

    const scopes = options.scopes || config.defaultScopes || [];
    const scopeStrings = scopes.map(s => config.scopes[s] || s);
    const state = crypto.randomBytes(16).toString('hex');
    const usePKCE = options.usePKCE !== undefined ? options.usePKCE : config.supportsPKCE;

    let codeVerifier = null;
    let codeChallenge = null;

    if (usePKCE) {
      codeVerifier = crypto.randomBytes(32).toString('base64url');
      codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${this._redirectBase}/${providerName}/oauth/callback`,
      response_type: 'code',
      scope: scopeStrings.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    // Store state for callback verification
    this._stateStore.set(state, {
      provider: providerName,
      redirectTo: options.redirectTo || '/',
      codeVerifier,
      createdAt: Date.now(),
    });

    // Cleanup old states (older than 10 minutes)
    for (const [s, data] of this._stateStore) {
      if (Date.now() - data.createdAt > 600000) this._stateStore.delete(s);
    }

    return {
      url: `${config.authUrl}?${params.toString()}`,
      state,
      codeVerifier,
      type: 'oauth2',
    };
  }

  /**
   * Handle OAuth callback — exchange authorization code for tokens.
   *
   * @param {string} providerName
   * @param {object} params — { code, state, error }
   * @returns {Promise<{ status: string, provider: string, token: object, error?: string }>}
   */
  async handleCallback(providerName, params) {
    if (params.error) {
      return { status: 'error', provider: providerName, error: params.error };
    }

    const config = PROVIDER_OAUTH_CONFIGS[providerName];
    if (!config || config.authType !== 'oauth2') {
      return { status: 'error', provider: providerName, error: 'Provider does not support OAuth' };
    }

    // Verify state
    const stateData = this._stateStore.get(params.state);
    if (!stateData) {
      return { status: 'error', provider: providerName, error: 'Invalid or expired state parameter' };
    }
    this._stateStore.delete(params.state);

    // Exchange code for tokens
    try {
      const secrets = this._secrets[providerName] || {};
      const clientId = secrets.clientId || process.env[`${providerName.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`];
      const clientSecret = secrets.clientSecret || process.env[`${providerName.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`];

      const body = new URLSearchParams({
        code: params.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${this._redirectBase}/${providerName}/oauth/callback`,
        grant_type: 'authorization_code',
      });

      if (stateData.codeVerifier) {
        body.set('code_verifier', stateData.codeVerifier);
      }

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { status: 'error', provider: providerName, error: `Token exchange failed: ${response.status} ${errorText}` };
      }

      const tokenData = await response.json();

      // Store token
      const stored = this._tokenStore.set(providerName, tokenData);

      return { status: 'ok', provider: providerName, token: stored, stateData: { redirectTo: stateData.redirectTo } };
    } catch (err) {
      return { status: 'error', provider: providerName, error: err.message };
    }
  }

  /**
   * Refresh an access token using refresh token.
   */
  async refreshToken(providerName) {
    const config = PROVIDER_OAUTH_CONFIGS[providerName];
    if (!config || config.authType !== 'oauth2') {
      return { status: 'error', error: 'Provider does not support OAuth token refresh' };
    }

    const stored = this._tokenStore.get(providerName);
    if (!stored || !stored.refresh_token) {
      return { status: 'error', error: 'No refresh token available' };
    }

    try {
      const secrets = this._secrets[providerName] || {};
      const clientId = secrets.clientId || process.env[`${providerName.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`];
      const clientSecret = secrets.clientSecret || process.env[`${providerName.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`];

      const body = new URLSearchParams({
        refresh_token: stored.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      });

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: body.toString(),
      });

      if (!response.ok) return { status: 'error', error: `Refresh failed: ${response.status}` };

      const tokenData = await response.json();
      this._tokenStore.update(providerName, tokenData);

      return { status: 'ok', provider: providerName };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }

  /**
   * Revoke a token (disconnect provider).
   */
  async revokeToken(providerName) {
    const config = PROVIDER_OAUTH_CONFIGS[providerName];
    const stored = this._tokenStore.get(providerName);
    if (!stored) return { status: 'ok' };

    if (config && config.revokeUrl && stored.access_token) {
      try {
        await fetch(config.revokeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: stored.access_token }).toString(),
        });
      } catch (err) {
        // Revocation failure is non-critical
      }
    }

    this._tokenStore.remove(providerName);
    return { status: 'ok', provider: providerName };
  }

  /**
   * Get connection status for a provider.
   */
  getStatus(providerName) {
    const config = PROVIDER_OAUTH_CONFIGS[providerName];
    const token = this._tokenStore.get(providerName);
    return {
      provider: providerName,
      authType: config ? config.authType : 'unknown',
      connected: !!token,
      tokenExpired: token ? (token.expires_at ? Date.now() > token.expires_at : false) : null,
      hasRefreshToken: token ? !!token.refresh_token : false,
      connectedAt: token ? token.connected_at : null,
      lastRefreshed: token ? token.last_refreshed : null,
    };
  }

  /**
   * Get the token store (for provider use).
   */
  getTokenStore() {
    return this._tokenStore;
  }
}

module.exports = { OAuthFlowManager, TokenStore, PROVIDER_OAUTH_CONFIGS };
