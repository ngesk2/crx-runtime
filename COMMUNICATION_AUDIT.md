# BrainOS Communication Architecture Audit

**Date:** 2026-06-24  
**Method:** Source code analysis (Python, TypeScript, config files, env files, compose files), container inspection, package analysis  
**Scope:** All outbound and inbound communication paths. Read-only. No sends, no migrations, no modifications.

---

## 1. Yahoo Connectivity — SMTP Configuration

### Finding: SMTP does not exist

There is **no SMTP configuration** anywhere in the codebase. No `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` variables exist in:

| Location | Result |
|---|---|
| `.env` files (8 files) | **Not found** |
| `.yml` / `.yaml` / `.json` config files | **Not found** |
| Python source files | **Not found** |
| Shell / PowerShell scripts | **Not found** |

The `.env` at `brainos/newsletter/.env` contains:
```
YAHOO_EMAIL=nolan.geske@yahoo.com
YAHOO_APP_PASSWORD=<REDACTED_YAHOO_APP_PASSWORD>
```

These are **IMAP credentials** (inbound retrieval), not SMTP (outbound sending).

### Credential discovery across the entire codebase

| Credential | Appears In | Purpose | SecretAdapter? |
|---|---|---|---|
| `YAHOO_EMAIL` | `app_container.py:299`, `mission_control/app.py:316`, `yahoo_client.py:16`, `validate_yahoo_credentials.py:16`, `inspect_newsletters.py:50` | IMAP login | **No** — always `os.getenv()` |
| `YAHOO_APP_PASSWORD` | `app_container.py:300`, `mission_control/app.py:317`, `yahoo_client.py:17`, `validate_yahoo_credentials.py:17`, `inspect_newsletters.py:51` | IMAP app password | **No** — always `os.getenv()` |
| `SMTP_PASSWORD` / `SMTP_USER` | **None** | N/A | N/A |
| `EMAIL_PASSWORD` / `APP_PASSWORD` | **None** | N/A | N/A |

**All 5 files** that read Yahoo credentials use `os.getenv()` directly. Zero use `SecretAdapter`.

---

## 2. Communication Implementations — Complete Inventory

### Outbound (Send) — ZERO

| Technology | Files Found | Status |
|---|---|---|
| `smtplib` | 0 | **Not used** |
| `MIMEText` / `MIMEMultipart` / `EmailMessage` | 0 | **Not used** |
| `nodemailer` | 0 | **Not used** |
| `sendgrid` | 0 | **Not referenced** |
| `mailgun` | 0 | **Not referenced** |
| `resend` | 0 | **Not referenced** |
| `webhook` / `slack` / `discord` / `telegram` / `twilio` / `sms` | 0 | **Not referenced** |
| `EmailAdapter` / `SMTPProvider` / `MailProvider` / `NotificationAdapter` | 0 | **Not defined** |

**BrainOS has zero outbound communication capability.** No email sending, no notifications, no webhooks, no push alerts. None.

### Inbound (Receive) — IMAP Only

| File | Purpose | Status |
|---|---|---|
| `brainos/newsletter/yahoo_client.py` | IMAP connection, fetch unread, parse RFC822, extract body/subject/sender/message_id | **Functional** (requires `.env` credentials) |
| `brainos/newsletter/worker.py` | Polling loop (900s cycle), ingest → analyze → archive → digest | **NOT DEPLOYED** — no Docker container running |
| `brainos/newsletter/validate_yahoo_credentials.py` | Connection + inbox count test | **Script only** |
| `brainos/newsletter/inspect_newsletters.py` | Manual inbox inspection tool | **Script only** |
| `brainos/newsletter/process_newsletters.py` | Batch processor | **Script only** |

---

## 3. Retrieval — Does It Exist?

### Yes, but only for newsletters via IMAP

The `YahooMailClient` class at `brainos/newsletter/yahoo_client.py:12` provides:

| Method | What It Returns |
|---|---|
| `connect()` | Logs into `imap.mail.yahoo.com:993` |
| `fetch_unread_newsletters()` | List of dicts with `message_id`, `subject`, `sender`, `body`, `word_count`, `received_at` |
| `test_connection()` | Boolean |
| `disconnect()` | Closes IMAP session |

### What retrieval does NOT do:

