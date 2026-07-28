# G.10 Communication Infrastructure Audit

**Date:** 2026-06-25  
**Method:** Codebase grep, container inventory, dependency analysis, port scan

---

## Outbound Communication Capability

### Current State: ZERO

BrainOS has **no** outbound communication infrastructure:

| Capability | Status | Evidence |
|---|---|---|
| SMTP server | ❌ Not configured | No SMTP config in any .env, no docker SMTP container |
| SendGrid | ❌ Not configured | No sendgrid API keys, no SDK import |
| Mailgun | ❌ Not configured | No mailgun references |
| Resend | ❌ Not configured | No resend references |
| Webhooks | ❌ Not configured | No webhook endpoints, no webhook sender |
| Notification service | ❌ Not configured | No notification workers |
| Message queue (Kafka) | ❌ Not deployed | Docker image defined, never started |
| Message queue (RabbitMQ) | ❌ Not deployed | No compose definition |
| Twilio / SMS | ❌ Not configured | No twilio references |
| Discord / Slack bots | ❌ Not configured | No chat platform integration |

---

## Inbound Communication

### Newsletter Ingestion (Undeployed)

The only communication pipeline is inbound newsletter ingestion via the `yahoo` stream:

| Component | Status |
|---|---|
| `brainos/newsletter/` | Code exists |
| `.env` with YAHOO_EMAIL / YAHOO_APP_PASSWORD | **Exists in VCS** (plaintext) |
| Container deployment | **Never deployed** — no Dockerfile for newsletter worker |
| Dependency: `imaplib` | Standard library — available |
| Dependency: `email` | Standard library — available |
| Import path correctness | **BROKEN** — references relative paths that don't match runtime container layout |

The newsletter worker:
1. Connects to Yahoo Mail via IMAP (inbound only)
2. Fetches newsletters from inbox
3. Parses content for constitutional analysis
4. Emits events to the authority stream

But it **has never been deployed** because:
- No Dockerfile exists for the newsletter worker
- The import paths assume a different filesystem layout
- The .env with Yahoo credentials is in the repo but the service doesn't run

---

## Port Scan (Inbound Listening Services)

| Port | Service | Purpose |
|---|---|---|
| 8080 | crx-gateway | HTTP API |
| 3001 | open-webui | Chat UI |
| 3000 | crx-ui-next | Not responding (non-functional) |
| 8000 | — | Mission Control (stopped, port not listening) |
| 5432 | — | Postgres (not exposed to host) |
| 6333 | — | Qdrant (not exposed to host) |
| 11434 | — | Ollama (not exposed to host) |
| 8200 | — | Vault (stopped, port not listening) |

**No SMTP, no webhook, no message queue ports are listening.**

---

## Dependency Analysis

### Does any code import `smtplib`?

```
PS C:\Users\nolan\PING> Select-String -Pattern "smtplib" -Recurse -Include "*.py"
→ No matches
```

### Does any code import `requests` for webhooks?

```
PS C:\Users\nolan\PING> Select-String -Pattern "webhook" -Recurse -Include "*.py"
→ No matches
```

### Does any code import Kafka/RabbitMQ SDK?

```
PS C:\Users\nolan\PING> Select-String -Pattern "kafka|rabbitmq|pika" -Recurse -Include "*.py"
→ No matches
```

---

## Security Finding: Yahoo Credentials in Plaintext

```
File: C:\Users\nolan\PING\brainos\newsletter\.env
Content:
  YAHOO_EMAIL=nolansmithof@gmail.com
  YAHOO_APP_PASSWORD=**redacted**
```

This file is **tracked by git** (not in `.gitignore`) and pushed to the repository. Anyone with repo access can read these credentials. No SecretAdapter or Vault is used.

---

## Conclusion

**Communication infrastructure rating: ZERO (0/10)**

- BrainOS has zero outbound communication capability
- No email, no SMS, no webhooks, no notifications
- The newsletter ingestion pipeline is fully coded but undeployed with a broken import path
- Yahoo credentials are exposed in plaintext in the repository
- The only communication that would work today is a human SSH'ing into the machine
