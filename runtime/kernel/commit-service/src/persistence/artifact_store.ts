/**
 * CONSTITUTIONAL ROLE
 *
 * Authority: NO
 * Creates Truth: NO
 * Derives Truth: NO
 * Stores Truth: YES (Artifact Projection Persistence)
 * Presents Truth: NO
 *
 * Truth Source:
 * runtime/replay/replay_state_machine.ts (derives artifacts from events)
 *
 * Constitutional Flow:
 * 1. Receives artifact from commit_controller.ts
 * 2. Persists artifact to PostgreSQL
 * 3. Replay derives artifacts from events, not from this persistence layer
 *
 * This component does NOT create constitutional truth.
 * It is a persistence layer for replay-derived artifact projections.
 *
 * NOTE: This is a temporary persistence mechanism.
 * Constitutional artifact storage should be derived from event replay,
 * not stored independently. Artifacts are replay-derived state.
 */

import { pool } from "./db"

export async function storeArtifact(id: string, artifact: any) {
  await pool.query(
    `
    INSERT INTO artifacts(artifact_id, artifact_type, content)
    VALUES ($1,$2,$3)
    ON CONFLICT DO NOTHING
    `,
    [
      id,
      artifact.artifact_type,
      artifact.content
    ]
  )
}
