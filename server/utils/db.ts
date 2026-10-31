import { attachDatabasePool } from '@vercel/functions'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema'

// process.env, not useRuntimeConfig(): the Neon integration injects DATABASE_URL under that exact name.
const connectionString = process.env.DATABASE_URL
// Without it, pg would silently fall back to localhost with the OS user.
if (!connectionString) throw new Error('DATABASE_URL is not set')

const pool = new Pool({ connectionString, idleTimeoutMillis: 5_000 })
// Closes idle connections before Vercel suspends the function; a no-op outside Vercel.
attachDatabasePool(pool)

export const db = drizzle({ client: pool, schema })
