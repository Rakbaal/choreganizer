import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
// Relative, not #shared: plain Vitest has no alias, and logSchema is a value import.
import { logSchema } from '../../shared/schemas/logs'
import { logRooms, logs, rooms } from '../database/schema'
import { db } from '../utils/db'
import { createLog } from '../utils/logs'
import { createApartment, createRoom, createTask, createUser } from './factories'

async function setup() {
  const user = await createUser('Alice')
  const apartment = await createApartment(user.id)
  return { user, apartment }
}

function log(ctx: { user: { id: string }, apartment: { id: string } }, taskId: string, roomIds: string[] = []) {
  return createLog(
    { taskId, roomIds, doneAt: new Date().toISOString() },
    { apartmentId: ctx.apartment.id, userId: ctx.user.id },
  )
}

async function logCount(apartmentId: string) {
  return (await db.select({ id: logs.id }).from(logs).where(eq(logs.apartmentId, apartmentId))).length
}

describe('createLog', () => {
  it('refuses a task of another apartment', async () => {
    const ctx = await setup()
    const other = await setup()
    const foreign = await createTask(other.apartment.id, 'Balai', { allRooms: true })

    await expect(log(ctx, foreign.id)).rejects.toMatchObject({ statusCode: 400 })
    expect(await logCount(ctx.apartment.id)).toBe(0)
    expect(await logCount(other.apartment.id)).toBe(0)
  })

  it('refuses an archived task', async () => {
    const ctx = await setup()
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true, archived: true })

    await expect(log(ctx, task.id)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cette tâche n\'existe pas ou a été archivée.',
    })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('refuses a room of another apartment', async () => {
    const ctx = await setup()
    const other = await setup()
    const foreign = await createRoom(other.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })

    await expect(log(ctx, task.id, [foreign.id])).rejects.toMatchObject({ statusCode: 400 })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('refuses a room outside a room-specific task\'s rooms', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const entree = await createRoom(ctx.apartment.id, 'Entrée')
    const task = await createTask(ctx.apartment.id, 'Vitres', { roomIds: [cuisine.id] })

    await expect(log(ctx, task.id, [cuisine.id, entree.id])).rejects.toMatchObject({
      statusCode: 400,
      message: 'Une des pièces ne correspond pas à cette tâche.',
    })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('refuses an archived room on an allRooms task', async () => {
    const ctx = await setup()
    const archived = await createRoom(ctx.apartment.id, 'Chambre', { archived: true })
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })

    await expect(log(ctx, task.id, [archived.id])).rejects.toMatchObject({ statusCode: 400 })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('refuses an archived room on a room-specific task, even one of its rooms', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const archived = await createRoom(ctx.apartment.id, 'Chambre', { archived: true })
    const task = await createTask(ctx.apartment.id, 'Vitres', { roomIds: [cuisine.id, archived.id] })

    await expect(log(ctx, task.id, [archived.id])).rejects.toMatchObject({ statusCode: 400 })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('refuses no room for a room-specific task', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Vitres', { roomIds: [cuisine.id] })

    await expect(log(ctx, task.id, [])).rejects.toMatchObject({
      statusCode: 400,
      message: 'Choisissez au moins une pièce.',
    })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('logs an allRooms task with no room as the whole flat', async () => {
    const ctx = await setup()
    await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })

    const entry = await log(ctx, task.id)

    expect(entry.rooms).toEqual([])
    expect(entry.task).toEqual({ id: task.id, name: 'Balai', archived: false })
    expect(await db.select().from(logRooms).where(eq(logRooms.logId, entry.id))).toEqual([])
    expect(await logCount(ctx.apartment.id)).toBe(1)
  })

  it('logs an allRooms task in any active room of the apartment', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })

    const entry = await log(ctx, task.id, [cuisine.id])

    expect(entry.rooms).toEqual([{ id: cuisine.id, name: 'Cuisine', archived: false }])
  })

  it('stores a room given twice once', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Vitres', { roomIds: [cuisine.id] })

    const entry = await log(ctx, task.id, [cuisine.id, cuisine.id])

    expect(await db.select().from(logRooms).where(eq(logRooms.logId, entry.id))).toEqual([
      { logId: entry.id, roomId: cuisine.id },
    ])
  })

  it('sets done_by to the user passed in, with the note and date given', async () => {
    const ctx = await setup()
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })
    const doneAt = '2026-01-15T19:40:00.123+01:00'

    const entry = await createLog(
      { taskId: task.id, roomIds: [], doneAt, note: 'Sous le canapé aussi' },
      { apartmentId: ctx.apartment.id, userId: ctx.user.id },
    )

    expect(entry.by).toEqual({ id: ctx.user.id, name: 'Alice' })
    expect(entry.doneAt).toBe('2026-01-15T18:40:00.123Z')
    expect(entry.note).toBe('Sous le canapé aussi')
    const [row] = await db.select().from(logs).where(eq(logs.id, entry.id))
    expect(row).toMatchObject({ doneBy: ctx.user.id, apartmentId: ctx.apartment.id, taskId: task.id })
  })

  it('stores an empty note as null', async () => {
    const ctx = await setup()
    const task = await createTask(ctx.apartment.id, 'Balai', { allRooms: true })

    const entry = await createLog(
      { taskId: task.id, roomIds: [], doneAt: new Date().toISOString(), note: '' },
      { apartmentId: ctx.apartment.id, userId: ctx.user.id },
    )

    expect(entry.note).toBeNull()
  })

  it('lists the rooms by position', async () => {
    const ctx = await setup()
    const salon = await createRoom(ctx.apartment.id, 'Salon')
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    await db.update(rooms).set({ position: 1 }).where(eq(rooms.id, salon.id))
    const task = await createTask(ctx.apartment.id, 'Vitres', { roomIds: [salon.id, cuisine.id] })

    const entry = await log(ctx, task.id, [salon.id, cuisine.id])

    expect(entry.rooms.map(r => r.name)).toEqual(['Cuisine', 'Salon'])
  })
})

describe('logSchema', () => {
  const valid = { taskId: '00000000-0000-4000-8000-000000000001', roomIds: [], doneAt: new Date().toISOString() }

  it('refuses a doneBy key', () => {
    expect(logSchema.safeParse({ ...valid, doneBy: 'someone-else' }).success).toBe(false)
  })

  it('refuses a doneAt 6 minutes ahead and accepts one 4 minutes ahead', () => {
    const at = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

    expect(logSchema.safeParse({ ...valid, doneAt: at(6) }).success).toBe(false)
    expect(logSchema.safeParse({ ...valid, doneAt: at(4) }).success).toBe(true)
  })

  it('accepts a doneAt a year ago', () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60_000).toISOString()

    expect(logSchema.safeParse({ ...valid, doneAt: yearAgo }).success).toBe(true)
  })

  it('trims a blank note to an empty string', () => {
    expect(logSchema.parse({ ...valid, note: '  ' }).note).toBe('')
  })
})
