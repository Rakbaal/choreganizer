import { sql } from 'drizzle-orm'
import { check, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
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

export const invites = pgTable('invites', {
  code: text().primaryKey(),
  apartmentId: uuid('apartment_id').notNull().references(() => apartments.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => user.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  usedBy: text('used_by').references(() => user.id),
})
