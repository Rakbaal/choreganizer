import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { testDatabaseUrl } from './test-database'

export default async function setup() {
  const pool = new Pool({ connectionString: testDatabaseUrl() })
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: './server/database/migrations' })
    await pool.query('truncate table "user", apartments cascade')
  }
  finally {
    await pool.end()
  }
}
