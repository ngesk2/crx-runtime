-- Event Authority Schema
-- PING CONSTITUTIONAL STABILIZATION PHASE B
-- Date: 2026-06-14

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    stream TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_stream ON events(stream);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_stream_created_at ON events(stream, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_stream_event_type ON events(stream, event_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_events_stream_type_created ON events(stream, event_type, created_at DESC);

-- Retention Strategy
-- Retention policy: 90 days
-- Events older than 90 days are archived to cold storage

-- Backup Strategy
-- Daily backups of events table
-- Weekly full backups
-- Monthly archival backups

-- Append-Only Guarantee
-- This table is append-only
-- No updates or deletes allowed
-- Events are immutable once written

-- Trigger to prevent updates
CREATE OR REPLACE FUNCTION prevent_event_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Events table is append-only. Updates are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_event_updates
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_event_updates();

-- Trigger to prevent deletes
CREATE OR REPLACE FUNCTION prevent_event_deletes()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Events table is append-only. Deletes are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_event_deletes
    BEFORE DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_event_deletes();

-- Retention Function
CREATE OR REPLACE FUNCTION archive_old_events()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Archive events older than 90 days
    -- This function should be called by a scheduled job
    -- Implementation depends on archival strategy
    
    -- Placeholder for archival logic
    -- INSERT INTO events_archive SELECT * FROM events WHERE created_at < NOW() - INTERVAL '90 days';
    -- DELETE FROM events WHERE created_at < NOW() - INTERVAL '90 days';
    
    archived_count := 0;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Statistics Function
CREATE OR REPLACE FUNCTION get_event_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_events', COUNT(*),
        'streams', COUNT(DISTINCT stream),
        'event_types', COUNT(DISTINCT event_type),
        'oldest_event', MIN(created_at),
        'newest_event', MAX(created_at)
    ) INTO stats
    FROM events;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Stream Statistics Function
CREATE OR REPLACE FUNCTION get_stream_stats(stream_name TEXT)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'stream', stream,
        'total_events', COUNT(*),
        'event_types', COUNT(DISTINCT event_type),
        'oldest_event', MIN(created_at),
        'newest_event', MAX(created_at)
    ) INTO stats
    FROM events
    WHERE stream = stream_name;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Event Type Statistics Function
CREATE OR REPLACE FUNCTION get_event_type_stats(event_type_name TEXT)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'event_type', event_type,
        'total_events', COUNT(*),
        'streams', COUNT(DISTINCT stream),
        'oldest_event', MIN(created_at),
        'newest_event', MAX(created_at)
    ) INTO stats
    FROM events
    WHERE event_type = event_type_name;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT ON events TO app_user;
-- GRANT USAGE, SELECT ON SEQUENCE events_id_seq TO app_user;
