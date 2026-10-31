// Relative imports only: the `auth` CLI (db:auth-schema) loads this file outside Nuxt, without auto-imports or aliases.
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { nameSchema } from '../../shared/schemas/auth'
import * as schema from '../database/schema'
import { db } from './db'

function validateName(name: unknown): string {
  const parsed = nameSchema.safeParse(name)
  if (!parsed.success) {
    throw new APIError('BAD_REQUEST', { code: 'INVALID_NAME', message: 'Name must be 1-60 characters' })
  }
  return parsed.data
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  session: { expiresIn: 60 * 60 * 24 * 90 },
  // The host comes from each request; an unknown host errors instead of falling back to production's URL.
  baseURL: {
    allowedHosts: ['choreganizer-gamma.vercel.app', '*.vercel.app', 'localhost:*'],
    protocol: import.meta.dev ? 'http' : 'https',
  },
  databaseHooks: {
    user: {
      create: {
        before: async user => ({ data: { ...user, name: validateName(user.name) } }),
      },
      update: {
        // /update-user is on by default and can change the name.
        before: async (user) => {
          if (user.name === undefined) return
          return { data: { ...user, name: validateName(user.name) } }
        },
      },
    },
  },
})
