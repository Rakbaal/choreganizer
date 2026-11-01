import { and, eq, sql } from 'drizzle-orm'
import { apartments, memberships } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  const userId = getRouterParam(event, 'userId') ?? ''
  // Not requireMembership: leaving is open to members, removing someone else needs the owner.
  await checkMembership(user.id, id, { owner: userId !== user.id })

  await db.transaction(async (tx) => {
    // Locks the apartment: two people leaving at once would both see the other one remain.
    await tx.select({ id: apartments.id }).from(apartments).where(eq(apartments.id, id)).for('update')
    const removed = await tx
      .delete(memberships)
      .where(and(eq(memberships.apartmentId, id), eq(memberships.userId, userId)))
      .returning()
    if (!removed.length) {
      throw createError({ statusCode: 404, message: 'Cette personne ne fait pas partie de l\'appartement.' })
    }

    // The last-owner rule (Implementation details § Permissions): nobody left archives the apartment, no owner
    // left promotes the earliest member.
    const remaining = await tx
      .select({ userId: memberships.userId, role: memberships.role })
      .from(memberships)
      .where(eq(memberships.apartmentId, id))
      .orderBy(memberships.joinedAt)
    const [first] = remaining
    if (!first) {
      await tx.update(apartments).set({ archivedAt: sql`coalesce(${apartments.archivedAt}, now())` }).where(eq(apartments.id, id))
    }
    else if (!remaining.some(m => m.role === 'owner')) {
      await tx
        .update(memberships)
        .set({ role: 'owner' })
        .where(and(eq(memberships.apartmentId, id), eq(memberships.userId, first.userId)))
    }
  })
  return sendNoContent(event)
})
