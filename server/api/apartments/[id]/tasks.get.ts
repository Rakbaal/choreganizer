import { eq, sql } from 'drizzle-orm'
import { tasks } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await requireMembership(event, id)
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.apartmentId, id!))
    // Active by position, then archived by name.
    .orderBy(
      sql`${tasks.archivedAt} is not null`,
      sql`case when ${tasks.archivedAt} is null then ${tasks.position} end`,
      tasks.name,
    )
  const ids = rows.map(row => row.id)
  const rooms = await activeTaskRooms(db, ids)
  const lastDone = await lastLogs(db, ids)
  return rows.map(row => toTask(row, rooms.get(row.id) ?? [], lastDone.get(row.id) ?? null))
})
