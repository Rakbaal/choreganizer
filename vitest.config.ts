import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import { testDatabaseUrl } from './server/test/test-database'

// Vitest doesn't read .env; workers inherit what is loaded here (TEST_DATABASE_URL).
if (existsSync('.env')) process.loadEnvFile()
// Fails here rather than in the global setup, whose errors Vitest 5 can't print (its stack-trace mapping crashes).
testDatabaseUrl()

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    setupFiles: ['./server/test/setup.ts'],
    globalSetup: ['./server/test/global-setup.ts'],
  },
})
