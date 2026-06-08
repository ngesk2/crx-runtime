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
