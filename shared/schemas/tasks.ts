import { z } from 'zod'
import { nameSchema } from './auth'

export const frequencySchema = z.strictObject({
  interval: z.int('Entre 1 et 365').min(1, 'Entre 1 et 365').max(365, 'Entre 1 et 365'),
  unit: z.enum(['day', 'week', 'month']),
})

// Strict: an apartmentId or a position sent by the client is a 400, never silently ignored. roomIds is kept when
// allRooms is set, so switching « Partout » off finds them ticked.
export const taskSchema = z.strictObject({
  name: nameSchema,
  description: z.string().trim().max(500, '500 caractères maximum'),
  frequency: frequencySchema.nullable(),
  allRooms: z.boolean(),
  roomIds: z.array(z.uuid()),
}).refine(t => t.allRooms || t.roomIds.length > 0, { message: 'Choisissez au moins une pièce.', path: ['roomIds'] })

// One change per request: the client never combines them, so {} or two keys are a 400. An edit is the whole form, a
// full replacement.
export const updateTaskSchema = z.union([
  taskSchema,
  z.strictObject({ position: z.int().min(0) }),
  z.strictObject({ archived: z.boolean() }),
])

export type TaskInput = z.infer<typeof taskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
