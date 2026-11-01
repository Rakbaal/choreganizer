// Explicit imports, not Nitro's auto-imports: the tests load this file with plain Vitest.
import { DrizzleQueryError } from 'drizzle-orm'

// Postgres reports a unique index's name as the violated constraint. Drizzle 0.45 wraps the pg error in a
// DrizzleQueryError (recheck on upgrade: rooms.test.ts fails if it stops doing so).
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = error instanceof DrizzleQueryError ? error.cause : error
  if (typeof cause !== 'object' || cause === null) return false
  const { code, constraint: violated } = cause as { code?: unknown, constraint?: unknown }
  return code === '23505' && violated === constraint
}
