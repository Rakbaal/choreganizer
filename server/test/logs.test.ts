import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
// Relative, not #shared: plain Vitest has no alias, and logSchema is a value import.
import { feedQuerySchema, logSchema, updateLogSchema } from '../../shared/schemas/logs'
import { logRooms, logs, memberships, rooms } from '../database/schema'
import { db } from '../utils/db'
import { createLog, listLogs, logAuthors } from '../utils/logs'
import { addMember, createApartment, createRoom, createTask, createUser, insertLog } from './factories'

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
    const foreign = await createTask(other.apartment.id, 'Balai', { roomScope: 'all' })

    await expect(log(ctx, foreign.id)).rejects.toMatchObject({ statusCode: 400 })
    expect(await logCount(ctx.apartment.id)).toBe(0)
    expect(await logCount(other.apartment.id)).toBe(0)
  })

  it('refuses an archived task', async () => {
    const ctx = await setup()
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all', archived: true })

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
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })

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

  it('refuses an archived room on a « Partout » task', async () => {
    const ctx = await setup()
    const archived = await createRoom(ctx.apartment.id, 'Chambre', { archived: true })
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })

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

  it('logs a « Partout » task with no room as the whole flat', async () => {
    const ctx = await setup()
    await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })

    const entry = await log(ctx, task.id)

    expect(entry.rooms).toEqual([])
    expect(entry.task).toEqual({ id: task.id, name: 'Balai', archived: false, roomScope: 'all' })
    expect(await db.select().from(logRooms).where(eq(logRooms.logId, entry.id))).toEqual([])
    expect(await logCount(ctx.apartment.id)).toBe(1)
  })

  it('logs a no-room task with no room', async () => {
    const ctx = await setup()
    await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Poubelles', { roomScope: 'none' })

    const entry = await log(ctx, task.id)

    expect(entry.rooms).toEqual([])
    expect(entry.task.roomScope).toBe('none')
    expect(await db.select().from(logRooms).where(eq(logRooms.logId, entry.id))).toEqual([])
  })

  it('refuses any room for a no-room task', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Poubelles', { roomScope: 'none', roomIds: [cuisine.id] })

    await expect(log(ctx, task.id, [cuisine.id])).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cette tâche ne se fait dans aucune pièce.',
    })
    expect(await logCount(ctx.apartment.id)).toBe(0)
  })

  it('logs a « Partout » task in any active room of the apartment', async () => {
    const ctx = await setup()
    const cuisine = await createRoom(ctx.apartment.id, 'Cuisine')
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })

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
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })
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
    const task = await createTask(ctx.apartment.id, 'Balai', { roomScope: 'all' })

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

