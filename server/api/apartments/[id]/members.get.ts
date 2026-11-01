import { eq } from 'drizzle-orm'
import { memberships, user } from '../../../database/schema'

export default defineEventHandler(async (event): Promise<Member[]> => {
  const id = getRouterParam(event, 'id')
  await requireMembership(event, id)
  const rows = await db
    .select({ userId: memberships.userId, name: user.name, role: memberships.role, joinedAt: memberships.joinedAt })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.apartmentId, id!))
    .orderBy(memberships.joinedAt)
  return rows.map(row => ({ ...row, joinedAt: row.joinedAt.toISOString() }))
})
