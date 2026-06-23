-- Migration: Add projection columns to events table
-- Date: 2026-06-22
-- Purpose: Enable Qdrant projection tracking

-- Add payload_hash column for event integrity verification
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64);

-- Add projected_to_qdrant column for projection tracking
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS projected_to_qdrant BOOLEAN DEFAULT FALSE;

-- Add index for efficient querying of unprojected events
CREATE INDEX IF NOT EXISTS idx_events_projected_to_qdrant 
ON events(projected_to_qdrant) 
WHERE projected_to_qdrant = FALSE;

-- Add index for payload_hash lookups
CREATE INDEX IF NOT EXISTS idx_events_payload_hash 
ON events(payload_hash);

-- Add constraint for payload_hash format
ALTER TABLE events 
ADD CONSTRAINT IF NOT EXISTS valid_payload_hash_format 
CHECK (payload_hash IS NULL OR payload_hash ~ '^[a-f0-9]{64}$');

-- Add comment
COMMENT ON COLUMN events.payload_hash IS 'SHA-256 hash of canonical JSON payload for integrity verification';
COMMENT ON COLUMN events.projected_to_qdrant IS 'Flag indicating if event has been projected to Qdrant vector database';
