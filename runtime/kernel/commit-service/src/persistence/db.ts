import { Pool } from "pg"

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString
  })
}

// Legacy export for backward compatibility (should be removed after migration)
export const pool = createPool(process.env.DATABASE_URL || '')
