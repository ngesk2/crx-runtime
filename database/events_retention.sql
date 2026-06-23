-- Event Retention Strategy
-- PING CONSTITUTIONAL STABILIZATION PHASE B
-- Date: 2026-06-14

-- Retention Policy
-- 90 days retention for active events
-- Archival to cold storage after 90 days
-- Full backup before archival

-- Archival Table
CREATE TABLE IF NOT EXISTS events_archive (
    id BIGSERIAL PRIMARY KEY,
    stream TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for archive table
CREATE INDEX IF NOT EXISTS idx_events_archive_stream ON events_archive(stream);
CREATE INDEX IF NOT EXISTS idx_events_archive_event_type ON events_archive(event_type);
CREATE INDEX IF NOT EXISTS idx_events_archive_created_at ON events_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_archive_archived_at ON events_archive(archived_at DESC);

-- Archival Function
CREATE OR REPLACE FUNCTION archive_old_events()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Insert into archive table
    INSERT INTO events_archive (id, stream, event_type, payload, created_at)
    SELECT id, stream, event_type, payload, created_at
    FROM events
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Get count of archived events
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Delete from active events table
    DELETE FROM events
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Scheduled Job (requires pg_cron extension)
-- SELECT cron.schedule('archive-events', '0 2 * * *', 'SELECT archive_old_events();');

-- Manual archival command
-- SELECT archive_old_events();
