import { eq } from 'drizzle-orm'
import { updateLogSchema } from '#shared/schemas/logs'
import { logs } from '../../database/schema'

export default defineEventHandler(async (event) => {
  // Any member edits any log (Anyone can edit any log), the access check before the body is read.
  const { log } = await requireLog(event)
  const body = await readValidatedBody(event, updateLogSchema.parse)
  await db
    .update(logs)
    .set({
      ...(body.doneAt !== undefined && { doneAt: new Date(body.doneAt) }),
      ...(body.note !== undefined && { note: body.note }),
    })
    .where(eq(logs.id, log.id))
  return (await logEntries(db, [log.id]))[0]!
})
