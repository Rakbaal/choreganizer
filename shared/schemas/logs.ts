import { z } from 'zod'

// Five minutes of slack for a phone whose clock runs ahead; no lower bound (Log in the past).
export const doneAtSchema = z.iso
  .datetime({ offset: true })
  .refine(iso => new Date(iso).getTime() <= Date.now() + 5 * 60_000, 'La date ne peut pas être dans le futur.')

// '' once trimmed: stored as null.
export const noteSchema = z.string().trim().max(500, '500 caractères maximum')

// Strict: a doneBy or an apartmentId sent by the client is a 400 (Log only for yourself). doneAt is the tap time.
export const logSchema = z.strictObject({
  taskId: z.uuid(),
  roomIds: z.array(z.uuid()),
  doneAt: doneAtSchema,
  note: noteSchema.optional(),
})

export type LogInput = z.infer<typeof logSchema>
