import { eq } from 'drizzle-orm'
import { logs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  // Any member deletes any log (Anyone can edit any log). Its log_rooms go with it (on delete cascade).
  const { log } = await requireLog(event)
  await db.delete(logs).where(eq(logs.id, log.id))
  return sendNoContent(event)
})
