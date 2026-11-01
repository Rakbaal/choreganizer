import { sql } from 'drizzle-orm'
import { rooms } from '../database/schema'

export function toRoom(row: typeof rooms.$inferSelect): Room {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  }
}

export function duplicateRoomName(name: string) {
  return createError({ statusCode: 409, message: `Une pièce nommée « ${name} » existe déjà.` })
}

// Last among the active rooms. Two concurrent creates can get the same position: harmless, the list breaks ties by
// name and the next reorder renumbers.
export function nextRoomPosition(apartmentId: string) {
  return sql`(select coalesce(max(${rooms.position}), -1) + 1 from ${rooms} where ${rooms.apartmentId} = ${apartmentId} and ${rooms.archivedAt} is null)`
}
