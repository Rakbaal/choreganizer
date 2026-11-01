import { eq, sql } from 'drizzle-orm'
import { rooms } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await requireMembership(event, id)
  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.apartmentId, id!))
    // Active by position, then archived by name.
    .orderBy(
      sql`${rooms.archivedAt} is not null`,
      sql`case when ${rooms.archivedAt} is null then ${rooms.position} end`,
      rooms.name,
    )
  return rows.map(toRoom)
})
