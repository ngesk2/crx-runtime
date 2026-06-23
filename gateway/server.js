const express = require('express');
const app = express();
const { emitInferenceRequest, emitInferenceResponse, emitInferenceFailed } = require('./event_emitter');
const { Pool } = require('pg');
const { getInferenceAdapter } = require('./inference_adapter');

// PostgreSQL pool for event queries
const eventPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'crx_runtime',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

const INFERENCE_BASE_URL =
  process.env.INFERENCE_BASE_URL || 'http://localhost:11434';

const CHAT_MODEL =
  process.env.CHAT_MODEL || 'qwen2.5-coder:14b';

// Startup validation
console.log("INFERENCE_BASE_URL =", INFERENCE_BASE_URL);

if (!process.env.INFERENCE_BASE_URL) {
  console.warn(
    "INFERENCE_BASE_URL not set, using localhost fallback"
  );
}

const ROUTER_MODEL_7B = 'qwen2.5-coder:7b';
const ROUTER_MODEL_14B = 'qwen2.5-coder:14b';

// Router configuration
const LOW_COMPLEXITY_KEYWORDS = [
  'summarize', 'summary', 'extract', 'classify', 'classify',
  'parse', 'log', 'autocomplete', 'complete', 'suggestion',
  'predict', 'interpret', 'explain briefly', 'short answer',
  'what is', 'define', 'list', 'simple', 'quick'
];

const HIGH_COMPLEXITY_KEYWORDS = [
  'architecture', 'design', 'implement', 'debug', 'fix',
  'refactor', 'optimize', 'plan', 'strategy', 'multi-file',
  'agent', 'coordinate', 'complex', 'detailed', 'comprehensive',
  'analysis', 'review', 'code review', 'best practices',
  'pattern', 'framework', 'system design'
];

function calculateComplexityScore(message) {
  const lowerMessage = message.toLowerCase();
  let score = 0;
  
  // High complexity indicators
  HIGH_COMPLEXITY_KEYWORDS.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      score += 2;
    }
  });
  
  // Low complexity indicators
  LOW_COMPLEXITY_KEYWORDS.forEach(keyword => {
    if (lowerMessage.includes(keyword)) {
      score -= 1;
    }
  });
  
  // Length factor (longer messages tend to be more complex)
  if (message.length > 200) score += 1;
  if (message.length > 500) score += 1;
  
  // Code block indicators
  if (message.includes('```') || message.includes('function') || message.includes('class')) {
    score += 2;
  }
  
  return Math.max(0, score); // Ensure non-negative
}

function routeMessage(messages) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const complexityScore = calculateComplexityScore(lastMessage);
  
  let selectedModel = ROUTER_MODEL_14B;
  let reason = 'default_high_complexity';
  
  if (complexityScore <= 1) {
    selectedModel = ROUTER_MODEL_7B;
    reason = 'low_complexity_keywords';
  } else if (complexityScore >= 3) {
    selectedModel = ROUTER_MODEL_14B;
    reason = 'high_complexity_keywords';
  } else {
    selectedModel = ROUTER_MODEL_14B;
    reason = 'moderate_complexity_default_to_high';
  }
  
  return {
    selectedModel,
    reason,
    complexityScore
  };
}

async function invokeInference(messages, model = CHAT_MODEL) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120000);

  console.log(`[${new Date().toISOString()}] INFERENCE CALL START`, {
    model,
    messages
  });

  // Emit constitutional event for inference request
  emitInferenceRequest(model, messages).catch(err => {
    console.error('Failed to emit INFERENCE_REQUEST event:', err);
  });

  try {
    const inferenceAdapter = getInferenceAdapter();
    const result = await inferenceAdapter.chat(messages);

    console.log(`[${new Date().toISOString()}] INFERENCE CALL RESPONSE`, {
      success: result !== null
    });

    if (!result) {
      throw new Error('inference_failed_null_response');
    }

    const content = result.message?.content || '';

    // Emit constitutional event for inference response
    emitInferenceResponse(model, content, 0).catch(err => {
      console.error('Failed to emit INFERENCE_RESPONSE event:', err);
    });

    return {
      success: true,
      provider: inferenceAdapter.provider,
      model: model,
      content: content,
      raw: result
    };
  } catch (error) {
    console.log(`[${new Date().toISOString()}] INFERENCE CALL ERROR`, {
      error: error.message
    });
    
    // Emit constitutional event for inference failure
    emitInferenceFailed(model, error.message, 'inference').catch(err => {
      console.error('Failed to emit INFERENCE_FAILED event:', err);
    });
    
    return {
      success: false,
      provider: 'inference',
      model: model,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /health`, { method: req.method, query: req.query });
  res.json({ status: 'healthy', service: 'gateway' });
});

// Chat endpoint
app.post('/api/v1/chat', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /api/v1/chat`, { method: req.method, body: req.body });
  const { messages = [] } = req.body;

  const started = Date.now();

  // Shadow mode: Calculate routing decision but still execute on 14B
  const routingDecision = routeMessage(messages);
  console.log(`[${new Date().toISOString()}] ROUTER DECISION (SHADOW MODE)`, routingDecision);

  const result = await invokeInference(messages, ROUTER_MODEL_14B); // Always use 14B in shadow mode

  const latency_ms = Date.now() - started;

  // Emit constitutional event for inference response with duration
  if (result.success) {
    emitInferenceResponse(result.model, result.content, latency_ms).catch(err => {
      console.error('Failed to emit INFERENCE_RESPONSE event:', err);
    });
  }

  if (!result.success) {
    return res.status(500).json({
      error: result.error,
      provider: result.provider,
      model: result.model,
      latency_ms,
      routing: routingDecision // Include routing decision in shadow mode
    });
  }

  return res.json({
    content: result.content,
    provider: result.provider,
    model: result.model,
    latency_ms,
    routing: routingDecision // Include routing decision in shadow mode
  });
});

