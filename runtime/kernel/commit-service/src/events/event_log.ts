/**
 * CONSTITUTIONAL ROLE
 *
 * Authority: NO
 * Creates Truth: NO
 * Derives Truth: NO
 * Stores Truth: YES (Event Persistence)
 * Presents Truth: NO
 *
 * Truth Source:
 * runtime/replay/replay_event_stream.ts (constitutional event stream)
 *
 * Constitutional Flow:
 * 1. Receives event from commit_controller.ts
 * 2. Persists event to PostgreSQL
 * 3. Replay loads events from this persistence layer
 *
 * This component does NOT create constitutional truth.
 * It is a persistence layer for the constitutional event stream.
 *
 * NOTE: This is a temporary persistence mechanism.
 * Constitutional event storage should route through runtime/replay/replay_event_stream.ts
 * with a constitutional persistence adapter (e.g., PostgresEventStore).
 */

import { pool } from "../persistence/db"

export async function logEvent(type: string, payload: any) {
  await pool.query(
    `
    INSERT INTO execution_events(event_type,payload)
    VALUES ($1,$2)
    `,
    [type, payload]
  )
}
