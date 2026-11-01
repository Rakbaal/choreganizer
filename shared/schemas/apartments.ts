import { z } from 'zod'
import { nameSchema } from './auth'

// Strict: an apartmentId, role or timezone sent by the client is a 400, never silently ignored.
export const createApartmentSchema = z.strictObject({ name: nameSchema })

export const updateApartmentSchema = z
  .strictObject({ name: nameSchema.optional(), archived: z.boolean().optional() })
  .refine(body => body.name !== undefined || body.archived !== undefined, 'Rien à modifier.')

export type ApartmentNameInput = z.infer<typeof createApartmentSchema>