describe('listLogs', () => {
  it('filters a room with its logs and the whole-flat ones, not another room\'s', async () => {
    const { user, apartment } = await setup()
    const cuisine = await createRoom(apartment.id, 'Cuisine')
    const salon = await createRoom(apartment.id, 'Salon')
    const task = await createTask(apartment.id, 'Balai', { roomScope: 'all' })
    const wholeFlat = await insertLog(apartment.id, task.id, user.id)
    const inCuisine = await insertLog(apartment.id, task.id, user.id, { roomIds: [cuisine.id] })
    await insertLog(apartment.id, task.id, user.id, { roomIds: [salon.id] })
    const inBoth = await insertLog(apartment.id, task.id, user.id, { roomIds: [cuisine.id, salon.id] })

    const page = await listLogs(apartment.id, { roomId: cuisine.id })

    expect(page.items.map(item => item.id).sort()).toEqual([wholeFlat.id, inCuisine.id, inBoth.id].sort())
  })

  it('leaves a no-room task\'s logs out of a room filter, and keeps the whole-flat logs of a task now room-specific', async () => {
    const { user, apartment } = await setup()
    const cuisine = await createRoom(apartment.id, 'Cuisine')
    const balai = await createTask(apartment.id, 'Balai', { roomScope: 'all' })
    const poubelles = await createTask(apartment.id, 'Poubelles', { roomScope: 'none' })
    // Logged whole-flat while it was « Partout », then switched to « Certaines pièces ».
    const vitres = await createTask(apartment.id, 'Vitres', { roomScope: 'some', roomIds: [cuisine.id] })
    const balaiLog = await insertLog(apartment.id, balai.id, user.id)
    await insertLog(apartment.id, poubelles.id, user.id)
    const vitresLog = await insertLog(apartment.id, vitres.id, user.id)

    const page = await listLogs(apartment.id, { roomId: cuisine.id })

    expect(page.items.map(item => item.id).sort()).toEqual([balaiLog.id, vitresLog.id].sort())
    expect((await listLogs(apartment.id, {})).items).toHaveLength(3)
  })

  it('walks three pages of logs sharing one done_at with no duplicate and no gap', async () => {
    const { user, apartment } = await setup()
    const task = await createTask(apartment.id, 'Balai', { roomScope: 'all' })
    const doneAt = new Date('2026-11-07T18:40:00.123Z')
    const ids = []
    for (let i = 0; i < 5; i++) ids.push((await insertLog(apartment.id, task.id, user.id, { doneAt })).id)

    const seen: string[] = []
    const pages: number[] = []
    let query = feedQuerySchema.parse({})
    do {
      const page = await listLogs(apartment.id, query, 2)
      seen.push(...page.items.map(item => item.id))
      pages.push(page.items.length)
      query = feedQuerySchema.parse(page.nextCursor ? { cursor: page.nextCursor } : {})
    } while (query.cursor && pages.length < 10)

    expect(pages).toEqual([2, 2, 1])
    expect(seen).toEqual([...ids].sort().reverse())
  })

  it('filters by person and task, and never shows another apartment\'s logs', async () => {
    const { user: alice, apartment } = await setup()
    const bob = await createUser('Bob')
    await addMember(apartment.id, bob.id)
    const balai = await createTask(apartment.id, 'Balai', { roomScope: 'all' })
    const vitres = await createTask(apartment.id, 'Vitres', { roomScope: 'all' })
    const bobsBalai = await insertLog(apartment.id, balai.id, bob.id)
    await insertLog(apartment.id, balai.id, alice.id)
    await insertLog(apartment.id, vitres.id, bob.id)
    const other = await setup()
    const otherTask = await createTask(other.apartment.id, 'Balai', { roomScope: 'all' })
    await insertLog(other.apartment.id, otherTask.id, other.user.id)

    const page = await listLogs(apartment.id, { userId: bob.id, taskId: balai.id })

    expect(page.items.map(item => item.id)).toEqual([bobsBalai.id])
    expect(page.nextCursor).toBeNull()
    expect((await listLogs(apartment.id, {})).items).toHaveLength(3)
  })
})

describe('updateLogSchema', () => {
  it('refuses an empty body and an author', () => {
    expect(updateLogSchema.safeParse({}).success).toBe(false)
    expect(updateLogSchema.safeParse({ note: 'x', doneBy: 'someone-else' }).success).toBe(false)
  })

  it('turns a blank note into null', () => {
    expect(updateLogSchema.parse({ note: '  ' })).toEqual({ note: null })
  })
})

describe('feedQuerySchema', () => {
  it('refuses a malformed cursor', () => {
    expect(feedQuerySchema.safeParse({ cursor: 'nope' }).success).toBe(false)
    expect(feedQuerySchema.safeParse({ cursor: '2026-11-07T18:40:00.123Z_not-a-uuid' }).success).toBe(false)
  })
})

describe('logAuthors', () => {
  it('lists each author once by name, a removed member included', async () => {
    const { user: alice, apartment } = await setup()
    const bob = await createUser('Bob')
    await addMember(apartment.id, bob.id)
    const task = await createTask(apartment.id, 'Balai', { roomScope: 'all' })
    await insertLog(apartment.id, task.id, bob.id)
    await insertLog(apartment.id, task.id, bob.id)
    await insertLog(apartment.id, task.id, alice.id)
    await db.delete(memberships).where(eq(memberships.userId, bob.id))

    expect(await logAuthors(apartment.id)).toEqual([
      { id: alice.id, name: 'Alice' },
      { id: bob.id, name: 'Bob' },
    ])
  })
})
