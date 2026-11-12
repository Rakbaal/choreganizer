// Explicit imports, not Nitro's auto-imports: the tests load this file with plain Vitest.
import { and, desc, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm'
import { createError } from 'h3'
import type { TaskInput } from '#shared/schemas/tasks'
import type { Task } from '#shared/types/tasks'
import { logs, rooms, taskRooms, tasks, user } from '../database/schema'
import type { db } from './db'

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export function taskColumns(input: TaskInput) {
  return {
    name: input.name,
    description: input.description || null,
    roomScope: input.roomScope,
    frequencyInterval: input.frequency?.interval ?? null,
    frequencyUnit: input.frequency?.unit ?? null,
  }
}

// The task's rows of active rooms become roomIds; rows of archived rooms are never touched, so restoring a room puts it
// back in its tasks. No lock: a room archived between the check and the insert is an archived room's row, a normal state.
export async function setTaskRooms(tx: Tx, task: { id: string, apartmentId: string }, roomIds: string[]): Promise<void> {
  const ids = [...new Set(roomIds)]
  if (ids.length) {
    const found = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.apartmentId, task.apartmentId), isNull(rooms.archivedAt), inArray(rooms.id, ids)))
    // Unknown, another apartment's and archived alike: nothing to probe.
    if (found.length < ids.length) {
      throw createError({ statusCode: 400, message: 'Une des pièces n\'existe pas ou a été archivée.' })
    }
  }
  // notInArray on [] is true: a save with no room drops every active row.
  await tx.delete(taskRooms).where(and(
    eq(taskRooms.taskId, task.id),
    notInArray(taskRooms.roomId, ids),
    inArray(taskRooms.roomId, tx.select({ id: rooms.id }).from(rooms).where(isNull(rooms.archivedAt))),
  ))
  if (ids.length) {
    await tx.insert(taskRooms).values(ids.map(roomId => ({ taskId: task.id, roomId }))).onConflictDoNothing()
  }
}

export async function activeTaskRooms(executor: Tx | typeof db, taskIds: string[]): Promise<Map<string, { id: string, name: string }[]>> {
  const map = new Map<string, { id: string, name: string }[]>()
  if (!taskIds.length) return map
  const rows = await executor
    .select({ taskId: taskRooms.taskId, id: rooms.id, name: rooms.name })
    .from(taskRooms)
    .innerJoin(rooms, eq(rooms.id, taskRooms.roomId))
    .where(and(inArray(taskRooms.taskId, taskIds), isNull(rooms.archivedAt)))
    .orderBy(rooms.position, rooms.name)
  for (const { taskId, id, name } of rows) {
    const list = map.get(taskId)
    if (list) list.push({ id, name })
    else map.set(taskId, [{ id, name }])
  }
  return map
}

// Per task, whatever the log's rooms, and by done_at: a log dated in the past counts from that date. No apartment
// filter: the task ids already come from one apartment.
export async function lastLogs(executor: Tx | typeof db, taskIds: string[]): Promise<Map<string, NonNullable<Task['lastLog']>>> {
  const map = new Map<string, NonNullable<Task['lastLog']>>()
  if (!taskIds.length) return map
  // distinct on keeps the first row of each task_id in this order: the latest done_at, ties broken by id.
  const rows = await executor
    .selectDistinctOn([logs.taskId], { taskId: logs.taskId, doneAt: logs.doneAt, byId: user.id, byName: user.name })
    .from(logs)
    .innerJoin(user, eq(user.id, logs.doneBy))
    .where(inArray(logs.taskId, taskIds))
    .orderBy(logs.taskId, desc(logs.doneAt), desc(logs.id))
  for (const { taskId, doneAt, byId, byName } of rows) {
    map.set(taskId, { doneAt: doneAt.toISOString(), by: { id: byId, name: byName } })
  }
  return map
}

export function toTask(row: typeof tasks.$inferSelect, rooms: { id: string, name: string }[], lastLog: Task['lastLog']): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    frequency: row.frequencyUnit ? { interval: row.frequencyInterval!, unit: row.frequencyUnit } : null,
    roomScope: row.roomScope,
    rooms,
    lastLog,
    position: row.position,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  }
}

export function duplicateTaskName(name: string) {
  return createError({ statusCode: 409, message: `Une tâche nommée « ${name} » existe déjà.` })
}

// Last among the active tasks. Two concurrent creates can get the same position: harmless, the list breaks ties by
// name and the next reorder renumbers.
export function nextTaskPosition(apartmentId: string) {
  return sql`(select coalesce(max(${tasks.position}), -1) + 1 from ${tasks} where ${tasks.apartmentId} = ${apartmentId} and ${tasks.archivedAt} is null)`
}
