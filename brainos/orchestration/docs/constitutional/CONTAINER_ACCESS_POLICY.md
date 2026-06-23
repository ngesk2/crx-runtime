# Container Access Policy

**Date:** 2026-06-14
**Phase:** PING EXECUTION DIRECTIVE - PHASE B.5
**Objective:** Define and implement read access policies for containers

---

## ACCESS POLICY PRINCIPLES

The model should observe, not govern.

Ollama receives curated operational context, not root access.

---

## GRANTED READ ACCESS

### RSS Worker Data

**Container:** crx-digestion-worker
**Access:** READ
**Scope:**
- SQLite database (knowledge.db)
- Knowledge archive (knowledge/)
- Runtime digests (knowledge/runtime/)
- Event ledger (PostgreSQL events table)

**Purpose:** Enable Ollama to understand RSS ingestion context

---

### Yahoo Worker Data

**Container:** crx-newsletter-brain
**Access:** READ
**Scope:**
- SQLite database (newsletters.db)
- Knowledge archive (knowledge/)
- Runtime digests (knowledge/runtime/)
- Event ledger (PostgreSQL events table)

**Purpose:** Enable Ollama to understand Yahoo ingestion context

---

### Knowledge Archive

**Container:** All workers
**Access:** READ
**Scope:**
- Markdown files (knowledge/)
- Runtime digests (knowledge/runtime/)

**Purpose:** Enable Ollama to understand knowledge growth

---

### Runtime Digests

**Container:** All workers
**Access:** READ
**Scope:**
- Daily runtime reports (knowledge/runtime/YYYY-MM-DD.md)

**Purpose:** Enable Ollama to understand operational history

---

### Event Ledger

**Container:** All workers
**Access:** READ
**Scope:**
- PostgreSQL events table
- PostgreSQL dead_letters table

**Purpose:** Enable Ollama to understand event history

---

### Dead Letters

**Container:** All workers
**Access:** READ
**Scope:**
- PostgreSQL dead_letters table

**Purpose:** Enable Ollama to understand failure patterns

---

### Model Metrics

**Container:** All workers
**Access:** READ
**Scope:**
- PostgreSQL events table (INFERENCE_RESPONSE events)
- PostgreSQL knowledge_metrics table

**Purpose:** Enable Ollama to understand model performance

---

### Heartbeat Registry

**Container:** All workers
**Access:** READ
**Scope:**
- PostgreSQL events table (WORKER_HEARTBEAT events)

**Purpose:** Enable Ollama to understand worker status

---

## GRANTED NO WRITE ACCESS

### Replay

**Container:** PING Replay
**Access:** NO WRITE
**Reason:** Replay is constitutional kernel, must remain pure

---

### Core Runtime

**Container:** PING Gateway, PING Commit Service
**Access:** NO WRITE
**Reason:** Core runtime must remain authoritative

---

### Event Authority

**Container:** PostgreSQL events table
**Access:** NO WRITE
**Reason:** Event authority must remain append-only

---

### Postgres Administration

**Container:** PostgreSQL
**Access:** NO WRITE
**Reason:** Database administration must remain controlled

---

### Secrets

**Container:** All containers
**Access:** NO WRITE
**Reason:** Secrets must remain protected

---

### Environment Files

**Container:** All containers
**Access:** NO WRITE
**Reason:** Environment configuration must remain controlled

---

### Credential Stores

**Container:** All containers
**Access:** NO WRITE
**Reason:** Credentials must remain protected

---

## RUNTIME CONTEXT SERVICE

### Purpose

Provide Ollama with controlled read-only access to operational intelligence.

### Endpoints

**GET /context/recent-events**
- Returns: Recent events (last 10)
- Access: READ
- Source: PostgreSQL events table

**GET /context/worker-status**
- Returns: Worker status (last heartbeat, status)
- Access: READ
- Source: PostgreSQL events table

**GET /context/runtime-digest**
- Returns: Daily runtime digest
- Access: READ
- Source: PostgreSQL generate_daily_digest() function

**GET /context/latest-summaries**
- Returns: Latest summaries (last 5)
- Access: READ
- Source: PostgreSQL events table

**GET /context/recent-failures**
- Returns: Recent failures (last 5)
- Access: READ
- Source: PostgreSQL events table

**GET /context/model-metrics**
- Returns: Model performance metrics
- Access: READ
- Source: PostgreSQL get_model_performance() function

**GET /context/daily-activity**
- Returns: Daily activity summary
- Access: READ
- Source: PostgreSQL generate_daily_digest() function

---

## IMPLEMENTATION

### Gateway Endpoints

Add to PING Gateway server.js:

```javascript
// Runtime Context Service endpoints

app.get('/context/recent-events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const query = 'SELECT * FROM get_recent_events_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ events: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/worker-status', async (req, res) => {
  try {
    const query = 'SELECT * FROM get_worker_status_for_context()';
    const result = await eventPool.query(query);
    res.json({ workers: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/runtime-digest', async (req, res) => {
  try {
    const digestDate = req.query.date || new Date().toISOString().split('T')[0];
    const query = 'SELECT * FROM get_daily_activity_for_context($1)';
    const result = await eventPool.query(query, [digestDate]);
    res.json({ digest: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/latest-summaries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const query = 'SELECT * FROM get_latest_summaries_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ summaries: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/recent-failures', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const query = 'SELECT * FROM get_recent_failures_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ failures: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/model-metrics', async (req, res) => {
  try {
    const query = 'SELECT * FROM get_model_metrics_for_context()';
    const result = await eventPool.query(query);
    res.json({ metrics: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/daily-activity', async (req, res) => {
  try {
    const activityDate = req.query.date || new Date().toISOString().split('T')[0];
    const query = 'SELECT * FROM get_daily_activity_for_context($1)';
    const result = await eventPool.query(query, [activityDate]);
    res.json({ activity: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## SECURITY CONSIDERATIONS

### Read-Only Enforcement

- All context service endpoints are GET only
- No POST, PUT, DELETE endpoints allowed
- Database connections use read-only user where possible
- No direct database access for Ollama

### Data Sanitization

- Sensitive data is filtered from context
- Credentials are never included in context
- Secrets are never included in context
- Personal data is minimized in context

### Rate Limiting

- Context service endpoints should be rate-limited
- Prevent abuse of context service
- Monitor context service usage

### Audit Logging

- All context service access is logged
- Monitor who accesses what context
- Detect unauthorized access attempts

---

## CONCLUSION

**The model should observe, not govern.**

**Ollama receives curated operational context, not root access.**

**Read access is granted to:**
- RSS Worker Data
- Yahoo Worker Data
- Knowledge Archive
- Runtime Digests
- Event Ledger
- Dead Letters
- Model Metrics
- Heartbeat Registry

**No write access is granted to:**
- Replay
- Core Runtime
- Event Authority
- Postgres Administration
- Secrets
- Environment Files
- Credential Stores

**Runtime Context Service provides controlled read-only access to operational intelligence.**
