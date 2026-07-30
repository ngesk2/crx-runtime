/**
 * Google OAuth2 Authentication
 *
 * Single OAuth2 client for all Google Business Profile integrations.
 *
 * Constitutional Constraint:
 * - Single source of truth for Google credentials
 * - Tokens refreshed transparently by googleapis client
 * - No direct HTTP calls to Google APIs
 */

const { google } = require('googleapis');

class GoogleAuth {
  constructor(config = {}) {
    this._clientId = config.clientId || process.env.GOOGLE_CLIENT_ID;
    this._clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    this._redirectUri = config.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
    this._refreshToken = config.refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
    this._scopes = config.scopes || [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/plus.business.manage',
    ];
    this._oauth2Client = null;
  }

  get dependencies() {
    return [];
  }

  _createClient() {
    if (this._oauth2Client) return this._oauth2Client;

    this._oauth2Client = new google.auth.OAuth2(
      this._clientId,
      this._clientSecret,
      this._redirectUri,
    );

    if (this._refreshToken) {
      this._oauth2Client.setCredentials({
        refresh_token: this._refreshToken,
      });
    }

    return this._oauth2Client;
  }

  getClient() {
    return this._createClient();
  }

  getAuthUrl() {
    const client = this._createClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: this._scopes,
    });
  }

  async getTokenFromCode(code) {
    const client = this._createClient();
    const { tokens } = await client.getToken(code);
    this._oauth2Client.setCredentials(tokens);
    return tokens;
  }

  async getAccessToken() {
    const client = this._createClient();
    const { token } = await client.getAccessToken();
    return token;
  }
}

module.exports = { GoogleAuth };
