import { createRoomSchema } from '#shared/schemas/rooms'
import { rooms } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  // Any member, archived apartment included.
  await requireMembership(event, id)
  const { name } = await readValidatedBody(event, createRoomSchema.parse)
  try {
    const [room] = await db
      .insert(rooms)
      .values({ apartmentId: id!, name, position: nextRoomPosition(id!) })
      .returning()
    setResponseStatus(event, 201)
    return toRoom(room!)
  }
  catch (error) {
    if (isUniqueViolation(error, 'rooms_active_name_idx')) throw duplicateRoomName(name)
    throw error
  }
})
