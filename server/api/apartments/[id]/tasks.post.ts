import { taskSchema } from '#shared/schemas/tasks'
import { tasks } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  // Any member, archived apartment included.
  await requireMembership(event, id)
  const body = await readValidatedBody(event, taskSchema.parse)
  try {
    const task = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(tasks)
        .values({ apartmentId: id!, ...taskColumns(body), position: nextTaskPosition(id!) })
        .returning()
      await setTaskRooms(tx, row!, body.roomIds)
      return row!
    })
    setResponseStatus(event, 201)
    // Created in this request: no log yet.
    return toTask(task, (await activeTaskRooms(db, [task.id])).get(task.id) ?? [], null)
  }
  catch (error) {
    if (isUniqueViolation(error, 'tasks_active_name_idx')) throw duplicateTaskName(body.name)
    throw error
  }
})
