import { and, eq, isNull, sql } from 'drizzle-orm'
import { apartments, invites, memberships } from '../../../database/schema'

// requireUser only: the code is the credential.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const code = getRouterParam(event, 'code') ?? ''
  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        apartmentId: invites.apartmentId,
        usedAt: invites.usedAt,
        expiresAt: invites.expiresAt,
        archivedAt: apartments.archivedAt,
      })
      .from(invites)
      .innerJoin(apartments, eq(apartments.id, invites.apartmentId))
      .where(eq(invites.code, code))
    if (!invite) {
      throw createError({ statusCode: 404, message: 'Ce code d\'invitation n\'existe pas.' })
    }
    const { apartmentId } = invite

    // Already a member: back to the apartment, and the code stays usable.
    const [membership] = await tx
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.apartmentId, apartmentId), eq(memberships.userId, user.id)))
    if (membership) return { apartmentId }

    // The conditional update is what makes single use hold, not the select above: two accepts at once can both
    // read the code as unused, but only one of them updates the row.
    const used = await tx
      .update(invites)
      .set({ usedAt: sql`now()`, usedBy: user.id })
      .where(and(
        eq(invites.code, code),
        isNull(invites.usedAt),
        sql`${invites.expiresAt} > now()`,
        sql`exists (select 1 from ${apartments} where ${apartments.id} = ${invites.apartmentId} and ${apartments.archivedAt} is null)`,
      ))
      .returning()
    if (!used.length) {
      let message = 'Ce code a déjà été utilisé.'
      if (!invite.usedAt && invite.expiresAt <= new Date()) message = 'Ce code a expiré.'
      else if (!invite.usedAt && invite.archivedAt) message = 'Cet appartement est archivé.'
      // Otherwise another accept won the race meanwhile: used too.
      throw createError({ statusCode: 410, message })
    }

    // Two codes of the same apartment accepted at once by the same user.
    await tx.insert(memberships).values({ apartmentId, userId: user.id, role: 'member' }).onConflictDoNothing()
    return { apartmentId }
  })
})
