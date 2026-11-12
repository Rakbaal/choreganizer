import { randomUUID } from 'node:crypto'
import { apartments, logRooms, logs, memberships, rooms, taskRooms, tasks, user } from '../database/schema'
import { db } from '../utils/db'
import type { Role } from '../utils/membership'
import type { RoomScope } from '../../shared/types/tasks'

export async function createUser(name = 'Test') {
  const id = randomUUID()
  const [row] = await db.insert(user).values({ id, name, email: `${id}@example.test`, emailVerified: false }).returning()
  return row!
}

export async function createApartment(ownerId: string, name = 'Test') {
  return db.transaction(async (tx) => {
    const [apartment] = await tx.insert(apartments).values({ name }).returning()
    await tx.insert(memberships).values({ apartmentId: apartment!.id, userId: ownerId, role: 'owner' })
    return apartment!
  })
}

export async function addMember(apartmentId: string, userId: string, role: Role = 'member') {
  await db.insert(memberships).values({ apartmentId, userId, role })
}

export async function createRoom(apartmentId: string, name: string, opts: { archived?: boolean } = {}) {
  const [row] = await db.insert(rooms).values({ apartmentId, name, archivedAt: opts.archived ? new Date() : null }).returning()
  return row!
}

// Inserts task_rooms directly, bypassing setTaskRooms: a test can link an archived room.
export async function createTask(apartmentId: string, name: string, opts: { roomScope?: RoomScope, archived?: boolean, roomIds?: string[] } = {}) {
  const [row] = await db
    .insert(tasks)
    .values({ apartmentId, name, roomScope: opts.roomScope ?? 'some', archivedAt: opts.archived ? new Date() : null })
    .returning()
  if (opts.roomIds?.length) {
    await db.insert(taskRooms).values(opts.roomIds.map(roomId => ({ taskId: row!.id, roomId })))
  }
  return row!
}

// A direct insert, bypassing createLog's rules: a test can write logs sharing one done_at.
export async function insertLog(
  apartmentId: string,
  taskId: string,
  doneBy: string,
  opts: { doneAt?: Date, roomIds?: string[], note?: string } = {},
) {
  const [row] = await db
    .insert(logs)
    .values({ apartmentId, taskId, doneBy, doneAt: opts.doneAt ?? new Date(), note: opts.note ?? null })
    .returning()
  if (opts.roomIds?.length) {
    await db.insert(logRooms).values(opts.roomIds.map(roomId => ({ logId: row!.id, roomId })))
  }
  return row!
}
