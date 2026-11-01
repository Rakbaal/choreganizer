import { z } from 'zod'
import { nameSchema } from './auth'

// Strict: an apartmentId sent by the client is a 400, never silently ignored.
export const createRoomSchema = z.strictObject({ name: nameSchema })

// One change per request: the client never combines them, so {} or two keys are a 400.
export const updateRoomSchema = z.union([
  z.strictObject({ name: nameSchema }),
  z.strictObject({ position: z.int().min(0) }),
  z.strictObject({ archived: z.boolean() }),
])

export type RoomNameInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
