import { testDatabaseUrl } from './test-database'

// server/utils/db.ts reads DATABASE_URL when a test file first imports it.
process.env.DATABASE_URL = testDatabaseUrl()
