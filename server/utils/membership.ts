// Explicit imports, not Nitro's auto-imports: the tests load this file with plain Vitest.
import { and, eq } from 'drizzle-orm'
import { createError } from 'h3'
import { z } from 'zod'
import { memberships } from '../database/schema'
import { db } from './db'

export type Role = 'owner' | 'member'

export async function checkMembership(userId: string, apartmentId: string, opts: { owner?: boolean } = {}): Promise<{ role: Role }> {
  if (!z.uuid().safeParse(apartmentId).success) {
    throw createError({ statusCode: 404, message: 'Appartement introuvable.' })
  }
  // Same 403 whether the apartment exists or not: nothing to probe.
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.apartmentId, apartmentId), eq(memberships.userId, userId)))
  if (!membership) {
    throw createError({ statusCode: 403, message: 'Vous n\'avez pas accès à cet appartement.' })
  }
  if (opts.owner && membership.role !== 'owner') {
    throw createError({ statusCode: 403, message: 'Seul un propriétaire peut faire ça.' })
  }
  return { role: membership.role }
}