// Models endpoint
app.get('/api/v1/models', (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /api/v1/models`, { method: req.method, query: req.query });
  res.json({
    models: [
      { name: 'qwen2.5-coder:7b', provider: 'ollama' },
      { name: 'qwen2.5-coder:14b', provider: 'ollama' }
    ]
  });
});

// Events endpoint - Get all events
app.get('/events', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /events`, { method: req.method, query: req.query });
  
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const query = `
      SELECT id, stream, event_type, payload, created_at
      FROM events
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await eventPool.query(query, [limit, offset]);
    
    res.json({
      events: result.rows,
      count: result.rows.length,
      limit: limit,
      offset: offset
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] EVENTS ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Events by stream endpoint
app.get('/events/:stream', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /events/${req.params.stream}`, { method: req.method, query: req.query });
  
  try {
    const stream = req.params.stream;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const query = `
      SELECT id, stream, event_type, payload, created_at
      FROM events
      WHERE stream = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await eventPool.query(query, [stream, limit, offset]);
    
    res.json({
      events: result.rows,
      stream: stream,
      count: result.rows.length,
      limit: limit,
      offset: offset
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] EVENTS ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Recent events endpoint
app.get('/events/recent', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /events/recent`, { method: req.method, query: req.query });
  
  try {
    const minutes = parseInt(req.query.minutes) || 60;
    const limit = parseInt(req.query.limit) || 100;
    
    const query = `
      SELECT id, stream, event_type, payload, created_at
      FROM events
      WHERE created_at >= NOW() - INTERVAL '${minutes} minutes'
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await eventPool.query(query, [limit]);
    
    res.json({
      events: result.rows,
      count: result.rows.length,
      minutes: minutes,
      limit: limit
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] EVENTS ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Event stats endpoint
app.get('/events/stats', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /events/stats`, { method: req.method, query: req.query });
  
  try {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT stream) as streams,
        COUNT(DISTINCT event_type) as event_types,
        MIN(created_at) as oldest_event,
        MAX(created_at) as newest_event
      FROM events
    `;
    
    const result = await eventPool.query(query);
    
    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] EVENTS ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Runtime Context Service endpoints for OLLAMA Access Expansion

app.get('/context/recent-events', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/recent-events`, { method: req.method, query: req.query });
  
  try {
    const limit = parseInt(req.query.limit) || 10;
    const query = 'SELECT * FROM get_recent_events_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ events: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/worker-status', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/worker-status`, { method: req.method, query: req.query });
  
  try {
    const query = 'SELECT * FROM get_worker_status_for_context()';
    const result = await eventPool.query(query);
    res.json({ workers: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/runtime-digest', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/runtime-digest`, { method: req.method, query: req.query });
  
  try {
    const digestDate = req.query.date || new Date().toISOString().split('T')[0];
    const query = 'SELECT * FROM get_daily_activity_for_context($1)';
    const result = await eventPool.query(query, [digestDate]);
    res.json({ digest: result.rows[0] });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/latest-summaries', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/latest-summaries`, { method: req.method, query: req.query });
  
  try {
    const limit = parseInt(req.query.limit) || 5;
    const query = 'SELECT * FROM get_latest_summaries_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ summaries: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/recent-failures', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/recent-failures`, { method: req.method, query: req.query });
  
  try {
    const limit = parseInt(req.query.limit) || 5;
    const query = 'SELECT * FROM get_recent_failures_for_context($1)';
    const result = await eventPool.query(query, [limit]);
    res.json({ failures: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/model-metrics', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/model-metrics`, { method: req.method, query: req.query });
  
  try {
    const query = 'SELECT * FROM get_model_metrics_for_context()';
    const result = await eventPool.query(query);
    res.json({ metrics: result.rows });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.get('/context/daily-activity', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /context/daily-activity`, { method: req.method, query: req.query });
  
  try {
    const activityDate = req.query.date || new Date().toISOString().split('T')[0];
    const query = 'SELECT * FROM get_daily_activity_for_context($1)';
    const result = await eventPool.query(query, [activityDate]);
    res.json({ activity: result.rows[0] });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CONTEXT ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Autocomplete endpoint (targets 7B model for fast responses)
app.post('/api/v1/autocomplete', async (req, res) => {
  console.log(`[${new Date().toISOString()}] ROUTE: /api/v1/autocomplete`, { method: req.method, body: req.body });
  const { messages = [] } = req.body;

  const started = Date.now();

  const result = await invokeInference(messages, ROUTER_MODEL_7B); // Always use 7B for autocomplete

  const latency_ms = Date.now() - started;

  // Emit constitutional event for inference response with duration
  if (result.success) {
    emitInferenceResponse(result.model, result.content, latency_ms).catch(err => {
      console.error('Failed to emit INFERENCE_RESPONSE event:', err);
    });
  }

  if (!result.success) {
    return res.status(500).json({
      error: result.error,
      provider: result.provider,
      model: result.model,
      latency_ms
    });
  }

  return res.json({
    content: result.content,
    provider: result.provider,
    model: result.model,
    latency_ms
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway running on http://0.0.0.0:${PORT}`);
});