- **No `message_id` tracking** — `Message-ID` header is optional; falls back to concatenating sender+subject (line 122)
- **No delivery status** — No SMTP means no `DSN` (Delivery Status Notification) retrieval
- **No failure reason retrieval** — No bounce/undeliverable inbox scanning
- **No retry state** — No concept of email send → retry → fail cycle
- **No persistent IMAP ID tracking** — Uses `UNSEEN` search flag, not UID-based tracking

### Retrieval scope is limited to: **Newsletter ingestion only.**

BrainOS currently retrieves newsletters from Yahoo Mail's INBOX for analysis/summarization. It does NOT retrieve:
- Delivery confirmations
- Bounce notifications
- User replies
- Password resets or OTPs
- Any other email type

---

## 4. Event Integration — Are Emails in the Constitutional Graph?

### Finding: Yes, for newsletters. No, for everything else.

Email events exist exclusively under the `'yahoo'` stream:

| Event Type | Defined In | Emitted By |
|---|---|---|
| `INGESTION_CYCLE_STARTED` | `event_emitter.py` (dynamic) | `worker.py:21` |
| `WORKER_HEARTBEAT` | `event_emitter.py` (dynamic) | `worker.py:26` |
| `NEWSLETTER_CREATED` | `event_emitter.py:188` | `database.py:107` (via `save_raw_newsletter`) |
| `DIGEST_GENERATED` | `event_emitter.py:189` | `database.py:275` (via `save_digest`) |
| `ARCHIVE_WRITTEN` | `event_emitter.py:190` | `archive.py` |
| `RAW_YAHOO_PAYLOAD` | `event_emitter.py:345` | (defined but call site unknown) |
| `NEWSLETTER_PROCESSING_FAILED` | `event_emitter.py:396` | (defined but call site unknown) |
| `DATABASE_WRITE_FAILED` | `event_emitter.py` (dynamic) | `database.py:118,176` |

### What's missing:

| Event Type | Should Exist | Status |
|---|---|---|
| `EMAIL_SEND_REQUESTED` | Initiate outbound email | **Does not exist** — no sending at all |
| `EMAIL_SENT` | Confirm delivery | **Does not exist** |
| `EMAIL_DELIVERED` | DSN receipt | **Does not exist** |
| `EMAIL_FAILED` | Bounce / reject | **Does not exist** |
| `EMAIL_RETRYING` | Retry attempt | **Does not exist** |
| `NOTIFICATION_SENT` | Any outbound notification | **Does not exist** |

**Supported streams** (from `event_emitter.py:161-168`): `rss`, `yahoo`, `ollama`, `gateway`, `replay`, `storage`. No `email` or `notification` stream exists.

---

## 5. Retrieval Authority

### Current state: **IMAP-only, newsletter-scoped, event-tracked**

| Property | Capability |
|---|---|
| Can retrieve `message_id`? | ✅ Yes — from `Message-ID` header, with fallback |
| Can retrieve delivery status? | ❌ No — no SMTP → no DSN |
| Can retrieve failure reason? | ❌ No — no bounce inbox scanning |
| Can retrieve retry state? | ❌ No — no send → retry cycle exists |
| Are retrievals tracked in Postgres? | **Partial** — events emitted but `worker.py` imports from a path that may not exist (`C:/Users/nolan/CascadeProjects/brain`) |
| Is there a constitutional event per retrieval? | ✅ Yes — `NEWSLETTER_CREATED` emitted per unique message_id |

### Critical path issue

`worker.py:10` and `database.py:6` reference:

```python
sys.path.append('C:/Users/nolan/CascadeProjects/brain')
from src.constitutional import emit_event
```

This is a **hardcoded absolute path** (`CascadeProjects/brain`) that does not exist on this system. If this code were run, `import` would fail immediately. The event emitter import is broken in the newsletter worker.

---

## 6. Secret Authority

### Finding: 100% `os.getenv()`, zero SecretAdapter

Every Yahoo credential access in the codebase follows this pattern:

```python
# yahoo_client.py:16-17
self.email = os.getenv("YAHOO_EMAIL")
self.app_password = os.getenv("YAHOO_APP_PASSWORD")
```

