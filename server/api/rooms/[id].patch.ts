import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { updateRoomSchema } from '#shared/schemas/rooms'
import { rooms } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const notFound = createError({ statusCode: 404, message: 'Pièce introuvable.' })
  if (!z.uuid().safeParse(id).success) throw notFound
  const [room] = await db.select().from(rooms).where(eq(rooms.id, id!))
  if (!room) throw notFound
  // Not requireMembership: the session is already read.
  await checkMembership(user.id, room.apartmentId)
  const body = await readValidatedBody(event, updateRoomSchema.parse)

  if ('name' in body) {
    // Renaming an archived room is allowed; the UI doesn't offer it.
    try {
      const [updated] = await db.update(rooms).set({ name: body.name }).where(eq(rooms.id, room.id)).returning()
      return toRoom(updated!)
    }
    catch (error) {
      if (isUniqueViolation(error, 'rooms_active_name_idx')) throw duplicateRoomName(body.name)
      throw error
    }
  }

  if ('archived' in body) {
    if (body.archived) {
      // Archiving twice keeps the date. The others keep their positions: the gap is harmless.
      const [updated] = await db
        .update(rooms)
        .set({ archivedAt: sql`coalesce(${rooms.archivedAt}, now())` })
        .where(eq(rooms.id, room.id))
        .returning()
      return toRoom(updated!)
    }
    if (!room.archivedAt) return toRoom(room)
    try {
      // Restored rooms go last.
      const [updated] = await db
        .update(rooms)
        .set({ archivedAt: null, position: nextRoomPosition(room.apartmentId) })
        .where(eq(rooms.id, room.id))
        .returning()
      return toRoom(updated!)
    }
    catch (error) {
      if (isUniqueViolation(error, 'rooms_active_name_idx')) throw duplicateRoomName(room.name)
      throw error
    }
  }

  // Renumbering 0…n−1 beats gap tricks at a handful of rooms; M2 writes the same for tasks (Manual task order).
  await db.transaction(async (tx) => {
    // The row locks serialise two reorders of the same apartment.
    const active = await tx
      .select({ id: rooms.id, position: rooms.position })
      .from(rooms)
      .where(and(eq(rooms.apartmentId, room.apartmentId), isNull(rooms.archivedAt)))
      .orderBy(rooms.position, rooms.name)
      .for('update')
    // Checked on the locked rows, so a room archived meanwhile is refused too.
    if (!active.some(r => r.id === room.id)) {
      throw createError({ statusCode: 409, message: 'Restaurez la pièce avant de la déplacer.' })
    }
    const ids = active.map(r => r.id).filter(roomId => roomId !== room.id)
    ids.splice(Math.min(body.position, ids.length), 0, room.id)
    for (const [position, roomId] of ids.entries()) {
      if (active.find(r => r.id === roomId)!.position === position) continue
      await tx.update(rooms).set({ position }).where(eq(rooms.id, roomId))
    }
  })
  const [updated] = await db.select().from(rooms).where(eq(rooms.id, room.id))
  return toRoom(updated!)
})
