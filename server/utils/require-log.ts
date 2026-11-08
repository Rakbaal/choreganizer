import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { logs } from '../database/schema'

// For the routes keyed by a log id: the apartment comes from the row, never from the client.
export async function requireLog(event: H3Event): Promise<{ user: User, log: typeof logs.$inferSelect }> {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const notFound = createError({ statusCode: 404, message: 'Entrée introuvable.' })
  if (!z.uuid().safeParse(id).success) throw notFound
  const [log] = await db.select().from(logs).where(eq(logs.id, id!))
  if (!log) throw notFound
  await checkMembership(user.id, log.apartmentId)
  return { user, log }
}
