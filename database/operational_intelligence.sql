-- Operational Intelligence Layer
-- PING EXECUTION DIRECTIVE - PHASE B.5
-- Date: 2026-06-14

-- PATCH-007: Event Visibility Dashboard Queries

-- Event Activity (24h)
-- Query for dashboard panel showing RSS, Yahoo, Gateway, Replay, Storage activity
CREATE OR REPLACE FUNCTION get_event_activity_24h()
RETURNS TABLE (
    stream TEXT,
    event_type TEXT,
    event_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        stream,
        event_type,
        COUNT(*) as event_count
    FROM events
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY stream, event_type
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- PATCH-008: Worker Heartbeat Monitoring

-- Heartbeat events are emitted by workers and stored in events table
-- No additional schema needed - uses existing events table
-- Dashboard query for worker status
CREATE OR REPLACE FUNCTION get_worker_status()
RETURNS TABLE (
    worker TEXT,
    last_heartbeat TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        payload->>'worker' as worker,
        MAX(created_at) as last_heartbeat,
        CASE
            WHEN MAX(created_at) > NOW() - INTERVAL '15 minutes' THEN 'GREEN'
            WHEN MAX(created_at) > NOW() - INTERVAL '30 minutes' THEN 'YELLOW'
            ELSE 'RED'
        END as status
    FROM events
    WHERE event_type = 'WORKER_HEARTBEAT'
    GROUP BY payload->>'worker';
END;
$$ LANGUAGE plpgsql;

-- PATCH-009: Raw Input Preservation

-- Raw payloads table with 7-day retention
CREATE TABLE IF NOT EXISTS raw_payloads (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    payload_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    compressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for raw payloads
CREATE INDEX IF NOT EXISTS idx_raw_payloads_source ON raw_payloads(source);
CREATE INDEX IF NOT EXISTS idx_raw_payloads_created_at ON raw_payloads(created_at DESC);

-- Retention function for raw payloads (7 days)
CREATE OR REPLACE FUNCTION cleanup_old_raw_payloads()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM raw_payloads
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- PATCH-010: Model Performance Ledger

-- Model performance is stored in events table with INFERENCE_RESPONSE event type
-- No additional schema needed - uses existing events table
-- Dashboard query for model performance
CREATE OR REPLACE FUNCTION get_model_performance()
RETURNS TABLE (
    model TEXT,
    call_count BIGINT,
    avg_duration_ms NUMERIC,
    max_duration_ms INTEGER,
    task_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        payload->>'model' as model,
        COUNT(*) as call_count,
        AVG((payload->>'duration_ms')::INTEGER) as avg_duration_ms,
        MAX((payload->>'duration_ms')::INTEGER) as max_duration_ms,
        jsonb_object_agg('task', COUNT(*)) as task_distribution
    FROM events
    WHERE event_type = 'INFERENCE_RESPONSE'
    GROUP BY payload->>'model';
END;
$$ LANGUAGE plpgsql;

-- PATCH-011: Failure Event Capture

-- Failure events are emitted by catch blocks and stored in events table
-- No additional schema needed - uses existing events table
-- Dashboard query for top errors (24h)
CREATE OR REPLACE FUNCTION get_top_errors_24h()
RETURNS TABLE (
    error_type TEXT,
    error_count BIGINT,
    most_common_source TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_type as error_type,
        COUNT(*) as error_count,
        (payload->>'source') as most_common_source
    FROM events
    WHERE event_type LIKE '%_FAILED'
      AND created_at > NOW() - INTERVAL '24 hours'
    GROUP BY event_type, payload->>'source'
    ORDER BY error_count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- PATCH-012: Daily Runtime Digest

-- Daily runtime digest is generated from events table
-- No additional schema needed - uses existing events table
-- Function to generate daily digest
CREATE OR REPLACE FUNCTION generate_daily_digest(digest_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    digest JSONB;
BEGIN
    SELECT jsonb_build_object(
        'date', digest_date,
        'rss', (
            SELECT jsonb_build_object(
                'articles_processed', COUNT(*) FILTER (WHERE event_type = 'ARTICLE_CREATED'),
                'failures', COUNT(*) FILTER (WHERE event_type LIKE '%_FAILED'),
                'cycles', COUNT(*) FILTER (WHERE event_type = 'CYCLE_STARTED')
            )
            FROM events
            WHERE stream = 'rss'
              AND created_at >= digest_date
              AND created_at < digest_date + INTERVAL '1 day'
        ),
        'yahoo', (
            SELECT jsonb_build_object(
                'newsletters_processed', COUNT(*) FILTER (WHERE event_type = 'NEWSLETTER_CREATED'),
                'digests_generated', COUNT(*) FILTER (WHERE event_type = 'DIGEST_GENERATED'),
                'failures', COUNT(*) FILTER (WHERE event_type LIKE '%_FAILED'),
                'ingestion_cycles', COUNT(*) FILTER (WHERE event_type = 'INGESTION_CYCLE_STARTED'),
                'processing_cycles', COUNT(*) FILTER (WHERE event_type = 'PROCESSING_CYCLE_STARTED')
            )
            FROM events
            WHERE stream = 'yahoo'
              AND created_at >= digest_date
              AND created_at < digest_date + INTERVAL '1 day'
        ),
        'gateway', (
            SELECT jsonb_build_object(
                'inference_count', COUNT(*) FILTER (WHERE event_type = 'INFERENCE_RESPONSE'),
                'avg_latency_ms', AVG((payload->>'duration_ms')::INTEGER) FILTER (WHERE event_type = 'INFERENCE_RESPONSE'),
                'model_distribution', jsonb_object_agg(payload->>'model', COUNT(*)) FILTER (WHERE event_type = 'INFERENCE_RESPONSE')
            )
            FROM events
            WHERE stream = 'gateway'
              AND created_at >= digest_date
              AND created_at < digest_date + INTERVAL '1 day'
        ),
        'storage', (
            SELECT jsonb_build_object(
                'archives_written', COUNT(*) FILTER (WHERE event_type = 'MARKDOWN_WRITTEN' OR event_type = 'ARCHIVE_WRITTEN'),
                'db_growth', COUNT(*) FILTER (WHERE event_type = 'ARTICLE_CREATED' OR event_type = 'NEWSLETTER_CREATED')
            )
            FROM events
            WHERE created_at >= digest_date
              AND created_at < digest_date + INTERVAL '1 day'
        ),
        'top_errors', (
            SELECT jsonb_agg(jsonb_build_object(
                'error_type', event_type,
                'error_count', COUNT(*)
            ))
            FROM events
            WHERE event_type LIKE '%_FAILED'
              AND created_at >= digest_date
              AND created_at < digest_date + INTERVAL '1 day'
            GROUP BY event_type
            ORDER BY COUNT(*) DESC
            LIMIT 5
        ),
        'dead_workers', (
            SELECT jsonb_agg(jsonb_build_object(
                'worker', payload->>'worker',
                'last_heartbeat', MAX(created_at)
            ))
            FROM events
            WHERE event_type = 'WORKER_HEARTBEAT'
              AND created_at < NOW() - INTERVAL '30 minutes'
            GROUP BY payload->>'worker'
        )
    ) INTO digest;
    
    RETURN digest;
END;
$$ LANGUAGE plpgsql;

-- PATCH-013: Inference Preview Logging

-- Inference preview is stored in events table with INFERENCE_REQUEST and INFERENCE_RESPONSE events
-- No additional schema needed - uses existing events table
-- Update event_emitter to include prompt/response previews

-- PATCH-014: Dead Letter Queue

-- Dead letter queue table for permanent failures
CREATE TABLE IF NOT EXISTS dead_letters (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    payload JSONB NOT NULL,
    error TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dead letters
CREATE INDEX IF NOT EXISTS idx_dead_letters_source ON dead_letters(source);
CREATE INDEX IF NOT EXISTS idx_dead_letters_created_at ON dead_letters(created_at DESC);

-- Function to add to dead letter queue
CREATE OR REPLACE FUNCTION add_to_dead_letter_queue(source TEXT, payload JSONB, error TEXT)
RETURNS BIGINT AS $$
DECLARE
    dead_letter_id BIGINT;
BEGIN
    INSERT INTO dead_letters (source, payload, error, created_at)
    VALUES (source, payload, error, NOW())
    RETURNING id INTO dead_letter_id;
    
    RETURN dead_letter_id;
END;
$$ LANGUAGE plpgsql;

-- PATCH-015: Knowledge Growth Metrics

-- Daily knowledge metrics table
CREATE TABLE IF NOT EXISTS knowledge_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    daily_articles INTEGER DEFAULT 0,
    daily_summaries INTEGER DEFAULT 0,
    daily_newsletters INTEGER DEFAULT 0,
    daily_archives INTEGER DEFAULT 0,
    daily_events INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge metrics
CREATE INDEX IF NOT EXISTS idx_knowledge_metrics_date ON knowledge_metrics(metric_date DESC);

-- Function to calculate daily knowledge metrics
CREATE OR REPLACE FUNCTION calculate_daily_knowledge_metrics(metric_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO knowledge_metrics (metric_date, daily_articles, daily_summaries, daily_newsletters, daily_archives, daily_events)
    VALUES (
        metric_date,
        (SELECT COUNT(*) FROM events WHERE event_type = 'ARTICLE_CREATED' AND created_at >= metric_date AND created_at < metric_date + INTERVAL '1 day'),
        (SELECT COUNT(*) FROM events WHERE event_type = 'DIGEST_GENERATED' AND created_at >= metric_date AND created_at < metric_date + INTERVAL '1 day'),
        (SELECT COUNT(*) FROM events WHERE event_type = 'NEWSLETTER_CREATED' AND created_at >= metric_date AND created_at < metric_date + INTERVAL '1 day'),
        (SELECT COUNT(*) FROM events WHERE (event_type = 'MARKDOWN_WRITTEN' OR event_type = 'ARCHIVE_WRITTEN') AND created_at >= metric_date AND created_at < metric_date + INTERVAL '1 day'),
        (SELECT COUNT(*) FROM events WHERE created_at >= metric_date AND created_at < metric_date + INTERVAL '1 day')
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        daily_articles = EXCLUDED.daily_articles,
        daily_summaries = EXCLUDED.daily_summaries,
        daily_newsletters = EXCLUDED.daily_newsletters,
        daily_archives = EXCLUDED.daily_archives,
        daily_events = EXCLUDED.daily_events;
END;
$$ LANGUAGE plpgsql;

-- Function to get knowledge growth trends
CREATE OR REPLACE FUNCTION get_knowledge_growth_trends(days INTEGER DEFAULT 7)
RETURNS TABLE (
    metric_date DATE,
    daily_articles INTEGER,
    daily_summaries INTEGER,
    daily_newsletters INTEGER,
    daily_archives INTEGER,
    daily_events INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        metric_date,
        daily_articles,
        daily_summaries,
        daily_newsletters,
        daily_archives,
        daily_events
    FROM knowledge_metrics
    WHERE metric_date >= CURRENT_DATE - INTERVAL '1 day' * days
    ORDER BY metric_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Runtime Context Service for OLLAMA Access Expansion

-- Function to get recent events (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_recent_events_for_context(limit INTEGER DEFAULT 10)
RETURNS TABLE (
    stream TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        stream,
        event_type,
        payload,
        created_at
    FROM events
    ORDER BY created_at DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get worker status (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_worker_status_for_context()
RETURNS TABLE (
    worker TEXT,
    last_heartbeat TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM get_worker_status();
END;
$$ LANGUAGE plpgsql;

-- Function to get latest summaries (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_latest_summaries_for_context(limit INTEGER DEFAULT 5)
RETURNS TABLE (
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_type,
        payload,
        created_at
    FROM events
    WHERE event_type IN ('DIGEST_GENERATED', 'ARTICLE_CREATED', 'NEWSLETTER_CREATED')
    ORDER BY created_at DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent failures (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_recent_failures_for_context(limit INTEGER DEFAULT 5)
RETURNS TABLE (
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_type,
        payload,
        created_at
    FROM events
    WHERE event_type LIKE '%_FAILED'
    ORDER BY created_at DESC
    LIMIT limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get model metrics (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_model_metrics_for_context()
RETURNS TABLE (
    model TEXT,
    call_count BIGINT,
    avg_duration_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        model,
        call_count,
        avg_duration_ms
    FROM get_model_performance();
END;
$$ LANGUAGE plpgsql;

-- Function to get daily activity (read-only for Ollama)
CREATE OR REPLACE FUNCTION get_daily_activity_for_context(activity_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    activity JSONB;
BEGIN
    SELECT generate_daily_digest(activity_date) INTO activity;
    RETURN activity;
END;
$$ LANGUAGE plpgsql;
