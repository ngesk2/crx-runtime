# Google Drive OAuth Audit

## Credential File

| Field | Value |
|---|---|
| Path | `credentials/client_secret.json` |
| Status | EXISTS |
| OAuth Client Type | `installed` (Desktop App) |
| Project ID | `high-gecko-498903-j7` |
| Project Number | `230394088332` |
| Client ID Prefix | `230394088332-ub33i6uc...` |
| Auth URI | `https://accounts.google.com/o/oauth2/auth` |
| Token URI | `https://oauth2.googleapis.com/token` |
| Redirect URIs | `["http://localhost"]` |

## Scopes Configured

| Scope | Purpose | Status |
|---|---|---|
| `drive.readonly` | Read file metadata and content | Granted |
| `drive.metadata.readonly` | Read file metadata only | Granted |

## Token File

| Field | Value |
|---|---|
| Path | `token.json` |
| Prior State | `{}` (empty) |
| Current State | Valid token with access_token and refresh_token |
| Access Token | PRESENT (253 chars) |
| Refresh Token | PRESENT |
| Expires In | 3599 seconds (1 hour) |
| Token Type | Bearer |

## OAuth Client Configuration

- Drive API was initially disabled — had to be enabled at:
  `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=230394088332`
- Project owner permissions required to enable
