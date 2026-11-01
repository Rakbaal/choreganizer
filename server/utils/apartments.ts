import type { apartments } from '../database/schema'

export function toApartment(row: typeof apartments.$inferSelect, role: Role): Apartment {
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    role,
  }
}
