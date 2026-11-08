// Explicit imports, not Nitro's auto-imports: the tests load this file with plain Vitest.
import { and, asc, desc, eq, exists, inArray, isNull, notExists, or, sql, type SQL } from 'drizzle-orm'
import { createError } from 'h3'
import type { FeedQuery, LogInput } from '#shared/schemas/logs'
import type { LogEntry, LogPage } from '#shared/types/logs'
import { logRooms, logs, rooms, taskRooms, tasks, user } from '../database/schema'
import { db } from './db'
import type { Tx } from './tasks'

// API § Log creation, step by step. ctx.apartmentId is the route's, checked by requireMembership; ctx.userId is the
// session's, the only source of done_by (Log only for yourself).
export async function createLog(input: LogInput, ctx: { apartmentId: string, userId: string }): Promise<LogEntry> {
  const [task] = await db
    .select({ id: tasks.id, allRooms: tasks.allRooms })
    .from(tasks)
    .where(and(eq(tasks.id, input.taskId), eq(tasks.apartmentId, ctx.apartmentId), isNull(tasks.archivedAt)))
  // Unknown, another apartment's and archived alike: nothing to probe.
  if (!task) throw createError({ statusCode: 400, message: 'Cette tâche n\'existe pas ou a été archivée.' })

  const roomIds = [...new Set(input.roomIds)]
  if (!task.allRooms && !roomIds.length) {
    throw createError({ statusCode: 400, message: 'Choisissez au moins une pièce.' })
  }
  if (roomIds.length) {
    // The eligible rooms among the given ones: every active room of the apartment for an allRooms task, the task's
    // active rooms otherwise (the reading of activeTaskRooms).
    const eligible = task.allRooms
      ? await db
          .select({ id: rooms.id })
          .from(rooms)
          .where(and(eq(rooms.apartmentId, ctx.apartmentId), isNull(rooms.archivedAt), inArray(rooms.id, roomIds)))
      : await db
          .select({ id: rooms.id })
          .from(taskRooms)
          .innerJoin(rooms, eq(rooms.id, taskRooms.roomId))
          .where(and(
            eq(taskRooms.taskId, task.id),
            eq(rooms.apartmentId, ctx.apartmentId),
            isNull(rooms.archivedAt),
            inArray(rooms.id, roomIds),
          ))
    if (eligible.length < roomIds.length) {
      throw createError({ statusCode: 400, message: 'Une des pièces ne correspond pas à cette tâche.' })
    }
  }

  // No lock between the checks and the insert: a task or room archived in that instant gets one more log, a normal
  // state (Archive, never delete).
  return db.transaction(async (tx) => {
    const [log] = await tx
      .insert(logs)
      .values({
        apartmentId: ctx.apartmentId,
        taskId: task.id,
        doneBy: ctx.userId,
        doneAt: new Date(input.doneAt),
        note: input.note || null,
      })
      .returning({ id: logs.id })
    if (roomIds.length) {
      await tx.insert(logRooms).values(roomIds.map(roomId => ({ logId: log!.id, roomId })))
    }
    return (await logEntries(tx, [log!.id]))[0]!
  })
}

// Data model § Feed query: newest first, one page after the cursor. Every filter stays inside the apartment, so an id
// from another one just returns nothing. pageSize is for the tests; the route keeps the default.
export async function listLogs(apartmentId: string, filters: FeedQuery, pageSize = 50): Promise<Omit<LogPage, 'people'>> {
  const conditions: SQL[] = [eq(logs.apartmentId, apartmentId)]
  if (filters.cursor) {
    conditions.push(sql`(${logs.doneAt}, ${logs.id}) < (${filters.cursor.doneAt.toISOString()}::timestamptz, ${filters.cursor.id}::uuid)`)
  }
  if (filters.userId) conditions.push(eq(logs.doneBy, filters.userId))
  if (filters.taskId) conditions.push(eq(logs.taskId, filters.taskId))
  if (filters.roomId) {
    // Room filter includes whole-flat logs: that room's logs, plus the logs with no room.
    conditions.push(or(
      exists(db.select().from(logRooms).where(and(eq(logRooms.logId, logs.id), eq(logRooms.roomId, filters.roomId)))),
      notExists(db.select().from(logRooms).where(eq(logRooms.logId, logs.id))),
    )!)
  }
  // Plain desc(), as logs_feed_idx is ordered: one more row than the page tells whether another page exists.
  const rows = await db
    .select({ id: logs.id, doneAt: logs.doneAt })
    .from(logs)
    .where(and(...conditions))
    .orderBy(desc(logs.doneAt), desc(logs.id))
    .limit(pageSize + 1)
  const page = rows.slice(0, pageSize)
  const last = page.at(-1)
  return {
    items: await logEntries(db, page.map(row => row.id)),
    nextCursor: rows.length > pageSize && last ? `${last.doneAt.toISOString()}_${last.id}` : null,
  }
}

// Whoever logged in the apartment, whether still a member or not: a removed member's logs stay filterable.
export async function logAuthors(apartmentId: string): Promise<LogPage['people']> {
  return db
    .selectDistinct({ id: user.id, name: user.name })
    .from(logs)
    .innerJoin(user, eq(user.id, logs.doneBy))
    .where(eq(logs.apartmentId, apartmentId))
    .orderBy(asc(user.name), asc(user.id))
}

// The one place a log row becomes a LogEntry. Archived tasks and rooms stay, flagged: history never breaks.
export async function logEntries(executor: Tx | typeof db, logIds: string[]): Promise<LogEntry[]> {
  if (!logIds.length) return []
  const rows = await executor
    .select({
      id: logs.id,
      doneAt: logs.doneAt,
      note: logs.note,
      byId: user.id,
      byName: user.name,
      taskId: tasks.id,
      taskName: tasks.name,
      taskArchivedAt: tasks.archivedAt,
    })
    .from(logs)
    .innerJoin(tasks, eq(tasks.id, logs.taskId))
    .innerJoin(user, eq(user.id, logs.doneBy))
    .where(inArray(logs.id, logIds))
    .orderBy(desc(logs.doneAt), desc(logs.id))
  const roomRows = await executor
    .select({ logId: logRooms.logId, id: rooms.id, name: rooms.name, archivedAt: rooms.archivedAt })
    .from(logRooms)
    .innerJoin(rooms, eq(rooms.id, logRooms.roomId))
    .where(inArray(logRooms.logId, logIds))
    .orderBy(rooms.position, rooms.name)

  const roomsByLog = new Map<string, LogEntry['rooms']>()
  for (const { logId, id, name, archivedAt } of roomRows) {
    const room = { id, name, archived: archivedAt !== null }
    const list = roomsByLog.get(logId)
    if (list) list.push(room)
    else roomsByLog.set(logId, [room])
  }
  return rows.map(row => ({
    id: row.id,
    doneAt: row.doneAt.toISOString(),
    note: row.note,
    by: { id: row.byId, name: row.byName },
    task: { id: row.taskId, name: row.taskName, archived: row.taskArchivedAt !== null },
    rooms: roomsByLog.get(row.id) ?? [],
  }))
}
