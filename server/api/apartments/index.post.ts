import { createApartmentSchema } from '#shared/schemas/apartments'
import { apartments, memberships } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { name } = await readValidatedBody(event, createApartmentSchema.parse)
  const apartment = await db.transaction(async (tx) => {
    // Timezone takes the column default (Apartment timezone).
    const [apartment] = await tx.insert(apartments).values({ name }).returning()
    await tx.insert(memberships).values({ apartmentId: apartment!.id, userId: user.id, role: 'owner' })
    return apartment!
  })
  setResponseStatus(event, 201)
  return toApartment(apartment, 'owner')
})
