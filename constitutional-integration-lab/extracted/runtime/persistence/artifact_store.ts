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
