-- Event Processing Tracking Table
-- Tracks which events have been processed by the constitutional runtime

CREATE TABLE IF NOT EXISTS event_processing (
    event_id UUID PRIMARY KEY,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    worker TEXT,
    retries INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching unprocessed events
CREATE INDEX IF NOT EXISTS idx_event_processing_unprocessed ON event_processing(processed) WHERE processed = FALSE;

-- Index for worker queries
CREATE INDEX IF NOT EXISTS idx_event_processing_worker ON event_processing(worker);

-- Index for retry queries
CREATE INDEX IF NOT EXISTS idx_event_processing_retries ON event_processing(retries) WHERE retries > 0;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_event_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_processing_updated_at
    BEFORE UPDATE ON event_processing
    FOR EACH ROW
    EXECUTE FUNCTION update_event_processing_updated_at();
