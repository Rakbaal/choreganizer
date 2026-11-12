import { sql } from 'drizzle-orm'
import { check, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const apartments = pgTable('apartments', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  timezone: text().notNull().default('Europe/Brussels'),
  archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const memberships = pgTable('memberships', {
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text({ enum: ['owner', 'member'] }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, t => [
  primaryKey({ columns: [t.apartmentId, t.userId] }),
  check('memberships_role_check', sql`${t.role} in ('owner', 'member')`),
])

export const rooms = pgTable('rooms', {
  id: uuid().primaryKey().defaultRandom(),
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  position: integer().notNull().default(0),
  archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
}, t => [
  // Partial: an archived room's name can be reused.
  uniqueIndex('rooms_active_name_idx').on(t.apartmentId, sql`lower(${t.name})`).where(sql`${t.archivedAt} is null`),
])

export const tasks = pgTable('tasks', {
  id: uuid().primaryKey().defaultRandom(),
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  description: text(),
  // Tasks with no room: every active room, the task's task_rooms, or no room at all.
  roomScope: text('room_scope', { enum: ['all', 'some', 'none'] }).notNull().default('some'),
  position: integer().notNull().default(0),
  frequencyInterval: integer('frequency_interval'),
  frequencyUnit: text('frequency_unit', { enum: ['day', 'week', 'month'] }),
  archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, t => [
  // Partial: an archived task's name can be reused.
  uniqueIndex('tasks_active_name_idx').on(t.apartmentId, sql`lower(${t.name})`).where(sql`${t.archivedAt} is null`),
  check('tasks_frequency_pair_check', sql`(${t.frequencyInterval} is null) = (${t.frequencyUnit} is null)`),
  check('tasks_frequency_interval_check', sql`${t.frequencyInterval} is null or ${t.frequencyInterval} between 1 and 365`),
  check('tasks_frequency_unit_check', sql`${t.frequencyUnit} is null or ${t.frequencyUnit} in ('day', 'week', 'month')`),
  check('tasks_room_scope_check', sql`${t.roomScope} in ('all', 'some', 'none')`),
])

// Read only when the task's room_scope is 'some'. Rows of archived rooms stay, so restoring a room puts it back in its tasks.
export const taskRooms = pgTable('task_rooms', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.taskId, t.roomId] })])

// task_id and done_by don't cascade: archive, never delete. apartment_id is denormalised for the feed.
export const logs = pgTable('logs', {
  id: uuid().primaryKey().defaultRandom(),
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  doneBy: text('done_by').notNull().references(() => user.id),
  // Milliseconds, not Postgres' microseconds: the feed cursor goes through JavaScript Dates.
  doneAt: timestamp('done_at', { precision: 3, withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  note: text(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, t => [
  // Nulls first, Postgres' default for desc: Drizzle's desc() writes nulls last, which an `order by done_at desc` can't use.
  index('logs_feed_idx').on(t.apartmentId, t.doneAt.desc().nullsFirst(), t.id.desc().nullsFirst()),
  check('logs_note_length_check', sql`${t.note} is null or length(${t.note}) <= 500`),
])

// No rows: no room for a 'none' task, the whole flat otherwise (a 'some' task only has such logs from when it was 'all').
export const logRooms = pgTable('log_rooms', {
  logId: uuid('log_id').notNull().references(() => logs.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
}, t => [primaryKey({ columns: [t.logId, t.roomId] })])

export const invites = pgTable('invites', {
  code: text().primaryKey(),
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  usedBy: text('used_by').references(() => user.id),
})
