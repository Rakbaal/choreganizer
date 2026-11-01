import { randomUUID } from 'node:crypto'
import { apartments, memberships, rooms, user } from '../database/schema'
import { db } from '../utils/db'
import type { Role } from '../utils/membership'

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
