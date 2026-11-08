import { z } from 'zod'
import { nameSchema } from './auth'

// Strict: an apartmentId, role or timezone sent on creation is a 400, never silently ignored. A new flat starts on the
// default timezone, changed in settings.
export const createApartmentSchema = z.strictObject({ name: nameSchema })

// The server's list wins over the browser's, which can differ slightly.
export const timezoneSchema = z.string().refine(tz => Intl.supportedValuesOf('timeZone').includes(tz), 'Fuseau horaire inconnu.')

export const updateApartmentSchema = z
  .strictObject({ name: nameSchema.optional(), timezone: timezoneSchema.optional(), archived: z.boolean().optional() })
  .refine(
    body => body.name !== undefined || body.timezone !== undefined || body.archived !== undefined,
    'Rien à modifier.',
  )

export type ApartmentNameInput = z.infer<typeof createApartmentSchema>
