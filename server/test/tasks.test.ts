import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { rooms, taskRooms } from '../database/schema'
import { db } from '../utils/db'
import { isUniqueViolation } from '../utils/db-errors'
import { createLog } from '../utils/logs'
import { activeTaskRooms, lastLogs, setTaskRooms } from '../utils/tasks'
import { addMember, createApartment, createRoom, createTask, createUser } from './factories'

async function setup() {
  const owner = await createUser()
  const apartment = await createApartment(owner.id)
  return apartment
}

function save(task: { id: string, apartmentId: string }, roomIds: string[]) {
  return db.transaction(tx => setTaskRooms(tx, task, roomIds))
}

async function linkedRoomIds(taskId: string) {
  const rows = await db.select({ roomId: taskRooms.roomId }).from(taskRooms).where(eq(taskRooms.taskId, taskId))
  return rows.map(r => r.roomId).sort()
}

describe('setTaskRooms', () => {
  it('refuses a room of another apartment', async () => {
    const apartment = await setup()
    const other = await setup()
    const foreign = await createRoom(other.id, 'Cuisine')
    const task = await createTask(apartment.id, 'Balai')

    await expect(save(task, [foreign.id])).rejects.toMatchObject({ statusCode: 400 })
    expect(await linkedRoomIds(task.id)).toEqual([])
  })

  it('refuses an archived room of the same apartment', async () => {
    const apartment = await setup()
    const archived = await createRoom(apartment.id, 'Chambre', { archived: true })
    const task = await createTask(apartment.id, 'Balai')

    await expect(save(task, [archived.id])).rejects.toMatchObject({ statusCode: 400 })
  })

  it('refuses an unknown room', async () => {
    const apartment = await setup()
    const task = await createTask(apartment.id, 'Balai')

    await expect(save(task, ['00000000-0000-4000-8000-0000000000ff'])).rejects.toMatchObject({ statusCode: 400 })
  })

  it('links a room given twice once', async () => {
    const apartment = await setup()
    const cuisine = await createRoom(apartment.id, 'Cuisine')
    const task = await createTask(apartment.id, 'Balai')

    await save(task, [cuisine.id, cuisine.id])

    expect(await linkedRoomIds(task.id)).toEqual([cuisine.id])
  })

  it('replaces only the active rooms, and a restored room comes back', async () => {
    const apartment = await setup()
    const cuisine = await createRoom(apartment.id, 'Cuisine')
    const salon = await createRoom(apartment.id, 'Salon')
    const chambre = await createRoom(apartment.id, 'Chambre', { archived: true })
    await db.update(rooms).set({ position: 1 }).where(eq(rooms.id, salon.id))
    await db.update(rooms).set({ position: 2 }).where(eq(rooms.id, chambre.id))
    const task = await createTask(apartment.id, 'Vitres', { roomIds: [cuisine.id, salon.id, chambre.id] })

    await save(task, [salon.id])

    expect(await linkedRoomIds(task.id)).toEqual([salon.id, chambre.id].sort())
    await db.update(rooms).set({ archivedAt: null }).where(eq(rooms.id, chambre.id))
    const map = await activeTaskRooms(db, [task.id])
    expect(map.get(task.id)).toEqual([{ id: salon.id, name: 'Salon' }, { id: chambre.id, name: 'Chambre' }])
  })

  it('drops the active rooms on an empty list and keeps the archived one', async () => {
    const apartment = await setup()
    const cuisine = await createRoom(apartment.id, 'Cuisine')
    const chambre = await createRoom(apartment.id, 'Chambre', { archived: true })
    const task = await createTask(apartment.id, 'Balai', { allRooms: true, roomIds: [cuisine.id, chambre.id] })

    await save(task, [])

    expect(await linkedRoomIds(task.id)).toEqual([chambre.id])
  })
})

describe('tasks_active_name_idx', () => {
  it('refuses a second active task with the same name in any case', async () => {
    const apartment = await setup()
    await createTask(apartment.id, 'Balai')

    const error = await createTask(apartment.id, 'balai').then(() => undefined, (error: unknown) => error)

    expect(error).toBeDefined()
    expect(isUniqueViolation(error, 'tasks_active_name_idx')).toBe(true)
  })

  it('lets an archived task\'s name be reused', async () => {
    const apartment = await setup()
    await createTask(apartment.id, 'Balai', { archived: true })

    await expect(createTask(apartment.id, 'Balai')).resolves.toMatchObject({ name: 'Balai' })
  })
})

describe('lastLogs', () => {
  const hour = 60 * 60 * 1000

  function log(apartmentId: string, userId: string, taskId: string, doneAt: Date) {
    return createLog({ taskId, roomIds: [], doneAt: doneAt.toISOString() }, { apartmentId, userId })
  }

  it('returns the latest log by done_at, not by insertion, with its author', async () => {
    const alice = await createUser('Alice')
    const bob = await createUser('Bob')
    const apartment = await createApartment(alice.id)
    await addMember(apartment.id, bob.id)
    const task = await createTask(apartment.id, 'Balai', { allRooms: true })
    const today = new Date()
    await log(apartment.id, alice.id, task.id, today)
    await log(apartment.id, bob.id, task.id, new Date(today.getTime() - 48 * hour))

    const last = await lastLogs(db, [task.id])

    expect(last.get(task.id)).toEqual({ doneAt: today.toISOString(), by: { id: alice.id, name: 'Alice' } })
  })

  it('gives each task its own, and none to a task never done', async () => {
    const alice = await createUser('Alice')
    const bob = await createUser('Bob')
    const apartment = await createApartment(alice.id)
    await addMember(apartment.id, bob.id)
    const balai = await createTask(apartment.id, 'Balai', { allRooms: true })
    const vitres = await createTask(apartment.id, 'Vitres', { allRooms: true })
    const poubelles = await createTask(apartment.id, 'Poubelles', { allRooms: true })
    const yesterday = new Date(Date.now() - 24 * hour)
    const threeDaysAgo = new Date(Date.now() - 72 * hour)
    await log(apartment.id, alice.id, balai.id, yesterday)
    await log(apartment.id, bob.id, vitres.id, threeDaysAgo)

    const last = await lastLogs(db, [balai.id, vitres.id, poubelles.id])

    expect(last.get(balai.id)).toEqual({ doneAt: yesterday.toISOString(), by: { id: alice.id, name: 'Alice' } })
    expect(last.get(vitres.id)).toEqual({ doneAt: threeDaysAgo.toISOString(), by: { id: bob.id, name: 'Bob' } })
    expect(last.has(poubelles.id)).toBe(false)
  })
})
