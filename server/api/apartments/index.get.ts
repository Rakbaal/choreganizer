import { eq, sql } from 'drizzle-orm'
import { apartments, memberships } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const rows = await db
    .select({ apartment: apartments, role: memberships.role })
    .from(memberships)
    .innerJoin(apartments, eq(apartments.id, memberships.apartmentId))
    .where(eq(memberships.userId, user.id))
    // Active first, then by name.
    .orderBy(sql`${apartments.archivedAt} is not null`, apartments.name)
  return rows.map(({ apartment, role }) => toApartment(apartment, role))
})
