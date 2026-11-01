import { eq, sql } from 'drizzle-orm'
import { updateApartmentSchema } from '#shared/schemas/apartments'
import { apartments } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  // Body first: whether the owner is required depends on it. Renaming stays open to members.
  const body = await readValidatedBody(event, updateApartmentSchema.parse)
  const { role } = await requireMembership(event, id, { owner: body.archived !== undefined })

  let archivedAt
  // Archiving twice keeps the first date.
  if (body.archived === true) archivedAt = sql`coalesce(${apartments.archivedAt}, now())`
  if (body.archived === false) archivedAt = null
  // Drizzle leaves undefined keys out of the update.
  const [apartment] = await db
    .update(apartments)
    .set({ name: body.name, archivedAt })
    .where(eq(apartments.id, id!))
    .returning()
  return toApartment(apartment!, role)
})
