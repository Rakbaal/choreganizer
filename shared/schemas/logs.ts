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

// Only when and the note: never the author, task or rooms (Anyone can edit any log). A note emptied is stored as null.
export const updateLogSchema = z
  .strictObject({ doneAt: doneAtSchema.optional(), note: noteSchema.transform(note => note || null).optional() })
  .refine(body => body.doneAt !== undefined || body.note !== undefined, 'Rien à modifier.')

export type UpdateLogInput = z.input<typeof updateLogSchema>

// <doneAt ISO>_<id> of the previous page's last row. Opaque to the client; the ISO string has no `_`.
const cursorSchema = z.string().transform((cursor, ctx) => {
  const at = cursor.lastIndexOf('_')
  const doneAt = new Date(cursor.slice(0, at))
  const id = cursor.slice(at + 1)
  if (at < 0 || Number.isNaN(doneAt.getTime()) || !z.uuid().safeParse(id).success) {
    ctx.addIssue({ code: 'custom', message: 'Curseur invalide.' })
    return z.NEVER
  }
  return { doneAt, id }
})

// Not strict: a query string, not a write. The ids need no check: the feed only reads inside its apartment.
export const feedQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  userId: z.string().min(1).optional(),
  taskId: z.uuid().optional(),
  roomId: z.uuid().optional(),
})

export type FeedQuery = z.output<typeof feedQuerySchema>
