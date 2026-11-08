import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { updateTaskSchema } from '#shared/schemas/tasks'
import { tasks } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const notFound = createError({ statusCode: 404, message: 'Tâche introuvable.' })
  if (!z.uuid().safeParse(id).success) throw notFound
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id!))
  if (!task) throw notFound
  // Not requireMembership: the session is already read.
  await checkMembership(user.id, task.apartmentId)
  const body = await readValidatedBody(event, updateTaskSchema.parse)

  async function respond(row: typeof tasks.$inferSelect) {
    return toTask(row, (await activeTaskRooms(db, [row.id])).get(row.id) ?? [])
  }

  if ('name' in body) {
    // An archived task can be edited too: its page is reachable by URL.
    try {
      const updated = await db.transaction(async (tx) => {
        const [row] = await tx.update(tasks).set(taskColumns(body)).where(eq(tasks.id, task.id)).returning()
        await setTaskRooms(tx, task, body.roomIds)
        return row!
      })
      return respond(updated)
    }
    catch (error) {
      if (isUniqueViolation(error, 'tasks_active_name_idx')) throw duplicateTaskName(body.name)
      throw error
    }
  }

  if ('archived' in body) {
    if (body.archived) {
      // Archiving twice keeps the date. The others keep their positions: the gap is harmless.
      const [updated] = await db
        .update(tasks)
        .set({ archivedAt: sql`coalesce(${tasks.archivedAt}, now())` })
        .where(eq(tasks.id, task.id))
        .returning()
      return respond(updated!)
    }
    if (!task.archivedAt) return respond(task)
    try {
      // Restored tasks go last.
      const [updated] = await db
        .update(tasks)
        .set({ archivedAt: null, position: nextTaskPosition(task.apartmentId) })
        .where(eq(tasks.id, task.id))
        .returning()
      return respond(updated!)
    }
    catch (error) {
      if (isUniqueViolation(error, 'tasks_active_name_idx')) throw duplicateTaskName(task.name)
      throw error
    }
  }

  // The second copy of rooms/[id].patch.ts's reorder: no shared helper until a third ordered table (Manual task order).
  await db.transaction(async (tx) => {
    // The row locks serialise two reorders of the same apartment.
    const active = await tx
      .select({ id: tasks.id, position: tasks.position })
      .from(tasks)
      .where(and(eq(tasks.apartmentId, task.apartmentId), isNull(tasks.archivedAt)))
      .orderBy(tasks.position, tasks.name)
      .for('update')
    // Checked on the locked rows, so a task archived meanwhile is refused too.
    if (!active.some(t => t.id === task.id)) {
      throw createError({ statusCode: 409, message: 'Restaurez la tâche avant de la déplacer.' })
    }
    const ids = active.map(t => t.id).filter(taskId => taskId !== task.id)
    ids.splice(Math.min(body.position, ids.length), 0, task.id)
    for (const [position, taskId] of ids.entries()) {
      if (active.find(t => t.id === taskId)!.position === position) continue
      await tx.update(tasks).set({ position }).where(eq(tasks.id, taskId))
    }
  })
  const [updated] = await db.select().from(tasks).where(eq(tasks.id, task.id))
  return respond(updated!)
})
