import { pool } from "./db"

export async function storeLineage(parentIds: string[], childId: string) {
  for (const parent of parentIds) {
    await pool.query(
      `
      INSERT INTO lineage_edges(parent_id, child_id)
      VALUES ($1,$2)
      `,
      [parent, childId]
    )
  }
}
