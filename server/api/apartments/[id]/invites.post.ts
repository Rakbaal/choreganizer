import { randomBytes } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { apartments, invites } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { user } = await requireMembership(event, id, { owner: true })
  const [apartment] = await db.select({ archivedAt: apartments.archivedAt }).from(apartments).where(eq(apartments.id, id!))
  if (apartment?.archivedAt) {
    throw createError({ statusCode: 410, message: 'Cet appartement est archivé.' })
  }
  // 12 URL-safe characters, 72 bits: a collision isn't worth a retry.
  const code = randomBytes(9).toString('base64url')
  const [invite] = await db
    .insert(invites)
    .values({ code, apartmentId: id!, createdBy: user.id, expiresAt: sql`now() + interval '7 days'` })
    .returning()
  setResponseStatus(event, 201)
  return { code, expiresAt: invite!.expiresAt.toISOString() }
})
