import { Request, Response } from "express"
import { pool } from "../persistence/db"

export async function auditArtifacts(req: Request, res: Response) {
  const result = await pool.query(
    `
    SELECT * FROM artifacts
    ORDER BY created_at DESC
    LIMIT 100
    `
  )

  res.json(result.rows)
}