| File | Line(s) | Method | Risk |
|---|---|---|---|
| `brainos/newsletter/yahoo_client.py` | 16-17 | `os.getenv()` | HIGH — .env file contains plaintext password |
| `brainos/newsletter/validate_yahoo_credentials.py` | 16-17 | `os.getenv()` | HIGH |
| `brainos/newsletter/inspect_newsletters.py` | 50-51 | `os.getenv()` | HIGH |
| `brainos/orchestration/src/mission_control/app.py` | 316-317 | `os.getenv()` | MEDIUM — health check only |
| `app_container.py` | 299-300 | `os.getenv()` | MEDIUM — health check only |

The actual password value (`<REDACTED_YAHOO_APP_PASSWORD>`) is stored in plaintext in `brainos/newsletter/.env`, which is checked into the repository (not in `.gitignore`).

---

## 7. Provider Abstraction

### Finding: No abstraction layer exists

| Pattern | Found? |
|---|---|
| `EmailAdapter` | **No** |
| `NotificationAdapter` | **No** |
| `SMTPProvider` / `MailProvider` | **No** |
| `SmtpClient` | **No** |

The only abstraction is `YahooMailClient` at `brainos/newsletter/yahoo_client.py`, which is a concrete IMAP client — not an interface. It has no abstract base class, no provider registry, no transport abstraction.

If Yahoo were replaced with Resend/SendGrid/Mailgun, the replacement would need to be written from scratch. There is no adapter slot to fill.

---

## Answers

### 1. Retrieval — Can BrainOS retrieve anything today?

**Yes, but only Yahoo Mail newsletters via IMAP.** The `YahooMailClient.fetch_unread_newsletters()` method pulls unread emails from `imap.mail.yahoo.com:993`, extracts subject/sender/body/message_id, and stores them in a local SQLite database at `brainos/newsletter/newsletters.db`. The worker is **NOT deployed** (no Docker container running), but the code is functional.

### 2. Authority — Who currently owns communication authority?

**No one.** There is no communication authority.

- There is no outbound email capability at all
- There is no notification service
- There is no webhook system
- The only email system is inbound newsletter ingestion, which is **undeployed** (no running container) and has a **broken import path** (`C:/Users/nolan/CascadeProjects/brain` doesn't exist)
- Yahoo credentials use `os.getenv()` — no SecretAdapter, no Vault integration

### 3. Event Integration — Are emails represented in Postgres?

**Partially.** Newsletter events would be emitted to the constitutional event system if the worker ran (`NEWSLETTER_CREATED`, `DIGEST_GENERATED`, `ARCHIVE_WRITTEN`), but:
- The import path to `emit_event` is broken
- The worker is not deployed
- No `email` stream exists in the event system — only `yahoo`
- Zero outbound email event types exist

### 4. Survivability — If Yahoo disappears tomorrow, what breaks?

**The newsletter ingestion pipeline.** This would affect:
- `YahooMailClient.connect()` — fails (IMAP unreachable)
- `worker.py` — cannot run (no credentials)
- `validate_yahoo_credentials.py` — same
- `inspect_newsletters.py` — same

**Nothing else breaks.** There is no outbound email, no notifications, no alerts, no SMTP-dependent service. BrainOS would continue running without any visible change to its API endpoints, inference pipeline, or constitutional governance. The newsletter pipeline is entirely standalone and orthogonal to the core mission control system.

### 5. Migration Cost — How hard is Yahoo → Resend?

**There is nothing to migrate.** The current system:
- Does not use SMTP at all
- Does not send email at all
- Has no email abstraction layer
- Has no event types for sending

A Resend integration would be a **greenfield implementation**, not a migration. The cost is: design + implement + test + deploy from scratch. No legacy code removal is required.

---

## Summary Table

| Question | Answer |
|---|---|
| Does BrainOS send email? | **No** |
| Does BrainOS receive email? | **Yes, newsletters only** (IMAP → Yahoo) |
| Is the newsletter worker deployed? | **No** (no Docker container) |
| Is the newsletter worker's import path correct? | **No** (`CascadeProjects/brain` does not exist) |
| Are Yahoo credentials in SecretAdapter? | **No** (all `os.getenv()`) |
| Are credentials in plaintext `.env`? | **Yes** (checked into repo) |
| Does an SMTP abstraction exist? | **No** |
| Do outbound email event types exist? | **No** |
| Would Yahoo failure take down the system? | **No** (newsletter is standalone) |
| Migration Yahoo → Resend? | **Greenfield** (no legacy to remove) |
