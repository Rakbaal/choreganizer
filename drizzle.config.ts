import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit doesn't read .env; on Vercel there is no file and the variables come from the environment.
if (existsSync('.env')) process.loadEnvFile()

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema',
  out: './server/database/migrations',
  // DDL over Neon's direct endpoint; locally only DATABASE_URL exists.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL! },
})
